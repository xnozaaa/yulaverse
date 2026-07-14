export type CaseStudy = {
  slug: string;
  name: string;
  label: "Concept Project";
  industry: string;
  services: string[];
  year: string;
  summary: string;
  direction: string;
  theme: "ember" | "signal" | "paper";
};

export const caseStudies: CaseStudy[] = [
  {
    slug: "nami-house",
    name: "Nami House",
    label: "Concept Project",
    industry: "Modern hospitality",
    services: ["Brand strategy", "Identity", "Digital direction"],
    year: "2026",
    summary:
      "A calm, tactile identity system balancing warm hospitality with exacting editorial detail.",
    direction:
      "The concept explores how a restrained wordmark, material-led palette and modular booking interface can make a new hospitality brand feel considered from its first guest interaction.",
    theme: "ember",
  },
  {
    slug: "arc-one",
    name: "Arc One",
    label: "Concept Project",
    industry: "Climate technology",
    services: ["Identity system", "Web design", "Creative direction"],
    year: "2026",
    summary:
      "A precise, kinetic visual language designed to make complex climate infrastructure feel tangible.",
    direction:
      "The concept pairs a directional identity with a data-forward product story, creating a system that can move between technical detail and high-impact launch communications.",
    theme: "signal",
  },
  {
    slug: "sora-form",
    name: "Sora Form",
    label: "Concept Project",
    industry: "Design furniture",
    services: ["Positioning", "Art direction", "Commerce experience"],
    year: "2026",
    summary:
      "An object-led commerce world where typography, negative space and proportion carry the story.",
    direction:
      "The concept builds a quiet premium system around form and proportion, letting each product occupy its own stage while the interface provides rhythm, context and confidence.",
    theme: "paper",
  },
];

export function getCaseStudy(slug: string) {
  return caseStudies.find((study) => study.slug === slug);
}
