"use client";

import type { LayoutRow } from "@/lib/ganttUtils";
import {
  DOMAIN_HEADER_HEIGHT,
  EMPTY_DOMAIN_ROW_HEIGHT,
  PIXELS_PER_DAY,
  totalGanttWidth,
  layoutTotalHeight,
} from "@/lib/ganttUtils";
import type { ZoomLevel } from "@/lib/types";
import GanttRow from "./GanttRow";
import TodayMarker from "./TodayMarker";
import { useStore } from "@/lib/store";

type Props = {
  zoom: ZoomLevel;
  layoutRows: LayoutRow[];
};

export default function GanttBody({ zoom, layoutRows }: Props) {
  const { projects, phaseBlocks, milestones, oooPeriods, phaseTypes, milestoneTypes, filters } = useStore();
  const ppd = PIXELS_PER_DAY[zoom];
  const totalWidth = totalGanttWidth(ppd);
  const totalHeight = layoutTotalHeight(layoutRows);

  let projectIndex = 0;

  return (
    <div style={{ position: "relative", width: totalWidth, minHeight: totalHeight }}>
      <TodayMarker zoom={zoom} totalHeight={totalHeight} />

      {layoutRows.map((row, i) => {
        if (row.kind === "domain-header") {
          return (
            <div
              key={`dh-${row.domainId}`}
              style={{
                width: totalWidth,
                height: DOMAIN_HEADER_HEIGHT,
                display: "flex",
                alignItems: "center",
                paddingLeft: 12,
                background: "#f7f7f7",
                borderBottom: "1px solid #dee1e6",
                position: "relative",
                zIndex: 2,
                fontSize: 11,
                fontWeight: 600,
                textTransform: "uppercase" as const,
                letterSpacing: "0.05em",
                color: "#5b616e",
                flexShrink: 0,
              }}
            >
              {row.name}
            </div>
          );
        }

        if (row.kind === "empty-domain") {
          return (
            <div
              key={`ed-${row.domainId}-${i}`}
              style={{
                width: totalWidth,
                height: EMPTY_DOMAIN_ROW_HEIGHT,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderBottom: "1px solid #eef0f3",
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
        const project = projects.find((p) => p.id === row.projectId);
        if (!project) return null;

        const isEven = projectIndex++ % 2 === 0;
        const projectBlocks = phaseBlocks.filter((b) => b.projectId === project.id);
        const projectMilestones = milestones.filter((m) => m.projectId === project.id);
        const designerOoo = oooPeriods.filter((o) => o.designerId === project.designerId);

        return (
          <GanttRow
            key={`pr-${row.projectId}`}
            project={project}
            phaseBlocks={projectBlocks}
            milestones={projectMilestones}
            oooPeriods={designerOoo}
            phaseTypes={phaseTypes}
            milestoneTypes={milestoneTypes}
            zoom={zoom}
            height={row.height}
            isEven={isEven}
            filters={filters}
          />
        );
      })}
    </div>
  );
}
