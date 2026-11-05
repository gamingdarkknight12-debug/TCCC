// Abstracts "where does the OTHER side's per-ball decision come from" so
// InningsScene never needs to know whether it's playing single-player (the
// opponent is AI) or multiplayer (the opponent is a real person over a
// Supabase Realtime RoomChannel) - it always calls the same generic pair:
//   bridge.broadcastValue(key, value)          - fire and forget
//   bridge.awaitValue(key, aiFallbackFn) -> Promise<value>
// `key` namespaces every per-ball exchange (ball commit, catch QTE result,
// run-decision result) so a stray/duplicate message can never resolve the
// wrong thing. aiFallbackFn is only ever invoked by LocalAiBridge - a real
// RemoteBridge always waits for the opponent's actual value, since silently
// guessing a value instead of what a real opponent will do would let the two
// clients' MatchState instances diverge.

import { MESSAGE_TYPES } from './messageTypes.js';

const AI_THINK_DELAY_MS = [150, 300];

function randomDelay() {
  const [min, max] = AI_THINK_DELAY_MS;
  return min + Math.random() * (max - min);
}

export class LocalAiBridge {
  // eslint-disable-next-line class-methods-use-this
  broadcastValue() {
    // No opponent to tell - single-player AI needs nothing from us.
  }

  async awaitValue(key, aiFallbackFn) {
    await new Promise((resolve) => setTimeout(resolve, randomDelay()));
    return aiFallbackFn();
  }

  destroy() {}
}

export class RemoteBridge {
  constructor(roomChannel) {
    this.roomChannel = roomChannel;
    this.pending = new Map(); // key -> resolve fn
    this.buffered = new Map(); // key -> value (arrived before anyone asked)

    this.unsubscribe = roomChannel.on(MESSAGE_TYPES.GAME_VALUE, (envelope) => {
      const { key, value } = envelope.payload;
      const resolver = this.pending.get(key);
      if (resolver) {
        resolver(value);
        this.pending.delete(key);
      } else {
        this.buffered.set(key, value);
      }
    });
  }

  broadcastValue(key, value) {
    this.roomChannel.send(MESSAGE_TYPES.GAME_VALUE, { key, value });
  }

  // aiFallbackFn is accepted but ignored - kept so call sites are identical
  // across both bridge implementations.
  // eslint-disable-next-line no-unused-vars
  awaitValue(key, aiFallbackFn) {
    if (this.buffered.has(key)) {
      const value = this.buffered.get(key);
      this.buffered.delete(key);
      return Promise.resolve(value);
    }
    return new Promise((resolve) => this.pending.set(key, resolve));
  }

  destroy() {
    this.unsubscribe();
  }
}
