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
        if (curChapter) {
          const b = d.find((x: any) => x.id === curBook?.id);
          const c = b?.chapters?.find((y: any) => y.id === curChapter.id);
          if (c) setCurChapter(c);
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
      alert("Error: Data too large. Use URLs for big files.");
      setSaveStatus("Error ❌");
    }
  };

  const handleFileUpload = (file: File, key: string) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (file.type === "application/pdf") {
        if (result.length > 900000) return alert("PDF too large for database.");
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
          updateField(key, canvas.toDataURL("image/jpeg", 0.6));
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

  const deleteItem = (type: 'book' | 'lesson', id: string) => {
    if (!confirm(`Are you sure you want to delete this ${type}?`)) return;
    let updated;
    if (type === 'book') {
      updated = books.filter(b => b.id !== id);
      setView("library");
    } else {
      updated = books.map(b => b.id === curBook.id ? { ...b, chapters: b.chapters.filter((c: any) => c.id !== id) } : b);
    }
    setBooks(updated);
    pushSave(updated);
  };

  if (loading) return <div style={{padding: "100px", textAlign: "center", fontWeight: "bold", color: "#10b981"}}>INITIALIZING PAJJI LEARN...</div>;

  return (
    <div style={{ display: "flex", height: "100vh", background: "#f8fafc", fontFamily: "sans-serif", color: "#1e293b" }}>
      
      {/* SIDEBAR */}
      <div style={{ width: "260px", background: "#fff", borderRight: "2px solid #e2e8f0", padding: "30px", display: "flex", flexDirection: "column" }}>
        <h1 onClick={() => setView("dashboard")} style={{ color: "#10b981", fontSize: "22px", fontWeight: "900", cursor: "pointer", textAlign: "center", marginBottom: "40px" }}>PAJJI LEARN</h1>
        
        <nav style={{ flex: 1 }}>
            <button onClick={() => setView("dashboard")} style={{ width: "100%", padding: "14px", border: "none", background: view === "dashboard" ? "#10b981" : "none", color: view === "dashboard" ? "#fff" : "#64748b", borderRadius: "12px", cursor: "pointer", fontWeight: "bold", textAlign: "left", marginBottom: "8px" }}>🏠 Dashboard</button>
            <button onClick={() => setView("library")} style={{ width: "100%", padding: "14px", border: "none", background: view === "library" ? "#10b981" : "none", color: view === "library" ? "#fff" : "#64748b", borderRadius: "12px", cursor: "pointer", fontWeight: "bold", textAlign: "left" }}>📚 Library</button>
        </nav>
        
        <div style={{ marginTop: "auto", textAlign: "center" }}>
          {saveStatus && <p style={{fontSize: "12px", color: "#10b981", fontWeight: "bold"}}>{saveStatus}</p>}
          {!isOwner ? (
            <button onClick={() => { if(prompt("Key?") === "pajindersinghpajji") { setIsOwner(true); localStorage.setItem("isPajjiAdmin", "true"); }}} style={{opacity: 0.1, border: "none", background: "none", cursor: "pointer"}}>Admin</button>
          ) : (
            <button onClick={() => { setIsOwner(false); localStorage.removeItem("isPajjiAdmin"); }} style={{color: "#ef4444", fontWeight: "bold", background: "none", border: "none", cursor: "pointer"}}>Logout</button>
          )}
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div style={{ flex: 1, padding: "50px", overflowY: "auto" }}>
        
        {view === "dashboard" && (
            <div style={{maxWidth: "800px", margin: "0 auto", textAlign: "center"}}>
                <h1 style={{fontSize: "48px", fontWeight: "900", marginBottom: "10px"}}>Welcome, <span style={{color: "#10b981"}}>Pajji!</span></h1>
                <div style={{display: "flex", gap: "25px", justifyContent: "center", marginTop: "40px"}}>
                    <div style={{background: "#fff", padding: "30px", borderRadius: "20px", width: "180px", boxShadow: "0 10px 25px rgba(0,0,0,0.05)"}}>
                        <h2 style={{fontSize: "32px", color: "#10b981", margin: 0}}>{books.length}</h2>
                        <p style={{color: "#94a3b8", fontWeight: "bold", margin: 0}}>Books</p>
                    </div>
                    <div style={{background: "#fff", padding: "30px", borderRadius: "20px", width: "180px", boxShadow: "0 10px 25px rgba(0,0,0,0.05)"}}>
                        <h2 style={{fontSize: "32px", color: "#3b82f6", margin: 0}}>{books.reduce((acc, b) => acc + (b.chapters?.length || 0), 0)}</h2>
                        <p style={{color: "#94a3b8", fontWeight: "bold", margin: 0}}>Lessons</p>
                    </div>
                </div>
                <button onClick={() => setView("library")} style={{marginTop: "50px", background: "#10b981", color: "#fff", padding: "18px 50px", border: "none", borderRadius: "50px", fontWeight: "900", fontSize: "18px", cursor: "pointer"}}>Enter Library</button>
            </div>
        )}

        {view === "library" && (
          <div>
            <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px"}}>
                <h1>Library</h1>
                {isOwner && <button onClick={() => { const t = prompt("Book Title?"); if(t) { const nb = [...books, {id: Date.now().toString(), title: t, chapters: []}]; setBooks(nb); pushSave(nb); }}} style={{background: "#10b981", color: "#fff", padding: "10px 20px", borderRadius: "10px", border: "none", fontWeight: "bold", cursor: "pointer"}}>+ New Book</button>}
            </div>
            <div style={{display: "flex", gap: "30px", flexWrap: "wrap"}}>
              {books.map(b => (
                <div key={b.id} style={{position: "relative", width: "180px"}}>
                  <div onClick={() => {setCurBook(b); setView("chapters");}} style={{height: "250px", background: "linear-gradient(135deg, #10b981, #059669)", borderRadius: "20px", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "50px", cursor: "pointer", boxShadow: "0 10px 20px rgba(0,0,0,0.05)"}}>📖</div>
                  <p style={{textAlign: "center", fontWeight: "bold", marginTop: "15px", fontSize: "18px"}}>{b.title}</p>
                  {isOwner && <button onClick={() => deleteItem('book', b.id)} style={{position: "absolute", top: "10px", right: "10px", background: "rgba(255,255,255,0.8)", border: "none", borderRadius: "50%", width: "30px", height: "30px", cursor: "pointer", color: "red", fontWeight: "bold"}}>×</button>}
                </div>
              ))}
            </div>
          </div>
        )}

        {view === "chapters" && curBook && (
          <div>
            <button onClick={() => setView("library")} style={{color: "#10b981", fontWeight: "bold", border: "none", background: "none", cursor: "pointer", marginBottom: "20px"}}>← Library</button>
            <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px"}}>
                <h1>{curBook.title}</h1>
                {isOwner && <button onClick={() => { const t = prompt("Lesson Name?"); if(t) { const nch = {id: Date.now().toString(), title: t, summary: "", video: "", slides: "", infographic: "", sketchNote: "", mindMap: ""}; const nb = books.map(b => b.id === curBook.id ? {...b, chapters: [...(b.chapters || []), nch]} : b); setBooks(nb); pushSave(nb); }}} style={{background: "#10b981", color: "#fff", padding: "10px 20px", borderRadius: "10px", border: "none", fontWeight: "bold", cursor: "pointer"}}>+ Add Lesson</button>}
            </div>
            {curBook.chapters?.map((ch: any, i: number) => (
              <div key={ch.id} style={{background: "#fff", padding: "20px", borderRadius: "15px", marginBottom: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid #e2e8f0"}}>
                <span style={{fontWeight: "bold", fontSize: "18px"}}>{i+1}. {ch.title}</span>
                <div style={{display: "flex", gap: "10px"}}>
                  <button onClick={() => {setCurChapter(ch); setView("study");}} style={{padding: "10px 20px", borderRadius: "10px", border: "1px solid #e2e8f0", background: "#fff", fontWeight: "bold", cursor: "pointer"}}>Study</button>
                  {isOwner && <button onClick={() => {setCurChapter(ch); setView("edit");}} style={{background: "#3b82f6", color: "#fff", border: "none", padding: "10px 20px", borderRadius: "10px", fontWeight: "bold", cursor: "pointer"}}>Edit</button>}
                  {isOwner && <button onClick={() => deleteItem('lesson', ch.id)} style={{background: "#fee2e2", color: "#ef4444", border: "none", padding: "10px 15px", borderRadius: "10px", cursor: "pointer"}}>🗑️</button>}
                </div>
              </div>
            ))}
          </div>
        )}

        {view === "edit" && curChapter && (
          <div style={{background: "#fff", padding: "40px", borderRadius: "25px"}}>
            <button onClick={() => setView("chapters")} style={{background: "#10b981", color: "#fff", padding: "12px 30px", border: "none", borderRadius: "12px", fontWeight: "bold", cursor: "pointer", marginBottom: "30px"}}>Save & Close Editor</button>
            <textarea style={{width: "100%", height: "200px", padding: "15px", borderRadius: "15px", border: "1px solid #e2e8f0", fontSize: "16px"}} value={curChapter.summary} onChange={(e) => updateField("summary", e.target.value)} placeholder="Lesson Summary..." />
            
            <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginTop: "30px"}}>
               {["slides", "infographic", "sketchNote", "mindMap"].map(f => (
                 <div key={f} style={{border: "2px dashed #e2e8f0", padding: "20px", borderRadius: "20px", textAlign: "center"}}>
                   <p style={{fontWeight: "bold", textTransform: "uppercase"}}>{f}</p>
                   <input type="file" onChange={(e: any) => handleFileUpload(e.target.files[0], f)} />
                   <input type="text" placeholder="Or paste URL..." value={curChapter[f]?.startsWith("data:") ? "" : curChapter[f]} onChange={(e) => updateField(f, e.target.value)} style={{width: "100%", marginTop: "10px", padding: "8px", borderRadius: "8px", border: "1px solid #eee"}} />
                   {curChapter[f] && <p style={{color: "#10b981", fontSize: "12px", marginTop: "5px"}}>✓ ATTACHED</p>}
                 </div>
               ))}
            </div>
          </div>
        )}

        {view === "study" && curChapter && (
          <div>
            <button onClick={() => setView("chapters")} style={{color: "#10b981", fontWeight: "bold", border: "none", background: "none", cursor: "pointer", marginBottom: "20px"}}>← Back</button>
            <h1 style={{fontSize: "36px", fontWeight: "900", marginBottom: "30px"}}>{curChapter.title}</h1>
            <div style={{display: "flex", gap: "10px", marginBottom: "30px", flexWrap: "wrap"}}>
              {["Summary", "Video", "Slides", "Infographic", "Sketch Note", "Mind Map"].map(t => (
                <button key={t} onClick={() => setActiveTab(t)} style={{padding: "12px 25px", background: activeTab === t ? "#10b981" : "#fff", color: activeTab === t ? "#fff" : "#64748b", border: "none", borderRadius: "12px", cursor: "pointer", fontWeight: "bold", boxShadow: "0 4px 10px rgba(0,0,0,0.05)"}}>{t}</button>
              ))}
            </div>
            <div style={{background: "#fff", padding: "40px", borderRadius: "30px", minHeight: "600px"}}>
               {activeTab === "Summary" && <div style={{whiteSpace: "pre-wrap", fontSize: "19px", lineHeight: "1.8"}}>{curChapter.summary || "No notes yet."}</div>}
               {activeTab === "Video" && (curChapter.video ? <iframe width="100%" height="500" src={curChapter.video.replace("watch?v=", "embed/")} frameBorder="0" allowFullScreen style={{borderRadius: "20px"}} /> : "No video.")}
               {["Slides", "Infographic", "Sketch Note", "Mind Map"].includes(activeTab) && (
                 (() => {
                   const key = activeTab.charAt(0).toLowerCase() + activeTab.slice(1).replace(" ", "");
                   const content = curChapter[key];
                   if (!content) return "No content.";
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