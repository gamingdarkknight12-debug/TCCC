// Thin wrapper around one Supabase Realtime Broadcast+Presence channel for a
// single 1-on-1 match. A shared room code is the whole trust boundary for
// this casual game - no DB table, no RLS policy needed for v1.

import { supabaseClient } from '../../../lib/supabaseClient';

export function roomTopic(roomCode) {
  return `game-room-${roomCode}`;
}

export class RoomChannel {
  constructor(roomCode, clientId) {
    this.roomCode = roomCode;
    this.clientId = clientId;
    this.handlers = new Map(); // type -> Set<fn>
    this.joinHandlers = new Set();
    this.leaveHandlers = new Set();

    this.channel = supabaseClient.channel(roomTopic(roomCode), {
      config: { broadcast: { self: false }, presence: { key: clientId } },
    });

    this.channel.on('broadcast', { event: 'msg' }, ({ payload: envelope }) => {
      const handlers = this.handlers.get(envelope.type);
      if (handlers) handlers.forEach((fn) => fn(envelope));
    });

    this.channel.on('presence', { event: 'join' }, ({ key, newPresences }) => {
      this.joinHandlers.forEach((fn) => fn(key, newPresences));
    });
    this.channel.on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
      this.leaveHandlers.forEach((fn) => fn(key, leftPresences));
    });
  }

  subscribe() {
    return new Promise((resolve, reject) => {
      this.channel.subscribe(async (status, err) => {
        if (status === 'SUBSCRIBED') {
          await this.channel.track({ clientId: this.clientId, joinedAt: Date.now() });
          resolve();
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          reject(err || new Error(`Realtime channel ${status}`));
        }
      });
    });
  }

  send(type, payload) {
    this.channel.send({ type: 'broadcast', event: 'msg', payload: { type, from: this.clientId, ts: Date.now(), payload } });
  }

  on(type, handler) {
    if (!this.handlers.has(type)) this.handlers.set(type, new Set());
    this.handlers.get(type).add(handler);
    return () => this.handlers.get(type)?.delete(handler);
  }

  onPresenceJoin(handler) {
    this.joinHandlers.add(handler);
    return () => this.joinHandlers.delete(handler);
  }

  onPresenceLeave(handler) {
    this.leaveHandlers.add(handler);
    return () => this.leaveHandlers.delete(handler);
  }

  presenceCount() {
    return Object.keys(this.channel.presenceState()).length;
  }

  presenceClientIds() {
    return Object.keys(this.channel.presenceState());
  }

  destroy() {
    supabaseClient.removeChannel(this.channel);
  }
}
