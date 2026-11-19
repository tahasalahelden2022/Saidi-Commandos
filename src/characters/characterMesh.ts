import * as THREE from 'three';
import {
  blendCharacterAnimation,
  mountCharacterGLB,
  type AnimatedGLBRig,
} from '../game/characterModelLoader';
import type { AnimPose, HeroId } from '../types/game';

export type ArticulatedCharacterRig = AnimatedGLBRig;

export function createArticulatedCharacter(
  role: HeroId | 'guard' | 'vip',
  contactShadowTex: THREE.Texture,
  selectionRingTex?: THREE.Texture,
  _clothBumpTex?: THREE.Texture,
): ArticulatedCharacterRig {
  const root = new THREE.Group();
  const modelMount = new THREE.Group();
  root.add(modelMount);

  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];

  const trackGeo = <T extends THREE.BufferGeometry>(g: T): T => {
    geometries.push(g);
    return g;
  };
  const trackMat = <T extends THREE.Material>(m: T): T => {
    materials.push(m);
    return m;
  };

  // 1. Soft Radial Contact Shadow
  const shadowGeo = trackGeo(new THREE.PlaneGeometry(1.5, 1.5));
  shadowGeo.rotateX(-Math.PI / 2);
  const shadowMat = trackMat(
    new THREE.MeshBasicMaterial({
      map: contactShadowTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.66,
    }),
  );
  const contactShadow = new THREE.Mesh(shadowGeo, shadowMat);
  contactShadow.position.y = 0.015;
  contactShadow.renderOrder = 1;
  root.add(contactShadow);

  // 2. Selection Ring (Heroes only)
  let selectionRing: THREE.Mesh | undefined;
  if (selectionRingTex) {
    const ringGeo = trackGeo(new THREE.PlaneGeometry(1.68, 1.68));
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = trackMat(
      new THREE.MeshBasicMaterial({
        map: selectionRingTex,
        transparent: true,
        depthWrite: false,
        opacity: 0.95,
      }),
    );
    selectionRing = new THREE.Mesh(ringGeo, ringMat);
    selectionRing.position.y = 0.03;
    selectionRing.visible = false;
    selectionRing.renderOrder = 3;
    root.add(selectionRing);
  }

  // 3. Invisible simplified raycast hitbox
  const hitBox = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.58, 0.58, 1.98, 8)),
    trackMat(new THREE.MeshBasicMaterial({ visible: false })),
  );
  hitBox.position.y = 0.99;
  root.add(hitBox);

  const rig: ArticulatedCharacterRig = {
    root,
    modelMount,
    mixer: null,
    actions: {},
    currentAction: null,
    activePose: null,
    pendingPose: 'idle',
    selectionRing,
    hitBox,
    contactShadow,
    disposed: false,
    dispose: () => {
      rig.disposed = true;
      if (rig.mixer) {
        rig.mixer.stopAllAction();
        rig.mixer.uncacheRoot(rig.mixer.getRoot());
      }
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
    },
  };

  // Asynchronously load and mount the character's GLB model + AnimationMixer clips
  mountCharacterGLB(rig, role, materials);

  return rig;
}

export function animateCharacterRig(
  rig: ArticulatedCharacterRig,
  pose: AnimPose,
  _phase: number,
  dt: number,
  actionTimer = 0,
): void {
  blendCharacterAnimation(rig, pose, dt, actionTimer);
}
