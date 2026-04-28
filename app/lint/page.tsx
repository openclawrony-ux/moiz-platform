"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import type { Flag, LintResult, Severity } from "@/lib/lint/types";

const SAMPLE = `# Untitled PRD

## Problem

Founders waste time on review cycles because PRD drafts are inconsistent in shape.

## User stories

- The system reviews drafts.
- The system flags missing sections.

## Success metric

Users will love it.
`;

const severityClass: Record<Severity, string> = {
  error:
    "border-red-300 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100",
  warn: "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100",
  info: "border-sky-300 bg-sky-50 text-sky-900 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-100",
};

const severityLabel: Record<Severity, string> = {
  error: "Error",
  warn: "Warning",
  info: "Info",
};

function FlagCard({ flag }: { flag: Flag }) {
  return (
    <li
      className={`flex flex-col gap-1 rounded-lg border px-4 py-3 ${severityClass[flag.severity]}`}
    >
      <div className="flex items-center justify-between gap-2 text-xs font-semibold tracking-wide uppercase">
        <span>{severityLabel[flag.severity]}</span>
        {typeof flag.line === "number" ? (
          <a
            href={`#line-${flag.line}`}
            className="underline-offset-2 hover:underline"
          >
            line {flag.line}
          </a>
        ) : null}
      </div>
      <div className="text-sm font-medium">{flag.code}</div>
      <p className="text-sm leading-relaxed">{flag.message}</p>
    </li>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const tone =
    score >= 90
      ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-100"
      : score >= 60
        ? "bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-100"
        : "bg-red-100 text-red-900 dark:bg-red-950/50 dark:text-red-100";
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${tone}`}
      aria-label={`Score ${score} of 100`}
    >
      {score} / 100
    </span>
  );
}

export default function LintPage() {
  const [markdown, setMarkdown] = useState(SAMPLE);
  const [result, setResult] = useState<LintResult | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runLint = useCallback(async () => {
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/lint", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ markdown }),
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `Request failed: ${response.status}`);
      }
      const data = (await response.json()) as LintResult;
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setPending(false);
    }
  }, [markdown]);

  const numberedLines = markdown.split("\n");

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-10 px-6 py-16 sm:py-24">
      <header className="flex flex-col gap-3">
        <nav className="flex gap-2 text-sm font-medium" aria-label="Modes">
          <Link
            href="/"
            className="rounded-full border border-slate-200 px-3 py-1 text-slate-600 transition hover:border-slate-400 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-500"
          >
            Generate
          </Link>
          <span
            aria-current="page"
            className="rounded-full border border-slate-900 bg-slate-900 px-3 py-1 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900"
          >
            Lint
          </span>
        </nav>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Lint a PRD draft
        </h1>
        <p className="max-w-2xl text-base text-slate-600 dark:text-slate-300">
          Paste a draft. Specsmith runs a deterministic rule set —
          problem-statement, target user, user stories, non-goals, and a
          quantitative success metric — and tells you exactly what to fix.
        </p>
      </header>

      <section className="grid gap-8 lg:grid-cols-2">
        <div className="flex flex-col gap-3">
          <label
            htmlFor="prd-source"
            className="text-sm font-medium text-slate-700 dark:text-slate-200"
          >
            Your draft
          </label>
          <textarea
            id="prd-source"
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            rows={22}
            spellCheck={false}
            className="w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 font-mono text-sm leading-relaxed text-slate-900 shadow-sm transition outline-none placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={runLint}
              disabled={pending || markdown.trim().length === 0}
              className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900"
            >
              {pending ? "Linting…" : "Run lint"}
            </button>
            {result ? <ScoreBadge score={result.score} /> : null}
          </div>
          {error ? (
            <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100">
              {error}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-slate-700 dark:text-slate-200">
            Flags
          </h2>
          {!result ? (
            <p className="rounded-lg border border-dashed border-slate-300 px-3 py-6 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
              Run lint to see flags here.
            </p>
          ) : result.flags.length === 0 ? (
            <p className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-6 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100">
              No flags. This draft passes the v0 rule set.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {result.flags.map((flag) => (
                <FlagCard key={flag.code} flag={flag} />
              ))}
            </ul>
          )}
        </div>
      </section>

      {result && result.flags.length > 0 ? (
        <section
          aria-labelledby="annotated-source"
          className="flex flex-col gap-3"
        >
          <h2
            id="annotated-source"
            className="text-sm font-medium text-slate-700 dark:text-slate-200"
          >
            Source (line anchors)
          </h2>
          <pre className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs leading-relaxed dark:border-slate-800 dark:bg-slate-900/60">
            {numberedLines.map((line, i) => {
              const lineNumber = i + 1;
              const flag = result.flags.find((f) => f.line === lineNumber);
              return (
                <code
                  key={lineNumber}
                  id={`line-${lineNumber}`}
                  className={`grid grid-cols-[3rem_1fr] gap-3 ${flag ? "bg-amber-100/60 dark:bg-amber-900/30" : ""}`}
                >
                  <span className="text-right text-slate-400 select-none">
                    {lineNumber}
                  </span>
                  <span className="whitespace-pre-wrap">{line || " "}</span>
                </code>
              );
            })}
          </pre>
        </section>
      ) : null}
    </main>
  );
}
