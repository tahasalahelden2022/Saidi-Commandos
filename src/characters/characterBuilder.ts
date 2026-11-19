import * as THREE from 'three';
import { ROLE_COLORS, type CharacterRole } from './characterTextures';
import {
  createFacetedBrowGeometry,
  createOpenVestGeometry,
  createOrganicLoft,
  createRibbonWrapGeometry,
  createSculptedHeadGeometry,
  createSculptedNoseGeometry,
  createSculptedPalmGeometry,
  createSculptedTurbanGeometry,
  createSickleBladeGeometry,
  createTaperedSplineTube,
  type LoftSection,
} from './organicSculpt';

interface Proportions {
  shoulderHalfW: number;
  chestRx: number;
  chestRz: number;
  waistRx: number;
  waistRz: number;
  skirtBottomR: number;
  neckRx: number;
  armThickness: number;
  jawStrength: number;
  headWidth: number;
  armOriginX: number;
  legSpread: number;
  sleeveType: 'threeQuarter' | 'rolled' | 'full';
}

const PROPORTIONS: Record<CharacterRole, Proportions> = {
  hamdan: {
    shoulderHalfW: 0.242,
    chestRx: 0.226,
    chestRz: 0.156,
    waistRx: 0.168,
    waistRz: 0.134,
    skirtBottomR: 0.25,
    neckRx: 0.068,
    armThickness: 0.88,
    jawStrength: 1.32,
    headWidth: 1.0,
    armOriginX: 0.22,
    legSpread: 0.112,
    sleeveType: 'rolled',
  },
  salem: {
    shoulderHalfW: 0.212,
    chestRx: 0.198,
    chestRz: 0.138,
    waistRx: 0.146,
    waistRz: 0.118,
    skirtBottomR: 0.232,
    neckRx: 0.06,
    armThickness: 0.74,
    jawStrength: 0.85,
    headWidth: 0.93,
    armOriginX: 0.192,
    legSpread: 0.098,
    sleeveType: 'rolled',
  },
  bakri: {
    shoulderHalfW: 0.222,
    chestRx: 0.208,
    chestRz: 0.144,
    waistRx: 0.156,
    waistRz: 0.124,
    skirtBottomR: 0.24,
    neckRx: 0.063,
    armThickness: 0.78,
    jawStrength: 0.98,
    headWidth: 0.96,
    armOriginX: 0.202,
    legSpread: 0.104,
    sleeveType: 'full',
  },
  guard: {
    shoulderHalfW: 0.256,
    chestRx: 0.24,
    chestRz: 0.166,
    waistRx: 0.176,
    waistRz: 0.14,
    skirtBottomR: 0.216,
    neckRx: 0.072,
    armThickness: 0.92,
    jawStrength: 1.42,
    headWidth: 1.04,
    armOriginX: 0.234,
    legSpread: 0.116,
    sleeveType: 'rolled',
  },
  vip: {
    shoulderHalfW: 0.218,
    chestRx: 0.204,
    chestRz: 0.146,
    waistRx: 0.17,
    waistRz: 0.136,
    skirtBottomR: 0.242,
    neckRx: 0.062,
    armThickness: 0.74,
    jawStrength: 0.88,
    headWidth: 0.96,
    armOriginX: 0.198,
    legSpread: 0.102,
    sleeveType: 'full',
  },
};

function buildTorsoLoft(role: CharacterRole, p: Proportions): THREE.BufferGeometry {
  // Broad, organic linen drape folds (clean straight A-line silhouette for unbelted galabeyas)
  const skirtAmp = role === 'guard' ? 0.011 : 0.014;
  const skirtMod = (depthScale: number) => (theta: number) => {
    const fold1 = Math.sin(theta * 5 + 0.35) * 0.52;
    const fold2 = Math.cos(theta * 3 - 0.4) * 0.34;
    const fold3 = Math.sin(theta * 9 + 0.1) * 0.14;
    const frontGather = 1 + 0.06 * Math.exp(-theta * theta * 1.4);
    return 1 + (fold1 + fold2 + fold3) * skirtAmp * depthScale * frontGather;
  };

  // Fitted chest musculature for guard uniform vs natural draped linen chest for galabeyas
  const chestMod = (theta: number) => {
    const front = Math.max(0, Math.cos(theta));
    const back = Math.max(0, -Math.cos(theta));
    if (role === 'guard') {
      const pecBulge = front * Math.abs(Math.sin(theta)) * 0.11;
      const sternumDip = Math.exp(-theta * theta * 15) * -0.045;
      const latFlare = back * Math.abs(Math.sin(theta)) * 0.07;
      const spineGroove = back * Math.exp(-Math.pow(Math.abs(theta) - Math.PI, 2) * 14) * -0.03;
      return 1 + pecBulge + sternumDip + latFlare + spineGroove;
    }
    const clothChest = front * 0.032 + back * 0.024;
    const shoulderRound = Math.abs(Math.sin(theta)) * 0.016;
    return 1 + clothChest + shoulderRound;
  };

  // Anatomical neck & trapezius slope: SCM V-tendons + Adam's apple + posterior nuchal groove
  const neckMod = (theta: number) => {
    const front = Math.max(0, Math.cos(theta));
    const back = Math.max(0, -Math.cos(theta));
    const sternoRidge = front * Math.abs(Math.sin(theta)) * 0.085;
    const throatDip = Math.exp(-theta * theta * 18) * -0.038;
    const adamsApple = Math.exp(-theta * theta * 42) * 0.028;
    const trapRidge = back * Math.abs(Math.sin(theta)) * 0.07;
    const nuchalGroove = back * Math.exp(-Math.pow(Math.abs(theta) - Math.PI, 2) * 22) * -0.036;
    return 1 + sternoRidge + throatDip + adamsApple + trapRidge + nuchalGroove;
  };

  // Tailored straight/A-line galabeya drape (smooth drop from chest/shoulders without waist pinch or bell-cone flare)
  const midTorsoRx = p.chestRx * 0.93;
  const midTorsoRz = p.chestRz * 0.99;
  const midSections: LoftSection[] =
    role === 'guard'
      ? [
          { y: -0.28, rx: p.skirtBottomR, rz: p.skirtBottomR * 0.88, modulate: skirtMod(1.0) },
          { y: -0.15, rx: p.skirtBottomR * 0.96, rz: p.skirtBottomR * 0.85, modulate: skirtMod(0.8) },
          { y: -0.02, rx: p.waistRx * 1.18, rz: p.waistRz * 1.14, modulate: skirtMod(0.55) },
          { y: 0.05, rx: p.waistRx * 1.1, rz: p.waistRz * 1.1, modulate: skirtMod(0.32) },
          { y: 0.11, rx: p.waistRx * 0.95, rz: p.waistRz * 0.95 },
          { y: 0.18, rx: p.waistRx * 0.97, rz: p.waistRz * 0.97, zOffset: 0.004 },
          {
            y: 0.3,
            rx: THREE.MathUtils.lerp(p.waistRx, p.chestRx, 0.44),
            rz: THREE.MathUtils.lerp(p.waistRz, p.chestRz, 0.44),
            zOffset: 0.01,
            modulate: chestMod,
          },
        ]
      : [
          { y: -0.68, rx: p.skirtBottomR, rz: p.skirtBottomR * 0.98, modulate: skirtMod(1.0) },
          {
            y: -0.44,
            rx: THREE.MathUtils.lerp(midTorsoRx, p.skirtBottomR, 0.78),
            rz: THREE.MathUtils.lerp(midTorsoRz, p.skirtBottomR * 0.98, 0.78),
            modulate: skirtMod(0.82),
          },
          {
            y: -0.18,
            rx: THREE.MathUtils.lerp(midTorsoRx, p.skirtBottomR, 0.52),
            rz: THREE.MathUtils.lerp(midTorsoRz, p.skirtBottomR * 0.98, 0.52),
            modulate: skirtMod(0.6),
          },
          {
            y: 0.04,
            rx: THREE.MathUtils.lerp(midTorsoRx, p.skirtBottomR, 0.28),
            rz: THREE.MathUtils.lerp(midTorsoRz, p.skirtBottomR * 0.98, 0.28),
            zOffset: 0.005,
            modulate: skirtMod(0.36),
          },
          {
            y: 0.24,
            rx: THREE.MathUtils.lerp(midTorsoRx, p.skirtBottomR, 0.08),
            rz: THREE.MathUtils.lerp(midTorsoRz, p.skirtBottomR * 0.98, 0.08),
            zOffset: 0.01,
            modulate: chestMod,
          },
        ];

  const sections: LoftSection[] = [
    ...midSections,
    { y: 0.44, rx: p.chestRx, rz: p.chestRz, zOffset: 0.018, modulate: chestMod },
    { y: 0.565, rx: p.shoulderHalfW * 0.97, rz: p.chestRz * 0.88, zOffset: 0.01, modulate: chestMod },
    { y: 0.635, rx: p.neckRx * 1.5, rz: p.neckRx * 1.26, zOffset: 0.0, modulate: neckMod },
    { y: 0.695, rx: p.neckRx * 1.08, rz: p.neckRx * 1.02, zOffset: -0.008, modulate: neckMod },
    { y: 0.74, rx: p.neckRx * 1.02, rz: p.neckRx * 0.98, zOffset: -0.011, modulate: neckMod },
    { y: 0.775, rx: p.neckRx * 0.94, rz: p.neckRx * 0.9, zOffset: -0.011, modulate: neckMod },
  ];

  return createOrganicLoft(sections, 38, 3, true, true);
}

