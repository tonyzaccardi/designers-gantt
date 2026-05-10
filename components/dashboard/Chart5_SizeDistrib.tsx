"use client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

type Row = { size: string; count: number };

const SIZE_COLORS: Record<string, string> = { S: "#a7f3d0", M: "#93c5fd", L: "#c4b5fd", XL: "#f9a8d4", TBD: "#fde68a" };

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as Row;
  return (
    <div style={{ background: "#fff", border: "1px solid #dee1e6", borderRadius: 8, padding: "8px 12px", fontSize: 13 }}>
      <strong>{d.size}</strong> — {d.count} project{d.count !== 1 ? "s" : ""}
    </div>
  );
};

export default function Chart5_SizeDistrib({ data }: { data: Row[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 4, right: 16, left: -8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f1f3" vertical={false} />
        <XAxis dataKey="size" tick={{ fontSize: 13, fill: "#0a0b0d" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "#a8acb3" }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f5f6f8" }} />
        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
          {data.map((entry, i) => <Cell key={i} fill={SIZE_COLORS[entry.size] ?? "#dee1e6"} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
