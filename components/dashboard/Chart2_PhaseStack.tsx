"use client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import type { PhaseType } from "@/lib/types";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#fff", border: "1px solid #dee1e6", borderRadius: 8, padding: "8px 12px", fontSize: 12, maxWidth: 220 }}>
      <strong style={{ fontSize: 13 }}>{label}</strong>
      {payload.filter((p: any) => p.value > 0).map((p: any) => (
        <div key={p.dataKey} style={{ color: p.fill }}>{p.name}: {p.value} days</div>
      ))}
    </div>
  );
};

export default function Chart2_PhaseStack({ data, phaseTypes }: { data: Record<string, any>[]; phaseTypes: PhaseType[] }) {
  if (!data.length) return <Empty />;
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 0, right: 16, left: -8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f1f3" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#5b616e" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "#a8acb3" }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f5f6f8" }} />
        <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
        {phaseTypes.map((pt) => (
          <Bar key={pt.id} dataKey={pt.name} stackId="a" fill={pt.color} radius={[0, 0, 0, 0]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

function Empty() {
  return <div style={{ height: 280, display: "flex", alignItems: "center", justifyContent: "center", color: "#a8acb3", fontSize: 13 }}>No data</div>;
}
