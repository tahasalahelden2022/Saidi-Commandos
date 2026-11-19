import type { HeroSpawnSpec, HouseSpec, ObstacleBox, StageConfig, StageId } from '../types/game';

function makeHeroSpawns(zBase: number): HeroSpawnSpec[] {
  return [
    {
      id: 'hamdan',
      nameAr: 'حمدان',
      roleAr: 'القائد',
      x: 0,
      z: zBase,
      skillNameAr: 'صفارة التشتيت',
      skillDescAr: 'يطلق صفارة تجذب الحراس نحو نقطة مختارة',
      skillCooldown: 9,
    },
    {
      id: 'salem',
      nameAr: 'سالم',
      roleAr: 'المتسلل',
      x: -2.4,
      z: zBase + 1.0,
      skillNameAr: 'رمي الحصى',
      skillDescAr: 'يرمي حصاة لتشتيت الحراس بدقة دون كشف موقعه',
      skillCooldown: 6,
    },
    {
      id: 'bakri',
      nameAr: 'بكري',
      roleAr: 'الكشاف',
      x: 2.4,
      z: zBase + 1.0,
      skillNameAr: 'استطلاع المسارات',
      skillDescAr: 'يكشف مسارات الدوريات ومجال الرؤية لمدة 9 ثوانٍ',
      skillCooldown: 12,
    },
  ];
}

function housesToObstacles(houses: HouseSpec[]): ObstacleBox[] {
  return houses.map((h) => ({
    id: h.id,
    x: h.x,
    z: h.z,
    w: h.w,
    d: h.d,
    h: h.h,
    blocksMovement: true,
    blocksStandingSight: true,
    blocksCrouchSight: true,
    kind: h.isDepot ? 'depot' : 'house',
  }));
}

// ============================================================================
// STAGE 1: القرية (قرية الكرم)
// ============================================================================
const VILLAGE_HOUSES: HouseSpec[] = [
  { id: 'house_sw1', x: -13.2, z: 12.5, w: 6.2, d: 5.0, h: 3.4, hasDome: false, doorSide: 'east' },
  { id: 'house_se1', x: 13.2, z: 12.5, w: 6.2, d: 5.0, h: 3.4, hasDome: true, doorSide: 'west' },
  { id: 'house_w_mid', x: -14.8, z: 1.5, w: 5.4, d: 6.4, h: 3.6, hasDome: true, doorSide: 'east' },
  { id: 'house_e_store', x: 16.2, z: -8.5, w: 4.8, d: 5.2, h: 3.3, hasDome: false, doorSide: 'west' },
  { id: 'house_north_hall', x: 0, z: -16.8, w: 9.0, d: 4.8, h: 4.1, hasDome: true, doorSide: 'south' },
];

