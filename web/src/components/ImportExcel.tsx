import { useState } from "react";

import { importFromExcel } from "../lib/excelImport";
import { useGanttStore } from "../lib/store";

export function ImportExcel() {
  const replaceAll = useGanttStore((s) => s.replaceAll);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <section>
      <h2>Importar Excel</h2>
      <p style={{ maxWidth: 900 }}>
        Sube el archivo <strong>.xlsm</strong> para importar las tareas desde la hoja
        <strong> Gantt_Helper</strong>. (Tip: si cambiaste el Excel, guárdalo antes para
        que queden cálculos actualizados.)
      </p>

      <input
        type="file"
        accept=".xlsx,.xlsm,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        disabled={isImporting}
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;

          setIsImporting(true);
          setError(null);
          try {
            const tasks = await importFromExcel(file);
            await replaceAll(tasks);
          } catch (err) {
            setError(String(err));
          } finally {
            setIsImporting(false);
            e.target.value = "";
          }
        }}
      />

      {isImporting && <p>Importando…</p>}
      {error && (
        <p style={{ color: "crimson" }}>
          <strong>Error:</strong> {error}
        </p>
      )}
    </section>
  );
}
