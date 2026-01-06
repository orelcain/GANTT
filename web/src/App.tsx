import "./App.css";

import { useEffect, useMemo, useState } from "react";

import { AuthBar } from "./components/AuthBar";
import { GanttView } from "./components/GanttView";
import { ImportExcel } from "./components/ImportExcel";
import { MembersAdmin } from "./components/MembersAdmin";
import { Reports } from "./components/Reports";
import { TaskTable } from "./components/TaskTable";
import { useGanttStore } from "./lib/store";
import type { UserRole } from "./lib/types";

export default function App() {
  const load = useGanttStore((s) => s.load);
  const tasks = useGanttStore((s) => s.tasks);
  const isLoading = useGanttStore((s) => s.isLoading);
  const error = useGanttStore((s) => s.error);

  const [role, setRole] = useState<UserRole>("anon");

  useEffect(() => {
    if (role === "anon" || role === "noaccess") return;
    void load();
  }, [load, role]);

  const canEdit = useMemo(() => role === "admin" || role === "editor", [role]);
  const canManageUsers = useMemo(() => role === "admin", [role]);

  return (
    <div className="app">
      <header className="appHeader">
        <div>
          <h1>ANTARFOOD · Gantt Mantención (Temporada Baja)</h1>
          <p style={{ opacity: 0.8, marginTop: 4 }}>
            Frontend estático (GitHub Pages). Login/roles con Firebase.
          </p>
        </div>
        <AuthBar onRole={setRole} />
      </header>

      {error && (
        <p className="error">
          <strong>Error:</strong> {error}
        </p>
      )}

      <main className="appMain">
        {role === "anon" ? (
          <p>Inicia sesión para ver el Gantt.</p>
        ) : role === "noaccess" ? (
          <p>
            Tu cuenta no tiene permisos en este proyecto. Pide a un admin que te agregue.
          </p>
        ) : (
          <>
            {canEdit ? <ImportExcel /> : <p>No tienes permisos para importar/editar tareas.</p>}
            <MembersAdmin enabled={canManageUsers} />
          </>
        )}

        {role === "anon" || role === "noaccess" ? null : isLoading ? (
          <p>Cargando…</p>
        ) : tasks.length ? (
          <>
            <Reports tasks={tasks} />
            <TaskTable tasks={tasks} canEdit={canEdit} />
            <GanttView tasks={tasks} />
          </>
        ) : (
          <p>No hay tareas aún. Importa el Excel para comenzar.</p>
        )}
      </main>

      <footer className="appFooter">
        <small>
          Versión: <strong>v{__APP_VERSION__}</strong> · Rol actual: <strong>{role}</strong> · Acceso privado (login requerido)
        </small>
      </footer>
    </div>
  );
}
