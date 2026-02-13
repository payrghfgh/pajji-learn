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
      alert("Error: Data too large. Use links for big files!");
      setSaveStatus("Error ❌");
    }
  };

  const handleFileUpload = (file: File, key: string) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (file.type === "application/pdf") {
        if (result.length > 900000) return alert("Too large! Use a Google Drive link.");
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

  const updateField = (key: string, val: string) => {
    const newList = books.map(b => b.id === curBook.id ? {
      ...b, chapters: b.chapters.map((c: any) => c.id === curChapter.id ? { ...c, [key]: val } : c)
    } : b);
    setBooks(newList);
    pushSave(newList);
  };

  const formatYoutubeLink = (url: string) => {
    if (!url) return "";
    let videoId = "";
    if (url.includes("v=")) videoId = url.split("v=")[1].split("&")[0];
    else if (url.includes("youtu.be/")) videoId = url.split("youtu.be/")[1].split("?")[0];
    else if (url.includes("shorts/")) videoId = url.split("shorts/")[1].split("?")[0];
    else if (url.includes("embed/")) return url;
    return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
  };

  if (loading) return <div style={{padding: "50px", textAlign: "center", color: "#10b981", fontWeight: "900"}}>PAJJI LEARN...</div>;

  return (
    <div className="app-container">
      <style>{`
        .app-container { display: flex; height: 100vh; background: #f8fafc; font-family: 'Inter', sans-serif; }
        .sidebar { width: 260px; background: #fff; border-right: 2px solid #e2e8f0; padding: 25px; display: flex; flex-direction: column; }
        .main-content { flex: 1; padding: 30px; overflow-y: auto; }
        .logo { color: #10b981; font-size: 24px; font-weight: 900; letter-spacing: -0.03em; text-transform: uppercase; cursor: pointer; text-align: center; margin-bottom: 30px; }
        .nav-btn { width: 100%; padding: 12px; border: none; border-radius: 12px; cursor: pointer; font-weight: bold; text-align: left; margin-bottom: 8px; font-size: 15px; }
        .tab-grid { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 10px; margin-bottom: 20px; -webkit-overflow-scrolling: touch; }
        .tab-btn { padding: 10px 18px; border: none; border-radius: 10px; cursor: pointer; font-weight: bold; white-space: nowrap; }
        .edit-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 20px; }
        
        @media (max-width: 768px) {
          .app-container { flex-direction: column; }
          .sidebar { width: 100%; height: auto; border-right: none; border-bottom: 2px solid #e2e8f0; padding: 15px; }
          .logo { margin-bottom: 15px; font-size: 20px; }
          .nav-flex { display: flex; gap: 10px; }
          .main-content { padding: 20px; }
          .edit-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* SIDEBAR */}
      <div className="sidebar">
        <h1 className="logo" onClick={() => setView("dashboard")}>PAJJI LEARN</h1>
        <div className="nav-flex">
          <button className="nav-btn" onClick={() => setView("dashboard")} style={{ background: view === "dashboard" ? "#10b981" : "none", color: view === "dashboard" ? "#fff" : "#64748b" }}>🏠 Dashboard</button>
          <button className="nav-btn" onClick={() => setView("library")} style={{ background: view === "library" ? "#10b981" : "none", color: view === "library" ? "#fff" : "#64748b" }}>📚 Library</button>
        </div>
        <div style={{ marginTop: "auto", textAlign: "center" }}>
          {saveStatus && <p style={{fontSize: "12px", color: "#10b981"}}>{saveStatus}</p>}
          {isOwner ? <button onClick={() => {setIsOwner(false); localStorage.removeItem("isPajjiAdmin");}} style={{color: "red", border: "none", background: "none", cursor: "pointer"}}>Logout</button> : <button onClick={() => { if(prompt("Key?") === "pajindersinghpajji") {setIsOwner(true); localStorage.setItem("isPajjiAdmin", "true");}}} style={{opacity: 0.05}}>Admin</button>}
        </div>
      </div>

      <div className="main-content">
        {view === "dashboard" && (
            <div style={{textAlign: "center", marginTop: "20px"}}>
                <h1 style={{fontSize: "32px", fontWeight: "900"}}>Welcome, <span style={{color: "#10b981"}}>Learner!</span></h1>
                <button onClick={() => setView("library")} style={{marginTop: "20px", background: "#10b981", color: "#fff", padding: "12px 35px", border: "none", borderRadius: "50px", fontWeight: "bold", cursor: "pointer"}}>Open Library</button>
            </div>
        )}

        {view === "library" && (
          <div>
            <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px"}}>
                <h1 style={{fontWeight: "900"}}>Library</h1>
                {isOwner && <button onClick={() => {const t = prompt("Name?"); if(t) pushSave([...books, {id: Date.now().toString(), title: t, chapters: []}])}}>+ Book</button>}
            </div>
            <div style={{display: "flex", gap: "20px", flexWrap: "wrap", justifyContent: "center"}}>
              {books.map(b => (
                <div key={b.id} style={{position: "relative", width: "140px"}}>
                  <div onClick={() => {setCurBook(b); setView("chapters");}} style={{height: "190px", background: "#10b981", borderRadius: "15px", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "30px", cursor: "pointer"}}>📖</div>
                  <p style={{textAlign: "center", fontWeight: "bold", marginTop: "8px", fontSize: "14px"}}>{b.title}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === "chapters" && curBook && (
          <div>
            <button onClick={() => setView("library")} style={{color: "#10b981", fontWeight: "bold", background: "none", border: "none"}}>← Back</button>
            <h1 style={{fontWeight: "900", margin: "15px 0"}}>{curBook.title}</h1>
            {curBook.chapters?.map((ch: any) => (
              <div key={ch.id} style={{background: "#fff", padding: "15px", borderRadius: "12px", marginBottom: "10px", display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid #e2e8f0"}}>
                <span style={{fontWeight: "bold"}}>{ch.title}</span>
                <div style={{display: "flex", gap: "5px"}}>
                  <button onClick={() => {setCurChapter(ch); setView("study");}} style={{padding: "8px 15px", borderRadius: "8px", border: "1px solid #ddd", background: "#fff"}}>Study</button>
                  {isOwner && <button onClick={() => {setCurChapter(ch); setView("edit");}} style={{background: "#3b82f6", color: "#fff", border: "none", borderRadius: "8px", padding: "8px 12px"}}>Edit</button>}
                </div>
              </div>
            ))}
          </div>
        )}

        {view === "edit" && curChapter && (
           <div style={{background: "#fff", padding: "20px", borderRadius: "20px"}}>
              <button onClick={() => setView("chapters")} style={{background: "#10b981", color: "#fff", padding: "10px 20px", borderRadius: "10px", border: "none", marginBottom: "20px"}}>Save & Close</button>
              <textarea style={{width: "100%", height: "100px", padding: "10px"}} value={curChapter.summary} onChange={(e) => updateField("summary", e.target.value)} placeholder="Lesson summary..." />
              
              <div className="edit-grid">
                {["video", "slides", "bookPdf", "infographic", "sketchNote", "mindMap"].map(f => (
                  <div key={f} style={{border: "1px solid #eee", padding: "10px", borderRadius: "10px"}}>
                    <p style={{fontSize: "12px", fontWeight: "bold", textTransform: "uppercase"}}>{f}</p>
                    <input type="text" style={{width: "100%", fontSize: "12px"}} value={curChapter[f] || ""} onChange={(e) => updateField(f, e.target.value)} placeholder="Paste link..." />
                    <input type="file" style={{fontSize: "10px", marginTop: "5px"}} onChange={(e: any) => handleFileUpload(e.target.files[0], f)} />
                  </div>
                ))}
              </div>
           </div>
        )}

        {view === "study" && curChapter && (
          <div>
            <button onClick={() => setView("chapters")} style={{color: "#10b981", fontWeight: "bold", background: "none", border: "none"}}>← Back</button>
            <h1 style={{fontSize: "24px", fontWeight: "900", margin: "10px 0"}}>{curChapter.title}</h1>
            <div className="tab-grid">
              {["Summary", "Video", "Book PDF", "Slides", "Infographic", "Sketch Note", "Mind Map"].map(t => (
                <button key={t} onClick={() => setActiveTab(t)} className="tab-btn" style={{ background: activeTab === t ? "#10b981" : "#fff", color: activeTab === t ? "#fff" : "#64748b" }}>{t}</button>
              ))}
            </div>
            <div style={{background: "#fff", padding: "20px", borderRadius: "20px", minHeight: "400px", boxShadow: "0 4px 15px rgba(0,0,0,0.05)"}}>
               {activeTab === "Summary" && <div style={{whiteSpace: "pre-wrap", lineHeight: "1.6"}}>{curChapter.summary || "No notes."}</div>}
               
               {activeTab === "Video" && (
                 curChapter.video ? (
                   <iframe width="100%" height="450px" src={formatYoutubeLink(curChapter.video)} frameBorder="0" allowFullScreen style={{borderRadius: "15px"}} />
                 ) : "No video."
               )}
               
               {["Book PDF", "Slides", "Infographic", "Sketch Note", "Mind Map"].includes(activeTab) && (
                 (() => {
                   const key = activeTab === "Book PDF" ? "bookPdf" : activeTab.charAt(0).toLowerCase() + activeTab.slice(1).replace(" ", "");
                   let content = curChapter[key];
                   if (!content) return "Not available.";
                   
                   if (content.includes("drive.google.com")) {
                     content = content.replace("/view", "/preview").split("?")[0];
                     return <iframe src={content} width="100%" height="700px" style={{border: "none", borderRadius: "12px"}} />;
                   }
                   if (content.startsWith("data:image") || content.match(/\.(jpeg|jpg|gif|png)$/) != null) {
                     return <img src={content} style={{width: "100%", borderRadius: "12px"}} />;
                   }
                   return <iframe src={content} width="100%" height="700px" style={{border: "none", borderRadius: "12px"}} />;
                 })()
               )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}