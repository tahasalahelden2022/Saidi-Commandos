import * as THREE from 'three';
import {
  animateCharacterRig,
  type ArticulatedCharacterRig,
} from '../characters/characterMesh';
import type { NavGrid } from '../movement/pathfinding';
import { DynamicVisionCone, hasVisionLineOfSight, type SmokeCloudCircle } from '../stealth/vision';
import type {
  AnimPose,
  CoverZone,
  GuardAlertState,
  GuardPatrolSpec,
  HeroId,
  ObstacleBox,
  Vec2,
} from '../types/game';

export interface HeroTargetView {
  id: string;
  x: number;
  z: number;
  crouching: boolean;
  hiddenInCover: boolean;
  alive: boolean;
}

export interface GuardCallbacks {
  onSuspicious: (guardId: string) => void;
  onAlerted: (guardId: string, x: number, z: number) => void;
  onFireAtHero: (heroId: string, gx: number, gz: number, hx: number, hz: number) => void;
  onBodyDiscovered?: (koGuardId: string, bx: number, bz: number) => void;
}

function normalizeAngle(a: number): number {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}

function dampAngle(current: number, target: number, lambda: number, dt: number): number {
  const diff = normalizeAngle(target - current);
  return current + diff * (1 - Math.exp(-lambda * dt));
}

export class GuardUnit {
  public readonly id: string;
  public readonly spec: GuardPatrolSpec;
  public readonly rig: ArticulatedCharacterRig;
  public readonly visionCone: DynamicVisionCone;

  public x: number;
  public z: number;
  public yaw: number;
  public state: GuardAlertState = 'patrol';
  public suspicion = 0;
  public carriedByHeroId: HeroId | null = null;
  public bodyDiscovered = false;

  private waypointIdx = 0;
  private waitTimer = 0;
  private investigateTarget: Vec2 | null = null;
  private investigateTimer = 0;
  private path: Vec2[] = [];
  private pathRecalcTimer = 0;
  private attackCooldown = 0;
  private animPhase = Math.random() * 6;
  private lastKnownHeroPos: Vec2 | null = null;
  private alertLoseSightTimer = 0;

  constructor(
    spec: GuardPatrolSpec,
    rig: ArticulatedCharacterRig,
  ) {
    this.id = spec.id;
    this.spec = spec;
    this.rig = rig;
    this.visionCone = new DynamicVisionCone();

    this.x = spec.waypoints[0].x;
    this.z = spec.waypoints[0].z;
    this.yaw = spec.initialYaw;
    this.rig.root.position.set(this.x, 0, this.z);
    this.rig.root.rotation.y = this.yaw;
    this.rig.hitBox.userData.guardId = this.id;
  }

  public reset(): void {
    this.x = this.spec.waypoints[0].x;
    this.z = this.spec.waypoints[0].z;
    this.yaw = this.spec.initialYaw;
    this.state = 'patrol';
    this.suspicion = 0;
    this.carriedByHeroId = null;
    this.bodyDiscovered = false;
    this.waypointIdx = 0;
    this.waitTimer = 0;
    this.investigateTarget = null;
    this.investigateTimer = 0;
    this.path = [];
    this.attackCooldown = 0;
    this.lastKnownHeroPos = null;
    this.alertLoseSightTimer = 0;
    this.rig.contactShadow.visible = true;
    this.rig.hitBox.scale.set(1, 1, 1);
    this.rig.hitBox.position.y = 0.99;
    this.rig.root.position.set(this.x, 0, this.z);
    this.rig.root.rotation.set(0, this.yaw, 0);
  }

  public restoreState(
    x: number,
    z: number,
    yaw: number,
    state: GuardAlertState,
    suspicion: number,
    carriedByHeroId: HeroId | null = null,
    bodyDiscovered = false,
  ): void {
    this.x = x;
    this.z = z;
    this.yaw = yaw;
    this.state = state;
    this.suspicion = suspicion;
    this.carriedByHeroId = state === 'ko' ? carriedByHeroId : null;
    this.bodyDiscovered = state === 'ko' ? bodyDiscovered : false;
    this.path = [];
    this.investigateTarget = null;
    this.rig.contactShadow.visible = this.carriedByHeroId === null;
    this.rig.root.position.set(this.x, 0, this.z);
    this.rig.root.rotation.set(0, this.yaw, 0);
    if (state === 'ko') {
      this.visionCone.mesh.visible = false;
      this.rig.hitBox.scale.set(1.45, 0.48, 1.45);
      this.rig.hitBox.position.y = 0.35;
    } else {
      this.rig.hitBox.scale.set(1, 1, 1);
      this.rig.hitBox.position.y = 0.99;
    }
  }

