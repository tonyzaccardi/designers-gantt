"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import {
  PIXELS_PER_DAY,
  getWeekColumns,
  getMonthBands,
  getDayColumns,
  totalGanttWidth,
} from "@/lib/ganttUtils";
import type { ZoomLevel } from "@/lib/types";

type Props = { zoom: ZoomLevel };

export default function TimelineHeader({ zoom }: Props) {
  const ppd = PIXELS_PER_DAY[zoom];
  const totalWidth = totalGanttWidth(ppd);

  const monthBands = useMemo(() => getMonthBands(ppd), [ppd]);
  const weekCols = useMemo(() => getWeekColumns(ppd), [ppd]);
  const dayCols = useMemo(() => getDayColumns(ppd), [ppd]);

  return (
    <div
      className="sticky top-0 z-20 border-b shrink-0"
      style={{
        width: totalWidth,
        borderColor: "#dee1e6",
        background: "#fff",
        userSelect: "none",
      }}
    >
      {/* Row 1: Month bands */}
      <div className="relative" style={{ height: 28 }}>
        {monthBands.map((m) => (
          <div
            key={m.label}
            className="absolute top-0 flex items-center px-2 border-r text-xs font-semibold"
            style={{
              left: m.left,
              width: m.width,
              height: 28,
              borderColor: "#dee1e6",
              color: "#0a0b0d",
              overflow: "hidden",
              whiteSpace: "nowrap",
            }}
          >
            {m.label}
          </div>
        ))}
      </div>

      {/* Row 2: Week / Day columns */}
      <div className="relative" style={{ height: 24, background: "#f7f7f7" }}>
        {zoom === "week" &&
          weekCols.map((w) => (
            <div
              key={w.date.toISOString()}
              className="absolute top-0 flex items-center px-1 border-r text-xs"
              style={{
                left: w.left,
                width: w.width,
                height: 24,
                borderColor: "#dee1e6",
                color: w.isCurrentWeek ? "#0052ff" : "#7c828a",
                fontWeight: w.isCurrentWeek ? 600 : 400,
                background: w.isCurrentWeek
                  ? "rgba(0,82,255,0.05)"
                  : "transparent",
                overflow: "hidden",
                whiteSpace: "nowrap",
              }}
            >
              {w.label}
            </div>
          ))}

        {zoom === "day" &&
          dayCols.map((d, i) => (
            <div
              key={i}
              className="absolute top-0 flex items-center justify-center border-r text-xs"
              style={{
                left: d.left,
                width: d.width,
                height: 24,
                borderColor: "#dee1e6",
                color: d.isToday
                  ? "#0052ff"
                  : d.dayOfWeek === 0 || d.dayOfWeek === 6
                  ? "#a8acb3"
                  : "#7c828a",
                fontWeight: d.isToday ? 600 : 400,
                background: d.isToday
                  ? "rgba(0,82,255,0.05)"
                  : d.dayOfWeek === 0 || d.dayOfWeek === 6
                  ? "rgba(0,0,0,0.02)"
                  : "transparent",
                overflow: "hidden",
                whiteSpace: "nowrap",
                fontSize: 10,
              }}
            >
              {d.label}
            </div>
          ))}

        {zoom === "month" &&
          weekCols.map((w) => (
            <div
              key={w.date.toISOString()}
              className="absolute top-0 border-r"
              style={{
                left: w.left,
                width: 1,
                height: 24,
                borderColor: "#dee1e6",
              }}
            />
          ))}
      </div>
    </div>
  );
}
