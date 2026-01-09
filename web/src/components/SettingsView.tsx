import { useMemo, useState, type ReactNode } from "react";

import { useGanttStore } from "../lib/store";
import type { Area, Team, Person, Location } from "../lib/types";

function slugify(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-_]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function ensureUniqueId(base: string, existing: Set<string>): string {
  if (!existing.has(base)) return base;
  let i = 2;
  while (existing.has(`${base}-${i}`)) i++;
  return `${base}-${i}`;
}

function SectionCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div
      style={{
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-md)",
        background: "var(--color-surface)",
        padding: 12,
      }}
    >
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 650, marginBottom: 2 }}>{title}</div>
        <div style={{ fontSize: 11, color: "var(--color-text-muted)" }}>{subtitle}</div>
      </div>
      {children}
    </div>
  );
}

export function SettingsView() {
  const areas = useGanttStore((s) => s.areas);
  const teams = useGanttStore((s) => s.teams);
  const people = useGanttStore((s) => s.people);
  const locations = useGanttStore((s) => s.locations);

  const addArea = useGanttStore((s) => s.addArea);
  const updateArea = useGanttStore((s) => s.updateArea);
  const deleteArea = useGanttStore((s) => s.deleteArea);

  const addTeam = useGanttStore((s) => s.addTeam);
  const updateTeam = useGanttStore((s) => s.updateTeam);
  const deleteTeam = useGanttStore((s) => s.deleteTeam);

  const addPerson = useGanttStore((s) => s.addPerson);
  const updatePerson = useGanttStore((s) => s.updatePerson);
  const deletePerson = useGanttStore((s) => s.deletePerson);

  const addLocation = useGanttStore((s) => s.addLocation);
  const updateLocation = useGanttStore((s) => s.updateLocation);
  const deleteLocation = useGanttStore((s) => s.deleteLocation);

  const [newAreaName, setNewAreaName] = useState("");
  const [newTeamName, setNewTeamName] = useState("");
  const [newPersonName, setNewPersonName] = useState("");
  const [newLocationName, setNewLocationName] = useState("");

  const existingAreaIds = useMemo(() => new Set(areas.map((a) => a.id)), [areas]);
  const existingTeamIds = useMemo(() => new Set(teams.map((t) => t.id)), [teams]);
  const existingPersonIds = useMemo(() => new Set(people.map((p) => p.id)), [people]);
  const existingLocationIds = useMemo(() => new Set(locations.map((l) => l.id)), [locations]);

  const addItem = <T extends { id: string; name: string }>(
    name: string,
    existing: Set<string>,
    addFn: (item: any) => void
  ) => {
    const base = slugify(name);
    if (!base) return;
    const id = ensureUniqueId(base, existing);
    const item = { id, name: name.trim() } as T;
    addFn(item);
  };

  const Row = ({
    item,
    onUpdate,
    onDelete,
  }: {
    item: Area | Team | Person | Location;
    onUpdate: (next: any) => void;
    onDelete: () => void;
  }) => {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "6px 0",
          borderBottom: "1px solid var(--color-border-light)",
        }}
      >
        <input
          value={item.name}
          onChange={(e) => onUpdate({ ...item, name: e.target.value })}
          style={{ flex: 1, fontSize: 12, padding: "4px 8px" }}
        />
        <span style={{ fontSize: 10, color: "var(--color-text-muted)", minWidth: 90, textAlign: "right" }}>
          {item.id}
        </span>
        <button
          onClick={onDelete}
          style={{ fontSize: 11, padding: "4px 8px" }}
          title="Eliminar"
        >
          Eliminar
        </button>
      </div>
    );
  };

  return (
    <div style={{ height: "100%", overflow: "auto", padding: 16 }}>
      <div style={{ marginBottom: 12 }}>
        <h2 style={{ fontSize: 16, margin: 0, marginBottom: 4 }}>Ajustes</h2>
        <p style={{ fontSize: 11, color: "var(--color-text-muted)", margin: 0 }}>
          Configuración del proyecto (catálogos, responsables, equipos, áreas y ubicaciones).
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12, maxWidth: 980 }}>
        <SectionCard
          title="Áreas"
          subtitle="Define áreas/zonas para clasificar tareas y filtrar vistas."
        >
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <input
              value={newAreaName}
              onChange={(e) => setNewAreaName(e.target.value)}
              placeholder="Nueva área (ej: Línea 1, Eléctrica)"
              style={{ flex: 1, fontSize: 12, padding: "6px 10px" }}
            />
            <button
              className="primary"
              onClick={() => {
                addItem<Area>(newAreaName, existingAreaIds, addArea);
                setNewAreaName("");
              }}
              disabled={!newAreaName.trim()}
            >
              Agregar
            </button>
          </div>
          {areas.length === 0 ? (
            <div style={{ fontSize: 12, color: "var(--color-text-muted)", fontStyle: "italic" }}>
              No hay áreas.
            </div>
          ) : (
            <div>
              {areas.map((a) => (
                <Row
                  key={a.id}
                  item={a}
                  onUpdate={updateArea}
                  onDelete={() => {
                    if (!window.confirm(`Eliminar área "${a.name}"?`)) return;
                    deleteArea(a.id);
                  }}
                />
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Equipos"
          subtitle="Equipos o cuadrillas para agrupar asignaciones."
        >
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <input
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              placeholder="Nuevo equipo (ej: Mantención, Frío)"
              style={{ flex: 1, fontSize: 12, padding: "6px 10px" }}
            />
            <button
              className="primary"
              onClick={() => {
                addItem<Team>(newTeamName, existingTeamIds, addTeam);
                setNewTeamName("");
              }}
              disabled={!newTeamName.trim()}
            >
              Agregar
            </button>
          </div>
          {teams.length === 0 ? (
            <div style={{ fontSize: 12, color: "var(--color-text-muted)", fontStyle: "italic" }}>
              No hay equipos.
            </div>
          ) : (
            <div>
              {teams.map((t) => (
                <Row
                  key={t.id}
                  item={t}
                  onUpdate={updateTeam}
                  onDelete={() => {
                    if (!window.confirm(`Eliminar equipo "${t.name}"?`)) return;
                    deleteTeam(t.id);
                  }}
                />
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Personas"
          subtitle="Responsables disponibles para asignar tareas (mejor que texto libre)."
        >
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <input
              value={newPersonName}
              onChange={(e) => setNewPersonName(e.target.value)}
              placeholder="Nueva persona (ej: Juan Pérez)"
              style={{ flex: 1, fontSize: 12, padding: "6px 10px" }}
            />
            <button
              className="primary"
              onClick={() => {
                addItem<Person>(newPersonName, existingPersonIds, addPerson);
                setNewPersonName("");
              }}
              disabled={!newPersonName.trim()}
            >
              Agregar
            </button>
          </div>
          {people.length === 0 ? (
            <div style={{ fontSize: 12, color: "var(--color-text-muted)", fontStyle: "italic" }}>
              No hay personas.
            </div>
          ) : (
            <div>
              {people.map((p) => (
                <Row
                  key={p.id}
                  item={p}
                  onUpdate={updatePerson}
                  onDelete={() => {
                    if (!window.confirm(`Eliminar persona "${p.name}"?`)) return;
                    deletePerson(p.id);
                  }}
                />
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Ubicaciones"
          subtitle="Lugares/activos (ej: Planta, Sala, Línea) para planificación y filtros."
        >
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <input
              value={newLocationName}
              onChange={(e) => setNewLocationName(e.target.value)}
              placeholder="Nueva ubicación (ej: Sala de máquinas)"
              style={{ flex: 1, fontSize: 12, padding: "6px 10px" }}
            />
            <button
              className="primary"
              onClick={() => {
                addItem<Location>(newLocationName, existingLocationIds, addLocation);
                setNewLocationName("");
              }}
              disabled={!newLocationName.trim()}
            >
              Agregar
            </button>
          </div>
          {locations.length === 0 ? (
            <div style={{ fontSize: 12, color: "var(--color-text-muted)", fontStyle: "italic" }}>
              No hay ubicaciones.
            </div>
          ) : (
            <div>
              {locations.map((l) => (
                <Row
                  key={l.id}
                  item={l}
                  onUpdate={updateLocation}
                  onDelete={() => {
                    if (!window.confirm(`Eliminar ubicación "${l.name}"?`)) return;
                    deleteLocation(l.id);
                  }}
                />
              ))}
            </div>
          )}
        </SectionCard>

        <div
          style={{
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            background: "var(--color-surface)",
            padding: 12,
            fontSize: 12,
            lineHeight: 1.4,
          }}
        >
          <div style={{ fontWeight: 650, marginBottom: 6 }}>Nota</div>
          <div style={{ color: "var(--color-text-muted)" }}>
            Estos catálogos se usan en la UI para evitar “texto libre” y habilitar filtros consistentes.
            La importación desde Excel puede seguir trayendo <strong>Responsable</strong> como texto; luego puedes
            normalizarlo seleccionando una Persona en la tarea.
          </div>
        </div>
      </div>
    </div>
  );
}
