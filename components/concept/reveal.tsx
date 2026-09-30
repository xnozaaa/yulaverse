"use client";

import { useEffect, useRef, type ReactNode } from "react";

/** Content is visible by default; motion is a progressive enhancement. */
export function Reveal({
  as: Tag = "div",
  className,
  children,
}: {
  as?: "div" | "article" | "h2";
  className?: string;
  children: ReactNode;
}) {
  const element = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const host = element.current;
    if (!host || !window.IntersectionObserver || !host.animate) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let animation: Animation | undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        if (reduced.matches || host.closest('[data-motion="off"]')) return;
        animation = host.animate(
          [
            { opacity: 0, transform: "translateY(35px)" },
            { opacity: 1, transform: "translateY(0)" },
          ],
          { duration: 800, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
        );
      },
      { threshold: 0.15 },
    );
    observer.observe(host);
    return () => {
      observer.disconnect();
      animation?.cancel();
    };
  }, []);

  return (
    <Tag
      ref={(node) => {
        element.current = node;
      }}
      className={className}
    >
      {children}
    </Tag>
  );
}
