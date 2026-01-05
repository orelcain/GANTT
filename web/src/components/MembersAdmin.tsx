import { useEffect, useMemo, useState } from "react";

import { getFirebaseClients, getProjectKey } from "../lib/firebase";
import { deleteMember, listenMembers, upsertMember } from "../lib/firestoreMembers";
import type { Member, ProjectRole } from "../lib/types";

function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

export function MembersAdmin({ enabled }: { enabled: boolean }) {
  const fb = getFirebaseClients();
  const projectKey = useMemo(() => getProjectKey(), []);
  const [members, setMembers] = useState<Member[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<ProjectRole>("viewer");

  useEffect(() => {
    if (!enabled || !fb) return;
    setError(null);
    return listenMembers(
      fb.db,
      projectKey,
      (m) => setMembers(m),
      (e) => setError(String(e)),
    );
  }, [enabled, fb, projectKey]);

  if (!enabled) return null;

  if (!fb) {
    return (
      <section>
        <h2>Usuarios</h2>
        <p>Firebase no está configurado; no hay gestión de permisos.</p>
      </section>
    );
  }

  return (
    <section>
      <h2>Usuarios (permisos)</h2>
      <p style={{ maxWidth: 900 }}>
        Define permisos por correo dentro del proyecto <strong>{projectKey}</strong>. Roles:
        <strong> viewer</strong> (solo ver), <strong>editor</strong> (editar tareas),
        <strong> admin</strong> (editar + administrar usuarios).
      </p>

      <div style={{ display: "flex", gap: 12, alignItems: "end", flexWrap: "wrap" }}>
        <label>
          Correo
          <br />
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="usuario@dominio.cl" />
        </label>
        <label>
          Rol
          <br />
          <select value={role} onChange={(e) => setRole(e.target.value as ProjectRole)}>
            <option value="viewer">viewer</option>
            <option value="editor">editor</option>
            <option value="admin">admin</option>
          </select>
        </label>
        <button
          onClick={async () => {
            setError(null);
            const e = normalizeEmail(email);
            if (!e.includes("@")) {
              setError("Correo inválido.");
              return;
            }
            try {
              await upsertMember(fb.db, projectKey, e, role);
              setEmail("");
              setRole("viewer");
            } catch (err) {
              setError(String(err));
            }
          }}
        >
          Guardar
        </button>
      </div>

      {error && (
        <p style={{ color: "crimson" }}>
          <strong>Error:</strong> {error}
        </p>
      )}

      <div style={{ overflowX: "auto", marginTop: 12 }}>
        <table>
          <thead>
            <tr>
              <th>Correo</th>
              <th>Rol</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.email}>
                <td>{m.email}</td>
                <td>{m.role}</td>
                <td>
                  <button
                    onClick={async () => {
                      if (!confirm(`¿Eliminar permisos de ${m.email}?`)) return;
                      try {
                        await deleteMember(fb.db, projectKey, m.email);
                      } catch (err) {
                        setError(String(err));
                      }
                    }}
                  >
                    Quitar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
