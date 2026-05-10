"use client";

import type { OooPeriod } from "@/lib/types";
import { dayOffset, blockWidth, PIXELS_PER_DAY } from "@/lib/ganttUtils";
import type { ZoomLevel } from "@/lib/types";

type Props = {
  period: OooPeriod;
  zoom: ZoomLevel;
  rowHeight: number;
};

export default function OooOverlay({ period, zoom, rowHeight }: Props) {
  const ppd = PIXELS_PER_DAY[zoom];
  const left = dayOffset(period.startDate, ppd);
  const width = blockWidth(period.startDate, period.endDate, ppd);

  return (
    <div
      className="absolute top-0 ooo-hatch pointer-events-none z-0"
      style={{
        left,
        width,
        height: rowHeight,
        borderLeft: "1px solid rgba(107,114,128,0.2)",
        borderRight: "1px solid rgba(107,114,128,0.2)",
      }}
      title={`OOO${period.note ? ": " + period.note : ""}\n${period.startDate} → ${period.endDate}`}
    />
  );
}
