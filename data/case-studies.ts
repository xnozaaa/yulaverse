export type CaseStudy = {
  slug: string;
  name: string;
  label: "Selected Project";
  industry: string;
  services: string[];
  website: string;
  summary: string;
  direction: string;
  highlights: Array<{ value: string; label: string }>;
  theme: "ember" | "signal" | "paper" | "community";
  visualImage: string;
  visualLogo?: string;
  visualHost: string;
  visualAction: string;
  visualTitle: string;
  visualEyebrow: string;
  visualMetric: string;
  visualCaption: string;
};

export const caseStudies: CaseStudy[] = [
  {
    slug: "appcarz",
    name: "App Carz",
    label: "Selected Project",
    industry: "Private hire & passenger transport",
    services: ["Web design", "Booking journeys", "Content architecture"],
    website: "https://appcarz.co.uk",
    summary:
      "A conversion-focused digital presence for a 24/7 West Midlands private-hire service, bringing everyday journeys, airport transfers and event transport into one clear booking experience.",
    direction:
      "The experience leads with availability, safety and straightforward booking, then helps customers choose between private hire, fixed-fare airport transfers and special-event travel. Fleet guidance—from saloons and executive cars to estates and eight-seat minibuses—supports confident decisions before booking.",
    highlights: [
      { value: "24/7", label: "Service availability" },
      { value: "15+", label: "Years of combined experience" },
      { value: "Fixed", label: "Airport fares" },
    ],
    theme: "ember",
    visualImage: "/projects/brand/appcarz-hero.png",
    visualHost: "appcarz.co.uk",
    visualAction: "Book a journey",
    visualTitle: "BOOK. RIDE. ARRIVE.",
    visualEyebrow: "PRIVATE HIRE / AIRPORT TRANSFERS",
    visualMetric: "24/7",
    visualCaption: "WEST MIDLANDS / FIXED FARES",
  },
  {
    slug: "a1-walsall-radio",
    name: "A1 Walsall Radio Taxis",
    label: "Selected Project",
    industry: "Local, school & contract transport",
    services: ["Web design", "Service architecture", "Conversion UX"],
    website: "https://walsallradiotaxis.com",
    summary:
      "A service-led website for a Walsall transport operator serving schools, businesses, local families, wheelchair users and airport passengers around the clock.",
    direction:
      "The content system makes a broad transport offer easy to navigate: safeguarding-focused home-to-school journeys, council and academy contracts, workplace travel, on-site booking tablets, wheelchair-accessible vehicles and fixed-price airport transfers. Trust signals centre on four decades of local service, licensing and punctuality.",
    highlights: [
      { value: "1986", label: "Serving Walsall since" },
      { value: "24/7", label: "Service and support" },
      { value: "40+", label: "Years of trusted transport" },
    ],
    theme: "signal",
    visualImage: "/projects/brand/a1-hero.png",
    visualLogo: "/projects/brand/a1-logo.png",
    visualHost: "walsallradiotaxis.com",
    visualAction: "Book your taxi",
    visualTitle: "TRUSTED SINCE 1986.",
    visualEyebrow: "SCHOOLS / BUSINESS / ACCESS",
    visualMetric: "1986",
    visualCaption: "WALSALL / LOCAL TRANSPORT",
  },
  {
    slug: "tutoring-for-the-deaf",
    name: "Tutoring for the Deaf",
    label: "Selected Project",
    industry: "Deaf education & online tutoring",
    services: ["Accessible web design", "Content strategy", "Consultation UX"],
    website: "https://tutoringforthedeaf.co.uk",
    summary:
      "An accessible online tutoring platform for secondary-school-age deaf and hard-of-hearing learners seeking personalised English, maths and GCSE support.",
    direction:
      "The journey explains who the service supports, how communication is adapted and what families can expect from a consultation through to regular 1:1 lessons. BSL-supported teaching, visual explanations, EHCP awareness, safeguarding and parent updates are presented as core parts of the offer rather than secondary details.",
    highlights: [
      { value: "10+", label: "Years in deaf education" },
      { value: "1:1", label: "Personalised online lessons" },
      { value: "GCSE", label: "English and maths support" },
    ],
    theme: "paper",
    visualImage: "/projects/brand/tutoring-icon.png",
    visualLogo: "/projects/brand/tutoring-logo.png",
    visualHost: "tutoringforthedeaf.co.uk",
    visualAction: "Free consultation",
    visualTitle: "LEARN YOUR WAY.",
    visualEyebrow: "BSL-SUPPORTED / ENGLISH + MATHS",
    visualMetric: "1:1",
    visualCaption: "ACCESSIBLE / VISUAL / PERSONALISED",
  },
  {
    slug: "shongo-shomithi",
    name: "Shongo Shomithi",
    label: "Selected Project",
    industry: "Community, culture & live events",
    services: ["Brand identity", "Event website", "Participation UX"],
    website: "https://www.shongoshomithi.co.uk",
    summary:
      "A community platform connecting Bangladeshi heritage, family participation and Walsall’s first Bangla Community Day 2026.",
    direction:
      "The digital experience gives attendees, volunteers, stall holders and sponsors clear routes into the event while presenting the wider movement: connecting generations, preserving heritage, supporting elders, inspiring young people and strengthening local community. Event information, sponsorship opportunities and trader applications are organised around action.",
    highlights: [
      { value: "30 Aug", label: "Bangla Community Day 2026" },
      { value: "3,000+", label: "Expected visitors" },
      { value: "40+", label: "Traders and exhibitors" },
    ],
    theme: "community",
    visualImage: "/projects/brand/shongo-hero.webp",
    visualLogo: "/projects/brand/shongo-logo.webp",
    visualHost: "shongoshomithi.co.uk",
    visualAction: "Join the community",
    visualTitle: "UNITED BY HERITAGE.",
    visualEyebrow: "HERITAGE / FAMILY / COMMUNITY",
    visualMetric: "30 AUG",
    visualCaption: "WALSALL / COMMUNITY DAY 2026",
  },
];

export function getCaseStudy(slug: string) {
  return caseStudies.find((study) => study.slug === slug);
}
