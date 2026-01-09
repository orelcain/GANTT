import { create } from "zustand";

import { db as localDb } from "./db";
import { getFirebaseClients, getProjectKey } from "./firebase";
import {
  deleteTaskById,
  listenTasks,
  replaceAllTasks,
  upsertTask as upsertTaskRemote,
} from "./firestoreTasks";
import type { Task, TaskId, Tag } from "./types";

export type GanttState = {
  tasks: Task[];
  isLoading: boolean;
  error?: string;

  backend: "local" | "firebase";
  
  // Tags globales del proyecto
  tags: Tag[];

  load: () => Promise<void>;
  upsertTask: (task: Task) => Promise<void>;
  deleteTask: (id: TaskId) => Promise<void>;
  setDependencies: (id: TaskId, deps: TaskId[]) => Promise<void>;
  replaceAll: (tasks: Task[]) => Promise<void>;
  resetAll: () => Promise<void>;
  
  // Gestión de tags
  addTag: (tag: Tag) => void;
  updateTag: (tag: Tag) => void;
  deleteTag: (tagId: string) => void;
};

export const useGanttStore = create<GanttState>((set, get) => ({
  tasks: [],
  isLoading: true,
  backend: getFirebaseClients() ? "firebase" : "local",
  tags: [
    { id: "urgente", name: "Urgente", color: "#cf222e" },
    { id: "importante", name: "Importante", color: "#bf8700" },
    { id: "backend", name: "Backend", color: "#0969da" },
    { id: "frontend", name: "Frontend", color: "#8250df" },
    { id: "cliente", name: "Cliente", color: "#1a7f37" },
  ],

  _unsub: undefined as undefined | (() => void),

  load: async () => {
    set({ isLoading: true, error: undefined });
    try {
      const fb = getFirebaseClients();
      if (fb) {
        // Live subscription
        const prev = (get() as any)._unsub as undefined | (() => void);
        if (prev) prev();
        const unsub = listenTasks(
          fb.db,
          getProjectKey(),
          (tasks) => set({ tasks, isLoading: false, backend: "firebase" }),
          (e) => set({ error: String(e), isLoading: false }),
        );
        (set as any)({ _unsub: unsub });
        return;
      }

      const tasks = await localDb.tasks.toArray();
      tasks.sort((a, b) => a.start.localeCompare(b.start));
      set({ tasks, isLoading: false, backend: "local" });
    } catch (e) {
      set({ error: String(e), isLoading: false });
    }
  },

  upsertTask: async (task) => {
    const fb = getFirebaseClients();
    if (fb) {
      await upsertTaskRemote(fb.db, getProjectKey(), task);
      return;
    }
    await localDb.tasks.put(task);
    await get().load();
  },

  deleteTask: async (id) => {
    const fb = getFirebaseClients();
    if (fb) {
      await deleteTaskById(fb.db, getProjectKey(), id);
      return;
    }
    await localDb.tasks.delete(id);
    await get().load();
  },

  setDependencies: async (id, deps) => {
    const fb = getFirebaseClients();
    if (fb) {
      const t = get().tasks.find((x) => x.id === id);
      if (!t) return;
      await upsertTaskRemote(fb.db, getProjectKey(), { ...t, dependencies: deps });
      return;
    }
    const task = await localDb.tasks.get(id);
    if (!task) return;
    await localDb.tasks.put({ ...task, dependencies: deps });
    await get().load();
  },

  replaceAll: async (tasks) => {
    const fb = getFirebaseClients();
    if (fb) {
      await replaceAllTasks(fb.db, getProjectKey(), tasks);
      return;
    }
    await localDb.transaction("rw", localDb.tasks, async () => {
      await localDb.tasks.clear();
      await localDb.tasks.bulkPut(tasks);
    });
    await get().load();
  },

  resetAll: async () => {
    // MVP: reset solo en modo local
    const fb = getFirebaseClients();
    if (fb) throw new Error("Reset remoto no implementado (Firestore).");
    await localDb.transaction("rw", localDb.tasks, localDb.meta, async () => {
      await localDb.tasks.clear();
      await localDb.meta.clear();
    });
    await get().load();
  },

  addTag: (tag) => {
    set((state) => ({ tags: [...state.tags, tag] }));
    localStorage.setItem("gantt-tags", JSON.stringify(get().tags));
  },

  updateTag: (tag) => {
    set((state) => ({
      tags: state.tags.map((t) => (t.id === tag.id ? tag : t)),
    }));
    localStorage.setItem("gantt-tags", JSON.stringify(get().tags));
  },

  deleteTag: (tagId) => {
    set((state) => ({
      tags: state.tags.filter((t) => t.id !== tagId),
      // Remover tag de todas las tareas
      tasks: state.tasks.map((task) => ({
        ...task,
        tags: task.tags?.filter((t) => t !== tagId),
      })),
    }));
    localStorage.setItem("gantt-tags", JSON.stringify(get().tags));
  },
}));
