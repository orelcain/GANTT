import type { Task, TaskId } from "./types";

function daysBetween(startIso: string, endIso: string): number {
  const start = new Date(startIso + "T00:00:00");
  const end = new Date(endIso + "T00:00:00");
  const ms = end.getTime() - start.getTime();
  const days = Math.round(ms / (1000 * 60 * 60 * 24));
  return Math.max(1, days || 1);
}

export function computeCriticalPath(tasks: Task[]): {
  criticalIds: Set<TaskId>;
  hasCycle: boolean;
} {
  const byId = new Map<TaskId, Task>();
  for (const t of tasks) byId.set(t.id, t);

  // Build graph (deps -> task)
  const out = new Map<TaskId, TaskId[]>();
  const indeg = new Map<TaskId, number>();
  const preds = new Map<TaskId, TaskId[]>();

  for (const t of tasks) {
    out.set(t.id, []);
    indeg.set(t.id, 0);
    preds.set(t.id, []);
  }

  for (const t of tasks) {
    for (const d of t.dependencies) {
      if (!byId.has(d)) continue;
      out.get(d)!.push(t.id);
      indeg.set(t.id, (indeg.get(t.id) ?? 0) + 1);
      preds.get(t.id)!.push(d);
    }
  }

  // Kahn topo sort
  const q: TaskId[] = [];
  for (const [id, deg] of indeg) if (deg === 0) q.push(id);

  const order: TaskId[] = [];
  while (q.length) {
    const id = q.shift()!;
    order.push(id);
    for (const nxt of out.get(id) ?? []) {
      const nd = (indeg.get(nxt) ?? 0) - 1;
      indeg.set(nxt, nd);
      if (nd === 0) q.push(nxt);
    }
  }

  if (order.length !== tasks.length) {
    return { criticalIds: new Set(), hasCycle: true };
  }

  // Longest path DP (duration-weighted)
  const dist = new Map<TaskId, number>();
  const parent = new Map<TaskId, TaskId | null>();

  for (const id of order) {
    const task = byId.get(id)!;
    const dur = daysBetween(task.start, task.end);

    let bestPred: TaskId | null = null;
    let best = 0;
    for (const p of preds.get(id) ?? []) {
      const cand = dist.get(p) ?? 0;
      if (cand > best) {
        best = cand;
        bestPred = p;
      }
    }
    dist.set(id, best + dur);
    parent.set(id, bestPred);
  }

  // Find sink with max dist
  let maxId: TaskId | null = null;
  let maxDist = -Infinity;
  for (const [id, v] of dist) {
    if (v > maxDist) {
      maxDist = v;
      maxId = id;
    }
  }

  const criticalIds = new Set<TaskId>();
  let cur = maxId;
  while (cur) {
    criticalIds.add(cur);
    cur = parent.get(cur) ?? null;
  }

  return { criticalIds, hasCycle: false };
}
