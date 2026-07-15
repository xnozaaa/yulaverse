import Image from "next/image";

type LogoProps = {
  variant?:
    | "dark"
    | "gold"
    | "light"
    | "stacked"
    | "stacked-black"
    | "stacked-light"
    | "monogram-dark"
    | "monogram-gold"
    | "monogram-light"
    | "tagline-horizontal"
    | "tagline-horizontal-light-bg"
    | "tagline-condensed"
    | "tagline-condensed-light-bg"
    | "tagline-only";
  className?: string;
  priority?: boolean;
};

const logos = {
  dark: {
    src: "/brand/official-horizontal-black.png",
    width: 7680,
    height: 4320,
    alt: "Yulaverse Studio",
  },
  gold: {
    src: "/brand/official-horizontal-gold.png",
    width: 7680,
    height: 4320,
    alt: "Yulaverse Studio",
  },
  light: {
    src: "/brand/official-horizontal-light.png",
    width: 7680,
    height: 4320,
    alt: "Yulaverse Studio",
  },
  stacked: {
    src: "/brand/official-stacked-gold.png",
    width: 7680,
    height: 4320,
    alt: "Yulaverse Studio",
  },
  "stacked-black": {
    src: "/brand/official-stacked-black.png",
    width: 7680,
    height: 4320,
    alt: "Yulaverse Studio",
  },
  "stacked-light": {
    src: "/brand/official-stacked-light.png",
    width: 7680,
    height: 4320,
    alt: "Yulaverse Studio",
  },
  "monogram-dark": {
    src: "/brand/official-monogram-black.png",
    width: 7680,
    height: 4320,
    alt: "Yulaverse Studio monogram",
  },
  "monogram-gold": {
    src: "/brand/official-monogram-gold.png",
    width: 7680,
    height: 4320,
    alt: "Yulaverse Studio monogram",
  },
  "monogram-light": {
    src: "/brand/official-monogram-light.png",
    width: 7680,
    height: 4320,
    alt: "Yulaverse Studio monogram",
  },
  "tagline-horizontal": {
    src: "/brand/official-tagline-horizontal.png",
    width: 7680,
    height: 4320,
    alt: "Yulaverse Studio — Brand Identity, Web Design, Creative Direction",
  },
  "tagline-horizontal-light-bg": {
    src: "/brand/official-tagline-horizontal-light-bg.png",
    width: 7680,
    height: 4320,
    alt: "Yulaverse Studio — Brand Identity, Web Design, Creative Direction",
  },
  "tagline-condensed": {
    src: "/brand/official-tagline-condensed.png",
    width: 7680,
    height: 5335,
    alt: "Yulaverse Studio — Brand Identity, Web Design, Creative Direction",
  },
  "tagline-condensed-light-bg": {
    src: "/brand/official-tagline-condensed-light-bg.png",
    width: 7680,
    height: 5336,
    alt: "Yulaverse Studio — Brand Identity, Web Design, Creative Direction",
  },
  "tagline-only": {
    src: "/brand/official-tagline-only.png",
    width: 7680,
    height: 5335,
    alt: "Brand Identity, Web Design, Creative Direction",
  },
} as const;

export function Logo({ variant = "dark", className, priority }: LogoProps) {
  const logo = logos[variant];

  return (
    <Image
      src={logo.src}
      width={logo.width}
      height={logo.height}
      alt={logo.alt}
      className={className}
      priority={priority}
      sizes={
        variant.startsWith("monogram") || variant.startsWith("stacked")
          ? "(max-width: 768px) 360px, 560px"
          : variant.startsWith("tagline")
            ? "(max-width: 768px) 360px, 960px"
            : "(max-width: 768px) 260px, 520px"
      }
    />
  );
}