const STAGE_VILLAGE: StageConfig = {
  id: 'village',
  order: 1,
  nameAr: '١. قرية الكرم',
  subtitleAr: 'أزقة طينية وبيوت متلاصقة — حرر الشيخ منصور',
  theme: 'village',
  skyColor: 0xe3cfa9,
  groundColor: 0xd4b483,
  primaryObjectiveType: 'vip',
  primaryObjectiveLabelAr: 'حرر الشيخ منصور من الساحة الشمالية',
  secondaryObjectiveLabelAr: 'فرعي: عطّل جرس برج المراقبة',
  extractLabelAr: 'الإخلاء عند البوابة الجنوبية',
  heroSpawns: makeHeroSpawns(17.4),
  houses: VILLAGE_HOUSES,
  obstacles: [
    ...housesToObstacles(VILLAGE_HOUSES),
    { id: 'gate_pillar_w', x: -5.4, z: 19.6, w: 2.2, d: 1.4, h: 2.8, blocksMovement: true, blocksStandingSight: true, blocksCrouchSight: true, kind: 'wall' },
    { id: 'gate_pillar_e', x: 5.4, z: 19.6, w: 2.2, d: 1.4, h: 2.8, blocksMovement: true, blocksStandingSight: true, blocksCrouchSight: true, kind: 'wall' },
    { id: 'low_wall_sw', x: -5.6, z: 11.4, w: 4.2, d: 0.75, h: 1.05, blocksMovement: true, blocksStandingSight: false, blocksCrouchSight: true, kind: 'lowWall' },
    { id: 'crates_se', x: 5.8, z: 11.2, w: 2.5, d: 1.6, h: 1.08, blocksMovement: true, blocksStandingSight: false, blocksCrouchSight: true, kind: 'crates' },
    { id: 'central_well', x: -1.6, z: 3.6, w: 1.9, d: 1.9, h: 1.05, blocksMovement: true, blocksStandingSight: false, blocksCrouchSight: true, kind: 'well' },
    { id: 'low_wall_east', x: 13.5, z: 4.4, w: 4.8, d: 0.75, h: 1.05, blocksMovement: true, blocksStandingSight: false, blocksCrouchSight: true, kind: 'lowWall' },
    { id: 'watchtower_base', x: 7.6, z: 2.6, w: 2.7, d: 2.7, h: 5.2, blocksMovement: true, blocksStandingSight: true, blocksCrouchSight: true, kind: 'tower' },
    { id: 'courtyard_s_left', x: -7.4, z: -5.4, w: 6.2, d: 0.85, h: 2.3, blocksMovement: true, blocksStandingSight: true, blocksCrouchSight: true, kind: 'wall' },
    { id: 'courtyard_s_right', x: 7.4, z: -5.4, w: 6.2, d: 0.85, h: 2.3, blocksMovement: true, blocksStandingSight: true, blocksCrouchSight: true, kind: 'wall' },
    { id: 'courtyard_w', x: -10.2, z: -10.8, w: 0.85, d: 10.2, h: 2.3, blocksMovement: true, blocksStandingSight: true, blocksCrouchSight: true, kind: 'wall' },
    { id: 'courtyard_e', x: 10.2, z: -10.8, w: 0.85, d: 10.2, h: 2.3, blocksMovement: true, blocksStandingSight: true, blocksCrouchSight: true, kind: 'wall' },
    { id: 'courtyard_crates_w', x: -5.2, z: -9.6, w: 2.3, d: 1.4, h: 1.08, blocksMovement: true, blocksStandingSight: false, blocksCrouchSight: true, kind: 'crates' },
    { id: 'courtyard_crates_e', x: 5.2, z: -9.6, w: 2.3, d: 1.4, h: 1.08, blocksMovement: true, blocksStandingSight: false, blocksCrouchSight: true, kind: 'crates' },
  ],
  coverZones: [
    { id: 'cover_sw', x: -8.2, z: 13.8, radius: 1.65, label: 'كومة قش' },
    { id: 'cover_east_palm', x: 11.4, z: 7.2, radius: 1.65, label: 'حزمة جريد' },
    { id: 'cover_west_alley', x: -11.4, z: -2.2, radius: 1.65, label: 'عربة قش' },
    { id: 'cover_courtyard_nw', x: -7.8, z: -13.6, radius: 1.65, label: 'أزيار وظل' },
  ],
  guardPatrols: [
    { id: 'v_g1', waypoints: [{ x: -6.8, z: 8.8 }, { x: 6.4, z: 8.8 }], waitSeconds: 2.0, initialYaw: Math.PI * 0.5, visionRange: 9.2, visionAngleDeg: 58, speed: 2.05 },
    { id: 'v_g2', waypoints: [{ x: -5.6, z: 5.4 }, { x: -5.6, z: -1.4 }, { x: 2.8, z: -1.4 }, { x: 2.8, z: 5.4 }], waitSeconds: 1.5, initialYaw: Math.PI, visionRange: 9.5, visionAngleDeg: 60, speed: 2.15 },
    { id: 'v_g3', waypoints: [{ x: 4.6, z: 0.4 }, { x: 10.6, z: 5.8 }], waitSeconds: 2.2, initialYaw: -Math.PI * 0.4, visionRange: 9.8, visionAngleDeg: 62, speed: 1.95 },
    { id: 'v_g4', waypoints: [{ x: -13.5, z: -4.5 }, { x: -13.5, z: -15.2 }], waitSeconds: 2.0, initialYaw: Math.PI, visionRange: 9.0, visionAngleDeg: 58, speed: 2.1 },
    { id: 'v_g5', waypoints: [{ x: 12.8, z: -2.0 }, { x: 12.8, z: -14.2 }], waitSeconds: 2.0, initialYaw: 0, visionRange: 9.0, visionAngleDeg: 58, speed: 2.1 },
    { id: 'v_g6', waypoints: [{ x: -6.2, z: -11.5 }, { x: 6.2, z: -11.5 }], waitSeconds: 1.8, initialYaw: 0, visionRange: 9.4, visionAngleDeg: 64, speed: 2.0 },
  ],
  primaryTargetPos: { x: 0, z: -12.8 },
  secondaryTargetPos: { x: 6.1, z: 2.6 },
  extractionZone: { x: 0, z: 18.6, radius: 3.1 },
  palms: [
    { x: 16.5, z: 17.5, scale: 1.05, rot: 0.4 },
    { x: 17.8, z: 7.5, scale: 0.94, rot: 1.9 },
    { x: 11.2, z: 16.8, scale: 1.12, rot: 2.7 },
    { x: -17.6, z: 16.4, scale: 1.0, rot: 0.9 },
    { x: -18.2, z: -7.5, scale: 1.08, rot: 3.4 },
    { x: -16.8, z: -18.0, scale: 0.96, rot: 1.2 },
    { x: 17.4, z: -17.4, scale: 1.1, rot: 4.1 },
    { x: 8.5, z: -18.2, scale: 0.92, rot: 2.2 },
    { x: -8.5, z: -18.2, scale: 1.04, rot: 5.0 },
    { x: -25, z: 14, scale: 1.15, rot: 0.3 },
    { x: -27, z: -2, scale: 1.05, rot: 2.1 },
    { x: -24, z: -19, scale: 1.12, rot: 3.8 },
    { x: 25, z: 12, scale: 1.1, rot: 1.1 },
    { x: 26, z: -5, scale: 1.18, rot: 4.5 },
    { x: 24, z: -20, scale: 0.95, rot: 2.6 },
    { x: -14, z: -26, scale: 1.14, rot: 0.7 },
    { x: 14, z: -26, scale: 1.06, rot: 3.2 },
    { x: 0, z: -28, scale: 1.2, rot: 1.6 },
  ],
};

