import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "MOI — small studio shipping focused tools",
  description:
    "MOI is a small studio shipping focused, opinionated tools for product engineers. Specsmith is our first public output.",
};

export default function MoiLandingStub() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-8 px-6 py-24">
      <header>
        <span className="text-sm font-semibold tracking-wide text-slate-500 uppercase">
          MOI
        </span>
      </header>
      <section className="flex flex-col gap-6">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          A small studio shipping focused tools.
        </h1>
        <p className="text-base text-slate-600 dark:text-slate-300">
          MOI is a small studio shipping focused, opinionated tools for product
          engineers and tech leads. We prefer narrow scope, fast iteration, and
          tools we use ourselves. Our first public output is{" "}
          <Link href="/" className="underline underline-offset-4">
            Specsmith
          </Link>
          , a tool that turns rough product notes into a tight engineering spec.
        </p>
      </section>
      <footer className="mt-auto pt-8 text-xs text-slate-500 dark:text-slate-400">
        v0 stub — this page exists so the &ldquo;built by MOI&rdquo; backlink
        lands somewhere meaningful.
      </footer>
    </main>
  );
}