function buildArmLoft(
  sideSign: number,
  scale: number,
  sleeveType: Proportions['sleeveType'],
): THREE.BufferGeometry {
  const s = scale;
  const wristX = -sideSign * 0.007;
  const wristZ = 0.042;

  // Anatomical forearm muscle profile (brachioradialis ridge & flexor fullness)
  const forearmMod = (theta: number) => {
    const outer = Math.max(0, sideSign * Math.sin(theta));
    const front = Math.max(0, Math.cos(theta));
    return 1 + outer * 0.09 + front * 0.04;
  };

  const sections: LoftSection[] = [
    { y: -0.57, rx: 0.038 * s, rz: 0.035 * s, xOffset: wristX, zOffset: wristZ },
    { y: -0.5, rx: 0.047 * s, rz: 0.044 * s, xOffset: wristX * 0.7, zOffset: 0.036, modulate: forearmMod },
  ];

  if (sleeveType === 'full') {
    // Relaxed Egyptian galabeya full sleeve tapering gracefully to a tailored stitched cuff at wrist
    sections.push(
      { y: -0.474, rx: 0.048 * s, rz: 0.047 * s, xOffset: sideSign * 0.002, zOffset: 0.034 },
      { y: -0.462, rx: 0.071 * s, rz: 0.071 * s, xOffset: sideSign * 0.003, zOffset: 0.031 },
      { y: -0.39, rx: 0.073 * s, rz: 0.073 * s, xOffset: sideSign * 0.005, zOffset: 0.022 },
      { y: -0.26, rx: 0.078 * s, rz: 0.078 * s, xOffset: sideSign * 0.007, zOffset: 0.011 },
      { y: -0.13, rx: 0.084 * s, rz: 0.084 * s, xOffset: sideSign * 0.002, zOffset: 0.003 },
    );
  } else {
    // Muscular forearm + elbow crease + tailored folded fabric cuff + natural sleeve drop
    sections.push(
      {
        y: -0.39,
        rx: 0.066 * s,
        rz: 0.068 * s,
        xOffset: sideSign * 0.006,
        zOffset: 0.022,
        modulate: forearmMod,
      },
      { y: -0.325, rx: 0.058 * s, rz: 0.06 * s, xOffset: sideSign * 0.008, zOffset: 0.012 },
      { y: -0.305, rx: 0.078 * s, rz: 0.078 * s, xOffset: sideSign * 0.007, zOffset: 0.008 },
      { y: -0.255, rx: 0.081 * s, rz: 0.081 * s, xOffset: sideSign * 0.005, zOffset: 0.005 },
      { y: -0.21, rx: 0.079 * s, rz: 0.081 * s, xOffset: sideSign * 0.004, zOffset: 0.003 },
      { y: -0.11, rx: 0.086 * s, rz: 0.086 * s, xOffset: 0, zOffset: 0 },
    );
  }

  sections.push(
    { y: -0.01, rx: 0.091 * s, rz: 0.09 * s, xOffset: -sideSign * 0.008, zOffset: 0 },
    { y: 0.055, rx: 0.068 * s, rz: 0.066 * s, xOffset: -sideSign * 0.022, zOffset: 0 },
  );

  return createOrganicLoft(sections, 26, 2, true, true);
}

function buildLegLoft(hasSandals: boolean): THREE.BufferGeometry {
  const sections: LoftSection[] = hasSandals
    ? [
        { y: -0.875, rx: 0.056, rz: 0.088, zOffset: 0.026 },
        { y: -0.832, rx: 0.052, rz: 0.08, zOffset: 0.022 },
        { y: -0.775, rx: 0.044, rz: 0.056, zOffset: 0.006 },
        { y: -0.54, rx: 0.072, rz: 0.078, zOffset: -0.008 },
        { y: -0.43, rx: 0.064, rz: 0.068, zOffset: 0.003 },
        { y: -0.22, rx: 0.082, rz: 0.086, zOffset: 0.002 },
        { y: -0.02, rx: 0.088, rz: 0.092, zOffset: 0 },
      ]
    : [
        { y: -0.878, rx: 0.066, rz: 0.122, zOffset: 0.048 },
        { y: -0.832, rx: 0.062, rz: 0.112, zOffset: 0.042 },
        { y: -0.775, rx: 0.05, rz: 0.068, zOffset: 0.01 },
        { y: -0.52, rx: 0.074, rz: 0.08, zOffset: -0.005 },
        { y: -0.42, rx: 0.068, rz: 0.072, zOffset: 0.002 },
        { y: -0.22, rx: 0.084, rz: 0.088, zOffset: 0.002 },
        { y: -0.02, rx: 0.09, rz: 0.094, zOffset: 0 },
      ];
  return createOrganicLoft(sections, 24, 2, true, true);
}

/**
 * Composite 8-band sculpted Saidi turban tilted backward over the occiput,
 * matching front, side, and back overlapping folds in the turnaround.
 */
