# Blender Asset Pipeline — SAIDI COMMANDOS

This document defines the standardized Blender-to-Three.js (`.glb`) asset production workflow for upgrading or adding external 3D models into `public/assets/`.

---

## 1. World Scale, Origin & Orientation Standards

| Parameter | Standard Value | Rationale |
| :--- | :--- | :--- |
| **Units** | Metric (`1 Blender Unit = 1 Meter`) | Matches Three.js navigation grid (`0.5m` cells) and camera frustum |
| **Character Height** | `1.75m – 1.85m` | Clean readability from 2.5D isometric camera (`~28m` distance) |
| **Forward Axis** | `+Z` Forward, `+Y` Up | Aligns directly with `Object3D.lookAt()` and guard vision cone math |
| **Pivot / Origin** | **Bottom-Center `(0, 0, 0)`** | Ensures every hero, guard, house, palm, and jar sits flush at `y = 0` without floating |
| **Applied Transforms** | `Ctrl+A -> All Transforms` | Scale must be `(1, 1, 1)` and Rotation `(0, 0, 0)` before export |

---

## 2. Directory Structure (`public/assets/`)

```text
public/assets/
├── characters/   # Hero GLBs (hero_hamdan.glb, hero_salem.glb, hero_bakri.glb)
├── enemies/      # Guard GLBs (guard_rifle.glb, guard_officer.glb)
├── weapons/      # Naboot, sling, rifle, lantern attachments
├── animations/   # Shared humanoid animation library (if split)
├── buildings/    # Modular mud-brick wall, corner, door, dome, watchtower
├── environment/  # Date palms, rocks, desert shrubs, Nile cliff pieces
├── props/        # Clay zeer jars, wooden crates, hay carts, barrels
└── effects/      # Decals / sprite sheets if needed
```

---

## 3. Character Customization & Unified Rigging

1. **Base Mesh Import:** Import vetted CC0 base mesh (e.g., Quaternius Universal Character) into Blender.
2. **Upper Egyptian Silhouette Sculpting (Not Just Recoloring):**
   - Model flowing **Gallabiya** lower skirt with knee split/weight-painting so crouch and sprint legs never clip.
   - Add distinct silhouette markers readable at isometric distance:
     - **Hamdan (Leader):** Wrapped white turban (`عمامة`), indigo tunic, woven waist sash, *Naboot* wooden staff.
     - **Salem (Infiltrator):** Dark olive tunic, wrapped *shal* scarf, leather pebble satchel.
     - **Bakri (Scout):** Cream tunic, terracotta vest, desert keffiyeh, brass spyglass.
     - **Guards:** Khaki militia uniform, dark belt/holster, distinct red/dark *tarboosh* or cap so enemies read immediately at a glance.
3. **Unified Bone Naming:** Standardize Mixamo/Rigify bone names (`Hips`, `Spine`, `Chest`, `Neck`, `Head`, `LeftShoulder`, `LeftArm`, `LeftForeArm`, `LeftHand`, `RightShoulder`, `RightArm`, `RightForeArm`, `RightHand`, `LeftUpLeg`, `LeftLeg`, `LeftFoot`, `RightUpLeg`, `RightLeg`, `RightFoot`).
4. **Required Animation Clips (Baked into NLA Tracks):**
   - `Idle` (loop)
   - `Walk` (loop, root motion stripped — in-place!)
   - `Run` (loop, in-place)
   - `CrouchIdle` & `CrouchWalk` (loop, in-place)
   - `Action` (single-shot: throw pebble / whistle / knockout strike)
   - `Hit` & `Death` / `Knockout` (clamp when finished)

---

## 4. Modular Environment & LOD Rules

- **Modular Snap Grid:** Build walls and house facades on `2.0m` or `4.0m` increments (`wall_straight_4m.glb`, `wall_corner_2m.glb`, `door_arch_2m.glb`).
- **Triangle Budgets:**
  - Characters: `1,500 – 3,500` triangles
  - Buildings (modular piece): `300 – 1,200` triangles
  - Props (jars, crates): `100 – 400` triangles
- **Materials & Textures:**
  - Pack ORM maps (`Occlusion / Roughness / Metallic`) into a single texture when possible.
  - Resize diffuse maps to `512x512` (props/characters) or `1024x1024` (terrain/buildings).
  - Use **WebP** or **Draco + KTX2** compression during glTF export.

---

## 5. glTF / GLB Export & Verification Checklist

1. Select only exportable meshes + armature (exclude cameras/lights).
2. `File -> Export -> glTF 2.0 (.glb)`:
   - Format: `glTF Binary (.glb)`
   - Include: `Selected Objects`
   - Transform: `+Y Up` enabled
   - Mesh: `Apply Modifiers`, `UVs`, `Normals`
   - Animation: `NLA Tracks` enabled, `Always Sample Animations` enabled
   - Compression: `Draco` enabled (level 6)
3. Verify the exported `.glb` in an isolated Three.js viewer (`gltf-viewer` or local test route) checking scale, ground contact (`y = 0`), shadow casting, and animation crossfades before registering in `docs/ASSET_CATALOG.md`.
