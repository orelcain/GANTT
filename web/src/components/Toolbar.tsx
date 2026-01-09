import { useState } from "react";
import { ImportExcel } from "./ImportExcel";
import { MembersAdmin } from "./MembersAdmin";
import { ExportMenu } from "./ExportMenu";
import { TagsManager } from "./TagsManager";
import { BaselineManager } from "./BaselineManager";
import { useGanttStore } from "../lib/store";
import type { Task } from "../lib/types";

type ViewMode = "Day" | "Week" | "Month";
export type SheetTab = "tareas" | "timeline" | "settings";

type Props = {
  sheetTab?: SheetTab;
  onSheetTabChange?: (tab: SheetTab) => void;
  canEdit: boolean;
  canManageUsers: boolean;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  showCriticalPath: boolean;
  onToggleCriticalPath: () => void;
  taskCount: number;
  onCreateTask?: () => void;
  onCreateMilestone?: () => void;
  filterStatus?: string;
  onFilterStatusChange?: (status: string) => void;
  filterAssignee?: string;
  onFilterAssigneeChange?: (assignee: string) => void;
  filterType?: "" | "task" | "milestone";
  onFilterTypeChange?: (type: "" | "task" | "milestone") => void;
  filterTags?: string[];
  onFilterTagsChange?: (tags: string[]) => void;
  uniqueStatuses?: string[];
  uniqueAssignees?: string[];
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  tasks?: Task[];
  showResources?: boolean;
  onToggleResources?: () => void;
  showDashboard?: boolean;
  onToggleDashboard?: () => void;
  showKanban?: boolean;
  onToggleKanban?: () => void;
  showCalendar?: boolean;
  onToggleCalendar?: () => void;
};

