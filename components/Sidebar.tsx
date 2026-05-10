"use client";

import { useRef, useState, useEffect, useCallback, useMemo } from "react";
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

type Props = { layoutRows: LayoutRow[] };

const STATUS_COLOR: Record<string, string> = {
  active: "#05b169",
  paused: "#f4b000",
  done:   "#a8acb3",
};
const SIZE_BG: Record<string, string> = {
  S: "#fce7f3", M: "#eef0f3", L: "#dbeafe", XL: "#ede9fe", TBD: "#fef3c7",
};

function DragHandle({ onDown }: { onDown: (e: React.PointerEvent) => void }) {
  return (
    <div
      onPointerDown={onDown}
      style={{ flexShrink: 0, cursor: "grab", padding: "4px 2px", touchAction: "none" }}
      title="Drag to reorder"
    >
      <svg width="8" height="12" viewBox="0 0 8 12" fill="none" style={{ opacity: 0.3, display: "block" }}>
        {[0, 4, 8].map((y) =>
          [0, 4].map((x) => (
            <circle key={`${x}-${y}`} cx={x + 1.5} cy={y + 1.5} r={1.2} fill="#7c828a" />
          ))
        )}
      </svg>
    </div>
  );
}

type DropTarget = { domainId: string; beforeProjectId: string | null } | null;

