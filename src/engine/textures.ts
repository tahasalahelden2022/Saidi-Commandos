import * as THREE from 'three';

export interface ProceduralTextureSet {
  sandGround: THREE.CanvasTexture;
  sandBump: THREE.CanvasTexture;
  alleyCobble: THREE.CanvasTexture;
  alleyBump: THREE.CanvasTexture;
  mudBrick: THREE.CanvasTexture;
  mudBump: THREE.CanvasTexture;
  stoneAshlar: THREE.CanvasTexture;
  stoneBump: THREE.CanvasTexture;
  mashrabiyaWindow: THREE.CanvasTexture;
  carvedDoor: THREE.CanvasTexture;
  saidiFrieze: THREE.CanvasTexture;
  woodPlank: THREE.CanvasTexture;
  crateTealWood: THREE.CanvasTexture;
  palmBark: THREE.CanvasTexture;
  palmFrond: THREE.CanvasTexture;
  awningStripe: THREE.CanvasTexture;
  benchStripe: THREE.CanvasTexture;
  kilimRug: THREE.CanvasTexture;
  wovenClothBump: THREE.CanvasTexture;
  contactShadow: THREE.CanvasTexture;
  selectionRing: THREE.CanvasTexture;
  dispose: () => void;
}

function createCanvas(size: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  return [canvas, ctx];
}

function finalizeTexture(
  canvas: HTMLCanvasElement,
  maxAnisotropy: number,
  isColor: boolean,
  repeatX = 1,
  repeatY = 1,
): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  if (isColor) {
    tex.colorSpace = THREE.SRGBColorSpace;
  }
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.anisotropy = maxAnisotropy;
  tex.needsUpdate = true;
  return tex;
}

