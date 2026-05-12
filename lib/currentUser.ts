// Persists the selected designer across sessions via localStorage.
// Called in store actions (client-side only).

export function getCurrentUserName(): string {
  if (typeof window === "undefined") return "Unknown";
  return localStorage.getItem("gantt_designer_name") ?? "Unknown";
}

export function setCurrentUser(id: string, name: string): void {
  localStorage.setItem("gantt_designer_id", id);
  localStorage.setItem("gantt_designer_name", name);
}

export function getSavedDesignerId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("gantt_designer_id");
}
