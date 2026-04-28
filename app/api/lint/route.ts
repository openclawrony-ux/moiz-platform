import { NextResponse } from "next/server";
import { lintMarkdown } from "@/lib/lint/lint";

const MAX_BODY_BYTES = 200_000;

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Body must be valid JSON." },
      { status: 400 },
    );
  }

  if (
    !payload ||
    typeof payload !== "object" ||
    typeof (payload as { markdown?: unknown }).markdown !== "string"
  ) {
    return NextResponse.json(
      { error: "Expected `{ markdown: string }`." },
      { status: 400 },
    );
  }

  const markdown = (payload as { markdown: string }).markdown;
  if (markdown.length > MAX_BODY_BYTES) {
    return NextResponse.json(
      { error: `Markdown exceeds ${MAX_BODY_BYTES} characters.` },
      { status: 413 },
    );
  }

  return NextResponse.json(lintMarkdown(markdown));
}
