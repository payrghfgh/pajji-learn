"use client";
// Triggering rebuild to fix chunk load error
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, ChevronLeft, ChevronRight, BookOpen, Clock, CheckCircle2, Sparkles, Send, Brain, Heart, Volume2, Info, Moon, Sun, LayoutDashboard, LogOut, User, MessageSquare, Upload } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const STUDY_TOOLS = ["Summary", "Spellings", "Flashcards", "Quiz", "AI Explanation", "My Notes", "Video", "Book PDF", "Slides", "Infographic", "Mind Map"];

interface StudyViewProps {
  curChapter: any;
  curBook?: any;
  setView: (v: string) => void;
  quickReviewMode: boolean;
  setQuickReviewMode: (v: boolean) => void;
  completedLessons: string[];
  markCompleted: (id: string) => void;
  unmasterLesson: (id: string) => void;
  isSpeedReadOpen: boolean;
  setIsSpeedReadOpen: (v: boolean) => void;
  speedReadIndex: number;
  setSpeedReadIndex: (v: any) => void;
  isZenMode: boolean;
  FocusGarden: any;
  switchStudyTab: (t: string) => void;
  activeTab: string;
  aiExplainQuestion: string;
  setAiExplainQuestion: (v: string) => void;
  askAiExplanation: () => void;
  aiExplainLoading: boolean;
  aiExplainAnswer: string;
  aiMode: "chapter" | "global";
  setAiMode: (m: "chapter" | "global") => void;
  normalizeQuiz: (q: any) => any;
  quizActiveIndices: number[] | null;
  quizQuestionOrder: number[];
  quizReview: any;
  currentQuizPos: number;
  setCurrentQuizPos: (v: any) => void;
  startQuizAttempt: (ch: any, indices?: number[]) => void;
  quizSubmitted: boolean;
  quizShuffleEnabled: boolean;
  setQuizShuffleEnabled: (v: any) => void;
  showShortcuts: boolean;
  setShowShortcuts: (v: any) => void;
  useFiftyFiftyPowerUp: () => void;
  usedFiftyFifty: any;
  useHintPowerUp: () => void;
  usedHint: any;
  useSkipPowerUp: () => void;
  usedSkip: any;
  quizAnswers: any;
  setQuizAnswers: (v: any) => void;
  setQuizSubmitted: (v: boolean) => void;
  setQuizReview: (v: any) => void;
  setQuizResult: (v: string) => void;
  quizResult: string;
  submitQuiz: () => void;
  formatDrivePreviewLink: (l: string) => string;
  formatImageLink: (l: string) => string;
  quizImageErrors: any;
  setQuizImageErrors: (v: any) => void;
  quizOptionOrder: any;
  hiddenOptionsByQuestion: any;
  formatYoutubeLink: (l: string) => string;
  noteDraft: string;
  setNoteDraft: (v: string) => void;
  noteSaving: boolean;
  noteSavedAt: string;
  insertNoteTemplate: (t: string) => void;
  saveCurrentNote: (content?: string) => Promise<void>;
  generateFlashcardsFromNote: () => void;
  exportCurrentNote: () => void;
  newTagInput: string;
  setNewTagInput: (v: string) => void;
  addTagToCurrentLesson: (t: string) => void;
  quickTagOptions: string[];
  currentLessonTags: string[];
  removeTagFromCurrentLesson: (t: string) => void;
  newPinnedPointText: string;
  setNewPinnedPointText: (v: string) => void;
  addPinnedKeyPoint: () => void;
  lessonPinnedPoints: any[];
  removePinnedKeyPoint: (id: string) => void;
  lessonFlashcards: any[];
  flashcardIndex: number;
  setFlashcardIndex: (v: any) => void;
  flashcardReveal: boolean;
  setFlashcardReveal: (v: boolean) => void;
  soundEnabled: boolean;
}

