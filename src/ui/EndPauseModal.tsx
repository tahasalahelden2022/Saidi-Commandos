import { ArrowLeft, Award, Home, Play, RotateCcw, Skull } from 'lucide-react';
import type { HudSnapshot } from '../types/game';

interface EndPauseModalProps {
  hud: HudSnapshot;
  onResume: () => void;
  onRestart: () => void;
  onNextStage: () => void;
  onReturnTitle: () => void;
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function EndPauseModal({
  hud,
  onResume,
  onRestart,
  onNextStage,
  onReturnTitle,
}: EndPauseModalProps) {
  if (hud.phase !== 'paused' && hud.phase !== 'victory' && hud.phase !== 'defeat') {
    return null;
  }

  const isVictory = hud.phase === 'victory';
  const isDefeat = hud.phase === 'defeat';
  const isPaused = hud.phase === 'paused';

  const rank =
    hud.alertsTriggered === 0
      ? 'شبح الصعيد (تسلل مثالي)'
      : hud.alertsTriggered <= 2
        ? 'قائد محترف'
        : 'ناجٍ شجاع';

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-[#0f0c08]/78 p-4">
      <div className="relative w-full max-w-md rounded-2xl bg-[#18120c] border border-[#d9a441]/60 p-6 shadow-2xl text-right">
        <div className="absolute top-2.5 right-2.5 w-3 h-3 border-t-2 border-r-2 border-[#f5c451]/70 rounded-tr-sm pointer-events-none" />
        <div className="absolute top-2.5 left-2.5 w-3 h-3 border-t-2 border-l-2 border-[#f5c451]/70 rounded-tl-sm pointer-events-none" />
        <div className="absolute bottom-2.5 right-2.5 w-3 h-3 border-b-2 border-r-2 border-[#f5c451]/70 rounded-br-sm pointer-events-none" />
        <div className="absolute bottom-2.5 left-2.5 w-3 h-3 border-b-2 border-l-2 border-[#f5c451]/70 rounded-bl-sm pointer-events-none" />
        <div className="flex items-center gap-3 mb-4">
          {isVictory && <Award className="w-8 h-8 text-[#34d399] shrink-0" />}
          {isDefeat && <Skull className="w-8 h-8 text-[#ef4444] shrink-0" />}
          <div>
            <div className="text-xs font-mono-num uppercase tracking-wider text-[#d9a441]">
              {isVictory ? 'MISSION ACCOMPLISHED' : isDefeat ? 'MISSION FAILED' : 'PAUSED'}
            </div>
            <h2 className="text-2xl font-black text-[#fff4df]">
              {isVictory
                ? `تمت ${hud.stageNameAr} بنجاح!`
                : isDefeat
                  ? 'فشلت المهمة'
                  : 'إيقاف مؤقت'}
            </h2>
          </div>
        </div>

        {isDefeat && hud.defeatReasonAr && (
          <p className="mb-4 text-sm text-[#fca5a5] bg-[#450a0a]/60 border border-[#ef4444]/40 rounded-lg px-3 py-2">
            {hud.defeatReasonAr}
          </p>
        )}

        {isVictory && (
          <p className="mb-4 text-sm text-[#a7f3d0] bg-[#064e3b]/50 border border-[#34d399]/35 rounded-lg px-3 py-2">
            تم تنفيذ الهدف ووصول الفريق إلى نقطة الإخلاء بأمان.
          </p>
        )}

        <div className="grid grid-cols-3 gap-2.5 mb-5 text-center">
          <div className="rounded-xl bg-[#261e15] border border-[#d9a441]/25 p-2.5">
            <div className="text-[11px] text-[#bfa989]">الزمن</div>
            <div className="text-base font-black font-mono-num text-[#fff4df]">
              {formatTime(hud.elapsedSeconds)}
            </div>
          </div>
          <div className="rounded-xl bg-[#261e15] border border-[#d9a441]/25 p-2.5">
            <div className="text-[11px] text-[#bfa989]">حراس معطلون</div>
            <div className="text-base font-black font-mono-num text-[#f5c451]">
              {hud.objectives.koGuards}/{hud.objectives.totalGuards}
            </div>
          </div>
          <div className="rounded-xl bg-[#261e15] border border-[#d9a441]/25 p-2.5">
            <div className="text-[11px] text-[#bfa989]">الإنذارات</div>
            <div className="text-base font-black font-mono-num text-[#fb7185]">
              {hud.alertsTriggered}
            </div>
          </div>
        </div>

        {isVictory && (
          <div className="mb-5 text-xs text-center py-2 rounded-lg bg-[#2b2217] border border-[#d9a441]/30 text-[#fde68a] font-bold">
            التقييم التكتيكي: {rank}
          </div>
        )}

        {isPaused && (
          <div className="mb-5 text-xs text-[#cbb595] space-y-1 bg-[#261e15] rounded-xl p-3 border border-[#d9a441]/20">
            <div>• نقر يسار: تحديد بطل أو حركة أو حمل جثة · نقر مزدوج / Shift: ركض</div>
            <div>• C: انحناء وتخفٍّ · Q: مهارة البطل · E: تعطيل / حمل وإلقاء الجثة / تفاعل</div>
            <div>• G: تجميع الفريق · F5 / F9: حفظ سريع واستعادة · WASD / Z / X: الكاميرا</div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2.5">
          {isPaused && (
            <button
              type="button"
              onClick={onResume}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#d9a441] hover:bg-[#eab854] text-[#1b140c] font-black text-sm cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>استئناف</span>
            </button>
          )}
          {isVictory && (
            <button
              type="button"
              onClick={onNextStage}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#d9a441] hover:bg-[#eab854] text-[#1b140c] font-black text-sm cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>المرحلة التالية</span>
            </button>
          )}
          <button
            type="button"
            onClick={onRestart}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-black text-sm cursor-pointer ${
              isDefeat
                ? 'bg-[#d9a441] hover:bg-[#eab854] text-[#1b140c]'
                : 'bg-[#2b2218] border border-[#d9a441]/40 text-[#f6ebd8] hover:bg-[#382c1f]'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            <span>إعادة</span>
          </button>
          <button
            type="button"
            onClick={onReturnTitle}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#211a14] border border-[#d9a441]/30 text-[#cbb595] hover:text-[#fff4df] text-xs font-bold cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>المراحل</span>
          </button>
        </div>
      </div>
    </div>
  );
}
