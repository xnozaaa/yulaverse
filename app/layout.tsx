import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-manrope",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://yulaverse.vercel.app"),
  title: {
    default: "Yulaverse Studio — Brand identities & premium websites",
    template: "%s — Yulaverse Studio",
  },
  description:
    "Yulaverse Studio creates distinctive brand identities and premium websites for startups ready to look established, trusted and unforgettable.",
  openGraph: {
    title: "Yulaverse Studio — Design a universe your brand can own.",
    description:
      "Distinctive identities and high-end digital experiences for ambitious brands ready to stand apart.",
    type: "website",
    siteName: "Yulaverse Studio",
  },
  icons: {
    icon: "/brand/official-monogram-gold.png",
    apple: "/brand/official-monogram-gold.png",
  },
};

export const viewport: Viewport = {
  colorScheme: "dark light",
  themeColor: "#0B0D12",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={manrope.variable}>
      <body>{children}</body>
    </html>
  );
}
