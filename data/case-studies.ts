export type CaseStudy = {
  slug: string;
  name: string;
  label: "Selected Project";
  industry: string;
  services: string[];
  summary: string;
  direction: string;
  theme: "ember" | "signal" | "paper" | "community";
  visualTitle: string;
  visualEyebrow: string;
  visualMetric: string;
  visualCaption: string;
};

export const caseStudies: CaseStudy[] = [
  {
    slug: "appcarz",
    name: "Appcarz",
    label: "Selected Project",
    industry: "Mobility & private hire",
    services: ["Digital design", "App experience", "Brand direction"],
    summary:
      "A mobile-first booking experience that makes local private hire feel fast, direct and dependable.",
    direction:
      "The work focuses on the moments riders need most: rapid booking, clear price expectations, driver and vehicle details, and confident journey tracking—organised into a crisp, high-contrast experience.",
    theme: "ember",
    visualTitle: "APP",
    visualEyebrow: "BOOK / TRACK / ARRIVE",
    visualMetric: "10s",
    visualCaption: "APP CARZ / MOBILITY EXPERIENCE",
  },
  {
    slug: "a1-walsall-radio",
    name: "A1 Walsall Radio",
    label: "Selected Project",
    industry: "Passenger transport",
    services: ["Web design", "Content structure", "Conversion UX"],
    summary:
      "A clear digital presence for a long-standing Walsall transport service, built around trust, access and fast booking.",
    direction:
      "The experience brings school, corporate, wheelchair-accessible and airport transport into one straightforward service system, helping local families and organisations find the right journey and act quickly.",
    theme: "signal",
    visualTitle: "A1",
    visualEyebrow: "WALSALL / 24 HOUR SERVICE",
    visualMetric: "24/7",
    visualCaption: "RADIO TAXIS / LOCAL TRANSPORT",
  },
  {
    slug: "tutoring-for-the-deaf",
    name: "Tutoring for the Deaf",
    label: "Selected Project",
    industry: "Specialist education",
    services: ["Brand direction", "Accessible web design", "Content strategy"],
    summary:
      "An accessible education platform connecting deaf secondary students with specialist English and maths tutoring.",
    direction:
      "Strong visual hierarchy, plain-language content and clear consultation pathways help parents and learners understand the offer: personalised online tutoring, visual teaching methods and BSL-supported learning where appropriate.",
    theme: "paper",
    visualTitle: "LEARN",
    visualEyebrow: "ACCESSIBLE / 1:1 / ONLINE",
    visualMetric: "11–18",
    visualCaption: "ENGLISH + MATHS / BSL SUPPORT",
  },
  {
    slug: "shongo-shomithi",
    name: "Shongo Shomithi",
    label: "Selected Project",
    industry: "Community & culture",
    services: ["Brand identity", "Web design", "Community platform"],
    summary:
      "A warm, contemporary digital home designed to bring community, culture and shared activity into one place.",
    direction:
      "The system balances heritage with forward momentum, using a welcoming visual language and clear pathways for news, participation and connection across the community.",
    theme: "community",
    visualTitle: "SS",
    visualEyebrow: "PEOPLE / CULTURE / CONNECTION",
    visualMetric: "ONE",
    visualCaption: "SHONGO SHOMITHI / COMMUNITY",
  },
];

export function getCaseStudy(slug: string) {
  return caseStudies.find((study) => study.slug === slug);
}
