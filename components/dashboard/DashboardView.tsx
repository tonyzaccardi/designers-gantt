"use client";

import { useStore } from "@/lib/store";
import { useDashboardData } from "@/hooks/useDashboardData";
import Chart1_DesignerDays from "./Chart1_DesignerDays";
import Chart2_PhaseStack from "./Chart2_PhaseStack";
import Chart3_Density from "./Chart3_Density";
import Chart4_DomainDonut from "./Chart4_DomainDonut";
import Chart5_SizeDistrib from "./Chart5_SizeDistrib";
import Chart6_Milestones from "./Chart6_Milestones";
import Chart7_Workload from "./Chart7_Workload";

// ── Shared card wrapper ────────────────────────────────────────────────────────

function ChartCard({
  title, subtitle, children, fullWidth = false,
}: {
  title: string; subtitle?: string; children: React.ReactNode; fullWidth?: boolean;
}) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #dee1e6",
        borderRadius: 12,
        padding: 20,
        gridColumn: fullWidth ? "1 / -1" : undefined,
        minWidth: 0,
      }}
    >
      <div style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: "#0a0b0d", margin: 0 }}>{title}</p>
        {subtitle && <p style={{ fontSize: 12, color: "#a8acb3", margin: "4px 0 0" }}>{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
  return (
    <div style={{ background: "#f8f9fb", borderRadius: 10, padding: "14px 18px", minWidth: 0 }}>
      <div style={{ fontSize: 24, fontWeight: 700, color: "#0a0b0d", lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 12, color: "#5b616e", marginTop: 4 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: "#a8acb3", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

// ── Domain legend (for donut) ─────────────────────────────────────────────────

function DomainLegend({ data }: { data: { name: string; count: number; color: string }[] }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 12px", marginTop: 12 }}>
      {data.map((d) => (
        <span key={d.name} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#5b616e" }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: d.color, flexShrink: 0 }} />
          {d.name} ({d.count})
        </span>
      ))}
    </div>
  );
}

// ── Main dashboard ────────────────────────────────────────────────────────────

export default function DashboardView() {
  const { designers, domains, phaseTypes, filters, setFilter } = useStore();
  const data = useDashboardData();

  return (
    <div style={{ flex: 1, overflowY: "auto", background: "#f5f6f8" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "24px 24px 48px" }}>

        {/* Filters */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
          <FilterSelect
            value={filters.designerId ?? ""}
            onChange={(v) => setFilter("designerId", v || null)}
            label="All designers"
            options={designers.map((d) => ({ value: d.id, label: d.name }))}
          />
          <FilterSelect
            value={filters.domainId ?? ""}
            onChange={(v) => setFilter("domainId", v || null)}
            label="All domains"
            options={domains.map((d) => ({ value: d.id, label: d.name }))}
          />
          {(filters.designerId || filters.domainId) && (
            <button
              onClick={() => { setFilter("designerId", null); setFilter("domainId", null); }}
              style={{ fontSize: 12, color: "#0052ff", background: "none", border: "none", cursor: "pointer", padding: "0 4px" }}
            >
              Clear filters ×
            </button>
          )}
        </div>

        {/* Summary stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 24 }}>
          <StatCard label="Total projects" value={data.summary.totalProjects} />
          <StatCard label="Active projects" value={data.summary.activeProjects} />
          <StatCard label="Planned days" value={data.summary.totalPlannedDays.toLocaleString()} sub="working days" />
          <StatCard label="Designers" value={data.summary.designerCount} />
          <StatCard label="Upcoming milestones" value={data.summary.upcomingMilestones} sub="next 30 days" />
        </div>

        {/* Charts grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

          <ChartCard title="Days per designer" subtitle="Total planned working days across all phases" fullWidth>
            <Chart1_DesignerDays data={data.chart1} />
          </ChartCard>

          <ChartCard title="Phase types per designer" subtitle="Working days broken down by phase type">
            <Chart2_PhaseStack data={data.chart2} phaseTypes={data.phaseTypes} />
          </ChartCard>

          <ChartCard title="Timeline density" subtitle="Concurrent active phases per week by designer">
            <Chart3_Density data={data.chart3} designers={data.designers} />
          </ChartCard>

          <ChartCard title="Projects by domain" subtitle="Click a segment to filter">
            <Chart4_DomainDonut data={data.chart4} />
            <DomainLegend data={data.chart4} />
          </ChartCard>

          <ChartCard title="Project size distribution" subtitle="Count of projects by T-shirt size">
            <Chart5_SizeDistrib data={data.chart5} />
          </ChartCard>

          <ChartCard title="Milestones per project" subtitle="Projects with at least one milestone">
            <Chart6_Milestones data={data.chart6} typeNames={data.milestoneTypeNames} />
          </ChartCard>

          <ChartCard title="Designer workload over time" subtitle="Active working days per week per designer" fullWidth>
            <Chart7_Workload data={data.chart7} designers={data.designers} />
          </ChartCard>

        </div>
      </div>
    </div>
  );
}

function FilterSelect({
  value, onChange, label, options,
}: {
  value: string; onChange: (v: string) => void; label: string; options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        fontSize: 13, padding: "6px 10px", borderRadius: 8,
        border: "1px solid #dee1e6", background: "#fff",
        color: "#0a0b0d", outline: "none", cursor: "pointer",
      }}
    >
      <option value="">{label}</option>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}
