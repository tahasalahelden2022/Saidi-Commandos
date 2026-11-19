import type { StageConfig } from '../types/game';

export class MissionManager {
  public primaryDone = false;
  public secondaryDone = false;
  public extracted = false;
  public alarmLevel = 0; // 0..100
  public alertsTriggered = 0;
  public elapsedSeconds = 0;
  public defeatReasonAr = '';

  private stage: StageConfig;

  constructor(stage: StageConfig) {
    this.stage = stage;
  }

  public setStage(stage: StageConfig): void {
    this.stage = stage;
    this.reset();
  }

  public reset(): void {
    this.primaryDone = false;
    this.secondaryDone = false;
    this.extracted = false;
    this.alarmLevel = 0;
    this.alertsTriggered = 0;
    this.elapsedSeconds = 0;
    this.defeatReasonAr = '';
  }

  public update(
    dt: number,
    activeAlertsCount: number,
    aliveHeroesCount: number,
    vipPos: { x: number; z: number },
    heroesPositions: Array<{ x: number; z: number; alive: boolean }>,
  ): 'ongoing' | 'victory' | 'defeat' {
    this.elapsedSeconds += dt;

    if (aliveHeroesCount === 0) {
      this.defeatReasonAr = 'سقط جميع أفراد الفرقة في الميدان.';
      return 'defeat';
    }

    if (activeAlertsCount > 0) {
      const rate = this.secondaryDone ? 3.5 : 8.5;
      this.alarmLevel = Math.min(100, this.alarmLevel + activeAlertsCount * rate * dt);
    } else {
      this.alarmLevel = Math.max(0, this.alarmLevel - 4.0 * dt);
    }

    if (this.alarmLevel >= 100) {
      this.defeatReasonAr = 'ارتفع الإنذار العام وحاصرت التعزيزات المنطقة!';
      return 'defeat';
    }

    if (this.primaryDone) {
      const ext = this.stage.extractionZone;
      const heroInZone = heroesPositions.some(
        (h) => h.alive && Math.hypot(h.x - ext.x, h.z - ext.z) <= ext.radius,
      );

      if (this.stage.primaryObjectiveType === 'vip') {
        const vipInZone =
          Math.hypot(vipPos.x - ext.x, vipPos.z - ext.z) <= ext.radius;
        if (vipInZone && heroInZone) {
          this.extracted = true;
          return 'victory';
        }
      } else if (heroInZone) {
        this.extracted = true;
        return 'victory';
      }
    }

    return 'ongoing';
  }

  public getNearestInteractable(
    hx: number,
    hz: number,
  ): { kind: 'primary' | 'secondary'; dist: number } | null {
    if (!this.primaryDone) {
      const p = this.stage.primaryTargetPos;
      const d = Math.hypot(hx - p.x, hz - p.z);
      if (d <= 2.4) return { kind: 'primary', dist: d };
    }
    if (!this.secondaryDone) {
      const s = this.stage.secondaryTargetPos;
      const d = Math.hypot(hx - s.x, hz - s.z);
      if (d <= 2.45) return { kind: 'secondary', dist: d };
    }
    return null;
  }

  public getHudInfo(activeGuards: number, koGuards: number, totalGuards: number) {
    return {
      primaryDone: this.primaryDone,
      primaryLabelAr: this.stage.primaryObjectiveLabelAr,
      secondaryDone: this.secondaryDone,
      secondaryLabelAr: this.stage.secondaryObjectiveLabelAr,
      extractLabelAr: this.stage.extractLabelAr,
      extracted: this.extracted,
      alarmLevel: Math.round(this.alarmLevel),
      activeGuards,
      koGuards,
      totalGuards,
    };
  }
}
