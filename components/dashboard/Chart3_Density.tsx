"use client";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { Designer } from "@/lib/types";
import { DESIGNER_COLORS } from "@/hooks/useDashboardData";

const CustomTooltip = ({ active, payload, label, designers }: any) => {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s: number, p: any) => s + (p.value ?? 0), 0);
  return (
    <div style={{ background: "#fff", border: "1px solid #dee1e6", borderRadius: 8, padding: "8px 12px", fontSize: 12 }}>
      <strong style={{ fontSize: 13 }}>Week of {label}</strong> — {total} active phases
      {payload.filter((p: any) => p.value > 0).map((p: any) => (
        <div key={p.dataKey} style={{ color: p.stroke }}>{p.name}: {p.value}</div>
      ))}
    </div>
  );
};

export default function Chart3_Density({ data, designers }: { data: Record<string, any>[]; designers: Designer[] }) {
  if (!data.length) return <Empty />;
  // Only show every 4th week label to avoid crowding
  const ticks = data.filter((_,i) => i % 4 === 0).map(d => d.week);
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 4, right: 16, left: -8, bottom: 0 }}>
        <defs>
          {designers.map((d, i) => (
            <linearGradient key={d.id} id={`grad3_${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={DESIGNER_COLORS[i % DESIGNER_COLORS.length]} stopOpacity={0.3} />
              <stop offset="95%" stopColor={DESIGNER_COLORS[i % DESIGNER_COLORS.length]} stopOpacity={0.05} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f1f3" vertical={false} />
        <XAxis dataKey="week" tick={{ fontSize: 10, fill: "#a8acb3" }} axisLine={false} tickLine={false} ticks={ticks} />
        <YAxis tick={{ fontSize: 11, fill: "#a8acb3" }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip content={<CustomTooltip designers={designers} />} />
        {designers.map((d, i) => (
          <Area
            key={d.id} type="monotone" dataKey={d.name} stackId="1"
            stroke={DESIGNER_COLORS[i % DESIGNER_COLORS.length]}
            fill={`url(#grad3_${i})`}
            strokeWidth={1.5}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}

function Empty() {
  return <div style={{ height: 260, display: "flex", alignItems: "center", justifyContent: "center", color: "#a8acb3", fontSize: 13 }}>No data</div>;
}