// ============================================================================
// STAGE 2: المعسكر (معسكر التل)
// ============================================================================
const CAMP_HOUSES: HouseSpec[] = [
  { id: 'camp_barracks_w', x: -12.5, z: 4.0, w: 6.4, d: 4.6, h: 3.3, isDepot: true, doorSide: 'east' },
  { id: 'camp_depot_e', x: 12.5, z: 4.0, w: 6.4, d: 4.6, h: 3.3, isDepot: true, doorSide: 'west' },
  { id: 'camp_hq', x: 0, z: -14.2, w: 9.2, d: 5.0, h: 3.9, hasDome: false, isDepot: true, doorSide: 'south' },
];

const STAGE_CAMP: StageConfig = {
  id: 'camp',
  order: 2,
  nameAr: '٢. معسكر التل',
  subtitleAr: 'أسوار ومخازن وأبراج — اسرق الوثائق السرية',
  theme: 'camp',
  skyColor: 0xd9c298,
  groundColor: 0xc5a273,
  primaryObjectiveType: 'intel',
  primaryObjectiveLabelAr: 'اسرق الوثائق السرية من خيمة القيادة',
  secondaryObjectiveLabelAr: 'فرعي: عطّل جرس الإنذار بالبرج الغربي',
  extractLabelAr: 'الانسحاب إلى الثغرة الجنوبية',
  heroSpawns: makeHeroSpawns(17.6),
  houses: CAMP_HOUSES,
  obstacles: [
    ...housesToObstacles(CAMP_HOUSES),
    // Outer camp perimeter walls with 3 breaches (center + east + west)
    { id: 'camp_s_w', x: -9.5, z: 12.0, w: 9.0, d: 0.9, h: 2.4, blocksMovement: true, blocksStandingSight: true, blocksCrouchSight: true, kind: 'wall' },
    { id: 'camp_s_e', x: 9.5, z: 12.0, w: 9.0, d: 0.9, h: 2.4, blocksMovement: true, blocksStandingSight: true, blocksCrouchSight: true, kind: 'wall' },
    { id: 'camp_w_wall', x: -17.5, z: -2.0, w: 0.9, d: 24.0, h: 2.4, blocksMovement: true, blocksStandingSight: true, blocksCrouchSight: true, kind: 'wall' },
    { id: 'camp_e_wall', x: 17.5, z: -2.0, w: 0.9, d: 24.0, h: 2.4, blocksMovement: true, blocksStandingSight: true, blocksCrouchSight: true, kind: 'wall' },
    { id: 'camp_tower_w', x: -6.8, z: -3.2, w: 2.7, d: 2.7, h: 5.2, blocksMovement: true, blocksStandingSight: true, blocksCrouchSight: true, kind: 'tower' },
    { id: 'camp_crates_c1', x: -2.6, z: 6.2, w: 2.6, d: 1.6, h: 1.08, blocksMovement: true, blocksStandingSight: false, blocksCrouchSight: true, kind: 'crates' },
    { id: 'camp_crates_c2', x: 3.4, z: -1.5, w: 2.6, d: 1.6, h: 1.08, blocksMovement: true, blocksStandingSight: false, blocksCrouchSight: true, kind: 'crates' },
    { id: 'camp_low_n1', x: -6.5, z: -9.0, w: 4.5, d: 0.75, h: 1.05, blocksMovement: true, blocksStandingSight: false, blocksCrouchSight: true, kind: 'lowWall' },
    { id: 'camp_low_n2', x: 6.5, z: -9.0, w: 4.5, d: 0.75, h: 1.05, blocksMovement: true, blocksStandingSight: false, blocksCrouchSight: true, kind: 'lowWall' },
  ],
  coverZones: [
    { id: 'camp_cov1', x: -5.5, z: 14.4, radius: 1.65, label: 'صناديق تموين' },
    { id: 'camp_cov2', x: 6.0, z: 8.6, radius: 1.65, label: 'براميل وقش' },
    { id: 'camp_cov3', x: -13.6, z: -4.2, radius: 1.65, label: 'ظل المخزن' },
    { id: 'camp_cov4', x: 13.6, z: -5.5, radius: 1.65, label: 'عربة ذخيرة' },
  ],
  guardPatrols: [
    { id: 'c_g1', waypoints: [{ x: -4.0, z: 9.8 }, { x: 4.0, z: 9.8 }], waitSeconds: 1.6, initialYaw: 0, visionRange: 9.6, visionAngleDeg: 60, speed: 2.1 },
    { id: 'c_g2', waypoints: [{ x: -8.2, z: 8.5 }, { x: -8.2, z: -0.5 }], waitSeconds: 1.8, initialYaw: Math.PI * 0.5, visionRange: 9.4, visionAngleDeg: 60, speed: 2.15 },
    { id: 'c_g3', waypoints: [{ x: 8.2, z: 8.5 }, { x: 8.2, z: -0.5 }], waitSeconds: 1.8, initialYaw: -Math.PI * 0.5, visionRange: 9.4, visionAngleDeg: 60, speed: 2.15 },
    { id: 'c_g4', waypoints: [{ x: -2.0, z: 2.8 }, { x: 5.5, z: 2.8 }, { x: 5.5, z: -5.5 }, { x: -2.0, z: -5.5 }], waitSeconds: 1.4, initialYaw: Math.PI, visionRange: 9.8, visionAngleDeg: 62, speed: 2.2 },
    { id: 'c_g5', waypoints: [{ x: -14.2, z: -7.5 }, { x: -14.2, z: -16.5 }], waitSeconds: 2.0, initialYaw: Math.PI * 0.5, visionRange: 9.2, visionAngleDeg: 58, speed: 2.0 },
    { id: 'c_g6', waypoints: [{ x: 14.2, z: -7.5 }, { x: 14.2, z: -16.5 }], waitSeconds: 2.0, initialYaw: -Math.PI * 0.5, visionRange: 9.2, visionAngleDeg: 58, speed: 2.0 },
    { id: 'c_g7', waypoints: [{ x: -5.5, z: -11.2 }, { x: 5.5, z: -11.2 }], waitSeconds: 1.6, initialYaw: 0, visionRange: 9.6, visionAngleDeg: 65, speed: 2.1 },
  ],
  primaryTargetPos: { x: 0, z: -10.8 },
  secondaryTargetPos: { x: -5.3, z: -3.2 },
  extractionZone: { x: 0, z: 18.6, radius: 3.1 },
  palms: [
    { x: -22, z: 16, scale: 1.05, rot: 0.4 },
    { x: 22, z: 15, scale: 1.12, rot: 2.1 },
    { x: -24, z: -8, scale: 1.0, rot: 1.3 },
    { x: 24, z: -10, scale: 1.14, rot: 3.8 },
    { x: 0, z: -24, scale: 1.15, rot: 0.9 },
  ],
};

