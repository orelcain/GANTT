import { useState } from "react";
import { ImportExcel } from "./ImportExcel";
import { MembersAdmin } from "./MembersAdmin";
import { ExportMenu } from "./ExportMenu";
import { TagsManager } from "./TagsManager";
import { BaselineManager } from "./BaselineManager";
import { useGanttStore } from "../lib/store";
import type { Task } from "../lib/types";

type ViewMode = "Day" | "Week" | "Month";

type Props = {
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
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        {canEdit && onCreateTask && (
          <>
            <button onClick={onCreateTask} title="Crear nueva tarea">
              + Tarea
            </button>
            {onCreateMilestone && (
              <button onClick={onCreateMilestone} title="Crear milestone">
                ◆ Milestone
              </button>
            )}
            <div style={{ width: 1, height: 24, background: "#e1e4e8", margin: "0 4px" }} />
          </>
        )}
        
        <span style={{ fontSize: 13, color: "#586069" }}>Vista:</span>
        <select value={viewMode} onChange={(e) => onViewModeChange(e.target.value as ViewMode)}>
          <option value="Day">Día</option>
          <option value="Week">Semana</option>
          <option value="Month">Mes</option>
        </select>
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={showCriticalPath}
            onChange={onToggleCriticalPath}
          />
          Ruta crítica
        </label>
        
        {onToggleDashboard && (
          <button
            onClick={onToggleDashboard}
            title="Ver dashboard con estadísticas del proyecto"
            style={{ display: "flex", alignItems: "center", gap: 4 }}
          >
            {showDashboard ? "📊 Ocultar" : "📊 Dashboard"}
          </button>
        )}
        
        {onToggleKanban && (
          <button
            onClick={onToggleKanban}
            title="Ver tareas en formato Kanban con drag & drop"
            style={{ display: "flex", alignItems: "center", gap: 4 }}
          >
            {showKanban ? "📋 Ocultar" : "📋 Kanban"}
          </button>
        )}
        
        {onToggleCalendar && (
          <button
            onClick={onToggleCalendar}
            title="Ver tareas en formato Calendario mensual"
            style={{ display: "flex", alignItems: "center", gap: 4 }}
          >
            {showCalendar ? "📅 Ocultar" : "📅 Calendario"}
          </button>
        )}
        
        {onToggleResources && (
          <button
            onClick={onToggleResources}
            title="Ver distribución de tareas por persona"
            style={{ display: "flex", alignItems: "center", gap: 4 }}
          >
            {showResources ? "👥 Ocultar" : "👥 Recursos"}
          </button>
        )}
        
        <button
          onClick={() => setShowBaselineManager(true)}
          title="Gestionar baselines del proyecto"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            position: "relative",
          }}
        >
          📊 Baseline
          {activeBaselineId && (
            <span
              style={{
                background: "#0969da",
                color: "#fff",
                fontSize: 10,
                padding: "2px 6px",
                borderRadius: 10,
                fontWeight: 600,
              }}
            >
              {baselines.length}
            </span>
          )}
        </button>
      </div>

      {/* Filtros */}
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <div style={{ width: 1, height: 24, background: "#e1e4e8", margin: "0 4px" }} />
        
        <span style={{ fontSize: 11, color: "#8993a4", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          Filtros:
        </span>

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

      <div style={{ flex: 1 }} />

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

      {showTagsManager && <TagsManager onClose={() => setShowTagsManager(false)} />}
      {showBaselineManager && <BaselineManager onClose={() => setShowBaselineManager(false)} />}
    </div>
  );
}
