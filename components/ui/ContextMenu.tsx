"use client";

import { useEffect, useRef } from "react";
import { useGanttContext } from "@/lib/ganttContext";
import { useClickOutside } from "@/hooks/useClickOutside";
import { useEscapeKey } from "@/hooks/useEscapeKey";

export default function ContextMenu() {
  const { contextMenu, closeContextMenu } = useGanttContext();
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, closeContextMenu, !!contextMenu);
  useEscapeKey(closeContextMenu, !!contextMenu);

  useEffect(() => {
    if (!contextMenu) return;
    // Adjust position if off-screen
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.right > window.innerWidth) {
      el.style.left = `${contextMenu.x - rect.width}px`;
    }
    if (rect.bottom > window.innerHeight) {
      el.style.top = `${contextMenu.y - rect.height}px`;
    }
  }, [contextMenu]);

  if (!contextMenu) return null;

  return (
    <div
      ref={ref}
      className="fixed z-[70] rounded-lg shadow-xl overflow-hidden py-1"
      style={{
        left: contextMenu.x,
        top: contextMenu.y,
        background: "#fff",
        border: "1px solid #dee1e6",
        minWidth: 160,
      }}
    >
      {contextMenu.items.map((item, i) => (
        item.separator ? (
          <div key={i} style={{ height: 1, background: "#dee1e6", margin: "4px 0" }} />
        ) : (
          <button
            key={i}
            className="w-full text-left px-4 py-2 text-sm transition-colors"
            style={{
              color: item.danger ? "#ef4444" : "#0a0b0d",
              background: "transparent",
              display: "block",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#f7f7f7")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            onClick={() => { item.onClick(); closeContextMenu(); }}
          >
            {item.label}
          </button>
        )
      ))}
    </div>
  );
}