// ============================================================================
// STAGE 3: المزارع (مزارع الترعة)
// ============================================================================
const FARMS_HOUSES: HouseSpec[] = [
  { id: 'farm_barn_w', x: -14.5, z: 10.5, w: 5.4, d: 4.8, h: 3.2, hasDome: false, doorSide: 'east' },
  { id: 'farm_mill_e', x: 14.5, z: -10.5, w: 5.8, d: 5.0, h: 3.6, hasDome: true, doorSide: 'west' },
  { id: 'farm_shed_n', x: -2.0, z: -16.5, w: 7.5, d: 4.4, h: 3.4, hasDome: true, doorSide: 'south' },
];

const STAGE_FARMS: StageConfig = {
  id: 'farms',
  order: 3,
  nameAr: '٣. مزارع الترعة',
  subtitleAr: 'حقول وجسور فوق الترعة — أنقذ الفلاح حسنين',
  theme: 'farms',
  skyColor: 0xdfcfa8,
  groundColor: 0xc8af7a,
  primaryObjectiveType: 'vip',
  primaryObjectiveLabelAr: 'أنقذ الفلاح حسنين من ساحة الطاحونة',
  secondaryObjectiveLabelAr: 'فرعي: عطّل جرس المراقبة الشمالي',
  extractLabelAr: 'العودة إلى جسر القوارب الجنوبي',
  heroSpawns: makeHeroSpawns(17.6),
  houses: FARMS_HOUSES,
  canalZ: 1.5,
  bridgesX: [-10.0, 0, 10.5],
  cropPlots: [
    { x: -6.5, z: 8.5, w: 5.5, d: 4.5 },
    { x: 6.5, z: 8.5, w: 5.5, d: 4.5 },
    { x: -11.5, z: -7.5, w: 5.5, d: 4.5 },
    { x: 5.5, z: -6.5, w: 5.5, d: 4.5 },
  ],
  obstacles: [
    ...housesToObstacles(FARMS_HOUSES),
    // Canal water segments leaving 3 clear crossing bridges at x = -10, 0, +10.5
    { id: 'canal_1', x: -17.0, z: 1.5, w: 9.0, d: 2.6, h: 0.2, blocksMovement: true, blocksStandingSight: false, blocksCrouchSight: false, kind: 'water' },
    { id: 'canal_2', x: -5.0, z: 1.5, w: 5.6, d: 2.6, h: 0.2, blocksMovement: true, blocksStandingSight: false, blocksCrouchSight: false, kind: 'water' },
    { id: 'canal_3', x: 5.2, z: 1.5, w: 6.2, d: 2.6, h: 0.2, blocksMovement: true, blocksStandingSight: false, blocksCrouchSight: false, kind: 'water' },
    { id: 'canal_4', x: 17.5, z: 1.5, w: 8.2, d: 2.6, h: 0.2, blocksMovement: true, blocksStandingSight: false, blocksCrouchSight: false, kind: 'water' },
    // Farm walls, hay crates, watchtower
    { id: 'farm_low_s1', x: -4.2, z: 12.6, w: 4.4, d: 0.75, h: 1.05, blocksMovement: true, blocksStandingSight: false, blocksCrouchSight: true, kind: 'lowWall' },
    { id: 'farm_crates_e', x: 6.8, z: 12.2, w: 2.4, d: 1.5, h: 1.08, blocksMovement: true, blocksStandingSight: false, blocksCrouchSight: true, kind: 'crates' },
    { id: 'farm_well', x: 13.5, z: 9.2, w: 1.9, d: 1.9, h: 1.05, blocksMovement: true, blocksStandingSight: false, blocksCrouchSight: true, kind: 'well' },
    { id: 'farm_tower', x: -5.5, z: -5.2, w: 2.7, d: 2.7, h: 5.2, blocksMovement: true, blocksStandingSight: true, blocksCrouchSight: true, kind: 'tower' },
    { id: 'farm_low_n', x: 4.5, z: -11.5, w: 4.8, d: 0.75, h: 1.05, blocksMovement: true, blocksStandingSight: false, blocksCrouchSight: true, kind: 'lowWall' },
  ],
  coverZones: [
    { id: 'farm_cov1', x: -1.5, z: 9.5, radius: 1.75, label: 'حقول ذرة' },
    { id: 'farm_cov2', x: 11.2, z: 6.0, radius: 1.75, label: 'كومة تبن' },
    { id: 'farm_cov3', x: -14.2, z: -4.0, radius: 1.75, label: 'جريد نخيل' },
    { id: 'farm_cov4', x: 8.5, z: -13.5, radius: 1.75, label: 'حقل قصب' },
  ],
  guardPatrols: [
    { id: 'f_g1', waypoints: [{ x: -8.5, z: 5.0 }, { x: 8.5, z: 5.0 }], waitSeconds: 1.8, initialYaw: Math.PI * 0.5, visionRange: 9.5, visionAngleDeg: 60, speed: 2.15 },
    { id: 'f_g2', waypoints: [{ x: 0, z: 11.0 }, { x: 0, z: 3.8 }], waitSeconds: 2.0, initialYaw: 0, visionRange: 9.2, visionAngleDeg: 58, speed: 2.0 },
    { id: 'f_g3', waypoints: [{ x: -10.0, z: -1.8 }, { x: -10.0, z: -13.5 }], waitSeconds: 1.7, initialYaw: Math.PI, visionRange: 9.5, visionAngleDeg: 60, speed: 2.2 },
    { id: 'f_g4', waypoints: [{ x: 10.5, z: -1.8 }, { x: 10.5, z: -14.5 }], waitSeconds: 1.7, initialYaw: Math.PI, visionRange: 9.5, visionAngleDeg: 60, speed: 2.2 },
    { id: 'f_g5', waypoints: [{ x: -1.8, z: -2.2 }, { x: 4.5, z: -2.2 }, { x: 4.5, z: -9.0 }, { x: -1.8, z: -9.0 }], waitSeconds: 1.4, initialYaw: 0, visionRange: 9.8, visionAngleDeg: 62, speed: 2.1 },
    { id: 'f_g6', waypoints: [{ x: -7.5, z: -12.6 }, { x: 2.0, z: -12.6 }], waitSeconds: 1.8, initialYaw: Math.PI * 0.5, visionRange: 9.6, visionAngleDeg: 64, speed: 2.05 },
    { id: 'f_g7', waypoints: [{ x: 14.5, z: 13.5 }, { x: 14.5, z: 5.2 }], waitSeconds: 2.0, initialYaw: -Math.PI * 0.5, visionRange: 9.0, visionAngleDeg: 58, speed: 2.0 },
  ],
  primaryTargetPos: { x: -2.0, z: -13.2 },
  secondaryTargetPos: { x: -4.0, z: -5.2 },
  extractionZone: { x: 0, z: 18.6, radius: 3.1 },
  palms: [
    { x: -17, z: 16, scale: 1.1, rot: 0.3 },
    { x: 17, z: 16, scale: 1.05, rot: 1.7 },
    { x: -18, z: -1.5, scale: 1.0, rot: 2.5 },
    { x: 18, z: -1.5, scale: 1.15, rot: 4.2 },
    { x: -17, z: -16, scale: 1.08, rot: 1.1 },
    { x: 17, z: -17, scale: 1.12, rot: 3.4 },
    { x: 6, z: -17.5, scale: 0.96, rot: 5.1 },
    { x: -11, z: 16.5, scale: 0.94, rot: 2.9 },
  ],
};

