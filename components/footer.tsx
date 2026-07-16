import Link from "next/link";
import { ArrowUpRight } from "./icons";
import { Logo } from "./logo";

const footerNavigation = [
  ["Work", "/#work"],
  ["Services", "/#services"],
  ["Process", "/#process"],
  ["About", "/#about"],
  ["Contact", "/#contact"],
];

export function Footer() {
  return (
    <footer className="border-t border-ivory/15 bg-ink pb-8 text-ivory">
      <div className="site-shell">
        <div className="grid gap-12 py-16 md:grid-cols-12 md:py-24">
          <div className="md:col-span-5">
            <Logo variant="light" className="h-auto w-64 max-w-full" />
            <a
              href="mailto:yulaversestudio@gmail.com"
              className="mt-8 inline-flex items-center gap-3 border-b border-ivory/35 pb-2 text-xl font-bold"
            >
              yulaversestudio@gmail.com
              <ArrowUpRight className="size-5" />
            </a>
          </div>

          <nav
            aria-label="Footer navigation"
            className="md:col-span-2 md:col-start-7"
          >
            <p className="eyebrow text-ivory/40">Navigate</p>
            <ul className="mt-5 space-y-3">
              {footerNavigation.map(([label, href]) => (
                <li key={label}>
                  <Link className="footer-link" href={href}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-start justify-end md:col-span-2 md:col-start-11">
            <a
              href="#main-content"
              className="footer-orbit group grid size-28 place-items-center rounded-full border border-ivory/20"
              aria-label="Back to top"
            >
              <Logo
                variant="monogram-light"
                className="h-auto w-16 transition-transform duration-500 group-hover:-translate-y-1 group-hover:scale-105"
              />
            </a>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-ivory/15 pt-6 text-[0.65rem] uppercase tracking-[0.16em] text-ivory/40 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} Yulaverse Studio. All rights reserved.
          </p>
          <p>Brand identities / Premium websites / Creative direction</p>
        </div>
      </div>
    </footer>
  );
}