function buildSculptedTurbanGroup(
  matHeadgear: THREE.Material,
  tallness = 1.0,
): THREE.Group {
  const turbanGroup = new THREE.Group();
  turbanGroup.rotation.x = -0.065;
  turbanGroup.position.set(0, -0.010, 0.024);

  const coreDome = new THREE.Mesh(createSculptedTurbanGeometry(tallness), matHeadgear);
  coreDome.castShadow = true;
  coreDome.receiveShadow = true;
  turbanGroup.add(coreDome);

  const bands: Array<{
    pts: THREE.Vector3[];
    w: number;
    t: number;
    closed?: boolean;
  }> = [
    // 1. Lower front brow brim roll curving snugly above eyebrows and ears
    {
      pts: [
        new THREE.Vector3(-0.205, 0.252, 0.015),
        new THREE.Vector3(-0.145, 0.258, 0.172),
        new THREE.Vector3(0.0, 0.272, 0.206),
        new THREE.Vector3(0.148, 0.256, 0.17),
        new THREE.Vector3(0.206, 0.252, 0.01),
        new THREE.Vector3(0.162, 0.264, -0.178),
        new THREE.Vector3(0.0, 0.268, -0.22),
        new THREE.Vector3(-0.162, 0.264, -0.178),
      ],
      w: 0.052,
      t: 0.036,
      closed: true,
    },
    // 2. Front-left lower diagonal band swooping across temple to right crown & back
    {
      pts: [
        new THREE.Vector3(-0.198, 0.274, 0.075),
        new THREE.Vector3(-0.088, 0.302, 0.202),
        new THREE.Vector3(0.058, 0.33, 0.192),
        new THREE.Vector3(0.186, 0.34, 0.058),
        new THREE.Vector3(0.174, 0.318, -0.152),
        new THREE.Vector3(0.01, 0.288, -0.226),
      ],
      w: 0.062,
      t: 0.034,
    },
    // 3. Front-right overlapping cross band weaving higher over forehead to rear left
    {
      pts: [
        new THREE.Vector3(0.202, 0.282, 0.05),
        new THREE.Vector3(0.104, 0.31, 0.198),
        new THREE.Vector3(-0.046, 0.342, 0.192),
        new THREE.Vector3(-0.184, 0.35, 0.058),
        new THREE.Vector3(-0.172, 0.326, -0.148),
        new THREE.Vector3(-0.01, 0.29, -0.226),
      ],
      w: 0.064,
      t: 0.036,
    },
    // 4. Mid-side diagonal layer (left temple up toward rear crown)
    {
      pts: [
        new THREE.Vector3(-0.19, 0.312, 0.025),
        new THREE.Vector3(-0.178, 0.346, -0.095),
        new THREE.Vector3(-0.068, 0.362 * tallness, -0.204),
        new THREE.Vector3(0.095, 0.335 * tallness, -0.202),
      ],
      w: 0.054,
      t: 0.032,
    },
    // 5. Mid-side diagonal layer (right temple up toward rear crown)
    {
      pts: [
        new THREE.Vector3(0.19, 0.312, 0.025),
        new THREE.Vector3(0.178, 0.346, -0.095),
        new THREE.Vector3(0.068, 0.362 * tallness, -0.204),
        new THREE.Vector3(-0.095, 0.335 * tallness, -0.202),
      ],
      w: 0.054,
      t: 0.032,
    },
    // 6. Upper crown coil band (left to back-right)
    {
      pts: [
        new THREE.Vector3(-0.145, 0.356, 0.108),
        new THREE.Vector3(-0.015, 0.396 * tallness, 0.142),
        new THREE.Vector3(0.135, 0.386 * tallness, 0.038),
        new THREE.Vector3(0.145, 0.362 * tallness, -0.132),
        new THREE.Vector3(0.0, 0.338 * tallness, -0.212),
      ],
      w: 0.062,
      t: 0.032,
    },
    // 7. Upper crown opposing coil band (right to back-left)
    {
      pts: [
        new THREE.Vector3(0.142, 0.362, 0.098),
        new THREE.Vector3(0.02, 0.404 * tallness, 0.128),
        new THREE.Vector3(-0.132, 0.39 * tallness, 0.028),
        new THREE.Vector3(-0.145, 0.362 * tallness, -0.132),
        new THREE.Vector3(0.0, 0.336 * tallness, -0.212),
      ],
      w: 0.058,
      t: 0.03,
    },
    // 8. Rear lower X/V tuck fold (matches back turnaround view)
    {
      pts: [
        new THREE.Vector3(-0.168, 0.332, -0.135),
        new THREE.Vector3(-0.04, 0.302, -0.226),
        new THREE.Vector3(0.08, 0.275, -0.212),
        new THREE.Vector3(0.18, 0.282, -0.098),
      ],
      w: 0.056,
      t: 0.032,
    },
  ];

  for (const b of bands) {
    const bandMesh = new THREE.Mesh(
      createRibbonWrapGeometry(
        b.pts,
        (t) => b.w * (0.86 + Math.sin(t * Math.PI) * 0.2),
        () => b.t,
        b.closed ? 36 : 24,
        10,
        Boolean(b.closed),
        0.18,
      ),
      matHeadgear,
    );
    bandMesh.castShadow = true;
    bandMesh.receiveShadow = true;
    turbanGroup.add(bandMesh);
  }

  return turbanGroup;
}

/**
 * Pure Three.js character mesh hierarchy builder (zero DOM calls),
 * suitable both for exporting real GLB assets and runtime cloning.
 */
