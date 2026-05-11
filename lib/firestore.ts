/**
 * Firestore service layer.
 *
 * Collections (all top-level — dataset is tiny, always loaded in full):
 *   /projects        — Project docs
 *   /phaseBlocks     — PhaseBlock docs
 *   /milestones      — Milestone docs
 *   /oooPeriods      — OooPeriod docs
 *   /config          — Single doc "phaseTypes"  → { items: PhaseType[] }
 *                    — Single doc "milestoneTypes" → { items: MilestoneType[] }
 *                    — Single doc "designers"    → { items: Designer[] }
 *                    — Single doc "domains"      → { items: Domain[] }
 *
 * Config collections (phaseTypes, milestoneTypes, designers, domains) use a
 * single document with an `items` array because these lists are short and
 * always read/written as a whole.
 */

import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  getDocs,
  QuerySnapshot,
  DocumentData,
} from "firebase/firestore";
import { db } from "./firebase";
import type {
  Project,
  PhaseBlock,
  Milestone,
  OooPeriod,
  PhaseType,
  MilestoneType,
  Designer,
  Domain,
} from "./types";

// ─── Collection refs ──────────────────────────────────────────────────────────

const projectsCol   = collection(db, "projects");
const phasesCol     = collection(db, "phaseBlocks");
const milestonesCol = collection(db, "milestones");
const oooCol        = collection(db, "oooPeriods");
const configCol     = collection(db, "config");

// ─── Helpers ──────────────────────────────────────────────────────────────────

function snapToArray<T>(snap: QuerySnapshot<DocumentData>): T[] {
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as T));
}

// Strip undefined values — Firestore setDoc rejects undefined fields
function clean<T extends object>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  ) as T;
}

// ─── Real-time subscription ───────────────────────────────────────────────────

export type StoreUpdater = {
  setProjects: (v: Project[]) => void;
  setPhaseBlocks: (v: PhaseBlock[]) => void;
  setMilestones: (v: Milestone[]) => void;
  setOooPeriods: (v: OooPeriod[]) => void;
  setPhaseTypes: (v: PhaseType[]) => void;
  setMilestoneTypes: (v: MilestoneType[]) => void;
  setDesigners: (v: Designer[]) => void;
  setDomains: (v: Domain[]) => void;
};

/**
 * Subscribe to all collections. Calls the relevant setter whenever data changes.
 * Returns an unsubscribe function — call it on unmount.
 */
export function subscribeToAll(updaters: StoreUpdater): () => void {
  const unsubs: (() => void)[] = [];

  unsubs.push(
    onSnapshot(projectsCol, (snap) =>
      updaters.setProjects(snapToArray<Project>(snap))
    )
  );
  unsubs.push(
    onSnapshot(phasesCol, (snap) =>
      updaters.setPhaseBlocks(snapToArray<PhaseBlock>(snap))
    )
  );
  unsubs.push(
    onSnapshot(milestonesCol, (snap) =>
      updaters.setMilestones(snapToArray<Milestone>(snap))
    )
  );
  unsubs.push(
    onSnapshot(oooCol, (snap) =>
      updaters.setOooPeriods(snapToArray<OooPeriod>(snap))
    )
  );

  // Config docs — single-doc array pattern
  unsubs.push(
    onSnapshot(doc(configCol, "phaseTypes"), (snap) => {
      if (snap.exists()) updaters.setPhaseTypes((snap.data().items ?? []) as PhaseType[]);
    })
  );
  unsubs.push(
    onSnapshot(doc(configCol, "milestoneTypes"), (snap) => {
      if (snap.exists()) updaters.setMilestoneTypes((snap.data().items ?? []) as MilestoneType[]);
    })
  );
  unsubs.push(
    onSnapshot(doc(configCol, "designers"), (snap) => {
      if (snap.exists()) updaters.setDesigners((snap.data().items ?? []) as Designer[]);
    })
  );
  unsubs.push(
    onSnapshot(doc(configCol, "domains"), (snap) => {
      if (snap.exists()) updaters.setDomains((snap.data().items ?? []) as Domain[]);
    })
  );

  return () => unsubs.forEach((u) => u());
}

// ─── Projects ─────────────────────────────────────────────────────────────────

export const fsCreateProject  = (p: Project)                           => setDoc(doc(projectsCol, p.id), clean(p));
export const fsUpdateProject  = (id: string, data: Partial<Project>)   => updateDoc(doc(projectsCol, id), clean(data) as DocumentData);
export const fsDeleteProject  = (id: string)                           => deleteDoc(doc(projectsCol, id));

// ─── Phase blocks ─────────────────────────────────────────────────────────────

export const fsCreatePhase  = (p: PhaseBlock)                          => setDoc(doc(phasesCol, p.id), clean(p));
export const fsUpdatePhase  = (id: string, data: Partial<PhaseBlock>)  => updateDoc(doc(phasesCol, id), clean(data) as DocumentData);
export const fsDeletePhase  = (id: string)                             => deleteDoc(doc(phasesCol, id));

