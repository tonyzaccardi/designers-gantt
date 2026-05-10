"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useStore } from "@/lib/store";
import { useGanttContext } from "@/lib/ganttContext";
import type { PhaseType, MilestoneType } from "@/lib/types";

const FIELD = "px-2 py-1.5 rounded-lg text-sm border outline-none w-full";
const FS = { borderColor: "#dee1e6", color: "#0a0b0d", background: "#fff" };

const PRESET_COLORS = [
  "#8B5CF6","#F59E0B","#10B981","#3B82F6","#EF4444",
  "#6B7280","#EC4899","#06B6D4","#84CC16","#F97316",
];

type Tab = "phases" | "milestones";

export default function SettingsModal() {
  const { settingsModalOpen, closeSettingsModal } = useGanttContext();
  const {
    phaseTypes, addPhaseType, updatePhaseType, deletePhaseType,
    milestoneTypes, addMilestoneType, updateMilestoneType, deleteMilestoneType,
    phaseBlocks, milestones,
  } = useStore();

  const [tab, setTab] = useState<Tab>("phases");
  const [editPhaseId, setEditPhaseId] = useState<string | null>(null);
  const [editPhaseForm, setEditPhaseForm] = useState<Partial<PhaseType>>({});
  const [newPhase, setNewPhase] = useState<Partial<PhaseType>>({ emoji: "✨", color: "#3B82F6" });
  const [addingPhase, setAddingPhase] = useState(false);

  const [editMsId, setEditMsId] = useState<string | null>(null);
  const [editMsForm, setEditMsForm] = useState<Partial<MilestoneType>>({});
  const [newMs, setNewMs] = useState<Partial<MilestoneType>>({});
  const [addingMs, setAddingMs] = useState(false);

  const [deletePhaseTarget, setDeletePhaseTarget] = useState<string | null>(null);
  const [deleteMsTarget, setDeleteMsTarget] = useState<string | null>(null);

  function phaseInUse(id: string) {
    return phaseBlocks.some((b) => b.phaseTypeId === id);
  }
  function msInUse(id: string) {
    return milestones.some((m) => m.milestoneTypeId === id);
  }

  function savePhase() {
    if (!editPhaseId || !editPhaseForm.name?.trim()) return;
    updatePhaseType(editPhaseId, editPhaseForm);
    setEditPhaseId(null);
  }

  function createPhase() {
    if (!newPhase.name?.trim()) return;
    addPhaseType({
      name: newPhase.name.trim(),
      emoji: newPhase.emoji ?? "✨",
      color: newPhase.color ?? "#3B82F6",
      sortOrder: phaseTypes.length + 1,
    });
    setNewPhase({ emoji: "✨", color: "#3B82F6" });
    setAddingPhase(false);
  }

  function saveMs() {
    if (!editMsId || !editMsForm.name?.trim()) return;
    updateMilestoneType(editMsId, editMsForm);
    setEditMsId(null);
  }

  function createMs() {
    if (!newMs.name?.trim()) return;
    addMilestoneType({ name: newMs.name.trim(), icon: newMs.icon });
    setNewMs({});
    setAddingMs(false);
  }

  const sortedPhases = [...phaseTypes].sort((a, b) => a.sortOrder - b.sortOrder);
  const TAB_BTN = (t: Tab) => ({
    borderBottom: tab === t ? "2px solid #0052ff" : "2px solid transparent",
    color: tab === t ? "#0052ff" : "#5b616e",
    fontWeight: tab === t ? 600 : 400,
  });

  return (
    <>
      <Modal open={settingsModalOpen} onClose={closeSettingsModal} title="Settings" width={500}>
        {/* Tabs */}
        <div className="flex gap-4 mb-4 -mt-1 border-b" style={{ borderColor: "#dee1e6" }}>
          {(["phases", "milestones"] as Tab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className="pb-2 text-sm capitalize"
              style={TAB_BTN(t)}>
              {t === "phases" ? "Phase types" : "Milestone types"}
            </button>
          ))}
        </div>

        {tab === "phases" && (
          <div className="flex flex-col gap-2">
            {sortedPhases.map((pt) => (
              <div key={pt.id} className="flex items-center gap-2 p-2 rounded-lg group"
                style={{ background: "#f7f7f7" }}>
                {editPhaseId === pt.id ? (
                  <div className="flex items-center gap-2 flex-1 flex-wrap">
                    <input className="w-10 text-lg text-center border rounded"
                      style={FS} value={editPhaseForm.emoji ?? ""}
                      onChange={(e) => setEditPhaseForm((f) => ({ ...f, emoji: e.target.value }))} />
                    <input className={FIELD} style={{ ...FS, flex: 1 }}
                      value={editPhaseForm.name ?? ""}
                      onChange={(e) => setEditPhaseForm((f) => ({ ...f, name: e.target.value }))} />
                    <ColorPicker
                      value={editPhaseForm.color ?? "#3B82F6"}
                      onChange={(c) => setEditPhaseForm((f) => ({ ...f, color: c }))} />
                    <button onClick={savePhase} className="text-xs px-2 py-1 rounded-full font-medium"
                      style={{ background: "#0052ff", color: "#fff" }}>Save</button>
                    <button onClick={() => setEditPhaseId(null)} className="text-xs px-2 py-1 rounded-full"
                      style={{ background: "#eef0f3", color: "#5b616e" }}>Cancel</button>
                  </div>
                ) : (
                  <>
                    <span className="text-base w-6 text-center">{pt.emoji}</span>
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ background: pt.color }} />
                    <span className="text-sm flex-1" style={{ color: "#0a0b0d" }}>{pt.name}</span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditPhaseId(pt.id); setEditPhaseForm(pt); }}
                        className="text-xs px-2 py-1 rounded" style={{ color: "#0052ff" }}>Edit</button>
                      <button
                        onClick={() => phaseInUse(pt.id)
                          ? alert("Phase type is in use — remove all blocks using it first")
                          : setDeletePhaseTarget(pt.id)
                        }
                        className="text-xs px-2 py-1 rounded" style={{ color: "#ef4444" }}>Delete</button>
                    </div>
                  </>
                )}
              </div>
            ))}

            {addingPhase ? (
              <div className="flex items-center gap-2 flex-wrap p-2 rounded-lg"
                style={{ background: "#f7f7f7" }}>
                <input className="w-10 text-lg text-center border rounded"
                  style={FS} value={newPhase.emoji ?? ""}
                  onChange={(e) => setNewPhase((f) => ({ ...f, emoji: e.target.value }))}
                  placeholder="✨" />
                <input className={FIELD} style={{ ...FS, flex: 1 }}
                  value={newPhase.name ?? ""}
                  onChange={(e) => setNewPhase((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Phase type name" />
                <ColorPicker
                  value={newPhase.color ?? "#3B82F6"}
                  onChange={(c) => setNewPhase((f) => ({ ...f, color: c }))} />
                <button onClick={createPhase} className="text-xs px-2 py-1 rounded-full font-medium"
                  style={{ background: "#0052ff", color: "#fff" }}>Add</button>
                <button onClick={() => setAddingPhase(false)} className="text-xs px-2 py-1 rounded-full"
                  style={{ background: "#eef0f3", color: "#5b616e" }}>Cancel</button>
              </div>
            ) : (
              <button onClick={() => setAddingPhase(true)}
                className="text-sm text-left px-2 py-2 rounded-lg"
                style={{ color: "#0052ff" }}>+ Add phase type</button>
            )}
          </div>
        )}

        {tab === "milestones" && (
          <div className="flex flex-col gap-2">
            {milestoneTypes.map((mt) => (
              <div key={mt.id} className="flex items-center gap-2 p-2 rounded-lg group"
                style={{ background: "#f7f7f7" }}>
                {editMsId === mt.id ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input className={FIELD} style={{ ...FS, width: 48 }}
                      value={editMsForm.icon ?? ""}
                      onChange={(e) => setEditMsForm((f) => ({ ...f, icon: e.target.value }))}
                      placeholder="🔷" maxLength={4} />
                    <input className={FIELD} style={{ ...FS, flex: 1 }}
                      value={editMsForm.name ?? ""}
                      onChange={(e) => setEditMsForm((f) => ({ ...f, name: e.target.value }))} />
                    <button onClick={saveMs} className="text-xs px-2 py-1 rounded-full font-medium"
                      style={{ background: "#0052ff", color: "#fff" }}>Save</button>
                    <button onClick={() => setEditMsId(null)} className="text-xs px-2 py-1 rounded-full"
                      style={{ background: "#eef0f3", color: "#5b616e" }}>Cancel</button>
                  </div>
                ) : (
                  <>
                    {mt.icon && <span style={{ fontSize: 16, lineHeight: 1, width: 20, textAlign: "center" }}>{mt.icon}</span>}
                    <span className="text-sm flex-1" style={{ color: "#0a0b0d" }}>{mt.name}</span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditMsId(mt.id); setEditMsForm(mt); }}
                        className="text-xs px-2 py-1 rounded" style={{ color: "#0052ff" }}>Edit</button>
                      <button
                        onClick={() => msInUse(mt.id)
                          ? alert("Milestone type is in use — remove milestones using it first")
                          : setDeleteMsTarget(mt.id)
                        }
                        className="text-xs px-2 py-1 rounded" style={{ color: "#ef4444" }}>Delete</button>
                    </div>
                  </>
                )}
              </div>
            ))}

            {addingMs ? (
              <div className="flex items-center gap-2 p-2 rounded-lg" style={{ background: "#f7f7f7" }}>
                <input className={FIELD} style={{ ...FS, width: 48 }}
                  value={newMs.icon ?? ""}
                  onChange={(e) => setNewMs((f) => ({ ...f, icon: e.target.value }))}
                  placeholder="🔷" maxLength={4} />
                <input className={FIELD} style={{ ...FS, flex: 1 }}
                  value={newMs.name ?? ""}
                  onChange={(e) => setNewMs((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Milestone type name" />
                <button onClick={createMs} className="text-xs px-2 py-1 rounded-full font-medium"
                  style={{ background: "#0052ff", color: "#fff" }}>Add</button>
                <button onClick={() => setAddingMs(false)} className="text-xs px-2 py-1 rounded-full"
                  style={{ background: "#eef0f3", color: "#5b616e" }}>Cancel</button>
              </div>
            ) : (
              <button onClick={() => setAddingMs(true)}
                className="text-sm text-left px-2 py-2 rounded-lg"
                style={{ color: "#0052ff" }}>+ Add milestone type</button>
            )}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deletePhaseTarget}
        message="Delete this phase type?"
        onConfirm={() => { if (deletePhaseTarget) deletePhaseType(deletePhaseTarget); setDeletePhaseTarget(null); }}
        onCancel={() => setDeletePhaseTarget(null)} />
      <ConfirmDialog
        open={!!deleteMsTarget}
        message="Delete this milestone type?"
        onConfirm={() => { if (deleteMsTarget) deleteMilestoneType(deleteMsTarget); setDeleteMsTarget(null); }}
        onCancel={() => setDeleteMsTarget(null)} />
    </>
  );
}

function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {PRESET_COLORS.map((c) => (
        <button key={c} onClick={() => onChange(c)}
          className="w-5 h-5 rounded-full transition-transform"
          style={{
            background: c,
            transform: value === c ? "scale(1.25)" : "scale(1)",
            outline: value === c ? `2px solid ${c}` : "none",
            outlineOffset: 2,
          }} />
      ))}
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)}
        className="w-5 h-5 rounded cursor-pointer" style={{ border: "none", padding: 0 }} />
    </div>
  );
}
