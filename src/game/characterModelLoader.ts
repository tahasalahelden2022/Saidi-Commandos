import * as THREE from 'three';
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import {
  getRoleCharacterTextures,
  type CharacterRole,
} from '../characters/characterTextures';
import type { AnimPose } from '../types/game';

export interface AnimatedGLBRig {
  root: THREE.Group;
  modelMount: THREE.Group;
  mixer: THREE.AnimationMixer | null;
  actions: Partial<Record<AnimPose, THREE.AnimationAction>>;
  currentAction: THREE.AnimationAction | null;
  activePose: AnimPose | null;
  pendingPose: AnimPose;
  selectionRing?: THREE.Mesh;
  hitBox: THREE.Mesh;
  contactShadow: THREE.Mesh;
  disposed: boolean;
  dispose: () => void;
}

const MODEL_PATHS: Record<CharacterRole, string> = {
  hamdan: '/assets/characters/hamdan.glb',
  salem: '/assets/characters/salem.glb',
  bakri: '/assets/characters/bakri.glb',
  guard: '/assets/characters/guard.glb',
  vip: '/assets/characters/vip.glb',
};

const loader = new GLTFLoader();
const gltfCache = new Map<CharacterRole, Promise<GLTF>>();

export function loadCharacterGLB(role: CharacterRole): Promise<GLTF> {
  const cached = gltfCache.get(role);
  if (cached) return cached;

  const url = MODEL_PATHS[role];
  const promise = loader.loadAsync(url);
  gltfCache.set(role, promise);
  return promise;
}

export function preloadCharacterGLBs(): Promise<GLTF[]> {
  const roles: CharacterRole[] = ['hamdan', 'salem', 'bakri', 'guard', 'vip'];
  return Promise.all(roles.map((role) => loadCharacterGLB(role)));
}

function mapClipNameToPose(name: string): AnimPose | null {
  const lower = name.trim().toLowerCase();
  if (lower.includes('idle')) return 'idle';
  if (lower.includes('walk')) return 'walk';
  if (lower.includes('run') || lower.includes('sprint')) return 'run';
  if (lower.includes('crouch')) return 'crouch';
  if (lower.includes('sneak')) return 'sneak';
  if (lower.includes('action') || lower.includes('attack') || lower.includes('strike')) {
    return 'action';
  }
  if (lower.includes('ko') || lower.includes('death') || lower.includes('fall')) return 'ko';
  return null;
}

function configureMaterialWithRoleTextures(
  sourceMat: THREE.Material,
  role: CharacterRole,
  trackedMaterials: THREE.Material[],
): THREE.Material {
  const tex = getRoleCharacterTextures(role, 4);
  const name = sourceMat.name;
  const baseColor =
    sourceMat instanceof THREE.MeshStandardMaterial ? sourceMat.color.clone() : new THREE.Color(0xffffff);

  let mat: THREE.Material;

  if (name === 'matFace') {
    mat = new THREE.MeshStandardMaterial({
      name,
      map: tex.faceMap,
      bumpMap: tex.skinBump,
      bumpScale: 0.0035,
      roughness: 0.54,
      metalness: 0.02,
    });
  } else if (name === 'matSkinPart' || name === 'matEyelid') {
    mat = new THREE.MeshStandardMaterial({
      name,
      color: baseColor,
      bumpMap: tex.skinBump,
      bumpScale: 0.003,
      roughness: 0.56,
      metalness: 0.02,
    });
  } else if (name === 'matBody') {
    mat = new THREE.MeshPhysicalMaterial({
      name,
      map: tex.bodyMap,
      bumpMap: tex.clothBump,
      bumpScale: 0.0055,
      roughnessMap: tex.clothRoughness,
      roughness: 0.88,
      metalness: 0.0,
      sheen: 0.34,
      sheenRoughness: 0.85,
      sheenColor: new THREE.Color('#f4ead8'),
    });
  } else if (name === 'matArm') {
    mat = new THREE.MeshPhysicalMaterial({
      name,
      map: tex.armMap,
      bumpMap: tex.armBump,
      bumpScale: 0.0045,
      roughness: 0.78,
      metalness: 0.0,
      sheen: 0.18,
      sheenRoughness: 0.85,
      sheenColor: new THREE.Color('#f4ead8'),
    });
  } else if (name === 'matLeg') {
    mat = new THREE.MeshStandardMaterial({
      name,
      map: tex.legMap,
      bumpMap: tex.skinBump,
      bumpScale: 0.003,
      roughness: 0.64,
      metalness: 0.04,
    });
  } else if (name === 'matHeadgear') {
    mat = new THREE.MeshPhysicalMaterial({
      name,
      map: tex.turbanMap,
      bumpMap: tex.clothBump,
      bumpScale: 0.0065,
      roughnessMap: tex.clothRoughness,
      roughness: 0.86,
      metalness: 0.0,
      sheen: 0.28,
      sheenRoughness: 0.84,
      sheenColor: new THREE.Color('#f6efe2'),
    });
  } else if (name === 'matUndershirt') {
    mat = new THREE.MeshPhysicalMaterial({
      name,
      map: tex.undershirtMap,
      bumpMap: tex.clothBump,
      bumpScale: 0.004,
      roughness: 0.9,
      metalness: 0.0,
      sheen: 0.2,
    });
  } else if (name === 'matShawl' || name === 'matVest') {
    mat = new THREE.MeshPhysicalMaterial({
      name,
      color: baseColor,
      bumpMap: tex.clothBump,
      bumpScale: 0.0065,
      roughnessMap: tex.clothRoughness,
      roughness: 0.86,
      metalness: 0.0,
      sheen: 0.26,
      sheenRoughness: 0.84,
    });
  } else if (name === 'matLeather') {
    mat = new THREE.MeshStandardMaterial({
      name,
      map: tex.leatherMap,
      bumpMap: tex.leatherBump,
      bumpScale: 0.011,
      roughness: 0.46,
      metalness: 0.08,
    });
  } else if (name === 'matHair') {
    mat = new THREE.MeshStandardMaterial({
      name,
      color: baseColor,
      bumpMap: tex.hairBump,
      bumpScale: 0.012,
      roughness: 0.76,
      metalness: 0.04,
    });
  } else if (name === 'matIris') {
    mat = new THREE.MeshStandardMaterial({
      name,
      map: tex.irisMap,
      roughness: 0.12,
      metalness: 0.04,
    });
  } else if (name === 'matMetal') {
    mat = new THREE.MeshStandardMaterial({
      name,
      color: baseColor,
      roughness: 0.24,
      metalness: 0.88,
    });
  } else if (name === 'matSickleSteel') {
    mat = new THREE.MeshStandardMaterial({
      name,
      color: baseColor,
      roughness: 0.22,
      metalness: 0.9,
    });
  } else {
    mat = sourceMat.clone();
  }

  trackedMaterials.push(mat);
  return mat;
}

