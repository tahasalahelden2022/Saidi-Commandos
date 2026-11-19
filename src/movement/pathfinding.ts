import type { ObstacleBox, Vec2 } from '../types/game';

interface HeapNode {
  idx: number;
  f: number;
}

export class NavGrid {
  public readonly cellSize = 0.5;
  public readonly halfExtent = 22; // -22 .. +22m -> 44m x 44m
  public readonly cols: number;
  public readonly rows: number;
  private blocked: Uint8Array;

  constructor(obstacles: ObstacleBox[], actorRadius = 0.42) {
    this.cols = Math.round((this.halfExtent * 2) / this.cellSize);
    this.rows = this.cols;
    this.blocked = new Uint8Array(this.cols * this.rows);

    for (const obs of obstacles) {
      if (!obs.blocksMovement) continue;
      const minX = obs.x - obs.w * 0.5 - actorRadius;
      const maxX = obs.x + obs.w * 0.5 + actorRadius;
      const minZ = obs.z - obs.d * 0.5 - actorRadius;
      const maxZ = obs.z + obs.d * 0.5 + actorRadius;

      const c0 = Math.max(0, Math.floor((minX + this.halfExtent) / this.cellSize));
      const c1 = Math.min(this.cols - 1, Math.floor((maxX + this.halfExtent) / this.cellSize));
      const r0 = Math.max(0, Math.floor((minZ + this.halfExtent) / this.cellSize));
      const r1 = Math.min(this.rows - 1, Math.floor((maxZ + this.halfExtent) / this.cellSize));

      for (let r = r0; r <= r1; r++) {
        for (let c = c0; c <= c1; c++) {
          this.blocked[r * this.cols + c] = 1;
        }
      }
    }

    // Perimeter safety margin
    for (let i = 0; i < this.cols; i++) {
      this.blocked[i] = 1;
      this.blocked[(this.rows - 1) * this.cols + i] = 1;
      this.blocked[i * this.cols] = 1;
      this.blocked[i * this.cols + (this.cols - 1)] = 1;
    }
  }

  public worldToCell(x: number, z: number): { c: number; r: number } {
    const c = Math.max(
      0,
      Math.min(this.cols - 1, Math.floor((x + this.halfExtent) / this.cellSize)),
    );
    const r = Math.max(
      0,
      Math.min(this.rows - 1, Math.floor((z + this.halfExtent) / this.cellSize)),
    );
    return { c, r };
  }

  public cellToWorld(c: number, r: number): Vec2 {
    return {
      x: -this.halfExtent + (c + 0.5) * this.cellSize,
      z: -this.halfExtent + (r + 0.5) * this.cellSize,
    };
  }

  public isBlockedCell(c: number, r: number): boolean {
    if (c < 0 || r < 0 || c >= this.cols || r >= this.rows) return true;
    return this.blocked[r * this.cols + c] === 1;
  }

  public isWalkableWorld(x: number, z: number): boolean {
    const { c, r } = this.worldToCell(x, z);
    return !this.isBlockedCell(c, r);
  }

  public findNearestWalkableCell(c: number, r: number, maxRadius = 10): { c: number; r: number } | null {
    if (!this.isBlockedCell(c, r)) return { c, r };
    for (let rad = 1; rad <= maxRadius; rad++) {
      let best: { c: number; r: number } | null = null;
      let bestDist = Infinity;
      for (let dr = -rad; dr <= rad; dr++) {
        for (let dc = -rad; dc <= rad; dc++) {
          if (Math.abs(dr) !== rad && Math.abs(dc) !== rad) continue;
          const nc = c + dc;
          const nr = r + dr;
          if (!this.isBlockedCell(nc, nr)) {
            const d2 = dc * dc + dr * dr;
            if (d2 < bestDist) {
              bestDist = d2;
              best = { c: nc, r: nr };
            }
          }
        }
      }
      if (best) return best;
    }
    return null;
  }

