import "./App.css";

import { useEffect, useMemo, useState } from "react";

import { AuthBar } from "./components/AuthBar";
import { GanttView, type ViewMode } from "./components/GanttView";
import { QuickEditModal } from "./components/QuickEditModal";
import { TaskTable } from "./components/TaskTable";
import { Toolbar } from "./components/Toolbar";
import { HelpPanel } from "./components/HelpPanel";
import { ResourceView } from "./components/ResourceView";
import { Dashboard } from "./components/Dashboard";
import { KanbanView } from "./components/KanbanView";
import { CalendarView } from "./components/CalendarView";
import { NotificationCenter } from "./components/NotificationCenter";
import { SettingsView } from "./components/SettingsView";
import type { SheetTab } from "./components/Toolbar";
import { useGanttStore } from "./lib/store";
import type { Task, UserRole } from "./lib/types";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";

export default function App() {
  const load = useGanttStore((s) => s.load);
  const tasks = useGanttStore((s) => s.tasks);
  const isLoading = useGanttStore((s) => s.isLoading);
  const error = useGanttStore((s) => s.error);
  const upsertTask = useGanttStore((s) => s.upsertTask);
  const addNotification = useGanttStore((s) => s.addNotification);
  const notifications = useGanttStore((s) => s.notifications);

  const [role, setRole] = useState<UserRole>("anon");
  const [viewMode, setViewMode] = useState<ViewMode>("Week");
  const [hasTouchedViewMode, setHasTouchedViewMode] = useState(false);
  const [showCriticalPath, setShowCriticalPath] = useState(true);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [showResources, setShowResources] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showKanban, setShowKanban] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [sheetTab, setSheetTab] = useState<SheetTab>("timeline");
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("darkMode");
    return saved === "true";
  });
  
  // Filtros
  const [filterStatus, setFilterStatus] = useState("");
  const [filterAssignee, setFilterAssignee] = useState("");
  const [filterType, setFilterType] = useState<"" | "task" | "milestone">("");
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (role === "anon" || role === "noaccess") return;
    void load();
  }, [load, role]);

  // Generador automático de notificaciones de deadline
  useEffect(() => {
    if (tasks.length === 0) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const threeDaysFromNow = new Date(today);
    threeDaysFromNow.setDate(today.getDate() + 3);

    tasks.forEach((task) => {
      // Solo tareas no completadas y que no sean milestones
      if (task.type === "milestone" || task.progress >= 100) return;

      const endDate = new Date(task.end);
      endDate.setHours(0, 0, 0, 0);

      // Si la tarea vence en los próximos 3 días
      if (endDate <= threeDaysFromNow && endDate >= today) {
        // Verificar si ya existe una notificación para esta tarea
        const existingNotification = notifications.find(
          (n) => n.type === "deadline" && n.taskId === task.id && !n.read
        );

        if (!existingNotification) {
          const diffDays = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          let message = "";
          
          if (diffDays === 0) {
            message = "Vence hoy";
          } else if (diffDays === 1) {
            message = "Vence mañana";
          } else {
            message = `Vence en ${diffDays} días`;
          }

          addNotification({
            id: `deadline-${task.id}-${Date.now()}`,
            type: "deadline",
            taskId: task.id,
            taskName: task.name,
            message: `${message} (${task.progress}% completado)`,
            timestamp: new Date().toISOString(),
            read: false,
          });
        }
      }
    });
  }, [tasks, notifications, addNotification]);

  useEffect(() => {
    localStorage.setItem("darkMode", String(darkMode));
    if (darkMode) {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
  }, [darkMode]);

  const canEdit = useMemo(() => role === "admin" || role === "editor", [role]);
  const canManageUsers = useMemo(() => role === "admin", [role]);

  // Valores únicos para los filtros
  const uniqueStatuses = useMemo(() => {
    const statuses = new Set<string>();
    tasks.forEach(t => t.status && statuses.add(t.status));
    return Array.from(statuses).sort();
  }, [tasks]);

  const uniqueAssignees = useMemo(() => {
    const assignees = new Set<string>();
    tasks.forEach(t => t.assignee && assignees.add(t.assignee));
    return Array.from(assignees).sort();
  }, [tasks]);

  // Tareas filtradas
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      if (filterStatus && task.status !== filterStatus) return false;
      if (filterAssignee && task.assignee !== filterAssignee) return false;
      if (filterType && task.type !== filterType) return false;
      if (filterTags.length > 0 && !filterTags.some(tagId => task.tags?.includes(tagId))) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          task.name.toLowerCase().includes(query) ||
          task.assignee?.toLowerCase().includes(query) ||
          task.status?.toLowerCase().includes(query) ||
          String(task.phaseId || "").toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [tasks, filterStatus, filterAssignee, filterType, filterTags, searchQuery]);

  // Auto-elegir vista (Día/Semana/Mes) para que el Timeline no quede enorme por defecto.
  useEffect(() => {
    if (hasTouchedViewMode) return;
    if (tasks.length === 0) return;

    let minDate: Date | null = null;
    let maxDate: Date | null = null;

    for (const t of filteredTasks) {
      const start = new Date(t.start);
      const end = new Date(t.type === "milestone" ? t.start : t.end);
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) continue;

      if (!minDate || start < minDate) minDate = start;
      if (!maxDate || end > maxDate) maxDate = end;
    }

    if (!minDate || !maxDate) return;

    const diffDays = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const recommended: ViewMode = diffDays > 180 ? "Month" : diffDays > 45 ? "Week" : "Day";
    setViewMode(recommended);
  }, [filteredTasks, hasTouchedViewMode, tasks.length]);

  // Atajos de teclado
  useKeyboardShortcuts([
    {
      key: "n",
      ctrl: true,
      action: () => {
        if (canEdit) handleCreateTask();
      },
      description: "Nueva tarea",
    },
    {
      key: "m",
      ctrl: true,
      action: () => {
        if (canEdit) handleCreateMilestone();
      },
      description: "Nuevo milestone",
    },
    {
      key: "f",
      ctrl: true,
      action: () => {
        // Focus en búsqueda
        const searchInput = document.querySelector('input[placeholder*="Buscar"]') as HTMLInputElement;
        searchInput?.focus();
      },
      description: "Buscar",
    },
    {
      key: "d",
      ctrl: true,
      action: () => {
        setDarkMode(!darkMode);
      },
      description: "Toggle modo oscuro",
    },
    {
      key: "Escape",
      action: () => {
        if (taskToEdit) setTaskToEdit(null);
      },
      description: "Cerrar modal",
    },
  ], role !== "anon" && role !== "noaccess");

  const handleCreateTask = async () => {
    const today = new Date().toISOString().split("T")[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
    const maxId = tasks.reduce((max, t) => Math.max(max, Number(t.id) || 0), 0);
    
    const newTask: Task = {
      id: String(maxId + 1),
      name: "Nueva tarea",
      start: today,
      end: tomorrow,
      progress: 0,
      dependencies: [],
      type: "task",
      level: 0,
    };

    await upsertTask(newTask);
    setTaskToEdit(newTask);
  };

  const handleCreateMilestone = async () => {
    const today = new Date().toISOString().split("T")[0];
    const maxId = tasks.reduce((max, t) => Math.max(max, Number(t.id) || 0), 0);
    
    const newMilestone: Task = {
      id: String(maxId + 1),
      name: "Nuevo milestone",
      start: today,
      end: today,
      progress: 100,
      dependencies: [],
      type: "milestone",
      level: 0,
    };

    await upsertTask(newMilestone);
    setTaskToEdit(newMilestone);
  };

  return (
    <div className="app">
      <header className="appHeader">
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <h1>ANTARFOOD · Gantt Mantención (Temporada Baja)</h1>
              <span className="version-badge">v{__APP_VERSION__}</span>
            </div>
            <p style={{ opacity: 0.8, marginTop: 4 }}>
              Dashboard · Kanban · Calendario · Tags · Comentarios · Notificaciones · Baselines · Exportación · Recursos · Ruta Crítica
            </p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <NotificationCenter />
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="theme-toggle"
            title={darkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
          >
            {darkMode ? "☀️" : "🌙"}
          </button>
          <AuthBar onRole={setRole} />
        </div>
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
            sheetTab={sheetTab}
            onSheetTabChange={setSheetTab}
            viewMode={viewMode}
            onViewModeChange={(mode) => {
              setHasTouchedViewMode(true);
              setViewMode(mode);
            }}
            showCriticalPath={showCriticalPath}
            onToggleCriticalPath={() => setShowCriticalPath(!showCriticalPath)}
            showDashboard={showDashboard}
            onToggleDashboard={() => setShowDashboard(!showDashboard)}
            showKanban={showKanban}
            onToggleKanban={() => setShowKanban(!showKanban)}
            showCalendar={showCalendar}
            onToggleCalendar={() => setShowCalendar(!showCalendar)}
            showResources={showResources}
            onToggleResources={() => setShowResources(!showResources)}
            taskCount={tasks.length}
            onCreateTask={canEdit ? handleCreateTask : undefined}
            onCreateMilestone={canEdit ? handleCreateMilestone : undefined}
            filterStatus={filterStatus}
            filterAssignee={filterAssignee}
            filterType={filterType}
            filterTags={filterTags}
            uniqueStatuses={uniqueStatuses}
            uniqueAssignees={uniqueAssignees}
            onFilterStatusChange={setFilterStatus}
            onFilterAssigneeChange={setFilterAssignee}
            onFilterTypeChange={setFilterType}
            onFilterTagsChange={setFilterTags}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            tasks={filteredTasks}
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
            ) : showDashboard ? (
              <Dashboard tasks={filteredTasks} />
            ) : showKanban ? (
              <KanbanView tasks={filteredTasks} canEdit={canEdit} />
            ) : showCalendar ? (
              <CalendarView 
                tasks={filteredTasks}
                onTaskClick={canEdit ? (task) => setTaskToEdit(task) : undefined}
              />
            ) : showResources ? (
              <ResourceView tasks={filteredTasks} />
            ) : (
              sheetTab === "settings" ? (
                <SettingsView />
              ) : sheetTab === "tareas" ? (
                <TaskTable tasks={filteredTasks} canEdit={canEdit} />
              ) : (
                <GanttView
                  tasks={filteredTasks}
                  viewMode={viewMode}
                  showCriticalPath={showCriticalPath}
                  onTaskChange={canEdit ? async (task, changes) => {
                    await upsertTask({ ...task, ...changes });
                  } : undefined}
                  onTaskClick={canEdit ? (task) => setTaskToEdit(task) : undefined}
                />
              )
            )}
          </main>
        </>
      )}

      {taskToEdit && (
        <QuickEditModal
          task={taskToEdit}
          onSave={async (updates) => {
            await upsertTask({ ...taskToEdit, ...updates });
          }}
          onClose={() => setTaskToEdit(null)}
          currentUser={filterAssignee || "Usuario"}
        />
      )}

      <HelpPanel />

      <footer className="appFooter">
        <small>
          Versión: <strong>v{__APP_VERSION__}</strong> · Rol actual: <strong>{role}</strong> · Acceso privado (login requerido)
        </small>
      </footer>
    </div>
  );
}
