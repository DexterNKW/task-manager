import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const STORAGE_KEY = "task-manager.session";

function fakeStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    removeItem: (key: string) => void data.delete(key),
    data,
  };
}

// The module caches the session, so each test loads a fresh copy.
async function loadSession() {
  vi.resetModules();
  return import("./session");
}

beforeEach(() => {
  vi.unstubAllGlobals();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("session", () => {
  it("reads a stored session", async () => {
    vi.stubGlobal(
      "localStorage",
      fakeStorage({ [STORAGE_KEY]: JSON.stringify({ token: "t", email: "a@example.com" }) }),
    );
    const { getSession } = await loadSession();

    expect(getSession()).toEqual({ token: "t", email: "a@example.com" });
  });

  it("ignores corrupted data", async () => {
    vi.stubGlobal("localStorage", fakeStorage({ [STORAGE_KEY]: "{not json" }));
    const { getSession } = await loadSession();

    expect(getSession()).toBeNull();
  });

  it("returns no session when storage is unavailable", async () => {
    const { getSession } = await loadSession();

    expect(getSession()).toBeNull();
  });

  it("persists and clears the session", async () => {
    const storage = fakeStorage();
    vi.stubGlobal("localStorage", storage);
    const { getSession, setSession } = await loadSession();

    setSession({ token: "t", email: "a@example.com" });
    expect(storage.data.get(STORAGE_KEY)).toBe(JSON.stringify({ token: "t", email: "a@example.com" }));
    expect(getSession()).toEqual({ token: "t", email: "a@example.com" });

    setSession(null);
    expect(storage.data.has(STORAGE_KEY)).toBe(false);
    expect(getSession()).toBeNull();
  });

  it("keeps the session in memory when storage throws", async () => {
    vi.stubGlobal("localStorage", {
      getItem: () => null,
      setItem: () => {
        throw new Error("QuotaExceededError");
      },
      removeItem: () => undefined,
    });
    const { getSession, setSession } = await loadSession();

    setSession({ token: "t", email: "a@example.com" });

    expect(getSession()).toEqual({ token: "t", email: "a@example.com" });
  });
});
