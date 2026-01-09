import { useState } from "react";

import type { Task } from "../lib/types";

type Props = {
  task: Task;
  onSave: (updates: Partial<Task>) => void;
  onClose: () => void;
};

export function QuickEditModal({ task, onSave, onClose }: Props) {
  const [name, setName] = useState(task.name);
  const [start, setStart] = useState(task.start);
  const [end, setEnd] = useState(task.end);
  const [progress, setProgress] = useState(task.progress);
  const [status, setStatus] = useState(task.status ?? "");
  const [assignee, setAssignee] = useState(task.assignee ?? "");
  const [deps, setDeps] = useState(task.dependencies.join(","));

  const isMilestone = task.type === "milestone";

  const handleSave = () => {
    const updates: Partial<Task> = {
      name,
      start,
      progress: isMilestone ? 100 : progress,
      status: status || null,
      assignee: assignee || null,
      dependencies: deps
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    };

    if (!isMilestone) {
      updates.end = end;
    }

    onSave(updates);
    onClose();
  };

  return (
    <div
      className="modal-overlay"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2000,
        animation: "fadeIn 0.2s ease",
      }}
      onClick={onClose}
    >
      <div
        className="modal-content"
        style={{
          background: "var(--color-surface)",
          borderRadius: 12,
          padding: 24,
          minWidth: 500,
          maxWidth: 600,
          maxHeight: "80vh",
          overflow: "auto",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.18)",
          animation: "slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 18 }}>
            {isMilestone ? "🔷 Editar Milestone" : "📋 Editar Tarea"}
          </h2>
          <button onClick={onClose} title="Cerrar">
            ×
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <label>
            <div style={{ fontWeight: 500, marginBottom: 6 }}>Nombre</div>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ width: "100%" }}
              autoFocus
            />
          </label>

          <div style={{ display: "grid", gridTemplateColumns: isMilestone ? "1fr" : "1fr 1fr", gap: 16 }}>
            <label>
              <div style={{ fontWeight: 500, marginBottom: 6 }}>Fecha inicio</div>
              <input
                type="date"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                style={{ width: "100%" }}
              />
            </label>

            {!isMilestone && (
              <label>
                <div style={{ fontWeight: 500, marginBottom: 6 }}>Fecha fin</div>
                <input
                  type="date"
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                  style={{ width: "100%" }}
                />
              </label>
            )}
          </div>

          {!isMilestone && (
            <label>
              <div style={{ fontWeight: 500, marginBottom: 6 }}>Progreso (%)</div>
              <input
                type="number"
                min={0}
                max={100}
                value={progress}
                onChange={(e) => setProgress(Number(e.target.value))}
                style={{ width: "100%" }}
              />
            </label>
          )}

          <label>
            <div style={{ fontWeight: 500, marginBottom: 6 }}>Estado</div>
            <input
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={{ width: "100%" }}
              placeholder="En progreso, Completado, etc."
            />
          </label>

          <label>
            <div style={{ fontWeight: 500, marginBottom: 6 }}>Responsable</div>
            <input
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              style={{ width: "100%" }}
              placeholder="Nombre del responsable"
            />
          </label>

          <label>
            <div style={{ fontWeight: 500, marginBottom: 6 }}>Dependencias (IDs separados por coma)</div>
            <input
              value={deps}
              onChange={(e) => setDeps(e.target.value)}
              style={{ width: "100%" }}
              placeholder="1, 2, 3"
            />
          </label>
        </div>

        <div style={{ display: "flex", gap: 12, marginTop: 24, justifyContent: "flex-end" }}>
          <button onClick={onClose}>Cancelar</button>
          <button className="primary" onClick={handleSave}>
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
