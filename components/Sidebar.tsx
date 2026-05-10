"use client";

import { useStore } from "@/lib/store";
import { useGanttContext } from "@/lib/ganttContext";
import type { Project } from "@/lib/types";
import type { LayoutRow } from "@/lib/ganttUtils";
import {
  DOMAIN_HEADER_HEIGHT,
  EMPTY_DOMAIN_ROW_HEIGHT,
  SIDEBAR_WIDTH,
  TIMELINE_HEADER_HEIGHT,
} from "@/lib/ganttUtils";

type Props = {
  layoutRows: LayoutRow[];
};

const STATUS_COLOR: Record<string, string> = {
  active: "#05b169",
  paused: "#f4b000",
  done: "#a8acb3",
};

const SIZE_BG: Record<string, string> = {
  S: "#fce7f3",
  M: "#eef0f3",
  L: "#dbeafe",
  XL: "#ede9fe",
  TBD: "#fef3c7",
};

function DragHandle() {
  return (
    <svg width="8" height="12" viewBox="0 0 8 12" fill="none" style={{ flexShrink: 0, opacity: 0.3 }}>
      {[0, 4, 8].map((y) =>
        [0, 4].map((x) => (
          <circle key={`${x}-${y}`} cx={x + 1.5} cy={y + 1.5} r={1.2} fill="#7c828a" />
        ))
      )}
    </svg>
  );
}

