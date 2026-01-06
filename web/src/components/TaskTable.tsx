import type { ChangeEvent } from "react";

import type { Task } from "../lib/types";
import { useGanttStore } from "../lib/store";

function parseDeps(raw: string): string[] {
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function TaskTable({ tasks, canEdit }: { tasks: Task[]; canEdit: boolean }) {
  const upsertTask = useGanttStore((s) => s.upsertTask);
  const deleteTask = useGanttStore((s) => s.deleteTask);

  // Determinar qué tareas tienen hijos
  const tasksWithChildren = new Set(
    tasks.filter((t) => t.parentId).map((t) => t.parentId).filter(Boolean)
  );

  // Filtrar tareas visibles (ocultar hijos si padre está colapsado)
  const visibleTasks = tasks.filter((t) => {
    if (!t.parentId) return true; // Root tasks siempre visibles
    const parent = tasks.find((p) => p.id === t.parentId);
    return !parent?.collapsed; // Mostrar solo si padre no está colapsado
  });

  return (
    <div style={{ height: "100%", overflow: "auto", padding: 16 }}>
      <table style={{ fontSize: 13 }}>
        <thead>
          <tr>
            <th style={{ width: 50 }}>Tipo</th>
            <th style={{ minWidth: 240 }}>Nombre</th>
            <th style={{ width: 90 }}>Inicio</th>
            <th style={{ width: 90 }}>Término</th>
            <th style={{ width: 140 }}>Progreso</th>
            <th style={{ width: 100 }}>Estado</th>
            <th style={{ width: 140 }}>Responsable</th>
            <th style={{ width: 120 }}>Deps</th>
            {canEdit && <th style={{ width: 80 }} />}
          </tr>
        </thead>
        <tbody>
          {visibleTasks.map((t) => {
            const level = t.level ?? 0;
            const isMilestone = t.type === "milestone";
            const hasChildren = tasksWithChildren.has(t.id);
            const icon = isMilestone ? "◆" : "▪";
            
            return (
              <tr key={t.id}>
                <td style={{ textAlign: "center", fontSize: 16 }}>
                  <span title={isMilestone ? "Milestone" : "Tarea"}>
                    {icon}
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
                    <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 100 }}>
                      <div
                        style={{
                          flex: 1,
                          height: 18,
                          background: "#e1e4e8",
                          borderRadius: 9,
                          overflow: "hidden",
                          position: "relative",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            background:
                              t.progress === 100
                                ? "#36b37e"
                                : t.progress >= 75
                                  ? "#4c9aff"
                                  : t.progress >= 50
                                    ? "#ffab00"
                                    : "#ff5630",
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
                          style={{ width: 45, textAlign: "center", padding: "2px 4px" }}
                        />
                      ) : (
                        <span style={{ fontSize: 11, color: "#5e6c84", minWidth: 35 }}>
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
                    style={{ width: 90 }}
                  />
                ) : (
                  <span
                    style={{
                      padding: "2px 8px",
                      borderRadius: 4,
                      fontSize: 12,
                      background: "#f6f8fa",
                      border: "1px solid #e1e4e8",
                    }}
                  >
                    {t.status || "—"}
                  </span>
                )}
              </td>
              <td>{t.assignee ?? "—"}</td>
              <td>
                {canEdit ? (
                  <input
                    value={t.dependencies.join(",")}
                    onChange={async (e) =>
                      await upsertTask({ ...t, dependencies: parseDeps(e.target.value) })
                    }
                    style={{ width: 100 }}
                    placeholder="1,2,3"
                  />
                ) : (
                  t.dependencies.join(",") || "—"
                )}
              </td>
              {canEdit && (
                <td>
                  <button
                    onClick={async () => {
                      if (!confirm(`¿Eliminar "${t.name}"?`)) return;
                      await deleteTask(t.id);
                    }}
                    style={{ fontSize: 12 }}
                  >
                    Eliminar
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
