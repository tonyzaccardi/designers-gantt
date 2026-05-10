import {
  differenceInDays,
  parseISO,
  eachWeekOfInterval,
  eachMonthOfInterval,
  endOfMonth,
  format,
  isWithinInterval,
  endOfWeek,
  getYear,
} from "date-fns";
import type { PhaseBlock, ZoomLevel, Domain, Project } from "./types";

export const GANTT_START = new Date(2026, 0, 1); // local midnight — avoids UTC parse offset
export const GANTT_END = new Date("2026-12-31");
export const GANTT_TOTAL_DAYS = 365;
export const SIDEBAR_WIDTH = 280;
export const ROW_HEIGHT_BASE = 40;
export const ROW_LANE_HEIGHT = 36;
export const DOMAIN_HEADER_HEIGHT = 36;
export const EMPTY_DOMAIN_ROW_HEIGHT = 40;
export const TIMELINE_HEADER_HEIGHT = 52; // row1(28) + row2(24)

export const PIXELS_PER_DAY: Record<ZoomLevel, number> = {
  day: 40,
  week: 17,
  month: 6.57,
};

export function dayOffset(dateStr: string, ppd: number): number {
  if (!dateStr) return 0;
  const days = differenceInDays(parseISO(dateStr), GANTT_START);
  if (isNaN(days)) return 0;
  return Math.max(0, days) * ppd;
}

export function blockWidth(startDate: string, endDate: string, ppd: number): number {
  if (!startDate || !endDate) return ppd;
  const days = Math.max(1, differenceInDays(parseISO(endDate), parseISO(startDate)));
  return isNaN(days) ? ppd : days * ppd;
}

export function totalGanttWidth(ppd: number): number {
  return GANTT_TOTAL_DAYS * ppd;
}

// Assign lanes to overlapping phase blocks; returns map of blockId → lane index
export function assignLanes(blocks: PhaseBlock[]): Map<string, number> {
  const sorted = [...blocks].sort((a, b) =>
    a.startDate.localeCompare(b.startDate)
  );
  const laneEnds: string[] = [];
  const result = new Map<string, number>();

  for (const block of sorted) {
    let lane = laneEnds.findIndex((end) => end <= block.startDate);
    if (lane === -1) lane = laneEnds.length;
    laneEnds[lane] = block.endDate;
    result.set(block.id, lane);
  }
  return result;
}

export function rowHeight(blocks: PhaseBlock[]): number {
  if (blocks.length === 0) return ROW_HEIGHT_BASE;
  const laneMap = assignLanes(blocks);
  const maxLane = Math.max(...Array.from(laneMap.values()));
  return ROW_HEIGHT_BASE + maxLane * ROW_LANE_HEIGHT;
}

// ─── Shared layout rows ───────────────────────────────────────────────────────
// Both Sidebar and GanttBody consume this array to guarantee identical row order
// and heights — eliminating scroll-sync drift entirely.

export type LayoutRow =
  | { kind: "domain-header"; domainId: string; name: string }
  | { kind: "project"; projectId: string; height: number; domainId: string }
  | { kind: "empty-domain"; domainId: string };

export function buildLayoutRows(
  domains: Domain[],
  projects: Project[],
  phaseBlocks: PhaseBlock[],
  collapsedDomains: string[],
  filters: { designerId: string | null; domainId: string | null; phaseTypeId: string | null }
): LayoutRow[] {
  const rows: LayoutRow[] = [];
  const sorted = [...domains].sort((a, b) => a.sortOrder - b.sortOrder);

  for (const domain of sorted) {
    if (filters.domainId && domain.id !== filters.domainId) continue;

    rows.push({ kind: "domain-header", domainId: domain.id, name: domain.name });

    if (collapsedDomains.includes(domain.id)) continue;

    const domainProjects = projects
      .filter((p) => {
        if (p.domainId !== domain.id) return false;
        if (filters.designerId && p.designerId !== filters.designerId) return false;
        return true;
      })
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name));

    if (domainProjects.length === 0) {
      rows.push({ kind: "empty-domain", domainId: domain.id });
    } else {
      for (const project of domainProjects) {
        const blocks = phaseBlocks.filter((b) => b.projectId === project.id && (!filters.phaseTypeId || b.phaseTypeId === filters.phaseTypeId));
        rows.push({
          kind: "project",
          projectId: project.id,
          height: rowHeight(blocks),
          domainId: domain.id,
        });
      }
    }
  }

  return rows;
}

export function layoutTotalHeight(rows: LayoutRow[]): number {
  return rows.reduce((sum, row) => {
    if (row.kind === "domain-header") return sum + DOMAIN_HEADER_HEIGHT;
    if (row.kind === "empty-domain") return sum + EMPTY_DOMAIN_ROW_HEIGHT;
    return sum + row.height;
  }, 0);
}

// ─── Timeline helpers ─────────────────────────────────────────────────────────

export function getWeekColumns(ppd: number) {
  const weeks = eachWeekOfInterval(
    { start: GANTT_START, end: GANTT_END },
    { weekStartsOn: 1 }
  );
  const today = new Date();

  return weeks.map((weekStart) => {
    const left = dayOffset(format(weekStart, "yyyy-MM-dd"), ppd);
    const width = 7 * ppd;
    const isCurrentWeek =
      isWithinInterval(today, { start: weekStart, end: endOfWeek(weekStart, { weekStartsOn: 1 }) }) &&
      getYear(today) === 2026;
    return {
      date: weekStart,
      left,
      width,
      label: format(weekStart, "MMM d"),
      isCurrentWeek,
    };
  });
}

export function getMonthBands(ppd: number) {
  const months = eachMonthOfInterval({ start: GANTT_START, end: GANTT_END });
  return months.map((monthStart) => {
    const left = dayOffset(format(monthStart, "yyyy-MM-dd"), ppd);
    const end = endOfMonth(monthStart);
    const endCapped = end > GANTT_END ? GANTT_END : end;
    const days = differenceInDays(endCapped, monthStart) + 1;
    const width = days * ppd;
    return {
      date: monthStart,
      left,
      width,
      label: format(monthStart, "MMMM"),
      shortLabel: format(monthStart, "MMM"),
    };
  });
}

export function getDayColumns(ppd: number) {
  const today = new Date();
  const result = [];
  for (let i = 0; i < GANTT_TOTAL_DAYS; i++) {
    const date = new Date(2026, 0, 1 + i);
    const isToday =
      getYear(today) === 2026 &&
      differenceInDays(today, date) === 0;
    result.push({
      date,
      left: i * ppd,
      width: ppd,
      label: format(date, "EEE d"),
      dayOfWeek: date.getDay(),
      isToday,
    });
  }
  return result;
}

export function getWeekendBands(ppd: number): { left: number; width: number }[] {
  const bands: { left: number; width: number }[] = [];
  for (let i = 0; i < GANTT_TOTAL_DAYS; i++) {
    const date = new Date(2026, 0, 1 + i);
    const dow = date.getDay(); // 0=Sun, 6=Sat
    if (dow === 0 || dow === 6) {
      bands.push({ left: i * ppd, width: ppd });
    }
  }
  return bands;
}

export function todayOffset(ppd: number): number {
  const today = new Date();
  if (getYear(today) !== 2026) return -1;
  return differenceInDays(today, GANTT_START) * ppd;
}