export function buildCharacterModelGroup(role: CharacterRole): THREE.Group {
  const pal = ROLE_COLORS[role];
  const props = PROPORTIONS[role];

  const modelRoot = new THREE.Group();
  modelRoot.name = `${role}_model`;

  const makeMat = (
    name: string,
    color: string | number,
    roughness: number,
    metalness: number,
  ): THREE.MeshStandardMaterial => {
    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(color),
      roughness,
      metalness,
    });
    mat.name = name;
    return mat;
  };

  const matBody = makeMat('matBody', pal.tunic, 0.84, 0.02);
  const matFace = makeMat('matFace', pal.skin, 0.56, 0.02);
  const matArm = makeMat('matArm', pal.tunic, 0.72, 0.02);
  const matLeg = makeMat('matLeg', pal.sandals ? pal.skin : pal.boot, 0.64, 0.04);
  const matHeadgear = makeMat('matHeadgear', pal.headgear, 0.82, 0.02);
  const matShawl = makeMat('matShawl', pal.accent, 0.82, 0.02);
  const matVest = makeMat('matVest', pal.accent, 0.84, 0.02);
  const matUndershirt = makeMat('matUndershirt', pal.undershirt, 0.86, 0.01);
  const matHair = makeMat('matHair', pal.hair, 0.78, 0.03);
  const matLeather = makeMat('matLeather', pal.belt, 0.48, 0.08);
  const matMetal = makeMat('matMetal', pal.buckle, 0.24, 0.88);
  const matWood = makeMat('matWood', 0x734423, 0.58, 0.05);
  const matGunSteel = makeMat('matGunSteel', 0x2d3238, 0.28, 0.84);
  const matSickleSteel = makeMat('matSickleSteel', 0xd5dce3, 0.22, 0.9);
  const matEyeWhite = makeMat('matEyeWhite', 0xfaf5ec, 0.15, 0.02);
  const matEyelid = makeMat('matEyelid', pal.skin, 0.54, 0.02);
  const matIris = makeMat('matIris', 0x4b2611, 0.12, 0.05);
  const matPupil = makeMat('matPupil', 0x0b0604, 0.05, 0.08);
  const matEyeGlint = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xffffff,
    emissiveIntensity: 0.55,
    roughness: 0.04,
    metalness: 0.0,
  });
  matEyeGlint.name = 'matEyeGlint';
  const matSkinPart = makeMat('matSkinPart', pal.skin, 0.56, 0.02);
  const matNostril = makeMat('matNostril', 0x2a1008, 0.94, 0.0);
  const nailColor = new THREE.Color(pal.skin).lerp(new THREE.Color(0xf6dfd0), 0.34);
  const matNail = makeMat('matNail', `#${nailColor.getHexString()}`, 0.32, 0.04);

  const bodyPivot = new THREE.Group();
  bodyPivot.name = 'bodyPivot';
  modelRoot.add(bodyPivot);

  const legGeo = buildLegLoft(pal.sandals);

  const addSandalStraps = (legGroup: THREE.Group) => {
    // Beveled anatomical sandal sole
    const soleShape = new THREE.Shape();
    soleShape.moveTo(-0.046, -0.064);
    soleShape.quadraticCurveTo(0, -0.08, 0.046, -0.064);
    soleShape.quadraticCurveTo(0.066, 0.015, 0.07, 0.108);
    soleShape.quadraticCurveTo(0.052, 0.182, 0.0, 0.188);
    soleShape.quadraticCurveTo(-0.058, 0.182, -0.068, 0.105);
    soleShape.quadraticCurveTo(-0.06, 0.015, -0.046, -0.064);

    const soleGeo = new THREE.ExtrudeGeometry(soleShape, {
      depth: 0.024,
      bevelEnabled: true,
      bevelThickness: 0.005,
      bevelSize: 0.004,
      bevelSegments: 2,
    });
    soleGeo.rotateX(Math.PI / 2);
    const sole = new THREE.Mesh(soleGeo, matLeather);
    sole.position.set(0, -0.872, 0.012);
    sole.castShadow = true;
    sole.receiveShadow = true;

    // Anatomical forefoot arch + 5 sculpted 3D toes
    const forefoot = new THREE.Mesh(new THREE.SphereGeometry(0.056, 14, 10), matSkinPart);
    forefoot.scale.set(1.04, 0.46, 0.9);
    forefoot.position.set(0, -0.854, 0.088);
    forefoot.castShadow = true;
    legGroup.add(forefoot);

    for (let t = 0; t < 5; t++) {
      const tx = -0.036 + t * 0.018;
      const tScale = t === 0 ? 1.24 : 1.0 - t * 0.1;
      const toe = new THREE.Mesh(new THREE.SphereGeometry(0.0102 * tScale, 8, 6), matSkinPart);
      toe.scale.set(0.92, 0.72, 1.54);
      toe.position.set(tx, -0.857, 0.148 - t * 0.005);
      toe.castShadow = true;
      legGroup.add(toe);
    }

    // Wide beveled instep leather strap + upper crossing strap + heel strap
    const frontStrap = new THREE.Mesh(
      createRibbonWrapGeometry(
        [
          new THREE.Vector3(-0.07, -0.866, 0.098),
          new THREE.Vector3(0, -0.826, 0.11),
          new THREE.Vector3(0.07, -0.866, 0.098),
        ],
        () => 0.028,
        () => 0.01,
        12,
        8,
        false,
        0,
      ),
      matLeather,
    );
    frontStrap.castShadow = true;

    const midStrap = new THREE.Mesh(
      createRibbonWrapGeometry(
        [
          new THREE.Vector3(-0.068, -0.86, 0.045),
          new THREE.Vector3(0, -0.816, 0.072),
          new THREE.Vector3(0.068, -0.86, 0.045),
        ],
        () => 0.024,
        () => 0.009,
        12,
        8,
        false,
        0,
      ),
      matLeather,
    );
    midStrap.castShadow = true;

    const ankleStrap = new THREE.Mesh(
      createTaperedSplineTube(
        [
          new THREE.Vector3(-0.064, -0.832, 0.016),
          new THREE.Vector3(0, -0.808, 0.06),
          new THREE.Vector3(0.064, -0.832, 0.016),
          new THREE.Vector3(0, -0.818, -0.044),
          new THREE.Vector3(-0.064, -0.832, 0.016),
        ],
        () => 0.01,
        16,
        6,
      ),
      matLeather,
    );

    const strapBuckle = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.018, 0.02), matMetal);
    strapBuckle.position.set(0.066, -0.828, 0.024);

    legGroup.add(sole, frontStrap, midStrap, ankleStrap, strapBuckle);
  };

  const leftLeg = new THREE.Group();
  leftLeg.name = 'leftLeg';
  leftLeg.position.set(-props.legSpread, 0.9, 0);
  const leftLegMesh = new THREE.Mesh(legGeo, matLeg);
  leftLegMesh.castShadow = true;
  leftLegMesh.receiveShadow = true;
  leftLeg.add(leftLegMesh);
  if (pal.sandals) addSandalStraps(leftLeg);

  const rightLeg = new THREE.Group();
  rightLeg.name = 'rightLeg';
  rightLeg.position.set(props.legSpread, 0.9, 0);
  const rightLegMesh = new THREE.Mesh(legGeo, matLeg);
  rightLegMesh.castShadow = true;
  rightLegMesh.receiveShadow = true;
  rightLeg.add(rightLegMesh);
  if (pal.sandals) addSandalStraps(rightLeg);

  bodyPivot.add(leftLeg, rightLeg);

  const torso = new THREE.Group();
  torso.name = 'torso';
  torso.position.y = 0.94;
  bodyPivot.add(torso);

  const torsoMesh = new THREE.Mesh(buildTorsoLoft(role, props), matBody);
  torsoMesh.castShadow = true;
  torsoMesh.receiveShadow = true;
  torso.add(torsoMesh);

  // Tailored 3D round band collar & narrow vertical U-placket hugging the chest contour
  if (role !== 'guard') {
    const zNeckFront = props.neckRx * 1.28 + 0.008;
    const zUpperChest = props.chestRz * 0.94 + 0.012;
    const zMidChest = props.chestRz + 0.017;

    const collarRing = new THREE.Mesh(
      createRibbonWrapGeometry(
        [
          new THREE.Vector3(-props.neckRx * 1.38, 0.638, 0.002),
          new THREE.Vector3(-props.neckRx * 0.95, 0.625, zNeckFront * 0.78),
          new THREE.Vector3(0.0, 0.616, zNeckFront + 0.008),
          new THREE.Vector3(props.neckRx * 0.95, 0.625, zNeckFront * 0.78),
          new THREE.Vector3(props.neckRx * 1.38, 0.638, 0.002),
          new THREE.Vector3(props.neckRx * 0.98, 0.646, -props.neckRx * 0.98),
          new THREE.Vector3(0.0, 0.65, -props.neckRx * 1.28),
          new THREE.Vector3(-props.neckRx * 0.98, 0.646, -props.neckRx * 0.98),
        ],
        () => 0.016,
        () => 0.007,
        32,
        8,
        true,
        0,
      ),
      matBody,
    );
    collarRing.castShadow = true;

    const placketPts = [
      new THREE.Vector3(-0.015, 0.614, zNeckFront + 0.008),
      new THREE.Vector3(-0.013, 0.54, zUpperChest),
      new THREE.Vector3(-0.01, 0.464, zMidChest),
      new THREE.Vector3(0.0, 0.45, zMidChest),
      new THREE.Vector3(0.01, 0.464, zMidChest),
      new THREE.Vector3(0.013, 0.54, zUpperChest),
      new THREE.Vector3(0.015, 0.614, zNeckFront + 0.008),
    ];
    const collarPlacket = new THREE.Mesh(
      createRibbonWrapGeometry(placketPts, () => 0.011, () => 0.0055, 24, 8, false, 0),
      matBody,
    );
    collarPlacket.castShadow = true;
    torso.add(collarRing, collarPlacket);
  }

  // Role-specific torso gear
  if (role === 'hamdan') {
    // Draped cream fringed neck wrap tucked smoothly along upper shoulders (leaves V-slit & belt buckle clear)
    const collarWrap = new THREE.Mesh(
      createRibbonWrapGeometry(
        [
          new THREE.Vector3(-0.105, 0.605, 0.075),
          new THREE.Vector3(-0.155, 0.615, -0.015),
          new THREE.Vector3(0.0, 0.63, -0.12),
          new THREE.Vector3(0.155, 0.615, -0.012),
          new THREE.Vector3(0.112, 0.568, 0.105),
        ],
        (t) => 0.064 + Math.sin(t * Math.PI) * 0.016,
        () => 0.026,
        28,
        10,
        false,
        0.12,
      ),
      matShawl,
    );
    collarWrap.castShadow = true;

    const shoulderTail = new THREE.Mesh(
      createRibbonWrapGeometry(
        [
          new THREE.Vector3(0.112, 0.568, 0.105),
          new THREE.Vector3(0.128, 0.405, 0.162),
          new THREE.Vector3(0.122, 0.245, 0.152),
        ],
        () => 0.062,
        () => 0.018,
        14,
        8,
        false,
        0.1,
      ),
      matShawl,
    );
    shoulderTail.castShadow = true;
    torso.add(collarWrap, shoulderTail);

    for (let f = -2; f <= 2; f++) {
      const tassel = new THREE.Mesh(
        createTaperedSplineTube(
          [
            new THREE.Vector3(0.122 + f * 0.011, 0.245, 0.152),
            new THREE.Vector3(0.122 + f * 0.012, 0.188, 0.158),
          ],
          () => 0.0045,
          4,
          6,
        ),
        matShawl,
      );
      torso.add(tassel);
    }
  } else if (role === 'bakri') {
    const vestMesh = new THREE.Mesh(
      createOpenVestGeometry(
        props.chestRx,
        props.chestRz,
        props.chestRx * 0.96,
        props.chestRz * 1.04,
        0.08,
        0.58,
      ),
      matVest,
    );
    vestMesh.castShadow = true;
    vestMesh.receiveShadow = true;

    const satchel = new THREE.Mesh(
      createOrganicLoft(
        [
          { y: -0.062, rx: 0.056, rz: 0.038 },
          { y: 0.015, rx: 0.062, rz: 0.044 },
          { y: 0.062, rx: 0.05, rz: 0.036 },
        ],
        14,
        2,
      ),
      matLeather,
    );
    satchel.position.set(0.215, 0.08, 0.045);
    satchel.castShadow = true;

    const satchelStrap = new THREE.Mesh(
      createRibbonWrapGeometry(
        [
          new THREE.Vector3(-0.105, 0.59, 0.06),
          new THREE.Vector3(0.045, 0.38, 0.168),
          new THREE.Vector3(0.215, 0.12, 0.055),
          new THREE.Vector3(0.055, 0.36, -0.132),
          new THREE.Vector3(-0.105, 0.59, 0.06),
        ],
        () => 0.02,
        () => 0.007,
        28,
        8,
        true,
        0,
      ),
      matLeather,
    );
    satchelStrap.castShadow = true;
    torso.add(vestMesh, satchel, satchelStrap);
  }

  // Sculpted 3D Leather Belt + Metal Buckle ONLY on the military guard uniform (galabeyas remain unbelted)
  if (role === 'guard') {
    const beltMesh = new THREE.Mesh(
      createOrganicLoft(
        [
          { y: 0.098, rx: props.waistRx * 1.03, rz: props.waistRz * 1.04, zOffset: 0.004 },
          { y: 0.11, rx: props.waistRx * 1.09, rz: props.waistRz * 1.11, zOffset: 0.005 },
          { y: 0.145, rx: props.waistRx * 1.1, rz: props.waistRz * 1.12, zOffset: 0.005 },
          { y: 0.18, rx: props.waistRx * 1.09, rz: props.waistRz * 1.11, zOffset: 0.005 },
          { y: 0.192, rx: props.waistRx * 1.03, rz: props.waistRz * 1.04, zOffset: 0.004 },
        ],
        32,
        2,
        false,
        false,
      ),
      matLeather,
    );
    beltMesh.castShadow = true;
    beltMesh.receiveShadow = true;

    // 3D Rectangular Beveled Metallic Buckle Frame + Prong + Keeper Loop
    const buckleGroup = new THREE.Group();
    buckleGroup.position.set(0, 0.145, props.waistRz * 1.13 + 0.006);
    buckleGroup.scale.setScalar(0.76);

    const frameTop = new THREE.Mesh(new THREE.BoxGeometry(0.105, 0.016, 0.022), matMetal);
    frameTop.position.y = 0.044;
    const frameBot = new THREE.Mesh(new THREE.BoxGeometry(0.105, 0.016, 0.022), matMetal);
    frameBot.position.y = -0.044;
    const frameLeft = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.104, 0.022), matMetal);
    frameLeft.position.x = -0.044;
    const frameRight = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.104, 0.022), matMetal);
    frameRight.position.x = 0.044;
    const prong = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.056, 8), matMetal);
    prong.rotation.z = Math.PI / 2;
    prong.position.set(-0.016, 0, 0.006);

    // Leather keeper loop & belt tongue next to buckle
    const keeper = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.108, 0.024), matLeather);
    keeper.position.set(0.072, 0, -0.004);
    const tongue = new THREE.Mesh(new THREE.BoxGeometry(0.068, 0.084, 0.014), matLeather);
    tongue.position.set(0.106, 0, -0.009);
    tongue.rotation.y = 0.28;

    buckleGroup.add(frameTop, frameBot, frameLeft, frameRight, prong, keeper, tongue);
    torso.add(beltMesh, buckleGroup);
  }

  const headGroup = new THREE.Group();
  headGroup.name = 'headGroup';
  headGroup.position.set(0, 0.755, 0.01);
  headGroup.scale.setScalar(0.615);
  torso.add(headGroup);

  const headMesh = new THREE.Mesh(
    createSculptedHeadGeometry(props.jawStrength, props.headWidth),
    matFace,
  );
  headMesh.castShadow = true;
  headMesh.receiveShadow = true;
  headGroup.add(headMesh);

  // High-resolution sculpted aquiline nose + recessed dark nostril apertures
  const aquilineStrength =
    role === 'hamdan' || role === 'guard' ? 1.18 : role === 'bakri' ? 0.95 : 0.85;
  const noseMesh = new THREE.Mesh(
    createSculptedNoseGeometry(props.headWidth, aquilineStrength),
    matFace,
  );
  noseMesh.castShadow = true;
  noseMesh.receiveShadow = true;
  headGroup.add(noseMesh);

  for (const side of [-1, 1]) {
    const nostrilCav = new THREE.Mesh(new THREE.SphereGeometry(0.0072, 10, 8), matNostril);
    nostrilCav.scale.set(0.85, 0.52, 1.35);
    nostrilCav.position.set(side * 0.0118 * props.headWidth, 0.104, 0.228);
    nostrilCav.rotation.set(0.32, side * 0.22, side * -0.18);
    headGroup.add(nostrilCav);
  }

  // 3D Sculpted Almond Eyes (deeply recessed into orbital sockets under brow ridge) & Ears
  const fierceAngle =
    role === 'hamdan' || role === 'guard' ? 0.16 : role === 'salem' ? 0.11 : 0.04;
  for (const side of [-1, 1]) {
    const eyeSocket = new THREE.Group();
    eyeSocket.position.set(side * 0.056 * props.headWidth, 0.174, 0.154);
    eyeSocket.rotation.y = side * 0.24;

    const sclera = new THREE.Mesh(new THREE.SphereGeometry(0.0195, 16, 14), matEyeWhite);
    sclera.scale.set(1.04, 0.72, 0.85);

    const iris = new THREE.Mesh(new THREE.SphereGeometry(0.0108, 14, 12), matIris);
    iris.scale.set(1.0, 1.0, 0.42);
    iris.position.set(-side * 0.002, 0.0, 0.0155);

    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.0056, 10, 8), matPupil);
    pupil.scale.set(1.0, 1.0, 0.45);
    pupil.position.set(-side * 0.002, 0.0, 0.0184);

    const glint = new THREE.Mesh(new THREE.SphereGeometry(0.002, 8, 6), matEyeGlint);
    glint.position.set(-side * 0.002 + 0.004, 0.0042, 0.0204);

    const glint2 = new THREE.Mesh(new THREE.SphereGeometry(0.001, 6, 6), matEyeGlint);
    glint2.position.set(-side * 0.002 - 0.0034, -0.0028, 0.02);

    // Sculpted upper eyelid hood arch & lash border
    const upperLid = new THREE.Mesh(
      createRibbonWrapGeometry(
        [
          new THREE.Vector3(-side * 0.02, 0.001, 0.01),
          new THREE.Vector3(0, 0.0105, 0.0185),
          new THREE.Vector3(side * 0.019, 0.0035, 0.009),
        ],
        () => 0.0095,
        () => 0.006,
        12,
        6,
        false,
        0,
      ),
      matEyelid,
    );
    upperLid.rotation.z = side * -fierceAngle;

    const lowerLid = new THREE.Mesh(
      createTaperedSplineTube(
        [
          new THREE.Vector3(-side * 0.018, -0.004, 0.01),
          new THREE.Vector3(0, -0.0105, 0.016),
          new THREE.Vector3(side * 0.017, -0.005, 0.009),
        ],
        (t) => 0.0036 * (0.7 + Math.sin(t * Math.PI) * 0.45),
        10,
        6,
      ),
      matEyelid,
    );

    const lashRim = new THREE.Mesh(
      createTaperedSplineTube(
        [
          new THREE.Vector3(-side * 0.019, 0.0, 0.011),
          new THREE.Vector3(0, 0.009, 0.019),
          new THREE.Vector3(side * 0.018, 0.0025, 0.01),
        ],
        (t) => 0.0024 * (0.7 + Math.sin(t * Math.PI) * 0.5),
        10,
        6,
      ),
      matHair,
    );
    lashRim.rotation.z = side * -fierceAngle;

    eyeSocket.add(sclera, iris, pupil, glint, glint2, upperLid, lowerLid, lashRim);
    headGroup.add(eyeSocket);

    // Sculpted 3D Anatomical Ear (outer C-helix + inner antihelix Y-ridge + concha + lobe)
    const ear = new THREE.Group();
    ear.position.set(side * 0.168 * props.headWidth, 0.138, -0.018);
    ear.rotation.y = side * 0.26;
    ear.rotation.x = -0.14;

    const earHelix = new THREE.Mesh(
      createTaperedSplineTube(
        [
          new THREE.Vector3(0, 0.044, 0.014),
          new THREE.Vector3(side * 0.02, 0.038, -0.014),
          new THREE.Vector3(side * 0.022, 0.0, -0.022),
          new THREE.Vector3(side * 0.014, -0.038, -0.008),
          new THREE.Vector3(0, -0.046, 0.009),
        ],
        (t) => 0.0125 + Math.sin(t * Math.PI) * 0.0045,
        16,
        8,
      ),
      matEyelid,
    );
    earHelix.castShadow = true;

    const earAntihelix = new THREE.Mesh(
      createTaperedSplineTube(
        [
          new THREE.Vector3(side * 0.005, 0.026, 0.002),
          new THREE.Vector3(side * 0.011, 0.002, -0.006),
          new THREE.Vector3(side * 0.006, -0.024, 0.002),
        ],
        () => 0.0075,
        10,
        6,
      ),
      matEyelid,
    );

    const earConcha = new THREE.Mesh(new THREE.SphereGeometry(0.025, 10, 8), matEyelid);
    earConcha.scale.set(0.42, 1.38, 0.86);
    earConcha.position.set(-side * 0.004, 0, -0.004);
    ear.add(earHelix, earAntihelix, earConcha);
    headGroup.add(ear);
  }

  // Faceted, Chiseled 3D Eyebrow Wedges overhanging the deep orbital eye sockets
  const browScale = role === 'hamdan' || role === 'guard' ? 1.15 : 0.82;
  const browFierce =
    role === 'hamdan' || role === 'guard' ? 1.15 : role === 'salem' ? 0.7 : 0.2;
  for (const side of [-1, 1]) {
    const browWedge = new THREE.Mesh(
      createFacetedBrowGeometry(side, props.headWidth, browScale, browFierce),
      matHair,
    );
    browWedge.castShadow = true;
    headGroup.add(browWedge);
  }

  // Heavy Sculpted Handlebar Mustache seated tightly under nasal septum with curled tips
  const stacheThick = role === 'guard' ? 0.028 : role === 'hamdan' ? 0.025 : 0.017;
  for (const side of [-1, 1]) {
    const wing = new THREE.Mesh(
      createTaperedSplineTube(
        [
          new THREE.Vector3(0, 0.084, 0.212),
          new THREE.Vector3(side * 0.032 * props.headWidth, 0.082, 0.208),
          new THREE.Vector3(side * 0.066 * props.headWidth, 0.066, 0.192),
          new THREE.Vector3(side * 0.092 * props.headWidth, 0.052, 0.170),
          new THREE.Vector3(side * 0.108 * props.headWidth, 0.065, 0.156),
        ],
        (t) => stacheThick * (0.58 + Math.sin(t * Math.PI * 0.85) * 0.52) * (1 - t * 0.52),
        18,
        10,
      ),
      matHair,
    );
    wing.castShadow = true;
    headGroup.add(wing);
  }

  if (role === 'vip') {
    const beard = new THREE.Mesh(
      createOrganicLoft(
        [
          { y: -0.14, rx: 0.022, rz: 0.022, zOffset: 0.115 },
          { y: -0.06, rx: 0.082, rz: 0.068, zOffset: 0.13 },
          { y: 0.018, rx: 0.135, rz: 0.092, zOffset: 0.125 },
        ],
        16,
        2,
      ),
      matHair,
    );
    beard.castShadow = true;
    headGroup.add(beard);
  }

  // Headgear: Multi-band sculpted turban for Hamdan, Bakri & VIP
  if (role === 'hamdan' || role === 'bakri' || role === 'vip') {
    headGroup.add(buildSculptedTurbanGroup(matHeadgear, role === 'vip' ? 1.1 : 1.0));
  } else if (role === 'salem') {
    const hairCrown = new THREE.Mesh(
      createOrganicLoft(
        [
          { y: 0.11, rx: 0.182, rz: 0.192, zOffset: -0.022 },
          { y: 0.23, rx: 0.204, rz: 0.208, zOffset: -0.015 },
          { y: 0.35, rx: 0.165, rz: 0.175, zOffset: -0.015 },
          { y: 0.41, rx: 0.07, rz: 0.075, zOffset: -0.015 },
        ],
        24,
        2,
        false,
        true,
      ),
      matHair,
    );
    hairCrown.castShadow = true;
    headGroup.add(hairCrown);

    const headband = new THREE.Mesh(
      createOrganicLoft(
        [
          { y: 0.244, rx: 0.206, rz: 0.214, zOffset: -0.012 },
          { y: 0.29, rx: 0.212, rz: 0.218, zOffset: -0.012 },
          { y: 0.332, rx: 0.202, rz: 0.21, zOffset: -0.012 },
        ],
        28,
        2,
        true,
        true,
      ),
      matHeadgear,
    );
    headband.castShadow = true;
    headGroup.add(headband);

    for (let i = 0; i < 12; i++) {
      const ang = (i / 12) * Math.PI * 2;
      const sx = Math.sin(ang) * 0.14;
      const sz = Math.cos(ang) * 0.14 - 0.015;
      const spike = new THREE.Mesh(
        createTaperedSplineTube(
          [
            new THREE.Vector3(sx * 0.8, 0.33, sz * 0.8),
            new THREE.Vector3(sx * 1.15, 0.42 + (i % 3) * 0.025, sz * 1.15),
            new THREE.Vector3(sx * 1.42, 0.47 + (i % 2) * 0.035, sz * 1.38),
          ],
          (t) => 0.042 * (1 - t * 0.88),
          8,
          7,
        ),
        matHair,
      );
      spike.castShadow = true;
      headGroup.add(spike);
    }
  } else if (role === 'guard') {
    const tarboosh = new THREE.Mesh(
      createOrganicLoft(
        [
          { y: 0.238, rx: 0.195, rz: 0.202, zOffset: -0.008 },
          { y: 0.31, rx: 0.178, rz: 0.184, zOffset: -0.008 },
          { y: 0.42, rx: 0.15, rz: 0.156, zOffset: -0.008 },
          { y: 0.45, rx: 0.11, rz: 0.115, zOffset: -0.008 },
        ],
        24,
        2,
        false,
        true,
      ),
      matHeadgear,
    );
    tarboosh.castShadow = true;

    const badge = new THREE.Mesh(new THREE.SphereGeometry(0.032, 10, 8), matMetal);
    badge.position.set(0, 0.33, 0.172);
    badge.scale.set(1, 1, 0.45);

    const tassel = new THREE.Mesh(
      createTaperedSplineTube(
        [
          new THREE.Vector3(0, 0.45, -0.008),
          new THREE.Vector3(-0.145, 0.43, -0.008),
          new THREE.Vector3(-0.185, 0.31, 0.008),
          new THREE.Vector3(-0.195, 0.21, 0.02),
        ],
        (t) => 0.014 + t * 0.016,
        14,
        8,
      ),
      matHair,
    );
    headGroup.add(tarboosh, badge, tassel);
  }

  // Sculpted Anatomical Planar Hand: realistic size, true forward-thumb orientation, and distinct relaxed vs tight weapon-grip pose
  const addSculptedHand = (
    armGroup: THREE.Group,
    sideSign: number,
    scale: number,
    gripPose: 'relaxed' | 'grip',
  ): { hand: THREE.Group; handScale: number } => {
    const handScale = 1.04 + (scale - 0.74) * 0.82;
    const hand = new THREE.Group();
    hand.position.set(-sideSign * 0.007, -0.576, 0.045);
    hand.rotation.y = sideSign * 1.24;
    hand.scale.setScalar(handScale);

    const palm = new THREE.Mesh(createSculptedPalmGeometry(sideSign), matSkinPart);
    palm.castShadow = true;
    palm.receiveShadow = true;
    hand.add(palm);

    // Muscular thenar thumb pad bulging along radial palm (-sideSign*X, -Z palm side)
    const thenarMound = new THREE.Mesh(new THREE.SphereGeometry(0.021, 12, 10), matSkinPart);
    thenarMound.scale.set(0.86, 1.48, 0.78);
    thenarMound.position.set(-sideSign * 0.023, -0.002, -0.011);
    thenarMound.rotation.z = sideSign * 0.24;
    thenarMound.castShadow = true;
    hand.add(thenarMound);

    // 4 distinctly proportioned, joint-articulated fingers (index, middle, ring, pinky) + fingernails
    const fingerSpecs = [
      { xOff: -0.022, yOff: -0.046, len: 0.96, rad: 0.0108, splay: -0.035 },
      { xOff: -0.007, yOff: -0.048, len: 1.06, rad: 0.0114, splay: -0.01 },
      { xOff: 0.008, yOff: -0.046, len: 0.98, rad: 0.0106, splay: 0.018 },
      { xOff: 0.022, yOff: -0.041, len: 0.8, rad: 0.0092, splay: 0.05 },
    ];

    for (const spec of fingerSpecs) {
      const fx = sideSign * spec.xOff;
      const splayX = sideSign * spec.splay * 0.045;
      const ky = spec.yOff;
      const L = spec.len;

      // Prominent metacarpal knuckle cap on dorsal edge
      const knuckle = new THREE.Mesh(new THREE.SphereGeometry(spec.rad * 1.08, 10, 8), matSkinPart);
      knuckle.scale.set(1.0, 0.92, 0.96);
      knuckle.position.set(fx, ky + 0.003, 0.008);
      knuckle.castShadow = true;
      hand.add(knuckle);

      const pts =
        gripPose === 'grip'
          ? [
              new THREE.Vector3(fx, ky + 0.002, 0.006),
              new THREE.Vector3(fx + splayX * 0.3, ky - 0.024 * L, -0.002),
              new THREE.Vector3(fx + splayX * 0.4, ky - 0.038 * L, -0.025),
              new THREE.Vector3(fx * 0.96 + splayX * 0.3, ky - 0.023 * L, -0.045),
              new THREE.Vector3(fx * 0.92, ky - 0.002, -0.034),
            ]
          : [
              new THREE.Vector3(fx, ky + 0.002, 0.008),
              new THREE.Vector3(fx + splayX * 0.4, ky - 0.034 * L, 0.002),
              new THREE.Vector3(fx + splayX * 0.8, ky - 0.062 * L, -0.012),
              new THREE.Vector3(fx * 0.95 + splayX, ky - 0.08 * L, -0.026),
              new THREE.Vector3(fx * 0.92 + splayX, ky - 0.088 * L, -0.032),
            ];

      const finger = new THREE.Mesh(
        createTaperedSplineTube(
          pts,
          (t) => {
            const taper = 1 - t * 0.26;
            const pipSwell = Math.exp(-Math.pow((t - 0.36) * 9, 2)) * 0.14;
            const dipSwell = Math.exp(-Math.pow((t - 0.7) * 10, 2)) * 0.1;
            return spec.rad * (taper + pipSwell + dipSwell);
          },
          16,
          10,
        ),
        matSkinPart,
      );
      finger.castShadow = true;
      hand.add(finger);

      // Subtle sculpted fingernail plate on outer/distal surface
      const nail = new THREE.Mesh(new THREE.SphereGeometry(spec.rad * 0.65, 8, 6), matNail);
      nail.scale.set(0.86, 0.95, 0.36);
      if (gripPose === 'grip') {
        nail.position.set(fx * 0.94, ky - 0.012, -0.043);
        nail.rotation.x = 0.35;
      } else {
        nail.position.set(fx * 0.93 + splayX, ky - 0.081 * L, -0.023);
        nail.rotation.x = -0.35;
      }
      hand.add(nail);
    }

    // Muscular two-segment articulated thumb opposing on the PALM (-Z) side
    const thumbPts =
      gripPose === 'grip'
        ? [
            new THREE.Vector3(-sideSign * 0.026, 0.004, -0.01),
            new THREE.Vector3(-sideSign * 0.04, -0.024, -0.024),
            new THREE.Vector3(-sideSign * 0.03, -0.038, -0.036),
            new THREE.Vector3(-sideSign * 0.004, -0.046, -0.042),
          ]
        : [
            new THREE.Vector3(-sideSign * 0.026, 0.006, -0.008),
            new THREE.Vector3(-sideSign * 0.042, -0.022, -0.018),
            new THREE.Vector3(-sideSign * 0.04, -0.048, -0.025),
            new THREE.Vector3(-sideSign * 0.03, -0.068, -0.027),
          ];

    const thumb = new THREE.Mesh(
      createTaperedSplineTube(
        thumbPts,
        (t) => {
          const base = 0.0138 * (1 - t * 0.25);
          const ipSwell = Math.exp(-Math.pow((t - 0.56) * 8, 2)) * 0.002;
          return base + ipSwell;
        },
        14,
        10,
      ),
      matSkinPart,
    );
    thumb.castShadow = true;
    hand.add(thumb);

    const thumbNail = new THREE.Mesh(new THREE.SphereGeometry(0.008, 8, 6), matNail);
    thumbNail.scale.set(0.88, 0.95, 0.36);
    if (gripPose === 'grip') {
      thumbNail.position.set(-sideSign * 0.009, -0.045, -0.048);
      thumbNail.rotation.set(0.25, sideSign * 0.35, 0);
    } else {
      thumbNail.position.set(-sideSign * 0.034, -0.064, -0.024);
      thumbNail.rotation.set(-0.2, sideSign * 0.65, 0);
    }
    hand.add(thumbNail);

    armGroup.add(hand);
    return { hand, handScale };
  };

  // Sculpted folded cloth sleeve cuff (replaces bulky donut rings with tailored linen fold)
  const addRolledCuffRings = (armGroup: THREE.Group, sideSign: number, scale: number) => {
    const cuffGeo = createOrganicLoft(
      [
        { y: -0.312, rx: 0.074 * scale, rz: 0.074 * scale, xOffset: sideSign * 0.007, zOffset: 0.008 },
        { y: -0.286, rx: 0.083 * scale, rz: 0.083 * scale, xOffset: sideSign * 0.006, zOffset: 0.007 },
        { y: -0.264, rx: 0.081 * scale, rz: 0.081 * scale, xOffset: sideSign * 0.006, zOffset: 0.006 },
        { y: -0.244, rx: 0.076 * scale, rz: 0.076 * scale, xOffset: sideSign * 0.005, zOffset: 0.005 },
      ],
      22,
      2,
      true,
      true,
    );
    const cuffMesh = new THREE.Mesh(cuffGeo, matBody);
    cuffMesh.castShadow = true;
    cuffMesh.receiveShadow = true;
    armGroup.add(cuffMesh);
  };

  const leftArm = new THREE.Group();
  leftArm.name = 'leftArm';
  leftArm.position.set(-props.armOriginX, 0.542, 0);
  leftArm.rotation.z = -0.1;
  const leftArmMesh = new THREE.Mesh(
    buildArmLoft(-1, props.armThickness, props.sleeveType),
    matArm,
  );
  leftArmMesh.castShadow = true;
  leftArmMesh.receiveShadow = true;
  leftArm.add(leftArmMesh);
  if (props.sleeveType !== 'full') addRolledCuffRings(leftArm, -1, props.armThickness);
  addSculptedHand(leftArm, -1, props.armThickness, 'relaxed');

  const rightArm = new THREE.Group();
  rightArm.name = 'rightArm';
  rightArm.position.set(props.armOriginX, 0.542, 0);
  rightArm.rotation.z = 0.1;
  const rightArmMesh = new THREE.Mesh(
    buildArmLoft(1, props.armThickness, props.sleeveType),
    matArm,
  );
  rightArmMesh.castShadow = true;
  rightArmMesh.receiveShadow = true;
  rightArm.add(rightArmMesh);
  if (props.sleeveType !== 'full') addRolledCuffRings(rightArm, 1, props.armThickness);
  const { hand: rightHand, handScale: rightHandScale } = addSculptedHand(
    rightArm,
    1,
    props.armThickness,
    'grip',
  );

  torso.add(leftArm, rightArm);

  // Exact grip cavity inside rightHand palm + curled fingers (where -X points forward & +Y points up)
  const weaponGripMount = new THREE.Group();
  weaponGripMount.position.set(0, -0.06, -0.024);
  weaponGripMount.scale.setScalar(1 / rightHandScale);
  rightHand.add(weaponGripMount);

  if (role === 'hamdan') {
    const shoumaGroup = new THREE.Group();
    shoumaGroup.rotation.z = -0.24;

    const shouma = new THREE.Mesh(
      createOrganicLoft(
        [
          { y: -0.18, rx: 0.017, rz: 0.017 },
          { y: -0.04, rx: 0.018, rz: 0.018 },
          { y: 0.08, rx: 0.02, rz: 0.02 },
          { y: 0.42, rx: 0.026, rz: 0.026 },
          { y: 0.72, rx: 0.032, rz: 0.032 },
          { y: 0.78, rx: 0.024, rz: 0.024 },
        ],
        14,
        2,
      ),
      matWood,
    );
    shouma.rotation.z = Math.PI / 2;
    shouma.castShadow = true;
    shoumaGroup.add(shouma);

    for (let r = -1; r <= 1; r++) {
      const gripRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.0195, 0.0045, 6, 12),
        matLeather,
      );
      gripRing.position.set(r * 0.024, 0, 0);
      gripRing.rotation.y = Math.PI / 2;
      shoumaGroup.add(gripRing);
    }
    weaponGripMount.add(shoumaGroup);
  } else if (role === 'salem') {
    const sickleGroup = new THREE.Group();
    sickleGroup.rotation.set(0.55, 0, -0.18);

    const sickleHandle = new THREE.Mesh(
      createOrganicLoft(
        [
          { y: -0.095, rx: 0.021, rz: 0.021 },
          { y: -0.06, rx: 0.017, rz: 0.017 },
          { y: 0.0, rx: 0.018, rz: 0.018 },
          { y: 0.075, rx: 0.019, rz: 0.019 },
          { y: 0.095, rx: 0.018, rz: 0.018 },
        ],
        14,
        2,
      ),
      matWood,
    );
    sickleHandle.rotation.z = Math.PI / 2;
    sickleHandle.castShadow = true;

    const ferrule = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0195, 0.0185, 0.028, 12),
      matMetal,
    );
    ferrule.rotation.z = Math.PI / 2;
    ferrule.position.set(-0.088, 0, 0);

    const crescentBlade = new THREE.Mesh(createSickleBladeGeometry(), matSickleSteel);
    crescentBlade.castShadow = true;

    sickleGroup.add(sickleHandle, ferrule, crescentBlade);
    weaponGripMount.add(sickleGroup);
  } else if (role === 'bakri') {
    const scopeGroup = new THREE.Group();
    scopeGroup.rotation.z = -0.16;

    const scope = new THREE.Mesh(
      createOrganicLoft(
        [
          { y: -0.15, rx: 0.024, rz: 0.024 },
          { y: -0.01, rx: 0.022, rz: 0.022 },
          { y: 0.02, rx: 0.018, rz: 0.018 },
          { y: 0.17, rx: 0.017, rz: 0.017 },
        ],
        14,
        1,
      ),
      matMetal,
    );
    scope.rotation.z = Math.PI / 2;
    scope.castShadow = true;
    scopeGroup.add(scope);
    weaponGripMount.add(scopeGroup);
  } else if (role === 'guard') {
    const rifleGroup = new THREE.Group();
    rifleGroup.rotation.z = -0.26;

    const stock = new THREE.Mesh(
      createOrganicLoft(
        [
          { y: -0.32, rx: 0.024, rz: 0.048 },
          { y: -0.04, rx: 0.019, rz: 0.032 },
          { y: 0.36, rx: 0.018, rz: 0.028 },
        ],
        12,
        2,
      ),
      matWood,
    );
    stock.rotation.z = Math.PI / 2;
    stock.position.set(-0.04, 0, 0);
    stock.castShadow = true;

    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.018, 0.68, 10), matGunSteel);
    barrel.rotation.z = Math.PI / 2;
    barrel.position.set(-0.46, 0.022, 0);
    barrel.castShadow = true;
    rifleGroup.add(stock, barrel);
    weaponGripMount.add(rifleGroup);
  } else if (role === 'vip') {
    const caneGroup = new THREE.Group();
    caneGroup.rotation.set(0, -1.24, -0.12);

    const cane = new THREE.Mesh(
      createTaperedSplineTube(
        [
          new THREE.Vector3(0, -0.84, 0),
          new THREE.Vector3(0, -0.41, 0),
          new THREE.Vector3(0, -0.01, 0),
          new THREE.Vector3(0, 0.045, 0.035),
          new THREE.Vector3(0, 0.01, 0.072),
        ],
        () => 0.015,
        20,
        8,
      ),
      matWood,
    );
    cane.castShadow = true;
    caneGroup.add(cane);
    weaponGripMount.add(caneGroup);
  }

  return modelRoot;
}
