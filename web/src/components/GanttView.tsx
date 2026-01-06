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
  onTaskChange?: (task: Task, changes: { start?: string; end?: string; progress?: number }) => void;
  onTaskClick?: (task: Task) => void;
};

export function GanttView({
  tasks,
  viewMode = "Day",
  showCriticalPath = false,
  onTaskChange,
  onTaskClick,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const ganttInstanceRef = useRef<any>(null);

  const { criticalIds, hasCycle } = useMemo(() => computeCriticalPath(tasks), [tasks]);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = "";

    const data = tasks.map((t) => {
      const isMilestone = t.type === "milestone";
      let customClass = "";
      
      if (showCriticalPath && criticalIds.has(t.id)) {
        customClass = "is-critical";
      }
      if (isMilestone) {
        customClass += (customClass ? " " : "") + "milestone";
      }
      if (t.color) {
        customClass += (customClass ? " " : "") + "custom-color";
      }

      return {
        id: t.id,
        name: t.name,
        start: t.start,
        end: isMilestone ? t.start : t.end, // Milestones duran 1 día
        progress: isMilestone ? 100 : t.progress,
        dependencies: t.dependencies.join(","),
        custom_class: customClass.trim(),
      };
    });

    const gantt = new Gantt(containerRef.current, data, {
      view_mode: viewMode,
      language: "es",
      bar_height: 20,
      bar_corner_radius: 3,
      padding: 18,
      
      // Tooltips personalizados
      custom_popup_html: (task: any) => {
        const originalTask = tasks.find((t) => t.id === task.id);
        if (!originalTask) return task.name;
        
        const isMilestone = originalTask.type === "milestone";
        return `
          <div style="padding: 8px; min-width: 200px;">
            <div style="font-weight: 600; margin-bottom: 6px;">${task.name}</div>
            <div style="font-size: 12px; color: #586069;">
              ${isMilestone ? "🔷 Milestone" : "📋 Tarea"}
            </div>
            <div style="font-size: 12px; margin-top: 4px;">
              <strong>Inicio:</strong> ${originalTask.start}
            </div>
            ${!isMilestone ? `<div style="font-size: 12px;"><strong>Fin:</strong> ${originalTask.end}</div>` : ""}
            ${!isMilestone ? `<div style="font-size: 12px;"><strong>Progreso:</strong> ${Math.round(originalTask.progress)}%</div>` : ""}
            ${originalTask.assignee ? `<div style="font-size: 12px;"><strong>Responsable:</strong> ${originalTask.assignee}</div>` : ""}
            ${originalTask.status ? `<div style="font-size: 12px;"><strong>Estado:</strong> ${originalTask.status}</div>` : ""}
            ${originalTask.dependencies.length > 0 ? `<div style="font-size: 12px;"><strong>Deps:</strong> ${originalTask.dependencies.join(", ")}</div>` : ""}
          </div>
        `;
      },

      // Drag & drop para cambiar fechas
      on_date_change: (task: any, start: Date, end: Date) => {
        const originalTask = tasks.find((t) => t.id === task.id);
        if (!originalTask || !onTaskChange) return;

        const startStr = start.toISOString().split("T")[0];
        const endStr = end.toISOString().split("T")[0];

        onTaskChange(originalTask, { start: startStr, end: endStr });
      },

      // Drag vertical para cambiar progreso
      on_progress_change: (task: any, progress: number) => {
        const originalTask = tasks.find((t) => t.id === task.id);
        if (!originalTask || !onTaskChange || originalTask.type === "milestone") return;

        onTaskChange(originalTask, { progress });
      },

      // Click en barra
      on_click: (task: any) => {
        const originalTask = tasks.find((t) => t.id === task.id);
        if (!originalTask || !onTaskClick) return;

        onTaskClick(originalTask);
      },
    });

    ganttInstanceRef.current = gantt;
  }, [tasks, viewMode, showCriticalPath, criticalIds, onTaskChange, onTaskClick]);

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
