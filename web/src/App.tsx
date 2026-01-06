import "./App.css";

import { useEffect, useMemo, useState } from "react";

import { AuthBar } from "./components/AuthBar";
import { GanttView, type ViewMode } from "./components/GanttView";
import { TaskTable } from "./components/TaskTable";
import { Toolbar } from "./components/Toolbar";
import { useGanttStore } from "./lib/store";
import type { UserRole } from "./lib/types";

export default function App() {
  const load = useGanttStore((s) => s.load);
  const tasks = useGanttStore((s) => s.tasks);
  const isLoading = useGanttStore((s) => s.isLoading);
  const error = useGanttStore((s) => s.error);

  const [role, setRole] = useState<UserRole>("anon");
  const [viewMode, setViewMode] = useState<ViewMode>("Day");
  const [showCriticalPath, setShowCriticalPath] = useState(true);

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

      {error && <div className="error"><strong>Error:</strong> {error}</div>}

      {role === "anon" || role === "noaccess" ? (
        <main className="appMain">
          <div className="emptyState">
            {role === "anon" ? (
              <>
                <h2>Inicia sesión para ver el Gantt</h2>
                <p>Usa el botón "Entrar" en la esquina superior derecha.</p>
              </>
            ) : (
              <>
                <h2>Sin acceso al proyecto</h2>
                <p>Pide a un administrador que te agregue como miembro.</p>
              </>
            )}
          </div>
        </main>
      ) : (
        <>
          <Toolbar
            canEdit={canEdit}
            canManageUsers={canManageUsers}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            showCriticalPath={showCriticalPath}
            onToggleCriticalPath={() => setShowCriticalPath(!showCriticalPath)}
            taskCount={tasks.length}
          />
          <main className="appMain">
            {isLoading ? (
              <div className="emptyState">
                <p>Cargando tareas...</p>
              </div>
            ) : tasks.length === 0 ? (
              <div className="emptyState">
                <h2>No hay tareas</h2>
                <p>{canEdit ? "Importa el archivo Excel para comenzar." : "El proyecto está vacío."}</p>
              </div>
            ) : (
              <div className="splitView">
                <div className="tablePanel">
                  <TaskTable tasks={tasks} canEdit={canEdit} />
                </div>
                <div className="ganttPanel">
                  <GanttView
                    tasks={tasks}
                    viewMode={viewMode}
                    showCriticalPath={showCriticalPath}
                  />
                </div>
              </div>
            )}
          </main>
        </>
      )}

      <footer className="appFooter">
        <small>
          Versión: <strong>v{__APP_VERSION__}</strong> · Rol actual: <strong>{role}</strong> · Acceso privado (login requerido)
        </small>
      </footer>
    </div>
  );
}
