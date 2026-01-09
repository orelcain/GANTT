import { useState } from "react";

import { useGanttStore } from "../lib/store";
 

export type SheetTab = "tareas" | "timeline" | "settings";

type Props = {
  filterStatus?: string;
  onFilterStatusChange?: (status: string) => void;
  filterAssignee?: string;
  onFilterAssigneeChange?: (assignee: string) => void;
  filterPersonId?: string;
  onFilterPersonIdChange?: (personId: string) => void;
  filterTeamId?: string;
  onFilterTeamIdChange?: (teamId: string) => void;
  filterAreaId?: string;
  onFilterAreaIdChange?: (areaId: string) => void;
  filterLocationId?: string;
  onFilterLocationIdChange?: (locationId: string) => void;
  filterType?: "" | "task" | "milestone";
  onFilterTypeChange?: (type: "" | "task" | "milestone") => void;
  filterTags?: string[];
  onFilterTagsChange?: (tags: string[]) => void;
  uniqueStatuses?: string[];
  uniqueAssignees?: string[];
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
};

export function Toolbar({
  filterStatus = "",
  onFilterStatusChange,
  filterAssignee = "",
  onFilterAssigneeChange,
  filterPersonId = "",
  onFilterPersonIdChange,
  filterTeamId = "",
  onFilterTeamIdChange,
  filterAreaId = "",
  onFilterAreaIdChange,
  filterLocationId = "",
  onFilterLocationIdChange,
  filterType = "",
  onFilterTypeChange,
  filterTags = [],
  onFilterTagsChange,
  uniqueStatuses = [],
  uniqueAssignees = [],
  searchQuery = "",
  onSearchChange,
}: Props) {
  const { tags: availableTags, areas, teams, people, locations } = useGanttStore();
  const [showTagFilter, setShowTagFilter] = useState(false);
  const hasActiveFilters =
    filterStatus ||
    filterAssignee ||
    filterPersonId ||
    filterTeamId ||
    filterAreaId ||
    filterLocationId ||
    filterType ||
    searchQuery ||
    filterTags.length > 0;

  return (
    <div className="appToolbar">
      <div className="toolbarGroup toolbarGroup--filters">
        <span className="toolbarGroupTitle">Filtros</span>

        {onFilterTypeChange && (
          <select
            value={filterType}
            onChange={(e) => onFilterTypeChange(e.target.value as "" | "task" | "milestone")}
            style={{ fontSize: 12, minWidth: 100 }}
          >
            <option value="">Todos los tipos</option>
            <option value="task">Tareas</option>
            <option value="milestone">Milestones</option>
          </select>
        )}

        {onFilterStatusChange && uniqueStatuses.length > 0 && (
          <select
            value={filterStatus}
            onChange={(e) => onFilterStatusChange(e.target.value)}
            style={{ fontSize: 12, minWidth: 120 }}
          >
            <option value="">Todos los estados</option>
            {uniqueStatuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        )}

        {onFilterAreaIdChange && areas.length > 0 && (
          <select
            value={filterAreaId}
            onChange={(e) => onFilterAreaIdChange(e.target.value)}
            style={{ fontSize: 12, minWidth: 140 }}
          >
            <option value="">Todas las áreas</option>
            {areas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        )}

        {onFilterTeamIdChange && teams.length > 0 && (
          <select
            value={filterTeamId}
            onChange={(e) => onFilterTeamIdChange(e.target.value)}
            style={{ fontSize: 12, minWidth: 140 }}
          >
            <option value="">Todos los equipos</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        )}

        {people.length > 0 && onFilterPersonIdChange ? (
          <select
            value={filterPersonId}
            onChange={(e) => onFilterPersonIdChange(e.target.value)}
            style={{ fontSize: 12, minWidth: 160 }}
          >
            <option value="">Todos los responsables</option>
            {people.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        ) : (
          onFilterAssigneeChange &&
          uniqueAssignees.length > 0 && (
            <select
              value={filterAssignee}
              onChange={(e) => onFilterAssigneeChange(e.target.value)}
              style={{ fontSize: 12, minWidth: 160 }}
            >
              <option value="">Todos los responsables</option>
              {uniqueAssignees.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          )
        )}

        {onFilterLocationIdChange && locations.length > 0 && (
          <select
            value={filterLocationId}
            onChange={(e) => onFilterLocationIdChange(e.target.value)}
            style={{ fontSize: 12, minWidth: 150 }}
          >
            <option value="">Todas las ubicaciones</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        )}

        {/* Filtro de tags */}
        {onFilterTagsChange && availableTags.length > 0 && (
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setShowTagFilter(!showTagFilter)}
              style={{
                fontSize: 12,
                padding: "4px 10px",
                display: "flex",
                alignItems: "center",
                gap: 4,
                background: filterTags.length > 0 ? "#0969da" : "var(--color-canvas-subtle)",
                color: filterTags.length > 0 ? "#fff" : "var(--color-fg-default)",
                border: "1px solid var(--color-border-default)",
                borderRadius: 4,
              }}
            >
              🏷️ Tags {filterTags.length > 0 && `(${filterTags.length})`}
            </button>
            {showTagFilter && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 4px)",
                  left: 0,
                  background: "var(--color-canvas-default)",
                  border: "1px solid var(--color-border-default)",
                  borderRadius: 6,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                  padding: 12,
                  minWidth: 200,
                  zIndex: 100,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 8, color: "var(--color-fg-muted)" }}>
                  Filtrar por tags
                </div>
                {availableTags.map((tag) => {
                  const isSelected = filterTags.includes(tag.id);
                  return (
                    <label
                      key={tag.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "6px 8px",
                        borderRadius: 4,
                        cursor: "pointer",
                        background: isSelected ? `${tag.color}10` : "transparent",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {
                          const newTags = isSelected
                            ? filterTags.filter((t) => t !== tag.id)
                            : [...filterTags, tag.id];
                          onFilterTagsChange(newTags);
                        }}
                      />
                      <div
                        style={{
                          width: 12,
                          height: 12,
                          borderRadius: 3,
                          background: tag.color,
                        }}
                      />
                      <span style={{ fontSize: 12, flex: 1 }}>{tag.name}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {onSearchChange && (
          <input
            type="text"
            placeholder="🔍 Buscar tareas..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{ fontSize: 12, minWidth: 180, padding: "3px 8px" }}
          />
        )}

        {hasActiveFilters && (
          <button
            onClick={() => {
              onFilterTypeChange?.("");
              onFilterStatusChange?.("");
              onFilterAssigneeChange?.("");
              onFilterPersonIdChange?.("");
              onFilterTeamIdChange?.("");
              onFilterAreaIdChange?.("");
              onFilterLocationIdChange?.("");
              onSearchChange?.("");
              onFilterTagsChange?.([]);
            }}
            style={{ fontSize: 11, padding: "3px 8px" }}
            title="Limpiar filtros"
          >
            ✕ Limpiar
          </button>
        )}
      </div>
    </div>
  );
}
