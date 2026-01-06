import { useMemo } from "react";
import type { Task } from "../lib/types";

type Props = {
  tasks: Task[];
};

type ResourceData = {
  name: string;
  taskCount: number;
  inProgress: number;
  completed: number;
  avgProgress: number;
  tasks: Task[];
};

export function ResourceView({ tasks }: Props) {
  const resourceData = useMemo(() => {
    const byAssignee = new Map<string, Task[]>();

    tasks.forEach((task) => {
      const assignee = task.assignee || "Sin asignar";
      if (!byAssignee.has(assignee)) {
        byAssignee.set(assignee, []);
      }
      byAssignee.get(assignee)!.push(task);
    });

    const resources: ResourceData[] = [];
    byAssignee.forEach((taskList, name) => {
      const inProgress = taskList.filter((t) => t.progress > 0 && t.progress < 100).length;
      const completed = taskList.filter((t) => t.progress === 100).length;
      const avgProgress = taskList.reduce((sum, t) => sum + t.progress, 0) / taskList.length;

      resources.push({
        name,
        taskCount: taskList.length,
        inProgress,
        completed,
        avgProgress,
        tasks: taskList.sort((a, b) => a.start.localeCompare(b.start)),
      });
    });

    return resources.sort((a, b) => b.taskCount - a.taskCount);
  }, [tasks]);

  return (
    <div style={{ height: "100%", overflow: "auto", padding: 12 }}>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 16, margin: 0, marginBottom: 4 }}>Vista de Recursos</h2>
        <p style={{ fontSize: 11, color: "var(--color-text-muted)", margin: 0 }}>
          Distribución de tareas por responsable
        </p>
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        {resourceData.map((resource) => (
          <div
            key={resource.name}
            style={{
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
              padding: 12,
              background: "var(--color-surface)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <h3 style={{ fontSize: 13, margin: 0, fontWeight: 600 }}>
                {resource.name}
              </h3>
              <span
                style={{
                  fontSize: 10,
                  padding: "2px 6px",
                  background: "var(--color-bg)",
                  borderRadius: 3,
                  color: "var(--color-text-muted)",
                }}
              >
                {resource.taskCount} tareas
              </span>
            </div>

            <div style={{ display: "flex", gap: 12, marginBottom: 8, fontSize: 11 }}>
              <div>
                <span style={{ color: "var(--color-text-muted)" }}>En progreso: </span>
                <strong style={{ color: "var(--color-warning)" }}>{resource.inProgress}</strong>
              </div>
              <div>
                <span style={{ color: "var(--color-text-muted)" }}>Completadas: </span>
                <strong style={{ color: "var(--color-success)" }}>{resource.completed}</strong>
              </div>
              <div>
                <span style={{ color: "var(--color-text-muted)" }}>Progreso: </span>
                <strong style={{ color: "var(--color-primary)" }}>{Math.round(resource.avgProgress)}%</strong>
              </div>
            </div>

            <div
              style={{
                height: 10,
                background: "var(--color-border-light)",
                borderRadius: 5,
                overflow: "hidden",
                marginBottom: 8,
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${resource.avgProgress}%`,
                  background:
                    resource.avgProgress === 100
                      ? "var(--color-success)"
                      : resource.avgProgress >= 75
                        ? "var(--color-primary)"
                        : resource.avgProgress >= 50
                          ? "var(--color-warning)"
                          : "var(--color-critical)",
                  transition: "width 0.3s ease",
                }}
              />
            </div>

            <details style={{ fontSize: 11 }}>
              <summary
                style={{
                  cursor: "pointer",
                  color: "var(--color-primary)",
                  padding: "4px 0",
                  userSelect: "none",
                }}
              >
                Ver tareas ({resource.tasks.length})
              </summary>
              <div style={{ marginTop: 8, paddingLeft: 8 }}>
                {resource.tasks.map((task) => (
                  <div
                    key={task.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "4px 0",
                      borderBottom: "1px solid var(--color-border-light)",
                    }}
                  >
                    <span style={{ color: "var(--color-text)" }}>{task.name}</span>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span style={{ color: "var(--color-text-muted)", fontSize: 10 }}>
                        {task.start} → {task.end}
                      </span>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 600,
                          color:
                            task.progress === 100
                              ? "var(--color-success)"
                              : task.progress > 0
                                ? "var(--color-warning)"
                                : "var(--color-text-muted)",
                        }}
                      >
                        {Math.round(task.progress)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </details>
          </div>
        ))}
      </div>
    </div>
  );
}
