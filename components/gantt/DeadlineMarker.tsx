"use client";

import { useState } from "react";
import { dayOffset, PIXELS_PER_DAY } from "@/lib/ganttUtils";
import type { ZoomLevel } from "@/lib/types";

type Props = { date: string; zoom: ZoomLevel; rowHeight: number };

export default function DeadlineMarker({ date, zoom, rowHeight }: Props) {
  const [hovered, setHovered] = useState(false);
  const ppd = PIXELS_PER_DAY[zoom];
  const left = dayOffset(date, ppd);

  return (
    <div
      className="absolute top-0 z-20 pointer-events-auto"
      style={{ left, width: 0 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Flag */}
      <div className="absolute" style={{ top: 4, left: 2 }}>
        <svg width="10" height="10" viewBox="0 0 10 10">
          <polygon points="0,0 8,4 0,8" fill="#f97316" />
        </svg>
      </div>
      {/* Dashed line */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: 2,
          height: rowHeight,
          borderLeft: "2px dashed #f97316",
          opacity: 0.7,
        }}
      />
      {/* Tooltip */}
      {hovered && (
        <div
          className="absolute z-50 rounded-lg px-2 py-1 text-xs whitespace-nowrap"
          style={{
            top: 16,
            left: 4,
            background: "#0a0b0d",
            color: "#fff",
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
          }}
        >
          Deadline: {date}
        </div>
      )}
    </div>
  );
}
