import * as THREE from 'three';
import type { CameraViewPreset } from '../types/game';

const _forward = new THREE.Vector3();
const _right = new THREE.Vector3();

export class IsometricCameraController {
  public readonly camera: THREE.PerspectiveCamera;
  private target = new THREE.Vector3(0, 0, 12);
  private desiredTarget = new THREE.Vector3(0, 0, 12);
  private distance = 26;
  private desiredDistance = 26;
  private yaw = Math.PI / 4; // 45 deg true isometric angle
  private desiredYaw = Math.PI / 4;
  private pitch = 0.78; // ~44.7 deg elevation for crisp 2.5D tactical readability
  private desiredPitch = 0.78;
  private followHero = true;
  private viewPreset: CameraViewPreset = 'iso';

  private scoutZoomBoost = 0;
  private shakeIntensity = 0;
  private titleTimer = 0;

  private readonly minBounds = -21;
  private readonly maxBounds = 21;

  constructor(aspect: number) {
    this.camera = new THREE.PerspectiveCamera(28, aspect, 1, 220);
    this.applyImmediate();
  }

  public setAspect(aspect: number): void {
    this.camera.aspect = Math.max(0.2, aspect);
    this.camera.updateProjectionMatrix();
  }

  public isFollowingHero(): boolean {
    return this.followHero;
  }

  public setFollowHero(follow: boolean): void {
    this.followHero = follow;
  }

  public getViewPreset(): CameraViewPreset {
    return this.viewPreset;
  }

  public getYawDeg(): number {
    const deg = Math.round(THREE.MathUtils.radToDeg(this.desiredYaw)) % 360;
    return deg < 0 ? deg + 360 : deg;
  }

  public cycleViewPreset(): CameraViewPreset {
    if (this.viewPreset === 'iso') {
      this.viewPreset = 'high';
      this.desiredPitch = 1.06;
      this.desiredDistance = 28;
    } else if (this.viewPreset === 'high') {
      this.viewPreset = 'close';
      this.desiredPitch = 0.54;
      this.desiredDistance = 18.5;
    } else {
      this.viewPreset = 'iso';
      this.desiredPitch = 0.78;
      this.desiredDistance = 26;
    }
    return this.viewPreset;
  }

  public followWorld(x: number, z: number): void {
    if (!this.followHero) return;
    this.desiredTarget.set(
      THREE.MathUtils.clamp(x, this.minBounds, this.maxBounds),
      0,
      THREE.MathUtils.clamp(z, this.minBounds, this.maxBounds),
    );
  }

  public focusOn(x: number, z: number, immediate = false, enableFollow = true): void {
    this.followHero = enableFollow;
    this.desiredTarget.set(
      THREE.MathUtils.clamp(x, this.minBounds, this.maxBounds),
      0,
      THREE.MathUtils.clamp(z, this.minBounds, this.maxBounds),
    );
    if (immediate) {
      this.target.copy(this.desiredTarget);
      this.applyImmediate();
    }
  }

  public adjustZoom(delta: number): void {
    this.desiredDistance = THREE.MathUtils.clamp(this.desiredDistance + delta, 13, 38);
  }

  public adjustPitch(deltaRadians: number): void {
    this.desiredPitch = THREE.MathUtils.clamp(this.desiredPitch + deltaRadians, 0.42, 1.18);
  }

  public rotateYaw(deltaRadians: number): void {
    this.desiredYaw += deltaRadians;
  }

  public stepYaw45(dir: 1 | -1): void {
    this.desiredYaw += dir * (Math.PI / 4);
  }

  public panScreenDelta(dxPixels: number, dyPixels: number): void {
    this.followHero = false;
    const scale = this.distance * 0.0014;
    _forward.set(-Math.sin(this.yaw), 0, -Math.cos(this.yaw)).normalize();
    _right.set(Math.cos(this.yaw), 0, -Math.sin(this.yaw)).normalize();

    this.desiredTarget.addScaledVector(_right, -dxPixels * scale);
    this.desiredTarget.addScaledVector(_forward, dyPixels * scale);
    this.clampDesiredTarget();
  }

  public panByAxes(rightAxis: number, forwardAxis: number, dt: number): void {
    if (rightAxis === 0 && forwardAxis === 0) return;
    this.followHero = false;
    const speed = 18 * dt;
    _forward.set(-Math.sin(this.yaw), 0, -Math.cos(this.yaw)).normalize();
    _right.set(Math.cos(this.yaw), 0, -Math.sin(this.yaw)).normalize();

    this.desiredTarget.addScaledVector(_right, rightAxis * speed);
    this.desiredTarget.addScaledVector(_forward, forwardAxis * speed);
    this.clampDesiredTarget();
  }

  public setScoutZoom(active: boolean): void {
    this.scoutZoomBoost = active ? 5.5 : 0;
  }

  public addShake(amount: number): void {
    this.shakeIntensity = Math.min(0.65, this.shakeIntensity + amount);
  }

  private clampDesiredTarget(): void {
    this.desiredTarget.x = THREE.MathUtils.clamp(
      this.desiredTarget.x,
      this.minBounds,
      this.maxBounds,
    );
    this.desiredTarget.z = THREE.MathUtils.clamp(
      this.desiredTarget.z,
      this.minBounds,
      this.maxBounds,
    );
  }

  public updateTitleOrbit(dt: number): void {
    this.titleTimer += dt;
    this.desiredTarget.set(
      Math.sin(this.titleTimer * 0.16) * 4.5,
      0,
      2 + Math.cos(this.titleTimer * 0.12) * 5.0,
    );
    this.desiredYaw = Math.PI / 4 + Math.sin(this.titleTimer * 0.1) * 0.28;
    this.desiredPitch = 0.78;
    this.desiredDistance = 28.5;
    this.update(dt);
  }

  public update(dt: number): void {
    const lambda = 9.0;
    this.target.x = THREE.MathUtils.damp(this.target.x, this.desiredTarget.x, lambda, dt);
    this.target.z = THREE.MathUtils.damp(this.target.z, this.desiredTarget.z, lambda, dt);
    this.distance = THREE.MathUtils.damp(
      this.distance,
      this.desiredDistance + this.scoutZoomBoost,
      7.5,
      dt,
    );
    this.yaw = THREE.MathUtils.damp(this.yaw, this.desiredYaw, 8.5, dt);
    this.pitch = THREE.MathUtils.damp(this.pitch, this.desiredPitch, 8.0, dt);

    if (this.shakeIntensity > 0.001) {
      this.shakeIntensity = THREE.MathUtils.damp(this.shakeIntensity, 0, 12, dt);
    } else {
      this.shakeIntensity = 0;
    }

    this.applyImmediate();
  }

  private applyImmediate(): void {
    const horiz = Math.cos(this.pitch) * this.distance;
    const vert = Math.sin(this.pitch) * this.distance;
    const shakeX = this.shakeIntensity > 0 ? (Math.random() - 0.5) * this.shakeIntensity : 0;
    const shakeZ = this.shakeIntensity > 0 ? (Math.random() - 0.5) * this.shakeIntensity : 0;

    this.camera.position.set(
      this.target.x + Math.sin(this.yaw) * horiz + shakeX,
      vert,
      this.target.z + Math.cos(this.yaw) * horiz + shakeZ,
    );
    this.camera.lookAt(this.target.x + shakeX * 0.5, 0.7, this.target.z + shakeZ * 0.5);
  }
}
