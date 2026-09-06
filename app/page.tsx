import type { Metadata, Viewport } from "next";
import { UniverseConcept } from "@/components/concept/universe-concept";

export const metadata: Metadata = {
  title: {
    absolute: "Yulaverse Studio — Brand identity & digital experiences",
  },
  description:
    "An independent creative studio building distinctive brand identities, premium websites and extraordinary digital experiences for ambitious businesses.",
  alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#09090d",
};

export default function Home() {
  return <UniverseConcept />;
}
