# Project Plan & Architecture Decisions — SAIDI COMMANDOS

## 1. MVP Scope & Architectural Decisions

### Why Procedural 3D Models + Three.js for the Web MVP?
- **Zero-404 Reliability:** Shipping unverified external `.glb` URLs risks CORS blocks or broken paths in web previews. Building **composite 6–12 part articulated `THREE.Group` characters and modular mud-brick architecture** directly in Three.js guarantees instant startup (`< 200ms`), `100%` offline/sandbox reliability, crisp silhouettes from an isometric angle, and full animation state control (`Idle`, `Walk`, `Run`, `Crouch`, `Sneak`, `Action`, `KO`).
- **Seamless GLB Upgrade Path:** Every character controller and map builder abstracts mesh creation behind factory interfaces (`src/characters/characterMesh.ts`, `src/maps/villageBuilder.ts`), making future `GLTFLoader` + `AnimationMixer` swaps drop-in via `public/assets/`.

### Hero Trio Balance Decision (Leader + Infiltrator + Scout)
For the 3-hero MVP roster, **Bakri (الكشاف — Scout)** was chosen over a pure Heavy Fighter:
- **Hamdan (حمدان — القائد / Leader):** Balanced speed, **Tactical Whistle (`[Q]`)** to lure guards to a target zone, and strong **Naboot Strike** capable of subduing alerted guards in melee.
- **Salem (سالم — المتسلل / Infiltrator):** Fastest crouch/sneak speed, lowest detection profile behind low walls/crates, **Pebble Throw (`[Q]`)** for pinpoint distraction, and silent rear/flank knockout.
- **Bakri (بكري — الكشاف / Scout):** **Scout Survey (`[Q]`)** reveals every guard's full patrol path & extended sight status through walls for 8 seconds, boosts nearby team awareness, and carries a silent sling/takedown capability.
- *Rationale:* In a stealth-first *Commandos* MVP, **Survey + Distraction + Direct Leadership** creates interlocking tactical synergies (Scout maps patrols -> Infiltrator lures & sneaks -> Leader coordinates extraction) without turning the village into a loud shooter.

---

## 2. Core Gameplay Systems Implemented

| System | Module | Details |
| :--- | :--- | :--- |
| **3D Engine & Lighting** | `src/engine/sceneManager.ts` | `WebGLRenderer` with `ACESFilmicToneMapping`, `SRGBColorSpace`, `RoomEnvironment` PMREM reflections, warm sun key + cool sky/sand `HemisphereLight`, horizon fog, and `isSoftwareGl` guard (`afterDraw` sync pacing). |
| **2.5D Isometric Camera** | `src/engine/cameraController.ts` | Narrow-FOV (`28°`) isometric camera with damped WASD/Arrow pan, right/middle-drag pan, wheel zoom (`12m–34m`), `Q/E`-free `[` `]` or `Z`/`X` rotation, and `Space` snap-to-hero. |
| **Grid Navigation & A*** | `src/movement/pathfinding.ts` | `0.5m` resolution walkability grid (`88x88`) covering the `44x44m` village, A* with octile heuristic + line-of-sight path smoothing. |
| **Dynamic Vision Cones** | `src/stealth/vision.ts` | 2D radial raycasting against all building/wall AABBs (`64` rays per guard) so ground vision cones visibly clip against mud-brick walls, houses, and tall obstacles! Separate crouch-height cover checks (`coverHeight >= 1.0m`). |
| **Guard AI & Noise** | `src/enemies/guardAI.ts` | 6 patrolling guards with waypoints, pause/look scans, sound investigation (`?` suspicious state), alert escalation (`!` alarm state), and ranged/melee engagement. |
| **Mission & Objectives** | `src/missions/missionManager.ts` | Stage 1 (*Al-Karam Village*): Rescue prisoner **Sheikh Mansour** from the northern courtyard, optional **Disable Alarm Bell** on watchtower, and extract to the **Southern Felucca Gate**. |
| **Procedural Audio** | `src/engine/audio.ts` | Zero-asset Web Audio API synthesizer with mute toggle for footsteps, whistle, pebble impact, guard suspicion/alert stings, knockout thud, and victory chord. |
| **Isolated Game Loop + HUD** | `src/game/GameEngine.ts`, `src/ui/` | Game simulation runs in `requestAnimationFrame` decoupled from React; React receives throttled HUD snapshots (~15Hz + immediate state events) rendered in a collapsible bottom command dock. |

---

## 3. Execution Phases & Milestones

- **Phase A (Asset Research & Catalog):** Completed — documented in `docs/ASSET_CATALOG.md`.
- **Phase B (Blender Pipeline Specification):** Completed — documented in `docs/BLENDER_PIPELINE.md`.
- **Phase C (Playable 3D Prototype MVP):** Implemented — full village, 3 heroes, 6 guards, raycasted vision cones, A* pathfinding, stealth/crouch/cover, distractions, alarm bell, VIP rescue, extraction, Victory/Defeat & Retry loop.

---

## 4. Known Limitations & Next Steps (Post-MVP)
1. **External GLB Models:** Currently using multi-part procedural Three.js rigs; Stage 2 can replace them with Blender-customized Quaternius/Polyfork GLBs via `GLTFLoader`.
2. **Additional Stages:** Currently includes Stage 1 (*قرية الكرم*). Stages 2–4 (*المعسكر*, *المزارع*, *الجبل*) can be added as data configs in `src/maps/`.
3. **Save/Load Checkpoints:** Full mid-mission quick-save (`F5`) can serialize hero/guard states to `localStorage`.
