"use client";

import { useEffect, useState } from "react";
import { initializeApp, getApps } from "firebase/app";
import { getFirestore, doc, onSnapshot, setDoc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut 
} from "firebase/auth";

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
const auth = getAuth(app);

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [authEmail, setAuthEmail] = useState("");
  const [authPass, setAuthPass] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  const [books, setBooks] = useState<any[]>([]);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("dashboard");
  const [curBook, setCurBook] = useState<any>(null);
  const [curChapter, setCurChapter] = useState<any>(null);
  const [tempChapter, setTempChapter] = useState<any>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [activeTab, setActiveTab] = useState("Summary");
  const [saveStatus, setSaveStatus] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser && currentUser.email === "rushanbindra@gmail.com") {
        setIsOwner(true);
        localStorage.setItem("isPajjiAdmin", "true");
      } else {
        setIsOwner(localStorage.getItem("isPajjiAdmin") === "true");
      }
      
      if (currentUser) {
        onSnapshot(doc(db, "data", "pajji_database"), (ds) => {
          if (ds.exists()) setBooks(ds.data().books || []);
          setLoading(false);
        });
        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) setCompletedLessons(userSnap.data().completed || []);
        else await setDoc(userRef, { completed: [] });
      } else {
        setLoading(false);
      }
    });
    return () => unsubAuth();
  }, []);

  const markCompleted = async (lessonId: string) => {
    if (!user || completedLessons.includes(lessonId)) return;
    const userRef = doc(db, "users", user.uid);
    try {
      await updateDoc(userRef, { completed: arrayUnion(lessonId) });
      setCompletedLessons([...completedLessons, lessonId]);
      setSaveStatus("Mastery +100 XP! 🔥");
      setTimeout(() => setSaveStatus(""), 3000);
    } catch (e) { console.error(e); }
  };

  const handleAuth = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isRegistering) await createUserWithEmailAndPassword(auth, authEmail, authPass);
      else await signInWithEmailAndPassword(auth, authEmail, authPass);
    } catch (err: any) { alert(err.message); }
    setLoading(false);
  };

  const handleLogout = () => {
    signOut(auth);
    setView("dashboard");
    setIsOwner(false);
    setCompletedLessons([]);
    localStorage.removeItem("isPajjiAdmin");
  };

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
    } catch (e) { setSaveStatus("Error ❌"); }
  };

  const pushSave = async (newList: any[]) => {
    setSaveStatus("Syncing...");
    try {
      await setDoc(doc(db, "data", "pajji_database"), { books: newList });
      setSaveStatus("Saved ✅");
      setTimeout(() => setSaveStatus(""), 2000);
    } catch (e) { setSaveStatus("Error ❌"); }
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

  const userXP = completedLessons.length * 100;
  const userLevel = Math.floor(userXP / 500) + 1;

  if (loading) return <div style={{padding: "50px", textAlign: "center", color: "#10b981", fontWeight: "900"}}>PAJJI LEARN...</div>;

  if (!user) {
    return (
      <div style={{height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc", fontFamily: "Inter, sans-serif"}}>
        <div style={{background: "#fff", padding: "40px", borderRadius: "24px", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)", width: "100%", maxWidth: "400px", textAlign: "center"}}>
          <h1 style={{color: "#10b981", fontWeight: "900", marginBottom: "10px"}}>PAJJI LEARN</h1>
          <form onSubmit={handleAuth} style={{display: "flex", flexDirection: "column", gap: "15px"}}>
            <input type="email" placeholder="Email" value={authEmail} onChange={(e)=>setAuthEmail(e.target.value)} required style={{padding: "12px", borderRadius: "10px", border: "1px solid #e2e8f0"}} />
            <input type="password" placeholder="Password" value={authPass} onChange={(e)=>setAuthPass(e.target.value)} required style={{padding: "12px", borderRadius: "10px", border: "1px solid #e2e8f0"}} />
            <button type="submit" style={{padding: "12px", background: "#10b981", color: "#fff", border: "none", borderRadius: "10px", fontWeight: "bold", cursor: "pointer"}}>{isRegistering ? "Sign Up" : "Login"}</button>
          </form>
          <button onClick={() => setIsRegistering(!isRegistering)} style={{marginTop: "20px", background: "none", border: "none", color: "#10b981", cursor: "pointer", fontWeight: "600"}}>
            {isRegistering ? "Back to Login" : "Create Account"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <style>{`
        :root { --bg: #f8fafc; --card: #ffffff; --text: #1e293b; --border: #e2e8f0; --subtext: #64748b; }
        @media (prefers-color-scheme: dark) { :root { --bg: #0f172a; --card: #1e293b; --text: #f8fafc; --border: #334155; --subtext: #94a3b8; } }
        .app-container { display: flex; height: 100vh; background: var(--bg); color: var(--text); font-family: 'Inter', sans-serif; }
        .sidebar { width: 260px; background: var(--card); border-right: 2px solid var(--border); padding: 25px; display: flex; flex-direction: column; }
        .main-content { flex: 1; padding: 40px; overflow-y: auto; }
        .logo { color: #10b981; font-size: 24px; font-weight: 900; cursor: pointer; text-align: center; margin-bottom: 30px; }
        .nav-btn { width: 100%; padding: 12px; border: none; border-radius: 12px; cursor: pointer; font-weight: bold; text-align: left; margin-bottom: 8px; transition: 0.2s; }
        .search-input { width: 100%; padding: 15px 20px; border-radius: 15px; border: 2px solid var(--border); background: var(--card); color: var(--text); outline: none; margin: 0 auto 30px auto; display: block; max-width: 600px; }
        .card { background: var(--card); border: 1px solid var(--border); padding: 20px; border-radius: 20px; }
        .tab-btn { padding: 10px 12px; border: none; border-radius: 10px; cursor: pointer; font-weight: bold; background: var(--card); color: var(--subtext); border: 1px solid var(--border); font-size: 13px; }
        textarea { background: var(--bg); color: var(--text); border: 2px solid var(--border); width: 100%; padding: 15px; border-radius: 12px; min-height: 120px; outline: none; }
      `}</style>

      <div className="sidebar">
        <h1 className="logo" onClick={() => setView("dashboard")}>PAJJI LEARN</h1>
        <div style={{background: "var(--bg)", padding: "15px", borderRadius: "15px", marginBottom: "20px", textAlign: "center"}}>
          <p style={{fontSize: "12px", color: "var(--subtext)", margin: 0}}>LEVEL {userLevel}</p>
          <div style={{height: "8px", background: "#e2e8f0", borderRadius: "4px", margin: "8px 0", overflow: "hidden"}}>
            <div style={{width: `${(userXP % 500) / 5}%`, height: "100%", background: "#10b981"}}></div>
          </div>
          <p style={{fontSize: "14px", fontWeight: "bold"}}>{userXP} XP</p>
        </div>
        <button className="nav-btn" onClick={() => setView("dashboard")} style={{ background: view === "dashboard" ? "#10b981" : "none", color: view === "dashboard" ? "#fff" : "var(--subtext)" }}>🏠 Dashboard</button>
        <button className="nav-btn" onClick={() => setView("library")} style={{ background: view === "library" ? "#10b981" : "none", color: view === "library" ? "#fff" : "var(--subtext)" }}>📚 Library</button>
        <div style={{ marginTop: "auto", textAlign: "center" }}>
          <p style={{fontSize: "10px", color: "var(--subtext)", marginBottom: "10px"}}>User: <b>{user.email}</b></p>
          {saveStatus && <p style={{fontSize: "12px", color: "#10b981"}}>{saveStatus}</p>}
          <button onClick={handleLogout} style={{width: "100%", padding: "10px", background: "#fee2e2", color: "#ef4444", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer"}}>🚪 Logout</button>
        </div>
      </div>

      <div className="main-content">
        <input type="text" className="search-input" placeholder="🔍 Search lesson..." value={searchQuery} onChange={(e) => {setSearchQuery(e.target.value); setView("dashboard");}} />

        {searchQuery && (
          <div style={{maxWidth: "800px", margin: "0 auto"}}>
            {getSearchResults().map(res => (
              <div key={res.id} onClick={() => { setCurBook(res.parentBook); setCurChapter(res); setView("study"); setSearchQuery(""); }} style={{background: "var(--card)", padding: "15px", borderRadius: "12px", marginBottom: "10px", cursor: "pointer", display: "flex", justifyContent: "space-between", border: "1px solid var(--border)"}}>
                <span style={{fontWeight: "bold"}}>{res.title}</span>
                <span style={{fontSize: "12px", color: "#10b981"}}>{res.parentBook.title}</span>
              </div>
            ))}
          </div>
        )}

        {view === "dashboard" && !searchQuery && (
          <div style={{ maxWidth: "800px", margin: "0 auto" }}>
            <div style={{ background: "linear-gradient(135deg, #10b981, #059669)", padding: "40px", borderRadius: "24px", color: "#fff", marginBottom: "30px" }}>
              <h1 style={{ fontSize: "32px", fontWeight: "900", margin: 0 }}>Hi, {user.email?.split('@')[0]}! 👋</h1>
              <p style={{ opacity: 0.9 }}>You have mastered {completedLessons.length} lessons. Ready for more?</p>
            </div>
            <div style={{ display: "flex", gap: "20px" }}>
              <div className="card" style={{flex: 1}}><h3>{books.length} Books</h3></div>
              <div className="card" style={{flex: 1}}><h3>{userXP} XP Earned</h3></div>
            </div>
          </div>
        )}

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

        {view === "chapters" && curBook && (
          <div>
            <button onClick={() => setView("library")} style={{color: "#10b981", background: "none", border: "none", marginBottom: "20px", cursor: "pointer"}}>← Back</button>
            <div style={{display: "flex", justifyContent: "space-between", marginBottom: "20px"}}>
              <h1>{curBook.title}</h1>
              {isOwner && <button onClick={() => {const t = prompt("Lesson Name?"); if(t) { const nl = books.map(b => b.id === curBook.id ? {...b, chapters: [...(b.chapters || []), {id: Date.now().toString(), title: t}]} : b); setBooks(nl); pushSave(nl); }}} style={{background: "#10b981", color: "#fff", padding: "10px 20px", borderRadius: "10px", border: "none"}}>+ Add Lesson</button>}
            </div>
            {curBook.chapters?.map((ch: any) => (
              <div key={ch.id} className="card" style={{display: "flex", justifyContent: "space-between", marginBottom: "10px", padding: "15px", opacity: completedLessons.includes(ch.id) ? 0.7 : 1}}>
                <span style={{fontWeight: "bold"}}>{ch.title} {completedLessons.includes(ch.id) && "✅"}</span>
                <div style={{display: "flex", gap: "10px"}}>
                  <button onClick={() => {setCurChapter(ch); setView("study"); setActiveTab("Summary");}} style={{padding: "8px 15px", borderRadius: "8px", background: "#10b981", border: "none", color: "#fff"}}>Study</button>
                  {isOwner && <button onClick={() => {setCurChapter(ch); setTempChapter(ch); setView("edit");}} style={{background: "#3b82f6", color: "#fff", border: "none", borderRadius: "8px", padding: "8px 15px"}}>Edit</button>}
                  {isOwner && <button onClick={() => deleteItem('lesson', ch.id)} style={{background: "#fee2e2", color: "#ef4444", border: "none", borderRadius: "8px", padding: "8px 15px"}}>🗑️</button>}
                </div>
              </div>
            ))}
          </div>
        )}

        {view === "study" && curChapter && (
          <div>
            <div style={{display: "flex", justifyContent: "space-between", marginBottom: "20px"}}>
              <button onClick={() => setView("chapters")} style={{color: "#10b981", background: "none", border: "none", cursor: "pointer"}}>← Back</button>
              {!completedLessons.includes(curChapter.id) ? (
                <button onClick={() => markCompleted(curChapter.id)} style={{background: "#fef3c7", color: "#d97706", border: "1px solid #fcd34d", padding: "8px 15px", borderRadius: "10px", fontWeight: "bold"}}>Mastered +100 XP</button>
              ) : (
                <span style={{color: "#10b981", fontWeight: "bold"}}>Lesson Mastered ✨</span>
              )}
            </div>
            <h1 style={{marginBottom: "20px"}}>{curChapter.title}</h1>
            <div style={{display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: "8px", marginBottom: "20px"}}>
                {["Summary", "QnA", "Spellings", "Video", "Book PDF", "Slides", "Infographic", "Mind Map"].map(t => (
                    <button key={t} onClick={() => setActiveTab(t)} className="tab-btn" style={{ background: activeTab === t ? "#10b981" : "var(--card)", color: activeTab === t ? "#fff" : "var(--subtext)" }}>{t}</button>
                ))}
            </div>
            <div className="card" style={{minHeight: "500px"}}>
               {["Summary", "QnA", "Spellings"].includes(activeTab) && (
                 <div style={{whiteSpace: "pre-wrap", fontSize: "18px", lineHeight: "1.8"}}>
                   {activeTab === "Summary" ? (curChapter.summary || "No summary.") : activeTab === "QnA" ? (curChapter.qna || "No Q&A.") : (curChapter.spellings || "No spellings.")}
                 </div>
               )}
               {activeTab === "Video" && (curChapter.video ? <iframe width="100%" height="500px" src={formatYoutubeLink(curChapter.video)} frameBorder="0" allowFullScreen style={{borderRadius: "15px"}} /> : "No video.")}
               {["Book PDF", "Slides", "Infographic", "Mind Map"].includes(activeTab) && (
                 (() => {
                   let k = activeTab === "Book PDF" ? "bookPdf" : activeTab.charAt(0).toLowerCase() + activeTab.slice(1).replace(" ", "");
                   let link = curChapter[k];
                   if (!link) return "No content uploaded for this tab.";
                   return <iframe src={link.includes("drive.google.com") ? link.replace("/view", "/preview") : link} width="100%" height="800px" style={{border: "none", borderRadius: "15px"}} />;
                 })()
               )}
            </div>
          </div>
        )}

        {view === "edit" && tempChapter && (
             <div className="card">
                <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px"}}>
                    <h2>Editing: {tempChapter.title}</h2>
                    <button onClick={() => { saveAllChanges(); setView("chapters"); }} style={{background: "#10b981", color: "#fff", padding: "12px 30px", border: "none", borderRadius: "12px", fontWeight: "bold"}}>✅ Save</button>
                </div>
                <div style={{display: "flex", flexDirection: "column", gap: "20px"}}>
                    <div><p style={{fontWeight: "bold", fontSize: "14px"}}>Summary:</p><textarea value={tempChapter.summary || ""} onChange={(e) => setTempChapter({...tempChapter, summary: e.target.value})} /></div>
                    <div><p style={{fontWeight: "bold", fontSize: "14px"}}>Q&A:</p><textarea value={tempChapter.qna || ""} onChange={(e) => setTempChapter({...tempChapter, qna: e.target.value})} /></div>
                    <div><p style={{fontWeight: "bold", fontSize: "14px"}}>Spellings:</p><textarea value={tempChapter.spellings || ""} onChange={(e) => setTempChapter({...tempChapter, spellings: e.target.value})} /></div>
                    <div style={{display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "15px"}}>
                        {["video", "slides", "bookPdf", "infographic", "mindMap"].map(f => (
                            <div key={f} className="card" style={{background: "var(--bg)", padding: "15px"}}>
                                <p style={{fontSize: "12px", fontWeight: "bold", color: "#10b981", marginBottom: "8px"}}>{f.toUpperCase()} LINK</p>
                                <input type="text" value={tempChapter[f] || ""} onChange={(e) => setTempChapter({...tempChapter, [f]: e.target.value})} placeholder="Paste link here..." style={{width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)"}} />
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