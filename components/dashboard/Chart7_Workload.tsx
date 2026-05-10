"use client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import type { Designer } from "@/lib/types";
import { DESIGNER_COLORS } from "@/hooks/useDashboardData";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#fff", border: "1px solid #dee1e6", borderRadius: 8, padding: "8px 12px", fontSize: 12 }}>
      <strong style={{ fontSize: 13 }}>Week of {label}</strong>
      {payload.filter((p: any) => p.value > 0).map((p: any) => (
        <div key={p.dataKey} style={{ color: p.stroke }}>{p.name}: {p.value} days</div>
      ))}
    </div>
  );
};

export default function Chart7_Workload({ data, designers }: { data: Record<string, any>[]; designers: Designer[] }) {
  if (!data.length) return <Empty />;
  const ticks = data.filter((_, i) => i % 4 === 0).map((d) => d.week);
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 4, right: 16, left: -8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f1f3" vertical={false} />
        <XAxis dataKey="week" tick={{ fontSize: 10, fill: "#a8acb3" }} axisLine={false} tickLine={false} ticks={ticks} />
        <YAxis tick={{ fontSize: 11, fill: "#a8acb3" }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
        {designers.map((d, i) => (
          <Line
            key={d.id} type="monotone" dataKey={d.name}
            stroke={DESIGNER_COLORS[i % DESIGNER_COLORS.length]}
            strokeWidth={2} dot={false} activeDot={{ r: 4 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

function Empty() {
  return <div style={{ height: 260, display: "flex", alignItems: "center", justifyContent: "center", color: "#a8acb3", fontSize: 13 }}>No data</div>;
}
