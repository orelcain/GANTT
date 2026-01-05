import { useEffect, useState } from "react";

import {
  isSignInWithEmailLink,
  onAuthStateChanged,
  sendSignInLinkToEmail,
  signInWithEmailLink,
  signOut,
  type User,
} from "firebase/auth";

import { getFirebaseClients, getProjectKey } from "../lib/firebase";
import { getMemberRole } from "../lib/firestoreMembers";
import { isAdminEmail } from "../lib/firestoreTasks";
import type { ProjectRole, UserRole } from "../lib/types";

export function AuthBar({ onRole }: { onRole: (role: UserRole) => void }) {
  const fb = getFirebaseClients();
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>(fb ? "anon" : "admin");

  useEffect(() => {
    if (!fb) {
      onRole(role);
      return;
    }

    // Completa login por link si la URL actual lo contiene.
    if (isSignInWithEmailLink(fb.auth, window.location.href)) {
      const storedEmail = window.localStorage.getItem("signInEmail");
      if (storedEmail) {
        signInWithEmailLink(fb.auth, storedEmail, window.location.href).finally(() => {
          window.localStorage.removeItem("signInEmail");
        });
      }
    }

    return onAuthStateChanged(fb.auth, async (u) => {
      setUser(u);
      const email = u?.email?.toLowerCase();
      if (!email) {
        setRole("anon");
        onRole("anon");
        return;
      }

      try {
        const projectKey = getProjectKey();

        // 1) Permisos individuales por proyecto
        const memberRole = await getMemberRole(fb.db, projectKey, email);
        if (memberRole) {
          const next: UserRole = memberRole as ProjectRole;
          setRole(next);
          onRole(next);
          return;
        }

        // 2) Bootstrap (primer admin): colección global adminEmails
        const bootstrapAdmin = await isAdminEmail(fb.db, email);
        if (bootstrapAdmin) {
          setRole("admin");
          onRole("admin");
          return;
        }

        // 3) Sin permisos
        setRole("noaccess");
        onRole("noaccess");
      } catch {
        setRole("noaccess");
        onRole("noaccess");
      }
    });
  }, [fb, onRole]);

  if (!fb) {
    // Sin config Firebase => modo local (no multiusuario).
    return (
      <div style={{ padding: 12, border: "1px solid #ddd", borderRadius: 8 }}>
        <strong>Auth:</strong> modo local (sin Firebase configurado)
      </div>
    );
  }
  const client = fb;

  return (
    <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
      <strong>Cuenta:</strong> {user?.email ?? "(sin sesión)"} · <strong>Rol:</strong> {role}
      {user ? (
        <button onClick={async () => await signOut(client.auth)}>Salir</button>
      ) : (
        <button
          onClick={async () => {
            const e = prompt("Correo para entrar (se envía un link):");
            if (!e) return;
            await sendSignInLinkToEmail(client.auth, e, {
              url: window.location.href,
              handleCodeInApp: true,
            });
            window.localStorage.setItem("signInEmail", e);
            alert("Listo. Revisa tu correo y abre el link para iniciar sesión.");
          }}
        >
          Entrar
        </button>
      )}
    </div>
  );
}
