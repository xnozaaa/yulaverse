import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-manrope",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://yulaverse.co.uk"),
  title: {
    default: "Yulaverse Studio — Brand identities & premium websites",
    template: "%s — Yulaverse Studio",
  },
  description:
    "Yulaverse Studio creates distinctive brand identities, premium websites and digital experiences for ambitious businesses and organisations.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Yulaverse Studio — Design a universe your brand can own.",
    description:
      "Distinctive identities and high-end digital experiences for ambitious brands ready to stand apart.",
    type: "website",
    siteName: "Yulaverse Studio",
    locale: "en_GB",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "Yulaverse Studio — Design a universe your brand can own.",
    description:
      "Distinctive identities and high-end digital experiences for ambitious brands ready to stand apart.",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/brand/official-monogram-gold.png",
    apple: "/brand/official-monogram-gold.png",
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://yulaverse.co.uk/#organization",
      name: "Yulaverse Studio",
      url: "https://yulaverse.co.uk/",
      email: "yulaversestudio@gmail.com",
      logo: "https://yulaverse.co.uk/brand/official-monogram-gold.png",
      sameAs: ["https://www.instagram.com/yulaversestudio/"],
      description:
        "An independent creative studio creating brand identities, premium websites and digital experiences.",
      knowsAbout: [
        "Brand identity",
        "Web design",
        "Creative direction",
        "Digital experiences",
      ],
    },
    {
      "@type": "WebSite",
      "@id": "https://yulaverse.co.uk/#website",
      url: "https://yulaverse.co.uk/",
      name: "Yulaverse Studio",
      publisher: { "@id": "https://yulaverse.co.uk/#organization" },
      inLanguage: "en-GB",
    },
  ],
};

export const viewport: Viewport = {
  colorScheme: "dark light",
  themeColor: "#0C0F15",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={manrope.variable}>
      <body>
        <a className="skip-link" href="#main-content">
          Skip to main content
        </a>
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </body>
    </html>
  );
}
