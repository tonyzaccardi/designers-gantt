"use client";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { useStore } from "@/lib/store";

type Row = { id: string; name: string; count: number; color: string };

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as Row;
  return (
    <div style={{ background: "#fff", border: "1px solid #dee1e6", borderRadius: 8, padding: "8px 12px", fontSize: 13 }}>
      <strong>{d.name}</strong> — {d.count} project{d.count !== 1 ? "s" : ""}
    </div>
  );
};

export default function Chart4_DomainDonut({ data }: { data: Row[] }) {
  const { setFilter } = useStore();
  const total = data.reduce((s, d) => s + d.count, 0);
  if (!data.length) return <Empty />;

  return (
    <div style={{ position: "relative", height: 260 }}>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={data} cx="50%" cy="50%" innerRadius={72} outerRadius={108}
            dataKey="count" nameKey="name" paddingAngle={2}
            onClick={(d: any) => setFilter("domainId", d.id)}
            style={{ cursor: "pointer" }}
          >
            {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      {/* Center label */}
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center", pointerEvents: "none" }}>
        <div style={{ fontSize: 28, fontWeight: 700, color: "#0a0b0d", lineHeight: 1 }}>{total}</div>
        <div style={{ fontSize: 11, color: "#a8acb3", marginTop: 2 }}>projects</div>
      </div>
    </div>
  );
}

function Empty() {
  return <div style={{ height: 260, display: "flex", alignItems: "center", justifyContent: "center", color: "#a8acb3", fontSize: 13 }}>No data</div>;
}
