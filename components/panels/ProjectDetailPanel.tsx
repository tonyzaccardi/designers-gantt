"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useStore } from "@/lib/store";
import { useGanttContext } from "@/lib/ganttContext";
import { useToastStore } from "@/lib/toastStore";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import type { Project, PhaseBlock, Milestone } from "@/lib/types";

const STATUS_COLOR: Record<string, string> = { active: "#05b169", paused: "#f4b000", done: "#a8acb3" };
const STATUS_BG: Record<string, string> = { active: "#f0fdf4", paused: "#fffbeb", done: "#f3f4f6" };
const STATUS_LABEL: Record<string, string> = { active: "Active", paused: "Paused", done: "Done" };
const SIZE_BG: Record<string, string> = { S: "#fce7f3", M: "#eef0f3", L: "#dbeafe", XL: "#ede9fe", TBD: "#fef3c7" };

// ── Inline-edit primitives ──────────────────────────────────────────────────

function InlineText({
  value, onSave, placeholder = "—", multiline = false, className = "", style = {},
}: {
  value: string; onSave: (v: string) => void; placeholder?: string;
  multiline?: boolean; className?: string; style?: React.CSSProperties;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  function commit() { onSave(draft.trim()); setEditing(false); }
  function cancel() { setDraft(value); setEditing(false); }

  if (editing) {
    const shared = {
      autoFocus: true,
      value: draft,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setDraft(e.target.value),
      onBlur: commit,
      onKeyDown: (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !multiline) { e.preventDefault(); commit(); }
        if (e.key === "Escape") cancel();
      },
      className: "w-full text-sm outline-none rounded px-2 py-1 border",
      style: { borderColor: "#0052ff", color: "#0a0b0d", background: "#fff", resize: "vertical" as const, fontFamily: "inherit" },
    };
    return multiline
      ? <textarea {...shared} rows={3} />
      : <input {...shared} />;
  }

  return (
    <div
      onClick={() => { setDraft(value); setEditing(true); }}
      className={`text-sm cursor-text rounded px-2 py-1 hover:bg-gray-50 ${className}`}
      style={{ color: value ? "#0a0b0d" : "#a8acb3", ...style }}
      title="Click to edit"
    >
      {value || placeholder}
    </div>
  );
}

function InlineSelect<T extends string>({
  value, options, onSave, renderValue,
}: {
  value: T; options: { value: T; label: string }[];
  onSave: (v: T) => void;
  renderValue: (v: T) => React.ReactNode;
}) {
  const [editing, setEditing] = useState(false);
  if (editing) {
    return (
      <select
        autoFocus
        value={value}
        onChange={(e) => { onSave(e.target.value as T); setEditing(false); }}
        onBlur={() => setEditing(false)}
        className="text-sm rounded px-2 py-1 outline-none border"
        style={{ borderColor: "#0052ff", fontFamily: "inherit" }}
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    );
  }
  return (
    <button onClick={() => setEditing(true)} className="cursor-pointer">
      {renderValue(value)}
    </button>
  );
}

// ── Main component ──────────────────────────────────────────────────────────

