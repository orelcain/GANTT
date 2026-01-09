import { useMemo } from "react";
import type { Task } from "../lib/types";

type Props = {
  tasks: Task[];
};

// Componente de Progress Ring circular
function ProgressRing({ progress, size = 120, strokeWidth = 10 }: { progress: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      {/* Background circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--color-border-light)"
        strokeWidth={strokeWidth}
      />
      {/* Progress circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--color-success)"
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 1s ease" }}
      />
    </svg>
  );
}

export function Dashboard({ tasks }: Props) {
  // Calcular métricas
  const metrics = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    
    const total = tasks.length;
    const completed = tasks.filter(t => t.progress === 100).length;
    const inProgress = tasks.filter(t => t.progress > 0 && t.progress < 100).length;
    const pending = tasks.filter(t => t.progress === 0).length;
    const overdue = tasks.filter(t => t.end < today && t.progress < 100).length;
    
    const avgProgress = total > 0 
      ? tasks.reduce((sum, t) => sum + t.progress, 0) / total 
      : 0;

    // Tareas por responsable
    const byAssignee = new Map<string, { count: number; completed: number; progress: number }>();
    tasks.forEach(t => {
      const assignee = t.assignee || "Sin asignar";
      const current = byAssignee.get(assignee) || { count: 0, completed: 0, progress: 0 };
      byAssignee.set(assignee, {
        count: current.count + 1,
        completed: current.completed + (t.progress === 100 ? 1 : 0),
        progress: current.progress + t.progress,
      });
    });

    const topAssignees = Array.from(byAssignee.entries())
      .map(([name, data]) => ({
        name,
        count: data.count,
        avgProgress: data.progress / data.count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Tareas críticas (próximas a vencer en 7 días)
    const in7Days = new Date();
    in7Days.setDate(in7Days.getDate() + 7);
    const in7DaysStr = in7Days.toISOString().split("T")[0];
    
    const criticalTasks = tasks
      .filter(t => t.end >= today && t.end <= in7DaysStr && t.progress < 100)
      .sort((a, b) => a.end.localeCompare(b.end))
      .slice(0, 5);

    // Milestones próximos
    const upcomingMilestones = tasks
      .filter(t => t.type === "milestone" && t.start >= today)
      .sort((a, b) => a.start.localeCompare(b.start))
      .slice(0, 3);

    return {
      total,
      completed,
      inProgress,
      pending,
      overdue,
      avgProgress,
      topAssignees,
      criticalTasks,
      upcomingMilestones,
    };
  }, [tasks]);

  return (
    <div style={{ padding: 24, overflow: "auto", background: "var(--color-bg)", height: "100%" }}>
      <div style={{ maxWidth: 1400, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "var(--color-text)" }}>
            📊 Dashboard del Proyecto
          </h1>
          <p style={{ margin: "8px 0 0", fontSize: 14, color: "var(--color-text-muted)" }}>
            Visión general del estado y progreso de todas las tareas
          </p>
        </div>

        {/* Cards principales */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, marginBottom: 24 }}>
          {/* Progreso General */}
          <div style={{
            background: "var(--color-surface)",
            borderRadius: "var(--radius-lg)",
            padding: 24,
            boxShadow: "var(--shadow-md)",
            border: "1px solid var(--color-border)",
          }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase" }}>
              Progreso General
            </h3>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", position: "relative", marginBottom: 16 }}>
              <ProgressRing progress={metrics.avgProgress} />
              <div style={{ position: "absolute", textAlign: "center" }}>
                <div style={{ fontSize: 32, fontWeight: 700, color: "var(--color-text)" }}>
                  {Math.round(metrics.avgProgress)}%
                </div>
                <div style={{ fontSize: 11, color: "var(--color-text-muted)" }}>Completado</div>
              </div>
            </div>
            <div style={{ fontSize: 13, color: "var(--color-text-muted)", textAlign: "center" }}>
              {metrics.completed} de {metrics.total} tareas finalizadas
            </div>
          </div>

          {/* Distribución por Estado */}
          <div style={{
            background: "var(--color-surface)",
            borderRadius: "var(--radius-lg)",
            padding: 24,
            boxShadow: "var(--shadow-md)",
            border: "1px solid var(--color-border)",
          }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase" }}>
              Estado de Tareas
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13, color: "var(--color-text)" }}>✓ Completadas</span>
                <span style={{ fontSize: 16, fontWeight: 700, color: "var(--color-success)" }}>{metrics.completed}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13, color: "var(--color-text)" }}>⏳ En Progreso</span>
                <span style={{ fontSize: 16, fontWeight: 700, color: "var(--color-warning)" }}>{metrics.inProgress}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13, color: "var(--color-text)" }}>○ Pendientes</span>
                <span style={{ fontSize: 16, fontWeight: 700, color: "var(--color-primary)" }}>{metrics.pending}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13, color: "var(--color-text)" }}>⚠ Atrasadas</span>
                <span style={{ fontSize: 16, fontWeight: 700, color: "var(--color-danger)" }}>{metrics.overdue}</span>
              </div>
            </div>
          </div>

          {/* Métricas Rápidas */}
          <div style={{
            background: "var(--color-surface)",
            borderRadius: "var(--radius-lg)",
            padding: 24,
            boxShadow: "var(--shadow-md)",
            border: "1px solid var(--color-border)",
          }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase" }}>
              Resumen Ejecutivo
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <div style={{ fontSize: 11, color: "var(--color-text-muted)", marginBottom: 4 }}>TOTAL TAREAS</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: "var(--color-text)" }}>{metrics.total}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "var(--color-text-muted)", marginBottom: 4 }}>TASA COMPLETITUD</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: "var(--color-success)" }}>
                  {metrics.total > 0 ? Math.round((metrics.completed / metrics.total) * 100) : 0}%
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "var(--color-text-muted)", marginBottom: 4 }}>PRÓXIMOS MILESTONES</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: "var(--color-purple)" }}>
                  {metrics.upcomingMilestones.length}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sección inferior con 2 columnas */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: 16 }}>
          {/* Top 5 Responsables */}
          <div style={{
            background: "var(--color-surface)",
            borderRadius: "var(--radius-lg)",
            padding: 24,
            boxShadow: "var(--shadow-md)",
            border: "1px solid var(--color-border)",
          }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase" }}>
              👥 Top 5 Responsables
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {metrics.topAssignees.map((assignee, idx) => (
                <div key={assignee.name}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text)" }}>
                      {idx + 1}. {assignee.name}
                    </span>
                    <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
                      {assignee.count} tareas · {Math.round(assignee.avgProgress)}%
                    </span>
                  </div>
                  <div style={{
                    height: 6,
                    background: "var(--color-border-light)",
                    borderRadius: 3,
                    overflow: "hidden",
                  }}>
                    <div style={{
                      height: "100%",
                      width: `${assignee.avgProgress}%`,
                      background: assignee.avgProgress === 100 
                        ? "var(--color-success)" 
                        : assignee.avgProgress > 50 
                          ? "var(--color-primary)" 
                          : "var(--color-warning)",
                      transition: "width 0.5s ease",
                    }} />
                  </div>
                </div>
              ))}
              {metrics.topAssignees.length === 0 && (
                <div style={{ padding: 16, textAlign: "center", color: "var(--color-text-muted)", fontSize: 13 }}>
                  No hay tareas asignadas
                </div>
              )}
            </div>
          </div>

          {/* Tareas Críticas */}
          <div style={{
            background: "var(--color-surface)",
            borderRadius: "var(--radius-lg)",
            padding: 24,
            boxShadow: "var(--shadow-md)",
            border: "1px solid var(--color-border)",
          }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase" }}>
              ⚠️ Tareas Críticas (próximos 7 días)
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {metrics.criticalTasks.map(task => (
                <div key={task.id} style={{
                  padding: 12,
                  background: "var(--color-bg)",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--color-border-light)",
                }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text)", marginBottom: 4 }}>
                    {task.name}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11 }}>
                    <span style={{ color: "var(--color-text-muted)" }}>
                      Vence: {new Date(task.end).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })}
                    </span>
                    <span style={{ color: task.progress > 50 ? "var(--color-warning)" : "var(--color-danger)", fontWeight: 600 }}>
                      {Math.round(task.progress)}% completado
                    </span>
                  </div>
                </div>
              ))}
              {metrics.criticalTasks.length === 0 && (
                <div style={{ padding: 16, textAlign: "center", color: "var(--color-text-muted)", fontSize: 13 }}>
                  ✓ No hay tareas críticas próximas
                </div>
              )}
            </div>
          </div>

          {/* Milestones Próximos */}
          {metrics.upcomingMilestones.length > 0 && (
            <div style={{
              background: "var(--color-surface)",
              borderRadius: "var(--radius-lg)",
              padding: 24,
              boxShadow: "var(--shadow-md)",
              border: "1px solid var(--color-border)",
            }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase" }}>
                🎯 Próximos Milestones
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {metrics.upcomingMilestones.map(milestone => (
                  <div key={milestone.id} style={{
                    padding: 12,
                    background: "linear-gradient(135deg, #f0e7ff, #e8f5ff)",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--color-purple)",
                  }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-purple)", marginBottom: 4 }}>
                      {milestone.name}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--color-text-muted)" }}>
                      📅 {new Date(milestone.start).toLocaleDateString('es-CL', { 
                        day: '2-digit', 
                        month: 'long',
                        year: 'numeric' 
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
