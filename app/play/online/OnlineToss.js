'use client';

// Bat/bowl toss over the network: the joiner calls (no particular reason
// beyond picking someone unambiguous), the host flips and broadcasts the
// result, the call-winner chooses bat or bowl, then the host generates and
// broadcasts the single shared matchSeed both clients will derive every
// per-ball seed from (see rng.js's seedForBall).

import { useEffect, useRef, useState } from 'react';
import { MESSAGE_TYPES } from '../game/net/messageTypes';

export default function OnlineToss({ roomChannel, clientId, isHost, oversPerSide, squadSize, onTossComplete }) {
  const [stage, setStage] = useState('flip'); // 'flip' | 'choose' | 'waiting'
  const [flipResult, setFlipResult] = useState(null);
  const [callWinnerClientId, setCallWinnerClientId] = useState(null);
  const resolvedRef = useRef(false);

  useEffect(() => {
    if (isHost) {
      const unsubscribe = roomChannel.on(MESSAGE_TYPES.TOSS_CALL, (envelope) => {
        const flip = Math.random() < 0.5 ? 'heads' : 'tails';
        const winner = envelope.payload.call === flip ? envelope.from : clientId;
        setFlipResult(flip);
        setCallWinnerClientId(winner);
        setStage(winner === clientId ? 'choose' : 'waiting');
        roomChannel.send(MESSAGE_TYPES.TOSS_FLIP_RESULT, { flipResult: flip, callWinnerClientId: winner });
        unsubscribe();
      });
      return unsubscribe;
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isHost) return undefined;
    const unsubscribe = roomChannel.on(MESSAGE_TYPES.TOSS_FLIP_RESULT, (envelope) => {
      setFlipResult(envelope.payload.flipResult);
      setCallWinnerClientId(envelope.payload.callWinnerClientId);
      setStage(envelope.payload.callWinnerClientId === clientId ? 'choose' : 'waiting');
      unsubscribe();
    });
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Whoever did NOT win the call waits for the TOSS_CHOICE message.
  useEffect(() => {
    if (stage !== 'waiting') return undefined;
    const unsubscribe = roomChannel.on(MESSAGE_TYPES.TOSS_CHOICE, (envelope) => {
      finishToss(callWinnerClientId, envelope.payload.choice);
      unsubscribe();
    });
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  function callToss(call) {
    roomChannel.send(MESSAGE_TYPES.TOSS_CALL, { call });
    setStage('waiting-for-flip');
  }

  function chooseBatOrBowl(choice) {
    roomChannel.send(MESSAGE_TYPES.TOSS_CHOICE, { choice });
    finishToss(clientId, choice);
  }

  function finishToss(winnerId, choice) {
    if (resolvedRef.current) return;
    resolvedRef.current = true;
    // winnerId is a real clientId; map host->A, joiner->B regardless of who won.
    const hostIsWinner = isHost ? winnerId === clientId : winnerId !== clientId;
    const winnerKey = hostIsWinner ? 'A' : 'B';
    const battingFirst = choice === 'bat' ? winnerKey : winnerKey === 'A' ? 'B' : 'A';

    if (isHost) {
      const matchSeed = Math.floor(Math.random() * 2 ** 31);
      roomChannel.send(MESSAGE_TYPES.MATCH_INIT, { matchSeed, oversPerSide, squadSize });
      onTossComplete({ battingFirst, matchSeed });
    } else {
      const unsubscribe = roomChannel.on(MESSAGE_TYPES.MATCH_INIT, (envelope) => {
        onTossComplete({ battingFirst, matchSeed: envelope.payload.matchSeed });
        unsubscribe();
      });
    }
  }

  if (!isHost && stage === 'flip') {
    return (
      <div className="card p-6 text-center">
        <h3 className="mb-4 text-xl font-bold text-amber-300">Toss</h3>
        <p className="mb-4 text-white/70">Call it:</p>
        <div className="flex justify-center gap-4">
          <button onClick={() => callToss('heads')} className="btn btn-gold">
            Heads
          </button>
          <button onClick={() => callToss('tails')} className="btn btn-gold">
            Tails
          </button>
        </div>
      </div>
    );
  }

  if (stage === 'choose') {
    return (
      <div className="card p-6 text-center">
        <h3 className="mb-2 text-xl font-bold text-amber-300">Toss</h3>
        <p className="mb-4 text-white/70">
          It&apos;s {flipResult}! You won the toss. Bat or bowl?
        </p>
        <div className="flex justify-center gap-4">
          <button onClick={() => chooseBatOrBowl('bat')} className="btn btn-gold">
            Bat
          </button>
          <button onClick={() => chooseBatOrBowl('bowl')} className="btn btn-gold">
            Bowl
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6 text-center">
      <p className="text-white/70">{flipResult ? `It's ${flipResult}! Waiting for the opponent's choice...` : 'Flipping...'}</p>
    </div>
  );
}
