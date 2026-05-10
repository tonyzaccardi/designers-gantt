"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { useGanttContext } from "@/lib/ganttContext";
import HelpModal from "@/components/ui/HelpModal";
import ActivityLogPanel from "@/components/panels/ActivityLogPanel";
import type { ZoomLevel } from "@/lib/types";
import { useToastStore } from "@/lib/toastStore";

const ZOOM_LEVELS: { value: ZoomLevel; label: string }[] = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
];

export default function TopBar() {
  const { zoom, setZoom, designers, domains, phaseTypes, filters, setFilter, undo, redo, undoStack, redoStack } = useStore();
  const { openOooModal, openSettingsModal, openActivityLog } = useGanttContext();
  const { addToast } = useToastStore();
  const [helpOpen, setHelpOpen] = useState(false);

  const canUndo = undoStack.length > 0;
  const canRedo = redoStack.length > 0;

  function scrollToToday() {
    const el = document.getElementById("gantt-scroll-area");
    if (!el) return;
    const today = document.getElementById("today-marker");
    if (!today) return;
    el.scrollLeft = Math.max(0, parseInt(today.style.left || "0", 10) - el.clientWidth / 2);
  }

  return (
    <>
      <header
        className="flex items-center h-14 px-4 gap-3 border-b shrink-0"
        style={{ borderColor: "#dee1e6", background: "#fff" }}
      >
        {/* App name */}
        <span className="font-semibold text-base tracking-tight" style={{ color: "#0a0b0d", minWidth: 130 }}>
          Design Planning
        </span>

        {/* Zoom */}
        <div className="flex items-center gap-1 rounded-lg p-1" style={{ background: "#eef0f3" }}>
          {ZOOM_LEVELS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setZoom(value)}
              className="px-3 py-1 rounded-md text-sm font-medium transition-all"
              style={{
                background: zoom === value ? "#fff" : "transparent",
                color: zoom === value ? "#0a0b0d" : "#5b616e",
                boxShadow: zoom === value ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Today */}
        <button
          onClick={scrollToToday}
          className="px-3 py-1.5 rounded-full text-sm font-medium"
          style={{ background: "#eef0f3", color: "#0a0b0d" }}
        >
          Today
        </button>

        {/* Undo / Redo */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => { undo(); addToast("Undone", "info"); }}
            disabled={!canUndo}
            title="Undo (⌘Z)"
            className="flex items-center justify-center rounded-lg transition-all"
            style={{
              width: 30, height: 30,
              background: canUndo ? "#eef0f3" : "transparent",
              color: canUndo ? "#0a0b0d" : "#c0c4cc",
              cursor: canUndo ? "pointer" : "not-allowed",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 5h5a4 4 0 1 1 0 8H4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 5l2.5-2.5M2 5l2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button
            onClick={() => { redo(); addToast("Redone", "info"); }}
            disabled={!canRedo}
            title="Redo (⌘⇧Z)"
            className="flex items-center justify-center rounded-lg transition-all"
            style={{
              width: 30, height: 30,
              background: canRedo ? "#eef0f3" : "transparent",
              color: canRedo ? "#0a0b0d" : "#c0c4cc",
              cursor: canRedo ? "pointer" : "not-allowed",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M12 5H7a4 4 0 1 0 0 8h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 5l-2.5-2.5M12 5l-2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        <div className="flex-1" />

        {/* Filters */}
        <div className="flex items-center gap-2">
          <Select value={filters.designerId ?? ""} onChange={(v) => setFilter("designerId", v || null)}>
            <option value="">All designers</option>
            {designers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </Select>
          <Select value={filters.domainId ?? ""} onChange={(v) => setFilter("domainId", v || null)}>
            <option value="">All domains</option>
            {domains.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </Select>
          <Select value={filters.phaseTypeId ?? ""} onChange={(v) => setFilter("phaseTypeId", v || null)}>
            <option value="">All phases</option>
            {phaseTypes.map((p) => <option key={p.id} value={p.id}>{p.emoji} {p.name}</option>)}
          </Select>
        </div>

        {/* OOO + Settings + Help */}
        <div className="flex items-center gap-2">
          <button
            onClick={openOooModal}
            className="px-3 py-1.5 rounded-full text-sm font-medium"
            style={{ background: "#eef0f3", color: "#0a0b0d" }}
            title="Manage out-of-office"
          >
            OOO
          </button>

          <IconBtn onClick={openSettingsModal} title="Settings">
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <path d="M7.5 9.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M12.4 8.6a5 5 0 0 0 .1-.6 5 5 0 0 0-.1-.6l1.3-1a.3.3 0 0 0 .1-.4l-1.3-2.2a.3.3 0 0 0-.4-.1l-1.5.6a4.8 4.8 0 0 0-1-.6L9.4 2a.3.3 0 0 0-.3-.3H6.9A.3.3 0 0 0 6.6 2l-.2 1.7a4.8 4.8 0 0 0-1 .6l-1.5-.6a.3.3 0 0 0-.4.1L2.2 6a.3.3 0 0 0 .1.4l1.3 1a5 5 0 0 0-.1.6 5 5 0 0 0 .1.6l-1.3 1a.3.3 0 0 0-.1.4l1.3 2.2a.3.3 0 0 0 .4.1l1.5-.6c.3.2.6.4 1 .6l.2 1.7c.1.2.2.3.4.3h2.5c.2 0 .3-.1.4-.3l.2-1.7c.4-.2.7-.4 1-.6l1.5.6c.2.1.3 0 .4-.1l1.3-2.2a.3.3 0 0 0-.1-.4l-1.3-1Z" stroke="currentColor" strokeWidth="1.2"/>
            </svg>
          </IconBtn>

          <IconBtn onClick={openActivityLog} title="Activity log">
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <circle cx="7.5" cy="7.5" r="6" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M7.5 4.5V7.5l2 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </IconBtn>

          <IconBtn onClick={() => setHelpOpen(true)} title="Help & shortcuts (?)">
            <span style={{ fontSize: 13, fontWeight: 700 }}>?</span>
          </IconBtn>
        </div>
      </header>

      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
      <ActivityLogPanel />
    </>
  );
}

function Select({ value, onChange, children }: { value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="text-sm rounded-full py-1.5 px-3 border-0 outline-none cursor-pointer"
      style={{ background: "#eef0f3", color: "#0a0b0d", fontFamily: "inherit" }}
    >
      {children}
    </select>
  );
}

function IconBtn({ onClick, title, children }: { onClick: () => void; title?: string; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="flex items-center justify-center rounded-full transition-all"
      style={{ width: 32, height: 32, background: "#eef0f3", color: "#5b616e" }}
    >
      {children}
    </button>
  );
}
