// Framework-agnostic match state machine - no Phaser, no React, no DOM.
// Overs are always tracked as a plain integer ball count internally; convert
// to cricket's "4.1" notation only for display, via app/lib/oversMath.js
// (never sum raw overs values directly - see that file's own comments on why
// that's a bug class).

import { oversToBalls, ballsToOvers } from '../../../lib/oversMath.js';

const STAMINA_DECAY_PER_OVER = 15;
const WORKHORSE_STAMINA_DECAY_PER_OVER = 7.5;
const DEATH_OVERS_FRACTION = 0.2;

export class MatchState {
  /**
   * @param {object} opts
   * @param {number} opts.oversPerSide e.g. 5
   * @param {number} opts.squadSize 6 or 8
   * @param {{id:string, players: Array}} opts.teamA players: [{id, name, attributes:{archetype,stamina,...}}]
   * @param {{id:string, players: Array}} opts.teamB
   * @param {'A'|'B'} opts.battingFirst
   * @param {number} opts.matchSeed
   */
  constructor({ oversPerSide, squadSize, teamA, teamB, battingFirst, matchSeed }) {
    this.oversPerSide = oversPerSide;
    this.squadSize = squadSize;
    this.maxWickets = squadSize - 1;
    // Real cricket's "1/5 of overs" bowler cap is unplayable with only 6-8
    // players over a 5-over match (≈1 over per bowler) - generalize it.
    this.maxOversPerBowler = Math.ceil(oversPerSide / 5) + 1;
    this.maxBallsPerBowler = oversToBalls(this.maxOversPerBowler);
    this.maxBallsPerInnings = oversToBalls(oversPerSide);

    this.teams = { A: teamA, B: teamB };
    this.matchSeed = matchSeed;
    this.innings = 1;
    this.target = null;
    this.firstInningsSummary = null;

    this.inningsState = this._createInningsState(battingFirst);
  }

  _teamPlayers(teamKey) {
    return this.teams[teamKey].players;
  }

  _createInningsState(battingTeam) {
    const bowlingTeam = battingTeam === 'A' ? 'B' : 'A';
    return {
      battingTeam,
      bowlingTeam,
      runs: 0,
      wickets: 0,
      ballsBowled: 0,
      strikerIndex: 0,
      nonStrikerIndex: 1,
      nextBatterIndex: 2,
      currentBowlerId: null,
      previousOverBowlerId: null,
      ballsThisOver: 0,
      ballsBowledByPlayer: new Map(),
      staminaRemaining: new Map(),
      fallOfWickets: [],
      ballLog: [],
      complete: false,
    };
  }

  get currentInnings() {
    return this.inningsState;
  }

  getStriker() {
    const st = this.inningsState;
    return this._teamPlayers(st.battingTeam)[st.strikerIndex];
  }

  getNonStriker() {
    const st = this.inningsState;
    return this._teamPlayers(st.battingTeam)[st.nonStrikerIndex];
  }

  getCurrentBowler() {
    const st = this.inningsState;
    if (st.currentBowlerId == null) return null;
    return this._teamPlayers(st.bowlingTeam).find((p) => p.id === st.currentBowlerId) || null;
  }

  isDeathOvers() {
    const st = this.inningsState;
    const remaining = this.maxBallsPerInnings - st.ballsBowled;
    return remaining <= Math.max(1, Math.round(this.maxBallsPerInnings * DEATH_OVERS_FRACTION));
  }

  getOversBowledDisplay() {
    return ballsToOvers(this.inningsState.ballsBowled);
  }

  // A bowler can't bowl if they're already at the per-bowler overs cap, or if
  // they bowled the immediately preceding over (standard limited-overs rule).
  canBowlerBowl(playerId) {
    const st = this.inningsState;
    if (playerId === st.previousOverBowlerId) return false;
    const balls = st.ballsBowledByPlayer.get(playerId) || 0;
    return balls < this.maxBallsPerBowler;
  }

  // Must be called at the start of every over (including the first ball of
  // the innings) before recordBall() will accept deliveries.
  startOver(bowlerId) {
    const st = this.inningsState;
    if (st.currentBowlerId != null) {
      throw new Error('startOver called mid-over');
    }
    if (!this.canBowlerBowl(bowlerId)) {
      throw new Error(`Bowler ${bowlerId} cannot bowl this over`);
    }
    st.currentBowlerId = bowlerId;
    st.ballsThisOver = 0;
    if (!st.staminaRemaining.has(bowlerId)) {
      const bowler = this._teamPlayers(st.bowlingTeam).find((p) => p.id === bowlerId);
      st.staminaRemaining.set(bowlerId, bowler?.attributes?.stamina ?? 70);
    }
  }

