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

  // Sync Admin Status
  useEffect(() => {
    if (localStorage.getItem("isPajjiAdmin") === "true") setIsOwner(true);
  }, []);

  // Database Listener
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "data", "pajji_database"), (ds) => {
      setLoading(false);
      if (ds.exists()) {
        const d = ds.data().books || [];
        setBooks(d);
        // Refresh pointers to current book/chapter
        if (curBook) {
            const b = d.find((x: any) => x.id === curBook.id);
            if (b) {
                setCurBook(b);
                if (curChapter) {
                    const c = b.chapters?.find((y: any) => y.id === curChapter.id);
                    if (c) setCurChapter(c);
                }
            }
        }
      }
    });
    return () => unsub();
  }, [curBook?.id, curChapter?.id]);

  const pushSave = async (newList: any[]) => {
    setSaveStatus("Syncing...");
    try {
      await setDoc(doc(db, "data", "pajji_database"), { books: newList });
      setSaveStatus("Saved ✅");
      setTimeout(() => setSaveStatus(""), 2000);
    } catch (e) {
      console.error("Save Error:", e);
      alert("CRITICAL ERROR: Save Failed. If you just uploaded a large PDF, it likely exceeded the 1MB limit. Use a URL link instead.");
      setSaveStatus("Error ❌");
    }
  };

  // --- REWRITTEN ADDING FUNCTIONS ---
  const handleAddBook = () => {
    const t = prompt("Enter Book Name:");
    if (!t) return;
    const newList = [...books, { id: Date.now().toString(), title: t, chapters: [] }];
    setBooks(newList);
    pushSave(newList);
  };

  const handleAddLesson = () => {
    if (!curBook) return;
    const t = prompt("Enter Lesson Name:");
    if (!t) return;
    const newLesson = {
      id: Date.now().toString(),
      title: t,
      summary: "",
      video: "",
      slides: "",
      bookPdf: "", // Support for your book PDFs
      infographic: "",
      sketchNote: "",
      mindMap: ""
    };
    const newList = books.map(b => b.id === curBook.id ? { ...b, chapters: [...(b.chapters || []), newLesson] } : b);
    setBooks(newList);
    pushSave(newList);
  };

  const updateField = (key: string, val: string) => {
    const newList = books.map(b => b.id === curBook.id ? {
      ...b, chapters: b.chapters.map((c: any) => c.id === curChapter.id ? { ...c, [key]: val } : c)
    } : b);
    setBooks(newList);
    pushSave(newList);
  };

  const deleteItem = (type: 'book' | 'lesson', id: string) => {
    if (!confirm(`Are you sure you want to delete this ${type}?`)) return;
    let newList;
    if (type === 'book') {
      newList = books.filter(b => b.id !== id);
      setView("library");
    } else {
      newList = books.map(b => b.id === curBook.id ? { ...b, chapters: b.chapters.filter((c: any) => c.id !== id) } : b);
    }
    setBooks(newList);
    pushSave(newList);
  };

  const handleFileUpload = (file: File, key: string) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (file.type === "application/pdf") {
        if (result.length > 900000) return alert("PDF too big. Please use a URL link!");
        updateField(key, result);
      } else {
        const img = new Image();
        img.src = result;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_W = 1000;
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

  if (loading) return <div style={{padding: "100px", textAlign: "center", color: "#10b981", fontWeight: "900"}}>PAJJI LEARN LOADING...</div>;

  return (
    <div style={{ display: "flex", height: "100vh", background: "#f8fafc", fontFamily: "sans-serif" }}>
      
      {/* SIDEBAR */}
      <div style={{ width: "260px", background: "#fff", borderRight: "2px solid #e2e8f0", padding: "30px", display: "flex", flexDirection: "column" }}>
        <h1 onClick={() => setView("dashboard")} style={{ color: "#10b981", fontSize: "22px", fontWeight: "900", cursor: "pointer", textAlign: "center", marginBottom: "40px" }}>PAJJI LEARN</h1>
        <nav style={{ flex: 1 }}>
            <button onClick={() => setView("dashboard")} style={{ width: "100%", padding: "14px", border: "none", background: view === "dashboard" ? "#10b981" : "none", color: view === "dashboard" ? "#fff" : "#64748b", borderRadius: "12px", cursor: "pointer", fontWeight: "bold", textAlign: "left", marginBottom: "8px" }}>🏠 Dashboard</button>
            <button onClick={() => setView("library")} style={{ width: "100%", padding: "14px", border: "none", background: view === "library" ? "#10b981" : "none", color: view === "library" ? "#fff" : "#64748b", borderRadius: "12px", cursor: "pointer", fontWeight: "bold", textAlign: "left" }}>📚 Library</button>
        </nav>
        <div style={{ marginTop: "auto", textAlign: "center" }}>
          {saveStatus && <p style={{fontSize: "12px", color: "#10b981", fontWeight: "bold"}}>{saveStatus}</p>}
          {isOwner ? (
            <button onClick={() => { setIsOwner(false); localStorage.removeItem("isPajjiAdmin"); }} style={{color: "red", border: "none", background: "none", cursor: "pointer", fontWeight: "bold"}}>Logout</button>
          ) : (
            <button onClick={() => { if(prompt("Key?") === "pajindersinghpajji") { setIsOwner(true); localStorage.setItem("isPajjiAdmin", "true"); }}} style={{opacity: 0.1}}>Admin</button>
          )}
        </div>
      </div>

      <div style={{ flex: 1, padding: "50px", overflowY: "auto" }}>
        
        {view === "dashboard" && (
            <div style={{textAlign: "center", marginTop: "50px"}}>
                <h1 style={{fontSize: "40px", fontWeight: "900"}}>Welcome, <span style={{color: "#10b981"}}>Learner!</span></h1>
                <button onClick={() => setView("library")} style={{marginTop: "30px", background: "#10b981", color: "#fff", padding: "15px 40px", border: "none", borderRadius: "50px", fontWeight: "bold", cursor: "pointer"}}>Open Library</button>
            </div>
        )}

        {view === "library" && (
          <div>
            <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px"}}>
                <h1>Library</h1>
                {isOwner && <button onClick={handleAddBook} style={{background: "#10b981", color: "#fff", padding: "10px 20px", borderRadius: "10px", border: "none", fontWeight: "bold", cursor: "pointer"}}>+ New Book</button>}
            </div>
            <div style={{display: "flex", gap: "25px", flexWrap: "wrap"}}>
              {books.map(b => (
                <div key={b.id} style={{position: "relative", width: "170px"}}>
                  <div onClick={() => {setCurBook(b); setView("chapters");}} style={{height: "230px", background: "linear-gradient(135deg, #10b981, #059669)", borderRadius: "20px", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "40px", cursor: "pointer"}}>📖</div>
                  <p style={{textAlign: "center", fontWeight: "bold", marginTop: "10px"}}>{b.title}</p>
                  {isOwner && <button onClick={() => deleteItem('book', b.id)} style={{position: "absolute", top: "-5px", right: "-5px", background: "#ef4444", color: "#fff", border: "none", borderRadius: "50%", width: "25px", height: "25px", cursor: "pointer"}}>×</button>}
                </div>
              ))}
            </div>
          </div>
        )}

        {view === "chapters" && curBook && (
          <div>
            <button onClick={() => setView("library")} style={{color: "#10b981", fontWeight: "bold", background: "none", border: "none", cursor: "pointer", marginBottom: "20px"}}>← Back to Library</button>
            <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px"}}>
                <h1>{curBook.title}</h1>
                {isOwner && <button onClick={handleAddLesson} style={{background: "#10b981", color: "#fff", padding: "10px 20px", borderRadius: "10px", border: "none", fontWeight: "bold", cursor: "pointer"}}>+ Add Lesson</button>}
            </div>
            {curBook.chapters?.map((ch: any) => (
              <div key={ch.id} style={{background: "#fff", padding: "20px", borderRadius: "15px", marginBottom: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid #e2e8f0"}}>
                <span style={{fontWeight: "bold", fontSize: "18px"}}>{ch.title}</span>
                <div style={{display: "flex", gap: "10px"}}>
                  <button onClick={() => {setCurChapter(ch); setView("study");}} style={{padding: "10px 20px", borderRadius: "10px", border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", fontWeight: "bold"}}>Study</button>
                  {isOwner && <button onClick={() => {setCurChapter(ch); setView("edit");}} style={{background: "#3b82f6", color: "#fff", border: "none", padding: "10px 20px", borderRadius: "10px", cursor: "pointer", fontWeight: "bold"}}>Edit</button>}
                  {isOwner && <button onClick={() => deleteItem('lesson', ch.id)} style={{background: "#fee2e2", color: "#ef4444", border: "none", padding: "10px 15px", borderRadius: "10px", cursor: "pointer"}}>🗑️</button>}
                </div>
              </div>
            ))}
          </div>
        )}

        {view === "edit" && curChapter && (
          <div style={{background: "#fff", padding: "40px", borderRadius: "25px"}}>
            <button onClick={() => setView("chapters")} style={{background: "#10b981", color: "#fff", padding: "12px 30px", border: "none", borderRadius: "12px", fontWeight: "bold", cursor: "pointer", marginBottom: "30px"}}>Save & Close</button>
            <h2 style={{marginBottom: "15px"}}>Edit: {curChapter.title}</h2>
            <textarea style={{width: "100%", height: "200px", padding: "15px", borderRadius: "15px", border: "1px solid #e2e8f0", fontSize: "16px"}} value={curChapter.summary} onChange={(e) => updateField("summary", e.target.value)} placeholder="Enter lesson notes here..." />
            
            <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginTop: "30px"}}>
               {["slides", "bookPdf", "infographic", "sketchNote", "mindMap"].map(f => (
                 <div key={f} style={{border: "2px dashed #e2e8f0", padding: "20px", borderRadius: "20px", textAlign: "center"}}>
                   <p style={{fontWeight: "bold", textTransform: "uppercase"}}>{f === "bookPdf" ? "Book PDF" : f}</p>
                   <input type="file" onChange={(e: any) => handleFileUpload(e.target.files[0], f)} style={{fontSize: "12px", marginBottom: "10px"}} />
                   <input type="text" placeholder="Or paste URL link..." value={curChapter[f]?.startsWith("data:") ? "" : curChapter[f]} onChange={(e) => updateField(f, e.target.value)} style={{width: "100%", padding: "8px", borderRadius: "8px", border: "1px solid #eee"}} />
                   {curChapter[f] && <p style={{color: "#10b981", fontSize: "12px", marginTop: "8px", fontWeight: "bold"}}>✓ LINKED</p>}
                 </div>
               ))}
            </div>
            <p style={{marginTop: "20px", fontWeight: "bold"}}>Video Link (YouTube):</p>
            <input style={{width: "100%", padding: "10px", borderRadius: "10px", border: "1px solid #ddd"}} value={curChapter.video} onChange={(e) => updateField("video", e.target.value)} />
          </div>
        )}

        {view === "study" && curChapter && (
          <div>
            <button onClick={() => setView("chapters")} style={{color: "#10b981", fontWeight: "bold", background: "none", border: "none", cursor: "pointer", marginBottom: "20px"}}>← Back</button>
            <h1 style={{fontSize: "36px", fontWeight: "900", marginBottom: "30px"}}>{curChapter.title}</h1>
            <div style={{display: "flex", gap: "10px", marginBottom: "30px", flexWrap: "wrap"}}>
              {["Summary", "Video", "Slides", "Book PDF", "Infographic", "Sketch Note", "Mind Map"].map(t => (
                <button key={t} onClick={() => setActiveTab(t)} style={{padding: "12px 25px", background: activeTab === t ? "#10b981" : "#fff", color: activeTab === t ? "#fff" : "#64748b", border: "none", borderRadius: "12px", cursor: "pointer", fontWeight: "bold", boxShadow: "0 4px 10px rgba(0,0,0,0.05)"}}>{t}</button>
              ))}
            </div>
            <div style={{background: "#fff", padding: "40px", borderRadius: "30px", minHeight: "600px"}}>
               {activeTab === "Summary" && <div style={{whiteSpace: "pre-wrap", fontSize: "19px", lineHeight: "1.8"}}>{curChapter.summary || "No notes yet."}</div>}
               {activeTab === "Video" && (curChapter.video ? <iframe width="100%" height="500" src={curChapter.video.replace("watch?v=", "embed/")} frameBorder="0" allowFullScreen style={{borderRadius: "20px"}} /> : "No video linked.")}
               {["Slides", "Book PDF", "Infographic", "Sketch Note", "Mind Map"].includes(activeTab) && (
                 (() => {
                   const key = activeTab === "Book PDF" ? "bookPdf" : activeTab.charAt(0).toLowerCase() + activeTab.slice(1).replace(" ", "");
                   const content = curChapter[key];
                   if (!content) return <p style={{textAlign: "center", color: "#94a3b8", marginTop: "100px"}}>No content available for this tab.</p>;
                   if (content.includes("application/pdf") || content.toLowerCase().endsWith(".pdf")) {
                     return <iframe src={content} width="100%" height="800px" style={{border: "none", borderRadius: "15px"}} />;
                   }
                   return <img src={content} style={{width: "100%", borderRadius: "20px"}} />;
                 })()
               )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}