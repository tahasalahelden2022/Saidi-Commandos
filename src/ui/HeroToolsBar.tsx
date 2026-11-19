import { ArrowDownToLine, Crosshair } from 'lucide-react';
import type { HeroHudInfo, HeroToolId, HeroToolInfo, TargetingMode } from '../types/game';

interface HeroToolsBarProps {
  hero: HeroHudInfo;
  targetingMode: TargetingMode;
  onUseTool: (toolId: HeroToolId) => void;
  onDropHere: () => void;
  onStartDropTargeting: () => void;
}

function ToolArtwork({ id, carryingBody }: { id: HeroToolId; carryingBody: boolean }) {
  switch (id) {
    case 'shouma':
      return (
        <svg width="28" height="28" viewBox="0 0 36 36" fill="none" aria-hidden="true">
          <path
            d="M8 28L25.5 7.5C26.8 6 29.2 6.8 29.6 8.8C29.8 9.8 29.2 10.9 28.4 11.7L11.5 30.2C10.5 31.3 8.7 31.2 7.8 30.1C7.1 29.3 7.2 28.6 8 28Z"
            fill="#9b5f2c"
            stroke="#f5c451"
            strokeWidth="1.4"
          />
          <path d="M12.5 23.2L15.4 25.8M10.4 25.5L13.3 28.1" stroke="#472812" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M22.5 11.5L26 14.5" stroke="#dca842" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      );
    case 'sickle':
      return (
        <svg width="28" height="28" viewBox="0 0 36 36" fill="none" aria-hidden="true">
          <path
            d="M15 22C10.5 16.5 11.8 8.2 19.5 6.8C24.2 5.9 28.2 8.2 29.2 12.2C25.4 9.7 20.3 10.2 17.8 13.7C16.2 16 16.2 19.2 17.8 21.4L15 22Z"
            fill="#d4dce6"
            stroke="#94a3b8"
            strokeWidth="1.2"
          />
          <path
            d="M14.2 21.2L9.2 28.4C8.6 29.3 8.9 30.5 9.8 31C10.7 31.5 11.9 31.2 12.4 30.3L17.1 22.8L14.2 21.2Z"
            fill="#8c5024"
            stroke="#f5c451"
            strokeWidth="1.2"
          />
        </svg>
      );
    case 'whistle':
      return (
        <svg width="28" height="28" viewBox="0 0 36 36" fill="none" aria-hidden="true">
          <path
            d="M8 16H20C24 16 27 19 27 22.8C27 26.6 23.8 29.5 19.8 29.5C16.2 29.5 13.3 26.9 13 23.4L8 21.2V16Z"
            fill="#d9a441"
            stroke="#fde68a"
            strokeWidth="1.3"
          />
          <circle cx="20.2" cy="22.8" r="2.6" fill="#3a2410" />
          <path d="M26 11C28.2 11.8 29.8 13.4 30.5 15.5M28.2 7.8C31.2 9 33.4 11.4 34.3 14.5" stroke="#38bdf8" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );
    case 'lunge':
      return (
        <svg width="28" height="28" viewBox="0 0 36 36" fill="none" aria-hidden="true">
          <path d="M6 20H18M6 15H14M6 25H13" stroke="#f97316" strokeWidth="2" strokeLinecap="round" />
          <path
            d="M17 26L28.5 10.5C29.5 9.2 31.4 9.8 31.5 11.4C31.5 12.2 31.1 13 30.4 13.7L19.4 28.2L17 26Z"
            fill="#b4692c"
            stroke="#fde68a"
            strokeWidth="1.3"
          />
        </svg>
      );
    case 'pebble':
      return (
        <svg width="28" height="28" viewBox="0 0 36 36" fill="none" aria-hidden="true">
          <path d="M7 25C11 11 22 9 28 21" stroke="#fde047" strokeWidth="1.7" strokeDasharray="3 2.5" strokeLinecap="round" />
          <ellipse cx="28" cy="23.5" rx="4.2" ry="3.2" fill="#9ca3af" stroke="#e5e7eb" strokeWidth="1.2" />
          <circle cx="28" cy="27.8" r="2.2" stroke="#facc15" strokeWidth="1.1" opacity="0.8" />
        </svg>
      );
    case 'dust_bomb':
      return (
        <svg width="28" height="28" viewBox="0 0 36 36" fill="none" aria-hidden="true">
          <circle cx="14" cy="21" r="6.5" fill="#d6c29f" opacity="0.9" />
          <circle cx="22" cy="19.5" r="7.2" fill="#e7d3b0" opacity="0.88" />
          <circle cx="18.5" cy="14" r="5.8" fill="#c7b08a" opacity="0.92" />
          <path d="M10 27.5C14 29 22 29 26 27.5" stroke="#fbbf24" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      );
    case 'binoculars':
      return (
        <svg width="28" height="28" viewBox="0 0 36 36" fill="none" aria-hidden="true">
          <rect x="7" y="13" width="8.5" height="14" rx="3" fill="#4b3828" stroke="#d9a441" strokeWidth="1.3" />
          <rect x="20.5" y="13" width="8.5" height="14" rx="3" fill="#4b3828" stroke="#d9a441" strokeWidth="1.3" />
          <rect x="14.5" y="16" width="7" height="4" rx="1" fill="#8b6b43" />
          <circle cx="11.2" cy="23" r="2.6" fill="#38bdf8" stroke="#e0f2fe" strokeWidth="1" />
          <circle cx="24.8" cy="23" r="2.6" fill="#38bdf8" stroke="#e0f2fe" strokeWidth="1" />
        </svg>
      );
    case 'sight_check':
      return (
        <svg width="28" height="28" viewBox="0 0 36 36" fill="none" aria-hidden="true">
          <path d="M5.5 18C8.8 11.8 13.1 9.5 18 9.5C22.9 9.5 27.2 11.8 30.5 18C27.2 24.2 22.9 26.5 18 26.5C13.1 26.5 8.8 24.2 5.5 18Z" fill="#1f2937" stroke="#34d399" strokeWidth="1.5" />
          <circle cx="18" cy="18" r="4.3" fill="#34d399" fillOpacity="0.25" stroke="#34d399" strokeWidth="1.5" />
          <circle cx="18" cy="18" r="1.6" fill="#fde047" />
        </svg>
      );
    case 'sabotage':
      return (
        <svg width="28" height="28" viewBox="0 0 36 36" fill="none" aria-hidden="true">
          <path d="M11 27L21.5 16.5M14.5 11.5L11.5 8.5L8.5 11.5L11.5 14.5" stroke="#cbd5e1" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M19.5 14.5C20.8 10.8 24.8 9 28 10.8L25 13.8L27.2 16L30.2 13C31.6 16.2 29.8 20.1 26.2 21.2L17.5 29.5" stroke="#f5c451" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'carry':
      return (
        <svg width="28" height="28" viewBox="0 0 36 36" fill="none" aria-hidden="true">
          <circle cx="18" cy="9.5" r="3" fill={carryingBody ? '#fbbf24' : '#93c5fd'} />
          <path
            d={
              carryingBody
                ? 'M11 21L18 14L25 21M18 14V29'
                : 'M11 19L18 12L25 19M18 26V12'
            }
            stroke={carryingBody ? '#fbbf24' : '#38bdf8'}
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <rect x="8.5" y="27" width="19" height="3.2" rx="1.6" fill="#d9a441" opacity="0.8" />
        </svg>
      );
  }
}

export function HeroToolsBar({
  hero,
  targetingMode,
  onUseTool,
  onDropHere,
  onStartDropTargeting,
}: HeroToolsBarProps) {
  return (
    <div className="flex flex-col gap-1.5 w-full border-b border-[#d9a441]/25 pb-2 mb-0.5">
      {/* Carrying Body Explicit Drop Prompt */}
      {hero.carryingBody && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-[#45230a]/90 border border-[#fbbf24]/60 text-xs">
          <span className="font-bold text-[#fef3c7]">
            {hero.nameAr} يحمل جثة — اخفِها داخل الساتر الأخضر أو ألْقِها:
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onDropHere}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#d9a441] hover:bg-[#eab854] text-[#1b140c] font-black text-[11px] whitespace-nowrap cursor-pointer"
            >
              <ArrowDownToLine className="w-3.5 h-3.5" />
              <span>إلقاء هنا [E]</span>
            </button>
            <button
              type="button"
              onClick={onStartDropTargeting}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border font-bold text-[11px] whitespace-nowrap cursor-pointer ${
                targetingMode === 'drop_body'
                  ? 'bg-[#065f46] border-[#34d399] text-[#ecfdf5]'
                  : 'bg-[#271e15] border-[#34d399]/55 text-[#a7f3d0] hover:bg-[#1e3a2f]'
              }`}
            >
              <Crosshair className="w-3.5 h-3.5" />
              <span>{targetingMode === 'drop_body' ? 'انقر على الساتر أو الأرض...' : 'تحديد مكان الإلقاء'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Selected Hero's Equipment & Commandos Skills Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-[11px] text-[#e6d2b3] px-1">
          <span className="font-black text-[#f5c451]">أدوات {hero.nameAr}</span>
          <span aria-hidden="true" className="text-[#8c785c]">·</span>
          <span className="text-[#bfa989]">{hero.roleAr}</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {hero.tools.map((tool: HeroToolInfo) => {
            const onCooldown = tool.cooldown > 0;
            const disabled = !hero.alive || Boolean(tool.disabled) || onCooldown;
            return (
              <button
                key={tool.id}
                type="button"
                disabled={disabled}
                onClick={() => onUseTool(tool.id)}
                title={tool.descAr}
                className={`relative flex items-center gap-2 px-2.5 py-1.5 rounded-xl border text-right transition-colors whitespace-nowrap shrink-0 ${
                  disabled
                    ? 'bg-[#1d1712] border-[#3d3124] text-[#7a6952] opacity-65 cursor-not-allowed'
                    : tool.active
                      ? 'bg-[#92400e] border-[#fde68a] text-[#fffbeb] shadow-md cursor-pointer'
                      : 'bg-[#251d15] border-[#d9a441]/40 text-[#f6ebd8] hover:border-[#f5c451] hover:bg-[#33271b] cursor-pointer'
                }`}
              >
                <div className="w-7 h-7 rounded-lg bg-[#15100b] border border-[#d9a441]/35 flex items-center justify-center shrink-0">
                  <ToolArtwork id={tool.id} carryingBody={hero.carryingBody} />
                </div>

                <div className="flex flex-col leading-tight">
                  <span className="text-[11px] font-black">{tool.nameAr}</span>
                  <div className="flex items-center gap-1.5 text-[10px] font-mono-num">
                    <span className="text-[#d9a441]">[{tool.shortcut}]</span>
                    {onCooldown ? (
                      <span className="text-[#fbbf24]">{tool.cooldown}ث</span>
                    ) : tool.badgeAr ? (
                      <span className="text-[#38bdf8]">{tool.badgeAr}</span>
                    ) : null}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
