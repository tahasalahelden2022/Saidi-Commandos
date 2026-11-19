import * as THREE from 'three';
import {
  animateCharacterRig,
  createArticulatedCharacter,
  type ArticulatedCharacterRig,
} from '../characters/characterMesh';
import { GuardUnit } from '../enemies/guardAI';
import { SoundEngine } from '../engine/audio';
import { IsometricCameraController } from '../engine/cameraController';
import { createSceneRig, type SceneRig } from '../engine/sceneManager';
import { createProceduralTextures, type ProceduralTextureSet } from '../engine/textures';
import { buildStageEnvironment, type StageSceneObjects } from '../maps/stageBuilder';
import { getStageConfig } from '../maps/stagesData';
import { MissionManager } from '../missions/missionManager';
import { NavGrid } from '../movement/pathfinding';
import type {
  AnimPose,
  GamePhase,
  GuardScreenIndicator,
  HeroHudInfo,
  HeroId,
  HeroToolId,
  HeroToolInfo,
  HudSnapshot,
  MinimapEntity,
  QualityPreset,
  StageConfig,
  StageId,
  StageRecord,
  TargetingMode,
  Vec2,
} from '../types/game';
import { preloadCharacterGLBs } from './characterModelLoader';
import { loadCampaignProgress, readQuickSave, saveStageCompletion, writeQuickSave } from './storage';

interface HeroEntity {
  id: HeroId;
  nameAr: string;
  roleAr: string;
  skillNameAr: string;
  skillDescAr: string;
  skillMaxCooldown: number;
  skillCooldown: number;
  secondaryMaxCooldown: number;
  secondaryCooldown: number;
  x: number;
  z: number;
  yaw: number;
  hp: number;
  maxHp: number;
  crouching: boolean;
  running: boolean;
  hiddenInCover: boolean;
  alive: boolean;
  path: Vec2[];
  animPhase: number;
  actionTimer: number;
  rig: ArticulatedCharacterRig;
  carryingGuardId: string | null;
  pendingInteract:
    | { type: 'knockout'; guardId: string }
    | { type: 'lunge'; guardId: string }
    | { type: 'pickup'; guardId: string }
    | { type: 'drop'; x: number; z: number }
    | { type: 'primary' }
    | { type: 'secondary' }
    | null;
}

interface RippleEffect {
  mesh: THREE.Mesh;
  mat: THREE.MeshBasicMaterial;
  age: number;
  maxAge: number;
  maxRadius: number;
}

interface DustParticle {
  mesh: THREE.Mesh;
  vx: number;
  vy: number;
  vz: number;
  age: number;
  maxAge: number;
  active: boolean;
}

interface TracerEffect {
  line: THREE.Line;
  mat: THREE.LineBasicMaterial;
  age: number;
  maxAge: number;
}

interface ThrownPebble {
  mesh: THREE.Mesh;
  startX: number;
  startZ: number;
  endX: number;
  endZ: number;
  t: number;
  duration: number;
  noiseRadius: number;
  active: boolean;
}

interface SmokeCloudEffect {
  group: THREE.Group;
  ringMat: THREE.MeshBasicMaterial;
  puffMats: THREE.MeshBasicMaterial[];
  x: number;
  z: number;
  radius: number;
  remaining: number;
  maxDuration: number;
}

interface SightCheckEffect {
  group: THREE.Group;
  materials: THREE.Material[];
  geometries: THREE.BufferGeometry[];
  remaining: number;
  maxDuration: number;
}

const _raycaster = new THREE.Raycaster();
const _mouse = new THREE.Vector2();
const _groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const _hitPoint = new THREE.Vector3();
const _projVec = new THREE.Vector3();

function normalizeAngle(a: number): number {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}

function dampAngle(current: number, target: number, lambda: number, dt: number): number {
  const diff = normalizeAngle(target - current);
  return current + diff * (1 - Math.exp(-lambda * dt));
}

export class GameEngine {
  private readonly container: HTMLElement;
  private readonly onHudUpdate: (snapshot: HudSnapshot) => void;

  private readonly sceneRig: SceneRig;
  private readonly textures: ProceduralTextureSet;
  private readonly camCtrl: IsometricCameraController;
  private readonly sound = new SoundEngine();

  private currentStage: StageConfig;
  private navGrid: NavGrid;
  private mission: MissionManager;
  private stageObjects: StageSceneObjects;
  private campaignProgress: Record<StageId, StageRecord>;

  private heroes: HeroEntity[] = [];
  private guards: GuardUnit[] = [];
  private vipRig!: ArticulatedCharacterRig;
  private vipPos: Vec2 = { x: 0, z: -12 };
  private vipYaw = 0;
  private vipPath: Vec2[] = [];
  private vipAnimPhase = 0;
  private vipLeaderId: HeroId = 'hamdan';

  private phase: GamePhase = 'title';
  private selectedHeroId: HeroId = 'hamdan';
  private targetingMode: TargetingMode = 'none';
  private scoutSurveyRemaining = 0;
  private quality: QualityPreset = 'high';

  private contextHintAr = 'اضغط على أحد الأبطال أو على الأرض للتحرك';
  private contextHintTimer = 0;

  // Visual helpers
  private moveMarker!: THREE.Mesh;
  private moveMarkerAge = 99;
  private pathLine!: THREE.Line;
  private pathLineGeo!: THREE.BufferGeometry;
  private primaryRing!: THREE.Mesh;
  private secondaryRing!: THREE.Mesh;
  private ripples: RippleEffect[] = [];
  private tracers: TracerEffect[] = [];
  private dustPool: DustParticle[] = [];
  private thrownPebble!: ThrownPebble;
  private smokeClouds: SmokeCloudEffect[] = [];
  private sightChecks: SightCheckEffect[] = [];

  // Input state
  private keysHeld = new Set<string>();
  private dragMode: 'none' | 'pan' | 'orbit' = 'none';
  private dragStartX = 0;
  private dragStartY = 0;
  private rightDownX = 0;
  private rightDownY = 0;
  private pointerDownX = 0;
  private pointerDownY = 0;
  private lastClickTime = 0;
  private lastClickX = 0;
  private lastClickY = 0;

  // Loop & timing
  private frameId = 0;
  private lastTimestamp = 0;
  private hudEmitAccum = 0;
  private hitstopTimer = 0;
  private elapsedClock = 0;
  private disposed = false;

  private resizeObserver: ResizeObserver;

  constructor(container: HTMLElement, onHudUpdate: (snapshot: HudSnapshot) => void) {
    this.container = container;
    this.onHudUpdate = onHudUpdate;

    this.sceneRig = createSceneRig(container);
    const maxAniso = this.sceneRig.renderer.capabilities.getMaxAnisotropy();
    this.textures = createProceduralTextures(maxAniso);

    const aspect = Math.max(1, container.clientWidth) / Math.max(1, container.clientHeight);
    this.camCtrl = new IsometricCameraController(aspect);

    this.campaignProgress = loadCampaignProgress();
    this.currentStage = getStageConfig('village');
    this.navGrid = new NavGrid(this.currentStage.obstacles, 0.42);
    this.mission = new MissionManager(this.currentStage);
    this.stageObjects = buildStageEnvironment(this.currentStage, this.textures);
    this.sceneRig.scene.add(this.stageObjects.group);

    void preloadCharacterGLBs();
    this.initVisualFeedback();
    this.spawnStageActors();

    if (!this.sceneRig.isSoftwareGl) {
      this.sceneRig.renderer.compile(this.sceneRig.scene, this.camCtrl.camera);
    }

    this.bindEvents();
    this.resizeObserver = new ResizeObserver(() => this.handleResize());
    this.resizeObserver.observe(container);

    this.emitHud();
    this.lastTimestamp = performance.now();
    this.startLoop();
  }

