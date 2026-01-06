import { useRef, useState } from "react";

import { importFromExcel } from "../lib/excelImport";
import { useGanttStore } from "../lib/store";

export function ImportExcel() {
  const replaceAll = useGanttStore((s) => s.replaceAll);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <button
        onClick={() => inputRef.current?.click()}
        disabled={isImporting}
        className="primary"
        title="Importar tareas desde Excel"
      >
        {isImporting ? "Importando..." : "Importar Excel"}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xlsm,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        style={{ display: "none" }}
        disabled={isImporting}
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;

          setIsImporting(true);
          setError(null);
          try {
            const tasks = await importFromExcel(file);
            await replaceAll(tasks);
            alert(`Importadas ${tasks.length} tareas correctamente.`);
          } catch (err) {
            setError(String(err));
            alert(`Error: ${String(err)}`);
          } finally {
            setIsImporting(false);
            e.target.value = "";
          }
        }}
      />

      {error && (
        <div style={{ position: "fixed", bottom: 24, right: 24, background: "#fff5f5", padding: 12, borderRadius: 8, border: "1px solid #d73a49", maxWidth: 400 }}>
          <strong>Error:</strong> {error}
        </div>
      )}
    </>
  );
}
