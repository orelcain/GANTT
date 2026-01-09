import { useMemo, useState } from "react";
import type { Task } from "../lib/types";

type Props = {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
};

type CalendarDay = {
  date: Date;
  isCurrentMonth: boolean;
  tasks: Task[];
  tasksStarting: Task[];
  tasksEnding: Task[];
  tasksInProgress: Task[];
};

const MONTHS_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const DAYS_ES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export function CalendarView({ tasks, onTaskClick }: Props) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  // Generar días del calendario (incluyendo días de meses anterior/siguiente)
  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startingDayOfWeek = firstDay.getDay(); // 0 = domingo
    const daysInMonth = lastDay.getDate();

    const days: CalendarDay[] = [];

    // Días del mes anterior
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(currentYear, currentMonth - 1, prevMonthLastDay - i);
      days.push({
        date,
        isCurrentMonth: false,
        tasks: [],
        tasksStarting: [],
        tasksEnding: [],
        tasksInProgress: [],
      });
    }

    // Días del mes actual
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      days.push({
        date,
        isCurrentMonth: true,
        tasks: [],
        tasksStarting: [],
        tasksEnding: [],
        tasksInProgress: [],
      });
    }

    // Días del mes siguiente (para completar la última semana)
    const remainingDays = 42 - days.length; // 6 semanas completas
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(currentYear, currentMonth + 1, day);
      days.push({
        date,
        isCurrentMonth: false,
        tasks: [],
        tasksStarting: [],
        tasksEnding: [],
        tasksInProgress: [],
      });
    }

    // Asignar tareas a los días
    tasks.forEach((task) => {
      const startDate = new Date(task.start);
      const endDate = new Date(task.end);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);

      days.forEach((day) => {
        const dayDate = new Date(day.date);
        dayDate.setHours(0, 0, 0, 0);

        const isStartDate = dayDate.getTime() === startDate.getTime();
        const isEndDate = dayDate.getTime() === endDate.getTime();
        const isInProgress = dayDate >= startDate && dayDate <= endDate;

        if (isStartDate) {
          day.tasksStarting.push(task);
          day.tasks.push(task);
        }
        if (isEndDate && !isStartDate) {
          day.tasksEnding.push(task);
          if (!day.tasks.includes(task)) day.tasks.push(task);
        }
        if (isInProgress && !isStartDate && !isEndDate) {
          day.tasksInProgress.push(task);
          if (!day.tasks.includes(task)) day.tasks.push(task);
        }
      });
    });

    return days;
  }, [tasks, currentMonth, currentYear]);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleToday = () => {
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
  };

  const isToday = (date: Date) => {
    const todayDate = new Date();
    return (
      date.getDate() === todayDate.getDate() &&
      date.getMonth() === todayDate.getMonth() &&
      date.getFullYear() === todayDate.getFullYear()
    );
  };

  const getTaskStatus = (task: Task): "completed" | "overdue" | "in-progress" | "pending" => {
    if (task.progress === 100) return "completed";
    const today = new Date().toISOString().split("T")[0];
    if (task.end < today && task.progress < 100) return "overdue";
    if (task.progress > 0 && task.progress < 100) return "in-progress";
    return "pending";
  };

  const getWorkload = (day: CalendarDay) => {
    const taskCount = day.tasks.length;
    if (taskCount === 0) return "none";
    if (taskCount <= 2) return "low";
    if (taskCount <= 4) return "medium";
    return "high";
  };

  return (
    <div style={{ padding: 16, background: "var(--color-canvas-default)" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
          padding: "16px 20px",
          background: "var(--color-canvas-subtle)",
          borderRadius: 8,
          border: "1px solid var(--color-border-default)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>
            📅 {MONTHS_ES[currentMonth]} {currentYear}
          </h2>
          <button
            onClick={handleToday}
            style={{
              padding: "6px 12px",
              fontSize: 12,
              background: "var(--color-primary)",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Hoy
          </button>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={handlePrevMonth}
            style={{
              padding: "8px 16px",
              background: "var(--color-canvas-default)",
              border: "1px solid var(--color-border-default)",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 14,
            }}
            title="Mes anterior"
          >
            ‹
          </button>
          <button
            onClick={handleNextMonth}
            style={{
              padding: "8px 16px",
              background: "var(--color-canvas-default)",
              border: "1px solid var(--color-border-default)",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 14,
            }}
            title="Mes siguiente"
          >
            ›
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 2,
          background: "var(--color-border-default)",
          border: "1px solid var(--color-border-default)",
          borderRadius: 8,
          overflow: "hidden",
        }}
      >
        {/* Day headers */}
        {DAYS_ES.map((day) => (
          <div
            key={day}
            style={{
              padding: "12px 8px",
              background: "var(--color-canvas-subtle)",
              textAlign: "center",
              fontSize: 12,
              fontWeight: 700,
              color: "var(--color-text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            {day}
          </div>
        ))}

        {/* Calendar days */}
        {calendarDays.map((day, index) => {
          const workload = getWorkload(day);
          const workloadColors = {
            none: "transparent",
            low: "#ddf4ff",
            medium: "#fff8c5",
            high: "#ffebe9",
          };

          return (
            <div
              key={index}
              style={{
                minHeight: 100,
                padding: 8,
                background: day.isCurrentMonth
                  ? workloadColors[workload]
                  : "var(--color-canvas-subtle)",
                opacity: day.isCurrentMonth ? 1 : 0.5,
                border: isToday(day.date) ? "2px solid var(--color-primary)" : "none",
                cursor: day.tasks.length > 0 ? "pointer" : "default",
                display: "flex",
                flexDirection: "column",
                position: "relative",
              }}
              onClick={() => {
                if (day.tasks.length > 0 && onTaskClick) {
                  // Por ahora solo mostrar la primera tarea, luego podemos hacer un modal con todas
                  onTaskClick(day.tasks[0]);
                }
              }}
            >
              {/* Day number */}
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: isToday(day.date)
                    ? "var(--color-primary)"
                    : day.isCurrentMonth
                    ? "var(--color-text)"
                    : "var(--color-text-muted)",
                  marginBottom: 6,
                }}
              >
                {day.date.getDate()}
              </div>

              {/* Task indicators */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
                {/* Tasks starting */}
                {day.tasksStarting.slice(0, 2).map((task) => {
                  const status = getTaskStatus(task);
                  const statusColors = {
                    completed: "#1a7f37",
                    "in-progress": "#0969da",
                    overdue: "#cf222e",
                    pending: "#6e7781",
                  };

                  return (
                    <div
                      key={`start-${task.id}`}
                      style={{
                        fontSize: 10,
                        padding: "2px 4px",
                        background: statusColors[status],
                        color: "#fff",
                        borderRadius: 3,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        fontWeight: 600,
                      }}
                      title={`▶ ${task.name} (${task.progress}%)`}
                    >
                      ▶ {task.name}
                    </div>
                  );
                })}

                {/* Tasks ending */}
                {day.tasksEnding.slice(0, 2).map((task) => {
                  const status = getTaskStatus(task);
                  const statusColors = {
                    completed: "#1a7f37",
                    "in-progress": "#0969da",
                    overdue: "#cf222e",
                    pending: "#6e7781",
                  };

                  return (
                    <div
                      key={`end-${task.id}`}
                      style={{
                        fontSize: 10,
                        padding: "2px 4px",
                        background: `${statusColors[status]}80`,
                        color: "#fff",
                        borderRadius: 3,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        fontWeight: 600,
                      }}
                      title={`◀ ${task.name} (${task.progress}%)`}
                    >
                      ◀ {task.name}
                    </div>
                  );
                })}

                {/* More tasks indicator */}
                {day.tasks.length > 2 && (
                  <div
                    style={{
                      fontSize: 10,
                      padding: "2px 4px",
                      background: "var(--color-text-muted)",
                      color: "#fff",
                      borderRadius: 3,
                      textAlign: "center",
                      fontWeight: 600,
                    }}
                  >
                    +{day.tasks.length - 2} más
                  </div>
                )}
              </div>

              {/* Task count badge */}
              {day.tasks.length > 0 && (
                <div
                  style={{
                    position: "absolute",
                    top: 4,
                    right: 4,
                    background: "var(--color-text-muted)",
                    color: "#fff",
                    fontSize: 9,
                    padding: "2px 5px",
                    borderRadius: 10,
                    fontWeight: 700,
                  }}
                >
                  {day.tasks.length}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div
        style={{
          marginTop: 16,
          padding: 16,
          background: "var(--color-canvas-subtle)",
          borderRadius: 8,
          display: "flex",
          gap: 24,
          fontSize: 12,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div
            style={{
              width: 16,
              height: 16,
              background: "#1a7f37",
              borderRadius: 3,
            }}
          />
          <span>Completado</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div
            style={{
              width: 16,
              height: 16,
              background: "#0969da",
              borderRadius: 3,
            }}
          />
          <span>En Progreso</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div
            style={{
              width: 16,
              height: 16,
              background: "#cf222e",
              borderRadius: 3,
            }}
          />
          <span>Atrasado</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div
            style={{
              width: 16,
              height: 16,
              background: "#6e7781",
              borderRadius: 3,
            }}
          />
          <span>Pendiente</span>
        </div>
        <div style={{ marginLeft: "auto", color: "var(--color-text-muted)" }}>
          ▶ Inicia · ◀ Finaliza
        </div>
      </div>
    </div>
  );
}
