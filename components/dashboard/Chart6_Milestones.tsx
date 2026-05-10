"use client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

type Row = { name: string; count: number; [key: string]: string | number };

const MS_COLORS = ["#0052ff", "#7c3aed", "#db2777", "#059669", "#d97706"];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s: number, p: any) => s + (p.value ?? 0), 0);
  return (
    <div style={{ background: "#fff", border: "1px solid #dee1e6", borderRadius: 8, padding: "8px 12px", fontSize: 12, maxWidth: 220 }}>
      <strong style={{ fontSize: 13 }}>{label}</strong> — {total} milestone{total !== 1 ? "s" : ""}
      {payload.filter((p: any) => p.value > 0).map((p: any) => (
        <div key={p.dataKey} style={{ color: p.fill }}>{p.name}: {p.value}</div>
      ))}
    </div>
  );
};

export default function Chart6_Milestones({ data, typeNames }: { data: Row[]; typeNames: string[] }) {
  if (!data.length) return (
    <div style={{ height: 260, display: "flex", alignItems: "center", justifyContent: "center", color: "#a8acb3", fontSize: 13 }}>No milestones</div>
  );
  return (
    <ResponsiveContainer width="100%" height={Math.max(240, data.length * 36 + 60)}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 24, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f1f3" />
        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: "#a8acb3" }} axisLine={false} tickLine={false} />
        <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#0a0b0d" }} axisLine={false} tickLine={false} width={140} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f5f6f8" }} />
        {typeNames.length > 1 && <Legend wrapperStyle={{ fontSize: 11 }} />}
        {typeNames.map((name, i) => (
          <Bar key={name} dataKey={name} stackId="a" fill={MS_COLORS[i % MS_COLORS.length]} radius={i === typeNames.length - 1 ? [0, 4, 4, 0] : [0, 0, 0, 0]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
