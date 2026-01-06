import { ImportExcel } from "./ImportExcel";
import { MembersAdmin } from "./MembersAdmin";

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
  uniqueStatuses?: string[];
  uniqueAssignees?: string[];
};

export function Toolbar({
  canEdit,
  canManageUsers,
  viewMode,
  onViewModeChange,
  showCriticalPath,
  onToggleCriticalPath,
  taskCount,
  onCreateTask,
  onCreateMilestone,
  filterStatus = "",
  onFilterStatusChange,
  filterAssignee = "",
  onFilterAssigneeChange,
  filterType = "",
  onFilterTypeChange,
  uniqueStatuses = [],
  uniqueAssignees = [],
}: Props) {
  const hasActiveFilters = filterStatus || filterAssignee || filterType;

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

        {hasActiveFilters && (
          <button
            onClick={() => {
              onFilterTypeChange?.("");
              onFilterStatusChange?.("");
              onFilterAssigneeChange?.("");
            }}
            style={{ fontSize: 11, padding: "3px 8px" }}
            title="Limpiar filtros"
          >
            ✕ Limpiar
          </button>
        )}
      </div>

      <div style={{ flex: 1 }} />

      <span style={{ fontSize: 13, color: "#586069" }}>
        {taskCount} {taskCount === 1 ? "tarea" : "tareas"}
      </span>

      {canEdit && <ImportExcel />}
      {canManageUsers && <MembersAdmin enabled />}
    </div>
  );
}
