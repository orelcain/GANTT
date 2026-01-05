import type { Task } from "../lib/types";

function daysBetween(startIso: string, endIso: string): number {
  const start = new Date(startIso + "T00:00:00");
  const end = new Date(endIso + "T00:00:00");
  const ms = end.getTime() - start.getTime();
  const days = Math.round(ms / (1000 * 60 * 60 * 24));
  return Math.max(1, days || 1);
}

export function Reports({ tasks }: { tasks: Task[] }) {
  const totalWeight = tasks.reduce((acc, t) => acc + daysBetween(t.start, t.end), 0);
  const weightedProgress =
    totalWeight === 0
      ? 0
      : tasks.reduce((acc, t) => acc + (t.progress / 100) * daysBetween(t.start, t.end), 0) /
        totalWeight;

  const byAssignee = new Map<string, { count: number; avg: number }>();
  for (const t of tasks) {
    const who = (t.assignee ?? "Sin asignar").trim() || "Sin asignar";
    const cur = byAssignee.get(who) ?? { count: 0, avg: 0 };
    const nextCount = cur.count + 1;
    const nextAvg = (cur.avg * cur.count + t.progress) / nextCount;
    byAssignee.set(who, { count: nextCount, avg: nextAvg });
  }

  const rows = [...byAssignee.entries()].sort((a, b) => b[1].count - a[1].count);

  return (
    <section>
      <h2>Reportes</h2>
      <p>
        <strong>Avance global (ponderado por duración):</strong> {Math.round(weightedProgress * 100)}%
      </p>
      <h3>Avance por responsable</h3>
      <table>
        <thead>
          <tr>
            <th>Responsable</th>
            <th>Tareas</th>
            <th>Promedio %</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([who, r]) => (
            <tr key={who}>
              <td>{who}</td>
              <td>{r.count}</td>
              <td>{Math.round(r.avg)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