  public hasLineOfSight(a: Vec2, b: Vec2): boolean {
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    const dist = Math.hypot(dx, dz);
    if (dist < 0.1) return true;
    const steps = Math.ceil(dist / (this.cellSize * 0.45));
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      if (!this.isWalkableWorld(a.x + dx * t, a.z + dz * t)) {
        return false;
      }
    }
    return true;
  }

  public findPath(start: Vec2, goal: Vec2): Vec2[] {
    const startRaw = this.worldToCell(start.x, start.z);
    const goalRaw = this.worldToCell(goal.x, goal.z);

    const sCell = this.findNearestWalkableCell(startRaw.c, startRaw.r, 6);
    const gCell = this.findNearestWalkableCell(goalRaw.c, goalRaw.r, 8);
    if (!sCell || !gCell) return [];

    if (sCell.c === gCell.c && sCell.r === gCell.r) {
      return [this.cellToWorld(gCell.c, gCell.r)];
    }

    const total = this.cols * this.rows;
    const gScore = new Float32Array(total).fill(Infinity);
    const cameFrom = new Int32Array(total).fill(-1);
    const closed = new Uint8Array(total);

    const startIdx = sCell.r * this.cols + sCell.c;
    const goalIdx = gCell.r * this.cols + gCell.c;
    gScore[startIdx] = 0;

    const heap: HeapNode[] = [{ idx: startIdx, f: this.heuristic(sCell.c, sCell.r, gCell.c, gCell.r) }];

    const dirs = [
      [1, 0, 1],
      [-1, 0, 1],
      [0, 1, 1],
      [0, -1, 1],
      [1, 1, 1.4142],
      [1, -1, 1.4142],
      [-1, 1, 1.4142],
      [-1, -1, 1.4142],
    ];

    let found = false;
    let guardIterations = 0;

    while (heap.length > 0 && guardIterations < 8000) {
      guardIterations++;
      const current = this.popMin(heap);
      if (current.idx === goalIdx) {
        found = true;
        break;
      }
      if (closed[current.idx]) continue;
      closed[current.idx] = 1;

      const cr = Math.floor(current.idx / this.cols);
      const cc = current.idx % this.cols;

      for (let i = 0; i < dirs.length; i++) {
        const dc = dirs[i][0];
        const dr = dirs[i][1];
        const cost = dirs[i][2];
        const nc = cc + dc;
        const nr = cr + dr;

        if (this.isBlockedCell(nc, nr)) continue;
        // Prevent corner cutting on diagonals
        if (dc !== 0 && dr !== 0) {
          if (this.isBlockedCell(cc + dc, cr) || this.isBlockedCell(cc, cr + dr)) {
            continue;
          }
        }

        const nIdx = nr * this.cols + nc;
        if (closed[nIdx]) continue;

        const tentativeG = gScore[current.idx] + cost;
        if (tentativeG < gScore[nIdx]) {
          cameFrom[nIdx] = current.idx;
          gScore[nIdx] = tentativeG;
          const f = tentativeG + this.heuristic(nc, nr, gCell.c, gCell.r);
          this.pushHeap(heap, { idx: nIdx, f });
        }
      }
    }

    if (!found) return [];

    const rawPath: Vec2[] = [];
    let cur = goalIdx;
    while (cur !== -1 && cur !== startIdx) {
      const r = Math.floor(cur / this.cols);
      const c = cur % this.cols;
      rawPath.push(this.cellToWorld(c, r));
      cur = cameFrom[cur];
    }
    rawPath.reverse();

    if (rawPath.length <= 2) return rawPath;
    return this.smoothPath(start, rawPath);
  }

  private smoothPath(start: Vec2, path: Vec2[]): Vec2[] {
    const smoothed: Vec2[] = [];
    let anchor = start;
    let i = 0;

    while (i < path.length) {
      let furthest = i;
      for (let j = path.length - 1; j > i; j--) {
        if (this.hasLineOfSight(anchor, path[j])) {
          furthest = j;
          break;
        }
      }
      smoothed.push(path[furthest]);
      anchor = path[furthest];
      i = furthest + 1;
    }

    return smoothed;
  }

  private heuristic(c1: number, r1: number, c2: number, r2: number): number {
    const dx = Math.abs(c1 - c2);
    const dy = Math.abs(r1 - r2);
    return dx + dy + (1.4142 - 2) * Math.min(dx, dy);
  }

  private pushHeap(heap: HeapNode[], node: HeapNode): void {
    heap.push(node);
    let i = heap.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (heap[p].f <= heap[i].f) break;
      const tmp = heap[p];
      heap[p] = heap[i];
      heap[i] = tmp;
      i = p;
    }
  }

  private popMin(heap: HeapNode[]): HeapNode {
    const top = heap[0];
    const last = heap.pop()!;
    if (heap.length > 0) {
      heap[0] = last;
      let i = 0;
      const len = heap.length;
      while (true) {
        const l = i * 2 + 1;
        const r = l + 1;
        let smallest = i;
        if (l < len && heap[l].f < heap[smallest].f) smallest = l;
        if (r < len && heap[r].f < heap[smallest].f) smallest = r;
        if (smallest === i) break;
        const tmp = heap[i];
        heap[i] = heap[smallest];
        heap[smallest] = tmp;
        i = smallest;
      }
    }
    return top;
  }
}
