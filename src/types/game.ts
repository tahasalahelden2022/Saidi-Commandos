export type GamePhase = 'title' | 'playing' | 'paused' | 'victory' | 'defeat';

export type HeroId = 'hamdan' | 'salem' | 'bakri';

export type QualityPreset = 'high' | 'eco';

export type GuardAlertState = 'patrol' | 'suspicious' | 'alert' | 'ko';

export type AnimPose = 'idle' | 'walk' | 'run' | 'crouch' | 'sneak' | 'action' | 'ko';

export type StageId = 'village' | 'camp' | 'farms' | 'mountain';

export interface Vec2 {
  x: number;
  z: number;
}

export interface ObstacleBox {
  id: string;
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
  blocksMovement: boolean;
  blocksStandingSight: boolean;
  blocksCrouchSight: boolean;
  kind: 'house' | 'wall' | 'lowWall' | 'crates' | 'tower' | 'cliff' | 'well' | 'depot' | 'water';
}

export interface CoverZone {
  id: string;
  x: number;
  z: number;
  radius: number;
  label: string;
}

export interface HouseSpec {
  id: string;
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
  hasDome?: boolean;
  isDepot?: boolean;
  doorSide: 'south' | 'north' | 'east' | 'west';
}

export interface GuardPatrolSpec {
  id: string;
  waypoints: Vec2[];
  waitSeconds: number;
  initialYaw: number;
  visionRange: number;
  visionAngleDeg: number;
  speed: number;
}

export interface HeroSpawnSpec {
  id: HeroId;
  nameAr: string;
  roleAr: string;
  x: number;
  z: number;
  skillNameAr: string;
  skillDescAr: string;
  skillCooldown: number;
}

export interface StageConfig {
  id: StageId;
  order: number;
  nameAr: string;
  subtitleAr: string;
  theme: 'village' | 'camp' | 'farms' | 'mountain';
  skyColor: number;
  groundColor: number;
  primaryObjectiveType: 'vip' | 'intel' | 'sabotage';
  primaryObjectiveLabelAr: string;
  secondaryObjectiveLabelAr: string;
  extractLabelAr: string;
  heroSpawns: HeroSpawnSpec[];
  houses: HouseSpec[];
  obstacles: ObstacleBox[];
  coverZones: CoverZone[];
  guardPatrols: GuardPatrolSpec[];
  primaryTargetPos: Vec2;
  secondaryTargetPos: Vec2;
  extractionZone: { x: number; z: number; radius: number };
  palms: Array<{ x: number; z: number; scale: number; rot: number }>;
  rocks?: Array<{ x: number; z: number; scale: number; rot: number }>;
  canalZ?: number;
  bridgesX?: number[];
  cropPlots?: Array<{ x: number; z: number; w: number; d: number }>;
}

export type HeroToolId =
  | 'shouma'
  | 'whistle'
  | 'lunge'
  | 'sickle'
  | 'pebble'
  | 'dust_bomb'
  | 'sabotage'
  | 'binoculars'
  | 'sight_check'
  | 'carry';

export type TargetingMode = 'none' | 'skill' | 'secondary' | 'weapon' | 'drop_body';

export type CameraViewPreset = 'iso' | 'high' | 'close';

export interface HeroToolInfo {
  id: HeroToolId;
  nameAr: string;
  descAr: string;
  shortcut: string;
  cooldown: number;
  maxCooldown: number;
  active: boolean;
  disabled?: boolean;
  badgeAr?: string;
}

export interface HeroHudInfo {
  id: HeroId;
  nameAr: string;
  roleAr: string;
  hp: number;
  maxHp: number;
  crouching: boolean;
  hiddenInCover: boolean;
  carryingBody: boolean;
  nearbyBodyPickup: boolean;
  skillNameAr: string;
  skillDescAr: string;
  skillCooldown: number;
  skillMaxCooldown: number;
  secondarySkillNameAr: string;
  secondarySkillDescAr: string;
  secondaryCooldown: number;
  secondaryMaxCooldown: number;
  tools: HeroToolInfo[];
  alive: boolean;
  actionLabel: string;
}

export interface GuardScreenIndicator {
  id: string;
  screenX: number;
  screenY: number;
  visible: boolean;
  state: GuardAlertState;
  suspicion: number;
}

export interface MinimapEntity {
  x: number;
  z: number;
  kind: 'hero' | 'selectedHero' | 'guard' | 'guardAlert' | 'guardKo' | 'objective' | 'secondary' | 'extract';
}

export interface ObjectiveHudInfo {
  primaryDone: boolean;
  primaryLabelAr: string;
  secondaryDone: boolean;
  secondaryLabelAr: string;
  extractLabelAr: string;
  extracted: boolean;
  alarmLevel: number;
  activeGuards: number;
  koGuards: number;
  totalGuards: number;
}

export interface StageRecord {
  completed: boolean;
  bestTimeSec: number | null;
  bestAlerts: number | null;
}

export interface QuickSaveData {
  stageId: StageId;
  savedAt: string;
  elapsedSeconds: number;
  alertsTriggered: number;
  alarmLevel: number;
  primaryDone: boolean;
  secondaryDone: boolean;
  vipPos: Vec2;
  vipLeaderId: HeroId;
  selectedHeroId: HeroId;
  heroes: Array<{
    id: HeroId;
    x: number;
    z: number;
    yaw: number;
    hp: number;
    crouching: boolean;
    alive: boolean;
    skillCooldown: number;
    secondaryCooldown?: number;
    carryingGuardId?: string | null;
  }>;
  guards: Array<{
    id: string;
    x: number;
    z: number;
    yaw: number;
    state: GuardAlertState;
    suspicion: number;
    carriedByHeroId?: HeroId | null;
    bodyDiscovered?: boolean;
  }>;
}

export interface HudSnapshot {
  phase: GamePhase;
  stageId: StageId;
  stageNameAr: string;
  selectedHeroId: HeroId;
  skillTargeting: boolean;
  targetingMode: TargetingMode;
  scoutSurveyActive: boolean;
  scoutSurveyRemaining: number;
  cameraFollowHero: boolean;
  cameraYawDeg: number;
  cameraViewPreset: CameraViewPreset;
  heroes: HeroHudInfo[];
  objectives: ObjectiveHudInfo;
  guardIndicators: GuardScreenIndicator[];
  minimapEntities: MinimapEntity[];
  minimapObstacles: Array<{ x: number; z: number; w: number; d: number; kind: ObstacleBox['kind'] }>;
  elapsedSeconds: number;
  alertsTriggered: number;
  contextHintAr: string;
  defeatReasonAr: string;
  muted: boolean;
  quality: QualityPreset;
  hasQuickSave: boolean;
  campaignProgress: Record<StageId, StageRecord>;
}
