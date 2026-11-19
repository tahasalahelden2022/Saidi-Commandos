import * as THREE from 'three';

function makeQuatTrack(
  nodeName: string,
  times: number[],
  eulers: Array<[number, number, number]>,
): THREE.QuaternionKeyframeTrack {
  const values: number[] = [];
  const q = new THREE.Quaternion();
  const e = new THREE.Euler(0, 0, 0, 'XYZ');
  for (const [rx, ry, rz] of eulers) {
    e.set(rx, ry, rz, 'XYZ');
    q.setFromEuler(e);
    values.push(q.x, q.y, q.z, q.w);
  }
  return new THREE.QuaternionKeyframeTrack(`${nodeName}.quaternion`, times, values);
}

function makePosTrack(
  nodeName: string,
  times: number[],
  positions: Array<[number, number, number]>,
): THREE.VectorKeyframeTrack {
  const values: number[] = [];
  for (const [x, y, z] of positions) {
    values.push(x, y, z);
  }
  return new THREE.VectorKeyframeTrack(`${nodeName}.position`, times, values);
}

function createCycleClip(
  name: string,
  duration: number,
  sampleCount: number,
  sampler: (phase: number) => {
    pivotY: number;
    pivotRx?: number;
    torsoEuler: [number, number, number];
    headEuler: [number, number, number];
    leftArmEuler: [number, number, number];
    rightArmEuler: [number, number, number];
    leftLegEuler: [number, number, number];
    rightLegEuler: [number, number, number];
  },
): THREE.AnimationClip {
  const times: number[] = [];
  const pivotPos: Array<[number, number, number]> = [];
  const pivotQuat: Array<[number, number, number]> = [];
  const torsoE: Array<[number, number, number]> = [];
  const headE: Array<[number, number, number]> = [];
  const lArmE: Array<[number, number, number]> = [];
  const rArmE: Array<[number, number, number]> = [];
  const lLegE: Array<[number, number, number]> = [];
  const rLegE: Array<[number, number, number]> = [];

  for (let i = 0; i <= sampleCount; i++) {
    const tNorm = i / sampleCount;
    const t = tNorm * duration;
    // Wrap exact final sample to tNorm = 0 for seamless looping
    const phase = (i === sampleCount ? 0 : tNorm) * Math.PI * 2;
    const frame = sampler(phase);
    times.push(t);
    pivotPos.push([0, frame.pivotY, 0]);
    pivotQuat.push([frame.pivotRx ?? 0, 0, 0]);
    torsoE.push(frame.torsoEuler);
    headE.push(frame.headEuler);
    lArmE.push(frame.leftArmEuler);
    rArmE.push(frame.rightArmEuler);
    lLegE.push(frame.leftLegEuler);
    rLegE.push(frame.rightLegEuler);
  }

  return new THREE.AnimationClip(name, duration, [
    makePosTrack('bodyPivot', times, pivotPos),
    makeQuatTrack('bodyPivot', times, pivotQuat),
    makeQuatTrack('torso', times, torsoE),
    makeQuatTrack('headGroup', times, headE),
    makeQuatTrack('leftArm', times, lArmE),
    makeQuatTrack('rightArm', times, rArmE),
    makeQuatTrack('leftLeg', times, lLegE),
    makeQuatTrack('rightLeg', times, rLegE),
  ]);
}

