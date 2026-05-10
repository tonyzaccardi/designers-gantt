"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { PIXELS_PER_DAY, totalGanttWidth } from "@/lib/ganttUtils";
import type { LayoutRow } from "@/lib/ganttUtils";
import TimelineHeader from "./TimelineHeader";
import GanttBody from "./GanttBody";

type Props = {
  layoutRows: LayoutRow[];
};

export default function GanttArea({ layoutRows }: Props) {
  const { zoom } = useStore();
  const ppd = PIXELS_PER_DAY[zoom];
  const width = totalGanttWidth(ppd);

  // Brief opacity fade when zoom changes — signals the column layout refresh
  const [fading, setFading] = useState(false);
  useEffect(() => {
    setFading(true);
    const t = setTimeout(() => setFading(false), 120);
    return () => clearTimeout(t);
  }, [zoom]);

  return (
    <div
      style={{
        position: "relative",
        width,
        flexShrink: 0,
        opacity: fading ? 0.6 : 1,
        transition: fading ? "none" : "opacity 120ms ease",
      }}
    >
      <TimelineHeader zoom={zoom} />
      <GanttBody zoom={zoom} layoutRows={layoutRows} />
    </div>
  );
}