export function Toolbar({
  sheetTab = "timeline",
  onSheetTabChange,
  canEdit,
  canManageUsers,
  viewMode,
  onViewModeChange,
  showCriticalPath,
  onToggleCriticalPath,
  showResources = false,
  onToggleResources,
  showDashboard = false,
  onToggleDashboard,
  showKanban = false,
  onToggleKanban,
  showCalendar = false,
  onToggleCalendar,
  taskCount,
  onCreateTask,
  onCreateMilestone,
  filterStatus = "",
  onFilterStatusChange,
  filterAssignee = "",
  onFilterAssigneeChange,
  filterType = "",
  onFilterTypeChange,
  filterTags = [],
  onFilterTagsChange,
  uniqueStatuses = [],
  uniqueAssignees = [],
  searchQuery = "",
  tasks = [],
  onSearchChange,
}: Props) {
  const { tags: availableTags, baselines, activeBaselineId } = useGanttStore();
  const [showTagsManager, setShowTagsManager] = useState(false);
  const [showTagFilter, setShowTagFilter] = useState(false);
  const [showBaselineManager, setShowBaselineManager] = useState(false);
  const hasActiveFilters = filterStatus || filterAssignee || filterType || searchQuery || filterTags.length > 0;

  return (
    <div className="appToolbar">
      {/* Grupo: navegación (equivalente a hojas) */}
      {onSheetTabChange && (
        <div className="toolbarGroup toolbarGroup--nav">
          <span className="toolbarGroupTitle">Hojas</span>
          <button
            className={sheetTab === "tareas" ? "primary" : undefined}
            onClick={() => onSheetTabChange("tareas")}
            title="Equivalente a la hoja Tareas"
          >
            🧾 Tareas
          </button>
          <button
            className={sheetTab === "timeline" ? "primary" : undefined}
            onClick={() => onSheetTabChange("timeline")}
            title="Equivalente a la hoja Timeline"
          >
            📈 Timeline
          </button>
          <button
            className={sheetTab === "settings" ? "primary" : undefined}
            onClick={() => onSheetTabChange("settings")}
            title="Equivalente a la hoja Settings"
          >
            ⚙️ Settings
          </button>
        </div>
      )}

      {/* Grupo: creación */}
      {canEdit && onCreateTask && (
        <div className="toolbarGroup toolbarGroup--create">
          <span className="toolbarGroupTitle">Crear</span>
          <button onClick={onCreateTask} title="Crear nueva tarea">
            + Tarea
          </button>
          {onCreateMilestone && (
            <button onClick={onCreateMilestone} title="Crear milestone">
              ◆ Milestone
            </button>
          )}
        </div>
      )}

      {/* Grupo: vista */}
      <div className="toolbarGroup toolbarGroup--view">
        <span className="toolbarGroupTitle">Vista</span>
        <select value={viewMode} onChange={(e) => onViewModeChange(e.target.value as ViewMode)}>
          <option value="Day">Día</option>
          <option value="Week">Semana</option>
          <option value="Month">Mes</option>
        </select>
      </div>

      {/* Grupo: herramientas */}
      <div className="toolbarGroup toolbarGroup--tools">
        <span className="toolbarGroupTitle">Herramientas</span>
        <label className="toolbarInlineToggle" title="Mostrar/Ocultar ruta crítica">
          <input type="checkbox" checked={showCriticalPath} onChange={onToggleCriticalPath} />
          Ruta crítica
        </label>

        {onToggleDashboard && (
          <button
            className={showDashboard ? "primary" : undefined}
            onClick={onToggleDashboard}
            title="Ver dashboard con estadísticas del proyecto"
          >
            📊 Dashboard
          </button>
        )}

        {onToggleKanban && (
          <button
            className={showKanban ? "primary" : undefined}
            onClick={onToggleKanban}
            title="Ver tareas en formato Kanban con drag & drop"
          >
            📋 Kanban
          </button>
        )}

        {onToggleCalendar && (
          <button
            className={showCalendar ? "primary" : undefined}
            onClick={onToggleCalendar}
            title="Ver tareas en formato Calendario mensual"
          >
            📅 Calendario
          </button>
        )}

        {onToggleResources && (
          <button
            className={showResources ? "primary" : undefined}
            onClick={onToggleResources}
            title="Ver distribución de tareas por persona"
          >
            👥 Recursos
          </button>
        )}

        <button onClick={() => setShowBaselineManager(true)} title="Gestionar baselines del proyecto" style={{ position: "relative" }}>
          📊 Baseline
          {activeBaselineId && (
            <span className="toolbarPill" title="Cantidad de baselines">
              {baselines.length}
            </span>
          )}
        </button>
      </div>

      {/* Grupo: filtros (siempre en segunda fila) */}
      <div className="toolbarGroup toolbarGroup--filters">
        <span className="toolbarGroupTitle">Filtros</span>

        {onFilterTypeChange && (
          <select
            value={filterType}
            onChange={(e) => onFilterTypeChange(e.target.value as "" | "task" | "milestone")}
            style={{ fontSize: 12, minWidth: 100 }}
          >
            <option value="">Todos los tipos</option>
            <option value="task">Tareas</option>
            <option value="milestone">Milestones</option>
          </select>
        )}

        {onFilterStatusChange && uniqueStatuses.length > 0 && (
          <select
            value={filterStatus}
            onChange={(e) => onFilterStatusChange(e.target.value)}
            style={{ fontSize: 12, minWidth: 120 }}
          >
            <option value="">Todos los estados</option>
            {uniqueStatuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        )}

        {onFilterAssigneeChange && uniqueAssignees.length > 0 && (
          <select
            value={filterAssignee}
            onChange={(e) => onFilterAssigneeChange(e.target.value)}
            style={{ fontSize: 12, minWidth: 140 }}
          >
            <option value="">Todos los responsables</option>
            {uniqueAssignees.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        )}

        {/* Filtro de tags */}
        {onFilterTagsChange && availableTags.length > 0 && (
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setShowTagFilter(!showTagFilter)}
              style={{
                fontSize: 12,
                padding: "4px 10px",
                display: "flex",
                alignItems: "center",
                gap: 4,
                background: filterTags.length > 0 ? "#0969da" : "var(--color-canvas-subtle)",
                color: filterTags.length > 0 ? "#fff" : "var(--color-fg-default)",
                border: "1px solid var(--color-border-default)",
                borderRadius: 4,
              }}
            >
              🏷️ Tags {filterTags.length > 0 && `(${filterTags.length})`}
            </button>
            {showTagFilter && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 4px)",
                  left: 0,
                  background: "var(--color-canvas-default)",
                  border: "1px solid var(--color-border-default)",
                  borderRadius: 6,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                  padding: 12,
                  minWidth: 200,
                  zIndex: 100,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 8, color: "var(--color-fg-muted)" }}>
                  Filtrar por tags
                </div>
                {availableTags.map((tag) => {
                  const isSelected = filterTags.includes(tag.id);
                  return (
                    <label
                      key={tag.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "6px 8px",
                        borderRadius: 4,
                        cursor: "pointer",
                        background: isSelected ? `${tag.color}10` : "transparent",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {
                          const newTags = isSelected
                            ? filterTags.filter((t) => t !== tag.id)
                            : [...filterTags, tag.id];
                          onFilterTagsChange(newTags);
                        }}
                      />
                      <div
                        style={{
                          width: 12,
                          height: 12,
                          borderRadius: 3,
                          background: tag.color,
                        }}
                      />
                      <span style={{ fontSize: 12, flex: 1 }}>{tag.name}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {onSearchChange && (
          <input
            type="text"
            placeholder="🔍 Buscar tareas..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{ fontSize: 12, minWidth: 180, padding: "3px 8px" }}
          />
        )}

        {hasActiveFilters && (
          <button
            onClick={() => {
              onFilterTypeChange?.("");
              onFilterStatusChange?.("");
              onFilterAssigneeChange?.("");
              onSearchChange?.("");
              onFilterTagsChange?.([]);
            }}
            style={{ fontSize: 11, padding: "3px 8px" }}
            title="Limpiar filtros"
          >
            ✕ Limpiar
          </button>
        )}
      </div>

      {/* Bloque derecho */}
      <div
        className="toolbarGroup toolbarGroup--actions"
        style={{
          marginLeft: "auto",
          display: "flex",
          alignItems: "center",
          gap: 8,
          flexWrap: "wrap",
          justifyContent: "flex-end",
          minWidth: 0,
        }}
      >
        <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>
          {taskCount} {taskCount === 1 ? "tarea" : "tareas"}
        </span>

        {/* Botón gestión de tags */}
        <button
          onClick={() => setShowTagsManager(true)}
          style={{
            fontSize: 12,
            padding: "6px 12px",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
          title="Gestionar tags"
        >
          🏷️ Tags
        </button>

        <ExportMenu tasks={tasks} />

        {canEdit && <ImportExcel />}
        {canManageUsers && <MembersAdmin enabled />}
      </div>

      {showTagsManager && <TagsManager onClose={() => setShowTagsManager(false)} />}
      {showBaselineManager && <BaselineManager onClose={() => setShowBaselineManager(false)} />}
    </div>
  );
}
