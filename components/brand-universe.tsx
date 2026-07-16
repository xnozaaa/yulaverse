"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useRef, useState, type KeyboardEvent } from "react";
import { Logo } from "./logo";

const universeServices = [
  {
    name: "Brand Strategy",
    description:
      "Position the brand with a clear idea, a distinct point of view and a sharper reason to choose it.",
  },
  {
    name: "Identity",
    description:
      "Build a recognisable visual and verbal system that stays coherent as the business expands.",
  },
  {
    name: "Website",
    description:
      "Turn the strategy into a focused digital experience that earns trust and moves people to act.",
  },
  {
    name: "Content Direction",
    description:
      "Create a repeatable visual language for launches, campaigns, social content and everyday communication.",
  },
  {
    name: "Launch Support",
    description:
      "Prepare the files, guidance and rollout details needed to introduce the new brand with confidence.",
  },
];

export function BrandUniverse() {
  const [active, setActive] = useState(0);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const reduceMotion = useReducedMotion();

  function handleTabKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) {
    let nextIndex: number | undefined;

    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      nextIndex = (index + 1) % universeServices.length;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      nextIndex =
        (index - 1 + universeServices.length) % universeServices.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = universeServices.length - 1;
    }

    if (nextIndex === undefined) return;
    event.preventDefault();
    setActive(nextIndex);
    tabRefs.current[nextIndex]?.focus();
  }

  return (
    <section className="section-pad overflow-hidden bg-ivory text-ink">
      <div className="site-shell">
        <div className="section-heading-grid border-t border-ink/20 pt-5">
          <p className="eyebrow text-indigo">04 / Brand universe</p>
          <h2 className="display-heading max-w-5xl">
            Everything your brand needs to exist in its own universe.
          </h2>
        </div>

        <div className="universe-layout mt-16 md:mt-24">
          <div
            className="universe-stage"
            role="tablist"
            aria-label="Brand services"
          >
            <motion.div
              className="universe-orbit universe-orbit--outer"
              aria-hidden="true"
              animate={reduceMotion ? undefined : { rotate: active * 37 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            />
            <motion.div
              className="universe-orbit universe-orbit--inner"
              aria-hidden="true"
              animate={reduceMotion ? undefined : { rotate: active * -48 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            />
            <div className="universe-axis" aria-hidden="true" />
            <div className="universe-core">
              <Logo variant="monogram-dark" className="h-auto w-full" />
            </div>

            {universeServices.map((service, index) => (
              <button
                key={service.name}
                ref={(element) => {
                  tabRefs.current[index] = element;
                }}
                type="button"
                role="tab"
                id={`universe-tab-${index}`}
                aria-selected={active === index}
                aria-controls="universe-panel"
                tabIndex={active === index ? 0 : -1}
                className={`universe-node universe-node--${index + 1} ${active === index ? "is-active" : ""}`}
                onClick={() => setActive(index)}
                onKeyDown={(event) => handleTabKeyDown(event, index)}
              >
                <span className="universe-node-index">0{index + 1}</span>
                {service.name}
              </button>
            ))}
          </div>

          <div className="universe-copy">
            <p className="eyebrow text-ink/45">Selected capability</p>
            <div
              id="universe-panel"
              role="tabpanel"
              aria-live="polite"
              aria-labelledby={`universe-tab-${active}`}
              className="mt-7 min-h-[220px]"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={universeServices[active].name}
                  initial={reduceMotion ? false : { opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduceMotion ? undefined : { opacity: 0, y: -12 }}
                  transition={{ duration: 0.38 }}
                >
                  <span className="text-xs font-bold tracking-[0.2em] text-indigo">
                    0{active + 1}
                  </span>
                  <h3 className="mt-4 text-4xl font-extrabold tracking-[-0.055em] sm:text-5xl">
                    {universeServices[active].name}
                  </h3>
                  <p className="mt-6 max-w-lg text-lg leading-8 text-ink/65">
                    {universeServices[active].description}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
            <p className="mt-8 border-t border-ink/20 pt-5 text-xs uppercase leading-5 tracking-[0.16em] text-ink/45">
              Select a capability to explore the system.
            </p>
          </div>
        </div>

        <noscript>
          <ul className="mt-10 grid gap-4">
            {universeServices.map((service) => (
              <li className="border-t border-ink/20 pt-4" key={service.name}>
                <strong>{service.name}</strong>: {service.description}
              </li>
            ))}
          </ul>
        </noscript>
      </div>
    </section>
  );
}
