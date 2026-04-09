import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { question, context } = await req.json();

    if (!question) {
      return NextResponse.json({ error: "No question provided" }, { status: 400 });
    }

    // --- LOCAL KNOWLEDGE BASE (Alexa-style instant answers) ---
    const lowerQ = question.toLowerCase();
    
    const localAnswers = [
      {
        keywords: ["hi", "hello", "hey", "greetings", "wassup", "sup"],
        answer: "Hi there! 👋 I'm your Pajji Study Assistant. How can I help you with this chapter? You can ask me about the lesson, or test my knowledge on something random!"
      },
      {
        keywords: ["xp", "points", "score"],
        answer: "You earn 100 XP for every lesson you master! You can also gain XP by completing quizzes and using power-ups correctly. XP helps you climb the Leaderboard and unlock exclusive themes."
      },
      {
        keywords: ["master", "mastered", "complete lesson", "done"],
        answer: "To master a lesson, click the 'CLAIM 100 XP' button at the top of the Study page. This marks the lesson with a ✓ and adds 100 XP to your profile."
      },
      {
        keywords: ["theme", "color", "night mode", "dark mode", "looks"],
        answer: "Go to Settings (⚙️) to change your theme. You can unlock premium themes by earning badges or getting gifts from an Admin!"
      },
      {
        keywords: ["notes", "pin", "key point", "save"],
        answer: "Use the 'My Notes' tab to type! Pro Tip: If you see something really important, click 'Pin Key Point' to save it to your home dashboard so you never forget it."
      },
      {
        keywords: ["quiz", "mcq", "question", "test"],
        answer: "Quizzes are the best way to practice. If you get a question wrong, don't worry—use the 'Retry Wrong Only' button to master that specific topic!"
      },
      {
        keywords: ["audio", "audiobook", "listen", "voice"],
        answer: "Look for the 'Audiobook' player under the Book PDF tab. It's perfect for listening to the chapter while you read perfectly along."
      },
      {
        keywords: ["study tip", "how to study", "advice", "help me learn"],
        answer: "Try 'Active Recall'! Instead of just reading, close your eyes and try to explain the topic out loud. Or use our Flashcards in the My Notes tab!"
      },
      {
        keywords: ["exam", "test tomorrow", "prepare", "boards"],
        answer: "Stay calm! Focus on the Summary first to get the big picture, then practice the 'Spellings' and take a mock Quiz. Getting 70% or more on our quizzes usually means you're ready!"
      },
      {
        keywords: ["pomodoro", "focus", "timing", "break"],
        answer: "Try the 25/5 rule: Study hard for 25 minutes, then take a 5-minute break. It keeps your brain fresh and prevents burnout."
      },
      {
        keywords: ["memorize", "remember", "forgetting"],
        answer: "Use Mnemonics! Create a funny story or a catchy song using the first letters of the points you need to remember. Your brain loves stories!"
      },
      {
        keywords: ["essay", "writing", "paragraph", "introduction"],
        answer: "Always start with a 'Hook'—something interesting to grab the reader. Then state your main point clearly and use bullet points for facts."
      },
      {
        keywords: ["math", "calculation", "formula", "science"],
        answer: "For Math and Science, always write down the 'Given' values first. Understanding what you already know is 50% of solving the problem!"
      },
      {
        keywords: ["who are you", "assistant", "pajji"],
        answer: "I'm Pajji, your smart study companion! I'm here to help you master your ICSE subjects with ease."
      },
      {
        keywords: ["motivation", "tired", "give up", "bored"],
        answer: "Remember why you started! Every lesson you complete today makes you 1% smarter for tomorrow. You've got this! 🚀"
      },
      {
        keywords: ["definition", "meaning", "what is"],
        answer: "I can help with that! Check the 'Summary' or 'Spellings' tabs for the key terms of this chapter. If you need a broad definition, I'll do my best to explain it!"
      }
    ];

    // Check for a match in the PRESET KNOWLEDGE BASE
    for (const item of localAnswers) {
      if (item.keywords.some(k => lowerQ.includes(k))) {
        return NextResponse.json({ result: item.answer + "\n\n(Generated instantly by Pajji Assistant ⚡)" });
      }
    }

    // --- SMART CONTEXT MATCHER (Chapter Specific) ---
    if (context) {
      const sentences = context.split(/[.!?]/);
      const matchedSentences = sentences.filter(s => {
        const words = lowerQ.split(" ").filter(w => w.length > 3);
        return words.some(w => s.toLowerCase().includes(w));
      });

      if (matchedSentences.length > 0) {
        return NextResponse.json({ 
          result: "Based on the material in this chapter:\n\n" + 
                  matchedSentences.slice(0, 3).join(". ").trim() + "." +
                  "\n\n(Found instantly in chapter material 📚)" 
        });
      }
    }
    // -----------------------------------------------------------

    // --- WIKIPEDIA DYNAMIC FALLBACK (Handles Broad World Knowledge 100% Free) ---
    // Extract main keywords from the question by removing common stop words
    const stopWords = ["what", "is", "the", "who", "why", "how", "when", "where", "a", "an", "of", "to", "in", "for", "with", "on", "do", "does", "are", "tell", "me", "about", "describe", "explain"];
    const questionWords = lowerQ.replace(/[?!.]/g, "").split(" ");
    const searchTerms = questionWords.filter(w => !stopWords.includes(w) && w.length > 2);
    
    if (searchTerms.length > 0) {
      const searchQuery = searchTerms.join(" ");
      try {
        const wikiRes = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(searchQuery)}&utf8=&format=json&srlimit=1`);
        const wikiData = await wikiRes.json();
        
        if (wikiData.query && wikiData.query.search && wikiData.query.search.length > 0) {
          const firstResult = wikiData.query.search[0];
          // Wikipedia returns snippets with HTML tags, we strip them.
          const cleanSnippet = firstResult.snippet.replace(/<[^>]*>?/gm, '');
          
          return NextResponse.json({ 
            result: `Here is what I found about "${firstResult.title}":\n\n${cleanSnippet}...\n\n(Generated instantly via World Knowledge 🌍)` 
          });
        }
      } catch (e) {
        console.error("Wiki fetch error:", e);
      }
    }

    // --- FINAL CONVERSATIONAL FALLBACK ---
    if (lowerQ.startsWith("why")) {
      return NextResponse.json({ result: "That's a great 'why' question! To understand the exact reason, you should review the causes listed in your chapter text. Think about what events led up to this!" });
    } else if (lowerQ.startsWith("how")) {
      return NextResponse.json({ result: "Process questions are important! The best way to learn 'how' something works is to break it down step-by-step. Try checking the chapter's mechanism or flow!" });
    } else if (lowerQ.startsWith("what") || lowerQ.startsWith("who")) {
      return NextResponse.json({ result: "This sounds like a factual question! Scan your chapter summary for capital letters (names/places) or check the 'Spellings' tab for definitions." });
    }

    return NextResponse.json({ 
      result: "I'm not quite sure about that specific question! Try to phrase it differently, or explore the 'Summary' tab for clues. \n\n(Pajji Local Help 🤖)" 
    });

  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message || "Failed to respond." }, { status: 500 });
  }
}

