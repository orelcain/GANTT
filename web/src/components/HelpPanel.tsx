import { useState } from "react";
import { SHORTCUTS_HELP } from "../hooks/useKeyboardShortcuts";

export function HelpPanel() {
  const [isOpen, setIsOpen] = useState(false);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        title="Ayuda y atajos (? o H)"
        style={{
          position: "fixed",
          bottom: 16,
          right: 16,
          width: 40,
          height: 40,
          borderRadius: "50%",
          background: "var(--color-primary)",
          color: "white",
          border: "none",
          fontSize: 18,
          fontWeight: "bold",
          cursor: "pointer",
          boxShadow: "var(--shadow-lg)",
          zIndex: 100,
        }}
      >
        ?
      </button>
    );
  }

  return (
    <>
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.5)",
          zIndex: 999,
        }}
        onClick={() => setIsOpen(false)}
      />
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "var(--shadow-lg)",
          padding: 24,
          maxWidth: 500,
          width: "90%",
          maxHeight: "80vh",
          overflow: "auto",
          zIndex: 1000,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 18 }}>Ayuda y Atajos de Teclado</h2>
          <button
            onClick={() => setIsOpen(false)}
            style={{ fontSize: 20, padding: "4px 8px" }}
          >
            ✕
          </button>
        </div>

        <div style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 14, marginBottom: 8, color: "var(--color-primary)" }}>⌨️ Atajos de Teclado</h3>
          <div style={{ display: "grid", gap: 8 }}>
            {SHORTCUTS_HELP.map((shortcut) => (
              <div
                key={shortcut.key}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "6px 10px",
                  background: "var(--color-bg)",
                  borderRadius: "var(--radius-sm)",
                  fontSize: 12,
                }}
              >
                <kbd
                  style={{
                    background: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 3,
                    padding: "2px 6px",
                    fontFamily: "monospace",
                    fontSize: 11,
                  }}
                >
                  {shortcut.key}
                </kbd>
                <span style={{ color: "var(--color-text-muted)" }}>{shortcut.description}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 14, marginBottom: 8, color: "var(--color-primary)" }}>🎯 Funciones Principales</h3>
          <ul style={{ fontSize: 12, lineHeight: 1.6, color: "var(--color-text-muted)", margin: 0, paddingLeft: 20 }}>
            <li>Click en headers de columna para ordenar</li>
            <li>Drag del divisor para ajustar tamaño tabla/gantt</li>
            <li>Buscar tareas por nombre, responsable o estado</li>
            <li>Filtrar por tipo, estado o responsable</li>
            <li>Exportar datos a CSV, JSON o imprimir</li>
            <li>Colapsar/expandir jerarquía de tareas</li>
          </ul>
        </div>

        <div>
          <h3 style={{ fontSize: 14, marginBottom: 8, color: "var(--color-primary)" }}>ℹ️ Información</h3>
          <p style={{ fontSize: 11, color: "var(--color-text-muted)", margin: 0, lineHeight: 1.5 }}>
            ANTARFOOD Gantt · Versión 0.4.1<br />
            Frontend estático con Firebase Auth + Firestore<br />
            Desplegado en GitHub Pages con CI/CD automático
          </p>
        </div>
      </div>
    </>
  );
}