  private initVisualFeedback(): void {
    const markerGeo = new THREE.RingGeometry(0.28, 0.44, 24);
    markerGeo.rotateX(-Math.PI / 2);
    this.moveMarker = new THREE.Mesh(
      markerGeo,
      new THREE.MeshBasicMaterial({
        color: 0xfacc15,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    );
    this.moveMarker.position.y = 0.05;
    this.moveMarker.renderOrder = 4;
    this.sceneRig.scene.add(this.moveMarker);

    this.pathLineGeo = new THREE.BufferGeometry();
    this.pathLine = new THREE.Line(
      this.pathLineGeo,
      new THREE.LineDashedMaterial({
        color: 0xfde047,
        dashSize: 0.4,
        gapSize: 0.25,
        transparent: true,
        opacity: 0.65,
      }),
    );
    this.pathLine.visible = false;
    this.sceneRig.scene.add(this.pathLine);

    const objRingGeo = new THREE.RingGeometry(0.95, 1.18, 28);
    objRingGeo.rotateX(-Math.PI / 2);
    this.primaryRing = new THREE.Mesh(
      objRingGeo,
      new THREE.MeshBasicMaterial({
        color: 0xf59e0b,
        transparent: true,
        opacity: 0.85,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    this.primaryRing.position.y = 0.045;
    this.sceneRig.scene.add(this.primaryRing);

    this.secondaryRing = new THREE.Mesh(
      objRingGeo,
      new THREE.MeshBasicMaterial({
        color: 0xfb7185,
        transparent: true,
        opacity: 0.72,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    this.secondaryRing.position.y = 0.045;
    this.sceneRig.scene.add(this.secondaryRing);

    const pGeo = new THREE.SphereGeometry(0.14, 6, 6);
    for (let i = 0; i < 32; i++) {
      const pMat = new THREE.MeshBasicMaterial({
        color: 0xd9b382,
        transparent: true,
        opacity: 0.85,
      });
      const mesh = new THREE.Mesh(pGeo, pMat);
      mesh.visible = false;
      this.sceneRig.scene.add(mesh);
      this.dustPool.push({ mesh, vx: 0, vy: 0, vz: 0, age: 0, maxAge: 0.45, active: false });
    }

    const pebbleMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.09, 8, 6),
      new THREE.MeshStandardMaterial({ color: 0x57534e, roughness: 0.8 }),
    );
    pebbleMesh.visible = false;
    this.sceneRig.scene.add(pebbleMesh);
    this.thrownPebble = {
      mesh: pebbleMesh,
      startX: 0,
      startZ: 0,
      endX: 0,
      endZ: 0,
      t: 0,
      duration: 0.35,
      noiseRadius: 8.5,
      active: false,
    };

    // VIP rig created once and positioned per stage
    this.vipRig = createArticulatedCharacter(
      'vip',
      this.textures.contactShadow,
      undefined,
      this.textures.wovenClothBump,
    );
    this.vipRig.hitBox.userData.interact = 'primary';
    this.sceneRig.scene.add(this.vipRig.root);
  }

  private clearStageActors(): void {
    this.heroes.forEach((h) => {
      this.sceneRig.scene.remove(h.rig.root);
      h.rig.dispose();
    });
    this.guards.forEach((g) => {
      this.sceneRig.scene.remove(g.rig.root);
      this.sceneRig.scene.remove(g.visionCone.mesh);
      g.dispose();
    });
    this.heroes = [];
    this.guards = [];
  }

  private spawnStageActors(): void {
    this.clearStageActors();

    this.heroes = this.currentStage.heroSpawns.map((spec) => {
      const rig = createArticulatedCharacter(
        spec.id,
        this.textures.contactShadow,
        this.textures.selectionRing,
        this.textures.wovenClothBump,
      );
      rig.root.position.set(spec.x, 0, spec.z);
      rig.root.rotation.y = Math.PI;
      rig.hitBox.userData.heroId = spec.id;
      this.sceneRig.scene.add(rig.root);

      return {
        id: spec.id,
        nameAr: spec.nameAr,
        roleAr: spec.roleAr,
        skillNameAr: spec.skillNameAr,
        skillDescAr: spec.skillDescAr,
        skillMaxCooldown: spec.skillCooldown,
        skillCooldown: 0,
        secondaryMaxCooldown: spec.id === 'hamdan' ? 12 : spec.id === 'salem' ? 14 : 2,
        secondaryCooldown: 0,
        x: spec.x,
        z: spec.z,
        yaw: Math.PI,
        hp: 3,
        maxHp: 3,
        crouching: false,
        running: false,
        hiddenInCover: false,
        alive: true,
        path: [],
        animPhase: Math.random() * 4,
        actionTimer: 0,
        rig,
        carryingGuardId: null,
        pendingInteract: null,
      };
    });

    this.guards = this.currentStage.guardPatrols.map((spec) => {
      const rig = createArticulatedCharacter(
        'guard',
        this.textures.contactShadow,
        undefined,
        this.textures.wovenClothBump,
      );
      const unit = new GuardUnit(spec, rig);
      this.sceneRig.scene.add(rig.root);
      this.sceneRig.scene.add(unit.visionCone.mesh);
      return unit;
    });

    this.vipPos = { ...this.currentStage.primaryTargetPos };
    this.vipYaw = 0;
    this.vipPath = [];
    this.vipRig.root.position.set(this.vipPos.x, 0, this.vipPos.z);
    this.vipRig.root.rotation.y = 0;
    this.vipRig.root.visible = this.currentStage.primaryObjectiveType === 'vip';

    this.primaryRing.position.set(
      this.currentStage.primaryTargetPos.x,
      0.045,
      this.currentStage.primaryTargetPos.z,
    );
    this.secondaryRing.position.set(
      this.currentStage.secondaryTargetPos.x,
      0.045,
      this.currentStage.secondaryTargetPos.z,
    );
    this.primaryRing.visible = true;
    this.secondaryRing.visible = true;

    this.selectedHeroId = 'hamdan';
    this.updateSelectionRings();
  }

  public selectStage(stageId: StageId): void {
    if (this.currentStage.id === stageId) return;
    this.loadStage(stageId);
    this.emitHud();
  }

  private loadStage(stageId: StageId): void {
    const nextStage = getStageConfig(stageId);
    this.currentStage = nextStage;
    this.navGrid = new NavGrid(nextStage.obstacles, 0.42);
    this.mission.setStage(nextStage);

    // Swap 3D stage scene cleanly
    this.sceneRig.scene.remove(this.stageObjects.group);
    this.stageObjects.dispose();

    this.stageObjects = buildStageEnvironment(nextStage, this.textures);
    this.sceneRig.scene.add(this.stageObjects.group);

    this.sceneRig.scene.background = new THREE.Color(nextStage.skyColor);
    if (this.sceneRig.scene.fog instanceof THREE.FogExp2) {
      this.sceneRig.scene.fog.color.setHex(nextStage.skyColor);
    }

    this.spawnStageActors();

    if (!this.sceneRig.isSoftwareGl) {
      this.sceneRig.renderer.compile(this.sceneRig.scene, this.camCtrl.camera);
    }
  }

  public startGame(stageId?: StageId): void {
    this.sound.unlock();
    if (stageId && stageId !== this.currentStage.id) {
      this.loadStage(stageId);
    } else {
      this.resetMission();
    }
    this.phase = 'playing';
    const active = this.getSelectedHero();
    this.camCtrl.focusOn(active ? active.x : 0, active ? active.z : 15.5, false, true);
    this.sound.playSelect();
    this.setHint(`${this.currentStage.nameAr}: ${this.currentStage.primaryObjectiveLabelAr}`);
    this.emitHud();
  }

  public restartMission(): void {
    this.sound.unlock();
    this.resetMission();
    this.phase = 'playing';
    const active = this.getSelectedHero();
    this.camCtrl.focusOn(active ? active.x : 0, active ? active.z : 15.5, false, true);
    this.sound.playSelect();
    this.emitHud();
  }

  public returnToTitle(): void {
    this.resetMission();
    this.phase = 'title';
    this.emitHud();
  }

  public nextStage(): void {
    const order: StageId[] = ['village', 'camp', 'farms', 'mountain'];
    const idx = order.indexOf(this.currentStage.id);
    const nextId = order[(idx + 1) % order.length];
    this.startGame(nextId);
  }

  public togglePause(): void {
    if (this.phase === 'playing') {
      this.phase = 'paused';
      this.keysHeld.clear();
      this.emitHud();
    } else if (this.phase === 'paused') {
      this.phase = 'playing';
      this.lastTimestamp = performance.now();
      this.emitHud();
    }
  }

  public selectHero(id: HeroId): void {
    const h = this.heroes.find((x) => x.id === id);
    if (!h || !h.alive) return;
    this.selectedHeroId = id;
    this.targetingMode = 'none';
    this.updateSelectionRings();
    this.sound.playSelect();
    this.camCtrl.focusOn(h.x, h.z, false, true);
    this.emitHud();
  }

  public toggleCameraFollow(): void {
    const next = !this.camCtrl.isFollowingHero();
    this.camCtrl.setFollowHero(next);
    if (next) {
      const h = this.getSelectedHero();
      if (h) this.camCtrl.focusOn(h.x, h.z, false, true);
      this.setHint('الكاميرا تتبع البطل المحدد أثناء الحركة [Space]');
    } else {
      this.setHint('وضع الكاميرا الحرة — اضغط [Space] لإعادة التتبع');
    }
    this.emitHud();
  }

  public rotateCameraStep(dir: 1 | -1): void {
    this.camCtrl.stepYaw45(dir);
    this.emitHud();
  }

  public cycleCameraView(): void {
    const preset = this.camCtrl.cycleViewPreset();
    const label =
      preset === 'high' ? 'منظور علوي تكتيكي' : preset === 'close' ? 'منظور قريب' : 'منظور مائل قياسي';
    this.setHint(`زاوية الرؤية: ${label} [V]`);
    this.emitHud();
  }

  public toggleCrouch(): void {
    const h = this.getSelectedHero();
    if (!h || !h.alive || this.phase !== 'playing') return;
    h.crouching = !h.crouching;
    if (h.crouching) h.running = false;
    this.setHint(h.crouching ? `${h.nameAr} في وضع التسلل المنخفض` : `${h.nameAr} عاد لوضع الوقوف`);
    this.emitHud();
  }

  public rallySquad(): void {
    const leader = this.getSelectedHero();
    if (!leader || !leader.alive || this.phase !== 'playing') return;

    const offsets = [
      { dx: -1.4, dz: 1.0 },
      { dx: 1.4, dz: 1.0 },
    ];
    let idx = 0;
    for (const h of this.heroes) {
      if (!h.alive || h.id === leader.id) continue;
      const off = offsets[idx % offsets.length];
      idx++;
      h.pendingInteract = null;
      h.crouching = leader.crouching;
      h.running = false;
      h.path = this.navGrid.findPath(
        { x: h.x, z: h.z },
        {
          x: THREE.MathUtils.clamp(leader.x + off.dx, -20.5, 20.5),
          z: THREE.MathUtils.clamp(leader.z + off.dz, -20.5, 20.5),
        },
      );
    }
    this.sound.playSelect();
    this.setHint(`نداء التجميع: تحرك الفريق إلى موقع ${leader.nameAr}`);
    this.emitHud();
  }

  public activateWeaponTool(): void {
    const h = this.getSelectedHero();
    if (!h || !h.alive || this.phase !== 'playing') return;

    if (h.carryingGuardId) {
      this.setHint('ألْقِ الجثة أولاً [E] قبل استخدام السلاح');
      this.emitHud();
      return;
    }

    // For Bakri, also allow instant bell/objective sabotage if standing right next to it
    if (h.id === 'bakri') {
      const inter = this.mission.getNearestInteractable(h.x, h.z);
      if (inter && inter.dist <= 3.0) {
        if (inter.kind === 'primary') this.completePrimaryObjective(h);
        else this.disableAlarm(h);
        return;
      }
    }

    const meleeReach = h.id === 'hamdan' ? 2.45 : 2.2;
    let nearestGuard: GuardUnit | null = null;
    let bestD = Infinity;
    for (const g of this.guards) {
      if (g.state === 'ko') continue;
      const d = Math.hypot(g.x - h.x, g.z - h.z);
      if (d <= meleeReach && d < bestD) {
        bestD = d;
        nearestGuard = g;
      }
    }
    if (nearestGuard) {
      this.tryKnockout(h, nearestGuard);
      return;
    }

    this.targetingMode = this.targetingMode === 'weapon' ? 'none' : 'weapon';
    if (this.targetingMode === 'weapon') {
      this.setHint(
        h.id === 'hamdan'
          ? 'الشومة جاهزة — انقر على أي حارس للتقدم وضربه بصمت'
          : h.id === 'salem'
            ? 'المنجل جاهز — انقر على حارس للتسلل خلفه وتحييده بصمت'
            : 'عدّة الميدان جاهزة — انقر على الجرس أو الهدف أو حارس من الخلف',
      );
    } else {
      this.setHint('تم إلغاء وضع الأداة');
    }
    this.emitHud();
  }

  public activateSkill(): void {
    const h = this.getSelectedHero();
    if (!h || !h.alive || this.phase !== 'playing') return;
    if (h.skillCooldown > 0) {
      this.setHint(`المهارة قيد التجهيز (${Math.ceil(h.skillCooldown)} ث)`);
      this.emitHud();
      return;
    }

    if (h.id === 'bakri') {
      this.targetingMode = 'none';
      h.skillCooldown = h.skillMaxCooldown;
      h.actionTimer = 0.55;
      this.scoutSurveyRemaining = 9.0;
      this.stageObjects.patrolLinesGroup.visible = true;
      this.camCtrl.setScoutZoom(true);
      this.sound.playScoutPing();
      this.setHint('ناظور الاستطلاع: مسارات جميع الحراس مكشوفة لمدة 9 ثوانٍ!');
      this.emitHud();
      return;
    }

    this.targetingMode = this.targetingMode === 'skill' ? 'none' : 'skill';
    this.setHint(
      this.targetingMode === 'skill'
        ? h.id === 'salem'
          ? 'انقر على الأرض لرمي الحصاة وتشتيت الحراس (المدى 13.5م)'
          : 'انقر على موضع قريب لإطلاق صفارة التشتيت (المدى 11م)'
        : 'تم إلغاء توجيه المهارة',
    );
    this.emitHud();
  }

  public activateSecondarySkill(): void {
    const h = this.getSelectedHero();
    if (!h || !h.alive || this.phase !== 'playing') return;
    if (h.secondaryCooldown > 0) {
      this.setHint(`الأداة قيد التجهيز (${Math.ceil(h.secondaryCooldown)} ث)`);
      this.emitHud();
      return;
    }

    this.targetingMode = this.targetingMode === 'secondary' ? 'none' : 'secondary';
    if (this.targetingMode === 'secondary') {
      this.setHint(
        h.id === 'hamdan'
          ? 'اندفاع الشومة: انقر على حارس خلال 6 أمتار للاندفاع وتحييده فوراً'
          : h.id === 'salem'
            ? 'قنبلة غبار: انقر على الأرض لنشر سحابة غبار تحجب الرؤية 5.5 ث'
            : 'فحص الرؤية: انقر على أي نقطة على الأرض لمعرفة إن كانت مكشوفة للحراس',
      );
    } else {
      this.setHint('تم إلغاء توجيه الأداة');
    }
    this.emitHud();
  }

  public startDropTargeting(): void {
    const h = this.getSelectedHero();
    if (!h || !h.alive || this.phase !== 'playing') return;
    if (!h.carryingGuardId) {
      this.interactNearest();
      return;
    }
    this.targetingMode = this.targetingMode === 'drop_body' ? 'none' : 'drop_body';
    this.setHint(
      this.targetingMode === 'drop_body'
        ? 'انقر على أي ساتر أخضر أو نقطة على الأرض لنقل الجثة وإلقائها هناك'
        : 'تم الإلغاء — اضغط [E] لإلقاء الجثة في مكانك الحالي',
    );
    this.emitHud();
  }

  public useTool(toolId: HeroToolId): void {
    const h = this.getSelectedHero();
    if (!h || !h.alive || this.phase !== 'playing') return;
    if (toolId === 'shouma' || toolId === 'sickle' || toolId === 'sabotage') {
      this.activateWeaponTool();
    } else if (toolId === 'whistle' || toolId === 'pebble' || toolId === 'binoculars') {
      this.activateSkill();
    } else if (toolId === 'lunge' || toolId === 'dust_bomb' || toolId === 'sight_check') {
      this.activateSecondarySkill();
    } else if (toolId === 'carry') {
      this.interactNearest();
    }
  }

  public interactNearest(): void {
    const h = this.getSelectedHero();
    if (!h || !h.alive || this.phase !== 'playing') return;

    if (h.carryingGuardId) {
      this.targetingMode = 'none';
      this.dropCarriedBody(h);
      return;
    }

    const meleeReach = h.id === 'hamdan' ? 2.45 : 2.25;
    let nearestGuard: GuardUnit | null = null;
    let bestD = Infinity;
    for (const g of this.guards) {
      if (g.state === 'ko') continue;
      const d = Math.hypot(g.x - h.x, g.z - h.z);
      if (d < meleeReach && d < bestD) {
        bestD = d;
        nearestGuard = g;
      }
    }
    if (nearestGuard) {
      this.tryKnockout(h, nearestGuard);
      return;
    }

    const inter = this.mission.getNearestInteractable(h.x, h.z);
    const maxInterDist = h.id === 'bakri' ? 3.0 : 2.45;
    if (inter && inter.dist <= maxInterDist) {
      if (inter.kind === 'primary') this.completePrimaryObjective(h);
      else this.disableAlarm(h);
      return;
    }

    let nearestKo: GuardUnit | null = null;
    let bestKoD = Infinity;
    for (const g of this.guards) {
      if (g.state !== 'ko' || g.carriedByHeroId !== null) continue;
      const d = Math.hypot(g.x - h.x, g.z - h.z);
      if (d < 2.45 && d < bestKoD) {
        bestKoD = d;
        nearestKo = g;
      }
    }
    if (nearestKo) {
      this.pickupGuard(h, nearestKo);
      return;
    }

    this.setHint('اقترب من حارس أو جثة أو الهدف للتفاعل [E]');
    this.emitHud();
  }

  public quickSave(): void {
    if (this.phase !== 'playing') return;
    const ok = writeQuickSave({
      stageId: this.currentStage.id,
      savedAt: new Date().toISOString(),
      elapsedSeconds: this.mission.elapsedSeconds,
      alertsTriggered: this.mission.alertsTriggered,
      alarmLevel: this.mission.alarmLevel,
      primaryDone: this.mission.primaryDone,
      secondaryDone: this.mission.secondaryDone,
      vipPos: { ...this.vipPos },
      vipLeaderId: this.vipLeaderId,
      selectedHeroId: this.selectedHeroId,
      heroes: this.heroes.map((h) => ({
        id: h.id,
        x: h.x,
        z: h.z,
        yaw: h.yaw,
        hp: h.hp,
        crouching: h.crouching,
        alive: h.alive,
        skillCooldown: h.skillCooldown,
        secondaryCooldown: h.secondaryCooldown,
        carryingGuardId: h.carryingGuardId,
      })),
      guards: this.guards.map((g) => ({
        id: g.id,
        x: g.x,
        z: g.z,
        yaw: g.yaw,
        state: g.state,
        suspicion: g.suspicion,
        carriedByHeroId: g.carriedByHeroId,
        bodyDiscovered: g.bodyDiscovered,
      })),
    });
    if (ok) {
      this.sound.playSelect();
      this.setHint('تم حفظ التقدم السريع [F5]');
      this.emitHud();
    }
  }

  public quickLoad(): void {
    const save = readQuickSave();
    if (!save) {
      this.setHint('لا يوجد حفظ سريع متاح حالياً');
      this.emitHud();
      return;
    }
    this.sound.unlock();
    if (save.stageId !== this.currentStage.id) {
      this.loadStage(save.stageId);
    } else {
      this.resetMission();
    }
    this.phase = 'playing';

    this.mission.elapsedSeconds = save.elapsedSeconds;
    this.mission.alertsTriggered = save.alertsTriggered;
    this.mission.alarmLevel = save.alarmLevel;
    this.mission.primaryDone = save.primaryDone;
    this.mission.secondaryDone = save.secondaryDone;

    this.vipPos = { ...save.vipPos };
    this.vipLeaderId = save.vipLeaderId;
    this.vipRig.root.position.set(this.vipPos.x, 0, this.vipPos.z);

    this.primaryRing.visible = !save.primaryDone;
    this.stageObjects.primaryBeaconMesh.visible = !save.primaryDone;
    if (this.currentStage.primaryObjectiveType !== 'vip' && save.primaryDone) {
      this.stageObjects.primaryPropGroup.visible = false;
    }
    this.secondaryRing.visible = !save.secondaryDone;
    this.stageObjects.alarmBellMesh.visible = !save.secondaryDone;

    save.heroes.forEach((sh) => {
      const h = this.heroes.find((x) => x.id === sh.id);
      if (!h) return;
      h.x = sh.x;
      h.z = sh.z;
      h.yaw = sh.yaw;
      h.hp = sh.hp;
      h.crouching = sh.crouching;
      h.alive = sh.alive;
      h.skillCooldown = sh.skillCooldown;
      h.secondaryCooldown = sh.secondaryCooldown ?? 0;
      h.carryingGuardId = sh.carryingGuardId ?? null;
      h.path = [];
      h.pendingInteract = null;
      h.rig.root.position.set(h.x, 0, h.z);
      h.rig.root.rotation.y = h.yaw;
    });

    save.guards.forEach((sg) => {
      const g = this.guards.find((x) => x.id === sg.id);
      if (g) {
        g.restoreState(
          sg.x,
          sg.z,
          sg.yaw,
          sg.state,
          sg.suspicion,
          sg.carriedByHeroId ?? null,
          sg.bodyDiscovered ?? false,
        );
      }
    });

    for (const h of this.heroes) {
      if (h.carryingGuardId) {
        const g = this.guards.find((x) => x.id === h.carryingGuardId);
        if (g && g.state === 'ko') {
          g.syncCarriedPose(h.x, h.z, h.yaw, h.crouching, 0.016);
        } else {
          h.carryingGuardId = null;
        }
      }
    }

    this.selectedHeroId = save.selectedHeroId;
    this.updateSelectionRings();
    const active = this.getSelectedHero();
    if (active) this.camCtrl.focusOn(active.x, active.z, true, true);
    this.sound.playObjective();
    this.setHint('تمت استعادة آخر نقطة حفظ [F9]');
    this.emitHud();
  }

  public panToWorld(x: number, z: number): void {
    this.camCtrl.focusOn(x, z, false, false);
    this.emitHud();
  }

  public toggleMute(): void {
    this.sound.toggleMute();
    this.emitHud();
  }

  public toggleQuality(): void {
    this.quality = this.quality === 'high' ? 'eco' : 'high';
    this.sceneRig.setQuality(this.quality);
    this.emitHud();
  }

  private clearTransientEffects(): void {
    for (const sc of this.smokeClouds) {
      this.sceneRig.scene.remove(sc.group);
      sc.group.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
        }
      });
      sc.ringMat.dispose();
      sc.puffMats.forEach((m) => m.dispose());
    }
    this.smokeClouds = [];

    for (const s of this.sightChecks) {
      this.sceneRig.scene.remove(s.group);
      s.geometries.forEach((g) => g.dispose());
      s.materials.forEach((m) => m.dispose());
    }
    this.sightChecks = [];
  }

  private resetMission(): void {
    this.mission.reset();
    this.targetingMode = 'none';
    this.scoutSurveyRemaining = 0;
    this.stageObjects.patrolLinesGroup.visible = false;
    this.camCtrl.setScoutZoom(false);
    this.clearTransientEffects();

    this.currentStage.heroSpawns.forEach((spec, idx) => {
      const h = this.heroes[idx];
      if (!h) return;
      h.x = spec.x;
      h.z = spec.z;
      h.yaw = Math.PI;
      h.hp = h.maxHp;
      h.alive = true;
      h.crouching = false;
      h.running = false;
      h.hiddenInCover = false;
      h.skillCooldown = 0;
      h.secondaryCooldown = 0;
      h.carryingGuardId = null;
      h.path = [];
      h.pendingInteract = null;
      h.actionTimer = 0;
      h.rig.root.position.set(h.x, 0, h.z);
      h.rig.root.rotation.y = h.yaw;
    });

    this.guards.forEach((g) => g.reset());

    this.vipPos = { ...this.currentStage.primaryTargetPos };
    this.vipYaw = 0;
    this.vipPath = [];
    this.vipRig.root.position.set(this.vipPos.x, 0, this.vipPos.z);
    this.vipRig.root.rotation.y = 0;
    this.vipRig.root.visible = this.currentStage.primaryObjectiveType === 'vip';

    this.primaryRing.visible = true;
    this.secondaryRing.visible = true;
    this.stageObjects.alarmBellMesh.visible = true;
    this.stageObjects.primaryBeaconMesh.visible = true;
    this.stageObjects.primaryPropGroup.visible = true;
    this.pathLine.visible = false;

    this.selectedHeroId = 'hamdan';
    this.updateSelectionRings();
  }

  private getSelectedHero(): HeroEntity | undefined {
    return this.heroes.find((h) => h.id === this.selectedHeroId);
  }

  private updateSelectionRings(): void {
    for (const h of this.heroes) {
      if (h.rig.selectionRing) {
        h.rig.selectionRing.visible = h.alive && h.id === this.selectedHeroId;
      }
    }
  }

  private setHint(text: string): void {
    this.contextHintAr = text;
    this.contextHintTimer = 4.5;
  }

  private spawnDust(x: number, z: number, colorHex = 0xd9b382, count = 8): void {
    let spawned = 0;
    for (const p of this.dustPool) {
      if (p.active) continue;
      p.active = true;
      p.age = 0;
      p.maxAge = 0.35 + Math.random() * 0.25;
      p.mesh.visible = true;
      p.mesh.position.set(x + (Math.random() - 0.5) * 0.4, 0.25, z + (Math.random() - 0.5) * 0.4);
      p.mesh.scale.setScalar(0.8 + Math.random() * 0.7);
      (p.mesh.material as THREE.MeshBasicMaterial).color.setHex(colorHex);
      (p.mesh.material as THREE.MeshBasicMaterial).opacity = 0.85;
      const a = Math.random() * Math.PI * 2;
      const spd = 1.2 + Math.random() * 2.2;
      p.vx = Math.cos(a) * spd;
      p.vy = 1.4 + Math.random() * 1.8;
      p.vz = Math.sin(a) * spd;
      spawned++;
      if (spawned >= count) break;
    }
  }

  private spawnTracer(gx: number, gz: number, hx: number, hz: number): void {
    const geo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(gx, 1.25, gz),
      new THREE.Vector3(hx, 1.05, hz),
    ]);
    const mat = new THREE.LineBasicMaterial({
      color: 0xfef08a,
      transparent: true,
      opacity: 0.95,
    });
    const line = new THREE.Line(geo, mat);
    this.sceneRig.scene.add(line);
    this.tracers.push({ line, mat, age: 0, maxAge: 0.16 });
  }

  private emitNoise(
    x: number,
    z: number,
    radius: number,
    colorHex: number,
    isLoudAlarm = false,
  ): void {
    const geo = new THREE.RingGeometry(0.3, 0.55, 32);
    geo.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshBasicMaterial({
      color: colorHex,
      transparent: true,
      opacity: 0.75,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, 0.06, z);
    mesh.renderOrder = 4;
    this.sceneRig.scene.add(mesh);
    this.ripples.push({ mesh, mat, age: 0, maxAge: 0.75, maxRadius: radius });

    for (const g of this.guards) {
      if (g.state === 'ko') continue;
      const d = Math.hypot(g.x - x, g.z - z);
      if (d <= radius) {
        g.hearNoise(x, z, isLoudAlarm, this.navGrid);
      }
    }
  }

  private tryKnockout(hero: HeroEntity, guard: GuardUnit, forceLunge = false): void {
    if (guard.state === 'ko') return;
    if (hero.carryingGuardId) {
      this.setHint('ألْقِ الجثة أولاً [E] قبل الاشتباك!');
      this.emitHud();
      return;
    }
    const dist = Math.hypot(guard.x - hero.x, guard.z - hero.z);
    const maxReach = forceLunge ? 2.55 : hero.id === 'hamdan' ? 2.45 : 2.2;
    if (dist > maxReach) return;

    if (guard.state === 'alert' && hero.id !== 'hamdan') {
      const gx = Math.sin(guard.yaw);
      const gz = Math.cos(guard.yaw);
      const toHeroX = (hero.x - guard.x) / Math.max(0.01, dist);
      const toHeroZ = (hero.z - guard.z) / Math.max(0.01, dist);
      const dot = gx * toHeroX + gz * toHeroZ;
      if (dot > 0.35) {
        this.setHint('الحارس متأهب! التف خلفه أو استخدم شومة حمدان للاشتباك المباشر');
        this.emitHud();
        return;
      }
    }

    hero.actionTimer = hero.id === 'salem' ? 0.32 : 0.42;
    hero.yaw = Math.atan2(guard.x - hero.x, guard.z - hero.z);
    guard.knockout();
    this.hitstopTimer = 0.045;
    this.camCtrl.addShake(hero.id === 'hamdan' ? 0.26 : 0.16);
    this.sound.playKnockout();
    this.spawnDust(guard.x, guard.z, 0xd8c39e, hero.id === 'salem' ? 5 : 10);
    const weaponLabel =
      hero.id === 'hamdan' ? 'بالشومة' : hero.id === 'salem' ? 'بالمنجل بصمت' : 'بعدّة الميدان';
    this.setHint(`تم تعطيل الحارس ${weaponLabel} — اضغط [E] لحمل الجثة وإخفائها`);
    this.emitHud();
  }

  private pickupGuard(hero: HeroEntity, guard: GuardUnit): void {
    if (!hero.alive || hero.carryingGuardId) return;
    if (guard.state !== 'ko' || guard.carriedByHeroId !== null) return;
    const dist = Math.hypot(guard.x - hero.x, guard.z - hero.z);
    if (dist > 2.45) return;

    hero.carryingGuardId = guard.id;
    hero.running = false;
    hero.actionTimer = 0.28;
    hero.yaw = Math.atan2(guard.x - hero.x, guard.z - hero.z);
    guard.setCarriedBy(hero.id);
    guard.syncCarriedPose(hero.x, hero.z, hero.yaw, hero.crouching, 0.016);
    this.sound.playBodyPickup();
    this.spawnDust(guard.x, guard.z, 0xd8c39e, 5);
    this.setHint(`${hero.nameAr} يحمل الجثة — اضغط [E] للإلقاء هنا، أو انقر باليمين / زر الإلقاء لتحديد موضع`);
    this.emitHud();
  }

  private dropCarriedBody(hero: HeroEntity, silentHint = false, preferredTarget?: Vec2): void {
    if (!hero.carryingGuardId) return;
    const guardId = hero.carryingGuardId;
    hero.carryingGuardId = null;
    const guard = this.guards.find((g) => g.id === guardId);
    if (!guard) {
      this.emitHud();
      return;
    }

    let dropX = hero.x;
    let dropZ = hero.z;

    if (preferredTarget && Math.hypot(preferredTarget.x - hero.x, preferredTarget.z - hero.z) <= 2.4) {
      const tx = THREE.MathUtils.clamp(preferredTarget.x, -21, 21);
      const tz = THREE.MathUtils.clamp(preferredTarget.z, -21, 21);
      if (this.navGrid.isWalkableWorld(tx, tz)) {
        dropX = tx;
        dropZ = tz;
      }
    }

    // If right next to a cover zone, gently tuck the body inside it when dropping in place
    if (!preferredTarget) {
      const nearCover = this.currentStage.coverZones.find(
        (cz) => Math.hypot(hero.x - cz.x, hero.z - cz.z) <= cz.radius + 1.15,
      );
      if (nearCover && this.navGrid.isWalkableWorld(nearCover.x, nearCover.z)) {
        dropX = nearCover.x;
        dropZ = nearCover.z;
      } else {
        const offsets = [0.85, 0.48, 0];
        for (const off of offsets) {
          const tx = THREE.MathUtils.clamp(hero.x + Math.sin(hero.yaw) * off, -21, 21);
          const tz = THREE.MathUtils.clamp(hero.z + Math.cos(hero.yaw) * off, -21, 21);
          if (this.navGrid.isWalkableWorld(tx, tz)) {
            dropX = tx;
            dropZ = tz;
            break;
          }
        }
      }
    }

    guard.x = dropX;
    guard.z = dropZ;
    guard.yaw = hero.yaw + Math.PI * 0.5;
    guard.setCarriedBy(null);
    hero.actionTimer = 0.25;
    this.sound.playBodyDrop();
    this.spawnDust(dropX, dropZ, 0xd8c39e, 7);

    if (!silentHint) {
      const coverZone = this.currentStage.coverZones.find(
        (cz) => Math.hypot(dropX - cz.x, dropZ - cz.z) <= cz.radius,
      );
      this.setHint(
        coverZone
          ? `تم إخفاء الجثة داخل ${coverZone.label} بعيداً عن أعين الحراس!`
          : 'تم إلقاء الجثة على الأرض — احرص ألا يراها الحراس',
      );
    }
    this.emitHud();
  }

  private completePrimaryObjective(hero: HeroEntity): void {
    if (this.mission.primaryDone) return;
    this.mission.primaryDone = true;
    this.vipLeaderId = hero.id;
    this.primaryRing.visible = false;
    this.stageObjects.primaryBeaconMesh.visible = false;
    if (this.currentStage.primaryObjectiveType !== 'vip') {
      this.stageObjects.primaryPropGroup.visible = false;
    }
    hero.actionTimer = 0.45;
    this.sound.playObjective();
    this.spawnDust(
      this.currentStage.primaryTargetPos.x,
      this.currentStage.primaryTargetPos.z,
      0xfbbf24,
      12,
    );

    if (this.currentStage.primaryObjectiveType === 'vip') {
      this.setHint('تم تحرير الأسير! اصطحبه إلى نقطة الإخلاء الجنوبية');
    } else if (this.currentStage.primaryObjectiveType === 'intel') {
      this.setHint('تم الاستيلاء على الوثائق السرية! انسحب إلى نقطة الإخلاء');
    } else {
      this.setHint('تم زرع شحنة التفجير! انسحب سريعاً إلى نقطة الإخلاء');
    }
    this.emitHud();
  }

  private disableAlarm(hero: HeroEntity): void {
    if (this.mission.secondaryDone) return;
    this.mission.secondaryDone = true;
    this.secondaryRing.visible = false;
    this.stageObjects.alarmBellMesh.visible = false;
    hero.actionTimer = 0.45;
    this.sound.playObjective();
    this.spawnDust(
      this.currentStage.secondaryTargetPos.x,
      this.currentStage.secondaryTargetPos.z,
      0xf59e0b,
      8,
    );
    this.setHint('تم تعطيل جرس الإنذار! تباطأ تصاعد حالة الطوارئ');
    this.emitHud();
  }

  // =========================================================================
  // Event Listeners
  // =========================================================================

  private bindEvents(): void {
    const canvas = this.sceneRig.renderer.domElement;
    canvas.addEventListener('pointerdown', this.onPointerDown);
    window.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerup', this.onPointerUp);
    canvas.addEventListener('wheel', this.onWheel, { passive: false });
    canvas.addEventListener('contextmenu', this.onContextMenu);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onWindowBlur);
  }

  private onContextMenu = (e: MouseEvent) => e.preventDefault();

  private onWindowBlur = () => {
    this.keysHeld.clear();
    this.dragMode = 'none';
  };

  private onWheel = (e: WheelEvent) => {
    if (this.phase !== 'playing') return;
    e.preventDefault();
    this.camCtrl.adjustZoom(e.deltaY * 0.015);
  };

  private onPointerDown = (e: PointerEvent) => {
    this.sound.unlock();
    if (this.phase !== 'playing') return;
    if (e.button === 1 || (e.button === 0 && e.altKey) || (e.button === 2 && e.shiftKey)) {
      this.dragMode = 'orbit';
      this.dragStartX = e.clientX;
      this.dragStartY = e.clientY;
      return;
    }
    if (e.button === 2) {
      this.dragMode = 'pan';
      this.dragStartX = e.clientX;
      this.dragStartY = e.clientY;
      this.rightDownX = e.clientX;
      this.rightDownY = e.clientY;
      return;
    }
    if (e.button === 0) {
      this.pointerDownX = e.clientX;
      this.pointerDownY = e.clientY;
    }
  };

  private onPointerMove = (e: PointerEvent) => {
    if (this.dragMode === 'none' || this.phase !== 'playing') return;
    const dx = e.clientX - this.dragStartX;
    const dy = e.clientY - this.dragStartY;
    this.dragStartX = e.clientX;
    this.dragStartY = e.clientY;
    if (this.dragMode === 'orbit') {
      this.camCtrl.rotateYaw(-dx * 0.0085);
      this.camCtrl.adjustPitch(dy * 0.006);
    } else {
      if (Math.hypot(e.clientX - this.rightDownX, e.clientY - this.rightDownY) > 5) {
        this.camCtrl.panScreenDelta(dx, dy);
      }
    }
  };

  private onPointerUp = (e: PointerEvent) => {
    if (this.dragMode === 'orbit') {
      this.dragMode = 'none';
      return;
    }
    if (e.button === 2) {
      const moved = Math.hypot(e.clientX - this.rightDownX, e.clientY - this.rightDownY);
      this.dragMode = 'none';
      if (moved < 5 && this.phase === 'playing') {
        const activeHero = this.getSelectedHero();
        if (activeHero && activeHero.alive && activeHero.carryingGuardId) {
          const rect = this.sceneRig.renderer.domElement.getBoundingClientRect();
          _mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
          _mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
          _raycaster.setFromCamera(_mouse, this.camCtrl.camera);
          if (_raycaster.ray.intersectPlane(_groundPlane, _hitPoint)) {
            this.orderDropBodyAt(activeHero, _hitPoint.x, _hitPoint.z);
          }
        }
      }
      return;
    }
    if (e.button !== 0 || this.phase !== 'playing') return;
    if (Math.hypot(e.clientX - this.pointerDownX, e.clientY - this.pointerDownY) > 7) return;

    const rect = this.sceneRig.renderer.domElement.getBoundingClientRect();
    _mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    _mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    _raycaster.setFromCamera(_mouse, this.camCtrl.camera);

    const activeHero = this.getSelectedHero();

    if (this.targetingMode === 'skill' && activeHero && activeHero.alive) {
      if (_raycaster.ray.intersectPlane(_groundPlane, _hitPoint)) {
        this.executeTargetedSkill(activeHero, _hitPoint.x, _hitPoint.z);
      }
      return;
    }

    if (this.targetingMode === 'secondary' && activeHero && activeHero.alive) {
      if (activeHero.id === 'hamdan') {
        const guardHits = _raycaster.intersectObjects(
          this.guards.filter((g) => g.state !== 'ko').map((g) => g.rig.hitBox),
          true,
        );
        if (guardHits.length > 0 && guardHits[0].object.userData.guardId) {
          this.executeHamdanLunge(activeHero, guardHits[0].object.userData.guardId as string);
          return;
        }
        if (_raycaster.ray.intersectPlane(_groundPlane, _hitPoint)) {
          const near = this.findNearestActiveGuard(_hitPoint.x, _hitPoint.z, 2.2);
          if (near) {
            this.executeHamdanLunge(activeHero, near.id);
          } else {
            this.setHint('انقر مباشرة على حارس ضمن مدى 6 أمتار للاندفاع إليه');
            this.emitHud();
          }
        }
        return;
      }
      if (_raycaster.ray.intersectPlane(_groundPlane, _hitPoint)) {
        this.executeSecondarySkillAt(activeHero, _hitPoint.x, _hitPoint.z);
      }
      return;
    }

    if (this.targetingMode === 'drop_body' && activeHero && activeHero.alive) {
      if (_raycaster.ray.intersectPlane(_groundPlane, _hitPoint)) {
        this.orderDropBodyAt(activeHero, _hitPoint.x, _hitPoint.z);
      }
      return;
    }

    const interactTargets: THREE.Object3D[] = [
      ...this.heroes.filter((h) => h.alive).map((h) => h.rig.hitBox),
      ...this.guards.filter((g) => g.carriedByHeroId === null).map((g) => g.rig.hitBox),
    ];

    if (!this.mission.primaryDone) {
      if (this.currentStage.primaryObjectiveType === 'vip') {
        interactTargets.push(this.vipRig.hitBox);
      } else {
        interactTargets.push(this.stageObjects.primaryPropGroup);
      }
    }
    if (!this.mission.secondaryDone) {
      interactTargets.push(this.stageObjects.bellHitMesh);
    }

    const hits = _raycaster.intersectObjects(interactTargets, true);
    if (hits.length > 0) {
      const ud = hits[0].object.userData;
      if (ud.heroId && this.targetingMode !== 'weapon') {
        this.selectHero(ud.heroId as HeroId);
        return;
      }
      if (ud.guardId && activeHero && activeHero.alive) {
        const targetId = ud.guardId as string;
        const g = this.guards.find((x) => x.id === targetId);
        if (g) {
          if (g.state === 'ko') {
            if (activeHero.carryingGuardId) {
              this.setHint('البطل يحمل جثة بالفعل — اضغط [E] لإلقائها أولاً');
              this.emitHud();
              return;
            }
            this.targetingMode = 'none';
            activeHero.pendingInteract = { type: 'pickup', guardId: g.id };
            activeHero.running = false;
            activeHero.path = this.navGrid.findPath(
              { x: activeHero.x, z: activeHero.z },
              { x: g.x, z: g.z },
            );
            this.sound.playMoveConfirm();
            this.showMoveMarker(g.x, g.z, 0x38bdf8);
            return;
          }
          if (activeHero.carryingGuardId) {
            this.setHint('ألْقِ الجثة أولاً [E] قبل مهاجمة الحارس!');
            this.emitHud();
            return;
          }
          this.targetingMode = 'none';
          activeHero.pendingInteract = { type: 'knockout', guardId: g.id };
          activeHero.running = e.shiftKey;
          activeHero.path = this.navGrid.findPath(
            { x: activeHero.x, z: activeHero.z },
            { x: g.x, z: g.z },
          );
          this.sound.playMoveConfirm();
          this.showMoveMarker(g.x, g.z, 0xef4444);
          return;
        }
      }
      if (ud.interact === 'primary' && activeHero && activeHero.alive) {
        const pt = this.currentStage.primaryTargetPos;
        this.targetingMode = 'none';
        activeHero.pendingInteract = { type: 'primary' };
        activeHero.path = this.navGrid.findPath({ x: activeHero.x, z: activeHero.z }, pt);
        this.sound.playMoveConfirm();
        this.showMoveMarker(pt.x, pt.z, 0xf59e0b);
        return;
      }
      if (ud.interact === 'secondary' && activeHero && activeHero.alive) {
        const st = this.currentStage.secondaryTargetPos;
        this.targetingMode = 'none';
        activeHero.pendingInteract = { type: 'secondary' };
        activeHero.path = this.navGrid.findPath({ x: activeHero.x, z: activeHero.z }, st);
        this.sound.playMoveConfirm();
        this.showMoveMarker(st.x, st.z, 0xfb7185);
        return;
      }
    }

    if (this.targetingMode === 'weapon') {
      this.setHint('انقر مباشرة على حارس (أو جرس/هدف) لاستخدام الأداة');
      this.emitHud();
      return;
    }

    if (activeHero && activeHero.alive && _raycaster.ray.intersectPlane(_groundPlane, _hitPoint)) {
      const now = performance.now();
      const isDoubleClick =
        now - this.lastClickTime < 340 &&
        Math.hypot(e.clientX - this.lastClickX, e.clientY - this.lastClickY) < 25;
      this.lastClickTime = now;
      this.lastClickX = e.clientX;
      this.lastClickY = e.clientY;

      const wantRun = !activeHero.carryingGuardId && (e.shiftKey || isDoubleClick);
      if (wantRun) activeHero.crouching = false;
      activeHero.running = wantRun;
      activeHero.pendingInteract = null;

      const gx = THREE.MathUtils.clamp(_hitPoint.x, -21, 21);
      const gz = THREE.MathUtils.clamp(_hitPoint.z, -21, 21);
      const path = this.navGrid.findPath({ x: activeHero.x, z: activeHero.z }, { x: gx, z: gz });
      if (path.length > 0) {
        activeHero.path = path;
        const end = path[path.length - 1];
        this.showMoveMarker(end.x, end.z, wantRun ? 0xf97316 : 0xfacc15);
        this.sound.playMoveConfirm();
      }
    }
  };

  private findNearestActiveGuard(x: number, z: number, maxDist: number): GuardUnit | null {
    let best: GuardUnit | null = null;
    let bestD = maxDist;
    for (const g of this.guards) {
      if (g.state === 'ko') continue;
      const d = Math.hypot(g.x - x, g.z - z);
      if (d <= bestD) {
        bestD = d;
        best = g;
      }
    }
    return best;
  }

  private orderDropBodyAt(hero: HeroEntity, rawX: number, rawZ: number): void {
    if (!hero.carryingGuardId) return;
    let tx = THREE.MathUtils.clamp(rawX, -21, 21);
    let tz = THREE.MathUtils.clamp(rawZ, -21, 21);

    // Snap cleanly to cover zone center if clicked near a cover zone
    const nearCover = this.currentStage.coverZones.find(
      (cz) => Math.hypot(tx - cz.x, tz - cz.z) <= cz.radius + 0.9,
    );
    if (nearCover && this.navGrid.isWalkableWorld(nearCover.x, nearCover.z)) {
      tx = nearCover.x;
      tz = nearCover.z;
    }

    const path = this.navGrid.findPath({ x: hero.x, z: hero.z }, { x: tx, z: tz });
    if (path.length === 0 && Math.hypot(tx - hero.x, tz - hero.z) > 1.8) {
      this.setHint('لا يمكن الوصول لهذا الموضع — اختر مكاناً مفتوحاً أو ساتراً');
      this.emitHud();
      return;
    }

    this.targetingMode = 'none';
    hero.running = false;
    hero.pendingInteract = { type: 'drop', x: tx, z: tz };
    hero.path = path;
    this.showMoveMarker(tx, tz, 0x34d399);
    this.sound.playMoveConfirm();
    this.setHint(
      nearCover
        ? `جارٍ نقل الجثة لإخفائها داخل ${nearCover.label}...`
        : 'جارٍ نقل الجثة لإلقائها في الموضع المحدد...',
    );
    this.emitHud();
  }

  private executeHamdanLunge(hero: HeroEntity, guardId: string): void {
    const g = this.guards.find((x) => x.id === guardId && x.state !== 'ko');
    if (!g) return;
    if (hero.carryingGuardId) {
      this.setHint('ألْقِ الجثة أولاً [E] قبل الاندفاع!');
      this.emitHud();
      return;
    }
    const dist = Math.hypot(g.x - hero.x, g.z - hero.z);
    if (dist > 6.5) {
      this.setHint('الحارس بعيد جداً عن مدى الاندفاع (6.5 أمتار)');
      this.emitHud();
      return;
    }
    this.targetingMode = 'none';
    hero.secondaryCooldown = hero.secondaryMaxCooldown;
    hero.crouching = false;
    hero.running = true;
    hero.pendingInteract = { type: 'lunge', guardId: g.id };
    hero.path = this.navGrid.findPath({ x: hero.x, z: hero.z }, { x: g.x, z: g.z });
    this.showMoveMarker(g.x, g.z, 0xf97316);
    this.sound.playMoveConfirm();
    this.setHint('اندفاع الشومة نحو الحارس!');
    this.emitHud();
  }

  private executeSecondarySkillAt(hero: HeroEntity, tx: number, tz: number): void {
    const clX = THREE.MathUtils.clamp(tx, -21, 21);
    const clZ = THREE.MathUtils.clamp(tz, -21, 21);
    const dist = Math.hypot(clX - hero.x, clZ - hero.z);

    if (hero.id === 'salem') {
      if (dist > 9.0) {
        this.setHint('الهدف بعيد — انقر ضمن 9 أمتار لإلقاء قنبلة الغبار');
        this.emitHud();
        return;
      }
      this.targetingMode = 'none';
      hero.secondaryCooldown = hero.secondaryMaxCooldown;
      hero.actionTimer = 0.42;
      hero.yaw = Math.atan2(clX - hero.x, clZ - hero.z);
      this.spawnSmokeCloud(clX, clZ, 3.5, 5.5);
      this.sound.playDustBomb();
      this.setHint('نشر سالم سحابة غبار تحجب رؤية الحراس لمدة 5.5 ث!');
      this.emitHud();
      return;
    }

    if (hero.id === 'bakri') {
      this.targetingMode = 'none';
      hero.secondaryCooldown = hero.secondaryMaxCooldown;
      hero.actionTimer = 0.25;
      hero.yaw = Math.atan2(clX - hero.x, clZ - hero.z);
      this.runCommandosSightCheck(clX, clZ);
    }
  }

  private spawnSmokeCloud(x: number, z: number, radius: number, duration: number): void {
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    const ringGeo = new THREE.RingGeometry(radius - 0.18, radius, 32);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xe7d3b0,
      transparent: true,
      opacity: 0.65,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.y = 0.05;
    ring.renderOrder = 3;
    group.add(ring);

    const puffMats: THREE.MeshBasicMaterial[] = [];
    const puffGeo = new THREE.DodecahedronGeometry(0.95, 1);
    for (let i = 0; i < 9; i++) {
      const ang = (i / 9) * Math.PI * 2;
      const rad = i === 0 ? 0 : radius * (0.38 + (i % 2) * 0.24);
      const pMat = new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? 0xd8c39e : 0xc4aa82,
        transparent: true,
        opacity: 0.56,
        depthWrite: false,
      });
      const puff = new THREE.Mesh(puffGeo, pMat);
      puff.position.set(
        Math.cos(ang) * rad,
        0.55 + (i % 3) * 0.28,
        Math.sin(ang) * rad,
      );
      puff.scale.set(1.15, 0.75, 1.15);
      puffMats.push(pMat);
      group.add(puff);
    }

