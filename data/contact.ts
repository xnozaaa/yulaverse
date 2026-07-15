export const serviceOptions = [
  "Brand Identity",
  "Premium Website",
  "Creative Direction",
  "Brand + Website",
] as const;

export const budgetOptions = [
  "£5k–£10k",
  "£10k–£20k",
  "£20k–£40k",
  "£40k+",
  "Not sure yet",
] as const;

export type ContactPayload = {
  name: string;
  email: string;
  businessName: string;
  service: string;
  budget: string;
  launchDate: string;
  details: string;
  website: string;
};

export type ContactErrors = Partial<Record<keyof ContactPayload, string>>;

export function validateContact(payload: ContactPayload): ContactErrors {
  const errors: ContactErrors = {};
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (payload.name.trim().length < 2) errors.name = "Enter your name.";
  if (!emailPattern.test(payload.email))
    errors.email = "Enter a valid email address.";
  if (payload.businessName.trim().length < 2)
    errors.businessName = "Enter your business name.";
  if (
    !serviceOptions.includes(payload.service as (typeof serviceOptions)[number])
  )
    errors.service = "Choose a service.";
  if (!budgetOptions.includes(payload.budget as (typeof budgetOptions)[number]))
    errors.budget = "Choose an estimated budget.";
  if (!payload.launchDate) errors.launchDate = "Choose a desired launch date.";
  if (payload.details.trim().length < 30)
    errors.details = "Tell us a little more (at least 30 characters).";
  if (payload.details.length > 3000)
    errors.details = "Keep project details under 3,000 characters.";

  return errors;
}
