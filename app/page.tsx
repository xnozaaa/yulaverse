import { About } from "@/components/about";
import { BrandUniverse } from "@/components/brand-universe";
import { Contact } from "@/components/contact";
import { Footer } from "@/components/footer";
import { Hero } from "@/components/hero";
import { CursorHalo } from "@/components/motion-elements";
import { Navigation } from "@/components/navigation";
import { Process } from "@/components/process";
import { SelectedWork } from "@/components/selected-work";
import { Services } from "@/components/services";

export default function Home() {
  return (
    <>
      <CursorHalo />
      <Navigation />
      <main id="main-content" tabIndex={-1}>
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
