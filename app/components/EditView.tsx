"use client";
import React from "react";
import { motion } from "framer-motion";

interface EditViewProps {
  tempChapter: any;
  setTempChapter: (v: any) => void;
  saveAllChanges: () => void;
  lastAutosavePayloadRef: React.MutableRefObject<string>;
  setView: (v: string) => void;
  addQuizQuestion: () => void;
  removeQuizQuestion: (i: number) => void;
  updateQuizQuestion: (index: number, key: "type" | "question" | "correctIndex" | "answer" | "caseText" | "imageUrl" | "explanation", value: string | number) => void;
  updateQuizOption: (qI: number, oI: number, v: string) => void;
  parserMode: string;
  setParserMode: React.Dispatch<React.SetStateAction<"strict" | "balanced" | "aggressive">>;
  quizBuilderText: string;
  setQuizBuilderText: (v: string) => void;
  previewParsedQuestions: () => void;
  addPreviewToQuiz: () => void;
  bulkAddQuizQuestions: () => void;
  aiParseQuizQuestions: () => void;
  aiParsingQuiz: boolean;
  exportQuizPack: () => void;
  importQuizPack: () => void;
  quizPackText: string;
  setQuizPackText: (v: string) => void;
  parsedPreview: any[];
  importFlashcardsCsv: (file: File) => Promise<void> | void;
}

