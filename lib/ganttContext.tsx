"use client";

import { createContext, useContext, useState, useCallback } from "react";
import { addDays, parseISO, format } from "date-fns";
import { useStore } from "./store";

export type ContextMenuItem =
  | { separator: true }
  | { separator?: false; label: string; onClick: () => void; danger?: boolean };

type PhasePopoverState = {
  mode: "create" | "edit";
  projectId?: string;
  blockId?: string;
  initialDate?: string;
  x: number;
  y: number;
} | null;

type MilestonePopoverState = {
  mode: "create" | "edit";
  projectId?: string;
  milestoneId?: string;
  initialDate?: string;
  x: number;
  y: number;
} | null;

type ContextMenuState = {
  x: number;
  y: number;
  items: ContextMenuItem[];
} | null;

type GanttContextValue = {
  // Project detail panel
  openProjectId: string | null;
  openProject: (id: string) => void;
  closeProject: () => void;

  // Create project modal
  createProjectDomainId: string | null;
  createProjectOpen: boolean;
  openCreateProject: (domainId: string) => void;
  closeCreateProject: () => void;

  // OOO modal
  oooModalOpen: boolean;
  openOooModal: () => void;
  closeOooModal: () => void;

  // Settings modal
  settingsModalOpen: boolean;
  openSettingsModal: () => void;
  closeSettingsModal: () => void;

  // Phase popover (create / edit inline)
  phasePopover: PhasePopoverState;
  openCreatePhase: (projectId: string, date: string, x: number, y: number) => void;
  openEditPhase: (blockId: string, x: number, y: number) => void;
  closePhasePopover: () => void;

  // Milestone popover (create / edit inline)
  milestonePopover: MilestonePopoverState;
  openCreateMilestone: (projectId: string, date: string, x: number, y: number) => void;
  openEditMilestone: (milestoneId: string, x: number, y: number) => void;
  closeMilestonePopover: () => void;

  // Context menu
  contextMenu: ContextMenuState;
  openContextMenu: (x: number, y: number, items: ContextMenuItem[]) => void;
  closeContextMenu: () => void;

  // View toggle
  view: "timeline" | "dashboard";
  setView: (v: "timeline" | "dashboard") => void;

  // Activity log panel
  activityLogOpen: boolean;
  openActivityLog: () => void;
  closeActivityLog: () => void;

  // Multi-select
  selectedBlockIds: string[];
  selectProjectBlocks: (blockIds: string[]) => void;
  clearSelection: () => void;
  isBlockSelected: (id: string) => boolean;

  // Bulk drag (shared across selected blocks)
  bulkDragDeltaDays: number;
  setBulkDragDeltaDays: (days: number) => void;
  commitBulkDrag: (ppd: number) => void;
  cancelBulkDrag: () => void;
};

const GanttContext = createContext<GanttContextValue | null>(null);

