"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useStore } from "@/lib/store";
import { useGanttContext } from "@/lib/ganttContext";
import type { OooPeriod } from "@/lib/types";

const FIELD = "px-2 py-1.5 rounded-lg text-sm border outline-none";
const FS = { borderColor: "#dee1e6", color: "#0a0b0d", background: "#fff" };

type AddForm = { startDate: string; endDate: string; note: string };

export default function OooModal() {
  const { oooModalOpen, closeOooModal } = useGanttContext();
  const { designers, oooPeriods, addOooPeriod, updateOooPeriod, deleteOooPeriod } = useStore();

  const [addingFor, setAddingFor] = useState<string | null>(null);
  const [addForm, setAddForm] = useState<AddForm>({ startDate: "", endDate: "", note: "" });
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<AddForm>({ startDate: "", endDate: "", note: "" });

  function handleAdd(designerId: string) {
    if (!addForm.startDate || !addForm.endDate) return;
    addOooPeriod({ designerId, ...addForm });
    setAddForm({ startDate: "", endDate: "", note: "" });
    setAddingFor(null);
  }

  function startEdit(ooo: OooPeriod) {
    setEditId(ooo.id);
    setEditForm({ startDate: ooo.startDate, endDate: ooo.endDate, note: ooo.note ?? "" });
  }

  function saveEdit() {
    if (!editId) return;
    updateOooPeriod(editId, editForm);
    setEditId(null);
  }

  return (
    <>
      <Modal open={oooModalOpen} onClose={closeOooModal} title="Manage OOO" width={540}>
        <div className="flex flex-col gap-5">
          {designers.map((d) => {
            const periods = oooPeriods.filter((o) => o.designerId === d.id)
              .sort((a, b) => a.startDate.localeCompare(b.startDate));

            return (
              <div key={d.id}>
                {/* Designer row */}
                <div className="flex items-center gap-2 mb-2">
                  <img src={`${process.env.NEXT_PUBLIC_BASE_PATH || ""}${d.avatarUrl}`} alt={d.name} className="w-6 h-6 rounded-full" />
                  <span className="text-sm font-semibold" style={{ color: "#0a0b0d" }}>{d.name}</span>
                  <button
                    onClick={() => { setAddingFor(d.id); setAddForm({ startDate: "", endDate: "", note: "" }); }}
                    className="ml-auto text-xs px-2 py-1 rounded-full font-medium"
                    style={{ background: "#eef0f3", color: "#5b616e" }}
                  >
                    + Add period
                  </button>
                </div>

                {/* Add form */}
                {addingFor === d.id && (
                  <div className="flex items-center gap-2 mb-2 pl-8 flex-wrap">
                    <input type="date" className={FIELD} style={FS}
                      value={addForm.startDate}
                      onChange={(e) => setAddForm((f) => ({ ...f, startDate: e.target.value }))} />
                    <span className="text-xs" style={{ color: "#7c828a" }}>→</span>
                    <input type="date" className={FIELD} style={FS}
                      value={addForm.endDate}
                      onChange={(e) => setAddForm((f) => ({ ...f, endDate: e.target.value }))} />
                    <input className={FIELD} style={{ ...FS, flex: 1, minWidth: 80 }}
                      placeholder="Note…"
                      value={addForm.note}
                      onChange={(e) => setAddForm((f) => ({ ...f, note: e.target.value }))} />
                    <button onClick={() => handleAdd(d.id)}
                      className="text-xs px-2 py-1.5 rounded-full font-medium"
                      style={{ background: "#0052ff", color: "#fff" }}>Save</button>
                    <button onClick={() => setAddingFor(null)}
                      className="text-xs px-2 py-1.5 rounded-full"
                      style={{ background: "#eef0f3", color: "#5b616e" }}>Cancel</button>
                  </div>
                )}

                {/* Periods list */}
                {periods.length === 0 && addingFor !== d.id && (
                  <p className="text-xs pl-8" style={{ color: "#a8acb3" }}>No OOO periods</p>
                )}
                {periods.map((ooo) => (
                  <div key={ooo.id} className="flex items-center gap-2 pl-8 py-1 rounded-lg group"
                    style={{ background: "transparent" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#f7f7f7")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    {editId === ooo.id ? (
                      <div className="flex items-center gap-2 flex-wrap flex-1">
                        <input type="date" className={FIELD} style={FS}
                          value={editForm.startDate}
                          onChange={(e) => setEditForm((f) => ({ ...f, startDate: e.target.value }))} />
                        <span className="text-xs" style={{ color: "#7c828a" }}>→</span>
                        <input type="date" className={FIELD} style={FS}
                          value={editForm.endDate}
                          onChange={(e) => setEditForm((f) => ({ ...f, endDate: e.target.value }))} />
                        <input className={FIELD} style={{ ...FS, flex: 1 }}
                          value={editForm.note}
                          onChange={(e) => setEditForm((f) => ({ ...f, note: e.target.value }))} />
                        <button onClick={saveEdit} className="text-xs px-2 py-1 rounded-full font-medium"
                          style={{ background: "#0052ff", color: "#fff" }}>Save</button>
                        <button onClick={() => setEditId(null)} className="text-xs px-2 py-1 rounded-full"
                          style={{ background: "#eef0f3", color: "#5b616e" }}>Cancel</button>
                      </div>
                    ) : (
                      <>
                        <span className="text-sm" style={{ color: "#0a0b0d" }}>
                          {ooo.startDate} → {ooo.endDate}
                        </span>
                        {ooo.note && (
                          <span className="text-xs" style={{ color: "#7c828a" }}>{ooo.note}</span>
                        )}
                        <div className="ml-auto flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => startEdit(ooo)}
                            className="text-xs px-2 py-1 rounded"
                            style={{ color: "#0052ff" }}>Edit</button>
                          <button onClick={() => setDeleteTarget(ooo.id)}
                            className="text-xs px-2 py-1 rounded"
                            style={{ color: "#ef4444" }}>Delete</button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        message="Delete this OOO period?"
        onConfirm={() => { if (deleteTarget) deleteOooPeriod(deleteTarget); setDeleteTarget(null); }}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
