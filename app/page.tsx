"use client";

import { useEffect, useState } from "react";
import { initializeApp, getApps } from "firebase/app";
import { getFirestore, doc, onSnapshot, setDoc } from "firebase/firestore";

// --- 0. TYPE DEFINITIONS ---
interface Chapter {
  id: string;
  title: string;
  summary: string;
  sketchNote: string;
  infographic: string;
  slides: string;
  mindMap: string;
  video: string;
}

interface Book {
  id: string;
  title: string;
  image: string;
  chapters: Chapter[];
}

// --- 1. FIREBASE CONFIG ---
const firebaseConfig = {
  apiKey: "AIzaSyDxQsrI8R2FdVwRCkwMEftvu0570J6MoVg",
  authDomain: "pajji-learn.firebaseapp.com",
  projectId: "pajji-learn",
  storageBucket: "pajji-learn.firebasestorage.app",
  messagingSenderId: "646645316423",
  appId: "1:646645316423:web:2652792938164bb94faa62",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

export default function Home() {
  // --- STATE ---
  const [books, setBooks] = useState<Book[]>([]);
  const [view, setView] = useState<"dashboard" | "library" | "chapters" | "edit" | "study">("dashboard");
  const [curBook, setCurBook] = useState<Book | null>(null);
  const [curChapter, setCurChapter] = useState<Chapter | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [activeTab, setActiveTab] = useState<"Summary" | "Sketch Note" | "Infographic" | "Slides" | "Mind Map" | "Video">("Summary");
  const [passInput, setPassInput] = useState("");

  // --- FIRESTORE LISTENER ---
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "data", "pajji_database"), (docSnap) => {
      if (docSnap.exists()) {
        const data: Book[] = docSnap.data().books || [];
        setBooks(data);

        if (curBook) {
          const freshB = data.find((b) => b.id === curBook.id);
          if (freshB) setCurBook(freshB);

          if (curChapter && freshB) {
            const freshCh = freshB.chapters.find((c) => c.id === curChapter.id);
            if (freshCh) setCurChapter(freshCh);
          }
        }
      }
    });

    return () => unsub();
  }, [curBook, curChapter]);

  // --- CLOUD SAVE ---
  const save = async (newBooks: Book[]) => {
    try {
      await setDoc(doc(db, "data", "pajji_database"), { books: newBooks });
    } catch (e) {
      alert("Cloud Error: Likely file size too large (Keep images under 1MB)");
    }
  };

  // --- ACTIONS ---
  const addBook = () => {
    const t = prompt("Book Title?");
    if (!t) return;
    const nb: Book = {
      id: Date.now().toString(),
      title: t,
      image: "https://placehold.co/400x600?text=" + t,
      chapters: [],
    };
    save([...books, nb]);
  };

  const addChapter = () => {
    if (!curBook) return;
    const nc: Chapter = {
      id: Date.now().toString(),
      title: "New Lesson",
      summary: "",
      sketchNote: "",
      infographic: "",
      slides: "",
      mindMap: "",
      video: "",
    };
    const updated = books.map((b) =>
      b.id === curBook.id ? { ...b, chapters: [...b.chapters, nc] } : b
    );
    save(updated);
  };

  const updateChapter = (field: keyof Chapter, val: string) => {
    if (!curBook || !curChapter) return;
    const updatedCh: Chapter = { ...curChapter, [field]: val };
    const updatedBooks = books.map((b) =>
      b.id === curBook.id
        ? {
            ...b,
            chapters: b.chapters.map((c) =>
              c.id === curChapter.id ? updatedCh : c
            ),
          }
        : b
    );
    save(updatedBooks);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>, field: keyof Chapter) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => updateChapter(field, reader.result as string);
    reader.readAsDataURL(file);
  };

  const getChapterField = (ch: Chapter, tab: string) => {
    const key = (tab.charAt(0).toLowerCase() + tab.slice(1).replace(" ", "")) as keyof Chapter;
    return ch[key];
  };

  // --- JSX ---
  return (
    <div style={{ display: "flex", height: "100vh", backgroundColor: "#f3f4f6", fontFamily: "sans-serif" }}>
      {/* SIDEBAR */}
      <div style={{ width: "260px", background: "#fff", borderRight: "1px solid #ddd", padding: "20px", display: "flex", flexDirection: "column" }}>
        <h2 style={{ color: "#10b981", marginBottom: "30px", cursor: "pointer" }} onClick={() => setView("dashboard")}>Pajji Learn</h2>

        <nav style={{ flex: 1 }}>
          <button onClick={() => setView("dashboard")} style={navBtn(view === "dashboard")}>🏠 Dashboard</button>
          <button onClick={() => setView("library")} style={navBtn(view === "library")}>📚 Library</button>
          {curBook && <button onClick={() => setView("chapters")} style={navBtn(view === "chapters")}>📖 {curBook.title}</button>}
        </nav>

        <div style={{ background: "#f9f9f9", padding: "10px", borderRadius: "10px" }}>
          {isOwner ? (
            <button onClick={() => setIsOwner(false)} style={{ color: "red", border: "none", cursor: "pointer", width: "100%" }}>Logout Admin</button>
          ) : (
            <div>
              <input type="password" placeholder="Key" value={passInput} onChange={e => setPassInput(e.target.value)} style={{ width: "100%", marginBottom: "5px", padding: "5px" }} />
              <button onClick={() => { if(passInput === "pajindersinghpajji") { setIsOwner(true); setPassInput(""); } }} style={{ width: "100%", background: "#10b981", color: "#fff", border: "none", padding: "8px", borderRadius: "5px", cursor: "pointer" }}>Login</button>
            </div>
          )}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, padding: "40px", overflowY: "auto" }}>

        {/* DASHBOARD */}
        {view === "dashboard" && (
          <div>
            <h1>Dashboard</h1>
            <div style={{ display: "flex", gap: "20px", marginTop: "20px" }}>
              <div style={statCard}><h3>{books.length}</h3><p>Books</p></div>
              <div style={statCard}><h3>{books.reduce((a,b)=>a+b.chapters.length, 0)}</h3><p>Total Lessons</p></div>
            </div>
          </div>
        )}

        {/* LIBRARY */}
        {view === "library" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h1>My Library</h1>
              {isOwner && <button onClick={addBook} style={primaryBtn}>+ Add Book</button>}
            </div>
            <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", marginTop: "20px" }}>
              {books.map(b => (
                <div key={b.id} onClick={() => { setCurBook(b); setView("chapters"); }} style={{ width: "160px", cursor: "pointer" }}>
                  <img src={b.image} style={{ width: "100%", height: "230px", borderRadius: "10px", objectFit: "cover", boxShadow: "0 4px 10px rgba(0,0,0,0.1)" }} />
                  <p style={{ fontWeight: "bold", textAlign: "center", marginTop: "10px" }}>{b.title}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CHAPTERS */}
        {view === "chapters" && curBook && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h1>{curBook.title}</h1>
              {isOwner && <button onClick={addChapter} style={primaryBtn}>+ Add Lesson</button>}
            </div>
            <div style={{ marginTop: "20px" }}>
              {curBook.chapters.map((ch, i) => (
                <div key={ch.id} style={rowStyle}>
                  <span>{i+1}. {ch.title}</span>
                  <div>
                    <button onClick={() => { setCurChapter(ch); setView("study"); setActiveTab("Summary"); }} style={subBtn}>Study</button>
                    {isOwner && <button onClick={() => { setCurChapter(ch); setView("edit"); }} style={{...subBtn, background:"#2196f3", color:"#fff", marginLeft:"5px"}}>Edit</button>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* EDIT */}
        {view === "edit" && curChapter && (
          <div style={{ background: "#fff", padding: "30px", borderRadius: "15px" }}>
            <h2>Editing: {curChapter.title}</h2>
            <input style={inp} value={curChapter.title} onChange={e => updateChapter("title", e.target.value)} />
            <textarea style={{ ...inp, height: "100px" }} value={curChapter.summary} onChange={e => updateChapter("summary", e.target.value)} placeholder="Summary Text..." />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", margin: "20px 0" }}>
              {["sketchNote", "infographic", "slides", "mindMap"].map(f => (
                <div key={f} style={{ border: "1px dashed #ccc", padding: "10px", borderRadius: "8px" }}>
                  <label style={{ display: "block", marginBottom: "5px", textTransform: "capitalize" }}>{f.replace(/([A-Z])/g, ' $1')}</label>
                  <input type="file" accept="image/*" onChange={e => handleFile(e, f as keyof Chapter)} />
                </div>
              ))}
            </div>
            <button onClick={() => setView("chapters")} style={{ ...primaryBtn, width: "100%" }}>Save & Return</button>
          </div>
        )}

        {/* STUDY */}
        {view === "study" && curChapter && (
          <div>
            <button onClick={() => setView("chapters")} style={{ marginBottom: "20px", cursor: "pointer" }}>← Back</button>
            <h1>{curChapter.title}</h1>
            <div style={{ display: "flex", gap: "10px", margin: "20px 0", flexWrap: "wrap" }}>
              {["Summary", "Sketch Note", "Infographic", "Slides", "Mind Map", "Video"].map(t => (
                <button key={t} onClick={() => setActiveTab(t as any)} style={tabBtn(activeTab === t)}>{t}</button>
              ))}
            </div>
            <div style={{ background: "#fff", padding: "30px", borderRadius: "15px", minHeight: "400px" }}>
              {activeTab === "Summary" && <p style={{whiteSpace:"pre-wrap"}}>{curChapter.summary || "No summary yet."}</p>}
              {activeTab === "Video" && (curChapter.video ? <a href={curChapter.video} target="_blank">Watch Lesson</a> : "No video link.")}
              {!["Summary", "Video"].includes(activeTab) && (
                <div style={{ textAlign: "center" }}>
                  {getChapterField(curChapter, activeTab) ? (
                    <img src={getChapterField(curChapter, activeTab) as string} style={{ maxWidth: "100%", borderRadius: "10px" }} />
                  ) : <p>Nothing uploaded for {activeTab} yet.</p>}
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// --- STYLES ---
const navBtn = (active: boolean) => ({
  display: "block",
  width: "100%",
  padding: "12px",
  textAlign: "left",
  borderRadius: "8px",
  border: "none",
  background: active ? "#10b981" : "transparent",
  color: active ? "#fff" : "#444",
  fontWeight: "bold",
  cursor: "pointer",
  marginBottom: "5px"
});
const primaryBtn = { background: "#10b981", color: "#fff", border: "none", padding: "10px 20px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" };
const subBtn = { padding: "8px 15px", borderRadius: "5px", border: "1px solid #ddd", background: "#fff", cursor: "pointer" };
const rowStyle = { background: "#fff", padding: "15px", borderRadius: "10px", marginBottom: "10px", display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid #eee" };
const statCard = { background: "#fff", padding: "20px", borderRadius: "15px", textAlign: "center", flex: 1, boxShadow: "0 2px 5px rgba(0,0,0,0.05)" };
const inp = { width: "100%", padding: "12px", border: "1px solid #ddd", borderRadius: "8px", marginTop: "10px", marginBottom: "10px" };
const tabBtn = (active: boolean) => ({ padding: "8px 18px", borderRadius: "20px", background: active ? "#10b981" : "#fff", color: active ? "#fff" : "#333", border: "1px solid #ddd", cursor: "pointer", fontWeight: "600" });
