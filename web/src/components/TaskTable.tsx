import type { ChangeEvent } from "react";
import { useState, useMemo } from "react";

import type { Task } from "../lib/types";
import { useGanttStore } from "../lib/store";

function parseDeps(raw: string): string[] {
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

// Generar color único basado en el nombre
function getAvatarColor(name: string): string {
  const colors = [
    "#0052cc", "#36b37e", "#6554c0", "#ff5630", "#ffab00",
    "#00b8d9", "#ff8b00", "#ff5630", "#6554c0", "#00875a"
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

// Obtener iniciales del nombre
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

// Determinar estado de la tarea
function getTaskStatus(task: Task): string {
  if (task.type === "milestone") return "milestone";
  const today = new Date().toISOString().split("T")[0];
  const isOverdue = task.end < today && task.progress < 100;
  if (task.progress === 100) return "completed";
  if (isOverdue) return "overdue";
  if (task.progress > 0) return "in-progress";
  return "pending";
}

type SortField = "name" | "start" | "end" | "progress" | "status" | "assignee";
type SortDirection = "asc" | "desc";

export function TaskTable({ tasks, canEdit }: { tasks: Task[]; canEdit: boolean }) {
  const upsertTask = useGanttStore((s) => s.upsertTask);
  const deleteTask = useGanttStore((s) => s.deleteTask);
  const availableTags = useGanttStore((s) => s.tags);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Determinar qué tareas tienen hijos
  const tasksWithChildren = new Set(
    tasks.filter((t) => t.parentId).map((t) => t.parentId).filter(Boolean)
  );

  // Ordenar tareas si hay campo seleccionado
  const sortedTasks = useMemo(() => {
    if (!sortField) return tasks;
    
    return [...tasks].sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];
      
      // Manejar valores undefined/null
      if (aVal === undefined || aVal === null) aVal = "";
      if (bVal === undefined || bVal === null) bVal = "";
      
      // Convertir a minúsculas para strings
      if (typeof aVal === "string") aVal = aVal.toLowerCase();
      if (typeof bVal === "string") bVal = bVal.toLowerCase();
      
      let comparison = 0;
      if (aVal < bVal) comparison = -1;
      if (aVal > bVal) comparison = 1;
      
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [tasks, sortField, sortDirection]);

  // Filtrar tareas visibles (ocultar hijos si padre está colapsado)
  const visibleTasks = sortedTasks.filter((t) => {
    if (!t.parentId) return true; // Root tasks siempre visibles
    const parent = sortedTasks.find((p) => p.id === t.parentId);
    return !parent?.collapsed; // Mostrar solo si padre no está colapsado
  });

  const SortableHeader = ({ field, children, style }: { field: SortField; children: React.ReactNode; style?: React.CSSProperties }) => (
    <th 
      style={{ ...style, cursor: "pointer", userSelect: "none" }} 
      onClick={() => handleSort(field)}
      title={`Ordenar por ${children}`}
    >
      {children}
      {sortField === field && (
        <span style={{ marginLeft: 4, fontSize: 10 }}>
          {sortDirection === "asc" ? "▲" : "▼"}
        </span>
      )}
    </th>
  );

  return (
    <div style={{ height: "100%", overflow: "auto", padding: 12 }}>
      <table style={{ fontSize: 11, width: "100%" }}>
        <thead>
          <tr>
            <th style={{ width: 35 }}>Tipo</th>
            <SortableHeader field="name" style={{ minWidth: 180, maxWidth: 280 }}>Nombre</SortableHeader>
            <SortableHeader field="start" style={{ width: 75 }}>Inicio</SortableHeader>
            <SortableHeader field="end" style={{ width: 75 }}>Término</SortableHeader>
            <SortableHeader field="progress" style={{ width: 90 }}>%</SortableHeader>
            <SortableHeader field="status" style={{ width: 80 }}>Estado</SortableHeader>
            <SortableHeader field="assignee" style={{ width: 100 }}>Resp.</SortableHeader>
            <th style={{ width: 120 }}>Tags</th>
            <th style={{ width: 50 }}>💬</th>
            <th style={{ width: 80 }}>Deps</th>
            {canEdit && <th style={{ width: 70 }} />}
          </tr>
        </thead>
        <tbody>
          {visibleTasks.map((t) => {
            const level = t.level ?? 0;
            const isMilestone = t.type === "milestone";
            const hasChildren = tasksWithChildren.has(t.id);
            const taskStatus = getTaskStatus(t);
            
            return (
              <tr key={t.id}>
                <td style={{ textAlign: "center", fontSize: 14 }}>
                  <span 
                    className="task-icon"
                    title={isMilestone ? "Milestone" : "Tarea"}
                    style={{
                      background: isMilestone ? "#f0e7ff" : "#e3f2fd",
                      color: isMilestone ? "#6554c0" : "#0052cc"
                    }}
                  >
                    {isMilestone ? "🎯" : "📝"}
                  </span>
                </td>
                <td>
                  <div
                    style={{
                      fontWeight: level === 0 ? 600 : 500,
                      paddingLeft: level * 20,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    {hasChildren && (
                      <button
                        onClick={async () => {
                          await upsertTask({ ...t, collapsed: !t.collapsed });
                        }}
                        style={{
                          padding: "0",
                          width: 16,
                          height: 16,
                          border: "none",
                          background: "transparent",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 10,
                          color: "#5e6c84",
                        }}
                        title={t.collapsed ? "Expandir" : "Colapsar"}
                      >
                        {t.collapsed ? "▶" : "▼"}
                      </button>
                    )}
                    {level > 0 && !hasChildren && (
                      <span style={{ opacity: 0.4, marginLeft: hasChildren ? 0 : 16 }}>└</span>
                    )}
                    {t.name}
                  </div>
                </td>
                <td>{t.start}</td>
                <td>{isMilestone ? "—" : t.end}</td>
                <td>
                  {isMilestone ? (
                    "—"
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", gap: 4, minWidth: 70 }}>
                      <div
                        style={{
                          flex: 1,
                          height: 14,
                          background: "var(--color-border-light)",
                          borderRadius: 7,
                          overflow: "hidden",
                          position: "relative",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            background:
                              t.progress === 100
                                ? "var(--color-success)"
                                : t.progress >= 75
                                  ? "var(--color-primary)"
                                  : t.progress >= 50
                                    ? "var(--color-warning)"
                                    : "var(--color-critical)",
                            width: `${t.progress}%`,
                            transition: "width 0.3s ease",
                          }}
                        />
                      </div>
                      {canEdit ? (
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={Math.round(t.progress)}
                          onChange={async (e: ChangeEvent<HTMLInputElement>) => {
                            const v = Number(e.target.value);
                            await upsertTask({ ...t, progress: Number.isFinite(v) ? v : t.progress });
                          }}
                          style={{ width: 38, textAlign: "center", padding: "2px", fontSize: 10 }}
                        />
                      ) : (
                        <span style={{ fontSize: 10, color: "var(--color-text-muted)", minWidth: 30 }}>
                          {Math.round(t.progress)}%
                        </span>
                      )}
                    </div>
                  )}
                </td>
              <td>
                {canEdit ? (
                  <input
                    value={t.status ?? ""}
                    onChange={async (e) => await upsertTask({ ...t, status: e.target.value })}
                    style={{ width: 75, fontSize: 10, padding: "2px 4px" }}
                  />
                ) : (
                  <span className={`status-badge ${taskStatus}`}>
                    {taskStatus === "completed" && "✓ "}
                    {taskStatus === "in-progress" && "⏳ "}
                    {taskStatus === "overdue" && "⚠ "}
                    {taskStatus === "pending" && "○ "}
                    {t.status || taskStatus}
                  </span>
                )}
              </td>
              <td>
                {t.assignee ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span 
                      className="avatar" 
                      style={{ background: getAvatarColor(t.assignee) }}
                      title={t.assignee}
                    >
                      {getInitials(t.assignee)}
                    </span>
                    <span style={{ fontSize: 11 }}>{t.assignee}</span>
                  </div>
                ) : (
                  <span style={{ fontSize: 10, color: "var(--color-text-muted)" }}>—</span>
                )}
              </td>
              <td>
                {t.tags && t.tags.length > 0 ? (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {t.tags.map((tagId) => {
                      const tag = availableTags.find((t) => t.id === tagId);
                      if (!tag) return null;
                      return (
                        <span
                          key={tagId}
                          style={{
                            fontSize: 9,
                            padding: "2px 6px",
                            borderRadius: 8,
                            background: `${tag.color}20`,
                            color: tag.color,
                            fontWeight: 500,
                            border: `1px solid ${tag.color}40`,
                            whiteSpace: "nowrap",
                          }}
                          title={tag.name}
                        >
                          {tag.name}
                        </span>
                      );
                    })}
                  </div>
                ) : (
                  <span style={{ fontSize: 10, color: "var(--color-text-muted)" }}>—</span>
                )}
              </td>
              <td style={{ textAlign: "center" }}>
                {t.comments && t.comments.length > 0 ? (
                  <span
                    style={{
                      fontSize: 11,
                      padding: "2px 6px",
                      borderRadius: 8,
                      background: "#ddf4ff",
                      color: "#0969da",
                      fontWeight: 600,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 2,
                    }}
                    title={`${t.comments.length} comentario${t.comments.length > 1 ? "s" : ""}`}
                  >
                    💬 {t.comments.length}
                  </span>
                ) : (
                  <span style={{ fontSize: 10, color: "var(--color-text-muted)" }}>—</span>
                )}
              </td>
              <td>
                {canEdit ? (
                  <input
                    value={t.dependencies.join(",")}
                    onChange={async (e) =>
                      await upsertTask({ ...t, dependencies: parseDeps(e.target.value) })
                    }
                    style={{ width: 75, fontSize: 10, padding: "2px 4px" }}
                    placeholder="1,2"
                  />
                ) : (
                  <span style={{ fontSize: 10 }}>{t.dependencies.join(",") || "—"}</span>
                )}
              </td>
              {canEdit && (
                <td>
                  <button
                    onClick={async () => {
                      if (!confirm(`¿Eliminar "${t.name}"?`)) return;
                      await deleteTask(t.id);
                    }}
                    style={{ fontSize: 10, padding: "2px 6px" }}
                  >
                    ✕
                  </button>
                </td>
              )}
            </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
