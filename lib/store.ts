"use client";

import { create } from "zustand";
import type {
  Designer,
  Domain,
  PhaseType,
  MilestoneType,
  Project,
  PhaseBlock,
  Milestone,
  OooPeriod,
  ZoomLevel,
} from "./types";
import {
  SEED_DESIGNERS,
  SEED_DOMAINS,
  SEED_PHASE_TYPES,
  SEED_MILESTONE_TYPES,
  SEED_PROJECTS,
  SEED_PHASE_BLOCKS,
  SEED_MILESTONES,
  SEED_OOO_PERIODS,
  DOMAIN_DEFAULT_DESIGNER,
} from "./seed";
import {
  fsCreateProject, fsUpdateProject, fsDeleteProject,
  fsCreatePhase,   fsUpdatePhase,   fsDeletePhase,
  fsCreateMilestone, fsUpdateMilestone, fsDeleteMilestone,
  fsCreateOoo,     fsUpdateOoo,     fsDeleteOoo,
  fsUpdatePhaseTypes, fsUpdateMilestoneTypes, fsUpdateDesigners, fsUpdateDomains, batchUpdateProjects, logActivity,
  seedFirestore,
} from "./firestore";

export type FilterState = {
  designerId: string | null;
  domainId: string | null;
  phaseTypeId: string | null;
};

type DataSnapshot = {
  designers: Designer[];
  domains: Domain[];
  phaseTypes: PhaseType[];
  milestoneTypes: MilestoneType[];
  projects: Project[];
  phaseBlocks: PhaseBlock[];
  milestones: Milestone[];
  oooPeriods: OooPeriod[];
};

function captureSnapshot(s: StoreState): DataSnapshot {
  return {
    designers: s.designers, domains: s.domains,
    phaseTypes: s.phaseTypes, milestoneTypes: s.milestoneTypes,
    projects: s.projects, phaseBlocks: s.phaseBlocks,
    milestones: s.milestones, oooPeriods: s.oooPeriods,
  };
}

const MAX_UNDO = 20;

// ─── Firestore error handler (imported lazily to avoid circular deps) ─────────
function showError(msg: string) {
  // Lazy-import to avoid circular dep at module level
  import("./toastStore").then(({ useToastStore }) => {
    useToastStore.getState().addToast(msg, "error");
  });
}

// ─── Helpers for undo/redo Firestore sync ─────────────────────────────────────
async function syncArrayDiff<T extends { id: string }>(
  next: T[],
  current: T[],
  create: (v: T) => Promise<void>,
  update: (id: string, data: Partial<T>) => Promise<void>,
  remove: (id: string) => Promise<void>
) {
  const currentMap = new Map(current.map((v) => [v.id, v]));
  const nextMap    = new Map(next.map((v) => [v.id, v]));
  const ops: Promise<void>[] = [];
  for (const [id] of currentMap) {
    if (!nextMap.has(id)) ops.push(remove(id));
  }
  for (const [id, v] of nextMap) {
    if (!currentMap.has(id)) ops.push(create(v));
    else if (JSON.stringify(v) !== JSON.stringify(currentMap.get(id))) ops.push(update(id, v as Partial<T>));
  }
  await Promise.all(ops);
}

async function syncSnapshotToFirestore(next: DataSnapshot, current: DataSnapshot) {
  await Promise.all([
    // Config arrays — write whole array if changed
    next.phaseTypes     !== current.phaseTypes     ? fsUpdatePhaseTypes(next.phaseTypes)         : Promise.resolve(),
    next.milestoneTypes !== current.milestoneTypes ? fsUpdateMilestoneTypes(next.milestoneTypes)  : Promise.resolve(),
    next.designers      !== current.designers      ? fsUpdateDesigners(next.designers)            : Promise.resolve(),
    next.domains        !== current.domains        ? fsUpdateDomains(next.domains)                : Promise.resolve(),
    // Row-level entities — diff
    syncArrayDiff(next.projects,    current.projects,    fsCreateProject,   fsUpdateProject,   fsDeleteProject),
    syncArrayDiff(next.phaseBlocks, current.phaseBlocks, fsCreatePhase,     fsUpdatePhase,     fsDeletePhase),
    syncArrayDiff(next.milestones,  current.milestones,  fsCreateMilestone, fsUpdateMilestone, fsDeleteMilestone),
    syncArrayDiff(next.oooPeriods,  current.oooPeriods,  fsCreateOoo,       fsUpdateOoo,       fsDeleteOoo),
  ]);
}


