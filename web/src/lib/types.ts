export type TaskId = string;

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
};

export type ProjectRole = "admin" | "editor" | "viewer";

// Rol efectivo en la UI (incluye estados de autenticación/acceso)
export type UserRole = ProjectRole | "anon" | "noaccess";

export type Member = {
  email: string; // lowercase
  role: ProjectRole;
};
