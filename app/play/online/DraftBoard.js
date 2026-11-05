'use client';

// Online draft: a trivial pre-draft coin flip (host flips, no call needed)
// decides who picks first, then strict alternation (winner, loser, winner,
// loser, ...) until both squads reach squadSize. Both clients run the same
// `draftState.js` reducer on every pick (their own, applied optimistically,
// and the opponent's, applied on receipt) - no server authority needed.

import { useEffect, useRef, useState } from 'react';
import { MESSAGE_TYPES } from '../game/net/messageTypes';
import { createDraftState, applyDraftPick, nextPicker, isDraftComplete } from '../game/engine/draftState';

export default function DraftBoard({ roomChannel, clientId, isHost, squadSize, onDraftComplete }) {
  const [players, setPlayers] = useState(null);
  const [error, setError] = useState(null);
  const [firstPickerId, setFirstPickerId] = useState(null);
  const [otherClientId] = useState(() => roomChannel.presenceClientIds().find((id) => id !== clientId));
  const [draft, setDraft] = useState(null);
  const draftRef = useRef(null); // avoids stale closures in the message handler

  useEffect(() => {
    fetch('/api/game/roster')
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setPlayers(data.players);
      })
      .catch((e) => setError(e.message));
  }, []);

  // Pre-draft toss: trivial, host decides and broadcasts.
  useEffect(() => {
    if (isHost) {
      const winner = Math.random() < 0.5 ? clientId : otherClientId;
      setFirstPickerId(winner);
      roomChannel.send(MESSAGE_TYPES.DRAFT_TOSS_RESULT, { firstPickerClientId: winner });
    } else {
      const unsubscribe = roomChannel.on(MESSAGE_TYPES.DRAFT_TOSS_RESULT, (envelope) => {
        setFirstPickerId(envelope.payload.firstPickerClientId);
        unsubscribe();
      });
      return unsubscribe;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Build the draft state once we know both the roster and who picks first.
  useEffect(() => {
    if (!players || !firstPickerId || draft) return;
    const initial = createDraftState({
      firstPickerId,
      otherId: firstPickerId === clientId ? otherClientId : clientId,
      squadSize,
      poolPlayerIds: players.map((p) => p.id),
    });
    draftRef.current = initial;
    setDraft(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [players, firstPickerId]);

  // Apply the opponent's picks as they arrive.
  useEffect(() => {
    if (!draft) return undefined;
    const unsubscribe = roomChannel.on(MESSAGE_TYPES.DRAFT_PICK, (envelope) => {
      const pick = envelope.payload;
      if (pick.pickerClientId === clientId) return; // my own pick, already applied optimistically
      const next = applyDraftPick(draftRef.current, pick);
      draftRef.current = next;
      setDraft(next);
    });
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft == null]);

  useEffect(() => {
    if (draft && isDraftComplete(draft)) {
      const hostId = isHost ? clientId : otherClientId;
      const joinerId = isHost ? otherClientId : clientId;
      const teamAIds = draft.teams[hostId];
      const teamBIds = draft.teams[joinerId];
      const byId = new Map(players.map((p) => [p.id, p]));
      onDraftComplete({
        teamAPlayers: teamAIds.map((id) => byId.get(id)),
        teamBPlayers: teamBIds.map((id) => byId.get(id)),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);

  function pickPlayer(playerId) {
    if (!draft) return;
    const myTurn = nextPicker(draft.picks.length, draft.firstPickerId, draft.otherId) === clientId;
    if (!myTurn) return;
    const pick = { pickIndex: draft.picks.length, pickerClientId: clientId, playerId };
    const next = applyDraftPick(draftRef.current, pick);
    draftRef.current = next;
    setDraft(next);
    roomChannel.send(MESSAGE_TYPES.DRAFT_PICK, pick);
  }

  if (error) return <div className="card p-6 text-red-400">Couldn't load the roster: {error}</div>;
  if (!players || !draft) return <div className="card p-6 text-white/70">Setting up the draft...</div>;

  const myTurn = nextPicker(draft.picks.length, draft.firstPickerId, draft.otherId) === clientId;
  const byId = new Map(players.map((p) => [p.id, p]));
  const myPicks = draft.teams[clientId] || [];
  const theirPicks = draft.teams[otherClientId] || [];

  return (
    <div className="card p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-xl font-bold text-amber-300">Draft</h3>
        <span className={`btn ${myTurn ? 'btn-gold' : 'btn-ghost'}`}>
          {myTurn ? 'Your pick' : "Opponent's pick"}
        </span>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="mb-1 font-semibold text-white">Your team ({myPicks.length}/{squadSize})</div>
          <div className="text-white/70">{myPicks.map((id) => byId.get(id)?.name).join(', ') || '—'}</div>
        </div>
        <div>
          <div className="mb-1 font-semibold text-white">Opponent ({theirPicks.length}/{squadSize})</div>
          <div className="text-white/70">{theirPicks.map((id) => byId.get(id)?.name).join(', ') || '—'}</div>
        </div>
      </div>

      <div className="grid max-h-[360px] grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
        {draft.availablePlayerIds.map((id) => {
          const p = byId.get(id);
          return (
            <button
              key={id}
              onClick={() => pickPlayer(id)}
              disabled={!myTurn}
              className={`rounded-xl border px-4 py-3 text-left transition ${
                myTurn ? 'border-white/10 bg-white/5 hover:bg-amber-300/10' : 'cursor-not-allowed border-white/5 bg-white/[0.02] opacity-60'
              }`}
            >
              <div className="font-semibold text-white">{p.name}</div>
              <div className="text-xs text-white/60">
                {p.skill || 'Player'} · {p.attributes.archetype}
                {p.batting.avg != null ? ` · Bat avg ${p.batting.avg}` : ''}
                {p.bowling.wickets ? ` · ${p.bowling.wickets} wkts` : ''}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
