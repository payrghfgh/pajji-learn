import { NextRequest, NextResponse } from "next/server";
import { handleAIRequest } from "@/lib/ai-backend";

export async function POST(req: NextRequest) {
  try {
    const { message, image, mode } = await req.json();

    if (!message && !image) {
      return NextResponse.json({ error: "No query or image provided" }, { status: 400 });
    }

    // Process the request using the centralized AI logic (Routing, OCR, Scout, Modes)
    const result = await handleAIRequest(message || "", image, mode);

    return NextResponse.json({ 
      reply: result.answer, 
      result: result.answer,
      model_used: result.model_used,
      cached: result.cached
    });

  } catch (error: any) {
    console.error("AI BACKEND ERROR:", error);
    return NextResponse.json({ 
      reply: "Sorry, I encountered an error processing that. " + (error.message || ""), 
      error: true 
    }, { status: 500 });
  }
}
