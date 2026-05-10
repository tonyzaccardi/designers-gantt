"use client";

import { addDays, format } from "date-fns";
import type { Project, PhaseBlock, Milestone, OooPeriod, PhaseType, MilestoneType } from "@/lib/types";
import type { ZoomLevel } from "@/lib/types";
import { assignLanes, totalGanttWidth, PIXELS_PER_DAY, GANTT_START, getWeekendBands } from "@/lib/ganttUtils";
import { useGanttContext } from "@/lib/ganttContext";
import PhaseBlockComp from "./PhaseBlock";
import MilestoneMarker from "./MilestoneMarker";
import OooOverlay from "./OooOverlay";
import DeadlineMarker from "./DeadlineMarker";

type Props = {
  project: Project;
  phaseBlocks: PhaseBlock[];
  milestones: Milestone[];
  oooPeriods: OooPeriod[];
  phaseTypes: PhaseType[];
  milestoneTypes: MilestoneType[];
  zoom: ZoomLevel;
  height: number;
  isEven: boolean;
  filters: { phaseTypeId: string | null };
};

function getOooConflicts(block: PhaseBlock, oooPeriods: OooPeriod[]): OooPeriod[] {
  return oooPeriods.filter(
    (ooo) => block.startDate < ooo.endDate && block.endDate > ooo.startDate
  );
}

function offsetToDate(offsetX: number, ppd: number): string {
  const days = Math.round(offsetX / ppd);
  return format(addDays(GANTT_START, Math.max(0, days)), "yyyy-MM-dd");
}

export default function GanttRow({
  project,
  phaseBlocks,
  milestones,
  oooPeriods,
  phaseTypes,
  milestoneTypes,
  zoom,
  height,
  isEven,
  filters,
}: Props) {
  const ppd = PIXELS_PER_DAY[zoom];
  const totalWidth = totalGanttWidth(ppd);

  const { openCreatePhase, openContextMenu, openCreateMilestone } = useGanttContext();

  const filteredBlocks = filters.phaseTypeId
    ? phaseBlocks.filter((b) => b.phaseTypeId === filters.phaseTypeId)
    : phaseBlocks;

  const laneMap = assignLanes(filteredBlocks);

  function onRowDoubleClick(e: React.MouseEvent<HTMLDivElement>) {
    if ((e.target as HTMLElement).closest("[data-block]")) return;
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const date = offsetToDate(offsetX, ppd);
    openCreatePhase(project.id, date, e.clientX, e.clientY);
  }

  function onRowContextMenu(e: React.MouseEvent<HTMLDivElement>) {
    if ((e.target as HTMLElement).closest("[data-block]")) return;
    e.preventDefault();
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const date = offsetToDate(offsetX, ppd);
    openContextMenu(e.clientX, e.clientY, [
      {
        label: "Add phase here",
        onClick: () => openCreatePhase(project.id, date, e.clientX, e.clientY),
      },
      {
        label: "Add milestone here",
        onClick: () => openCreateMilestone(project.id, date, e.clientX, e.clientY),
      },
    ]);
  }

  return (
    <div
      className="relative border-b"
      style={{
        width: totalWidth,
        height,
        borderColor: "#eef0f3",
        background: isEven ? "#fff" : "#fdfdfd",
        flexShrink: 0,
      }}
      onDoubleClick={onRowDoubleClick}
      onContextMenu={onRowContextMenu}
    >
      {/* Weekend bands */}
      {getWeekendBands(ppd).map((band) => (
        <div
          key={band.left}
          style={{
            position: "absolute",
            top: 0,
            left: band.left,
            width: band.width,
            height: "100%",
            background: "rgba(0,0,0,0.03)",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />
      ))}

      {/* OOO overlays */}
      {oooPeriods.map((ooo) => (
        <OooOverlay key={ooo.id} period={ooo} zoom={zoom} rowHeight={height} />
      ))}

      {/* Phase blocks */}
      {filteredBlocks.map((block) => {
        const pt = phaseTypes.find((p) => p.id === block.phaseTypeId);
        if (!pt) return null;
        const lane = laneMap.get(block.id) ?? 0;
        const conflicts = getOooConflicts(block, oooPeriods);
        return (
          <div key={block.id} data-block="">
            <PhaseBlockComp
              block={block}
              phaseType={pt}
              zoom={zoom}
              lane={lane}
              oooConflicts={conflicts}
              projectId={project.id}
            />
          </div>
        );
      })}

      {/* Milestones */}
      {milestones.map((ms) => {
        const mt = milestoneTypes.find((m) => m.id === ms.milestoneTypeId);
        return (
          <MilestoneMarker
            key={ms.id}
            milestone={ms}
            milestoneType={mt}
            zoom={zoom}
            rowHeight={height}
          />
        );
      })}

      {/* Deadline marker */}
      {project.deadline && (
        <DeadlineMarker date={project.deadline} zoom={zoom} rowHeight={height} />
      )}
    </div>
  );
}
