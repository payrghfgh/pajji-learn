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
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (localStorage.getItem("isPajjiAdmin") === "true") setIsOwner(true);
    const unsub = onSnapshot(doc(db, "data", "pajji_database"), (ds) => {
      setLoading(false);
      if (ds.exists()) {
        const d = ds.data().books || [];
        setBooks(d);
      }
    });
    return () => unsub();
  }, []);

  const pushSave = async (newList: any[]) => {
    setSaveStatus("Saving...");
    try {
      await setDoc(doc(db, "data", "pajji_database"), { books: newList });
      setSaveStatus("Saved ✅");
      setTimeout(() => setSaveStatus(""), 2000);
    } catch (e) {
      setSaveStatus("Error ❌");
    }
  };

  const updateField = (key: string, val: string) => {
    const newList = books.map(b => b.id === curBook.id ? {
      ...b, chapters: b.chapters.map((c: any) => c.id === curChapter.id ? { ...c, [key]: val } : c)
    } : b);
    
    setBooks(newList);
    const updatedBook = newList.find(b => b.id === curBook.id);
    setCurBook(updatedBook);
    const updatedChapter = updatedBook.chapters.find((c: any) => c.id === curChapter.id);
    setCurChapter(updatedChapter);
    pushSave(newList);
  };

  const handleFileUpload = (e: any, key: string) => {
    const file = e.target.files[0];
    if (!file || file.size > 1048576) return alert("File too large (Max 1MB).");
    const reader = new FileReader();
    reader.onload = (event: any) => updateField(key, event.target.result);
    reader.readAsDataURL(file);
  };

  const deleteItem = (type: 'book' | 'lesson', id: string) => {
    if (!confirm(`Permanently delete this ${type}?`)) return;
    let newList;
    if (type === 'book') {
      newList = books.filter(b => b.id !== id);
      setView("library");
    } else {
      newList = books.map(b => b.id === curBook.id ? { ...b, chapters: (b.chapters || []).filter((c: any) => c.id !== id) } : b);
      const updatedBook = newList.find(b => b.id === curBook.id);
      setCurBook(updatedBook);
    }
    setBooks(newList);
    pushSave(newList);
  };

  const formatYoutubeLink = (url: string) => {
    if (!url) return "";
    let vid = url.includes("v=") ? url.split("v=")[1].split("&")[0] : url.includes("youtu.be/") ? url.split("youtu.be/")[1].split("?")[0] : url.includes("shorts/") ? url.split("shorts/")[1].split("?")[0] : "";
    return vid ? `https://www.youtube.com/embed/${vid}` : url;
  };

  const searchResults = searchQuery.trim() ? books.flatMap(b => (b.chapters || []).filter((c: any) => c.title.toLowerCase().includes(searchQuery.toLowerCase())).map(c => ({...c, parentBook: b}))) : [];

  if (loading) return <div style={{padding: "50px", textAlign: "center", color: "#10b981", fontWeight: "900", fontFamily: "sans-serif"}}>PAJJI LEARN...</div>;

  return (
    <div className="app-container">
      <style>{`
        :root { --bg: #f8fafc; --card: #ffffff; --text: #1e293b; --border: #e2e8f0; --input-bg: #ffffff; }
        @media (prefers-color-scheme: dark) {
          :root { --bg: #0f172a; --card: #1e293b; --text: #f8fafc; --border: #334155; --input-bg: #2d3748; }
        }
        .app-container { display: flex; height: 100vh; background: var(--bg); color: var(--text); font-family: 'Inter', sans-serif; }
        .sidebar { width: 260px; background: var(--card); border-right: 2px solid var(--border); padding: 25px; display: flex; flex-direction: column; }
        .main-content { flex: 1; padding: 40px; overflow-y: auto; }
        .logo-area { text-align: center; margin-bottom: 30px; }
        .logo { color: #10b981; font-size: 24px; font-weight: 900; cursor: pointer; margin: 0; }
        .nav-btn { width: 100%; padding: 12px; border: none; border-radius: 12px; cursor: pointer; font-weight: bold; text-align: left; margin-bottom: 8px; color: var(--text); background: none; }
        .search-input { width: 100%; padding: 15px 20px; border-radius: 15px; border: 2px solid var(--border); background: var(--card); color: var(--text); outline: none; margin-bottom: 30px; }
        .card { background: var(--card); border: 1px solid var(--border); padding: 20px; border-radius: 20px; position: relative; }
        .tab-btn { padding: 10px 18px; border: none; border-radius: 10px; cursor: pointer; font-weight: bold; background: var(--card); color: var(--text); border: 1px solid var(--border); margin-right: 5px; margin-bottom: 5px; }
        textarea { width: 100%; min-height: 120px; padding: 15px; border-radius: 12px; border: 2px solid var(--border); background: var(--input-bg); color: var(--text); font-size: 16px; font-family: inherit; }
        .del-btn-mini { position: absolute; top: -10px; right: -10px; background: #ef4444; color: #fff; border: none; border-radius: 50%; width: 28px; height: 28px; cursor: pointer; font-weight: bold; display: flex; align-items: center; justify-content: center; z-index: 10; border: 2px solid var(--card); }
        @media (max-width: 768px) { .app-container { flex-direction: column; } .sidebar { width: 100%; height: auto; } }
      `}</style>

      {/* SIDEBAR */}
      <div className="sidebar">
        <div className="logo-area">
            <h1 className="logo" onClick={() => setView("dashboard")}>PAJJI LEARN</h1>
            <p style={{fontSize: "10px", color: "#10b981", height: "15px", margin: "5px 0"}}>{saveStatus}</p>
        </div>
        
        <button className="nav-btn" onClick={() => setView("dashboard")} style={view === "dashboard" ? {background: "#10b981", color: "#fff"} : {}}>🏠 Dashboard</button>
        <button className="nav-btn" onClick={() => setView("library")} style={view === "library" ? {background: "#10b981", color: "#fff"} : {}}>📚 Library</button>
        
        <div style={{ marginTop: "auto" }}>
          <button onClick={() => { if(isOwner) { setIsOwner(false); localStorage.removeItem("isPajjiAdmin"); } else if(prompt("Key?") === "pajindersinghpajji") { setIsOwner(true); localStorage.setItem("isPajjiAdmin", "true"); }}} style={{width: "100%", padding: "10px", background: isOwner ? "#fee2e2" : "var(--bg)", color: isOwner ? "#ef4444" : "#94a3b8", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer"}}>{isOwner ? "Logout Admin" : "⚙️ Admin Login"}</button>
        </div>
      </div>

      <div className="main-content">
        <div style={{maxWidth: "600px", margin: "0 auto"}}>
           <input type="text" className="search-input" placeholder="🔍 Find a lesson..." value={searchQuery} onChange={(e) => {setSearchQuery(e.target.value); setView("dashboard");}} />
        </div>

        {/* DASHBOARD & SEARCH */}
        {searchQuery && view === "dashboard" && (
          <div style={{maxWidth: "800px", margin: "0 auto"}}>
            {searchResults.map(res => (
              <div key={res.id} onClick={() => { setCurBook(res.parentBook); setCurChapter(res); setView("study"); setSearchQuery(""); }} className="card" style={{marginBottom: "10px", cursor: "pointer", display: "flex", justifyContent: "space-between"}}>
                <span style={{fontWeight: "bold"}}>{res.title}</span>
                <span style={{color: "#10b981", fontSize: "12px"}}>{res.parentBook.title}</span>
              </div>
            ))}
          </div>
        )}

        {view === "dashboard" && !searchQuery && (
          <div style={{maxWidth: "800px", margin: "0 auto"}}>
             <div style={{ background: "linear-gradient(135deg, #10b981, #059669)", padding: "40px", borderRadius: "24px", color: "#fff", marginBottom: "30px" }}>
              <h1 style={{ fontSize: "32px", fontWeight: "900", margin: 0 }}>Welcome back, Learner!👋</h1>
              <p>Select a book from the library or search for a lesson above</p>
            </div>
            <div style={{display: "flex", gap: "15px"}}>
              <div className="card" style={{flex: 1, textAlign: "center"}}><h2>{books.length} Books</h2></div>
              <div className="card" style={{flex: 1, textAlign: "center"}}><h2>{books.reduce((a, b) => a + (b.chapters?.length || 0), 0)} Lessons</h2></div>
            </div>
          </div>
        )}

        {/* LIBRARY */}
        {view === "library" && (
          <div>
            <div style={{display: "flex", justifyContent: "space-between", marginBottom: "20px"}}>
              <h1>Library</h1>
              {isOwner && <button onClick={() => {const t = prompt("Book Name?"); if(t) pushSave([...books, {id: Date.now().toString(), title: t, chapters: []}])}} style={{background: "#10b981", color: "#fff", padding: "10px 20px", border: "none", borderRadius: "10px", fontWeight: "bold", cursor: "pointer"}}>+ New Book</button>}
            </div>
            <div style={{display: "flex", gap: "25px", flexWrap: "wrap"}}>
              {books.map(b => (
                <div key={b.id} style={{position: "relative"}}>
                  <div onClick={() => {setCurBook(b); setView("chapters");}} style={{width: "130px", height: "180px", background: "linear-gradient(135deg, #10b981, #059669)", borderRadius: "15px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "40px", cursor: "pointer", boxShadow: "0 10px 20px rgba(0,0,0,0.1)"}}>📖</div>
                  <p style={{textAlign: "center", fontWeight: "bold", marginTop: "10px", width: "130px"}}>{b.title}</p>
                  {isOwner && <button onClick={() => deleteItem('book', b.id)} className="del-btn-mini">×</button>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CHAPTERS */}
        {view === "chapters" && curBook && (
          <div>
            <button onClick={() => setView("library")} style={{color: "#10b981", background: "none", border: "none", marginBottom: "20px", fontWeight: "bold", cursor: "pointer"}}>← Back to Library</button>
            <h1 style={{marginBottom: "20px"}}>{curBook.title}</h1>
            {curBook.chapters?.map((ch: any) => (
              <div key={ch.id} className="card" style={{display: "flex", justifyContent: "space-between", marginBottom: "10px", alignItems: "center"}}>
                <span style={{fontWeight: "bold", fontSize: "18px"}}>{ch.title}</span>
                <div style={{display: "flex", gap: "10px"}}>
                  <button onClick={() => {setCurChapter(ch); setView("study");}} style={{padding: "8px 18px", borderRadius: "8px", border: "1px solid var(--border)", background: "none", color: "var(--text)", cursor: "pointer"}}>Study</button>
                  {isOwner && <button onClick={() => {setCurChapter(ch); setView("edit");}} style={{background: "#3b82f6", color: "#fff", border: "none", borderRadius: "8px", padding: "8px 18px", cursor: "pointer"}}>Edit</button>}
                  {isOwner && <button onClick={() => deleteItem('lesson', ch.id)} style={{background: "#ef4444", color: "#fff", border: "none", borderRadius: "8px", padding: "8px 12px", cursor: "pointer"}}>🗑️</button>}
                </div>
              </div>
            ))}
            {isOwner && <button onClick={() => {const t = prompt("Lesson Name?"); if(t) { const nl = books.map(b => b.id === curBook.id ? {...b, chapters: [...(b.chapters || []), {id: Date.now().toString(), title: t}]} : b); setBooks(nl); pushSave(nl); }}} style={{marginTop: "20px", width: "100%", padding: "15px", borderRadius: "10px", border: "2px dashed var(--border)", background: "none", color: "var(--text)", cursor: "pointer"}}>+ Add New Lesson</button>}
          </div>
        )}

        {/* EDIT */}
        {view === "edit" && curChapter && (
          <div className="card" style={{maxWidth: "800px", margin: "0 auto"}}>
            <button onClick={() => setView("chapters")} style={{background: "#10b981", color: "#fff", border: "none", padding: "10px 30px", borderRadius: "10px", marginBottom: "30px", fontWeight: "bold", cursor: "pointer"}}>Finish Editing</button>
            <div style={{display: "flex", flexDirection: "column", gap: "25px"}}>
              <div><span style={{fontWeight: "bold", color: "#10b981"}}>Summary</span><textarea value={curChapter.summary || ""} onChange={(e) => updateField("summary", e.target.value)} /></div>
              <div><span style={{fontWeight: "bold", color: "#10b981"}}>Q&A</span><textarea value={curChapter.qna || ""} onChange={(e) => updateField("qna", e.target.value)} /></div>
              <div><span style={{fontWeight: "bold", color: "#10b981"}}>Difficult Spellings</span><textarea value={curChapter.spellings || ""} onChange={(e) => updateField("spellings", e.target.value)} /></div>
              <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px"}}>
                {["video", "slides", "bookPdf", "infographic", "mindMap"].map(f => (
                  <div key={f} className="card" style={{padding: "10px"}}>
                    <label style={{fontSize: "11px", fontWeight: "bold", display: "block", marginBottom: "5px"}}>{f.toUpperCase()}</label>
                    <input type="text" value={curChapter[f] || ""} onChange={(e) => updateField(f, e.target.value)} style={{width: "100%", background: "var(--bg)", color: "var(--text)", border: "1px solid var(--border)", padding: "5px", borderRadius: "5px"}} />
                    {f !== 'video' && <input type="file" onChange={(e) => handleFileUpload(e, f)} style={{fontSize: "10px", marginTop: "10px", width: "100%"}} />}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STUDY */}
        {view === "study" && curChapter && (
          <div>
            <button onClick={() => setView("chapters")} style={{color: "#10b981", background: "none", border: "none", marginBottom: "20px", fontWeight: "bold", cursor: "pointer"}}>← Back</button>
            <h1 style={{marginBottom: "20px"}}>{curChapter.title}</h1>
            <div style={{overflowX: "auto", whiteSpace: "nowrap", paddingBottom: "10px"}}>
              {["Summary", "QnA", "Spellings", "Video", "Book PDF", "Slides", "Infographic", "Mind Map"].map(t => (
                <button key={t} onClick={() => setActiveTab(t)} className="tab-btn" style={activeTab === t ? {background: "#10b981", color: "#fff"} : {}}>{t}</button>
              ))}
            </div>
            <div className="card" style={{minHeight: "500px", marginTop: "20px"}}>
               {["Summary", "QnA", "Spellings"].includes(activeTab) && (
                 <div style={{whiteSpace: "pre-wrap", fontSize: "18px", lineHeight: "1.8"}}>
                   {activeTab === "Summary" ? curChapter.summary : activeTab === "QnA" ? curChapter.qna : curChapter.spellings || "No information yet."}
                 </div>
               )}
               {activeTab === "Video" && (curChapter.video ? <iframe width="100%" height="500px" src={formatYoutubeLink(curChapter.video)} frameBorder="0" allowFullScreen style={{borderRadius: "15px"}} /> : "Video not available.")}
               {["Book PDF", "Slides", "Infographic", "Mind Map"].includes(activeTab) && (
                 (() => {
                   let k = activeTab === "Book PDF" ? "bookPdf" : activeTab.charAt(0).toLowerCase() + activeTab.slice(1).replace(" ", "");
                   let link = curChapter[k];
                   if (!link) return "File not found.";
                   return <iframe src={link.includes("drive.google.com") ? link.replace("/view", "/preview") : link} width="100%" height="800px" style={{border: "none", borderRadius: "15px"}} />;
                 })()
               )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}