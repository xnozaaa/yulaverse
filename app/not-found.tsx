import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-ink px-6 text-center text-ivory">
      <p className="eyebrow text-gold">404 / Lost in orbit</p>
      <h1 className="mt-6 max-w-3xl text-5xl font-extrabold tracking-[-0.06em] sm:text-7xl">
        This page has left the universe.
      </h1>
      <Link className="button-primary mt-10" href="/">
        Return to studio
      </Link>
    </main>
  );
}
