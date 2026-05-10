"use client";

import { useState, useEffect, useCallback } from "react";
import { useGanttContext } from "@/lib/ganttContext";
import { fetchActivityLog, fetchMoreActivityLog } from "@/lib/firestore";
import type { ActivityLogEntry } from "@/lib/types";
import type { QueryDocumentSnapshot } from "firebase/firestore";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ENTITY_ICON: Record<string, string> = {
  project: "📁",
  phase: "🧩",
  milestone: "📍",
  ooo: "🏖️",
  phaseType: "⚙️",
  milestoneType: "⚙️",
};

const ACTION_VERB: Record<string, string> = {
  created: "created",
  updated: "updated",
  deleted: "deleted",
  moved: "moved",
  reordered: "reordered",
};

function relativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);

  if (diffSec < 60) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;

  const fmt = (d: Date) =>
    d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  const entryDay = new Date(date); entryDay.setHours(0, 0, 0, 0);

  if (entryDay.getTime() === today.getTime()) return `Today at ${fmt(date)}`;
  if (entryDay.getTime() === yesterday.getTime()) return `Yesterday at ${fmt(date)}`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" }) + ` at ${fmt(date)}`;
}

function dayKey(date: Date): string {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  const entryDay = new Date(date); entryDay.setHours(0, 0, 0, 0);

  if (entryDay.getTime() === today.getTime()) return "Today";
  if (entryDay.getTime() === yesterday.getTime()) return "Yesterday";
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function groupByDay(entries: ActivityLogEntry[]): { label: string; entries: ActivityLogEntry[] }[] {
  const groups: { label: string; entries: ActivityLogEntry[] }[] = [];
  const seen = new Map<string, number>();
  for (const entry of entries) {
    const label = dayKey(entry.timestamp);
    if (!seen.has(label)) {
      seen.set(label, groups.length);
      groups.push({ label, entries: [] });
    }
    groups[seen.get(label)!].entries.push(entry);
  }
  return groups;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ActivityLogPanel() {
  const { activityLogOpen, closeActivityLog } = useGanttContext();
  const [entries, setEntries] = useState<ActivityLogEntry[]>([]);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { entries: e, lastDoc: ld } = await fetchActivityLog(50);
      setEntries(e);
      setLastDoc(ld);
      setHasMore(e.length === 50 && ld !== null);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (activityLogOpen) load();
  }, [activityLogOpen, load]);

  // Escape key close
  useEffect(() => {
    if (!activityLogOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") closeActivityLog(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [activityLogOpen, closeActivityLog]);

  async function loadMore() {
    if (!lastDoc) return;
    setLoadingMore(true);
    try {
      const { entries: more, lastDoc: ld } = await fetchMoreActivityLog(lastDoc, 50);
      setEntries((prev) => [...prev, ...more]);
      setLastDoc(ld);
      setHasMore(more.length === 50 && ld !== null);
    } catch { /* silent */ }
    finally { setLoadingMore(false); }
  }

  if (!activityLogOpen) return null;

  const groups = groupByDay(entries);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-30"
        style={{ background: "transparent" }}
        onClick={closeActivityLog}
      />

      {/* Panel */}
      <aside
        className="fixed top-0 right-0 bottom-0 z-40 flex flex-col"
        style={{
          width: 380,
          background: "#fff",
          borderLeft: "1px solid #dee1e6",
          boxShadow: "-4px 0 24px rgba(0,0,0,0.08)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b shrink-0"
          style={{ borderColor: "#dee1e6" }}
        >
          <span className="font-semibold text-sm" style={{ color: "#0a0b0d" }}>
            Activity Log
          </span>
          <button
            onClick={closeActivityLog}
            className="flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
            style={{ width: 28, height: 28, color: "#5b616e" }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto" style={{ padding: "16px 0" }}>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <span className="text-sm" style={{ color: "#a8acb3" }}>Loading…</span>
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2">
              <span style={{ fontSize: 28 }}>🕐</span>
              <span className="text-sm" style={{ color: "#a8acb3" }}>No activity yet</span>
            </div>
          ) : (
            <>
              {groups.map((group) => (
                <div key={group.label}>
                  {/* Day header */}
                  <div
                    className="px-5 py-2 text-xs font-semibold uppercase tracking-wide"
                    style={{ color: "#a8acb3" }}
                  >
                    {group.label}
                  </div>

                  {group.entries.map((entry) => (
                    <EntryRow key={entry.id} entry={entry} />
                  ))}
                </div>
              ))}

              {/* Load more */}
              {hasMore && (
                <div className="px-5 pt-3">
                  <button
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="w-full py-2 rounded-lg text-sm font-medium transition-colors"
                    style={{
                      background: "#eef0f3",
                      color: loadingMore ? "#a8acb3" : "#0a0b0d",
                      cursor: loadingMore ? "wait" : "pointer",
                    }}
                  >
                    {loadingMore ? "Loading…" : "Load more"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </aside>
    </>
  );
}

function EntryRow({ entry }: { entry: ActivityLogEntry }) {
  const icon = ENTITY_ICON[entry.entityType] ?? "📝";
  const verb = ACTION_VERB[entry.action] ?? entry.action;

  return (
    <div
      className="px-5 py-3 flex gap-3 hover:bg-gray-50 transition-colors"
      style={{ borderBottom: "1px solid #f3f4f6" }}
    >
      {/* Icon */}
      <div className="shrink-0 mt-0.5" style={{ fontSize: 16, lineHeight: 1 }}>
        {icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm leading-snug" style={{ color: "#0a0b0d" }}>
          <strong>{entry.userName}</strong> {verb}{" "}
          <span style={{ color: "#2d3240" }}>{entry.entityName}</span>
        </p>
        {entry.details && (
          <p className="text-xs mt-0.5 truncate" style={{ color: "#5b616e" }}>
            {entry.details}
          </p>
        )}
        <p className="text-xs mt-1" style={{ color: "#a8acb3" }}>
          {relativeTime(entry.timestamp)}
        </p>
      </div>
    </div>
  );
}
