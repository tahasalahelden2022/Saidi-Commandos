import type { MouseEvent } from 'react';
import type { HudSnapshot } from '../types/game';

interface TacticalMinimapProps {
  hud: HudSnapshot;
  onPanTo: (x: number, z: number) => void;
}

const SIZE = 116;
const HALF_EXTENT = 22;

function toMap(val: number): number {
  return ((val + HALF_EXTENT) / (HALF_EXTENT * 2)) * SIZE;
}

export function TacticalMinimap({ hud, onPanTo }: TacticalMinimapProps) {
  const handleClick = (e: MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const worldX = (px / rect.width) * (HALF_EXTENT * 2) - HALF_EXTENT;
    const worldZ = (py / rect.height) * (HALF_EXTENT * 2) - HALF_EXTENT;
    onPanTo(worldX, worldZ);
  };

  return (
    <div className="pointer-events-auto rounded-xl bg-[#19140f]/92 border border-[#d9a441]/35 p-2 shadow-lg w-fit">
      <div className="flex items-center justify-between text-[10px] text-[#bfa989] mb-1 px-0.5">
        <span>خريطة تكتيكية</span>
        <span className="font-mono-num text-[#f5c451]">{hud.objectives.koGuards}/{hud.objectives.totalGuards}</span>
      </div>
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        onClick={handleClick}
        className="rounded-lg bg-[#2a2117] border border-[#d9a441]/25 cursor-crosshair block"
      >
        {/* Obstacles */}
        {hud.minimapObstacles.map((o, idx) => {
          const x = toMap(o.x - o.w * 0.5);
          const y = toMap(o.z - o.d * 0.5);
          const w = (o.w / (HALF_EXTENT * 2)) * SIZE;
          const h = (o.d / (HALF_EXTENT * 2)) * SIZE;
          const fill =
            o.kind === 'water'
              ? '#246a7d'
              : o.kind === 'lowWall' || o.kind === 'crates' || o.kind === 'well'
                ? '#785a3a'
                : o.kind === 'cliff'
                  ? '#6b4e34'
                  : '#9c7853';
          return <rect key={idx} x={x} y={y} width={w} height={h} fill={fill} rx={1} />;
        })}

        {/* Entities */}
        {hud.minimapEntities.map((ent, idx) => {
          const cx = toMap(ent.x);
          const cy = toMap(ent.z);
          if (ent.kind === 'extract') {
            return (
              <circle
                key={`e_${idx}`}
                cx={cx}
                cy={cy}
                r={5.5}
                fill="none"
                stroke="#38bdf8"
                strokeWidth={1.5}
              />
            );
          }
          if (ent.kind === 'objective') {
            return <circle key={`o_${idx}`} cx={cx} cy={cy} r={3.5} fill="#f59e0b" />;
          }
          if (ent.kind === 'secondary') {
            return <circle key={`s_${idx}`} cx={cx} cy={cy} r={2.8} fill="#fb7185" />;
          }
          if (ent.kind === 'guardKo') {
            return <circle key={`gk_${idx}`} cx={cx} cy={cy} r={2.2} fill="#6b7280" />;
          }
          if (ent.kind === 'guard' || ent.kind === 'guardAlert') {
            return (
              <circle
                key={`g_${idx}`}
                cx={cx}
                cy={cy}
                r={2.8}
                fill={ent.kind === 'guardAlert' ? '#ef4444' : '#f87171'}
              />
            );
          }
          return (
            <circle
              key={`h_${idx}`}
              cx={cx}
              cy={cy}
              r={ent.kind === 'selectedHero' ? 3.8 : 2.8}
              fill={ent.kind === 'selectedHero' ? '#fde047' : '#34d399'}
              stroke="#19140f"
              strokeWidth={0.8}
            />
          );
        })}
      </svg>
    </div>
  );
}
