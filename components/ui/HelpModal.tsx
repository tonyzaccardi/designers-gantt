"use client";

import Modal from "@/components/ui/Modal";
import { useStore } from "@/lib/store";
import { useToastStore } from "@/lib/toastStore";

const SHORTCUTS = [
  { keys: ["Esc"], description: "Deselect all / close open panel or modal" },
  { keys: ["Del", "Bksp"], description: "Delete selected phase block(s)" },
  { keys: ["⌘Z", "Ctrl+Z"], description: "Undo last action" },
  { keys: ["⌘⇧Z", "Ctrl+Shift+Z"], description: "Redo" },
  { keys: ["T"], description: "Scroll to today" },
  { keys: ["1"], description: "Zoom: Day view" },
  { keys: ["2"], description: "Zoom: Week view" },
  { keys: ["3"], description: "Zoom: Month view" },
  { keys: ["N"], description: "New project" },
];

const USAGE = [
  "Drag a phase block left or right to move it",
  "Drag the left or right edge of a block to resize",
  "Double-click an empty row to create a phase at that date",
  "Double-click a phase block to edit it",
  "Right-click a block or empty row for the context menu",
  "Click a project name to open the detail panel",
  "Shift+click a project to select all its blocks",
  "Click "+" on a domain header to create a new project",
];

type Props = { open: boolean; onClose: () => void };

export default function HelpModal({ open, onClose }: Props) {
  const { resetToSeed } = useStore();
  const { addToast } = useToastStore();

  function handleReset() {
    if (confirm("Reset to sample data? This will overwrite all your current projects.")) {
      resetToSeed();
      addToast("Reset to sample data", "info");
      onClose();
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Help & shortcuts" width={520}>
      <div className="flex flex-col gap-6">
        {/* Keyboard shortcuts */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "#7c828a" }}>
            Keyboard shortcuts
          </h3>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              {SHORTCUTS.map(({ keys, description }) => (
                <tr key={description} style={{ borderBottom: "1px solid #eef0f3" }}>
                  <td style={{ padding: "7px 0", width: 110 }}>
                    <div className="flex gap-1">
                      {keys.map((k) => (
                        <kbd
                          key={k}
                          style={{
                            display: "inline-block",
                            padding: "2px 6px",
                            borderRadius: 5,
                            background: "#f7f7f7",
                            border: "1px solid #dee1e6",
                            fontSize: 11,
                            fontFamily: "inherit",
                            color: "#0a0b0d",
                            fontWeight: 600,
                          }}
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </td>
                  <td style={{ padding: "7px 0 7px 12px", fontSize: 13, color: "#5b616e" }}>
                    {description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Usage tips */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "#7c828a" }}>
            How to use
          </h3>
          <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
            {USAGE.map((tip) => (
              <li key={tip} className="flex gap-2 items-start" style={{ fontSize: 13, color: "#5b616e", marginBottom: 6 }}>
                <span style={{ color: "#0052ff", fontWeight: 700, marginTop: 1, flexShrink: 0 }}>·</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>

        {/* Reset */}
        <div className="pt-3 border-t" style={{ borderColor: "#eef0f3" }}>
          <button
            onClick={handleReset}
            className="px-4 py-2 rounded-full text-sm font-medium"
            style={{ background: "#fff0f0", color: "#ef4444", border: "1px solid #fee2e2" }}
          >
            Reset to sample data
          </button>
        </div>
      </div>
    </Modal>
  );
}
