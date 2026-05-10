"use client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useStore } from "@/lib/store";

type Row = { name: string; days: number; projectCount: number; color: string };

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as Row;
  return (
    <div style={{ background: "#fff", border: "1px solid #dee1e6", borderRadius: 8, padding: "8px 12px", fontSize: 13 }}>
      <strong>{d.name}</strong> — {d.days} days across {d.projectCount} project{d.projectCount !== 1 ? "s" : ""}
    </div>
  );
};

export default function Chart1_DesignerDays({ data }: { data: Row[] }) {
  const { setFilter } = useStore();
  const { designers } = useStore();

  if (!data.length) return <Empty />;

  return (
    <ResponsiveContainer width="100%" height={Math.max(220, data.length * 44 + 40)}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 24, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f1f3" />
        <XAxis type="number" tick={{ fontSize: 12, fill: "#5b616e" }} axisLine={false} tickLine={false} />
        <YAxis type="category" dataKey="name" tick={{ fontSize: 13, fill: "#0a0b0d" }} axisLine={false} tickLine={false} width={100} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f5f6f8" }} />
        <Bar dataKey="days" radius={[0, 4, 4, 0]} onClick={(d: any) => {
          const des = designers.find((x) => x.name === d.name);
          if (des) setFilter("designerId", des.id);
        }} style={{ cursor: "pointer" }}>
          {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function Empty() {
  return <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: "#a8acb3", fontSize: 13 }}>No data</div>;
}
