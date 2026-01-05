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
    <section>
      <h2>Tareas</h2>
      <div style={{ overflowX: "auto" }}>
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Inicio</th>
              <th>Término</th>
              <th>%</th>
              <th>Estado</th>
              <th>Responsable</th>
              <th>Deps (IDs)</th>
              {canEdit && <th />}
            </tr>
          </thead>
          <tbody>
            {tasks.map((t) => (
              <tr key={t.id}>
                <td style={{ minWidth: 260 }}>{t.name}</td>
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
                      style={{ width: 70 }}
                    />
                  ) : (
                    Math.round(t.progress)
                  )}
                </td>
                <td>
                  {canEdit ? (
                    <input
                      value={t.status ?? ""}
                      onChange={async (e) => await upsertTask({ ...t, status: e.target.value })}
                    />
                  ) : (
                    t.status ?? ""
                  )}
                </td>
                <td>{t.assignee ?? ""}</td>
                <td style={{ minWidth: 240 }}>
                  {canEdit ? (
                    <input
                      value={t.dependencies.join(",")}
                      onChange={async (e) =>
                        await upsertTask({ ...t, dependencies: parseDeps(e.target.value) })
                      }
                    />
                  ) : (
                    t.dependencies.join(",")
                  )}
                </td>
                {canEdit && (
                  <td>
                    <button
                      onClick={async () => {
                        if (!confirm("¿Eliminar tarea?")) return;
                        await deleteTask(t.id);
                      }}
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
      <p style={{ opacity: 0.8, maxWidth: 900 }}>
        Nota: las dependencias se escriben como IDs separados por coma. Luego el Gantt dibuja las
        flechas. (En el siguiente paso podemos agregar UI más amigable para linkear tareas.)
      </p>
    </section>
  );
}
