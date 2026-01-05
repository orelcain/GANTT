import { initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

export type FirebaseClients = {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
};

function env(name: string): string | undefined {
  return (import.meta.env as any)[name] as string | undefined;
}

export function getFirebaseClients(): FirebaseClients | null {
  const apiKey = env("VITE_FIREBASE_API_KEY");
  const authDomain = env("VITE_FIREBASE_AUTH_DOMAIN");
  const projectId = env("VITE_FIREBASE_PROJECT_ID");
  const appId = env("VITE_FIREBASE_APP_ID");

  if (!apiKey || !authDomain || !projectId || !appId) return null;

  const app = initializeApp({
    apiKey,
    authDomain,
    projectId,
    appId,
  });

  return {
    app,
    auth: getAuth(app),
    db: getFirestore(app),
  };
}

export function getProjectKey(): string {
  return (env("VITE_GANTT_PROJECT_KEY") ?? "chonchi-temporada-baja").trim();
}
