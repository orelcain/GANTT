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
  const [showModal, setShowModal] = useState(false);

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
  if (!fb) return null;

  return (
    <>
      <button onClick={() => setShowModal(true)}>Usuarios ({members.length})</button>

      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{
              background: "white",
              borderRadius: 8,
              padding: 24,
              maxWidth: 600,
              width: "90%",
              maxHeight: "80vh",
              overflow: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
              <h2 style={{ margin: 0 }}>Usuarios del proyecto</h2>
              <button onClick={() => setShowModal(false)}>×</button>
            </div>

            <p style={{ marginBottom: 16, color: "#586069" }}>
              Proyecto: <strong>{projectKey}</strong>
            </p>

            <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@dominio.cl"
                style={{ flex: 1, minWidth: 200 }}
              />
              <select value={role} onChange={(e) => setRole(e.target.value as ProjectRole)}>
                <option value="viewer">Viewer</option>
                <option value="editor">Editor</option>
                <option value="admin">Admin</option>
              </select>
              <button
                className="primary"
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
                Agregar
              </button>
            </div>

            {error && (
              <p style={{ color: "#d73a49", marginBottom: 16 }}>
                <strong>Error:</strong> {error}
              </p>
            )}

            <table style={{ fontSize: 13 }}>
              <thead>
                <tr>
                  <th>Correo</th>
                  <th>Rol</th>
                  <th style={{ width: 100 }} />
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.email}>
                    <td>{m.email}</td>
                    <td>
                      <span
                        style={{
                          padding: "2px 8px",
                          borderRadius: 4,
                          fontSize: 12,
                          background:
                            m.role === "admin"
                              ? "#fff3cd"
                              : m.role === "editor"
                                ? "#d1ecf1"
                                : "#f8f9fa",
                        }}
                      >
                        {m.role}
                      </span>
                    </td>
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
        </div>
      )}
    </>
  );
}