export default function Sidebar({ layoutRows }: Props) {
  const { projects, designers, phaseBlocks, collapsedDomains, toggleDomain, reorderProjects } = useStore();
  const { openProject, openCreateProject, selectProjectBlocks, clearSelection, selectedBlockIds } = useGanttContext();

  const sidebarRef = useRef<HTMLDivElement>(null);

  // ── Drag state ───────────────────────────────────────────────────────────────
  const dragRef = useRef<{ projectId: string; domainId: string } | null>(null);
  const dropTargetRef = useRef<DropTarget>(null);
  const didDragRef = useRef(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropIndicator, setDropIndicator] = useState<{ y: number; x: number; width: number } | null>(null);
  const [highlightedDomainId, setHighlightedDomainId] = useState<string | null>(null);

  // pre-compute project ids per domain (in render order)
  const domainProjectIds = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const row of layoutRows) {
      if (row.kind === "project") {
        if (!map[row.domainId]) map[row.domainId] = [];
        map[row.domainId].push(row.projectId);
      }
    }
    return map;
  }, [layoutRows]);

  const commitDrop = useCallback(() => {
    const drag = dragRef.current;
    const target = dropTargetRef.current;
    if (!drag || !target) return;

    const { projectId, domainId: sourceDomainId } = drag;
    const { domainId: targetDomainId, beforeProjectId } = target;

    // Build new order for target domain
    const targetIds = (domainProjectIds[targetDomainId] ?? []).filter((id) => id !== projectId);
    const insertIdx = beforeProjectId ? targetIds.indexOf(beforeProjectId) : targetIds.length;
    const finalInsert = insertIdx === -1 ? targetIds.length : insertIdx;
    targetIds.splice(finalInsert, 0, projectId);

    const updates: { id: string; domainId: string; sortOrder: number }[] = [];

    // Re-index target domain
    targetIds.forEach((id, i) => updates.push({ id, domainId: targetDomainId, sortOrder: i }));

    // If cross-domain: re-index source domain too
    if (sourceDomainId !== targetDomainId) {
      const srcIds = (domainProjectIds[sourceDomainId] ?? []).filter((id) => id !== projectId);
      srcIds.forEach((id, i) => updates.push({ id, domainId: sourceDomainId, sortOrder: i }));
    }

    reorderProjects(updates);
  }, [domainProjectIds, reorderProjects]);

  const stopDrag = useCallback(() => {
    dragRef.current = null;
    dropTargetRef.current = null;
    setDraggingId(null);
    setDropIndicator(null);
    setHighlightedDomainId(null);
    document.body.style.cursor = "";
  }, []);

  useEffect(() => {
    if (!draggingId) return;

    function onMove(e: PointerEvent) {
      const sidebar = sidebarRef.current;
      if (!sidebar) return;

      // Pierce through pointer capture by using elementFromPoint
      // Temporarily hide the dragging element? No — just use data attrs.
      const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
      if (!el) return;

      const rowEl = el.closest("[data-row-project-id], [data-row-domain-id]") as HTMLElement | null;
      if (!rowEl) return;

      const projectId = rowEl.getAttribute("data-row-project-id");
      const domainId = rowEl.getAttribute("data-row-domain-id");
      if (!domainId) return;

      const rect = rowEl.getBoundingClientRect();
      const sRect = sidebar.getBoundingClientRect();

      if (projectId && projectId !== draggingId) {
        const mid = rect.top + rect.height / 2;
        if (e.clientY < mid) {
          // Insert before this project
          dropTargetRef.current = { domainId, beforeProjectId: projectId };
          setDropIndicator({ y: rect.top, x: sRect.left, width: sRect.width });
        } else {
          // Insert after → find next project id
          const ids = domainProjectIds[domainId] ?? [];
          const idx = ids.indexOf(projectId);
          const next = idx + 1 < ids.length ? ids[idx + 1] : null;
          dropTargetRef.current = { domainId, beforeProjectId: next };
          setDropIndicator({ y: rect.bottom, x: sRect.left, width: sRect.width });
        }
        setHighlightedDomainId(null);
      } else if (!projectId) {
        // Over domain header or empty row → insert at end
        dropTargetRef.current = { domainId, beforeProjectId: null };
        setDropIndicator({ y: rect.bottom, x: sRect.left, width: sRect.width });
        setHighlightedDomainId(domainId);
      }
    }

    function onUp(_e: PointerEvent) {
      if (dropTargetRef.current) {
        didDragRef.current = true;
        commitDrop();
      }
      stopDrag();
    }

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") stopDrag();
    }

    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
    document.addEventListener("keydown", onKey);
    document.body.style.cursor = "grabbing";

    return () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      document.removeEventListener("keydown", onKey);
    };
  }, [draggingId, domainProjectIds, commitDrop, stopDrag]);

  // ── Helpers ──────────────────────────────────────────────────────────────────
  function getProject(id: string) { return projects.find((p) => p.id === id); }
  function getDesigner(id: string) { return designers.find((d) => d.id === id); }
  function getProjectBlockIds(pid: string) {
    return phaseBlocks.filter((b) => b.projectId === pid).map((b) => b.id);
  }

  function handleProjectClick(e: React.MouseEvent, project: Project) {
    if (didDragRef.current) { didDragRef.current = false; return; }
    const blockIds = getProjectBlockIds(project.id);
    if (e.shiftKey) {
      const all = blockIds.every((id) => selectedBlockIds.includes(id));
      if (all) clearSelection(); else selectProjectBlocks(blockIds);
    } else {
      clearSelection();
      openProject(project.id);
    }
  }

  function handleSelectClick(e: React.MouseEvent, project: Project) {
    e.stopPropagation();
    const blockIds = getProjectBlockIds(project.id);
    const all = blockIds.length > 0 && blockIds.every((id) => selectedBlockIds.includes(id));
    if (all) clearSelection(); else selectProjectBlocks(blockIds);
  }

  const domainProjectCounts: Record<string, number> = {};
  for (const row of layoutRows) {
    if (row.kind === "project") {
      domainProjectCounts[row.domainId] = (domainProjectCounts[row.domainId] ?? 0) + 1;
    }
  }

  return (
    <>
      {/* Drop indicator line (fixed position) */}
      {dropIndicator && (
        <div
          style={{
            position: "fixed",
            left: dropIndicator.x,
            top: dropIndicator.y - 1,
            width: dropIndicator.width,
            height: 2,
            background: "#0052ff",
            zIndex: 9999,
            pointerEvents: "none",
            borderRadius: 1,
          }}
        />
      )}

      <div
        ref={sidebarRef}
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
        {/* Timeline header spacer */}
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

        {layoutRows.map((row, i) => {
          if (row.kind === "domain-header") {
            const isCollapsed = collapsedDomains.includes(row.domainId);
            const count = domainProjectCounts[row.domainId] ?? 0;
            const isHighlighted = highlightedDomainId === row.domainId;
            return (
              <div
                key={`dh-${row.domainId}`}
                className="group"
                data-row-domain-id={row.domainId}
                style={{
                  height: DOMAIN_HEADER_HEIGHT,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  paddingLeft: 12,
                  paddingRight: 8,
                  background: isHighlighted ? "rgba(0,82,255,0.06)" : "#f7f7f7",
                  borderBottom: "1px solid #dee1e6",
                  flexShrink: 0,
                  transition: "background 80ms",
                }}
              >
                <button
                  onClick={() => toggleDomain(row.domainId)}
                  style={{
                    display: "flex", alignItems: "center", gap: 6, flex: 1, minWidth: 0,
                    fontWeight: 600, fontSize: 11, textTransform: "uppercase",
                    letterSpacing: "0.05em", color: "#5b616e",
                    background: "none", border: "none", cursor: "pointer", padding: 0, userSelect: "none",
                  }}
                >
                  <span style={{ transform: isCollapsed ? "rotate(-90deg)" : "rotate(0deg)", display: "inline-block", color: "#7c828a", fontSize: 10, transition: "transform 150ms ease", flexShrink: 0 }}>▾</span>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.name}</span>
                  <span style={{ background: "#eef0f3", color: "#7c828a", fontSize: 10, padding: "1px 5px", borderRadius: 99, flexShrink: 0 }}>{count}</span>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); openCreateProject(row.domainId); }}
                  className="opacity-0 group-hover:opacity-100"
                  style={{ width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", background: "transparent", color: "#7c828a", fontSize: 16, lineHeight: 1, border: "none", cursor: "pointer", flexShrink: 0, transition: "background 100ms, color 100ms" }}
                  title={`Add project to ${row.name}`}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#eef0f3"; (e.currentTarget as HTMLElement).style.color = "#0052ff"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "#7c828a"; }}
                >+</button>
              </div>
            );
          }

          if (row.kind === "empty-domain") {
            return (
              <div
                key={`ed-${row.domainId}-${i}`}
                data-row-domain-id={row.domainId}
                style={{ height: EMPTY_DOMAIN_ROW_HEIGHT, display: "flex", alignItems: "center", justifyContent: "center", borderBottom: "1px solid #eef0f3", flexShrink: 0 }}
              >
                <span style={{ fontSize: 11, color: "#a8acb3", padding: "3px 10px", border: "1px dashed #dee1e6", borderRadius: 6 }}>No projects</span>
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
          const isDragging = draggingId === project.id;

          return (
            <div
              key={`pr-${row.projectId}`}
              className="group/row"
              data-row-project-id={project.id}
              data-row-domain-id={project.domainId}
              style={{
                height: row.height,
                display: "flex",
                alignItems: "center",
                gap: 6,
                paddingLeft: 8,
                paddingRight: 10,
                borderBottom: "1px solid #eef0f3",
                background: isDragging ? "#f0f4ff" : isSelected ? "#eff4ff" : "#fff",
                cursor: isDragging ? "grabbing" : "pointer",
                flexShrink: 0,
                opacity: isDragging ? 0.85 : isPaused ? 0.5 : 1,
                transform: isDragging ? "scale(1.01)" : "scale(1)",
                boxShadow: isDragging ? "0 4px 16px rgba(0,0,0,0.12)" : "none",
                transition: isDragging ? "none" : "background 100ms, box-shadow 150ms, transform 150ms",
                zIndex: isDragging ? 10 : 0,
                position: "relative",
              }}
              onClick={(e) => handleProjectClick(e, project)}
              title="Click to open · Shift+click to select"
              onMouseEnter={(e) => { if (!isSelected && !isDragging) (e.currentTarget as HTMLElement).style.background = "#f5f5f5"; }}
              onMouseLeave={(e) => { if (!isDragging) (e.currentTarget as HTMLElement).style.background = isSelected ? "#eff4ff" : "#fff"; }}
            >
              <DragHandle
                onDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  dragRef.current = { projectId: project.id, domainId: project.domainId };
                  didDragRef.current = false;
                  setDraggingId(project.id);
                }}
              />

              <span style={{ width: 7, height: 7, borderRadius: "50%", background: STATUS_COLOR[project.status] ?? "#a8acb3", flexShrink: 0 }} />

              <span style={{ flex: 1, minWidth: 0, maxWidth: 160, fontSize: 13, fontWeight: 500, color: isSelected ? "#0052ff" : "#0a0b0d", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textDecoration: isDone ? "line-through" : "none", opacity: isDone ? 0.6 : 1 }}>
                {project.name}
              </span>

              <button
                onClick={(e) => handleSelectClick(e, project)}
                className="opacity-0 group-hover/row:opacity-100"
                style={{ opacity: isSelected ? 1 : undefined, padding: "1px 5px", background: isSelected ? "#0052ff" : "#eef0f3", color: isSelected ? "#fff" : "#5b616e", fontSize: 10, fontWeight: 500, borderRadius: 4, border: "none", cursor: "pointer", flexShrink: 0, transition: "opacity 100ms" }}
                title={isSelected ? "Deselect" : "Select all blocks"}
              >{isSelected ? "✓" : "sel"}</button>

              <span style={{ background: SIZE_BG[project.size] ?? "#eef0f3", color: "#5b616e", fontSize: 10, fontWeight: 500, padding: "1px 5px", borderRadius: 99, flexShrink: 0 }}>
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
    </>
  );
}
