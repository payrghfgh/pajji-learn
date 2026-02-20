import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_KEY = process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENAI_API_KEY || "";
const genAI = new GoogleGenerativeAI(GEMINI_KEY);

const MODEL_CANDIDATES = [
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-1.5-flash",
];

export async function POST(req: Request) {
  try {
    if (!GEMINI_KEY) {
      return NextResponse.json({ error: "Missing GOOGLE_API_KEY / GOOGLE_GENAI_API_KEY" }, { status: 500 });
    }

    const { content } = await req.json();
    if (!content || typeof content !== "string") {
      return NextResponse.json({ error: "No content provided" }, { status: 400 });
    }

    const prompt = `
Convert the following educational quiz text into strict JSON.

Return only valid JSON in this exact format:
{
  "questions": [
    {
      "type": "mcq" | "oneWord" | "caseStudy" | "pictureStudy",
      "question": "string",
      "options": ["string", "string", "string", "string"],
      "correctIndex": 0,
      "answer": "string",
      "caseText": "string",
      "imageUrl": "string",
      "explanation": "string"
    }
  ]
}

Rules:
- For MCQ: fill type="mcq", options, and correctIndex. Keep answer empty.
- For One Word: fill type="oneWord" and answer.
- For Case Study: each sub-question should be its own item with type="caseStudy", caseText, question, answer.
- For Picture Study: use type="pictureStudy" and fill imageUrl if present.
- Always include all fields (use empty string/arrays/defaults when missing).
- If answer in MCQ is option letter, map to correctIndex.
- Do not include markdown fences or extra text.

Input:
${content}
`;

    let text = "";
    let lastError: any = null;
    for (const modelName of MODEL_CANDIDATES) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        text = response.text().trim();
        if (text) break;
      } catch (err: any) {
        lastError = err;
        const message = `${err?.message || ""}`.toLowerCase();
        const isNotFound = err?.status === 404 || message.includes("not found") || message.includes("not supported");
        if (isNotFound) continue;
        throw err;
      }
    }

    if (!text) {
      return NextResponse.json({ error: lastError?.message || "No supported Gemini model available." }, { status: 500 });
    }

    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return NextResponse.json({ error: "Could not parse AI response." }, { status: 500 });
      }
      parsed = JSON.parse(jsonMatch[0]);
    }

    const questions = Array.isArray(parsed?.questions) ? parsed.questions : [];
    return NextResponse.json({ questions });
  } catch (error) {
    console.error(error);
    const anyError: any = error;
    const status = Number(anyError?.status) || 500;
    const message = `${anyError?.message || ""}`.toLowerCase();
    if (status === 429 || message.includes("quota") || message.includes("rate")) {
      return NextResponse.json(
        { error: "Gemini quota exceeded for this API key. Try again later or use manual Parse & Add Questions." },
        { status: 429 }
      );
    }
    return NextResponse.json({ error: anyError?.message || "AI parse failed." }, { status });
  }
}
