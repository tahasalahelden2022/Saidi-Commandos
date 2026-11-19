import * as THREE from 'three';
import type { HeroId } from '../types/game';

export type CharacterRole = HeroId | 'guard' | 'vip';

export interface RoleCharacterTextures {
  faceMap: THREE.CanvasTexture;
  bodyMap: THREE.CanvasTexture;
  armMap: THREE.CanvasTexture;
  legMap: THREE.CanvasTexture;
  turbanMap: THREE.CanvasTexture;
  leatherMap: THREE.CanvasTexture;
  undershirtMap: THREE.CanvasTexture;
  irisMap: THREE.CanvasTexture;
  clothBump: THREE.CanvasTexture;
  clothRoughness: THREE.CanvasTexture;
  armBump: THREE.CanvasTexture;
  skinBump: THREE.CanvasTexture;
  leatherBump: THREE.CanvasTexture;
  hairBump: THREE.CanvasTexture;
}

export interface RoleColors {
  skin: string;
  skinShadow: string;
  stubble: string;
  tunic: string;
  tunicDark: string;
  cuff: string;
  undershirt: string;
  belt: string;
  buckle: string;
  headgear: string;
  headgearFold: string;
  accent: string;
  boot: string;
  hair: string;
  sandals: boolean;
  sleeveStyle: 'threeQuarter' | 'rolled' | 'full';
  hasBuckle: boolean;
}

export const ROLE_COLORS: Record<CharacterRole, RoleColors> = {
  hamdan: {
    skin: '#cb8d5c',
    skinShadow: '#8e512b',
    stubble: 'rgba(26, 16, 10, 0.56)',
    tunic: '#3c5d8f',
    tunicDark: '#274066',
    cuff: '#4b6fa3',
    undershirt: '#f1e8d6',
    belt: '#66361b',
    buckle: '#cfd6db',
    headgear: '#f2ece0',
    headgearFold: '#c8bfb0',
    accent: '#efdfc2',
    boot: '#522e18',
    hair: '#17100b',
    sandals: true,
    sleeveStyle: 'rolled',
    hasBuckle: true,
  },
  salem: {
    skin: '#c28554',
    skinShadow: '#8a502b',
    stubble: 'rgba(34, 20, 12, 0.36)',
    tunic: '#6b7a58',
    tunicDark: '#4b573c',
    cuff: '#7e8f6a',
    undershirt: '#ebe1cc',
    belt: '#5e351c',
    buckle: '#bcc4ca',
    headgear: '#e6dbc2',
    headgearFold: '#baaa8b',
    accent: '#9aa694',
    boot: '#4b2b17',
    hair: '#150f0b',
    sandals: true,
    sleeveStyle: 'rolled',
    hasBuckle: false,
  },
  bakri: {
    skin: '#cc9364',
    skinShadow: '#955d36',
    stubble: 'rgba(38, 24, 14, 0.24)',
    tunic: '#702f3c',
    tunicDark: '#4d1e28',
    cuff: '#833c4b',
    undershirt: '#f2ead9',
    belt: '#5b331c',
    buckle: '#cbd2d7',
    headgear: '#e5ddc5',
    headgearFold: '#bdb398',
    accent: '#4a3325',
    boot: '#4d2e1a',
    hair: '#1a120d',
    sandals: true,
    sleeveStyle: 'full',
    hasBuckle: true,
  },
  guard: {
    skin: '#c58b5b',
    skinShadow: '#8e552e',
    stubble: 'rgba(32, 18, 10, 0.44)',
    tunic: '#9e3529',
    tunicDark: '#6f2017',
    cuff: '#b44436',
    undershirt: '#e5dac3',
    belt: '#2c1d13',
    buckle: '#deb048',
    headgear: '#8c1818',
    headgearFold: '#5f0f0f',
    accent: '#deb048',
    boot: '#1e1510',
    hair: '#19110c',
    sandals: false,
    sleeveStyle: 'rolled',
    hasBuckle: true,
  },
  vip: {
    skin: '#c69062',
    skinShadow: '#925e38',
    stubble: 'rgba(225, 218, 204, 0.46)',
    tunic: '#cbb896',
    tunicDark: '#a7936f',
    cuff: '#dac8a8',
    undershirt: '#f6f0e4',
    belt: '#61381e',
    buckle: '#c3cace',
    headgear: '#f4f0e7',
    headgearFold: '#cfc7ba',
    accent: '#4a3322',
    boot: '#4d2f1b',
    hair: '#dcd6ca',
    sandals: true,
    sleeveStyle: 'full',
    hasBuckle: false,
  },
};

function makeCanvas(size: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  return [canvas, ctx];
}

function toTex(
  canvas: HTMLCanvasElement,
  isColor: boolean,
  anisotropy: number,
  wrapS: THREE.Wrapping = THREE.RepeatWrapping,
  wrapT: THREE.Wrapping = THREE.ClampToEdgeWrapping,
): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  if (isColor) tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = wrapS;
  tex.wrapT = wrapT;
  tex.anisotropy = anisotropy;
  tex.needsUpdate = true;
  return tex;
}

function drawWovenGrain(ctx: CanvasRenderingContext2D, size: number, alpha = 0.055): void {
  // Fine Egyptian cotton/linen warp & weft slub weave
  ctx.fillStyle = `rgba(28,18,10,${alpha})`;
  for (let i = 0; i < size; i += 3) {
    ctx.fillRect(i, 0, 1, size);
    ctx.fillRect(0, i, size, 1);
  }
  ctx.fillStyle = `rgba(255,248,234,${alpha * 0.75})`;
  for (let i = 1; i < size; i += 6) {
    ctx.fillRect(i, 0, 1, size);
    ctx.fillRect(0, i + 1, size, 1);
  }
}

