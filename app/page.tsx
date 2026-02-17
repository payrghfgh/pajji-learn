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
  
  const [books, setBooks] = useState<any[]>([]);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(true); 
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
        setDataLoading(false);
      }
    });

    return () => {
      darkQuery.removeEventListener('change', themeListener);
      unsubAuth();
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    
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
        setDoc(doc(db, "users", user.uid), { 
          completed: [], 
          email: user.email || "guest", 
          xp: 0 
        }, { merge: true });
        setUserXP(0);
      }
      setDataLoading(false);
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

  const IconHome = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
  const IconBook = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>;
  const IconTrophy = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>;

  if (loading) return <div style={{height: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: theme === 'dark' ? "#0f172a" : "#f8fafc", color: "#10b981", fontWeight: "900"}}>PAJJI LEARN...</div>;

  if (!user) {
    return (
      <div style={{height: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: theme === 'dark' ? "#020617" : "#f1f5f9", fontFamily: "sans-serif"}}>
        <div style={{background: theme === 'dark' ? "rgba(30, 41, 59, 0.7)" : "rgba(255, 255, 255, 0.7)", backdropFilter: "blur(12px)", padding: "40px", borderRadius: "32px", width: "90%", maxWidth: "420px", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"}}>
          <h1 style={{color: "#10b981", fontSize: "28px", fontWeight: "900", textAlign: "center", marginBottom: "32px"}}>PAJJI LEARN</h1>
          <form onSubmit={handleAuth} style={{display: "flex", flexDirection: "column", gap: "16px"}}>
            <input type="email" placeholder="Email" value={authEmail} onChange={(e)=>setAuthEmail(e.target.value)} required style={{padding: "14px", borderRadius: "12px", background: theme === 'dark' ? "rgba(0,0,0,0.2)" : "#f1f5f9", border: "1px solid rgba(255,255,255,0.1)", color: theme === 'dark' ? "white" : "#0f172a"}} />
            <input type="password" placeholder="Password" value={authPass} onChange={(e)=>setAuthPass(e.target.value)} required style={{padding: "14px", borderRadius: "12px", background: theme === 'dark' ? "rgba(0,0,0,0.2)" : "#f1f5f9", border: "1px solid rgba(255,255,255,0.1)", color: theme === 'dark' ? "white" : "#0f172a"}} />
            <button type="submit" style={{padding: "14px", background: "#10b981", color: "#fff", border: "none", borderRadius: "12px", fontWeight: "700", cursor: "pointer", boxShadow: "0 10px 15px -3px rgba(16, 185, 129, 0.3)"}}>{isRegistering ? "Register" : "Sign In"}</button>
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
        .dark { 
          --bg: #020617; 
          --side: rgba(15, 23, 42, 0.8); 
          --card: rgba(30, 41, 59, 0.5); 
          --text: #f8fafc; 
          --muted: #94a3b8; 
          --border: rgba(255, 255, 255, 0.08); 
          --input-bg: rgba(0, 0, 0, 0.2); 
        }
        .light { 
          --bg: #f8fafc; 
          --side: rgba(255, 255, 255, 0.8); 
          --card: rgba(255, 255, 255, 0.6); 
          --text: #0f172a; 
          --muted: #64748b; 
          --border: rgba(0, 0, 0, 0.05); 
          --input-bg: #f1f5f9; 
        }
        
        .app-container { display: flex; height: 100dvh; background: var(--bg); color: var(--text); font-family: system-ui, sans-serif; transition: 0.3s; }
        .sidebar { width: 280px; background: var(--side); backdrop-filter: blur(16px); border-right: 1px solid var(--border); padding: 32px 24px; display: flex; flex-direction: column; transition: 0.3s; z-index: 100; }
        .main-content { flex: 1; padding: 48px; overflow-y: auto; }
        .card { 
          background: var(--card); 
          backdrop-filter: blur(8px);
          border: 1px solid var(--border); 
          padding: 24px; 
          border-radius: 24px; 
          box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
          position: relative; 
        }
        
        .nav-btn { width: 100%; padding: 12px 16px; border: none; border-radius: 14px; cursor: pointer; font-weight: 600; text-align: left; margin-bottom: 6px; background: transparent; color: var(--muted); display: flex; align-items: center; gap: 12px; font-size: 15px; transition: 0.2s; }
        .nav-btn svg { width: 20px; height: 20px; opacity: 0.7; }
        .nav-btn:hover { background: rgba(16, 185, 129, 0.1); color: var(--accent); }
        .nav-btn.active { background: var(--accent); color: white; box-shadow: 0 10px 15px -3px rgba(16, 185, 129, 0.2); }
        .nav-btn.active svg { opacity: 1; }
        
        .tab-btn { padding: 8px 16px; border: 1px solid var(--border); border-radius: 99px; background: var(--card); color: var(--muted); cursor: pointer; font-size: 13px; font-weight: 600; margin-bottom: 8px; white-space: nowrap; flex: 0 0 auto; text-align: center; transition: 0.2s; }
        .tab-btn.active { background: var(--accent); color: white; border-color: transparent; }
        
        textarea, input[type="text"] { width: 100%; background: var(--input-bg); color: var(--text); border: 1px solid var(--border); border-radius: 16px; padding: 18px; font-family: inherit; font-size: 16px; outline: none; }
        textarea:focus, input[type="text"]:focus { border-color: var(--accent); }
        
        .xp-badge { background: rgba(16, 185, 129, 0.15); color: var(--accent); padding: 4px 12px; border-radius: 99px; font-size: 12px; font-weight: 700; border: 1px solid rgba(16, 185, 129, 0.2); }
        .mobile-header { display: none; }
        
        @media (max-width: 768px) {
          .app-container { flex-direction: column; }
          .sidebar {
            position: fixed;
            bottom: 24px; /* Floating from bottom */
            left: 50%;
            transform: translateX(-50%);
            width: 85%;
            max-width: 400px;
            height: 60px; /* Slim height */
            padding: 0 20px;
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 50px; /* Pill shape */
            box-shadow: 0 10px 30px -10px rgba(0,0,0,0.5);
            background: rgba(15, 23, 42, 0.75);
            backdrop-filter: blur(20px);
            z-index: 1000;
          }
          
          .sidebar-extras, .sidebar h1 { display: none; }
          
          .nav-btn { 
            margin-bottom: 0; 
            flex-direction: column; 
            gap: 0; 
            font-size: 9px; 
            justify-content: center; 
            align-items: center;
            text-align: center; 
            padding: 0;
            width: auto;
            flex: 1;
            background: transparent !important;
            box-shadow: none !important;
            color: rgba(255, 255, 255, 0.5);
          }
          .nav-btn svg { width: 22px; height: 22px; margin-bottom: 2px; }
          .nav-btn.active { color: var(--accent); }
          .nav-btn.active svg { opacity: 1; stroke-width: 2.5px; }
          
          .main-content { padding: 20px; padding-bottom: 120px; }
          .mobile-header { 
             display: flex; 
             justify-content: space-between; 
             align-items: center; 
             margin-bottom: 24px; 
             padding: 12px 16px;
             background: var(--card);
             border-radius: 20px;
             border: 1px solid var(--border);
          }
          
          .dashboard-grid { grid-template-columns: 1fr !important; gap: 12px !important; }
          .library-grid { grid-template-columns: 1fr 1fr !important; gap: 12px !important; }
          .tab-container { overflow-x: auto; padding-bottom: 10px; gap: 8px; }
        }
      `}</style>

      {/* --- SIDEBAR (Floating Glass Pill on Mobile) --- */}
      <div className="sidebar">
        <div className="sidebar-extras">
            <h1 style={{fontSize: "22px", fontWeight: "900", marginBottom: "32px", letterSpacing: "-0.5px"}}>PAJJI <span style={{color: "#10b981"}}>LEARN</span></h1>
            
            <div style={{background: "linear-gradient(135deg, #059669, #10b981)", padding: "18px", borderRadius: "20px", color: "white", marginBottom: "24px", boxShadow: "0 10px 20px -5px rgba(16, 185, 129, 0.4)"}}>
              <p style={{fontSize: "10px", fontWeight: "800", opacity: 0.8, marginBottom: "4px"}}>LEVEL {userLevel}</p>
              <h3 style={{fontSize: "15px", marginBottom: "10px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"}}>{getUserName(user)}</h3>
              <div style={{height: "6px", background: "rgba(255,255,255,0.2)", borderRadius: "10px", overflow: "hidden"}}>
                <div style={{width: `${(userXP % 500) / 5}%`, height: "100%", background: "#fff"}}></div>
              </div>
              <p style={{fontSize: "11px", marginTop: "8px", fontWeight: "700"}}>{userXP} XP</p>
            </div>
        </div>

        <nav style={{flex: 1, display: "flex", flexDirection: "column", gap: "4px", width: "100%"}}>
          <button className={`nav-btn ${view === "dashboard" ? "active" : ""}`} onClick={() => setView("dashboard")}><IconHome /> <span>Home</span></button>
          <button className={`nav-btn ${view === "library" ? "active" : ""}`} onClick={() => setView("library")}><IconBook /> <span>Library</span></button>
          <button className={`nav-btn ${view === "leaderboard" ? "active" : ""}`} onClick={() => { setView("leaderboard"); fetchLeaderboard(); }}><IconTrophy /> <span>Rankings</span></button>
        </nav>
        
        <div className="sidebar-extras" style={{marginTop: "auto"}}>
          <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="nav-btn" style={{marginBottom: "12px"}}>
            {theme === 'dark' ? "☀️ Light Mode" : "🌙 Dark Mode"}
          </button>
          <button onClick={() => signOut(auth)} style={{width: "100%", padding: "12px", background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: "14px", fontWeight: "700", cursor: "pointer"}}>Sign Out</button>
        </div>
      </div>

      <div className="main-content">
        <div className="mobile-header">
            <h1 style={{fontSize: "18px", fontWeight: "900", marginLeft: "4px"}}>PAJJI <span style={{color: "#10b981"}}>LEARN</span></h1>
            <div style={{display: "flex", gap: "12px", alignItems: "center"}}>
                <div style={{fontSize: "11px", fontWeight: "800", background: "var(--accent)", color: "white", padding: "4px 10px", borderRadius: "20px"}}>{userXP} XP</div>
                <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} style={{background: "none", border: "none", fontSize: "18px"}}>{theme === 'dark' ? "☀️" : "🌙"}</button>
            </div>
        </div>

        {/* --- DASHBOARD --- */}
        {view === "dashboard" && (
          <div style={{maxWidth: "900px"}}>
            <header style={{marginBottom: "32px"}}>
                <h1 style={{fontSize: "32px", fontWeight: "900"}}>Hello, {getUserName(user)}!</h1>
                <p style={{color: "var(--muted)", marginTop: "4px"}}>You're doing great. Keep learning!</p>
            </header>

            <div className="dashboard-grid" style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "40px"}}>
              <div className="card" style={{borderLeft: "4px solid #10b981"}}>
                  <p style={{fontSize: "11px", fontWeight: "bold", opacity: 0.6, textTransform: "uppercase", letterSpacing: "1px"}}>Energy Points</p>
                  <h3 style={{fontSize: "32px", color: "#10b981", marginTop: "8px"}}>{dataLoading ? "..." : userXP} <span style={{fontSize: "16px", opacity: 0.5}}>XP</span></h3>
              </div>
              <div className="card" style={{borderLeft: "4px solid #3b82f6"}}>
                  <p style={{fontSize: "11px", fontWeight: "bold", opacity: 0.6, textTransform: "uppercase", letterSpacing: "1px"}}>Mastered</p>
                  <h3 style={{fontSize: "32px", color: "#3b82f6", marginTop: "8px"}}>{completedLessons.length} <span style={{fontSize: "16px", opacity: 0.5}}>Lessons</span></h3>
              </div>
            </div>
            
            <h2 style={{fontSize: "20px", marginBottom: "16px", fontWeight: "800"}}>Continue Learning</h2>
            <div style={{display: "flex", flexDirection: "column", gap: "12px"}}>
              {getUnmastered().slice(0, 5).map(ch => (
                <div key={ch.id} className="card" style={{display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px"}}>
                  <div>
                      <p style={{fontSize: "10px", color: "#10b981", fontWeight: "900", textTransform: "uppercase"}}>{ch.bookTitle}</p>
                      <h3 style={{fontSize: "16px", marginTop: "4px", fontWeight: "700"}}>{ch.title}</h3>
                  </div>
                  <button onClick={() => {setCurBook(ch.parentBook); setCurChapter(ch); setView("study"); setActiveTab("Summary");}} style={{padding: "10px 20px", background: "#10b981", color: "white", borderRadius: "12px", border: "none", fontWeight: "bold", cursor: "pointer", fontSize: "13px", boxShadow: "0 4px 10px rgba(16, 185, 129, 0.2)"}}>Start</button>
                </div>
              ))}
              {getUnmastered().length === 0 && <div className="card" style={{textAlign: "center", padding: "40px", opacity: 0.6}}>You've mastered everything! 🚀</div>}
            </div>
          </div>
        )}

        {/* --- LEADERBOARD --- */}
        {view === "leaderboard" && (
          <div style={{maxWidth: "600px", margin: "0 auto"}}>
            <h1 style={{textAlign: "center", marginBottom: "32px", fontSize: "28px", fontWeight: "900"}}>Top Learners</h1>
            {leaderboard.map((p, i) => (
              <div key={p.id} className="card" style={{display: "flex", alignItems: "center", marginBottom: "12px", padding: "16px 20px", borderColor: p.id === user.uid ? "var(--accent)" : "var(--border)", background: p.id === user.uid ? "rgba(16, 185, 129, 0.05)" : "var(--card)"}}>
                <span style={{width: "40px", fontWeight: "900", fontSize: "18px", color: i === 0 ? "#fbbf24" : i === 1 ? "#94a3b8" : i === 2 ? "#b45309" : "var(--muted)"}}>#{i+1}</span>
                <div style={{flex: 1}}>
                    <span style={{fontSize: "16px", fontWeight: "700"}}>{p.email && p.email !== "guest" ? p.email.split('@')[0] : "Guest User"}</span>
                    {p.id === user.uid && <span style={{fontSize: "10px", marginLeft: "8px", background: "#10b981", color: "white", padding: "2px 8px", borderRadius: "10px", fontWeight: "900"}}>YOU</span>}
                </div>
                <span className="xp-badge">{p.xp || 0} XP</span>
              </div>
            ))}
          </div>
        )}

        {/* --- LIBRARY --- */}
        {view === "library" && (
          <div>
            <div style={{display: "flex", justifyContent: "space-between", marginBottom: "32px", alignItems: "center"}}>
              <h1 style={{fontSize: "28px", fontWeight: "900"}}>Library</h1>
              {isOwner && <button onClick={() => {const t = prompt("Book Name?"); if(t) { const nl = [...books, {id: Date.now().toString(), title: t, chapters: []}]; setDoc(doc(db, "data", "pajji_database"), { books: nl }); }}} style={{background: "#10b981", color: "white", padding: "10px 20px", borderRadius: "12px", border: "none", fontWeight: "700", cursor: "pointer"}}>+ New Book</button>}
            </div>
            <div className="library-grid" style={{display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "24px"}}>
              {books.map(b => (
                <div key={b.id} className="card" style={{textAlign: "center", transition: "0.2s", cursor: "pointer"}} onClick={() => {setCurBook(b); setView("chapters");}}>
                  <div style={{height: "120px", background: "var(--input-bg)", borderRadius: "18px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "40px", marginBottom: "16px"}}>📖</div>
                  <h3 style={{fontWeight: "800", fontSize: "18px", marginBottom: "4px"}}>{b.title}</h3>
                  <p style={{fontSize: "12px", opacity: 0.5, fontWeight: "600"}}>{b.chapters?.length || 0} Lessons</p>
                  {isOwner && <button className="del-btn" style={{marginTop: "16px", width: "100%", background: "rgba(239, 68, 68, 0.1)", border: "none", color: "#ef4444", padding: "8px", borderRadius: "10px", fontWeight: "bold", fontSize: "11px"}} onClick={(e) => {e.stopPropagation(); deleteItem('book', b.id)}}>Delete</button>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- CHAPTERS --- */}
        {view === "chapters" && curBook && (
          <div style={{maxWidth: "800px"}}>
            <button onClick={() => setView("library")} style={{background: "none", border: "none", color: "#10b981", fontWeight: "800", marginBottom: "24px", cursor: "pointer"}}>← Library</button>
            <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px"}}>
                <h1 style={{fontSize: "28px", fontWeight: "900"}}>{curBook.title}</h1>
                {isOwner && <button onClick={addLesson} style={{background: "#10b981", color: "white", padding: "10px 20px", borderRadius: "12px", border: "none", fontWeight: "700"}}>+ Add Lesson</button>}
            </div>
            {(curBook.chapters || []).map((ch: any) => (
              <div key={ch.id} className="card" style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", padding: "18px 24px"}}>
                <div style={{flex: 1}}>
                    <span style={{fontSize: "17px", fontWeight: "700"}}>{ch.title}</span>
                    {completedLessons.includes(ch.id) && <span style={{marginLeft: "12px", fontSize: "11px", color: "#10b981", fontWeight: "900", background: "rgba(16, 185, 129, 0.1)", padding: "2px 8px", borderRadius: "10px"}}>✓ MASTERED</span>}
                </div>
                <div style={{display: "flex", gap: "10px"}}>
                  <button onClick={() => {setCurChapter(ch); setView("study"); setActiveTab("Summary");}} style={{padding: "8px 20px", background: "#10b981", color: "white", borderRadius: "10px", border: "none", fontWeight: "700", cursor: "pointer"}}>Study</button>
                  {isOwner && (<button onClick={() => {setCurChapter(ch); setTempChapter(ch); setView("edit");}} style={{padding: "8px 12px", border: "1px solid var(--border)", borderRadius: "10px", background: "var(--input-bg)", cursor: "pointer"}}>✎</button>)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* --- STUDY --- */}
        {view === "study" && curChapter && (
          <div style={{maxWidth: "1000px"}}>
            <div style={{display: "flex", justifyContent: "space-between", marginBottom: "24px", alignItems: "center"}}>
              <button onClick={() => setView("chapters")} style={{background: "none", border: "none", color: "#10b981", fontWeight: "800", cursor: "pointer"}}>← Lessons</button>
              {!completedLessons.includes(curChapter.id) ? (
                <button onClick={() => markCompleted(curChapter.id)} style={{background: "#fbbf24", color: "#000", padding: "12px 24px", borderRadius: "14px", border: "none", fontWeight: "900", cursor: "pointer", fontSize: "14px", boxShadow: "0 10px 20px -5px rgba(251, 191, 36, 0.4)"}}>CLAIM 100 XP</button>
              ) : (
                <div style={{display: "flex", alignItems: "center", gap: "8px"}}>
                    <div className="xp-badge">MASTERED</div>
                    <button onClick={() => unmasterLesson(curChapter.id)} style={{background: "none", border: "none", opacity: 0.5, cursor: "pointer"}}>↺</button>
                </div>
              )}
            </div>
            
            <h1 style={{fontSize: "24px", fontWeight: "900", marginBottom: "24px"}}>{curChapter.title}</h1>
            
            <div className="tab-container" style={{display: "flex", gap: "6px", flexWrap: "nowrap", marginBottom: "20px"}}>
                {["Summary", "QnA", "Spellings", "Video", "Book PDF", "Slides", "Infographic", "Mind Map"].map(t => (
                    <button key={t} onClick={() => setActiveTab(t)} className={`tab-btn ${activeTab === t ? "active" : ""}`}>{t}</button>
                ))}
            </div>

            <div className="card" style={{minHeight: "500px", padding: "32px"}}>
               {["Summary", "QnA", "Spellings"].includes(activeTab) && <div style={{whiteSpace: "pre-wrap", fontSize: "17px", lineHeight: "1.8", color: "var(--text)"}}>{curChapter[activeTab.toLowerCase()] || "No content uploaded yet."}</div>}
               {activeTab === "Video" && (curChapter.video ? <iframe width="100%" height="450px" src={formatYoutubeLink(curChapter.video)} frameBorder="0" allowFullScreen style={{borderRadius: "20px", boxShadow: "0 20px 40px rgba(0,0,0,0.2)"}} /> : "No video available.")}
               {["Book PDF", "Slides", "Infographic", "Mind Map"].includes(activeTab) && (() => { 
                 let k = activeTab === "Book PDF" ? "bookPdf" : activeTab.charAt(0).toLowerCase() + activeTab.slice(1).replace(" ", ""); 
                 let link = curChapter[k]; 
                 return link ? <iframe src={link.includes("drive.google.com") ? link.replace("/view", "/preview") : link} width="100%" height="600px" style={{border: "none", borderRadius: "20px"}} /> : <div style={{textAlign: "center", padding: "100px", opacity: 0.5}}>This resource hasn't been linked yet.</div>; 
               })()}
            </div>
          </div>
        )}

        {/* --- EDIT --- */}
        {view === "edit" && tempChapter && (
          <div className="card" style={{maxWidth: "900px", margin: "0 auto"}}>
            <div style={{display: "flex", justifyContent: "space-between", marginBottom: "32px"}}>
                <h2 style={{fontWeight: "900"}}>Editor</h2>
                <button onClick={() => { saveAllChanges(); setView("chapters"); }} style={{background: "#10b981", color: "white", padding: "12px 30px", borderRadius: "14px", border: "none", fontWeight: "800", cursor: "pointer"}}>SAVE CHANGES</button>
            </div>
            <div style={{display: "flex", flexDirection: "column", gap: "24px"}}>
                <div><label style={{color: "#10b981", fontWeight: "800", fontSize: "13px", textTransform: "uppercase", display: "block", marginBottom: "8px"}}>Summary</label><textarea value={tempChapter.summary || ""} onChange={(e) => setTempChapter({...tempChapter, summary: e.target.value})} /></div>
                <div><label style={{color: "#10b981", fontWeight: "800", fontSize: "13px", textTransform: "uppercase", display: "block", marginBottom: "8px"}}>Q&A</label><textarea value={tempChapter.qna || ""} onChange={(e) => setTempChapter({...tempChapter, qna: e.target.value})} /></div>
                <div><label style={{color: "#10b981", fontWeight: "800", fontSize: "13px", textTransform: "uppercase", display: "block", marginBottom: "8px"}}>Spellings</label><textarea placeholder="Type words here..." value={tempChapter.spellings || ""} onChange={(e) => setTempChapter({...tempChapter, spellings: e.target.value})} /></div>
                <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px"}}>
                    {["video", "slides", "bookPdf", "infographic", "mindMap"].map(f => (
                        <div key={f}><p style={{fontSize: "11px", color: "#10b981", fontWeight: "800", textTransform: "uppercase", marginBottom: "6px"}}>{f}</p><input type="text" value={tempChapter[f] || ""} onChange={(e) => setTempChapter({...tempChapter, [f]: e.target.value})} style={{padding: "12px"}} /></div>
                    ))}
                </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}