// ─── Activity log helpers ─────────────────────────────────────────────────────

function fmtDate(d: string | undefined): string {
  if (!d) return "";
  try { return new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }); }
  catch { return d; }
}

function describeProjectPatch(patch: Partial<Project>, proj: Project, s: { domains: Domain[]; designers: Designer[] }): string {
  const parts: string[] = [];
  if (patch.domainId && patch.domainId !== proj.domainId) {
    const tgt = s.domains.find((d) => d.id === patch.domainId);
    parts.push(`Moved to ${tgt?.name ?? "new domain"}`);
  }
  if (patch.status && patch.status !== proj.status) parts.push(`Status: ${proj.status} → ${patch.status}`);
  if (patch.name && patch.name !== proj.name) parts.push(`Renamed to "${patch.name}"`);
  if (patch.designerId && patch.designerId !== proj.designerId) {
    const des = s.designers.find((d) => d.id === patch.designerId);
    parts.push(`Designer: ${des?.name ?? "changed"}`);
  }
  if (patch.size && patch.size !== proj.size) parts.push(`Size: ${proj.size} → ${patch.size}`);
  if (patch.deadline && patch.deadline !== proj.deadline) parts.push(`Deadline: ${fmtDate(patch.deadline)}`);
  return parts.join(", ") || "Updated";
}

