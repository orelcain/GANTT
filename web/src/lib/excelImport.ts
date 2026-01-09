import ExcelJS from "exceljs";

import type { Task } from "./types";

type HeaderDetection = {
  sheetName: string;
  headerRowNumber: number;
  headers: unknown[];
};

function cellToPrimitive(value: unknown): unknown {
  if (value == null) return null;
  if (value instanceof Date) return value;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;

  // ExcelJS cell value objects (formula, richText, hyperlink, etc.)
  if (typeof value === "object") {
    const v = value as any;
    if (v.result != null) return v.result;
    if (typeof v.text === "string") return v.text;
    if (Array.isArray(v.richText)) {
      const text = v.richText.map((p: any) => String(p?.text ?? "")).join("");
      return text || null;
    }
    if (typeof v.hyperlink === "string" && typeof v.text === "string") return v.text;
  }

  return value;
}

function toIsoDate(value: unknown): string | null {
  const v = cellToPrimitive(value);
  if (!v) return null;
  if (v instanceof Date) {
    return v.toISOString().slice(0, 10);
  }
  if (typeof v === "number") {
    // Excel serial date
    const epoch = new Date(Date.UTC(1899, 11, 30));
    const d = new Date(epoch.getTime() + v * 24 * 60 * 60 * 1000);
    return d.toISOString().slice(0, 10);
  }
  if (typeof v === "string") {
    // Try YYYY-MM-DD or locale-ish values
    const d = new Date(v);
    if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  }
  return null;
}

