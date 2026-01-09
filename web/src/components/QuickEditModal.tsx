import { useState } from "react";

import type { Task } from "../lib/types";
import { useGanttStore } from "../lib/store";
import { CommentsPanel } from "./CommentsPanel";

type Props = {
  task: Task;
  onSave: (updates: Partial<Task>) => void;
  onClose: () => void;
  currentUser?: string;
};

export function QuickEditModal({ task, onSave, onClose, currentUser }: Props) {
  const { tags: availableTags } = useGanttStore();
  const [activeTab, setActiveTab] = useState<"details" | "comments">("details");
  const [name, setName] = useState(task.name);
  const [start, setStart] = useState(task.start);
  const [end, setEnd] = useState(task.end);
  const [progress, setProgress] = useState(task.progress);
  const [status, setStatus] = useState(task.status ?? "");
  const [assignee, setAssignee] = useState(task.assignee ?? "");
  const [deps, setDeps] = useState(task.dependencies.join(","));
  const [selectedTags, setSelectedTags] = useState<string[]>(task.tags || []);

  const isMilestone = task.type === "milestone";

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId]
    );
  };

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
      tags: selectedTags,
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

        {/* Tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20, borderBottom: "2px solid var(--color-border-default)" }}>
          <button
            onClick={() => setActiveTab("details")}
            style={{
              padding: "8px 16px",
              background: "none",
              border: "none",
              borderBottom: activeTab === "details" ? "2px solid #0969da" : "2px solid transparent",
              cursor: "pointer",
              fontWeight: activeTab === "details" ? 600 : 400,
              color: activeTab === "details" ? "#0969da" : "var(--color-fg-muted)",
              marginBottom: -2,
            }}
          >
            📝 Detalles
          </button>
          <button
            onClick={() => setActiveTab("comments")}
            style={{
              padding: "8px 16px",
              background: "none",
              border: "none",
              borderBottom: activeTab === "comments" ? "2px solid #0969da" : "2px solid transparent",
              cursor: "pointer",
              fontWeight: activeTab === "comments" ? 600 : 400,
              color: activeTab === "comments" ? "#0969da" : "var(--color-fg-muted)",
              marginBottom: -2,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            💬 Comentarios
            {task.comments && task.comments.length > 0 && (
              <span
                style={{
                  background: "#0969da",
                  color: "#fff",
                  padding: "2px 6px",
                  borderRadius: 10,
                  fontSize: 11,
                  fontWeight: 600,
                }}
              >
                {task.comments.length}
              </span>
            )}
          </button>
        </div>

        {activeTab === "details" ? (
        <>
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

          {/* Tags selector */}
          <div>
            <div style={{ fontWeight: 500, marginBottom: 8 }}>Tags</div>
            {availableTags.length === 0 ? (
              <div style={{ fontSize: 12, color: "var(--color-fg-muted)", fontStyle: "italic" }}>
                No hay tags disponibles. Créalos desde el Toolbar.
              </div>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {availableTags.map((tag) => {
                  const isSelected = selectedTags.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.id)}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 16,
                        border: isSelected ? `2px solid ${tag.color}` : "1px solid var(--color-border-default)",
                        background: isSelected ? `${tag.color}20` : "var(--color-canvas-subtle)",
                        color: isSelected ? tag.color : "var(--color-fg-default)",
                        fontSize: 12,
                        fontWeight: isSelected ? 600 : 400,
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: tag.color,
                        }}
                      />
                      {tag.name}
                      {isSelected && " ✓"}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, marginTop: 24, justifyContent: "flex-end" }}>
          <button onClick={onClose}>Cancelar</button>
          <button className="primary" onClick={handleSave}>
            Guardar
          </button>
        </div>
        </>
        ) : (
          <CommentsPanel task={task} currentUser={currentUser} />
        )}
      </div>
    </div>
  );
}
