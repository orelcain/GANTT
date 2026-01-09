import { useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import type { Task } from "../lib/types";

type Props = {
  tasks: Task[];
};

export function ExportMenu({ tasks }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const getGanttContainer = (): HTMLElement | null => {
    return document.querySelector('[data-gantt-container]') as HTMLElement;
  };

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

  const exportToPNG = async () => {
    const container = getGanttContainer();
    if (!container) {
      alert("No se puede capturar el Gantt en este momento");
      return;
    }

    setIsExporting(true);
    try {
      const canvas = await html2canvas(container, {
        scale: 2, // Alta calidad
        backgroundColor: "#ffffff",
        logging: false,
        useCORS: true,
      });

      canvas.toBlob((blob) => {
        if (blob) {
          const link = document.createElement("a");
          link.href = URL.createObjectURL(blob);
          link.download = `gantt_${new Date().toISOString().split("T")[0]}.png`;
          link.click();
        }
        setIsExporting(false);
        setIsOpen(false);
      });
    } catch (error) {
      console.error("Error al exportar PNG:", error);
      alert("Error al generar la imagen");
      setIsExporting(false);
    }
  };

  const exportToPDF = async () => {
    const container = getGanttContainer();
    if (!container) {
      alert("No se puede capturar el Gantt en este momento");
      return;
    }

    setIsExporting(true);
    try {
      const canvas = await html2canvas(container, {
        scale: 2,
        backgroundColor: "#ffffff",
        logging: false,
        useCORS: true,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? "landscape" : "portrait",
        unit: "px",
        format: [canvas.width, canvas.height],
      });

      pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
      pdf.save(`gantt_${new Date().toISOString().split("T")[0]}.pdf`);
      
      setIsExporting(false);
      setIsOpen(false);
    } catch (error) {
      console.error("Error al exportar PDF:", error);
      alert("Error al generar el PDF");
      setIsExporting(false);
    }
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
        disabled={isExporting}
      >
        {isExporting ? "⏳" : "📥"} Exportar
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
              boxShadow: "0 8px 24px rgba(0, 0, 0, 0.15)",
              zIndex: 1000,
              minWidth: 180,
              overflow: "hidden",
            }}
          >
            <div style={{ padding: "6px 12px", fontSize: 10, fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", borderBottom: "1px solid var(--color-border-light)" }}>
              Exportar como
            </div>
            
            <button
              onClick={exportToPDF}
              disabled={isExporting}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                width: "100%",
                textAlign: "left",
                padding: "10px 12px",
                border: "none",
                background: "transparent",
                cursor: isExporting ? "not-allowed" : "pointer",
                fontSize: 13,
                transition: "background 0.15s ease",
              }}
              onMouseEnter={(e) => !isExporting && (e.currentTarget.style.background = "var(--color-bg)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <span style={{ fontSize: 16 }}>📕</span>
              <span style={{ fontWeight: 500 }}>PDF Document</span>
            </button>

            <button
              onClick={exportToPNG}
              disabled={isExporting}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                width: "100%",
                textAlign: "left",
                padding: "10px 12px",
                border: "none",
                background: "transparent",
                cursor: isExporting ? "not-allowed" : "pointer",
                fontSize: 13,
                transition: "background 0.15s ease",
              }}
              onMouseEnter={(e) => !isExporting && (e.currentTarget.style.background = "var(--color-bg)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <span style={{ fontSize: 16 }}>🖼️</span>
              <span style={{ fontWeight: 500 }}>PNG Image</span>
            </button>

            <div style={{ height: 1, background: "var(--color-border-light)", margin: "4px 0" }} />

            <button
              onClick={exportToCSV}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                width: "100%",
                textAlign: "left",
                padding: "10px 12px",
                border: "none",
                background: "transparent",
                cursor: "pointer",
                fontSize: 13,
                transition: "background 0.15s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-bg)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <span style={{ fontSize: 16 }}>📊</span>
              <span style={{ fontWeight: 500 }}>CSV Spreadsheet</span>
            </button>
            
            <button
              onClick={exportToJSON}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                width: "100%",
                textAlign: "left",
                padding: "10px 12px",
                border: "none",
                background: "transparent",
                cursor: "pointer",
                fontSize: 13,
                transition: "background 0.15s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-bg)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <span style={{ fontSize: 16 }}>📄</span>
              <span style={{ fontWeight: 500 }}>JSON Data</span>
            </button>

            <div style={{ height: 1, background: "var(--color-border-light)", margin: "4px 0" }} />

            <button
              onClick={printGantt}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                width: "100%",
                textAlign: "left",
                padding: "10px 12px",
                border: "none",
                background: "transparent",
                cursor: "pointer",
                fontSize: 13,
                transition: "background 0.15s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-bg)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <span style={{ fontSize: 16 }}>🖨️</span>
              <span style={{ fontWeight: 500 }}>Print Preview</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