export const EditView: React.FC<EditViewProps> = ({
  tempChapter, setTempChapter, saveAllChanges, lastAutosavePayloadRef, setView,
  addQuizQuestion, removeQuizQuestion, updateQuizQuestion, updateQuizOption,
  parserMode, setParserMode, quizBuilderText, setQuizBuilderText,
  previewParsedQuestions, addPreviewToQuiz, bulkAddQuizQuestions,
  aiParseQuizQuestions, aiParsingQuiz, exportQuizPack, importQuizPack,
  quizPackText, setQuizPackText, parsedPreview, importFlashcardsCsv
}) => {
  return (
    <div className="page-shell" style={{ maxWidth: "900px" }}>
      <div className="card" style={{ width: "100%" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "32px" }}>
          <h2 style={{ fontWeight: "900" }}>Editor</h2>
          <button onClick={() => { saveAllChanges(); lastAutosavePayloadRef.current = JSON.stringify(tempChapter || {}); setView("chapters"); }} style={{ background: "var(--accent)", color: "white", padding: "12px 30px", borderRadius: "14px", border: "none", fontWeight: "800", cursor: "pointer" }}>SAVE CHANGES</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div><label style={{ color: "var(--accent)", fontWeight: "800", fontSize: "13px", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>Summary</label><textarea value={tempChapter.summary || ""} onChange={(e) => setTempChapter({ ...tempChapter, summary: e.target.value })} style={{ width: "100%", padding: "12px", background: "var(--input-bg)", border: "1px solid var(--border)", borderRadius: "12px", color: "var(--text)", minHeight: "150px" }} /></div>
          <div><label style={{ color: "var(--accent)", fontWeight: "800", fontSize: "13px", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>Spellings</label><textarea placeholder="Type words here..." value={tempChapter.spellings || ""} onChange={(e) => setTempChapter({ ...tempChapter, spellings: e.target.value })} style={{ width: "100%", padding: "12px", background: "var(--input-bg)", border: "1px solid var(--border)", borderRadius: "12px", color: "var(--text)", minHeight: "100px" }} /></div>
          <div style={{ padding: "16px", border: "1px solid var(--border)", borderRadius: "16px", background: "var(--input-bg)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", gap: "8px", flexWrap: "wrap" }}>
              <label style={{ color: "var(--accent)", fontWeight: "800", fontSize: "13px", textTransform: "uppercase" }}>Interactive Quiz</label>
              <button onClick={addQuizQuestion} style={{ padding: "8px 12px", borderRadius: "10px", border: "none", background: "var(--accent)", color: "white", fontWeight: "700", cursor: "pointer" }}>+ Add Question</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {(Array.isArray(tempChapter.quiz) ? tempChapter.quiz : []).map((q: any, qIndex: number) => (
                <div key={`edit-quiz-${qIndex}`} style={{ border: "1px solid var(--border)", borderRadius: "14px", padding: "12px", background: "var(--card)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                    <p style={{ fontWeight: "800", fontSize: "12px" }}>Question {qIndex + 1}</p>
                    <button onClick={() => removeQuizQuestion(qIndex)} style={{ background: "rgba(var(--danger-rgb),0.14)", color: "var(--danger)", border: "1px solid rgba(var(--danger-rgb),0.3)", borderRadius: "8px", padding: "4px 8px", cursor: "pointer", fontWeight: "700" }}>Remove</button>
                  </div>
                  <div style={{ marginBottom: "8px" }}>
                    <p style={{ fontSize: "11px", fontWeight: "700", marginBottom: "4px", color: "var(--muted)" }}>Question Type</p>
                    <select value={q.type || "mcq"} onChange={(e) => updateQuizQuestion(qIndex, "type", e.target.value)} style={{ padding: "10px", width: "100%", background: "var(--input-bg)", border: "1px solid var(--border)", borderRadius: "10px", color: "var(--text)" }}>
                      <option value="mcq">MCQ</option>
                      <option value="oneWord">One Word</option>
                      <option value="caseStudy">Case Study</option>
                      <option value="pictureStudy">Picture Study</option>
                    </select>
                  </div>
                  <input type="text" placeholder="Type question..." value={q.question || ""} onChange={(e) => updateQuizQuestion(qIndex, "question", e.target.value)} style={{ padding: "10px", marginBottom: "10px", width: "100%", background: "var(--input-bg)", border: "1px solid var(--border)", borderRadius: "10px", color: "var(--text)" }} />
                  {(q.type || "mcq") === "mcq" ? (
                    <>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                        {[0, 1, 2, 3].map((oIndex) => (
                          <input key={`q-${qIndex}-o-${oIndex}`} type="text" placeholder={`Option ${String.fromCharCode(65 + oIndex)}`} value={(q.options || [])[oIndex] || ""} onChange={(e) => updateQuizOption(qIndex, oIndex, e.target.value)} style={{ padding: "10px", background: "var(--input-bg)", border: "1px solid var(--border)", borderRadius: "10px", color: "var(--text)" }} />
                        ))}
                      </div>
                      <div style={{ marginTop: "10px" }}>
                        <p style={{ fontSize: "11px", fontWeight: "700", marginBottom: "4px", color: "var(--muted)" }}>Correct Option</p>
                        <select value={q.correctIndex ?? 0} onChange={(e) => updateQuizQuestion(qIndex, "correctIndex", Number(e.target.value))} style={{ padding: "10px", background: "var(--input-bg)", border: "1px solid var(--border)", borderRadius: "10px", color: "var(--text)" }}>
                          <option value={0}>A</option>
                          <option value={1}>B</option>
                          <option value={2}>C</option>
                          <option value={3}>D</option>
                        </select>
                      </div>
                    </>
                  ) : (
                    <>
                      {(q.type === "caseStudy") && (
                        <textarea placeholder="Case study passage..." value={q.caseText || ""} onChange={(e) => updateQuizQuestion(qIndex, "caseText", e.target.value)} style={{ minHeight: "90px", marginBottom: "8px", width: "100%", background: "var(--input-bg)", border: "1px solid var(--border)", borderRadius: "10px", color: "var(--text)" }} />
                      )}
                      {(q.type === "pictureStudy") && (
                        <input type="text" placeholder="Image URL (https://...)" value={q.imageUrl || ""} onChange={(e) => updateQuizQuestion(qIndex, "imageUrl", e.target.value)} style={{ padding: "10px", marginBottom: "8px", width: "100%", background: "var(--input-bg)", border: "1px solid var(--border)", borderRadius: "10px", color: "var(--text)" }} />
                      )}
                      <input type="text" placeholder="Correct answer (exact text)" value={q.answer || ""} onChange={(e) => updateQuizQuestion(qIndex, "answer", e.target.value)} style={{ padding: "10px", width: "100%", background: "var(--input-bg)", border: "1px solid var(--border)", borderRadius: "10px", color: "var(--text)" }} />
                    </>
                  )}
                  <textarea
                    placeholder="Explanation shown after submit (optional)"
                    value={q.explanation || ""}
                    onChange={(e) => updateQuizQuestion(qIndex, "explanation", e.target.value)}
                    style={{ minHeight: "80px", marginTop: "8px", width: "100%", background: "var(--input-bg)", border: "1px solid var(--border)", borderRadius: "10px", color: "var(--text)" }}
                  />
                </div>
              ))}
            </div>
            <div style={{ marginTop: "14px", borderTop: "1px dashed var(--border)", paddingTop: "12px" }}>
              <p style={{ fontSize: "11px", fontWeight: "800", color: "var(--muted)", marginBottom: "6px", textTransform: "uppercase" }}>Quick Bulk Add (NotebookLM Friendly)</p>
              <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap", marginBottom: "8px" }}>
                <span style={{ fontSize: "11px", color: "var(--muted)", fontWeight: "700" }}>Parser mode:</span>
                <button onClick={() => setParserMode("strict")} className="btn btn-secondary" style={{ padding: "6px 10px", background: parserMode === "strict" ? "var(--accent-soft)" : "var(--input-bg)" }}>Strict</button>
                <button onClick={() => setParserMode("balanced")} className="btn btn-secondary" style={{ padding: "6px 10px", background: parserMode === "balanced" ? "var(--accent-soft)" : "var(--input-bg)" }}>Balanced</button>
                <button onClick={() => setParserMode("aggressive")} className="btn btn-secondary" style={{ padding: "6px 10px", background: parserMode === "aggressive" ? "var(--accent-soft)" : "var(--input-bg)" }}>Aggressive</button>
              </div>
              <textarea
                placeholder={`Paste from NotebookLM directly.\nSupported examples:\n1) What is ...?\nA) ...\nB) ...\nC) ...\nD) ...\nCorrect Answer: B\n\nQ2: Another question...\nA. ...\nB. ...\nAnswer: Option text`}
                value={quizBuilderText}
                onChange={(e) => setQuizBuilderText(e.target.value)}
                style={{ minHeight: "130px", width: "100%", padding: "12px", background: "var(--input-bg)", border: "1px solid var(--border)", borderRadius: "12px", color: "var(--text)" }}
              />
              <div style={{ display: "flex", gap: "8px", marginTop: "8px", flexWrap: "wrap" }}>
                <button onClick={previewParsedQuestions} disabled={!quizBuilderText.trim()} style={{ padding: "8px 12px", borderRadius: "10px", border: "1px solid var(--border)", background: !quizBuilderText.trim() ? "rgba(148,163,184,0.2)" : "var(--input-bg)", color: "var(--text)", fontWeight: "800", cursor: !quizBuilderText.trim() ? "not-allowed" : "pointer" }}>
                  Preview Paste
                </button>
                <button onClick={addPreviewToQuiz} disabled={parsedPreview.length === 0} style={{ padding: "8px 12px", borderRadius: "10px", border: "1px solid var(--border)", background: parsedPreview.length === 0 ? "rgba(148,163,184,0.2)" : "var(--accent-soft)", color: "var(--text)", fontWeight: "800", cursor: parsedPreview.length === 0 ? "not-allowed" : "pointer" }}>
                  Add Preview
                </button>
                <button onClick={bulkAddQuizQuestions} style={{ padding: "8px 12px", borderRadius: "10px", border: "1px solid var(--border)", background: "var(--accent-soft)", color: "var(--text)", fontWeight: "800", cursor: "pointer" }}>Parse & Add Questions</button>
                <button onClick={aiParseQuizQuestions} disabled={aiParsingQuiz || !quizBuilderText.trim()} style={{ padding: "8px 12px", borderRadius: "10px", border: "1px solid var(--border)", background: (aiParsingQuiz || !quizBuilderText.trim()) ? "rgba(148,163,184,0.2)" : "rgba(59,130,246,0.14)", color: "var(--text)", fontWeight: "800", cursor: (aiParsingQuiz || !quizBuilderText.trim()) ? "not-allowed" : "pointer", opacity: (aiParsingQuiz || !quizBuilderText.trim()) ? 0.65 : 1 }}>
                  {aiParsingQuiz ? "AI Parsing..." : "AI Parse"}
                </button>
                <button onClick={exportQuizPack} style={{ padding: "8px 12px", borderRadius: "10px", border: "1px solid var(--border)", background: "var(--input-bg)", color: "var(--text)", fontWeight: "800", cursor: "pointer" }}>Export Pack</button>
                <button onClick={importQuizPack} disabled={!quizPackText.trim()} style={{ padding: "8px 12px", borderRadius: "10px", border: "1px solid var(--border)", background: !quizPackText.trim() ? "rgba(148,163,184,0.2)" : "var(--accent-soft)", color: "var(--text)", fontWeight: "800", cursor: !quizPackText.trim() ? "not-allowed" : "pointer" }}>
                  Import Pack
                </button>
              </div>
              <textarea
                placeholder="Quiz pack JSON (exported or pasted)"
                value={quizPackText}
                onChange={(e) => setQuizPackText(e.target.value)}
                style={{ minHeight: "110px", marginTop: "8px", width: "100%", padding: "12px", background: "var(--input-bg)", border: "1px solid var(--border)", borderRadius: "12px", color: "var(--text)" }}
              />
              {parsedPreview.length > 0 && (
                <div style={{ marginTop: "8px", border: "1px solid var(--border)", borderRadius: "12px", padding: "10px", background: "var(--card)" }}>
                  <p style={{ fontSize: "11px", color: "var(--muted)", fontWeight: "800", marginBottom: "6px" }}>Preview ({parsedPreview.length})</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "180px", overflowY: "auto" }}>
                    {parsedPreview.slice(0, 10).map((q: any, idx: number) => (
                      <div key={`preview-${idx}`} style={{ fontSize: "12px", borderBottom: "1px dashed var(--border)", paddingBottom: "4px" }}>
                        <strong style={{ fontSize: "10px", color: "var(--accent)", marginRight: "6px" }}>{q.type}</strong>{q.question}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div style={{ padding: "16px", border: "1px solid var(--border)", borderRadius: "16px", background: "var(--input-bg)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "10px" }}>
              <div>
                <label style={{ color: "var(--accent)", fontWeight: "800", fontSize: "13px", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>Flashcards</label>
                <p style={{ fontSize: "12px", color: "var(--muted)" }}>
                  Import a NotebookLM CSV. Common headers like `Question,Answer` or `Front,Back` are supported.
                </p>
              </div>
              <div style={{ fontSize: "12px", fontWeight: "800", color: "var(--accent)" }}>
                {Array.isArray(tempChapter.flashcards) ? `${tempChapter.flashcards.length} cards loaded` : "No flashcards loaded"}
              </div>
            </div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
              <label style={{ padding: "10px 14px", borderRadius: "10px", border: "1px solid var(--border)", background: "var(--card)", color: "var(--text)", fontWeight: "800", cursor: "pointer" }}>
                Import CSV
                <input
                  type="file"
                  accept=".csv,text/csv"
                  style={{ display: "none" }}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    await importFlashcardsCsv(file);
                    e.currentTarget.value = "";
                  }}
                />
              </label>
              <span style={{ fontSize: "12px", color: "var(--muted)" }}>This replaces the lesson's current flashcards.</span>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            {["video", "slides", "bookPdf", "audioBook", "infographic", "mindMap"].map(f => (
              <div key={f}><p style={{ fontSize: "11px", color: "var(--accent)", fontWeight: "800", textTransform: "uppercase", marginBottom: "6px" }}>{f}</p><input type="text" value={tempChapter[f] || ""} onChange={(e) => setTempChapter({ ...tempChapter, [f]: e.target.value })} style={{ padding: "12px", width: "100%", background: "var(--input-bg)", border: "1px solid var(--border)", borderRadius: "10px", color: "var(--text)" }} /></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