export default function Sidebar({ layoutRows }: Props) {
  const { projects, designers, phaseBlocks, collapsedDomains, toggleDomain } = useStore();
  const { openProject, openCreateProject, selectProjectBlocks, clearSelection, selectedBlockIds } = useGanttContext();

  function getProject(id: string) {
    return projects.find((p) => p.id === id);
  }

  function getDesigner(id: string) {
    return designers.find((d) => d.id === id);
  }

  function getProjectBlockIds(projectId: string): string[] {
    return phaseBlocks.filter((b) => b.projectId === projectId).map((b) => b.id);
  }

  function handleProjectClick(e: React.MouseEvent, project: Project) {
    const blockIds = getProjectBlockIds(project.id);
    if (e.shiftKey) {
      const alreadySelected = blockIds.length > 0 && blockIds.every((id) => selectedBlockIds.includes(id));
      if (alreadySelected) clearSelection();
      else selectProjectBlocks(blockIds);
    } else {
      clearSelection();
      openProject(project.id);
    }
  }

  function handleSelectClick(e: React.MouseEvent, project: Project) {
    e.stopPropagation();
    const blockIds = getProjectBlockIds(project.id);
    const alreadySelected = blockIds.length > 0 && blockIds.every((id) => selectedBlockIds.includes(id));
    if (alreadySelected) clearSelection();
    else selectProjectBlocks(blockIds);
  }

  // Count visible projects per domain for the badge
  const domainProjectCounts: Record<string, number> = {};
  for (const row of layoutRows) {
    if (row.kind === "project") {
      domainProjectCounts[row.domainId] = (domainProjectCounts[row.domainId] ?? 0) + 1;
    }
  }

  return (
    <div
      style={{
        width: SIDEBAR_WIDTH,
        flexShrink: 0,
        position: "sticky",
        left: 0,
        zIndex: 20,
        background: "#fff",
        borderRight: "1px solid #dee1e6",
      }}
    >
      {/* Timeline header spacer — sticky top so it stays in the top-left corner */}
      <div
        style={{
          position: "sticky",
          top: 0,
          height: TIMELINE_HEADER_HEIGHT,
          background: "#fff",
          borderBottom: "1px solid #dee1e6",
          zIndex: 21,
          flexShrink: 0,
        }}
      />

      {/* Rows — driven by layoutRows for pixel-perfect alignment */}
      {layoutRows.map((row, i) => {
        if (row.kind === "domain-header") {
          const isCollapsed = collapsedDomains.includes(row.domainId);
          const count = domainProjectCounts[row.domainId] ?? 0;
          return (
            <div
              key={`dh-${row.domainId}`}
              className="group"
              style={{
                height: DOMAIN_HEADER_HEIGHT,
                display: "flex",
                alignItems: "center",
                gap: 4,
                paddingLeft: 12,
                paddingRight: 8,
                background: "#f7f7f7",
                borderBottom: "1px solid #dee1e6",
                flexShrink: 0,
              }}
            >
              <button
                onClick={() => toggleDomain(row.domainId)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  flex: 1,
                  minWidth: 0,
                  fontWeight: 600,
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  color: "#5b616e",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  userSelect: "none",
                }}
              >
                <span
                  style={{
                    transform: isCollapsed ? "rotate(-90deg)" : "rotate(0deg)",
                    display: "inline-block",
                    color: "#7c828a",
                    fontSize: 10,
                    transition: "transform 150ms ease",
                    flexShrink: 0,
                  }}
                >
                  ▾
                </span>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {row.name}
                </span>
                <span
                  style={{
                    background: "#eef0f3",
                    color: "#7c828a",
                    fontSize: 10,
                    padding: "1px 5px",
                    borderRadius: 99,
                    flexShrink: 0,
                  }}
                >
                  {count}
                </span>
              </button>

              {/* "+" — hover-only */}
              <button
                onClick={(e) => { e.stopPropagation(); openCreateProject(row.domainId); }}
                className="opacity-0 group-hover:opacity-100"
                style={{
                  width: 20,
                  height: 20,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "50%",
                  background: "transparent",
                  color: "#7c828a",
                  fontSize: 16,
                  lineHeight: 1,
                  border: "none",
                  cursor: "pointer",
                  flexShrink: 0,
                  transition: "background 100ms, color 100ms",
                }}
                title={`Add project to ${row.name}`}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "#eef0f3";
                  (e.currentTarget as HTMLElement).style.color = "#0052ff";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                  (e.currentTarget as HTMLElement).style.color = "#7c828a";
                }}
              >
                +
              </button>
            </div>
          );
        }

        if (row.kind === "empty-domain") {
          return (
            <div
              key={`ed-${row.domainId}-${i}`}
              style={{
                height: EMPTY_DOMAIN_ROW_HEIGHT,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderBottom: "1px solid #eef0f3",
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  color: "#a8acb3",
                  padding: "3px 10px",
                  border: "1px dashed #dee1e6",
                  borderRadius: 6,
                }}
              >
                No projects
              </span>
            </div>
          );
        }

        // project row
        const project = getProject(row.projectId);
        if (!project) return null;

        const designer = getDesigner(project.designerId);
        const blockIds = getProjectBlockIds(project.id);
        const isSelected = blockIds.length > 0 && blockIds.every((id) => selectedBlockIds.includes(id));
        const isDone = project.status === "done";
        const isPaused = project.status === "paused";

        return (
          <div
            key={`pr-${row.projectId}`}
            className="group/row"
            style={{
              height: row.height,
              display: "flex",
              alignItems: "center",
              gap: 6,
              paddingLeft: 8,
              paddingRight: 10,
              borderBottom: "1px solid #eef0f3",
              background: isSelected ? "#eff4ff" : "#fff",
              cursor: "pointer",
              flexShrink: 0,
              opacity: isPaused ? 0.5 : 1,
              transition: "background 100ms",
            }}
            onClick={(e) => handleProjectClick(e, project)}
            title="Click to open · Shift+click to select"
            onMouseEnter={(e) => {
              if (!isSelected) (e.currentTarget as HTMLElement).style.background = "#f5f5f5";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = isSelected ? "#eff4ff" : "#fff";
            }}
          >
            <DragHandle />

            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: STATUS_COLOR[project.status] ?? "#a8acb3",
                flexShrink: 0,
              }}
            />

            <span
              style={{
                flex: 1,
                minWidth: 0,
                maxWidth: 160,
                fontSize: 13,
                fontWeight: 500,
                color: isSelected ? "#0052ff" : "#0a0b0d",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                textDecoration: isDone ? "line-through" : "none",
                opacity: isDone ? 0.6 : 1,
              }}
            >
              {project.name}
            </span>

            {/* Select toggle — shows on hover */}
            <button
              onClick={(e) => handleSelectClick(e, project)}
              className="opacity-0 group-hover/row:opacity-100"
              style={{
                opacity: isSelected ? 1 : undefined,
                padding: "1px 5px",
                background: isSelected ? "#0052ff" : "#eef0f3",
                color: isSelected ? "#fff" : "#5b616e",
                fontSize: 10,
                fontWeight: 500,
                borderRadius: 4,
                border: "none",
                cursor: "pointer",
                flexShrink: 0,
                transition: "opacity 100ms",
              }}
              title={isSelected ? "Deselect" : "Select all blocks"}
            >
              {isSelected ? "✓" : "sel"}
            </button>

            <span
              style={{
                background: SIZE_BG[project.size] ?? "#eef0f3",
                color: "#5b616e",
                fontSize: 10,
                fontWeight: 500,
                padding: "1px 5px",
                borderRadius: 99,
                flexShrink: 0,
              }}
            >
              {project.size}
            </span>

            {designer && (
              <img
                src={`${process.env.NEXT_PUBLIC_BASE_PATH || ""}${designer.avatarUrl}`}
                alt={designer.name}
                title={designer.name}
                style={{ width: 22, height: 22, borderRadius: "50%", flexShrink: 0 }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
