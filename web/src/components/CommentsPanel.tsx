import { useState, useMemo } from "react";
import type { Task, Comment } from "../lib/types";
import { useGanttStore } from "../lib/store";

type Props = {
  task: Task;
  currentUser?: string;
};

export function CommentsPanel({ task, currentUser = "Usuario Anónimo" }: Props) {
  const { upsertTask } = useGanttStore();
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const comments = useMemo(() => {
    return (task.comments || []).sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [task.comments]);

  const handleAddComment = async () => {
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const comment: Comment = {
      id: `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      taskId: task.id,
      author: currentUser,
      content: newComment.trim(),
      timestamp: new Date().toISOString(),
    };

    const updatedComments = [...(task.comments || []), comment];
    await upsertTask({ ...task, comments: updatedComments });
    setNewComment("");
    setIsSubmitting(false);
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("¿Eliminar este comentario?")) return;

    const updatedComments = (task.comments || []).filter((c) => c.id !== commentId);
    await upsertTask({ ...task, comments: updatedComments });
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Ahora";
    if (diffMins < 60) return `Hace ${diffMins}m`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays < 7) return `Hace ${diffDays}d`;
    
    return date.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  };

  const highlightMentions = (content: string) => {
    // Detectar @menciones y resaltarlas
    const parts = content.split(/(@\w+)/g);
    return parts.map((part, idx) => {
      if (part.startsWith("@")) {
        return (
          <span
            key={idx}
            style={{
              color: "#0969da",
              fontWeight: 600,
              background: "#ddf4ff",
              padding: "2px 4px",
              borderRadius: 3,
            }}
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, flex: 1 }}>
          💬 Comentarios ({comments.length})
        </h3>
      </div>

      {/* Add new comment */}
      <div
        style={{
          background: "var(--color-canvas-subtle)",
          padding: 12,
          borderRadius: 8,
          border: "1px solid var(--color-border-default)",
        }}
      >
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Escribe un comentario... (usa @nombre para mencionar)"
          style={{
            width: "100%",
            minHeight: 60,
            padding: 8,
            borderRadius: 6,
            border: "1px solid var(--color-border-default)",
            background: "var(--color-canvas-default)",
            fontSize: 13,
            fontFamily: "inherit",
            resize: "vertical",
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && e.ctrlKey) {
              handleAddComment();
            }
          }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
          <span style={{ fontSize: 11, color: "var(--color-fg-muted)" }}>
            Ctrl+Enter para enviar
          </span>
          <button
            onClick={handleAddComment}
            disabled={!newComment.trim() || isSubmitting}
            style={{
              padding: "6px 16px",
              background: !newComment.trim() || isSubmitting ? "var(--color-canvas-subtle)" : "#0969da",
              color: !newComment.trim() || isSubmitting ? "var(--color-fg-muted)" : "#fff",
              border: "none",
              borderRadius: 6,
              cursor: !newComment.trim() || isSubmitting ? "not-allowed" : "pointer",
              fontWeight: 500,
              fontSize: 13,
            }}
          >
            {isSubmitting ? "Enviando..." : "Comentar"}
          </button>
        </div>
      </div>

      {/* Comments list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, maxHeight: 400, overflowY: "auto" }}>
        {comments.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: 32,
              color: "var(--color-fg-muted)",
              fontSize: 13,
              fontStyle: "italic",
            }}
          >
            No hay comentarios aún. ¡Sé el primero en comentar!
          </div>
        ) : (
          comments.map((comment) => {
            const isOwnComment = comment.author === currentUser;
            return (
              <div
                key={comment.id}
                style={{
                  padding: 12,
                  background: "var(--color-canvas-subtle)",
                  borderRadius: 8,
                  border: "1px solid var(--color-border-default)",
                  position: "relative",
                }}
              >
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {/* Avatar */}
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        background: `hsl(${comment.author.charCodeAt(0) * 137.5 % 360}, 65%, 50%)`,
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 11,
                        fontWeight: 600,
                        flexShrink: 0,
                      }}
                    >
                      {comment.author.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-fg-default)" }}>
                        {comment.author}
                        {isOwnComment && (
                          <span
                            style={{
                              marginLeft: 6,
                              fontSize: 10,
                              color: "var(--color-fg-muted)",
                              fontWeight: 400,
                            }}
                          >
                            (tú)
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--color-fg-muted)" }}>
                        {formatTimestamp(comment.timestamp)}
                      </div>
                    </div>
                  </div>
                  {isOwnComment && (
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      style={{
                        padding: "4px 8px",
                        background: "none",
                        border: "1px solid var(--color-border-default)",
                        borderRadius: 4,
                        cursor: "pointer",
                        fontSize: 11,
                        color: "var(--color-fg-muted)",
                      }}
                      title="Eliminar comentario"
                    >
                      🗑️
                    </button>
                  )}
                </div>

                {/* Content */}
                <div
                  style={{
                    fontSize: 13,
                    color: "var(--color-fg-default)",
                    lineHeight: 1.5,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {highlightMentions(comment.content)}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