export function buildCharacterAnimationClips(): THREE.AnimationClip[] {
  // 1. Idle (2.0s breathing & subtle alert scan)
  const idle = createCycleClip('Idle', 2.0, 12, (p) => ({
    pivotY: Math.sin(p) * 0.014,
    torsoEuler: [0.025 + Math.sin(p) * 0.015, Math.sin(p * 0.5) * 0.03, 0],
    headEuler: [-0.015, Math.sin(p) * 0.06, 0],
    leftArmEuler: [Math.sin(p) * 0.03, 0, -0.11],
    rightArmEuler: [-Math.sin(p) * 0.03, 0, 0.11],
    leftLegEuler: [0, 0, 0],
    rightLegEuler: [0, 0, 0],
  }));

  // 2. Walk (0.88s balanced tactical stride)
  const walk = createCycleClip('Walk', 0.88, 16, (p) => {
    const leg = Math.sin(p) * 0.34;
    const arm = Math.sin(p) * 0.36;
    return {
      pivotY: Math.abs(Math.sin(p)) * 0.038,
      torsoEuler: [0.075, Math.sin(p) * 0.07, 0],
      headEuler: [-0.04, -Math.sin(p) * 0.05, 0],
      leftArmEuler: [-arm, 0, -0.12],
      rightArmEuler: [arm, 0, 0.12],
      leftLegEuler: [leg, 0, 0],
      rightLegEuler: [-leg, 0, 0],
    };
  });

  // 3. Run (0.56s athletic sprint)
  const run = createCycleClip('Run', 0.56, 16, (p) => {
    const leg = Math.sin(p) * 0.48;
    const arm = Math.sin(p) * 0.68;
    return {
      pivotY: Math.abs(Math.sin(p)) * 0.07,
      torsoEuler: [0.22, Math.sin(p) * 0.11, 0],
      headEuler: [-0.12, -Math.sin(p) * 0.07, 0],
      leftArmEuler: [-arm - 0.18, 0, -0.15],
      rightArmEuler: [arm - 0.18, 0, 0.15],
      leftLegEuler: [leg, 0, 0],
      rightLegEuler: [-leg, 0, 0],
    };
  });

  // 4. Crouch (1.4s low cover posture)
  const crouch = createCycleClip('Crouch', 1.4, 10, (p) => ({
    pivotY: -0.34 + Math.sin(p) * 0.01,
    torsoEuler: [0.42, 0, 0],
    headEuler: [-0.32, Math.sin(p) * 0.05, 0],
    leftArmEuler: [-0.25, 0, -0.18],
    rightArmEuler: [-0.25, 0, 0.18],
    leftLegEuler: [-0.25, 0, 0],
    rightLegEuler: [0.2, 0, 0],
  }));

  // 5. Sneak (1.0s crouched stealth creep)
  const sneak = createCycleClip('Sneak', 1.0, 14, (p) => {
    const leg = Math.sin(p) * 0.38;
    const arm = Math.sin(p) * 0.3;
    return {
      pivotY: -0.32 + Math.abs(Math.sin(p)) * 0.03,
      torsoEuler: [0.46, Math.sin(p) * 0.07, 0],
      headEuler: [-0.34, -Math.sin(p) * 0.04, 0],
      leftArmEuler: [-arm - 0.22, 0, -0.18],
      rightArmEuler: [arm - 0.22, 0, 0.18],
      leftLegEuler: [leg, 0, 0],
      rightLegEuler: [-leg, 0, 0],
    };
  });

  // 6. Action (0.55s melee strike / interaction swing)
  const action = new THREE.AnimationClip('Action', 0.55, [
    makePosTrack('bodyPivot', [0, 0.22, 0.55], [
      [0, -0.02, 0],
      [0, -0.1, 0],
      [0, -0.04, 0],
    ]),
    makeQuatTrack('bodyPivot', [0, 0.55], [
      [0, 0, 0],
      [0, 0, 0],
    ]),
    makeQuatTrack('torso', [0, 0.22, 0.55], [
      [0.12, -0.15, 0],
      [0.36, 0.24, 0],
      [0.18, 0.05, 0],
    ]),
    makeQuatTrack('headGroup', [0, 0.22, 0.55], [
      [-0.08, 0.1, 0],
      [-0.2, -0.12, 0],
      [-0.1, 0, 0],
    ]),
    makeQuatTrack('leftArm', [0, 0.22, 0.55], [
      [-0.3, 0, -0.18],
      [-0.55, 0, -0.22],
      [-0.35, 0, -0.16],
    ]),
    makeQuatTrack('rightArm', [0, 0.22, 0.55], [
      [-0.6, 0, 0.2],
      [-1.75, 0, 0.14],
      [-1.1, 0, 0.16],
    ]),
    makeQuatTrack('leftLeg', [0, 0.55], [
      [0.15, 0, 0],
      [0.15, 0, 0],
    ]),
    makeQuatTrack('rightLeg', [0, 0.55], [
      [-0.15, 0, 0],
      [-0.15, 0, 0],
    ]),
  ]);

  // 7. KO (0.5s knockdown collapse)
  const ko = new THREE.AnimationClip('KO', 0.5, [
    makePosTrack('bodyPivot', [0, 0.5], [
      [0, 0, 0],
      [0, 0.18, 0],
    ]),
    makeQuatTrack('bodyPivot', [0, 0.5], [
      [0, 0, 0],
      [-Math.PI * 0.48, 0, 0],
    ]),
    makeQuatTrack('torso', [0, 0.5], [
      [0, 0, 0],
      [0.05, 0, 0],
    ]),
    makeQuatTrack('headGroup', [0, 0.5], [
      [0, 0, 0],
      [0.18, 0.22, 0],
    ]),
    makeQuatTrack('leftArm', [0, 0.5], [
      [0, 0, -0.14],
      [-0.55, 0, -0.42],
    ]),
    makeQuatTrack('rightArm', [0, 0.5], [
      [0, 0, 0.14],
      [0.42, 0, 0.38],
    ]),
    makeQuatTrack('leftLeg', [0, 0.5], [
      [0, 0, 0],
      [0.22, 0, -0.08],
    ]),
    makeQuatTrack('rightLeg', [0, 0.5], [
      [0, 0, 0],
      [-0.16, 0, 0.08],
    ]),
  ]);

  return [idle, walk, run, crouch, sneak, action, ko];
}
