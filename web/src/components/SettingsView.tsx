export function SettingsView() {
  return (
    <div style={{ height: "100%", overflow: "auto", padding: 16 }}>
      <div style={{ marginBottom: 12 }}>
        <h2 style={{ fontSize: 16, margin: 0, marginBottom: 4 }}>Settings</h2>
        <p style={{ fontSize: 11, color: "var(--color-text-muted)", margin: 0 }}>
          Equivalente a la hoja <strong>Settings</strong> del Excel.
        </p>
      </div>

      <div
        style={{
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-md)",
          background: "var(--color-surface)",
          padding: 12,
          fontSize: 12,
          lineHeight: 1.4,
        }}
      >
        <p style={{ margin: 0, color: "var(--color-text)" }}>
          Aquí se agrupan los <strong>ajustes del template</strong> y la lógica de apoyo.
          En la app, esta pestaña es un resumen (no un visor de Excel).
        </p>
        <ul style={{ margin: "10px 0 0", paddingLeft: 18, color: "var(--color-text-muted)" }}>
          <li>
            <strong>Tareas</strong>: muestra la tabla de tareas.
          </li>
          <li>
            <strong>Timeline</strong>: muestra el diagrama Gantt.
          </li>
          <li>
            <strong>Importación</strong>: al importar se detectan automáticamente hojas con columnas tipo
            “Tarea/Fecha fin” o “Task/Due Date”.
          </li>
        </ul>
      </div>
    </div>
  );
}
