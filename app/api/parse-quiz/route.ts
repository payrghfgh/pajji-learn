import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { content } = await req.json();
    if (!content || typeof content !== "string") {
      return NextResponse.json({ error: "No content provided" }, { status: 400 });
    }
    // AI parsing is intentionally disabled to avoid paid usage.
    // Frontend already falls back to the free local parser.
    return NextResponse.json(
      { error: "AI parse disabled. Using free local parser fallback." },
      { status: 503 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "AI parse disabled. Using free local parser fallback." }, { status: 503 });
  }
}
