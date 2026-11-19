# Asset Catalog & Licensing Ledger — SAIDI COMMANDOS

> **Compliance Policy:** Every external asset source must be verified for format, rig compatibility, and commercial licensing before inclusion in `public/assets/`. No unverified or unknown-license binaries are shipped in the runtime bundle. For the playable Web MVP, all active 3D geometry, textures, and audio are **100% procedurally generated in TypeScript/Three.js** (zero-404, zero external runtime dependencies), while the catalog below documents the vetted external GLB/glTF pipeline sources for Stage 2 art upgrades.

---

## 1. Runtime MVP Assets (Active in Current Build — 100% Procedural, Original IP)

| Asset ID | Category | Implementation | Parts / Geometry | Textures / Materials | License | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `hero_hamdan` | Characters | `src/characters/characterMesh.ts` | 11-part articulated `THREE.Group` (pelvis, gallabiya torso, sash, head, turban, mustache, left/right arms, left/right legs, Naboot staff) | PBR `MeshStandardMaterial` + procedural fabric roughness | Original IP (MIT / Project) | Active in MVP |
| `hero_salem` | Characters | `src/characters/characterMesh.ts` | 11-part articulated `THREE.Group` (olive gallabiya, leather pouch, wrapped scarf, limbs, pebble/dagger) | PBR `MeshStandardMaterial` | Original IP (MIT / Project) | Active in MVP |
| `hero_bakri` | Characters | `src/characters/characterMesh.ts` | 12-part articulated `THREE.Group` (cream gallabiya, terracotta vest, keffiyeh, brass spyglass, limbs) | PBR `MeshStandardMaterial` | Original IP (MIT / Project) | Active in MVP |
| `guard_enforcer` | Enemies | `src/characters/characterMesh.ts` | 11-part articulated `THREE.Group` (khaki tunic, belt, cap/tarboosh, mustache, rifle, articulated limbs) | PBR `MeshStandardMaterial` | Original IP (MIT / Project) | Active in MVP |
| `vip_sheikh_mansour` | Characters | `src/characters/characterMesh.ts` | Articulated prisoner VIP sitting/standing mesh with cloak & headwrap | PBR `MeshStandardMaterial` | Original IP (MIT / Project) | Active in MVP |
| `modular_mud_house` | Buildings | `src/maps/villageBuilder.ts` | Stone plinth, mud-brick walls, wooden roof beams, crenellated parapet / mud dome, recessed wooden door, lattice shutters | Procedural Mud-Brick & Wood `CanvasTexture` (`SRGBColorSpace`) | Original IP (MIT / Project) | Active in MVP |
| `modular_courtyard_wall` | Buildings | `src/maps/villageBuilder.ts` | Low & high adobe perimeter walls with stone cap & wooden gateposts | Procedural Mud-Brick `CanvasTexture` | Original IP (MIT / Project) | Active in MVP |
| `watchtower_alarm` | Buildings | `src/maps/villageBuilder.ts` | Timber-framed mud watchtower, ladder, wooden platform, brass alarm bell | Procedural Mud-Brick + Brushed Brass PBR | Original IP (MIT / Project) | Active in MVP |
| `saidi_date_palm` | Environment | `src/maps/villageBuilder.ts` | Segmented curved trunk + fiber crown + radiating arched fronds + date clusters (`InstancedMesh`) | Per-instance scale & tint variation | Original IP (MIT / Project) | Active in MVP |
| `zeer_clay_jars` | Props | `src/maps/villageBuilder.ts` | `LatheGeometry` clay *zeer* water jars on timber stands | Terracotta clay PBR (`roughness: 0.78`) | Original IP (MIT / Project) | Active in MVP |
| `wooden_crates_carts` | Props | `src/maps/villageBuilder.ts` | Multi-slat cargo crates, reed cover bundles, hay cart | Procedural Wood `CanvasTexture` | Original IP (MIT / Project) | Active in MVP |
| `desert_terrain_cliffs` | Environment | `src/maps/villageBuilder.ts` | Extended sand ground (`160m x 160m`), dirt alleyways, distant mud cliffs & horizon palm belt | Procedural Sand/Cobble `CanvasTexture` (`anisotropy: max`) | Original IP (MIT / Project) | Active in MVP |
| `sfx_procedural_audio` | Audio | `src/engine/audio.ts` | Web Audio API synth (footsteps, whistle, pebble clink, alert sting, knockout thud, victory oud chord) | Procedural synthesis | Original IP (MIT / Project) | Active in MVP |

---

## 2. Evaluated External 3D Asset Sources (For Stage 2 Blender GLB Upgrades)

> Note: Automated external binary downloading is intentionally disabled unless explicitly verified and downloaded locally. Below are the verified repository findings from our Phase A research.

| Source | URL | Supported Formats | Verified License & Key Terms | Rigged / Animations | Download Status | Usage Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Polyfork** | https://polyfork.dev/ | GLB (glTF 2.0), FBX, USDZ, OBJ | Commercial-friendly custom license; free for games/apps **without attribution**. Restriction: cannot resell/redistribute standalone assets. | Mixed (static props + modular assets) | Research Complete (Not bundled in MVP) | Primary candidate for modular props & desert architecture upgrades; inspect per-asset card before export. |
| **Quaternius** | https://quaternius.com/ | glTF / GLB, FBX, OBJ, Blend | **CC0 1.0 Universal (Public Domain)** / QAL; commercial use allowed, no attribution required. Cannot resell raw packs. | Yes (Low-poly rigged characters + base animations) | Research Complete (Not bundled in MVP) | Ideal base humanoid mesh (`Universal Base Characters`) to modify in Blender into Upper Egyptian gallabiya silhouettes. |
| **Kenney** | https://kenney.nl/assets | GLB / glTF, FBX, OBJ | **CC0 1.0 Universal (Public Domain)** across asset packs; commercial use allowed without attribution. | Modular kits / Simple characters | Research Complete (Not bundled in MVP) | Great for prototype crates, barrels, fences, and modular architectural trim after re-texturing for mud-brick style. |
| **Sketchfab** | https://sketchfab.com/ | glTF / GLB, FBX | Per-model license (**CC-BY 4.0**, **CC0**, or **CC-BY-NC** — must filter out NC/ND!). | Varies per upload | Research Complete (Selective inspection required) | Use strictly for specialized hero props (traditional *zeer* pottery, wooden carts, brass lanterns) with CC0 or CC-BY 4.0 only. |
| **Mixamo** | https://www.mixamo.com/ | FBX (needs Blender conversion to GLB) | Royalty-free Adobe terms for games/films; cannot redistribute raw animations as standalone assets. | Humanoid Skeleton + Motion Clips (Idle, Walk, Run, Crouch, Aim) | Research Complete (Requires FBX->GLB retargeting) | Retarget clips onto unified Quaternius/custom rig in Blender NLA editor and export as a single `.glb`. |
