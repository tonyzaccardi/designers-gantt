"use client";

import { useRef, useState } from "react";
import { addDays, format, parseISO } from "date-fns";
import type { Milestone, MilestoneType } from "@/lib/types";
import { dayOffset, PIXELS_PER_DAY } from "@/lib/ganttUtils";
import type { ZoomLevel } from "@/lib/types";
import { useStore } from "@/lib/store";
import { useGanttContext } from "@/lib/ganttContext";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

type Props = {
  milestone: Milestone;
  milestoneType?: MilestoneType;
  zoom: ZoomLevel;
  rowHeight: number;
};

// Diamond SVG fallback for types with no icon
function DiamondShape({ size, hovered, isDragging }: { size: number; hovered: boolean; isDragging: boolean }) {
  const scale = isDragging ? 1.4 : hovered ? 1.3 : 1.0;
  const shadow = isDragging
    ? "drop-shadow(0 4px 8px rgba(244,176,0,0.6))"
    : hovered
    ? "drop-shadow(0 2px 6px rgba(244,176,0,0.5))"
    : "drop-shadow(0 1px 3px rgba(0,0,0,0.25))";
  return (
    <svg
      width={size} height={size}
      viewBox="0 0 16 16"
      style={{
        transform: `scale(${scale})`,
        transformOrigin: "center",
        filter: shadow,
        transition: isDragging ? "none" : "transform 0.15s ease, filter 0.15s ease",
      }}
    >
      <rect x="2" y="2" width="12" height="12" rx="2" fill="#f4b000" stroke="#fff" strokeWidth="2" transform="rotate(45 8 8)" />
    </svg>
  );
}

export default function MilestoneMarker({ milestone, milestoneType, zoom, rowHeight }: Props) {
  const { updateMilestone, deleteMilestone } = useStore();
  const { openContextMenu, openEditMilestone } = useGanttContext();
  const [hovered, setHovered] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [dragDeltaDays, setDragDeltaDays] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number; delta: number } | null>(null);

  const ppd = PIXELS_PER_DAY[zoom];
  const label = milestone.customLabel ?? milestoneType?.name ?? "Milestone";
  const icon = milestoneType?.icon ?? null;
  const SIZE = icon ? 20 : 16;

  const displayDate =
    dragDeltaDays !== 0
      ? format(addDays(parseISO(milestone.date), dragDeltaDays), "yyyy-MM-dd")
      : milestone.date;
  const left = dayOffset(displayDate, ppd);

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { startX: e.clientX, delta: 0 };
    setIsDragging(true);
    setDragDeltaDays(0);
    document.body.style.userSelect = "none";
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragRef.current) return;
    const delta = Math.round((e.clientX - dragRef.current.startX) / ppd);
    dragRef.current.delta = delta;
    setDragDeltaDays(delta);
  }

  function onPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragRef.current) return;
    const { delta } = dragRef.current;
    try {
      document.body.style.userSelect = "";
      if (delta !== 0) {
        updateMilestone(milestone.id, {
          date: format(addDays(parseISO(milestone.date), delta), "yyyy-MM-dd"),
        });
      }
    } finally {
      dragRef.current = null;
      setDragDeltaDays(0);
      setIsDragging(false);
    }
  }

  const emojiScale = isDragging ? 1.4 : hovered ? 1.3 : 1.0;

  return (
    <>
      <div
        className="absolute select-none flex items-center justify-center"
        style={{
          left: left - SIZE / 2,
          top: rowHeight / 2 - SIZE / 2,
          width: SIZE,
          height: SIZE,
          cursor: isDragging ? "grabbing" : "grab",
          zIndex: isDragging ? 15 : 25,
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onDoubleClick={(e) => {
          e.stopPropagation();
          openEditMilestone(milestone.id, e.clientX, e.clientY);
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          openContextMenu(e.clientX, e.clientY, [
            { label: "Edit milestone", onClick: () => openEditMilestone(milestone.id, e.clientX, e.clientY) },
            { separator: true },
            { label: "Delete milestone", danger: true, onClick: () => setConfirmDelete(true) },
          ]);
        }}
      >
        {/* Icon: emoji or diamond fallback */}
        {icon ? (
          <span
            style={{
              fontSize: SIZE - 2,
              lineHeight: 1,
              display: "block",
              transform: `scale(${emojiScale})`,
              transformOrigin: "center",
              transition: isDragging ? "none" : "transform 0.15s ease",
              filter: isDragging
                ? "drop-shadow(0 3px 6px rgba(0,0,0,0.35))"
                : hovered
                ? "drop-shadow(0 2px 4px rgba(0,0,0,0.25))"
                : "none",
              opacity: isDragging ? 0.85 : 1,
            }}
          >
            {icon}
          </span>
        ) : (
          <DiamondShape size={SIZE} hovered={hovered} isDragging={isDragging} />
        )}

        {/* Tooltip */}
        {(isDragging || hovered) && (
          <div
            className="absolute pointer-events-none"
            style={{
              bottom: SIZE + 6,
              left: "50%",
              transform: "translateX(-50%)",
              background: "#0a0b0d",
              color: "#fff",
              padding: "4px 8px",
              borderRadius: 6,
              fontSize: 12,
              whiteSpace: "nowrap",
              boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
              zIndex: 50,
            }}
          >
            {isDragging ? displayDate : (
              <>
                {icon && <span style={{ marginRight: 4 }}>{icon}</span>}
                {label}
                <span style={{ color: "#a8acb3", marginLeft: 6 }}>{milestone.date}</span>
                {milestone.note && (
                  <div style={{ color: "#a8acb3", marginTop: 2 }}>{milestone.note}</div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete milestone?"
        message={`"${label}" will be removed.`}
        confirmLabel="Delete"
        onConfirm={() => { deleteMilestone(milestone.id); setConfirmDelete(false); }}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
}