function buildFaceTexture(role: CharacterRole, anisotropy: number): THREE.CanvasTexture {
  const S = 1024;
  const [c, ctx] = makeCanvas(S);
  const pal = ROLE_COLORS[role];

  // Warm Pixar-style subsurface skin gradient
  const skinGrad = ctx.createLinearGradient(0, 0, 0, S);
  skinGrad.addColorStop(0, pal.skin);
  skinGrad.addColorStop(0.56, pal.skin);
  skinGrad.addColorStop(1, pal.skinShadow);
  ctx.fillStyle = skinGrad;
  ctx.fillRect(0, 0, S, S);

  // Subtle organic warm/cool skin mottling for realism
  let seed = 1337 + role.charCodeAt(0) * 97;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  for (let i = 0; i < 650; i++) {
    const px = rand() * S;
    const py = rand() * S;
    const rad = 6 + rand() * 20;
    ctx.fillStyle =
      i % 2 === 0 ? 'rgba(255, 224, 190, 0.032)' : 'rgba(120, 56, 26, 0.028)';
    ctx.beginPath();
    ctx.arc(px, py, rad, 0, Math.PI * 2);
    ctx.fill();
  }

  // Forehead subsurface highlight & glabella frown creases (y = 0.222 -> v = 0.700)
  const browY = S * (1 - 0.700);
  const foreGlow = ctx.createRadialGradient(S * 0.5, browY - 46, 12, S * 0.5, browY - 46, 130);
  foreGlow.addColorStop(0, 'rgba(255, 226, 192, 0.25)');
  foreGlow.addColorStop(1, 'rgba(255, 226, 192, 0)');
  ctx.fillStyle = foreGlow;
  ctx.beginPath();
  ctx.arc(S * 0.5, browY - 46, 130, 0, Math.PI * 2);
  ctx.fill();

  // Horizontal forehead expression creases + vertical glabella frown lines
  ctx.strokeStyle = 'rgba(104, 48, 22, 0.38)';
  ctx.lineWidth = 3.8;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(S * 0.43, browY - 28);
  ctx.quadraticCurveTo(S * 0.5, browY - 22, S * 0.57, browY - 28);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(88, 36, 16, 0.52)';
  ctx.lineWidth = 4.6;
  for (const fx of [-10, 10]) {
    ctx.beginPath();
    ctx.moveTo(S * 0.5 + fx, browY - 12);
    ctx.lineTo(S * 0.5 + fx * 1.15, browY + 26);
    ctx.stroke();
  }

  // Orbital eye sockets (y = 0.175 -> v = 0.585), cheekbones, nasolabial folds & sculpted sideburns
  for (const side of [-1, 1]) {
    const cx = S * (0.5 + side * 0.056);
    const eyeY = S * (1 - 0.585);

    // Deep orbital ambient occlusion recess
    const orb = ctx.createRadialGradient(cx, eyeY, 14, cx, eyeY, 58);
    orb.addColorStop(0, 'rgba(38, 16, 8, 0.64)');
    orb.addColorStop(0.62, 'rgba(88, 38, 18, 0.28)');
    orb.addColorStop(1, 'rgba(88, 38, 18, 0)');
    ctx.fillStyle = orb;
    ctx.beginPath();
    ctx.arc(cx, eyeY, 58, 0, Math.PI * 2);
    ctx.fill();

    // Lower-lid rim highlight
    ctx.strokeStyle = 'rgba(248, 210, 176, 0.38)';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(cx, eyeY + 10, 26, 0.22, Math.PI - 0.22);
    ctx.stroke();

    // Cheekbone warm subsurface blush
    const cheek = ctx.createRadialGradient(
      cx + side * 32,
      eyeY + 86,
      8,
      cx + side * 32,
      eyeY + 86,
      70,
    );
    cheek.addColorStop(0, 'rgba(208, 94, 58, 0.34)');
    cheek.addColorStop(1, 'rgba(208, 94, 58, 0)');
    ctx.fillStyle = cheek;
    ctx.beginPath();
    ctx.arc(cx + side * 32, eyeY + 86, 70, 0, Math.PI * 2);
    ctx.fill();

    // Sub-zygomatic hollow shadow
    const hollow = ctx.createRadialGradient(
      cx + side * 54,
      eyeY + 165,
      8,
      cx + side * 54,
      eyeY + 165,
      64,
    );
    hollow.addColorStop(0, 'rgba(80, 34, 16, 0.30)');
    hollow.addColorStop(1, 'rgba(80, 34, 16, 0)');
    ctx.fillStyle = hollow;
    ctx.beginPath();
    ctx.arc(cx + side * 54, eyeY + 165, 64, 0, Math.PI * 2);
    ctx.fill();

    // Nasolabial fold crease
    ctx.strokeStyle = 'rgba(104, 48, 24, 0.36)';
    ctx.lineWidth = 4.6;
    ctx.beginPath();
    ctx.moveTo(S * 0.5 + side * 30, eyeY + 96);
    ctx.quadraticCurveTo(S * 0.5 + side * 54, eyeY + 148, S * 0.5 + side * 46, eyeY + 206);
    ctx.stroke();

    // Crisp dark temple sideburns framing cheek & jaw (matches head turnaround)
    if (role !== 'vip') {
      const sbX = S * (0.5 + side * 0.194);
      const sbY = S * 0.455;
      ctx.save();
      ctx.fillStyle = pal.hair;
      ctx.globalAlpha = role === 'hamdan' || role === 'guard' ? 0.88 : 0.62;
      ctx.beginPath();
      ctx.moveTo(sbX - side * 14, sbY - 96);
      ctx.lineTo(sbX + side * 18, sbY - 96);
      ctx.lineTo(sbX + side * 16, sbY + 72);
      ctx.quadraticCurveTo(sbX, sbY + 96, sbX - side * 14, sbY + 56);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  // Sharp tailored 5-o'clock stubble contour across jaw, chin & cheek hollow
  if (role === 'hamdan' || role === 'guard' || role === 'salem' || role === 'bakri') {
    ctx.save();
    const jawYTop = S * 0.51;
    const jawYBot = S * 0.99;
    ctx.beginPath();
    // Clean sculpted jawline contour (sharp step down from sideburn across cheek hollow & below mouth)
    ctx.moveTo(S * 0.23, S * 0.515);
    ctx.lineTo(S * 0.305, S * 0.545);
    ctx.quadraticCurveTo(S * 0.36, S * 0.64, S * 0.435, S * 0.675);
    ctx.quadraticCurveTo(S * 0.5, S * 0.65, S * 0.565, S * 0.675);
    ctx.quadraticCurveTo(S * 0.64, S * 0.64, S * 0.695, S * 0.545);
    ctx.lineTo(S * 0.77, S * 0.515);
    ctx.lineTo(S * 0.82, jawYBot);
    ctx.lineTo(S * 0.18, jawYBot);
    ctx.closePath();
    ctx.clip();

    const stubG = ctx.createLinearGradient(0, jawYTop, 0, jawYBot);
    stubG.addColorStop(0, pal.stubble);
    stubG.addColorStop(0.75, pal.stubble);
    stubG.addColorStop(1, 'rgba(26, 16, 10, 0.32)');
    ctx.fillStyle = stubG;
    ctx.fillRect(S * 0.18, S * 0.50, S * 0.64, S * 0.49);

    // Fine follicle stipple dots for authentic stubble grain
    const stippleCount = role === 'hamdan' || role === 'guard' ? 3200 : 1600;
    ctx.fillStyle = role === 'hamdan' || role === 'guard' ? 'rgba(18, 10, 6, 0.45)' : 'rgba(26, 16, 10, 0.25)';
    for (let i = 0; i < stippleCount; i++) {
      const sx = S * (0.20 + rand() * 0.60);
      const sy = S * (0.52 + rand() * 0.45);
      ctx.fillRect(sx, sy, 1.8, 1.8);
    }
    ctx.restore();

    // Subtle soul-patch / under-lip stubble tuft
    ctx.fillStyle = pal.stubble;
    ctx.beginPath();
    ctx.ellipse(S * 0.5, S * (1 - 0.24), 19, 13, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Sculpted nose bridge highlight + warm tip subsurface + subtle alar AO (y = 0.118 -> v = 0.446)
  const noseY = S * (1 - 0.446);
  const bridgeGrad = ctx.createLinearGradient(0, S * (1 - 0.62), 0, noseY + 18);
  bridgeGrad.addColorStop(0, 'rgba(255, 228, 192, 0.12)');
  bridgeGrad.addColorStop(0.68, 'rgba(255, 228, 192, 0.36)');
  bridgeGrad.addColorStop(1, 'rgba(226, 118, 78, 0.34)');
  ctx.fillStyle = bridgeGrad;
  ctx.beginPath();
  ctx.ellipse(S * 0.5, noseY - 38, 16, 62, 0, 0, Math.PI * 2);
  ctx.fill();

  // Subtle alar crease & underside nostril recess AO (paired with 3D nostril apertures)
  ctx.fillStyle = 'rgba(58, 22, 10, 0.42)';
  ctx.beginPath();
  ctx.ellipse(S * 0.5 - 12, noseY + 28, 7.5, 4.8, 0.18, 0, Math.PI * 2);
  ctx.ellipse(S * 0.5 + 12, noseY + 28, 7.5, 4.8, -0.18, 0, Math.PI * 2);
  ctx.fill();

  // Warm sculpted lips & chin cleft shadow (y = 0.054 -> v = 0.290)
  const mouthY = S * (1 - 0.290);
  ctx.fillStyle = 'rgba(136, 62, 42, 0.60)';
  ctx.beginPath();
  ctx.ellipse(S * 0.5, mouthY - 5, 34, 8.6, 0, Math.PI, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(178, 92, 66, 0.55)';
  ctx.beginPath();
  ctx.ellipse(S * 0.5, mouthY + 8, 28, 9.4, 0, 0, Math.PI);
  ctx.fill();

  ctx.strokeStyle = 'rgba(72, 28, 16, 0.85)';
  ctx.lineWidth = 5.4;
  ctx.beginPath();
  ctx.moveTo(S * 0.5 - 34, mouthY);
  ctx.quadraticCurveTo(S * 0.5, mouthY + 5, S * 0.5 + 34, mouthY);
  ctx.stroke();

  // Labiomental crease + subtle chin cleft vertical line (y = -0.022 -> v = 0.105)
  const chinShad = ctx.createRadialGradient(S * 0.5, mouthY + 56, 4, S * 0.5, mouthY + 56, 36);
  chinShad.addColorStop(0, 'rgba(78, 34, 16, 0.38)');
  chinShad.addColorStop(1, 'rgba(78, 34, 16, 0)');
  ctx.fillStyle = chinShad;
  ctx.beginPath();
  ctx.arc(S * 0.5, mouthY + 56, 36, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = 'rgba(84, 38, 18, 0.34)';
  ctx.lineWidth = 3.2;
  ctx.beginPath();
  ctx.moveTo(S * 0.5, S * (1 - 0.125));
  ctx.lineTo(S * 0.5, S * (1 - 0.085));
  ctx.stroke();

  // Ear concha AO shading
  for (const ex of [S * 0.255, S * 0.745]) {
    const earG = ctx.createRadialGradient(ex, S * 0.512, 4, ex, S * 0.512, 44);
    earG.addColorStop(0, 'rgba(78, 34, 16, 0.52)');
    earG.addColorStop(0.65, 'rgba(128, 66, 36, 0.2)');
    earG.addColorStop(1, 'rgba(98, 46, 24, 0)');
    ctx.fillStyle = earG;
    ctx.beginPath();
    ctx.arc(ex, S * 0.512, 44, 0, Math.PI * 2);
    ctx.fill();
  }

  // Submental under-jaw & rear occipital neck shadow
  const nape = ctx.createLinearGradient(0, S * 0.72, 0, S);
  nape.addColorStop(0, 'rgba(72, 32, 14, 0)');
  nape.addColorStop(1, 'rgba(64, 26, 12, 0.45)');
  ctx.fillStyle = nape;
  ctx.fillRect(0, S * 0.72, S, S * 0.28);

  return toTex(c, true, anisotropy);
}

function buildBodyTexture(role: CharacterRole, anisotropy: number): THREE.CanvasTexture {
  const S = 1024;
  const [c, ctx] = makeCanvas(S);
  const pal = ROLE_COLORS[role];

  const bodyGrad = ctx.createLinearGradient(0, 0, 0, S);
  bodyGrad.addColorStop(0, pal.tunic);
  bodyGrad.addColorStop(0.68, pal.tunic);
  bodyGrad.addColorStop(0.95, pal.tunicDark);
  bodyGrad.addColorStop(1, pal.tunicDark);
  ctx.fillStyle = bodyGrad;
  ctx.fillRect(0, 0, S, S);

  // Fine woven cotton/linen slub micro-texture
  drawWovenGrain(ctx, S, 0.045);

  let seed = 404 + role.charCodeAt(0) * 31;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  for (let i = 0; i < 420; i++) {
    const sx = rand() * S;
    const sy = S * 0.1 + rand() * S * 0.88;
    const horizontal = i % 3 !== 0;
    ctx.fillStyle = i % 2 === 0 ? 'rgba(255, 244, 224, 0.038)' : 'rgba(22, 14, 8, 0.036)';
    if (horizontal) ctx.fillRect(sx, sy, 6 + rand() * 28, 1.5);
    else ctx.fillRect(sx, sy, 1.5, 8 + rand() * 26);
  }

  if (role === 'guard') {
    const pleatStartY = S * 0.595;
    for (let i = 0; i < 14; i++) {
      const fx = (i / 14) * S;
      const fg = ctx.createLinearGradient(fx, 0, fx + S / 14, 0);
      fg.addColorStop(0, 'rgba(0,0,0,0.18)');
      fg.addColorStop(0.45, 'rgba(255,245,220,0.06)');
      fg.addColorStop(1, 'rgba(0,0,0,0.16)');
      ctx.fillStyle = fg;
      ctx.fillRect(fx, pleatStartY, S / 14, S - pleatStartY);
    }
  } else {
    // Broad soft natural fabric drape highlights/AO (only 5 broad folds, smooth vertical fade near lower skirt)
    const foldCenters = [0.16, 0.34, 0.5, 0.66, 0.84];
    for (const fc of foldCenters) {
      const cx = fc * S;
      const foldG = ctx.createRadialGradient(cx, S * 0.82, S * 0.015, cx, S * 0.82, S * 0.11);
      foldG.addColorStop(0, 'rgba(255, 245, 225, 0.065)');
      foldG.addColorStop(0.55, 'rgba(0, 0, 0, 0.045)');
      foldG.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = foldG;
      ctx.fillRect(cx - S * 0.12, S * 0.45, S * 0.24, S * 0.55);
    }

    // Tailored side seams (left/right flanks at u = 0.25 and u = 0.75) + soft underarm AO
    for (const uSide of [0.25, 0.75]) {
      const sx = S * uSide;
      const underarmAO = ctx.createRadialGradient(sx, S * 0.24, 6, sx, S * 0.24, S * 0.075);
      underarmAO.addColorStop(0, 'rgba(18, 10, 6, 0.18)');
      underarmAO.addColorStop(1, 'rgba(18, 10, 6, 0)');
      ctx.fillStyle = underarmAO;
      ctx.beginPath();
      ctx.arc(sx, S * 0.24, S * 0.075, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(20, 12, 8, 0.16)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(sx, S * 0.25);
      ctx.lineTo(sx, S * 0.975);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  // Salem's subtle weathered patches & lower hem dust
  if (role === 'salem') {
    const patches = [
      { x: 416, y: 720, w: 58, h: 46 },
      { x: 584, y: 460, w: 46, h: 38 },
    ];
    for (const p of patches) {
      ctx.fillStyle = 'rgba(72, 78, 56, 0.42)';
      ctx.fillRect(p.x, p.y, p.w, p.h);
      ctx.strokeStyle = 'rgba(28, 24, 16, 0.34)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(p.x + 2, p.y + 2, p.w - 4, p.h - 4);
      ctx.setLineDash([]);
    }
    const dust = ctx.createLinearGradient(0, S * 0.82, 0, S);
    dust.addColorStop(0, 'rgba(138, 114, 78, 0)');
    dust.addColorStop(1, 'rgba(138, 114, 78, 0.26)');
    ctx.fillStyle = dust;
    ctx.fillRect(0, S * 0.82, S, S * 0.18);
  }

  // Clean tailored bottom hem band & double stitching
  ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
  ctx.fillRect(0, S * 0.964, S, S * 0.036);
  ctx.strokeStyle = 'rgba(255, 242, 218, 0.22)';
  ctx.lineWidth = 2.2;
  ctx.setLineDash([8, 5]);
  ctx.beginPath();
  ctx.moveTo(0, S * 0.966);
  ctx.lineTo(S, S * 0.966);
  ctx.stroke();
  ctx.setLineDash([]);

  // Anatomical neck & collar scoop curve (matches natural round Egyptian collar sitting cleanly on traps)
  const neckV = role === 'guard' ? 0.877 : 0.905;
  const neckBottomY = S * (1 - neckV);
  const drawNeckMask = () => {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(S, 0);
    ctx.lineTo(S, neckBottomY);
    if (role === 'guard') {
      ctx.lineTo(0, neckBottomY);
    } else {
      ctx.bezierCurveTo(
        S * 0.72,
        neckBottomY,
        S * 0.62,
        neckBottomY + S * 0.022,
        S * 0.5,
        neckBottomY + S * 0.024,
      );
      ctx.bezierCurveTo(
        S * 0.38,
        neckBottomY + S * 0.022,
        S * 0.28,
        neckBottomY,
        0,
        neckBottomY,
      );
    }
    ctx.closePath();
  };

  ctx.save();
  drawNeckMask();
  ctx.clip();
  const neckShad = ctx.createLinearGradient(0, 0, 0, neckBottomY + S * 0.028);
  neckShad.addColorStop(0, pal.skinShadow);
  neckShad.addColorStop(0.55, pal.skin);
  neckShad.addColorStop(1, pal.skinShadow);
  ctx.fillStyle = neckShad;
  ctx.fillRect(0, 0, S, neckBottomY + S * 0.03);

  // V-shaped sternocleidomastoid tendons + throat pit + rear nuchal furrow
  ctx.strokeStyle = 'rgba(78, 34, 16, 0.36)';
  ctx.lineWidth = 7;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(S * 0.5 + side * 96, 8);
    ctx.lineTo(S * 0.5 + side * 22, neckBottomY + 8);
    ctx.stroke();
  }
  const pit = ctx.createRadialGradient(
    S * 0.5,
    neckBottomY + 6,
    4,
    S * 0.5,
    neckBottomY + 6,
    28,
  );
  pit.addColorStop(0, 'rgba(64, 28, 12, 0.42)');
  pit.addColorStop(1, 'rgba(64, 28, 12, 0)');
  ctx.fillStyle = pit;
  ctx.beginPath();
  ctx.arc(S * 0.5, neckBottomY + 6, 28, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(76, 34, 16, 0.34)';
  ctx.fillRect(0, 0, 24, neckBottomY);
  ctx.fillRect(S - 24, 0, 24, neckBottomY);
  ctx.restore();

  // Clean stitched crew/band collar seam + narrow vertical U-placket slit on chest
  if (role !== 'guard') {
    const collarFrontY = neckBottomY + S * 0.024;
    const slitBottomY = neckBottomY + S * 0.148;
    const slitHalfW = 14;

    // Collar rim fabric trim + subtle shadow beneath collar
    ctx.strokeStyle = 'rgba(18, 10, 6, 0.24)';
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.moveTo(0, neckBottomY + 2);
    ctx.bezierCurveTo(S * 0.28, neckBottomY + 2, S * 0.38, collarFrontY + 2, S * 0.5, collarFrontY + 2);
    ctx.bezierCurveTo(S * 0.62, collarFrontY + 2, S * 0.72, neckBottomY + 2, S, neckBottomY + 2);
    ctx.stroke();

    ctx.strokeStyle = pal.cuff;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(0, neckBottomY);
    ctx.bezierCurveTo(S * 0.28, neckBottomY, S * 0.38, collarFrontY, S * 0.5, collarFrontY);
    ctx.bezierCurveTo(S * 0.62, collarFrontY, S * 0.72, neckBottomY, S, neckBottomY);
    ctx.stroke();

    // Inner undershirt strip recessed inside narrow vertical U-placket
    ctx.fillStyle = pal.undershirt;
    ctx.beginPath();
    ctx.moveTo(S * 0.5 - slitHalfW, collarFrontY - 4);
    ctx.lineTo(S * 0.5 + slitHalfW, collarFrontY - 4);
    ctx.lineTo(S * 0.5 + slitHalfW * 0.75, slitBottomY - 12);
    ctx.quadraticCurveTo(S * 0.5, slitBottomY + 4, S * 0.5 - slitHalfW * 0.75, slitBottomY - 12);
    ctx.closePath();
    ctx.fill();

    // Crisp outer U-placket trim + subtle topstitching around the vertical chest slit
    ctx.strokeStyle = pal.tunicDark;
    ctx.lineWidth = 10;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(S * 0.5 - slitHalfW - 4, collarFrontY - 2);
    ctx.lineTo(S * 0.5 - slitHalfW * 0.75 - 3, slitBottomY - 10);
    ctx.quadraticCurveTo(S * 0.5, slitBottomY + 12, S * 0.5 + slitHalfW * 0.75 + 3, slitBottomY - 10);
    ctx.lineTo(S * 0.5 + slitHalfW + 4, collarFrontY - 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 245, 224, 0.24)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(S * 0.5 - slitHalfW - 9, collarFrontY + 2);
    ctx.lineTo(S * 0.5 - slitHalfW * 0.75 - 8, slitBottomY - 8);
    ctx.quadraticCurveTo(S * 0.5, slitBottomY + 18, S * 0.5 + slitHalfW * 0.75 + 8, slitBottomY - 8);
    ctx.lineTo(S * 0.5 + slitHalfW + 9, collarFrontY + 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  if (role === 'guard') {
    const beltCenterV = 0.403;
    const beltCenterY = S * (1 - beltCenterV);

    ctx.fillStyle = pal.tunicDark;
    ctx.fillRect(S * 0.5 - 20, neckBottomY, 40, beltCenterY - neckBottomY + 68);
    ctx.fillRect(S * 0.5 - 112, neckBottomY + 68, 68, 80);
    ctx.fillRect(S * 0.5 + 44, neckBottomY + 68, 68, 80);
    ctx.fillStyle = pal.buckle;
    for (let b = 0; b < 4; b++) {
      ctx.beginPath();
      ctx.arc(S * 0.5, neckBottomY + 52 + b * 80, 9, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = pal.belt;
    ctx.lineWidth = 44;
    ctx.beginPath();
    ctx.moveTo(S * 0.62, neckBottomY);
    ctx.lineTo(S * 0.38, beltCenterY);
    ctx.stroke();

    // Subtle waist shadow beneath the 3D sculpted belt on military uniform
    const beltH = S * 0.088;
    const beltTop = beltCenterY - beltH * 0.5;
    const waistShadow = ctx.createLinearGradient(0, beltTop - 20, 0, beltTop + beltH + 28);
    waistShadow.addColorStop(0, 'rgba(0,0,0,0)');
    waistShadow.addColorStop(0.25, 'rgba(0,0,0,0.28)');
    waistShadow.addColorStop(0.75, 'rgba(0,0,0,0.32)');
    waistShadow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = waistShadow;
    ctx.fillRect(0, beltTop - 20, S, beltH + 48);
  }

  return toTex(c, true, anisotropy, THREE.RepeatWrapping);
}

function buildArmTexture(role: CharacterRole, anisotropy: number): THREE.CanvasTexture {
  const S = 512;
  const [c, ctx] = makeCanvas(S);
  const pal = ROLE_COLORS[role];

  if (pal.sleeveStyle === 'rolled' || pal.sleeveStyle === 'threeQuarter') {
    // Upper sleeve (0..226), sculpted folded fabric cuff (226..278), muscular bare forearm & wrist (278..512)
    ctx.fillStyle = pal.tunic;
    ctx.fillRect(0, 0, S, 230);
    drawWovenGrain(ctx, S, 0.048);

    // Soft elbow crease shadow above cuff
    const cuffGrad = ctx.createLinearGradient(0, 220, 0, 282);
    cuffGrad.addColorStop(0, pal.tunicDark);
    cuffGrad.addColorStop(0.32, pal.cuff);
    cuffGrad.addColorStop(0.68, pal.tunic);
    cuffGrad.addColorStop(0.88, pal.tunicDark);
    cuffGrad.addColorStop(1, 'rgba(38, 22, 12, 0.85)');
    ctx.fillStyle = cuffGrad;
    ctx.fillRect(0, 220, S, 62);

    const skinG = ctx.createLinearGradient(0, 282, 0, S);
    skinG.addColorStop(0, pal.skinShadow);
    skinG.addColorStop(0.14, pal.skin);
    skinG.addColorStop(0.86, pal.skin);
    skinG.addColorStop(1, pal.skin);
    ctx.fillStyle = skinG;
    ctx.fillRect(0, 282, S, S - 282);

    // Anatomical brachioradialis & flexor muscle shading
    for (let m = 0; m < 3; m++) {
      const mx = 60 + m * 144;
      const mGrad = ctx.createLinearGradient(mx, 288, mx + 92, S - 28);
      mGrad.addColorStop(0, 'rgba(84, 38, 16, 0.24)');
      mGrad.addColorStop(0.5, 'rgba(255, 222, 186, 0.14)');
      mGrad.addColorStop(1, 'rgba(84, 38, 16, 0.2)');
      ctx.fillStyle = mGrad;
      ctx.fillRect(mx, 288, 78, S - 316);
    }

    if (role === 'hamdan' || role === 'guard') {
      ctx.strokeStyle = 'rgba(42, 22, 12, 0.17)';
      ctx.lineWidth = 1.6;
      let s = 91;
      for (let h = 0; h < 180; h++) {
        s = (s * 16807) % 2147483647;
        const hx = ((s % 1000) / 1000) * S;
        s = (s * 16807) % 2147483647;
        const hy = 294 + ((s % 1000) / 1000) * (S - 335);
        ctx.beginPath();
        ctx.moveTo(hx, hy);
        ctx.lineTo(hx + 3, hy + 10);
        ctx.stroke();
      }
    }
  } else {
    // Full tailored Egyptian galabeya sleeve down to wrist (0..422) matching torso linen
    ctx.fillStyle = pal.tunic;
    ctx.fillRect(0, 0, S, 422);
    drawWovenGrain(ctx, S, 0.048);

    // Subtle elbow fabric drape fold shading
    const elbowShade = ctx.createLinearGradient(0, 200, 0, 270);
    elbowShade.addColorStop(0, 'rgba(0,0,0,0)');
    elbowShade.addColorStop(0.5, 'rgba(0,0,0,0.08)');
    elbowShade.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = elbowShade;
    ctx.fillRect(0, 200, S, 70);

    // Crisp tailored sleeve cuff band & topstitching + wrist shadow
    const cuffG = ctx.createLinearGradient(0, 392, 0, 424);
    cuffG.addColorStop(0, pal.tunicDark);
    cuffG.addColorStop(0.25, pal.cuff);
    cuffG.addColorStop(0.85, pal.tunicDark);
    cuffG.addColorStop(1, 'rgba(40, 24, 14, 0.85)');
    ctx.fillStyle = cuffG;
    ctx.fillRect(0, 392, S, 32);

    ctx.strokeStyle = 'rgba(255, 244, 220, 0.24)';
    ctx.lineWidth = 1.6;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(0, 396);
    ctx.lineTo(S, 396);
    ctx.stroke();
    ctx.setLineDash([]);

    const wristSkin = ctx.createLinearGradient(0, 422, 0, S);
    wristSkin.addColorStop(0, pal.skinShadow);
    wristSkin.addColorStop(0.35, pal.skin);
    wristSkin.addColorStop(1, pal.skin);
    ctx.fillStyle = wristSkin;
    ctx.fillRect(0, 422, S, S - 422);
  }

  // Subtle wrist tendon shading tapering cleanly before palm seam
  ctx.fillStyle = 'rgba(88, 42, 18, 0.14)';
  for (let f = 0; f < 4; f++) {
    ctx.fillRect(f * (S / 4) + 28, S - 52, 4, 34);
  }

  return toTex(c, true, anisotropy, THREE.RepeatWrapping);
}

function buildLegTexture(role: CharacterRole, anisotropy: number): THREE.CanvasTexture {
  const S = 256;
  const [c, ctx] = makeCanvas(S);
  const pal = ROLE_COLORS[role];

  if (pal.sandals) {
    ctx.fillStyle = pal.skin;
    ctx.fillRect(0, 0, S, S);
    // Subtle ankle bone & calf shading
    const calfG = ctx.createLinearGradient(0, 0, S, 0);
    calfG.addColorStop(0, 'rgba(92,42,18,0.18)');
    calfG.addColorStop(0.5, 'rgba(255,222,186,0.12)');
    calfG.addColorStop(1, 'rgba(92,42,18,0.18)');
    ctx.fillStyle = calfG;
    ctx.fillRect(0, 0, S, S * 0.72);
    ctx.fillStyle = pal.boot;
    ctx.fillRect(0, 228, S, 28);
  } else {
    ctx.fillStyle = pal.tunicDark;
    ctx.fillRect(0, 0, S, 130);
    ctx.fillStyle = pal.boot;
    ctx.fillRect(0, 130, S, S - 130);
    ctx.fillStyle = '#140e0a';
    ctx.fillRect(0, 228, S, 28);
  }

  return toTex(c, true, anisotropy, THREE.RepeatWrapping);
}

function buildTurbanTexture(role: CharacterRole, anisotropy: number): THREE.CanvasTexture {
  const S = 512;
  const [c, ctx] = makeCanvas(S);
  const pal = ROLE_COLORS[role];

  ctx.fillStyle = pal.headgear;
  ctx.fillRect(0, 0, S, S);
  drawWovenGrain(ctx, S, 0.085);

  // Subtle directional woven rib lines & crease AO between wraps
  ctx.strokeStyle = pal.headgearFold;
  ctx.lineWidth = 7;
  for (let i = -S; i < S * 2; i += 64) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + S * 0.75, S);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(i + S * 0.75, 0);
    ctx.lineTo(i, S);
    ctx.stroke();
  }

  // Fine thread highlights
  ctx.strokeStyle = 'rgba(255, 250, 240, 0.18)';
  ctx.lineWidth = 2;
  for (let i = -S + 18; i < S * 2; i += 64) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + S * 0.75, S);
    ctx.stroke();
  }

  return toTex(c, true, anisotropy, THREE.RepeatWrapping, THREE.RepeatWrapping);
}

function buildLeatherTexture(role: CharacterRole, anisotropy: number): THREE.CanvasTexture {
  const S = 256;
  const [c, ctx] = makeCanvas(S);
  const pal = ROLE_COLORS[role];

  const grad = ctx.createLinearGradient(0, 0, 0, S);
  grad.addColorStop(0, '#2a150a');
  grad.addColorStop(0.14, pal.belt);
  grad.addColorStop(0.52, pal.belt);
  grad.addColorStop(0.86, '#381d0e');
  grad.addColorStop(1, '#1e0d05');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, S, S);

  // Subtle leather grain speckles
  let s = 777;
  for (let i = 0; i < 420; i++) {
    s = (s * 16807) % 2147483647;
    const x = (s % 256);
    s = (s * 16807) % 2147483647;
    const y = (s % 256);
    ctx.fillStyle = i % 2 === 0 ? 'rgba(0,0,0,0.14)' : 'rgba(225,175,125,0.08)';
    ctx.fillRect(x, y, 2, 2);
  }

  // Crisp double edge stitching lines
  ctx.strokeStyle = 'rgba(224, 180, 126, 0.56)';
  ctx.lineWidth = 3;
  ctx.setLineDash([7, 5]);
  ctx.beginPath();
  ctx.moveTo(0, 26);
  ctx.lineTo(S, 26);
  ctx.moveTo(0, S - 26);
  ctx.lineTo(S, S - 26);
  ctx.stroke();
  ctx.setLineDash([]);

  return toTex(c, true, anisotropy, THREE.RepeatWrapping, THREE.RepeatWrapping);
}

function buildUndershirtTexture(role: CharacterRole, anisotropy: number): THREE.CanvasTexture {
  const S = 128;
  const [c, ctx] = makeCanvas(S);
  ctx.fillStyle = ROLE_COLORS[role].undershirt;
  ctx.fillRect(0, 0, S, S);
  drawWovenGrain(ctx, S, 0.06);
  return toTex(c, true, anisotropy, THREE.RepeatWrapping, THREE.RepeatWrapping);
}

function buildEyeIrisTexture(anisotropy: number): THREE.CanvasTexture {
  const S = 256;
  const [c, ctx] = makeCanvas(S);
  // Radial warm chestnut-amber iris with dark limbal outer ring & radial fibers
  const cx = S * 0.5;
  const cy = S * 0.5;
  ctx.fillStyle = '#3b1c0b';
  ctx.fillRect(0, 0, S, S);

  const grad = ctx.createRadialGradient(cx, cy, 18, cx, cy, S * 0.48);
  grad.addColorStop(0, '#2a1207');
  grad.addColorStop(0.28, '#6a3816');
  grad.addColorStop(0.66, '#4d240d');
  grad.addColorStop(0.88, '#1e0d05');
  grad.addColorStop(1, '#140803');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, S * 0.48, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = 'rgba(182, 114, 54, 0.34)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 42; i++) {
    const a = (i / 42) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * 28, cy + Math.sin(a) * 28);
    ctx.lineTo(cx + Math.cos(a) * 98, cy + Math.sin(a) * 98);
    ctx.stroke();
  }

  return toTex(c, true, anisotropy, THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping);
}

function buildClothBumpTexture(anisotropy: number): THREE.CanvasTexture {
  const S = 512;
  const [c, ctx] = makeCanvas(S);
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, S, S);
  // Crisp high-density Egyptian linen warp & weft weave
  for (let i = 0; i < S; i += 3) {
    ctx.fillStyle = i % 6 === 0 ? 'rgba(176,176,176,0.34)' : 'rgba(92,92,92,0.30)';
    ctx.fillRect(i, 0, 1.5, S);
    ctx.fillRect(0, i, S, 1.5);
  }
  let s = 313;
  for (let i = 0; i < 2400; i++) {
    s = (s * 16807) % 2147483647;
    const x = s % S;
    s = (s * 16807) % 2147483647;
    const y = s % S;
    ctx.fillStyle = i % 2 === 0 ? 'rgba(165,165,165,0.16)' : 'rgba(95,95,95,0.16)';
    if (i % 3 === 0) ctx.fillRect(x, y, 10, 1.5);
    else ctx.fillRect(x, y, 1.5, 10);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(5, 5);
  tex.anisotropy = anisotropy;
  tex.needsUpdate = true;
  return tex;
}

function buildClothRoughnessTexture(anisotropy: number): THREE.CanvasTexture {
  const S = 512;
  const [c, ctx] = makeCanvas(S);
  ctx.fillStyle = '#e2e2e2';
  ctx.fillRect(0, 0, S, S);
  for (let i = 0; i < S; i += 4) {
    ctx.fillStyle = i % 8 === 0 ? 'rgba(255,255,255,0.16)' : 'rgba(180,180,180,0.18)';
    ctx.fillRect(i, 0, 2, S);
    ctx.fillRect(0, i, S, 2);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(5, 5);
  tex.anisotropy = anisotropy;
  tex.needsUpdate = true;
  return tex;
}

function buildArmBumpTexture(role: CharacterRole, anisotropy: number): THREE.CanvasTexture {
  const S = 512;
  const [c, ctx] = makeCanvas(S);
  const pal = ROLE_COLORS[role];
  const sleeveCutoffY = pal.sleeveStyle === 'full' ? 422 : 282;

  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, S, S);

  // Linen weave bump on upper sleeve zone
  for (let i = 0; i < S; i += 4) {
    ctx.fillStyle = i % 8 === 0 ? 'rgba(176,176,176,0.34)' : 'rgba(92,92,92,0.30)';
    ctx.fillRect(i, 0, 2, sleeveCutoffY);
  }
  for (let j = 0; j < sleeveCutoffY; j += 4) {
    ctx.fillStyle = j % 8 === 0 ? 'rgba(176,176,176,0.34)' : 'rgba(92,92,92,0.30)';
    ctx.fillRect(0, j, S, 2);
  }

  // Fine skin pore bump on bare forearm / wrist
  let s = 515;
  for (let i = 0; i < 1200; i++) {
    s = (s * 16807) % 2147483647;
    const x = s % S;
    s = (s * 16807) % 2147483647;
    const y = sleeveCutoffY + (s % Math.max(16, S - sleeveCutoffY));
    ctx.fillStyle = i % 2 === 0 ? 'rgba(155,155,155,0.22)' : 'rgba(105,105,105,0.22)';
    ctx.fillRect(x, y, 2, 2);
  }

  return toTex(c, false, anisotropy, THREE.RepeatWrapping, THREE.ClampToEdgeWrapping);
}

function buildSkinBumpTexture(anisotropy: number): THREE.CanvasTexture {
  const S = 256;
  const [c, ctx] = makeCanvas(S);
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, S, S);
  let s = 515;
  for (let i = 0; i < 1600; i++) {
    s = (s * 16807) % 2147483647;
    const x = s % S;
    s = (s * 16807) % 2147483647;
    const y = s % S;
    ctx.fillStyle = i % 2 === 0 ? 'rgba(165,165,165,0.22)' : 'rgba(95,95,95,0.22)';
    ctx.fillRect(x, y, 2, 2);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  tex.anisotropy = anisotropy;
  tex.needsUpdate = true;
  return tex;
}

function buildLeatherBumpTexture(anisotropy: number): THREE.CanvasTexture {
  const S = 256;
  const [c, ctx] = makeCanvas(S);
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, S, S);
  let s = 909;
  for (let i = 0; i < 1100; i++) {
    s = (s * 16807) % 2147483647;
    const x = s % S;
    s = (s * 16807) % 2147483647;
    const y = s % S;
    ctx.fillStyle = i % 2 === 0 ? 'rgba(180,180,180,0.34)' : 'rgba(70,70,70,0.34)';
    ctx.fillRect(x, y, 3, 2);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = anisotropy;
  tex.needsUpdate = true;
  return tex;
}

function buildHairBumpTexture(anisotropy: number): THREE.CanvasTexture {
  const S = 256;
  const [c, ctx] = makeCanvas(S);
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, S, S);
  for (let i = 0; i < S; i += 4) {
    ctx.fillStyle = i % 8 === 0 ? 'rgba(215,215,215,0.45)' : 'rgba(48,48,48,0.45)';
    ctx.fillRect(i, 0, 2, S);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 3);
  tex.anisotropy = anisotropy;
  tex.needsUpdate = true;
  return tex;
}

const roleCache = new Map<CharacterRole, RoleCharacterTextures>();
let sharedClothBump: THREE.CanvasTexture | null = null;
let sharedClothRoughness: THREE.CanvasTexture | null = null;
let sharedSkinBump: THREE.CanvasTexture | null = null;
let sharedLeatherBump: THREE.CanvasTexture | null = null;
let sharedHairBump: THREE.CanvasTexture | null = null;
let sharedIrisMap: THREE.CanvasTexture | null = null;

export function getRoleCharacterTextures(
  role: CharacterRole,
  anisotropy = 4,
): RoleCharacterTextures {
  const existing = roleCache.get(role);
  if (existing) return existing;

  if (!sharedClothBump) sharedClothBump = buildClothBumpTexture(anisotropy);
  if (!sharedClothRoughness) sharedClothRoughness = buildClothRoughnessTexture(anisotropy);
  if (!sharedSkinBump) sharedSkinBump = buildSkinBumpTexture(anisotropy);
  if (!sharedLeatherBump) sharedLeatherBump = buildLeatherBumpTexture(anisotropy);
  if (!sharedHairBump) sharedHairBump = buildHairBumpTexture(anisotropy);
  if (!sharedIrisMap) sharedIrisMap = buildEyeIrisTexture(anisotropy);

  const bundle: RoleCharacterTextures = {
    faceMap: buildFaceTexture(role, anisotropy),
    bodyMap: buildBodyTexture(role, anisotropy),
    armMap: buildArmTexture(role, anisotropy),
    legMap: buildLegTexture(role, anisotropy),
    turbanMap: buildTurbanTexture(role, anisotropy),
    leatherMap: buildLeatherTexture(role, anisotropy),
    undershirtMap: buildUndershirtTexture(role, anisotropy),
    irisMap: sharedIrisMap,
    clothBump: sharedClothBump,
    clothRoughness: sharedClothRoughness,
    armBump: buildArmBumpTexture(role, anisotropy),
    skinBump: sharedSkinBump,
    leatherBump: sharedLeatherBump,
    hairBump: sharedHairBump,
  };
  roleCache.set(role, bundle);
  return bundle;
}