export const StudyView: React.FC<StudyViewProps> = ({
  curChapter, curBook, setView, quickReviewMode, setQuickReviewMode,
  completedLessons, markCompleted, unmasterLesson,
  isSpeedReadOpen, setIsSpeedReadOpen, speedReadIndex, setSpeedReadIndex,
  isZenMode, FocusGarden, switchStudyTab, activeTab,
  aiExplainQuestion, setAiExplainQuestion, askAiExplanation, aiExplainLoading, aiExplainAnswer,
  aiMode, setAiMode,
  normalizeQuiz, quizActiveIndices, quizQuestionOrder, quizReview,
  currentQuizPos, setCurrentQuizPos, startQuizAttempt, quizSubmitted,
  quizShuffleEnabled, setQuizShuffleEnabled, showShortcuts, setShowShortcuts,
  useFiftyFiftyPowerUp, usedFiftyFifty, useHintPowerUp, usedHint, useSkipPowerUp, usedSkip,
  quizAnswers, setQuizAnswers, setQuizSubmitted, setQuizReview, setQuizResult, quizResult, submitQuiz,
  formatDrivePreviewLink, formatImageLink, quizImageErrors, setQuizImageErrors, quizOptionOrder, hiddenOptionsByQuestion,
  formatYoutubeLink, noteDraft, setNoteDraft, noteSaving, noteSavedAt, insertNoteTemplate,
  saveCurrentNote, generateFlashcardsFromNote, exportCurrentNote,
  newTagInput, setNewTagInput, addTagToCurrentLesson, quickTagOptions, currentLessonTags, removeTagFromCurrentLesson,
  newPinnedPointText, setNewPinnedPointText, addPinnedKeyPoint, lessonPinnedPoints, removePinnedKeyPoint,
  lessonFlashcards, flashcardIndex, setFlashcardIndex, flashcardReveal, setFlashcardReveal, soundEnabled
}) => {
  const [selectedImage, setSelectedImage] = React.useState<string | null>(null);

  // Card-level known/review split, persisted per chapter in localStorage.
  // Deliberately not Firestore: the user document is shared with AdminHub, and
  // weakLessonIds is the quiz's signal -- repurposing it would corrupt what the
  // dashboard calls a Turbulence Zone.
  const [cardSplit, setCardSplit] = React.useState<{ known: string[]; review: string[] }>({ known: [], review: [] });

  React.useEffect(() => {
    if (typeof window === "undefined" || !curChapter?.id) return;
    try {
      const raw = window.localStorage.getItem(`flashcardSplit:${curChapter.id}`);
      const parsed = raw ? JSON.parse(raw) : null;
      setCardSplit({
        known: Array.isArray(parsed?.known) ? parsed.known : [],
        review: Array.isArray(parsed?.review) ? parsed.review : [],
      });
    } catch {
      setCardSplit({ known: [], review: [] });
    }
  }, [curChapter?.id]);

  const recordCard = (kind: "known" | "review") => {
    const q = lessonFlashcards[flashcardIndex]?.q;
    if (!q || !curChapter?.id) return;
    const next = {
      known: cardSplit.known.filter((x: string) => x !== q),
      review: cardSplit.review.filter((x: string) => x !== q),
    };
    next[kind].push(q);
    setCardSplit(next);
    try {
      window.localStorage.setItem(`flashcardSplit:${curChapter.id}`, JSON.stringify(next));
    } catch { }
    setFlashcardReveal(false);
    setFlashcardIndex((prev: number) => Math.min(lessonFlashcards.length - 1, prev + 1));
  };

  // Space flips the card, but never while typing in the AI bar.
  React.useEffect(() => {
    if (activeTab !== "Flashcards") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      e.preventDefault();
      setFlashcardReveal(!flashcardReveal);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeTab, flashcardReveal, setFlashcardReveal]);

  return (
    <div className="page-shell" style={{ maxWidth: "1000px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "24px", alignItems: "center" }}>
        <button onClick={() => setView("chapters")} className="btn-link">← Lessons</button>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", justifyContent: "flex-end" }}>
          {quickReviewMode && (
            <button onClick={() => setQuickReviewMode(false)} className="btn btn-secondary" style={{ padding: "8px 12px" }}>End Quick Review</button>
          )}
          {!completedLessons.includes(curChapter.id) ? (
            <button onClick={() => markCompleted(curChapter.id)} className="btn btn-warning" style={{ padding: "12px 24px", borderRadius: "14px", fontSize: "14px", boxShadow: "0 2px 8px rgba(0,0,0,0.3)" }}>CLAIM 100 XP</button>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div className="xp-badge">MASTERED</div>
              <button onClick={() => unmasterLesson(curChapter.id)} style={{ background: "none", border: "none", opacity: 0.5, cursor: "pointer" }}>↺</button>
            </div>
          )}
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: "900" }}>{curChapter.title}</h1>
        <button onClick={() => setIsSpeedReadOpen(true)} className="btn btn-secondary" style={{ padding: "8px 16px", borderRadius: "100px", fontSize: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
          <Zap size={14} /> Blaze Mode
        </button>
      </div>

      <AnimatePresence>
        {isSpeedReadOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.95)", zIndex: 1000000, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <div style={{ fontSize: "64px", fontWeight: "900", color: "white", marginBottom: "40px", fontFamily: "var(--disp)", textAlign: "center", maxWidth: "80%" }}>
              {curChapter.summary?.split(/\s+/)[speedReadIndex] || "READY?"}
            </div>
            <div style={{ display: "flex", gap: "24px" }}>
              <button onClick={() => setIsSpeedReadOpen(false)} className="btn btn-secondary">Exit</button>
              <button onClick={() => setSpeedReadIndex(0)} className="btn btn-secondary">Reset</button>
              <button onClick={() => {
                const words = curChapter.summary?.split(/\s+/) || [];
                const timer = setInterval(() => {
                  setSpeedReadIndex((idx: number) => {
                    if (idx >= words.length - 1) { clearInterval(timer); return idx; }
                    return idx + 1;
                  });
                }, 200);
              }} className="btn btn-primary">Start</button>
            </div>
            {isZenMode && (
              <div style={{ marginTop: "40px", width: "100%", maxWidth: "400px" }}>
                <FocusGarden />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      {/* The flashcards view carries its own compact tool row, directly under the
          deck bar. Every other panel keeps this one. */}
      {activeTab !== "Flashcards" && (
        <div className="tab-container" style={{ display: "flex", gap: "6px", flexWrap: "nowrap", overflowX: "auto", marginBottom: "20px" }}>
          {STUDY_TOOLS.map(t => (
            <button key={t} onClick={() => switchStudyTab(t)} className={`tab-btn ${activeTab === t ? "active" : ""}`}>{t}</button>
          ))}
        </div>
      )}
      <div className="card" style={{ minHeight: "500px", padding: "32px" }}>
        {["Summary", "Spellings"].includes(activeTab) && <div style={{ whiteSpace: "pre-wrap", fontSize: "17px", lineHeight: "1.8", color: "var(--text)" }}>{curChapter[activeTab.toLowerCase()] || "No content uploaded yet."}</div>}
        {activeTab === "AI Explanation" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ background: "var(--input-bg)", padding: "16px", borderRadius: "12px", border: "1px dashed var(--border)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <h3 style={{ fontWeight: "800", color: "var(--accent)" }}>Ask AI about this lesson</h3>
                <div style={{ display: "flex", background: "var(--card)", borderRadius: "100px", padding: "4px", border: "1px solid var(--border)" }}>
                  <button 
                    onClick={() => setAiMode("chapter")}
                    style={{ 
                      padding: "4px 12px", 
                      borderRadius: "100px", 
                      fontSize: "11px", 
                      fontWeight: "900", 
                      border: "none",
                      cursor: "pointer",
                      background: aiMode === "chapter" ? "var(--accent)" : "transparent",
                      color: aiMode === "chapter" ? "var(--ink-on-accent)" : "var(--muted)"
                    }}
                  >CHAPTER</button>
                  <button 
                    onClick={() => setAiMode("global")}
                    style={{ 
                      padding: "4px 12px", 
                      borderRadius: "100px", 
                      fontSize: "11px", 
                      fontWeight: "900", 
                      border: "none",
                      cursor: "pointer",
                      background: aiMode === "global" ? "var(--accent)" : "transparent",
                      color: aiMode === "global" ? "var(--ink-on-accent)" : "var(--muted)"
                    }}
                  >GLOBAL</button>
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
                  <input
                    type="text"
                    value={aiExplainQuestion}
                    onChange={(e) => setAiExplainQuestion(e.target.value)}
                    placeholder={selectedImage ? "Describe this image..." : "E.g. What is the main theme?"}
                    style={{ width: "100%", padding: "12px", paddingRight: "45px" }}
                    onKeyDown={(e) => { if (e.key === "Enter") askAiExplanation(); }}
                  />
                  <label style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", cursor: "pointer", opacity: selectedImage ? 1 : 0.4 }}>
                    <input 
                      type="file" 
                      accept="image/*" 
                      style={{ display: "none" }} 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            const img = new Image();
                            img.onload = () => {
                              const canvas = document.createElement("canvas");
                              const MAX_SIZE = 400; // Tiny Vision compression
                              let w = img.width;
                              let h = img.height;
                              if (w > h) { if (w > MAX_SIZE) { h *= MAX_SIZE / w; w = MAX_SIZE; } }
                              else { if (h > MAX_SIZE) { w *= MAX_SIZE / h; h = MAX_SIZE; } }
                              canvas.width = w; canvas.height = h;
                              const ctx = canvas.getContext("2d");
                              ctx?.drawImage(img, 0, 0, w, h);
                              setSelectedImage(canvas.toDataURL("image/jpeg", 0.6)); // 60% quality JPEG
                            };
                            img.src = ev.target?.result as string;
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    <Upload size={20} color={selectedImage ? "var(--accent)" : "white"} />
                  </label>
                </div>
                {selectedImage && (
                  <div style={{ position: "relative" }}>
                    <img src={selectedImage} style={{ height: "40px", width: "40px", borderRadius: "8px", border: "2px solid var(--accent)" }} />
                    <button 
                      onClick={() => setSelectedImage(null)}
                      style={{ position: "absolute", top: "-5px", right: "-5px", background: "var(--coral)", color: "var(--ink-on-accent)", border: "none", borderRadius: "50%", width: "16px", height: "16px", fontSize: "11px", cursor: "pointer" }}
                    >×</button>
                  </div>
                )}
                <button onClick={() => {
                   // Wrap original askAiExplanation to include image
                   (window as any)._pendingAiImage = selectedImage;
                   askAiExplanation();
                   setSelectedImage(null);
                }} className="btn btn-primary" disabled={aiExplainLoading}>
                  {aiExplainLoading ? "Thinking..." : "Ask"}
                </button>
                <button
                  onClick={() => {
                    setAiExplainQuestion("Can you generate a quick 3-question quiz for me based on this lesson?");
                    setTimeout(() => askAiExplanation(), 100);
                  }}
                  disabled={aiExplainLoading}
                  style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "0 16px", color: "var(--text)", fontWeight: "800", fontSize: "12px", cursor: "pointer" }}
                >
                  ✨ QUIZ ME
                </button>
              </div>
            </div>
            {aiExplainAnswer && (
              <div style={{ background: "var(--input-bg)", padding: "16px", borderRadius: "12px", border: "1px solid var(--border)", WebkitUserSelect: "text", userSelect: "text" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <h4 style={{ fontWeight: "800", color: "var(--accent)" }}>AI Explanation</h4>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={() => {
                        const utterance = new SpeechSynthesisUtterance(aiExplainAnswer);
                        utterance.rate = 1.0;
                        window.speechSynthesis.cancel();
                        window.speechSynthesis.speak(utterance);
                      }}
                      style={{ background: "var(--accent)", color: "var(--ink-on-accent)", border: "none", borderRadius: "8px", padding: "4px 12px", fontSize: "11px", fontWeight: "900", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
                    >
                      <Volume2 size={12} /> SPEAK
                    </button>
                    <button
                      onClick={() => window.speechSynthesis.cancel()}
                      style={{ background: "var(--coral-soft)", color: "var(--coral)", border: "1px solid var(--coral)", borderRadius: "8px", padding: "4px 12px", fontSize: "11px", fontWeight: "900", cursor: "pointer" }}
                    >
                      STOP
                    </button>
                  </div>
                </div>
                <div className="markdown-container" style={{ marginTop: "8px", lineHeight: 1.6, fontSize: "15px" }}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{aiExplainAnswer}</ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        )}
        {activeTab === "Quiz" && (() => {
          const quiz = normalizeQuiz(curChapter);
          if (quiz.length === 0) {
            return <div style={{ textAlign: "center", opacity: 0.7, padding: "80px 20px" }}>No quiz questions added yet.</div>;
          }
          const questionIndicesSource = quizActiveIndices && quizActiveIndices.length > 0
            ? quizActiveIndices
            : quiz.map((_: any, idx: number) => idx);
          const sourceSet = new Set(questionIndicesSource);
          const orderedFromState = quizQuestionOrder.filter((idx: number) => sourceSet.has(idx));
          const missingIndices = questionIndicesSource.filter((idx: number) => !orderedFromState.includes(idx));
          const orderedQuestionIndices = [...orderedFromState, ...missingIndices];
          const wrongIndices = orderedQuestionIndices.filter((idx: number) => quizReview[idx] && !quizReview[idx].isCorrect);
          const safePos = Math.max(0, Math.min(currentQuizPos, orderedQuestionIndices.length - 1));
          const activeQuestionIndex = orderedQuestionIndices[safePos];
          const q = quiz[activeQuestionIndex];
          return (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", paddingBottom: "84px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                <button onClick={() => startQuizAttempt(curChapter)} style={{ padding: "8px 12px", borderRadius: "10px", border: "1px solid var(--border)", background: "var(--input-bg)", color: "var(--text)", fontWeight: "700", cursor: "pointer" }}>
                  Start / Restart
                </button>
                <button onClick={() => startQuizAttempt(curChapter, wrongIndices)} disabled={!quizSubmitted || wrongIndices.length === 0} style={{ padding: "8px 12px", borderRadius: "10px", border: "1px solid var(--border)", background: (!quizSubmitted || wrongIndices.length === 0) ? "var(--ink-4)" : "var(--coral-soft)", color: "var(--text)", fontWeight: "700", cursor: (!quizSubmitted || wrongIndices.length === 0) ? "not-allowed" : "pointer", opacity: (!quizSubmitted || wrongIndices.length === 0) ? 0.55 : 1 }}>
                  Retry Wrong Only
                </button>
                <button onClick={() => { setQuizShuffleEnabled((prev: boolean) => !prev); startQuizAttempt(curChapter, questionIndicesSource); }} style={{ padding: "8px 12px", borderRadius: "10px", border: "1px solid var(--border)", background: quizShuffleEnabled ? "var(--accent-soft)" : "var(--input-bg)", color: "var(--text)", fontWeight: "700", cursor: "pointer" }}>
                  Shuffle: {quizShuffleEnabled ? "On" : "Off"}
                </button>
                <button onClick={() => setShowShortcuts((prev: boolean) => !prev)} style={{ padding: "8px 12px", borderRadius: "10px", border: "1px solid var(--border)", background: "var(--input-bg)", color: "var(--text)", fontWeight: "700", cursor: "pointer" }}>
                  Shortcuts
                </button>
              </div>
              {showShortcuts && (
                <div style={{ border: "1px dashed var(--border)", borderRadius: "12px", padding: "10px 12px", background: "var(--card)", fontSize: "12px", color: "var(--muted)" }}>
                  <strong style={{ color: "var(--text)" }}>Keyboard:</strong> Left/Right = navigate, Enter = submit, R = restart, ? = toggle this panel
                </div>
              )}
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <button onClick={useFiftyFiftyPowerUp} disabled={q.type !== "mcq" || !!usedFiftyFifty[activeQuestionIndex]} className="btn btn-secondary" style={{ opacity: (q.type !== "mcq" || !!usedFiftyFifty[activeQuestionIndex]) ? 0.55 : 1 }}>50:50 ✂️</button>
                <button onClick={useHintPowerUp} disabled={!!usedHint[activeQuestionIndex]} className="btn btn-secondary" style={{ opacity: usedHint[activeQuestionIndex] ? 0.55 : 1 }}>Hint 💡</button>
                <button onClick={useSkipPowerUp} disabled={!!usedSkip[activeQuestionIndex]} className="btn btn-secondary" style={{ opacity: usedSkip[activeQuestionIndex] ? 0.55 : 1 }}>Skip (-20 XP) ⏭️</button>
              </div>
              <div className="card" style={{ padding: "12px 14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <span style={{ fontSize: "12px", fontWeight: "800", color: "var(--muted)" }}>Question {safePos + 1}/{orderedQuestionIndices.length}</span>
                  <span style={{ fontSize: "12px", fontWeight: "800", color: "var(--accent)" }}>{Math.round(((safePos + 1) / Math.max(1, orderedQuestionIndices.length)) * 100)}%</span>
                </div>
                <div style={{ height: "7px", borderRadius: "8px", background: "var(--input-bg)", border: "1px solid var(--border)", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${((safePos + 1) / Math.max(1, orderedQuestionIndices.length)) * 100}%`, background: "var(--accent-grad)" }} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(34px, 1fr))", gap: "6px" }}>
                {orderedQuestionIndices.map((qIndex: number, navIndex: number) => {
                  const isCurrent = navIndex === safePos;
                  const isAnswered = quizAnswers[qIndex] !== undefined && `${quizAnswers[qIndex]}`.trim() !== "";
                  const reviewed = quizReview[qIndex];
                  const bg = reviewed ? (reviewed.isCorrect ? "var(--accent-soft)" : "rgba(var(--danger-rgb),0.2)") : (isAnswered ? "var(--accent-soft)" : "var(--input-bg)");
                  const border = isCurrent ? "2px solid var(--accent)" : "1px solid var(--border)";
                  return (
                    <button
                      key={`nav-${qIndex}`}
                      onClick={() => setCurrentQuizPos(navIndex)}
                      style={{ height: "34px", borderRadius: "10px", border, background: bg, color: "var(--text)", fontWeight: "800", cursor: "pointer", fontSize: "12px" }}
                    >
                      {navIndex + 1}
                    </button>
                  );
                })}
              </div>
              <div key={`${q.question}-${activeQuestionIndex}`} className="quiz-question-card" style={{ padding: "16px", borderRadius: "16px", border: "1px solid var(--border)", background: "var(--input-bg)" }}>
                {(() => {
                  const review = quizReview[activeQuestionIndex];
                  return (
                    <>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: "8px", alignItems: "center", marginBottom: "10px" }}>
                        <p style={{ fontWeight: "800" }}>{safePos + 1}. {q.question}</p>
                        <span style={{ fontSize: "11px", fontWeight: "800", padding: "3px 8px", borderRadius: "10px", background: "var(--accent-soft)", border: "1px solid rgba(var(--accent-rgb),0.35)" }}>
                          {q.type === "oneWord" ? "ONE WORD" : q.type === "caseStudy" ? "CASE" : q.type === "pictureStudy" ? "PICTURE" : "MCQ"}
                        </span>
                      </div>

                      {q.type === "caseStudy" && q.caseText && (
                        <div style={{ padding: "10px 12px", borderRadius: "12px", border: "1px dashed var(--border)", background: "var(--input-bg)", marginBottom: "10px", whiteSpace: "pre-wrap", fontSize: "14px" }}>
                          {q.caseText}
                        </div>
                      )}

                      {q.type === "pictureStudy" && (
                        <div style={{ marginBottom: "10px" }}>
                          {!q.imageUrl && (
                            <div style={{ padding: "10px 12px", borderRadius: "12px", border: "1px dashed var(--border)", color: "var(--muted)", fontSize: "13px" }}>
                              No image linked for this question yet.
                            </div>
                          )}
                          {!!q.imageUrl && (
                            <>
                              {formatDrivePreviewLink(q.imageUrl) ? (
                                <iframe
                                  src={formatDrivePreviewLink(q.imageUrl)}
                                  title={`question-img-${activeQuestionIndex + 1}`}
                                  style={{ width: "100%", height: "260px", borderRadius: "14px", border: "1px solid var(--border)", background: "var(--bg)" }}
                                />
                              ) : (
                                <img
                                  src={formatImageLink(q.imageUrl)}
                                  alt={`question-${activeQuestionIndex + 1}`}
                                  loading="lazy"
                                  onError={() => setQuizImageErrors((prev: any) => ({ ...prev, [activeQuestionIndex]: true }))}
                                  style={{ maxWidth: "100%", maxHeight: "260px", width: "100%", borderRadius: "14px", border: "1px solid var(--border)", objectFit: "contain", background: "var(--bg)" }}
                                />
                              )}
                              {quizImageErrors[activeQuestionIndex] && (
                                <div style={{ marginTop: "6px", fontSize: "12px", color: "var(--amber)", fontWeight: "700" }}>
                                  Image preview failed. Use the link below.
                                </div>
                              )}
                              <a href={formatImageLink(q.imageUrl)} target="_blank" rel="noreferrer" style={{ display: "inline-block", marginTop: "6px", fontSize: "12px", color: "var(--accent)", fontWeight: "700" }}>
                                Open image in new tab
                              </a>
                            </>
                          )}
                        </div>
                      )}

                      {q.type === "mcq" ? (
                        <div style={{ display: "grid", gap: "8px" }}>
                          {((quizOptionOrder[activeQuestionIndex] && quizOptionOrder[activeQuestionIndex].length > 0)
                            ? quizOptionOrder[activeQuestionIndex]
                            : (q.options || []).map((_: string, opIndex: number) => opIndex).filter((opIndex: number) => `${(q.options || [])[opIndex] || ""}`.trim())
                          ).filter((originalIndex: number) => !(hiddenOptionsByQuestion[activeQuestionIndex] || []).includes(originalIndex)).map((originalIndex: number) => {
                            const op = (q.options || [])[originalIndex] || "";
                            const selected = quizAnswers[activeQuestionIndex] === originalIndex;
                            const isCorrectOption = originalIndex === q.correctIndex;
                            const showCorrectOption = quizSubmitted && isCorrectOption;
                            const showWrongSelected = quizSubmitted && selected && !isCorrectOption;
                            return (
                              <button
                                key={`${activeQuestionIndex}-${originalIndex}`}
                                onClick={() => {
                                  setQuizAnswers((prev: any) => ({ ...prev, [activeQuestionIndex]: originalIndex }));
                                  setQuizSubmitted(false);
                                  setQuizReview({});
                                  setQuizResult("");
                                }}
                                style={{
                                  textAlign: "left",
                                  padding: "10px 12px",
                                  borderRadius: "12px",
                                  border: showWrongSelected ? "1px solid var(--danger)" : showCorrectOption ? "1px solid var(--accent)" : selected ? "1px solid var(--accent)" : "1px solid var(--border)",
                                  background: showWrongSelected ? "rgba(var(--danger-rgb),0.14)" : showCorrectOption ? "var(--accent-soft)" : selected ? "var(--accent-soft)" : "var(--input-bg)",
                                  color: "var(--text)",
                                  cursor: "pointer",
                                  fontWeight: selected ? "700" : "500"
                                }}
                              >
                                {String.fromCharCode(65 + originalIndex)}. {op}
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <input
                          type="text"
                          placeholder="Type your answer..."
                          value={`${quizAnswers[activeQuestionIndex] ?? ""}`}
                          onChange={(e) => {
                            setQuizAnswers((prev: any) => ({ ...prev, [activeQuestionIndex]: e.target.value }));
                            setQuizSubmitted(false);
                            setQuizReview({});
                            setQuizResult("");
                          }}
                          style={{ padding: "12px", background: "var(--input-bg)", border: "1px solid var(--border)", borderRadius: "10px", color: "var(--text)", width: "100%" }}
                        />
                      )}
                      {usedHint[activeQuestionIndex] && (
                        <div style={{ marginTop: "8px", fontSize: "12px", color: "var(--muted)", fontWeight: "700" }}>
                          Hint: {q.type === "mcq"
                            ? `Correct option is ${String.fromCharCode(65 + q.correctIndex)}`
                            : `Starts with "${`${q.answer || ""}`.trim().charAt(0) || ""}"`}
                        </div>
                      )}
                      {quizSubmitted && review && (
                        <div style={{ marginTop: "10px", padding: "10px 12px", borderRadius: "10px", border: review.isCorrect ? "1px solid rgba(var(--accent-rgb),0.35)" : "1px solid rgba(var(--danger-rgb),0.35)", background: review.isCorrect ? "var(--accent-soft)" : "rgba(var(--danger-rgb),0.12)", fontSize: "13px" }}>
                          {review.isCorrect ? (
                            <span style={{ fontWeight: "800", color: "var(--accent)" }}>Correct answer.</span>
                          ) : (
                            <span style={{ fontWeight: "700", color: "var(--danger)" }}>
                              Wrong answer. Your answer: {review.submitted}. Correct answer: {review.expected || "Not set"}.
                            </span>
                          )}
                        </div>
                      )}
                      {quizSubmitted && q.explanation && (
                        <div style={{ marginTop: "8px", padding: "10px 12px", borderRadius: "10px", border: "1px solid var(--border)", background: "var(--input-bg)", fontSize: "13px" }}>
                          <span style={{ fontWeight: "800", color: "var(--azure)" }}>Explanation:</span> {q.explanation}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
              <div style={{ position: "sticky", bottom: "10px", zIndex: 20, border: "1px solid var(--border)", background: "var(--card)", borderRadius: "14px", padding: "10px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", flexWrap: "wrap" }}>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={() => setCurrentQuizPos((prev: number) => Math.max(0, prev - 1))} disabled={safePos === 0} style={{ padding: "8px 12px", borderRadius: "10px", border: "1px solid var(--border)", background: safePos === 0 ? "var(--ink-4)" : "var(--input-bg)", color: "var(--text)", fontWeight: "700", cursor: safePos === 0 ? "not-allowed" : "pointer" }}>Prev</button>
                  <button onClick={() => setCurrentQuizPos((prev: number) => Math.min(orderedQuestionIndices.length - 1, prev + 1))} disabled={safePos === orderedQuestionIndices.length - 1} style={{ padding: "8px 12px", borderRadius: "10px", border: "1px solid var(--border)", background: safePos === orderedQuestionIndices.length - 1 ? "var(--ink-4)" : "var(--input-bg)", color: "var(--text)", fontWeight: "700", cursor: safePos === orderedQuestionIndices.length - 1 ? "not-allowed" : "pointer" }}>Next</button>
                </div>
                <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                  <button onClick={submitQuiz} style={{ padding: "9px 14px", borderRadius: "10px", border: "none", background: "var(--accent)", color: "var(--ink-on-accent)", fontWeight: "800", cursor: "pointer" }}>Submit Quiz</button>
                  <button onClick={() => startQuizAttempt(curChapter, wrongIndices)} disabled={!quizSubmitted || wrongIndices.length === 0} style={{ padding: "9px 12px", borderRadius: "10px", border: "1px solid var(--border)", background: (!quizSubmitted || wrongIndices.length === 0) ? "var(--ink-4)" : "rgba(var(--danger-rgb),0.14)", color: "var(--text)", fontWeight: "700", cursor: (!quizSubmitted || wrongIndices.length === 0) ? "not-allowed" : "pointer", opacity: (!quizSubmitted || wrongIndices.length === 0) ? 0.55 : 1 }}>
                    Retry Wrong
                  </button>
                  {quizResult && <span style={{ fontWeight: "800", color: quizResult.startsWith("Score") ? "var(--accent)" : "var(--warning)" }}>{quizResult}</span>}
                </div>
              </div>
            </div>
          );
        })()}
        {activeTab === "Video" && (curChapter.video ? <iframe width="100%" height="450px" src={formatYoutubeLink(curChapter.video)} frameBorder="0" allowFullScreen style={{ borderRadius: "20px", boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }} /> : "No video available.")}
        {activeTab === "My Notes" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", flexWrap: "wrap" }}>
              <p style={{ fontSize: "13px", color: "var(--muted)" }}>Write your own notes from Summary, Spellings, Quiz, PDFs, and videos.</p>
              <span style={{ fontSize: "12px", fontWeight: "700", color: noteSaving ? "var(--warning)" : "var(--accent)" }}>
                {noteSaving ? "Saving..." : (noteSavedAt ? `Saved at ${noteSavedAt}` : "Autosave on")}
              </span>
            </div>
            <textarea
              placeholder="Type your lesson notes here..."
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
              style={{ minHeight: "340px", lineHeight: 1.6, width: "100%", padding: "16px", borderRadius: "16px", background: "var(--input-bg)", border: "1px solid var(--border)", color: "var(--text)" }}
            />
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <button className="btn btn-secondary" onClick={() => insertNoteTemplate("Definition")}>Template: Definition</button>
              <button className="btn btn-secondary" onClick={() => insertNoteTemplate("Cause/Effect")}>Template: Cause/Effect</button>
              <button className="btn btn-secondary" onClick={() => insertNoteTemplate("Timeline")}>Template: Timeline</button>
            </div>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <button onClick={() => saveCurrentNote()} className="btn btn-primary" disabled={noteSaving} style={{ opacity: noteSaving ? 0.7 : 1 }}>Save Note</button>
              <button onClick={generateFlashcardsFromNote} className="btn btn-secondary">Generate Flashcards</button>
              <button onClick={exportCurrentNote} className="btn btn-secondary">Export Note (.txt)</button>
              <button
                onClick={async () => {
                  if (!confirm("Clear note for this lesson?")) return;
                  setNoteDraft("");
                  await saveCurrentNote("");
                }}
                className="btn btn-secondary"
                disabled={noteSaving}
                style={{ opacity: noteSaving ? 0.7 : 1 }}
              >
                Clear Note
              </button>
            </div>
            <div style={{ border: "1px solid var(--border)", borderRadius: "12px", padding: "10px", background: "var(--input-bg)" }}>
              <p style={{ fontSize: "12px", fontWeight: "800", marginBottom: "8px" }}>Tags</p>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "8px" }}>
                <input
                  type="text"
                  placeholder="Add tag (example: exam)"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTagToCurrentLesson(newTagInput);
                    }
                  }}
                  style={{ padding: "10px", flex: 1, minWidth: "220px", background: "var(--card)", border: "1px solid var(--border)", borderRadius: "10px", color: "var(--text)" }}
                />
                <button className="btn btn-secondary" onClick={() => addTagToCurrentLesson(newTagInput)}>Add Tag</button>
              </div>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "8px" }}>
                {quickTagOptions.map((tag) => (
                  <button key={`quick-tag-${tag}`} className="btn btn-secondary" style={{ padding: "5px 8px" }} onClick={() => addTagToCurrentLesson(tag)}>
                    + #{tag}
                  </button>
                ))}
              </div>
              {currentLessonTags.length > 0 && (
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  {currentLessonTags.map((tag) => (
                    <button key={`tag-${tag}`} className="btn btn-secondary" style={{ padding: "4px 8px" }} onClick={() => removeTagFromCurrentLesson(tag)}>
                      #{tag} x
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div style={{ border: "1px solid var(--border)", borderRadius: "12px", padding: "10px", background: "var(--input-bg)" }}>
              <p style={{ fontSize: "12px", fontWeight: "800", marginBottom: "8px" }}>Pin Key Point</p>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <input
                  type="text"
                  placeholder="Add a key takeaway from this lesson..."
                  value={newPinnedPointText}
                  onChange={(e) => setNewPinnedPointText(e.target.value)}
                  style={{ padding: "10px", flex: 1, minWidth: "220px", background: "var(--card)", border: "1px solid var(--border)", borderRadius: "10px", color: "var(--text)" }}
                />
                <button className="btn btn-primary" onClick={addPinnedKeyPoint}>Pin</button>
              </div>
              {lessonPinnedPoints.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "10px" }}>
                  {lessonPinnedPoints.map((point) => (
                    <div key={point.id} style={{ display: "flex", justifyContent: "space-between", gap: "8px", border: "1px solid var(--border)", borderRadius: "10px", padding: "6px 8px", background: "var(--card)" }}>
                      <span style={{ fontSize: "12px" }}>{point.text}</span>
                      <button className="btn btn-danger" style={{ padding: "4px 8px" }} onClick={() => removePinnedKeyPoint(point.id)}>x</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "Flashcards" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Topbar row: book pill, chevron, chapter name, Exit */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              {curBook?.title && (
                <span style={{ flexShrink: 0, fontSize: "11px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--azure)", background: "var(--azure-soft)", border: "1px solid var(--azure-soft)", borderRadius: "999px", padding: "4px 10px", whiteSpace: "nowrap" }}>
                  ◆ {curBook.title}
                </span>
              )}
              <span style={{ flexShrink: 0, color: "var(--faint)", fontSize: "13px" }}>›</span>
              <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "13px", fontWeight: "700", color: "var(--text)" }}>
                {curChapter.title}
              </span>
              <div style={{ flex: 1 }} />
              <button onClick={() => setView("chapters")} style={{ flexShrink: 0, padding: "6px 14px", borderRadius: "999px", fontSize: "12px", fontWeight: "700", background: "var(--ink-2)", border: "1px solid var(--line)", color: "var(--dim)", cursor: "pointer" }}>
                Exit
              </button>
            </div>

            {/* Deck bar: thin, full width, jade fill, count right-aligned */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ flex: 1, height: "4px", borderRadius: "999px", background: "var(--ink-4)", overflow: "hidden" }}>
                <div style={{ height: "100%", borderRadius: "999px", background: "var(--jade)", width: `${lessonFlashcards.length ? Math.round(((Math.min(flashcardIndex + 1, lessonFlashcards.length)) / lessonFlashcards.length) * 100) : 0}%` }} />
              </div>
              <span style={{ flexShrink: 0, fontSize: "11px", fontWeight: "700", color: "var(--faint)", fontVariantNumeric: "tabular-nums" }}>
                {Math.min(flashcardIndex + 1, lessonFlashcards.length)} / {lessonFlashcards.length} cards
              </span>
            </div>

            {/* The eleven tools, compact and scrollable. The plan draws no tab row;
                this is the deliberate addition that keeps all ten others reachable. */}
            <div style={{ display: "flex", gap: "6px", overflowX: "auto", paddingBottom: "2px" }}>
              {STUDY_TOOLS.map(t => (
                <button key={t} onClick={() => switchStudyTab(t)} style={{ flexShrink: 0, padding: "5px 10px", borderRadius: "999px", fontSize: "11px", fontWeight: "700", whiteSpace: "nowrap", cursor: "pointer", background: activeTab === t ? "var(--jade)" : "var(--ink-2)", color: activeTab === t ? "var(--ink-on-accent)" : "var(--dim)", border: `1px solid ${activeTab === t ? "var(--jade)" : "var(--line)"}` }}>
                  {t}
                </button>
              ))}
            </div>

            {lessonFlashcards.length > 0 ? (
              <>
                <div
                  onClick={() => {
                    setFlashcardReveal(!flashcardReveal);
                    if (soundEnabled) {
                      try {
                        new Audio("https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3").play().catch(() => { });
                      } catch (e) { }
                    }
                  }}
                  style={{ maxWidth: "460px", width: "100%", margin: "0 auto", minHeight: "220px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "14px", padding: "32px 28px", textAlign: "center", background: "var(--ink-2)", border: "1px solid var(--line)", borderRadius: "var(--r-l)", cursor: "pointer" }}
                >
                  <span style={{ fontSize: "11px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--faint)" }}>
                    Question {Math.min(flashcardIndex + 1, lessonFlashcards.length)} of {lessonFlashcards.length}
                  </span>
                  <p style={{ margin: 0, fontSize: "27px", fontWeight: "700", lineHeight: 1.3, color: "var(--text)" }}>
                    {flashcardReveal ? lessonFlashcards[flashcardIndex]?.a : lessonFlashcards[flashcardIndex]?.q}
                  </p>
                  <span style={{ fontSize: "12px", color: "var(--faint)" }}>
                    {flashcardReveal ? "Tap to flip back" : (
                      <>
                        Tap the card or press{" "}
                        <kbd style={{ fontFamily: "inherit", fontSize: "10px", fontWeight: "700", padding: "2px 6px", borderRadius: "6px", background: "var(--ink-4)", border: "1px solid var(--line-2)", color: "var(--dim)" }}>
                          Space
                        </kbd>{" "}
                        to flip
                      </>
                    )}
                  </span>
                </div>

                {flashcardReveal && (
                  <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", maxWidth: "460px", width: "100%", margin: "0 auto" }}>
                    <button
                      onClick={() => recordCard("review")}
                      style={{ flex: "1 1 180px", padding: "16px", borderRadius: "var(--r-m)", fontSize: "14px", fontWeight: "700", background: "var(--ink-2)", border: "1px solid var(--line)", color: "var(--text)", cursor: "pointer" }}
                    >
                      🤔 Not yet
                    </button>
                    <button
                      onClick={() => recordCard("known")}
                      style={{ flex: "1 1 180px", padding: "16px", borderRadius: "var(--r-m)", fontSize: "14px", fontWeight: "700", background: "var(--jade)", border: "1px solid var(--jade)", color: "var(--ink-on-accent)", cursor: "pointer" }}
                    >
                      ✓ I know this
                    </button>
                  </div>
                )}

                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "center" }}>
                  <span style={{ fontSize: "11px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--jade)", background: "var(--jade-soft)", border: "1px solid var(--jade-soft)", borderRadius: "999px", padding: "4px 10px" }}>
                    ✓ {cardSplit.known.length} known
                  </span>
                  <span style={{ fontSize: "11px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--coral)", background: "var(--coral-soft)", border: "1px solid var(--coral-soft)", borderRadius: "999px", padding: "4px 10px" }}>
                    ✗ {cardSplit.review.length} to review
                  </span>
                </div>
              </>
            ) : (
              <div style={{ textAlign: "center", padding: "80px", border: "1px dashed var(--border)", borderRadius: "24px" }}>
                <BookOpen size={48} style={{ margin: "0 auto 16px", opacity: 0.3 }} />
                <p style={{ fontWeight: "700", opacity: 0.5 }}>No flashcards for this lesson.</p>
                <button onClick={() => switchStudyTab("My Notes")} className="btn btn-secondary" style={{ marginTop: "16px" }}>Import from Notes</button>
              </div>
            )}

            {/* Reuses the existing AI panel's handler -- no second call path. */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", padding: "12px 16px", background: "var(--ink-2)", border: "1px solid var(--line)", borderRadius: "var(--r-m)" }}>
              <div style={{ flexShrink: 0, width: "36px", height: "36px", borderRadius: "var(--r-s)", background: "var(--jade-soft)", display: "grid", placeItems: "center" }}>
                <Sparkles size={18} color="var(--jade)" />
              </div>
              <div style={{ flex: "1 1 180px", minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: "13px", fontWeight: "700", color: "var(--text)" }}>Ask Pajji AI</p>
                <p style={{ margin: 0, fontSize: "11px", color: "var(--faint)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {curChapter.title} · what should I focus on?
                </p>
              </div>
              <button
                onClick={() => {
                  setAiExplainQuestion(`Explain ${curChapter.title} in simple terms`);
                  switchStudyTab("AI Explanation");
                  setTimeout(() => askAiExplanation(), 100);
                }}
                disabled={aiExplainLoading}
                style={{ flexShrink: 0, padding: "8px 16px", borderRadius: "999px", fontSize: "12px", fontWeight: "800", border: "none", background: "var(--jade)", color: "var(--ink-on-accent)", cursor: aiExplainLoading ? "not-allowed" : "pointer", opacity: aiExplainLoading ? 0.6 : 1 }}
              >
                Ask →
              </button>
            </div>
          </div>
        )}
        {["Book PDF", "Slides", "Infographic", "Mind Map"].includes(activeTab) && (() => {
          let k = activeTab === "Book PDF" ? "bookPdf" : activeTab.charAt(0).toLowerCase() + activeTab.slice(1).replace(" ", "");
          let link = curChapter[k];
          return (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {link ? <iframe src={link.includes("drive.google.com") ? link.replace("/view", "/preview") : link} width="100%" height="600px" style={{ border: "none", borderRadius: "20px" }} /> : <div style={{ textAlign: "center", padding: "100px", opacity: 0.5 }}>This resource hasn't been linked yet.</div>}
              {activeTab === "Book PDF" && curChapter.audioBook && (
                <div style={{ padding: "20px", background: "var(--input-bg)", borderRadius: "20px", display: "flex", flexDirection: "column", gap: "10px" }}>
                  <h3 style={{ fontSize: "16px", fontWeight: "800" }}>Audiobook Resource</h3>
                  {curChapter.audioBook.includes("drive.google.com") ? (
                    <iframe src={curChapter.audioBook.replace("/view", "/preview")} width="100%" height="150" style={{ border: "none", borderRadius: "10px" }} />
                  ) : (
                    <audio controls src={curChapter.audioBook} style={{ width: "100%", outline: "none" }} />
                  )}
                </div>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
};
