import Image from "next/image";

type LogoProps = {
  variant?:
    | "dark"
    | "light"
    | "stacked"
    | "stacked-light"
    | "monogram-dark"
    | "monogram-light";
  className?: string;
  priority?: boolean;
};

const logos = {
  dark: {
    src: "/brand/logo-horizontal-dark-mono.png",
    width: 455,
    height: 205,
    alt: "Yulaverse Studio",
  },
  light: {
    src: "/brand/logo-horizontal-light.png",
    width: 440,
    height: 205,
    alt: "Yulaverse Studio",
  },
  stacked: {
    src: "/brand/logo-stacked-dark.png",
    width: 310,
    height: 370,
    alt: "Yulaverse Studio",
  },
  "stacked-light": {
    src: "/brand/logo-stacked-light.png",
    width: 230,
    height: 230,
    alt: "Yulaverse Studio",
  },
  "monogram-dark": {
    src: "/brand/monogram-dark.png",
    width: 250,
    height: 250,
    alt: "Yulaverse Studio monogram",
  },
  "monogram-light": {
    src: "/brand/monogram-light.png",
    width: 230,
    height: 165,
    alt: "Yulaverse Studio monogram",
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
        variant.startsWith("monogram")
          ? "180px"
          : "(max-width: 768px) 190px, 240px"
      }
    />
  );
}
