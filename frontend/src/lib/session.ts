import { useSyncExternalStore } from "react";

export interface Session {
  token: string;
  email: string;
}

const STORAGE_KEY = "task-manager.session";
const listeners = new Set<() => void>();

// undefined until the first read, so that every render sees the same object
// (useSyncExternalStore requires a stable snapshot).
let cached: Session | null | undefined;

function readStorage(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Session>;
    return typeof parsed.token === "string" && typeof parsed.email === "string"
      ? { token: parsed.token, email: parsed.email }
      : null;
  } catch {
    // Storage can be unavailable (private mode, blocked cookies) or corrupted.
    return null;
  }
}

export function getSession(): Session | null {
  if (cached === undefined) cached = readStorage();
  return cached;
}

export function setSession(session: Session | null): void {
  cached = session;
  try {
    if (session) localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // The session still lives in memory for this tab.
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  // Keeps tabs in sync: signing out in one tab signs out the others.
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return;
    cached = readStorage();
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** undefined while rendering on the server, before storage can be read. */
export function useSession(): Session | null | undefined {
  return useSyncExternalStore(subscribe, getSession, () => undefined);
}
