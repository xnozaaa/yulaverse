"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowDown, ArrowUpRight } from "./icons";
import { Logo } from "./logo";
import { MagneticLink } from "./motion-elements";

const strip =
  "Brand Identity — Web Design — Creative Direction — Digital Experiences — ";

export function Hero() {
  const reduceMotion = useReducedMotion();
  const reveal = reduceMotion
    ? {}
    : {
        initial: false,
        animate: { opacity: 1, y: 0 },
      };

  return (
    <section className="relative flex min-h-[100svh] flex-col overflow-hidden bg-ink text-ivory">
      <div className="hero-grid pointer-events-none absolute inset-0 opacity-30" />
      <div className="site-shell relative flex flex-1 flex-col justify-end pb-24 pt-32 sm:pb-28 lg:pb-32">
        <div className="grid items-end gap-12 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <motion.p
              className="eyebrow mb-6 text-gold"
              {...reveal}
              transition={{ duration: 0.7, delay: 0.15 }}
            >
              Independent creative studio / Working worldwide
            </motion.p>
            <h1
              className="hero-heading"
              aria-label="Design a universe your brand can own."
            >
              {["Design a universe", "your brand can own."].map(
                (line, index) => (
                  <span className="block overflow-hidden" key={line}>
                    <motion.span
                      className="block"
                      initial={false}
                      animate={{ y: 0 }}
                      transition={{
                        duration: 0.9,
                        delay: 0.15 + index * 0.12,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                    >
                      {line}
                    </motion.span>
                  </span>
                ),
              )}
            </h1>
          </div>

          <div className="lg:col-span-4 lg:pb-2">
            <motion.div
              className="hero-mark-wrap mx-auto mb-6 w-full max-w-[440px] lg:ml-auto lg:mr-0"
              initial={false}
              animate={{ opacity: 1, clipPath: "inset(0% 0 0 0)" }}
              transition={{
                duration: 0.85,
                delay: 0.42,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <Logo
                variant="monogram-light"
                className="relative z-10 h-auto w-full"
                priority
              />
            </motion.div>
            <motion.p
              className="max-w-md text-base leading-7 text-ivory/68"
              {...reveal}
              transition={{ duration: 0.7, delay: 0.48 }}
            >
              Distinctive identities and high-end digital experiences for
              ambitious brands ready to stand apart.
            </motion.p>
            <motion.div
              className="mt-8 flex flex-wrap items-center gap-6"
              {...reveal}
              transition={{ duration: 0.7, delay: 0.56 }}
            >
              <MagneticLink href="#contact">Start a project</MagneticLink>
              <a href="#work" className="text-link group">
                Explore our work
                <ArrowUpRight className="size-5 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" />
              </a>
            </motion.div>
          </div>
        </div>

        <a
          href="#work"
          className="absolute bottom-6 left-5 flex items-center gap-3 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-ivory/55 sm:left-8 xl:left-10"
        >
          <ArrowDown className="size-5 animate-soft-bounce" />
          Scroll to explore
        </a>
      </div>

      <div
        className="border-y border-ivory/15 py-3.5"
        aria-label="Studio services"
      >
        <div className="service-marquee">
          <div className="service-marquee-track">
            <span>{strip}</span>
            <span aria-hidden="true">{strip}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
