import { ArrowUpRight } from "./icons";
import { Reveal } from "./reveal";

const services = [
  {
    number: "01",
    title: "Brand Identity",
    description:
      "Distinctive logos and flexible identity systems designed to make new businesses memorable.",
    detail: "Strategy / Naming direction / Identity systems / Guidelines",
    accent: "service-card--gold",
  },
  {
    number: "02",
    title: "Premium Websites",
    description:
      "Conversion-focused digital experiences combining strategy, storytelling and exceptional interface design.",
    detail: "Digital strategy / UX / Interface design / Development",
    accent: "service-card--indigo",
  },
  {
    number: "03",
    title: "Creative Direction",
    description:
      "A cohesive visual direction that connects every customer touchpoint and prepares the brand for growth.",
    detail: "Campaigns / Content systems / Art direction / Launch",
    accent: "service-card--ivory",
  },
];

export function Services() {
  return (
    <section
      id="services"
      className="section-pad overflow-hidden bg-ink text-ivory"
    >
      <div className="site-shell">
        <div className="section-heading-grid border-t border-ivory/20 pt-5">
          <p className="eyebrow text-gold">03 / What we create</p>
          <Reveal>
            <h2 className="display-heading max-w-5xl">
              The clarity to look established. The character to stand apart.
            </h2>
          </Reveal>
        </div>

        <div className="mt-20 grid border-l border-t border-ivory/15 md:mt-28 md:grid-cols-3">
          {services.map((service) => (
            <Reveal key={service.number}>
              <article
                className={`service-card ${service.accent} group flex min-h-[430px] flex-col border-b border-r border-ivory/15 p-6 outline-none sm:p-8`}
              >
                <div className="service-card-grid" aria-hidden="true" />
                <div className="service-card-orbit" aria-hidden="true" />
                <div className="relative z-10 flex items-start justify-between">
                  <span className="text-xs font-bold tracking-[0.2em] text-gold">
                    {service.number}
                  </span>
                  <ArrowUpRight className="size-6 transition-transform duration-500 group-hover:-translate-y-1 group-hover:translate-x-1" />
                </div>
                <div className="relative z-10 mt-auto">
                  <h3 className="max-w-xs text-4xl font-extrabold tracking-[-0.055em] sm:text-5xl">
                    {service.title}
                  </h3>
                  <p className="mt-6 max-w-sm leading-7 text-ivory/65">
                    {service.description}
                  </p>
                  <p className="mt-8 border-t border-ivory/20 pt-4 text-[0.66rem] font-semibold uppercase leading-5 tracking-[0.16em] text-ivory/45">
                    {service.detail}
                  </p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
