"use client";

import { useState } from "react";
import { apiRequest } from "@/lib/api";
import type { Session } from "@/lib/session";
import type { AuthResponse } from "@/types";

type Mode = "login" | "register";

interface AuthFormProps {
  notice: string | null;
  onAuthenticated: (session: Session) => void;
}

export function AuthForm({ notice, onAuthenticated }: AuthFormProps) {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLogin = mode === "login";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const { accessToken, user } = await apiRequest<AuthResponse>(`/api/auth/${mode}`, {
        method: "POST",
        body: { email, password },
      });
      onAuthenticated({ token: accessToken, email: user.email });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSubmitting(false);
    }
  }

  function switchMode() {
    setMode(isLogin ? "register" : "login");
    setError(null);
  }

  return (
    <section aria-labelledby="auth-title">
      <h2 id="auth-title" className="text-lg font-semibold text-gray-800 mb-4">
        {isLogin ? "Sign in" : "Create an account"}
      </h2>

      {notice && (
        <p role="status" className="text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 mb-4 text-sm">
          {notice}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete={isLogin ? "current-password" : "new-password"}
            required
            minLength={isLogin ? undefined : 8}
            aria-describedby={isLogin ? undefined : "password-hint"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {!isLogin && (
            <p id="password-hint" className="text-xs text-gray-500 mt-1">
              At least 8 characters.
            </p>
          )}
        </div>

        {error && (
          <p role="alert" className="text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2 text-sm">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-md text-sm disabled:opacity-50 transition-colors"
        >
          {submitting ? "Please wait..." : isLogin ? "Sign in" : "Create account"}
        </button>
      </form>

      <p className="text-sm text-gray-600 mt-4">
        {isLogin ? "No account yet?" : "Already have an account?"}{" "}
        <button type="button" onClick={switchMode} className="text-blue-600 hover:text-blue-800 font-medium">
          {isLogin ? "Create one" : "Sign in"}
        </button>
      </p>
    </section>
  );
}
