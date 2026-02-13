"use client";

import { useEffect, useState } from "react";
import { initializeApp, getApps } from "firebase/app";
import { getFirestore, doc, onSnapshot, setDoc } from "firebase/firestore";

// --- 0. CONFIG ---
const firebaseConfig = {
  apiKey: "AIzaSyDlpzm9cWYWtpp0chYAK_jKtMcf_SOTnVU",
  authDomain: "pajji-learn.firebaseapp.com",
  projectId: "pajji-learn",
  storageBucket: "pajji-learn.firebasestorage.app",
  messagingSenderId: "646645316423",
  appId: "1:646645316423:web:2652792938164bb94faa62",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

// --- TYPES ---
interface Chapter {
  id: string; title: string; summary: string; sketchNote: string;
  infographic: string; slides: string; mindMap: string; video: string;
  completed?: boolean; // New: track progress
}
interface Book {
  id: string; title: string; image: string; chapters: Chapter[];
}

export default function Home() {
  const [books, setBooks] = useState<Book[]>([]);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"dashboard" | "library" | "chapters" | "edit" | "study">("dashboard");
  const [curBook, setCurBook] = useState<Book | null>(null);
  const [curChapter, setCurChapter] = useState<Chapter | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("Summary");
  const [passInput, setPassInput] = useState("");

  const canEdit = isOwner && !isPreviewMode;

  useEffect(() => {
    const saved = localStorage.getItem("isPajjiAdmin");
    if (saved === "true") setIsOwner(true);
    const unsub = onSnapshot(doc(db, "data", "pajji_database"), (ds) => {
      if (ds.exists()) setBooks(ds.data().books || []);
    });
    return () => unsub();
  }, []);

  const save = async (nb: Book[]) => {
    try {
      await setDoc(doc(db, "data", "pajji_database"), { books: nb });
    } catch (e) {
      alert("Error saving data.");
    }
  };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 800;
          const scaleSize = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", 0.7));
        };
      };
    });
  };

  const toggleComplete = (chapterId: string) => {
    if (!curBook) return;
    const updatedBooks = books.map(b => b.id === curBook.id ? {
      ...b, chapters: b.chapters.map(c => c.id === chapterId ? { ...c, completed: !c.completed } : c)
    } : b);
    save(updatedBooks);
  };

  const calculateProgress = (book: Book) => {
    if (book.chapters.length === 0) return 0;
    const done = book.chapters.filter(c => c.completed).length;
    return Math.round((done / book.chapters.length) * 100);
  };

  const navBtn = (a: boolean) => ({
    display: "block", width: "100%", padding: "12px", textAlign: "left" as const, borderRadius: "8px", border: "none",
    background: a ? "#10b981" : "transparent", color: a ? "#fff" : "#444", fontWeight: "bold" as const, cursor: "pointer", marginBottom: "5px"
  });

  return (
    <div style={{ display: "flex", height: "100vh", backgroundColor: "#f3f4f6", fontFamily: "sans-serif" }}>
      {/* SIDEBAR */}
      <div style={{ width: "260px", background: "#fff", borderRight: "1px solid #ddd", padding: "20px", display: "flex", flexDirection: "column" }}>
        <h2 style={{ color: "#10b981", cursor: "pointer" }} onClick={() => setView("dashboard")}>Pajji Learn</h2>
        
        <nav style={{ flex: 1, marginTop: "20px" }}>
          <button onClick={() => setView("dashboard")} style={navBtn(view === "dashboard")}>🏠 Dashboard</button>
          <button onClick={() => setView("library")} style={navBtn(view === "library")}>📚 Library</button>
        </nav>

        {isOwner && (
          <div style={{ marginBottom: "20px", padding: "10px", background: "#f0fdf4", borderRadius: "10px", border: "1px solid #bbf7d0" }}>
            <p style={{ fontSize: "12px", margin: "0 0 10px 0", color: "#166534", fontWeight: "bold" }}>ADMIN TOOLS</p>
            <label style={{ display: "flex", alignItems: "center", cursor: "pointer", fontSize: "14px" }}>
              <input type="checkbox" checked={isPreviewMode} onChange={() => setIsPreviewMode(!isPreviewMode)} style={{ marginRight: "10px" }} />
              Student View
            </label>
          </div>
        )}

        {!isOwner ? (
          <div>
            <input type="password" placeholder="Key" value={passInput} onChange={e => setPassInput(e.target.value)} style={{ width: "100%", padding: "8px", borderRadius: "5px", border: "1px solid #ddd" }} />
            <button onClick={() => { if(passInput === "pajindersinghpajji") { setIsOwner(true); localStorage.setItem("isPajjiAdmin", "true"); setPassInput(""); }}} style={{ width: "100%", marginTop: "5px", background: "#10b981", color: "#fff", border: "none", padding: "8px", borderRadius: "5px", cursor: "pointer" }}>Login</button>
          </div>
        ) : (
          <button onClick={() => {setIsOwner(false); setIsPreviewMode(false); localStorage.removeItem("isPajjiAdmin");}} style={{color: "#ef4444", border: "none", background: "none", cursor: "pointer", fontWeight: "bold", textAlign: "left"}}>Logout</button>
        )}
      </div>

      {/* MAIN */}
      <div style={{ flex: 1, padding: "40px", overflowY: "auto" }}>
        {view === "library" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px", alignItems: "center" }}>
              <h1>Library</h1>
              <input type="text" placeholder="Search books..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ padding: "10px", borderRadius: "20px", border: "1px solid #ddd", width: "250px" }} />
            </div>
            <div style={{ display: "flex", gap: "25px", flexWrap: "wrap" }}>
              {books.filter(b => b.title.toLowerCase().includes(search.toLowerCase())).map(b => (
                <div key={b.id} style={{ width: "180px", position: "relative" }}>
                   <div onClick={() => { setCurBook(b); setView("chapters"); }} style={{ cursor: "pointer" }}>
                    <img src={b.image} style={{ width: "100%", height: "260px", objectFit: "cover", borderRadius: "12px", boxShadow: "0 4px 10px rgba(0,0,0,0.1)" }} />
                    <p style={{ textAlign: "center" as const, fontWeight: "bold" as const, marginTop: "10px", marginBottom: "5px" }}>{b.title}</p>
                    
                    {/* PROGRESS BAR */}
                    <div style={{ width: "100%", height: "8px", background: "#e5e7eb", borderRadius: "4px", overflow: "hidden" }}>
                      <div style={{ width: `${calculateProgress(b)}%`, height: "100%", background: "#10b981", transition: "width 0.3s ease" }}></div>
                    </div>
                    <p style={{ fontSize: "11px", textAlign: "right" as const, color: "#6b7280", marginTop: "4px" }}>{calculateProgress(b)}% Complete</p>
                  </div>

                  {canEdit && (
                    <>
                      <label style={{ position: "absolute", top: "5px", left: "5px", background: "#10b981", color: "#fff", width: "28px", height: "28px", borderRadius: "50%", display: "flex", justifyContent: "center", alignItems: "center", cursor: "pointer", fontSize: "12px" }}>
                        ✎ <input type="file" hidden accept="image/*" onChange={async (e) => {
                          const f = e.target.files?.[0];
                          if(f) { const c = await compressImage(f); save(books.map(bk => bk.id === b.id ? {...bk, image: c} : bk)); }
                        }} />
                      </label>
                      <button onClick={(e) => { e.stopPropagation(); if(confirm("Delete Book?")) save(books.filter(bk => bk.id !== b.id)); }} style={{ position: "absolute", top: "5px", right: "5px", background: "#ef4444", color: "#fff", width: "28px", height: "28px", borderRadius: "50%", border: "none", cursor: "pointer", fontWeight: "bold" }}>X</button>
                    </>
                  )}
                </div>
              ))}
            </div>
            {canEdit && <button onClick={() => { const t = prompt("Book Title?"); if(t) save([...books, { id: Date.now().toString(), title: t, image: "https://placehold.co/400x600?text="+t, chapters: [] }]); }} style={{marginTop: "30px", padding: "10px 20px", background: "#10b981", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer"}}>+ Add New Book</button>}
          </div>
        )}

        {view === "chapters" && curBook && (
            <div>
                <button onClick={() => setView("library")} style={{background: "none", border: "none", color: "#10b981", cursor: "pointer", fontWeight: "bold", marginBottom: "10px"}}>← Back</button>
                <h1>{curBook.title}</h1>
                {curBook.chapters.map((ch, idx) => (
                    <div key={ch.id} style={{background: "#fff", padding: "15px", borderRadius: "10px", marginBottom: "10px", display: "flex", justifyContent: "space-between", alignItems: "center", borderLeft: ch.completed ? "5px solid #10b981" : "5px solid transparent"}}>
                        <span style={{ textDecoration: ch.completed ? "line-through" : "none", color: ch.completed ? "#9ca3af" : "#000" }}>{idx + 1}. {ch.title}</span>
                        <div>
                            <button onClick={() => {setCurChapter(ch); setView("study"); setActiveTab("Summary");}} style={{padding: "5px 15px", borderRadius: "5px", border: "1px solid #ddd", cursor: "pointer"}}>Study</button>
                            {canEdit && <button onClick={() => {setCurChapter(ch); setView("edit");}} style={{marginLeft: "5px", padding: "5px 15px", borderRadius: "5px", background: "#2196f3", color: "#fff", border: "none", cursor: "pointer"}}>Edit</button>}
                        </div>
                    </div>
                ))}
            </div>
        )}

        {view === "study" && curChapter && (
            <div>
                 <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <button onClick={() => setView("chapters")} style={{background: "none", border: "none", color: "#10b981", cursor: "pointer", fontWeight: "bold"}}>← Back</button>
                    <label style={{ cursor: "pointer", background: curChapter.completed ? "#10b981" : "#e5e7eb", color: curChapter.completed ? "#fff" : "#4b5563", padding: "8px 15px", borderRadius: "20px", fontSize: "14px", fontWeight: "bold" }}>
                        <input type="checkbox" checked={!!curChapter.completed} onChange={() => toggleComplete(curChapter.id)} style={{ marginRight: "8px" }} />
                        {curChapter.completed ? "✓ Lesson Finished" : "Mark as Finished"}
                    </label>
                 </div>
                 <h1 style={{ marginTop: "20px" }}>{curChapter.title}</h1>
                 <div style={{display: "flex", gap: "10px", margin: "20px 0", flexWrap: "wrap"}}>
                    {["Summary", "Sketch Note", "Infographic", "Slides", "Mind Map", "Video"].map(t => (
                        <button key={t} onClick={() => setActiveTab(t)} style={{padding: "8px 15px", borderRadius: "20px", border: "1px solid #ddd", background: activeTab === t ? "#10b981" : "#fff", color: activeTab === t ? "#fff" : "#333", cursor: "pointer"}}>{t}</button>
                    ))}
                 </div>
                 <div style={{background: "#fff", padding: "20px", borderRadius: "15px", minHeight: "400px"}}>
                    {activeTab === "Summary" && <p style={{ whiteSpace: "pre-wrap" }}>{curChapter.summary || "No notes yet."}</p>}
                    {activeTab === "Video" && (
                        curChapter.video ? <iframe width="100%" height="500px" src={curChapter.video.replace("watch?v=", "embed/")} style={{ borderRadius: "10px" }} /> : <p>No video added.</p>
                    )}
                    {!["Summary", "Video"].includes(activeTab) && (
                        curChapter[activeTab.charAt(0).toLowerCase() + activeTab.slice(1).replace(" ", "") as keyof Chapter] ? 
                        <img src={curChapter[activeTab.charAt(0).toLowerCase() + activeTab.slice(1).replace(" ", "") as keyof Chapter]} style={{ maxWidth: "100%", borderRadius: "10px" }} /> : <p>Empty tab.</p>
                    )}
                 </div>
            </div>
        )}

        {view === "dashboard" && (
            <div>
                <h1>Welcome, Learner</h1>
                <div style={{ display: "flex", gap: "20px", marginTop: "20px" }}>
                  <div style={{ background: "#fff", padding: "25px", borderRadius: "15px", flex: 1, textAlign: "center" }}>
                    <h2 style={{ fontSize: "40px", color: "#10b981", margin: "0" }}>{books.length}</h2>
                    <p>Books in Library</p>
                  </div>
                  <div style={{ background: "#fff", padding: "25px", borderRadius: "15px", flex: 1, textAlign: "center" }}>
                    <h2 style={{ fontSize: "40px", color: "#10b981", margin: "0" }}>
                        {books.reduce((acc, b) => acc + b.chapters.filter(c => c.completed).length, 0)}
                    </h2>
                    <p>Lessons Completed</p>
                  </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}