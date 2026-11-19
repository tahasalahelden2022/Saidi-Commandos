import { useEffect, useRef, useState } from 'react';
import { GameEngine } from './game/GameEngine';
import type { HudSnapshot } from './types/game';
import { EndPauseModal } from './ui/EndPauseModal';
import { GameHud } from './ui/GameHud';
import { TitleOverlay } from './ui/TitleOverlay';

const INITIAL_HUD: HudSnapshot = {
  phase: 'title',
  stageId: 'village',
  stageNameAr: '١. قرية الكرم',
  selectedHeroId: 'hamdan',
  skillTargeting: false,
  targetingMode: 'none',
  scoutSurveyActive: false,
  scoutSurveyRemaining: 0,
  cameraFollowHero: true,
  cameraYawDeg: 45,
  cameraViewPreset: 'iso',
  heroes: [],
  objectives: {
    primaryDone: false,
    primaryLabelAr: '',
    secondaryDone: false,
    secondaryLabelAr: '',
    extractLabelAr: '',
    extracted: false,
    alarmLevel: 0,
    activeGuards: 6,
    koGuards: 0,
    totalGuards: 6,
  },
  guardIndicators: [],
  minimapEntities: [],
  minimapObstacles: [],
  elapsedSeconds: 0,
  alertsTriggered: 0,
  contextHintAr: '',
  defeatReasonAr: '',
  muted: false,
  quality: 'high',
  hasQuickSave: false,
  campaignProgress: {
    village: { completed: false, bestTimeSec: null, bestAlerts: null },
    camp: { completed: false, bestTimeSec: null, bestAlerts: null },
    farms: { completed: false, bestTimeSec: null, bestAlerts: null },
    mountain: { completed: false, bestTimeSec: null, bestAlerts: null },
  },
};

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const [hud, setHud] = useState<HudSnapshot>(INITIAL_HUD);

  useEffect(() => {
    const mountEl = canvasMountRef.current;
    if (!mountEl) return;

    const engine = new GameEngine(mountEl, (snapshot) => {
      setHud(snapshot);
    });
    engineRef.current = engine;

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#1b1611]">
      {/* Isolated WebGL mount container */}
      <div
        ref={canvasMountRef}
        className="absolute inset-0 w-full h-full"
        style={{ cursor: hud.skillTargeting ? 'crosshair' : 'default' }}
      />

      {hud.phase === 'title' && (
        <TitleOverlay
          selectedStageId={hud.stageId}
          campaignProgress={hud.campaignProgress}
          hasQuickSave={hud.hasQuickSave}
          muted={hud.muted}
          onSelectStage={(id) => engineRef.current?.selectStage(id)}
          onStart={(id) => engineRef.current?.startGame(id)}
          onLoadQuickSave={() => engineRef.current?.quickLoad()}
          onToggleMute={() => engineRef.current?.toggleMute()}
        />
      )}

      {hud.phase !== 'title' && hud.heroes.length > 0 && (
        <GameHud
          hud={hud}
          onSelectHero={(id) => engineRef.current?.selectHero(id)}
          onToggleCrouch={() => engineRef.current?.toggleCrouch()}
          onUseTool={(toolId) => engineRef.current?.useTool(toolId)}
          onStartDropTargeting={() => engineRef.current?.startDropTargeting()}
          onInteract={() => engineRef.current?.interactNearest()}
          onRallySquad={() => engineRef.current?.rallySquad()}
          onToggleCameraFollow={() => engineRef.current?.toggleCameraFollow()}
          onRotateCamera={(dir) => engineRef.current?.rotateCameraStep(dir)}
          onCycleCameraView={() => engineRef.current?.cycleCameraView()}
          onQuickSave={() => engineRef.current?.quickSave()}
          onQuickLoad={() => engineRef.current?.quickLoad()}
          onPanTo={(x, z) => engineRef.current?.panToWorld(x, z)}
          onTogglePause={() => engineRef.current?.togglePause()}
          onToggleMute={() => engineRef.current?.toggleMute()}
          onToggleQuality={() => engineRef.current?.toggleQuality()}
        />
      )}

      <EndPauseModal
        hud={hud}
        onResume={() => engineRef.current?.togglePause()}
        onRestart={() => engineRef.current?.restartMission()}
        onNextStage={() => engineRef.current?.nextStage()}
        onReturnTitle={() => engineRef.current?.returnToTitle()}
      />
    </div>
  );
}
