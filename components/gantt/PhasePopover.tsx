"use client";

import { useEffect, useRef, useState } from "react";
import { addDays, format, parseISO } from "date-fns";
import { useStore } from "@/lib/store";
import { useGanttContext } from "@/lib/ganttContext";
import { useClickOutside } from "@/hooks/useClickOutside";
import { useEscapeKey } from "@/hooks/useEscapeKey";

const FIELD = "w-full px-2 py-1.5 rounded-lg text-sm border outline-none";
const FS = { borderColor: "#dee1e6", color: "#0a0b0d", background: "#fff" };

export default function PhasePopover() {
  const { phasePopover, closePhasePopover } = useGanttContext();
  const { phaseTypes, phaseBlocks, addPhaseBlock, updatePhaseBlock } = useStore();

  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, closePhasePopover, !!phasePopover);
  useEscapeKey(closePhasePopover, !!phasePopover);

  const existingBlock = phasePopover?.mode === "edit" && phasePopover.blockId
    ? phaseBlocks.find((b) => b.id === phasePopover.blockId)
    : null;

  const defaultStart = existingBlock?.startDate ?? phasePopover?.initialDate ?? format(new Date(), "yyyy-MM-dd");
  const defaultEnd = existingBlock?.endDate ?? format(addDays(parseISO(defaultStart), 7), "yyyy-MM-dd");

  const [form, setForm] = useState({
    phaseTypeId: existingBlock?.phaseTypeId ?? "",
    startDate: defaultStart,
    endDate: defaultEnd,
    note: existingBlock?.note ?? "",
  });

  // Reset form when popover changes
  useEffect(() => {
    if (!phasePopover) return;
    if (phasePopover.mode === "edit" && existingBlock) {
      setForm({
        phaseTypeId: existingBlock.phaseTypeId,
        startDate: existingBlock.startDate,
        endDate: existingBlock.endDate,
        note: existingBlock.note ?? "",
      });
    } else {
      const start = phasePopover.initialDate ?? format(new Date(), "yyyy-MM-dd");
      setForm({
        phaseTypeId: "",
        startDate: start,
        endDate: format(addDays(parseISO(start), 7), "yyyy-MM-dd"),
        note: "",
      });
    }
  }, [phasePopover?.mode, phasePopover?.blockId, phasePopover?.initialDate]);

  if (!phasePopover) return null;

  const sortedTypes = [...phaseTypes].sort((a, b) => a.sortOrder - b.sortOrder);

  // Position: clamp to viewport
  const W = 280, H = 220;
  const left = Math.min(phasePopover.x, window.innerWidth - W - 8);
  const top = phasePopover.y + H > window.innerHeight ? phasePopover.y - H : phasePopover.y + 8;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.phaseTypeId || !form.startDate || !form.endDate) return;

    if (phasePopover!.mode === "create" && phasePopover!.projectId) {
      addPhaseBlock({
        projectId: phasePopover!.projectId,
        phaseTypeId: form.phaseTypeId,
        startDate: form.startDate,
        endDate: form.endDate,
        note: form.note || undefined,
        sortOrder: 0,
      });
    } else if (phasePopover!.mode === "edit" && phasePopover!.blockId) {
      updatePhaseBlock(phasePopover!.blockId, {
        phaseTypeId: form.phaseTypeId,
        startDate: form.startDate,
        endDate: form.endDate,
        note: form.note || undefined,
      });
    }
    closePhasePopover();
  }

  return (
    <div
      ref={ref}
      className="fixed z-[60] rounded-xl shadow-2xl p-4 flex flex-col gap-3"
      style={{
        left,
        top,
        width: W,
        background: "#fff",
        border: "1px solid #dee1e6",
      }}
    >
      <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#7c828a" }}>
        {phasePopover.mode === "create" ? "New phase" : "Edit phase"}
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <select className={FIELD} style={FS} value={form.phaseTypeId} required
          onChange={(e) => setForm((f) => ({ ...f, phaseTypeId: e.target.value }))}>
          <option value="">Phase type…</option>
          {sortedTypes.map((pt) => (
            <option key={pt.id} value={pt.id}>{pt.emoji} {pt.name}</option>
          ))}
        </select>

        <div className="grid grid-cols-2 gap-2">
          <input type="date" className={FIELD} style={FS} value={form.startDate} required
            onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} />
          <input type="date" className={FIELD} style={FS} value={form.endDate} required
            onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} />
        </div>

        <input className={FIELD} style={FS} placeholder="Note (optional)"
          value={form.note}
          onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} />

        <div className="flex gap-2 pt-1">
          <button type="submit"
            className="flex-1 py-1.5 rounded-full text-sm font-medium"
            style={{ background: "#0052ff", color: "#fff" }}>
            {phasePopover.mode === "create" ? "Create" : "Save"}
          </button>
          <button type="button" onClick={closePhasePopover}
            className="px-3 py-1.5 rounded-full text-sm"
            style={{ background: "#eef0f3", color: "#5b616e" }}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
