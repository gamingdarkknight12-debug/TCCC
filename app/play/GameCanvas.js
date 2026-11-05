'use client';

// Loaded only via next/dynamic(..., { ssr: false }) from page.js, so it's
// never server-rendered - safe to import `three` (and anything else that
// touches `window`) at the top of this file. Mounts a Three.js 3D scene plus
// a React UI overlay driven by MatchOrchestrator - single-player builds its
// own MatchState after an in-canvas coin flip (TossOverlay); online matches
// arrive with `prebuiltMatchState`/`userTeamKey` already set (the draft/toss
// already ran in app/play/online/*) and skip straight to play.

import { useEffect, useRef, useState } from 'react';
import { Scene3D } from './game/scene3d/Scene3D';
import { MatchOrchestrator } from './game/MatchOrchestrator';
import { LocalAiBridge } from './game/net/NetworkBridge';
import HUD from './game/ui/HUD';
import BattingInput from './game/ui/BattingInput';
import BowlingInput from './game/ui/BowlingInput';
import { CatchQte, RunDecision } from './game/ui/FieldingPrompt';
import BowlerChoice from './game/ui/BowlerChoice';
import TossOverlay from './game/ui/TossOverlay';
import InningsBreakOverlay from './game/ui/InningsBreakOverlay';
import ResultOverlay from './game/ui/ResultOverlay';

export default function GameCanvas({ matchConfig, onMatchComplete, bridge, prebuiltMatchState, userTeamKey }) {
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const orchestratorRef = useRef(null);

  const [matchState, setMatchState] = useState(prebuiltMatchState || null);
  const [resolvedUserTeamKey, setResolvedUserTeamKey] = useState(userTeamKey || null);
  const [uiRequest, setUiRequest] = useState(null);
  const [hud, setHud] = useState(null);
  const [ballResult, setBallResult] = useState(null);
  const [result, setResult] = useState(null);

  // Mount the Three.js scene once. Guard against Strict Mode/Fast Refresh
  // double-invoking this effect, which would otherwise stack two renderers
  // onto the same canvas.
  useEffect(() => {
    if (sceneRef.current) return;
    const scene3d = new Scene3D(canvasRef.current);
    scene3d.setupFielders(matchConfig.squadSize);
    sceneRef.current = scene3d;

    return () => {
      scene3d.dispose();
      sceneRef.current = null;
    };
    // matchConfig is only read once at mount - a fresh match always gets a
    // fresh GameCanvas mount from the parent via a `key`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Start the orchestrator as soon as a MatchState exists (immediately for
  // online matches, or once TossOverlay's coin flip builds one).
  useEffect(() => {
    if (!matchState || orchestratorRef.current) return;
    const orchestrator = new MatchOrchestrator({
      matchState,
      userTeamKey: resolvedUserTeamKey,
      bridge: bridge || new LocalAiBridge(),
      scene3d: sceneRef.current,
      setUiRequest,
      onHudUpdate: setHud,
      onBallResult: setBallResult,
    });
    orchestratorRef.current = orchestrator;
    orchestrator.run().then(setResult);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchState]);

  function handleMatchReady(ms, key) {
    setResolvedUserTeamKey(key);
    setMatchState(ms);
  }

  return (
    <div
      className="relative mx-auto w-full max-w-4xl overflow-hidden rounded-2xl border border-white/10 bg-black"
      style={{ aspectRatio: '16 / 9' }}
    >
      <canvas ref={canvasRef} className="h-full w-full" />

      <div className="pointer-events-none absolute inset-0">
        {!matchState && <TossOverlay matchConfig={matchConfig} onMatchReady={handleMatchReady} />}

        {matchState && <HUD hud={hud} ballResult={ballResult} />}

        {uiRequest?.type === 'batting-input' && (
          <BattingInput durationMs={uiRequest.durationMs} onResolve={uiRequest.onResolve} />
        )}
        {uiRequest?.type === 'bowling-input' && (
          <BowlingInput durationMs={uiRequest.durationMs} onResolve={uiRequest.onResolve} />
        )}
        {uiRequest?.type === 'catch-qte' && <CatchQte onResolve={uiRequest.onResolve} />}
        {uiRequest?.type === 'run-decision' && (
          <RunDecision runsOffered={uiRequest.runsOffered} onResolve={uiRequest.onResolve} />
        )}
        {uiRequest?.type === 'bowler-choice' && (
          <BowlerChoice players={uiRequest.players} onResolve={uiRequest.onResolve} />
        )}
        {uiRequest?.type === 'innings-break' && (
          <InningsBreakOverlay
            summaryText={uiRequest.summaryText}
            target={uiRequest.target}
            onResolve={uiRequest.onResolve}
          />
        )}

        {result && <ResultOverlay matchState={matchState} result={result} onMatchComplete={onMatchComplete} />}
      </div>
    </div>
  );
}
