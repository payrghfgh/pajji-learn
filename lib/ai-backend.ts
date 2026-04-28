import Groq from "groq-sdk";
import Tesseract from "tesseract.js";

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

/**
 * Wikipedia Lookup for broad knowledge (free)
 */
export const wikiLookup = async (query: string): Promise<string | null> => {
  try {
    const searchRes = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&utf8=&format=json&srlimit=1`);
    const data = await searchRes.json();
    if (data.query?.search?.[0]) {
      const snippet = data.query.search[0].snippet.replace(/<[^>]*>?/gm, '');
      return `${snippet}... (via Wikipedia)`;
    }
  } catch (e) {
    console.error("Wiki Error:", e);
  }
  return null;
};

/**
 * Classifies query to determine which model to use
 */
export const classifyQuery = (text: string): "8B" | "70B" => {
  const words = text.trim().split(/\s+/);
  const triggerWords = ["explain", "why", "how", "solve"];
  const lowerText = text.toLowerCase();
  const hasTriggerWord = triggerWords.some(word => lowerText.includes(word));

  const basicKeywords = ["hi", "hello", "hey", "who are you", "what are you", "what's up", "how are you"];
  const isBasic = basicKeywords.some(k => lowerText.includes(k));

  if ((words.length < 7 && !hasTriggerWord) || isBasic) {
    return "8B";
  }
  return "70B";
};

/**
 * Calls the 8B model for simple queries
 */
export const call8B = async (prompt: string): Promise<string> => {
  const response = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [
      { role: "system", content: "Short, direct answers only. No detailed explanations." },
      { role: "user", content: prompt }
    ],
    max_tokens: 300,
  });
  return response.choices[0]?.message?.content || "No response";
};

/**
 * Calls the 70B model for complex queries
 */
export const call70B = async (prompt: string, systemPrompt?: string): Promise<string> => {
  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content: systemPrompt || "You are a helpful and engaging teacher. Provide clear, natural-sounding explanations."
      },
      { role: "user", content: prompt }
    ],
    max_tokens: 300,
  });
  return response.choices[0]?.message?.content || "No response";
};

/**
 * Processes OCR using Tesseract and returns text and confidence
 */
export const processOCR = async (image: string): Promise<{ text: string; confidence: number }> => {
  try {
    // Support base64 or URL
    const { data: { text, confidence } } = await Tesseract.recognize(image, 'eng');
    return { text: text.trim(), confidence };
  } catch (error) {
    console.error("OCR Error:", error);
    return { text: "", confidence: 0 };
  }
};

/**
 * Processes image understanding using Scout model
 */
export const processScout = async (image: string): Promise<string> => {
  try {
    const response = await groq.chat.completions.create({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Describe this image in detail for a student. Focus on any diagrams, formulas, or complex visuals." },
            { type: "image_url", image_url: { url: image } }
          ]
        }
      ],
      max_tokens: 300,
    });
    return response.choices[0]?.message?.content || "";
  } catch (error) {
    console.error("Scout Error:", error);
    return "";
  }
};

/**
 * Main handler that implements the requested routing and image logic
 */
export const handleAIRequest = async (message: string, image?: string, mode: "chapter" | "global" = "chapter") => {
  let userQuestion = message;
  
  // Extract actual question if it follows the app's standard context format
  if (message.includes("\n\nQ: ")) {
    userQuestion = message.split("\n\nQ: ").pop() || message;
  }

  // If in Global mode, we prioritize the user's question without the chapter context
  let finalPrompt = mode === "global" ? userQuestion : message;
  let modelToUse: "8B" | "70B" = classifyQuery(userQuestion);

  // 3. Image Handling (Always use 70B and context)
  if (image) {
    const { text: ocrText, confidence } = await processOCR(image);
    const isOCRClear = confidence > 60 && ocrText.length > 10;

    if (isOCRClear) {
      finalPrompt = `CONTEXT (OCR Extracted Text):\n${ocrText}\n\nUSER QUESTION: ${userQuestion}\n\nPlease answer the user question based on the extracted text.`;
      modelToUse = "70B";
    } else {
      const scoutDescription = await processScout(image);
      finalPrompt = `VISUAL ANALYSIS (Scout): ${scoutDescription}\n\nPARTIAL OCR TEXT: ${ocrText}\n\nUSER QUESTION: ${userQuestion}\n\nPlease combine the visual analysis and OCR text to answer the user's question.`;
      modelToUse = "70B";
    }
  } else if (mode === "chapter") {
    // 4. Wikipedia Fallback for broad queries (only in chapter mode if we want to augment)
    if (userQuestion.split(" ").length > 3) {
      const wikiAnswer = await wikiLookup(userQuestion);
      if (wikiAnswer) {
        finalPrompt = `CONTEXT (Wikipedia): ${wikiAnswer}\n\n${message}`;
        modelToUse = "70B";
      }
    }
  }

  // 5. Call Model
  let answer: string;
  if (modelToUse === "8B") {
    answer = await call8B(finalPrompt);
  } else {
    const systemPrompt = mode === "chapter" 
      ? "You are a helpful teacher. Use the provided chapter content as your primary context. Stay focused on the chapter topic. If the question is outside the scope, try to relate it back to the chapter."
      : "You are a helpful AI tutor. Provide full explanations using your general knowledge. You are not restricted to any specific chapter content.";
    
    answer = await call70B(finalPrompt, systemPrompt);
  }

  return {
    answer,
    model_used: modelToUse,
    cached: false
  };
};