  public knockout(): void {
    this.state = 'ko';
    this.suspicion = 0;
    this.carriedByHeroId = null;
    this.bodyDiscovered = false;
    this.path = [];
    this.investigateTarget = null;
    this.visionCone.mesh.visible = false;
    this.rig.contactShadow.visible = true;
    this.rig.hitBox.scale.set(1.45, 0.48, 1.45);
    this.rig.hitBox.position.y = 0.35;
  }

  public setCarriedBy(heroId: HeroId | null): void {
    this.carriedByHeroId = heroId;
    this.visionCone.mesh.visible = false;
    if (heroId !== null) {
      this.bodyDiscovered = false;
      this.rig.contactShadow.visible = false;
    } else {
      this.bodyDiscovered = false;
      this.rig.contactShadow.visible = true;
      this.rig.root.position.set(this.x, 0, this.z);
      this.rig.root.rotation.set(0, this.yaw, 0);
    }
  }

  public syncCarriedPose(
    heroX: number,
    heroZ: number,
    heroYaw: number,
    crouching: boolean,
    dt: number,
  ): void {
    if (this.carriedByHeroId === null) return;
    const backX = heroX - Math.sin(heroYaw) * 0.24;
    const backZ = heroZ - Math.cos(heroYaw) * 0.24;
    this.x = backX;
    this.z = backZ;
    this.yaw = heroYaw + Math.PI * 0.5;
    this.rig.root.position.set(backX, crouching ? 0.92 : 1.24, backZ);
    this.rig.root.rotation.set(0, this.yaw, 0);
    this.rig.contactShadow.visible = false;
    this.visionCone.mesh.visible = false;
    animateCharacterRig(this.rig, 'ko', this.animPhase, dt);
  }

  public hearNoise(nx: number, nz: number, isLoudAlarm: boolean, nav: NavGrid): void {
    if (this.state === 'ko') return;
    if (isLoudAlarm && this.state !== 'alert') {
      this.state = 'suspicious';
      this.suspicion = Math.max(this.suspicion, 0.72);
      this.investigateTarget = { x: nx, z: nz };
      this.investigateTimer = 5.5;
      this.path = nav.findPath({ x: this.x, z: this.z }, this.investigateTarget);
      return;
    }

    if (this.state === 'alert') {
      this.lastKnownHeroPos = { x: nx, z: nz };
      return;
    }

    const wasPatrol = this.state === 'patrol';
    this.state = 'suspicious';
    this.suspicion = Math.max(this.suspicion, 0.45);
    this.investigateTarget = { x: nx, z: nz };
    this.investigateTimer = 5.0;
    this.path = nav.findPath({ x: this.x, z: this.z }, this.investigateTarget);
    if (wasPatrol) {
      // slight pause before turning
      this.waitTimer = 0.25;
    }
  }

  public isPointSeenByGuard(
    px: number,
    pz: number,
    obstacles: ObstacleBox[],
    smokeClouds: SmokeCloudCircle[] = [],
  ): boolean {
    if (this.state === 'ko') return false;
    const dx = px - this.x;
    const dz = pz - this.z;
    const dist = Math.hypot(dx, dz);
    if (dist > this.spec.visionRange) return false;
    const halfAngleRad = THREE.MathUtils.degToRad(this.spec.visionAngleDeg * 0.5);
    const fx = Math.sin(this.yaw);
    const fz = Math.cos(this.yaw);
    const dot = dist > 0.01 ? (dx * fx + dz * fz) / dist : 1;
    const angle = Math.acos(THREE.MathUtils.clamp(dot, -1, 1));
    if (angle > halfAngleRad && dist > 1.4) return false;
    return hasVisionLineOfSight(this.x, this.z, px, pz, obstacles, false, smokeClouds);
  }

