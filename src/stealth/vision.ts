import * as THREE from 'three';
import type { GuardAlertState, ObstacleBox } from '../types/game';

/**
 * Computes distance t in [0, maxDist] to the nearest obstacle AABB along 2D ray (ox, oz) + t*(dx, dz).
 * Returns maxDist if unobstructed.
 */
export function raycastObstacles2D(
  ox: number,
  oz: number,
  dx: number,
  dz: number,
  maxDist: number,
  obstacles: ObstacleBox[],
  includeCrouchCover: boolean,
): number {
  let closest = maxDist;

  for (let i = 0; i < obstacles.length; i++) {
    const o = obstacles[i];
    if (includeCrouchCover) {
      if (!o.blocksCrouchSight && !o.blocksStandingSight) continue;
    } else if (!o.blocksStandingSight) {
      continue;
    }

    const minX = o.x - o.w * 0.5;
    const maxX = o.x + o.w * 0.5;
    const minZ = o.z - o.d * 0.5;
    const maxZ = o.z + o.d * 0.5;

    let tmin = 0;
    let tmax = closest;

    if (Math.abs(dx) < 1e-6) {
      if (ox < minX || ox > maxX) continue;
    } else {
      const invD = 1 / dx;
      let t1 = (minX - ox) * invD;
      let t2 = (maxX - ox) * invD;
      if (t1 > t2) {
        const tmp = t1;
        t1 = t2;
        t2 = tmp;
      }
      tmin = Math.max(tmin, t1);
      tmax = Math.min(tmax, t2);
      if (tmin > tmax) continue;
    }

    if (Math.abs(dz) < 1e-6) {
      if (oz < minZ || oz > maxZ) continue;
    } else {
      const invD = 1 / dz;
      let t1 = (minZ - oz) * invD;
      let t2 = (maxZ - oz) * invD;
      if (t1 > t2) {
        const tmp = t1;
        t1 = t2;
        t2 = tmp;
      }
      tmin = Math.max(tmin, t1);
      tmax = Math.min(tmax, t2);
      if (tmin > tmax) continue;
    }

    if (tmin >= 0 && tmin < closest) {
      closest = tmin;
    }
  }

  return closest;
}

export interface SmokeCloudCircle {
  x: number;
  z: number;
  radius: number;
}

function segmentIntersectsCircle(
  x1: number,
  z1: number,
  x2: number,
  z2: number,
  cx: number,
  cz: number,
  r: number,
): boolean {
  const dx = x2 - x1;
  const dz = z2 - z1;
  const lenSq = dx * dx + dz * dz;
  if (lenSq < 1e-6) {
    return Math.hypot(cx - x1, cz - z1) <= r;
  }
  const t = THREE.MathUtils.clamp(((cx - x1) * dx + (cz - z1) * dz) / lenSq, 0, 1);
  const px = x1 + t * dx;
  const pz = z1 + t * dz;
  return Math.hypot(cx - px, cz - pz) <= r;
}

export function hasVisionLineOfSight(
  ox: number,
  oz: number,
  tx: number,
  tz: number,
  obstacles: ObstacleBox[],
  targetCrouching: boolean,
  smokeClouds: SmokeCloudCircle[] = [],
): boolean {
  for (let i = 0; i < smokeClouds.length; i++) {
    const sc = smokeClouds[i];
    if (segmentIntersectsCircle(ox, oz, tx, tz, sc.x, sc.z, sc.radius * 0.92)) {
      return false;
    }
  }
  const vx = tx - ox;
  const vz = tz - oz;
  const dist = Math.hypot(vx, vz);
  if (dist < 0.05) return true;
  const dx = vx / dist;
  const dz = vz / dist;
  const hitDist = raycastObstacles2D(ox, oz, dx, dz, dist, obstacles, targetCrouching);
  return hitDist >= dist - 0.18;
}

const CONE_SEGMENTS = 48;

export class DynamicVisionCone {
  public readonly mesh: THREE.Mesh;
  private readonly geometry: THREE.BufferGeometry;
  private readonly material: THREE.MeshBasicMaterial;
  private readonly positions: Float32Array;

  constructor() {
    // 1 center vertex + (CONE_SEGMENTS + 1) arc vertices
    const vertCount = CONE_SEGMENTS + 2;
    this.positions = new Float32Array(vertCount * 3);
    const indices: number[] = [];
    for (let i = 1; i <= CONE_SEGMENTS; i++) {
      indices.push(0, i, i + 1);
    }

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setIndex(indices);

    this.material = new THREE.MeshBasicMaterial({
      color: 0x38c172,
      transparent: true,
      opacity: 0.24,
      side: THREE.DoubleSide,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.position.y = 0.045;
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 2;
  }

  public update(
    ox: number,
    oz: number,
    facingYaw: number,
    halfAngleRad: number,
    range: number,
    state: GuardAlertState,
    suspicion: number,
    obstacles: ObstacleBox[],
  ): void {
    if (state === 'ko') {
      this.mesh.visible = false;
      return;
    }
    this.mesh.visible = true;

    // Color & opacity feedback
    if (state === 'alert') {
      this.material.color.setHex(0xef4444);
      this.material.opacity = 0.34;
    } else if (state === 'suspicious' || suspicion > 0.08) {
      this.material.color.setHex(0xf59e0b);
      this.material.opacity = 0.24 + suspicion * 0.14;
    } else {
      this.material.color.setHex(0x34d399);
      this.material.opacity = 0.2;
    }

    // Center vertex in world space (mesh sits at world origin on XZ, y = 0.045)
    this.positions[0] = ox;
    this.positions[1] = 0;
    this.positions[2] = oz;

    // Facing vector in Three.js where yaw=0 faces +Z: (sin(yaw), cos(yaw))
    const startAngle = facingYaw - halfAngleRad;
    const step = (halfAngleRad * 2) / CONE_SEGMENTS;

    for (let i = 0; i <= CONE_SEGMENTS; i++) {
      const a = startAngle + step * i;
      const dx = Math.sin(a);
      const dz = Math.cos(a);
      const d = raycastObstacles2D(ox, oz, dx, dz, range, obstacles, false);

      const vIdx = (i + 1) * 3;
      this.positions[vIdx] = ox + dx * d;
      this.positions[vIdx + 1] = 0;
      this.positions[vIdx + 2] = oz + dz * d;
    }

    (this.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    this.geometry.computeBoundingSphere();
  }

  public dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
  }
}
