import { useState } from "react";
import { useGanttStore } from "../lib/store";
import type { Tag } from "../lib/types";

type Props = {
  onClose: () => void;
};

const PRESET_COLORS = [
  "#cf222e", // rojo
  "#bf8700", // amarillo
  "#1a7f37", // verde
  "#0969da", // azul
  "#8250df", // púrpura
  "#bc4c00", // naranja
  "#d1242f", // rosa
  "#6e7781", // gris
];

export function TagsManager({ onClose }: Props) {
  const { tags, addTag, updateTag, deleteTag } = useGanttStore();
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState(PRESET_COLORS[0]);

  const handleCreate = () => {
    if (!newTagName.trim()) return;
    
    const id = newTagName.toLowerCase().replace(/\s+/g, "-");
    if (tags.some((t) => t.id === id)) {
      alert("Ya existe un tag con ese nombre");
      return;
    }

    addTag({ id, name: newTagName.trim(), color: newTagColor });
    setNewTagName("");
    setNewTagColor(PRESET_COLORS[0]);
  };

  const handleUpdate = (tag: Tag) => {
    if (!tag.name.trim()) return;
    updateTag(tag);
    setEditingTag(null);
  };

  const handleDelete = (tagId: string) => {
    if (confirm("¿Eliminar este tag? Se removerá de todas las tareas.")) {
      deleteTag(tagId);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        animation: "fadeIn 0.2s ease",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--color-canvas-default)",
          borderRadius: 12,
          boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
          width: "90%",
          maxWidth: 600,
          maxHeight: "80vh",
          display: "flex",
          flexDirection: "column",
          animation: "slideUp 0.3s ease",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid var(--color-border-default)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "linear-gradient(135deg, #e8f5ff, #ddf4ff)",
            borderTopLeftRadius: 12,
            borderTopRightRadius: 12,
          }}
        >
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: "#0969da" }}>
            🏷️ Gestión de Tags
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: 24,
              cursor: "pointer",
              padding: 4,
              color: "var(--color-fg-muted)",
            }}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 24, flex: 1, overflowY: "auto" }}>
          {/* Crear nuevo tag */}
          <div
            style={{
              background: "var(--color-canvas-subtle)",
              padding: 16,
              borderRadius: 8,
              marginBottom: 24,
              border: "1px solid var(--color-border-default)",
            }}
          >
            <h3 style={{ margin: "0 0 12px 0", fontSize: 14, fontWeight: 600 }}>
              Crear nuevo tag
            </h3>
            <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 12, color: "var(--color-fg-muted)", display: "block", marginBottom: 4 }}>
                  Nombre
                </label>
                <input
                  type="text"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="ej: Urgente"
                  style={{
                    width: "100%",
                    padding: "6px 10px",
                    borderRadius: 6,
                    border: "1px solid var(--color-border-default)",
                    background: "var(--color-canvas-default)",
                    fontSize: 13,
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreate();
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, color: "var(--color-fg-muted)", display: "block", marginBottom: 4 }}>
                  Color
                </label>
                <div style={{ display: "flex", gap: 4 }}>
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setNewTagColor(color)}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 6,
                        background: color,
                        border: newTagColor === color ? "3px solid var(--color-accent-fg)" : "1px solid var(--color-border-default)",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                      }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
              <button
                onClick={handleCreate}
                disabled={!newTagName.trim()}
                style={{
                  padding: "8px 16px",
                  background: "#0969da",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  cursor: newTagName.trim() ? "pointer" : "not-allowed",
                  fontWeight: 500,
                  fontSize: 13,
                  opacity: newTagName.trim() ? 1 : 0.5,
                }}
              >
                + Crear
              </button>
            </div>
          </div>

          {/* Lista de tags existentes */}
          <div>
            <h3 style={{ margin: "0 0 12px 0", fontSize: 14, fontWeight: 600 }}>
              Tags existentes ({tags.length})
            </h3>
            {tags.length === 0 ? (
              <div style={{ textAlign: "center", padding: 32, color: "var(--color-fg-muted)", fontSize: 13 }}>
                No hay tags. Crea uno arriba para comenzar.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {tags.map((tag) => (
                  <div
                    key={tag.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: 12,
                      background: "var(--color-canvas-subtle)",
                      borderRadius: 6,
                      border: "1px solid var(--color-border-default)",
                    }}
                  >
                    {editingTag?.id === tag.id ? (
                      <>
                        <input
                          type="text"
                          value={editingTag.name}
                          onChange={(e) => setEditingTag({ ...editingTag, name: e.target.value })}
                          style={{
                            flex: 1,
                            padding: "4px 8px",
                            borderRadius: 4,
                            border: "1px solid var(--color-border-default)",
                            background: "var(--color-canvas-default)",
                            fontSize: 13,
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleUpdate(editingTag);
                            if (e.key === "Escape") setEditingTag(null);
                          }}
                          autoFocus
                        />
                        <div style={{ display: "flex", gap: 4 }}>
                          {PRESET_COLORS.map((color) => (
                            <button
                              key={color}
                              onClick={() => setEditingTag({ ...editingTag, color })}
                              style={{
                                width: 24,
                                height: 24,
                                borderRadius: 4,
                                background: color,
                                border: editingTag.color === color ? "2px solid var(--color-accent-fg)" : "1px solid var(--color-border-default)",
                                cursor: "pointer",
                              }}
                            />
                          ))}
                        </div>
                        <button
                          onClick={() => handleUpdate(editingTag)}
                          style={{
                            padding: "4px 12px",
                            background: "#1a7f37",
                            color: "#fff",
                            border: "none",
                            borderRadius: 4,
                            cursor: "pointer",
                            fontSize: 12,
                          }}
                        >
                          ✓ Guardar
                        </button>
                        <button
                          onClick={() => setEditingTag(null)}
                          style={{
                            padding: "4px 12px",
                            background: "var(--color-canvas-subtle)",
                            border: "1px solid var(--color-border-default)",
                            borderRadius: 4,
                            cursor: "pointer",
                            fontSize: 12,
                          }}
                        >
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <>
                        <div
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: 4,
                            background: tag.color,
                            flexShrink: 0,
                          }}
                        />
                        <span
                          style={{
                            flex: 1,
                            fontSize: 13,
                            fontWeight: 500,
                            color: "var(--color-fg-default)",
                          }}
                        >
                          {tag.name}
                        </span>
                        <button
                          onClick={() => setEditingTag(tag)}
                          style={{
                            padding: "4px 12px",
                            background: "var(--color-canvas-subtle)",
                            border: "1px solid var(--color-border-default)",
                            borderRadius: 4,
                            cursor: "pointer",
                            fontSize: 12,
                          }}
                        >
                          ✏️ Editar
                        </button>
                        <button
                          onClick={() => handleDelete(tag.id)}
                          style={{
                            padding: "4px 12px",
                            background: "#cf222e",
                            color: "#fff",
                            border: "none",
                            borderRadius: 4,
                            cursor: "pointer",
                            fontSize: 12,
                          }}
                        >
                          🗑️ Eliminar
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid var(--color-border-default)",
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "8px 20px",
              background: "#0969da",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
