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
  const [libraryQuery, setLibraryQuery] = useState("");
  const [libraryFilter, setLibraryFilter] = useState<"all" | "notStarted" | "inProgress" | "mastered">("all");
  const [lastLesson, setLastLesson] = useState<{ bookId: string; chapterId: string } | null>(null);
  const [streakCount, setStreakCount] = useState(0);
  const [lastStudyDate, setLastStudyDate] = useState<string | null>(null);
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>([]);
  const [dailyGoal, setDailyGoal] = useState(2);
  const [dailyCompleted, setDailyCompleted] = useState(0);
  const [dailyProgressDate, setDailyProgressDate] = useState<string | null>(null);
  const [quickReviewMode, setQuickReviewMode] = useState(false);
  const [achievementToast, setAchievementToast] = useState("");
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string | number>>({});
  const [quizResult, setQuizResult] = useState("");
  const [quizBuilderText, setQuizBuilderText] = useState("");
  const [quizImageErrors, setQuizImageErrors] = useState<Record<number, boolean>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizReview, setQuizReview] = useState<Record<number, { isCorrect: boolean; submitted: string; expected: string }>>({});
  const [aiParsingQuiz, setAiParsingQuiz] = useState(false);
  const [quizShuffleEnabled, setQuizShuffleEnabled] = useState(true);
  const [quizActiveIndices, setQuizActiveIndices] = useState<number[] | null>(null);
  const [quizQuestionOrder, setQuizQuestionOrder] = useState<number[]>([]);
  const [quizOptionOrder, setQuizOptionOrder] = useState<Record<number, number[]>>({});

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
        setLastLesson(null);
        setStreakCount(0);
        setLastStudyDate(null);
        setUnlockedAchievements([]);
        setDailyGoal(2);
        setDailyCompleted(0);
        setDailyProgressDate(null);
        setQuickReviewMode(false);
        setAchievementToast("");
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
        setLastLesson(data.lastLesson || null);
        setStreakCount(data.streakCount || 0);
        setLastStudyDate(data.lastStudyDate || null);
        setUnlockedAchievements(data.achievements || []);
        setDailyGoal(data.dailyGoal || 2);
        setDailyCompleted(data.dailyCompleted || 0);
        setDailyProgressDate(data.dailyProgressDate || null);
      } else {
        setDoc(doc(db, "users", user.uid), { 
          completed: [], 
          email: user.email || "guest", 
          xp: 0,
          lastLesson: null,
          streakCount: 0,
          lastStudyDate: null,
          achievements: [],
          dailyGoal: 2,
          dailyCompleted: 0,
          dailyProgressDate: null
        }, { merge: true });
        setUserXP(0);
        setLastLesson(null);
        setStreakCount(0);
        setLastStudyDate(null);
        setUnlockedAchievements([]);
        setDailyGoal(2);
        setDailyCompleted(0);
        setDailyProgressDate(null);
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

  const getLocalDateKey = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = `${d.getMonth() + 1}`.padStart(2, "0");
    const day = `${d.getDate()}`.padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const getDayDiff = (from: string, to: string) => {
    const [fy, fm, fd] = from.split("-").map(Number);
    const [ty, tm, td] = to.split("-").map(Number);
    const fromDate = new Date(fy, fm - 1, fd);
    const toDate = new Date(ty, tm - 1, td);
    const msInDay = 24 * 60 * 60 * 1000;
    return Math.round((toDate.getTime() - fromDate.getTime()) / msInDay);
  };

  const achievementCatalog = [
    { id: "first_mastery", title: "First Mastery", description: "Master your first lesson." },
    { id: "five_masteries", title: "Knowledge Builder", description: "Master 5 lessons." },
    { id: "twenty_masteries", title: "Learning Machine", description: "Master 20 lessons." },
    { id: "streak_3", title: "On Fire", description: "Keep a 3-day learning streak." },
    { id: "streak_7", title: "Unstoppable", description: "Keep a 7-day learning streak." },
    { id: "xp_1000", title: "XP Grinder", description: "Reach 1,000 XP." },
  ];

  const getAchievementIds = ({ completedCount, xp, streak }: { completedCount: number; xp: number; streak: number }) => {
    const ids: string[] = [];
    if (completedCount >= 1) ids.push("first_mastery");
    if (completedCount >= 5) ids.push("five_masteries");
    if (completedCount >= 20) ids.push("twenty_masteries");
    if (streak >= 3) ids.push("streak_3");
    if (streak >= 7) ids.push("streak_7");
    if (xp >= 1000) ids.push("xp_1000");
    return ids;
  };

  const getNextUnmasteredLesson = (completedSet: Set<string>) => {
    for (const book of books) {
      for (const chapter of book.chapters || []) {
        if (!completedSet.has(chapter.id)) return { book, chapter };
      }
    }
    return null;
  };

  const updateDailyGoal = async (nextGoal: number) => {
    if (!user) return;
    const clampedGoal = Math.min(10, Math.max(1, nextGoal));
    setDailyGoal(clampedGoal);
    try {
      await setDoc(doc(db, "users", user.uid), { dailyGoal: clampedGoal }, { merge: true });
    } catch (e) {
      console.error(e);
    }
  };

  const markCompleted = async (lessonId: string) => {
    if (!user || completedLessons.includes(lessonId)) return;
    setSaveStatus("Syncing XP...");
    const userRef = doc(db, "users", user.uid);
    try {
      const snap = await getDoc(userRef);
      const currentXP = snap.exists() ? (snap.data().xp || 0) : 0;
      const currentCompleted = snap.exists() ? (snap.data().completed || []) : [];
      const currentAchievements = snap.exists() ? (snap.data().achievements || []) : [];
      const previousStudyDate = snap.exists() ? (snap.data().lastStudyDate || null) : null;
      const currentStreak = snap.exists() ? (snap.data().streakCount || 0) : 0;
      const currentDailyGoal = snap.exists() ? (snap.data().dailyGoal || 2) : 2;
      const currentDailyCompleted = snap.exists() ? (snap.data().dailyCompleted || 0) : 0;
      const currentDailyDate = snap.exists() ? (snap.data().dailyProgressDate || null) : null;

      const today = getLocalDateKey();
      let nextStreak = 1;
      if (previousStudyDate === today) nextStreak = currentStreak || 1;
      else if (previousStudyDate && getDayDiff(previousStudyDate, today) === 1) nextStreak = currentStreak + 1;

      let nextDailyCompleted = 1;
      if (currentDailyDate === today) nextDailyCompleted = currentDailyCompleted + 1;
      const goalReachedNow = nextDailyCompleted >= currentDailyGoal && (currentDailyDate !== today || currentDailyCompleted < currentDailyGoal);

      const nextCompletedCount = currentCompleted.includes(lessonId) ? currentCompleted.length : currentCompleted.length + 1;
      const nextXP = currentXP + 100;
      const earnedNow = getAchievementIds({ completedCount: nextCompletedCount, xp: nextXP, streak: nextStreak });
      const mergedAchievements = Array.from(new Set([...currentAchievements, ...earnedNow]));
      const newUnlocks = mergedAchievements.length - currentAchievements.length;
      const newAchievementIds = mergedAchievements.filter((id: string) => !currentAchievements.includes(id));
      const newAchievementTitles = achievementCatalog.filter(a => newAchievementIds.includes(a.id)).map(a => a.title);

      await setDoc(userRef, {
        completed: arrayUnion(lessonId),
        xp: nextXP,
        email: user.email || "guest",
        lastStudyDate: today,
        streakCount: nextStreak,
        achievements: mergedAchievements,
        dailyProgressDate: today,
        dailyCompleted: nextDailyCompleted
      }, { merge: true });
      setSaveStatus(
        goalReachedNow
          ? "Success! +100 XP • Daily goal complete"
          : (newUnlocks > 0 ? `Success! +100 XP • ${newUnlocks} badge unlocked` : "Success! +100 XP")
      );
      if (newAchievementTitles.length > 0) {
        setAchievementToast(`Unlocked: ${newAchievementTitles.join(" • ")}`);
      }

      if (quickReviewMode) {
        const predictedCompleted = new Set([...currentCompleted, lessonId]);
        const nextLesson = getNextUnmasteredLesson(predictedCompleted);
        if (nextLesson) {
          setTimeout(() => openLesson(nextLesson.book, nextLesson.chapter), 350);
        } else {
          setQuickReviewMode(false);
          setSaveStatus("Quick review complete. Everything mastered.");
        }
      }
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
    try { await signInAnonymously(auth);
    } catch (err: any) { alert(err.message); setLoading(false); }
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
        let newList = type === 'book' ?
        books.filter(b => b.id !== id) : books.map(b => b.id === curBook.id ? { ...b, chapters: b.chapters.filter((c: any) => c.id !== id) } : b);
        if(type === 'book') setView("library");
        await setDoc(doc(db, "data", "pajji_database"), { books: newList });
        setSaveStatus("Deleted");
    } catch (e) { alert("Error deleting."); }
  };

  const formatYoutubeLink = (url: string) => {
    if (!url) return "";
    try {
        let vid = url.includes("v=") ? url.split("v=")[1].split("&")[0] : url.includes("youtu.be/") ?
        url.split("youtu.be/")[1].split("?")[0] : url.includes("shorts/") ? url.split("shorts/")[1].split("?")[0] : "";
        return vid ? `https://www.youtube.com/embed/${vid}` : url;
    } catch (e) { return url; }
  };

  const getDriveFileId = (url: string) => {
    if (!url) return "";
    if (url.includes("/file/d/")) return url.split("/file/d/")[1]?.split("/")[0] || "";
    if (url.includes("open?id=")) return url.split("open?id=")[1]?.split("&")[0] || "";
    if (url.includes("id=")) return url.split("id=")[1]?.split("&")[0] || "";
    return "";
  };

  const formatImageLink = (url: string) => {
    if (!url) return "";
    try {
      const driveId = getDriveFileId(url);
      if (driveId) return `https://drive.google.com/uc?export=view&id=${driveId}`;
      return url;
    } catch (e) {
      return url;
    }
  };

  const formatDrivePreviewLink = (url: string) => {
    const driveId = getDriveFileId(url);
    return driveId ? `https://drive.google.com/file/d/${driveId}/preview` : "";
  };

  const normalizeAnswerText = (value: string) =>
    value
      .toLowerCase()
      .trim()
      .replace(/[^\w\s]/g, "")
      .replace(/\s+/g, " ");

  const levenshteinDistance = (a: string, b: string) => {
    const m = a.length;
    const n = b.length;
    if (m === 0) return n;
    if (n === 0) return m;
    const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
    for (let i = 0; i <= m; i += 1) dp[i][0] = i;
    for (let j = 0; j <= n; j += 1) dp[0][j] = j;
    for (let i = 1; i <= m; i += 1) {
      for (let j = 1; j <= n; j += 1) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1,
          dp[i - 1][j - 1] + cost
        );
      }
    }
    return dp[m][n];
  };

  const isFuzzyTextMatch = (submittedRaw: string, expectedRaw: string) => {
    const submitted = normalizeAnswerText(submittedRaw);
    const expectedOptions = expectedRaw.split("|").map(part => normalizeAnswerText(part)).filter(Boolean);
    if (!submitted || expectedOptions.length === 0) return false;

    return expectedOptions.some(expected => {
      if (submitted === expected) return true;
      const distance = levenshteinDistance(submitted, expected);
      const maxLen = Math.max(submitted.length, expected.length);
      const similarity = maxLen === 0 ? 1 : 1 - distance / maxLen;
      const threshold = maxLen <= 4 ? 0.75 : 0.82;
      return similarity >= threshold;
    });
  };

  const addLesson = async () => {
    const title = prompt("Lesson Title?");
    if (!title || !curBook) return;
    const newLesson = { id: Date.now().toString(), title, summary: "", qna: "", spellings: "", video: "", slides: "", bookPdf: "", infographic: "", mindMap: "", quiz: [] };
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

  const getBookProgress = (book: any) => {
    const totalLessons = (book.chapters || []).length;
    const masteredLessons = (book.chapters || []).filter((ch: any) => completedLessons.includes(ch.id)).length;
    const progressPercent = totalLessons === 0 ? 0 : Math.round((masteredLessons / totalLessons) * 100);
    return { totalLessons, masteredLessons, progressPercent };
  };

  const openLesson = async (book: any, chapter: any) => {
    setCurBook(book);
    setCurChapter(chapter);
    setView("study");
    setActiveTab("Summary");
    setQuizAnswers({});
    setQuizResult("");
    setQuizImageErrors({});
    setQuizSubmitted(false);
    setQuizReview({});
    setQuizActiveIndices(null);
    setQuizQuestionOrder([]);
    setQuizOptionOrder({});
    if (!user) return;
    const latestLesson = { bookId: book.id, chapterId: chapter.id };
    setLastLesson(latestLesson);
    try {
      await setDoc(doc(db, "users", user.uid), { lastLesson: latestLesson }, { merge: true });
    } catch (e) {
      console.error(e);
    }
  };

  const normalizeQuiz = (chapter: any) => {
    const quizList = Array.isArray(chapter?.quiz) ? chapter.quiz : [];
    return quizList
      .map((q: any) => {
        const type = q?.type || (Array.isArray(q?.options) ? "mcq" : "oneWord");
        return {
          type,
          question: q?.question || "",
          options: Array.isArray(q?.options) ? q.options : ["", "", "", ""],
          correctIndex: typeof q?.correctIndex === "number" ? q.correctIndex : 0,
          answer: q?.answer || "",
          caseText: q?.caseText || "",
          imageUrl: q?.imageUrl || "",
          explanation: q?.explanation || ""
        };
      })
      .filter((q: any) => {
        if (!q.question) return false;
        if (q.type === "mcq") return Array.isArray(q.options) && q.options.filter((o: string) => o?.trim()).length >= 2;
        return true;
      });
  };

  const shuffleArray = (arr: number[]) => {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  const startQuizAttempt = (chapter: any, targetIndices?: number[]) => {
    const quiz = normalizeQuiz(chapter);
    const allIndices = quiz.map((_: any, idx: number) => idx);
    const chosen = targetIndices && targetIndices.length > 0 ? targetIndices : allIndices;
    const orderedQuestions = quizShuffleEnabled ? shuffleArray(chosen) : [...chosen];
    const nextOptionOrder: Record<number, number[]> = {};

    chosen.forEach((qIdx: number) => {
      const q = quiz[qIdx];
      if (q?.type !== "mcq") return;
      const validOptionIndices = (q.options || [])
        .map((opt: string, oIdx: number) => ({ opt, oIdx }))
        .filter((item: any) => item.opt?.trim())
        .map((item: any) => item.oIdx);
      nextOptionOrder[qIdx] = quizShuffleEnabled ? shuffleArray(validOptionIndices) : validOptionIndices;
    });

    setQuizAnswers({});
    setQuizResult("");
    setQuizSubmitted(false);
    setQuizReview({});
    setQuizImageErrors({});
    setQuizActiveIndices(chosen);
    setQuizQuestionOrder(orderedQuestions);
    setQuizOptionOrder(nextOptionOrder);
  };

  const submitQuiz = () => {
    const quiz = normalizeQuiz(curChapter);
    if (quiz.length === 0) return;
    const indices = quizActiveIndices && quizActiveIndices.length > 0 ? quizActiveIndices : quiz.map((_: any, idx: number) => idx);
    const answeredAll = indices.every((idx: number) => {
      const q = quiz[idx];
      if (q.type === "mcq") return typeof quizAnswers[idx] === "number";
      return `${quizAnswers[idx] ?? ""}`.trim().length > 0;
    });
    if (!answeredAll) {
      setQuizSubmitted(false);
      setQuizReview({});
      setQuizResult("Answer all questions first.");
      return;
    }
    let score = 0;
    const review: Record<number, { isCorrect: boolean; submitted: string; expected: string }> = {};
    indices.forEach((idx: number) => {
      const q = quiz[idx];
      if (q.type === "mcq") {
        const submittedIndex = typeof quizAnswers[idx] === "number" ? Number(quizAnswers[idx]) : -1;
        const isCorrect = submittedIndex === q.correctIndex;
        if (isCorrect) score += 1;
        review[idx] = {
          isCorrect,
          submitted: submittedIndex >= 0 ? `${String.fromCharCode(65 + submittedIndex)}. ${(q.options || [])[submittedIndex] || ""}` : "No answer",
          expected: `${String.fromCharCode(65 + q.correctIndex)}. ${(q.options || [])[q.correctIndex] || ""}`
        };
      } else {
        const submitted = `${quizAnswers[idx] ?? ""}`;
        const expected = `${q.answer ?? ""}`;
        const isCorrect = isFuzzyTextMatch(submitted, expected);
        if (isCorrect) score += 1;
        review[idx] = {
          isCorrect,
          submitted: submitted.trim() || "No answer",
          expected: expected.split("|").map((part: string) => part.trim()).filter(Boolean).join(" / ")
        };
      }
    });
    setQuizSubmitted(true);
    setQuizReview(review);
    setQuizResult(`Score: ${score}/${indices.length}`);
  };

  const addQuizQuestion = () => {
    if (!tempChapter) return;
    const existing = Array.isArray(tempChapter.quiz) ? tempChapter.quiz : [];
    const newQuestion = { type: "mcq", question: "", options: ["", "", "", ""], correctIndex: 0, answer: "", caseText: "", imageUrl: "", explanation: "" };
    setTempChapter({ ...tempChapter, quiz: [...existing, newQuestion] });
  };

  const updateQuizQuestion = (index: number, key: "type" | "question" | "correctIndex" | "answer" | "caseText" | "imageUrl" | "explanation", value: string | number) => {
    if (!tempChapter) return;
    const existing = Array.isArray(tempChapter.quiz) ? tempChapter.quiz : [];
    const nextQuiz = existing.map((q: any, i: number) => i === index ? { ...q, [key]: value } : q);
    setTempChapter({ ...tempChapter, quiz: nextQuiz });
  };

  const updateQuizOption = (qIndex: number, oIndex: number, value: string) => {
    if (!tempChapter) return;
    const existing = Array.isArray(tempChapter.quiz) ? tempChapter.quiz : [];
    const nextQuiz = existing.map((q: any, i: number) => {
      if (i !== qIndex) return q;
      const options = Array.isArray(q.options) ? [...q.options] : ["", "", "", ""];
      options[oIndex] = value;
      return { ...q, options };
    });
    setTempChapter({ ...tempChapter, quiz: nextQuiz });
  };

  const removeQuizQuestion = (index: number) => {
    if (!tempChapter) return;
    const existing = Array.isArray(tempChapter.quiz) ? tempChapter.quiz : [];
    setTempChapter({ ...tempChapter, quiz: existing.filter((_: any, i: number) => i !== index) });
  };

  const bulkAddQuizQuestions = () => {
    if (!tempChapter || !quizBuilderText.trim()) return;
    const raw = quizBuilderText.replace(/\r/g, "");
    const lines = raw.split("\n");
    const isQuestionStartLine = (line: string) =>
      /^(\d+\s*[\).\:-]|q\s*\d+\s*[:\).\-]|question\s*\d+\s*[:\).\-])/i.test(line.trim());
    const isOptionLine = (line: string) =>
      /^([A-Da-d])\s*[\)\].:\-]\s+/.test(line.trim());
    const isAnswerLine = (line: string) =>
      /^(answer|correct answer|ans)\s*[:\-]/i.test(line.trim());
    const cleanText = (line: string) =>
      line
        .replace(/^[-*]\s+/, "")
        .replace(/^\d+\s*[\).\:-]\s*/, "")
        .replace(/^q\s*\d+\s*[:\).\-]\s*/i, "")
        .replace(/^question\s*\d+\s*[:\).\-]\s*/i, "")
        .replace(/\*\*/g, "")
        .trim();

    const blocks: string[] = [];
    let currentBlock: string[] = [];

    lines.forEach((lineRaw) => {
      const line = lineRaw.trim();
      if (!line) return;
      if (line === "---") {
        if (currentBlock.length > 0) {
          blocks.push(currentBlock.join("\n"));
          currentBlock = [];
        }
        return;
      }
      if (isQuestionStartLine(line) && currentBlock.length > 0) {
        blocks.push(currentBlock.join("\n"));
        currentBlock = [line];
        return;
      }
      currentBlock.push(line);
    });
    if (currentBlock.length > 0) blocks.push(currentBlock.join("\n"));

    const parsedQuestions: any[] = [];

    blocks.forEach(block => {
      const blockLines = block.split("\n").map(l => l.trim()).filter(Boolean);
      if (blockLines.length < 2) return;
      const questionLine = blockLines.find((line) => !isOptionLine(line) && !isAnswerLine(line));
      const question = questionLine ? cleanText(questionLine) : "";
      if (!question) return;

      const optionLines = blockLines.filter(isOptionLine);
      const answerLine = blockLines.find(isAnswerLine);
      if (optionLines.length < 2 || !answerLine) return;

      const options = optionLines.slice(0, 4).map(l => cleanText(l.replace(/^([A-Da-d])\s*[\)\].:\-]\s*/, "")));
      const answerValue = answerLine.split(/[:\-]/).slice(1).join(":").trim();
      const firstToken = answerValue.charAt(0).toUpperCase();
      let correctIndex = ["A", "B", "C", "D"].indexOf(firstToken);
      if (correctIndex < 0) {
        const answerLower = cleanText(answerValue).toLowerCase();
        correctIndex = options.findIndex((opt: string) => opt.toLowerCase() === answerLower || opt.toLowerCase().includes(answerLower));
      }
      if (correctIndex < 0 || correctIndex > 3) return;

      parsedQuestions.push({ type: "mcq", question, options, correctIndex, answer: "", caseText: "", imageUrl: "", explanation: "" });
    });

    if (parsedQuestions.length === 0) {
      setSaveStatus("No valid quiz blocks found.");
      setTimeout(() => setSaveStatus(""), 2500);
      return;
    }

    const existing = Array.isArray(tempChapter.quiz) ? tempChapter.quiz : [];
    setTempChapter({ ...tempChapter, quiz: [...existing, ...parsedQuestions] });
    setQuizBuilderText("");
    setSaveStatus(`Added ${parsedQuestions.length} quiz questions`);
    setTimeout(() => setSaveStatus(""), 2500);
  };

  const parseNotebookLMMixedQuestions = (rawText: string) => {
    const text = rawText.replace(/\r/g, "");
    const lines = text.split("\n");
    const parsedQuestions: any[] = [];

    const isSectionHeader = (line: string) => /^[IVX]+\.\s+/i.test(line.trim());
    const isMCQHeader = (line: string) => /(multiple[- ]choice|mcq)/i.test(line);
    const isOneWordHeader = (line: string) => /(one[- ]word)/i.test(line);
    const isCaseHeader = (line: string) => /(case study)/i.test(line);
    const isAnswerLine = (line: string) => /^(answer|correct answer|ans)\s*[:\-]/i.test(line.trim());
    const isQuestionLine = (line: string) => /^question\s*[a-z0-9]+\s*[:\-]/i.test(line.trim());
    const isLikelyNewQuestionPrompt = (line: string) => /^(\d+\s*[\).\:-]|q\s*\d+\s*[:\).\-]|question\s*\d+\s*[:\).\-])/i.test(line.trim());
    const isMCQOptionLine = (line: string) => /^\(?([A-Da-d])\)?\s*[\)\].:\-]?\s+/.test(line.trim());
    const cleanText = (line: string) =>
      line
        .replace(/^[-*]\s+/, "")
        .replace(/^\d+\s*[\).\:-]\s*/, "")
        .replace(/^question\s*[a-z0-9]+\s*[:\-]\s*/i, "")
        .replace(/\*\*/g, "")
        .trim();

    const parseAnswerValue = (answerRaw: string) => answerRaw.split(/[:\-]/).slice(1).join(":").trim();

    let mode: "mcq" | "oneWord" | "caseStudy" | "unknown" = "unknown";
    let currentCaseText = "";
    let i = 0;

    while (i < lines.length) {
      const raw = lines[i] || "";
      const line = raw.trim();
      if (!line) {
        i += 1;
        continue;
      }

      if (isSectionHeader(line)) {
        if (isMCQHeader(line)) mode = "mcq";
        else if (isOneWordHeader(line)) mode = "oneWord";
        else if (isCaseHeader(line)) mode = "caseStudy";
        i += 1;
        continue;
      }

      if (/^case study\s*\d*\s*[:\-]/i.test(line)) {
        mode = "caseStudy";
        currentCaseText = cleanText(line.replace(/^case study\s*\d*\s*[:\-]/i, "")).replace(/^["']|["']$/g, "");
        i += 1;
        continue;
      }

      if (mode === "mcq") {
        if (isMCQOptionLine(line) || isAnswerLine(line)) {
          i += 1;
          continue;
        }

        const question = cleanText(line);
        const options: string[] = [];
        let answerRaw = "";
        i += 1;

        while (i < lines.length) {
          const next = (lines[i] || "").trim();
          if (!next) {
            i += 1;
            // NotebookLM often inserts blank lines between question and options.
            // Keep scanning if we have not started collecting options yet.
            if (options.length === 0) continue;
            // If options already started, allow one+ blanks and keep scanning until
            // we hit the next question/section/answer.
            continue;
          }
          if (isSectionHeader(next) || /^case study\s*\d*\s*[:\-]/i.test(next)) break;
          if (isLikelyNewQuestionPrompt(next) && options.length > 0) break;
          if (isAnswerLine(next)) {
            answerRaw = parseAnswerValue(next);
            i += 1;
            break;
          }
          if (isMCQOptionLine(next)) {
            options.push(next.replace(/^\(?([A-Da-d])\)?\s*[\)\].:\-]?\s+/, "").trim());
            i += 1;
            continue;
          }
          if (options.length > 0) break;
          i += 1;
        }

        if (question && options.length >= 2) {
          let correctIndex = 0;
          if (answerRaw) {
            const letter = answerRaw.charAt(0).toUpperCase();
            const byLetter = ["A", "B", "C", "D"].indexOf(letter);
            if (byLetter >= 0) correctIndex = byLetter;
            else {
              const byText = options.findIndex((opt) => opt.toLowerCase() === answerRaw.toLowerCase());
              if (byText >= 0) correctIndex = byText;
            }
          }
          const safeOptions = [...options, "", "", "", ""].slice(0, 4);
          parsedQuestions.push({
            type: "mcq",
            question,
            options: safeOptions,
            correctIndex,
            answer: "",
            caseText: "",
            imageUrl: "",
            explanation: "",
          });
        }
        continue;
      }

      if (mode === "oneWord") {
        if (isAnswerLine(line)) {
          i += 1;
          continue;
        }
        const question = cleanText(line);
        let answer = "";
        i += 1;
        while (i < lines.length) {
          const next = (lines[i] || "").trim();
          if (!next) {
            i += 1;
            if (answer) break;
            continue;
          }
          if (isSectionHeader(next) || /^case study\s*\d*\s*[:\-]/i.test(next)) break;
          if (isAnswerLine(next)) {
            answer = parseAnswerValue(next);
            i += 1;
            break;
          }
          if (!answer && /^answer\s+/i.test(next)) {
            answer = next.replace(/^answer\s+/i, "").trim();
            i += 1;
            break;
          }
          break;
        }
        if (question && answer) {
          parsedQuestions.push({
            type: "oneWord",
            question,
            options: ["", "", "", ""],
            correctIndex: 0,
            answer,
            caseText: "",
            imageUrl: "",
            explanation: "",
          });
        }
        continue;
      }

      if (mode === "caseStudy") {
        if (!isQuestionLine(line)) {
          currentCaseText = `${currentCaseText}${currentCaseText ? "\n" : ""}${cleanText(line).replace(/^["']|["']$/g, "")}`;
          i += 1;
          continue;
        }

        const question = cleanText(line);
        let answer = "";
        i += 1;

        while (i < lines.length) {
          const next = (lines[i] || "").trim();
          if (!next) {
            i += 1;
            if (answer) break;
            continue;
          }
          if (isQuestionLine(next) || /^case study\s*\d*\s*[:\-]/i.test(next) || isSectionHeader(next)) break;
          if (isAnswerLine(next)) {
            answer = parseAnswerValue(next);
            i += 1;
            while (i < lines.length) {
              const cont = (lines[i] || "").trim();
              if (!cont) {
                i += 1;
                break;
              }
              if (isQuestionLine(cont) || /^case study\s*\d*\s*[:\-]/i.test(cont) || isSectionHeader(cont)) break;
              if (isAnswerLine(cont)) break;
              answer = `${answer} ${cleanText(cont)}`.trim();
              i += 1;
            }
            break;
          }
          i += 1;
        }

        if (question && answer) {
          parsedQuestions.push({
            type: "caseStudy",
            question,
            options: ["", "", "", ""],
            correctIndex: 0,
            answer,
            caseText: currentCaseText,
            imageUrl: "",
            explanation: "",
          });
        }
        continue;
      }

      i += 1;
    }

    return parsedQuestions;
  };

  const aiParseQuizQuestions = async () => {
    if (!tempChapter || !quizBuilderText.trim() || aiParsingQuiz) return;
    setAiParsingQuiz(true);
    setSaveStatus("AI parsing questions...");
    try {
      const res = await fetch("/api/parse-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: quizBuilderText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "AI parse failed");

      const incoming = Array.isArray(data?.questions) ? data.questions : [];
      const parsedQuestions = incoming
        .map((q: any) => {
          const type = ["mcq", "oneWord", "caseStudy", "pictureStudy"].includes(q?.type) ? q.type : "mcq";
          const options = Array.isArray(q?.options) ? q.options.map((o: any) => `${o ?? ""}`.trim()).slice(0, 4) : ["", "", "", ""];
          const safeOptions = [...options, "", "", "", ""].slice(0, 4);
          const correctIndex = Number.isInteger(q?.correctIndex) ? Math.max(0, Math.min(3, Number(q.correctIndex))) : 0;
          const item = {
            type,
            question: `${q?.question ?? ""}`.trim(),
            options: safeOptions,
            correctIndex,
            answer: `${q?.answer ?? ""}`.trim(),
            caseText: `${q?.caseText ?? ""}`.trim(),
            imageUrl: `${q?.imageUrl ?? ""}`.trim(),
            explanation: `${q?.explanation ?? ""}`.trim(),
          };
          return item;
        })
        .filter((q: any) => {
          if (!q.question) return false;
          if (q.type === "mcq") return q.options.filter((o: string) => o).length >= 2;
          return !!q.answer;
        });

      if (parsedQuestions.length === 0) {
        throw new Error("AI returned no valid questions");
      }

      const existing = Array.isArray(tempChapter.quiz) ? tempChapter.quiz : [];
      setTempChapter({ ...tempChapter, quiz: [...existing, ...parsedQuestions] });
      setSaveStatus(`AI added ${parsedQuestions.length} questions`);
      setTimeout(() => setSaveStatus(""), 3000);
    } catch (e: any) {
      const fallbackQuestions = parseNotebookLMMixedQuestions(quizBuilderText);
      if (fallbackQuestions.length > 0) {
        const existing = Array.isArray(tempChapter.quiz) ? tempChapter.quiz : [];
        setTempChapter({ ...tempChapter, quiz: [...existing, ...fallbackQuestions] });
        setSaveStatus(`AI unavailable. Added ${fallbackQuestions.length} via local parser.`);
        setTimeout(() => setSaveStatus(""), 3500);
      } else {
        setSaveStatus(e?.message || "AI parse failed");
        setTimeout(() => setSaveStatus(""), 3000);
      }
    } finally {
      setAiParsingQuiz(false);
    }
  };

  const resumeLesson = (() => {
    if (!lastLesson) return null;
    const book = books.find((b: any) => b.id === lastLesson.bookId);
    const chapter = book?.chapters?.find((ch: any) => ch.id === lastLesson.chapterId);
    if (!book || !chapter) return null;
    return { book, chapter };
  })();

  const normalizedLibraryQuery = libraryQuery.trim().toLowerCase();
  const filteredBooks = books.filter((book: any) => {
    const chapters = book.chapters || [];
    const titleMatch = (book.title || "").toLowerCase().includes(normalizedLibraryQuery);
    const chapterMatch = chapters.some((ch: any) => (ch.title || "").toLowerCase().includes(normalizedLibraryQuery));
    const queryMatch = !normalizedLibraryQuery || titleMatch || chapterMatch;

    const { totalLessons, masteredLessons } = getBookProgress(book);
    if (libraryFilter === "notStarted") return queryMatch && masteredLessons === 0;
    if (libraryFilter === "mastered") return queryMatch && totalLessons > 0 && masteredLessons === totalLessons;
    if (libraryFilter === "inProgress") return queryMatch && masteredLessons > 0 && masteredLessons < totalLessons;
    return queryMatch;
  });

  const startQuickReview = () => {
    const nextLesson = getNextUnmasteredLesson(new Set(completedLessons));
    if (!nextLesson) {
      setSaveStatus("Everything is already mastered.");
      setTimeout(() => setSaveStatus(""), 2500);
      return;
    }
    setQuickReviewMode(true);
    openLesson(nextLesson.book, nextLesson.chapter);
  };

  useEffect(() => {
    if (!achievementToast) return;
    const timer = setTimeout(() => setAchievementToast(""), 3500);
    return () => clearTimeout(timer);
  }, [achievementToast]);

  const liveAchievementIds = getAchievementIds({
    completedCount: completedLessons.length,
    xp: userXP,
    streak: streakCount
  });
  const allUnlockedAchievementIds = Array.from(new Set([...unlockedAchievements, ...liveAchievementIds]));
  const unlockedAchievementList = achievementCatalog.filter(a => allUnlockedAchievementIds.includes(a.id));
  const nextAchievement = achievementCatalog.find(a => !allUnlockedAchievementIds.includes(a.id));
  const todayKey = getLocalDateKey();
  const todayCompletedCount = dailyProgressDate === todayKey ? dailyCompleted : 0;
  const goalProgressPct = Math.min(100, Math.round((todayCompletedCount / Math.max(1, dailyGoal)) * 100));

  const getUserName = (u: any) => u?.isAnonymous ? "Guest User" : u?.email?.split('@')[0] || "User";
  const userLevel = Math.floor(userXP / 500) + 1;

  const IconHome = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
  const IconBook = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>;
  const IconTrophy = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>;

  if (loading) return <div style={{height: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: theme === 'dark' ? "#0f172a" : "#f8fafc", color: "#10b981", fontWeight: "900"}}>PAJJI LEARN...</div>;

  if (!user) {
    return (
      <div style={{height: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: theme === 'dark' ? "#020617" : "#f1f5f9", fontFamily: "sans-serif"}}>
        <div style={{background: theme === 'dark' ? "#1e293b" : "#ffffff", padding: "40px", borderRadius: "24px", width: "90%", maxWidth: "420px", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 10px 30px rgba(0, 0, 0, 0.12)"}}>
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
          --side: #0f172a; 
          --card: #1e293b; 
          --text: #f8fafc; 
          --muted: #94a3b8; 
          --border: rgba(255, 255, 255, 0.08); 
          --input-bg: rgba(0, 0, 0, 0.2); 
        }
        .light { 
          --bg: #f8fafc; 
          --side: #ffffff; 
          --card: #ffffff; 
          --text: #0f172a; 
          --muted: #64748b; 
          --border: rgba(0, 0, 0, 0.05); 
          --input-bg: #f1f5f9; 
        }
        
        .app-container { display: flex; height: 100dvh; background: var(--bg); color: var(--text); font-family: system-ui, sans-serif; transition: 0.3s; }
        .sidebar { width: 280px; background: var(--side); border-right: 1px solid var(--border); padding: 32px 24px; display: flex; flex-direction: column; transition: 0.3s; z-index: 100; }
        .main-content { flex: 1; padding: 48px; overflow-y: auto; }
        .card {
          background: var(--card);
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
        
        textarea, input[type="text"], select { width: 100%; background: var(--input-bg); color: var(--text); border: 1px solid var(--border); border-radius: 16px; padding: 18px; font-family: inherit; font-size: 16px; outline: none; }
        textarea:focus, input[type="text"]:focus, select:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.14); }
        
        .xp-badge { background: rgba(16, 185, 129, 0.15); color: var(--accent); padding: 4px 12px; border-radius: 99px; font-size: 12px; font-weight: 700; border: 1px solid rgba(16, 185, 129, 0.2); }
        .mobile-header { display: none; }
        
        @media (max-width: 768px) {
          .app-container { flex-direction: column; }
          .sidebar {
            position: fixed;
            bottom: 24px;
            left: 50%;
            transform: translateX(-50%);
            width: 90%;
            max-width: 450px;
            height: 70px;
            padding: 0 10px;
            flex-direction: row;
            justify-content: space-around; /* PLACES ICONS SIDE BY SIDE EVENLY */
            align-items: center;
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 50px;
            background: var(--side);
            z-index: 1000;
          }
          
          .sidebar-extras, .sidebar h1 { display: none; }
          
          .nav-btn { 
            width: auto;
            margin-bottom: 0;
            flex-direction: column; 
            gap: 2px; 
            font-size: 10px; 
            justify-content: center; 
            align-items: center;
            text-align: center; 
            padding: 0; 
            flex: 1; /* ENSURES THEY SHARE WIDTH EQUALLY */
            background: transparent !important;
            box-shadow: none !important;
            color: rgba(255, 255, 255, 0.5);
          }
          .nav-btn svg { width: 22px; height: 22px; margin-bottom: 2px; }
          .nav-btn.active { color: var(--accent); }
          .nav-btn.active svg { opacity: 1; stroke-width: 2.5px; }
          
          .main-content { padding: 20px; padding-bottom: 120px; }
          .mobile-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding: 12px 16px; background: var(--card); border-radius: 20px; border: 1px solid var(--border); }
          .dashboard-grid { grid-template-columns: 1fr !important; gap: 12px !important; }
          .library-grid { grid-template-columns: 1fr 1fr !important; gap: 12px !important; }
          .library-tools { grid-template-columns: 1fr !important; }
          .tab-container { overflow-x: auto; padding-bottom: 10px; gap: 8px; }
        }
      `}</style>

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

        <nav style={{flex: 1, display: "flex", flexDirection: "inherit", gap: "4px"}}>
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

        {view === "dashboard" && (
          <div style={{maxWidth: "900px"}}>
            <header style={{marginBottom: "32px"}}>
                <h1 style={{fontSize: "32px", fontWeight: "900"}}>Hello, {getUserName(user)}!</h1>
                <p style={{color: "var(--muted)", marginTop: "4px"}}>You're doing great. Keep learning!</p>
            </header>
            <div className="dashboard-grid" style={{display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "24px", marginBottom: "40px"}}>
              <div className="card" style={{borderLeft: "4px solid #10b981"}}>
                  <p style={{fontSize: "11px", fontWeight: "bold", opacity: 0.6, textTransform: "uppercase", letterSpacing: "1px"}}>Learning Points</p>
                  <h3 style={{fontSize: "32px", color: "#10b981", marginTop: "8px"}}>{dataLoading ? "..." : userXP} <span style={{fontSize: "16px", opacity: 0.5}}>XP</span></h3>
              </div>
              <div className="card" style={{borderLeft: "4px solid #3b82f6"}}>
                  <p style={{fontSize: "11px", fontWeight: "bold", opacity: 0.6, textTransform: "uppercase", letterSpacing: "1px"}}>Mastered</p>
                  <h3 style={{fontSize: "32px", color: "#3b82f6", marginTop: "8px"}}>{completedLessons.length} <span style={{fontSize: "16px", opacity: 0.5}}>Lessons</span></h3>
              </div>
              <div className="card" style={{borderLeft: "4px solid #f59e0b"}}>
                  <p style={{fontSize: "11px", fontWeight: "bold", opacity: 0.6, textTransform: "uppercase", letterSpacing: "1px"}}>Streak</p>
                  <h3 style={{fontSize: "32px", color: "#f59e0b", marginTop: "8px"}}>{streakCount} <span style={{fontSize: "16px", opacity: 0.5}}>Days</span></h3>
                  <p style={{fontSize: "11px", color: "var(--muted)", marginTop: "4px"}}>{lastStudyDate ? `Last study: ${lastStudyDate}` : "Start your streak today"}</p>
              </div>
            </div>
            <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", gap: "10px", flexWrap: "wrap"}}>
              <h2 style={{fontSize: "20px", fontWeight: "800"}}>Continue Learning</h2>
              <button onClick={startQuickReview} style={{padding: "10px 16px", borderRadius: "12px", border: "1px solid rgba(16,185,129,0.35)", background: "rgba(16,185,129,0.16)", color: "var(--text)", fontWeight: "800", cursor: "pointer"}}>
                {quickReviewMode ? "Quick Review Active" : "Start Quick Review"}
              </button>
            </div>
            <div className="card" style={{marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "14px", flexWrap: "wrap"}}>
              <div style={{display: "flex", gap: "12px", alignItems: "center"}}>
                <div style={{width: "68px", height: "68px", borderRadius: "999px", display: "grid", placeItems: "center", background: `conic-gradient(#10b981 ${goalProgressPct * 3.6}deg, rgba(148, 163, 184, 0.25) 0deg)`, padding: "6px"}}>
                  <div style={{width: "100%", height: "100%", borderRadius: "999px", display: "grid", placeItems: "center", background: "var(--bg)", fontSize: "12px", fontWeight: "900"}}>{goalProgressPct}%</div>
                </div>
                <div>
                  <p style={{fontSize: "11px", color: "var(--muted)", textTransform: "uppercase", fontWeight: "900", letterSpacing: "0.8px"}}>Today Goal</p>
                  <p style={{fontSize: "17px", fontWeight: "800", marginTop: "3px"}}>{todayCompletedCount}/{dailyGoal} lessons</p>
                </div>
              </div>
              <div style={{display: "flex", alignItems: "center", gap: "8px"}}>
                <button onClick={() => updateDailyGoal(dailyGoal - 1)} style={{width: "32px", height: "32px", borderRadius: "10px", border: "1px solid var(--border)", background: "var(--input-bg)", color: "var(--text)", fontWeight: "900", cursor: "pointer"}}>-</button>
                <span style={{fontWeight: "800", minWidth: "28px", textAlign: "center"}}>{dailyGoal}</span>
                <button onClick={() => updateDailyGoal(dailyGoal + 1)} style={{width: "32px", height: "32px", borderRadius: "10px", border: "1px solid var(--border)", background: "var(--input-bg)", color: "var(--text)", fontWeight: "900", cursor: "pointer"}}>+</button>
              </div>
            </div>
            {resumeLesson && (
              <div className="card" style={{marginBottom: "16px", borderLeft: "4px solid #fbbf24"}}>
                <p style={{fontSize: "11px", fontWeight: "900", color: "#f59e0b", textTransform: "uppercase", marginBottom: "6px"}}>Resume Last Lesson</p>
                <h3 style={{fontSize: "18px", fontWeight: "800", marginBottom: "4px"}}>{resumeLesson.chapter.title}</h3>
                <p style={{fontSize: "13px", color: "var(--muted)", marginBottom: "14px"}}>{resumeLesson.book.title}</p>
                <button onClick={() => openLesson(resumeLesson.book, resumeLesson.chapter)} style={{padding: "10px 18px", background: "#fbbf24", color: "#111827", borderRadius: "12px", border: "none", fontWeight: "800", cursor: "pointer"}}>Resume</button>
              </div>
            )}
            <div style={{display: "flex", flexDirection: "column", gap: "12px"}}>
              {getUnmastered().slice(0, 5).map(ch => (
                <div key={ch.id} className="card" style={{display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px"}}>
                  <div>
                      <p style={{fontSize: "10px", color: "#10b981", fontWeight: "900", textTransform: "uppercase"}}>{ch.bookTitle}</p>
                      <h3 style={{fontSize: "16px", marginTop: "4px", fontWeight: "700"}}>{ch.title}</h3>
                  </div>
                  <button onClick={() => openLesson(ch.parentBook, ch)} style={{padding: "10px 20px", background: "#10b981", color: "white", borderRadius: "12px", border: "none", fontWeight: "bold", cursor: "pointer", fontSize: "13px", boxShadow: "0 4px 10px rgba(16, 185, 129, 0.2)"}}>Start</button>
                </div>
              ))}
              {getUnmastered().length === 0 && <div className="card" style={{textAlign: "center", padding: "40px", opacity: 0.6}}>You've mastered everything! </div>}
            </div>
            <h2 style={{fontSize: "20px", marginTop: "28px", marginBottom: "14px", fontWeight: "800"}}>Achievements</h2>
            <div className="card" style={{padding: "20px"}}>
              <p style={{fontSize: "12px", fontWeight: "700", color: "var(--muted)", marginBottom: "14px"}}>{allUnlockedAchievementIds.length}/{achievementCatalog.length} unlocked</p>
              <div style={{display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "10px"}}>
                {unlockedAchievementList.map(a => (
                  <div key={a.id} style={{padding: "12px", borderRadius: "14px", background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.3)"}}>
                    <p style={{fontWeight: "800", fontSize: "13px"}}>{a.title}</p>
                    <p style={{fontSize: "11px", color: "var(--muted)", marginTop: "4px"}}>{a.description}</p>
                  </div>
                ))}
              </div>
              {unlockedAchievementList.length === 0 && (
                <p style={{fontSize: "13px", color: "var(--muted)"}}>No badges unlocked yet. Complete a lesson to get your first one.</p>
              )}
              {nextAchievement && (
                <div style={{marginTop: "16px", padding: "12px", border: "1px dashed var(--border)", borderRadius: "12px"}}>
                  <p style={{fontSize: "11px", fontWeight: "800", color: "var(--muted)", textTransform: "uppercase"}}>Next Target</p>
                  <p style={{fontWeight: "800", marginTop: "4px"}}>{nextAchievement.title}</p>
                  <p style={{fontSize: "12px", color: "var(--muted)", marginTop: "2px"}}>{nextAchievement.description}</p>
                </div>
              )}
            </div>
          </div>
        )}

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

        {view === "library" && (
          <div>
            <div style={{display: "flex", justifyContent: "space-between", marginBottom: "32px", alignItems: "center"}}>
              <h1 style={{fontSize: "28px", fontWeight: "900"}}>Library</h1>
              {isOwner && <button onClick={() => {const t = prompt("Book Name?"); if(t) { const nl = [...books, {id: Date.now().toString(), title: t, chapters: []}]; setDoc(doc(db, "data", "pajji_database"), { books: nl }); }}} style={{background: "#10b981", color: "white", padding: "10px 20px", borderRadius: "12px", border: "none", fontWeight: "700", cursor: "pointer"}}>+ New Book</button>}
            </div>
            <div className="card library-tools" style={{display: "grid", gridTemplateColumns: "2fr 1fr", gap: "12px", padding: "14px", marginBottom: "20px"}}>
              <input type="text" placeholder="Search books or lessons..." value={libraryQuery} onChange={(e) => setLibraryQuery(e.target.value)} style={{padding: "12px"}} />
              <select value={libraryFilter} onChange={(e) => setLibraryFilter(e.target.value as "all" | "notStarted" | "inProgress" | "mastered")} style={{background: "var(--input-bg)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: "14px", padding: "12px"}}>
                <option value="all">All Books</option>
                <option value="notStarted">Not Started</option>
                <option value="inProgress">In Progress</option>
                <option value="mastered">Mastered</option>
              </select>
            </div>
            <div className="library-grid" style={{display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "24px"}}>
              {filteredBooks.map(b => {
                const progress = getBookProgress(b);
                return (
                <div key={b.id} className="card" style={{textAlign: "center", transition: "0.2s", cursor: "pointer"}} onClick={() => {setCurBook(b); setView("chapters");}}>
                  <div style={{height: "120px", background: "var(--input-bg)", borderRadius: "18px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "40px", marginBottom: "16px"}}>📖</div>
                  <h3 style={{fontWeight: "800", fontSize: "18px", marginBottom: "4px"}}>{b.title}</h3>
                  <p style={{fontSize: "12px", opacity: 0.5, fontWeight: "600"}}>{b.chapters?.length || 0} Lessons</p>
                  <p style={{fontSize: "11px", fontWeight: "800", color: "var(--muted)", marginTop: "10px", marginBottom: "6px"}}>{progress.masteredLessons}/{progress.totalLessons} mastered</p>
                  <div style={{height: "7px", background: "var(--input-bg)", borderRadius: "12px", overflow: "hidden", border: "1px solid var(--border)"}}>
                    <div style={{height: "100%", width: `${progress.progressPercent}%`, background: "linear-gradient(90deg, #10b981, #34d399)"}} />
                  </div>
                  {isOwner && <button className="del-btn" style={{marginTop: "16px", width: "100%", background: "rgba(239, 68, 68, 0.1)", border: "none", color: "#ef4444", padding: "8px", borderRadius: "10px", fontWeight: "bold", fontSize: "11px"}} onClick={(e) => {e.stopPropagation(); deleteItem('book', b.id)}}>Delete</button>}
                </div>
              )})}
            </div>
            {filteredBooks.length === 0 && (
              <div className="card" style={{textAlign: "center", marginTop: "20px", padding: "28px", color: "var(--muted)"}}>
                No books match this search/filter.
              </div>
            )}
          </div>
        )}

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
                  <button onClick={() => openLesson(curBook, ch)} style={{padding: "8px 20px", background: "#10b981", color: "white", borderRadius: "10px", border: "none", fontWeight: "700", cursor: "pointer"}}>Study</button>
                  {isOwner && (<button onClick={() => {setCurChapter(ch); setTempChapter(ch); setView("edit");}} style={{padding: "8px 12px", border: "1px solid var(--border)", borderRadius: "10px", background: "var(--input-bg)", cursor: "pointer"}}>✎</button>)}
                </div>
              </div>
            ))}
          </div>
        )}

        {view === "study" && curChapter && (
          <div style={{maxWidth: "1000px"}}>
            <div style={{display: "flex", justifyContent: "space-between", marginBottom: "24px", alignItems: "center"}}>
              <button onClick={() => setView("chapters")} style={{background: "none", border: "none", color: "#10b981", fontWeight: "800", cursor: "pointer"}}>← Lessons</button>
              <div style={{display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", justifyContent: "flex-end"}}>
                {quickReviewMode && (
                  <button onClick={() => setQuickReviewMode(false)} style={{padding: "8px 12px", borderRadius: "10px", border: "1px solid rgba(16,185,129,0.35)", background: "rgba(16,185,129,0.12)", color: "var(--text)", fontWeight: "800", cursor: "pointer"}}>End Quick Review</button>
                )}
                {!completedLessons.includes(curChapter.id) ? (
                  <button onClick={() => markCompleted(curChapter.id)} style={{background: "#fbbf24", color: "#000", padding: "12px 24px", borderRadius: "14px", border: "none", fontWeight: "900", cursor: "pointer", fontSize: "14px", boxShadow: "0 10px 20px -5px rgba(251, 191, 36, 0.4)"}}>CLAIM 100 XP</button>
                ) : (
                  <div style={{display: "flex", alignItems: "center", gap: "8px"}}>
                      <div className="xp-badge">MASTERED</div>
                      <button onClick={() => unmasterLesson(curChapter.id)} style={{background: "none", border: "none", opacity: 0.5, cursor: "pointer"}}>↺</button>
                  </div>
                )}
              </div>
            </div>
            <h1 style={{fontSize: "24px", fontWeight: "900", marginBottom: "24px"}}>{curChapter.title}</h1>
            <div className="tab-container" style={{display: "flex", gap: "6px", flexWrap: "nowrap", marginBottom: "20px"}}>
                {["Summary", "QnA", "Spellings", "Quiz", "Video", "Book PDF", "Slides", "Infographic", "Mind Map"].map(t => (
                    <button key={t} onClick={() => setActiveTab(t)} className={`tab-btn ${activeTab === t ? "active" : ""}`}>{t}</button>
                ))}
            </div>
            <div className="card" style={{minHeight: "500px", padding: "32px"}}>
               {["Summary", "QnA", "Spellings"].includes(activeTab) && <div style={{whiteSpace: "pre-wrap", fontSize: "17px", lineHeight: "1.8", color: "var(--text)"}}>{curChapter[activeTab.toLowerCase()] || "No content uploaded yet."}</div>}
               {activeTab === "Quiz" && (() => {
                 const quiz = normalizeQuiz(curChapter);
                 if (quiz.length === 0) {
                   return <div style={{textAlign: "center", opacity: 0.7, padding: "80px 20px"}}>No quiz questions added yet.</div>;
                 }
                 const questionIndicesSource = quizActiveIndices && quizActiveIndices.length > 0
                   ? quizActiveIndices
                   : quiz.map((_: any, idx: number) => idx);
                 const sourceSet = new Set(questionIndicesSource);
                 const orderedFromState = quizQuestionOrder.filter((idx: number) => sourceSet.has(idx));
                 const missingIndices = questionIndicesSource.filter((idx: number) => !orderedFromState.includes(idx));
                 const orderedQuestionIndices = [...orderedFromState, ...missingIndices];
                 const wrongIndices = orderedQuestionIndices.filter((idx: number) => quizReview[idx] && !quizReview[idx].isCorrect);
                 return (
                  <div style={{display: "flex", flexDirection: "column", gap: "16px"}}>
                    <div style={{display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap"}}>
                      <button onClick={() => startQuizAttempt(curChapter)} style={{padding: "8px 12px", borderRadius: "10px", border: "1px solid var(--border)", background: "var(--input-bg)", color: "var(--text)", fontWeight: "700", cursor: "pointer"}}>
                        Start / Restart
                      </button>
                      <button onClick={() => startQuizAttempt(curChapter, wrongIndices)} disabled={!quizSubmitted || wrongIndices.length === 0} style={{padding: "8px 12px", borderRadius: "10px", border: "1px solid var(--border)", background: (!quizSubmitted || wrongIndices.length === 0) ? "rgba(148,163,184,0.2)" : "rgba(239,68,68,0.14)", color: "var(--text)", fontWeight: "700", cursor: (!quizSubmitted || wrongIndices.length === 0) ? "not-allowed" : "pointer", opacity: (!quizSubmitted || wrongIndices.length === 0) ? 0.55 : 1}}>
                        Retry Wrong Only
                      </button>
                      <button onClick={() => { setQuizShuffleEnabled(prev => !prev); startQuizAttempt(curChapter, questionIndicesSource); }} style={{padding: "8px 12px", borderRadius: "10px", border: "1px solid var(--border)", background: quizShuffleEnabled ? "rgba(16,185,129,0.12)" : "var(--input-bg)", color: "var(--text)", fontWeight: "700", cursor: "pointer"}}>
                        Shuffle: {quizShuffleEnabled ? "On" : "Off"}
                      </button>
                    </div>
                    {orderedQuestionIndices.map((qIndex: number, visualIndex: number) => {
                      const q = quiz[qIndex];
                      return (
                      <div key={`${q.question}-${qIndex}`} style={{padding: "16px", borderRadius: "16px", border: "1px solid var(--border)", background: "var(--input-bg)"}}>
                        {(() => {
                          const review = quizReview[qIndex];
                          return (
                            <>
                        <div style={{display: "flex", justifyContent: "space-between", gap: "8px", alignItems: "center", marginBottom: "10px"}}>
                          <p style={{fontWeight: "800"}}>{visualIndex + 1}. {q.question}</p>
                          <span style={{fontSize: "10px", fontWeight: "800", padding: "3px 8px", borderRadius: "10px", background: "rgba(16,185,129,0.18)", border: "1px solid rgba(16,185,129,0.35)"}}>
                            {q.type === "oneWord" ? "ONE WORD" : q.type === "caseStudy" ? "CASE" : q.type === "pictureStudy" ? "PICTURE" : "MCQ"}
                          </span>
                        </div>

                        {q.type === "caseStudy" && q.caseText && (
                          <div style={{padding: "10px 12px", borderRadius: "12px", border: "1px dashed var(--border)", background: "rgba(15,23,42,0.08)", marginBottom: "10px", whiteSpace: "pre-wrap", fontSize: "14px"}}>
                            {q.caseText}
                          </div>
                        )}

                        {q.type === "pictureStudy" && (
                          <div style={{marginBottom: "10px"}}>
                            {!q.imageUrl && (
                              <div style={{padding: "10px 12px", borderRadius: "12px", border: "1px dashed var(--border)", color: "var(--muted)", fontSize: "13px"}}>
                                No image linked for this question yet.
                              </div>
                            )}
                            {!!q.imageUrl && (
                              <>
                                {formatDrivePreviewLink(q.imageUrl) ? (
                                  <iframe
                                    src={formatDrivePreviewLink(q.imageUrl)}
                                    title={`question-img-${qIndex + 1}`}
                                    style={{width: "100%", height: "260px", borderRadius: "14px", border: "1px solid var(--border)", background: "#fff"}}
                                  />
                                ) : (
                                  <img
                                    src={formatImageLink(q.imageUrl)}
                                    alt={`question-${qIndex + 1}`}
                                    onError={() => setQuizImageErrors(prev => ({ ...prev, [qIndex]: true }))}
                                    style={{maxWidth: "100%", maxHeight: "260px", width: "100%", borderRadius: "14px", border: "1px solid var(--border)", objectFit: "contain", background: "#fff"}}
                                  />
                                )}
                                {quizImageErrors[qIndex] && (
                                  <div style={{marginTop: "6px", fontSize: "12px", color: "#f59e0b", fontWeight: "700"}}>
                                    Image preview failed. Use the link below.
                                  </div>
                                )}
                                <a href={formatImageLink(q.imageUrl)} target="_blank" rel="noreferrer" style={{display: "inline-block", marginTop: "6px", fontSize: "12px", color: "#10b981", fontWeight: "700"}}>
                                  Open image in new tab
                                </a>
                              </>
                            )}
                          </div>
                        )}

                        {q.type === "mcq" ? (
                          <div style={{display: "grid", gap: "8px"}}>
                            {((quizOptionOrder[qIndex] && quizOptionOrder[qIndex].length > 0)
                              ? quizOptionOrder[qIndex]
                              : (q.options || []).map((_: string, opIndex: number) => opIndex).filter((opIndex: number) => `${(q.options || [])[opIndex] || ""}`.trim())
                            ).map((originalIndex: number) => {
                              const op = (q.options || [])[originalIndex] || "";
                              const selected = quizAnswers[qIndex] === originalIndex;
                              const isCorrectOption = originalIndex === q.correctIndex;
                              const showCorrectOption = quizSubmitted && isCorrectOption;
                              const showWrongSelected = quizSubmitted && selected && !isCorrectOption;
                              return (
                                <button
                                  key={`${qIndex}-${originalIndex}`}
                                  onClick={() => {
                                    setQuizAnswers(prev => ({ ...prev, [qIndex]: originalIndex }));
                                    setQuizSubmitted(false);
                                    setQuizReview({});
                                    setQuizResult("");
                                  }}
                                  style={{
                                    textAlign: "left",
                                    padding: "10px 12px",
                                    borderRadius: "12px",
                                    border: showWrongSelected ? "1px solid #ef4444" : showCorrectOption ? "1px solid #10b981" : selected ? "1px solid #10b981" : "1px solid var(--border)",
                                    background: showWrongSelected ? "rgba(239,68,68,0.14)" : showCorrectOption ? "rgba(16,185,129,0.16)" : selected ? "rgba(16,185,129,0.16)" : "rgba(15,23,42,0.08)",
                                    color: "var(--text)",
                                    cursor: "pointer",
                                    fontWeight: selected ? "700" : "500"
                                  }}
                                >
                                  {String.fromCharCode(65 + originalIndex)}. {op}
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <input
                            type="text"
                            placeholder="Type your answer..."
                            value={`${quizAnswers[qIndex] ?? ""}`}
                            onChange={(e) => {
                              setQuizAnswers(prev => ({ ...prev, [qIndex]: e.target.value }));
                              setQuizSubmitted(false);
                              setQuizReview({});
                              setQuizResult("");
                            }}
                            style={{padding: "12px"}}
                          />
                        )}
                        {quizSubmitted && review && (
                          <div style={{marginTop: "10px", padding: "10px 12px", borderRadius: "10px", border: review.isCorrect ? "1px solid rgba(16,185,129,0.35)" : "1px solid rgba(239,68,68,0.35)", background: review.isCorrect ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)", fontSize: "13px"}}>
                            {review.isCorrect ? (
                              <span style={{fontWeight: "800", color: "#10b981"}}>Correct answer.</span>
                            ) : (
                              <span style={{fontWeight: "700", color: "#ef4444"}}>
                                Wrong answer. Your answer: {review.submitted}. Correct answer: {review.expected || "Not set"}.
                              </span>
                            )}
                          </div>
                        )}
                        {quizSubmitted && q.explanation && (
                          <div style={{marginTop: "8px", padding: "10px 12px", borderRadius: "10px", border: "1px solid var(--border)", background: "rgba(59,130,246,0.08)", fontSize: "13px"}}>
                            <span style={{fontWeight: "800", color: "#3b82f6"}}>Explanation:</span> {q.explanation}
                          </div>
                        )}
                            </>
                          );
                        })()}
                      </div>
                    )})}
                    <div style={{display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap"}}>
                      <button onClick={submitQuiz} style={{padding: "10px 18px", borderRadius: "12px", border: "none", background: "#10b981", color: "white", fontWeight: "800", cursor: "pointer"}}>Submit Quiz</button>
                      {quizResult && <span style={{fontWeight: "800", color: quizResult.startsWith("Score") ? "#10b981" : "#f59e0b"}}>{quizResult}</span>}
                    </div>
                  </div>
                 );
               })()}
               {activeTab === "Video" && (curChapter.video ? <iframe width="100%" height="450px" src={formatYoutubeLink(curChapter.video)} frameBorder="0" allowFullScreen style={{borderRadius: "20px", boxShadow: "0 20px 40px rgba(0,0,0,0.2)"}} /> : "No video available.")}
               {["Book PDF", "Slides", "Infographic", "Mind Map"].includes(activeTab) && (() => { 
                 let k = activeTab === "Book PDF" ? "bookPdf" : activeTab.charAt(0).toLowerCase() + activeTab.slice(1).replace(" ", ""); 
                 let link = curChapter[k]; 
                 return link ? <iframe src={link.includes("drive.google.com") ? link.replace("/view", "/preview") : link} width="100%" height="600px" style={{border: "none", borderRadius: "20px"}} /> : <div style={{textAlign: "center", padding: "100px", opacity: 0.5}}>This resource hasn't been linked yet.</div>; 
               })()}
            </div>
          </div>
        )}

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
                <div style={{padding: "16px", border: "1px solid var(--border)", borderRadius: "16px", background: "var(--input-bg)"}}>
                    <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", gap: "8px", flexWrap: "wrap"}}>
                      <label style={{color: "#10b981", fontWeight: "800", fontSize: "13px", textTransform: "uppercase"}}>Interactive Quiz</label>
                      <button onClick={addQuizQuestion} style={{padding: "8px 12px", borderRadius: "10px", border: "none", background: "#10b981", color: "white", fontWeight: "700", cursor: "pointer"}}>+ Add Question</button>
                    </div>
                    <div style={{display: "flex", flexDirection: "column", gap: "12px"}}>
                      {(Array.isArray(tempChapter.quiz) ? tempChapter.quiz : []).map((q: any, qIndex: number) => (
                        <div key={`edit-quiz-${qIndex}`} style={{border: "1px solid var(--border)", borderRadius: "14px", padding: "12px", background: "rgba(15,23,42,0.08)"}}>
                          <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", marginBottom: "8px"}}>
                            <p style={{fontWeight: "800", fontSize: "12px"}}>Question {qIndex + 1}</p>
                            <button onClick={() => removeQuizQuestion(qIndex)} style={{background: "rgba(239,68,68,0.14)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", padding: "4px 8px", cursor: "pointer", fontWeight: "700"}}>Remove</button>
                          </div>
                          <div style={{marginBottom: "8px"}}>
                            <p style={{fontSize: "11px", fontWeight: "700", marginBottom: "4px", color: "var(--muted)"}}>Question Type</p>
                            <select value={q.type || "mcq"} onChange={(e) => updateQuizQuestion(qIndex, "type", e.target.value)} style={{padding: "10px"}}>
                              <option value="mcq">MCQ</option>
                              <option value="oneWord">One Word</option>
                              <option value="caseStudy">Case Study</option>
                              <option value="pictureStudy">Picture Study</option>
                            </select>
                          </div>
                          <input type="text" placeholder="Type question..." value={q.question || ""} onChange={(e) => updateQuizQuestion(qIndex, "question", e.target.value)} style={{padding: "10px", marginBottom: "10px"}} />
                          {(q.type || "mcq") === "mcq" ? (
                            <>
                              <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px"}}>
                                {[0, 1, 2, 3].map((oIndex) => (
                                  <input key={`q-${qIndex}-o-${oIndex}`} type="text" placeholder={`Option ${String.fromCharCode(65 + oIndex)}`} value={(q.options || [])[oIndex] || ""} onChange={(e) => updateQuizOption(qIndex, oIndex, e.target.value)} style={{padding: "10px"}} />
                                ))}
                              </div>
                              <div style={{marginTop: "10px"}}>
                                <p style={{fontSize: "11px", fontWeight: "700", marginBottom: "4px", color: "var(--muted)"}}>Correct Option</p>
                                <select value={q.correctIndex ?? 0} onChange={(e) => updateQuizQuestion(qIndex, "correctIndex", Number(e.target.value))} style={{padding: "10px"}}>
                                  <option value={0}>A</option>
                                  <option value={1}>B</option>
                                  <option value={2}>C</option>
                                  <option value={3}>D</option>
                                </select>
                              </div>
                            </>
                          ) : (
                            <>
                              {(q.type === "caseStudy") && (
                                <textarea placeholder="Case study passage..." value={q.caseText || ""} onChange={(e) => updateQuizQuestion(qIndex, "caseText", e.target.value)} style={{minHeight: "90px", marginBottom: "8px"}} />
                              )}
                              {(q.type === "pictureStudy") && (
                                <input type="text" placeholder="Image URL (https://...)" value={q.imageUrl || ""} onChange={(e) => updateQuizQuestion(qIndex, "imageUrl", e.target.value)} style={{padding: "10px", marginBottom: "8px"}} />
                              )}
                              <input type="text" placeholder="Correct answer (exact text)" value={q.answer || ""} onChange={(e) => updateQuizQuestion(qIndex, "answer", e.target.value)} style={{padding: "10px"}} />
                            </>
                          )}
                          <textarea
                            placeholder="Explanation shown after submit (optional)"
                            value={q.explanation || ""}
                            onChange={(e) => updateQuizQuestion(qIndex, "explanation", e.target.value)}
                            style={{minHeight: "80px", marginTop: "8px"}}
                          />
                        </div>
                      ))}
                    </div>
                    <div style={{marginTop: "14px", borderTop: "1px dashed var(--border)", paddingTop: "12px"}}>
                      <p style={{fontSize: "11px", fontWeight: "800", color: "var(--muted)", marginBottom: "6px", textTransform: "uppercase"}}>Quick Bulk Add (NotebookLM Friendly)</p>
                      <textarea
                        placeholder={`Paste from NotebookLM directly.\nSupported examples:\n1) What is ...?\nA) ...\nB) ...\nC) ...\nD) ...\nCorrect Answer: B\n\nQ2: Another question...\nA. ...\nB. ...\nAnswer: Option text`}
                        value={quizBuilderText}
                        onChange={(e) => setQuizBuilderText(e.target.value)}
                        style={{minHeight: "130px"}}
                      />
                      <div style={{display: "flex", gap: "8px", marginTop: "8px", flexWrap: "wrap"}}>
                        <button onClick={bulkAddQuizQuestions} style={{padding: "8px 12px", borderRadius: "10px", border: "1px solid var(--border)", background: "rgba(16,185,129,0.12)", color: "var(--text)", fontWeight: "800", cursor: "pointer"}}>Parse & Add Questions</button>
                        <button onClick={aiParseQuizQuestions} disabled={aiParsingQuiz || !quizBuilderText.trim()} style={{padding: "8px 12px", borderRadius: "10px", border: "1px solid var(--border)", background: (aiParsingQuiz || !quizBuilderText.trim()) ? "rgba(148,163,184,0.2)" : "rgba(59,130,246,0.14)", color: "var(--text)", fontWeight: "800", cursor: (aiParsingQuiz || !quizBuilderText.trim()) ? "not-allowed" : "pointer", opacity: (aiParsingQuiz || !quizBuilderText.trim()) ? 0.65 : 1}}>
                          {aiParsingQuiz ? "AI Parsing..." : "AI Parse"}
                        </button>
                      </div>
                    </div>
                </div>
                <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px"}}>
                    {["video", "slides", "bookPdf", "infographic", "mindMap"].map(f => (
                        <div key={f}><p style={{fontSize: "11px", color: "#10b981", fontWeight: "800", textTransform: "uppercase", marginBottom: "6px"}}>{f}</p><input type="text" value={tempChapter[f] || ""} onChange={(e) => setTempChapter({...tempChapter, [f]: e.target.value})} style={{padding: "12px"}} /></div>
                    ))}
                </div>
            </div>
          </div>
        )}

        {saveStatus && (
          <div style={{position: "fixed", right: "20px", bottom: achievementToast ? "88px" : "20px", zIndex: 1200, padding: "10px 14px", borderRadius: "12px", border: "1px solid var(--border)", background: "var(--card)", fontWeight: "700", color: "var(--text)"}}>
            {saveStatus}
          </div>
        )}
        {achievementToast && (
          <div style={{position: "fixed", right: "20px", bottom: "20px", zIndex: 1201, padding: "12px 16px", borderRadius: "14px", border: "1px solid #059669", background: "#10b981", color: "white", fontWeight: "800", boxShadow: "0 8px 18px rgba(16,185,129,0.28)"}}>
            🏆 {achievementToast}
          </div>
        )}
      </div>
    </div>
  );
}
