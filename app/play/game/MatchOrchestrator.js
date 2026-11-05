// Plain JS orchestrator - NOT a Phaser Scene, replaces InningsScene.js's
// role. Drives the same async ball-by-ball loop against MatchState/bridge,
// but instead of drawing Phaser text/buttons it (a) calls imperative methods
// on a Scene3D instance for the 3D visuals, and (b) requests UI prompts via
// a `setUiRequest` callback that a React component renders, resolving the
// same way the old Phaser Promise-returning helpers did. Single-player vs
// online-multiplayer is still entirely the bridge's concern (LocalAiBridge
// vs RemoteBridge) - this class never branches on it.

import { getBowlerDifficulty, getBatterDifficulty } from './engine/difficulty';
import { getEffectiveBowlingParams, getEffectiveBattingParams } from './engine/attributeModifiers';
import { aiChooseNextBowler, aiChooseBowlingCommit, aiChooseBattingCommit } from './engine/ai';
import { createRng, seedForBall } from './engine/rng';
import { resolveBall } from './engine/resolveBall';
import { ballsToOvers } from '../../lib/oversMath';

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class MatchOrchestrator {
  constructor({ matchState, userTeamKey, bridge, scene3d, setUiRequest, onHudUpdate, onBallResult }) {
    this.matchState = matchState;
    this.userTeamKey = userTeamKey;
    this.bridge = bridge;
    this.scene3d = scene3d;
    this.setUiRequest = setUiRequest;
    this.onHudUpdate = onHudUpdate;
    this.onBallResult = onBallResult;
    this.cumulativeBallIndex = 0;
  }

  async run() {
    this._emitHud();
    await this._playInnings();

    if (this.matchState.isMatchComplete()) {
      return this.matchState.getResult();
    }

    this.matchState.switchInnings();
    await this._requestInningsBreak();
    this._emitHud();
    await this._playInnings();
    return this.matchState.getResult();
  }

  _freshSeed(salt) {
    return seedForBall(this.matchState.matchSeed, this.cumulativeBallIndex * 97 + salt);
  }

  async _playInnings() {
    while (!this.matchState.isInningsComplete()) {
      await this._selectBowlerForOver();
      while (this.matchState.currentInnings.currentBowlerId != null && !this.matchState.isInningsComplete()) {
        await this._playOneBall();
      }
    }
  }

  async _selectBowlerForOver() {
    const st = this.matchState.currentInnings;
    const bowlingTeamKey = st.bowlingTeam;
    const players = this.matchState.teams[bowlingTeamKey].players;

    let bowlerId;
    if (bowlingTeamKey === this.userTeamKey) {
      const eligible = players.filter((p) => this.matchState.canBowlerBowl(p.id));
      bowlerId = await this._request('bowler-choice', { players: eligible });
    } else {
      const rng = createRng(this._freshSeed(1));
      bowlerId = aiChooseNextBowler({
        bowlingTeamPlayers: players,
        canBowlerBowl: (id) => this.matchState.canBowlerBowl(id),
        rng,
      });
    }
    this.matchState.startOver(bowlerId);
    this._emitHud();
  }

  async _playOneBall() {
    const st = this.matchState.currentInnings;
    const battingTeamKey = st.battingTeam;
    const bowlingTeamKey = st.bowlingTeam;
    const striker = this.matchState.getStriker();
    const bowler = this.matchState.getCurrentBowler();

    const bowlerBase = getBowlerDifficulty(bowler.bowling || {});
    const bowlingParams = getEffectiveBowlingParams({
      threat: bowlerBase.threat,
      archetype: bowler.attributes?.archetype,
      staminaRemaining: this.matchState.getBowlerStamina(bowler.id),
    });

    const batterBase = getBatterDifficulty(striker.batting || {});
    const battingParams = getEffectiveBattingParams({
      solidity: batterBase.solidity,
      sr: striker.batting?.sr,
      archetype: striker.attributes?.archetype,
      isDeathOvers: this.matchState.isDeathOvers(),
    });

    const isUserBatting = battingTeamKey === this.userTeamKey;
    this._emitHud(striker, bowler);

    this.scene3d.resetBall();
    this.scene3d.animateBallApproach(bowlingParams.reactionWindowMs);

    let bowlerCommit;
    let batterCommit;
    const aiRng = createRng(this._freshSeed(2));
    const ballIndex = this.cumulativeBallIndex;

    // Blind simultaneous commit: each side locks in and broadcasts its own
    // choice the instant it's decided, and separately awaits the other
    // side's choice - in single-player `awaitValue`'s fallback generates an
    // AI commit instead of waiting on a message. Neither side ever sees the
    // other's choice before committing (fairness over real network latency).
    if (isUserBatting) {
      const myCommitPromise = this._request('batting-input', { durationMs: bowlingParams.reactionWindowMs }).then(
        (commit) => {
          this.bridge.broadcastValue(`commit:${ballIndex}`, commit);
          return commit;
        }
      );
      [batterCommit, bowlerCommit] = await Promise.all([
        myCommitPromise,
        this.bridge.awaitValue(`commit:${ballIndex}`, () => aiChooseBowlingCommit({ bowlingParams, rng: aiRng })),
      ]);
    } else {
      const myCommitPromise = this._request('bowling-input', { durationMs: bowlingParams.reactionWindowMs }).then(
        (commit) => {
          this.bridge.broadcastValue(`commit:${ballIndex}`, commit);
          return commit;
        }
      );
      [bowlerCommit, batterCommit] = await Promise.all([
        myCommitPromise,
        this.bridge.awaitValue(`commit:${ballIndex}`, () => aiChooseBattingCommit({ battingParams, rng: aiRng })),
      ]);
    }

    this.scene3d.swingBat(batterCommit.shotType);

    const resolveSeed = this._freshSeed(3);
    let outcome = resolveBall({ bowlerCommit, batterCommit, bowlingParams, battingParams, seed: resolveSeed });
    let fieldingNote = null;

    // Visual-only "which fielder is involved" - resolveBall has no shot
    // direction data, so this is a deterministic (seeded, same on both
    // multiplayer clients) pick from the position table, not a simulation.
    const fielderIndex = Math.floor(createRng(this._freshSeed(5))() * 8);

    // Fielding is played by whoever is BOWLING. Only the fielding side's
    // client runs the interactive QTE; the other side (AI, or the real
    // remote batting player) gets that exact result via the bridge rather
    // than independently rolling its own - otherwise the two clients'
    // MatchState instances could diverge on a caught-or-dropped call.
    if (outcome.isWicket && outcome.dismissalType === 'caught') {
      this.scene3d.highlightFielder(fielderIndex);
      const fielderIsUser = bowlingTeamKey === this.userTeamKey;
      let caught;
      if (fielderIsUser) {
        caught = await this._request('catch-qte', {});
        this.bridge.broadcastValue(`fielding:${ballIndex}`, { caught });
      } else {
        const result = await this.bridge.awaitValue(`fielding:${ballIndex}`, () => ({ caught: Math.random() < 0.75 }));
        caught = result.caught;
      }
      if (!caught) {
        outcome = { ...outcome, isWicket: false, dismissalType: null, runsScored: 4 };
        fieldingNote = 'DROPPED! ';
      } else {
        fieldingNote = 'CAUGHT! ';
      }
    }

    // Running is the BATTING side's call - same cross-client sync reasoning
    // as the fielding result above.
    if (!outcome.isWicket && (outcome.runsScored === 2 || outcome.runsScored === 3)) {
      this.scene3d.highlightFielder(fielderIndex);
      const batterIsUser = battingTeamKey === this.userTeamKey;
      let decision;
      if (batterIsUser) {
        decision = await this._request('run-decision', { runsOffered: outcome.runsScored });
        this.bridge.broadcastValue(`run:${ballIndex}`, decision);
      } else {
        decision = await this.bridge.awaitValue(`run:${ballIndex}`, () => ({
          ran: true,
          runOut: Math.random() < 0.14,
        }));
      }
      if (!decision.ran) {
        outcome = { ...outcome, runsScored: 1 };
      } else if (decision.runOut) {
        outcome = {
          ...outcome,
          runsScored: Math.max(0, outcome.runsScored - 1),
          isWicket: true,
          dismissalType: 'run out',
        };
        fieldingNote = 'RUN OUT! ';
      }
    }

    this.cumulativeBallIndex += 1;

    const legalBall = !outcome.isWide && !outcome.isNoBall;
    this.matchState.recordBall(outcome);
    if (legalBall) {
      this.matchState.decayBowlerStamina(bowler.id, bowler.attributes?.archetype);
    }

    this._emitBallResult(outcome, fieldingNote);
    await this.scene3d.showOutcome(outcome);
    await wait(300);
    this._emitHud();
  }

  _request(type, payload) {
    return new Promise((resolve) => {
      this.setUiRequest({
        type,
        ...payload,
        onResolve: (value) => {
          this.setUiRequest(null);
          resolve(value);
        },
      });
    });
  }

  _requestInningsBreak() {
    const summary = this.matchState.firstInningsSummary;
    const battingTeam = this.matchState.teams[summary.battingTeam];
    return this._request('innings-break', {
      summaryText: `${battingTeam.name} scored ${summary.runs}/${summary.wickets} off ${ballsToOvers(summary.ballsBowled)} overs`,
      target: summary.runs + 1,
    });
  }

  _emitHud(striker, bowler) {
    const st = this.matchState.currentInnings;
    const battingTeam = this.matchState.teams[st.battingTeam];
    const bowlingTeam = this.matchState.teams[st.bowlingTeam];
    const strikerNow = striker || this.matchState.getStriker();
    const bowlerNow = bowler || this.matchState.getCurrentBowler();

    let targetText = '';
    if (this.matchState.innings === 2 && this.matchState.target != null) {
      const ballsLeft = this.matchState.maxBallsPerInnings - st.ballsBowled;
      const runsNeeded = this.matchState.target - st.runs;
      targetText = `Need ${Math.max(0, runsNeeded)} off ${Math.max(0, ballsLeft)} balls`;
    }

    this.onHudUpdate({
      teamsText: `${battingTeam.name} batting · ${bowlingTeam.name} bowling`,
      scoreText: `${st.runs}/${st.wickets}`,
      oversText: `Overs: ${ballsToOvers(st.ballsBowled)} / ${this.matchState.oversPerSide}`,
      targetText,
      matchupText: `${strikerNow ? strikerNow.name : '—'} on strike · ${bowlerNow ? bowlerNow.name : 'choosing bowler...'} bowling`,
    });
  }

  _emitBallResult(outcome, fieldingNote) {
    let text;
    if (outcome.isWide) text = 'Wide';
    else if (outcome.isNoBall) text = 'No ball';
    else if (outcome.isWicket) text = `OUT! (${outcome.dismissalType})`;
    else if (outcome.runsScored === 6) text = 'SIX!';
    else if (outcome.runsScored === 4) text = 'FOUR!';
    else if (outcome.runsScored === 0) text = 'Dot ball';
    else text = `${outcome.runsScored} run${outcome.runsScored === 1 ? '' : 's'}`;

    this.onBallResult({
      text: fieldingNote ? `${fieldingNote}${text}` : text,
      isWicket: outcome.isWicket,
    });
  }
}
