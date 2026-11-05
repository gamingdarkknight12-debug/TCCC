'use client';

// Orchestrates the whole online path: Lobby (room create/join) -> DraftBoard
// (alternating picks) -> OnlineToss (bat/bowl) -> hands a ready-to-play
// MatchState + RemoteBridge up to the page, mirroring how TeamSelect hands a
// matchConfig up for single-player.

import { useState } from 'react';
import Lobby from './Lobby';
import DraftBoard from './DraftBoard';
import OnlineToss from './OnlineToss';
import { MatchState } from '../game/engine/MatchState';
import { RemoteBridge } from '../game/net/NetworkBridge';

export default function OnlineFlow({ onReady }) {
  const [lobbyInfo, setLobbyInfo] = useState(null);
  const [draftInfo, setDraftInfo] = useState(null);

  function handleTossComplete({ battingFirst, matchSeed }) {
    const matchState = new MatchState({
      oversPerSide: lobbyInfo.oversPerSide,
      squadSize: lobbyInfo.squadSize,
      teamA: { id: 'A', name: lobbyInfo.isHost ? 'You' : 'Opponent', players: draftInfo.teamAPlayers },
      teamB: { id: 'B', name: lobbyInfo.isHost ? 'Opponent' : 'You', players: draftInfo.teamBPlayers },
      battingFirst,
      matchSeed,
    });
    const bridge = new RemoteBridge(lobbyInfo.roomChannel);
    const userTeamKey = lobbyInfo.isHost ? 'A' : 'B';

    onReady({
      matchConfig: { oversPerSide: lobbyInfo.oversPerSide, squadSize: lobbyInfo.squadSize },
      bridge,
      prebuiltMatchState: matchState,
      userTeamKey,
    });
  }

  if (!lobbyInfo) {
    return <Lobby onReady={setLobbyInfo} />;
  }

  if (!draftInfo) {
    return (
      <DraftBoard
        roomChannel={lobbyInfo.roomChannel}
        clientId={lobbyInfo.clientId}
        isHost={lobbyInfo.isHost}
        squadSize={lobbyInfo.squadSize}
        onDraftComplete={setDraftInfo}
      />
    );
  }

  return (
    <OnlineToss
      roomChannel={lobbyInfo.roomChannel}
      clientId={lobbyInfo.clientId}
      isHost={lobbyInfo.isHost}
      oversPerSide={lobbyInfo.oversPerSide}
      squadSize={lobbyInfo.squadSize}
      onTossComplete={handleTossComplete}
    />
  );
}
