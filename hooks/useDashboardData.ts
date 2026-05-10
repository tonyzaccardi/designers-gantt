import { useMemo } from "react";
import { useStore } from "@/lib/store";
import { parseISO, addDays, eachWeekOfInterval, endOfWeek, format } from "date-fns";
import { GANTT_START, GANTT_END } from "@/lib/ganttUtils";

export const DESIGNER_COLORS = [
  "#0052ff", "#7c3aed", "#db2777", "#059669",
  "#d97706", "#dc2626", "#0891b2", "#84cc16",
];
export const DOMAIN_COLORS = [
  "#3b82f6", "#8b5cf6", "#ec4899", "#10b981",
  "#f59e0b", "#ef4444", "#06b6d4", "#84cc16", "#f97316",
];

function workDays(start: Date, end: Date): number {
  if (end < start) return 0;
  let count = 0;
  let d = new Date(start);
  while (d <= end) {
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) count++;
    d = addDays(d, 1);
  }
  return count;
}

export function useDashboardData() {
  const { projects, phaseBlocks, milestones, designers, domains, phaseTypes, milestoneTypes, filters } = useStore();

  return useMemo(() => {
    // ── Apply filters ─────────────────────────────────────────────────────────
    const filteredProjects = projects.filter((p) => {
      if (filters.designerId && p.designerId !== filters.designerId) return false;
      if (filters.domainId && p.domainId !== filters.domainId) return false;
      return true;
    });
    const filteredIds = new Set(filteredProjects.map((p) => p.id));
    const filteredPhases = phaseBlocks.filter(
      (b) => filteredIds.has(b.projectId) && (!filters.phaseTypeId || b.phaseTypeId === filters.phaseTypeId)
    );
    const filteredMilestones = milestones.filter((m) => filteredIds.has(m.projectId));

    // ── Lookup maps ───────────────────────────────────────────────────────────
    const projectMap = new Map(projects.map((p) => [p.id, p]));
    const designerMap = new Map(designers.map((d) => [d.id, d]));
    const phaseTypeMap = new Map(phaseTypes.map((pt) => [pt.id, pt]));
    const milestoneTypeMap = new Map(milestoneTypes.map((mt) => [mt.id, mt]));

    // ── Summary stats ─────────────────────────────────────────────────────────
    const today = new Date();
    const in30 = addDays(today, 30);
    const totalPlannedDays = filteredPhases.reduce((sum, b) => {
      try { return sum + workDays(parseISO(b.startDate), parseISO(b.endDate)); } catch { return sum; }
    }, 0);
    const upcomingMilestones = filteredMilestones.filter((m) => {
      try { const d = parseISO(m.date); return d >= today && d <= in30; } catch { return false; }
    }).length;

    // ── Chart 1: designer total days ─────────────────────────────────────────
    const designerDays = new Map<string, { days: number; projects: Set<string> }>();
    for (const b of filteredPhases) {
      const proj = projectMap.get(b.projectId);
      if (!proj) continue;
      const entry = designerDays.get(proj.designerId) ?? { days: 0, projects: new Set() };
      try { entry.days += workDays(parseISO(b.startDate), parseISO(b.endDate)); } catch { /* skip */ }
      entry.projects.add(proj.id);
      designerDays.set(proj.designerId, entry);
    }
    const chart1 = designers
      .filter((d) => designerDays.has(d.id))
      .map((d, _i) => {
        const idx = designers.findIndex((x) => x.id === d.id);
        const entry = designerDays.get(d.id)!;
        return { name: d.name, days: entry.days, projectCount: entry.projects.size, color: DESIGNER_COLORS[idx % DESIGNER_COLORS.length] };
      })
      .sort((a, b) => b.days - a.days);

    // ── Chart 2: phase type stacked per designer ──────────────────────────────
    const chart2Map = new Map<string, Record<string, number>>();
    for (const d of designers) chart2Map.set(d.name, {});
    for (const b of filteredPhases) {
      const proj = projectMap.get(b.projectId);
      const des = proj ? designerMap.get(proj.designerId) : null;
      const pt = phaseTypeMap.get(b.phaseTypeId);
      if (!des || !pt) continue;
      try {
        const days = workDays(parseISO(b.startDate), parseISO(b.endDate));
        const row = chart2Map.get(des.name) ?? {};
        row[pt.name] = (row[pt.name] ?? 0) + days;
        chart2Map.set(des.name, row);
      } catch { /* skip */ }
    }
    const chart2 = designers
      .filter((d) => Object.values(chart2Map.get(d.name) ?? {}).some((v) => v > 0))
      .map((d) => ({ name: d.name.split(" ")[0], ...chart2Map.get(d.name) }));

    // ── Charts 3 & 7: per-week data ───────────────────────────────────────────
    const weeks = eachWeekOfInterval({ start: GANTT_START, end: GANTT_END }, { weekStartsOn: 1 });

    const chart3: Record<string, number | string>[] = [];
    const chart7: Record<string, number | string>[] = [];

    for (const weekStart of weeks) {
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
      const weekLabel = format(weekStart, "MMM d");

      // Chart 3: concurrent phases
      const c3row: Record<string, number | string> = { week: weekLabel };
      let total = 0;
      for (const d of designers) {
        const count = filteredPhases.filter((b) => {
          const proj = projectMap.get(b.projectId);
          if (proj?.designerId !== d.id) return false;
          try {
            return parseISO(b.startDate) <= weekEnd && parseISO(b.endDate) >= weekStart;
          } catch { return false; }
        }).length;
        c3row[d.name] = count;
        total += count;
      }
      c3row.total = total;
      chart3.push(c3row);

      // Chart 7: workload days per designer
      const c7row: Record<string, number | string> = { week: weekLabel };
      for (const d of designers) {
        const idx = designers.findIndex((x) => x.id === d.id);
        let totalDays = 0;
        for (const b of filteredPhases) {
          const proj = projectMap.get(b.projectId);
          if (proj?.designerId !== d.id) continue;
          try {
            const phStart = parseISO(b.startDate);
            const phEnd = parseISO(b.endDate);
            const ovStart = phStart > weekStart ? phStart : weekStart;
            const ovEnd = phEnd < weekEnd ? phEnd : weekEnd;
            if (ovStart <= ovEnd) totalDays += workDays(ovStart, ovEnd);
          } catch { /* skip */ }
        }
        c7row[d.name] = totalDays;
        c7row[`color_${d.name}`] = DESIGNER_COLORS[idx % DESIGNER_COLORS.length];
      }
      chart7.push(c7row);
    }

    // ── Chart 4: domain donut ─────────────────────────────────────────────────
    const domainCount = new Map<string, number>();
    for (const p of filteredProjects) domainCount.set(p.domainId, (domainCount.get(p.domainId) ?? 0) + 1);
    const chart4 = domains
      .filter((d) => domainCount.has(d.id))
      .map((d, i) => ({ id: d.id, name: d.name, count: domainCount.get(d.id)!, color: DOMAIN_COLORS[i % DOMAIN_COLORS.length] }))
      .sort((a, b) => b.count - a.count);

    // ── Chart 5: size distribution ────────────────────────────────────────────
    const sizeCounts: Record<string, number> = { S: 0, M: 0, L: 0, XL: 0, TBD: 0 };
    for (const p of filteredProjects) sizeCounts[p.size] = (sizeCounts[p.size] ?? 0) + 1;
    const chart5 = (["S", "M", "L", "XL", "TBD"] as const).map((size) => ({ size, count: sizeCounts[size] }));

    // ── Chart 6: milestones per project ───────────────────────────────────────
    const msPerProject = new Map<string, Record<string, number>>();
    for (const m of filteredMilestones) {
      const typeName = m.customLabel ?? milestoneTypeMap.get(m.milestoneTypeId ?? "")?.name ?? "Other";
      const row = msPerProject.get(m.projectId) ?? {};
      row[typeName] = (row[typeName] ?? 0) + 1;
      msPerProject.set(m.projectId, row);
    }
    const chart6 = [...msPerProject.entries()]
      .map(([pid, byType]) => {
        const proj = projectMap.get(pid);
        const total = Object.values(byType).reduce((s, v) => s + v, 0);
        return { name: proj?.name ?? pid, count: total, ...byType };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);

    // ── Milestone type names for Chart 6 ─────────────────────────────────────
    const milestoneTypeNames = [...new Set(
      filteredMilestones.map((m) => m.customLabel ?? milestoneTypeMap.get(m.milestoneTypeId ?? "")?.name ?? "Other")
    )];

    return {
      summary: {
        totalProjects: filteredProjects.length,
        activeProjects: filteredProjects.filter((p) => p.status === "active").length,
        totalPlannedDays,
        designerCount: designers.length,
        upcomingMilestones,
      },
      chart1, chart2, chart3, chart4, chart5, chart6, chart7,
      milestoneTypeNames,
      designers, phaseTypes, domains,
    };
  }, [projects, phaseBlocks, milestones, designers, domains, phaseTypes, milestoneTypes, filters]);
}
