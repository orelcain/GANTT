import { useState, useMemo } from "react";
import type { Task } from "../lib/types";
import { useGanttStore } from "../lib/store";

type Props = {
  tasks: Task[];
  canEdit?: boolean;
};

type ColumnId = "pending" | "in-progress" | "completed" | "overdue";

type Column = {
  id: ColumnId;
  title: string;
  color: string;
  gradient: string;
};

const COLUMNS: Column[] = [
  { 
    id: "pending", 
    title: "📋 Pendiente", 
    color: "#0969da",
    gradient: "linear-gradient(135deg, #e8f5ff, #ddf4ff)"
  },
  { 
    id: "in-progress", 
    title: "⚡ En Progreso", 
    color: "#bf8700",
    gradient: "linear-gradient(135deg, #fff8c5, #fae17d)"
  },
  { 
    id: "completed", 
    title: "✅ Completado", 
    color: "#1a7f37",
    gradient: "linear-gradient(135deg, #dafbe1, #aceebb)"
  },
  { 
    id: "overdue", 
    title: "⚠️ Atrasado", 
    color: "#cf222e",
    gradient: "linear-gradient(135deg, #ffebe9, #ffc1b9)"
  },
];

function getTaskStatus(task: Task): ColumnId {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(task.end);
  end.setHours(0, 0, 0, 0);

  if (task.progress === 100) return "completed";
  if (end < today) return "overdue";
  if (task.progress > 0) return "in-progress";
  return "pending";
}

