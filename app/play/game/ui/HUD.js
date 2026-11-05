'use client';

export default function HUD({ hud, ballResult }) {
  if (!hud) return null;
  return (
    <>
      <div className="pointer-events-none absolute left-0 right-0 top-0 flex flex-col items-center gap-1 pt-3 text-center">
        <div className="text-sm text-white/70">{hud.teamsText}</div>
        <div className="text-3xl font-black text-amber-300">{hud.scoreText}</div>
        <div className="text-sm text-white">{hud.oversText}</div>
        {hud.targetText && <div className="text-xs text-white/60">{hud.targetText}</div>}
        <div className="text-sm text-white/80">{hud.matchupText}</div>
      </div>

      {ballResult && (
        <div
          className={`pointer-events-none absolute bottom-3 left-0 right-0 text-center text-lg font-bold ${
            ballResult.isWicket ? 'text-red-500' : 'text-green-400'
          }`}
        >
          {ballResult.text}
        </div>
      )}
    </>
  );
}