export default function ProjectDetailPanel() {
  const { openProjectId, closeProject } = useGanttContext();
  const {
    projects, designers, domains, phaseTypes, milestoneTypes,
    phaseBlocks, milestones,
    updateProject, deleteProject,
    addPhaseBlock, deletePhaseBlock,
    addMilestone, updateMilestone, deleteMilestone,
  } = useStore();
  const { addToast } = useToastStore();

  const [entered, setEntered] = useState(false);
  const [deleteProjectConfirm, setDeleteProjectConfirm] = useState(false);
  const [deleteBlockId, setDeleteBlockId] = useState<string | null>(null);
  const [deleteMsId, setDeleteMsId] = useState<string | null>(null);
  const [addingPhase, setAddingPhase] = useState(false);
  const [phaseForm, setPhaseForm] = useState({ phaseTypeId: "", startDate: "", endDate: "", note: "" });
  const [addingMs, setAddingMs] = useState(false);
  const [msForm, setMsForm] = useState({ milestoneTypeId: "", customLabel: "", date: "", note: "" });
  const [editMilestoneId, setEditMilestoneId] = useState<string | null>(null);
  const [editMsEditForm, setEditMsEditForm] = useState({ date: "", customLabel: "", note: "" });

  // Slide-in animation on open
  useEffect(() => {
    if (openProjectId) {
      setEntered(false);
      const t = requestAnimationFrame(() => requestAnimationFrame(() => setEntered(true)));
      return () => cancelAnimationFrame(t);
    } else {
      setEntered(false);
    }
  }, [openProjectId]);

  const project = projects.find((p) => p.id === openProjectId);
  const proj = project as Project; // narrowed — always truthy when panel is open

  if (!openProjectId) return null;
  if (!project) { closeProject(); return null; }

  const designer = designers.find((d) => d.id === proj.designerId);
  const domain = domains.find((d) => d.id === proj.domainId);
  const projectBlocks = phaseBlocks
    .filter((b) => b.projectId === proj.id)
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
  const projectMilestones = milestones
    .filter((m) => m.projectId === proj.id)
    .sort((a, b) => a.date.localeCompare(b.date));

  const today = new Date().toISOString().split("T")[0];
  const deadlinePast = proj.deadline && proj.deadline < today && proj.status !== "done";

  function save(patch: Partial<Project>) { updateProject(proj.id, patch); }

  function handleDeleteProject() {
    deleteProject(proj.id);
    addToast(`Deleted "${proj.name}"`, "info");
    closeProject();
  }

  function handleAddBlock() {
    if (!phaseForm.phaseTypeId || !phaseForm.startDate || !phaseForm.endDate) return;
    addPhaseBlock({
      projectId: proj.id,
      phaseTypeId: phaseForm.phaseTypeId,
      startDate: phaseForm.startDate,
      endDate: phaseForm.endDate,
      note: phaseForm.note || undefined,
      sortOrder: projectBlocks.length + 1,
    });
    addToast("Phase added");
    setPhaseForm({ phaseTypeId: "", startDate: "", endDate: "", note: "" });
    setAddingPhase(false);
  }

  function handleAddMs() {
    if (!msForm.date) return;
    addMilestone({
      projectId: proj.id,
      milestoneTypeId: msForm.milestoneTypeId || undefined,
      customLabel: msForm.customLabel || undefined,
      date: msForm.date,
      note: msForm.note || undefined,
    });
    addToast("Milestone added");
    setMsForm({ milestoneTypeId: "", customLabel: "", date: "", note: "" });
    setAddingMs(false);
  }

  const FIELD = "px-2 py-1.5 rounded-lg text-sm border outline-none w-full";
  const FS = { borderColor: "#dee1e6", color: "#0a0b0d", background: "#fff" };

  return (
    <>
      {/* Overlay */}
      <div
        className="absolute inset-0 z-30"
        style={{ background: "rgba(10,11,13,0.2)", transition: "opacity 200ms", opacity: entered ? 1 : 0 }}
        onClick={closeProject}
      />

      {/* Panel */}
      <div
        className="absolute right-0 top-0 h-full z-40 flex flex-col overflow-hidden"
        style={{
          width: 400,
          background: "#fff",
          borderLeft: "1px solid #dee1e6",
          boxShadow: "-4px 0 24px rgba(0,0,0,0.08)",
          transform: entered ? "translateX(0)" : "translateX(400px)",
          transition: "transform 200ms ease-out",
        }}
      >
        {/* Header */}
        <div
          className="flex items-start justify-between px-5 py-4 border-b shrink-0"
          style={{ borderColor: "#dee1e6" }}
        >
          <div className="flex-1 min-w-0 pr-3">
            <InlineText
              value={proj.name}
              onSave={(v) => v && save({ name: v })}
              placeholder="Project name"
              style={{ fontWeight: 600, fontSize: 15, paddingLeft: 8 }}
            />
            <div className="flex items-center gap-2 mt-1 px-2">
              {designer && (
                <div className="flex items-center gap-1.5 text-xs" style={{ color: "#5b616e" }}>
                  <img src={`${process.env.NEXT_PUBLIC_BASE_PATH || ""}${designer.avatarUrl}`} alt={designer.name} className="rounded-full" style={{ width: 16, height: 16 }} />
                  {designer.name}
                </div>
              )}
              {domain && (
                <span className="text-xs" style={{ color: "#7c828a" }}>· {domain.name}</span>
              )}
            </div>
          </div>
          <button
            onClick={closeProject}
            className="shrink-0 flex items-center justify-center rounded-full text-lg"
            style={{ width: 28, height: 28, background: "#eef0f3", color: "#5b616e" }}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-5">
          {/* Status + Size row */}
          <div className="flex items-center gap-3">
            <InlineSelect
              value={proj.status as Project["status"]}
              options={[
                { value: "active", label: "Active" },
                { value: "paused", label: "Paused" },
                { value: "done", label: "Done" },
              ]}
              onSave={(v) => save({ status: v })}
              renderValue={(v) => (
                <span
                  className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full"
                  style={{ background: STATUS_BG[v] ?? "#f3f4f6", color: STATUS_COLOR[v] ?? "#a8acb3" }}
                >
                  <span
                    className="rounded-full"
                    style={{ width: 6, height: 6, background: STATUS_COLOR[v] ?? "#a8acb3", display: "inline-block" }}
                  />
                  {STATUS_LABEL[v] ?? v}
                </span>
              )}
            />

            <InlineSelect
              value={proj.size as Project["size"]}
              options={[
                { value: "S", label: "S" },
                { value: "M", label: "M" },
                { value: "L", label: "L" },
                { value: "XL", label: "XL" },
                { value: "TBD", label: "TBD" },
              ]}
              onSave={(v) => save({ size: v })}
              renderValue={(v) => (
                <span
                  className="inline-block text-xs font-medium px-2.5 py-1 rounded-full"
                  style={{ background: SIZE_BG[v] ?? "#eef0f3", color: "#5b616e" }}
                >
                  {v}
                </span>
              )}
            />
          </div>

          {/* Fields */}
          <Section label="Description">
            <InlineText value={proj.description ?? ""} onSave={(v) => save({ description: v })} placeholder="Add a description…" multiline />
          </Section>

          <Section label="Note">
            <InlineText value={proj.note ?? ""} onSave={(v) => save({ note: v })} placeholder="Internal note…" multiline />
          </Section>

          <Section label="PRD link">
            {proj.prdUrl ? (
              <div className="flex items-center gap-2">
                <a
                  href={proj.prdUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm truncate flex items-center gap-1"
                  style={{ color: "#0052ff", maxWidth: 260 }}
                >
                  {proj.prdUrl}
                  <svg width="11" height="11" viewBox="0 0 11 11" fill="none" style={{ flexShrink: 0 }}>
                    <path d="M2 9L9 2M9 2H5M9 2v4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </a>
                <InlineText value={proj.prdUrl} onSave={(v) => save({ prdUrl: v })} placeholder="https://…" style={{ display: "none" }} />
                <button
                  onClick={() => { const v = prompt("PRD URL", proj.prdUrl); if (v !== null) save({ prdUrl: v }); }}
                  className="text-xs px-1.5 py-0.5 rounded"
                  style={{ color: "#7c828a", background: "#eef0f3" }}
                >
                  Edit
                </button>
              </div>
            ) : (
              <InlineText value="" onSave={(v) => save({ prdUrl: v })} placeholder="Add PRD link…" />
            )}
          </Section>

          <Section label="Deadline">
            <InlineText
              value={proj.deadline ?? ""}
              onSave={(v) => save({ deadline: v || undefined })}
              placeholder="YYYY-MM-DD"
              style={deadlinePast ? { color: "#ef4444", fontWeight: 600 } : {}}
            />
            {deadlinePast && (
              <p className="text-xs mt-1 px-2" style={{ color: "#ef4444" }}>Past deadline — project still active</p>
            )}
          </Section>

          {/* Phases */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#7c828a" }}>Phases</span>
              <button
                onClick={() => setAddingPhase((v) => !v)}
                className="text-xs px-2 py-1 rounded-full font-medium"
                style={{ background: "#eef0f3", color: "#0052ff" }}
              >
                + Add
              </button>
            </div>

            {projectBlocks.length === 0 && !addingPhase && (
              <p className="text-sm text-center py-4" style={{ color: "#a8acb3" }}>
                No phases yet. Add one to start planning.
              </p>
            )}

            {addingPhase && (
              <div className="flex flex-col gap-2 p-3 rounded-lg mb-2" style={{ background: "#f7f7f7" }}>
                <select className={FIELD} style={FS} value={phaseForm.phaseTypeId}
                  onChange={(e) => setPhaseForm((f) => ({ ...f, phaseTypeId: e.target.value }))}>
                  <option value="">Phase type…</option>
                  {phaseTypes.map((p) => <option key={p.id} value={p.id}>{p.emoji} {p.name}</option>)}
                </select>
                <div className="grid grid-cols-2 gap-2">
                  <input type="date" className={FIELD} style={FS} value={phaseForm.startDate}
                    onChange={(e) => setPhaseForm((f) => ({ ...f, startDate: e.target.value }))} />
                  <input type="date" className={FIELD} style={FS} value={phaseForm.endDate}
                    onChange={(e) => setPhaseForm((f) => ({ ...f, endDate: e.target.value }))} />
                </div>
                <input placeholder="Note (optional)" className={FIELD} style={FS} value={phaseForm.note}
                  onChange={(e) => setPhaseForm((f) => ({ ...f, note: e.target.value }))} />
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setAddingPhase(false)} className="text-xs px-3 py-1.5 rounded-full"
                    style={{ background: "#eef0f3", color: "#5b616e" }}>Cancel</button>
                  <button onClick={handleAddBlock} className="text-xs px-3 py-1.5 rounded-full"
                    style={{ background: "#0052ff", color: "#fff" }}>Save</button>
                </div>
              </div>
            )}

            {projectBlocks.map((block) => {
              const pt = phaseTypes.find((p) => p.id === block.phaseTypeId);
              return (
                <div key={block.id} className="flex items-center gap-2 py-1.5 border-b"
                  style={{ borderColor: "#f3f4f6" }}>
                  <span className="text-base" style={{ flexShrink: 0 }}>{pt?.emoji ?? "📌"}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium" style={{ color: "#0a0b0d" }}>{pt?.name ?? "Phase"}</div>
                    <div className="text-xs" style={{ color: "#7c828a" }}>{block.startDate} → {block.endDate}</div>
                  </div>
                  <button
                    onClick={() => setDeleteBlockId(block.id)}
                    className="shrink-0 text-lg leading-none"
                    style={{ color: "#a8acb3", padding: "0 2px" }}
                    title="Delete phase"
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>

          {/* Milestones */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#7c828a" }}>Milestones</span>
              <button onClick={() => setAddingMs((v) => !v)} className="text-xs px-2 py-1 rounded-full font-medium"
                style={{ background: "#eef0f3", color: "#0052ff" }}>+ Add</button>
            </div>

            {projectMilestones.length === 0 && !addingMs && (
              <p className="text-sm text-center py-4" style={{ color: "#a8acb3" }}>No milestones yet.</p>
            )}

            {addingMs && (
              <div className="flex flex-col gap-2 p-3 rounded-lg mb-2" style={{ background: "#f7f7f7" }}>
                <input type="date" className={FIELD} style={FS} value={msForm.date}
                  onChange={(e) => setMsForm((f) => ({ ...f, date: e.target.value }))} />
                <select className={FIELD} style={FS} value={msForm.milestoneTypeId}
                  onChange={(e) => setMsForm((f) => ({ ...f, milestoneTypeId: e.target.value }))}>
                  <option value="">Type (optional)</option>
                  {milestoneTypes.map((m) => <option key={m.id} value={m.id}>{m.icon ? `${m.icon} ${m.name}` : m.name}</option>)}
                </select>
                <input placeholder="Custom label" className={FIELD} style={FS} value={msForm.customLabel}
                  onChange={(e) => setMsForm((f) => ({ ...f, customLabel: e.target.value }))} />
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setAddingMs(false)} className="text-xs px-3 py-1.5 rounded-full"
                    style={{ background: "#eef0f3", color: "#5b616e" }}>Cancel</button>
                  <button onClick={handleAddMs} className="text-xs px-3 py-1.5 rounded-full"
                    style={{ background: "#0052ff", color: "#fff" }}>Save</button>
                </div>
              </div>
            )}

            {projectMilestones.map((ms) => {
              const mt = milestoneTypes.find((m) => m.id === ms.milestoneTypeId);
              if (editMilestoneId === ms.id) {
                return (
                  <div key={ms.id} className="flex flex-col gap-2 p-3 rounded-lg mb-1" style={{ background: "#f7f7f7" }}>
                    <div className="grid grid-cols-2 gap-2">
                      <input type="date" className={FIELD} style={FS} value={editMsEditForm.date}
                        onChange={(e) => setEditMsEditForm((f) => ({ ...f, date: e.target.value }))} />
                      <input className={FIELD} style={FS} placeholder="Label (optional)"
                        value={editMsEditForm.customLabel}
                        onChange={(e) => setEditMsEditForm((f) => ({ ...f, customLabel: e.target.value }))} />
                    </div>
                    <input className={FIELD} style={FS} placeholder="Note (optional)"
                      value={editMsEditForm.note}
                      onChange={(e) => setEditMsEditForm((f) => ({ ...f, note: e.target.value }))} />
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => setEditMilestoneId(null)} className="text-xs px-3 py-1.5 rounded-full"
                        style={{ background: "#eef0f3", color: "#5b616e" }}>Cancel</button>
                      <button onClick={() => {
                        if (!editMsEditForm.date) return;
                        updateMilestone(ms.id, {
                          date: editMsEditForm.date,
                          customLabel: editMsEditForm.customLabel || undefined,
                          note: editMsEditForm.note || undefined,
                        });
                        setEditMilestoneId(null);
                      }} className="text-xs px-3 py-1.5 rounded-full font-medium"
                        style={{ background: "#0052ff", color: "#fff" }}>Save</button>
                    </div>
                  </div>
                );
              }
              return (
                <div key={ms.id} className="flex items-center gap-2 py-1.5 border-b group/ms" style={{ borderColor: "#f3f4f6" }}>
                  <span style={{ fontSize: 14, flexShrink: 0 }}>◆</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium" style={{ color: "#0a0b0d" }}>
                      {ms.customLabel ?? mt?.name ?? "Milestone"}
                    </div>
                    <div className="text-xs" style={{ color: "#7c828a" }}>{ms.date}</div>
                  </div>
                  <button
                    onClick={() => { setEditMilestoneId(ms.id); setEditMsEditForm({ date: ms.date, customLabel: ms.customLabel ?? "", note: ms.note ?? "" }); }}
                    className="shrink-0 text-xs px-1.5 py-0.5 rounded opacity-0 group-hover/ms:opacity-100"
                    style={{ color: "#0052ff", background: "#eef0f3" }}
                    title="Edit milestone"
                  >Edit</button>
                  <button onClick={() => setDeleteMsId(ms.id)} className="shrink-0 text-lg leading-none"
                    style={{ color: "#a8acb3", padding: "0 2px" }} title="Delete milestone">×</button>
                </div>
              );
            })}
          </div>

          {/* Delete project */}
          <div className="pt-4 border-t" style={{ borderColor: "#eef0f3" }}>
            <button
              onClick={() => setDeleteProjectConfirm(true)}
              className="text-sm px-4 py-2 rounded-full font-medium"
              style={{ background: "#fff0f0", color: "#ef4444", border: "1px solid #fee2e2" }}
            >
              Delete project
            </button>
          </div>
        </div>
      </div>

      {/* Confirm dialogs */}
      <ConfirmDialog
        open={deleteProjectConfirm}
        title="Delete project?"
        message={`"${proj.name}" and all its phases and milestones will be permanently deleted.`}
        onConfirm={handleDeleteProject}
        onCancel={() => setDeleteProjectConfirm(false)}
      />
      <ConfirmDialog
        open={!!deleteBlockId}
        title="Delete phase?"
        message="This phase block will be permanently deleted."
        onConfirm={() => {
          if (deleteBlockId) { deletePhaseBlock(deleteBlockId); addToast("Phase deleted", "info"); }
          setDeleteBlockId(null);
        }}
        onCancel={() => setDeleteBlockId(null)}
      />
      <ConfirmDialog
        open={!!deleteMsId}
        title="Delete milestone?"
        message="This milestone will be permanently deleted."
        onConfirm={() => {
          if (deleteMsId) { deleteMilestone(deleteMsId); addToast("Milestone deleted", "info"); }
          setDeleteMsId(null);
        }}
        onCancel={() => setDeleteMsId(null)}
      />
    </>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "#7c828a" }}>
        {label}
      </div>
      {children}
    </div>
  );
}
