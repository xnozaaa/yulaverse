"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Logo } from "./logo";

const navigation = [
  { label: "Work", href: "/#work" },
  { label: "Services", href: "/#services" },
  { label: "Process", href: "/#process" },
  { label: "About", href: "/#about" },
  { label: "Contact", href: "/#contact" },
];

export function Navigation({ forceSolid = false }: { forceSolid?: boolean }) {
  const [scrolled, setScrolled] = useState(forceSolid);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const reduceMotion = useReducedMotion();
  const solid = forceSolid || scrolled;

  useEffect(() => {
    if (forceSolid) return;
    const update = () => setScrolled(window.scrollY > 48);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [forceSolid]);

  useEffect(() => {
    if (!menuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const dialogFocusable = Array.from(
      menuRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ) ?? [],
    );
    const focusable = [menuButtonRef.current, ...dialogFocusable].filter(
      (element): element is HTMLElement => Boolean(element),
    );
    focusable[0]?.focus();

    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        return;
      }
      if (event.key !== "Tab" || !focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeydown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeydown);
    };
  }, [menuOpen]);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 border-b transition-all duration-500 ${
          menuOpen ? "z-[70]" : "z-50"
        } ${
          solid
            ? "border-ink/10 bg-ivory/95 py-1 text-ink backdrop-blur-md"
            : "border-transparent bg-transparent py-3 text-ivory"
        }`}
      >
        <div className="site-shell flex h-[68px] items-center justify-between gap-8">
          <Link
            href="/"
            aria-label="Yulaverse Studio home"
            className={`shrink-0 transition-opacity ${menuOpen ? "opacity-0" : ""}`}
          >
            <Logo
              variant={solid ? "dark" : "light"}
              className="h-[62px] w-[150px] object-contain object-left sm:w-[180px]"
              priority
            />
          </Link>

          <nav
            aria-label="Primary navigation"
            className="hidden items-center gap-7 lg:flex"
          >
            {navigation.map((item) => (
              <Link className="nav-link" href={item.href} key={item.label}>
                {item.label}
              </Link>
            ))}
            <Link
              href="/#contact"
              className={solid ? "button-small-dark" : "button-small-light"}
            >
              Start a project
            </Link>
          </nav>

          <button
            ref={menuButtonRef}
            type="button"
            className="relative z-[70] grid size-11 place-items-center rounded-full border border-current/30 lg:hidden"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className="sr-only">
              {menuOpen ? "Close menu" : "Open menu"}
            </span>
            <span className="grid gap-1.5">
              <span
                className={`block h-px w-5 bg-current transition-transform ${menuOpen ? "translate-y-[3.5px] rotate-45 text-ivory" : ""}`}
              />
              <span
                className={`block h-px w-5 bg-current transition-transform ${menuOpen ? "-translate-y-[3.5px] -rotate-45 text-ivory" : ""}`}
              />
            </span>
          </button>
        </div>
      </header>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            id="mobile-menu"
            ref={menuRef}
            role="dialog"
            aria-modal="true"
            aria-label="Mobile navigation"
            className="fixed inset-0 z-[60] overflow-y-auto bg-ink text-ivory lg:hidden"
            initial={reduceMotion ? false : { clipPath: "inset(0 0 100% 0)" }}
            animate={{ clipPath: "inset(0 0 0% 0)" }}
            exit={
              reduceMotion ? { opacity: 0 } : { clipPath: "inset(0 0 100% 0)" }
            }
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="site-shell flex min-h-full flex-col pb-10 pt-28">
              <Logo variant="monogram-light" className="mb-10 h-auto w-24" />
              <nav
                aria-label="Mobile navigation"
                className="flex flex-1 flex-col"
              >
                {navigation.map((item, index) => (
                  <Link
                    className="flex items-center justify-between border-t border-ivory/15 py-4 text-4xl font-extrabold tracking-[-0.05em]"
                    href={item.href}
                    key={item.label}
                    onClick={() => setMenuOpen(false)}
                  >
                    {item.label}
                    <span className="text-xs font-medium tracking-[0.18em] text-gold">
                      0{index + 1}
                    </span>
                  </Link>
                ))}
              </nav>
              <Link
                href="/#contact"
                className="button-primary mt-8 w-full justify-center"
                onClick={() => setMenuOpen(false)}
              >
                Start a project
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
