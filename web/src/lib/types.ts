export type TaskId = string;

export type TaskType = "task" | "milestone";

export type Task = {
  id: TaskId;
  name: string;
  projectId?: string | number | null;
  phaseId?: string | number | null;
  assignee?: string | null;
  team?: string | null;
  status?: string | null;
  progress: number; // 0..100
  start: string; // ISO date (YYYY-MM-DD)
  end: string; // ISO date (YYYY-MM-DD)
  dependencies: TaskId[];
  
  // Nuevos campos para features avanzadas
  type?: TaskType; // 'task' (default) o 'milestone'
  parentId?: TaskId | null; // ID de la tarea padre (para jerarquía)
  level?: number; // Nivel de indentación (0 = root, 1 = hijo, etc.)
  collapsed?: boolean; // Si está colapsada (solo para tareas con hijos)
  color?: string | null; // Color personalizado (hex)
  tags?: string[]; // Tags/etiquetas para categorización
  comments?: Comment[]; // Comentarios de la tarea
};

export type ProjectRole = "admin" | "editor" | "viewer";

// Rol efectivo en la UI (incluye estados de autenticación/acceso)
export type UserRole = ProjectRole | "anon" | "noaccess";

export type Member = {
  email: string; // lowercase
  role: ProjectRole;
};

export type Tag = {
  id: string;
  name: string;
  color: string; // hex color
};

export type Comment = {
  id: string;
  taskId: TaskId;
  author: string;
  content: string;
  timestamp: string; // ISO timestamp
};
