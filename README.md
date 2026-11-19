# SAIDI COMMANDOS — صعيدي كوماندوز

A **2.5D Isometric Tactical Stealth Web Game** inspired by *Commandos*, featuring original heroes and 4 distinct stages grounded in the architecture and atmosphere of **Upper Egypt (صعيد مصر)**. Built with **Three.js**, **React**, and **TypeScript** — playable directly in the browser with zero external binary dependencies.

---

## Campaign Stages (All 4 Playable)

1. **١. قرية الكرم (Al-Karam Village):** Mud-brick alleyways, domes, central well, watchtower bell, 6 guards — rescue **الشيخ منصور** and extract.
2. **٢. معسكر التل (Al-Tal Outpost):** Fortified camp perimeter, supply depots, 7 guards — steal the secret documents from HQ and extract.
3. **٣. مزارع الترعة (Canal Farms):** Crop plots, irrigation canal with timber bridges, 7 guards — rescue the captured farmer and escape.
4. **٤. مخبأ الجبل (Mountain Hideout):** Rocky canyon choke points, 8 guards — plant explosives on the powder depot and flee to the southern pass.

---

## Controls

| Input | Action |
| :--- | :--- |
| **Left Click (Hero)** or `1` / `2` / `3` | Select active hero |
| **Left Click (Ground)** | Walk to target location |
| **Double Click** or `Shift + Click` | Sprint to target location (generates noise) |
| **Left Click (Guard / Objective)** or `E` | Move to & interact / silent knockout |
| `Q` | Activate selected hero's special skill |
| `C` | Toggle Crouch / Stealth stance |
| `G` | Rally Squad (move surviving team to active hero) |
| `F5` / `F9` | Quick Save / Quick Load mission state (`localStorage`) |
| `WASD` / `Arrow Keys` / Right-Drag / Minimap Click | Pan camera |
| **Mouse Wheel** | Zoom camera |
| `Z` / `X` | Rotate camera view |
| `Space` | Center camera on active hero |
| `H` | Collapse / Expand bottom command dock |
| `Esc` | Pause / Resume |

---

## Local Development & Build

```bash
npm install
npm run dev
npm run lint
npm run build
```
