"use client";

import { todayOffset, PIXELS_PER_DAY } from "@/lib/ganttUtils";
import type { ZoomLevel } from "@/lib/types";

type Props = { zoom: ZoomLevel; totalHeight: number };

export default function TodayMarker({ zoom, totalHeight }: Props) {
  const ppd = PIXELS_PER_DAY[zoom];
  const offset = todayOffset(ppd);
  if (offset < 0) return null;

  return (
    <div
      id="today-marker"
      className="absolute top-0 pointer-events-none"
      style={{
        left: offset,
        width: 2,
        height: totalHeight,
        // z-index 1: above row backgrounds, but below domain headers (z-index 2)
        // and well below the sticky timeline header (z-index 20)
        zIndex: 1,
      }}
    >
      <div
        className="absolute top-0 left-0"
        style={{
          width: 2,
          height: totalHeight,
          background: "#ef4444",
          opacity: 0.65,
        }}
      />
    </div>
  );
}
