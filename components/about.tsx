import { Logo } from "./logo";
import { Reveal } from "./motion-elements";

const studioPrinciples = [
  {
    label: "Strategic clarity",
    text: "Start with the business, audience and point of difference so every creative decision has a reason.",
  },
  {
    label: "Distinctive systems",
    text: "Build recognisable visual languages that work consistently across brands, products and campaigns.",
  },
  {
    label: "Digital craft",
    text: "Turn the idea into responsive, accessible experiences with careful typography, motion and interaction.",
  },
];

export function About() {
  return (
    <section id="about" className="section-pad bg-ivory text-ink">
      <div className="site-shell">
        <div className="section-heading-grid border-t border-ink/20 pt-5">
          <p className="eyebrow text-indigo">06 / About</p>
          <Reveal>
            <h2 className="display-heading max-w-5xl">
              Independent studio. Built for ambitious brands.
            </h2>
          </Reveal>
        </div>

        <div className="mt-20 grid gap-12 md:mt-28 lg:grid-cols-12 lg:gap-8">
          <Reveal className="lg:col-span-5">
            <div className="studio-mark-panel relative aspect-[4/5] overflow-hidden bg-ink text-ivory">
              <div className="studio-mark-grid" aria-hidden="true" />
              <div className="absolute inset-x-6 top-6 flex items-center justify-between text-[0.65rem] font-semibold uppercase tracking-[0.17em] text-ivory/55">
                <span>Yulaverse Studio</span>
                <span>Brand + Digital</span>
              </div>
              <Logo
                variant="stacked-light"
                className="absolute left-1/2 top-1/2 h-auto w-[130%] -translate-x-1/2 -translate-y-1/2"
              />
              <p className="absolute bottom-6 left-6 right-6 max-w-sm text-sm leading-6 text-ivory/65">
                Identity systems / Digital products / Premium websites
              </p>
            </div>
          </Reveal>

          <div className="lg:col-span-6 lg:col-start-7">
            <Reveal>
              <p className="text-2xl font-medium leading-[1.35] tracking-[-0.025em] sm:text-3xl">
                Yulaverse Studio combines strategic branding, distinctive design
                and thoughtful digital execution to help growing organisations
                look established, communicate clearly and move with confidence.
              </p>
            </Reveal>
            <div className="mt-14">
              {studioPrinciples.map((item, index) => (
                <div
                  className="grid gap-3 border-t border-ink/20 py-5 sm:grid-cols-6"
                  key={item.label}
                >
                  <span className="text-xs font-bold tracking-[0.18em] text-indigo">
                    0{index + 1}
                  </span>
                  <div className="sm:col-span-5">
                    <h3 className="font-bold">{item.label}</h3>
                    <p className="mt-2 leading-7 text-ink/60">{item.text}</p>
                  </div>
                </div>
              ))}
              <div className="border-t border-ink/20" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
