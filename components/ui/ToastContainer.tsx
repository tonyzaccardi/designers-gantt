"use client";

import { useEffect, useState } from "react";
import { useToastStore, type Toast } from "@/lib/toastStore";

function ToastItem({ toast }: { toast: Toast }) {
  const { removeToast } = useToastStore();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, []);

  const bg: Record<Toast["type"], string> = {
    success: "#05b169",
    error: "#ef4444",
    info: "#0052ff",
  };

  return (
    <div
      style={{
        transform: visible ? "translateY(0) scale(1)" : "translateY(12px) scale(0.97)",
        opacity: visible ? 1 : 0,
        transition: "transform 0.2s ease, opacity 0.2s ease",
        background: "#0a0b0d",
        color: "#fff",
        borderRadius: 10,
        padding: "10px 14px",
        fontSize: 13,
        fontWeight: 500,
        display: "flex",
        alignItems: "center",
        gap: 8,
        boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
        maxWidth: 320,
        minWidth: 180,
        pointerEvents: "auto",
      }}
    >
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: bg[toast.type],
          flexShrink: 0,
        }}
      />
      <span style={{ flex: 1 }}>{toast.message}</span>
      <button
        onClick={() => removeToast(toast.id)}
        style={{
          background: "transparent",
          border: "none",
          color: "#7c828a",
          cursor: "pointer",
          padding: 0,
          fontSize: 15,
          lineHeight: 1,
          flexShrink: 0,
        }}
      >
        ×
      </button>
    </div>
  );
}

export default function ToastContainer() {
  const { toasts } = useToastStore();

  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        pointerEvents: "none",
      }}
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  );
}
