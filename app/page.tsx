"use client";

import { useEffect, useState } from "react";
import { initializeApp, getApps } from "firebase/app";
import { getFirestore, doc, onSnapshot, setDoc } from "firebase/firestore";

// --- 0. CONFIG ---
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

// --- TYPES ---
interface Chapter {
  id: string; title: string; summary: string; sketchNote: string;
  infographic: string; slides: string; mindMap: string; video: string;
}
interface Book {
  id: string; title: string; image: string; chapters: Chapter[];
}

export default function Home() {
  const [books, setBooks] = useState<Book[]>([]);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"dashboard" | "library" | "chapters" | "edit" | "study">("dashboard");
  const [curBook, setCurBook] = useState<Book | null>(null);
  const [curChapter, setCurChapter] = useState<Chapter | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false); // New: Student View Toggle
  const [activeTab, setActiveTab] = useState<string>("Summary");
  const [passInput, setPassInput] = useState("");

  // Logic: Am I actually allowed to edit right now?
  const canEdit = isOwner && !isPreviewMode;

  useEffect(() => {
    const saved = localStorage.getItem("isPajjiAdmin");
    if (saved === "true") setIsOwner(true);
    const unsub = onSnapshot(doc(db, "data", "pajji_database"), (ds) => {
      if (ds.exists()) setBooks(ds.data().books || []);
    });
    return () => unsub();
  }, []);

  const save = async (nb: Book[]) => {
    if (!canEdit) return;
    try {
      await setDoc(doc(db, "data", "pajji_database"), { books: nb });
    } catch (e) {
      alert("Error saving. Image might be too large.");
    }
  };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 800;
          const scaleSize = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", 0.7));
        };
      };
    });
  };

  const handleCoverUpload = async (bookId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !canEdit) return;
    const compressed = await compressImage(file);
    const updated = books.map(b => b.id === bookId ? { ...b, image: compressed } : b);
    save(updated);
  };

  const handleChapterFile = async (e: React.ChangeEvent<HTMLInputElement>, field: keyof Chapter) => {
    const file = e.target.files?.[0];
    if (!file || !curChapter || !curBook || !canEdit) return;
    
    if (file.type === "application/pdf") {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const updatedCh = { ...curChapter, [field]: reader.result as string };
        updateAndSaveChapter(updatedCh);
      };
    } else {
      const finalData = await compressImage(file);
      const updatedCh = { ...curChapter, [field]: finalData };
      updateAndSaveChapter(updatedCh);
    }
  };

  const updateAndSaveChapter = (updatedCh: Chapter) => {
    if (!curBook) return;
    const updatedBooks = books.map(b => b.id === curBook.id ? 
      { ...b, chapters: b.chapters.map(c => c.id === updatedCh.id ? updatedCh : c) } : b
    );
    save(updatedBooks);
    setCurChapter(updatedCh);
  };

  const filteredBooks = books.filter(b => b.title.toLowerCase().includes(search.toLowerCase()));

  const navBtn = (a: boolean) => ({
    display: "block", width: "100%", padding: "12px", textAlign: "left" as const, borderRadius: "8px", border: "none",
    background: a ? "#10b981" : "transparent", color: a ? "#fff" : "#444", fontWeight: "bold" as const, cursor: "pointer", marginBottom: "5px"
  });

  return (
    <div style={{ display: "flex", height: "100vh", backgroundColor: "#f3f4f6", fontFamily: "sans-serif" }}>
      {/* SIDEBAR */}
      <div style={{ width: "260px", background: "#fff", borderRight: "1px solid #ddd", padding: "20px", display: "flex", flexDirection: "column" }}>
        <h2 style={{ color: "#10b981", cursor: "pointer" }} onClick={() => setView("dashboard")}>Pajji Learn</h2>
        
        <nav style={{ flex: 1, marginTop: "20px" }}>
          <button onClick={() => setView("dashboard")} style={navBtn(view === "dashboard")}>🏠 Dashboard</button>
          <button onClick={() => setView("library")} style={navBtn(view === "library")}>📚 Library</button>
        </nav>

        {isOwner && (
          <div style={{ marginBottom: "20px", padding: "10px", background: "#f0fdf4", borderRadius: "10px", border: "1px solid #bbf7d0" }}>
            <p style={{ fontSize: "12px", margin: "0 0 10px 0", color: "#166534", fontWeight: "bold" }}>ADMIN TOOLS</p>
            <label style={{ display: "flex", alignItems: "center", cursor: "pointer", fontSize: "14px" }}>
              <input type="checkbox" checked={isPreviewMode} onChange={() => setIsPreviewMode(!isPreviewMode)} style={{ marginRight: "10px" }} />
              Student View
            </label>
          </div>
        )}

        {!isOwner ? (
          <div>
            <input type="password" placeholder="Key" value={passInput} onChange={e => setPassInput(e.target.value)} style={{ width: "100%", padding: "8px", borderRadius: "5px", border: "1px solid #ddd" }} />
            <button onClick={() => { if(passInput === "pajindersinghpajji") { setIsOwner(true); localStorage.setItem("isPajjiAdmin", "true"); setPassInput(""); }}} style={{ width: "100%", marginTop: "5px", background: "#10b981", color: "#fff", border: "none", padding: "8px", borderRadius: "5px", cursor: "pointer" }}>Login</button>
          </div>
        ) : (
          <button onClick={() => {setIsOwner(false); setIsPreviewMode(false); localStorage.removeItem("isPajjiAdmin");}} style={{color: "red", border: "none", background: "none", cursor: "pointer", fontWeight: "bold", textAlign: "left"}}>Logout</button>
        )}
      </div>

      {/* MAIN */}
      <div style={{ flex: 1, padding: "40px", overflowY: "auto" }}>
        {view === "library" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
              <h1>My Library</h1>
              <input type="text" placeholder="Search books..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ padding: "10px", borderRadius: "20px", border: "1px solid #ddd", width: "250px" }} />
            </div>
            <div style={{ display: "flex", gap: "25px", flexWrap: "wrap" }}>
              {filteredBooks.map(b => (
                <div key={b.id} style={{ width: "180px", position: "relative" }}>
                   <div onClick={() => { setCurBook(b); setView("chapters"); }} style={{ cursor: "pointer" }}>
                    <img src={b.image} style={{ width: "100%", height: "260px", objectFit: "cover", borderRadius: "12px", boxShadow: "0 4px 10px rgba(0,0,0,0.1)" }} />
                    <p style={{ textAlign: "center" as const, fontWeight: "bold" as const, marginTop: "10px" }}>{b.title}</p>
                  </div>
                  {canEdit && (
                    <label style={{ position: "absolute", top: "5px", left: "5px", background: "#10b981", color: "#fff", width: "30px", height: "30px", borderRadius: "50%", display: "flex", justifyContent: "center", alignItems: "center", cursor: "pointer", zIndex: 10 }}>
                      ✎ <input type="file" hidden accept="image/*" onChange={(e) => handleCoverUpload(b.id, e)} />
                    </label>
                  )}
                </div>
              ))}
            </div>
            {canEdit && <button onClick={() => {
                const t = prompt("Book Title?");
                if(t) save([...books, { id: Date.now().toString(), title: t, image: "https://placehold.co/400x600?text="+t, chapters: [] }]);
            }} style={{marginTop: "30px", padding: "10px 20px", background: "#10b981", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer"}}>+ Add New Book</button>}
          </div>
        )}

        {view === "chapters" && curBook && (
            <div>
                <button onClick={() => setView("library")} style={{background: "none", border: "none", color: "#10b981", cursor: "pointer", fontWeight: "bold", marginBottom: "10px"}}>← Back</button>
                <h1>{curBook.title}</h1>
                {curBook.chapters.map((ch, idx) => (
                    <div key={ch.id} style={{background: "#fff", padding: "15px", borderRadius: "10px", marginBottom: "10px", display: "flex", justifyContent: "space-between", alignItems: "center"}}>
                        <span>{idx + 1}. {ch.title}</span>
                        <div>
                            <button onClick={() => {setCurChapter(ch); setView("study");}} style={{padding: "5px 15px", borderRadius: "5px", border: "1px solid #ddd", cursor: "pointer"}}>Study</button>
                            {canEdit && <button onClick={() => {setCurChapter(ch); setView("edit");}} style={{marginLeft: "5px", padding: "5px 15px", borderRadius: "5px", background: "#2196f3", color: "#fff", border: "none", cursor: "pointer"}}>Edit</button>}
                        </div>
                    </div>
                ))}
                {canEdit && <button onClick={() => {
                    const t = prompt("Lesson Title?");
                    if(t) {
                        const nc = { id: Date.now().toString(), title: t, summary: "", sketchNote: "", infographic: "", slides: "", mindMap: "", video: "" };
                        save(books.map(b => b.id === curBook.id ? {...b, chapters: [...b.chapters, nc]} : b));
                    }
                }} style={{marginTop: "20px", padding: "10px 20px", background: "#10b981", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer"}}>+ Add Lesson</button>}
            </div>
        )}

        {/* ... Rest of Edit and Study logic stays the same ... */}
        {view === "edit" && curChapter && (
            <div style={{background: "#fff", padding: "30px", borderRadius: "15px"}}>
                <h2>Editing: {curChapter.title}</h2>
                <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginTop: "20px"}}>
                    {["sketchNote", "infographic", "slides", "mindMap"].map(f => (
                        <div key={f} style={{border: "1px dashed #ccc", padding: "15px", borderRadius: "10px", textAlign: "center" as const}}>
                            <p style={{textTransform: "capitalize", fontWeight: "bold"}}>{f}</p>
                            <input type="file" onChange={(e) => handleChapterFile(e, f as keyof Chapter)} />
                        </div>
                    ))}
                </div>
                <button onClick={() => setView("chapters")} style={{marginTop: "20px", padding: "10px 20px", background: "#10b981", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer"}}>Save & Close</button>
            </div>
        )}

        {view === "study" && curChapter && (
            <div>
                 <button onClick={() => setView("chapters")} style={{background: "none", border: "none", color: "#10b981", cursor: "pointer", fontWeight: "bold", marginBottom: "10px"}}>← Back</button>
                 <h1>{curChapter.title}</h1>
                 <div style={{display: "flex", gap: "10px", margin: "20px 0"}}>
                    {["Summary", "Sketch Note", "Infographic", "Slides", "Mind Map", "Video"].map(t => (
                        <button key={t} onClick={() => setActiveTab(t)} style={{padding: "8px 15px", borderRadius: "20px", border: "1px solid #ddd", background: activeTab === t ? "#10b981" : "#fff", color: activeTab === t ? "#fff" : "#333", cursor: "pointer"}}>{t}</button>
                    ))}
                 </div>
                 <div style={{background: "#fff", padding: "20px", borderRadius: "15px", minHeight: "400px", textAlign: "center" as const}}>
                    {activeTab === "Summary" && <p style={{textAlign: "left" as const}}>{curChapter.summary || "No summary notes yet."}</p>}
                    {activeTab !== "Summary" && activeTab !== "Video" && (
                        curChapter[activeTab.charAt(0).toLowerCase() + activeTab.slice(1).replace(" ", "") as keyof Chapter] ? (
                            curChapter[activeTab.charAt(0).toLowerCase() + activeTab.slice(1).replace(" ", "") as keyof Chapter].startsWith("data:application/pdf") ? (
                                <iframe src={curChapter[activeTab.charAt(0).toLowerCase() + activeTab.slice(1).replace(" ", "") as keyof Chapter]} style={{width: "100%", height: "600px", border: "none"}} />
                            ) : (
                                <img src={curChapter[activeTab.charAt(0).toLowerCase() + activeTab.slice(1).replace(" ", "") as keyof Chapter]} style={{maxWidth: "100%", borderRadius: "10px"}} />
                            )
                        ) : <p>Nothing uploaded here yet.</p>
                    )}
                 </div>
            </div>
        )}

        {view === "dashboard" && (
            <div>
                <h1>Pajji's Learning Dashboard</h1>
                <p>Track your progress and manage your library.</p>
                <div style={{ display: "flex", gap: "20px", marginTop: "20px" }}>
                  <div style={{ background: "#fff", padding: "20px", borderRadius: "15px", flex: 1, textAlign: "center" }}>
                    <h2>{books.length}</h2>
                    <p>Total Books</p>
                  </div>
                  <div style={{ background: "#fff", padding: "20px", borderRadius: "15px", flex: 1, textAlign: "center" }}>
                    <h2>{books.reduce((acc, b) => acc + b.chapters.length, 0)}</h2>
                    <p>Total Lessons</p>
                  </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}