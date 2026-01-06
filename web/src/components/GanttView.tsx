import { useEffect, useMemo, useRef } from "react";
// @ts-expect-error frappe-gantt no trae tipos TS en el paquete
import Gantt from "frappe-gantt";

import { computeCriticalPath } from "../lib/criticalPath";
import type { Task } from "../lib/types";

export type ViewMode = "Day" | "Week" | "Month";

type Props = {
  tasks: Task[];
  viewMode?: ViewMode;
  showCriticalPath?: boolean;
};

export function GanttView({ tasks, viewMode = "Day", showCriticalPath = false }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const { criticalIds, hasCycle } = useMemo(() => computeCriticalPath(tasks), [tasks]);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = "";

    const data = tasks.map((t) => ({
      id: t.id,
      name: t.name,
      start: t.start,
      end: t.end,
      progress: t.progress,
      dependencies: t.dependencies.join(","),
      custom_class: showCriticalPath && criticalIds.has(t.id) ? "is-critical" : "",
    }));

    // eslint-disable-next-line no-new
    new Gantt(containerRef.current, data, {
      view_mode: viewMode,
      language: "es",
    });
  }, [tasks, viewMode, showCriticalPath, criticalIds]);

  return (
    <div style={{ padding: 16, overflow: "auto" }}>
      {hasCycle && (
        <p style={{ color: "#d73a49", marginBottom: 12, fontSize: 14 }}>
          ⚠ Hay un ciclo en las dependencias (ruta crítica no disponible).
        </p>
      )}
      <div ref={containerRef} />
    </div>
  );
}