  getBowlerStamina(playerId) {
    return this.inningsState.staminaRemaining.get(playerId) ?? 100;
  }

  /**
   * @param {object} outcome
   * @param {number} outcome.runsScored runs credited off the bat (0,1,2,3,4,6)
   * @param {boolean} [outcome.isWicket]
   * @param {string} [outcome.dismissalType]
   * @param {boolean} [outcome.isWide] illegal delivery, no ball faced, +1 run, replayed
   * @param {boolean} [outcome.isNoBall] illegal delivery, +1 run, replayed
   */
  recordBall(outcome) {
    const st = this.inningsState;
    if (st.complete) throw new Error('Innings already complete');
    if (st.currentBowlerId == null) throw new Error('startOver() must be called before recordBall()');

    const { runsScored = 0, isWicket = false, dismissalType = null, isWide = false, isNoBall = false } = outcome;
    const legalBall = !isWide && !isNoBall;

    st.runs += runsScored + (isWide || isNoBall ? 1 : 0);
    st.ballLog.push({ ...outcome, ballsBowled: st.ballsBowled });

    if (isWicket) {
      st.wickets += 1;
      st.fallOfWickets.push({ ballsBowled: st.ballsBowled, runs: st.runs, dismissalType });
      if (st.nextBatterIndex < this.squadSize) {
        st.strikerIndex = st.nextBatterIndex;
        st.nextBatterIndex += 1;
      }
    } else if (runsScored % 2 === 1) {
      this._swapStrike();
    }

    if (legalBall) {
      st.ballsBowled += 1;
      st.ballsThisOver += 1;
      st.ballsBowledByPlayer.set(st.currentBowlerId, (st.ballsBowledByPlayer.get(st.currentBowlerId) || 0) + 1);

      if (st.ballsThisOver === 6) {
        this._swapStrike();
        st.previousOverBowlerId = st.currentBowlerId;
        st.currentBowlerId = null;
        st.ballsThisOver = 0;
      }
    }

    if (this._checkInningsComplete()) {
      st.complete = true;
    }
  }

  decayBowlerStamina(playerId, archetype) {
    const st = this.inningsState;
    const decay = archetype === 'Workhorse' ? WORKHORSE_STAMINA_DECAY_PER_OVER : STAMINA_DECAY_PER_OVER;
    const current = st.staminaRemaining.get(playerId) ?? 100;
    st.staminaRemaining.set(playerId, Math.max(0, current - decay));
  }

  _swapStrike() {
    const st = this.inningsState;
    const tmp = st.strikerIndex;
    st.strikerIndex = st.nonStrikerIndex;
    st.nonStrikerIndex = tmp;
  }

  _checkInningsComplete() {
    const st = this.inningsState;
    if (st.ballsBowled >= this.maxBallsPerInnings) return true;
    if (st.wickets >= this.maxWickets) return true;
    if (this.innings === 2 && this.target != null && st.runs >= this.target) return true;
    return false;
  }

  isInningsComplete() {
    return this.inningsState.complete;
  }

  switchInnings() {
    const st = this.inningsState;
    if (!st.complete) throw new Error('Cannot switch innings before the first is complete');
    this.firstInningsSummary = {
      battingTeam: st.battingTeam,
      runs: st.runs,
      wickets: st.wickets,
      ballsBowled: st.ballsBowled,
    };
    this.target = st.runs + 1;
    this.innings = 2;
    this.inningsState = this._createInningsState(st.bowlingTeam);
  }

  isMatchComplete() {
    if (this.innings === 1) return false;
    return this.isInningsComplete();
  }

  getResult() {
    if (!this.isMatchComplete()) return null;
    const second = this.inningsState;
    const first = this.firstInningsSummary;
    if (second.runs >= this.target) {
      const wicketsInHand = this.maxWickets - second.wickets;
      return {
        winner: second.battingTeam,
        method: 'runs-chased',
        margin: `${wicketsInHand} wicket${wicketsInHand === 1 ? '' : 's'}`,
        scoreFirstInnings: first,
        scoreSecondInnings: { runs: second.runs, wickets: second.wickets, ballsBowled: second.ballsBowled },
      };
    }
    if (second.runs === this.target - 1) {
      return { winner: null, method: 'tie', scoreFirstInnings: first, scoreSecondInnings: second };
    }
    const margin = this.target - 1 - second.runs;
    return {
      winner: first.battingTeam,
      method: 'defended',
      margin: `${margin} run${margin === 1 ? '' : 's'}`,
      scoreFirstInnings: first,
      scoreSecondInnings: { runs: second.runs, wickets: second.wickets, ballsBowled: second.ballsBowled },
    };
  }
}
