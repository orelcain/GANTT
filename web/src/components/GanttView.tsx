import { useEffect, useMemo, useRef, useState } from "react";
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

const VIEW_MODES: ViewMode[] = ["Day", "Week", "Month"];
const VIEW_MODE_LABELS: Record<ViewMode, string> = {
  Day: "Día",
  Week: "Semana",
  Month: "Mes"
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
  const [currentViewMode, setCurrentViewMode] = useState<ViewMode>(viewMode);

  // Filtrar tareas visibles (excluir hijos de padres colapsados)
  const visibleTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (!t.parentId) return true; // Root tasks siempre visibles
      const parent = tasks.find((p) => p.id === t.parentId);
      return !parent?.collapsed; // Mostrar solo si padre no está colapsado
    });
  }, [tasks]);

  const { criticalIds, hasCycle } = useMemo(() => computeCriticalPath(visibleTasks), [visibleTasks]);

  // Determinar estado de cada tarea para aplicar colores
  const getTaskStatus = (task: Task): string => {
    if (task.type === "milestone") return "milestone";
    
    const today = new Date().toISOString().split("T")[0];
    const isOverdue = task.end < today && task.progress < 100;
    
    if (task.progress === 100) return "completed";
    if (isOverdue) return "overdue";
    if (task.progress > 0 && task.progress < 100) return "in-progress";
    return "pending";
  };

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = "";

    const data = visibleTasks.map((t) => {
      const isMilestone = t.type === "milestone";
      const taskStatus = getTaskStatus(t);
      let customClass = `task-${taskStatus}`;
      
      if (showCriticalPath && criticalIds.has(t.id)) {
        customClass += " is-critical";
      }
      if (isMilestone) {
        customClass += " milestone";
      }
      if (t.color) {
        customClass += " custom-color";
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
      view_mode: currentViewMode,
      language: "es",
      bar_height: 20,
      bar_corner_radius: 3,
      padding: 18,
      
      // Tooltips enriquecidos - estilo GanttPRO
      custom_popup_html: (task: any) => {
        const originalTask = visibleTasks.find((t) => t.id === task.id);
        if (!originalTask) return task.name;
        
        const isMilestone = originalTask.type === "milestone";
        const taskStatus = getTaskStatus(originalTask);
        const statusIcons: Record<string, string> = {
          completed: "✓",
          "in-progress": "⏳",
          overdue: "⚠",
          pending: "○"
        };
        const statusLabels: Record<string, string> = {
          completed: "Completado",
          "in-progress": "En Progreso",
          overdue: "Atrasado",
          pending: "Pendiente"
        };
        
        // Calcular duración en días
        const duration = !isMilestone 
          ? Math.ceil((new Date(originalTask.end).getTime() - new Date(originalTask.start).getTime()) / (1000 * 60 * 60 * 24)) + 1
          : 0;
        
        return `
          <div class="tooltip-header">
            ${isMilestone ? "🎯" : "📝"} ${task.name}
          </div>
          <div class="tooltip-body">
            <div class="tooltip-row">
              <span class="tooltip-label">Tipo:</span>
              <span class="tooltip-value">${isMilestone ? "Milestone" : "Tarea"}</span>
            </div>
            ${!isMilestone ? `
              <div class="tooltip-row">
                <span class="tooltip-label">Estado:</span>
                <span class="tooltip-value">${statusIcons[taskStatus] || ""} ${statusLabels[taskStatus] || originalTask.status || "N/A"}</span>
              </div>
            ` : ""}
            <div class="tooltip-row">
              <span class="tooltip-label">Inicio:</span>
              <span class="tooltip-value">${new Date(originalTask.start).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
            </div>
            ${!isMilestone ? `
              <div class="tooltip-row">
                <span class="tooltip-label">Fin:</span>
                <span class="tooltip-value">${new Date(originalTask.end).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
              </div>
              <div class="tooltip-row">
                <span class="tooltip-label">Duración:</span>
                <span class="tooltip-value">${duration} día${duration !== 1 ? 's' : ''}</span>
              </div>
              <div class="tooltip-row">
                <span class="tooltip-label">Progreso:</span>
                <span class="tooltip-value">
                  <div style="display: flex; align-items: center; gap: 6px;">
                    <div style="flex: 1; height: 6px; background: #e1e4e8; border-radius: 3px; overflow: hidden;">
                      <div style="height: 100%; background: ${originalTask.progress === 100 ? '#36b37e' : originalTask.progress > 50 ? '#4c9aff' : '#ffab00'}; width: ${originalTask.progress}%;"></div>
                    </div>
                    <span style="font-weight: 700; min-width: 35px;">${Math.round(originalTask.progress)}%</span>
                  </div>
                </span>
              </div>
            ` : ""}
            ${originalTask.assignee ? `
              <div class="tooltip-row">
                <span class="tooltip-label">Responsable:</span>
                <span class="tooltip-value">👤 ${originalTask.assignee}</span>
              </div>
            ` : ""}
            ${originalTask.dependencies.length > 0 ? `
              <div class="tooltip-row">
                <span class="tooltip-label">Dependencias:</span>
                <span class="tooltip-value">${originalTask.dependencies.join(", ")}</span>
              </div>
            ` : ""}
          </div>
        `;
      },

      // Drag & drop para cambiar fechas
      on_date_change: (task: any, start: Date, end: Date) => {
        const originalTask = visibleTasks.find((t) => t.id === task.id);
        if (!originalTask || !onTaskChange) return;

        const startStr = start.toISOString().split("T")[0];
        const endStr = end.toISOString().split("T")[0];

        onTaskChange(originalTask, { start: startStr, end: endStr });
      },

      // Drag vertical para cambiar progreso
      on_progress_change: (task: any, progress: number) => {
        const originalTask = visibleTasks.find((t) => t.id === task.id);
        if (!originalTask || !onTaskChange || originalTask.type === "milestone") return;

        onTaskChange(originalTask, { progress });
      },

      // Click en barra
      on_click: (task: any) => {
        const originalTask = visibleTasks.find((t) => t.id === task.id);
        if (!originalTask || !onTaskClick) return;

        onTaskClick(originalTask);
      },
    });

    ganttInstanceRef.current = gantt;
  }, [visibleTasks, currentViewMode, showCriticalPath, criticalIds, onTaskChange, onTaskClick]);

  // Sincronizar con prop externa
  useEffect(() => {
    setCurrentViewMode(viewMode);
  }, [viewMode]);

  const handleZoomIn = () => {
    const currentIndex = VIEW_MODES.indexOf(currentViewMode);
    if (currentIndex > 0) {
      setCurrentViewMode(VIEW_MODES[currentIndex - 1]);
    }
  };

  const handleZoomOut = () => {
    const currentIndex = VIEW_MODES.indexOf(currentViewMode);
    if (currentIndex < VIEW_MODES.length - 1) {
      setCurrentViewMode(VIEW_MODES[currentIndex + 1]);
    }
  };

  const handleFitView = () => {
    // Intenta ajustar la vista automáticamente
    if (ganttInstanceRef.current) {
      ganttInstanceRef.current.refresh(visibleTasks);
    }
  };

  return (
    <div style={{ padding: 16, overflow: "auto", position: "relative" }}>
      {/* Controles de zoom - estilo GanttPRO */}
      <div className="zoom-controls">
        <button 
          onClick={handleZoomIn}
          disabled={currentViewMode === VIEW_MODES[0]}
          title="Acercar"
        >
          +
        </button>
        <button 
          onClick={handleZoomOut}
          disabled={currentViewMode === VIEW_MODES[VIEW_MODES.length - 1]}
          title="Alejar"
        >
          −
        </button>
        <div className="separator" />
        <button 
          onClick={handleFitView}
          title="Ajustar vista"
          style={{ fontSize: 14 }}
        >
          ⊡
        </button>
        <div className="separator" />
        <span style={{ fontSize: 11, color: "var(--color-text-muted)", padding: "0 6px", fontWeight: 600 }}>
          {VIEW_MODE_LABELS[currentViewMode]}
        </span>
      </div>

      {hasCycle && (
        <p style={{ color: "#d73a49", marginBottom: 12, fontSize: 14 }}>
          ⚠ Hay un ciclo en las dependencias (ruta crítica no disponible).
        </p>
      )}
      <div ref={containerRef} />
    </div>
  );
}
