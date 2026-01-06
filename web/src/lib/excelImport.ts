import ExcelJS from "exceljs";

import type { Task } from "./types";

function toIsoDate(value: unknown): string | null {
  if (!value) return null;
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === "number") {
    // Excel serial date
    const epoch = new Date(Date.UTC(1899, 11, 30));
    const d = new Date(epoch.getTime() + value * 24 * 60 * 60 * 1000);
    return d.toISOString().slice(0, 10);
  }
  if (typeof value === "string") {
    // Try YYYY-MM-DD or locale-ish values
    const d = new Date(value);
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

  const ws = wb.getWorksheet("Gantt_Helper");
  if (!ws) throw new Error("No se encontró la hoja 'Gantt_Helper'.");

  const headerRow = ws.getRow(1);
  const headers = (headerRow.values as unknown[]).slice(1); // exceljs is 1-indexed

  const colProjectId = pickCol(headers, ["Project ID"]);
  const colPhaseId = pickCol(headers, ["Proj. Phase ID"]);
  const colTask = pickCol(headers, ["Task Helper"]);
  const colAssignee = pickCol(headers, ["Assignee Helper"]);
  const colTeam = pickCol(headers, ["Team Helper"]);
  const colStatus = pickCol(headers, ["Status Helper"]);
  const colCompletion = pickCol(headers, ["Completion Helper"]);
  const colStart = pickCol(headers, ["Start Date Helper", "Start date Sort"]);
  const colDue = pickCol(headers, ["Due Date Helper"]);

  if (colTask == null) throw new Error("No se detectó la columna 'Task Helper'.");
  if (colDue == null) throw new Error("No se detectó la columna 'Due Date Helper'.");

  const tasks: Task[] = [];

  ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return;

    const values = (row.values as unknown[]).slice(1);
    const name = String(values[colTask] ?? "").trim();
    if (!name) return;

    const startIso = toIsoDate(colStart == null ? null : values[colStart]);
    const dueIso = toIsoDate(values[colDue]);
    if (!dueIso) return;

    const startFinal = startIso ?? dueIso;

    const completion = Number(colCompletion == null ? 0 : values[colCompletion] ?? 0);
    const progress = Number.isFinite(completion) ? Math.max(0, Math.min(100, completion * 100)) : 0;

    const projectId = colProjectId == null ? null : (values[colProjectId] as any);
    const phaseId = colPhaseId == null ? null : (values[colPhaseId] as any);

    const id = `${slug(String(projectId ?? "p"))}-${rowNumber}-${slug(name).slice(0, 40)}`;

    tasks.push({
      id,
      name,
      projectId,
      phaseId,
      assignee: String(colAssignee == null ? "" : values[colAssignee] ?? "").trim() || null,
      team: String(colTeam == null ? "" : values[colTeam] ?? "").trim() || null,
      status: String(colStatus == null ? "" : values[colStatus] ?? "").trim() || null,
      progress,
      start: startFinal,
      end: dueIso,
      dependencies: [],
    });
  });

  if (!tasks.length) throw new Error("No se encontraron tareas importables en 'Gantt_Helper'.");

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
