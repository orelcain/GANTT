import { useState } from "react";
import { useGanttStore } from "../lib/store";

type Props = {
  onClose: () => void;
};

export function BaselineManager({ onClose }: Props) {
  const { baselines, activeBaselineId, addBaseline, deleteBaseline, setActiveBaseline } =
    useGanttStore();
  const [newBaselineName, setNewBaselineName] = useState("");

  const handleCapture = () => {
    if (!newBaselineName.trim()) {
      alert("Por favor ingresa un nombre para el baseline");
      return;
    }
    addBaseline(newBaselineName.trim());
    setNewBaselineName("");
  };

  const handleDelete = (baselineId: string) => {
    if (!confirm("¿Eliminar este baseline? Esta acción no se puede deshacer.")) return;
    deleteBaseline(baselineId);
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--color-canvas-default)",
          borderRadius: 12,
          width: "90%",
          maxWidth: 700,
          maxHeight: "85vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: 20,
            background: "linear-gradient(135deg, #0969da 0%, #0550ae 100%)",
            color: "#fff",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>
            📊 Gestión de Baselines
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.2)",
              border: "none",
              borderRadius: 6,
              padding: "6px 12px",
              color: "#fff",
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            ✕ Cerrar
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
          {/* Description */}
          <div
            style={{
              background: "var(--color-canvas-subtle)",
              padding: 16,
              borderRadius: 8,
              marginBottom: 24,
              fontSize: 13,
              color: "var(--color-fg-muted)",
              lineHeight: 1.5,
            }}
          >
            <strong>¿Qué es un Baseline?</strong>
            <br />
            Un baseline captura el estado actual de tu proyecto (fechas, progreso) para
            comparar más adelante y analizar varianzas. Útil para seguimiento de cambios y
            análisis de desviaciones.
          </div>

          {/* Capture new baseline */}
          <div style={{ marginBottom: 32 }}>
            <h3 style={{ marginBottom: 12, fontSize: 14, fontWeight: 600 }}>
              📸 Capturar Nuevo Baseline
            </h3>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="text"
                value={newBaselineName}
                onChange={(e) => setNewBaselineName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCapture();
                  if (e.key === "Escape") setNewBaselineName("");
                }}
                placeholder="Nombre del baseline (ej: 'Versión Inicial', 'Sprint 1')"
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  border: "1px solid var(--color-border-default)",
                  borderRadius: 6,
                  fontSize: 13,
                }}
              />
              <button
                onClick={handleCapture}
                disabled={!newBaselineName.trim()}
                style={{
                  padding: "8px 16px",
                  background: newBaselineName.trim()
                    ? "linear-gradient(180deg, #54a3ff 0%, #0969da 100%)"
                    : "var(--color-btn-bg)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  cursor: newBaselineName.trim() ? "pointer" : "not-allowed",
                  fontSize: 13,
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                }}
              >
                Capturar
              </button>
            </div>
          </div>

          {/* Baselines list */}
          <div>
            <h3 style={{ marginBottom: 12, fontSize: 14, fontWeight: 600 }}>
              📋 Baselines Guardados ({baselines.length})
            </h3>

            {baselines.length === 0 ? (
              <div
                style={{
                  padding: 32,
                  textAlign: "center",
                  color: "var(--color-fg-muted)",
                  fontSize: 13,
                }}
              >
                <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
                <div>No hay baselines guardados</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>
                  Captura uno arriba para empezar a comparar
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {baselines
                  .slice()
                  .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                  .map((baseline) => {
                    const isActive = baseline.id === activeBaselineId;
                    return (
                      <div
                        key={baseline.id}
                        style={{
                          border: `2px solid ${isActive ? "#0969da" : "var(--color-border-default)"}`,
                          borderRadius: 8,
                          padding: 16,
                          background: isActive ? "#ddf4ff" : "var(--color-canvas-subtle)",
                          display: "flex",
                          alignItems: "center",
                          gap: 16,
                          transition: "all 0.2s ease",
                        }}
                      >
                        {/* Icon */}
                        <div
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: "50%",
                            background: isActive
                              ? "linear-gradient(135deg, #0969da 0%, #0550ae 100%)"
                              : "var(--color-canvas-default)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 18,
                            flexShrink: 0,
                          }}
                        >
                          {isActive ? "✓" : "📊"}
                        </div>

                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: 14,
                              fontWeight: 600,
                              color: "var(--color-fg-default)",
                              marginBottom: 4,
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                            }}
                          >
                            {baseline.name}
                            {isActive && (
                              <span
                                style={{
                                  fontSize: 10,
                                  background: "#0969da",
                                  color: "#fff",
                                  padding: "2px 6px",
                                  borderRadius: 4,
                                  fontWeight: 600,
                                }}
                              >
                                ACTIVO
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: 12, color: "var(--color-fg-muted)" }}>
                            🕐 {formatDate(baseline.timestamp)} · {baseline.tasks.length} tareas
                          </div>
                        </div>

                        {/* Actions */}
                        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                          {isActive ? (
                            <button
                              onClick={() => setActiveBaseline(null)}
                              style={{
                                padding: "6px 12px",
                                background: "var(--color-canvas-default)",
                                border: "1px solid var(--color-border-default)",
                                borderRadius: 6,
                                cursor: "pointer",
                                fontSize: 12,
                                color: "var(--color-fg-muted)",
                              }}
                              title="Desactivar comparación"
                            >
                              Desactivar
                            </button>
                          ) : (
                            <button
                              onClick={() => setActiveBaseline(baseline.id)}
                              style={{
                                padding: "6px 12px",
                                background: "linear-gradient(180deg, #54a3ff 0%, #0969da 100%)",
                                color: "#fff",
                                border: "none",
                                borderRadius: 6,
                                cursor: "pointer",
                                fontSize: 12,
                                fontWeight: 600,
                              }}
                              title="Activar para comparación"
                            >
                              Activar
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(baseline.id)}
                            style={{
                              padding: "6px 12px",
                              background: "none",
                              border: "1px solid var(--color-border-default)",
                              borderRadius: 6,
                              cursor: "pointer",
                              fontSize: 12,
                              color: "var(--color-danger-fg)",
                            }}
                            title="Eliminar baseline"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