  public update(
    dt: number,
    heroes: HeroTargetView[],
    obstacles: ObstacleBox[],
    nav: NavGrid,
    callbacks: GuardCallbacks,
    koBodies: GuardUnit[] = [],
    coverZones: CoverZone[] = [],
    smokeClouds: SmokeCloudCircle[] = [],
  ): void {
    if (this.state === 'ko') {
      if (this.carriedByHeroId === null) {
        animateCharacterRig(this.rig, 'ko', this.animPhase, dt);
      }
      this.visionCone.mesh.visible = false;
      return;
    }

    this.attackCooldown = Math.max(0, this.attackCooldown - dt);
    this.pathRecalcTimer = Math.max(0, this.pathRecalcTimer - dt);

    const halfAngleRad = THREE.MathUtils.degToRad(this.spec.visionAngleDeg * 0.5);
    const fx = Math.sin(this.yaw);
    const fz = Math.cos(this.yaw);

    // 1. Vision Check against all alive heroes
    let bestHero: HeroTargetView | null = null;
    let bestRate = 0;

    for (const h of heroes) {
      if (!h.alive) continue;
      const dx = h.x - this.x;
      const dz = h.z - this.z;
      const dist = Math.hypot(dx, dz);
      const effectiveRange = h.crouching ? this.spec.visionRange * 0.78 : this.spec.visionRange;
      if (dist > effectiveRange) continue;

      if (h.hiddenInCover && dist > 2.2) continue;

      const dot = dist > 0.01 ? (dx * fx + dz * fz) / dist : 1;
      const angle = Math.acos(THREE.MathUtils.clamp(dot, -1, 1));
      if (angle > halfAngleRad && dist > 1.4) continue;

      if (!hasVisionLineOfSight(this.x, this.z, h.x, h.z, obstacles, h.crouching, smokeClouds)) {
        continue;
      }

      const distFactor = 1.15 - (dist / effectiveRange) * 0.65;
      const crouchFactor = h.crouching ? 0.42 : 1.0;
      const rate = 1.15 * distFactor * crouchFactor;
      if (rate > bestRate) {
        bestRate = rate;
        bestHero = h;
      }
    }

    if (bestHero) {
      const prevState = this.state;
      this.suspicion = Math.min(1, this.suspicion + bestRate * dt);
      this.lastKnownHeroPos = { x: bestHero.x, z: bestHero.z };
      this.alertLoseSightTimer = 3.2;

      if (this.suspicion >= 1) {
        this.state = 'alert';
        if (prevState !== 'alert') {
          callbacks.onAlerted(this.id, bestHero.x, bestHero.z);
        }
      } else if (this.suspicion >= 0.25 && this.state === 'patrol') {
        this.state = 'suspicious';
        this.investigateTarget = { x: bestHero.x, z: bestHero.z };
        this.investigateTimer = 4.2;
        callbacks.onSuspicious(this.id);
      }
    } else {
      if (this.state === 'alert') {
        this.alertLoseSightTimer -= dt;
        if (this.alertLoseSightTimer <= 0) {
          this.state = 'suspicious';
          this.suspicion = 0.7;
          this.investigateTarget = this.lastKnownHeroPos ?? { x: this.x, z: this.z };
          this.investigateTimer = 4.5;
        }
      } else {
        this.suspicion = Math.max(0, this.suspicion - 0.22 * dt);
      }
    }

    // 1b. Exposed KO body discovery check (only if not hidden in cover zones or behind low walls)
    if (!bestHero && this.state !== 'alert' && koBodies.length > 0) {
      for (const body of koBodies) {
        if (body.id === this.id || body.state !== 'ko' || body.carriedByHeroId !== null || body.bodyDiscovered) {
          continue;
        }
        const inCover = coverZones.some((cz) => Math.hypot(body.x - cz.x, body.z - cz.z) <= cz.radius);
        if (inCover) continue;

        const dx = body.x - this.x;
        const dz = body.z - this.z;
        const dist = Math.hypot(dx, dz);
        if (dist > this.spec.visionRange * 0.85) continue;

        const dot = dist > 0.01 ? (dx * fx + dz * fz) / dist : 1;
        const angle = Math.acos(THREE.MathUtils.clamp(dot, -1, 1));
        if (angle > halfAngleRad && dist > 1.5) continue;

        if (!hasVisionLineOfSight(this.x, this.z, body.x, body.z, obstacles, true, smokeClouds)) {
          continue;
        }

        body.bodyDiscovered = true;
        this.state = 'suspicious';
        this.suspicion = Math.max(this.suspicion, 0.84);
        this.investigateTarget = { x: body.x, z: body.z };
        this.investigateTimer = 6.5;
        this.path = nav.findPath({ x: this.x, z: this.z }, this.investigateTarget);
        callbacks.onBodyDiscovered?.(body.id, body.x, body.z);
        break;
      }
    }

    // 2. State Behavior & Movement
    let pose: AnimPose = 'idle';
    let moving = false;

    if (this.state === 'alert') {
      if (bestHero) {
        const dx = bestHero.x - this.x;
        const dz = bestHero.z - this.z;
        const dist = Math.hypot(dx, dz);
        const targetYaw = Math.atan2(dx, dz);
        this.yaw = dampAngle(this.yaw, targetYaw, 10, dt);

        if (dist <= 8.2) {
          // Stop & fire at hero
          pose = 'action';
          if (this.attackCooldown <= 0) {
            this.attackCooldown = 1.55;
            callbacks.onFireAtHero(bestHero.id, this.x, this.z, bestHero.x, bestHero.z);
          }
        } else {
          // Chase hero
          if (this.pathRecalcTimer <= 0) {
            this.pathRecalcTimer = 0.45;
            this.path = nav.findPath({ x: this.x, z: this.z }, { x: bestHero.x, z: bestHero.z });
          }
          moving = this.followPath(this.spec.speed * 1.42, dt);
          pose = moving ? 'run' : 'idle';
        }
      } else if (this.lastKnownHeroPos) {
        if (this.pathRecalcTimer <= 0) {
          this.pathRecalcTimer = 0.6;
          this.path = nav.findPath({ x: this.x, z: this.z }, this.lastKnownHeroPos);
        }
        moving = this.followPath(this.spec.speed * 1.32, dt);
        pose = moving ? 'run' : 'idle';
      }
    } else if (this.state === 'suspicious') {
      if (bestHero) {
        const targetYaw = Math.atan2(bestHero.x - this.x, bestHero.z - this.z);
        this.yaw = dampAngle(this.yaw, targetYaw, 6, dt);
        pose = 'idle';
      } else if (this.investigateTarget) {
        const distToTarget = Math.hypot(
          this.investigateTarget.x - this.x,
          this.investigateTarget.z - this.z,
        );
        if (distToTarget > 1.2) {
          if (this.path.length === 0 && this.pathRecalcTimer <= 0) {
            this.pathRecalcTimer = 0.7;
            this.path = nav.findPath({ x: this.x, z: this.z }, this.investigateTarget);
          }
          moving = this.followPath(this.spec.speed * 0.9, dt);
          pose = moving ? 'walk' : 'idle';
        } else {
          this.investigateTimer -= dt;
          // Look left & right while investigating
          this.yaw += Math.sin(this.investigateTimer * 2.2) * 0.9 * dt;
          if (this.investigateTimer <= 0) {
            this.state = 'patrol';
            this.investigateTarget = null;
            const wp = this.spec.waypoints[this.waypointIdx];
            this.path = nav.findPath({ x: this.x, z: this.z }, wp);
          }
        }
      }
    } else {
      // Patrol mode
      const wp = this.spec.waypoints[this.waypointIdx];
      const dist = Math.hypot(wp.x - this.x, wp.z - this.z);
      if (dist < 0.35) {
        this.waitTimer += dt;
        // Gentle scanning glance while waiting at post
        const nextWp = this.spec.waypoints[(this.waypointIdx + 1) % this.spec.waypoints.length];
        const baseLook = Math.atan2(nextWp.x - this.x, nextWp.z - this.z);
        const scanOffset = Math.sin(this.waitTimer * 1.4) * 0.45;
        this.yaw = dampAngle(this.yaw, baseLook + scanOffset, 3.5, dt);

        if (this.waitTimer >= this.spec.waitSeconds) {
          this.waitTimer = 0;
          this.waypointIdx = (this.waypointIdx + 1) % this.spec.waypoints.length;
          const targetWp = this.spec.waypoints[this.waypointIdx];
          this.path = nav.findPath({ x: this.x, z: this.z }, targetWp);
        }
      } else {
        if (this.path.length === 0) {
          this.path = nav.findPath({ x: this.x, z: this.z }, wp);
        }
        moving = this.followPath(this.spec.speed, dt);
        pose = moving ? 'walk' : 'idle';
      }
    }

    if (moving) {
      this.animPhase += dt * (pose === 'run' ? 11 : 6.5);
    } else {
      this.animPhase += dt * 1.8;
    }

    this.rig.root.position.set(this.x, 0, this.z);
    this.rig.root.rotation.y = this.yaw;
    animateCharacterRig(this.rig, pose, this.animPhase, dt, this.attackCooldown > 1.2 ? 1 : 0);

    // 3. Update Dynamic Raycasted Vision Cone
    this.visionCone.update(
      this.x,
      this.z,
      this.yaw,
      halfAngleRad,
      this.spec.visionRange,
      this.state,
      this.suspicion,
      obstacles,
    );
  }

  private followPath(speed: number, dt: number): boolean {
    if (this.path.length === 0) return false;
    const target = this.path[0];
    const dx = target.x - this.x;
    const dz = target.z - this.z;
    const dist = Math.hypot(dx, dz);

    if (dist < 0.22) {
      this.path.shift();
      return this.path.length > 0;
    }

    const step = Math.min(dist, speed * dt);
    const nx = dx / dist;
    const nz = dz / dist;
    this.x += nx * step;
    this.z += nz * step;

    const desiredYaw = Math.atan2(nx, nz);
    this.yaw = dampAngle(this.yaw, desiredYaw, 9, dt);
    return true;
  }

  public dispose(): void {
    this.rig.dispose();
    this.visionCone.dispose();
  }
}
