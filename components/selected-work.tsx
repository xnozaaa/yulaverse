import Link from "next/link";
import { caseStudies } from "@/data/case-studies";
import { ArrowUpRight } from "./icons";
import { Reveal } from "./motion-elements";
import { CaseStudyVisual } from "./case-study-visual";

export function SelectedWork() {
  return (
    <section id="work" className="section-pad bg-ivory text-ink">
      <div className="site-shell">
        <div className="section-heading-grid border-t border-ink/20 pt-5">
          <p className="eyebrow text-indigo">02 / Selected work</p>
          <Reveal>
            <h2 className="display-heading max-w-5xl">
              Identity worlds, built to be remembered.
            </h2>
            <p className="mt-8 max-w-2xl text-lg leading-8 text-ink/60">
              Yulaverse Studio creates distinctive brand identities and premium
              websites for startups ready to look established, trusted and
              unforgettable.
            </p>
          </Reveal>
        </div>

        <div className="mt-20 space-y-28 md:mt-28 md:space-y-40">
          {caseStudies.map((study, index) => (
            <Reveal key={study.slug}>
              <article className="case-card group">
                <div className="grid gap-5 border-y border-ink/20 py-4 text-[0.68rem] font-semibold uppercase tracking-[0.15em] sm:grid-cols-4">
                  <div>
                    <span className="block text-ink/45">Project</span>
                    <span>{study.name}</span>
                  </div>
                  <div>
                    <span className="block text-ink/45">Industry</span>
                    <span>{study.industry}</span>
                  </div>
                  <div>
                    <span className="block text-ink/45">Services</span>
                    <span>{study.services.slice(0, 2).join(" + ")}</span>
                  </div>
                  <div className="sm:text-right">
                    <span className="block text-ink/45">Status / Year</span>
                    <span>
                      {study.label} · {study.year}
                    </span>
                  </div>
                </div>

                <Link
                  href={`/work/${study.slug}`}
                  className="case-visual-link mt-5 block overflow-hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo"
                  aria-label={`View ${study.name} concept project`}
                >
                  <CaseStudyVisual study={study} />
                </Link>

                <div className="mt-6 grid gap-6 md:grid-cols-12 md:items-start">
                  <div className="md:col-span-2">
                    <span className="text-xs font-semibold tracking-[0.18em] text-indigo">
                      0{index + 1}
                    </span>
                  </div>
                  <h3 className="text-4xl font-extrabold tracking-[-0.055em] sm:text-5xl md:col-span-4">
                    {study.name}
                  </h3>
                  <p className="max-w-xl text-base leading-7 text-ink/65 md:col-span-4">
                    {study.summary}
                  </p>
                  <Link
                    href={`/work/${study.slug}`}
                    className="group/link flex items-center justify-between gap-3 border-b border-ink/40 pb-2 text-sm font-bold md:col-span-2"
                  >
                    View project
                    <ArrowUpRight className="size-5 transition-transform group-hover/link:-translate-y-1 group-hover/link:translate-x-1" />
                  </Link>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
