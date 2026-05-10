"use client";

import { useRef, useState } from "react";
import { addDays, parseISO, format } from "date-fns";
import type { PhaseBlock as PhaseBlockType, PhaseType, OooPeriod } from "@/lib/types";
import { dayOffset, blockWidth, PIXELS_PER_DAY } from "@/lib/ganttUtils";
import type { ZoomLevel } from "@/lib/types";
import { useStore } from "@/lib/store";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useGanttContext } from "@/lib/ganttContext";

type Props = {
  block: PhaseBlockType;
  phaseType: PhaseType;
  zoom: ZoomLevel;
  lane: number;
  oooConflicts: OooPeriod[];
  projectId: string;
};

const LANE_OFFSET = 30;
const BLOCK_HEIGHT = 24;
const EDGE_PX = 8; // slightly wider hit target

function darkenHex(hex: string, amount = 0.2): string {
  const n = parseInt(hex.replace("#", ""), 16);
  const r = Math.max(0, ((n >> 16) & 0xff) * (1 - amount));
  const g = Math.max(0, ((n >> 8) & 0xff) * (1 - amount));
  const b = Math.max(0, (n & 0xff) * (1 - amount));
  return `rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`;
}

export default function PhaseBlock({ block, phaseType, zoom, lane, oooConflicts, projectId }: Props) {
  const {
    openEditPhase, openContextMenu, isBlockSelected, selectedBlockIds,
    bulkDragDeltaDays, setBulkDragDeltaDays, commitBulkDrag,
    selectProjectBlocks, openCreateMilestone,
  } = useGanttContext();

  const { updatePhaseBlock, deletePhaseBlock, phaseBlocks } = useStore();
  const ppd = PIXELS_PER_DAY[zoom];
  const selected = isBlockSelected(block.id);
  const [hovered, setHovered] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDraggingState, setIsDraggingState] = useState(false);
  const [isResizingState, setIsResizingState] = useState(false);

  // All block IDs for this project (for "Select all" context menu action)
  const projectBlockIds = phaseBlocks.filter((b) => b.projectId === projectId).map((b) => b.id);

  // ─── Drag state ──────────────────────────────────────────────────────────────
  // Delta stored IN the ref so pointerup reads the current value (no stale closure).
  // State is display-only and drives re-renders.
  const dragRef = useRef<{ startX: number; isBulk: boolean; delta: number } | null>(null);
  const [dragDisplayDelta, setDragDisplayDelta] = useState(0);

  // ─── Resize state ─────────────────────────────────────────────────────────────
  const resizeRef = useRef<{ edge: "left" | "right"; startX: number; delta: number } | null>(null);
  const [resizeDisplayDelta, setResizeDisplayDelta] = useState(0);

  // ─── Computed display dates ──────────────────────────────────────────────────
  const isDraggingBulk = dragRef.current !== null && dragRef.current.isBulk;
  // State-based flags — update immediately on pointerdown (ref reads don't trigger re-renders)
  const isDragging = isDraggingState;
  const isResizing = isResizingState;

  const dragDelta = isDraggingBulk ? bulkDragDeltaDays : dragDisplayDelta;

  let displayStart = block.startDate;
  let displayEnd = block.endDate;

  if (isDragging && dragDelta !== 0) {
    displayStart = format(addDays(parseISO(block.startDate), dragDelta), "yyyy-MM-dd");
    displayEnd = format(addDays(parseISO(block.endDate), dragDelta), "yyyy-MM-dd");
  } else if (isResizing && resizeDisplayDelta !== 0) {
    if (resizeRef.current!.edge === "left") {
      const ns = addDays(parseISO(block.startDate), resizeDisplayDelta);
      if (ns < parseISO(block.endDate)) displayStart = format(ns, "yyyy-MM-dd");
    } else {
      const ne = addDays(parseISO(block.endDate), resizeDisplayDelta);
      if (ne > parseISO(block.startDate)) displayEnd = format(ne, "yyyy-MM-dd");
    }
  }

  const left = dayOffset(displayStart, ppd);
  const width = Math.max(blockWidth(displayStart, displayEnd, ppd), 20);
  const top = 10 + lane * LANE_OFFSET;

  // ─── Drag handlers ────────────────────────────────────────────────────────────
  function onBlockPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).dataset.resize) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    const isBulk = selected && selectedBlockIds.length > 1;
    dragRef.current = { startX: e.clientX, isBulk, delta: 0 };
    setIsDraggingState(true);
    if (isBulk) setBulkDragDeltaDays(0);
    else setDragDisplayDelta(0);
    document.body.style.userSelect = "none";
  }

  function onBlockPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragRef.current) return;
    const delta = Math.round((e.clientX - dragRef.current.startX) / ppd);
    dragRef.current.delta = delta; // keep ref in sync for pointerup
    if (dragRef.current.isBulk) setBulkDragDeltaDays(delta);
    else setDragDisplayDelta(delta);
  }

  function onBlockPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragRef.current) return;
    const { isBulk, delta } = dragRef.current; // read from ref — never stale
    try {
      document.body.style.userSelect = "";
      if (isBulk) {
        commitBulkDrag(ppd);
      } else {
        if (delta !== 0) {
          updatePhaseBlock(block.id, {
            startDate: format(addDays(parseISO(block.startDate), delta), "yyyy-MM-dd"),
            endDate: format(addDays(parseISO(block.endDate), delta), "yyyy-MM-dd"),
          });
        }
      }
    } finally {
      dragRef.current = null;
      setDragDisplayDelta(0);
      setIsDraggingState(false);
    }
  }

  // ─── Resize handlers ──────────────────────────────────────────────────────────
  function onEdgePointerDown(e: React.PointerEvent<HTMLDivElement>, edge: "left" | "right") {
    e.stopPropagation();
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    resizeRef.current = { edge, startX: e.clientX, delta: 0 };
    setIsResizingState(true);
    setResizeDisplayDelta(0);
    document.body.style.userSelect = "none";
  }

  function onEdgePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!resizeRef.current) return;
    const delta = Math.round((e.clientX - resizeRef.current.startX) / ppd);
    resizeRef.current.delta = delta; // keep ref in sync for pointerup
    setResizeDisplayDelta(delta);
  }

  function onEdgePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (!resizeRef.current) return;
    const { edge, delta } = resizeRef.current; // read from ref — never stale
    try {
      document.body.style.userSelect = "";
      if (delta !== 0) {
        if (edge === "left") {
          const ns = addDays(parseISO(block.startDate), delta);
          if (ns < parseISO(block.endDate)) {
            updatePhaseBlock(block.id, { startDate: format(ns, "yyyy-MM-dd") });
          }
        } else {
          const ne = addDays(parseISO(block.endDate), delta);
          if (ne > parseISO(block.startDate)) {
            updatePhaseBlock(block.id, { endDate: format(ne, "yyyy-MM-dd") });
          }
        }
      }
    } finally {
      resizeRef.current = null;
      setResizeDisplayDelta(0);
      setIsResizingState(false);
    }
  }

  // ─── Context / double-click ───────────────────────────────────────────────────
  function onDoubleClick(e: React.MouseEvent) {
    e.stopPropagation();
    openEditPhase(block.id, e.clientX, e.clientY);
  }

  function onContextMenu(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const allSelected = projectBlockIds.length > 0 && projectBlockIds.every((id) => selectedBlockIds.includes(id));
    openContextMenu(e.clientX, e.clientY, [
      { label: "Edit phase", onClick: () => openEditPhase(block.id, e.clientX, e.clientY) },
      { label: allSelected ? "Deselect all blocks" : "Select all blocks", onClick: () => allSelected ? selectProjectBlocks([]) : selectProjectBlocks(projectBlockIds) },
      { separator: true },
      { label: "Delete phase", danger: true, onClick: () => setConfirmDelete(true) },
      { separator: true },
      { label: "Add milestone here", onClick: () => openCreateMilestone(projectId, block.startDate, e.clientX, e.clientY) },
    ]);
  }

  // ─── Visual ───────────────────────────────────────────────────────────────────
  const hasOooConflict = oooConflicts.length > 0;
  const borderColor = darkenHex(phaseType.color, 0.2);
  const showFull = width >= 80;
  const showEmoji = width >= 32;
  const dragTooltip = isDragging || isResizing ? `${displayStart} → ${displayEnd}` : null;

  const boxShadow = isDragging || isResizing
    ? `0 6px 20px ${phaseType.color}55, 0 2px 6px rgba(0,0,0,0.12)`
    : hovered && !selected
    ? `0 3px 10px ${phaseType.color}44, 0 1px 4px rgba(0,0,0,0.1)`
    : selected
    ? `0 0 0 2px #0052ff, 0 1px 3px rgba(0,0,0,0.15)`
    : `0 1px 2px rgba(0,0,0,0.12)`;

  // z-index capped at 15 — stays below sticky timeline header (z-index 20)
  const zIndex = isDragging || isResizing ? 15 : selected ? 8 : 5;

  return (
    <>
    <div
      className="absolute flex items-center gap-1 px-2 select-none"
      style={{
        left,
        top,
        width,
        height: BLOCK_HEIGHT,
        background: phaseType.color,
        borderRadius: 6,
        border: `1px solid ${hasOooConflict ? "rgba(249,115,22,0.7)" : borderColor}`,
        outline: hasOooConflict ? "1px dashed rgba(249,115,22,0.8)" : "none",
        outlineOffset: 2,
        color: "#fff",
        fontSize: 12,
        fontWeight: 500,
        cursor: isDragging ? "grabbing" : "grab",
        boxShadow,
        overflow: "hidden",
        whiteSpace: "nowrap",
        zIndex,
        opacity: isDragging ? 0.88 : 1,
        transform: isDragging
          ? "scale(1.02)"
          : hovered && !isDragging && !isResizing
          ? "scale(1.02)"
          : "scale(1)",
        transition: isDragging || isResizing
          ? "none"
          : "transform 150ms ease, box-shadow 150ms ease",
      }}
      onPointerDown={onBlockPointerDown}
      onPointerMove={onBlockPointerMove}
      onPointerUp={onBlockPointerUp}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onDoubleClick={onDoubleClick}
      onContextMenu={onContextMenu}
    >
      {/* Left resize handle */}
      <div
        data-resize="left"
        className="absolute left-0 top-0 h-full cursor-col-resize"
        style={{ width: EDGE_PX, zIndex: 2 }}
        onPointerDown={(e) => onEdgePointerDown(e, "left")}
        onPointerMove={onEdgePointerMove}
        onPointerUp={onEdgePointerUp}
      />

      {showEmoji && <span style={{ fontSize: 13, pointerEvents: "none" }}>{phaseType.emoji}</span>}
      {showFull && (
        <span className="truncate" style={{ flex: 1, minWidth: 0, pointerEvents: "none" }}>
          {phaseType.name}
        </span>
      )}
      {hasOooConflict && (
        <span className="shrink-0 text-xs" style={{ pointerEvents: "none" }}>⚠️</span>
      )}

      {/* Right resize handle */}
      <div
        data-resize="right"
        className="absolute right-0 top-0 h-full cursor-col-resize"
        style={{ width: EDGE_PX, zIndex: 2 }}
        onPointerDown={(e) => onEdgePointerDown(e, "right")}
        onPointerMove={onEdgePointerMove}
        onPointerUp={onEdgePointerUp}
      />

      {/* Drag/resize date tooltip */}
      {dragTooltip && (
        <div
          className="absolute pointer-events-none rounded px-1.5 py-0.5 text-xs whitespace-nowrap"
          style={{
            top: -26,
            left: "50%",
            transform: "translateX(-50%)",
            background: "#0a0b0d",
            color: "#fff",
            zIndex: 50,
          }}
        >
          {dragTooltip}
        </div>
      )}
    </div>
    <ConfirmDialog
      open={confirmDelete}
      title="Delete phase?"
      message="This phase block will be permanently deleted."
      onConfirm={() => { deletePhaseBlock(block.id); setConfirmDelete(false); }}
      onCancel={() => setConfirmDelete(false)}
    />
    </>
  );
}
