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

  return (
    <div style={{ height: "100%", overflow: "auto", padding: 16 }}>
      <table style={{ fontSize: 13 }}>
        <thead>
          <tr>
            <th style={{ minWidth: 240 }}>Nombre</th>
            <th style={{ width: 90 }}>Inicio</th>
            <th style={{ width: 90 }}>Término</th>
            <th style={{ width: 60 }}>%</th>
            <th style={{ width: 100 }}>Estado</th>
            <th style={{ width: 140 }}>Responsable</th>
            <th style={{ width: 120 }}>Deps</th>
            {canEdit && <th style={{ width: 80 }} />}
          </tr>
        </thead>
        <tbody>
          {tasks.map((t) => (
            <tr key={t.id}>
              <td>
                <div style={{ fontWeight: 500 }}>{t.name}</div>
              </td>
              <td>{t.start}</td>
              <td>{t.end}</td>
              <td>
                {canEdit ? (
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={t.progress}
                    onChange={async (e: ChangeEvent<HTMLInputElement>) => {
                      const v = Number(e.target.value);
                      await upsertTask({ ...t, progress: Number.isFinite(v) ? v : t.progress });
                    }}
                    style={{ width: 50 }}
                  />
                ) : (
                  `${Math.round(t.progress)}%`
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
          ))}
        </tbody>
      </table>
    </div>
  );
}
