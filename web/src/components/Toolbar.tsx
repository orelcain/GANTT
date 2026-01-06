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
}: Props) {
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

      <div style={{ flex: 1 }} />

      <span style={{ fontSize: 13, color: "#586069" }}>
        {taskCount} {taskCount === 1 ? "tarea" : "tareas"}
      </span>

      {canEdit && <ImportExcel />}
      {canManageUsers && <MembersAdmin enabled />}
    </div>
  );
}
