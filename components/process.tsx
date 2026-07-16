import { Reveal } from "./reveal";

const stages = [
  {
    number: "01",
    title: "Discover",
    description:
      "Understand the business, audience, ambitions and competitive landscape.",
  },
  {
    number: "02",
    title: "Define",
    description: "Build the strategic and creative direction behind the brand.",
  },
  {
    number: "03",
    title: "Design",
    description: "Develop the identity and digital experience with precision.",
  },
  {
    number: "04",
    title: "Launch",
    description: "Prepare a consistent, polished system ready for the world.",
  },
];

export function Process() {
  return (
    <section id="process" className="section-pad bg-indigo text-ivory">
      <div className="site-shell">
        <div className="section-heading-grid border-t border-ivory/25 pt-5">
          <p className="eyebrow text-ivory/65">05 / Process</p>
          <Reveal>
            <h2 className="display-heading max-w-5xl">
              Clear thinking. Controlled momentum. No mystery.
            </h2>
          </Reveal>
        </div>

        <div className="mt-20 md:mt-28">
          {stages.map((stage) => (
            <Reveal key={stage.number}>
              <article className="process-row group grid gap-5 border-t border-ivory/25 py-8 sm:grid-cols-12 sm:items-start md:py-12">
                <div className="process-number sm:col-span-3">
                  {stage.number}
                </div>
                <h3 className="text-4xl font-extrabold tracking-[-0.055em] sm:col-span-4 sm:text-5xl lg:text-6xl">
                  {stage.title}
                </h3>
                <p className="max-w-lg text-base leading-7 text-ivory/70 sm:col-span-5 sm:pt-2">
                  {stage.description}
                </p>
              </article>
            </Reveal>
          ))}
          <div className="border-t border-ivory/25" />
        </div>
      </div>
    </section>
  );
}