export function GanttProvider({ children }: { children: React.ReactNode }) {
  const [openProjectId, setOpenProjectId] = useState<string | null>(null);
  const [createProjectOpen, setCreateProjectOpen] = useState(false);
  const [createProjectDomainId, setCreateProjectDomainId] = useState<string | null>(null);
  const [oooModalOpen, setOooModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [phasePopover, setPhasePopover] = useState<PhasePopoverState>(null);
  const [milestonePopover, setMilestonePopover] = useState<MilestonePopoverState>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState>(null);
  const [selectedBlockIds, setSelectedBlockIds] = useState<string[]>([]);
  const [view, setView] = useState<"timeline" | "dashboard">("timeline");
  const [activityLogOpen, setActivityLogOpen] = useState(false);
  const [bulkDragDeltaDays, setBulkDragDeltaDays] = useState(0);

  const openProject = useCallback((id: string) => setOpenProjectId(id), []);
  const closeProject = useCallback(() => setOpenProjectId(null), []);

  const openActivityLog = useCallback(() => setActivityLogOpen(true), []);
  const closeActivityLog = useCallback(() => setActivityLogOpen(false), []);

  const openCreateProject = useCallback((domainId: string) => {
    setCreateProjectDomainId(domainId);
    setCreateProjectOpen(true);
  }, []);
  const closeCreateProject = useCallback(() => setCreateProjectOpen(false), []);

  const openOooModal = useCallback(() => setOooModalOpen(true), []);
  const closeOooModal = useCallback(() => setOooModalOpen(false), []);

  const openSettingsModal = useCallback(() => setSettingsModalOpen(true), []);
  const closeSettingsModal = useCallback(() => setSettingsModalOpen(false), []);

  const openCreatePhase = useCallback(
    (projectId: string, date: string, x: number, y: number) =>
      setPhasePopover({ mode: "create", projectId, initialDate: date, x, y }),
    []
  );
  const openEditPhase = useCallback(
    (blockId: string, x: number, y: number) =>
      setPhasePopover({ mode: "edit", blockId, x, y }),
    []
  );
  const closePhasePopover = useCallback(() => setPhasePopover(null), []);

  const openCreateMilestone = useCallback(
    (projectId: string, date: string, x: number, y: number) =>
      setMilestonePopover({ mode: "create", projectId, initialDate: date, x, y }),
    []
  );
  const openEditMilestone = useCallback(
    (milestoneId: string, x: number, y: number) =>
      setMilestonePopover({ mode: "edit", milestoneId, x, y }),
    []
  );
  const closeMilestonePopover = useCallback(() => setMilestonePopover(null), []);

  const openContextMenu = useCallback(
    (x: number, y: number, items: ContextMenuItem[]) =>
      setContextMenu({ x, y, items }),
    []
  );
  const closeContextMenu = useCallback(() => setContextMenu(null), []);

  const selectProjectBlocks = useCallback(
    (blockIds: string[]) => setSelectedBlockIds(blockIds),
    []
  );
  const clearSelection = useCallback(() => setSelectedBlockIds([]), []);
  const isBlockSelected = useCallback(
    (id: string) => selectedBlockIds.includes(id),
    [selectedBlockIds]
  );

  const commitBulkDrag = useCallback(
    (ppd: number) => {
      const delta = bulkDragDeltaDays;
      if (delta === 0) return;
      const { phaseBlocks, updatePhaseBlock } = useStore.getState();
      for (const id of selectedBlockIds) {
        const block = phaseBlocks.find((b) => b.id === id);
        if (!block) continue;
        updatePhaseBlock(id, {
          startDate: format(addDays(parseISO(block.startDate), delta), "yyyy-MM-dd"),
          endDate: format(addDays(parseISO(block.endDate), delta), "yyyy-MM-dd"),
        });
      }
      setBulkDragDeltaDays(0);
    },
    [bulkDragDeltaDays, selectedBlockIds]
  );

  const cancelBulkDrag = useCallback(() => setBulkDragDeltaDays(0), []);

  return (
    <GanttContext.Provider
      value={{
        openProjectId,
        openProject,
        closeProject,
        createProjectDomainId,
        createProjectOpen,
        openCreateProject,
        closeCreateProject,
        oooModalOpen,
        openOooModal,
        closeOooModal,
        settingsModalOpen,
        openSettingsModal,
        closeSettingsModal,
        phasePopover,
        openCreatePhase,
        openEditPhase,
        closePhasePopover,
        milestonePopover,
        openCreateMilestone,
        openEditMilestone,
        closeMilestonePopover,
        contextMenu,
        openContextMenu,
        closeContextMenu,
        view,
        setView,
        activityLogOpen,
        openActivityLog,
        closeActivityLog,
        selectedBlockIds,
        selectProjectBlocks,
        clearSelection,
        isBlockSelected,
        bulkDragDeltaDays,
        setBulkDragDeltaDays,
        commitBulkDrag,
        cancelBulkDrag,
      }}
    >
      {children}
    </GanttContext.Provider>
  );
}

export function useGanttContext() {
  const ctx = useContext(GanttContext);
  if (!ctx) throw new Error("useGanttContext must be inside GanttProvider");
  return ctx;
}
