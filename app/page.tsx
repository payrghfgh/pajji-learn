"use client";

import { useEffect, useState } from "react";
import { initializeApp, getApps } from "firebase/app";
import { getFirestore, doc, onSnapshot, setDoc } from "firebase/firestore";

// --- FIREBASE CONFIG ---
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

export default function Home() {
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("dashboard");
  const [curBook, setCurBook] = useState<any>(null);
  const [curChapter, setCurChapter] = useState<any>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [activeTab, setActiveTab] = useState("Summary");
  const [saveStatus, setSaveStatus] = useState("");

  useEffect(() => {
    if (localStorage.getItem("isPajjiAdmin") === "true") setIsOwner(true);
    const unsub = onSnapshot(doc(db, "data", "pajji_database"), (ds) => {
      setLoading(false);
      if (ds.exists()) {
        const d = ds.data().books || [];
        setBooks(d);
        if (curBook) {
            const updatedBook = d.find((b: any) => b.id === curBook.id);
            if (updatedBook) setCurBook(updatedBook);
        }
      }
    });
    return () => unsub();
  }, [curBook?.id]);

  const pushSave = async (newList: any[]) => {
    setSaveStatus("Syncing...");
    try {
      await setDoc(doc(db, "data", "pajji_database"), { books: newList });
      setSaveStatus("Saved ✅");
      setTimeout(() => setSaveStatus(""), 2000);
    } catch (e) {
      alert("Save failed. Data might be too large.");
      setSaveStatus("Error ❌");
    }
  };

  // --- DELETE LOGIC ---
  const deleteBook = (id: string) => {
    if (confirm("Are you sure? This will delete the entire book and all lessons!")) {
        const updated = books.filter(b => b.id !== id);
        setBooks(updated);
        pushSave(updated);
        setView("library");
    }
  };

  const deleteLesson = (lessonId: string) => {
    if (confirm("Delete this lesson?")) {
        const updated = books.map(b => b.id === curBook.id ? {
            ...b, chapters: b.chapters.filter((c: any) => c.id !== lessonId)
        } : b);
        setBooks(updated);
        pushSave(updated);
    }
  };

  const handleFileUpload = (file: File, key: string) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (file.type === "application/pdf") {
        if (result.length > 900000) return alert("PDF too big.");
        updateField(key, result);
      } else {
        const img = new Image();
        img.src = result;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_W = 1200;
          const scale = MAX_W / img.width;
          canvas.width = MAX_W;
          canvas.height = img.height * scale;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          updateField(key, canvas.toDataURL("image/jpeg", 0.5));
        };
      }
    };
    reader.readAsDataURL(file);
  };

  const updateField = (key: string, val: string) => {
    const updated = books.map(b => b.id === curBook.id ? {
      ...b, chapters: b.chapters.map((c: any) => c.id === curChapter.id ? { ...c, [key]: val } : c)
    } : b);
    setBooks(updated);
    pushSave(updated);
  };

  if (loading) return <div style={{padding: "100px", textAlign: "center"}}>Loading...</div>;

  return (
    <div style={{ display: "flex", height: "100vh", background: "#f8fafc", fontFamily: "sans-serif" }}>
      
      {/* SIDEBAR */}
      <div style={{ width: "260px", background: "#fff", borderRight: "1px solid #e2e8f0", padding: "30px", display: "flex", flexDirection: "column" }}>
        <h1 onClick={() => setView("dashboard")} style={{ color: "#10b981", cursor: "pointer", textAlign: "center", marginBottom: "40px" }}>PAJJI LEARN</h1>
        <button onClick={() => setView("dashboard")} style={{ width: "100%", padding: "12px", border: "none", background: view === "dashboard" ? "#10b981" : "none", color: view === "dashboard" ? "#fff" : "#64748b", borderRadius: "10px", cursor: "pointer", fontWeight: "bold", textAlign: "left", marginBottom: "10px" }}>🏠 Dashboard</button>
        <button onClick={() => setView("library")} style={{ width: "100%", padding: "12px", border: "none", background: view === "library" ? "#10b981" : "none", color: view === "library" ? "#fff" : "#64748b", borderRadius: "10px", cursor: "pointer", fontWeight: "bold", textAlign: "left" }}>📚 Library</button>
        
        <div style={{ marginTop: "auto", textAlign: "center" }}>
          {saveStatus && <p style={{fontSize: "12px", color: "#10b981"}}>{saveStatus}</p>}
          {isOwner && <button onClick={() => setIsOwner(false)} style={{color: "red", border: "none", background: "none", cursor: "pointer"}}>Logout</button>}
          {!isOwner && <button onClick={() => { if(prompt("Key?") === "pajindersinghpajji") setIsOwner(true); }} style={{opacity: 0.1}}>Admin</button>}
        </div>
      </div>

      <div style={{ flex: 1, padding: "50px", overflowY: "auto" }}>
        
        {view === "dashboard" && (
            <div style={{textAlign: "center"}}>
                <h1>Welcome, Pajji!</h1>
                <button onClick={() => setView("library")} style={{background: "#10b981", color: "#fff", padding: "15px 40px", borderRadius: "50px", border: "none", cursor: "pointer", fontWeight: "bold"}}>Open Library</button>
            </div>
        )}

        {view === "library" && (
          <div>
            <div style={{display: "flex", justifyContent: "space-between"}}>
                <h1>Library</h1>
                {isOwner && <button onClick={() => { const t = prompt("Book?"); if(t) pushSave([...books, {id: Date.now().toString(), title: t, chapters: []}]); }}>+ New Book</button>}
            </div>
            <div style={{display: "flex", gap: "20px", flexWrap: "wrap", marginTop: "20px"}}>
              {books.map(b => (
                <div key={b.id} style={{width: "180px", position: "relative"}}>
                  <div onClick={() => {setCurBook(b); setView("chapters");}} style={{height: "240px", background: "#10b981", borderRadius: "15px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "40px"}}>📘</div>
                  <p style={{textAlign: "center", fontWeight: "bold"}}>{b.title}</p>
                  {isOwner && <button onClick={() => deleteBook(b.id)} style={{position: "absolute", top: "5px", right: "5px", background: "rgba(255,0,0,0.7)", color: "#fff", border: "none", borderRadius: "50%", width: "25px", height: "25px", cursor: "pointer"}}>×</button>}
                </div>
              ))}
            </div>
          </div>
        )}

        {view === "chapters" && curBook && (
          <div>
            <button onClick={() => setView("library")}>← Back</button>
            <h1>{curBook.title}</h1>
            {curBook.chapters?.map((ch: any) => (
              <div key={ch.id} style={{background: "#fff", padding: "15px", borderRadius: "10px", marginBottom: "10px", display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid #eee"}}>
                <span>{ch.title}</span>
                <div style={{display: "flex", gap: "10px"}}>
                  <button onClick={() => {setCurChapter(ch); setView("study");}}>Study</button>
                  {isOwner && <button onClick={() => {setCurChapter(ch); setView("edit");}} style={{background: "blue", color: "#fff"}}>Edit</button>}
                  {isOwner && <button onClick={() => deleteLesson(ch.id)} style={{background: "red", color: "#fff"}}>Delete</button>}
                </div>
              </div>
            ))}
            {isOwner && <button onClick={() => { const t = prompt("Lesson?"); if(t) { const updated = books.map(b => b.id === curBook.id ? {...b, chapters: [...(b.chapters || []), {id: Date.now().toString(), title: t, summary: "", video: "", slides: ""}]} : b); pushSave(updated); }}}>+ Lesson</button>}
          </div>
        )}

        {/* STUDY and EDIT views remain same as previous update... */}
        {view === "study" && curChapter && (
            <div>
                 <button onClick={() => setView("chapters")}>← Back</button>
                 <h1>{curChapter.title}</h1>
                 {/* Tabs and viewer logic */}
                 <div style={{background: "#fff", padding: "30px", borderRadius: "20px"}}>
                    {curChapter.slides && curChapter.slides.includes("pdf") ? 
                        <iframe src={curChapter.slides} width="100%" height="600px" /> : 
                        <img src={curChapter.slides} style={{width: "100%"}} />
                    }
                 </div>
            </div>
        )}

      </div>
    </div>
  );
}