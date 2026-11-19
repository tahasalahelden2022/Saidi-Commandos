import * as THREE from 'three';

export interface LoftSection {
  y: number;
  rx: number;
  rz: number;
  xOffset?: number;
  zOffset?: number;
  modulate?: (theta: number, r: number) => number;
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function gaussianFalloff(dist: number, radius: number): number {
  const n = dist / radius;
  return Math.exp(-n * n * 2.6);
}

/**
 * Generates a continuous, smooth, seam-averaged lofted mesh from anatomical cross-sections.
 * UV convention: u = 0.5 is exact front (+Z), v = 0 is bottom, v = 1 is top.
 */
export function createOrganicLoft(
  sections: LoftSection[],
  radialSegs = 32,
  subStepsPerSpan = 3,
  capBottom = true,
  capTop = true,
): THREE.BufferGeometry {
  const samples: Array<{
    y: number;
    rx: number;
    rz: number;
    xOffset: number;
    zOffset: number;
    v: number;
    secA: LoftSection;
    secB: LoftSection;
    localT: number;
  }> = [];

  const n = sections.length;
  const minY = sections[0].y;
  const maxY = sections[n - 1].y;
  const heightSpan = Math.max(0.001, maxY - minY);

  const catmull = (p0: number, p1: number, p2: number, p3: number, t: number): number => {
    const t2 = t * t;
    const t3 = t2 * t;
    return (
      0.5 *
      (2 * p1 +
        (-p0 + p2) * t +
        (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
        (-p0 + 3 * p1 - 3 * p2 + p3) * t3)
    );
  };

  for (let i = 0; i < n - 1; i++) {
    const s0 = sections[Math.max(0, i - 1)];
    const s1 = sections[i];
    const s2 = sections[i + 1];
    const s3 = sections[Math.min(n - 1, i + 2)];
    const steps = i === n - 2 ? subStepsPerSpan + 1 : subStepsPerSpan;

    for (let k = 0; k < steps; k++) {
      const t = k / subStepsPerSpan;
      const y = THREE.MathUtils.lerp(s1.y, s2.y, t);
      const rx = Math.max(0.004, catmull(s0.rx, s1.rx, s2.rx, s3.rx, t));
      const rz = Math.max(0.004, catmull(s0.rz, s1.rz, s2.rz, s3.rz, t));
      const xOffset = catmull(
        s0.xOffset ?? 0,
        s1.xOffset ?? 0,
        s2.xOffset ?? 0,
        s3.xOffset ?? 0,
        t,
      );
      const zOffset = catmull(
        s0.zOffset ?? 0,
        s1.zOffset ?? 0,
        s2.zOffset ?? 0,
        s3.zOffset ?? 0,
        t,
      );
      samples.push({
        y,
        rx,
        rz,
        xOffset,
        zOffset,
        v: (y - minY) / heightSpan,
        secA: s1,
        secB: s2,
        localT: t,
      });
    }
  }

  const rows = samples.length;
  const cols = radialSegs + 1;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let r = 0; r < rows; r++) {
    const s = samples[r];
    for (let c = 0; c < cols; c++) {
      const u = c / radialSegs;
      const theta = (u - 0.5) * Math.PI * 2;
      let rx = s.rx;
      let rz = s.rz;

      const modA = s.secA.modulate ? s.secA.modulate(theta, 1) : 1;
      const modB = s.secB.modulate ? s.secB.modulate(theta, 1) : 1;
      const mod = THREE.MathUtils.lerp(modA, modB, smoothstep(0, 1, s.localT));
      rx *= mod;
      rz *= mod;

      const x = s.xOffset + Math.sin(theta) * rx;
      const z = s.zOffset + Math.cos(theta) * rz;
      positions.push(x, s.y, z);
      uvs.push(u, s.v);
    }
  }

  for (let r = 0; r < rows - 1; r++) {
    for (let c = 0; c < radialSegs; c++) {
      const a = r * cols + c;
      const b = r * cols + c + 1;
      const cIdx = (r + 1) * cols + c + 1;
      const d = (r + 1) * cols + c;
      indices.push(a, b, cIdx, a, cIdx, d);
    }
  }

  if (capBottom) {
    const s0 = samples[0];
    const centerIdx = positions.length / 3;
    positions.push(s0.xOffset, s0.y, s0.zOffset);
    uvs.push(0.5, 0);
    for (let c = 0; c < radialSegs; c++) {
      indices.push(centerIdx, c + 1, c);
    }
  }

  if (capTop) {
    const sLast = samples[rows - 1];
    const centerIdx = positions.length / 3;
    positions.push(sLast.xOffset, sLast.y, sLast.zOffset);
    uvs.push(0.5, 1);
    const topStart = (rows - 1) * cols;
    for (let c = 0; c < radialSegs; c++) {
      indices.push(centerIdx, topStart + c, topStart + c + 1);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();

  const norm = geo.attributes.normal;
  for (let r = 0; r < rows; r++) {
    const i0 = r * cols;
    const i1 = r * cols + radialSegs;
    const nx = (norm.getX(i0) + norm.getX(i1)) * 0.5;
    const ny = (norm.getY(i0) + norm.getY(i1)) * 0.5;
    const nz = (norm.getZ(i0) + norm.getZ(i1)) * 0.5;
    const len = Math.hypot(nx, ny, nz) || 1;
    norm.setXYZ(i0, nx / len, ny / len, nz / len);
    norm.setXYZ(i1, nx / len, ny / len, nz / len);
  }
  norm.needsUpdate = true;
  return geo;
}

/**
 * Planar-sculpted anatomical head mesh (NO spherical silhouette):
 * - Flat vertical temple & cheek side planes
 * - Crisp gonial jaw corners tapering diagonally to a wide flat-fronted jutting cleft chin
 * - Horizontal submental under-chin shelf overhanging the muscular neck
 * - Deep recessed orbital eye sockets beneath a protruding supraorbital brow ridge
 * - Bold aquiline dorsal nose bridge, chiseled nasal tip, and flared alar nostril wings
 * - High cheekbones + sub-zygomatic cheek hollows
 *
 * Vertical coordinate range: y = -0.065 (chin bottom) .. +0.345 (crown top)
 * UV convention: u = 0.5 (+Z front), v = (y + 0.065) / 0.410
 */
export function createSculptedHeadGeometry(
  jawStrength = 1.0,
  widthScale = 1.0,
): THREE.BufferGeometry {
  const radialSegs = 96;
  const heightSegs = 72;
  const cols = radialSegs + 1;
  const rows = heightSegs + 1;

  const yMin = -0.065;
  const yMax = 0.345;
  const ySpan = yMax - yMin;

  // Anatomical cross-section profile curves (xHalfWidth, zFront, zBack, sidePlane)
  const profileKeys = [
    { y: -0.065, rx: 0.062, zF: 0.148, zB: 0.005, flat: 0.2 },  // Submental chin base
    { y: -0.045, rx: 0.102, zF: 0.198, zB: -0.045, flat: 0.45 }, // Chin bottom contour
    { y: -0.015, rx: 0.142, zF: 0.206, zB: -0.098, flat: 0.55 }, // Chin & lower jaw
    { y: 0.025, rx: 0.164, zF: 0.194, zB: -0.138, flat: 0.65 },  // Jaw angle & labiomental dip
    { y: 0.065, rx: 0.165, zF: 0.196, zB: -0.158, flat: 0.72 },  // Mouth barrel & cheeks
    { y: 0.115, rx: 0.164, zF: 0.186, zB: -0.172, flat: 0.78 },  // Cheek hollows
    { y: 0.155, rx: 0.170, zF: 0.188, zB: -0.182, flat: 0.74 },  // Zygomatic cheekbones
    { y: 0.190, rx: 0.166, zF: 0.188, zB: -0.188, flat: 0.76 },  // Orbital eye belt
    { y: 0.228, rx: 0.167, zF: 0.212, zB: -0.188, flat: 0.70 },  // Supraorbital brow ridge
    { y: 0.270, rx: 0.162, zF: 0.192, zB: -0.184, flat: 0.55 },  // Forehead
    { y: 0.312, rx: 0.140, zF: 0.156, zB: -0.160, flat: 0.30 },  // Upper cranium
    { y: 0.345, rx: 0.022, zF: 0.024, zB: -0.024, flat: 0.05 },  // Crown apex
  ];

  const catmull = (p0: number, p1: number, p2: number, p3: number, t: number): number => {
    const t2 = t * t;
    const t3 = t2 * t;
    return (
      0.5 *
      (2 * p1 +
        (-p0 + p2) * t +
        (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
        (-p0 + 3 * p1 - 3 * p2 + p3) * t3)
    );
  };

  const sampleProfile = (y: number) => {
    const n = profileKeys.length;
    for (let i = 0; i < n - 1; i++) {
      const a = profileKeys[i];
      const b = profileKeys[i + 1];
      if (y >= a.y && y <= b.y) {
        const k0 = profileKeys[Math.max(0, i - 1)];
        const k3 = profileKeys[Math.min(n - 1, i + 2)];
        const t = (y - a.y) / Math.max(1e-5, b.y - a.y);
        return {
          rx: Math.max(0.015, catmull(k0.rx, a.rx, b.rx, k3.rx, t)),
          zF: catmull(k0.zF, a.zF, b.zF, k3.zF, t),
          zB: catmull(k0.zB, a.zB, b.zB, k3.zB, t),
          flat: THREE.MathUtils.clamp(catmull(k0.flat, a.flat, b.flat, k3.flat, t), 0, 1),
        };
      }
    }
    const last = profileKeys[n - 1];
    return { rx: last.rx, zF: last.zF, zB: last.zB, flat: last.flat };
  };

  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let r = 0; r < rows; r++) {
    const v = r / heightSegs;
    const rawY = yMin + v * ySpan;
    const prof = sampleProfile(rawY);
    const zMid = (prof.zF + prof.zB) * 0.5;
    const zHalf = (prof.zF - prof.zB) * 0.5;

    for (let c = 0; c < cols; c++) {
      const u = c / radialSegs;
      const theta = (u - 0.5) * Math.PI * 2; // 0 = exact front (+Z)
      const sinT = Math.sin(theta);
      const cosT = Math.cos(theta);
      const absSin = Math.abs(sinT);
      const frontDot = Math.max(0, cosT);

      // Gentle squared oval + smooth lateral side-plane compression (flat temples/cheeks WITHOUT boxy 45° corners)
      const exp = 2.0 + prof.flat * 0.24;
      const normScale = Math.pow(
        Math.pow(absSin, exp) + Math.pow(Math.abs(cosT), exp),
        -1 / exp,
      );

      let x = sinT * normScale * prof.rx * widthScale;
      x *= 1 - prof.flat * 0.055 * Math.pow(absSin, 3);
      let z = zMid + cosT * normScale * zHalf;
      let y = rawY;

      // 1. Sculpted Masculine Jaw & Smoothly Beveled Square Chin
      const jawZone = smoothstep(-0.06, -0.015, rawY) * (1 - smoothstep(0.055, 0.135, rawY));
      const taperT =
        smoothstep(0.15, 0.45, cosT) *
        smoothstep(0.32, 0.92, Math.abs(theta)) *
        (1 - smoothstep(0.95, 1.42, Math.abs(theta)));
      x *= 1 - jawZone * taperT * 0.095;

      const gonialCorner = gaussianFalloff(Math.hypot((Math.abs(theta) - 1.08) * 1.4, (rawY - 0.030) * 13), 0.78);
      x += Math.sign(sinT) * gonialCorner * (0.008 + 0.012 * jawStrength) * widthScale;

      const chinFront = gaussianFalloff(Math.hypot(theta * 1.6, (rawY + 0.020) * 15), 0.78);
      z += chinFront * (0.012 + 0.011 * jawStrength);
      const chinCleft = gaussianFalloff(Math.hypot(theta * 8.5, (rawY + 0.02) * 20), 0.28);
      z -= chinCleft * 0.0045 * jawStrength;

      // Smooth submental lift behind the chin for clean jaw-over-neck transition
      const underLift = smoothstep(0.42, -0.45, cosT) * smoothstep(0.008, -0.062, rawY);
      y += underLift * 0.024;
      z -= underLift * 0.018 * Math.max(0, cosT + 0.3);

      // 2. Smooth Labiomental Crease & Sculpted Mouth Barrel / Lip Ridges
      const labioDip = gaussianFalloff(Math.hypot(theta * 2.1, (rawY - 0.016) * 24), 0.52);
      z -= labioDip * 0.010;

      const lipUpper = gaussianFalloff(Math.hypot(theta * 2.4, (rawY - 0.064) * 26), 0.50);
      z += lipUpper * 0.011;
      const lipLower = gaussianFalloff(Math.hypot(theta * 2.6, (rawY - 0.042) * 26), 0.48);
      z += lipLower * 0.012;

      // 3. Smooth Cheek Hollows, Zygomatic Cheekbones & Temple Planes
      for (const side of [-1, 1]) {
        const hollowD = Math.hypot((theta - side * 0.66) * 1.9, (rawY - 0.084) * 13);
        const hollowW = gaussianFalloff(hollowD, 0.64);
        x -= side * hollowW * 0.014;
        z -= hollowW * 0.009;

        const cheekD = Math.hypot((theta - side * 0.56) * 1.9, (rawY - 0.140) * 15);
        const cheekW = gaussianFalloff(cheekD, 0.62);
        x += side * cheekW * 0.010;
        z += cheekW * 0.016;

        const templeD = Math.hypot((theta - side * 0.92) * 1.7, (rawY - 0.228) * 12);
        x -= side * gaussianFalloff(templeD, 0.68) * 0.012;

        // Smooth recessed orbital eye sockets
        const socketD = Math.hypot((theta - side * 0.355) * 2.2, (rawY - 0.175) * 17);
        z -= gaussianFalloff(socketD, 0.58) * 0.034;

        // Subtle alar cheek support
        const nostrilD = Math.hypot((theta - side * 0.135) * 4.5, (rawY - 0.118) * 22);
        z += gaussianFalloff(nostrilD, 0.42) * 0.007;
        x += side * gaussianFalloff(nostrilD, 0.42) * 0.005;

        // Nasolabial fold
        const nasoD = Math.hypot((theta - side * 0.26) * 3.4, (rawY - 0.092) * 16);
        z -= gaussianFalloff(nasoD, 0.46) * 0.008;
      }

      // 4. Smooth Nasal Base Cradle
      const nasionD = Math.hypot(theta * 4.5, (rawY - 0.198) * 24);
      z -= gaussianFalloff(nasionD, 0.38) * 0.011;

      const noseBridgeW =
        Math.exp(-Math.pow(Math.abs(theta) * 5.8, 2.0)) *
        smoothstep(0.095, 0.135, rawY) *
        (1 - smoothstep(0.182, 0.215, rawY));
      z += noseBridgeW * 0.018;

      const noseTipD = Math.hypot(theta * 4.6, (rawY - 0.125) * 22);
      z += gaussianFalloff(noseTipD, 0.44) * 0.014;

      // 5. Overhanging Supraorbital Brow Ridge + Glabellar Furrow
      const browD = Math.hypot(theta * 1.0, (rawY - 0.222) * 19);
      z += gaussianFalloff(browD, 0.72) * 0.028 * frontDot;
      const glabellaD = Math.hypot(theta * 6.8, (rawY - 0.218) * 20);
      z -= gaussianFalloff(glabellaD, 0.30) * 0.009 * frontDot;

      positions.push(x, y, z);
      uvs.push(u, v);
    }
  }

  for (let r = 0; r < heightSegs; r++) {
    for (let c = 0; c < radialSegs; c++) {
      const a = r * cols + c;
      const b = r * cols + c + 1;
      const cIdx = (r + 1) * cols + c + 1;
      const d = (r + 1) * cols + c;
      indices.push(a, b, cIdx, a, cIdx, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();

  const norm = geo.attributes.normal;
  for (let r = 0; r < rows; r++) {
    const i0 = r * cols;
    const i1 = r * cols + radialSegs;
    const nx = (norm.getX(i0) + norm.getX(i1)) * 0.5;
    const ny = (norm.getY(i0) + norm.getY(i1)) * 0.5;
    const nz = (norm.getZ(i0) + norm.getZ(i1)) * 0.5;
    const len = Math.hypot(nx, ny, nz) || 1;
    norm.setXYZ(i0, nx / len, ny / len, nz / len);
    norm.setXYZ(i1, nx / len, ny / len, nz / len);
  }
  norm.needsUpdate = true;
  return geo;
}

/**
 * Creates a thick, smoothly beveled 3D eyebrow arch overhanging the orbital eye socket.
 */
export function createFacetedBrowGeometry(
  side: number,
  widthScale: number,
  thickness = 1.0,
  fierceness = 1.0,
): THREE.BufferGeometry {
  // Smooth multi-stop arch from inner glabella frown to outer temple tip
  const stops = [
    { x: 0.017 * widthScale, y: 0.207 - 0.010 * fierceness, z: 0.222, w: 0.018 * thickness, h: 0.023 * thickness },
    { x: 0.038 * widthScale, y: 0.217 - 0.005 * fierceness, z: 0.236, w: 0.021 * thickness, h: 0.026 * thickness },
    { x: 0.062 * widthScale, y: 0.227, z: 0.234, w: 0.021 * thickness, h: 0.025 * thickness },
    { x: 0.084 * widthScale, y: 0.225, z: 0.219, w: 0.018 * thickness, h: 0.021 * thickness },
    { x: 0.101 * widthScale, y: 0.217, z: 0.198, w: 0.013 * thickness, h: 0.015 * thickness },
    { x: 0.112 * widthScale, y: 0.206, z: 0.180, w: 0.006 * thickness, h: 0.008 * thickness },
  ];

  // Smooth 14-point superellipse cross-section (softly beveled masculine brow, no harsh polygon edges)
  const ringSegs = 14;
  const ring: Array<[number, number]> = [];
  for (let j = 0; j < ringSegs; j++) {
    const a = (j / ringSegs) * Math.PI * 2 - Math.PI * 0.5;
    const cosA = Math.cos(a);
    const sinA = Math.sin(a);
    const exp = 2.4;
    const ns = Math.pow(
      Math.pow(Math.abs(cosA), exp) + Math.pow(Math.abs(sinA), exp),
      -1 / exp,
    );
    ring.push([cosA * ns * 0.54, sinA * ns * 0.52]);
  }
  const rCols = ring.length + 1;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i < stops.length; i++) {
    const s = stops[i];
    const v = i / (stops.length - 1);
    for (let j = 0; j < rCols; j++) {
      const pt = ring[j % ring.length];
      const lx = s.x * side;
      const ly = s.y + pt[1] * s.h;
      const lz = s.z + pt[0] * s.w;
      positions.push(lx, ly, lz);
      uvs.push(j / ring.length, v);
    }
  }

  for (let i = 0; i < stops.length - 1; i++) {
    for (let j = 0; j < ring.length; j++) {
      const a = i * rCols + j;
      const b = (i + 1) * rCols + j;
      const c = (i + 1) * rCols + j + 1;
      const d = i * rCols + j + 1;
      if (side > 0) indices.push(a, b, d, b, c, d);
      else indices.push(a, d, b, b, d, c);
    }
  }

  const c0 = positions.length / 3;
  positions.push(stops[0].x * side, stops[0].y, stops[0].z);
  uvs.push(0.5, 0);
  for (let j = 0; j < ring.length; j++) {
    if (side > 0) indices.push(c0, j, j + 1);
    else indices.push(c0, j + 1, j);
  }

  const last = stops[stops.length - 1];
  const c1 = positions.length / 3;
  const lastBase = (stops.length - 1) * rCols;
  positions.push(last.x * side, last.y, last.z);
  uvs.push(0.5, 1);
  for (let j = 0; j < ring.length; j++) {
    if (side > 0) indices.push(c1, lastBase + j + 1, lastBase + j);
    else indices.push(c1, lastBase + j, lastBase + j + 1);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Sculpts the core Saidi turban crown (tilted neatly backward over the occiput).
 */
export function createSculptedTurbanGeometry(tallness = 1.0): THREE.BufferGeometry {
  const radialSegs = 56;
  const heightSegs = 28;
  const cols = radialSegs + 1;
  const rows = heightSegs + 1;

  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let r = 0; r < rows; r++) {
    const v = r / heightSegs;
    const profileAngle = v * Math.PI * 0.88;
    const baseR = 0.186 + Math.sin(profileAngle) * 0.066;
    const yBase = 0.228 + v * 0.172 * tallness;

    for (let c = 0; c < cols; c++) {
      const u = c / radialSegs;
      const theta = (u - 0.5) * Math.PI * 2;

      const w1 = Math.abs(Math.sin(theta * 1.5 + v * 9.8));
      const w2 = Math.abs(Math.sin(-theta * 1.5 + v * 8.6 + 1.1));
      const foldRelief = (w1 * 0.6 + w2 * 0.6) * 0.015 * Math.sin(v * Math.PI);
      const frontCrossDip =
        gaussianFalloff(Math.hypot(theta * 2.1, (v - 0.22) * 3.6), 0.45) * -0.016;

      const rad = baseR + foldRelief + frontCrossDip;
      const x = Math.sin(theta) * rad * 1.03;
      const z = Math.cos(theta) * rad * 1.08 - 0.002;
      const y = yBase + Math.sin(theta * 2 + v * 4.5) * 0.007 * (1 - v);

      positions.push(x, y, z);
      uvs.push(u, v);
    }
  }

  for (let r = 0; r < heightSegs; r++) {
    for (let c = 0; c < radialSegs; c++) {
      const a = r * cols + c;
      const b = r * cols + c + 1;
      const cIdx = (r + 1) * cols + c + 1;
      const d = (r + 1) * cols + c;
      indices.push(a, b, cIdx, a, cIdx, d);
    }
  }

  const centerTopIdx = positions.length / 3;
  positions.push(0, 0.228 + 0.172 * tallness + 0.01, -0.002);
  uvs.push(0.5, 1);
  const topRow = heightSegs * cols;
  for (let c = 0; c < radialSegs; c++) {
    indices.push(centerTopIdx, topRow + c, topRow + c + 1);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();

  const norm = geo.attributes.normal;
  for (let r = 0; r < rows; r++) {
    const i0 = r * cols;
    const i1 = r * cols + radialSegs;
    const nx = (norm.getX(i0) + norm.getX(i1)) * 0.5;
    const ny = (norm.getY(i0) + norm.getY(i1)) * 0.5;
    const nz = (norm.getZ(i0) + norm.getZ(i1)) * 0.5;
    const len = Math.hypot(nx, ny, nz) || 1;
    norm.setXYZ(i0, nx / len, ny / len, nz / len);
    norm.setXYZ(i1, nx / len, ny / len, nz / len);
  }
  norm.needsUpdate = true;
  return geo;
}

/**
 * Creates a sculpted, beveled ribbon/cloth wrap geometry following a 3D spline.
 */
export function createRibbonWrapGeometry(
  points: THREE.Vector3[],
  widthAt: (t: number) => number,
  thicknessAt: (t: number) => number,
  tubularSegs = 28,
  radialSegs = 12,
  closed = false,
  creaseDepth = 0.14,
): THREE.BufferGeometry {
  const curve = new THREE.CatmullRomCurve3(points, closed);
  const frames = curve.computeFrenetFrames(tubularSegs, closed);
  const cols = radialSegs + 1;
  const rows = tubularSegs + 1;

  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const pt = new THREE.Vector3();
  const radialDir = new THREE.Vector3();
  const upDir = new THREE.Vector3();

  for (let i = 0; i < rows; i++) {
    const t = i / tubularSegs;
    curve.getPointAt(t, pt);
    const T = frames.tangents[i];
    radialDir.set(pt.x, 0, pt.z);
    if (radialDir.lengthSq() < 1e-5) {
      radialDir.copy(frames.normals[i]);
    } else {
      radialDir.normalize();
    }
    upDir.crossVectors(T, radialDir).normalize();
    radialDir.crossVectors(upDir, T).normalize();

    const halfW = Math.max(0.002, widthAt(t) * 0.5);
    const halfT = Math.max(0.001, thicknessAt(t) * 0.5);

    for (let j = 0; j < cols; j++) {
      const u = j / radialSegs;
      const angle = u * Math.PI * 2;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);
      const crease = creaseDepth > 0 ? Math.cos(angle * 2) * creaseDepth : 0;
      const rScale = 1 - crease * 0.35;

      const x = pt.x + cosA * halfT * rScale * radialDir.x + sinA * halfW * upDir.x;
      const y = pt.y + cosA * halfT * rScale * radialDir.y + sinA * halfW * upDir.y;
      const z = pt.z + cosA * halfT * rScale * radialDir.z + sinA * halfW * upDir.z;
      positions.push(x, y, z);
      uvs.push(u, t * 2);
    }
  }

  for (let i = 0; i < tubularSegs; i++) {
    for (let j = 0; j < radialSegs; j++) {
      const a = i * cols + j;
      const b = (i + 1) * cols + j;
      const c = (i + 1) * cols + j + 1;
      const d = i * cols + j + 1;
      indices.push(a, b, d, b, c, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Sculpts an organic open-front tailored vest wrapping cleanly around the chest and back.
 */
export function createOpenVestGeometry(
  chestRx: number,
  chestRz: number,
  waistRx: number,
  waistRz: number,
  yBottom = 0.15,
  yTop = 0.72,
): THREE.BufferGeometry {
  const rows = 10;
  const cols = 28;
  const gapAngle = 0.34;
  const thickness = 0.017;

  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const samplePoint = (rIdx: number, cIdx: number, offset: number) => {
    const v = rIdx / (rows - 1);
    const y = THREE.MathUtils.lerp(yBottom, yTop, v);
    const curve = Math.sin(v * Math.PI * 0.65);
    const rx = THREE.MathUtils.lerp(waistRx * 1.07, chestRx * 1.04, curve) + offset;
    const rz = THREE.MathUtils.lerp(waistRz * 1.07, chestRz * 1.05, curve) + offset;

    const neckTaper = v > 0.8 ? 1 - (v - 0.8) * 0.9 : 1;
    const effectiveGap = gapAngle * (1 + (1 - v) * 0.15);
    const u = cIdx / (cols - 1);
    const theta = effectiveGap + u * (Math.PI * 2 - effectiveGap * 2);

    const x = Math.sin(theta) * rx * neckTaper;
    const z = Math.cos(theta) * rz + 0.015;
    return [x, y, z, u, v] as const;
  };

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const [x, y, z, u, v] = samplePoint(r, c, thickness);
      positions.push(x, y, z);
      uvs.push(u, v);
    }
  }
  const innerBase = rows * cols;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const [x, y, z, u, v] = samplePoint(r, c, 0);
      positions.push(x, y, z);
      uvs.push(u, v);
    }
  }

  for (let r = 0; r < rows - 1; r++) {
    for (let c = 0; c < cols - 1; c++) {
      const a = r * cols + c;
      const b = r * cols + c + 1;
      const cIdx = (r + 1) * cols + c + 1;
      const d = (r + 1) * cols + c;
      indices.push(a, b, cIdx, a, cIdx, d);
    }
  }
  for (let r = 0; r < rows - 1; r++) {
    for (let c = 0; c < cols - 1; c++) {
      const a = innerBase + r * cols + c;
      const b = innerBase + r * cols + c + 1;
      const cIdx = innerBase + (r + 1) * cols + c + 1;
      const d = innerBase + (r + 1) * cols + c;
      indices.push(a, cIdx, b, a, d, cIdx);
    }
  }
  for (let r = 0; r < rows - 1; r++) {
    const o0 = r * cols;
    const o1 = (r + 1) * cols;
    const i0 = innerBase + r * cols;
    const i1 = innerBase + (r + 1) * cols;
    indices.push(o0, o1, i1, o0, i1, i0);

    const oc0 = r * cols + (cols - 1);
    const oc1 = (r + 1) * cols + (cols - 1);
    const ic0 = innerBase + r * cols + (cols - 1);
    const ic1 = innerBase + (r + 1) * cols + (cols - 1);
    indices.push(oc0, ic1, oc1, oc0, ic0, ic1);
  }
  for (let c = 0; c < cols - 1; c++) {
    const o0 = c;
    const o1 = c + 1;
    const i0 = innerBase + c;
    const i1 = innerBase + c + 1;
    indices.push(o0, i1, o1, o0, i0, i1);

    const topR = (rows - 1) * cols;
    const to0 = topR + c;
    const to1 = topR + c + 1;
    const ti0 = innerBase + topR + c;
    const ti1 = innerBase + topR + c + 1;
    indices.push(to0, to1, ti1, to0, ti1, ti0);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Creates a smooth tapered organic spline tube (mustache, scarf tail, hair locks).
 */
export function createTaperedSplineTube(
  points: THREE.Vector3[],
  radiusAt: (t: number) => number,
  tubularSegs = 20,
  radialSegs = 10,
): THREE.BufferGeometry {
  const curve = new THREE.CatmullRomCurve3(points);
  const frames = curve.computeFrenetFrames(tubularSegs, false);
  const cols = radialSegs + 1;
  const rows = tubularSegs + 1;

  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const pt = new THREE.Vector3();
  const vertex = new THREE.Vector3();

  for (let i = 0; i < rows; i++) {
    const t = i / tubularSegs;
    curve.getPointAt(t, pt);
    const N = frames.normals[i];
    const B = frames.binormals[i];
    const rad = Math.max(0.001, radiusAt(t));

    for (let j = 0; j < cols; j++) {
      const u = j / radialSegs;
      const angle = u * Math.PI * 2;
      const sin = Math.sin(angle);
      const cos = -Math.cos(angle);

      vertex.x = pt.x + rad * (cos * N.x + sin * B.x);
      vertex.y = pt.y + rad * (cos * N.y + sin * B.y);
      vertex.z = pt.z + rad * (cos * N.z + sin * B.z);
      positions.push(vertex.x, vertex.y, vertex.z);
      uvs.push(u, t);
    }
  }

  for (let i = 0; i < tubularSegs; i++) {
    for (let j = 0; j < radialSegs; j++) {
      const a = i * cols + j;
      const b = (i + 1) * cols + j;
      const c = (i + 1) * cols + j + 1;
      const d = i * cols + j + 1;
      indices.push(a, b, d, b, c, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/**
 * High-resolution sculpted anatomical nose mesh seated into the mid-face:
 * - Crisp aquiline dorsal ridge with planar beveled side walls
 * - Chiseled bulbous nasal tip overhanging a distinct columella septum
 * - Flared left/right alar nostril wings separated by a real alar crease
 * - Concave underside nostril pockets
 */
export function createSculptedNoseGeometry(
  widthScale = 1.0,
  aquilineStrength = 1.0,
): THREE.BufferGeometry {
  const radialSegs = 40;
  const heightSegs = 28;
  const cols = radialSegs + 1;
  const rows = heightSegs + 1;

  const yMin = 0.095;
  const yMax = 0.208;
  const ySpan = yMax - yMin;

  const profileKeys = [
    { y: 0.095, rx: 0.012, zF: 0.202, zB: 0.172, flat: 0.4 },
    { y: 0.104, rx: 0.028, zF: 0.242, zB: 0.172, flat: 0.45 },
    { y: 0.118, rx: 0.032, zF: 0.268 + 0.008 * aquilineStrength, zB: 0.170, flat: 0.55 },
    { y: 0.135, rx: 0.022, zF: 0.262 + 0.007 * aquilineStrength, zB: 0.170, flat: 0.72 },
    { y: 0.162, rx: 0.018, zF: 0.246 + 0.009 * aquilineStrength, zB: 0.170, flat: 0.78 },
    { y: 0.186, rx: 0.015, zF: 0.220, zB: 0.170, flat: 0.65 },
    { y: 0.208, rx: 0.018, zF: 0.204, zB: 0.172, flat: 0.42 },
  ];

  const sampleProfile = (y: number) => {
    for (let i = 0; i < profileKeys.length - 1; i++) {
      const a = profileKeys[i];
      const b = profileKeys[i + 1];
      if (y >= a.y && y <= b.y) {
        const t = smoothstep(a.y, b.y, y);
        return {
          rx: THREE.MathUtils.lerp(a.rx, b.rx, t),
          zF: THREE.MathUtils.lerp(a.zF, b.zF, t),
          zB: THREE.MathUtils.lerp(a.zB, b.zB, t),
          flat: THREE.MathUtils.lerp(a.flat, b.flat, t),
        };
      }
    }
    const last = profileKeys[profileKeys.length - 1];
    return { rx: last.rx, zF: last.zF, zB: last.zB, flat: last.flat };
  };

  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let r = 0; r < rows; r++) {
    const v = r / heightSegs;
    const rawY = yMin + v * ySpan;
    const prof = sampleProfile(rawY);
    const zMid = (prof.zF + prof.zB) * 0.5;
    const zHalf = (prof.zF - prof.zB) * 0.5;

    for (let c = 0; c < cols; c++) {
      const u = c / radialSegs;
      const theta = (u - 0.5) * Math.PI * 2;
      const sinT = Math.sin(theta);
      const cosT = Math.cos(theta);
      const absSin = Math.abs(sinT);
      const absTheta = Math.abs(theta);

      // Softly beveled superellipse cross-section for sculpted dorsal plane & smooth sidewalls
      const exp = 2.0 + prof.flat * 0.25;
      const normScale = Math.pow(
        Math.pow(absSin, exp) + Math.pow(Math.abs(cosT), exp),
        -1 / exp,
      );

      let x = sinT * normScale * prof.rx * widthScale;
      let z = zMid + cosT * normScale * zHalf;
      let y = rawY;

      // Chiseled central tip projection & slight downward aquiline hook
      const tipW = gaussianFalloff(Math.hypot(theta * 2.4, (rawY - 0.118) * 58), 0.55);
      z += tipW * (0.009 + 0.005 * aquilineStrength);
      y -= tipW * 0.004 * aquilineStrength;

      // Alar crease indenting cleanly between tip lobe and outer nostril wings
      const wingBand = smoothstep(0.098, 0.108, rawY) * (1 - smoothstep(0.128, 0.144, rawY));
      const alarGroove = gaussianFalloff((absTheta - 0.58) * 3.8, 0.45) * wingBand;
      x -= Math.sign(sinT) * alarGroove * 0.0045 * widthScale;
      z -= alarGroove * 0.008;

      // Flared alar nostril wings
      const alarWing = gaussianFalloff((absTheta - 0.96) * 2.8, 0.52) * wingBand;
      x += Math.sign(sinT) * alarWing * 0.0075 * widthScale;
      z += alarWing * 0.006;

      // Concave underside nostril pockets flanking the central columella septum
      if (rawY < 0.112 && cosT > 0) {
        const pocketBand = smoothstep(0.112, 0.099, rawY);
        const pocketW = gaussianFalloff((absTheta - 0.44) * 3.4, 0.45) * pocketBand;
        y += pocketW * 0.0075;
        z -= pocketW * 0.0065;
      }

      positions.push(x, y, z);
      // Match faceMap UV coordinates seamlessly
      uvs.push(0.5 + x * 0.85, (y + 0.065) / 0.41);
    }
  }

  for (let r = 0; r < heightSegs; r++) {
    for (let c = 0; c < radialSegs; c++) {
      const a = r * cols + c;
      const b = r * cols + c + 1;
      const cIdx = (r + 1) * cols + c + 1;
      const d = (r + 1) * cols + c;
      indices.push(a, b, cIdx, a, cIdx, d);
    }
  }

  // Cap bottom & top tucked safely inside the face
  const cBot = positions.length / 3;
  positions.push(0, yMin, 0.184);
  uvs.push(0.5, (yMin + 0.065) / 0.41);
  for (let c = 0; c < radialSegs; c++) {
    indices.push(cBot, c + 1, c);
  }

  const cTop = positions.length / 3;
  positions.push(0, yMax, 0.186);
  uvs.push(0.5, (yMax + 0.065) / 0.41);
  const topStart = heightSegs * cols;
  for (let c = 0; c < radialSegs; c++) {
    indices.push(cTop, topStart + c, topStart + c + 1);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();

  const norm = geo.attributes.normal;
  for (let r = 0; r < rows; r++) {
    const i0 = r * cols;
    const i1 = r * cols + radialSegs;
    const nx = (norm.getX(i0) + norm.getX(i1)) * 0.5;
    const ny = (norm.getY(i0) + norm.getY(i1)) * 0.5;
    const nz = (norm.getZ(i0) + norm.getZ(i1)) * 0.5;
    const len = Math.hypot(nx, ny, nz) || 1;
    norm.setXYZ(i0, nx / len, ny / len, nz / len);
    norm.setXYZ(i1, nx / len, ny / len, nz / len);
  }
  norm.needsUpdate = true;
  return geo;
}

/**
 * Anatomical chiseled palm & wrist bridge mesh:
 * - Smooth oval wrist transition up into forearm
 * - Planar dorsal back-of-hand with 4 raised metacarpal tendon/knuckle ridges
 * - Cupped palm hollow with fleshy thenar thumb pad & firm hypothenar heel
 * - Diagonal knuckle slope from index (-sideSign) to pinky (+sideSign)
 */
export function createSculptedPalmGeometry(sideSign: number): THREE.BufferGeometry {
  const radialSegs = 28;
  const heightSegs = 16;
  const cols = radialSegs + 1;
  const rows = heightSegs + 1;

  const yMin = -0.048;
  const yMax = 0.038;
  const ySpan = yMax - yMin;

  const palmKeys = [
    { y: -0.048, rx: 0.041, rz: 0.019, xOff: sideSign * 0.002, zOff: 0.002, flat: 0.68 },
    { y: -0.026, rx: 0.046, rz: 0.024, xOff: sideSign * 0.002, zOff: 0.002, flat: 0.72 },
    { y: 0.0, rx: 0.044, rz: 0.026, xOff: -sideSign * 0.002, zOff: 0.0, flat: 0.58 },
    { y: 0.022, rx: 0.038, rz: 0.027, xOff: 0.0, zOff: -0.001, flat: 0.32 },
    { y: 0.038, rx: 0.035, rz: 0.028, xOff: 0.0, zOff: -0.002, flat: 0.14 },
  ];

  const samplePalm = (y: number) => {
    for (let i = 0; i < palmKeys.length - 1; i++) {
      const a = palmKeys[i];
      const b = palmKeys[i + 1];
      if (y >= a.y && y <= b.y) {
        const t = smoothstep(a.y, b.y, y);
        return {
          rx: THREE.MathUtils.lerp(a.rx, b.rx, t),
          rz: THREE.MathUtils.lerp(a.rz, b.rz, t),
          xOff: THREE.MathUtils.lerp(a.xOff, b.xOff, t),
          zOff: THREE.MathUtils.lerp(a.zOff, b.zOff, t),
          flat: THREE.MathUtils.lerp(a.flat, b.flat, t),
        };
      }
    }
    const last = palmKeys[palmKeys.length - 1];
    return last;
  };

  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let r = 0; r < rows; r++) {
    const v = r / heightSegs;
    const rawY = yMin + v * ySpan;
    const p = samplePalm(rawY);

    for (let c = 0; c < cols; c++) {
      const u = c / radialSegs;
      const theta = (u - 0.5) * Math.PI * 2;
      const sinT = Math.sin(theta);
      const cosT = Math.cos(theta);

      const exp = 2.0 + p.flat * 1.15;
      const normScale = Math.pow(
        Math.pow(Math.abs(sinT), exp) + Math.pow(Math.abs(cosT), exp),
        -1 / exp,
      );

      let x = p.xOff + sinT * normScale * p.rx;
      let z = p.zOff + cosT * normScale * p.rz;
      let y = rawY;

      // Diagonal knuckle slope (index slightly lower, pinky slightly higher)
      const knuckleSlope = smoothstep(0.01, -0.048, rawY);
      y += knuckleSlope * (sinT * sideSign) * 0.0065;

      // 4 Dorsal metacarpal tendon & knuckle ridges (+Z back of hand)
      if (cosT > 0.15) {
        const tendonBand = smoothstep(0.028, -0.022, rawY);
        const knuckleCrest = gaussianFalloff((rawY + 0.036) * 44, 0.55);
        for (let k = 0; k < 4; k++) {
          const kx = sideSign * (-0.022 + k * 0.015);
          const ridgeW = gaussianFalloff((x - kx) * 100, 0.52);
          z += ridgeW * (0.002 * tendonBand + 0.005 * knuckleCrest) * Math.max(0, cosT);
        }
      }

      // Palmar hollow cup & fleshy radial thenar pad (-Z inner palm, -sideSign thumb side)
      if (cosT < 0) {
        const palmCup = gaussianFalloff(Math.hypot(x * 24, (rawY + 0.01) * 30), 0.55);
        z += palmCup * 0.0065 * Math.min(1, -cosT * 1.4);

        const thenar = gaussianFalloff(
          Math.hypot((x + sideSign * 0.024) * 32, (rawY - 0.002) * 30),
          0.56,
        );
        z -= thenar * 0.009;
        x -= sideSign * thenar * 0.0065;
      }

      positions.push(x, y, z);
      uvs.push(u, v);
    }
  }

  for (let r = 0; r < heightSegs; r++) {
    for (let c = 0; c < radialSegs; c++) {
      const a = r * cols + c;
      const b = r * cols + c + 1;
      const cIdx = (r + 1) * cols + c + 1;
      const d = (r + 1) * cols + c;
      indices.push(a, b, cIdx, a, cIdx, d);
    }
  }

  const cBot = positions.length / 3;
  positions.push(sideSign * 0.002, yMin, 0.002);
  uvs.push(0.5, 0);
  for (let c = 0; c < radialSegs; c++) {
    indices.push(cBot, c + 1, c);
  }

  const cTop = positions.length / 3;
  positions.push(0, yMax, -0.002);
  uvs.push(0.5, 1);
  const topStart = heightSegs * cols;
  for (let c = 0; c < radialSegs; c++) {
    indices.push(cTop, topStart + c, topStart + c + 1);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();

  const norm = geo.attributes.normal;
  for (let r = 0; r < rows; r++) {
    const i0 = r * cols;
    const i1 = r * cols + radialSegs;
    const nx = (norm.getX(i0) + norm.getX(i1)) * 0.5;
    const ny = (norm.getY(i0) + norm.getY(i1)) * 0.5;
    const nz = (norm.getZ(i0) + norm.getZ(i1)) * 0.5;
    const len = Math.hypot(nx, ny, nz) || 1;
    norm.setXYZ(i0, nx / len, ny / len, nz / len);
    norm.setXYZ(i1, nx / len, ny / len, nz / len);
  }
  norm.needsUpdate = true;
  return geo;
}

/**
 * Sculpts a forged steel crescent sickle blade extending from bolster ferrule (-X tang)
 * forward and curving into a sharp beveled crescent hook:
 * - Blunt thickened outer spine
 * - Tapered hollow-ground bevel faces
 * - Razor-thin concave inner cutting edge
 */
export function createSickleBladeGeometry(): THREE.BufferGeometry {
  const spineCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.085, 0.0, 0.0),
    new THREE.Vector3(-0.15, 0.015, 0.0),
    new THREE.Vector3(-0.24, 0.068, 0.0),
    new THREE.Vector3(-0.315, 0.165, 0.0),
    new THREE.Vector3(-0.31, 0.275, 0.0),
    new THREE.Vector3(-0.23, 0.345, 0.0),
    new THREE.Vector3(-0.125, 0.348, 0.0),
  ]);

  const segs = 28;
  const ringPts = 6; // closed diamond/wedge cross-section: outer top spine, mid-bevel, sharp inner edge, mid-bevel, outer bottom spine
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const pt = new THREE.Vector3();
  const tan = new THREE.Vector3();
  const inward = new THREE.Vector3();

  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    spineCurve.getPointAt(t, pt);
    spineCurve.getTangentAt(t, tan);

    // Inward normal in XY plane pointing toward the concave inside of the crescent hook
    inward.set(-tan.y, tan.x, 0).normalize();
    // Ensure inward points toward center of crescent (-0.18, 0.20, 0)
    const toCenterX = -0.18 - pt.x;
    const toCenterY = 0.2 - pt.y;
    if (inward.x * toCenterX + inward.y * toCenterY < 0) {
      inward.negate();
    }

    const tangFactor = smoothstep(0.0, 0.16, t);
    const tipTaper = 1 - Math.pow(smoothstep(0.45, 1.0, t), 1.35);
    const bladeW = (0.011 + 0.027 * tangFactor) * Math.max(0.06, tipTaper);
    const halfThick = (0.0046 - 0.0022 * t) * (0.45 + 0.55 * Math.max(0.15, tipTaper));

    const profile: Array<[number, number]> = [
      [0.0, halfThick],
      [bladeW * 0.35, halfThick * 0.88],
      [bladeW, 0.0005],
      [bladeW * 0.35, -halfThick * 0.88],
      [0.0, -halfThick],
      [-0.002, 0.0],
    ];

    for (let j = 0; j < ringPts; j++) {
      const [nOff, zOff] = profile[j];
      positions.push(
        pt.x + inward.x * nOff,
        pt.y + inward.y * nOff,
        pt.z + zOff,
      );
      uvs.push(j / ringPts, t);
    }
  }

  for (let i = 0; i < segs; i++) {
    for (let j = 0; j < ringPts; j++) {
      const jNext = (j + 1) % ringPts;
      const a = i * ringPts + j;
      const b = i * ringPts + jNext;
      const c = (i + 1) * ringPts + jNext;
      const d = (i + 1) * ringPts + j;
      indices.push(a, d, c, a, c, b);
    }
  }

  // Cap tang base and tip point
  const baseC = positions.length / 3;
  const p0 = spineCurve.getPointAt(0);
  positions.push(p0.x, p0.y, p0.z);
  uvs.push(0.5, 0);
  for (let j = 0; j < ringPts; j++) {
    indices.push(baseC, j, (j + 1) % ringPts);
  }

  const tipC = positions.length / 3;
  const p1 = spineCurve.getPointAt(1);
  positions.push(p1.x, p1.y, p1.z);
  uvs.push(0.5, 1);
  const lastBase = segs * ringPts;
  for (let j = 0; j < ringPts; j++) {
    indices.push(tipC, lastBase + ((j + 1) % ringPts), lastBase + j);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

