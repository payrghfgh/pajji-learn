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
    setSaveStatus("Syncing...");
    try {
      await setDoc(doc(db, "data", "pajji_database"), { books: newList });
      setSaveStatus("Saved ✅");
      setTimeout(() => setSaveStatus(""), 2000);
    } catch (e) {
      alert("Database error: Ensure files are under 1MB.");
      setSaveStatus("Error ❌");
    }
  };

  const updateField = (key: string, val: string) => {
    const newList = books.map(b => b.id === curBook.id ? {
      ...b, chapters: b.chapters.map((c: any) => c.id === curChapter.id ? { ...c, [key]: val } : c)
    } : b);
    setBooks(newList);
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
    if (!confirm(`Delete ${type}?`)) return;
    let newList;
    if (type === 'book') {
      newList = books.filter(b => b.id !== id);
      setView("library");
    } else {
      newList = books.map(b => b.id === curBook.id ? { ...b, chapters: (b.chapters || []).filter((c: any) => c.id !== id) } : b);
    }
    setBooks(newList);
    pushSave(newList);
  };

  const formatYoutubeLink = (url: string) => {
    if (!url) return "";
    let vid = "";
    if (url.includes("v=")) vid = url.split("v=")[1].split("&")[0];
    else if (url.includes("youtu.be/")) vid = url.split("youtu.be/")[1].split("?")[0];
    else if (url.includes("shorts/")) vid = url.split("shorts/")[1].split("?")[0];
    return vid ? `https://www.youtube.com/embed/${vid}` : url;
  };

  // --- IMPROVED SEARCH LOGIC ---
  const getSearchResults = () => {
    if (!searchQuery.trim()) return [];
    const results: any[] = [];
    books.forEach(book => {
      (book.chapters || []).forEach((chapter: any) => {
        if (chapter.title.toLowerCase().includes(searchQuery.toLowerCase())) {
          results.push({ ...chapter, parentBook: book });
        }
      });
    });
    return results;
  };

  const searchResults = getSearchResults();

  if (loading) return <div style={{padding: "50px", textAlign: "center", color: "#10b981", fontWeight: "900"}}>PAJJI LEARN...</div>;

  return (
    <div className="app-container">
      <style>{`
        .app-container { display: flex; height: 100vh; background: #f8fafc; font-family: 'Inter', sans-serif; }
        .sidebar { width: 260px; background: #fff; border-right: 2px solid #e2e8f0; padding: 25px; display: flex; flex-direction: column; }
        .main-content { flex: 1; padding: 40px; overflow-y: auto; }
        .logo { color: #10b981; font-size: 24px; font-weight: 900; text-transform: uppercase; cursor: pointer; text-align: center; margin-bottom: 30px; }
        .nav-btn { width: 100%; padding: 12px; border: none; border-radius: 12px; cursor: pointer; font-weight: bold; text-align: left; margin-bottom: 8px; }
        .search-input { width: 100%; padding: 15px 20px; border-radius: 15px; border: 2px solid #e2e8f0; font-size: 16px; outline: none; transition: 0.2s; }
        .search-input:focus { border-color: #10b981; }
        .result-card { background: #fff; padding: 15px; border-radius: 12px; border: 1px solid #e2e8f0; cursor: pointer; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; }
        .tab-btn { padding: 10px 18px; border: none; border-radius: 10px; cursor: pointer; font-weight: bold; white-space: nowrap; }
        @media (max-width: 768px) { .app-container { flex-direction: column; } .sidebar { width: 100%; height: auto; } }
      `}</style>

      {/* SIDEBAR */}
      <div className="sidebar">
        <h1 className="logo" onClick={() => {setView("dashboard"); setSearchQuery("");}}>PAJJI LEARN</h1>
        <div className="nav-flex">
          <button className="nav-btn" onClick={() => {setView("dashboard"); setSearchQuery("");}} style={{ background: view === "dashboard" ? "#10b981" : "none", color: view === "dashboard" ? "#fff" : "#64748b" }}>🏠 Dashboard</button>
          <button className="nav-btn" onClick={() => {setView("library"); setSearchQuery("");}} style={{ background: view === "library" ? "#10b981" : "none", color: view === "library" ? "#fff" : "#64748b" }}>📚 Library</button>
        </div>
        <div style={{ marginTop: "auto", textAlign: "center" }}>
          {saveStatus && <p style={{fontSize: "12px", color: "#10b981"}}>{saveStatus}</p>}
          {isOwner ? (
            <button onClick={() => { setIsOwner(false); localStorage.removeItem("isPajjiAdmin"); }} style={{width: "100%", padding: "10px", background: "#fee2e2", color: "#ef4444", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer"}}>Logout Admin</button>
          ) : (
            <button onClick={() => { if(prompt("Key?") === "pajindersinghpajji") { setIsOwner(true); localStorage.setItem("isPajjiAdmin", "true"); }}} style={{width: "100%", padding: "10px", background: "#f1f5f9", color: "#64748b", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer"}}>⚙️ Admin Login</button>
          )}
        </div>
      </div>

      <div className="main-content">
        {/* GLOBAL SEARCH BAR */}
        <div style={{maxWidth: "800px", margin: "0 auto 30px auto"}}>
          <input 
            type="text" 
            className="search-input" 
            placeholder="🔍 Type to search for a lesson title..." 
            value={searchQuery}
            onChange={(e) => {setSearchQuery(e.target.value); setView("dashboard");}}
          />
        </div>

        {/* SEARCH RESULTS VIEW */}
        {searchQuery.length > 0 && view === "dashboard" && (
          <div style={{maxWidth: "800px", margin: "0 auto"}}>
            <h3 style={{fontWeight: "900", marginBottom: "15px"}}>Search Results ({searchResults.length})</h3>
            {searchResults.map((res: any) => (
              <div key={res.id} className="result-card" onClick={() => { setCurBook(res.parentBook); setCurChapter(res); setView("study"); setSearchQuery(""); }}>
                <span style={{fontWeight: "bold"}}>{res.title}</span>
                <span style={{fontSize: "12px", background: "#10b981", color: "#fff", padding: "4px 10px", borderRadius: "20px"}}>{res.parentBook.title}</span>
              </div>
            ))}
            {searchResults.length === 0 && <p style={{textAlign: "center", color: "#64748b"}}>No lessons found with that name.</p>}
          </div>
        )}

        {/* DASHBOARD - STATS */}
        {view === "dashboard" && searchQuery.length === 0 && (
          <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
            <div style={{ background: "linear-gradient(135deg, #10b981, #059669)", padding: "40px", borderRadius: "24px", color: "#fff", marginBottom: "30px" }}>
              <h1 style={{ fontSize: "36px", fontWeight: "900", margin: 0 }}>Welcome back, Learner!👋</h1>
              <p style={{ opacity: 0.9, fontSize: "18px", marginTop: "10px" }}>Select a book from the library or search for a lesson above.</p>
            </div>
            <div style={{ display: "flex", gap: "20px" }}>
              <div style={{background: "#fff", padding: "20px", borderRadius: "20px", border: "1px solid #e2e8f0", flex: 1}}>
                <p style={{color: "#64748b", fontSize: "12px", fontWeight: "bold"}}>TOTAL BOOKS</p>
                <h2 style={{fontSize: "32px", fontWeight: "900"}}>{books.length}</h2>
              </div>
              <div style={{background: "#fff", padding: "20px", borderRadius: "20px", border: "1px solid #e2e8f0", flex: 1}}>
                <p style={{color: "#64748b", fontSize: "12px", fontWeight: "bold"}}>TOTAL LESSONS</p>
                <h2 style={{fontSize: "32px", fontWeight: "900"}}>{books.reduce((a, b) => a + (b.chapters?.length || 0), 0)}</h2>
              </div>
            </div>
          </div>
        )}

        {/* LIBRARY VIEW */}
        {view === "library" && (
          <div>
            <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px"}}>
                <h1 style={{fontWeight: "900", fontSize: "32px"}}>Library</h1>
                {isOwner && <button onClick={() => {const t = prompt("Book Name?"); if(t) pushSave([...books, {id: Date.now().toString(), title: t, chapters: []}])}} style={{background: "#10b981", color: "#fff", padding: "10px 20px", borderRadius: "10px", border: "none", fontWeight: "bold", cursor: "pointer"}}>+ New Book</button>}
            </div>
            <div style={{display: "flex", gap: "25px", flexWrap: "wrap", justifyContent: "center"}}>
              {books.map(b => (
                <div key={b.id} style={{position: "relative", width: "160px"}}>
                  <div onClick={() => {setCurBook(b); setView("chapters");}} style={{height: "220px", background: "linear-gradient(135deg, #10b981, #059669)", borderRadius: "20px", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "40px", cursor: "pointer", boxShadow: "0 10px 20px rgba(16,185,129,0.1)"}}>📖</div>
                  <p style={{textAlign: "center", fontWeight: "900", marginTop: "12px"}}>{b.title}</p>
                  {isOwner && <button onClick={() => deleteItem('book', b.id)} style={{position: "absolute", top: "-5px", right: "-5px", background: "#ef4444", color: "#fff", border: "none", borderRadius: "50%", width: "28px", height: "28px", cursor: "pointer"}}>×</button>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CHAPTER LIST VIEW */}
        {view === "chapters" && curBook && (
          <div>
            <button onClick={() => setView("library")} style={{color: "#10b981", fontWeight: "bold", background: "none", border: "none", marginBottom: "20px", cursor: "pointer"}}>← Back to Library</button>
            <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px"}}>
                <h1 style={{fontWeight: "900", fontSize: "32px"}}>{curBook.title}</h1>
                {isOwner && <button onClick={() => {const t = prompt("Lesson Name?"); if(t) { const newList = books.map(b => b.id === curBook.id ? {...b, chapters: [...(b.chapters || []), {id: Date.now().toString(), title: t}]} : b); setBooks(newList); pushSave(newList); }}} style={{background: "#10b981", color: "#fff", padding: "10px 20px", borderRadius: "10px", border: "none", fontWeight: "bold", cursor: "pointer"}}>+ Add Lesson</button>}
            </div>
            {curBook.chapters?.map((ch: any) => (
              <div key={ch.id} style={{background: "#fff", padding: "20px", borderRadius: "15px", marginBottom: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid #e2e8f0"}}>
                <span style={{fontWeight: "bold", fontSize: "18px"}}>{ch.title}</span>
                <div style={{display: "flex", gap: "8px"}}>
                  <button onClick={() => {setCurChapter(ch); setView("study");}} style={{padding: "10px 20px", borderRadius: "10px", border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer"}}>Study</button>
                  {isOwner && <button onClick={() => {setCurChapter(ch); setView("edit");}} style={{background: "#3b82f6", color: "#fff", border: "none", borderRadius: "10px", padding: "10px 20px", cursor: "pointer"}}>Edit</button>}
                  {isOwner && <button onClick={() => deleteItem('lesson', ch.id)} style={{background: "#fee2e2", color: "#ef4444", border: "none", borderRadius: "10px", padding: "10px 15px", cursor: "pointer"}}>🗑️</button>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* STUDY VIEW */}
        {view === "study" && curChapter && (
          <div>
            <button onClick={() => setView("chapters")} style={{color: "#10b981", fontWeight: "bold", background: "none", border: "none", marginBottom: "20px", cursor: "pointer"}}>← Back to Lessons</button>
            <h1 style={{fontSize: "32px", fontWeight: "900", marginBottom: "20px"}}>{curChapter.title}</h1>
            <div className="tab-grid" style={{display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "10px"}}>
              {["Summary", "QnA", "Video", "Book PDF", "Slides", "Infographic", "Mind Map"].map(t => (
                <button key={t} onClick={() => setActiveTab(t)} className="tab-btn" style={{ background: activeTab === t ? "#10b981" : "#fff", color: activeTab === t ? "#fff" : "#64748b", boxShadow: "0 2px 5px rgba(0,0,0,0.05)" }}>{t}</button>
              ))}
            </div>
            <div style={{background: "#fff", padding: "40px", borderRadius: "30px", minHeight: "500px", position: "relative", boxShadow: "0 10px 40px rgba(0,0,0,0.05)"}}>
               {(activeTab === "Summary" || activeTab === "QnA") && (
                 <>
                   <button 
                     onClick={() => {navigator.clipboard.writeText(activeTab === "Summary" ? curChapter.summary : curChapter.qna); alert("Copied!");}}
                     style={{position: "absolute", top: "20px", right: "20px", background: "#f1f5f9", border: "none", padding: "8px 15px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold"}}
                   >📋 Copy Text</button>
                   <div style={{whiteSpace: "pre-wrap", fontSize: "18px", lineHeight: "1.8", marginTop: "20px"}}>
                     {activeTab === "Summary" ? (curChapter.summary || "Empty summary.") : (curChapter.qna || "No Q&A.")}
                   </div>
                 </>
               )}
               {activeTab === "Video" && (curChapter.video ? <iframe width="100%" height="500px" src={formatYoutubeLink(curChapter.video)} frameBorder="0" allowFullScreen style={{borderRadius: "20px"}} /> : "No video.")}
               {["Book PDF", "Slides", "Infographic", "Mind Map"].includes(activeTab) && (
                 (() => {
                   const k = activeTab === "Book PDF" ? "bookPdf" : activeTab.charAt(0).toLowerCase() + activeTab.slice(1).replace(" ", "");
                   let link = curChapter[k];
                   if (!link) return "No content.";
                   if (typeof link === 'string' && link.includes("drive.google.com")) link = link.replace("/view", "/preview").split("?")[0];
                   return <iframe src={link} width="100%" height="800px" style={{border: "none", borderRadius: "15px"}} />;
                 })()
               )}
            </div>
          </div>
        )}

        {/* EDIT VIEW */}
        {view === "edit" && curChapter && (
             <div style={{background: "#fff", padding: "40px", borderRadius: "25px"}}>
                <button onClick={() => setView("chapters")} style={{background: "#10b981", color: "#fff", padding: "12px 30px", border: "none", borderRadius: "12px", fontWeight: "bold", marginBottom: "30px", cursor: "pointer"}}>Save & Close</button>
                <div style={{display: "flex", flexDirection: "column", gap: "20px"}}>
                    <textarea style={{width: "100%", height: "120px", padding: "15px", borderRadius: "10px", border: "1px solid #ddd"}} value={curChapter.summary || ""} onChange={(e) => updateField("summary", e.target.value)} placeholder="Summary Text..." />
                    <textarea style={{width: "100%", height: "120px", padding: "15px", borderRadius: "10px", border: "1px solid #ddd"}} value={curChapter.qna || ""} onChange={(e) => updateField("qna", e.target.value)} placeholder="QnA Text..." />
                    <div style={{display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px"}}>
                        {["video", "slides", "bookPdf", "infographic", "mindMap"].map(f => (
                            <div key={f} style={{border: "1px solid #eee", padding: "15px", borderRadius: "15px"}}>
                                <p style={{fontSize: "12px", fontWeight: "900", color: "#64748b"}}>{f.toUpperCase()}</p>
                                <input type="text" style={{width: "100%", padding: "8px", marginBottom: "5px"}} value={curChapter[f] || ""} onChange={(e) => updateField(f, e.target.value)} placeholder="Link..." />
                                {f !== "video" && <input type="file" onChange={(e) => handleFileUpload(e, f)} style={{fontSize: "11px"}} />}
                            </div>
                        ))}
                    </div>
                </div>
             </div>
        )}
      </div>
    </div>
  );
}