export function KanbanView({ tasks, canEdit = false }: Props) {
  const { upsertTask } = useGanttStore();
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<ColumnId | null>(null);

  const tasksByColumn = useMemo(() => {
    const grouped = tasks.reduce((acc, task) => {
      const status = getTaskStatus(task);
      if (!acc[status]) acc[status] = [];
      acc[status].push(task);
      return acc;
    }, {} as Record<ColumnId, Task[]>);

    return grouped;
  }, [tasks]);

  const columnMetrics = useMemo(() => {
    return COLUMNS.map((col) => {
      const columnTasks = tasksByColumn[col.id] || [];
      const totalProgress = columnTasks.reduce((sum, t) => sum + t.progress, 0);
      const avgProgress = columnTasks.length > 0 ? Math.round(totalProgress / columnTasks.length) : 0;
      
      return {
        id: col.id,
        count: columnTasks.length,
        avgProgress,
      };
    });
  }, [tasksByColumn]);

  const handleDragStart = (task: Task, e: React.DragEvent) => {
    if (!canEdit) return;
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (columnId: ColumnId, e: React.DragEvent) => {
    if (!canEdit || !draggedTask) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverColumn(columnId);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = async (columnId: ColumnId, e: React.DragEvent) => {
    e.preventDefault();
    if (!canEdit || !draggedTask) return;

    const currentStatus = getTaskStatus(draggedTask);
    if (currentStatus === columnId) {
      setDraggedTask(null);
      setDragOverColumn(null);
      return;
    }

    // Actualizar progreso según la columna destino
    let newProgress = draggedTask.progress;
    if (columnId === "pending") newProgress = 0;
    else if (columnId === "in-progress" && newProgress === 0) newProgress = 50;
    else if (columnId === "completed") newProgress = 100;

    await upsertTask({ ...draggedTask, progress: newProgress });
    setDraggedTask(null);
    setDragOverColumn(null);
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
    setDragOverColumn(null);
  };

  return (
    <div style={{
      display: "flex",
      gap: 16,
      padding: 16,
      height: "100%",
      overflowX: "auto",
      background: "var(--color-canvas-subtle)",
    }}>
      {COLUMNS.map((column) => {
        const columnTasks = tasksByColumn[column.id] || [];
        const metrics = columnMetrics.find((m) => m.id === column.id);
        const isOver = dragOverColumn === column.id;

        return (
          <div
            key={column.id}
            onDragOver={(e) => handleDragOver(column.id, e)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(column.id, e)}
            style={{
              flex: "1",
              minWidth: 280,
              maxWidth: 400,
              display: "flex",
              flexDirection: "column",
              background: "var(--color-canvas-default)",
              borderRadius: 8,
              border: isOver 
                ? `2px dashed ${column.color}` 
                : "1px solid var(--color-border-default)",
              boxShadow: isOver 
                ? `0 0 0 3px ${column.color}20` 
                : "0 1px 3px rgba(0,0,0,0.08)",
              transition: "all 0.2s ease",
            }}
          >
            {/* Header */}
            <div style={{
              padding: "12px 16px",
              background: column.gradient,
              borderBottom: "1px solid var(--color-border-default)",
              borderTopLeftRadius: 8,
              borderTopRightRadius: 8,
            }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 8,
              }}>
                <h3 style={{
                  margin: 0,
                  fontSize: 14,
                  fontWeight: 600,
                  color: column.color,
                }}>
                  {column.title}
                </h3>
                <span style={{
                  background: column.color,
                  color: "#fff",
                  padding: "2px 8px",
                  borderRadius: 12,
                  fontSize: 12,
                  fontWeight: 600,
                }}>
                  {metrics?.count || 0}
                </span>
              </div>
              {metrics && metrics.count > 0 && column.id !== "pending" && (
                <div style={{
                  fontSize: 11,
                  color: column.color,
                  opacity: 0.8,
                }}>
                  Progreso promedio: {metrics.avgProgress}%
                </div>
              )}
            </div>

            {/* Cards Container */}
            <div style={{
              flex: 1,
              padding: 12,
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}>
              {columnTasks.length === 0 ? (
                <div style={{
                  padding: 24,
                  textAlign: "center",
                  color: "var(--color-fg-muted)",
                  fontSize: 13,
                }}>
                  Sin tareas
                </div>
              ) : (
                columnTasks.map((task) => {
                  const isDragging = draggedTask?.id === task.id;
                  const assigneeInitials = task.assignee 
                    ? task.assignee.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
                    : "?";
                  
                  const assigneeColor = task.assignee 
                    ? `hsl(${task.assignee.charCodeAt(0) * 137.5 % 360}, 65%, 50%)`
                    : "#6e7781";

                  return (
                    <div
                      key={task.id}
                      draggable={canEdit}
                      onDragStart={(e) => handleDragStart(task, e)}
                      onDragEnd={handleDragEnd}
                      style={{
                        padding: 12,
                        background: isDragging 
                          ? "var(--color-canvas-subtle)" 
                          : "var(--color-canvas-default)",
                        border: "1px solid var(--color-border-default)",
                        borderRadius: 6,
                        cursor: canEdit ? "grab" : "default",
                        opacity: isDragging ? 0.5 : 1,
                        boxShadow: isDragging 
                          ? "0 4px 12px rgba(0,0,0,0.15)" 
                          : "0 1px 3px rgba(0,0,0,0.08)",
                        transition: "all 0.2s ease",
                      }}
                    >
                      {/* Task Name */}
                      <div style={{
                        fontWeight: 500,
                        fontSize: 13,
                        marginBottom: 8,
                        color: "var(--color-fg-default)",
                        lineHeight: 1.4,
                      }}>
                        {task.type === "milestone" && "◆ "}
                        {task.name}
                      </div>

                      {/* Dates */}
                      <div style={{
                        fontSize: 11,
                        color: "var(--color-fg-muted)",
                        marginBottom: 8,
                      }}>
                        📅 {new Date(task.start).toLocaleDateString("es-ES", { 
                          day: "numeric", 
                          month: "short" 
                        })} → {new Date(task.end).toLocaleDateString("es-ES", { 
                          day: "numeric", 
                          month: "short" 
                        })}
                      </div>

                      {/* Progress Bar */}
                      {task.type !== "milestone" && (
                        <div style={{
                          marginBottom: 8,
                        }}>
                          <div style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: 4,
                          }}>
                            <span style={{
                              fontSize: 10,
                              color: "var(--color-fg-muted)",
                            }}>
                              Progreso
                            </span>
                            <span style={{
                              fontSize: 10,
                              fontWeight: 600,
                              color: column.color,
                            }}>
                              {task.progress}%
                            </span>
                          </div>
                          <div style={{
                            height: 4,
                            background: "var(--color-canvas-subtle)",
                            borderRadius: 2,
                            overflow: "hidden",
                          }}>
                            <div style={{
                              width: `${task.progress}%`,
                              height: "100%",
                              background: column.color,
                              transition: "width 0.3s ease",
                            }} />
                          </div>
                        </div>
                      )}

                      {/* Footer */}
                      <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginTop: 8,
                      }}>
                        {/* Avatar */}
                        <div
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: "50%",
                            background: assigneeColor,
                            color: "#fff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 10,
                            fontWeight: 600,
                            boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                          }}
                          title={task.assignee || "Sin asignar"}
                        >
                          {assigneeInitials}
                        </div>

                        {/* Dependencies Badge */}
                        {task.dependencies && task.dependencies.length > 0 && (
                          <div style={{
                            background: "var(--color-accent-subtle)",
                            color: "var(--color-accent-fg)",
                            padding: "2px 6px",
                            borderRadius: 4,
                            fontSize: 10,
                            fontWeight: 500,
                          }}>
                            🔗 {task.dependencies.length}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
