import { NextResponse } from "next/server";
import { handleAIRequest } from "@/lib/ai-backend";

export async function POST(req: Request) {
  try {
    const { question, image, mode } = await req.json();

    if (!question && !image) {
      return NextResponse.json({ error: "No question provided" }, { status: 400 });
    }

    // Use the centralized AI backend which includes:
    // 1. Routing (8B vs 70B)
    // 2. Image handling (OCR + Scout)
    // 3. Modes (Chapter vs Global)
    const result = await handleAIRequest(question || "", image, mode);

    return NextResponse.json({ 
      result: result.answer,
      model_used: result.model_used,
      cached: result.cached
    });

  } catch (error: any) {
    console.error("EXPLAIN API ERROR:", error);
    return NextResponse.json({ error: error.message || "Failed to respond." }, { status: 500 });
  }
}
