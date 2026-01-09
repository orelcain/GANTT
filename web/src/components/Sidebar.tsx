import { useState } from "react";

import { ImportExcel } from "./ImportExcel";
import { MembersAdmin } from "./MembersAdmin";
import { ExportMenu } from "./ExportMenu";
import { TagsManager } from "./TagsManager";
import { BaselineManager } from "./BaselineManager";

import type { SheetTab } from "./Toolbar";
import type { ViewMode } from "./GanttView";
import type { Task } from "../lib/types";
import { useGanttStore } from "../lib/store";

type Props = {
  sheetTab: SheetTab;
  onSheetTabChange: (tab: SheetTab) => void;

  canEdit: boolean;
  canManageUsers: boolean;

  // Timeline
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  timelineRange: "recomendado" | "todo" | "3m" | "6m" | "12m";
  onTimelineRangeChange: (range: "recomendado" | "todo" | "3m" | "6m" | "12m") => void;
  timelineShownCount: number;
  timelineTotalCount: number;
  showCriticalPath: boolean;
  onToggleCriticalPath: () => void;

  // Vistas
  showDashboard: boolean;
  setShowDashboard: (v: boolean) => void;
  showKanban: boolean;
  setShowKanban: (v: boolean) => void;
  showCalendar: boolean;
  setShowCalendar: (v: boolean) => void;
  showResources: boolean;
  setShowResources: (v: boolean) => void;

  // Acciones
  taskCount: number;
  tasks: Task[];
  onCreateTask?: () => void;
  onCreateMilestone?: () => void;
};

export function Sidebar({
  sheetTab,
  onSheetTabChange,
  canEdit,
  canManageUsers,
  viewMode,
  onViewModeChange,
  timelineRange,
  onTimelineRangeChange,
  timelineShownCount,
  timelineTotalCount,
  showCriticalPath,
  onToggleCriticalPath,
  showDashboard,
  setShowDashboard,
  showKanban,
  setShowKanban,
  showCalendar,
  setShowCalendar,
  showResources,
  setShowResources,
  taskCount,
  tasks,
  onCreateTask,
  onCreateMilestone,
}: Props) {
  const { baselines, activeBaselineId } = useGanttStore();
  const [showTagsManager, setShowTagsManager] = useState(false);
  const [showBaselineManager, setShowBaselineManager] = useState(false);

  const setExclusiveView = (view: "dashboard" | "kanban" | "calendar" | "resources") => {
    const isDashboard = view === "dashboard";
    const isKanban = view === "kanban";
    const isCalendar = view === "calendar";
    const isResources = view === "resources";

    const nextDashboard = isDashboard ? !showDashboard : false;
    const nextKanban = isKanban ? !showKanban : false;
    const nextCalendar = isCalendar ? !showCalendar : false;
    const nextResources = isResources ? !showResources : false;

    setShowDashboard(nextDashboard);
    setShowKanban(nextKanban);
    setShowCalendar(nextCalendar);
    setShowResources(nextResources);
  };

  const clearViews = () => {
    setShowDashboard(false);
    setShowKanban(false);
    setShowCalendar(false);
    setShowResources(false);
  };

  return (
    <aside className="appSidebar" aria-label="Navegación">
      <div className="sidebarSection">
        <div className="sidebarTitle">Hojas</div>
        <button
          className={sheetTab === "tareas" ? "primary" : undefined}
          onClick={() => {
            clearViews();
            onSheetTabChange("tareas");
          }}
        >
          🧾 Tareas
        </button>
        <button
          className={sheetTab === "timeline" ? "primary" : undefined}
          onClick={() => {
            clearViews();
            onSheetTabChange("timeline");
          }}
        >
          📈 Timeline
        </button>
        <button
          className={sheetTab === "settings" ? "primary" : undefined}
          onClick={() => {
            clearViews();
            onSheetTabChange("settings");
          }}
        >
          ⚙️ Settings
        </button>
      </div>

      <div className="sidebarSection">
        <div className="sidebarTitle">Vistas</div>
        <button className={showDashboard ? "primary" : undefined} onClick={() => setExclusiveView("dashboard")}
          title="Ver dashboard">
          📊 Dashboard
        </button>
        <button className={showKanban ? "primary" : undefined} onClick={() => setExclusiveView("kanban")}
          title="Ver Kanban">
          📋 Kanban
        </button>
        <button className={showCalendar ? "primary" : undefined} onClick={() => setExclusiveView("calendar")}
          title="Ver Calendario">
          📅 Calendario
        </button>
        <button className={showResources ? "primary" : undefined} onClick={() => setExclusiveView("resources")}
          title="Ver Recursos">
          👥 Recursos
        </button>
      </div>

      <div className="sidebarSection">
        <div className="sidebarTitle">Timeline</div>
        <label className="sidebarField">
          <span>Vista</span>
          <select value={viewMode} onChange={(e) => onViewModeChange(e.target.value as ViewMode)}>
            <option value="Day">Día</option>
            <option value="Week">Semana</option>
            <option value="Month">Mes</option>
          </select>
        </label>

        <label className="sidebarField">
          <span>Rango</span>
          <select
            value={timelineRange}
            onChange={(e) => onTimelineRangeChange(e.target.value as Props["timelineRange"])}
          >
            <option value="recomendado">Recomendado</option>
            <option value="3m">Últimos 3 meses</option>
            <option value="6m">Últimos 6 meses</option>
            <option value="12m">Últimos 12 meses</option>
            <option value="todo">Todo (sin límite)</option>
          </select>
        </label>

        {timelineRange !== "todo" && timelineShownCount !== timelineTotalCount && (
          <div className="sidebarMeta">
            Mostrando {timelineShownCount} de {timelineTotalCount} tareas
          </div>
        )}

        <label className="sidebarToggle" title="Mostrar/Ocultar ruta crítica">
          <input type="checkbox" checked={showCriticalPath} onChange={onToggleCriticalPath} />
          Ruta crítica
        </label>

        <button onClick={() => setShowBaselineManager(true)} title="Gestionar baselines">
          📊 Baselines
          {activeBaselineId && <span className="sidebarPill">{baselines.length}</span>}
        </button>
      </div>

      <div className="sidebarSection">
        <div className="sidebarTitle">Datos</div>

        {canEdit && onCreateTask && (
          <button onClick={onCreateTask} title="Crear nueva tarea">
            + Nueva tarea
          </button>
        )}
        {canEdit && onCreateMilestone && (
          <button onClick={onCreateMilestone} title="Crear milestone">
            ◆ Nuevo hito
          </button>
        )}

        <button onClick={() => setShowTagsManager(true)} title="Gestionar tags">
          🏷️ Tags
        </button>

        <div className="sidebarInline">
          <ExportMenu tasks={tasks} />
        </div>

        {canEdit && (
          <div className="sidebarInline">
            <ImportExcel />
          </div>
        )}

        {canManageUsers && (
          <div className="sidebarInline">
            <MembersAdmin enabled />
          </div>
        )}

        <div className="sidebarMeta">{taskCount} {taskCount === 1 ? "tarea" : "tareas"}</div>
      </div>

      {showTagsManager && <TagsManager onClose={() => setShowTagsManager(false)} />}
      {showBaselineManager && <BaselineManager onClose={() => setShowBaselineManager(false)} />}
    </aside>
  );
}
