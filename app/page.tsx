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
    setSaveStatus("Saving...");
    try {
      await setDoc(doc(db, "data", "pajji_database"), { books: newList });
      setSaveStatus("Saved ✅");
      setTimeout(() => setSaveStatus(""), 2000);
    } catch (e) {
      alert("CRITICAL ERROR: File too large! Firestore limit is 1MB. Use a URL link for large PDFs instead.");
      setSaveStatus("Error ❌");
    }
  };

  const handleFileUpload = (file: File, key: string) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;

      if (file.type === "application/pdf") {
        // PDF Handling (No compression possible for PDF files)
        if (result.length > 800000) {
            alert("This PDF is too big to upload directly (Max ~800KB). Upload to Google Drive and paste the link instead!");
            return;
        }
        updateField(key, result);
      } else {
        // Image Compression
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
          const base64 = canvas.toDataURL("image/jpeg", 0.5);
          updateField(key, base64);
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

  if (loading) return <div style={{padding: "50px", textAlign: "center"}}>Loading...</div>;

  return (
    <div style={{ display: "flex", height: "100vh", background: "#f8fafc", fontFamily: "sans-serif" }}>
      
      {/* SIDEBAR */}
      <div style={{ width: "260px", background: "#fff", borderRight: "2px solid #eee", padding: "30px" }}>
        <h1 onClick={() => setView("dashboard")} style={{ color: "#10b981", cursor: "pointer", textAlign: "center" }}>PAJJI LEARN</h1>
        <button onClick={() => setView("dashboard")} style={{ width: "100%", padding: "12px", border: "none", background: view === "dashboard" ? "#10b981" : "none", color: view === "dashboard" ? "#fff" : "#64748b", borderRadius: "10px", cursor: "pointer", fontWeight: "bold" }}>🏠 Dashboard</button>
        <button onClick={() => setView("library")} style={{ width: "100%", padding: "12px", border: "none", background: view === "library" ? "#10b981" : "none", color: view === "library" ? "#fff" : "#64748b", borderRadius: "10px", cursor: "pointer", fontWeight: "bold", marginTop: "10px" }}>📚 Library</button>
        
        <div style={{ marginTop: "auto", paddingTop: "100px", textAlign: "center" }}>
          {saveStatus && <p style={{fontSize: "12px", color: "#10b981"}}>{saveStatus}</p>}
          {!isOwner ? (
            <button onClick={() => { if(prompt("Key?") === "pajindersinghpajji") { setIsOwner(true); localStorage.setItem("isPajjiAdmin", "true"); }}} style={{opacity: 0.2}}>Admin</button>
          ) : (
            <button onClick={() => { setIsOwner(false); localStorage.removeItem("isPajjiAdmin"); }} style={{color: "red", background: "none", border: "none", cursor: "pointer"}}>Logout</button>
          )}
        </div>
      </div>

      {/* MAIN */}
      <div style={{ flex: 1, padding: "40px", overflowY: "auto" }}>
        
        {view === "dashboard" && (
            <div style={{textAlign: "center", marginTop: "50px"}}>
                <h1 style={{fontSize: "40px"}}>Welcome, <span style={{color: "#10b981"}}>Learner!</span></h1>
                <div style={{display: "flex", gap: "20px", justifyContent: "center", marginTop: "30px"}}>
                    <div style={{background: "#fff", padding: "20px", borderRadius: "15px", width: "150px", boxShadow: "0 4px 10px rgba(0,0,0,0.05)"}}>
                        <h3>{books.length}</h3>
                        <p>Books</p>
                    </div>
                    <div style={{background: "#fff", padding: "20px", borderRadius: "15px", width: "150px", boxShadow: "0 4px 10px rgba(0,0,0,0.05)"}}>
                        <h3>{books.reduce((acc, b) => acc + (b.chapters?.length || 0), 0)}</h3>
                        <p>Lessons</p>
                    </div>
                </div>
                <button onClick={() => setView("library")} style={{marginTop: "40px", background: "#10b981", color: "#fff", padding: "15px 40px", border: "none", borderRadius: "50px", fontWeight: "bold", cursor: "pointer"}}>Open Library</button>
            </div>
        )}

        {view === "library" && (
          <div>
            <h1>Library</h1>
            <div style={{display: "flex", gap: "20px", flexWrap: "wrap", marginTop: "20px"}}>
              {books.map(b => (
                <div key={b.id} onClick={() => {setCurBook(b); setView("chapters");}} style={{width: "160px", cursor: "pointer"}}>
                  <div style={{height: "220px", background: "#10b981", borderRadius: "20px", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "40px"}}>📖</div>
                  <p style={{textAlign: "center", fontWeight: "bold"}}>{b.title}</p>
                </div>
              ))}
              {isOwner && <button onClick={() => { const t = prompt("Book?"); if(t) { const nb = [...books, {id: Date.now().toString(), title: t, chapters: []}]; setBooks(nb); pushSave(nb); }}} style={{width: "160px", height: "220px", border: "2px dashed #ccc", borderRadius: "20px"}}>+ Add Book</button>}
            </div>
          </div>
        )}

        {view === "chapters" && curBook && (
          <div>
            <button onClick={() => setView("library")}>← Back</button>
            <h1>{curBook.title}</h1>
            {curBook.chapters?.map((ch: any) => (
              <div key={ch.id} style={{background: "#fff", padding: "20px", borderRadius: "15px", marginBottom: "10px", display: "flex", justifyContent: "space-between", alignItems: "center"}}>
                <span style={{fontWeight: "bold"}}>{ch.title}</span>
                <div>
                  <button onClick={() => {setCurChapter(ch); setView("study");}} style={{padding: "8px 20px", borderRadius: "8px", cursor: "pointer"}}>Study</button>
                  {isOwner && <button onClick={() => {setCurChapter(ch); setView("edit");}} style={{marginLeft: "10px", background: "#3b82f6", color: "#fff", border: "none", padding: "8px 20px", borderRadius: "8px", cursor: "pointer"}}>Edit</button>}
                </div>
              </div>
            ))}
            {isOwner && <button onClick={() => { const t = prompt("Lesson?"); if(t) { const nch = {id: Date.now().toString(), title: t, summary: "", video: "", slides: "", infographic: "", sketchNote: "", mindMap: ""}; const nb = books.map(b => b.id === curBook.id ? {...b, chapters: [...(b.chapters || []), nch]} : b); setBooks(nb); pushSave(nb); }}} style={{marginTop: "20px"}}>+ Add Lesson</button>}
          </div>
        )}

        {view === "edit" && curChapter && (
          <div style={{background: "#fff", padding: "30px", borderRadius: "20px"}}>
            <button onClick={() => setView("chapters")} style={{background: "#10b981", color: "#fff", border: "none", padding: "10px 25px", borderRadius: "10px", cursor: "pointer", fontWeight: "bold"}}>Save & Exit</button>
            <h2 style={{marginTop: "20px"}}>Editing: {curChapter.title}</h2>
            
            <p style={{fontWeight: "bold"}}>Lesson Notes:</p>
            <textarea style={{width: "100%", height: "150px", padding: "10px", borderRadius: "10px", border: "1px solid #ddd"}} value={curChapter.summary} onChange={(e) => updateField("summary", e.target.value)} />

            <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginTop: "20px"}}>
               {["slides", "infographic", "sketchNote", "mindMap"].map(f => (
                 <div key={f} style={{border: "1px dashed #ccc", padding: "15px", borderRadius: "15px", textAlign: "center"}}>
                   <p style={{fontWeight: "bold", textTransform: "uppercase"}}>{f}</p>
                   
                   <p style={{fontSize: "12px", color: "#666"}}>Upload File (Max 800KB):</p>
                   <input type="file" accept="image/*,application/pdf" onChange={(e: any) => handleFileUpload(e.target.files[0], f)} style={{fontSize: "12px"}} />
                   
                   <p style={{fontSize: "12px", color: "#666", marginTop: "10px"}}>OR Paste URL:</p>
                   <input type="text" placeholder="https://..." value={curChapter[f]?.startsWith("data:") ? "" : curChapter[f]} onChange={(e) => updateField(f, e.target.value)} style={{width: "90%", padding: "5px", borderRadius: "5px", border: "1px solid #eee"}} />
                   
                   {curChapter[f] && <p style={{color: "#10b981", fontSize: "12px", fontWeight: "bold", marginTop: "5px"}}>✓ ATTACHED</p>}
                 </div>
               ))}
            </div>
            
            <p style={{fontWeight: "bold", marginTop: "20px"}}>YouTube Video URL:</p>
            <input style={{width: "100%", padding: "10px", borderRadius: "10px", border: "1px solid #ddd"}} value={curChapter.video} onChange={(e) => updateField("video", e.target.value)} />
          </div>
        )}

        {view === "study" && curChapter && (
          <div>
            <button onClick={() => setView("chapters")} style={{color: "#10b981", fontWeight: "bold", background: "none", border: "none", cursor: "pointer", marginBottom: "20px"}}>← Back</button>
            <h1>{curChapter.title}</h1>
            
            <div style={{display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap"}}>
              {["Summary", "Video", "Slides", "Infographic", "Sketch Note", "Mind Map"].map(t => (
                <button key={t} onClick={() => setActiveTab(t)} style={{padding: "10px 20px", background: activeTab === t ? "#10b981" : "#fff", color: activeTab === t ? "#fff" : "#333", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "bold", boxShadow: "0 2px 5px rgba(0,0,0,0.05)"}}>{t}</button>
              ))}
            </div>

            <div style={{background: "#fff", padding: "40px", borderRadius: "25px", minHeight: "500px", boxShadow: "0 10px 30px rgba(0,0,0,0.02)"}}>
               {activeTab === "Summary" && <div style={{whiteSpace: "pre-wrap", fontSize: "18px", lineHeight: "1.6"}}>{curChapter.summary || "No notes available."}</div>}
               
               {activeTab === "Video" && (
                 curChapter.video ? <iframe width="100%" height="500" src={curChapter.video.replace("watch?v=", "embed/")} frameBorder="0" allowFullScreen style={{borderRadius: "15px"}} /> : "No video attached."
               )}

               {["Slides", "Infographic", "Sketch Note", "Mind Map"].includes(activeTab) && (
                 (() => {
                   const key = activeTab.charAt(0).toLowerCase() + activeTab.slice(1).replace(" ", "");
                   const content = curChapter[key];
                   if (!content) return <p>No {activeTab} available.</p>;

                   // If it's a PDF (Base64 or URL)
                   if (content.includes("application/pdf") || content.toLowerCase().endsWith(".pdf")) {
                     return <iframe src={content} width="100%" height="800px" style={{border: "none", borderRadius: "15px"}} />;
                   }
                   // If it's an Image
                   return <img src={content} style={{width: "100%", borderRadius: "15px"}} />;
                 })()
               )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}