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
};

export function Toolbar({
  canEdit,
  canManageUsers,
  viewMode,
  onViewModeChange,
  showCriticalPath,
  onToggleCriticalPath,
  taskCount,
}: Props) {
  return (
    <div className="appToolbar">
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
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