export function createProceduralTextures(maxAnisotropy: number): ProceduralTextureSet {
  // 1. Desert Sand + Matching Wind-Ripple & Gravel Bump Map
  const [sandC, sandCtx] = createCanvas(512);
  const [sandBC, sandBCtx] = createCanvas(512);
  sandCtx.fillStyle = '#d7b786';
  sandCtx.fillRect(0, 0, 512, 512);
  sandBCtx.fillStyle = '#808080';
  sandBCtx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 18; i++) {
    const gx = Math.random() * 512;
    const gy = Math.random() * 512;
    const gr = 35 + Math.random() * 70;
    const pGrad = sandCtx.createRadialGradient(gx, gy, 4, gx, gy, gr);
    pGrad.addColorStop(0, i % 2 === 0 ? 'rgba(182, 136, 82, 0.16)' : 'rgba(238, 214, 174, 0.16)');
    pGrad.addColorStop(1, 'rgba(0,0,0,0)');
    sandCtx.fillStyle = pGrad;
    sandCtx.beginPath();
    sandCtx.arc(gx, gy, gr, 0, Math.PI * 2);
    sandCtx.fill();
  }

  for (let y = 0; y < 512; y += 14) {
    sandCtx.strokeStyle = 'rgba(155, 114, 64, 0.16)';
    sandCtx.lineWidth = 3;
    sandBCtx.strokeStyle = '#ababab';
    sandBCtx.lineWidth = 4;
    sandCtx.beginPath();
    sandBCtx.beginPath();
    for (let x = 0; x <= 512; x += 24) {
      const wy = y + Math.sin((x / 512) * Math.PI * 4 + y * 0.04) * 3.8;
      if (x === 0) {
        sandCtx.moveTo(x, wy);
        sandBCtx.moveTo(x, wy);
      } else {
        sandCtx.lineTo(x, wy);
        sandBCtx.lineTo(x, wy);
      }
    }
    sandCtx.stroke();
    sandBCtx.stroke();
  }

  for (let i = 0; i < 5200; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const r = 0.8 + Math.random() * 2.6;
    sandCtx.fillStyle =
      Math.random() > 0.48 ? 'rgba(176, 132, 82, 0.24)' : 'rgba(244, 222, 182, 0.22)';
    sandCtx.beginPath();
    sandCtx.arc(x, y, r, 0, Math.PI * 2);
    sandCtx.fill();

    sandBCtx.fillStyle = Math.random() > 0.5 ? 'rgba(180,180,180,0.24)' : 'rgba(84,84,84,0.24)';
    sandBCtx.fillRect(x, y, 2, 2);
  }
  const sandGround = finalizeTexture(sandC, maxAnisotropy, true, 16, 16);
  const sandBump = finalizeTexture(sandBC, maxAnisotropy, false, 16, 16);

  // 2. Fitted Limestone & Sandstone Cobblestone + Matching Relief Bump Map
  const [alleyC, alleyCtx] = createCanvas(512);
  const [alleyBC, alleyBCtx] = createCanvas(512);
  alleyCtx.fillStyle = '#9b7b54'; // Mortar bed
  alleyCtx.fillRect(0, 0, 512, 512);
  alleyBCtx.fillStyle = '#383838'; // Deep mortar groove
  alleyBCtx.fillRect(0, 0, 512, 512);

  const cobbleRows = 12;
  const cobbleH = 512 / cobbleRows;
  for (let r = 0; r < cobbleRows; r++) {
    let xCursor = (r % 2) * -28;
    while (xCursor < 512) {
      const cw = 36 + Math.floor(Math.random() * 28);
      const tone = 178 + Math.floor(Math.random() * 34);
      const warmShift = Math.floor(Math.random() * 14);
      alleyCtx.fillStyle = `rgb(${tone + warmShift}, ${Math.floor(tone * 0.84)}, ${Math.floor(tone * 0.62)})`;
      alleyCtx.beginPath();
      alleyCtx.roundRect(xCursor + 3, r * cobbleH + 3, cw - 6, cobbleH - 6, 7);
      alleyCtx.fill();

      // Sunlit top bevel + shaded bottom edge
      alleyCtx.strokeStyle = 'rgba(255, 240, 208, 0.28)';
      alleyCtx.lineWidth = 1.5;
      alleyCtx.stroke();

      const bv = 165 + Math.floor(Math.random() * 55);
      alleyBCtx.fillStyle = `rgb(${bv},${bv},${bv})`;
      alleyBCtx.beginPath();
      alleyBCtx.roundRect(xCursor + 4, r * cobbleH + 4, cw - 8, cobbleH - 8, 6);
      alleyBCtx.fill();

      xCursor += cw;
    }
  }
  // Subtle blown sand dusting across cobbles
  for (let i = 0; i < 1600; i++) {
    alleyCtx.fillStyle = 'rgba(222, 190, 142, 0.16)';
    alleyCtx.fillRect(Math.random() * 512, Math.random() * 512, 3, 2);
  }
  const alleyCobble = finalizeTexture(alleyC, maxAnisotropy, true, 2, 10);
  const alleyBump = finalizeTexture(alleyBC, maxAnisotropy, false, 2, 10);

  // 3. Sun-Baked Mud-Brick Adobe Plaster + Weathering & Matching Bump Map
  const [mudC, mudCtx] = createCanvas(512);
  const [mudBC, mudBCtx] = createCanvas(512);
  mudCtx.fillStyle = '#c99c6d';
  mudCtx.fillRect(0, 0, 512, 512);
  mudBCtx.fillStyle = '#6a6a6a';
  mudBCtx.fillRect(0, 0, 512, 512);

  // Faint adobe brick courses underneath plaster
  const rows = 12;
  const cols = 5;
  const bw = 512 / cols;
  const bh = 512 / rows;
  for (let r = 0; r < rows; r++) {
    const offset = (r % 2) * (bw * 0.5);
    for (let c = -1; c <= cols; c++) {
      const bx = c * bw + offset;
      const by = r * bh;
      const shade = 186 + Math.floor(Math.random() * 24);
      mudCtx.fillStyle = `rgba(${shade}, ${Math.floor(shade * 0.77)}, ${Math.floor(shade * 0.54)}, 0.45)`;
      mudCtx.fillRect(bx + 3, by + 3, bw - 6, bh - 6);

      const bVal = 135 + Math.floor(Math.random() * 42);
      mudBCtx.fillStyle = `rgb(${bVal},${bVal},${bVal})`;
      mudBCtx.fillRect(bx + 4, by + 4, bw - 8, bh - 8);
    }
  }
  // Peeling plaster patches revealing exposed dark mud bricks
  for (let p = 0; p < 5; p++) {
    const px = 40 + Math.random() * 400;
    const py = 60 + Math.random() * 380;
    const pw = 56 + Math.random() * 64;
    const ph = 38 + Math.random() * 44;
    mudCtx.fillStyle = 'rgba(138, 92, 52, 0.36)';
    mudCtx.beginPath();
    mudCtx.ellipse(px, py, pw * 0.5, ph * 0.5, 0.2, 0, Math.PI * 2);
    mudCtx.fill();
    mudBCtx.fillStyle = '#484848';
    mudBCtx.beginPath();
    mudBCtx.ellipse(px, py, pw * 0.46, ph * 0.46, 0.2, 0, Math.PI * 2);
    mudBCtx.fill();
  }
  // Straw flecks & weathered mineral grain
  for (let i = 0; i < 2600; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    mudCtx.fillStyle =
      Math.random() > 0.45 ? 'rgba(104, 68, 36, 0.22)' : 'rgba(242, 218, 178, 0.24)';
    mudCtx.fillRect(x, y, 2 + Math.random() * 6, 1.5);
  }
  // Ground-contact AO darkening gradient at base of wall
  const baseAo = mudCtx.createLinearGradient(0, 390, 0, 512);
  baseAo.addColorStop(0, 'rgba(62, 38, 18, 0)');
  baseAo.addColorStop(1, 'rgba(62, 38, 18, 0.32)');
  mudCtx.fillStyle = baseAo;
  mudCtx.fillRect(0, 390, 512, 122);

  const mudBrick = finalizeTexture(mudC, maxAnisotropy, true, 2, 1);
  const mudBump = finalizeTexture(mudBC, maxAnisotropy, false, 2, 1);

  // 4. Carved Sandstone Ashlar Blocks + Bump Map (for plinths, wells, embankments)
  const [stoneC, stoneCtx] = createCanvas(256);
  const [stoneBC, stoneBCtx] = createCanvas(256);
  stoneCtx.fillStyle = '#75634f';
  stoneCtx.fillRect(0, 0, 256, 256);
  stoneBCtx.fillStyle = '#404040';
  stoneBCtx.fillRect(0, 0, 256, 256);

  for (let r = 0; r < 6; r++) {
    const off = (r % 2) * 32;
    const h = 256 / 6;
    for (let c = -1; c < 4; c++) {
      const x = c * 64 + off;
      const y = r * h;
      const v = 132 + Math.floor(Math.random() * 28);
      stoneCtx.fillStyle = `rgb(${v + 12}, ${v}, ${Math.floor(v * 0.82)})`;
      stoneCtx.fillRect(x + 2, y + 2, 60, h - 4);
      stoneBCtx.fillStyle = `rgb(${v + 40},${v + 40},${v + 40})`;
      stoneBCtx.fillRect(x + 3, y + 3, 58, h - 6);
    }
  }
  const stoneAshlar = finalizeTexture(stoneC, maxAnisotropy, true, 2, 1);
  const stoneBump = finalizeTexture(stoneBC, maxAnisotropy, false, 2, 1);

  // 5. Carved Mashrabiya Wooden Lattice + Warm Interior Glow
  const [mashC, mashCtx] = createCanvas(256);
  // Warm amber interior background behind screen
  const winGlow = mashCtx.createRadialGradient(128, 128, 12, 128, 128, 128);
  winGlow.addColorStop(0, '#c27a34');
  winGlow.addColorStop(0.55, '#593319');
  winGlow.addColorStop(1, '#26140a');
  mashCtx.fillStyle = winGlow;
  mashCtx.fillRect(0, 0, 256, 256);

  // Outer carved wood frame
  mashCtx.strokeStyle = '#5c381f';
  mashCtx.lineWidth = 22;
  mashCtx.strokeRect(11, 11, 234, 234);

  // Diagonal Islamic geometric latticework
  mashCtx.strokeStyle = '#6b4226';
  mashCtx.lineWidth = 7;
  for (let i = -256; i <= 512; i += 32) {
    mashCtx.beginPath();
    mashCtx.moveTo(i, 0);
    mashCtx.lineTo(i + 256, 256);
    mashCtx.stroke();

    mashCtx.beginPath();
    mashCtx.moveTo(i + 256, 0);
    mashCtx.lineTo(i, 256);
    mashCtx.stroke();
  }
  // Vertical mullions
  mashCtx.fillStyle = '#4f2f18';
  mashCtx.fillRect(122, 0, 12, 256);
  mashCtx.fillRect(0, 122, 256, 12);
  const mashrabiyaWindow = finalizeTexture(mashC, maxAnisotropy, true, 1, 1);

  // 6. Weathered Turquoise-Teal Studded Saidi Double-Door Texture
  const [doorC, doorCtx] = createCanvas(256);
  doorCtx.fillStyle = '#296875';
  doorCtx.fillRect(0, 0, 256, 256);
  for (let p = 0; p < 8; p++) {
    doorCtx.fillStyle = p % 2 === 0 ? '#2f7482' : '#235c68';
    doorCtx.fillRect(p * 32 + 1, 0, 30, 256);
  }
  // Weathered wood wear scratches
  for (let w = 0; w < 24; w++) {
    doorCtx.fillStyle = 'rgba(130, 92, 54, 0.25)';
    doorCtx.fillRect(Math.random() * 256, Math.random() * 256, 2, 18 + Math.random() * 34);
  }
  // Recessed twin panel frames
  for (const px of [18, 142]) {
    doorCtx.strokeStyle = '#18404a';
    doorCtx.lineWidth = 6;
    doorCtx.strokeRect(px, 26, 96, 86);
    doorCtx.strokeRect(px, 138, 96, 92);
    doorCtx.strokeStyle = 'rgba(148, 210, 218, 0.26)';
    doorCtx.lineWidth = 2;
    doorCtx.strokeRect(px + 5, 31, 86, 76);
    doorCtx.strokeRect(px + 5, 143, 86, 82);
  }
  // Center double-door seam
  doorCtx.fillStyle = '#122930';
  doorCtx.fillRect(125, 0, 6, 256);
  // Horizontal wood/iron crossbars & brass studs
  for (const by of [20, 124, 236]) {
    doorCtx.fillStyle = '#1b4752';
    doorCtx.fillRect(0, by - 7, 256, 14);
    doorCtx.fillStyle = '#d9a441';
    for (let sx = 24; sx < 248; sx += 34) {
      doorCtx.beginPath();
      doorCtx.arc(sx, by, 4, 0, Math.PI * 2);
      doorCtx.fill();
    }
  }
  // Brass ring knockers
  doorCtx.strokeStyle = '#e5b754';
  doorCtx.lineWidth = 4;
  for (const kx of [104, 152]) {
    doorCtx.beginPath();
    doorCtx.arc(kx, 134, 9, 0, Math.PI * 2);
    doorCtx.stroke();
  }
  const carvedDoor = finalizeTexture(doorC, maxAnisotropy, true, 1, 1);

  // 7. Upper Egyptian Geometric Painted Triangle Parapet Frieze
  const [friezeC, friezeCtx] = createCanvas(256);
  friezeCtx.fillStyle = '#d5ab79';
  friezeCtx.fillRect(0, 0, 256, 256);
  friezeCtx.fillStyle = 'rgba(110, 68, 34, 0.28)';
  friezeCtx.fillRect(0, 0, 256, 24);
  friezeCtx.fillRect(0, 232, 256, 24);
  // Painted terracotta-red & cobalt-teal folk triangles
  for (let x = 0; x < 256; x += 42.66) {
    const idx = Math.round(x / 42.66);
    friezeCtx.fillStyle = idx % 2 === 0 ? '#a93b25' : '#24667a';
    friezeCtx.beginPath();
    friezeCtx.moveTo(x + 21, 52);
    friezeCtx.lineTo(x + 39, 132);
    friezeCtx.lineTo(x + 3, 132);
    friezeCtx.closePath();
    friezeCtx.fill();

    friezeCtx.fillStyle = idx % 2 === 0 ? '#24667a' : '#a93b25';
    friezeCtx.beginPath();
    friezeCtx.moveTo(x + 21, 206);
    friezeCtx.lineTo(x + 39, 142);
    friezeCtx.lineTo(x + 3, 142);
    friezeCtx.closePath();
    friezeCtx.fill();
  }
  const saidiFrieze = finalizeTexture(friezeC, maxAnisotropy, true, 4, 1);

  // 8. Weathered Timber Planks & Teal Painted Crate Planks
  const [woodC, woodCtx] = createCanvas(256);
  woodCtx.fillStyle = '#6b4428';
  woodCtx.fillRect(0, 0, 256, 256);
  for (let p = 0; p < 4; p++) {
    const px = p * 64;
    woodCtx.fillStyle = p % 2 === 0 ? '#744b2d' : '#613c22';
    woodCtx.fillRect(px + 2, 0, 60, 256);
    woodCtx.fillStyle = 'rgba(38, 20, 10, 0.55)';
    woodCtx.fillRect(px, 0, 3, 256);
    for (let g = 0; g < 36; g++) {
      woodCtx.fillStyle = 'rgba(42, 24, 12, 0.28)';
      woodCtx.fillRect(
        px + 6 + Math.random() * 50,
        Math.random() * 256,
        2,
        18 + Math.random() * 38,
      );
    }
  }
  const woodPlank = finalizeTexture(woodC, maxAnisotropy, true, 1, 1);

  const [crateC, crateCtx] = createCanvas(256);
  crateCtx.fillStyle = '#3f6d61';
  crateCtx.fillRect(0, 0, 256, 256);
  for (let p = 0; p < 4; p++) {
    const py = p * 64;
    crateCtx.fillStyle = p % 2 === 0 ? '#4d7f71' : '#3d695c';
    crateCtx.fillRect(0, py + 3, 256, 58);
    crateCtx.fillStyle = 'rgba(20, 38, 32, 0.58)';
    crateCtx.fillRect(0, py, 256, 4);
    // Warm timber scuffing peeking through teal paint
    for (let g = 0; g < 16; g++) {
      crateCtx.fillStyle = g % 3 === 0 ? 'rgba(134, 102, 68, 0.28)' : 'rgba(26, 48, 42, 0.22)';
      crateCtx.fillRect(Math.random() * 230, py + 6 + Math.random() * 48, 18 + Math.random() * 36, 2);
    }
  }
  // Outer slatted perimeter frame
  crateCtx.strokeStyle = '#5a8e7f';
  crateCtx.lineWidth = 22;
  crateCtx.strokeRect(11, 11, 234, 234);
  crateCtx.strokeStyle = 'rgba(22, 42, 36, 0.55)';
  crateCtx.lineWidth = 3;
  crateCtx.strokeRect(22, 22, 212, 212);
  const crateTealWood = finalizeTexture(crateC, maxAnisotropy, true, 1, 1);

  // 9. Date Palm Trunk Diamond Bark
  const [palmC, palmCtx] = createCanvas(256);
  palmCtx.fillStyle = '#684b34';
  palmCtx.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 18) {
    const off = ((y / 18) % 2) * 16;
    for (let x = -16; x < 256; x += 32) {
      palmCtx.fillStyle = '#7d5b40';
      palmCtx.beginPath();
      palmCtx.moveTo(x + off + 16, y);
      palmCtx.lineTo(x + off + 30, y + 9);
      palmCtx.lineTo(x + off + 16, y + 17);
      palmCtx.lineTo(x + off + 2, y + 9);
      palmCtx.closePath();
      palmCtx.fill();
    }
  }
  const palmBark = finalizeTexture(palmC, maxAnisotropy, true, 1, 4);

  // 9b. Pinnate Feathered Date-Palm Frond Alpha Texture
  const [frondC, frondCtx] = createCanvas(256);
  frondCtx.clearRect(0, 0, 256, 256);
  // Central stem rib running vertically from bottom (y=256) to tip (y=8)
  frondCtx.strokeStyle = '#7da13b';
  frondCtx.lineWidth = 6;
  frondCtx.beginPath();
  frondCtx.moveTo(128, 256);
  frondCtx.lineTo(128, 12);
  frondCtx.stroke();
  for (let y = 20; y < 244; y += 9) {
    const progress = (y - 16) / 230;
    const span = Math.sin(progress * Math.PI * 0.92) * 112 + 12;
    for (const side of [-1, 1]) {
      frondCtx.fillStyle = y % 18 === 0 ? '#4d7f2c' : '#619635';
      frondCtx.beginPath();
      frondCtx.moveTo(128, y);
      frondCtx.quadraticCurveTo(
        128 + side * span * 0.65,
        y - 12,
        128 + side * span,
        y - 26 + progress * 12,
      );
      frondCtx.quadraticCurveTo(128 + side * span * 0.55, y - 3, 128, y + 6);
      frondCtx.closePath();
      frondCtx.fill();
    }
  }
  const palmFrond = new THREE.CanvasTexture(frondC);
  palmFrond.colorSpace = THREE.SRGBColorSpace;
  palmFrond.anisotropy = maxAnisotropy;
  palmFrond.needsUpdate = true;

  // 10. Woven Striped Market Awning & Blue Courtyard Bench Cloth
  const [awnC, awnCtx] = createCanvas(256);
  const stripes = ['#9e3b24', '#efe1c6', '#c98834', '#2b678a'];
  for (let i = 0; i < 8; i++) {
    awnCtx.fillStyle = stripes[i % stripes.length];
    awnCtx.fillRect(i * 32, 0, 32, 256);
  }
  awnCtx.fillStyle = 'rgba(45, 22, 10, 0.22)';
  awnCtx.fillRect(0, 238, 256, 18);
  const awningStripe = finalizeTexture(awnC, maxAnisotropy, true, 2, 1);

  const [benchC, benchCtx] = createCanvas(256);
  const bStripes = ['#2c6999', '#3b82b5', '#215078', '#dcd5c3'];
  for (let i = 0; i < 16; i++) {
    benchCtx.fillStyle = bStripes[i % bStripes.length];
    benchCtx.fillRect(i * 16, 0, 16, 256);
  }
  const benchStripe = finalizeTexture(benchC, maxAnisotropy, true, 1, 1);

  // 11. Saidi Kilim Carpet Texture
  const [rugC, rugCtx] = createCanvas(256);
  rugCtx.fillStyle = '#7f241c';
  rugCtx.fillRect(0, 0, 256, 256);
  rugCtx.strokeStyle = '#e2b659';
  rugCtx.lineWidth = 10;
  rugCtx.strokeRect(14, 14, 228, 228);
  rugCtx.strokeStyle = '#235c6b';
  rugCtx.lineWidth = 6;
  rugCtx.strokeRect(30, 30, 196, 196);
  rugCtx.fillStyle = '#e7cda0';
  for (const cy of [76, 128, 180]) {
    rugCtx.beginPath();
    rugCtx.moveTo(128, cy - 22);
    rugCtx.lineTo(154, cy);
    rugCtx.lineTo(128, cy + 22);
    rugCtx.lineTo(102, cy);
    rugCtx.closePath();
    rugCtx.fill();
  }
  const kilimRug = finalizeTexture(rugC, maxAnisotropy, true, 1, 1);

  // 12. Coarse Linen Bump Map
  const [clothC, clothCtx] = createCanvas(256);
  clothCtx.fillStyle = '#808080';
  clothCtx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 256; i += 4) {
    clothCtx.fillStyle = i % 8 === 0 ? 'rgba(175,175,175,0.28)' : 'rgba(95,95,95,0.25)';
    clothCtx.fillRect(i, 0, 2, 256);
    clothCtx.fillRect(0, i, 256, 2);
  }
  const wovenClothBump = finalizeTexture(clothC, maxAnisotropy, false, 3, 3);

  // 13. Radial Contact Shadow
  const [shadC, shadCtx] = createCanvas(128);
  const grad = shadCtx.createRadialGradient(64, 64, 6, 64, 64, 62);
  grad.addColorStop(0, 'rgba(20, 12, 6, 0.68)');
  grad.addColorStop(0.55, 'rgba(20, 12, 6, 0.3)');
  grad.addColorStop(1, 'rgba(20, 12, 6, 0.0)');
  shadCtx.fillStyle = grad;
  shadCtx.fillRect(0, 0, 128, 128);
  const contactShadow = new THREE.CanvasTexture(shadC);
  contactShadow.colorSpace = THREE.SRGBColorSpace;
  contactShadow.needsUpdate = true;

  // 14. Tactical Selection Ring
  const [ringC, ringCtx] = createCanvas(256);
  ringCtx.clearRect(0, 0, 256, 256);
  ringCtx.strokeStyle = '#f5c451';
  ringCtx.lineWidth = 10;
  ringCtx.beginPath();
  ringCtx.arc(128, 128, 102, 0, Math.PI * 2);
  ringCtx.stroke();
  ringCtx.strokeStyle = 'rgba(255, 244, 210, 0.5)';
  ringCtx.lineWidth = 3;
  ringCtx.beginPath();
  ringCtx.arc(128, 128, 86, 0, Math.PI * 2);
  ringCtx.stroke();
  ringCtx.fillStyle = '#fff3cf';
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2;
    ringCtx.save();
    ringCtx.translate(128 + Math.cos(a) * 102, 128 + Math.sin(a) * 102);
    ringCtx.rotate(a);
    ringCtx.fillRect(-12, -5, 24, 10);
    ringCtx.restore();
  }
  const selectionRing = new THREE.CanvasTexture(ringC);
  selectionRing.colorSpace = THREE.SRGBColorSpace;
  selectionRing.anisotropy = maxAnisotropy;
  selectionRing.needsUpdate = true;

  return {
    sandGround,
    sandBump,
    alleyCobble,
    alleyBump,
    mudBrick,
    mudBump,
    stoneAshlar,
    stoneBump,
    mashrabiyaWindow,
    carvedDoor,
    saidiFrieze,
    woodPlank,
    crateTealWood,
    palmBark,
    palmFrond,
    awningStripe,
    benchStripe,
    kilimRug,
    wovenClothBump,
    contactShadow,
    selectionRing,
    dispose: () => {
      sandGround.dispose();
      sandBump.dispose();
      alleyCobble.dispose();
      alleyBump.dispose();
      mudBrick.dispose();
      mudBump.dispose();
      stoneAshlar.dispose();
      stoneBump.dispose();
      mashrabiyaWindow.dispose();
      carvedDoor.dispose();
      saidiFrieze.dispose();
      woodPlank.dispose();
      crateTealWood.dispose();
      palmBark.dispose();
      palmFrond.dispose();
      awningStripe.dispose();
      benchStripe.dispose();
      kilimRug.dispose();
      wovenClothBump.dispose();
      contactShadow.dispose();
      selectionRing.dispose();
    },
  };
}