// ─── Milestones ───────────────────────────────────────────────────────────────

export const fsCreateMilestone = (m: Milestone)                          => setDoc(doc(milestonesCol, m.id), clean(m));
export const fsUpdateMilestone = (id: string, data: Partial<Milestone>)  => updateDoc(doc(milestonesCol, id), clean(data) as DocumentData);
export const fsDeleteMilestone = (id: string)                            => deleteDoc(doc(milestonesCol, id));

// ─── OOO Periods ──────────────────────────────────────────────────────────────

export const fsCreateOoo = (o: OooPeriod)                            => setDoc(doc(oooCol, o.id), clean(o));
export const fsUpdateOoo = (id: string, data: Partial<OooPeriod>)    => updateDoc(doc(oooCol, id), clean(data) as DocumentData);
export const fsDeleteOoo = (id: string)                              => deleteDoc(doc(oooCol, id));

// ─── Config arrays (written as whole arrays) ──────────────────────────────────

export const fsUpdatePhaseTypes     = (items: PhaseType[])     => setDoc(doc(configCol, "phaseTypes"),     { items });
export const fsUpdateMilestoneTypes = (items: MilestoneType[]) => setDoc(doc(configCol, "milestoneTypes"), { items });
export const fsUpdateDesigners      = (items: Designer[])      => setDoc(doc(configCol, "designers"),      { items });
export const fsUpdateDomains        = (items: Domain[])        => setDoc(doc(configCol, "domains"),        { items });

// ─── One-time seed writer ─────────────────────────────────────────────────────

/**
 * Writes all seed data to Firestore in batched writes.
 * Call once from a seed button. Safe to call again — overwrites with same IDs.
 */
export async function batchUpdateProjects(updates: { id: string; data: Partial<Project> }[]) {
  if (updates.length === 0) return;
  const batch = writeBatch(db);
  for (const { id, data } of updates) {
    batch.update(doc(projectsCol, id), data as DocumentData);
  }
  await batch.commit();
}

export async function seedFirestore(data: {
  projects: Project[];
  phaseBlocks: PhaseBlock[];
  milestones: Milestone[];
  oooPeriods: OooPeriod[];
  phaseTypes: PhaseType[];
  milestoneTypes: MilestoneType[];
  designers: Designer[];
  domains: Domain[];
}): Promise<void> {
  // Firestore batch limit = 500 ops. Our dataset is ~200 docs total — safe in two batches.
  const batch1 = writeBatch(db);

  data.projects.forEach((p)     => batch1.set(doc(projectsCol,   p.id), p));
  data.phaseBlocks.forEach((p)  => batch1.set(doc(phasesCol,     p.id), p));
  data.milestones.forEach((m)   => batch1.set(doc(milestonesCol, m.id), m));
  data.oooPeriods.forEach((o)   => batch1.set(doc(oooCol,        o.id), o));

  await batch1.commit();

  // Config docs
  await Promise.all([
    fsUpdatePhaseTypes(data.phaseTypes),
    fsUpdateMilestoneTypes(data.milestoneTypes),
    fsUpdateDesigners(data.designers),
    fsUpdateDomains(data.domains),
  ]);
}

// ─── Activity Log ─────────────────────────────────────────────────────────────

import {
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  limit,
  startAfter,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import type { ActivityLogEntry } from "./types";

const activityLogCol = collection(db, "activityLog");

export function logActivity(entry: Omit<ActivityLogEntry, "id" | "timestamp">): void {
  addDoc(activityLogCol, { ...entry, timestamp: serverTimestamp() }).catch(() => {});
}

export async function fetchActivityLog(
  limitCount = 50
): Promise<{ entries: ActivityLogEntry[]; lastDoc: QueryDocumentSnapshot | null }> {
  const q = query(activityLogCol, orderBy("timestamp", "desc"), limit(limitCount));
  const snap = await getDocs(q);
  const entries = snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
    timestamp: d.data().timestamp?.toDate?.() ?? new Date(),
  } as ActivityLogEntry));
  return { entries, lastDoc: snap.docs[snap.docs.length - 1] ?? null };
}

export async function fetchMoreActivityLog(
  after: QueryDocumentSnapshot,
  limitCount = 50
): Promise<{ entries: ActivityLogEntry[]; lastDoc: QueryDocumentSnapshot | null }> {
  const q = query(activityLogCol, orderBy("timestamp", "desc"), startAfter(after), limit(limitCount));
  const snap = await getDocs(q);
  const entries = snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
    timestamp: d.data().timestamp?.toDate?.() ?? new Date(),
  } as ActivityLogEntry));
  return { entries, lastDoc: snap.docs[snap.docs.length - 1] ?? null };
}
