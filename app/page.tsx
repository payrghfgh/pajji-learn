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
  
  // FIXED: Temp state for smooth typing
  const [tempChapter, setTempChapter] = useState<any>(null);
  
  const [isOwner, setIsOwner] = useState(false);
  const [activeTab, setActiveTab] = useState("Summary");
  const [saveStatus, setSaveStatus] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (localStorage.getItem("isPajjiAdmin") === "true") setIsOwner(true);
    const unsub = onSnapshot(doc(db, "data", "pajji_database"), (ds) => {
      setLoading(false);
      if (ds.exists()) setBooks(ds.data().books || []);
    });
    return () => unsub();
  }, []);

  // Sync temp state to global state and Firebase
  const saveAllChanges = async () => {
    if (!tempChapter) return;
    setSaveStatus("Syncing...");
    const newList = books.map(b => b.id === curBook.id ? {
      ...b, chapters: b.chapters.map((c: any) => c.id === tempChapter.id ? tempChapter : c)
    } : b);
    
    try {
      await setDoc(doc(db, "data", "pajji_database"), { books: newList });
      setBooks(newList);
      setSaveStatus("Saved ✅");
      setTimeout(() => setSaveStatus(""), 2000);
    } catch (e) {
      alert("Error: Data too large.");
      setSaveStatus("Error ❌");
    }
  };

  const pushSave = async (newList: any[]) => {
    setSaveStatus("Syncing...");
    try {
      await setDoc(doc(db, "data", "pajji_database"), { books: newList });
      setSaveStatus("Saved ✅");
      setTimeout(() => setSaveStatus(""), 2000);
    } catch (e) {
      setSaveStatus("Error ❌");
    }
  };

  const handleFileUpload = (e: any, key: string) => {
    const file = e.target.files[0];
    if (!file || file.size > 1048576) return alert("File too large (Max 1MB).");
    const reader = new FileReader();
    reader.onload = (event: any) => {
        setTempChapter({...tempChapter, [key]: event.target.result});
    };
    reader.readAsDataURL(file);
  };

  const deleteItem = (type: 'book' | 'lesson', id: string) => {
    if (!confirm(`Delete ${type}?`)) return;
    let newList = type === 'book' ? books.filter(b => b.id !== id) : books.map(b => b.id === curBook.id ? { ...b, chapters: (b.chapters || []).filter((c: any) => c.id !== id) } : b);
    setBooks(newList);
    pushSave(newList);
    if(type === 'book') setView("library");
  };

  const formatYoutubeLink = (url: string) => {
    if (!url) return "";
    let vid = url.includes("v=") ? url.split("v=")[1].split("&")[0] : url.includes("youtu.be/") ? url.split("youtu.be/")[1].split("?")[0] : url.includes("shorts/") ? url.split("shorts/")[1].split("?")[0] : "";
    return vid ? `https://www.youtube.com/embed/${vid}` : url;
  };

  const getSearchResults = () => {
    if (!searchQuery.trim()) return [];
    let results: any[] = [];
    books.forEach(b => b.chapters?.forEach((c: any) => { if(c.title.toLowerCase().includes(searchQuery.toLowerCase())) results.push({...c, parentBook: b}); }));
    return results;
  };

  if (loading) return <div style={{padding: "50px", textAlign: "center", color: "#10b981", fontWeight: "900"}}>PAJJI LEARN...</div>;

  return (
    <div className="app-container">
      <style>{`
        :root { --bg: #f8fafc; --card: #ffffff; --text: #1e293b; --border: #e2e8f0; --subtext: #64748b; }
        @media (prefers-color-scheme: dark) {
          :root { --bg: #0f172a; --card: #1e293b; --text: #f8fafc; --border: #334155; --subtext: #94a3b8; }
        }
        .app-container { display: flex; height: 100vh; background: var(--bg); color: var(--text); font-family: 'Inter', sans-serif; transition: 0.3s; }
        .sidebar { width: 260px; background: var(--card); border-right: 2px solid var(--border); padding: 25px; display: flex; flex-direction: column; }
        .main-content { flex: 1; padding: 40px; overflow-y: auto; }
        .logo { color: #10b981; font-size: 24px; font-weight: 900; cursor: pointer; text-align: center; margin-bottom: 30px; }
        .nav-btn { width: 100%; padding: 12px; border: none; border-radius: 12px; cursor: pointer; font-weight: bold; text-align: left; margin-bottom: 8px; transition: 0.2s; }
        .search-input { width: 100%; padding: 15px 20px; border-radius: 15px; border: 2px solid var(--border); background: var(--card); color: var(--text); outline: none; }
        .card { background: var(--card); border: 1px solid var(--border); padding: 20px; border-radius: 20px; }
        .tab-btn { padding: 10px 18px; border: none; border-radius: 10px; cursor: pointer; font-weight: bold; background: var(--card); color: var(--subtext); border: 1px solid var(--border); }
        
        /* FIXED TEXTBOX STYLES */
        textarea { 
            background: var(--bg); 
            color: var(--text); 
            border: 2px solid var(--border); 
            width: 100%; 
            padding: 15px; 
            border-radius: 12px; 
            min-height: 150px; 
            font-family: inherit; 
            font-size: 16px;
            resize: vertical;
            outline: none;
            transition: border-color 0.2s;
        }
        textarea:focus { border-color: #10b981; }
        input[type="text"] { background: var(--bg); color: var(--text); border: 1px solid var(--border); width: 100%; padding: 12px; border-radius: 10px; }
        
        .tab-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: 10px; }
        @media (max-width: 768px) { .app-container { flex-direction: column; } .sidebar { width: 100%; height: auto; } }
      `}</style>

      {/* SIDEBAR */}
      <div className="sidebar">
        <h1 className="logo" onClick={() => setView("dashboard")}>PAJJI LEARN</h1>
        <button className="nav-btn" onClick={() => setView("dashboard")} style={{ background: view === "dashboard" ? "#10b981" : "none", color: view === "dashboard" ? "#fff" : "var(--subtext)" }}>🏠 Dashboard</button>
        <button className="nav-btn" onClick={() => setView("library")} style={{ background: view === "library" ? "#10b981" : "none", color: view === "library" ? "#fff" : "var(--subtext)" }}>📚 Library</button>
        <div style={{ marginTop: "auto", textAlign: "center" }}>
          {saveStatus && <p style={{fontSize: "12px", color: "#10b981"}}>{saveStatus}</p>}
          <button onClick={() => { if(isOwner) { setIsOwner(false); localStorage.removeItem("isPajjiAdmin"); } else if(prompt("Key?") === "pajindersinghpajji") { setIsOwner(true); localStorage.setItem("isPajjiAdmin", "true"); }}} style={{width: "100%", padding: "10px", background: isOwner ? "#fee2e2" : "var(--bg)", color: isOwner ? "#ef4444" : "var(--subtext)", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer"}}>{isOwner ? "Logout Admin" : "⚙️ Admin Login"}</button>
        </div>
      </div>

      <div className="main-content">
        <input type="text" className="search-input" placeholder="🔍 Search lesson..." value={searchQuery} onChange={(e) => {setSearchQuery(e.target.value); setView("dashboard");}} style={{maxWidth: "600px", display: "block", margin: "0 auto 30px auto"}} />

        {/* SEARCH RESULTS */}
        {searchQuery && view === "dashboard" && (
          <div style={{maxWidth: "800px", margin: "0 auto"}}>
            {getSearchResults().map(res => (
              <div key={res.id} onClick={() => { setCurBook(res.parentBook); setCurChapter(res); setView("study"); setSearchQuery(""); }} style={{background: "var(--card)", padding: "15px", borderRadius: "12px", marginBottom: "10px", cursor: "pointer", display: "flex", justifyContent: "space-between", border: "1px solid var(--border)"}}>
                <span style={{fontWeight: "bold"}}>{res.title}</span>
                <span style={{fontSize: "12px", color: "#10b981"}}>{res.parentBook.title}</span>
              </div>
            ))}
          </div>
        )}

        {/* DASHBOARD */}
        {view === "dashboard" && !searchQuery && (
          <div style={{ maxWidth: "800px", margin: "0 auto" }}>
            <div style={{ background: "linear-gradient(135deg, #10b981, #059669)", padding: "40px", borderRadius: "24px", color: "#fff", marginBottom: "30px" }}>
              <h1 style={{ fontSize: "32px", fontWeight: "900", margin: 0 }}>Welcome back, Learner!👋</h1>
              <p style={{ opacity: 0.9 }}>Select a book from the library or search for a lesson above</p>
            </div>
            <div style={{ display: "flex", gap: "20px" }}>
              <div className="card" style={{flex: 1}}><h3>{books.length} Books</h3></div>
              <div className="card" style={{flex: 1}}><h3>{books.reduce((a, b) => a + (b.chapters?.length || 0), 0)} Lessons</h3></div>
            </div>
          </div>
        )}

        {/* LIBRARY */}
        {view === "library" && (
          <div>
            <div style={{display: "flex", justifyContent: "space-between", marginBottom: "30px"}}>
              <h1 style={{fontWeight: "900"}}>Library</h1>
              {isOwner && <button onClick={() => {const t = prompt("Book Name?"); if(t) pushSave([...books, {id: Date.now().toString(), title: t, chapters: []}])}} style={{background: "#10b981", color: "#fff", padding: "10px 20px", borderRadius: "10px", border: "none"}}>+ New Book</button>}
            </div>
            <div style={{display: "flex", gap: "20px", flexWrap: "wrap"}}>
              {books.map(b => (
                <div key={b.id} style={{position: "relative"}}>
                  <div onClick={() => {setCurBook(b); setView("chapters");}} style={{width: "140px", height: "200px", background: "linear-gradient(135deg, #10b981, #059669)", borderRadius: "15px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "40px", cursor: "pointer"}}>📖</div>
                  <p style={{textAlign: "center", fontWeight: "bold", marginTop: "10px"}}>{b.title}</p>
                  {isOwner && <button onClick={() => deleteItem('book', b.id)} style={{position: "absolute", top: "-5px", right: "-5px", background: "#ef4444", color: "#fff", borderRadius: "50%", border: "none", width: "25px", height: "25px"}}>×</button>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CHAPTERS */}
        {view === "chapters" && curBook && (
          <div>
            <button onClick={() => setView("library")} style={{color: "#10b981", background: "none", border: "none", marginBottom: "20px", cursor: "pointer"}}>← Back</button>
            <div style={{display: "flex", justifyContent: "space-between", marginBottom: "20px"}}>
              <h1>{curBook.title}</h1>
              {isOwner && <button onClick={() => {const t = prompt("Lesson Name?"); if(t) { const nl = books.map(b => b.id === curBook.id ? {...b, chapters: [...(b.chapters || []), {id: Date.now().toString(), title: t}]} : b); setBooks(nl); pushSave(nl); }}} style={{background: "#10b981", color: "#fff", padding: "10px 20px", borderRadius: "10px", border: "none"}}>+ Add Lesson</button>}
            </div>
            {curBook.chapters?.map((ch: any) => (
              <div key={ch.id} className="card" style={{display: "flex", justifyContent: "space-between", marginBottom: "10px", padding: "15px"}}>
                <span style={{fontWeight: "bold"}}>{ch.title}</span>
                <div style={{display: "flex", gap: "10px"}}>
                  <button onClick={() => {setCurChapter(ch); setView("study");}} style={{padding: "8px 15px", borderRadius: "8px", background: "none", border: "1px solid var(--border)", color: "var(--text)"}}>Study</button>
                  {isOwner && <button onClick={() => {setCurChapter(ch); setTempChapter(ch); setView("edit");}} style={{background: "#3b82f6", color: "#fff", border: "none", borderRadius: "8px", padding: "8px 15px"}}>Edit</button>}
                  {isOwner && <button onClick={() => deleteItem('lesson', ch.id)} style={{background: "#fee2e2", color: "#ef4444", border: "none", borderRadius: "8px", padding: "8px 15px"}}>🗑️</button>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* STUDY */}
        {view === "study" && curChapter && (
          <div>
            <button onClick={() => setView("chapters")} style={{color: "#10b981", background: "none", border: "none", marginBottom: "20px", cursor: "pointer"}}>← Back</button>
            <h1 style={{marginBottom: "20px"}}>{curChapter.title}</h1>
            <div className="tab-grid">
              {["Summary", "QnA", "Spellings", "Video", "Book PDF", "Slides", "Infographic", "Mind Map"].map(t => (
                <button key={t} onClick={() => setActiveTab(t)} className="tab-btn" style={{ background: activeTab === t ? "#10b981" : "var(--card)", color: activeTab === t ? "#fff" : "var(--subtext)" }}>{t}</button>
              ))}
            </div>
            <div className="card" style={{minHeight: "500px", marginTop: "20px", position: "relative"}}>
               {["Summary", "QnA", "Spellings"].includes(activeTab) && (
                 <div style={{whiteSpace: "pre-wrap", fontSize: "18px", lineHeight: "1.8"}}>
                   <button onClick={() => {navigator.clipboard.writeText(activeTab === "Summary" ? curChapter.summary : activeTab === "QnA" ? curChapter.qna : curChapter.spellings); alert("Copied!");}} style={{float: "right", background: "var(--bg)", border: "none", padding: "8px 12px", borderRadius: "8px", color: "var(--subtext)", fontWeight: "bold"}}>📋 Copy</button>
                   {activeTab === "Summary" ? (curChapter.summary || "No summary.") : activeTab === "QnA" ? (curChapter.qna || "No Q&A.") : (curChapter.spellings || "No spellings.")}
                 </div>
               )}
               {activeTab === "Video" && (curChapter.video ? <iframe width="100%" height="500px" src={formatYoutubeLink(curChapter.video)} frameBorder="0" allowFullScreen style={{borderRadius: "15px"}} /> : "No video.")}
               {["Book PDF", "Slides", "Infographic", "Mind Map"].includes(activeTab) && (
                 (() => {
                   let k = activeTab === "Book PDF" ? "bookPdf" : activeTab.charAt(0).toLowerCase() + activeTab.slice(1).replace(" ", "");
                   let link = curChapter[k];
                   if (!link) return "No content.";
                   return <iframe src={link.includes("drive.google.com") ? link.replace("/view", "/preview") : link} width="100%" height="800px" style={{border: "none", borderRadius: "15px"}} />;
                 })()
               )}
            </div>
          </div>
        )}

        {/* EDIT - FIXED TEXTBOX LOGIC */}
        {view === "edit" && tempChapter && (
             <div className="card">
                <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px"}}>
                    <h2 style={{margin: 0}}>Editing: {tempChapter.title}</h2>
                    <button onClick={() => { saveAllChanges(); setView("chapters"); }} style={{background: "#10b981", color: "#fff", padding: "12px 30px", border: "none", borderRadius: "12px", fontWeight: "bold", cursor: "pointer"}}>✅ Save & Close</button>
                </div>
                
                <div style={{display: "flex", flexDirection: "column", gap: "25px"}}>
                    <div>
                        <p style={{fontWeight: "bold", marginBottom: "8px"}}>Summary:</p>
                        <textarea 
                            value={tempChapter.summary || ""} 
                            onChange={(e) => setTempChapter({...tempChapter, summary: e.target.value})} 
                            placeholder="Write lesson summary here..."
                        />
                    </div>
                    
                    <div>
                        <p style={{fontWeight: "bold", marginBottom: "8px"}}>QnA Section:</p>
                        <textarea 
                            value={tempChapter.qna || ""} 
                            onChange={(e) => setTempChapter({...tempChapter, qna: e.target.value})} 
                            placeholder="Question 1... Answer 1..."
                        />
                    </div>
                    
                    <div>
                        <p style={{fontWeight: "bold", marginBottom: "8px"}}>Difficult Spellings:</p>
                        <textarea 
                            value={tempChapter.spellings || ""} 
                            onChange={(e) => setTempChapter({...tempChapter, spellings: e.target.value})} 
                            placeholder="List difficult words here..."
                        />
                    </div>
                    
                    <div style={{display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "15px"}}>
                        {["video", "slides", "bookPdf", "infographic", "mindMap"].map(f => (
                            <div key={f} className="card" style={{padding: "15px", background: "var(--bg)"}}>
                                <p style={{fontSize: "12px", fontWeight: "bold", color: "#10b981", marginBottom: "10px"}}>{f.toUpperCase()}</p>
                                <input 
                                    type="text" 
                                    value={tempChapter[f] || ""} 
                                    onChange={(e) => setTempChapter({...tempChapter, [f]: e.target.value})} 
                                    placeholder="Paste Link here..." 
                                    style={{marginBottom: "10px"}}
                                />
                                {f !== 'video' && (
                                    <div style={{borderTop: "1px solid var(--border)", paddingTop: "10px"}}>
                                        <p style={{fontSize: "10px", color: "var(--subtext)"}}>OR Upload Image (Max 1MB):</p>
                                        <input type="file" onChange={(e) => handleFileUpload(e, f)} style={{fontSize: "11px", marginTop: "5px", width: "100%"}} />
                                    </div>
                                )}
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