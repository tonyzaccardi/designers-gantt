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
import DashboardView from "@/components/dashboard/DashboardView";
import { SEED_DESIGNERS } from "@/lib/seed";
import { setCurrentUser, getSavedDesignerId } from "@/lib/currentUser";
import { getDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Designer } from "@/lib/types";

const PASSWORD = "sweepdesignteam";

function PasswordGate({ children }: { children: React.ReactNode }) {
  const [unlocked, setUnlocked] = useState(false);
  const [checked, setChecked] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);
  const [designers, setDesigners] = useState<Designer[]>(SEED_DESIGNERS);
  const [designerId, setDesignerId] = useState("");

  useEffect(() => {
    // Load designers from Firestore (fallback to seed)
    getDoc(doc(db, "config", "designers"))
      .then((snap) => { if (snap.exists()) setDesigners((snap.data().items ?? []) as Designer[]); })
      .catch(() => {});

    // Restore saved designer
    const savedId = getSavedDesignerId();
    if (savedId) setDesignerId(savedId);

    if (sessionStorage.getItem("gantt_auth") === "1") setUnlocked(true);
    setChecked(true);
  }, []);

  function tryUnlock() {
    if (input !== PASSWORD) { setError(true); return; }
    if (!designerId) { setError(true); return; }
    const des = designers.find((d) => d.id === designerId);
    if (des) setCurrentUser(des.id, des.name);
    sessionStorage.setItem("gantt_auth", "1");
    setUnlocked(true);
  }

  if (!checked) return null;
  if (unlocked) return <>{children}</>;

  const noDesigner = !designerId;

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#f5f6f8" }}>
      <div style={{ background: "#fff", borderRadius: 16, padding: 32, width: 320, boxShadow: "0 4px 24px rgba(0,0,0,0.10)", display: "flex", flexDirection: "column", gap: 14 }}>
        <p style={{ fontWeight: 600, fontSize: 16, color: "#0a0b0d", margin: 0 }}>Design Team Gantt</p>

        {/* Designer picker */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontSize: 12, fontWeight: 500, color: "#5b616e" }}>Who are you?</label>
          <select
            value={designerId}
            onChange={(e) => setDesignerId(e.target.value)}
            style={{ padding: "8px 10px", borderRadius: 8, border: (error && noDesigner) ? "1.5px solid #ef4444" : "1.5px solid #dee1e6", fontSize: 14, outline: "none", background: "#fff", color: designerId ? "#0a0b0d" : "#a8acb3" }}
          >
            <option value="" disabled>Select your name…</option>
            {designers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>

        {/* Password */}
        <input
          type="password"
          placeholder="Password"
          value={input}
          autoFocus
          style={{ padding: "8px 12px", borderRadius: 8, border: (error && input !== PASSWORD) ? "1.5px solid #ef4444" : "1.5px solid #dee1e6", fontSize: 14, outline: "none" }}
          onChange={(e) => { setInput(e.target.value); setError(false); }}
          onKeyDown={(e) => { if (e.key === "Enter") tryUnlock(); }}
        />

        {error && (
          <p style={{ color: "#ef4444", fontSize: 13, margin: 0 }}>
            {noDesigner ? "Please select your name" : "Incorrect password"}
          </p>
        )}

        <button
          style={{ background: "#0052ff", color: "#fff", border: "none", borderRadius: 8, padding: "9px 0", fontWeight: 600, fontSize: 14, cursor: "pointer" }}
          onClick={tryUnlock}
        >
          Enter
        </button>
      </div>
    </div>
  );
}

function AppContent() {
  // Single ref for the one scroll container (handles both X and Y)
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevZoomRef = useRef<string | null>(null);

  const {
    domains, projects, phaseBlocks, collapsedDomains, filters,
    zoom, setZoom, undo, redo, deletePhaseBlocks,
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
    view,
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

      <div className="flex-1 overflow-hidden relative flex">
        {view === "dashboard" ? (
          <DashboardView />
        ) : (
          <>
            <div
              ref={scrollRef} id="gantt-scroll-area"
              style={{ flex: 1, overflow: "auto" }}
            >
              <div style={{ display: "flex", minWidth: SIDEBAR_WIDTH + ganttWidth }}>
                <Sidebar layoutRows={layoutRows} />
                <GanttArea layoutRows={layoutRows} />
              </div>
            </div>
            <ProjectDetailPanel />
          </>
        )}
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
    <PasswordGate>
      <GanttProvider>
        <AppContent />
      </GanttProvider>
    </PasswordGate>
  );
}
