export const landingCopy = {
  product: "Specsmith",
  hero: {
    eyebrow: "v0 — early preview",
    title: "Turn rough product notes into a tight engineering spec.",
    subtitle:
      "Paste a brain dump, a meeting transcript, or a PRD draft. Specsmith returns a structured, reviewable spec your team can actually build from.",
  },
  pasteForm: {
    label: "Paste your raw notes",
    placeholder:
      'e.g. "We need a way for users to invite teammates. Should support email + magic link. Free tier capped at 3 invites..."',
    helper: "Plain text works best. We'll handle the structure.",
    submit: "Generate spec",
    submitDisabledHint:
      "The generator lands in the next milestone — this is the v0 shell.",
  },
  whatIsThis: {
    title: "What is this?",
    body: "Specsmith is the smallest tool that takes unstructured product input and produces an opinionated, reviewable spec. The goal is fewer ambiguous tickets and fewer rebuilds. This page is the v0 shell — copy and structure now, generation next.",
    bullets: [
      "Designed for product engineers and tech leads who own the spec themselves.",
      "Output is markdown you own — copy it, paste it into Linear, edit it freely.",
      "No login, no team workspace yet. One paste in, one spec out.",
    ],
  },
  footer: {
    note: "v0 skeleton — generated landing copy is intentionally a stub.",
  },
} as const;

export type LandingCopy = typeof landingCopy;
