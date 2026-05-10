"use client";

import { useRef, useMemo, useCallback, useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { useToastStore } from "@/lib/toastStore";
import {
  buildLayoutRows,
  todayOffset,
  PIXELS_PER_DAY,
  SIDEBAR_WIDTH,
  totalGanttWidth,
} from "@/lib/ganttUtils";
import { GanttProvider, useGanttContext } from "@/lib/ganttContext";
import { subscribeToAll } from "@/lib/firestore";
import TopBar from "@/components/TopBar";
import Sidebar from "@/components/Sidebar";
import GanttArea from "@/components/gantt/GanttArea";
import CreateProjectModal from "@/components/modals/CreateProjectModal";
import OooModal from "@/components/modals/OooModal";
import SettingsModal from "@/components/modals/SettingsModal";
import ProjectDetailPanel from "@/components/panels/ProjectDetailPanel";
import PhasePopover from "@/components/gantt/PhasePopover";
import MilestonePopover from "@/components/gantt/MilestonePopover";
import ContextMenuComp from "@/components/ui/ContextMenu";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import ToastContainer from "@/components/ui/ToastContainer";

function AppContent() {
  // Single ref for the one scroll container (handles both X and Y)
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevZoomRef = useRef<string | null>(null);

  const {
    domains, projects, phaseBlocks, collapsedDomains, filters,
    zoom, setZoom, undo, redo, deletePhaseBlocks,
    sampleDataDismissed, dismissSampleData,
    seedToFirestore,
    firestoreReady, setFirestoreReady,
    setProjects, setPhaseBlocks, setMilestones, setOooPeriods,
    setPhaseTypes, setMilestoneTypes, setDesigners, setDomains,
  } = useStore();

  // ── Wire Firestore real-time listener ──────────────────────────────────────
  useEffect(() => {
    const unsub = subscribeToAll({
      setProjects, setPhaseBlocks, setMilestones, setOooPeriods,
      setPhaseTypes, setMilestoneTypes, setDesigners, setDomains,
    });
    // Mark ready after first tick — listeners fire synchronously with initial data
    const t = setTimeout(() => setFirestoreReady(true), 500);
    return () => { unsub(); clearTimeout(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const { addToast } = useToastStore();
  const {
    clearSelection, selectedBlockIds, closeProject,
    oooModalOpen, settingsModalOpen, phasePopover, openCreateProject,
  } = useGanttContext();

  const [deleteSelectedConfirm, setDeleteSelectedConfirm] = useState(false);
  const [pendingDeleteIds, setPendingDeleteIds] = useState<string[]>([]);

  // Single source of truth for row layout — passed to both Sidebar and GanttArea
  const layoutRows = useMemo(
    () => buildLayoutRows(domains, projects, phaseBlocks, collapsedDomains, filters),
    [domains, projects, phaseBlocks, collapsedDomains, filters]
  );

  // Total gantt width (changes with zoom) — determines inner div width
  const ppd = PIXELS_PER_DAY[zoom];
  const ganttWidth = totalGanttWidth(ppd);

  // Preserve center date on zoom change
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    if (prevZoomRef.current && prevZoomRef.current !== zoom) {
      const oldPpd = PIXELS_PER_DAY[prevZoomRef.current as keyof typeof PIXELS_PER_DAY];
      const centerX = el.scrollLeft + el.clientWidth / 2;
      const centerDays = centerX / oldPpd;
      const newScrollLeft = centerDays * ppd - el.clientWidth / 2;
      el.scrollLeft = Math.max(0, newScrollLeft);
    }

    prevZoomRef.current = zoom;
  }, [zoom, ppd]);

  // Initial scroll to today
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const offset = todayOffset(ppd);
    if (offset >= 0) el.scrollLeft = Math.max(0, offset - el.clientWidth / 3);
    prevZoomRef.current = zoom;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Global keyboard shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      const inInput = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
      const meta = e.metaKey || e.ctrlKey;

      if (e.key === "Escape") { clearSelection(); closeProject(); return; }
      if (meta && e.shiftKey && e.key === "z") { e.preventDefault(); redo(); addToast("Redone", "info"); return; }
      if (meta && e.key === "z") { e.preventDefault(); undo(); addToast("Undone", "info"); return; }

      if (inInput) return;

      if ((e.key === "Delete" || e.key === "Backspace") && selectedBlockIds.length > 0) {
        e.preventDefault();
        setPendingDeleteIds([...selectedBlockIds]);
        setDeleteSelectedConfirm(true);
        return;
      }

      if (e.key === "t" || e.key === "T") {
        const el = scrollRef.current;
        if (!el) return;
        const offset = todayOffset(ppd);
        if (offset >= 0) el.scrollLeft = Math.max(0, offset - el.clientWidth / 3);
        return;
      }

      if (e.key === "1") { setZoom("day"); return; }
      if (e.key === "2") { setZoom("week"); return; }
      if (e.key === "3") { setZoom("month"); return; }

      if ((e.key === "n" || e.key === "N") && !oooModalOpen && !settingsModalOpen && !phasePopover) {
        openCreateProject(projects[0]?.domainId ?? "");
        return;
      }
    }

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [clearSelection, closeProject, undo, redo, selectedBlockIds, zoom, setZoom,
      oooModalOpen, settingsModalOpen, phasePopover, openCreateProject, projects, ppd]);

  function handleDeleteSelected() {
    deletePhaseBlocks(pendingDeleteIds);
    addToast(`Deleted ${pendingDeleteIds.length} phase${pendingDeleteIds.length > 1 ? "s" : ""}`, "info");
    clearSelection();
    setDeleteSelectedConfirm(false);
    setPendingDeleteIds([]);
  }

  return (
    <div className="flex flex-col h-full overflow-hidden relative" style={{ background: "#fff" }}>
      <TopBar />

      {/* Firestore loading overlay */}
      {!firestoreReady && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center"
          style={{ background: "rgba(255,255,255,0.85)" }}>
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-4 border-blue-200 border-t-blue-500 animate-spin" />
            <p className="text-sm font-medium" style={{ color: "#5b616e" }}>Connecting to database…</p>
          </div>
        </div>
      )}

      {!sampleDataDismissed && (
        <div
          className="flex items-center justify-between px-4 py-2 text-sm shrink-0"
          style={{ background: "#fffbeb", borderBottom: "1px solid #fde68a", color: "#92400e" }}
        >
          <span>Sample data — feel free to delete it and add your real projects.</span>
          <div className="flex items-center gap-2 ml-4 shrink-0">
            <button
              onClick={async () => { await seedToFirestore(); dismissSampleData(); }}
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: "#f59e0b", color: "#fff" }}
            >
              Seed to Firestore
            </button>
            <button
              onClick={dismissSampleData}
              className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: "#fde68a", color: "#92400e" }}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/*
        SINGLE scroll container — both sidebar and gantt scroll together vertically.
        Sidebar is position:sticky left:0 so it stays visible on horizontal scroll.
        No scroll sync needed — zero drift possible.
      */}
      <div className="flex-1 overflow-hidden relative flex">
        <div
          ref={scrollRef} id="gantt-scroll-area"
          style={{ flex: 1, overflow: "auto" }}
        >
          {/* Inner row: sidebar (sticky left) + gantt content */}
          <div style={{ display: "flex", minWidth: SIDEBAR_WIDTH + ganttWidth }}>
            <Sidebar layoutRows={layoutRows} />
            <GanttArea layoutRows={layoutRows} />
          </div>
        </div>
        <ProjectDetailPanel />
      </div>

      <CreateProjectModal />
      <OooModal />
      <SettingsModal />
      <PhasePopover />
      <MilestonePopover />
      <ContextMenuComp />

      <ConfirmDialog
        open={deleteSelectedConfirm}
        title={`Delete ${pendingDeleteIds.length} phase${pendingDeleteIds.length > 1 ? "s" : ""}?`}
        message="Selected phase blocks will be permanently deleted."
        onConfirm={handleDeleteSelected}
        onCancel={() => { setDeleteSelectedConfirm(false); setPendingDeleteIds([]); }}
      />

      <ToastContainer />
    </div>
  );
}

export default function Home() {
  return (
    <GanttProvider>
      <AppContent />
    </GanttProvider>
  );
}
