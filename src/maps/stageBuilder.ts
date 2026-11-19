import * as THREE from 'three';
import type { ProceduralTextureSet } from '../engine/textures';
import type { StageConfig } from '../types/game';

export interface StageSceneObjects {
  group: THREE.Group;
  alarmBellMesh: THREE.Mesh;
  bellHitMesh: THREE.Mesh;
  primaryPropGroup: THREE.Group;
  primaryBeaconMesh: THREE.Mesh;
  extractionRing: THREE.Mesh;
  patrolLinesGroup: THREE.Group;
  coverZonePads: THREE.Mesh[];
  dispose: () => void;
}

export function buildStageEnvironment(
  stage: StageConfig,
  textures: ProceduralTextureSet,
): StageSceneObjects {
  const group = new THREE.Group();
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

  // Materials
  const matSand = trackMat(
    new THREE.MeshStandardMaterial({
      map: textures.sandGround,
      bumpMap: textures.sandBump,
      bumpScale: 0.09,
      color: stage.groundColor,
      roughness: 0.94,
      metalness: 0.0,
    }),
  );
  const matAlley = trackMat(
    new THREE.MeshStandardMaterial({
      map: textures.alleyCobble,
      bumpMap: textures.alleyBump,
      bumpScale: 0.06,
      roughness: 0.9,
      metalness: 0.02,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    }),
  );
  const matMudWall = trackMat(
    new THREE.MeshStandardMaterial({
      map: textures.mudBrick,
      bumpMap: textures.mudBump,
      bumpScale: 0.1,
      roughness: 0.9,
      metalness: 0.02,
    }),
  );
  const matDepotWall = trackMat(
    new THREE.MeshStandardMaterial({
      map: textures.mudBrick,
      bumpMap: textures.mudBump,
      bumpScale: 0.1,
      color: 0xa69072,
      roughness: 0.86,
      metalness: 0.04,
    }),
  );
  const matStonePlinth = trackMat(
    new THREE.MeshStandardMaterial({
      map: textures.stoneAshlar,
      bumpMap: textures.stoneBump,
      bumpScale: 0.07,
      roughness: 0.9,
      metalness: 0.03,
    }),
  );
  const matPlasterTrim = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xe3c89e,
      roughness: 0.84,
      metalness: 0.02,
    }),
  );
  const matWhitewash = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xf1e6d2,
      roughness: 0.86,
      metalness: 0.01,
    }),
  );
  const matFrieze = trackMat(
    new THREE.MeshStandardMaterial({
      map: textures.saidiFrieze,
      roughness: 0.85,
      metalness: 0.02,
    }),
  );
  const matMashrabiya = trackMat(
    new THREE.MeshStandardMaterial({
      map: textures.mashrabiyaWindow,
      emissive: 0x6b3a12,
      emissiveIntensity: 0.35,
      roughness: 0.65,
      metalness: 0.05,
    }),
  );
  const matCarvedDoor = trackMat(
    new THREE.MeshStandardMaterial({
      map: textures.carvedDoor,
      roughness: 0.72,
      metalness: 0.08,
    }),
  );
  const matWood = trackMat(
    new THREE.MeshStandardMaterial({
      map: textures.woodPlank,
      roughness: 0.78,
      metalness: 0.04,
    }),
  );
  const matTealCrate = trackMat(
    new THREE.MeshStandardMaterial({
      map: textures.crateTealWood,
      roughness: 0.78,
      metalness: 0.04,
    }),
  );
  const matBenchCloth = trackMat(
    new THREE.MeshStandardMaterial({
      map: textures.benchStripe,
      roughness: 0.9,
      metalness: 0.0,
    }),
  );
  const matPalmFrond = trackMat(
    new THREE.MeshStandardMaterial({
      map: textures.palmFrond,
      alphaTest: 0.45,
      side: THREE.DoubleSide,
      roughness: 0.72,
      metalness: 0.02,
    }),
  );
  const matOakBarrel = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x6e4527,
      map: textures.woodPlank,
      roughness: 0.76,
      metalness: 0.04,
    }),
  );
  const matIron = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x2d3136,
      roughness: 0.42,
      metalness: 0.75,
    }),
  );
  const matAwning = trackMat(
    new THREE.MeshStandardMaterial({
      map: textures.awningStripe,
      roughness: 0.88,
      metalness: 0.0,
    }),
  );
  const matKilim = trackMat(
    new THREE.MeshStandardMaterial({
      map: textures.kilimRug,
      roughness: 0.94,
      metalness: 0.0,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    }),
  );
  const matTerracotta = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xb95f38,
      roughness: 0.7,
      metalness: 0.04,
    }),
  );
  const matBurlap = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xa6895b,
      roughness: 0.94,
      metalness: 0.0,
    }),
  );
  const matBrass = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xdca842,
      roughness: 0.22,
      metalness: 0.9,
    }),
  );
  const matLanternGlow = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xffe49e,
      emissive: 0xf59e0b,
      emissiveIntensity: 1.35,
      roughness: 0.28,
    }),
  );
  const matHay = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xd4ad53,
      roughness: 0.94,
      metalness: 0.0,
    }),
  );
  const matCliff = trackMat(
    new THREE.MeshStandardMaterial({
      map: textures.stoneAshlar,
      bumpMap: textures.stoneBump,
      bumpScale: 0.12,
      color: stage.theme === 'mountain' ? 0x9b704a : 0xbd9060,
      roughness: 0.94,
      metalness: 0.0,
    }),
  );
  const matCrop = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x4b7c34,
      roughness: 0.9,
      metalness: 0.0,
    }),
  );
  const matShrubLeaf = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x45802f,
      roughness: 0.88,
      metalness: 0.0,
    }),
  );
  const matShrubLeafLight = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x5c9a38,
      roughness: 0.86,
      metalness: 0.0,
    }),
  );
  const matBougainvillea = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xc9365f,
      roughness: 0.72,
      metalness: 0.0,
    }),
  );
  const matWater = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x22697c,
      roughness: 0.12,
      metalness: 0.42,
    }),
  );

  // Reusable small prop helpers
  const addLanternAt = (parent: THREE.Object3D, x: number, y: number, z: number) => {
    const cap = new THREE.Mesh(trackGeo(new THREE.ConeGeometry(0.14, 0.12, 6)), matBrass);
    cap.position.set(x, y + 0.12, z);
    const glass = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.09, 0.07, 0.2, 6)), matLanternGlow);
    glass.position.set(x, y, z);
    const base = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.08, 0.1, 0.05, 6)), matBrass);
    base.position.set(x, y - 0.12, z);
    parent.add(cap, glass, base);
  };

  const addZeerJar = (parent: THREE.Object3D, x: number, y: number, z: number, scale = 1) => {
    const zeerPts = [
      new THREE.Vector2(0, 0),
      new THREE.Vector2(0.16 * scale, 0.04 * scale),
      new THREE.Vector2(0.3 * scale, 0.4 * scale),
      new THREE.Vector2(0.26 * scale, 0.7 * scale),
      new THREE.Vector2(0.15 * scale, 0.85 * scale),
      new THREE.Vector2(0.21 * scale, 0.94 * scale),
    ];
    const jar = new THREE.Mesh(trackGeo(new THREE.LatheGeometry(zeerPts, 14)), matTerracotta);
    jar.position.set(x, y, z);
    jar.castShadow = true;
    const lid = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.21 * scale, 0.21 * scale, 0.05 * scale, 10)),
      matWood,
    );
    lid.position.set(x, y + 0.95 * scale, z);
    parent.add(jar, lid);
  };

  const addBarrelAt = (parent: THREE.Object3D, x: number, y: number, z: number, scale = 1) => {
    const barrelPts = [
      new THREE.Vector2(0, 0),
      new THREE.Vector2(0.26 * scale, 0.02 * scale),
      new THREE.Vector2(0.34 * scale, 0.44 * scale),
      new THREE.Vector2(0.27 * scale, 0.88 * scale),
      new THREE.Vector2(0, 0.88 * scale),
    ];
    const body = new THREE.Mesh(trackGeo(new THREE.LatheGeometry(barrelPts, 14)), matOakBarrel);
    body.position.set(x, y, z);
    body.castShadow = true;
    body.receiveShadow = true;
    parent.add(body);

    for (const [hy, hr] of [
      [0.12, 0.28],
      [0.44, 0.34],
      [0.76, 0.29],
    ] as const) {
      const hoop = new THREE.Mesh(
        trackGeo(new THREE.TorusGeometry(hr * scale, 0.022 * scale, 6, 16)),
        matIron,
      );
      hoop.rotation.x = Math.PI / 2;
      hoop.position.set(x, y + hy * scale, z);
      parent.add(hoop);
    }
  };

  const addCourtyardBench = (
    parent: THREE.Object3D,
    x: number,
    y: number,
    z: number,
    rotY = 0,
  ) => {
    const bench = new THREE.Group();
    bench.position.set(x, y, z);
    bench.rotation.y = rotY;
    const seat = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.38, 0.1, 0.56)), matBenchCloth);
    seat.position.y = 0.42;
    seat.castShadow = true;
    seat.receiveShadow = true;
    const frame = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.44, 0.08, 0.6)), matWood);
    frame.position.y = 0.34;
    frame.castShadow = true;
    bench.add(seat, frame);

    const legGeo = trackGeo(new THREE.BoxGeometry(0.1, 0.34, 0.1));
    for (const lx of [-0.62, 0.62]) {
      for (const lz of [-0.22, 0.22]) {
        const leg = new THREE.Mesh(legGeo, matWood);
        leg.position.set(lx, 0.17, lz);
        leg.castShadow = true;
        bench.add(leg);
      }
    }
    parent.add(bench);
  };

  const addFloweringShrub = (
    parent: THREE.Object3D,
    x: number,
    y: number,
    z: number,
    scale = 1,
    withFlowers = true,
  ) => {
    const shrub = new THREE.Group();
    shrub.position.set(x, y, z);
    shrub.scale.setScalar(scale);

    const lobes: [number, number, number, number, boolean][] = [
      [0, 0.28, 0, 0.36, false],
      [-0.24, 0.2, 0.14, 0.27, true],
      [0.24, 0.21, -0.1, 0.28, false],
      [0.06, 0.22, 0.24, 0.25, true],
      [-0.08, 0.42, -0.06, 0.24, true],
    ];
    for (const [lx, ly, lz, lr, light] of lobes) {
      const m = new THREE.Mesh(
        trackGeo(new THREE.DodecahedronGeometry(lr, 1)),
        light ? matShrubLeafLight : matShrubLeaf,
      );
      m.position.set(lx, ly, lz);
      m.castShadow = true;
      m.receiveShadow = true;
      shrub.add(m);
    }

    if (withFlowers) {
      const flGeo = trackGeo(new THREE.DodecahedronGeometry(0.075, 0));
      for (const [fx, fy, fz] of [
        [-0.22, 0.38, 0.2],
        [0.2, 0.42, 0.14],
        [0.02, 0.56, -0.08],
        [-0.14, 0.28, -0.22],
        [0.26, 0.29, -0.14],
      ] as const) {
        const fl = new THREE.Mesh(flGeo, matBougainvillea);
        fl.position.set(fx, fy, fz);
        shrub.add(fl);
      }
    }
    parent.add(shrub);
  };

  const addHayCart = (parent: THREE.Object3D, x: number, y: number, z: number, rotY = 0) => {
    const cart = new THREE.Group();
    cart.position.set(x, y, z);
    cart.rotation.y = rotY;

    // Axle & spoked wheels
    const axle = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.05, 0.05, 1.48, 8)),
      matWood,
    );
    axle.rotation.z = Math.PI / 2;
    axle.position.set(0, 0.44, 0);
    cart.add(axle);

    for (const wx of [-0.72, 0.72]) {
      const wheel = new THREE.Group();
      wheel.position.set(wx, 0.44, 0);
      const rim = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(0.42, 0.05, 8, 18)), matWood);
      rim.rotation.y = Math.PI / 2;
      rim.castShadow = true;
      const tire = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(0.45, 0.02, 6, 18)), matIron);
      tire.rotation.y = Math.PI / 2;
      const hub = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.1, 0.1, 0.14, 10)), matWood);
      hub.rotation.z = Math.PI / 2;
      wheel.add(rim, tire, hub);

      const spokeGeo = trackGeo(new THREE.CylinderGeometry(0.025, 0.025, 0.8, 6));
      for (let s = 0; s < 4; s++) {
        const sp = new THREE.Mesh(spokeGeo, matWood);
        sp.rotation.x = (s / 4) * Math.PI;
        wheel.add(sp);
      }
      cart.add(wheel);
    }

    // Wooden cart bed + side rails + pull shafts
    const bed = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.18, 0.14, 1.75)), matWood);
    bed.position.set(0, 0.56, 0.06);
    bed.castShadow = true;
    cart.add(bed);

    for (const sx of [-0.54, 0.54]) {
      const side = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.08, 0.42, 1.72)), matWood);
      side.position.set(sx, 0.82, 0.06);
      side.castShadow = true;
      const shaft = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.04, 0.045, 1.25, 6)), matWood);
      shaft.rotation.x = Math.PI / 2 + 0.18;
      shaft.position.set(sx * 0.72, 0.4, 1.42);
      shaft.castShadow = true;
      cart.add(side, shaft);
    }
    const backRail = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.16, 0.4, 0.08)), matWood);
    backRail.position.set(0, 0.82, -0.78);
    cart.add(backRail);

    // Mounded golden straw pile
    const hayMound = new THREE.Mesh(trackGeo(new THREE.DodecahedronGeometry(0.72, 1)), matHay);
    hayMound.scale.set(0.84, 0.68, 1.12);
    hayMound.position.set(0, 0.98, 0.02);
    hayMound.castShadow = true;
    const hayTop = new THREE.Mesh(trackGeo(new THREE.DodecahedronGeometry(0.45, 1)), matHay);
    hayTop.scale.set(1.0, 0.65, 1.1);
    hayTop.position.set(-0.08, 1.26, -0.1);
    hayTop.castShadow = true;
    cart.add(hayMound, hayTop);

    parent.add(cart);
  };

  const addReedFenceWing = (
    parent: THREE.Object3D,
    x: number,
    y: number,
    z: number,
    length: number,
    rotY = 0,
  ) => {
    const fence = new THREE.Group();
    fence.position.set(x, y, z);
    fence.rotation.y = rotY;
    const count = Math.max(4, Math.floor(length / 0.22));
    const stakeGeo = trackGeo(new THREE.CylinderGeometry(0.042, 0.052, 1.25, 6));
    for (let i = 0; i < count; i++) {
      const px = -length * 0.5 + (i / (count - 1)) * length;
      const stake = new THREE.Mesh(stakeGeo, matWood);
      stake.position.set(px, 0.62 + (i % 3) * 0.06, (i % 2 === 0 ? 1 : -1) * 0.015);
      stake.rotation.z = ((i % 5) - 2) * 0.025;
      stake.castShadow = true;
      fence.add(stake);
    }
    for (const ry of [0.36, 0.92]) {
      const rail = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(length + 0.08, 0.07, 0.07)), matWood);
      rail.position.set(0, ry, 0);
      fence.add(rail);
    }
    parent.add(fence);
  };

  // 1. Extended Desert Terrain & Cobblestone Pathways
  const groundGeo = trackGeo(new THREE.PlaneGeometry(180, 180));
  groundGeo.rotateX(-Math.PI / 2);
  const groundMesh = new THREE.Mesh(groundGeo, matSand);
  groundMesh.receiveShadow = true;
  group.add(groundMesh);

  const mainAlley = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(6.2, 36)), matAlley);
  mainAlley.rotation.x = -Math.PI / 2;
  mainAlley.position.set(0, 0.018, 2);
  mainAlley.receiveShadow = true;
  group.add(mainAlley);

  // Secondary cross-alley cobble branch toward side compounds
  if (stage.theme === 'village' || stage.theme === 'camp') {
    const crossAlley = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(24, 3.4)), matAlley);
    crossAlley.rotation.x = -Math.PI / 2;
    crossAlley.position.set(0, 0.016, 8.8);
    crossAlley.receiveShadow = true;
    group.add(crossAlley);
  }

  // Woven Kilim Carpet + Flanking Lantern Pillars at Extraction Gate
  const rug = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(3.8, 2.6)), matKilim);
  rug.rotation.x = -Math.PI / 2;
  rug.position.set(stage.extractionZone.x, 0.026, stage.extractionZone.z);
  rug.receiveShadow = true;
  group.add(rug);

  for (const gx of [-3.35, 3.35]) {
    const postGroup = new THREE.Group();
    postGroup.position.set(stage.extractionZone.x + gx, 0, stage.extractionZone.z + 0.2);
    const pole = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.09, 0.12, 2.5, 8)), matWood);
    pole.position.y = 1.25;
    pole.castShadow = true;
    const arm = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.45, 0.08, 0.08)), matWood);
    arm.position.set(gx > 0 ? -0.2 : 0.2, 2.38, 0);
    const banner = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.05, 0.68, 0.36)), matAwning);
    banner.position.set(gx > 0 ? -0.32 : 0.32, 2.0, 0);
    postGroup.add(pole, arm, banner);
    addLanternAt(postGroup, gx > 0 ? -0.4 : 0.4, 2.15, 0);
    group.add(postGroup);
  }

  // 2. Stage 3 Nile Canal, Stone Embankments, Bridges, Felucca & Crop Plots
  if (stage.cropPlots) {
    for (const cp of stage.cropPlots) {
      const soilBorder = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(cp.w + 0.3, 0.14, cp.d + 0.3)),
        matMudWall,
      );
      soilBorder.position.set(cp.x, 0.05, cp.z);
      soilBorder.receiveShadow = true;
      const plot = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(cp.w, 0.16, cp.d)), matCrop);
      plot.position.set(cp.x, 0.08, cp.z);
      plot.receiveShadow = true;
      group.add(soilBorder, plot);
      for (let r = -1; r <= 1; r++) {
        const row = new THREE.Mesh(
          trackGeo(new THREE.BoxGeometry(cp.w * 0.88, 0.42, 0.52)),
          matCrop,
        );
        row.position.set(cp.x, 0.24, cp.z + r * 1.25);
        row.castShadow = true;
        group.add(row);
      }
    }
  }

  if (stage.canalZ !== undefined && stage.bridgesX) {
    const canalBed = new THREE.Mesh(trackGeo(new THREE.PlaneGeometry(46, 2.9)), matWater);
    canalBed.rotation.x = -Math.PI / 2;
    canalBed.position.set(0, 0.02, stage.canalZ);
    canalBed.receiveShadow = true;
    group.add(canalBed);

    // Carved stone embankment curbs along north & south edges of canal
    for (const sideZ of [-1.52, 1.52]) {
      const curb = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(46, 0.24, 0.32)),
        matStonePlinth,
      );
      curb.position.set(0, 0.12, stage.canalZ + sideZ);
      curb.castShadow = true;
      curb.receiveShadow = true;
      group.add(curb);
    }

    // Small wooden skiff boat moored beside canal bank
    const skiff = new THREE.Group();
    skiff.position.set(-15.5, 0.12, stage.canalZ + 0.15);
    skiff.rotation.y = 0.08;
    const hull = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(2.6, 0.26, 0.9)), matWood);
    hull.castShadow = true;
    const prow = new THREE.Mesh(trackGeo(new THREE.ConeGeometry(0.45, 0.85, 4)), matWood);
    prow.rotation.z = -Math.PI / 2;
    prow.rotation.x = Math.PI / 4;
    prow.position.set(1.65, 0.08, 0);
    skiff.add(hull, prow);
    group.add(skiff);

    for (const bx of stage.bridgesX) {
      const deck = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(3.2, 0.24, 3.4)), matWood);
      deck.position.set(bx, 0.16, stage.canalZ);
      deck.castShadow = true;
      deck.receiveShadow = true;
      group.add(deck);
      for (const rx of [-1.48, 1.48]) {
        const rail = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.12, 0.12, 3.4)), matWood);
        rail.position.set(bx + rx, 0.72, stage.canalZ);
        group.add(rail);
        for (const pz of [-1.4, 0, 1.4]) {
          const post = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.16, 0.68, 0.16)), matWood);
          post.position.set(bx + rx, 0.44, stage.canalZ + pz);
          post.castShadow = true;
          group.add(post);
        }
      }
    }
  }

  // 3. Handcrafted Upper Egyptian Mud-Brick Houses & Compounds
  for (let hIdx = 0; hIdx < stage.houses.length; hIdx++) {
    const h = stage.houses[hIdx];
    const houseGroup = new THREE.Group();
    houseGroup.position.set(h.x, 0, h.z);

    // Limestone ashlar foundation plinth
    const plinth = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(h.w + 0.34, 0.42, h.d + 0.34)),
      matStonePlinth,
    );
    plinth.position.y = 0.21;
    plinth.castShadow = true;
    plinth.receiveShadow = true;
    houseGroup.add(plinth);

    // Main weathered adobe walls
    const walls = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(h.w, h.h, h.d)),
      h.isDepot ? matDepotWall : matMudWall,
    );
    walls.position.y = h.h * 0.5;
    walls.castShadow = true;
    walls.receiveShadow = true;
    houseGroup.add(walls);

    // Decorative Saidi painted triangle parapet frieze (village / farm houses)
    if (!h.isDepot) {
      const friezeBand = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(h.w + 0.06, 0.34, h.d + 0.06)),
        matFrieze,
      );
      friezeBand.position.y = h.h - 0.34;
      houseGroup.add(friezeBand);
    }

    // Tapered plaster corner pilasters + mud-brick rooftop corner pinnacles (عرائس طين)
    const pilGeo = trackGeo(new THREE.BoxGeometry(0.44, h.h + 0.18, 0.44));
    const pinnacleGeo = trackGeo(new THREE.ConeGeometry(0.24, 0.48, 6));
    for (const px of [-h.w * 0.48, h.w * 0.48]) {
      for (const pz of [-h.d * 0.48, h.d * 0.48]) {
        const pil = new THREE.Mesh(pilGeo, matPlasterTrim);
        pil.position.set(px, (h.h + 0.18) * 0.5, pz);
        pil.castShadow = true;
        const pin = new THREE.Mesh(pinnacleGeo, matPlasterTrim);
        pin.position.set(px, h.h + 0.52, pz);
        pin.castShadow = true;
        houseGroup.add(pil, pin);
      }
    }

    // Stepped rooftop mud-brick parapet walls + crenellated brick coping stones
    const parapetH = 0.38;
    const parapetThick = 0.24;
    const pNorth = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(h.w + 0.14, parapetH, parapetThick)),
      matPlasterTrim,
    );
    pNorth.position.set(0, h.h + parapetH * 0.5, -h.d * 0.5 + parapetThick * 0.25);
    const pSouth = pNorth.clone();
    pSouth.position.z = h.d * 0.5 - parapetThick * 0.25;
    const pWest = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(parapetThick, parapetH, h.d + 0.14)),
      matPlasterTrim,
    );
    pWest.position.set(-h.w * 0.5 + parapetThick * 0.25, h.h + parapetH * 0.5, 0);
    const pEast = pWest.clone();
    pEast.position.x = h.w * 0.5 - parapetThick * 0.25;
    for (const pm of [pNorth, pSouth, pWest, pEast]) {
      pm.castShadow = true;
      pm.receiveShadow = true;
      houseGroup.add(pm);
    }

    const copingStoneGeo = trackGeo(new THREE.BoxGeometry(0.54, 0.12, 0.28));
    const nCopesX = Math.max(3, Math.floor(h.w / 0.85));
    for (let c = 0; c < nCopesX; c++) {
      const cx = -h.w * 0.42 + (c / Math.max(1, nCopesX - 1)) * (h.w * 0.84);
      for (const cz of [-h.d * 0.5 + parapetThick * 0.25, h.d * 0.5 - parapetThick * 0.25]) {
        const stone = new THREE.Mesh(copingStoneGeo, c % 2 === 0 ? matMudWall : matPlasterTrim);
        stone.position.set(cx, h.h + parapetH + 0.05, cz);
        stone.castShadow = true;
        houseGroup.add(stone);
      }
    }
    const nCopesZ = Math.max(3, Math.floor(h.d / 0.85));
    for (let c = 0; c < nCopesZ; c++) {
      const cz = -h.d * 0.42 + (c / Math.max(1, nCopesZ - 1)) * (h.d * 0.84);
      for (const cx of [-h.w * 0.5 + parapetThick * 0.25, h.w * 0.5 - parapetThick * 0.25]) {
        const stone = new THREE.Mesh(copingStoneGeo, c % 2 === 0 ? matMudWall : matPlasterTrim);
        stone.rotation.y = Math.PI / 2;
        stone.position.set(cx, h.h + parapetH + 0.05, cz);
        stone.castShadow = true;
        houseGroup.add(stone);
      }
    }

    // Protruding palm-log structural roof beams
    const beamCount = Math.max(3, Math.floor(h.w / 1.35));
    const beamGeo = trackGeo(new THREE.CylinderGeometry(0.08, 0.08, h.d + 0.85, 6));
    beamGeo.rotateX(Math.PI / 2);
    for (let b = 0; b < beamCount; b++) {
      const bx = -h.w * 0.38 + (b / Math.max(1, beamCount - 1)) * (h.w * 0.76);
      const beam = new THREE.Mesh(beamGeo, matWood);
      beam.position.set(bx, h.h - 0.26, 0);
      beam.castShadow = true;
      houseGroup.add(beam);
    }

    // Rooftop Architecture (Domed Pigeon Tower / Whitewashed Dome OR Reed Pergola + Pots & Sacks)
    if (h.hasDome) {
      const domeR = Math.min(h.w, h.d) * 0.31;
      const domeDrum = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(domeR * 1.04, domeR * 1.08, 0.34, 16)),
        matWhitewash,
      );
      domeDrum.position.y = h.h + 0.18;
      domeDrum.castShadow = true;

      const dome = new THREE.Mesh(
        trackGeo(new THREE.SphereGeometry(domeR, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.54)),
        matWhitewash,
      );
      dome.position.y = h.h + 0.32;
      dome.castShadow = true;

      const finialNeck = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(0.06, 0.14, 0.24, 10)),
        matTerracotta,
      );
      finialNeck.position.y = h.h + 0.32 + domeR + 0.08;
      const finialOrb = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.11, 10, 8)), matBrass);
      finialOrb.position.y = h.h + 0.32 + domeR + 0.26;
      houseGroup.add(domeDrum, dome, finialNeck, finialOrb);

      // Protruding wooden pigeon perches on larger domes
      for (let p = 0; p < 6; p++) {
        const pAng = (p / 6) * Math.PI * 2;
        const perch = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.025, 0.025, 0.36, 5)), matWood);
        perch.rotation.z = Math.PI / 2;
        perch.rotation.y = pAng;
        perch.position.set(
          Math.cos(pAng) * (domeR + 0.08),
          h.h + 0.45,
          Math.sin(pAng) * (domeR + 0.08),
        );
        houseGroup.add(perch);
      }
    } else {
      // Slatted Palm-Reed Rooftop Pergola (تعريشة) + Clay Jars + Burlap Grain Sacks
      const pergW = h.w * 0.46;
      const pergD = h.d * 0.56;
      const px = -h.w * 0.2;
      const pz = -h.d * 0.12;
      const pergPostGeo = trackGeo(new THREE.CylinderGeometry(0.06, 0.07, 1.15, 6));
      for (const ox of [-pergW * 0.45, pergW * 0.45]) {
        for (const oz of [-pergD * 0.45, pergD * 0.45]) {
          const pp = new THREE.Mesh(pergPostGeo, matWood);
          pp.position.set(px + ox, h.h + 0.58, pz + oz);
          pp.castShadow = true;
          houseGroup.add(pp);
        }
      }
      const slatCount = 5;
      const slatGeo = trackGeo(new THREE.BoxGeometry(pergW, 0.07, 0.16));
      for (let s = 0; s < slatCount; s++) {
        const slat = new THREE.Mesh(slatGeo, matWood);
        slat.position.set(px, h.h + 1.16, pz - pergD * 0.4 + (s / (slatCount - 1)) * (pergD * 0.8));
        slat.castShadow = true;
        houseGroup.add(slat);
      }
      addZeerJar(houseGroup, h.w * 0.26, h.h + 0.02, -h.d * 0.22, 0.78);
      const roofKilim = new THREE.Mesh(
        trackGeo(new THREE.PlaneGeometry(Math.min(2.1, h.w * 0.38), Math.min(1.6, h.d * 0.34))),
        matKilim,
      );
      roofKilim.rotation.x = -Math.PI / 2;
      roofKilim.position.set(-h.w * 0.14, h.h + 0.03, h.d * 0.18);
      roofKilim.receiveShadow = true;
      houseGroup.add(roofKilim);

      const roofSack = new THREE.Mesh(trackGeo(new THREE.DodecahedronGeometry(0.32, 0)), matBurlap);
      roofSack.scale.set(1.1, 0.75, 0.9);
      roofSack.position.set(h.w * 0.2, h.h + 0.2, h.d * 0.18);
      roofSack.castShadow = true;
      houseGroup.add(roofSack);
    }

    // Carved Studded Doorway + Arched Adobe Hood + Strutted Awning + Hanging Door Lantern
    const portalGroup = new THREE.Group();
    const doorMesh = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.22, 2.15, 0.18)), matCarvedDoor);
    doorMesh.position.y = 1.1;
    const frameMesh = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.56, 2.42, 0.22)), matPlasterTrim);
    frameMesh.position.y = 1.21;
    const archHood = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.76, 0.76, 0.34, 12, 1, false, 0, Math.PI)), matPlasterTrim);
    archHood.rotation.z = Math.PI / 2;
    archHood.rotation.y = Math.PI / 2;
    archHood.position.set(0, 2.32, 0.12);

    const thresholdStep = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.68, 0.16, 0.44)), matStonePlinth);
    thresholdStep.position.set(0, 0.08, 0.2);

    const awning = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.95, 0.08, 1.05)), matAwning);
    awning.position.set(0, 2.58, 0.52);
    awning.rotation.x = 0.28;
    awning.castShadow = true;

    const strutGeo = trackGeo(new THREE.CylinderGeometry(0.04, 0.04, 0.95, 6));
    for (const sx of [-0.82, 0.82]) {
      const strut = new THREE.Mesh(strutGeo, matWood);
      strut.position.set(sx, 2.18, 0.46);
      strut.rotation.x = -0.82;
      portalGroup.add(strut);
    }

    addLanternAt(portalGroup, 0.92, 2.16, 0.26);
    portalGroup.add(frameMesh, doorMesh, archHood, thresholdStep, awning);

    if (h.doorSide === 'south') {
      portalGroup.position.set(0, 0, h.d * 0.5);
    } else if (h.doorSide === 'north') {
      portalGroup.position.set(0, 0, -h.d * 0.5);
      portalGroup.rotation.y = Math.PI;
    } else if (h.doorSide === 'east') {
      portalGroup.position.set(h.w * 0.5, 0, 0);
      portalGroup.rotation.y = Math.PI / 2;
    } else {
      portalGroup.position.set(-h.w * 0.5, 0, 0);
      portalGroup.rotation.y = -Math.PI / 2;
    }
    houseGroup.add(portalGroup);

    // Multi-Face Glowing Mashrabiya Lattice Windows (on non-door faces!)
    const addMashrabiyaPair = (face: 'south' | 'north' | 'east' | 'west') => {
      const span = face === 'south' || face === 'north' ? h.w : h.d;
      const dist = face === 'south' || face === 'north' ? h.d * 0.5 : h.w * 0.5;
      for (const offset of [-span * 0.26, span * 0.26]) {
        const winG = new THREE.Group();
        const screen = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.88, 0.86, 0.22)), matMashrabiya);
        const sill = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.02, 0.1, 0.34)), matWood);
        sill.position.y = -0.45;
        const hood = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.04, 0.12, 0.32)), matWood);
        hood.position.y = 0.46;
        winG.add(screen, sill, hood);

        winG.position.y = Math.min(2.25, h.h * 0.64);
        if (face === 'south') {
          winG.position.x = offset;
          winG.position.z = dist + 0.05;
        } else if (face === 'north') {
          winG.position.x = offset;
          winG.position.z = -dist - 0.05;
          winG.rotation.y = Math.PI;
        } else if (face === 'east') {
          winG.position.x = dist + 0.05;
          winG.position.z = offset;
          winG.rotation.y = Math.PI / 2;
        } else {
          winG.position.x = -dist - 0.05;
          winG.position.z = offset;
          winG.rotation.y = -Math.PI / 2;
        }
        houseGroup.add(winG);
      }
    };

    if (h.doorSide !== 'south') addMashrabiyaPair('south');
    if (h.doorSide !== 'east') addMashrabiyaPair('east');
    if (h.doorSide !== 'west') addMashrabiyaPair('west');

    // Courtyard Wooden Bench + Wall-Hugging Flowering Shrubs & Barrel/Zeer Props (within plinth margin)
    if (!h.isDepot) {
      if (h.doorSide !== 'south') {
        addCourtyardBench(houseGroup, -h.w * 0.18, 0, h.d * 0.5 + 0.34, 0);
      } else {
        addCourtyardBench(houseGroup, h.w * 0.5 + 0.34, 0, h.d * 0.16, Math.PI / 2);
      }
      addFloweringShrub(
        houseGroup,
        h.doorSide === 'east' ? h.w * 0.5 + 0.24 : -h.w * 0.5 - 0.24,
        0,
        h.d * 0.5 + 0.18,
        0.92,
        true,
      );
      if (hIdx % 2 === 1) {
        addZeerJar(houseGroup, h.w * 0.34, 0, h.d * 0.5 + 0.28, 0.76);
      }
    } else {
      addBarrelAt(houseGroup, -h.w * 0.34, 0, h.d * 0.5 + 0.28, 0.92);
    }

    // Lean a wooden ladder against alternating village/farm house walls (flush within plinth footprint)
    if (hIdx % 2 === 0 && h.doorSide !== 'south') {
      const ladder = new THREE.Group();
      const sideX = h.w * 0.28;
      ladder.position.set(sideX, 0, h.d * 0.5 + 0.24);
      ladder.rotation.x = -0.14;
      for (const lx of [-0.22, 0.22]) {
        const rail = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.035, 0.04, h.h + 0.4, 6)), matWood);
        rail.position.set(lx, (h.h + 0.4) * 0.5, 0);
        rail.castShadow = true;
        ladder.add(rail);
      }
      for (let r = 0; r < 6; r++) {
        const rung = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.025, 0.025, 0.44, 6)), matWood);
        rung.rotation.z = Math.PI / 2;
        rung.position.set(0, 0.45 + r * 0.48, 0);
        ladder.add(rung);
      }
      houseGroup.add(ladder);
    }

    group.add(houseGroup);
  }

  // 4. Obstacles (Detailed Walls, Terraced Cliffs, Supply Crates, Canopy Well, Braced Watchtower)
  let alarmBellMesh!: THREE.Mesh;

  for (const obs of stage.obstacles) {
    if (obs.kind === 'house' || obs.kind === 'depot' || obs.kind === 'water') continue;

    if (obs.kind === 'wall' || obs.kind === 'lowWall') {
      const wallGroup = new THREE.Group();
      wallGroup.position.set(obs.x, 0, obs.z);

      const plinth = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(obs.w + 0.16, Math.min(0.32, obs.h * 0.3), obs.d + 0.16)),
        matStonePlinth,
      );
      plinth.position.y = Math.min(0.32, obs.h * 0.3) * 0.5;
      plinth.receiveShadow = true;

      const base = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(obs.w, obs.h, obs.d)), matMudWall);
      base.position.y = obs.h * 0.5;
      base.castShadow = true;
      base.receiveShadow = true;

      // Segmented mud-brick coping stones along wall top
      const isHorizontal = obs.w >= obs.d;
      const majorSpan = isHorizontal ? obs.w : obs.d;
      const minorSpan = isHorizontal ? obs.d : obs.w;
      const stoneCount = Math.max(2, Math.floor(majorSpan / 0.92));
      const segLen = (majorSpan / stoneCount) * 0.88;
      const segGeo = trackGeo(
        new THREE.BoxGeometry(
          isHorizontal ? segLen : minorSpan + 0.16,
          0.16,
          isHorizontal ? minorSpan + 0.16 : segLen,
        ),
      );
      for (let s = 0; s < stoneCount; s++) {
        const offset = -majorSpan * 0.5 + ((s + 0.5) / stoneCount) * majorSpan;
        const cap = new THREE.Mesh(segGeo, s % 2 === 0 ? matPlasterTrim : matMudWall);
        cap.position.set(isHorizontal ? offset : 0, obs.h + 0.04, isHorizontal ? 0 : offset);
        cap.castShadow = true;
        wallGroup.add(cap);
      }

      wallGroup.add(plinth, base);

      // Decorative protruding wooden tie-beams + barrel/zeer & reed trim on taller mud walls
      if (obs.kind === 'wall' && obs.w > 2.8) {
        const pegCount = Math.min(5, Math.floor(obs.w / 1.8));
        const pegGeo = trackGeo(new THREE.CylinderGeometry(0.055, 0.055, obs.d + 0.34, 6));
        pegGeo.rotateX(Math.PI / 2);
        for (let p = 0; p < pegCount; p++) {
          const px = -obs.w * 0.38 + (p / Math.max(1, pegCount - 1)) * (obs.w * 0.76);
          const peg = new THREE.Mesh(pegGeo, matWood);
          peg.position.set(px, obs.h * 0.76, 0);
          wallGroup.add(peg);
        }
        addBarrelAt(wallGroup, -obs.w * 0.3, 0, obs.d * 0.5 + 0.24, 0.85);
        addZeerJar(wallGroup, -obs.w * 0.14, 0, obs.d * 0.5 + 0.24, 0.75);
      } else if (obs.kind === 'lowWall' && isHorizontal) {
        addReedFenceWing(wallGroup, 0, 0.02, obs.d * 0.5 + 0.08, Math.min(2.6, obs.w * 0.62), 0);
        addFloweringShrub(wallGroup, obs.w * 0.42, 0, obs.d * 0.5 + 0.18, 0.72, true);
      }
      group.add(wallGroup);
    } else if (obs.kind === 'cliff') {
      const cliffGroup = new THREE.Group();
      cliffGroup.position.set(obs.x, 0, obs.z);

      // 3-tier terraced desert sandstone rock strata
      const tier1 = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(Math.min(obs.w, obs.d) * 0.48, Math.min(obs.w, obs.d) * 0.56, obs.h * 0.42, 7)),
        matCliff,
      );
      tier1.scale.set(obs.w / Math.min(obs.w, obs.d), 1, obs.d / Math.min(obs.w, obs.d));
      tier1.position.y = obs.h * 0.21;
      tier1.castShadow = true;
      tier1.receiveShadow = true;

      const tier2 = new THREE.Mesh(
        trackGeo(new THREE.CylinderGeometry(Math.min(obs.w, obs.d) * 0.38, Math.min(obs.w, obs.d) * 0.46, obs.h * 0.34, 7)),
        matCliff,
      );
      tier2.scale.set(obs.w / Math.min(obs.w, obs.d), 1, obs.d / Math.min(obs.w, obs.d));
      tier2.position.set(0.12, obs.h * 0.58, -0.08);
      tier2.castShadow = true;

      const rockCap = new THREE.Mesh(
        trackGeo(new THREE.DodecahedronGeometry(Math.min(obs.w, obs.d) * 0.36, 0)),
        matCliff,
      );
      rockCap.scale.set(obs.w / Math.min(obs.w, obs.d), 0.65, obs.d / Math.min(obs.w, obs.d));
      rockCap.position.set(-0.08, obs.h * 0.84, 0.06);
      rockCap.castShadow = true;

      cliffGroup.add(tier1, tier2, rockCap);
      group.add(cliffGroup);
    } else if (obs.kind === 'crates') {
      const crateGroup = new THREE.Group();
      crateGroup.position.set(obs.x, 0, obs.z);

      const c1 = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(obs.w * 0.5, obs.h, obs.d * 0.8)), matTealCrate);
      c1.position.set(-obs.w * 0.2, obs.h * 0.5, 0);
      c1.castShadow = true;
      c1.receiveShadow = true;

      const c1Brace = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(obs.w * 0.54, 0.1, obs.d * 0.12)),
        matTealCrate,
      );
      c1Brace.position.set(-obs.w * 0.2, obs.h * 0.5, obs.d * 0.41);
      c1Brace.rotation.z = 0.62;

      const c1TopRim = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(obs.w * 0.54, 0.09, obs.d * 0.84)),
        matTealCrate,
      );
      c1TopRim.position.set(-obs.w * 0.2, obs.h * 0.94, 0);

      const c2 = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(obs.w * 0.36, obs.h * 0.72, obs.d * 0.66)), matTealCrate);
      c2.position.set(obs.w * 0.22, obs.h * 0.36, 0.08);
      c2.castShadow = true;

      const sack = new THREE.Mesh(trackGeo(new THREE.DodecahedronGeometry(0.28, 0)), matBurlap);
      sack.scale.set(1.15, 0.75, 0.9);
      sack.position.set(obs.w * 0.22, obs.h * 0.84, 0.08);
      sack.castShadow = true;

      addBarrelAt(crateGroup, -obs.w * 0.46, 0, -obs.d * 0.28, 0.82);
      addZeerJar(crateGroup, obs.w * 0.36, 0, -obs.d * 0.28, 0.88);
      crateGroup.add(c1, c1Brace, c1TopRim, c2, sack);
      group.add(crateGroup);
    } else if (obs.kind === 'well') {
      const wellGroup = new THREE.Group();
      wellGroup.position.set(obs.x, 0, obs.z);
      const baseStep = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(1.18, 1.24, 0.16, 16)), matStonePlinth);
      baseStep.position.y = 0.08;
      baseStep.receiveShadow = true;
      const rim = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.95, 1.06, 0.92, 16)), matStonePlinth);
      rim.position.y = 0.52;
      rim.castShadow = true;
      const coping = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(0.92, 0.1, 8, 20)), matPlasterTrim);
      coping.rotation.x = Math.PI / 2;
      coping.position.y = 0.98;
      const water = new THREE.Mesh(trackGeo(new THREE.CircleGeometry(0.78, 16)), matWater);
      water.rotation.x = -Math.PI / 2;
      water.position.y = 0.9;
      const postL = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.14, 1.55, 0.14)), matWood);
      postL.position.set(-0.78, 1.5, 0);
      postL.castShadow = true;
      const postR = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.14, 1.55, 0.14)), matWood);
      postR.position.set(0.78, 1.5, 0);
      postR.castShadow = true;
      const crossbar = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.07, 0.07, 1.75, 8)), matWood);
      crossbar.rotation.z = Math.PI / 2;
      crossbar.position.set(0, 2.05, 0);
      const canopy = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.95, 0.1, 1.35)), matAwning);
      canopy.position.set(0, 2.34, 0);
      canopy.castShadow = true;
      const bucket = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.18, 0.14, 0.28, 10)), matWood);
      bucket.position.set(0, 1.45, 0);
      addZeerJar(wellGroup, 0.92, 0, 0.65, 0.72);
      wellGroup.add(baseStep, rim, coping, water, postL, postR, crossbar, canopy, bucket);
      group.add(wellGroup);
    } else if (obs.kind === 'tower') {
      const tower = new THREE.Group();
      tower.position.set(obs.x, 0, obs.z);

      const stoneBase = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(2.85, 0.55, 2.85)), matStonePlinth);
      stoneBase.position.y = 0.275;
      stoneBase.receiveShadow = true;
      const lower = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(2.55, 2.9, 2.55)), matMudWall);
      lower.position.y = 1.45;
      lower.castShadow = true;
      lower.receiveShadow = true;

      // Diagonal timber corbels supporting the deck
      const braceGeo = trackGeo(new THREE.BoxGeometry(0.14, 0.85, 0.14));
      for (const sx of [-1.05, 1.05]) {
        for (const sz of [-1.28, 1.28]) {
          const br = new THREE.Mesh(braceGeo, matWood);
          br.position.set(sx, 2.7, sz);
          br.rotation.x = sz > 0 ? 0.52 : -0.52;
          tower.add(br);
        }
      }

      const platform = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(3.25, 0.26, 3.25)), matWood);
      platform.position.y = 3.04;
      platform.castShadow = true;

      for (const sz of [-1.52, 1.52]) {
        const rail = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(3.15, 0.44, 0.14)), matWood);
        rail.position.set(0, 3.36, sz);
        tower.add(rail);
      }
      for (const sx of [-1.52, 1.52]) {
        const rail = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.14, 0.44, 3.15)), matWood);
        rail.position.set(sx, 3.36, 0);
        tower.add(rail);
      }

      const postGeo = trackGeo(new THREE.BoxGeometry(0.18, 2.1, 0.18));
      for (const sx of [-1.28, 1.28]) {
        for (const sz of [-1.28, 1.28]) {
          const p = new THREE.Mesh(postGeo, matWood);
          p.position.set(sx, 4.1, sz);
          p.castShadow = true;
          tower.add(p);
        }
      }

      const canopy = new THREE.Mesh(trackGeo(new THREE.ConeGeometry(2.65, 1.2, 4)), matAwning);
      canopy.rotation.y = Math.PI / 4;
      canopy.position.y = 5.65;
      canopy.castShadow = true;
      const spire = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.14, 10, 8)), matBrass);
      spire.position.y = 6.28;

      addLanternAt(tower, 0, 4.72, 1.32);
      addLanternAt(tower, 0, 4.72, -1.32);
      tower.add(stoneBase, lower, platform, canopy, spire);
      group.add(tower);
    }
  }

  // Alarm Bell & Hitbox
  alarmBellMesh = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.15, 0.32, 0.46, 16)), matBrass);
  alarmBellMesh.position.set(stage.secondaryTargetPos.x, 1.85, stage.secondaryTargetPos.z);
  alarmBellMesh.castShadow = true;
  group.add(alarmBellMesh);

  const bellHitMesh = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.95, 0.95, 2.5, 8)),
    trackMat(new THREE.MeshBasicMaterial({ visible: false })),
  );
  bellHitMesh.position.set(stage.secondaryTargetPos.x, 1.25, stage.secondaryTargetPos.z);
  bellHitMesh.userData.interact = 'secondary';
  group.add(bellHitMesh);

  // 5. Primary Objective Prop & Floating Beacon
  const primaryPropGroup = new THREE.Group();
  primaryPropGroup.position.set(stage.primaryTargetPos.x, 0, stage.primaryTargetPos.z);

  if (stage.primaryObjectiveType === 'intel') {
    const table = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.4, 0.72, 0.92)), matWood);
    table.position.y = 0.36;
    table.castShadow = true;
    const docs = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(0.62, 0.08, 0.46)),
      trackMat(new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.55 })),
    );
    docs.position.set(-0.15, 0.76, 0.05);
    docs.rotation.y = 0.14;
    addLanternAt(primaryPropGroup, 0.42, 0.85, -0.18);

    const hit = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(1.4, 1.5, 1.1)),
      trackMat(new THREE.MeshBasicMaterial({ visible: false })),
    );
    hit.position.y = 0.75;
    hit.userData.interact = 'primary';
    primaryPropGroup.add(table, docs, hit);
  } else if (stage.primaryObjectiveType === 'sabotage') {
    const barrelMat = trackMat(new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.48, metalness: 0.34 }));
    for (const bx of [-0.42, 0.42]) {
      const barrel = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.32, 0.34, 0.96, 16)), barrelMat);
      barrel.position.set(bx, 0.48, 0);
      barrel.castShadow = true;
      const hoop = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(0.34, 0.025, 6, 16)), matBrass);
      hoop.rotation.x = Math.PI / 2;
      hoop.position.set(bx, 0.72, 0);
      primaryPropGroup.add(barrel, hoop);
    }
    const hit = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(1.6, 1.5, 1.2)),
      trackMat(new THREE.MeshBasicMaterial({ visible: false })),
    );
    hit.position.y = 0.75;
    hit.userData.interact = 'primary';
    primaryPropGroup.add(hit);
  }
  group.add(primaryPropGroup);

  const primaryBeaconMesh = new THREE.Mesh(
    trackGeo(new THREE.OctahedronGeometry(0.32, 0)),
    trackMat(
      new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        emissive: 0xd97706,
        emissiveIntensity: 0.78,
        roughness: 0.22,
        metalness: 0.78,
      }),
    ),
  );
  primaryBeaconMesh.position.set(stage.primaryTargetPos.x, 2.75, stage.primaryTargetPos.z);
  group.add(primaryBeaconMesh);

  // 6. Cover Zones (Spoked Hay Carts, Teal Supply Crates, Oak Barrels, Tied Haystacks & Flowering Shrubs)
  const coverZonePads: THREE.Mesh[] = [];
  for (const cz of stage.coverZones) {
    const czGroup = new THREE.Group();
    czGroup.position.set(cz.x, 0, cz.z);
    const pad = new THREE.Mesh(
      trackGeo(new THREE.CircleGeometry(cz.radius, 18)),
      trackMat(
        new THREE.MeshBasicMaterial({
          color: 0x3f6b36,
          transparent: true,
          opacity: 0.2,
          depthWrite: false,
          polygonOffset: true,
          polygonOffsetFactor: -1,
        }),
      ),
    );
    pad.rotation.x = -Math.PI / 2;
    pad.position.y = 0.025;
    czGroup.add(pad);
    coverZonePads.push(pad);

    if (cz.label.includes('عربة')) {
      addHayCart(czGroup, 0, 0, 0, 0.28);
      addFloweringShrub(czGroup, -0.95, 0, -0.75, 0.7, false);
    } else if (cz.label.includes('صناديق') || cz.label.includes('براميل')) {
      const box1 = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.88, 0.78, 0.88)), matTealCrate);
      box1.position.set(-0.42, 0.39, 0.2);
      box1.castShadow = true;
      const box2 = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.68, 0.56, 0.68)), matTealCrate);
      box2.position.set(-0.38, 1.06, 0.22);
      box2.rotation.y = 0.25;
      box2.castShadow = true;
      czGroup.add(box1, box2);
      addBarrelAt(czGroup, 0.58, 0, -0.15, 0.94);
      addFloweringShrub(czGroup, 0.65, 0, 0.62, 0.68, false);
    } else {
      for (let i = 0; i < 3; i++) {
        const ang = (i / 3) * Math.PI * 2 + 0.4;
        const bx = Math.cos(ang) * 0.84;
        const bz = Math.sin(ang) * 0.84;
        const bale = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.45, 0.54, 0.74, 10)), matHay);
        bale.scale.set(1.12, 1, 0.92);
        bale.position.set(bx, 0.37, bz);
        bale.castShadow = true;
        const rope = new THREE.Mesh(trackGeo(new THREE.TorusGeometry(0.48, 0.035, 6, 12)), matWood);
        rope.rotation.x = Math.PI / 2;
        rope.position.set(bx, 0.37, bz);
        czGroup.add(bale, rope);
      }
      addFloweringShrub(czGroup, 0, 0, 0, 0.85, true);
    }
    group.add(czGroup);
  }

  // 7. Instanced Date Palms with Curved Feathered Pinnate Fronds + Courtyard Brick Planters
  if (stage.palms.length > 0) {
    const palmCount = stage.palms.length;
    const trunkGeo = trackGeo(new THREE.CylinderGeometry(0.18, 0.38, 5.4, 10));
    trunkGeo.translate(0, 2.7, 0);
    const matPalmTrunk = trackMat(
      new THREE.MeshStandardMaterial({ map: textures.palmBark, roughness: 0.92, metalness: 0.0 }),
    );
    const trunkInst = new THREE.InstancedMesh(trunkGeo, matPalmTrunk, palmCount);
    trunkInst.castShadow = true;

    // Build arched curved palm frond blade (extends along +Z from z=0 to z=3.15)
    const frondGeo = trackGeo(new THREE.PlaneGeometry(1.38, 3.15, 2, 6));
    frondGeo.rotateX(Math.PI / 2);
    frondGeo.translate(0, 0, 1.575);
    const posAttr = frondGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const vx = posAttr.getX(i);
      const vz = posAttr.getZ(i);
      const t = vz / 3.15;
      // Graceful arch + central midrib V-fold
      const archY = Math.sin(t * Math.PI * 0.72) * 0.38 - t * t * 1.15 - Math.abs(vx) * 0.16;
      posAttr.setY(i, archY);
    }
    frondGeo.computeVertexNormals();

    const frondsPerPalm = 10;
    const frondInst = new THREE.InstancedMesh(frondGeo, matPalmFrond, palmCount * frondsPerPalm);
    frondInst.castShadow = true;

    const dateGeo = trackGeo(new THREE.SphereGeometry(0.24, 6, 6));
    const matDates = trackMat(new THREE.MeshStandardMaterial({ color: 0xd4851d, roughness: 0.65 }));
    const dateInst = new THREE.InstancedMesh(dateGeo, matDates, palmCount * 3);

    const dummy = new THREE.Object3D();
    const frondColor = new THREE.Color();

    stage.palms.forEach((p, idx) => {
      dummy.position.set(p.x, 0, p.z);
      dummy.rotation.set(0.05 * Math.sin(p.rot), p.rot, 0.05 * Math.cos(p.rot));
      dummy.scale.setScalar(p.scale);
      dummy.updateMatrix();
      trunkInst.setMatrixAt(idx, dummy.matrix);

      // Low mud-brick courtyard planter around in-bounds palms (safely clear of canal)
      const nearCanal = stage.canalZ !== undefined && Math.abs(p.z - stage.canalZ) < 2.4;
      if (Math.abs(p.x) < 19 && Math.abs(p.z) < 19 && !nearCanal) {
        const planter = new THREE.Mesh(
          trackGeo(new THREE.BoxGeometry(1.42, 0.32, 1.42)),
          matMudWall,
        );
        planter.position.set(p.x, 0.16, p.z);
        planter.castShadow = true;
        planter.receiveShadow = true;
        const planterTrim = new THREE.Mesh(
          trackGeo(new THREE.BoxGeometry(1.5, 0.08, 1.5)),
          matPlasterTrim,
        );
        planterTrim.position.set(p.x, 0.34, p.z);
        group.add(planter, planterTrim);
        addFloweringShrub(group, p.x + 0.36, 0.32, p.z + 0.34, 0.72, idx % 2 === 0);
      }

      const crownY = 5.25 * p.scale;
      for (let d = 0; d < 3; d++) {
        const dAng = p.rot + (d / 3) * Math.PI * 2;
        dummy.position.set(
          p.x + Math.cos(dAng) * 0.32,
          crownY - 0.34,
          p.z + Math.sin(dAng) * 0.32,
        );
        dummy.rotation.set(0, dAng, 0);
        dummy.scale.set(0.75 * p.scale, 1.25 * p.scale, 0.75 * p.scale);
        dummy.updateMatrix();
        dateInst.setMatrixAt(idx * 3 + d, dummy.matrix);
      }

      for (let f = 0; f < frondsPerPalm; f++) {
        const isUpperRing = f >= 6;
        const ringCount = isUpperRing ? 4 : 6;
        const ringIdx = isUpperRing ? f - 6 : f;
        const fAng = p.rot + (ringIdx / ringCount) * Math.PI * 2 + (isUpperRing ? 0.42 : 0);
        dummy.position.set(p.x, crownY + (isUpperRing ? 0.18 : 0), p.z);
        dummy.rotation.set(isUpperRing ? -0.38 : 0.05, fAng, 0);
        dummy.scale.setScalar(p.scale * (isUpperRing ? 0.86 : 1.08));
        dummy.updateMatrix();
        const fIdx = idx * frondsPerPalm + f;
        frondInst.setMatrixAt(fIdx, dummy.matrix);
        frondColor.setHSL(0.26 + (f % 3) * 0.015, 0.46, 0.78 + ((idx + f) % 3) * 0.08);
        frondInst.setColorAt(fIdx, frondColor);
      }
    });

    trunkInst.instanceMatrix.needsUpdate = true;
    trunkInst.computeBoundingSphere();
    frondInst.instanceMatrix.needsUpdate = true;
    if (frondInst.instanceColor) frondInst.instanceColor.needsUpdate = true;
    frondInst.computeBoundingSphere();
    dateInst.instanceMatrix.needsUpdate = true;
    dateInst.computeBoundingSphere();
    group.add(trunkInst, frondInst, dateInst);
  }

  // 8. Perimeter Sandstone Mesas + Lush Multi-Lobe Flowering Desert Shrubs
  const cliffCount = 26;
  const cliffGeo = trackGeo(new THREE.DodecahedronGeometry(3.6, 0));
  const cliffInst = new THREE.InstancedMesh(cliffGeo, matCliff, cliffCount);
  cliffInst.receiveShadow = true;
  const dummy = new THREE.Object3D();
  for (let i = 0; i < cliffCount; i++) {
    const a = (i / cliffCount) * Math.PI * 2;
    const rad = 32 + (i % 3) * 4.5;
    dummy.position.set(Math.cos(a) * rad, 1.2, Math.sin(a) * rad);
    dummy.rotation.set(0, a, 0);
    dummy.scale.set(1.6 + (i % 2) * 0.7, 0.7 + (i % 3) * 0.45, 1.3);
    dummy.updateMatrix();
    cliffInst.setMatrixAt(i, dummy.matrix);
  }
  cliffInst.instanceMatrix.needsUpdate = true;
  cliffInst.computeBoundingSphere();
  group.add(cliffInst);

  // Lush leafy bushes & bougainvillea blossoms framing perimeter edges
  const scrubCount = 36;
  const scrubGeo = trackGeo(new THREE.DodecahedronGeometry(0.42, 1));
  scrubGeo.translate(0, 0.3, 0);
  const scrubInst = new THREE.InstancedMesh(scrubGeo, matShrubLeaf, scrubCount);
  scrubInst.castShadow = true;
  for (let i = 0; i < scrubCount; i++) {
    const a = (i / scrubCount) * Math.PI * 2 + 0.17;
    const rad = 21.5 + (i % 4) * 2.2;
    dummy.position.set(Math.cos(a) * rad, 0, Math.sin(a) * rad);
    dummy.rotation.set(0, a, 0);
    dummy.scale.set(1.1 + (i % 3) * 0.3, 0.8 + (i % 3) * 0.25, 1.0 + (i % 2) * 0.35);
    dummy.updateMatrix();
    scrubInst.setMatrixAt(i, dummy.matrix);
  }
  scrubInst.instanceMatrix.needsUpdate = true;
  scrubInst.computeBoundingSphere();
  group.add(scrubInst);

  // 9. Extraction Zone Ring
  const extGeo = trackGeo(
    new THREE.RingGeometry(stage.extractionZone.radius - 0.35, stage.extractionZone.radius, 36),
  );
  extGeo.rotateX(-Math.PI / 2);
  const extractionRing = new THREE.Mesh(
    extGeo,
    trackMat(
      new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.85,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    ),
  );
  extractionRing.position.set(stage.extractionZone.x, 0.04, stage.extractionZone.z);
  extractionRing.renderOrder = 2;
  group.add(extractionRing);

  // 10. Scout Patrol Lines
  const patrolLinesGroup = new THREE.Group();
  patrolLinesGroup.visible = false;
  const lineMat = trackMat(
    new THREE.LineDashedMaterial({
      color: 0xfbbf24,
      dashSize: 0.7,
      gapSize: 0.4,
    }),
  );
  for (const gp of stage.guardPatrols) {
    if (gp.waypoints.length < 2) continue;
    const pts = gp.waypoints.map((p) => new THREE.Vector3(p.x, 0.16, p.z));
    if (gp.waypoints.length > 2) pts.push(pts[0].clone());
    const lGeo = trackGeo(new THREE.BufferGeometry().setFromPoints(pts));
    const line = new THREE.Line(lGeo, lineMat);
    line.computeLineDistances();
    patrolLinesGroup.add(line);
  }
  group.add(patrolLinesGroup);

  return {
    group,
    alarmBellMesh,
    bellHitMesh,
    primaryPropGroup,
    primaryBeaconMesh,
    extractionRing,
    patrolLinesGroup,
    coverZonePads,
    dispose: () => {
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
    },
  };
}
