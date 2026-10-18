"use client";
import { useState } from "react";
import Link from "next/link";
type Option = { id: string; name: string };
export function AuditEnquiryForm({
  options,
  enabled = true,
}: {
  options: Option[];
  enabled?: boolean;
}) {
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [error, setError] = useState("");
  return (
    <form
      className="as-form"
      onSubmit={async (e) => {
        e.preventDefault();
        setError("");
        setMessage("");
        setBusy(true);
        const f = new FormData(e.currentTarget);
        try {
          const response = await fetch("/api/agentshelf/enquiries", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...Object.fromEntries(f),
              competitors: String(f.get("competitors") || "")
                .split(/\r?\n/)
                .map((v) => v.trim())
                .filter(Boolean),
              consent: f.get("consent") === "on",
            }),
          });
          const data = await response.json();
          if (!response.ok)
            throw new Error(data.message || "Could not save your enquiry.");
          setMessage(data.message);
        } catch (e) {
          setError(
            e instanceof Error
              ? e.message
              : "Something went wrong. Please try again.",
          );
        } finally {
          setBusy(false);
        }
      }}
    >
      <div className="as-form-grid">
        {[
          { name: "businessName", label: "Business name", type: "text" },
          { name: "website", label: "Website URL", type: "url" },
          { name: "contactName", label: "Contact name", type: "text" },
          { name: "email", label: "Email address", type: "email" },
          { name: "industry", label: "Industry", type: "text" },
        ].map((f) => (
          <label className="as-field" key={f.name}>
            {f.label}
            <input
              name={f.name}
              type={f.type}
              required
              maxLength={f.name === "website" ? 2048 : 254}
              autoComplete={
                f.name === "email"
                  ? "email"
                  : f.name === "contactName"
                    ? "name"
                    : undefined
              }
            />
          </label>
        ))}
        <label className="as-field">
          Your business sells
          <select name="businessType" required>
            <option value="products">Products</option>
            <option value="services">Services</option>
            <option value="both">Products and services</option>
          </select>
        </label>
        <label className="as-field">
          Service package
          <select name="package" required>
            {options.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </label>
        <label className="as-field as-field-wide">
          Competitor websites (up to three, one URL per line)
          <textarea name="competitors" rows={3} />
        </label>
        <label className="as-field as-field-wide">
          Anything else we should know? (optional)
          <textarea name="notes" maxLength={3000} rows={4} />
        </label>
      </div>
      <label className="as-honeypot" aria-hidden="true">
        Company fax
        <input name="companyFax" tabIndex={-1} autoComplete="off" />
      </label>
      <label className="as-check">
        <input type="checkbox" name="consent" required />
        <span>
          I have read the{" "}
          <Link href="/ai-visibility/privacy">privacy notice</Link> and
          understand my information will be used to respond to this enquiry.
          This is not marketing consent.
        </span>
      </label>
      {!enabled && (
        <p className="as-error">
          Online enquiry storage is being connected. Please email
          yulaversestudio@gmail.com to request an assessment; this form cannot
          accept submissions yet.
        </p>
      )}
      {error && (
        <p role="alert" className="as-error">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="as-success">
          {message}
        </p>
      )}
      <div className="as-actions">
        <button className="as-button" disabled={busy || !enabled}>
          {busy ? "Saving your request…" : "Request my assessment ↗"}
        </button>
        <span className="as-note">No payment is taken by this form.</span>
      </div>
    </form>
  );
}
