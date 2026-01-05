import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  setDoc,
  type Firestore,
} from "firebase/firestore";

import type { Member, ProjectRole } from "./types";

export function memberDoc(db: Firestore, projectKey: string, emailLower: string) {
  return doc(db, "projects", projectKey, "membersByEmail", emailLower);
}

export async function getMemberRole(
  db: Firestore,
  projectKey: string,
  emailLower: string,
): Promise<ProjectRole | null> {
  const snap = await getDoc(memberDoc(db, projectKey, emailLower));
  if (!snap.exists()) return null;
  const data = snap.data() as Partial<Member>;
  const role = data.role;
  if (role === "admin" || role === "editor" || role === "viewer") return role;
  return null;
}

export async function upsertMember(
  db: Firestore,
  projectKey: string,
  emailLower: string,
  role: ProjectRole,
) {
  const payload: Member = { email: emailLower, role };
  await setDoc(memberDoc(db, projectKey, emailLower), payload, { merge: true });
}

export async function deleteMember(db: Firestore, projectKey: string, emailLower: string) {
  await deleteDoc(memberDoc(db, projectKey, emailLower));
}

export function listenMembers(
  db: Firestore,
  projectKey: string,
  onMembers: (members: Member[]) => void,
  onError: (err: unknown) => void,
): () => void {
  return onSnapshot(
    collection(db, "projects", projectKey, "membersByEmail"),
    (snap) => {
      const members = snap.docs
        .map((d) => d.data() as Member)
        .filter((m) => m && typeof m.email === "string")
        .sort((a, b) => a.email.localeCompare(b.email));
      onMembers(members);
    },
    (err) => onError(err),
  );
}
