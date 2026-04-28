import Link from "next/link";

import { landingCopy } from "./(landing)/copy";

export default function LandingPage() {
  const { product, hero, pasteForm, whatIsThis, footer } = landingCopy;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-12 px-6 py-16 sm:py-24">
      <header className="flex items-center justify-between">
        <span className="text-sm font-semibold tracking-wide text-slate-500 uppercase">
          {product}
        </span>
        <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-500 dark:border-slate-800 dark:text-slate-400">
          {hero.eyebrow}
        </span>
      </header>

      <section className="flex flex-col gap-4">
        <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          {hero.title}
        </h1>
        <p className="max-w-2xl text-lg text-slate-600 dark:text-slate-300">
          {hero.subtitle}
        </p>
        <nav className="flex gap-2 text-sm font-medium" aria-label="Modes">
          <span
            aria-current="page"
            className="rounded-full border border-slate-900 bg-slate-900 px-3 py-1 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900"
          >
            Generate
          </span>
          <Link
            href="/lint"
            className="rounded-full border border-slate-200 px-3 py-1 text-slate-600 transition hover:border-slate-400 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-500"
          >
            Lint a draft
          </Link>
        </nav>
      </section>

      <section
        aria-labelledby="paste-form-heading"
        className="flex flex-col gap-3"
      >
        <label
          id="paste-form-heading"
          htmlFor="raw-notes"
          className="text-sm font-medium text-slate-700 dark:text-slate-200"
        >
          {pasteForm.label}
        </label>
        <form
          className="flex flex-col gap-3"
          // No submit handler in v0 — this is the shell. The /api/generate
          // wiring lands in a follow-up issue.
          action="#"
        >
          <textarea
            id="raw-notes"
            name="raw-notes"
            rows={10}
            placeholder={pasteForm.placeholder}
            className="w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 font-mono text-sm leading-relaxed text-slate-900 shadow-sm transition outline-none placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-slate-100"
          />
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {pasteForm.helper}
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="submit"
              disabled
              aria-disabled="true"
              className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900"
            >
              {pasteForm.submit}
            </button>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {pasteForm.submitDisabledHint}
            </span>
          </div>
        </form>
      </section>

      <section
        aria-labelledby="what-is-this-heading"
        className="flex flex-col gap-4 border-t border-slate-200 pt-10 dark:border-slate-800"
      >
        <h2
          id="what-is-this-heading"
          className="text-2xl font-semibold tracking-tight"
        >
          {whatIsThis.title}
        </h2>
        <p className="text-base text-slate-600 dark:text-slate-300">
          {whatIsThis.body}
        </p>
        <ul className="flex flex-col gap-2 pl-5 text-base text-slate-600 dark:text-slate-300 [&>li]:list-disc">
          {whatIsThis.bullets.map((bullet) => (
            <li key={bullet}>{bullet}</li>
          ))}
        </ul>
      </section>

      <footer className="mt-auto flex flex-col gap-2 border-t border-slate-200 pt-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:text-slate-400">
        <span>{footer.note}</span>
        <span>
          {footer.builtBy.prefix}
          <Link
            href={footer.builtBy.href}
            className="font-medium underline underline-offset-4"
          >
            {footer.builtBy.label}
          </Link>
        </span>
      </footer>
    </main>
  );
}
