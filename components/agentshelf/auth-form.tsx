"use client";
import { useState } from "react";
import Link from "next/link";
import { createAuthClient } from "better-auth/react";
const client = createAuthClient();
export function AuthForm({ signup = false }: { signup?: boolean }) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  return (
    <div className="as-container as-auth">
      <p className="as-eyebrow">AgentShelf / Your intelligence workspace</p>
      <h1>{signup ? "Your next chapter." : "Welcome back."}</h1>
      <p className="as-muted">
        {signup
          ? "Create an account to manage your websites and reviewed assessments."
          : "Sign in with your verified email address."}
      </p>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          const f = new FormData(e.currentTarget);
          try {
            const email = String(f.get("email")),
              password = String(f.get("password"));
            const result = signup
              ? await client.signUp.email({
                  name: String(f.get("name")),
                  email,
                  password,
                  callbackURL: "/agentshelf/onboarding",
                })
              : await client.signIn.email({
                  email,
                  password,
                  callbackURL: "/agentshelf/dashboard",
                });
            if (result.error)
              throw new Error(result.error.message || "Could not sign in.");
            if (signup)
              setMessage(
                "Your account is created. Check your email for the verification link. If email delivery is pending, contact the studio; verification is required before access.",
              );
            else window.location.assign("/agentshelf/dashboard");
          } catch (e) {
            setError(e instanceof Error ? e.message : "Please try again.");
          } finally {
            setBusy(false);
          }
        }}
      >
        {signup && (
          <label className="as-field">
            Your name
            <input name="name" required maxLength={100} autoComplete="name" />
          </label>
        )}
        <label className="as-field">
          Email address
          <input name="email" type="email" required autoComplete="email" />
        </label>
        <label className="as-field">
          Password (at least 12 characters)
          <input
            name="password"
            type="password"
            minLength={12}
            required
            autoComplete={signup ? "new-password" : "current-password"}
          />
        </label>
        {signup && (
          <label className="as-check">
            <input type="checkbox" required />
            <span>
              I have read the{" "}
              <Link href="/ai-visibility/privacy">privacy notice</Link> and{" "}
              <Link href="/ai-visibility/terms">service terms</Link>.
            </span>
          </label>
        )}
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
          {busy ? "Please wait…" : signup ? "Create my account ↗" : "Sign in ↗"}
        </button>
      </form>
      <div className="as-inline">
        <Link href={signup ? "/agentshelf/login" : "/agentshelf/signup"}>
          {signup ? "Already have an account? Sign in" : "Create an account"}
        </Link>
        <button
          className="as-button as-button-secondary as-button-small"
          onClick={async () => {
            const email = window.prompt("Enter your account email address.");
            if (!email) return;
            await client.requestPasswordReset({
              email,
              redirectTo: "/agentshelf/reset-password",
            });
            setMessage(
              "If an account exists, password reset instructions have been queued.",
            );
          }}
        >
          Forgot password?
        </button>
      </div>
    </div>
  );
}
