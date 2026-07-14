import { About } from "@/components/about";
import { BrandUniverse } from "@/components/brand-universe";
import { Contact } from "@/components/contact";
import { Footer } from "@/components/footer";
import { Hero } from "@/components/hero";
import { BrandLoader, CursorHalo } from "@/components/motion-elements";
import { Navigation } from "@/components/navigation";
import { Process } from "@/components/process";
import { SelectedWork } from "@/components/selected-work";
import { Services } from "@/components/services";

export default function Home() {
  return (
    <>
      <BrandLoader />
      <CursorHalo />
      <Navigation />
      <main id="top">
        <Hero />
        <SelectedWork />
        <Services />
        <BrandUniverse />
        <Process />
        <About />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
