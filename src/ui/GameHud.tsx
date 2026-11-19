import { useEffect, useState } from 'react';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  BellOff,
  Camera,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  Compass,
  Eye,
  FolderOpen,
  Lock,
  Pause,
  RotateCcw,
  RotateCw,
  Save,
  ShieldAlert,
  Swords,
  Unlock,
  Users,
  Volume2,
  VolumeX,
} from 'lucide-react';
import type { HeroId, HeroToolId, HudSnapshot } from '../types/game';
import { HeroPortrait } from './HeroPortrait';
import { HeroToolsBar } from './HeroToolsBar';
import { TacticalMinimap } from './TacticalMinimap';

interface GameHudProps {
  hud: HudSnapshot;
  onSelectHero: (id: HeroId) => void;
  onToggleCrouch: () => void;
  onUseTool: (toolId: HeroToolId) => void;
  onStartDropTargeting: () => void;
  onInteract: () => void;
  onRallySquad: () => void;
  onToggleCameraFollow: () => void;
  onRotateCamera: (dir: 1 | -1) => void;
  onCycleCameraView: () => void;
  onQuickSave: () => void;
  onQuickLoad: () => void;
  onPanTo: (x: number, z: number) => void;
  onTogglePause: () => void;
  onToggleMute: () => void;
  onToggleQuality: () => void;
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function GameHud({
  hud,
  onSelectHero,
  onToggleCrouch,
  onUseTool,
  onStartDropTargeting,
  onInteract,
  onRallySquad,
  onToggleCameraFollow,
  onRotateCamera,
  onCycleCameraView,
  onQuickSave,
  onQuickLoad,
  onPanTo,
  onTogglePause,
  onToggleMute,
  onToggleQuality,
}: GameHudProps) {
  const [dockCollapsed, setDockCollapsed] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'KeyH') {
        setDockCollapsed((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const activeHero = hud.heroes.find((h) => h.id === hud.selectedHeroId) ?? hud.heroes[0];
  const viewPresetLabel =
    hud.cameraViewPreset === 'high'
      ? 'علوي'
      : hud.cameraViewPreset === 'close'
        ? 'قريب'
        : 'مائل';

  return (
    <div className="fixed inset-0 pointer-events-none z-20">
      {/* World-Projected Guard Suspicion / Alert Badges */}
      {hud.guardIndicators.map((ind) => {
        if (!ind.visible) return null;
        const isAlert = ind.state === 'alert';
        return (
          <div
            key={ind.id}
            style={{
              transform: `translate(${Math.round(ind.screenX)}px, ${Math.round(ind.screenY)}px) translate(-50%, -100%)`,
            }}
            className="absolute top-0 left-0 flex flex-col items-center"
          >
            <div
              className={`px-2 py-0.5 rounded-md text-xs font-black border shadow-md font-mono-num ${
                isAlert
                  ? 'bg-[#b91c1c] border-[#fca5a5] text-white'
                  : 'bg-[#d97706] border-[#fde68a] text-[#1c1308]'
              }`}
            >
              {isAlert ? '!' : `? ${Math.round(ind.suspicion * 100)}%`}
            </div>
          </div>
        );
      })}

      {/* Top Row */}
      <div className="flex items-start justify-between p-4 gap-4">
        {/* Top-Right Mission & Minimap Cluster */}
        <div className="flex flex-col gap-2 items-start">
          <div className="pointer-events-auto relative rounded-xl bg-[#18120c]/94 border border-[#d9a441]/45 px-4 py-3 shadow-xl max-w-xs">
            <div className="flex items-center justify-between gap-4 mb-2 border-b border-[#d9a441]/25 pb-1.5">
              <span className="text-xs font-black text-[#f5c451] tracking-wide">{hud.stageNameAr}</span>
              <span className="text-xs font-mono-num px-1.5 py-0.5 rounded bg-[#271d13] text-[#f6ebd8] border border-[#d9a441]/20">
                {formatTime(hud.elapsedSeconds)}
              </span>
            </div>

            <ul className="space-y-1.5 text-xs">
              <li className="flex items-center gap-2">
                {hud.objectives.primaryDone ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#34d399] shrink-0" />
                ) : (
                  <Circle className="w-3.5 h-3.5 text-[#f59e0b] shrink-0" />
                )}
                <span className={hud.objectives.primaryDone ? 'line-through text-[#9ca3af]' : 'text-[#fff4df] font-semibold'}>
                  {hud.objectives.primaryLabelAr}
                </span>
              </li>

              <li className="flex items-center gap-2">
                {hud.objectives.secondaryDone ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#34d399] shrink-0" />
                ) : (
                  <BellOff className="w-3.5 h-3.5 text-[#fb7185] shrink-0" />
                )}
                <span className={hud.objectives.secondaryDone ? 'line-through text-[#9ca3af]' : 'text-[#d4c0a1]'}>
                  {hud.objectives.secondaryLabelAr}
                </span>
              </li>

              <li className="flex items-center gap-2">
                {hud.objectives.extracted ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#34d399] shrink-0" />
                ) : (
                  <Circle className="w-3.5 h-3.5 text-[#38bdf8] shrink-0" />
                )}
                <span className={hud.objectives.primaryDone ? 'text-[#7dd3fc] font-bold' : 'text-[#b59f80]'}>
                  {hud.objectives.extractLabelAr}
                </span>
              </li>
            </ul>

            <div className="mt-2.5 pt-2 border-t border-[#d9a441]/20">
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="flex items-center gap-1 text-[#e6d2b3]">
                  <ShieldAlert className="w-3.5 h-3.5 text-[#f59e0b]" />
                  مستوى الإنذار
                </span>
                <span className="font-mono-num font-bold text-[#f6ebd8]">
                  {hud.objectives.alarmLevel}%
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-[#2b2218] overflow-hidden">
                <div
                  className="h-full transition-all duration-150"
                  style={{
                    width: `${hud.objectives.alarmLevel}%`,
                    backgroundColor:
                      hud.objectives.alarmLevel > 65
                        ? '#ef4444'
                        : hud.objectives.alarmLevel > 25
                          ? '#f59e0b'
                          : '#34d399',
                  }}
                />
              </div>
            </div>
          </div>

          <TacticalMinimap hud={hud} onPanTo={onPanTo} />
        </div>

        {/* Top-Left Camera & Utility Controls */}
        <div className="pointer-events-auto flex flex-col items-end gap-2">
          <div className="flex flex-wrap items-center justify-end gap-2">
            {hud.scoutSurveyActive && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#78350f]/95 border border-[#fbbf24] text-[#fef3c7] text-xs font-bold font-mono-num">
                <Eye className="w-3.5 h-3.5" />
                <span>كشف المسارات {hud.scoutSurveyRemaining}ث</span>
              </div>
            )}

            <button
              type="button"
              onClick={onQuickSave}
              className="flex items-center gap-1 px-2.5 py-2 rounded-lg bg-[#18120c]/92 border border-[#d9a441]/35 text-[#dcc8a8] hover:border-[#f5c451] text-xs font-bold cursor-pointer"
              title="حفظ سريع [F5]"
            >
              <Save className="w-3.5 h-3.5 text-[#f5c451]" />
              <span>حفظ</span>
            </button>

            {hud.hasQuickSave && (
              <button
                type="button"
                onClick={onQuickLoad}
                className="flex items-center gap-1 px-2.5 py-2 rounded-lg bg-[#18120c]/92 border border-[#d9a441]/35 text-[#dcc8a8] hover:border-[#f5c451] text-xs font-bold cursor-pointer"
                title="استعادة الحفظ [F9]"
              >
                <FolderOpen className="w-3.5 h-3.5 text-[#38bdf8]" />
                <span>استعادة</span>
              </button>
            )}

            <button
              type="button"
              onClick={onToggleQuality}
              className="px-3 py-2 rounded-lg bg-[#18120c]/92 border border-[#d9a441]/35 text-[#dcc8a8] hover:border-[#f5c451] text-xs font-bold cursor-pointer"
            >
              {hud.quality === 'high' ? 'جودة: عالية' : 'جودة: خفيفة'}
            </button>

            <button
              type="button"
              onClick={onToggleMute}
              className="p-2 rounded-lg bg-[#18120c]/92 border border-[#d9a441]/35 text-[#f6ebd8] hover:border-[#f5c451] cursor-pointer"
              aria-label="الصوت"
            >
              {hud.muted ? <VolumeX className="w-4 h-4 text-[#f59e0b]" /> : <Volume2 className="w-4 h-4 text-[#f5c451]" />}
            </button>

            <button
              type="button"
              onClick={onTogglePause}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#18120c]/92 border border-[#d9a441]/35 text-[#f6ebd8] hover:border-[#f5c451] text-xs font-bold cursor-pointer"
            >
              <Pause className="w-3.5 h-3.5" />
              <span>إيقاف</span>
            </button>
          </div>

          {/* Camera Follow & Viewing Angle Cluster */}
          <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl bg-[#18120c]/92 border border-[#d9a441]/35 text-xs">
            <button
              type="button"
              onClick={onToggleCameraFollow}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[11px] font-bold whitespace-nowrap cursor-pointer ${
                hud.cameraFollowHero
                  ? 'bg-[#1e3a2f] border-[#34d399]/70 text-[#a7f3d0]'
                  : 'bg-[#211a14] border-[#d9a441]/25 text-[#dcc8a8] hover:border-[#f5c451]'
              }`}
              title="تتبع الشخصية المحددة أثناء التحرك [Space]"
            >
              {hud.cameraFollowHero ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
              <span>{hud.cameraFollowHero ? 'تتبع البطل' : 'كاميرا حرة'}</span>
            </button>

            <button
              type="button"
              onClick={onCycleCameraView}
              className="flex items-center gap-1 px-2 py-1 rounded-lg border bg-[#211a14] border-[#d9a441]/25 text-[#fde68a] hover:border-[#f5c451] text-[11px] font-bold whitespace-nowrap cursor-pointer"
              title="تغيير زاوية الارتفاع والمنظور [V]"
            >
              <Camera className="w-3 h-3 text-[#f5c451]" />
              <span>منظور: {viewPresetLabel}</span>
            </button>

            <div className="flex items-center gap-0.5 bg-[#211a14] border border-[#d9a441]/25 rounded-lg p-0.5">
              <button
                type="button"
                onClick={() => onRotateCamera(-1)}
                className="p-1 rounded hover:bg-[#33271b] text-[#f5c451] cursor-pointer"
                title="تدوير زاوية الرؤية يساراً [Z]"
                aria-label="تدوير الكاميرا يساراً"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <span className="flex items-center gap-0.5 px-1.5 text-[11px] font-mono-num text-[#f6ebd8]" title="اسحب بزر الفأرة الأوسط أو Alt+سحب لتدوير حر">
                <Compass className="w-3 h-3 text-[#d9a441]" />
                {hud.cameraYawDeg}°
              </span>
              <button
                type="button"
                onClick={() => onRotateCamera(1)}
                className="p-1 rounded hover:bg-[#33271b] text-[#f5c451] cursor-pointer"
                title="تدوير زاوية الرؤية يميناً [X]"
                aria-label="تدوير الكاميرا يميناً"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Transient Context Hint Banner */}
      {hud.contextHintAr && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-lg bg-[#18120c]/94 border border-[#d9a441]/55 text-[#fde68a] text-xs font-bold shadow-lg">
          {hud.contextHintAr}
        </div>
      )}

      {/* Collapsible Bottom Tactical Command Dock */}
      <div
        className="fixed bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center transition-transform duration-200"
        style={{
          transform: dockCollapsed ? 'translate(-50%, calc(100% - 30px))' : 'translate(-50%, 0)',
          maxWidth: 'min(1040px, 96vw)',
        }}
      >
        <button
          type="button"
          onClick={() => setDockCollapsed((v) => !v)}
          className="pointer-events-auto flex items-center gap-1.5 px-4 py-1 rounded-t-lg bg-[#18120c]/94 border border-b-0 border-[#d9a441]/45 text-[11px] font-bold text-[#d9a441] hover:text-[#fde68a] cursor-pointer"
        >
          {dockCollapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          <span>{dockCollapsed ? 'إظهار لوحة القيادة [H]' : 'إخفاء [H]'}</span>
        </button>

        <div className="pointer-events-auto flex flex-col gap-2 rounded-2xl bg-[#18120c]/94 border border-[#d9a441]/50 px-4 py-2.5 shadow-2xl w-full">
          {/* Selected Hero's Tools & Body Drop Controls */}
          {activeHero && (
            <HeroToolsBar
              hero={activeHero}
              targetingMode={hud.targetingMode}
              onUseTool={onUseTool}
              onDropHere={onInteract}
              onStartDropTargeting={onStartDropTargeting}
            />
          )}

          {/* Hero Selector Cards + Quick Tactical Commands */}
          <div className="flex flex-wrap md:flex-nowrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              {hud.heroes.map((hero, idx) => {
                const selected = hero.id === hud.selectedHeroId;
                return (
                  <button
                    key={hero.id}
                    type="button"
                    disabled={!hero.alive}
                    onClick={() => onSelectHero(hero.id)}
                    className={`flex items-center gap-2.5 px-2.5 py-2 rounded-xl border text-right transition-colors min-w-[136px] cursor-pointer ${
                      !hero.alive
                        ? 'bg-[#211a14]/70 border-[#4b3c2d] opacity-45 cursor-not-allowed'
                        : selected
                          ? 'bg-[#2e2317] border-[#f5c451] shadow-md'
                          : 'bg-[#211a14] border-[#d9a441]/25 hover:border-[#d9a441]/60'
                    }`}
                  >
                    <HeroPortrait id={hero.id} alive={hero.alive} />

                    <div className="flex flex-col flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-black text-[#fff4df] truncate">{hero.nameAr}</span>
                        <span className="text-[10px] font-mono-num px-1 rounded bg-[#14100c] text-[#d9a441]">
                          {idx + 1}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-1 mt-0.5">
                        <span className="text-[10px] text-[#bfa989]">{hero.roleAr}</span>
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: hero.maxHp }).map((_, i) => (
                            <span
                              key={i}
                              className={`w-1.5 h-1.5 rounded-xs ${
                                i < hero.hp ? 'bg-[#34d399]' : 'bg-[#4b3c2d]'
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      <div
                        className={`mt-0.5 text-[10px] font-bold ${
                          !hero.alive
                            ? 'text-[#9ca3af]'
                            : hero.carryingBody
                              ? 'text-[#fbbf24]'
                              : hero.hiddenInCover
                                ? 'text-[#34d399]'
                                : 'text-[#93c5fd]'
                        }`}
                      >
                        {!hero.alive
                          ? 'سقط'
                          : hero.carryingBody
                            ? 'يحمل جثة'
                            : hero.hiddenInCover
                              ? 'مختبئ بالساتر'
                              : hero.actionLabel}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="hidden md:block h-12 w-px bg-[#d9a441]/25" />

            {/* Core Stance / Interact / Squad Commands */}
            {activeHero && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onToggleCrouch}
                  disabled={!activeHero.alive}
                  className={`flex flex-col items-center px-3 py-2 rounded-xl border text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                    activeHero.crouching
                      ? 'bg-[#1e3a2f] border-[#34d399] text-[#a7f3d0]'
                      : 'bg-[#211a14] border-[#d9a441]/35 text-[#dcc8a8] hover:border-[#f5c451]'
                  }`}
                >
                  <span>{activeHero.crouching ? 'منحنٍ' : 'تخفٍّ'}</span>
                  <span className="text-[10px] font-mono-num text-[#9ca3af]">[C]</span>
                </button>

                <button
                  type="button"
                  onClick={onInteract}
                  disabled={!activeHero.alive}
                  className={`flex flex-col items-center px-3 py-2 rounded-xl border text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                    activeHero.carryingBody
                      ? 'bg-[#78350f] border-[#fbbf24] text-[#fef3c7] hover:bg-[#92400e]'
                      : activeHero.nearbyBodyPickup
                        ? 'bg-[#0c4a6e] border-[#38bdf8] text-[#e0f2fe] hover:bg-[#075985]'
                        : 'bg-[#211a14] border-[#d9a441]/35 text-[#dcc8a8] hover:border-[#f5c451]'
                  }`}
                  title={
                    activeHero.carryingBody
                      ? 'إلقاء الجثة في الموقع الحالي [E]'
                      : activeHero.nearbyBodyPickup
                        ? 'حمل جثة الحارس لإخفائها [E]'
                        : 'تعطيل الحارس أو حمل الجثة أو التفاعل مع الهدف [E]'
                  }
                >
                  <span className="flex items-center gap-1">
                    {activeHero.carryingBody ? (
                      <>
                        <ArrowDownToLine className="w-3.5 h-3.5" />
                        إلقاء الجثة
                      </>
                    ) : activeHero.nearbyBodyPickup ? (
                      <>
                        <ArrowUpFromLine className="w-3.5 h-3.5" />
                        حمل الجثة
                      </>
                    ) : (
                      <>
                        <Swords className="w-3.5 h-3.5" />
                        تعطيل / حمل
                      </>
                    )}
                  </span>
                  <span className="text-[10px] font-mono-num opacity-80">[E]</span>
                </button>

                <button
                  type="button"
                  onClick={onRallySquad}
                  disabled={!activeHero.alive}
                  className="flex flex-col items-center px-3 py-2 rounded-xl border bg-[#211a14] border-[#d9a441]/35 text-[#dcc8a8] hover:border-[#f5c451] text-xs font-bold whitespace-nowrap cursor-pointer"
                  title="تجميع الفريق حول البطل المحدد"
                >
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    تجميع
                  </span>
                  <span className="text-[10px] font-mono-num text-[#9ca3af]">[G]</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
