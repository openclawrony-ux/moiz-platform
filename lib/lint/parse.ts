export interface Heading {
  level: number;
  text: string;
  line: number;
}

export interface Section {
  heading: Heading;
  body: string;
  bodyStartLine: number;
  bodyEndLine: number;
}

export interface ParsedDoc {
  headings: Heading[];
  sections: Section[];
  rawLines: string[];
}

const HEADING_RE = /^(#{1,6})\s+(.+?)\s*#*\s*$/;
const FENCE_RE = /^(```|~~~)/;

export function parse(markdown: string): ParsedDoc {
  const rawLines = markdown.split(/\r?\n/);
  const headings: Heading[] = [];
  let inFence = false;

  rawLines.forEach((line, idx) => {
    if (FENCE_RE.test(line)) {
      inFence = !inFence;
      return;
    }
    if (inFence) return;
    const match = HEADING_RE.exec(line);
    if (!match) return;
    headings.push({
      level: match[1].length,
      text: match[2].trim(),
      line: idx + 1,
    });
  });

  const sections: Section[] = headings.map((heading, i) => {
    const next = headings[i + 1];
    const bodyStartLine = heading.line + 1;
    const bodyEndLine = next ? next.line - 1 : rawLines.length;
    const body = rawLines
      .slice(bodyStartLine - 1, bodyEndLine)
      .join("\n")
      .trim();
    return { heading, body, bodyStartLine, bodyEndLine };
  });

  return { headings, sections, rawLines };
}

export function findSection(
  doc: ParsedDoc,
  matchers: RegExp[],
): Section | undefined {
  for (const section of doc.sections) {
    for (const re of matchers) {
      if (re.test(section.heading.text)) return section;
    }
  }
  return undefined;
}
