import { useEffect } from 'react';
import { CheckCircle2, FolderOpen, Play, Volume2, VolumeX } from 'lucide-react';
import { STAGES } from '../maps/stagesData';
import type { StageId, StageRecord } from '../types/game';

interface TitleOverlayProps {
  selectedStageId: StageId;
  campaignProgress: Record<StageId, StageRecord>;
  hasQuickSave: boolean;
  muted: boolean;
  onSelectStage: (id: StageId) => void;
  onStart: (id: StageId) => void;
  onLoadQuickSave: () => void;
  onToggleMute: () => void;
}

export function TitleOverlay({
  selectedStageId,
  campaignProgress,
  hasQuickSave,
  muted,
  onSelectStage,
  onStart,
  onLoadQuickSave,
  onToggleMute,
}: TitleOverlayProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        onStart(selectedStageId);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onStart, selectedStageId]);

  const activeStage = STAGES.find((s) => s.id === selectedStageId) ?? STAGES[0];

  return (
    <div className="fixed inset-0 pointer-events-none flex flex-col justify-between p-6 md:p-10 z-20">
      {/* Top Bar: Mute toggle */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onToggleMute}
          className="pointer-events-auto flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#1b1611]/90 border border-[#d9a441]/35 text-[#f6ebd8] hover:border-[#f5c451] transition-colors text-sm font-bold cursor-pointer"
          aria-label="تبديل الصوت"
        >
          {muted ? <VolumeX className="w-4 h-4 text-[#f59e0b]" /> : <Volume2 className="w-4 h-4 text-[#f5c451]" />}
          <span>{muted ? 'صامت' : 'الصوت'}</span>
        </button>
      </div>

      {/* Lower-Right Architectural Lockup + 4-Stage Campaign Selector */}
      <div className="flex flex-col items-start max-w-2xl">
        <div className="pointer-events-auto relative rounded-2xl bg-[#18120c]/94 border border-[#d9a441]/55 px-6 py-5 shadow-2xl w-full">
          <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-[#f5c451]/70 rounded-tr-sm pointer-events-none" />
          <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-[#f5c451]/70 rounded-tl-sm pointer-events-none" />
          <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-[#f5c451]/70 rounded-br-sm pointer-events-none" />
          <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-[#f5c451]/70 rounded-bl-sm pointer-events-none" />
          <div className="flex items-center gap-4 mb-3">
            <svg
              width="50"
              height="50"
              viewBox="0 0 64 64"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
              className="shrink-0"
            >
              <polygon
                points="32,3 58,18 58,46 32,61 6,46 6,18"
                fill="#261d14"
                stroke="#d9a441"
                strokeWidth="2.5"
              />
              <path
                d="M32 48V24M32 24C25 20 19 22 15 26M32 24C39 20 45 22 49 26M32 24C27 17 22 16 17 17M32 24C37 17 42 16 47 17"
                stroke="#f5c451"
                strokeWidth="2.6"
                strokeLinecap="round"
              />
              <circle cx="32" cy="14" r="3" fill="#f5c451" />
              <path d="M19 46L45 20" stroke="#e3cfa9" strokeWidth="2" strokeLinecap="round" />
            </svg>

            <div>
              <div className="text-xs font-mono-num tracking-widest uppercase text-[#d9a441]">
                SAIDI COMMANDOS · TACTICAL STEALTH 3D
              </div>
              <h1 className="text-3xl font-black text-[#fff4df] leading-tight">
                صعيدي كوماندوز
              </h1>
            </div>
          </div>

          {/* 4-Stage Campaign Selector */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
            {STAGES.map((st) => {
              const selected = st.id === selectedStageId;
              const rec = campaignProgress[st.id];
              return (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => onSelectStage(st.id)}
                  className={`flex flex-col items-start p-2.5 rounded-xl border text-right transition-colors cursor-pointer ${
                    selected
                      ? 'bg-[#2f2418] border-[#f5c451] text-[#fff4df]'
                      : 'bg-[#211a14] border-[#d9a441]/25 text-[#cbb595] hover:border-[#d9a441]/60'
                  }`}
                >
                  <div className="flex items-center justify-between w-full gap-1">
                    <span className="text-xs font-black">{st.nameAr}</span>
                    {rec?.completed && <CheckCircle2 className="w-3.5 h-3.5 text-[#34d399] shrink-0" />}
                  </div>
                  <span className="text-[10px] text-[#a89274] mt-0.5 line-clamp-1">
                    {st.guardPatrols.length} حراس
                    {rec?.bestTimeSec !== null && rec?.bestTimeSec !== undefined
                      ? ` · ${rec.bestTimeSec}ث`
                      : ''}
                  </span>
                </button>
              );
            })}
          </div>

          <p className="text-xs md:text-sm text-[#dcc8a8] leading-relaxed mb-4">
            <span className="text-[#f5c451] font-bold">{activeStage.nameAr}:</span>{' '}
            {activeStage.subtitleAr}
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => onStart(selectedStageId)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#d9a441] hover:bg-[#eab854] text-[#1b140c] font-black text-sm transition-colors shadow-lg cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>ابدأ المرحلة</span>
            </button>

            {hasQuickSave && (
              <button
                type="button"
                onClick={onLoadQuickSave}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#271e15] border border-[#d9a441]/45 hover:border-[#f5c451] text-[#fde68a] font-bold text-xs cursor-pointer"
              >
                <FolderOpen className="w-4 h-4" />
                <span>استئناف آخر حفظ [F9]</span>
              </button>
            )}

            <span className="text-xs text-[#bfa989] font-mono-num">
              ENTER / SPACE
            </span>
          </div>

          <div className="mt-3.5 pt-2.5 border-t border-[#d9a441]/20 text-[11px] text-[#b59f80]">
            نقر: حركة/تفاعل · F/Q/R: أدوات ومهارات البطل · E: حمل وإلقاء الجثة (أو نقر يمين لتحديد موضعها) · Z/X/V/Space: تدوير وتتبع الكاميرا · C: تخفٍّ
          </div>
        </div>
      </div>
    </div>
  );
}
