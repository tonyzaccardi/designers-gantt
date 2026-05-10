"use client";

import { useEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { useGanttContext } from "@/lib/ganttContext";
import { useToastStore } from "@/lib/toastStore";
import { useClickOutside } from "@/hooks/useClickOutside";
import { useEscapeKey } from "@/hooks/useEscapeKey";

const FIELD = "w-full px-2 py-1.5 rounded-lg text-sm border outline-none";
const FS = { borderColor: "#dee1e6", color: "#0a0b0d", background: "#fff" };

export default function MilestonePopover() {
  const { milestonePopover, closeMilestonePopover } = useGanttContext();
  const { milestoneTypes, milestones, addMilestone, updateMilestone } = useStore();
  const { addToast } = useToastStore();

  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, closeMilestonePopover, !!milestonePopover);
  useEscapeKey(closeMilestonePopover, !!milestonePopover);

  const existingMs =
    milestonePopover?.mode === "edit" && milestonePopover.milestoneId
      ? milestones.find((m) => m.id === milestonePopover.milestoneId)
      : null;

  const [form, setForm] = useState({
    milestoneTypeId: existingMs?.milestoneTypeId ?? "",
    customLabel: existingMs?.customLabel ?? "",
    date: existingMs?.date ?? milestonePopover?.initialDate ?? "",
    note: existingMs?.note ?? "",
  });

  // Reset form whenever popover opens/changes target
  useEffect(() => {
    if (!milestonePopover) return;
    if (milestonePopover.mode === "edit" && existingMs) {
      setForm({
        milestoneTypeId: existingMs.milestoneTypeId ?? "",
        customLabel: existingMs.customLabel ?? "",
        date: existingMs.date,
        note: existingMs.note ?? "",
      });
    } else {
      setForm({
        milestoneTypeId: milestoneTypes[0]?.id ?? "",
        customLabel: "",
        date: milestonePopover.initialDate ?? "",
        note: "",
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [milestonePopover?.mode, milestonePopover?.milestoneId, milestonePopover?.initialDate]);

  if (!milestonePopover) return null;

  const sortedTypes = [...milestoneTypes].sort((a, b) => a.name.localeCompare(b.name));

  const W = 272, H = 240;
  const left = Math.min(milestonePopover.x, (typeof window !== "undefined" ? window.innerWidth : 1200) - W - 8);
  const top =
    milestonePopover.y + H > (typeof window !== "undefined" ? window.innerHeight : 800)
      ? milestonePopover.y - H
      : milestonePopover.y + 8;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.date) return;

    if (milestonePopover!.mode === "create" && milestonePopover!.projectId) {
      addMilestone({
        projectId: milestonePopover!.projectId,
        milestoneTypeId: form.milestoneTypeId || undefined,
        customLabel: form.customLabel.trim() || undefined,
        date: form.date,
        note: form.note.trim() || undefined,
      });
      addToast("Milestone added", "success");
    } else if (milestonePopover!.mode === "edit" && milestonePopover!.milestoneId) {
      updateMilestone(milestonePopover!.milestoneId, {
        milestoneTypeId: form.milestoneTypeId || undefined,
        customLabel: form.customLabel.trim() || undefined,
        date: form.date,
        note: form.note.trim() || undefined,
      });
      addToast("Milestone updated", "success");
    }
    closeMilestonePopover();
  }

  return (
    <div
      ref={ref}
      className="fixed z-[60] rounded-xl shadow-2xl p-4 flex flex-col gap-3"
      style={{ left, top, width: W, background: "#fff", border: "1px solid #dee1e6" }}
    >
      <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#7c828a" }}>
        {milestonePopover.mode === "create" ? "New milestone" : "Edit milestone"}
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        {/* Date */}
        <input
          type="date"
          className={FIELD}
          style={FS}
          value={form.date}
          required
          onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
        />

        {/* Type dropdown */}
        <select
          className={FIELD}
          style={FS}
          value={form.milestoneTypeId}
          onChange={(e) => setForm((f) => ({ ...f, milestoneTypeId: e.target.value }))}
        >
          <option value="">No type</option>
          {sortedTypes.map((mt) => (
            <option key={mt.id} value={mt.id}>{mt.icon ? `${mt.icon} ${mt.name}` : mt.name}</option>
          ))}
        </select>

        {/* Custom label */}
        <input
          className={FIELD}
          style={FS}
          placeholder="Custom label (optional)"
          value={form.customLabel}
          onChange={(e) => setForm((f) => ({ ...f, customLabel: e.target.value }))}
        />

        {/* Note */}
        <input
          className={FIELD}
          style={FS}
          placeholder="Note (optional)"
          value={form.note}
          onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
        />

        <div className="flex gap-2 pt-1">
          <button
            type="submit"
            className="flex-1 py-1.5 rounded-full text-sm font-medium"
            style={{ background: "#0052ff", color: "#fff" }}
          >
            {milestonePopover.mode === "create" ? "Create" : "Save"}
          </button>
          <button
            type="button"
            onClick={closeMilestonePopover}
            className="px-3 py-1.5 rounded-full text-sm"
            style={{ background: "#eef0f3", color: "#5b616e" }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
