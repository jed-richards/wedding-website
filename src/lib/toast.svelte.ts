/** Minimal rune-based toast store for the admin dashboard. No library — a
 * `$state` array plus push/dismiss, auto-expiring after a few seconds. Import
 * `toasts` to render the list and `pushToast`/`dismissToast` to control it. */

export interface Toast {
  id: number;
  message: string;
  tone: "success" | "error";
}

let nextId = 0;
export const toasts: Toast[] = $state([]);

const DEFAULT_DURATION_MS = 4000;

export function pushToast(message: string, tone: Toast["tone"] = "success") {
  const id = nextId++;
  toasts.push({ id, message, tone });
  setTimeout(() => dismissToast(id), DEFAULT_DURATION_MS);
}

export function dismissToast(id: number) {
  const index = toasts.findIndex((t) => t.id === id);
  if (index !== -1) toasts.splice(index, 1);
}
