import { Logo } from "./logo";
import { Reveal } from "./motion-elements";

const editableStory = [
  {
    label: "Studio story",
    text: "Add the origin of Yulaverse Studio and the perspective that shapes the practice.",
  },
  {
    label: "Japanese design",
    text: "Add the studio’s genuine connection to restraint, balance, negative space and material detail.",
  },
  {
    label: "Storytelling influence",
    text: "Add how cinematic pacing and anime-inspired visual discipline influence the work—without relying on imitation.",
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
              Small studio. Expansive thinking.
            </h2>
          </Reveal>
        </div>

        <div className="mt-20 grid gap-12 md:mt-28 lg:grid-cols-12 lg:gap-8">
          <Reveal className="lg:col-span-5">
            <div className="founder-placeholder relative aspect-[4/5] overflow-hidden bg-ink text-ivory">
              <div className="founder-grid" aria-hidden="true" />
              <div className="absolute inset-x-6 top-6 flex items-center justify-between text-[0.65rem] font-semibold uppercase tracking-[0.17em] text-ivory/55">
                <span>Portrait placeholder</span>
                <span>01 / 01</span>
              </div>
              <Logo
                variant="stacked-light"
                className="absolute left-1/2 top-1/2 h-auto w-[42%] -translate-x-1/2 -translate-y-1/2 opacity-90"
              />
              <p className="absolute bottom-6 left-6 right-6 max-w-xs text-sm leading-6 text-ivory/65">
                Replace with the founder portrait when available. This panel is
                intentionally marked as editable content.
              </p>
            </div>
          </Reveal>

          <div className="lg:col-span-6 lg:col-start-7">
            <Reveal>
              <p className="text-2xl font-medium leading-[1.35] tracking-[-0.025em] sm:text-3xl">
                Yulaverse Studio combines strategic branding, premium design and
                thoughtful digital execution to help emerging businesses compete
                with established brands.
              </p>
            </Reveal>
            <div className="mt-14">
              <div className="border-t border-ink/20 py-5">
                <p className="eyebrow text-indigo">
                  Founder introduction / Editable
                </p>
                <p className="mt-4 max-w-xl leading-7 text-ink/60">
                  Add the founder’s name, role and point of view here. No
                  personal details have been invented for this concept build.
                </p>
              </div>
              {editableStory.map((item, index) => (
                <div
                  className="grid gap-3 border-t border-ink/20 py-5 sm:grid-cols-6"
                  key={item.label}
                >
                  <span className="text-xs font-bold tracking-[0.18em] text-indigo">
                    0{index + 1}
                  </span>
                  <div className="sm:col-span-5">
                    <h3 className="font-bold">{item.label} / Editable</h3>
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