    this.sceneRig.scene.add(group);
    this.smokeClouds.push({
      group,
      ringMat,
      puffMats,
      x,
      z,
      radius,
      remaining: duration,
      maxDuration: duration,
    });
  }

  private runCommandosSightCheck(x: number, z: number): void {
    const activeSmoke = this.smokeClouds.map((s) => ({ x: s.x, z: s.z, radius: s.radius }));
    const watchers = this.guards.filter((g) =>
      g.isPointSeenByGuard(x, z, this.currentStage.obstacles, activeSmoke),
    );
    const safe = watchers.length === 0;

    const group = new THREE.Group();
    const geometries: THREE.BufferGeometry[] = [];
    const materials: THREE.Material[] = [];

    const ringGeo = new THREE.RingGeometry(0.45, 0.72, 28);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: safe ? 0x34d399 : 0xef4444,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.set(x, 0.08, z);
    ring.renderOrder = 5;
    group.add(ring);
    geometries.push(ringGeo);
    materials.push(ringMat);

    for (const w of watchers) {
      const lGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(w.x, 1.3, w.z),
        new THREE.Vector3(x, 0.2, z),
      ]);
      const lMat = new THREE.LineBasicMaterial({
        color: 0xef4444,
        transparent: true,
        opacity: 0.85,
      });
      const line = new THREE.Line(lGeo, lMat);
      group.add(line);
      geometries.push(lGeo);
      materials.push(lMat);
    }

    this.sceneRig.scene.add(group);
    this.sightChecks.push({
      group,
      geometries,
      materials,
      remaining: 3.4,
      maxDuration: 3.4,
    });

    this.sound.playSightCheck(safe);
    this.setHint(
      safe
        ? 'فحص الرؤية: النقطة آمنة تماماً — لا يرصدها أي حارس'
        : `تحذير الرؤية: هذه النقطة مكشوفة لعدد ${watchers.length} حارس!`,
    );
    this.emitHud();
  }

  private executeTargetedSkill(hero: HeroEntity, tx: number, tz: number): void {
    const dist = Math.hypot(tx - hero.x, tz - hero.z);
    if (hero.id === 'salem') {
      if (dist > 13.5) {
        this.setHint('الهدف بعيد جداً — اقترب لرمي الحصاة (المدى 13.5 م)');
        this.emitHud();
        return;
      }
      this.targetingMode = 'none';
      hero.skillCooldown = hero.skillMaxCooldown;
      hero.actionTimer = 0.4;
      hero.yaw = Math.atan2(tx - hero.x, tz - hero.z);
      this.thrownPebble.active = true;
      this.thrownPebble.t = 0;
      this.thrownPebble.startX = hero.x;
      this.thrownPebble.startZ = hero.z;
      this.thrownPebble.endX = tx;
      this.thrownPebble.endZ = tz;
      this.thrownPebble.mesh.visible = true;
      this.setHint('رمى سالم الحصاة لتشتيت انتباه الحراس!');
      this.emitHud();
    } else if (hero.id === 'hamdan') {
      if (dist > 11) {
        this.setHint('انقر ضمن 11 متراً حول حمدان لتوجيه صوت الصفارة');
        this.emitHud();
        return;
      }
      this.targetingMode = 'none';
      hero.skillCooldown = hero.skillMaxCooldown;
      hero.actionTimer = 0.45;
      this.sound.playWhistle();
      this.emitNoise(tx, tz, 11.5, 0x38bdf8, false);
      this.setHint('أطلق حمدان صفارة التشتيت!');
      this.emitHud();
    }
  }

  private showMoveMarker(x: number, z: number, colorHex: number): void {
    this.moveMarker.position.set(x, 0.05, z);
    (this.moveMarker.material as THREE.MeshBasicMaterial).color.setHex(colorHex);
    this.moveMarkerAge = 0;
  }

  private onKeyDown = (e: KeyboardEvent) => {
    this.keysHeld.add(e.code);

    if (e.code === 'Escape') {
      if (this.targetingMode !== 'none') {
        this.targetingMode = 'none';
        this.emitHud();
      } else if (this.phase === 'playing' || this.phase === 'paused') {
        this.togglePause();
      }
      return;
    }

    if (e.code === 'F5' && this.phase === 'playing') {
      e.preventDefault();
      this.quickSave();
      return;
    }
    if (e.code === 'F9' && (this.phase === 'playing' || this.phase === 'paused')) {
      e.preventDefault();
      this.quickLoad();
      return;
    }

    if (this.phase !== 'playing') return;

    if (e.code === 'Digit1') this.selectHero('hamdan');
    else if (e.code === 'Digit2') this.selectHero('salem');
    else if (e.code === 'Digit3') this.selectHero('bakri');
    else if (e.code === 'KeyC') this.toggleCrouch();
    else if (e.code === 'KeyF') this.activateWeaponTool();
    else if (e.code === 'KeyQ') this.activateSkill();
    else if (e.code === 'KeyR') this.activateSecondarySkill();
    else if (e.code === 'KeyE') this.interactNearest();
    else if (e.code === 'KeyG') this.rallySquad();
    else if (e.code === 'KeyV') this.cycleCameraView();
    else if (e.code === 'Space') {
      e.preventDefault();
      const h = this.getSelectedHero();
      if (h) {
        this.camCtrl.focusOn(h.x, h.z, false, true);
        this.setHint(`الكاميرا تتبع ${h.nameAr}`);
        this.emitHud();
      }
    }
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.keysHeld.delete(e.code);
  };

  private handleResize(): void {
    if (this.disposed) return;
    const w = Math.max(1, this.container.clientWidth);
    const h = Math.max(1, this.container.clientHeight);
    this.sceneRig.resize(w, h);
    this.camCtrl.setAspect(w / h);
  }

  // =========================================================================
  // Main 60fps Loop
  // =========================================================================

  private startLoop(): void {
    const tick = () => {
      if (this.disposed) return;
      const now = performance.now();
      const rawDt = (now - this.lastTimestamp) / 1000;
      this.lastTimestamp = now;
      const dt = Math.min(Math.max(rawDt, 0.001), 0.05);

      this.step(dt);
      this.sceneRig.renderer.render(this.sceneRig.scene, this.camCtrl.camera);

      if (this.sceneRig.isSoftwareGl) {
        this.afterDraw(tick);
      } else {
        this.frameId = requestAnimationFrame(tick);
      }
    };

    if (this.sceneRig.isSoftwareGl) {
      this.afterDraw(tick);
    } else {
      this.frameId = requestAnimationFrame(tick);
    }
  }

  private afterDraw(cb: () => void): void {
    const gl = this.sceneRig.renderer.getContext() as WebGL2RenderingContext;
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (this.disposed) return;
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 80);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  private step(dt: number): void {
    this.elapsedClock += dt;

    // Gentle beacon animation on primary objective
    if (this.stageObjects.primaryBeaconMesh.visible) {
      this.stageObjects.primaryBeaconMesh.rotation.y += dt * 1.8;
      this.stageObjects.primaryBeaconMesh.position.y =
        2.75 + Math.sin(this.elapsedClock * 3.0) * 0.16;
    }

    if (this.phase === 'title') {
      this.camCtrl.updateTitleOrbit(dt);
      for (const g of this.guards) {
        g.update(dt, [], this.currentStage.obstacles, this.navGrid, {
          onSuspicious: () => {},
          onAlerted: () => {},
          onFireAtHero: () => {},
        });
      }
      return;
    }

    if (this.phase !== 'playing') {
      this.camCtrl.update(dt);
      return;
    }

    const rightAxis =
      (this.keysHeld.has('KeyD') || this.keysHeld.has('ArrowRight') ? 1 : 0) -
      (this.keysHeld.has('KeyA') || this.keysHeld.has('ArrowLeft') ? 1 : 0);
    const forwardAxis =
      (this.keysHeld.has('KeyW') || this.keysHeld.has('ArrowUp') ? 1 : 0) -
      (this.keysHeld.has('KeyS') || this.keysHeld.has('ArrowDown') ? 1 : 0);
    this.camCtrl.panByAxes(rightAxis, forwardAxis, dt);

    if (this.keysHeld.has('KeyZ') || this.keysHeld.has('BracketLeft')) {
      this.camCtrl.rotateYaw(-1.6 * dt);
    }
    if (this.keysHeld.has('KeyX') || this.keysHeld.has('BracketRight')) {
      this.camCtrl.rotateYaw(1.6 * dt);
    }

    this.updateHeroes(dt);

    const activeForCam = this.getSelectedHero();
    if (activeForCam && activeForCam.alive) {
      this.camCtrl.followWorld(activeForCam.x, activeForCam.z);
    }

    this.camCtrl.update(dt);

    if (this.hitstopTimer > 0) {
      this.hitstopTimer -= dt;
      return;
    }

    if (this.contextHintTimer > 0) this.contextHintTimer -= dt;

    if (this.scoutSurveyRemaining > 0) {
      this.scoutSurveyRemaining = Math.max(0, this.scoutSurveyRemaining - dt);
      if (this.scoutSurveyRemaining === 0) {
        this.stageObjects.patrolLinesGroup.visible = false;
        this.camCtrl.setScoutZoom(false);
      }
    }

    this.updateVip(dt);

    const activeSmokeCircles = this.smokeClouds.map((s) => ({
      x: s.x,
      z: s.z,
      radius: s.radius,
    }));

    const heroTargets = this.heroes.map((h) => ({
      id: h.id,
      x: h.x,
      z: h.z,
      crouching: h.crouching,
      hiddenInCover: h.hiddenInCover,
      alive: h.alive,
    }));

    const koBodies = this.guards.filter((g) => g.state === 'ko' && g.carriedByHeroId === null);

    let activeAlerts = 0;
    for (const g of this.guards) {
      g.update(
        dt,
        heroTargets,
        this.currentStage.obstacles,
        this.navGrid,
        {
          onSuspicious: () => this.sound.playSuspicious(),
          onAlerted: (_gid, hx, hz) => {
            this.mission.alertsTriggered++;
            this.sound.playAlert();
            this.camCtrl.addShake(0.16);
            this.emitNoise(hx, hz, this.mission.secondaryDone ? 6.5 : 10.5, 0xef4444, true);
            this.setHint('تنبيه! رصدك أحد الحراس — احتمِ خلف الجدران أو عطّله!');
          },
          onBodyDiscovered: () => {
            this.sound.playSuspicious();
            this.setHint('انتبه! حارس رأى جثة زميله وبدأ التفتيش — اخفِ الجثث!');
          },
          onFireAtHero: (heroId, gx, gz, hx, hz) => {
            this.sound.playShot();
            this.camCtrl.addShake(0.2);
            this.spawnTracer(gx, gz, hx, hz);
            this.spawnDust(gx, gz, 0xfbbf24, 5);
            this.spawnDust(hx, hz, 0xef4444, 6);
            const victim = this.heroes.find((x) => x.id === heroId);
            if (victim && victim.alive) {
              victim.hp = Math.max(0, victim.hp - 1);
              if (victim.hp === 0) {
                victim.alive = false;
                victim.path = [];
                if (victim.carryingGuardId) {
                  this.dropCarriedBody(victim, true);
                }
                this.setHint(`أُصيب ${victim.nameAr} وسقط في الميدان!`);
                const nextAlive = this.heroes.find((x) => x.alive);
                if (nextAlive && this.selectedHeroId === victim.id) {
                  this.selectedHeroId = nextAlive.id;
                  this.camCtrl.focusOn(nextAlive.x, nextAlive.z, false, true);
                }
                this.updateSelectionRings();
              }
            }
          },
        },
        koBodies,
        this.currentStage.coverZones,
        activeSmokeCircles,
      );
      if (g.state === 'alert') activeAlerts++;
    }

    this.updateEffects(dt);

    const aliveCount = this.heroes.filter((h) => h.alive).length;
    const outcome = this.mission.update(
      dt,
      activeAlerts,
      aliveCount,
      this.vipPos,
      this.heroes.map((h) => ({ x: h.x, z: h.z, alive: h.alive })),
    );

    if (outcome === 'victory') {
      this.phase = 'victory';
      this.campaignProgress = saveStageCompletion(
        this.currentStage.id,
        Math.floor(this.mission.elapsedSeconds),
        this.mission.alertsTriggered,
      );
      this.sound.playObjective();
      this.emitHud();
      return;
    }
    if (outcome === 'defeat') {
      this.phase = 'defeat';
      this.sound.playDefeat();
      this.emitHud();
      return;
    }

    this.hudEmitAccum += dt;
    if (this.hudEmitAccum >= 0.066) {
      this.hudEmitAccum = 0;
      this.emitHud();
    }
  }

  private updateHeroes(dt: number): void {
    const activeHero = this.getSelectedHero();

    for (const h of this.heroes) {
      if (!h.alive) {
        animateCharacterRig(h.rig, 'ko', h.animPhase, dt);
        continue;
      }

      h.skillCooldown = Math.max(0, h.skillCooldown - dt);
      h.secondaryCooldown = Math.max(0, h.secondaryCooldown - dt);
      h.actionTimer = Math.max(0, h.actionTimer - dt);

      const inSmoke = this.smokeClouds.some(
        (sc) => Math.hypot(h.x - sc.x, h.z - sc.z) <= sc.radius,
      );
      h.hiddenInCover =
        inSmoke ||
        (h.crouching &&
          this.currentStage.coverZones.some((cz) => Math.hypot(h.x - cz.x, h.z - cz.z) <= cz.radius));

      if (h.pendingInteract) {
        if (h.pendingInteract.type === 'knockout' || h.pendingInteract.type === 'lunge') {
          const isLunge = h.pendingInteract.type === 'lunge';
          const targetGuardId = h.pendingInteract.guardId;
          const g = this.guards.find((x) => x.id === targetGuardId);
          if (!g || g.state === 'ko') {
            h.pendingInteract = null;
          } else {
            const reach = isLunge ? 2.45 : h.id === 'hamdan' ? 2.25 : 1.9;
            if (Math.hypot(g.x - h.x, g.z - h.z) <= reach) {
              h.path = [];
              h.pendingInteract = null;
              this.tryKnockout(h, g, isLunge);
            }
          }
        } else if (h.pendingInteract.type === 'pickup') {
          const targetGuardId = h.pendingInteract.guardId;
          const g = this.guards.find((x) => x.id === targetGuardId);
          if (!g || g.state !== 'ko' || g.carriedByHeroId !== null || h.carryingGuardId) {
            h.pendingInteract = null;
          } else if (Math.hypot(g.x - h.x, g.z - h.z) <= 2.15) {
            h.path = [];
            h.pendingInteract = null;
            this.pickupGuard(h, g);
          }
        } else if (h.pendingInteract.type === 'drop') {
          const dropTarget = h.pendingInteract;
          if (!h.carryingGuardId) {
            h.pendingInteract = null;
          } else if (Math.hypot(dropTarget.x - h.x, dropTarget.z - h.z) <= 1.25 || h.path.length === 0) {
            h.path = [];
            h.pendingInteract = null;
            this.dropCarriedBody(h, false, { x: dropTarget.x, z: dropTarget.z });
          }
        } else if (h.pendingInteract.type === 'primary') {
          const pt = this.currentStage.primaryTargetPos;
          if (Math.hypot(pt.x - h.x, pt.z - h.z) <= (h.id === 'bakri' ? 2.8 : 2.2)) {
            h.path = [];
            h.pendingInteract = null;
            this.completePrimaryObjective(h);
          }
        } else if (h.pendingInteract.type === 'secondary') {
          const st = this.currentStage.secondaryTargetPos;
          if (Math.hypot(st.x - h.x, st.z - h.z) <= (h.id === 'bakri' ? 2.8 : 2.2)) {
            h.path = [];
            h.pendingInteract = null;
            this.disableAlarm(h);
          }
        }
      }

      if (h.carryingGuardId) {
        h.running = false;
      }

      let moving = false;
      if (h.path.length > 0) {
        const target = h.path[0];
        const dx = target.x - h.x;
        const dz = target.z - h.z;
        const dist = Math.hypot(dx, dz);

        if (dist < 0.2) {
          h.path.shift();
        } else {
          moving = true;
          let baseSpeed = h.id === 'salem' ? 3.65 : h.id === 'bakri' ? 3.45 : 3.35;
          if (h.carryingGuardId) baseSpeed *= h.id === 'hamdan' ? 0.92 : 0.72;
          if (h.crouching) baseSpeed *= h.id === 'salem' ? 0.78 : 0.6;
          else if (h.running) {
            baseSpeed *= h.pendingInteract?.type === 'lunge' ? 1.85 : 1.48;
          }

          const step = Math.min(dist, baseSpeed * dt);
          const nx = dx / dist;
          const nz = dz / dist;
          h.x += nx * step;
          h.z += nz * step;
          h.yaw = dampAngle(h.yaw, Math.atan2(nx, nz), 12, dt);

          if (h.id === this.selectedHeroId) {
            this.sound.playFootstep(h.running);
          }
          if (h.running && h.pendingInteract?.type !== 'lunge' && Math.random() < dt * 2.4) {
            this.emitNoise(h.x, h.z, 4.4, 0xf97316, false);
          }
        }
      } else {
        h.running = false;
      }

      let pose: AnimPose = 'idle';
      if (h.actionTimer > 0) pose = 'action';
      else if (moving) pose = h.crouching ? 'sneak' : h.running ? 'run' : 'walk';
      else if (h.crouching) pose = 'crouch';

      h.animPhase += dt * (pose === 'run' ? 12 : pose === 'walk' ? 7.5 : pose === 'sneak' ? 5.8 : 2.0);
      h.rig.root.position.set(h.x, 0, h.z);
      h.rig.root.rotation.y = h.yaw;
      if (h.rig.selectionRing) h.rig.selectionRing.rotation.z += dt * 0.7;
      animateCharacterRig(h.rig, pose, h.animPhase, dt, h.actionTimer);

      if (h.carryingGuardId) {
        const carriedGuard = this.guards.find((g) => g.id === h.carryingGuardId);
        if (carriedGuard && carriedGuard.state === 'ko') {
          carriedGuard.syncCarriedPose(h.x, h.z, h.yaw, h.crouching, dt);
        } else {
          h.carryingGuardId = null;
        }
      }
    }

    if (activeHero && activeHero.alive && activeHero.path.length > 0) {
      const pts = [
        new THREE.Vector3(activeHero.x, 0.08, activeHero.z),
        ...activeHero.path.map((p) => new THREE.Vector3(p.x, 0.08, p.z)),
      ];
      this.pathLineGeo.setFromPoints(pts);
      this.pathLine.computeLineDistances();
      this.pathLine.visible = true;
    } else {
      this.pathLine.visible = false;
    }
  }

  private updateVip(dt: number): void {
    if (this.currentStage.primaryObjectiveType !== 'vip') return;

    if (!this.mission.primaryDone) {
      this.vipAnimPhase += dt * 1.5;
      animateCharacterRig(this.vipRig, 'crouch', this.vipAnimPhase, dt);
      return;
    }

    let leader = this.heroes.find((h) => h.id === this.vipLeaderId && h.alive);
    if (!leader) leader = this.heroes.find((h) => h.alive);
    if (!leader) return;

    const distToLeader = Math.hypot(leader.x - this.vipPos.x, leader.z - this.vipPos.z);
    let moving = false;

    if (distToLeader > 1.9) {
      if (this.vipPath.length === 0 || Math.random() < dt * 2.0) {
        this.vipPath = this.navGrid.findPath(this.vipPos, { x: leader.x, z: leader.z });
      }
      if (this.vipPath.length > 0) {
        const next = this.vipPath[0];
        const dx = next.x - this.vipPos.x;
        const dz = next.z - this.vipPos.z;
        const d = Math.hypot(dx, dz);
        if (d < 0.25) {
          this.vipPath.shift();
        } else {
          moving = true;
          const step = Math.min(d, 3.2 * dt);
          this.vipPos.x += (dx / d) * step;
          this.vipPos.z += (dz / d) * step;
          this.vipYaw = dampAngle(this.vipYaw, Math.atan2(dx, dz), 10, dt);
        }
      }
    }

    this.vipAnimPhase += dt * (moving ? 7 : 1.8);
    this.vipRig.root.position.set(this.vipPos.x, 0, this.vipPos.z);
    this.vipRig.root.rotation.y = this.vipYaw;
    animateCharacterRig(this.vipRig, moving ? 'walk' : 'idle', this.vipAnimPhase, dt);
  }

  private updateEffects(dt: number): void {
    if (this.moveMarkerAge < 0.65) {
      this.moveMarkerAge += dt;
      const t = this.moveMarkerAge / 0.65;
      this.moveMarker.scale.setScalar(1 + t * 0.7);
      (this.moveMarker.material as THREE.MeshBasicMaterial).opacity = (1 - t) * 0.85;
      this.moveMarker.visible = true;
    } else {
      this.moveMarker.visible = false;
    }

    this.stageObjects.extractionRing.rotation.z += dt * 0.5;

    if (this.thrownPebble.active) {
      this.thrownPebble.t += dt / this.thrownPebble.duration;
      if (this.thrownPebble.t >= 1) {
        this.thrownPebble.active = false;
        this.thrownPebble.mesh.visible = false;
        this.sound.playPebble();
        this.spawnDust(this.thrownPebble.endX, this.thrownPebble.endZ, 0xe7d3b0, 6);
        this.emitNoise(
          this.thrownPebble.endX,
          this.thrownPebble.endZ,
          this.thrownPebble.noiseRadius,
          0xfacc15,
          false,
        );
      } else {
        const p = this.thrownPebble.t;
        const px = THREE.MathUtils.lerp(this.thrownPebble.startX, this.thrownPebble.endX, p);
        const pz = THREE.MathUtils.lerp(this.thrownPebble.startZ, this.thrownPebble.endZ, p);
        const py = 1.1 * (1 - p) + Math.sin(p * Math.PI) * 2.4;
        this.thrownPebble.mesh.position.set(px, py, pz);
      }
    }

    for (let i = this.ripples.length - 1; i >= 0; i--) {
      const r = this.ripples[i];
      r.age += dt;
      if (r.age >= r.maxAge) {
        this.sceneRig.scene.remove(r.mesh);
        r.mesh.geometry.dispose();
        r.mat.dispose();
        this.ripples.splice(i, 1);
      } else {
        const t = r.age / r.maxAge;
        r.mesh.scale.setScalar(1 + t * r.maxRadius * 1.4);
        r.mat.opacity = (1 - t) * 0.72;
      }
    }

    for (let i = this.tracers.length - 1; i >= 0; i--) {
      const tr = this.tracers[i];
      tr.age += dt;
      if (tr.age >= tr.maxAge) {
        this.sceneRig.scene.remove(tr.line);
        tr.line.geometry.dispose();
        tr.mat.dispose();
        this.tracers.splice(i, 1);
      } else {
        tr.mat.opacity = 1 - tr.age / tr.maxAge;
      }
    }

    for (const p of this.dustPool) {
      if (!p.active) continue;
      p.age += dt;
      if (p.age >= p.maxAge) {
        p.active = false;
        p.mesh.visible = false;
      } else {
        p.vy -= 5.5 * dt;
        p.mesh.position.x += p.vx * dt;
        p.mesh.position.y = Math.max(0.05, p.mesh.position.y + p.vy * dt);
        p.mesh.position.z += p.vz * dt;
        (p.mesh.material as THREE.MeshBasicMaterial).opacity = (1 - p.age / p.maxAge) * 0.8;
      }
    }

    // Highlight cover zones when selected hero is carrying a body or picking a drop spot
    const activeHero = this.getSelectedHero();
    const highlightCover = Boolean(
      activeHero && activeHero.alive && (activeHero.carryingGuardId || this.targetingMode === 'drop_body'),
    );
    for (const pad of this.stageObjects.coverZonePads) {
      const mat = pad.material as THREE.MeshBasicMaterial;
      mat.color.setHex(highlightCover ? 0x34d399 : 0x3f6b36);
      mat.opacity = highlightCover ? 0.45 : 0.2;
    }

    for (let i = this.smokeClouds.length - 1; i >= 0; i--) {
      const sc = this.smokeClouds[i];
      sc.remaining -= dt;
      if (sc.remaining <= 0) {
        this.sceneRig.scene.remove(sc.group);
        sc.group.traverse((obj) => {
          if (obj instanceof THREE.Mesh) obj.geometry.dispose();
        });
        sc.ringMat.dispose();
        sc.puffMats.forEach((m) => m.dispose());
        this.smokeClouds.splice(i, 1);
      } else {
        const fade = Math.min(1, sc.remaining / 1.2);
        sc.group.rotation.y += dt * 0.35;
        sc.ringMat.opacity = 0.65 * fade;
        sc.puffMats.forEach((m) => {
          m.opacity = 0.56 * fade;
        });
      }
    }

    for (let i = this.sightChecks.length - 1; i >= 0; i--) {
      const s = this.sightChecks[i];
      s.remaining -= dt;
      if (s.remaining <= 0) {
        this.sceneRig.scene.remove(s.group);
        s.geometries.forEach((g) => g.dispose());
        s.materials.forEach((m) => m.dispose());
        this.sightChecks.splice(i, 1);
      } else {
        const fade = Math.min(1, s.remaining / 0.9);
        s.materials.forEach((m) => {
          if ('opacity' in m) {
            (m as THREE.MeshBasicMaterial).opacity = 0.88 * fade;
          }
        });
      }
    }
  }

  private buildHeroTools(hero: HeroEntity, carryingBody: boolean, nearbyBodyPickup: boolean): HeroToolInfo[] {
    const isSelected = hero.id === this.selectedHeroId;
    const carryTool: HeroToolInfo = {
      id: 'carry',
      nameAr: carryingBody ? 'إلقاء الجثة' : 'حمل الجثة',
      descAr: carryingBody
        ? 'إلقاء الجثة في مكانك الحالي أو تحديد نقطة لإخفائها'
        : 'حمل جثة حارس معطل وإخفاؤها خلف ساتر',
      shortcut: 'E',
      cooldown: 0,
      maxCooldown: 0,
      active: isSelected && this.targetingMode === 'drop_body',
      badgeAr: carryingBody ? 'محمولة' : nearbyBodyPickup ? 'قريب' : undefined,
    };

    if (hero.id === 'hamdan') {
      return [
        {
          id: 'shouma',
          nameAr: 'الشومة',
          descAr: 'ضربة صامتة قاضية حتى ضد الحراس المتأهبين',
          shortcut: 'F',
          cooldown: 0,
          maxCooldown: 0,
          active: isSelected && this.targetingMode === 'weapon',
          disabled: carryingBody,
        },
        {
          id: 'whistle',
          nameAr: 'صفارة التشتيت',
          descAr: 'استدراج الحراس بصوت الصفارة لنقطة محددة',
          shortcut: 'Q',
          cooldown: Math.ceil(hero.skillCooldown),
          maxCooldown: hero.skillMaxCooldown,
          active: isSelected && this.targetingMode === 'skill',
        },
        {
          id: 'lunge',
          nameAr: 'اندفاع الشومة',
          descAr: 'اندفاع سريع نحو حارس خلال 6م وتحييده فوراً',
          shortcut: 'R',
          cooldown: Math.ceil(hero.secondaryCooldown),
          maxCooldown: hero.secondaryMaxCooldown,
          active: isSelected && this.targetingMode === 'secondary',
          disabled: carryingBody,
        },
        carryTool,
      ];
    }

    if (hero.id === 'salem') {
      return [
        {
          id: 'sickle',
          nameAr: 'المنجل',
          descAr: 'تحييد سريع وصامت من الخلف دون إثارة ضوضاء',
          shortcut: 'F',
          cooldown: 0,
          maxCooldown: 0,
          active: isSelected && this.targetingMode === 'weapon',
          disabled: carryingBody,
        },
        {
          id: 'pebble',
          nameAr: 'رمي الحصى',
          descAr: 'رمي حصاة بدقة لتشتيت الحراس دون كشف موقعك',
          shortcut: 'Q',
          cooldown: Math.ceil(hero.skillCooldown),
          maxCooldown: hero.skillMaxCooldown,
          active: isSelected && this.targetingMode === 'skill',
        },
        {
          id: 'dust_bomb',
          nameAr: 'قنبلة غبار',
          descAr: 'تنشر سحابة غبار تحجب رؤية الحراس لمدة 5.5 ث',
          shortcut: 'R',
          cooldown: Math.ceil(hero.secondaryCooldown),
          maxCooldown: hero.secondaryMaxCooldown,
          active: isSelected && this.targetingMode === 'secondary',
        },
        carryTool,
      ];
    }

    return [
      {
        id: 'sabotage',
        nameAr: 'عدّة الميدان',
        descAr: 'تعطيل الأجراس والأهداف من مدى أوسع + تحييد من الخلف',
        shortcut: 'F',
        cooldown: 0,
        maxCooldown: 0,
        active: isSelected && this.targetingMode === 'weapon',
        disabled: carryingBody,
      },
      {
        id: 'binoculars',
        nameAr: 'ناظور الاستطلاع',
        descAr: 'كشف مسارات جميع الدوريات وتوسيع مجال الرؤية',
        shortcut: 'Q',
        cooldown: Math.ceil(hero.skillCooldown),
        maxCooldown: hero.skillMaxCooldown,
        active: this.scoutSurveyRemaining > 0,
      },
      {
        id: 'sight_check',
        nameAr: 'فحص الرؤية',
        descAr: 'انقر على أي نقطة لمعرفة إن كانت مكشوفة للحراس',
        shortcut: 'R',
        cooldown: Math.ceil(hero.secondaryCooldown),
        maxCooldown: hero.secondaryMaxCooldown,
        active: isSelected && this.targetingMode === 'secondary',
      },
      carryTool,
    ];
  }

  private emitHud(): void {
    const w = Math.max(1, this.container.clientWidth);
    const h = Math.max(1, this.container.clientHeight);

    const heroesInfo: HeroHudInfo[] = this.heroes.map((hero) => {
      const carryingBody = hero.carryingGuardId !== null;
      const nearbyBodyPickup =
        hero.alive &&
        !carryingBody &&
        this.guards.some(
          (g) =>
            g.state === 'ko' &&
            g.carriedByHeroId === null &&
            Math.hypot(g.x - hero.x, g.z - hero.z) < 2.45,
        );
      return {
        id: hero.id,
        nameAr: hero.nameAr,
        roleAr: hero.roleAr,
        hp: hero.hp,
        maxHp: hero.maxHp,
        crouching: hero.crouching,
        hiddenInCover: hero.hiddenInCover,
        carryingBody,
        nearbyBodyPickup,
        skillNameAr: hero.skillNameAr,
        skillDescAr: hero.skillDescAr,
        skillCooldown: Math.ceil(hero.skillCooldown),
        skillMaxCooldown: hero.skillMaxCooldown,
        secondarySkillNameAr:
          hero.id === 'hamdan' ? 'اندفاع الشومة' : hero.id === 'salem' ? 'قنبلة غبار' : 'فحص الرؤية',
        secondarySkillDescAr:
          hero.id === 'hamdan'
            ? 'اندفاع وتحييد فوري بالشومة'
            : hero.id === 'salem'
              ? 'سحابة غبار تحجب رؤية الحراس'
              : 'كشف أمان أي نقطة ضد رؤية الحراس',
        secondaryCooldown: Math.ceil(hero.secondaryCooldown),
        secondaryMaxCooldown: hero.secondaryMaxCooldown,
        tools: this.buildHeroTools(hero, carryingBody, nearbyBodyPickup),
        alive: hero.alive,
        actionLabel: carryingBody
          ? 'يحمل جثة'
          : hero.path.length > 0
            ? hero.running
              ? 'ركض'
              : 'تحرك'
            : hero.crouching
              ? 'تخفٍّ'
              : 'جاهز',
      };
    });

    const guardIndicators: GuardScreenIndicator[] = this.guards.map((g) => {
      if (g.state === 'ko' || (g.state === 'patrol' && g.suspicion < 0.08)) {
        return { id: g.id, screenX: 0, screenY: 0, visible: false, state: g.state, suspicion: g.suspicion };
      }
      _projVec.set(g.x, 2.35, g.z);
      _projVec.project(this.camCtrl.camera);
      return {
        id: g.id,
        screenX: ((_projVec.x + 1) * 0.5) * w,
        screenY: ((-_projVec.y + 1) * 0.5) * h,
        visible: _projVec.z < 1 && _projVec.z > -1,
        state: g.state,
        suspicion: g.suspicion,
      };
    });

    const minimapEntities: MinimapEntity[] = [
      {
        x: this.currentStage.extractionZone.x,
        z: this.currentStage.extractionZone.z,
        kind: 'extract',
      },
      ...this.guards
        .filter((g) => g.carriedByHeroId === null)
        .map((g) => ({
          x: g.x,
          z: g.z,
          kind: (g.state === 'ko'
            ? 'guardKo'
            : g.state === 'alert'
              ? 'guardAlert'
              : 'guard') as MinimapEntity['kind'],
        })),
      ...this.heroes
        .filter((x) => x.alive)
        .map((x) => ({
          x: x.x,
          z: x.z,
          kind: (x.id === this.selectedHeroId ? 'selectedHero' : 'hero') as MinimapEntity['kind'],
        })),
    ];

    if (!this.mission.primaryDone) {
      minimapEntities.push({
        x: this.currentStage.primaryTargetPos.x,
        z: this.currentStage.primaryTargetPos.z,
        kind: 'objective',
      });
    }
    if (!this.mission.secondaryDone) {
      minimapEntities.push({
        x: this.currentStage.secondaryTargetPos.x,
        z: this.currentStage.secondaryTargetPos.z,
        kind: 'secondary',
      });
    }

    const koGuards = this.guards.filter((g) => g.state === 'ko').length;
    const activeGuards = this.guards.length - koGuards;

    this.onHudUpdate({
      phase: this.phase,
      stageId: this.currentStage.id,
      stageNameAr: this.currentStage.nameAr,
      selectedHeroId: this.selectedHeroId,
      skillTargeting: this.targetingMode !== 'none',
      targetingMode: this.targetingMode,
      scoutSurveyActive: this.scoutSurveyRemaining > 0,
      scoutSurveyRemaining: Math.ceil(this.scoutSurveyRemaining),
      cameraFollowHero: this.camCtrl.isFollowingHero(),
      cameraYawDeg: this.camCtrl.getYawDeg(),
      cameraViewPreset: this.camCtrl.getViewPreset(),
      heroes: heroesInfo,
      objectives: this.mission.getHudInfo(activeGuards, koGuards, this.guards.length),
      guardIndicators,
      minimapEntities,
      minimapObstacles: this.currentStage.obstacles.map((o) => ({
        x: o.x,
        z: o.z,
        w: o.w,
        d: o.d,
        kind: o.kind,
      })),
      elapsedSeconds: Math.floor(this.mission.elapsedSeconds),
      alertsTriggered: this.mission.alertsTriggered,
      contextHintAr: this.contextHintTimer > 0 ? this.contextHintAr : '',
      defeatReasonAr: this.mission.defeatReasonAr,
      muted: this.sound.isMuted(),
      quality: this.quality,
      hasQuickSave: readQuickSave() !== null,
      campaignProgress: this.campaignProgress,
    });
  }

  public dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);
    this.resizeObserver.disconnect();

    const canvas = this.sceneRig.renderer.domElement;
    canvas.removeEventListener('pointerdown', this.onPointerDown);
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
    canvas.removeEventListener('wheel', this.onWheel);
    canvas.removeEventListener('contextmenu', this.onContextMenu);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.onWindowBlur);

    this.clearTransientEffects();
    this.clearStageActors();
    this.vipRig.dispose();
    this.stageObjects.dispose();
    this.textures.dispose();
    this.sceneRig.dispose();
  }
}
