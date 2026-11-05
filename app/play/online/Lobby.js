'use client';

// Simplest viable v1 room flow: no accounts, just a shared room code as the
// trust boundary for a casual 2-friend match. Whoever clicks "Create Room"
// is unambiguously the host (and picks squad size); whoever enters that code
// is the joiner. No "first subscriber wins" race to reason about.

import { useEffect, useRef, useState } from 'react';
import { RoomChannel } from '../game/net/RoomChannel';
import { MESSAGE_TYPES } from '../game/net/messageTypes';
import { isRealtimeConfigured } from '../../lib/supabaseClient';

const OVERS_PER_SIDE = 5;

function randomCode(length = 5) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I
  let code = '';
  for (let i = 0; i < length; i++) code += alphabet[Math.floor(Math.random() * alphabet.length)];
  return code;
}

function randomClientId() {
  return `p_${Math.random().toString(36).slice(2, 10)}`;
}

export default function Lobby({ onReady }) {
  const [step, setStep] = useState('choose'); // 'choose' | 'creating' | 'joining' | 'waiting'
  const [squadSize, setSquadSize] = useState(6);
  const [roomCode, setRoomCode] = useState('');
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [error, setError] = useState(null);
  const clientIdRef = useRef(randomClientId());
  const channelRef = useRef(null);

  useEffect(() => {
    return () => {
      channelRef.current?.destroy();
    };
  }, []);

  async function createRoom() {
    setError(null);
    const code = randomCode();
    setRoomCode(code);
    setStep('waiting');
    const clientId = clientIdRef.current;
    const channel = new RoomChannel(code, clientId);
    channelRef.current = channel;

    try {
      await channel.subscribe();
    } catch (e) {
      setError('Could not connect: ' + e.message);
      return;
    }

    const unsubscribe = channel.onPresenceJoin(() => {
      if (channel.presenceCount() >= 2) {
        unsubscribe();
        channel.send(MESSAGE_TYPES.LOBBY_CONFIG, { squadSize, oversPerSide: OVERS_PER_SIDE });
        onReady({
          roomChannel: channel,
          clientId,
          isHost: true,
          squadSize,
          oversPerSide: OVERS_PER_SIDE,
        });
      }
    });
  }

  async function joinRoom() {
    setError(null);
    const code = joinCodeInput.trim().toUpperCase();
    if (!code) return;
    setStep('joining');
    const clientId = clientIdRef.current;
    const channel = new RoomChannel(code, clientId);
    channelRef.current = channel;

    try {
      await channel.subscribe();
    } catch (e) {
      setError('Could not connect: ' + e.message);
      setStep('choose');
      return;
    }

    const unsubscribe = channel.on(MESSAGE_TYPES.LOBBY_CONFIG, (envelope) => {
      unsubscribe();
      onReady({
        roomChannel: channel,
        clientId,
        isHost: false,
        squadSize: envelope.payload.squadSize,
        oversPerSide: envelope.payload.oversPerSide,
      });
    });
  }

  if (!isRealtimeConfigured) {
    return (
      <div className="card p-6">
        <h3 className="text-xl font-bold text-amber-300">Play Online</h3>
        <p className="mt-3 text-white/70">
          Online multiplayer needs <code className="text-amber-300">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>{' '}
          set (Supabase dashboard → Project Settings → API → &quot;anon&quot; &quot;public&quot; key),
          then a dev-server restart. Not configured yet - single player still works.
        </p>
      </div>
    );
  }

  if (step === 'choose') {
    return (
      <div className="card p-6">
        <h3 className="text-xl font-bold text-amber-300">Play Online</h3>

        <div className="mt-5 grid gap-6 sm:grid-cols-2">
          <div>
            <div className="mb-3 font-semibold text-white">Create a room</div>
            <div className="mb-3 flex items-center gap-2">
              <span className="text-sm text-white/60">Squad size:</span>
              {[6, 8].map((size) => (
                <button
                  key={size}
                  onClick={() => setSquadSize(size)}
                  className={`btn ${squadSize === size ? 'btn-gold' : 'btn-ghost'}`}
                >
                  {size}
                </button>
              ))}
            </div>
            <button onClick={createRoom} className="btn btn-gold">
              Create Room
            </button>
          </div>

          <div>
            <div className="mb-3 font-semibold text-white">Join a room</div>
            <div className="mb-3 flex gap-2">
              <input
                value={joinCodeInput}
                onChange={(e) => setJoinCodeInput(e.target.value)}
                placeholder="Room code"
                className="w-32 rounded-xl border border-white/10 bg-white/5 px-3 py-2 uppercase text-white outline-none focus:border-amber-300"
                maxLength={5}
              />
              <button onClick={joinRoom} className="btn btn-gold" disabled={!joinCodeInput.trim()}>
                Join
              </button>
            </div>
          </div>
        </div>

        {error && <p className="mt-4 text-red-400">{error}</p>}
      </div>
    );
  }

  if (step === 'waiting') {
    return (
      <div className="card p-6 text-center">
        <div className="text-sm uppercase tracking-widest text-white/60">Room code</div>
        <div className="mt-2 text-4xl font-black tracking-[0.3em] text-amber-300">{roomCode}</div>
        <p className="mt-4 text-white/70">Share this code with your friend. Waiting for them to join...</p>
        {error && <p className="mt-4 text-red-400">{error}</p>}
      </div>
    );
  }

  // step === 'joining'
  return (
    <div className="card p-6 text-center">
      <p className="text-white/70">Connecting...</p>
      {error && <p className="mt-4 text-red-400">{error}</p>}
    </div>
  );
}
