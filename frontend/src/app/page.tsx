"use client";

import { useCallback, useState } from "react";
import { AuthForm } from "@/components/AuthForm";
import { TaskBoard } from "@/components/TaskBoard";
import { setSession, useSession, type Session } from "@/lib/session";

export default function Home() {
  const session = useSession();
  const [notice, setNotice] = useState<string | null>(null);

  const handleAuthenticated = useCallback((next: Session) => {
    setNotice(null);
    setSession(next);
  }, []);

  const handleSessionExpired = useCallback(() => {
    setNotice("Your session has expired. Please sign in again.");
    setSession(null);
  }, []);

  function handleSignOut() {
    setNotice(null);
    setSession(null);
  }

  return (
    <main className="max-w-2xl mx-auto my-12 px-4">
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm px-6 py-8">
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-1 text-gray-800">Task Manager</h1>
            <p className="text-sm text-gray-500">Manage your daily tasks in one place.</p>
          </div>
          {session && (
            <div className="text-right text-sm">
              <p className="text-gray-500">{session.email}</p>
              <button onClick={handleSignOut} className="text-blue-600 hover:text-blue-800 font-medium">
                Sign out
              </button>
            </div>
          )}
        </div>

        {session === undefined ? (
          <p className="text-gray-500 text-sm">Loading...</p>
        ) : session ? (
          <TaskBoard key={session.token} token={session.token} onSessionExpired={handleSessionExpired} />
        ) : (
          <AuthForm notice={notice} onAuthenticated={handleAuthenticated} />
        )}
      </div>
    </main>
  );
}
