"use client";
import { useState } from "react";
import { createAuthClient } from "better-auth/react";
import Link from "next/link";
export function ResetPassword() {
  const [message, setMessage] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <div className="as-container as-auth">
      <p className="as-eyebrow">AgentShelf / Account recovery</p>
      <h1>Set a new password.</h1>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          const f = new FormData(e.currentTarget),
            token = new URL(window.location.href).searchParams.get("token");
          if (!token) {
            setError("This reset link is incomplete. Request a new email.");
            setBusy(false);
            return;
          }
          try {
            const result = await createAuthClient().resetPassword({
              newPassword: String(f.get("password")),
              token,
            });
            if (result.error) throw new Error(result.error.message);
            setMessage("Password updated. You can now sign in.");
          } catch (e) {
            setError(
              e instanceof Error ? e.message : "Could not reset password",
            );
          } finally {
            setBusy(false);
          }
        }}
      >
        <label className="as-field">
          New password (at least 12 characters)
          <input
            name="password"
            type="password"
            minLength={12}
            autoComplete="new-password"
            required
          />
        </label>
        {error && (
          <p className="as-error" role="alert">
            {error}
          </p>
        )}
        {message && (
          <p className="as-success" role="status">
            {message}
          </p>
        )}
        <button className="as-button" disabled={busy}>
          {busy ? "Updating…" : "Update password"}
        </button>
      </form>
      <Link href="/agentshelf/login">Back to sign in ↗</Link>
    </div>
  );
}
