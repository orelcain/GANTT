import { useState } from "react";
import type { Task } from "../lib/types";

type Props = {
  tasks: Task[];
};

export function ExportMenu({ tasks }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const exportToCSV = () => {
    const headers = ["ID", "Nombre", "Inicio", "Fin", "Progreso", "Estado", "Responsable", "Dependencias", "Tipo"];
    const rows = tasks.map(t => [
      t.id,
      t.name,
      t.start,
      t.end,
      t.progress,
      t.status || "",
      t.assignee || "",
      t.dependencies.join(","),
      t.type || "task"
    ]);

    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `gantt_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    setIsOpen(false);
  };

  const exportToJSON = () => {
    const json = JSON.stringify(tasks, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `gantt_${new Date().toISOString().split("T")[0]}.json`;
    link.click();
    setIsOpen(false);
  };

  const printGantt = () => {
    window.print();
    setIsOpen(false);
  };

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        title="Exportar datos"
        style={{ display: "flex", alignItems: "center", gap: 4 }}
      >
        📥 Exportar
      </button>
      
      {isOpen && (
        <>
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 999,
            }}
            onClick={() => setIsOpen(false)}
          />
          <div
            style={{
              position: "absolute",
              top: "100%",
              right: 0,
              marginTop: 4,
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
              boxShadow: "var(--shadow-lg)",
              zIndex: 1000,
              minWidth: 150,
            }}
          >
            <button
              onClick={exportToCSV}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "8px 12px",
                border: "none",
                background: "transparent",
                cursor: "pointer",
                fontSize: 12,
              }}
            >
              📊 CSV
            </button>
            <button
              onClick={exportToJSON}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "8px 12px",
                border: "none",
                background: "transparent",
                cursor: "pointer",
                fontSize: 12,
              }}
            >
              📄 JSON
            </button>
            <button
              onClick={printGantt}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "8px 12px",
                border: "none",
                background: "transparent",
                cursor: "pointer",
                fontSize: 12,
              }}
            >
              🖨️ Imprimir
            </button>
          </div>
        </>
      )}
    </div>
  );
}
