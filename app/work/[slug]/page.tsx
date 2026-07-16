import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CaseStudyVisual } from "@/components/case-study-visual";
import { Footer } from "@/components/footer";
import { ArrowUpRight } from "@/components/icons";
import { Navigation } from "@/components/navigation";
import { caseStudies, getCaseStudy } from "@/data/case-studies";

type PageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return caseStudies.map((study) => ({ slug: study.slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const study = getCaseStudy((await params).slug);
  if (!study) return {};
  return {
    title: `${study.name} — Selected project`,
    description: study.summary,
    alternates: {
      canonical: `/work/${study.slug}`,
    },
    openGraph: {
      title: `${study.name} — Yulaverse Studio project`,
      description: study.summary,
      url: `/work/${study.slug}`,
    },
  };
}

export default async function CaseStudyPage({ params }: PageProps) {
  const study = getCaseStudy((await params).slug);
  if (!study) notFound();

  const index = caseStudies.findIndex((item) => item.slug === study.slug);
  const nextStudy = caseStudies[(index + 1) % caseStudies.length];

  return (
    <>
      <Navigation forceSolid />
      <main id="main-content" className="bg-ivory text-ink" tabIndex={-1}>
        <section className="pb-16 pt-36 sm:pt-44 md:pb-24">
          <div className="site-shell">
            <Link
              href="/#work"
              className="eyebrow inline-flex border-b border-ink/30 pb-2 text-indigo"
            >
              ← Back to selected work
            </Link>
            <div className="mt-12 grid gap-12 border-t border-ink/20 pt-5 lg:grid-cols-12">
              <p className="eyebrow text-indigo lg:col-span-3">
                {study.label} / 0{index + 1}
              </p>
              <div className="lg:col-span-9">
                <h1 className="display-heading">{study.name}</h1>
                <p className="mt-8 max-w-3xl text-xl leading-8 text-ink/65">
                  {study.summary}
                </p>
                <a
                  href={study.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-8 inline-flex items-center gap-2 border-b border-indigo/40 pb-2 text-sm font-bold text-indigo"
                >
                  Visit live project <ArrowUpRight className="size-4" />
                </a>
              </div>
            </div>

            <div className="mt-14 md:mt-20">
              <CaseStudyVisual priority study={study} />
            </div>

            <div className="mt-8 grid gap-5 border-y border-ink/20 py-6 text-xs font-semibold uppercase tracking-[0.15em] sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <span className="block text-ink/40">Industry</span>
                {study.industry}
              </div>
              <div>
                <span className="block text-ink/40">Services</span>
                {study.services.join(" / ")}
              </div>
              <div>
                <span className="block text-ink/40">Portfolio</span>
                {study.label}
              </div>
              <div className="lg:text-right">
                <span className="block text-ink/40">Website</span>
                <a
                  href={study.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 border-b border-ink/25"
                >
                  View live <ArrowUpRight className="size-3" />
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="section-pad border-t border-ink/15">
          <div className="site-shell grid gap-12 lg:grid-cols-12">
            <p className="eyebrow text-indigo lg:col-span-3">
              Project direction
            </p>
            <div className="lg:col-span-7">
              <h2 className="text-4xl font-extrabold tracking-[-0.055em] sm:text-6xl">
                The thinking behind the work.
              </h2>
              <p className="mt-8 text-xl leading-9 text-ink/65">
                {study.direction}
              </p>
              <div className="mt-14 grid gap-px overflow-hidden border border-ink/15 bg-ink/15 sm:grid-cols-3">
                {study.highlights.map((highlight) => (
                  <div className="bg-ivory p-6" key={highlight.label}>
                    <strong className="block text-4xl font-extrabold tracking-[-0.05em] text-indigo">
                      {highlight.value}
                    </strong>
                    <p className="mt-3 text-sm leading-6 text-ink/60">
                      {highlight.label}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-14 grid gap-8 border-t border-ink/20 pt-6 sm:grid-cols-3">
                {study.services.map((service, serviceIndex) => (
                  <div key={service}>
                    <span className="text-xs font-bold tracking-[0.18em] text-indigo">
                      0{serviceIndex + 1}
                    </span>
                    <p className="mt-3 font-bold">{service}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-indigo py-16 text-ivory sm:py-24">
          <div className="site-shell flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="eyebrow text-ivory/60">Next selected project</p>
              <h2 className="mt-5 text-5xl font-extrabold tracking-[-0.06em] sm:text-7xl">
                {nextStudy.name}
              </h2>
            </div>
            <Link href={`/work/${nextStudy.slug}`} className="button-primary">
              View next project <ArrowUpRight className="size-5" />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
