"use client";

import { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import { useStore } from "@/lib/store";
import { DOMAIN_DEFAULT_DESIGNER } from "@/lib/store";
import { useToastStore } from "@/lib/toastStore";
import { useGanttContext } from "@/lib/ganttContext";
import type { Project } from "@/lib/types";

const FIELD = "w-full px-3 py-2 rounded-lg text-sm border outline-none focus:ring-2";
const FIELD_STYLE = { borderColor: "#dee1e6", color: "#0a0b0d", background: "#fff" };

const EMPTY: Partial<Project> = {};

export default function CreateProjectModal() {
  const { createProjectOpen, createProjectDomainId, closeCreateProject } = useGanttContext();
  const { domains, designers, addProject } = useStore();
  const { addToast } = useToastStore();

  const [form, setForm] = useState<Partial<Project>>(EMPTY);

  const sortedDomains = [...domains].sort((a, b) => a.sortOrder - b.sortOrder);
  const fallbackDomainId = sortedDomains[0]?.id ?? "";

  // Pre-fill domain + default designer when modal opens
  useEffect(() => {
    if (createProjectOpen) {
      const domId = createProjectDomainId ?? fallbackDomainId;
      const defaultDesignerId = DOMAIN_DEFAULT_DESIGNER[domId] ?? "";
      setForm({ domainId: domId, designerId: defaultDesignerId });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createProjectOpen, createProjectDomainId]);

  function update(key: keyof Project, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleClose() {
    setForm(EMPTY);
    closeCreateProject();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const domainId = form.domainId ?? createProjectDomainId ?? fallbackDomainId;
    if (!form.name?.trim() || !form.designerId || !domainId) return;

    const name = form.name.trim();
    addProject({
      name: form.name.trim(),
      designerId: form.designerId,
      domainId,
      size: (form.size as Project["size"]) ?? "TBD",
      status: (form.status as Project["status"]) ?? "active",
      description: form.description,
      note: form.note,
      prdUrl: form.prdUrl,
      deadline: form.deadline,
    });
    addToast(`Created "${name}"`);
    handleClose();
  }

  const domainId = form.domainId ?? createProjectDomainId ?? fallbackDomainId;

  return (
    <Modal open={createProjectOpen} onClose={handleClose} title="New project">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Name */}
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: "#5b616e" }}>
            Name *
          </label>
          <input
            className={FIELD}
            style={FIELD_STYLE}
            value={form.name ?? ""}
            onChange={(e) => update("name", e.target.value)}
            placeholder="Project name"
            required
            autoFocus
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Designer */}
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "#5b616e" }}>
              Designer *
            </label>
            <select
              className={FIELD}
              style={FIELD_STYLE}
              value={form.designerId ?? ""}
              onChange={(e) => update("designerId", e.target.value)}
              required
            >
              <option value="">Select…</option>
              {designers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Domain */}
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "#5b616e" }}>
              Domain
            </label>
            <select
              className={FIELD}
              style={FIELD_STYLE}
              value={domainId}
              onChange={(e) => update("domainId", e.target.value)}
            >
              {sortedDomains.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Size */}
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "#5b616e" }}>
              Size
            </label>
            <select
              className={FIELD}
              style={FIELD_STYLE}
              value={form.size ?? "TBD"}
              onChange={(e) => update("size", e.target.value)}
            >
              {["S", "M", "L", "XL", "TBD"].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "#5b616e" }}>
              Status
            </label>
            <select
              className={FIELD}
              style={FIELD_STYLE}
              value={form.status ?? "active"}
              onChange={(e) => update("status", e.target.value)}
            >
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="done">Done</option>
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: "#5b616e" }}>
            Description
          </label>
          <textarea
            className={FIELD}
            style={{ ...FIELD_STYLE, resize: "vertical", minHeight: 60 }}
            value={form.description ?? ""}
            onChange={(e) => update("description", e.target.value)}
            placeholder="Optional description…"
            rows={2}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* PRD URL */}
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "#5b616e" }}>
              PRD link
            </label>
            <input
              type="url"
              className={FIELD}
              style={FIELD_STYLE}
              value={form.prdUrl ?? ""}
              onChange={(e) => update("prdUrl", e.target.value)}
              placeholder="https://…"
            />
          </div>

          {/* Deadline */}
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "#5b616e" }}>
              Deadline
            </label>
            <input
              type="date"
              className={FIELD}
              style={FIELD_STYLE}
              value={form.deadline ?? ""}
              onChange={(e) => update("deadline", e.target.value)}
            />
          </div>
        </div>

        {/* Actions */}
        <div
          className="flex justify-end gap-2 pt-2 border-t"
          style={{ borderColor: "#eef0f3" }}
        >
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 rounded-full text-sm font-medium"
            style={{ background: "#eef0f3", color: "#0a0b0d" }}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded-full text-sm font-medium"
            style={{ background: "#0052ff", color: "#fff" }}
          >
            Create project
          </button>
        </div>
      </form>
    </Modal>
  );
}
