import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    if (!message) {
      return NextResponse.json({ error: "No message provided" }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
You are Pajji Learn AI, a helpful assistant inside an educational website.

Your job:
- Answer questions about the website.
- Explain features like Summary, QnA, and Spellings.
- Help users understand how to use the platform.
- Be clear, helpful, and student-friendly.
- Do NOT generate random academic content unless asked.

Website Features:
1. Summary → Generates a clean summary of pasted lesson text.
2. QnA → Creates MCQs, one-word answers, and case study questions.
3. Spellings → Extracts important words for spelling practice.

User Question:
${message}
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ result: text });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "AI failed to respond." }, { status: 500 });
  }
}
