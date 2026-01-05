import {
  collection,
  deleteDoc,
  doc,
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
  // Nota: esto NO borra tareas que ya existían y no están en el nuevo set.
  // Para MVP es ok; si quieres sincronización exacta, agregamos un barrido paginado.
  const batch = writeBatch(db);
  for (const t of tasks) {
    batch.set(taskDoc(db, projectKey, t.id), t, { merge: true });
  }
  await batch.commit();
}
