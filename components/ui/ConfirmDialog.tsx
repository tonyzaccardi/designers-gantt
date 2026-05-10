"use client";

import { useEscapeKey } from "@/hooks/useEscapeKey";

type Props = {
  open: boolean;
  title?: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  danger?: boolean;
};

export default function ConfirmDialog({
  open,
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel = "Delete",
  danger = true,
}: Props) {
  useEscapeKey(onCancel, open);
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center"
      style={{ background: "rgba(10,11,13,0.5)" }}
    >
      <div
        className="rounded-xl shadow-2xl p-6 flex flex-col gap-4"
        style={{ background: "#fff", width: 360 }}
      >
        {title && <p className="text-sm font-semibold" style={{ color: "#0a0b0d" }}>{title}</p>}
        <p className="text-sm" style={{ color: "#5b616e" }}>{message}</p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-full text-sm font-medium"
            style={{ background: "#eef0f3", color: "#0a0b0d" }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-full text-sm font-medium"
            style={{ background: danger ? "#ef4444" : "#0052ff", color: "#fff" }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
