import Groq from "groq-sdk";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: NextRequest) {
  const { message, history, membership, image } = await req.json();

  // Fetch global AI config from Firestore
  let baseSystemPrompt = "You are Pajji Learn AI, an ai for a learning platform made by Pajji Services. Answer clearly and concisely using the provided context. Be helpful but brief to save time.Sometimes, act fun";
  let baseModel = "llama-3.3-70b-versatile";
  let baseMaxTokens = 300;

  try {
    const configSnap = await getDoc(doc(db, "settings", "ai_config"));
    if (configSnap.exists()) {
      const data = configSnap.data();
      baseSystemPrompt = data.systemPrompt || baseSystemPrompt;
      baseModel = data.model || baseModel;
      baseMaxTokens = data.maxTokens || baseMaxTokens;
    }
  } catch (e) {
    console.error("Error fetching AI config:", e);
  }

  // Tier-based Awareness (Incorporate subscriptions into prompt only)
  const personalizedPrompt = `${baseSystemPrompt}\n\nUSER STATUS: The user has a ${membership?.toUpperCase() || "FREE"} membership.`;

  // Vision Logic: If an image is provided, we MUST use the Vision model
  let finalModel = baseModel;
  let userContent: any = message;
  let finalMessages: any[] = [];

  if (image) {
    finalModel = "meta-llama/llama-4-scout-17b-16e-instruct"; // Latest Vision model from Groq docs
    // For vision, we use a cleaner, shorter prompt to avoid context overflow
    const visionInstruction = message?.trim() ? message : "Analyze this image in the context of the lesson.";
    const cleanMessage = `LESSON: ${membership}\n\nQ: ${visionInstruction}`;
    
    userContent = [
      { type: "text", text: cleanMessage },
      { type: "image_url", image_url: { url: image } }
    ];
    
    // For vision, we skip history to ensure the model has maximum "focus" on the image
    finalMessages = [
      { role: "system", content: personalizedPrompt },
      { role: "user", content: userContent }
    ];
  } else {
    finalMessages = [
      { role: "system", content: personalizedPrompt },
      ...(history || []).map((msg: any) => ({
        role: msg.role,
        content: msg.content
      })),
      { role: "user", content: message },
    ];
  }

  try {
    const response = await groq.chat.completions.create({
      model: finalModel,
      messages: finalMessages,
      max_tokens: baseMaxTokens,
    });

    const reply = response.choices[0].message?.content;
    return NextResponse.json({ reply, result: reply });
  } catch (error: any) {
    console.error("GROQ API ERROR:", error);
    return NextResponse.json({ 
      reply: "Sorry, I encountered an error processing that. " + (error.message || ""), 
      error: true 
    }, { status: 500 });
  }
}
