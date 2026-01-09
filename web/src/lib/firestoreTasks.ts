import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  onSnapshot,
  setDoc,
  writeBatch,
  type Firestore,
} from "firebase/firestore";

import type { Task, TaskId } from "./types";

export function tasksCollection(db: Firestore, projectKey: string) {
  return collection(db, "projects", projectKey, "tasks");
}

export function taskDoc(db: Firestore, projectKey: string, id: TaskId) {
  return doc(db, "projects", projectKey, "tasks", id);
}

export async function isAdminEmail(db: Firestore, email: string): Promise<boolean> {
  const ref = doc(db, "adminEmails", email.toLowerCase());
  const snap = await getDoc(ref);
  return snap.exists();
}

export function listenTasks(
  db: Firestore,
  projectKey: string,
  onTasks: (tasks: Task[]) => void,
  onError: (err: unknown) => void,
): () => void {
  return onSnapshot(
    tasksCollection(db, projectKey),
    (snap) => {
      const tasks = snap.docs
        .map((d) => d.data() as Task)
        .filter((t) => t && typeof t.id === "string")
        .sort((a, b) => a.start.localeCompare(b.start));
      onTasks(tasks);
    },
    (err) => onError(err),
  );
}

export async function upsertTask(db: Firestore, projectKey: string, task: Task) {
  await setDoc(taskDoc(db, projectKey, task.id), task, { merge: true });
}

export async function deleteTaskById(db: Firestore, projectKey: string, id: TaskId) {
  await deleteDoc(taskDoc(db, projectKey, id));
}

export async function replaceAllTasks(db: Firestore, projectKey: string, tasks: Task[]) {
  // Reemplazo exacto:
  // - Borra las tareas existentes que no están en el nuevo set
  // - Escribe/actualiza las tareas del nuevo set
  // Nota: Firestore limita batches a 500 operaciones.

  const incomingIds = new Set(tasks.map((t) => t.id));
  const existingSnap = await getDocs(tasksCollection(db, projectKey));
  const toDelete = existingSnap.docs
    .map((d) => d.id)
    .filter((id) => !incomingIds.has(id));

  const ops: Array<{ kind: "delete" | "set"; id: string; task?: Task }> = [
    ...toDelete.map((id) => ({ kind: "delete" as const, id })),
    ...tasks.map((t) => ({ kind: "set" as const, id: t.id, task: t })),
  ];

  const maxOpsPerBatch = 450;
  for (let i = 0; i < ops.length; i += maxOpsPerBatch) {
    const slice = ops.slice(i, i + maxOpsPerBatch);
    const batch = writeBatch(db);
    for (const op of slice) {
      if (op.kind === "delete") {
        batch.delete(taskDoc(db, projectKey, op.id));
      } else {
        batch.set(taskDoc(db, projectKey, op.id), op.task!, { merge: true });
      }
    }
    await batch.commit();
  }
}
