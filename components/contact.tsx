import { ContactForm } from "./contact-form";
import { Reveal } from "./motion-elements";

export function Contact() {
  return (
    <section id="contact" className="section-pad bg-ink text-ivory">
      <div className="site-shell">
        <div className="grid gap-12 border-t border-ivory/20 pt-5 lg:grid-cols-12">
          <p className="eyebrow text-gold lg:col-span-3">
            07 / Start a project
          </p>
          <div className="lg:col-span-9">
            <Reveal>
              <h2 className="display-heading max-w-5xl">
                Ready to build your universe?
              </h2>
            </Reveal>
            <p className="mt-8 max-w-2xl text-lg leading-8 text-ivory/65">
              Tell us where your business is now—and where you want the brand to
              take you.
            </p>
          </div>
        </div>

        <div className="mt-16 grid gap-12 lg:mt-24 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <p className="text-sm leading-6 text-ivory/55">
              Prefer email? Write directly to
              <br />
              <a
                className="mt-2 inline-block border-b border-gold/60 pb-1 font-semibold text-ivory"
                href="mailto:hello@yulaverse.studio"
              >
                hello@yulaverse.studio
              </a>
            </p>
          </div>
          <div className="lg:col-span-9">
            <ContactForm />
          </div>
        </div>
      </div>
    </section>
  );
}