// ============================================================================
// STAGE 4: الجبل (مخبأ الجبل)
// ============================================================================
const MOUNTAIN_HOUSES: HouseSpec[] = [
  { id: 'mtn_depot_main', x: 0, z: -15.5, w: 8.6, d: 5.2, h: 4.0, isDepot: true, doorSide: 'south' },
  { id: 'mtn_bunker_w', x: -14.2, z: -3.5, w: 5.0, d: 4.8, h: 3.4, isDepot: true, doorSide: 'east' },
];

const STAGE_MOUNTAIN: StageConfig = {
  id: 'mountain',
  order: 4,
  nameAr: '٤. مخبأ الجبل',
  subtitleAr: 'ممرات صخرية وعرة — فجّر مخزن البارود',
  theme: 'mountain',
  skyColor: 0xd6b98c,
  groundColor: 0xba9567,
  primaryObjectiveType: 'sabotage',
  primaryObjectiveLabelAr: 'ازرع شحنة التفجير عند مخزن البارود',
  secondaryObjectiveLabelAr: 'فرعي: عطّل جرس إنذار الممر الجبلي',
  extractLabelAr: 'الهروب إلى الوادي الجنوبي',
  heroSpawns: makeHeroSpawns(17.6),
  houses: MOUNTAIN_HOUSES,
  obstacles: [
    ...housesToObstacles(MOUNTAIN_HOUSES),
    // Rocky canyon choke points & boulder formations
    { id: 'cliff_s_w', x: -12.5, z: 10.5, w: 9.5, d: 3.6, h: 3.8, blocksMovement: true, blocksStandingSight: true, blocksCrouchSight: true, kind: 'cliff' },
    { id: 'cliff_s_e', x: 12.5, z: 10.5, w: 9.5, d: 3.6, h: 3.8, blocksMovement: true, blocksStandingSight: true, blocksCrouchSight: true, kind: 'cliff' },
    { id: 'cliff_mid_c', x: 0, z: 3.2, w: 5.4, d: 3.4, h: 3.6, blocksMovement: true, blocksStandingSight: true, blocksCrouchSight: true, kind: 'cliff' },
    { id: 'cliff_e_mid', x: 14.8, z: -2.0, w: 6.0, d: 5.5, h: 4.2, blocksMovement: true, blocksStandingSight: true, blocksCrouchSight: true, kind: 'cliff' },
    { id: 'cliff_n_w', x: -13.5, z: -13.0, w: 6.2, d: 4.0, h: 3.8, blocksMovement: true, blocksStandingSight: true, blocksCrouchSight: true, kind: 'cliff' },
    { id: 'mtn_tower', x: 7.2, z: -3.8, w: 2.7, d: 2.7, h: 5.2, blocksMovement: true, blocksStandingSight: true, blocksCrouchSight: true, kind: 'tower' },
    { id: 'mtn_crates_1', x: -4.8, z: 10.5, w: 2.4, d: 1.5, h: 1.08, blocksMovement: true, blocksStandingSight: false, blocksCrouchSight: true, kind: 'crates' },
    { id: 'mtn_crates_2', x: 5.0, z: 10.5, w: 2.4, d: 1.5, h: 1.08, blocksMovement: true, blocksStandingSight: false, blocksCrouchSight: true, kind: 'crates' },
    { id: 'mtn_low_n', x: -4.2, z: -8.6, w: 4.4, d: 0.75, h: 1.05, blocksMovement: true, blocksStandingSight: false, blocksCrouchSight: true, kind: 'lowWall' },
    { id: 'mtn_crates_n', x: 4.5, z: -9.0, w: 2.4, d: 1.5, h: 1.08, blocksMovement: true, blocksStandingSight: false, blocksCrouchSight: true, kind: 'crates' },
  ],
  coverZones: [
    { id: 'mtn_cov1', x: -6.2, z: 14.0, radius: 1.65, label: 'صخور منخفضة' },
    { id: 'mtn_cov2', x: 6.8, z: 6.2, radius: 1.65, label: 'صناديق بارود' },
    { id: 'mtn_cov3', x: -8.2, z: -4.5, radius: 1.65, label: 'ظل الجرف' },
    { id: 'mtn_cov4', x: 10.8, z: -11.5, radius: 1.65, label: 'شجيرات جبلية' },
  ],
  guardPatrols: [
    { id: 'm_g1', waypoints: [{ x: -5.5, z: 7.2 }, { x: 5.5, z: 7.2 }], waitSeconds: 1.6, initialYaw: 0, visionRange: 9.8, visionAngleDeg: 62, speed: 2.2 },
    { id: 'm_g2', waypoints: [{ x: -7.5, z: 5.5 }, { x: -7.5, z: -2.0 }], waitSeconds: 1.8, initialYaw: Math.PI, visionRange: 9.5, visionAngleDeg: 60, speed: 2.15 },
    { id: 'm_g3', waypoints: [{ x: 7.5, z: 5.5 }, { x: 7.5, z: 0.2 }], waitSeconds: 1.8, initialYaw: Math.PI, visionRange: 9.5, visionAngleDeg: 60, speed: 2.15 },
    { id: 'm_g4', waypoints: [{ x: -4.2, z: -1.5 }, { x: 3.4, z: -1.5 }, { x: 3.4, z: -6.5 }, { x: -4.2, z: -6.5 }], waitSeconds: 1.3, initialYaw: 0, visionRange: 9.8, visionAngleDeg: 64, speed: 2.25 },
    { id: 'm_g5', waypoints: [{ x: -10.5, z: -8.2 }, { x: -10.5, z: 1.5 }], waitSeconds: 1.9, initialYaw: Math.PI * 0.5, visionRange: 9.4, visionAngleDeg: 58, speed: 2.1 },
    { id: 'm_g6', waypoints: [{ x: 11.2, z: -7.5 }, { x: 11.2, z: -14.8 }], waitSeconds: 1.9, initialYaw: -Math.PI * 0.5, visionRange: 9.4, visionAngleDeg: 58, speed: 2.1 },
    { id: 'm_g7', waypoints: [{ x: -5.8, z: -11.5 }, { x: 5.8, z: -11.5 }], waitSeconds: 1.5, initialYaw: 0, visionRange: 10.0, visionAngleDeg: 66, speed: 2.2 },
    { id: 'm_g8', waypoints: [{ x: 0, z: -10.5 }, { x: 0, z: -5.5 }], waitSeconds: 2.0, initialYaw: 0, visionRange: 9.6, visionAngleDeg: 62, speed: 2.05 },
  ],
  primaryTargetPos: { x: 0, z: -12.2 },
  secondaryTargetPos: { x: 5.7, z: -3.8 },
  extractionZone: { x: 0, z: 18.6, radius: 3.1 },
  palms: [
    { x: -17, z: 17, scale: 0.95, rot: 0.8 },
    { x: 17, z: 17, scale: 0.98, rot: 2.4 },
    { x: -22, z: 2, scale: 1.05, rot: 1.6 },
    { x: 22, z: -14, scale: 1.0, rot: 4.1 },
  ],
};

export const STAGES: StageConfig[] = [
  STAGE_VILLAGE,
  STAGE_CAMP,
  STAGE_FARMS,
  STAGE_MOUNTAIN,
];

export function getStageConfig(id: StageId): StageConfig {
  return STAGES.find((s) => s.id === id) ?? STAGE_VILLAGE;
}