type StoreState = {
  // Firestore sync status
  firestoreReady: boolean;
  setFirestoreReady: (v: boolean) => void;

  // Raw setters — called by subscribeToAll() when Firestore pushes data
  setProjects:      (v: Project[])       => void;
  setPhaseBlocks:   (v: PhaseBlock[])    => void;
  setMilestones:    (v: Milestone[])     => void;
  setOooPeriods:    (v: OooPeriod[])     => void;
  setPhaseTypes:    (v: PhaseType[])     => void;
  setMilestoneTypes:(v: MilestoneType[]) => void;
  setDesigners:     (v: Designer[])      => void;
  setDomains:       (v: Domain[])        => void;

  // Data
  designers: Designer[];
  domains: Domain[];
  phaseTypes: PhaseType[];
  milestoneTypes: MilestoneType[];
  projects: Project[];
  phaseBlocks: PhaseBlock[];
  milestones: Milestone[];
  oooPeriods: OooPeriod[];

  // Undo/redo
  undoStack: DataSnapshot[];
  redoStack: DataSnapshot[];
  undo: () => void;
  redo: () => void;

  // UI state
  zoom: ZoomLevel;
  collapsedDomains: string[];
  filters: FilterState;
  sampleDataDismissed: boolean;

  // UI actions
  setZoom: (zoom: ZoomLevel) => void;
  toggleDomain: (domainId: string) => void;
  setFilter: (key: keyof FilterState, value: string | null) => void;
  dismissSampleData: () => void;

  // Designer CRUD
  addDesigner: (d: Omit<Designer, "id">) => void;
  updateDesigner: (id: string, patch: Partial<Designer>) => void;
  deleteDesigner: (id: string) => void;

  // Domain CRUD
  addDomain: (d: Omit<Domain, "id">) => void;
  updateDomain: (id: string, patch: Partial<Domain>) => void;
  deleteDomain: (id: string) => void;

  // PhaseType CRUD
  addPhaseType: (p: Omit<PhaseType, "id">) => void;
  updatePhaseType: (id: string, patch: Partial<PhaseType>) => void;
  deletePhaseType: (id: string) => void;

  // MilestoneType CRUD
  addMilestoneType: (m: Omit<MilestoneType, "id">) => void;
  updateMilestoneType: (id: string, patch: Partial<MilestoneType>) => void;
  deleteMilestoneType: (id: string) => void;

  // Project CRUD
  addProject: (p: Omit<Project, "id" | "createdAt">) => void;
  updateProject: (id: string, patch: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  reorderProjects: (updates: { id: string; domainId: string; sortOrder: number }[]) => void;

  // PhaseBlock CRUD
  addPhaseBlock: (b: Omit<PhaseBlock, "id">) => void;
  updatePhaseBlock: (id: string, patch: Partial<PhaseBlock>) => void;
  deletePhaseBlock: (id: string) => void;
  deletePhaseBlocks: (ids: string[]) => void;

  // Milestone CRUD
  addMilestone: (m: Omit<Milestone, "id">) => void;
  updateMilestone: (id: string, patch: Partial<Milestone>) => void;
  deleteMilestone: (id: string) => void;

  // OOO CRUD
  addOooPeriod: (o: Omit<OooPeriod, "id">) => void;
  updateOooPeriod: (id: string, patch: Partial<OooPeriod>) => void;
  deleteOooPeriod: (id: string) => void;

  // Import / Export / Seed
  exportData: () => string;
  importData: (json: string) => { ok: boolean; error?: string };
  resetToSeed: () => void;
  seedToFirestore: () => Promise<void>;
};

// ─── Optimistic helper ────────────────────────────────────────────────────────
// Applies local state immediately, fires Firestore async, reverts on error.
function optimistic<T>(
  get: () => StoreState,
  set: (s: Partial<StoreState> | ((s: StoreState) => Partial<StoreState>)) => void,
  localUpdate: (s: StoreState) => Partial<StoreState>,
  fsOp: () => Promise<void>,
  errorMsg = "Sync error — change reverted"
) {
  const before = captureSnapshot(get());
  const snapshot = before; // for undo
  const next = localUpdate(get());
  set((s) => ({
    ...next,
    undoStack: [...s.undoStack.slice(-(MAX_UNDO - 1)), before],
    redoStack: [],
  }));
  fsOp().catch(() => {
    // Revert
    set(snapshot);
    showError(errorMsg);
  });
}

function validateImport(data: unknown): data is DataSnapshot {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  return (
    Array.isArray(d.designers) && Array.isArray(d.domains) &&
    Array.isArray(d.phaseTypes) && Array.isArray(d.milestoneTypes) &&
    Array.isArray(d.projects) && Array.isArray(d.phaseBlocks) &&
    Array.isArray(d.milestones) && Array.isArray(d.oooPeriods)
  );
}

export const useStore = create<StoreState>()((set, get) => ({
  // ── Firestore sync status ──────────────────────────────────────────────────
  firestoreReady: false,
  setFirestoreReady: (v) => set({ firestoreReady: v }),

  // ── Raw setters (called by subscribeToAll) ─────────────────────────────────
  setProjects:       (projects)       => set({ projects }),
  setPhaseBlocks:    (phaseBlocks)    => set({ phaseBlocks }),
  setMilestones:     (milestones)     => set({ milestones }),
  setOooPeriods:     (oooPeriods)     => set({ oooPeriods }),
  setPhaseTypes:     (phaseTypes)     => set({ phaseTypes }),
  setMilestoneTypes: (milestoneTypes) => set({ milestoneTypes }),
  setDesigners:      (designers)      => set({ designers }),
  setDomains:        (domains)        => set({ domains }),

  // ── Initial data (shown while Firestore loads) ─────────────────────────────
  designers:      SEED_DESIGNERS,
  domains:        SEED_DOMAINS,
  phaseTypes:     SEED_PHASE_TYPES,
  milestoneTypes: SEED_MILESTONE_TYPES,
  projects:       [],
  phaseBlocks:    [],
  milestones:     [],
  oooPeriods:     [],

  // ── Undo/redo ──────────────────────────────────────────────────────────────
  undoStack: [],
  redoStack: [],

  undo: () => {
    const s = get();
    if (s.undoStack.length === 0) return;
    const snap = s.undoStack[s.undoStack.length - 1];
    const current = captureSnapshot(s);
    set({
      ...snap,
      undoStack: s.undoStack.slice(0, -1),
      redoStack: [...s.redoStack.slice(-(MAX_UNDO - 1)), current],
    });
    syncSnapshotToFirestore(snap, current).catch(() =>
      showError("Undo sync failed — reload to resync")
    );
  },

  redo: () => {
    const s = get();
    if (s.redoStack.length === 0) return;
    const snap = s.redoStack[s.redoStack.length - 1];
    const current = captureSnapshot(s);
    set({
      ...snap,
      redoStack: s.redoStack.slice(0, -1),
      undoStack: [...s.undoStack.slice(-(MAX_UNDO - 1)), current],
    });
    syncSnapshotToFirestore(snap, current).catch(() =>
      showError("Redo sync failed — reload to resync")
    );
  },

  // ── UI state ───────────────────────────────────────────────────────────────
  zoom: "week",
  collapsedDomains: [],
  filters: { designerId: null, domainId: null, phaseTypeId: null },
  sampleDataDismissed: false,

  setZoom: (zoom) => set({ zoom }),
  toggleDomain: (domainId) =>
    set((s) => ({
      collapsedDomains: s.collapsedDomains.includes(domainId)
        ? s.collapsedDomains.filter((id) => id !== domainId)
        : [...s.collapsedDomains, domainId],
    })),
  setFilter: (key, value) =>
    set((s) => ({ filters: { ...s.filters, [key]: value } })),
  dismissSampleData: () => set({ sampleDataDismissed: true }),

  // ── Designer ───────────────────────────────────────────────────────────────
  addDesigner: (d) => {
    const item = { ...d, id: crypto.randomUUID() };
    optimistic(get, set,
      (s) => ({ designers: [...s.designers, item] }),
      () => { const next = [...get().designers, item]; return fsUpdateDesigners(next); }
    );
  },
  updateDesigner: (id, patch) =>
    optimistic(get, set,
      (s) => ({ designers: s.designers.map((d) => d.id === id ? { ...d, ...patch } : d) }),
      () => fsUpdateDesigners(get().designers)
    ),
  deleteDesigner: (id) =>
    optimistic(get, set,
      (s) => ({ designers: s.designers.filter((d) => d.id !== id) }),
      () => fsUpdateDesigners(get().designers)
    ),

  // ── Domain ─────────────────────────────────────────────────────────────────
  addDomain: (d) => {
    const item = { ...d, id: crypto.randomUUID() };
    optimistic(get, set,
      (s) => ({ domains: [...s.domains, item] }),
      () => fsUpdateDomains(get().domains)
    );
  },
  updateDomain: (id, patch) =>
    optimistic(get, set,
      (s) => ({ domains: s.domains.map((d) => d.id === id ? { ...d, ...patch } : d) }),
      () => fsUpdateDomains(get().domains)
    ),
  deleteDomain: (id) =>
    optimistic(get, set,
      (s) => ({ domains: s.domains.filter((d) => d.id !== id) }),
      () => fsUpdateDomains(get().domains)
    ),

  // ── PhaseType ──────────────────────────────────────────────────────────────
  addPhaseType: (p) => {
    const item = { ...p, id: crypto.randomUUID() };
    logActivity({ action: "created", entityType: "phaseType", entityName: item.name, details: "", userName: "Anthony" });
    optimistic(get, set,
      (s) => ({ phaseTypes: [...s.phaseTypes, item] }),
      () => fsUpdatePhaseTypes(get().phaseTypes)
    );
  },
  updatePhaseType: (id, patch) => {
    const _lpt = get().phaseTypes.find((p) => p.id === id);
    if (_lpt) logActivity({ action: "updated", entityType: "phaseType", entityName: _lpt.name, details: "", userName: "Anthony" });
    optimistic(get, set,
      (s) => ({ phaseTypes: s.phaseTypes.map((p) => p.id === id ? { ...p, ...patch } : p) }),
      () => fsUpdatePhaseTypes(get().phaseTypes)
    );
  },
  deletePhaseType: (id) => {
    const _lpt = get().phaseTypes.find((p) => p.id === id);
    if (_lpt) logActivity({ action: "deleted", entityType: "phaseType", entityName: _lpt.name, details: "", userName: "Anthony" });
    optimistic(get, set,
      (s) => ({ phaseTypes: s.phaseTypes.filter((p) => p.id !== id) }),
      () => fsUpdatePhaseTypes(get().phaseTypes)
    );
  },

  // ── MilestoneType ──────────────────────────────────────────────────────────
  addMilestoneType: (m) => {
    const item = { ...m, id: crypto.randomUUID() };
    logActivity({ action: "created", entityType: "milestoneType", entityName: item.name, details: "", userName: "Anthony" });
    optimistic(get, set,
      (s) => ({ milestoneTypes: [...s.milestoneTypes, item] }),
      () => fsUpdateMilestoneTypes(get().milestoneTypes)
    );
  },
  updateMilestoneType: (id, patch) => {
    const _lmt = get().milestoneTypes.find((m) => m.id === id);
    if (_lmt) logActivity({ action: "updated", entityType: "milestoneType", entityName: _lmt.name, details: "", userName: "Anthony" });
    optimistic(get, set,
      (s) => ({ milestoneTypes: s.milestoneTypes.map((m) => m.id === id ? { ...m, ...patch } : m) }),
      () => fsUpdateMilestoneTypes(get().milestoneTypes)
    );
  },
  deleteMilestoneType: (id) => {
    const _lmt = get().milestoneTypes.find((m) => m.id === id);
    if (_lmt) logActivity({ action: "deleted", entityType: "milestoneType", entityName: _lmt.name, details: "", userName: "Anthony" });
    optimistic(get, set,
      (s) => ({ milestoneTypes: s.milestoneTypes.filter((m) => m.id !== id) }),
      () => fsUpdateMilestoneTypes(get().milestoneTypes)
    );
  },

  // ── Project ────────────────────────────────────────────────────────────────
  addProject: (p) => {
    const item: Project = { ...p, id: crypto.randomUUID(), createdAt: new Date().toISOString().split("T")[0] };
    logActivity({ action: "created", entityType: "project", entityName: item.name, details: "", userName: "Anthony" });
    optimistic(get, set,
      (s) => ({ projects: [...s.projects, item] }),
      () => fsCreateProject(item)
    );
  },
  updateProject: (id, patch) => {
    const _lp = get().projects.find((p) => p.id === id);
    if (_lp) logActivity({ action: "updated", entityType: "project", entityName: _lp.name, details: describeProjectPatch(patch, _lp, get()), userName: "Anthony" });
    optimistic(get, set,
      (s) => ({ projects: s.projects.map((p) => p.id === id ? { ...p, ...patch } : p) }),
      () => fsUpdateProject(id, patch)
    );
  },
  deleteProject: (id) => {
    const _lp = get().projects.find((p) => p.id === id);
    if (_lp) logActivity({ action: "deleted", entityType: "project", entityName: _lp.name, details: "", userName: "Anthony" });
    optimistic(get, set,
      (s) => ({
        projects:    s.projects.filter((p) => p.id !== id),
        phaseBlocks: s.phaseBlocks.filter((b) => b.projectId !== id),
        milestones:  s.milestones.filter((m) => m.projectId !== id),
      }),
      async () => {
        const s = get();
        // Cascade deletes in parallel
        const orphanBlocks = s.phaseBlocks.filter((b) => b.projectId === id).map((b) => fsDeletePhase(b.id));
        const orphanMs     = s.milestones.filter((m) => m.projectId === id).map((m) => fsDeleteMilestone(m.id));
        await Promise.all([fsDeleteProject(id), ...orphanBlocks, ...orphanMs]);
      }
    );
  },

  reorderProjects: (updates) => {
    const _rrp = get().projects.find((p) => p.id === updates[0]?.id);
    const _srcDom = get().domains.find((d) => d.id === _rrp?.domainId);
    const _tgtDom = get().domains.find((d) => d.id === updates[0]?.domainId);
    const _cross = _srcDom?.id !== _tgtDom?.id;
    if (_rrp) logActivity({ action: "reordered", entityType: "project", entityName: _rrp.name, details: _cross ? `Moved to ${_tgtDom?.name ?? ""}` : "Position changed", userName: "Anthony" });
    set((s) => ({
      projects: s.projects.map((p) => {
        const u = updates.find((x) => x.id === p.id);
        return u ? { ...p, domainId: u.domainId, sortOrder: u.sortOrder } : p;
      }),
    }));
    batchUpdateProjects(updates.map(({ id, domainId, sortOrder }) => ({
      id, data: { domainId, sortOrder },
    }))).catch(() => {});
  },

  // ── PhaseBlock ─────────────────────────────────────────────────────────────
  addPhaseBlock: (b) => {
    const item: PhaseBlock = { ...b, id: crypto.randomUUID() };
    const _lbp = get().projects.find((p) => p.id === item.projectId);
    const _lbpt = get().phaseTypes.find((pt) => pt.id === item.phaseTypeId);
    logActivity({ action: "created", entityType: "phase", entityName: `${_lbpt?.emoji ?? ""} ${_lbpt?.name ?? "Phase"} — ${_lbp?.name ?? ""}`, details: `${fmtDate(item.startDate)} → ${fmtDate(item.endDate)}`, userName: "Anthony" });
    optimistic(get, set,
      (s) => ({ phaseBlocks: [...s.phaseBlocks, item] }),
      () => fsCreatePhase(item)
    );
  },
  updatePhaseBlock: (id, patch) => {
    const _lb = get().phaseBlocks.find((b) => b.id === id);
    const _lbp = get().projects.find((p) => p.id === _lb?.projectId);
    const _lbpt = get().phaseTypes.find((pt) => pt.id === _lb?.phaseTypeId);
    const _lbAction = (patch.startDate || patch.endDate) ? "moved" : "updated" as const;
    const _lbDetails = (patch.startDate || patch.endDate) ? `${fmtDate(patch.startDate ?? _lb?.startDate)} → ${fmtDate(patch.endDate ?? _lb?.endDate)}` : "";
    if (_lb) logActivity({ action: _lbAction, entityType: "phase", entityName: `${_lbpt?.emoji ?? ""} ${_lbpt?.name ?? "Phase"} — ${_lbp?.name ?? ""}`, details: _lbDetails, userName: "Anthony" });
    optimistic(get, set,
      (s) => ({ phaseBlocks: s.phaseBlocks.map((b) => b.id === id ? { ...b, ...patch } : b) }),
      () => fsUpdatePhase(id, patch)
    );
  },
  deletePhaseBlock: (id) => {
    const _lb = get().phaseBlocks.find((b) => b.id === id);
    const _lbp = get().projects.find((p) => p.id === _lb?.projectId);
    const _lbpt = get().phaseTypes.find((pt) => pt.id === _lb?.phaseTypeId);
    if (_lb) logActivity({ action: "deleted", entityType: "phase", entityName: `${_lbpt?.emoji ?? ""} ${_lbpt?.name ?? "Phase"} — ${_lbp?.name ?? ""}`, details: "", userName: "Anthony" });
    optimistic(get, set,
      (s) => ({ phaseBlocks: s.phaseBlocks.filter((b) => b.id !== id) }),
      () => fsDeletePhase(id)
    );
  },
  deletePhaseBlocks: (ids) => {
    logActivity({ action: "deleted", entityType: "phase", entityName: `${ids.length} phase${ids.length > 1 ? "s" : ""} deleted`, details: "", userName: "Anthony" });
    optimistic(get, set,
      (s) => ({ phaseBlocks: s.phaseBlocks.filter((b) => !ids.includes(b.id)) }),
      () => Promise.all(ids.map(fsDeletePhase)).then(() => void 0)
    );
  },

  // ── Milestone ──────────────────────────────────────────────────────────────
  addMilestone: (m) => {
    const item: Milestone = { ...m, id: crypto.randomUUID() };
    const _lmp = get().projects.find((p) => p.id === item.projectId);
    const _lmmt = get().milestoneTypes.find((mt) => mt.id === item.milestoneTypeId);
    logActivity({ action: "created", entityType: "milestone", entityName: `${item.customLabel ?? _lmmt?.name ?? "Milestone"} — ${_lmp?.name ?? ""}`, details: fmtDate(item.date), userName: "Anthony" });
    optimistic(get, set,
      (s) => ({ milestones: [...s.milestones, item] }),
      () => fsCreateMilestone(item)
    );
  },
  updateMilestone: (id, patch) => {
    const _lm = get().milestones.find((m) => m.id === id);
    const _lmp = get().projects.find((p) => p.id === _lm?.projectId);
    const _lmmt = get().milestoneTypes.find((mt) => mt.id === _lm?.milestoneTypeId);
    const _lmAction = patch.date ? "moved" : "updated" as const;
    const _lmDetails = patch.date ? `${fmtDate(_lm?.date)} → ${fmtDate(patch.date)}` : "";
    if (_lm) logActivity({ action: _lmAction, entityType: "milestone", entityName: `${_lm.customLabel ?? _lmmt?.name ?? "Milestone"} — ${_lmp?.name ?? ""}`, details: _lmDetails, userName: "Anthony" });
    optimistic(get, set,
      (s) => ({ milestones: s.milestones.map((m) => m.id === id ? { ...m, ...patch } : m) }),
      () => fsUpdateMilestone(id, patch)
    );
  },
  deleteMilestone: (id) => {
    const _lm = get().milestones.find((m) => m.id === id);
    const _lmp = get().projects.find((p) => p.id === _lm?.projectId);
    const _lmmt = get().milestoneTypes.find((mt) => mt.id === _lm?.milestoneTypeId);
    if (_lm) logActivity({ action: "deleted", entityType: "milestone", entityName: `${_lm.customLabel ?? _lmmt?.name ?? "Milestone"} — ${_lmp?.name ?? ""}`, details: "", userName: "Anthony" });
    optimistic(get, set,
      (s) => ({ milestones: s.milestones.filter((m) => m.id !== id) }),
      () => fsDeleteMilestone(id)
    );
  },

  // ── OOO ────────────────────────────────────────────────────────────────────
  addOooPeriod: (o) => {
    const item: OooPeriod = { ...o, id: crypto.randomUUID() };
    const _loood = get().designers.find((d) => d.id === item.designerId);
    logActivity({ action: "created", entityType: "ooo", entityName: `${_loood?.name ?? "Designer"} OOO`, details: `${fmtDate(item.startDate)} → ${fmtDate(item.endDate)}`, userName: "Anthony" });
    optimistic(get, set,
      (s) => ({ oooPeriods: [...s.oooPeriods, item] }),
      () => fsCreateOoo(item)
    );
  },
  updateOooPeriod: (id, patch) => {
    const _looo = get().oooPeriods.find((o) => o.id === id);
    const _loood = get().designers.find((d) => d.id === _looo?.designerId);
    const _loooDetails = (patch.startDate || patch.endDate) ? `${fmtDate(patch.startDate ?? _looo?.startDate)} → ${fmtDate(patch.endDate ?? _looo?.endDate)}` : "";
    if (_looo) logActivity({ action: "updated", entityType: "ooo", entityName: `${_loood?.name ?? "Designer"} OOO`, details: _loooDetails, userName: "Anthony" });
    optimistic(get, set,
      (s) => ({ oooPeriods: s.oooPeriods.map((o) => o.id === id ? { ...o, ...patch } : o) }),
      () => fsUpdateOoo(id, patch)
    );
  },
  deleteOooPeriod: (id) => {
    const _looo = get().oooPeriods.find((o) => o.id === id);
    const _loood = get().designers.find((d) => d.id === _looo?.designerId);
    if (_looo) logActivity({ action: "deleted", entityType: "ooo", entityName: `${_loood?.name ?? "Designer"} OOO`, details: `${fmtDate(_looo.startDate)} → ${fmtDate(_looo.endDate)}`, userName: "Anthony" });
    optimistic(get, set,
      (s) => ({ oooPeriods: s.oooPeriods.filter((o) => o.id !== id) }),
      () => fsDeleteOoo(id)
    );
  },

  // ── Import / Export / Seed ─────────────────────────────────────────────────
  exportData: () => {
    const s = get();
    return JSON.stringify(
      { designers: s.designers, domains: s.domains, phaseTypes: s.phaseTypes,
        milestoneTypes: s.milestoneTypes, projects: s.projects, phaseBlocks: s.phaseBlocks,
        milestones: s.milestones, oooPeriods: s.oooPeriods },
      null, 2
    );
  },

  importData: (json: string) => {
    try {
      const data = JSON.parse(json);
      if (!validateImport(data)) return { ok: false, error: "Invalid file structure." };
      optimistic(get, set,
        () => ({
          designers: data.designers, domains: data.domains,
          phaseTypes: data.phaseTypes, milestoneTypes: data.milestoneTypes,
          projects: data.projects, phaseBlocks: data.phaseBlocks,
          milestones: data.milestones, oooPeriods: data.oooPeriods,
        }),
        () => syncSnapshotToFirestore(data, captureSnapshot(get()))
      );
      return { ok: true };
    } catch {
      return { ok: false, error: "Could not parse JSON file." };
    }
  },

  resetToSeed: () => {
    const seed = {
      designers: SEED_DESIGNERS, domains: SEED_DOMAINS,
      phaseTypes: SEED_PHASE_TYPES, milestoneTypes: SEED_MILESTONE_TYPES,
      projects: SEED_PROJECTS, phaseBlocks: SEED_PHASE_BLOCKS,
      milestones: SEED_MILESTONES, oooPeriods: SEED_OOO_PERIODS,
    };
    optimistic(get, set,
      () => ({ ...seed, undoStack: [], redoStack: [] }),
      () => syncSnapshotToFirestore(seed, captureSnapshot(get()))
    );
  },

  seedToFirestore: async () => {
    await seedFirestore({
      projects:       SEED_PROJECTS,
      phaseBlocks:    SEED_PHASE_BLOCKS,
      milestones:     SEED_MILESTONES,
      oooPeriods:     SEED_OOO_PERIODS,
      phaseTypes:     SEED_PHASE_TYPES,
      milestoneTypes: SEED_MILESTONE_TYPES,
      designers:      SEED_DESIGNERS,
      domains:        SEED_DOMAINS,
    });
  },
}));

export { DOMAIN_DEFAULT_DESIGNER };