function normalizeHeader(h: unknown): string {
  return String(h ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function pickCol(headers: unknown[], wanted: string[]): number | null {
  const norm = headers.map(normalizeHeader);
  for (const w of wanted) {
    const idx = norm.indexOf(normalizeHeader(w));
    if (idx >= 0) return idx; // 0-based
  }
  return null;
}

function detectHeaderRow(ws: ExcelJS.Worksheet): HeaderDetection | null {
  // Buscar una fila de encabezados razonable en las primeras filas.
  // Esto permite importar desde distintas pestañas (p.ej. "Gantt_Helper", "Tareas").
  const maxScanRows = Math.min(40, ws.rowCount || 40);
  let best: { rowNumber: number; headers: unknown[]; score: number } | null = null;

  const taskKeys = [
    "Task Helper",
    "TASK",
    "Task",
    "Tarea",
    "Tareas",
    "Actividad",
    "Nombre",
    "Nombre tarea",
  ];
  const dueKeys = [
    "Due Date Helper",
    "Due Date",
    "Fecha fin",
    "Fin",
    "Término",
    "Termino",
    "Fecha término",
    "Fecha termino",
  ];
  const startKeys = [
    "Start Date Helper",
    "Start date Sort",
    "Start Date",
    "Fecha inicio",
    "Inicio",
  ];

  for (let r = 1; r <= maxScanRows; r++) {
    const row = ws.getRow(r);
    const headers = (row.values as unknown[]).slice(1);
    const norm = headers.map(normalizeHeader);

    const hasTask = taskKeys.some((k) => norm.includes(normalizeHeader(k)));
    const hasDue = dueKeys.some((k) => norm.includes(normalizeHeader(k)));
    if (!hasTask || !hasDue) continue;

    // score extra si también aparece start
    const hasStart = startKeys.some((k) => norm.includes(normalizeHeader(k)));
    const score = (hasTask ? 10 : 0) + (hasDue ? 10 : 0) + (hasStart ? 3 : 0);

    if (!best || score > best.score) {
      best = { rowNumber: r, headers, score };
    }
  }

  if (!best) return null;
  return {
    sheetName: ws.name,
    headerRowNumber: best.rowNumber,
    headers: best.headers,
  };
}

function slug(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9áéíóúñü]+/gi, "-")
    .replace(/-+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function importFromExcel(file: File): Promise<Task[]> {
  const buf = await file.arrayBuffer();

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buf);

  const tasks: Task[] = [];
  let totalRows = 0;
  let skippedRows = 0;
  let parsedSheets = 0;

  const worksheets = wb.worksheets;
  const preferred = ["Gantt_Helper", "Tareas", "Task_Helper"];
  const ordered = [
    ...preferred
      .map((n) => wb.getWorksheet(n))
      .filter((ws): ws is ExcelJS.Worksheet => Boolean(ws)),
    ...worksheets.filter((ws) => !preferred.includes(ws.name)),
  ];

  for (const ws of ordered) {
    const detected = detectHeaderRow(ws);
    if (!detected) continue;

    const headers = detected.headers;

    // Columnas (EN + ES)
    const colId = pickCol(headers, ["ID", "Task ID", "Identificador", "Código", "Codigo"]);
    const colProjectId = pickCol(headers, ["Project ID", "Proyecto", "ID Proyecto", "ID proyecto"]);
    const colPhaseId = pickCol(headers, ["Proj. Phase ID", "Phase ID", "Fase", "ID Fase", "ID fase"]);
    const colTask = pickCol(headers, [
      "Task Helper",
      "TASK",
      "Task",
      "Tarea",
      "Actividad",
      "Nombre",
      "Nombre tarea",
    ]);
    const colAssignee = pickCol(headers, ["Assignee Helper", "Assignee", "Responsable", "Asignado", "Encargado"]);
    const colTeam = pickCol(headers, ["Team Helper", "Team", "Equipo"]);
    const colStatus = pickCol(headers, ["Status Helper", "Status", "Estado"]);
    const colCompletion = pickCol(headers, [
      "Completion Helper",
      "Completion",
      "Progreso",
      "%",
      "% avance",
      "Avance",
    ]);
    const colStart = pickCol(headers, [
      "Start Date Helper",
      "Start date Sort",
      "Start Date",
      "Fecha inicio",
      "Inicio",
    ]);
    const colDue = pickCol(headers, [
      "Due Date Helper",
      "Due Date",
      "Fecha fin",
      "Fin",
      "Término",
      "Termino",
      "Fecha término",
      "Fecha termino",
    ]);
    const colMilestone = pickCol(headers, ["Milestone Helper", "Milestone", "Hito"]);

    if (colTask == null || colDue == null) continue;

    parsedSheets++;
    const headerRowNumber = detected.headerRowNumber;

    ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber <= headerRowNumber) return;

      totalRows++;
      const values = (row.values as unknown[]).slice(1);

      const rawName = cellToPrimitive(values[colTask]);
      const name = String(rawName ?? "").trim();
      if (!name) {
        skippedRows++;
        return;
      }

      const startIso = toIsoDate(colStart == null ? null : values[colStart]);
      const dueIso = toIsoDate(values[colDue]);
      if (!dueIso) {
        skippedRows++;
        return;
      }

      const startFinal = startIso ?? dueIso;

      // Progreso: en Gantt_Helper viene como 0..1. En otras hojas podría venir 0..100.
      const completionRaw = cellToPrimitive(colCompletion == null ? null : values[colCompletion]);
      const completionNum = Number(completionRaw ?? 0);
      const normalizedProgress = Number.isFinite(completionNum)
        ? completionNum <= 1
          ? completionNum * 100
          : completionNum
        : 0;
      const progress = Math.max(0, Math.min(100, normalizedProgress));

      const projectId = colProjectId == null ? null : (cellToPrimitive(values[colProjectId]) as any);
      const phaseId = colPhaseId == null ? null : (cellToPrimitive(values[colPhaseId]) as any);

      const milestoneVal = colMilestone == null ? null : cellToPrimitive(values[colMilestone]);
      const isMilestone =
        milestoneVal === true ||
        milestoneVal === 1 ||
        String(milestoneVal ?? "").trim().toLowerCase() === "yes" ||
        String(milestoneVal ?? "").trim().toLowerCase() === "si";

      const explicitId = colId == null ? null : cellToPrimitive(values[colId]);
      const idBase = explicitId != null && String(explicitId).trim() ? String(explicitId).trim() : null;
      const id = idBase ?? `${slug(ws.name)}-${rowNumber}-${slug(name).slice(0, 40)}`;

      tasks.push({
        id,
        name,
        projectId,
        phaseId,
        assignee: String(cellToPrimitive(colAssignee == null ? null : values[colAssignee]) ?? "").trim() || null,
        team: String(cellToPrimitive(colTeam == null ? null : values[colTeam]) ?? "").trim() || null,
        status: String(cellToPrimitive(colStatus == null ? null : values[colStatus]) ?? "").trim() || null,
        progress: isMilestone ? 100 : progress,
        start: startFinal,
        end: isMilestone ? startFinal : dueIso,
        dependencies: [],
        type: isMilestone ? "milestone" : "task",
      });
    });
  }

  console.log(
    `📊 Importación: ${tasks.length} tareas importadas, ${skippedRows} filas omitidas de ${totalRows} filas leídas (hojas detectadas: ${parsedSheets})`
  );

  if (!tasks.length) {
    const sheetNames = wb.worksheets.map((s) => s.name).join(", ");
    throw new Error(
      `No se encontraron tareas importables. Hojas disponibles: ${sheetNames}. ` +
        `Tip: asegúrate que exista una pestaña con columnas tipo "Tarea" + "Fecha fin" (o "Task Helper" + "Due Date Helper").`
    );
  }

  // Detectar jerarquía automáticamente
  // Estrategia: usar phaseId como indicador de agrupación
  const phaseMap = new Map<string | number, string>(); // phaseId -> first task id with that phase
  const tasksByPhase = new Map<string | number, Task[]>();

  tasks.forEach((task) => {
    if (task.phaseId != null) {
      const key = String(task.phaseId);
      if (!phaseMap.has(key)) {
        phaseMap.set(key, task.id);
      }
      if (!tasksByPhase.has(key)) {
        tasksByPhase.set(key, []);
      }
      tasksByPhase.get(key)!.push(task);
    }
  });

  // Asignar parentId y levels
  tasks.forEach((task) => {
    if (task.phaseId != null) {
      const key = String(task.phaseId);
      const phaseFirstTaskId = phaseMap.get(key);
      
      if (phaseFirstTaskId === task.id) {
        // Esta es la primera tarea de la fase = tarea padre
        task.level = 0;
        task.parentId = null;
      } else {
        // Es una subtarea de la fase
        task.level = 1;
        task.parentId = phaseFirstTaskId || null;
      }
    } else {
      // Sin phase = root task
      task.level = 0;
      task.parentId = null;
    }

    // Inicializar type y collapsed
    task.type = task.type || "task";
    task.collapsed = false;
  });

  // De-dupe by id just in case
  const seen = new Set<string>();
  return tasks.filter((t) => (seen.has(t.id) ? false : (seen.add(t.id), true)));
}
