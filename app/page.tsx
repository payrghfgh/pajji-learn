"use client";

import { useEffect, useState, useRef } from "react";
import { initializeApp, getApps } from "firebase/app";
import { 
  getFirestore, doc, onSnapshot, setDoc, getDoc, 
  updateDoc, arrayUnion, arrayRemove, collection, query, orderBy, limit, getDocs 
} from "firebase/firestore";
import { 
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, 
  signInAnonymously, onAuthStateChanged, signOut 
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
  
  // Data States
  const [books, setBooks] = useState<any[]>([]);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  
  // UI States
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("dashboard");
  const [curBook, setCurBook] = useState<any>(null);
  const [curChapter, setCurChapter] = useState<any>(null);
  const [tempChapter, setTempChapter] = useState<any>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [activeTab, setActiveTab] = useState("Summary");
  const [saveStatus, setSaveStatus] = useState("");
  const [userXP, setUserXP] = useState(0);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  const curBookIdRef = useRef<string | null>(null);

  useEffect(() => {
    curBookIdRef.current = curBook?.id || null;
  }, [curBook]);

  // --- EFFECT 1: THEME & AUTH ---
  useEffect(() => {
    const darkQuery = window.matchMedia("(prefers-color-scheme: dark)");
    setTheme(darkQuery.matches ? 'dark' : 'light');
    const themeListener = (e: MediaQueryListEvent) => setTheme(e.matches ? 'dark' : 'light');
    darkQuery.addEventListener('change', themeListener);

    const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsOwner(currentUser?.email === "rushanbindra@gmail.com");
      
      if (!currentUser) {
        setBooks([]);
        setCompletedLessons([]);
        setUserXP(0);
        setCurBook(null);
        setLoading(false);
      }
    });

    return () => {
      darkQuery.removeEventListener('change', themeListener);
      unsubAuth();
    };
  }, []);

  // --- EFFECT 2: DATA LISTENERS ---
  useEffect(() => {
    if (!user) return;
    setLoading(true);
    
    const unsubBooks = onSnapshot(doc(db, "data", "pajji_database"), (ds) => {
      if (ds.exists()) {
        const data = ds.data().books || [];
        setBooks(data);
        if (curBookIdRef.current) {
          const updatedBook = data.find((b: any) => b.id === curBookIdRef.current);
          if (updatedBook) setCurBook(updatedBook);
          else { setCurBook(null); setView("library"); }
        }
      } else { setBooks([]); }
      setLoading(false);
    });

    const unsubUserData = onSnapshot(doc(db, "users", user.uid), (ds) => {
      if (ds.exists()) {
        const data = ds.data();
        setCompletedLessons(data.completed || []);
        setUserXP(data.xp || 0);
      } else {
        setDoc(doc(db, "users", user.uid), { completed: [], email: user.email || "guest", xp: 0 }, { merge: true });
      }
    });

    fetchLeaderboard();
    return () => { unsubBooks(); unsubUserData(); };
  }, [user]);

  const fetchLeaderboard = async () => {
    try {
      const q = query(collection(db, "users"), orderBy("xp", "desc"), limit(10));
      const snap = await getDocs(q);
      setLeaderboard(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.error(e); }
  };

  const markCompleted = async (lessonId: string) => {
    if (!user || completedLessons.includes(lessonId)) return;
    setSaveStatus("Syncing XP...");
    const userRef = doc(db, "users", user.uid);
    try {
      const snap = await getDoc(userRef);
      const currentXP = snap.exists() ? (snap.data().xp || 0) : 0;
      await setDoc(userRef, { completed: arrayUnion(lessonId), xp: currentXP + 100, email: user.email || "guest" }, { merge: true });
      setSaveStatus("Success! +100 XP");
      fetchLeaderboard();
      setTimeout(() => setSaveStatus(""), 3000);
    } catch (e) { setSaveStatus("Error"); }
  };

  const unmasterLesson = async (lessonId: string) => {
    if (!user || !completedLessons.includes(lessonId)) return;
    if (!confirm("Are you sure? This will remove 100 XP.")) return;
    setSaveStatus("Removing mastery...");
    const userRef = doc(db, "users", user.uid);
    try {
      const snap = await getDoc(userRef);
      const currentXP = snap.exists() ? (snap.data().xp || 0) : 0;
      await setDoc(userRef, { completed: arrayRemove(lessonId), xp: Math.max(0, currentXP - 100) }, { merge: true });
      setSaveStatus("Mastery Reset");
      fetchLeaderboard();
      setTimeout(() => setSaveStatus(""), 3000);
    } catch (e) { setSaveStatus("Error"); }
  };

  const handleAuth = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isRegistering) await createUserWithEmailAndPassword(auth, authEmail, authPass);
      else await signInWithEmailAndPassword(auth, authEmail, authPass);
    } catch (err: any) { alert(err.message); setLoading(false); }
  };

  const handleGuestLogin = async () => {
    setLoading(true);
    try { await signInAnonymously(auth); } catch (err: any) { alert(err.message); setLoading(false); }
  };

  const saveAllChanges = async () => {
    if (!tempChapter || !isOwner || !curBook) return;
    setSaveStatus("Syncing...");
    try {
        const newList = books.map(b => 
            b.id === curBook.id 
            ? { ...b, chapters: b.chapters.map((c: any) => c.id === tempChapter.id ? tempChapter : c) } 
            : b
        );
        await setDoc(doc(db, "data", "pajji_database"), { books: newList });
        setSaveStatus("Saved");
        setTimeout(() => setSaveStatus(""), 2000);
    } catch (e) { setSaveStatus("Error"); }
  };

  const deleteItem = async (type: 'book' | 'lesson', id: string) => {
    if (!isOwner || !confirm(`Delete ${type}?`)) return;
    try {
        let newList = type === 'book' ? books.filter(b => b.id !== id) : books.map(b => b.id === curBook.id ? { ...b, chapters: b.chapters.filter((c: any) => c.id !== id) } : b);
        if(type === 'book') setView("library");
        await setDoc(doc(db, "data", "pajji_database"), { books: newList });
        setSaveStatus("Deleted");
    } catch (e) { alert("Error deleting."); }
  };

  const formatYoutubeLink = (url: string) => {
    if (!url) return "";
    try {
        let vid = url.includes("v=") ? url.split("v=")[1].split("&")[0] : url.includes("youtu.be/") ? url.split("youtu.be/")[1].split("?")[0] : url.includes("shorts/") ? url.split("shorts/")[1].split("?")[0] : "";
        return vid ? `https://www.youtube.com/embed/${vid}` : url;
    } catch (e) { return url; }
  };

  const addLesson = async () => {
    const title = prompt("Lesson Title?");
    if (!title || !curBook) return;
    const newLesson = { id: Date.now().toString(), title, summary: "", qna: "", spellings: "", video: "", slides: "", bookPdf: "", infographic: "", mindMap: "" };
    const updatedBooks = books.map(b => b.id === curBook.id ? { ...b, chapters: [...(b.chapters || []), newLesson] } : b );
    await setDoc(doc(db, "data", "pajji_database"), { books: updatedBooks });
  };

  const getUnmastered = () => {
    let unmastered: any[] = [];
    books.forEach(book => book.chapters?.forEach((ch: any) => {
        if (!completedLessons.includes(ch.id)) unmastered.push({ ...ch, bookTitle: book.title, parentBook: book });
    }));
    return unmastered;
  };

  const getUserName = (u: any) => u?.isAnonymous ? "Guest User" : u?.email?.split('@')[0] || "User";
  const userLevel = Math.floor(userXP / 500) + 1;

  if (loading) return <div style={{height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: theme === 'dark' ? "#0f172a" : "#f8fafc", color: "#10b981", fontWeight: "900"}}>PAJJI LEARN...</div>;

  if (!user) {
    return (
      <div style={{height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: theme === 'dark' ? "#020617" : "#f1f5f9", fontFamily: "sans-serif"}}>
        <div style={{background: theme === 'dark' ? "#0f172a" : "#ffffff", padding: "40px", borderRadius: "32px", width: "90%", maxWidth: "420px", border: "1px solid #e2e8f0"}}>
          <h1 style={{color: "#10b981", fontSize: "28px", fontWeight: "900", textAlign: "center", marginBottom: "32px"}}>PAJJI LEARN</h1>
          <form onSubmit={handleAuth} style={{display: "flex", flexDirection: "column", gap: "16px"}}>
            <input type="email" placeholder="Email" value={authEmail} onChange={(e)=>setAuthEmail(e.target.value)} required style={{padding: "14px", borderRadius: "12px", background: theme === 'dark' ? "#020617" : "#f1f5f9", border: "1px solid #cbd5e1", color: theme === 'dark' ? "white" : "#0f172a"}} />
            <input type="password" placeholder="Password" value={authPass} onChange={(e)=>setAuthPass(e.target.value)} required style={{padding: "14px", borderRadius: "12px", background: theme === 'dark' ? "#020617" : "#f1f5f9", border: "1px solid #cbd5e1", color: theme === 'dark' ? "white" : "#0f172a"}} />
            <button type="submit" style={{padding: "14px", background: "#10b981", color: "#fff", border: "none", borderRadius: "12px", fontWeight: "700", cursor: "pointer"}}>{isRegistering ? "Register" : "Sign In"}</button>
          </form>
          <div style={{display: "flex", flexDirection: "column", gap: "12px", marginTop: "24px"}}>
            <button onClick={handleGuestLogin} style={{background: "none", border: "1px solid #10b981", color: "#10b981", padding: "12px", borderRadius: "12px", fontWeight: "700", cursor: "pointer"}}>Continue as Guest 👤</button>
            <button onClick={() => setIsRegistering(!isRegistering)} style={{background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: "14px"}}>{isRegistering ? "Back to Login" : "Create Account"}</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`app-container ${theme}`}>
      <style>{`
        :root { --accent: #10b981; }
        .dark { --bg: #020617; --side: #0f172a; --card: #1e293b; --text: #f8fafc; --muted: #94a3b8; --border: #334155; --input-bg: #020617; }
        .light { --bg: #f8fafc; --side: #ffffff; --card: #ffffff; --text: #0f172a; --muted: #64748b; --border: #e2e8f0; --input-bg: #f1f5f9; }
        
        .app-container { display: flex; height: 100vh; background: var(--bg); color: var(--text); font-family: system-ui, sans-serif; transition: 0.3s; }
        .sidebar { width: 300px; background: var(--side); border-right: 1px solid var(--border); padding: 32px 24px; display: flex; flex-direction: column; transition: 0.3s; }
        .main-content { flex: 1; padding: 48px; overflow-y: auto; }
        .card { background: var(--card); border: 1px solid var(--border); padding: 24px; border-radius: 24px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); position: relative; }
        
        /* Navigation Buttons */
        .nav-btn { width: 100%; padding: 14px 18px; border: none; border-radius: 14px; cursor: pointer; font-weight: 600; text-align: left; margin-bottom: 8px; background: transparent; color: var(--muted); display: flex; align-items: center; gap: 10px; font-size: 16px; }
        .nav-btn:hover { background: rgba(16, 185, 129, 0.1); }
        .nav-btn.active { background: var(--accent); color: white; }
        
        /* Interactive Elements */
        .tab-btn { padding: 10px 18px; border: 1px solid var(--border); border-radius: 12px; background: var(--input-bg); color: var(--muted); cursor: pointer; font-size: 13px; font-weight: 600; margin-bottom: 8px; white-space: nowrap; flex: 1; text-align: center; }
        .tab-btn.active { background: var(--accent); color: white; border-color: var(--accent); }
        textarea, input[type="text"] { width: 100%; background: var(--input-bg); color: var(--text); border: 1px solid var(--border); border-radius: 16px; padding: 18px; font-family: inherit; font-size: 16px; }
        textarea { min-height: 160px; }
        
        .xp-badge { background: rgba(16, 185, 129, 0.1); color: var(--accent); padding: 4px 12px; border-radius: 99px; font-size: 12px; font-weight: 700; border: 1px solid rgba(16, 185, 129, 0.2); }
        .theme-btn { margin-bottom: 20px; padding: 10px; border-radius: 12px; border: 1px solid var(--border); background: var(--input-bg); color: var(--text); cursor: pointer; font-size: 12px; font-weight: 800; text-transform: uppercase; }
        .del-btn { background: #ef444420; color: #ef4444; border: 1px solid #ef444440; padding: 8px 12px; borderRadius: 8px; cursor: pointer; font-weight: bold; }
        .unmaster-btn { background: none; border: 1px solid #ef444450; color: #ef4444; padding: 4px 12px; border-radius: 8px; cursor: pointer; font-size: 11px; font-weight: bold; margin-left: 8px; }

        /* --- MOBILE STYLES (Max Width 768px) --- */
        .mobile-header { display: none; }
        
        @media (max-width: 768px) {
          .app-container { flex-direction: column; }
          .sidebar {
            position: fixed;
            bottom: 0;
            left: 0;
            width: 100%;
            height: 70px;
            padding: 8px;
            flex-direction: row;
            justify-content: space-around;
            border-right: none;
            border-top: 1px solid var(--border);
            background: var(--side);
            z-index: 100;
          }
          
          /* Hide non-nav items in bottom bar */
          .sidebar-extras, .sidebar h1, .sidebar .theme-btn { display: none; }
          
          /* Navigation Buttons for Bottom Bar */
          .nav-btn { margin-bottom: 0; flex-direction: column; gap: 4px; font-size: 10px; justify-content: center; text-align: center; border-radius: 8px; padding: 8px; }
          .nav-btn span { display: block; } /* Show text below icon */
          
          /* Main Content Adjustments */
          .main-content { padding: 20px; padding-bottom: 90px; }
          
          /* Mobile Header */
          .mobile-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
          .mobile-header h1 { font-size: 20px; margin: 0; }
          
          /* Grids */
          .dashboard-grid { grid-template-columns: 1fr !important; gap: 16px !important; }
          .library-grid { grid-template-columns: 1fr 1fr !important; gap: 16px !important; }
          
          /* Tabs */
          .tab-container { overflow-x: auto; padding-bottom: 10px; }
        }
      `}</style>

      {/* --- SIDEBAR (Desktop Left / Mobile Bottom) --- */}
      <div className="sidebar">
        <div className="sidebar-extras">
            <h1 style={{fontSize: "24px", fontWeight: "900", marginBottom: "40px"}}>PAJJI <span style={{color: "#10b981"}}>LEARN</span></h1>
            <button className="theme-btn" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>{theme === 'dark' ? "☀️ Light Mode" : "🌙 Dark Mode"}</button>
            <div style={{background: "linear-gradient(135deg, #059669, #10b981)", padding: "20px", borderRadius: "20px", color: "white", marginBottom: "32px"}}>
            <p style={{fontSize: "11px", fontWeight: "800", opacity: 0.8}}>PROGRESS</p>
            <h3 style={{fontSize: "16px", marginBottom: "12px"}}>{getUserName(user)}</h3>
            <div style={{display: "flex", justifyContent: "space-between", fontSize: "12px"}}><span>Lvl {userLevel}</span><span>{userXP} XP</span></div>
            </div>
        </div>

        <nav style={{flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: "4px"}}>
          <button className={`nav-btn ${view === "dashboard" ? "active" : ""}`} onClick={() => setView("dashboard")}><span>🏠</span> Dashboard</button>
          <button className={`nav-btn ${view === "library" ? "active" : ""}`} onClick={() => setView("library")}><span>📚</span> Library</button>
          <button className={`nav-btn ${view === "leaderboard" ? "active" : ""}`} onClick={() => { setView("leaderboard"); fetchLeaderboard(); }}><span>🏆</span> Rankings</button>
        </nav>
        
        <div className="sidebar-extras" style={{marginTop: "auto"}}>
          {saveStatus && <p style={{fontSize: "12px", color: "#10b981", fontWeight: "bold", textAlign: "center", marginBottom: "8px"}}>{saveStatus}</p>}
          <button onClick={() => signOut(auth)} style={{width: "100%", padding: "14px", background: "#ef444415", color: "#ef4444", border: "1px solid #ef444430", borderRadius: "14px", fontWeight: "700", cursor: "pointer"}}>Sign Out</button>
        </div>
      </div>

      <div className="main-content">
        {/* --- MOBILE ONLY HEADER --- */}
        <div className="mobile-header">
            <h1 style={{fontSize: "20px", fontWeight: "900"}}>PAJJI <span style={{color: "#10b981"}}>LEARN</span></h1>
            <div style={{display: "flex", gap: "10px"}}>
                <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} style={{background: "none", border: "none", fontSize: "20px"}}>{theme === 'dark' ? "☀️" : "🌙"}</button>
                <button onClick={() => signOut(auth)} style={{background: "none", border: "none", fontSize: "20px"}}>🚪</button>
            </div>
        </div>

        {/* --- DASHBOARD VIEW --- */}
        {view === "dashboard" && (
          <div style={{maxWidth: "800px"}}>
            <h1 style={{fontSize: "36px", fontWeight: "900", marginBottom: "24px"}}>Welcome Back</h1>
            
            {/* Mobile: Stacked, Desktop: Side-by-side */}
            <div className="dashboard-grid" style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "40px"}}>
              <div className="card"><h3>{userXP} Total XP</h3></div>
              <div className="card"><h3>{completedLessons.length} Completed</h3></div>
            </div>
            
            <h2 style={{marginBottom: "16px"}}>Unmastered Lessons</h2>
            <div style={{display: "flex", flexDirection: "column", gap: "12px"}}>
              {getUnmastered().length > 0 ? getUnmastered().map(ch => (
                <div key={ch.id} className="card" style={{display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 24px"}}>
                  <div style={{flex: 1, paddingRight: "10px"}}>
                      <p style={{fontSize: "12px", color: "#10b981", fontWeight: "bold"}}>{ch.bookTitle}</p>
                      <h3 style={{fontSize: "16px", marginTop: "4px"}}>{ch.title}</h3>
                  </div>
                  <button onClick={() => {setCurBook(ch.parentBook); setCurChapter(ch); setView("study"); setActiveTab("Summary");}} style={{padding: "8px 16px", background: "#10b981", color: "white", borderRadius: "8px", border: "none", fontWeight: "bold", cursor: "pointer", fontSize: "14px", whiteSpace: "nowrap"}}>Go</button>
                </div>
              )) : <p>You've mastered everything! 🚀</p>}
            </div>
          </div>
        )}

        {/* --- LEADERBOARD VIEW --- */}
        {view === "leaderboard" && (
          <div style={{maxWidth: "700px", margin: "0 auto"}}>
            <h1 style={{textAlign: "center", marginBottom: "32px"}}>🏆 Top Learners</h1>
            {leaderboard.map((p, i) => (
              <div key={p.id} className="card" style={{display: "flex", alignItems: "center", marginBottom: "12px", borderColor: p.id === user.uid ? "#10b981" : "var(--border)"}}>
                <span style={{width: "30px", fontWeight: "900", fontSize: "16px"}}>#{i+1}</span>
                <span style={{flex: 1, fontSize: "14px", fontWeight: "600"}}>{p.email && p.email !== "guest" ? p.email.split('@')[0] : "Guest"}</span>
                <span className="xp-badge">{p.xp || 0} XP</span>
              </div>
            ))}
          </div>
        )}

        {/* --- LIBRARY VIEW --- */}
        {view === "library" && (
          <div>
            <div style={{display: "flex", justifyContent: "space-between", marginBottom: "24px", alignItems: "center"}}>
              <h1>Library</h1>
              {isOwner && <button onClick={() => {const t = prompt("Book Name?"); if(t) { const nl = [...books, {id: Date.now().toString(), title: t, chapters: []}]; setDoc(doc(db, "data", "pajji_database"), { books: nl }); }}} style={{background: "#10b981", color: "white", padding: "8px 16px", borderRadius: "10px", border: "none", fontWeight: "700", cursor: "pointer"}}>+ Book</button>}
            </div>
            <div className="library-grid" style={{display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "24px"}}>
              {books.map(b => (
                <div key={b.id} className="card" style={{textAlign: "center"}}>
                  <div style={{cursor: "pointer"}} onClick={() => {setCurBook(b); setView("chapters");}}>
                      <div style={{height: "140px", background: "var(--input-bg)", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "40px", marginBottom: "16px"}}>📖</div>
                      <h3 style={{fontWeight: "700", fontSize: "16px"}}>{b.title}</h3>
                  </div>
                  {isOwner && <button className="del-btn" style={{width: "100%", marginTop: "12px", fontSize: "12px"}} onClick={() => deleteItem('book', b.id)}>Delete</button>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- CHAPTERS VIEW --- */}
        {view === "chapters" && curBook && (
          <div style={{maxWidth: "900px"}}>
            <button onClick={() => setView("library")} style={{background: "none", border: "none", color: "#10b981", fontWeight: "700", marginBottom: "20px", cursor: "pointer"}}>← Back</button>
            <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px"}}>
                <h1 style={{fontSize: "24px"}}>{curBook.title}</h1>
                {isOwner && <button onClick={addLesson} style={{background: "#10b981", color: "white", padding: "8px 16px", borderRadius: "10px", border: "none", fontWeight: "700", cursor: "pointer"}}>+ Lesson</button>}
            </div>
            {(curBook.chapters || []).map((ch: any) => (
              <div key={ch.id} className="card" style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", padding: "16px"}}>
                <span style={{fontSize: "16px", fontWeight: "600", flex: 1}}>{ch.title} {completedLessons.includes(ch.id) && "✅"}</span>
                <div style={{display: "flex", gap: "8px"}}>
                  <button onClick={() => {setCurChapter(ch); setView("study"); setActiveTab("Summary");}} style={{padding: "8px 16px", background: "#10b981", color: "white", borderRadius: "10px", border: "none", fontWeight: "700", cursor: "pointer", fontSize: "14px"}}>Study</button>
                  {isOwner && (<button onClick={() => {setCurChapter(ch); setTempChapter(ch); setView("edit");}} style={{padding: "8px 12px", border: "1px solid #3b82f6", color: "#3b82f6", borderRadius: "10px", background: "none", cursor: "pointer"}}>✎</button>)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* --- STUDY VIEW --- */}
        {view === "study" && curChapter && (
          <div>
            <div style={{display: "flex", justifyContent: "space-between", marginBottom: "20px", alignItems: "center"}}>
              <button onClick={() => setView("chapters")} style={{background: "none", border: "none", color: "#10b981", fontWeight: "700", cursor: "pointer"}}>← Back</button>
              {!completedLessons.includes(curChapter.id) ? (
                <button onClick={() => markCompleted(curChapter.id)} style={{background: "#fbbf24", color: "white", padding: "10px 20px", borderRadius: "12px", border: "none", fontWeight: "900", cursor: "pointer", fontSize: "14px"}}>CLAIM XP</button>
              ) : (
                <div style={{display: "flex", alignItems: "center", gap: "8px"}}>
                    <div className="xp-badge">MASTERED</div>
                    <button className="unmaster-btn" onClick={() => unmasterLesson(curChapter.id)}>↺</button>
                </div>
              )}
            </div>
            <h1 style={{fontSize: "24px", marginBottom: "20px"}}>{curChapter.title}</h1>
            <div className="tab-container" style={{display: "flex", gap: "8px", flexWrap: "nowrap", marginBottom: "24px"}}>
                {["Summary", "QnA", "Spellings", "Video", "Book PDF", "Slides", "Infographic", "Mind Map"].map(t => (
                    <button key={t} onClick={() => setActiveTab(t)} className={`tab-btn ${activeTab === t ? "active" : ""}`}>{t}</button>
                ))}
            </div>
            <div className="card" style={{minHeight: "500px"}}>
               {["Summary", "QnA", "Spellings"].includes(activeTab) && <div style={{whiteSpace: "pre-wrap", fontSize: "16px", lineHeight: "1.7"}}>{curChapter[activeTab.toLowerCase()] || "No content."}</div>}
               {activeTab === "Video" && (curChapter.video ? <iframe width="100%" height="300px" src={formatYoutubeLink(curChapter.video)} frameBorder="0" allowFullScreen style={{borderRadius: "16px"}} /> : "No video.")}
               {["Book PDF", "Slides", "Infographic", "Mind Map"].includes(activeTab) && (() => { 
                 let k = activeTab === "Book PDF" ? "bookPdf" : activeTab.charAt(0).toLowerCase() + activeTab.slice(1).replace(" ", ""); 
                 let link = curChapter[k]; 
                 return link ? <iframe src={link.includes("drive.google.com") ? link.replace("/view", "/preview") : link} width="100%" height="500px" style={{border: "none", borderRadius: "16px"}} /> : "Not linked."; 
               })()}
            </div>
          </div>
        )}

        {/* --- EDIT VIEW --- */}
        {view === "edit" && tempChapter && (
          <div className="card" style={{maxWidth: "900px", margin: "0 auto"}}>
            <div style={{display: "flex", justifyContent: "space-between", marginBottom: "24px"}}>
                <h2>Edit</h2>
                <button onClick={() => { saveAllChanges(); setView("chapters"); }} style={{background: "#10b981", color: "white", padding: "10px 24px", borderRadius: "12px", border: "none", fontWeight: "700", cursor: "pointer"}}>SAVE</button>
            </div>
            <div style={{display: "flex", flexDirection: "column", gap: "20px"}}>
                <div><label style={{color: "#10b981", fontWeight: "bold", fontSize: "14px"}}>Summary</label><textarea value={tempChapter.summary || ""} onChange={(e) => setTempChapter({...tempChapter, summary: e.target.value})} /></div>
                <div><label style={{color: "#10b981", fontWeight: "bold", fontSize: "14px"}}>Q&A</label><textarea value={tempChapter.qna || ""} onChange={(e) => setTempChapter({...tempChapter, qna: e.target.value})} /></div>
                <div><label style={{color: "#10b981", fontWeight: "bold", fontSize: "14px"}}>Spellings</label><textarea placeholder="Type words here..." value={tempChapter.spellings || ""} onChange={(e) => setTempChapter({...tempChapter, spellings: e.target.value})} /></div>
                <div style={{display: "grid", gridTemplateColumns: "1fr", gap: "16px"}}>
                    {["video", "slides", "bookPdf", "infographic", "mindMap"].map(f => (
                        <div key={f}><p style={{fontSize: "12px", color: "#10b981", fontWeight: "bold"}}>{f.toUpperCase()}</p><input type="text" value={tempChapter[f] || ""} onChange={(e) => setTempChapter({...tempChapter, [f]: e.target.value})} /></div>
                    ))}
                </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}