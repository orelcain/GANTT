import { create } from "zustand";

import { db as localDb } from "./db";
import { getFirebaseClients, getProjectKey } from "./firebase";
import {
  deleteTaskById,
  listenTasks,
  replaceAllTasks,
  upsertTask as upsertTaskRemote,
} from "./firestoreTasks";
import type { Task, TaskId } from "./types";

export type GanttState = {
  tasks: Task[];
  isLoading: boolean;
  error?: string;

  backend: "local" | "firebase";

  load: () => Promise<void>;
  upsertTask: (task: Task) => Promise<void>;
  deleteTask: (id: TaskId) => Promise<void>;
  setDependencies: (id: TaskId, deps: TaskId[]) => Promise<void>;
  replaceAll: (tasks: Task[]) => Promise<void>;
  resetAll: () => Promise<void>;
};

export const useGanttStore = create<GanttState>((set, get) => ({
  tasks: [],
  isLoading: true,
  backend: getFirebaseClients() ? "firebase" : "local",

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
}));
