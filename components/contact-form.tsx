"use client";

import { useState, type FormEvent } from "react";
import {
  budgetOptions,
  serviceOptions,
  validateContact,
  type ContactErrors,
  type ContactPayload,
} from "@/data/contact";
import { ArrowUpRight } from "./icons";

const initialPayload: ContactPayload = {
  name: "",
  email: "",
  businessName: "",
  service: "",
  budget: "",
  launchDate: "",
  details: "",
};

type Status = {
  type: "idle" | "loading" | "success" | "error";
  message?: string;
};

export function ContactForm() {
  const [values, setValues] = useState(initialPayload);
  const [errors, setErrors] = useState<ContactErrors>({});
  const [status, setStatus] = useState<Status>({ type: "idle" });

  function update<K extends keyof ContactPayload>(
    key: K,
    value: ContactPayload[K],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateContact(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setStatus({
        type: "error",
        message: "Please correct the highlighted fields.",
      });
      const firstError = Object.keys(nextErrors)[0] as keyof ContactPayload;
      document.getElementById(firstError)?.focus();
      return;
    }

    setStatus({ type: "loading", message: "Checking your project brief…" });
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(values),
      });
      const result = (await response.json()) as {
        ok: boolean;
        delivered?: boolean;
        message?: string;
        errors?: ContactErrors;
      };

      if (!response.ok || !result.ok) {
        setErrors(result.errors ?? {});
        setStatus({
          type: "error",
          message: result.message ?? "Something went wrong. Please try again.",
        });
        return;
      }

      setStatus({ type: "success", message: result.message });
      if (result.delivered) setValues(initialPayload);
    } catch {
      setStatus({
        type: "error",
        message:
          "We could not connect to the studio. Please email hello@yulaverse.studio.",
      });
    }
  }

  const fieldError = (key: keyof ContactPayload) =>
    errors[key] ? (
      <span className="field-error" id={`${key}-error`}>
        {errors[key]}
      </span>
    ) : null;

  return (
    <form className="contact-form" onSubmit={handleSubmit} noValidate>
      <div className="form-grid">
        <label className="field-group" htmlFor="name">
          <span>Name</span>
          <input
            id="name"
            name="name"
            autoComplete="name"
            value={values.name}
            onChange={(event) => update("name", event.target.value)}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "name-error" : undefined}
            placeholder="Your name"
            required
          />
          {fieldError("name")}
        </label>

        <label className="field-group" htmlFor="email">
          <span>Email</span>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={values.email}
            onChange={(event) => update("email", event.target.value)}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "email-error" : undefined}
            placeholder="you@business.com"
            required
          />
          {fieldError("email")}
        </label>

        <label className="field-group" htmlFor="businessName">
          <span>Business name</span>
          <input
            id="businessName"
            name="businessName"
            autoComplete="organization"
            value={values.businessName}
            onChange={(event) => update("businessName", event.target.value)}
            aria-invalid={Boolean(errors.businessName)}
            aria-describedby={
              errors.businessName ? "businessName-error" : undefined
            }
            placeholder="Your business"
            required
          />
          {fieldError("businessName")}
        </label>

        <label className="field-group" htmlFor="service">
          <span>Service required</span>
          <select
            id="service"
            name="service"
            value={values.service}
            onChange={(event) => update("service", event.target.value)}
            aria-invalid={Boolean(errors.service)}
            aria-describedby={errors.service ? "service-error" : undefined}
            required
          >
            <option value="">Choose a service</option>
            {serviceOptions.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
          {fieldError("service")}
        </label>

        <label className="field-group" htmlFor="budget">
          <span>Estimated budget</span>
          <select
            id="budget"
            name="budget"
            value={values.budget}
            onChange={(event) => update("budget", event.target.value)}
            aria-invalid={Boolean(errors.budget)}
            aria-describedby={errors.budget ? "budget-error" : undefined}
            required
          >
            <option value="">Choose a range</option>
            {budgetOptions.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
          {fieldError("budget")}
        </label>

        <label className="field-group" htmlFor="launchDate">
          <span>Desired launch date</span>
          <input
            id="launchDate"
            name="launchDate"
            type="date"
            value={values.launchDate}
            onChange={(event) => update("launchDate", event.target.value)}
            aria-invalid={Boolean(errors.launchDate)}
            aria-describedby={
              errors.launchDate ? "launchDate-error" : undefined
            }
            required
          />
          {fieldError("launchDate")}
        </label>

        <label className="field-group field-group--wide" htmlFor="details">
          <span>Project details</span>
          <textarea
            id="details"
            name="details"
            rows={5}
            maxLength={3000}
            value={values.details}
            onChange={(event) => update("details", event.target.value)}
            aria-invalid={Boolean(errors.details)}
            aria-describedby={errors.details ? "details-error" : "details-help"}
            placeholder="Where is the business now, and where do you want the brand to take you?"
            required
          />
          <span id="details-help" className="field-help">
            Minimum 30 characters · {values.details.length}/3000
          </span>
          {fieldError("details")}
        </label>
      </div>

      <div className="mt-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <button
          className="button-primary justify-center disabled:cursor-wait disabled:opacity-60"
          type="submit"
          disabled={status.type === "loading"}
        >
          {status.type === "loading"
            ? "Preparing enquiry…"
            : "Send project enquiry"}
          <ArrowUpRight className="size-5" />
        </button>
        <div
          className={`min-h-6 max-w-md text-sm leading-6 ${
            status.type === "error"
              ? "text-[#ffd0c8]"
              : status.type === "success"
                ? "text-ivory"
                : "text-ivory/55"
          }`}
          role="status"
          aria-live="polite"
        >
          {status.message ??
            "Typical response time can be added once studio operations are confirmed."}
        </div>
      </div>
    </form>
  );
}
