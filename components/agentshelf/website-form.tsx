"use client";
import { useState } from "react";
import { categories } from "@/lib/agentshelf/config";
import type { Entity } from "@/lib/agentshelf/db";
import type { Website } from "@/lib/agentshelf/audit";
export function WebsiteForm({
  save,
  existing,
}: {
  save: (action: string, body: unknown) => Promise<unknown>;
  existing?: Entity<Website>;
}) {
  const [step, setStep] = useState(1),
    [busy, setBusy] = useState(false);
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (step < 3) {
          setStep(step + 1);
          return;
        }
        setBusy(true);
        const f = new FormData(e.currentTarget);
        try {
          const website = {
            name: f.get("name"),
            url: f.get("url"),
            category: f.get("category"),
            offering: f.get("offering"),
            location: f.get("location"),
            aliases: String(f.get("aliases") || "")
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean),
            competitors: String(f.get("competitors") || "")
              .split(/\r?\n/)
              .map((s) => s.trim())
              .filter(Boolean),
          };
          await save(
            existing ? "website-update" : "websites",
            existing
              ? { id: existing.id, version: existing.version, website }
              : website,
          );
        } catch {
          // The shared action handler displays the error and preserves the form.
        } finally {
          setBusy(false);
        }
      }}
    >
      <p className="as-eyebrow">
        {existing ? "Update website" : "Business onboarding"} / Step {step} of 3
      </p>
      <progress
        max={3}
        value={step}
        aria-label="Onboarding progress"
        style={{
          width: "100%",
          accentColor: "#c6a66b",
          height: 4,
          marginBottom: 30,
        }}
      />
      <fieldset hidden={step !== 1}>
        <legend className="as-note" style={{ marginBottom: 20 }}>
          Your business and website
        </legend>
        <div className="as-form-grid">
          <label className="as-field">
            Business / brand name
            <input
              name="name"
              required
              minLength={2}
              maxLength={120}
              defaultValue={existing?.data.name}
            />
          </label>
          <label className="as-field">
            Public website URL
            <input
              name="url"
              type="url"
              required
              defaultValue={existing?.data.url}
            />
          </label>
          <label className="as-field">
            Business category
            <select
              name="category"
              aria-label="Business category"
              defaultValue={existing?.data.category || "ecommerce"}
            >
              {categories.map((c) => (
                <option value={c} key={c}>
                  {c.replaceAll("-", " ")}
                </option>
              ))}
            </select>
          </label>
          <label className="as-field">
            Primary location / market
            <input
              name="location"
              maxLength={120}
              defaultValue={existing?.data.location || "United Kingdom"}
            />
          </label>
          <label className="as-field as-field-wide">
            What do you sell or provide?
            <textarea
              name="offering"
              required
              minLength={3}
              maxLength={500}
              rows={3}
              defaultValue={existing?.data.offering}
            />
          </label>
        </div>
      </fieldset>
      <fieldset hidden={step !== 2}>
        <legend className="as-note" style={{ marginBottom: 20 }}>
          Competitors and recognised brand aliases
        </legend>
        <div className="as-form-grid">
          <label className="as-field as-field-wide">
            Up to three competitor websites (one URL per line)
            <textarea
              name="competitors"
              rows={4}
              defaultValue={existing?.data.competitors.join("\n")}
            />
          </label>
          <label className="as-field as-field-wide">
            Other names your brand uses (comma separated, optional)
            <input
              name="aliases"
              maxLength={500}
              defaultValue={existing?.data.aliases.join(", ")}
            />
          </label>
        </div>
      </fieldset>
      <fieldset hidden={step !== 3}>
        <legend className="as-note">Confirm the scope</legend>
        <p className="as-muted">
          We assess public website information, with up to five pages on your
          site and three per competitor. Recommendation tests use an explicitly
          reviewed query suite and require configured providers and budgets. No
          website changes are made automatically.
        </p>
        <label className="as-check">
          <input type="checkbox" required={step === 3} />
          <span>
            I confirm I am authorised to request an assessment for this business
            and understand its limitations.
          </span>
        </label>
      </fieldset>
      <div className="as-actions">
        {step > 1 && (
          <button
            type="button"
            className="as-button as-button-secondary"
            onClick={() => setStep(step - 1)}
          >
            Back
          </button>
        )}
        <button className="as-button" disabled={busy}>
          {busy
            ? "Saving…"
            : step === 3
              ? existing
                ? "Save business details"
                : "Add my website ↗"
              : "Continue ↗"}
        </button>
      </div>
    </form>
  );
}
