"use client";

import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "framer-motion";
import Link from "next/link";
import { useEffect, type MouseEvent, type ReactNode } from "react";
import { Logo } from "./logo";

export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={false}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.18 }}
      transition={{ duration: 0.72, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function MagneticLink({
  href,
  children,
  className = "button-primary",
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 220, damping: 18, mass: 0.35 });
  const springY = useSpring(y, { stiffness: 220, damping: 18, mass: 0.35 });

  function handleMove(event: MouseEvent<HTMLAnchorElement>) {
    if (reduceMotion) return;
    const rect = event.currentTarget.getBoundingClientRect();
    x.set((event.clientX - rect.left - rect.width / 2) * 0.14);
    y.set((event.clientY - rect.top - rect.height / 2) * 0.14);
  }

  return (
    <motion.div style={{ x: springX, y: springY }}>
      <Link
        href={href}
        className={className}
        onMouseMove={handleMove}
        onMouseLeave={() => {
          x.set(0);
          y.set(0);
        }}
      >
        {children}
      </Link>
    </motion.div>
  );
}

export function BrandLoader() {
  return (
    <div
      aria-hidden="true"
      className="brand-loader fixed inset-0 z-[100] grid place-items-center bg-ink"
    >
      <div className="brand-loader-mark">
        <Logo variant="monogram-light" className="h-auto w-32" priority />
      </div>
    </div>
  );
}

export function CursorHalo() {
  const reduceMotion = useReducedMotion();
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const smoothX = useSpring(x, { stiffness: 420, damping: 36 });
  const smoothY = useSpring(y, { stiffness: 420, damping: 36 });

  useEffect(() => {
    if (reduceMotion || !window.matchMedia("(pointer: fine)").matches) return;
    const move = (event: PointerEvent) => {
      x.set(event.clientX - 10);
      y.set(event.clientY - 10);
    };
    window.addEventListener("pointermove", move);
    return () => window.removeEventListener("pointermove", move);
  }, [reduceMotion, x, y]);

  if (reduceMotion) return null;

  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-[90] hidden size-5 rounded-full border border-gold/70 mix-blend-difference lg:block"
      style={{ x: smoothX, y: smoothY }}
    />
  );
}
