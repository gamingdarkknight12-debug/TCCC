// Single source of truth for every message exchanged over a RoomChannel.
// All messages are sent as channel.send({type:'broadcast', event:'msg',
// payload: envelope}), envelope = {type, from, ts, payload}.

export const MESSAGE_TYPES = {
  LOBBY_CONFIG: 'lobby_config', // { squadSize, oversPerSide } - host -> joiner, once
  DRAFT_TOSS_RESULT: 'draft_toss_result', // { firstPickerClientId }
  DRAFT_PICK: 'draft_pick', // { pickIndex, pickerClientId, playerId }
  DRAFT_COMPLETE: 'draft_complete', // { teamAClientId, teamBClientId }
  TOSS_CALL: 'toss_call', // { call: 'heads'|'tails' }
  TOSS_FLIP_RESULT: 'toss_flip_result', // { flipResult, callWinnerClientId }
  TOSS_CHOICE: 'toss_choice', // { choice: 'bat'|'bowl' }
  MATCH_INIT: 'match_init', // { matchSeed, oversPerSide, squadSize }
  // Generic in-match pub/sub used by NetworkBridge for every per-ball
  // exchange (ball commit, catch QTE result, run-decision result) - see
  // NetworkBridge.js for the `key` namespacing convention.
  GAME_VALUE: 'game_value', // { key, value }
  STATE_SYNC_REQUEST: 'state_sync_request', // {}
  STATE_SYNC: 'state_sync', // { fullMatchStateJSON }
  MATCH_RESULT_ACK: 'match_result_ack', // { resultSummary }
};
