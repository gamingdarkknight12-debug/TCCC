// Pure reducer for the multiplayer pre-match draft - both browsers apply the
// identical reducer to every received `draft_pick` message, so no server
// authority is needed for the draft either. Strict alternation (winner,
// loser, winner, loser, ...), not a reversing "snake" draft.

export function nextPicker(pickIndex, firstPickerId, otherId) {
  return pickIndex % 2 === 0 ? firstPickerId : otherId;
}

export function createDraftState({ firstPickerId, otherId, squadSize, poolPlayerIds }) {
  return {
    firstPickerId,
    otherId,
    squadSize,
    availablePlayerIds: [...poolPlayerIds],
    picks: [],
    teams: { [firstPickerId]: [], [otherId]: [] },
  };
}

export function applyDraftPick(draftState, { pickIndex, pickerClientId, playerId }) {
  const expectedPicker = nextPicker(pickIndex, draftState.firstPickerId, draftState.otherId);
  if (pickerClientId !== expectedPicker) {
    throw new Error(`Pick ${pickIndex} must come from ${expectedPicker}, got ${pickerClientId}`);
  }
  if (!draftState.availablePlayerIds.includes(playerId)) {
    throw new Error(`Player ${playerId} is not available to draft`);
  }
  return {
    ...draftState,
    availablePlayerIds: draftState.availablePlayerIds.filter((id) => id !== playerId),
    picks: [...draftState.picks, { pickIndex, pickerClientId, playerId }],
    teams: {
      ...draftState.teams,
      [pickerClientId]: [...draftState.teams[pickerClientId], playerId],
    },
  };
}

export function isDraftComplete(draftState) {
  return draftState.picks.length >= draftState.squadSize * 2;
}
