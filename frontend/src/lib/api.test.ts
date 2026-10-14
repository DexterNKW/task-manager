import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiRequest } from "./api";

function mockFetch(response: Response | Error) {
  const fetchMock = vi.fn(() =>
    response instanceof Error ? Promise.reject(response) : Promise.resolve(response),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("apiRequest", () => {
  it("sends JSON with the bearer token and parses the response", async () => {
    const fetchMock = mockFetch(json(201, { id: 1 }));

    const result = await apiRequest<{ id: number }>("/api/tasks", {
      method: "POST",
      body: { title: "Buy milk" },
      token: "abc",
    });

    expect(result).toEqual({ id: 1 });
    expect(fetchMock).toHaveBeenCalledWith("http://localhost:3000/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer abc" },
      body: JSON.stringify({ title: "Buy milk" }),
    });
  });

  it("returns undefined for 204 responses", async () => {
    mockFetch(new Response(null, { status: 204 }));

    await expect(apiRequest("/api/tasks/1", { method: "DELETE" })).resolves.toBeUndefined();
  });

  it("uses the message of the API error body", async () => {
    mockFetch(json(401, { statusCode: 401, message: "Invalid email or password" }));

    await expect(apiRequest("/api/auth/login")).rejects.toEqual(
      new ApiError(401, "Invalid email or password"),
    );
  });

  it("joins validation messages", async () => {
    mockFetch(json(400, { message: ["email must be an email", "password is too short"] }));

    await expect(apiRequest("/api/auth/register")).rejects.toThrow(
      "email must be an email, password is too short",
    );
  });

  it("falls back to the status when the body is not JSON", async () => {
    mockFetch(new Response("<html>", { status: 502 }));

    await expect(apiRequest("/api/tasks")).rejects.toEqual(new ApiError(502, "Request failed (502)"));
  });

  it("reports network failures with status 0", async () => {
    mockFetch(new TypeError("Failed to fetch"));

    await expect(apiRequest("/api/tasks")).rejects.toEqual(new ApiError(0, "Cannot reach the server"));
  });
});