export function mountCharacterGLB(
  rig: AnimatedGLBRig,
  role: CharacterRole,
  trackedMaterials: THREE.Material[],
): void {
  void loadCharacterGLB(role)
    .then((gltf) => {
      if (rig.disposed) return;

      const clonedScene = SkeletonUtils.clone(gltf.scene) as THREE.Group;
      const materialMap = new Map<THREE.Material, THREE.Material>();

      clonedScene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.castShadow = true;
          obj.receiveShadow = true;
          if (Array.isArray(obj.material)) {
            obj.material = obj.material.map((m) => {
              let mapped = materialMap.get(m);
              if (!mapped) {
                mapped = configureMaterialWithRoleTextures(m, role, trackedMaterials);
                materialMap.set(m, mapped);
              }
              return mapped;
            });
          } else if (obj.material) {
            let mapped = materialMap.get(obj.material);
            if (!mapped) {
              mapped = configureMaterialWithRoleTextures(obj.material, role, trackedMaterials);
              materialMap.set(obj.material, mapped);
            }
            obj.material = mapped;
          }
        }
      });

      rig.modelMount.clear();
      rig.modelMount.add(clonedScene);

      const mixer = new THREE.AnimationMixer(clonedScene);
      rig.mixer = mixer;
      rig.actions = {};

      for (const clip of gltf.animations) {
        const pose = mapClipNameToPose(clip.name);
        if (pose) {
          const action = mixer.clipAction(clip);
          rig.actions[pose] = action;
        }
      }

      // Immediately start playing whatever state the unit currently holds
      rig.activePose = null;
      rig.currentAction = null;
      transitionAnimationState(rig, rig.pendingPose, 0.05);
    })
    .catch((err) => {
      console.error(`Failed to load GLB model for ${role}:`, err);
    });
}

function transitionAnimationState(
  rig: AnimatedGLBRig,
  targetPose: AnimPose,
  blendDuration: number,
): void {
  if (!rig.mixer) return;
  const nextAction = rig.actions[targetPose] ?? rig.actions.idle;
  if (!nextAction) return;

  if (rig.activePose === targetPose && rig.currentAction === nextAction) {
    return;
  }

  const prevAction = rig.currentAction;
  const isOneShot = targetPose === 'ko' || targetPose === 'action';

  nextAction.enabled = true;
  nextAction.reset();
  nextAction.setEffectiveTimeScale(1);
  nextAction.setEffectiveWeight(1);
  if (isOneShot) {
    nextAction.setLoop(THREE.LoopOnce, 1);
    nextAction.clampWhenFinished = true;
  } else {
    nextAction.setLoop(THREE.LoopRepeat, Infinity);
    nextAction.clampWhenFinished = false;
  }

  if (prevAction && prevAction !== nextAction) {
    nextAction.play();
    prevAction.crossFadeTo(nextAction, blendDuration, true);
  } else {
    nextAction.fadeIn(blendDuration).play();
  }

  rig.currentAction = nextAction;
  rig.activePose = targetPose;
}

export function blendCharacterAnimation(
  rig: AnimatedGLBRig,
  pose: AnimPose,
  dt: number,
  actionTimer = 0,
): void {
  const effectivePose: AnimPose = pose === 'action' && actionTimer > 0 ? 'action' : pose;
  rig.pendingPose = effectivePose;

  if (!rig.mixer) return;

  if (rig.activePose !== effectivePose) {
    const fadeSec =
      effectivePose === 'ko' || effectivePose === 'action'
        ? 0.14
        : effectivePose === 'run' || rig.activePose === 'run'
          ? 0.18
          : 0.24;
    transitionAnimationState(rig, effectivePose, fadeSec);
  }

  rig.mixer.update(dt);
}
