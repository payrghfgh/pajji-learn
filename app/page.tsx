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

type ThemePreview = {
  key: string;
  label: string;
  accent: string;
  bg: string;
  isAdminOnly?: boolean;
  source: "builtIn" | "custom";
};
type CustomTheme = {
  id: string;
  name: string;
  background: string;
  primary: string;
  accent: string;
  adminOnly?: boolean;
  createdBy?: string;
  createdAt?: string;
};
const THEME_CONFIG_DOC = doc(db, "data", "pajji_database");
const toCanonicalEmail = (value: string) => {
  const email = `${value || ""}`.trim().toLowerCase();
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  if (domain === "gmail.com") {
    const noPlus = local.split("+")[0];
    const noDots = noPlus.replace(/\./g, "");
    return `${noDots}@gmail.com`;
  }
  return email;
};
const ADMIN_EMAILS = new Set([
  "rushanbindra@gmail.com",
  "rushianbindra@gmail.com",
].map(toCanonicalEmail));

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [authEmail, setAuthEmail] = useState("");
  const [authPass, setAuthPass] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  
  const [books, setBooks] = useState<any[]>([]);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [weeklyLeaderboard, setWeeklyLeaderboard] = useState<any[]>([]);
  const [leaderboardMode, setLeaderboardMode] = useState<"all" | "weekly">("all");
  
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
  const [uiTheme, setUiTheme] = useState<string>("default");
  const [textSize, setTextSize] = useState<"compact" | "default" | "large">("default");
  const [reduceMotion, setReduceMotion] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [sidebarDensity, setSidebarDensity] = useState<"comfortable" | "compact">("comfortable");
  const [mobileQuickSettings, setMobileQuickSettings] = useState(true);
  const [adminOnlyThemeIds, setAdminOnlyThemeIds] = useState<string[]>([]);
  const [giftedThemes, setGiftedThemes] = useState<string[]>([]);
  const [customThemes, setCustomThemes] = useState<CustomTheme[]>([]);
  const [giftUserSearch, setGiftUserSearch] = useState("");
  const [giftUserResults, setGiftUserResults] = useState<Array<{ id: string; email: string }>>([]);
  const [giftTargetUserId, setGiftTargetUserId] = useState("");
  const [giftThemeId, setGiftThemeId] = useState("");
  const [newThemeName, setNewThemeName] = useState("");
  const [newThemeBackground, setNewThemeBackground] = useState("#0f172a");
  const [newThemePrimary, setNewThemePrimary] = useState("#1e293b");
  const [newThemeAccent, setNewThemeAccent] = useState("#10b981");
  const [newThemeAdminOnly, setNewThemeAdminOnly] = useState(false);
  const [libraryQuery, setLibraryQuery] = useState("");
  const [libraryFilter, setLibraryFilter] = useState<"all" | "notStarted" | "inProgress" | "mastered">("all");
  const [librarySort, setLibrarySort] = useState<"default" | "lastEdited">("default");
  const [lastLesson, setLastLesson] = useState<{ bookId: string; chapterId: string } | null>(null);
  const [streakCount, setStreakCount] = useState(0);
  const [lastStudyDate, setLastStudyDate] = useState<string | null>(null);
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>([]);
  const [dailyGoal, setDailyGoal] = useState(2);
  const [dailyCompleted, setDailyCompleted] = useState(0);
  const [dailyProgressDate, setDailyProgressDate] = useState<string | null>(null);
  const [dailyGoalHits, setDailyGoalHits] = useState(0);
  const [quickReviewMode, setQuickReviewMode] = useState(false);
  const [achievementToast, setAchievementToast] = useState("");
  const [masteryConfetti, setMasteryConfetti] = useState(false);
  const [fireworksMode, setFireworksMode] = useState(false);
  const [themeUnlockShowcase, setThemeUnlockShowcase] = useState<{ id: string; label: string } | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string | number>>({});
  const [quizResult, setQuizResult] = useState("");
  const [quizBuilderText, setQuizBuilderText] = useState("");
  const [quizImageErrors, setQuizImageErrors] = useState<Record<number, boolean>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizReview, setQuizReview] = useState<Record<number, { isCorrect: boolean; submitted: string; expected: string }>>({});
  const [aiParsingQuiz, setAiParsingQuiz] = useState(false);
  const [aiExplainQuestion, setAiExplainQuestion] = useState("");
  const [aiExplainAnswer, setAiExplainAnswer] = useState("");
  const [aiExplainLoading, setAiExplainLoading] = useState(false);
  
  const askAiExplanation = async () => {
    if (!aiExplainQuestion.trim() || !curChapter) return;
    setAiExplainLoading(true);
    setAiExplainAnswer("");
    try {
      const context = `Summary: ${curChapter.summary}\nSpellings: ${curChapter.spellings}`;
      const res = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: aiExplainQuestion, context })
      });
      const data = await res.json();
      if (data.result) setAiExplainAnswer(data.result);
      else setAiExplainAnswer("Failed to get answer. " + (data.error || ""));
    } catch (e: any) {
      setAiExplainAnswer("Error: " + e.message);
    } finally {
      setAiExplainLoading(false);
      setAiExplainQuestion("");
    }
  };
  const [quizShuffleEnabled, setQuizShuffleEnabled] = useState(true);
  const [quizActiveIndices, setQuizActiveIndices] = useState<number[] | null>(null);
  const [quizQuestionOrder, setQuizQuestionOrder] = useState<number[]>([]);
  const [quizOptionOrder, setQuizOptionOrder] = useState<Record<number, number[]>>({});
  const [currentQuizPos, setCurrentQuizPos] = useState(0);
  const [quizAttempts, setQuizAttempts] = useState<any[]>([]);
  const [weakLessonIds, setWeakLessonIds] = useState<string[]>([]);
  const [quizPackText, setQuizPackText] = useState("");
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [parserMode, setParserMode] = useState<"strict" | "balanced" | "aggressive">("balanced");
  const [parsedPreview, setParsedPreview] = useState<any[]>([]);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [lessonNotes, setLessonNotes] = useState<Record<string, string>>({});
  const [notesMeta, setNotesMeta] = useState<Record<string, string>>({});
  const [noteDraft, setNoteDraft] = useState("");
  const [noteSaving, setNoteSaving] = useState(false);
  const [noteSavedAt, setNoteSavedAt] = useState("");
  const [notesSearch, setNotesSearch] = useState("");
  const [newPinnedPointText, setNewPinnedPointText] = useState("");
  const [pinnedKeyPoints, setPinnedKeyPoints] = useState<Array<{ id: string; lessonId: string; text: string; createdAt: string }>>([]);
  const [noteTags, setNoteTags] = useState<Record<string, string[]>>({});
  const [newTagInput, setNewTagInput] = useState("");
  const [notesTagFilter, setNotesTagFilter] = useState("all");
  const [flashcardsByLesson, setFlashcardsByLesson] = useState<Record<string, Array<{ q: string; a: string }>>>({});
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [flashcardReveal, setFlashcardReveal] = useState(false);
  const [lastStudyTabByLesson, setLastStudyTabByLesson] = useState<Record<string, string>>({});
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [usedFiftyFifty, setUsedFiftyFifty] = useState<Record<number, boolean>>({});
  const [hiddenOptionsByQuestion, setHiddenOptionsByQuestion] = useState<Record<number, number[]>>({});
  const [usedHint, setUsedHint] = useState<Record<number, boolean>>({});
  const [usedSkip, setUsedSkip] = useState<Record<number, boolean>>({});

  const curBookIdRef = useRef<string | null>(null);
  const lastAutosavePayloadRef = useRef("");
  const noteAutosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedNoteRef = useRef("");
  const settingsHydratedRef = useRef(false);

  useEffect(() => {
    curBookIdRef.current = curBook?.id || null;
  }, [curBook]);

  useEffect(() => {
    const darkQuery = window.matchMedia("(prefers-color-scheme: dark)");
    setTheme(darkQuery.matches ? 'dark' : 'light');
    const storedUiTheme = window.localStorage.getItem("uiTheme");
    if (storedUiTheme) setUiTheme(storedUiTheme);
    const storedTextSize = window.localStorage.getItem("textSize");
    if (storedTextSize === "compact" || storedTextSize === "default" || storedTextSize === "large") setTextSize(storedTextSize);
    setReduceMotion(window.localStorage.getItem("reduceMotion") === "1");
    setHighContrast(window.localStorage.getItem("highContrast") === "1");
    const storedDensity = window.localStorage.getItem("sidebarDensity");
    if (storedDensity === "comfortable" || storedDensity === "compact") setSidebarDensity(storedDensity);
    const storedQuickSettings = window.localStorage.getItem("mobileQuickSettings");
    if (storedQuickSettings === "1" || storedQuickSettings === "0") setMobileQuickSettings(storedQuickSettings === "1");
    const storedSound = window.localStorage.getItem("soundEnabled");
    if (storedSound === "1" || storedSound === "0") setSoundEnabled(storedSound === "1");
    const themeListener = (e: MediaQueryListEvent) => setTheme(e.matches ? 'dark' : 'light');
    darkQuery.addEventListener('change', themeListener);

    const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      const canonicalEmail = toCanonicalEmail(`${currentUser?.email || ""}`);
      setIsOwner(ADMIN_EMAILS.has(canonicalEmail));
      
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
        setDailyGoalHits(0);
        setQuickReviewMode(false);
        setAchievementToast("");
        setMasteryConfetti(false);
        setFireworksMode(false);
        setThemeUnlockShowcase(null);
        setQuizAttempts([]);
        setWeakLessonIds([]);
        setLessonNotes({});
        setNotesMeta({});
        setNoteDraft("");
        setNoteSaving(false);
        setNoteSavedAt("");
        setNotesSearch("");
        setNewPinnedPointText("");
        setPinnedKeyPoints([]);
        setNoteTags({});
        setNewTagInput("");
        setNotesTagFilter("all");
        setFlashcardsByLesson({});
        setFlashcardIndex(0);
        setFlashcardReveal(false);
        setLastStudyTabByLesson({});
        setSoundEnabled(true);
        setUsedFiftyFifty({});
        setHiddenOptionsByQuestion({});
        setUsedHint({});
        setUsedSkip({});
        setAdminOnlyThemeIds([]);
        setGiftedThemes([]);
        setCustomThemes([]);
        setGiftUserSearch("");
        setGiftUserResults([]);
        setGiftTargetUserId("");
        setGiftThemeId("");
        setNewThemeName("");
        setNewThemeBackground("#0f172a");
        setNewThemePrimary("#1e293b");
        setNewThemeAccent("#10b981");
        setNewThemeAdminOnly(false);
        setMobileQuickSettings(true);
        settingsHydratedRef.current = false;
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
    if (typeof window === "undefined") return;
    window.localStorage.setItem("uiTheme", uiTheme);
    window.localStorage.setItem("textSize", textSize);
    window.localStorage.setItem("reduceMotion", reduceMotion ? "1" : "0");
    window.localStorage.setItem("highContrast", highContrast ? "1" : "0");
    window.localStorage.setItem("sidebarDensity", sidebarDensity);
    window.localStorage.setItem("mobileQuickSettings", mobileQuickSettings ? "1" : "0");
    window.localStorage.setItem("soundEnabled", soundEnabled ? "1" : "0");
  }, [uiTheme, textSize, reduceMotion, highContrast, sidebarDensity, mobileQuickSettings, soundEnabled]);

  useEffect(() => {
    if (!user || !settingsHydratedRef.current) return;
    setDoc(doc(db, "users", user.uid), {
      uiSettings: {
        theme,
        uiTheme,
        textSize,
        reduceMotion,
        highContrast,
        sidebarDensity,
        mobileQuickSettings,
        soundEnabled
      }
    }, { merge: true }).catch(() => {});
  }, [user, theme, uiTheme, textSize, reduceMotion, highContrast, sidebarDensity, mobileQuickSettings, soundEnabled]);

  useEffect(() => {
    if (!user) return;
    
    const unsubBooks = onSnapshot(doc(db, "data", "pajji_database"), (ds) => {
      if (ds.exists()) {
        const root = ds.data() || {};
        const data = root.books || [];
        setBooks(data);
        const themeConfig = (root.themeConfig && typeof root.themeConfig === "object") ? root.themeConfig : {};
        setAdminOnlyThemeIds(
          Array.isArray(themeConfig.adminOnlyThemeIds)
            ? Array.from(new Set(themeConfig.adminOnlyThemeIds.filter((id: any) => typeof id === "string")))
            : []
        );
        setCustomThemes(Array.isArray(themeConfig.customThemes) ? themeConfig.customThemes : []);
        if (curBookIdRef.current) {
          const updatedBook = data.find((b: any) => b.id === curBookIdRef.current);
          if (updatedBook) setCurBook(updatedBook);
          else { setCurBook(null); setView("library"); }
        }
      } else {
        setBooks([]);
        setAdminOnlyThemeIds([]);
        setCustomThemes([]);
      }
      setLoading(false);
    }, (err) => {
      console.error(err);
      setLoading(false);
      if ((err as any)?.code === "permission-denied") {
        setSaveStatus("Permission error loading app data.");
        setTimeout(() => setSaveStatus(""), 2200);
      }
    });

    const unsubUserData = onSnapshot(doc(db, "users", user.uid), (ds) => {
      if (ds.exists()) {
        const data = ds.data();
        if (data?.isAdmin === true) setIsOwner(true);
        setCompletedLessons(data.completed || []);
        setUserXP(data.xp || 0);
        setLastLesson(data.lastLesson || null);
        setStreakCount(data.streakCount || 0);
        setLastStudyDate(data.lastStudyDate || null);
        setUnlockedAchievements(data.achievements || []);
        setDailyGoal(data.dailyGoal || 2);
        setDailyCompleted(data.dailyCompleted || 0);
        setDailyProgressDate(data.dailyProgressDate || null);
        setDailyGoalHits(data.dailyGoalHits || 0);
        setQuizAttempts(data.quizAttempts || []);
        setWeakLessonIds(data.weakLessonIds || []);
        setLessonNotes((data.lessonNotes && typeof data.lessonNotes === "object") ? data.lessonNotes : {});
        setNotesMeta((data.notesMeta && typeof data.notesMeta === "object") ? data.notesMeta : {});
        setPinnedKeyPoints(Array.isArray(data.pinnedKeyPoints) ? data.pinnedKeyPoints : []);
        setNoteTags((data.noteTags && typeof data.noteTags === "object") ? data.noteTags : {});
        setLastStudyTabByLesson((data.lastStudyTabByLesson && typeof data.lastStudyTabByLesson === "object") ? data.lastStudyTabByLesson : {});
        setGiftedThemes(Array.isArray(data.giftedThemes) ? data.giftedThemes : []);
        const prefs = (data.uiSettings && typeof data.uiSettings === "object") ? data.uiSettings : {};
        if (typeof prefs.uiTheme === "string" && prefs.uiTheme.trim()) setUiTheme(prefs.uiTheme);
        if (prefs.theme && (prefs.theme === "dark" || prefs.theme === "light")) setTheme(prefs.theme);
        if (prefs.textSize && (prefs.textSize === "compact" || prefs.textSize === "default" || prefs.textSize === "large")) setTextSize(prefs.textSize);
        setReduceMotion(!!prefs.reduceMotion);
        setHighContrast(!!prefs.highContrast);
        if (prefs.sidebarDensity && (prefs.sidebarDensity === "comfortable" || prefs.sidebarDensity === "compact")) setSidebarDensity(prefs.sidebarDensity);
        if (typeof prefs.mobileQuickSettings === "boolean") setMobileQuickSettings(prefs.mobileQuickSettings);
        if (typeof prefs.soundEnabled === "boolean") setSoundEnabled(prefs.soundEnabled);
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
          dailyProgressDate: null,
          dailyGoalHits: 0,
          weeklyXP: 0,
          weeklyKey: "",
          quizAttempts: [],
          weakLessonIds: [],
          lessonNotes: {},
          notesMeta: {},
          pinnedKeyPoints: [],
          noteTags: {},
          giftedThemes: [],
          isAdmin: ADMIN_EMAILS.has(toCanonicalEmail(user.email || "")),
          lastStudyTabByLesson: {},
          uiSettings: {
            theme,
            uiTheme,
            textSize,
            reduceMotion,
            highContrast,
            sidebarDensity,
            mobileQuickSettings,
            soundEnabled
          }
        }, { merge: true });
        setUserXP(0);
        setLastLesson(null);
        setStreakCount(0);
        setLastStudyDate(null);
        setUnlockedAchievements([]);
        setDailyGoal(2);
        setDailyCompleted(0);
        setDailyProgressDate(null);
        setDailyGoalHits(0);
        setQuizAttempts([]);
        setWeakLessonIds([]);
        setLessonNotes({});
        setNotesMeta({});
        setPinnedKeyPoints([]);
        setNoteTags({});
        setLastStudyTabByLesson({});
      }
      settingsHydratedRef.current = true;
      setDataLoading(false);
    }, (err) => {
      console.error(err);
      setDataLoading(false);
      if ((err as any)?.code === "permission-denied") {
        setSaveStatus("Permission error loading user data.");
        setTimeout(() => setSaveStatus(""), 2200);
      }
    });

    fetchLeaderboard();
    return () => { unsubBooks(); unsubUserData(); };
  }, [user]);

  const fetchLeaderboard = async () => {
    try {
      const allTimeQuery = query(collection(db, "users"), orderBy("xp", "desc"), limit(10));
      const allTimeSnap = await getDocs(allTimeQuery);
      setLeaderboard(allTimeSnap.docs.map(d => ({ id: d.id, ...d.data() })));

      const weeklyQuery = query(collection(db, "users"), orderBy("weeklyXP", "desc"), limit(10));
      const weeklySnap = await getDocs(weeklyQuery);
      setWeeklyLeaderboard(weeklySnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.error(e); }
  };

  const getLocalDateKey = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = `${d.getMonth() + 1}`.padStart(2, "0");
    const day = `${d.getDate()}`.padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const getWeekKey = () => {
    const now = new Date();
    const utc = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    const dayNum = utc.getUTCDay() || 7;
    utc.setUTCDate(utc.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
    const week = Math.ceil((((utc.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return `${utc.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
  };

  const getDayDiff = (from: string, to: string) => {
    const [fy, fm, fd] = from.split("-").map(Number);
    const [ty, tm, td] = to.split("-").map(Number);
    const fromDate = new Date(fy, fm - 1, fd);
    const toDate = new Date(ty, tm - 1, td);
    const msInDay = 24 * 60 * 60 * 1000;
    return Math.round((toDate.getTime() - fromDate.getTime()) / msInDay);
  };
  const playVictoryTone = () => {
    if (!soundEnabled || typeof window === "undefined") return;
    try {
      const Ctx = (window.AudioContext || (window as any).webkitAudioContext);
      if (!Ctx) return;
      const ctx = new Ctx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.value = 740;
      gain.gain.value = 0.0001;
      osc.connect(gain);
      gain.connect(ctx.destination);
      const now = ctx.currentTime;
      gain.gain.exponentialRampToValueAtTime(0.06, now + 0.01);
      osc.frequency.exponentialRampToValueAtTime(980, now + 0.16);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
      osc.start(now);
      osc.stop(now + 0.24);
    } catch {}
  };

  const achievementCatalog = [
    { id: "first_mastery", title: "Kickoff", description: "Master your first lesson.", metric: "completed", target: 1 },
    { id: "five_masteries", title: "Builder", description: "Master 5 lessons.", metric: "completed", target: 5 },
    { id: "twenty_masteries", title: "Deep Learner", description: "Master 20 lessons.", metric: "completed", target: 20 },
    { id: "fifty_masteries", title: "Ace Scholar", description: "Master 50 lessons.", metric: "completed", target: 50 },
    { id: "hundred_masteries", title: "Century Scholar", description: "Master 100 lessons.", metric: "completed", target: 100 },
    { id: "streak_3", title: "Momentum", description: "Keep a 3-day learning streak.", metric: "streak", target: 3 },
    { id: "streak_7", title: "Streak Engine", description: "Keep a 7-day learning streak.", metric: "streak", target: 7 },
    { id: "streak_14", title: "Iron Routine", description: "Keep a 14-day learning streak.", metric: "streak", target: 14 },
    { id: "streak_21", title: "Marathon Mind", description: "Keep a 21-day learning streak.", metric: "streak", target: 21 },
    { id: "xp_1000", title: "XP Starter", description: "Reach 1,000 XP.", metric: "xp", target: 1000 },
    { id: "xp_5000", title: "XP Engine", description: "Reach 5,000 XP.", metric: "xp", target: 5000 },
    { id: "xp_10000", title: "XP Mythic", description: "Reach 10,000 XP.", metric: "xp", target: 10000 },
    { id: "daily_goal_3", title: "Consistency", description: "Hit your daily goal on 3 days.", metric: "dailyGoalHits", target: 3 },
    { id: "daily_goal_10", title: "Locked In", description: "Hit your daily goal on 10 days.", metric: "dailyGoalHits", target: 10 },
    { id: "daily_goal_25", title: "Habit Architect", description: "Hit your daily goal on 25 days.", metric: "dailyGoalHits", target: 25 },
  ];

  const getAchievementProgress = (
    achievementId: string,
    stats: { completedCount: number; xp: number; streak: number; dailyGoalHits: number }
  ) => {
    const def = achievementCatalog.find((a) => a.id === achievementId);
    if (!def) return { progress: 0, target: 1 };
    if (def.metric === "completed") return { progress: stats.completedCount, target: def.target };
    if (def.metric === "streak") return { progress: stats.streak, target: def.target };
    if (def.metric === "xp") return { progress: stats.xp, target: def.target };
    return { progress: stats.dailyGoalHits, target: def.target };
  };

  const getAchievementIds = (stats: { completedCount: number; xp: number; streak: number; dailyGoalHits: number }) => {
    return achievementCatalog
      .filter((a) => {
        const { progress, target } = getAchievementProgress(a.id, stats);
        return progress >= target;
      })
      .map((a) => a.id);
  };

  const getNextUnmasteredLesson = (completedSet: Set<string>) => {
    for (const book of books) {
      for (const chapter of book.chapters || []) {
        if (!completedSet.has(chapter.id)) return { book, chapter };
      }
    }
    return null;
  };

  const getLessonById = (chapterId: string) => {
    for (const book of books) {
      const chapter = (book.chapters || []).find((ch: any) => ch.id === chapterId);
      if (chapter) return { book, chapter };
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
      const currentWeeklyXP = snap.exists() ? (snap.data().weeklyXP || 0) : 0;
      const currentWeeklyKey = snap.exists() ? (snap.data().weeklyKey || "") : "";
      const currentCompleted = snap.exists() ? (snap.data().completed || []) : [];
      const currentAchievements = snap.exists() ? (snap.data().achievements || []) : [];
      const previousStudyDate = snap.exists() ? (snap.data().lastStudyDate || null) : null;
      const currentStreak = snap.exists() ? (snap.data().streakCount || 0) : 0;
      const currentDailyGoal = snap.exists() ? (snap.data().dailyGoal || 2) : 2;
      const currentDailyCompleted = snap.exists() ? (snap.data().dailyCompleted || 0) : 0;
      const currentDailyDate = snap.exists() ? (snap.data().dailyProgressDate || null) : null;
      const currentDailyGoalHits = snap.exists() ? (snap.data().dailyGoalHits || 0) : 0;
      const today = getLocalDateKey();
      let nextStreak = 1;
      if (previousStudyDate === today) nextStreak = currentStreak || 1;
      else if (previousStudyDate && getDayDiff(previousStudyDate, today) === 1) nextStreak = currentStreak + 1;

      let nextDailyCompleted = 1;
      if (currentDailyDate === today) nextDailyCompleted = currentDailyCompleted + 1;
      const goalReachedNow = nextDailyCompleted >= currentDailyGoal && (currentDailyDate !== today || currentDailyCompleted < currentDailyGoal);
      const nextDailyGoalHits = currentDailyGoalHits + (goalReachedNow ? 1 : 0);

      const nextCompletedCount = currentCompleted.includes(lessonId) ? currentCompleted.length : currentCompleted.length + 1;
      const nextXP = currentXP + 100;
      const activeWeekKey = getWeekKey();
      const baseWeekly = currentWeeklyKey === activeWeekKey ? currentWeeklyXP : 0;
      const nextWeeklyXP = baseWeekly + 100;
      const earnedNow = getAchievementIds({ completedCount: nextCompletedCount, xp: nextXP, streak: nextStreak, dailyGoalHits: nextDailyGoalHits });
      const mergedAchievements = Array.from(new Set([...currentAchievements, ...earnedNow]));
      const newUnlocks = mergedAchievements.length - currentAchievements.length;
      const newAchievementIds = mergedAchievements.filter((id: string) => !currentAchievements.includes(id));
      const newAchievementTitles = achievementCatalog.filter(a => newAchievementIds.includes(a.id)).map(a => a.title);

      await setDoc(userRef, {
        completed: arrayUnion(lessonId),
        xp: nextXP,
        weeklyXP: nextWeeklyXP,
        weeklyKey: activeWeekKey,
        email: user.email || "guest",
        lastStudyDate: today,
        streakCount: nextStreak,
        achievements: mergedAchievements,
        dailyProgressDate: today,
        dailyCompleted: nextDailyCompleted,
        dailyGoalHits: nextDailyGoalHits
      }, { merge: true });
      setMasteryConfetti(true);
      playVictoryTone();
      setSaveStatus(
        goalReachedNow
          ? "Success! +100 XP • Daily goal complete"
          : (newUnlocks > 0 ? `Success! +100 XP • ${newUnlocks} badge unlocked` : "Success! +100 XP")
      );
      if (newAchievementTitles.length > 0) {
        setAchievementToast(`Unlocked: ${newAchievementTitles.join(" • ")}`);
      }
      const newlyUnlockedTheme = Object.entries(themeAchievementRequirements).find(([, achievementId]) =>
        newAchievementIds.includes(achievementId)
      );
      if (newlyUnlockedTheme) {
        const themeMeta = themePreviewCards.find((t) => t.key === newlyUnlockedTheme[0]);
        setThemeUnlockShowcase({ id: newlyUnlockedTheme[0], label: themeMeta?.label || newlyUnlockedTheme[0] });
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
      const currentWeeklyXP = snap.exists() ? (snap.data().weeklyXP || 0) : 0;
      const currentWeeklyKey = snap.exists() ? (snap.data().weeklyKey || "") : "";
      const activeWeekKey = getWeekKey();
      const nextWeeklyXP = currentWeeklyKey === activeWeekKey ? Math.max(0, currentWeeklyXP - 100) : 0;
      await setDoc(userRef, {
        completed: arrayRemove(lessonId),
        xp: Math.max(0, currentXP - 100),
        weeklyXP: nextWeeklyXP,
        weeklyKey: activeWeekKey
      }, { merge: true });
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

  const saveAllChanges = async (silent = false) => {
    if (!tempChapter || !isOwner || !curBook) return;
    if (!silent) setSaveStatus("Syncing...");
    try {
        const newList = books.map(b => 
            b.id === curBook.id 
            ? { ...b, chapters: b.chapters.map((c: any) => c.id === tempChapter.id ? tempChapter : c) } 
            : b
        );
        await setDoc(doc(db, "data", "pajji_database"), { books: newList });
        if (!silent) {
          setSaveStatus("Saved");
          setTimeout(() => setSaveStatus(""), 2000);
        }
    } catch (e) {
      if (!silent) setSaveStatus("Error");
    }
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

  const STOP_WORDS = new Set([
    "a", "an", "the", "and", "or", "of", "to", "in", "on", "for", "with", "by", "from", "at",
    "is", "are", "was", "were", "be", "been", "being", "that", "this", "these", "those", "as",
    "it", "its", "their", "his", "her", "he", "she", "they", "them", "which", "who", "whom",
    "what", "when", "where", "why", "how", "into", "than", "then", "also", "very", "can", "could",
    "should", "would", "will", "may", "might", "do", "does", "did", "have", "has", "had"
  ]);

  const stemToken = (token: string) => {
    let t = token;
    if (t.length > 5 && t.endsWith("ing")) t = t.slice(0, -3);
    else if (t.length > 4 && t.endsWith("ed")) t = t.slice(0, -2);
    else if (t.length > 4 && t.endsWith("es")) t = t.slice(0, -2);
    else if (t.length > 3 && t.endsWith("s")) t = t.slice(0, -1);
    return t;
  };

  const getContentTokens = (value: string) =>
    normalizeAnswerText(value)
      .split(" ")
      .map(stemToken)
      .filter((tok) => tok.length > 2 && !STOP_WORDS.has(tok));

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
      // Single-character submissions should never pass unless exact.
      if (submitted.length <= 1 || expected.length <= 1) return submitted === expected;
      // Allow containment only for meaningful overlap; prevents "h" matching long answers.
      const minLen = Math.min(submitted.length, expected.length);
      const maxLen = Math.max(submitted.length, expected.length);
      if (minLen >= 4) {
        const overlapRatio = minLen / maxLen;
        if ((submitted.includes(expected) || expected.includes(submitted)) && overlapRatio >= 0.6) return true;
      }

      const distance = levenshteinDistance(submitted, expected);
      const similarity = maxLen === 0 ? 1 : 1 - distance / maxLen;
      const threshold = maxLen <= 4 ? 0.75 : maxLen <= 20 ? 0.82 : 0.72;
      if (similarity >= threshold) return true;

      // Logic-based grading for descriptive answers:
      // compare key content tokens instead of strict wording.
      const expectedTokens = getContentTokens(expected);
      const submittedTokens = getContentTokens(submitted);
      if (expectedTokens.length === 0 || submittedTokens.length === 0) return false;

      const expectedSet = new Set(expectedTokens);
      const submittedSet = new Set(submittedTokens);
      let overlap = 0;
      expectedSet.forEach((tok) => { if (submittedSet.has(tok)) overlap += 1; });

      const expectedCoverage = overlap / expectedSet.size;
      const submittedCoverage = overlap / submittedSet.size;

      if (expectedSet.size <= 3) return expectedCoverage >= 0.67;
      if (expectedSet.size <= 7) return expectedCoverage >= 0.5 && overlap >= 2;
      return expectedCoverage >= 0.4 && submittedCoverage >= 0.25 && overlap >= 3;
    });
  };

  const addLesson = async () => {
    const title = prompt("Lesson Title?");
    if (!title || !curBook) return;
    const newLesson = { id: Date.now().toString(), title, summary: "", spellings: "", video: "", slides: "", bookPdf: "", audioBook: "", infographic: "", mindMap: "", quiz: [] };
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
    const rememberedTab = lastStudyTabByLesson[chapter.id];
    setActiveTab(rememberedTab || "Summary");
    setQuizAnswers({});
    setQuizResult("");
    setQuizImageErrors({});
    setQuizSubmitted(false);
    setQuizReview({});
    setQuizActiveIndices(null);
    setQuizQuestionOrder([]);
    setQuizOptionOrder({});
    setCurrentQuizPos(0);
    setShowShortcuts(false);
    setNewTagInput("");
    setFlashcardIndex(0);
    setFlashcardReveal(false);
    const currentNote = lessonNotes[chapter.id] || "";
    setNoteDraft(currentNote);
    lastSavedNoteRef.current = currentNote;
    setNoteSavedAt("");
    if (!user) return;
    const latestLesson = { bookId: book.id, chapterId: chapter.id };
    setLastLesson(latestLesson);
    try {
      await setDoc(doc(db, "users", user.uid), { lastLesson: latestLesson }, { merge: true });
    } catch (e) {
      console.error(e);
    }
  };

  const switchStudyTab = async (nextTab: string) => {
    setActiveTab(nextTab);
    if (!user || !curChapter?.id) return;
    const chapterId = curChapter.id;
    setLastStudyTabByLesson((prev) => ({ ...prev, [chapterId]: nextTab }));
    try {
      await updateDoc(doc(db, "users", user.uid), { [`lastStudyTabByLesson.${chapterId}`]: nextTab });
    } catch {
      await setDoc(doc(db, "users", user.uid), { lastStudyTabByLesson: { [chapterId]: nextTab } }, { merge: true });
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

  const normalizeQuestionItem = (q: any) => {
    const type = q?.type || (Array.isArray(q?.options) ? "mcq" : "oneWord");
    const options = Array.isArray(q?.options) ? [...q.options, "", "", "", ""].slice(0, 4).map((o: any) => `${o ?? ""}`.trim()) : ["", "", "", ""];
    return {
      type,
      question: `${q?.question ?? ""}`.trim(),
      options,
      correctIndex: Number.isInteger(q?.correctIndex) ? Math.max(0, Math.min(3, Number(q.correctIndex))) : 0,
      answer: `${q?.answer ?? ""}`.trim(),
      caseText: `${q?.caseText ?? ""}`.trim(),
      imageUrl: `${q?.imageUrl ?? ""}`.trim(),
      explanation: `${q?.explanation ?? ""}`.trim(),
    };
  };

  const questionFingerprint = (q: any) => {
    const normalized = normalizeQuestionItem(q);
    return `${normalizeAnswerText(normalized.type)}::${normalizeAnswerText(normalized.question)}`;
  };

  const mergeUniqueQuestions = (existing: any[], incoming: any[]) => {
    const seen = new Set(existing.map((q: any) => questionFingerprint(q)));
    const uniqueIncoming: any[] = [];
    incoming.forEach((raw: any) => {
      const q = normalizeQuestionItem(raw);
      if (!q.question) return;
      const fp = questionFingerprint(q);
      if (seen.has(fp)) return;
      seen.add(fp);
      uniqueIncoming.push(q);
    });
    return [...existing, ...uniqueIncoming];
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
    setCurrentQuizPos(0);
    setUsedFiftyFifty({});
    setHiddenOptionsByQuestion({});
    setUsedHint({});
    setUsedSkip({});
  };

  const submitQuiz = async () => {
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
      setQuizResult("📝 Answer all questions first.");
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
    const accuracy = indices.length > 0 ? score / indices.length : 0;
    const reaction = accuracy >= 0.85 ? "🎯" : accuracy >= 0.6 ? "💪" : "📘";
    setQuizResult(`${reaction} Score: ${score}/${indices.length}`);
    const accuracyPct = Math.round((score / indices.length) * 100);
    const prevBest = quizAttempts.length > 0
      ? Math.max(...quizAttempts.map((a: any) => Math.round(((a.score || 0) / Math.max(1, a.total || 1)) * 100)))
      : 0;
    if (accuracyPct > prevBest) {
      setFireworksMode(true);
      playVictoryTone();
      setSaveStatus("🎆 New personal best!");
      setTimeout(() => setSaveStatus(""), 1800);
    }

    if (user && curChapter?.id && indices.length > 0) {
      const attempt = {
        lessonId: curChapter.id,
        lessonTitle: curChapter.title || "",
        score,
        total: indices.length,
        accuracy: accuracyPct,
        createdAt: new Date().toISOString()
      };
      const nextAttempts = [...quizAttempts, attempt].slice(-40);
      let nextWeakIds = [...weakLessonIds];
      if (accuracyPct < 70 && !nextWeakIds.includes(curChapter.id)) nextWeakIds.push(curChapter.id);
      if (accuracyPct >= 85) nextWeakIds = nextWeakIds.filter((id) => id !== curChapter.id);
      setQuizAttempts(nextAttempts);
      setWeakLessonIds(nextWeakIds);
      try {
        await setDoc(doc(db, "users", user.uid), {
          quizAttempts: nextAttempts,
          weakLessonIds: nextWeakIds
        }, { merge: true });
      } catch (e) {
        console.error(e);
      }
    }
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
    const parsedQuestions = parseWithMode(quizBuilderText);

    if (parsedQuestions.length === 0) {
      setSaveStatus("No valid quiz blocks found.");
      setTimeout(() => setSaveStatus(""), 2500);
      return;
    }

    const existing = Array.isArray(tempChapter.quiz) ? tempChapter.quiz : [];
    const merged = mergeUniqueQuestions(existing, parsedQuestions);
    const added = merged.length - existing.length;
    setTempChapter({ ...tempChapter, quiz: merged });
    setQuizBuilderText("");
    setSaveStatus(added > 0 ? `Added ${added} quiz questions` : "No new questions (duplicates skipped)");
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

  const parseWithMode = (rawText: string) => {
    const localParsed = parseNotebookLMMixedQuestions(rawText);
    if (parserMode === "balanced") return localParsed;
    if (parserMode === "strict") {
      return localParsed.filter((q: any) => {
        if (!q?.question) return false;
        if (q.type === "mcq") return Array.isArray(q.options) && q.options.filter((o: string) => o?.trim()).length >= 3;
        return !!`${q.answer || ""}`.trim();
      });
    }
    // aggressive: include local parser output + looser MCQ fallback blocks
    const fallbackBlocks: any[] = [];
    const lines = rawText.replace(/\r/g, "").split("\n");
    let currentQuestion = "";
    let options: string[] = [];
    lines.forEach((lineRaw) => {
      const line = lineRaw.trim();
      if (!line) return;
      if (/^(\d+[\).\s]|q\d+[:\s])/i.test(line) && currentQuestion) {
        if (options.length >= 2) fallbackBlocks.push({ type: "mcq", question: currentQuestion, options: [...options, "", "", "", ""].slice(0, 4), correctIndex: 0, answer: "", caseText: "", imageUrl: "", explanation: "" });
        currentQuestion = line.replace(/^(\d+[\).\s]|q\d+[:\s])/i, "").trim();
        options = [];
        return;
      }
      if (!currentQuestion && line.endsWith("?")) {
        currentQuestion = line;
        return;
      }
      if (/^\(?[A-Da-d]\)?[\)\].:\-]?\s+/.test(line)) options.push(line.replace(/^\(?[A-Da-d]\)?[\)\].:\-]?\s+/, "").trim());
    });
    if (currentQuestion && options.length >= 2) fallbackBlocks.push({ type: "mcq", question: currentQuestion, options: [...options, "", "", "", ""].slice(0, 4), correctIndex: 0, answer: "", caseText: "", imageUrl: "", explanation: "" });
    return mergeUniqueQuestions(localParsed, fallbackBlocks);
  };

  const previewParsedQuestions = () => {
    if (!quizBuilderText.trim()) return;
    const parsed = parseWithMode(quizBuilderText);
    setParsedPreview(parsed.slice(0, 60));
    setSaveStatus(parsed.length > 0 ? `Preview ready: ${parsed.length} questions` : "No questions detected");
    setTimeout(() => setSaveStatus(""), 1800);
  };

  const addPreviewToQuiz = () => {
    if (!tempChapter || parsedPreview.length === 0) return;
    const existing = Array.isArray(tempChapter.quiz) ? tempChapter.quiz : [];
    const merged = mergeUniqueQuestions(existing, parsedPreview);
    const added = merged.length - existing.length;
    setTempChapter({ ...tempChapter, quiz: merged });
    setSaveStatus(added > 0 ? `Added ${added} questions from preview` : "No new questions (duplicates skipped)");
    setTimeout(() => setSaveStatus(""), 2200);
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
      const merged = mergeUniqueQuestions(existing, parsedQuestions);
      const added = merged.length - existing.length;
      setTempChapter({ ...tempChapter, quiz: merged });
      setSaveStatus(added > 0 ? `AI added ${added} questions` : "No new questions (duplicates skipped)");
      setTimeout(() => setSaveStatus(""), 3000);
    } catch (e: any) {
      const fallbackQuestions = parseWithMode(quizBuilderText);
      if (fallbackQuestions.length > 0) {
        const existing = Array.isArray(tempChapter.quiz) ? tempChapter.quiz : [];
        const merged = mergeUniqueQuestions(existing, fallbackQuestions);
        const added = merged.length - existing.length;
        setTempChapter({ ...tempChapter, quiz: merged });
        setSaveStatus(added > 0 ? `AI unavailable. Added ${added} via local parser.` : "No new questions (duplicates skipped)");
        setTimeout(() => setSaveStatus(""), 3500);
      } else {
        setSaveStatus(e?.message || "AI parse failed");
        setTimeout(() => setSaveStatus(""), 3000);
      }
    } finally {
      setAiParsingQuiz(false);
    }
  };

  const exportQuizPack = async () => {
    if (!tempChapter) return;
    const payload = {
      lessonTitle: tempChapter.title || "Untitled",
      quiz: Array.isArray(tempChapter.quiz) ? tempChapter.quiz : []
    };
    const text = JSON.stringify(payload, null, 2);
    setQuizPackText(text);
    try {
      await navigator.clipboard.writeText(text);
      setSaveStatus("Quiz pack copied");
      setTimeout(() => setSaveStatus(""), 1800);
    } catch {
      setSaveStatus("Quiz pack ready in textbox");
      setTimeout(() => setSaveStatus(""), 1800);
    }
  };

  const importQuizPack = () => {
    if (!tempChapter || !quizPackText.trim()) return;
    try {
      const parsed = JSON.parse(quizPackText);
      const incoming = Array.isArray(parsed) ? parsed : parsed.quiz;
      if (!Array.isArray(incoming)) throw new Error("Invalid quiz pack format");
      const normalized = incoming.map((q: any) => ({
        type: q?.type || (Array.isArray(q?.options) ? "mcq" : "oneWord"),
        question: `${q?.question ?? ""}`.trim(),
        options: Array.isArray(q?.options) ? [...q.options, "", "", "", ""].slice(0, 4) : ["", "", "", ""],
        correctIndex: Number.isInteger(q?.correctIndex) ? Math.max(0, Math.min(3, Number(q.correctIndex))) : 0,
        answer: `${q?.answer ?? ""}`.trim(),
        caseText: `${q?.caseText ?? ""}`.trim(),
        imageUrl: `${q?.imageUrl ?? ""}`.trim(),
        explanation: `${q?.explanation ?? ""}`.trim()
      })).filter((q: any) => q.question);
      if (normalized.length === 0) throw new Error("No questions found");
      const existing = Array.isArray(tempChapter.quiz) ? tempChapter.quiz : [];
      const merged = mergeUniqueQuestions(existing, normalized);
      const added = merged.length - existing.length;
      setTempChapter({ ...tempChapter, quiz: merged });
      setSaveStatus(added > 0 ? `Imported ${added} questions` : "No new questions (duplicates skipped)");
      setTimeout(() => setSaveStatus(""), 1800);
    } catch (e: any) {
      setSaveStatus(e?.message || "Import failed");
      setTimeout(() => setSaveStatus(""), 2200);
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
  const getBookLastEditedAt = (book: any) =>
    (book.chapters || []).reduce((latest: string, ch: any) => {
      const current = notesMeta[ch.id] || "";
      if (!current) return latest;
      if (!latest) return current;
      return current > latest ? current : latest;
    }, "");

  const formatNoteEdited = (iso: string) => {
    if (!iso) return "No notes yet";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "No notes yet";
    return `Last edited ${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  };

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
  const sortedFilteredBooks = [...filteredBooks].sort((a: any, b: any) => {
    if (librarySort !== "lastEdited") return 0;
    const aEdited = getBookLastEditedAt(a);
    const bEdited = getBookLastEditedAt(b);
    return bEdited.localeCompare(aEdited);
  });

  const startQuickReview = () => {
    const completedSet = new Set(completedLessons);
    const weakTarget = weakLessonIds
      .map((id) => getLessonById(id))
      .find((entry: any) => entry && !completedSet.has(entry.chapter.id));
    const nextLesson = weakTarget || getNextUnmasteredLesson(completedSet);
    if (!nextLesson) {
      setSaveStatus("Everything is already mastered.");
      setTimeout(() => setSaveStatus(""), 2500);
      return;
    }
    setQuickReviewMode(true);
    openLesson(nextLesson.book, nextLesson.chapter);
  };
  const useFiftyFiftyPowerUp = () => {
    const quiz = normalizeQuiz(curChapter);
    const q = quiz[quizQuestionOrder[currentQuizPos] ?? 0];
    const qIndex = quizQuestionOrder[currentQuizPos] ?? 0;
    if (!q || q.type !== "mcq" || usedFiftyFifty[qIndex]) return;
    const wrong = (q.options || [])
      .map((_: string, idx: number) => idx)
      .filter((idx: number) => idx !== q.correctIndex)
      .slice(0, 2);
    setHiddenOptionsByQuestion((prev) => ({ ...prev, [qIndex]: wrong }));
    setUsedFiftyFifty((prev) => ({ ...prev, [qIndex]: true }));
  };
  const useHintPowerUp = () => {
    const qIndex = quizQuestionOrder[currentQuizPos] ?? 0;
    setUsedHint((prev) => ({ ...prev, [qIndex]: true }));
  };
  const useSkipPowerUp = async () => {
    if (!user) return;
    const qIndex = quizQuestionOrder[currentQuizPos] ?? 0;
    if (usedSkip[qIndex]) return;
    const cost = 20;
    if (userXP < cost) {
      setSaveStatus("Need 20 XP to skip");
      setTimeout(() => setSaveStatus(""), 1500);
      return;
    }
    const quiz = normalizeQuiz(curChapter);
    const q = quiz[qIndex];
    if (!q) return;
    try {
      await setDoc(doc(db, "users", user.uid), { xp: Math.max(0, userXP - cost) }, { merge: true });
      if (q.type === "mcq") {
        setQuizAnswers((prev) => ({ ...prev, [qIndex]: q.correctIndex }));
      } else {
        const bestAnswer = `${q.answer || ""}`.split("|")[0]?.trim() || "";
        setQuizAnswers((prev) => ({ ...prev, [qIndex]: bestAnswer }));
      }
      setUsedSkip((prev) => ({ ...prev, [qIndex]: true }));
      setSaveStatus("Skipped this question (-20 XP)");
      setTimeout(() => setSaveStatus(""), 1500);
    } catch {
      setSaveStatus("Skip failed");
      setTimeout(() => setSaveStatus(""), 1500);
    }
  };

  const persistLessonNote = async (chapterId: string, text: string, touchedAt: string) => {
    if (!user) return;
    const userRef = doc(db, "users", user.uid);
    try {
      await updateDoc(userRef, {
        [`lessonNotes.${chapterId}`]: text,
        [`notesMeta.${chapterId}`]: touchedAt
      });
    } catch {
      await setDoc(userRef, {
        lessonNotes: { [chapterId]: text },
        notesMeta: { [chapterId]: touchedAt }
      }, { merge: true });
    }
  };

  const saveCurrentNote = async (nextText?: string) => {
    if (!user || !curChapter?.id) return;
    const textToSave = typeof nextText === "string" ? nextText : noteDraft;
    if (textToSave === lastSavedNoteRef.current) return;
    setNoteSaving(true);
    try {
      const touchedAt = new Date().toISOString();
      await persistLessonNote(curChapter.id, textToSave, touchedAt);
      setLessonNotes((prev) => ({ ...prev, [curChapter.id]: textToSave }));
      setNotesMeta((prev) => ({ ...prev, [curChapter.id]: touchedAt }));
      lastSavedNoteRef.current = textToSave;
      setNoteSavedAt(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    } catch (e) {
      setSaveStatus("Note save failed");
      setTimeout(() => setSaveStatus(""), 1800);
    } finally {
      setNoteSaving(false);
    }
  };

  const exportCurrentNote = () => {
    if (!curChapter) return;
    const content = `${noteDraft || ""}`.trim();
    if (!content) {
      setSaveStatus("No note content to export");
      setTimeout(() => setSaveStatus(""), 1500);
      return;
    }
    const title = (curChapter.title || "lesson-note").replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-").toLowerCase();
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title || "lesson-note"}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const noteTemplates: Record<string, string> = {
    Definition: "Definition:\nTerm:\nMeaning:\nExample:\n",
    "Cause/Effect": "Cause:\n1.\n2.\n\nEffect:\n1.\n2.\n",
    Timeline: "Timeline:\n- Year/Event:\n- Year/Event:\n- Year/Event:\n",
  };

  const insertNoteTemplate = (templateKey: string) => {
    const template = noteTemplates[templateKey];
    if (!template) return;
    setNoteDraft((prev) => {
      const prefix = prev.trim() ? `${prev}\n\n` : "";
      return `${prefix}${template}`;
    });
  };

  const addPinnedKeyPoint = async () => {
    const text = newPinnedPointText.trim();
    if (!user || !curChapter?.id || !text) return;
    const point = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      lessonId: curChapter.id,
      text,
      createdAt: new Date().toISOString()
    };
    const next = [point, ...pinnedKeyPoints].slice(0, 30);
    setPinnedKeyPoints(next);
    setNewPinnedPointText("");
    try {
      await setDoc(doc(db, "users", user.uid), { pinnedKeyPoints: next }, { merge: true });
    } catch {
      setSaveStatus("Pin failed");
      setTimeout(() => setSaveStatus(""), 1500);
    }
  };

  const removePinnedKeyPoint = async (pointId: string) => {
    if (!user) return;
    const next = pinnedKeyPoints.filter((p) => p.id !== pointId);
    setPinnedKeyPoints(next);
    try {
      await setDoc(doc(db, "users", user.uid), { pinnedKeyPoints: next }, { merge: true });
    } catch {
      setSaveStatus("Remove failed");
      setTimeout(() => setSaveStatus(""), 1500);
    }
  };

  const saveLessonTags = async (chapterId: string, tags: string[]) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, "users", user.uid), { [`noteTags.${chapterId}`]: tags });
    } catch {
      await setDoc(doc(db, "users", user.uid), { noteTags: { [chapterId]: tags } }, { merge: true });
    }
  };

  const addTagToCurrentLesson = async (rawTag: string) => {
    if (!curChapter?.id) return;
    const normalized = rawTag.trim().toLowerCase().replace(/\s+/g, "-");
    if (!normalized) return;
    const current = noteTags[curChapter.id] || [];
    if (current.includes(normalized)) return;
    const next = [...current, normalized].slice(0, 10);
    setNoteTags((prev) => ({ ...prev, [curChapter.id]: next }));
    setNewTagInput("");
    await saveLessonTags(curChapter.id, next);
  };

  const removeTagFromCurrentLesson = async (tag: string) => {
    if (!curChapter?.id) return;
    const current = noteTags[curChapter.id] || [];
    const next = current.filter((t) => t !== tag);
    setNoteTags((prev) => ({ ...prev, [curChapter.id]: next }));
    await saveLessonTags(curChapter.id, next);
  };

  const generateFlashcardsFromNote = () => {
    if (!curChapter?.id) return;
    const text = `${noteDraft || ""}`;
    const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);
    const cards: Array<{ q: string; a: string }> = [];

    lines.forEach((line) => {
      if (cards.length >= 24) return;
      if (line.includes(":")) {
        const [left, ...rightParts] = line.split(":");
        const right = rightParts.join(":").trim();
        const leftText = left.trim();
        if (leftText && right) cards.push({ q: leftText.endsWith("?") ? leftText : `What is ${leftText}?`, a: right });
        return;
      }
      if (line.includes(" - ")) {
        const [left, ...rightParts] = line.split(" - ");
        const right = rightParts.join(" - ").trim();
        const leftText = left.trim();
        if (leftText && right) cards.push({ q: `Explain ${leftText}`, a: right });
      }
    });

    if (cards.length === 0) {
      const sentences = text
        .split(/[.!?]\s+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 20);
      sentences.slice(0, 12).forEach((sentence, idx) => {
        cards.push({ q: `Recall point ${idx + 1}`, a: sentence });
      });
    }

    if (cards.length === 0) {
      setSaveStatus("Add note content first");
      setTimeout(() => setSaveStatus(""), 1500);
      return;
    }

    setFlashcardsByLesson((prev) => ({ ...prev, [curChapter.id]: cards }));
    setFlashcardIndex(0);
    setFlashcardReveal(false);
    setSaveStatus(`Generated ${cards.length} flashcards`);
    setTimeout(() => setSaveStatus(""), 1600);
  };

  const exportAllNotesMarkdown = () => {
    const sections: string[] = ["# Pajji Learn Notes", ""];
    books.forEach((book: any) => {
      const chapterSections: string[] = [];
      (book.chapters || []).forEach((chapter: any) => {
        const note = `${lessonNotes[chapter.id] || ""}`.trim();
        if (!note) return;
        const tags = noteTags[chapter.id] || [];
        chapterSections.push(`## ${chapter.title || "Untitled Lesson"}`);
        if (tags.length > 0) chapterSections.push(`Tags: ${tags.map((tag) => `#${tag}`).join(" ")}`);
        chapterSections.push("");
        chapterSections.push(note);
        chapterSections.push("");
      });
      if (chapterSections.length > 0) {
        sections.push(`## Book: ${book.title || "Untitled Book"}`);
        sections.push("");
        sections.push(...chapterSections);
      }
    });

    const finalDoc = sections.join("\n").trim();
    if (!finalDoc || finalDoc === "# Pajji Learn Notes") {
      setSaveStatus("No notes to export");
      setTimeout(() => setSaveStatus(""), 1500);
      return;
    }

    const today = getLocalDateKey();
    const blob = new Blob([`${finalDoc}\n`], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pajji-notes-${today}.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (!achievementToast) return;
    playVictoryTone();
    const timer = setTimeout(() => setAchievementToast(""), 3500);
    return () => clearTimeout(timer);
  }, [achievementToast]);
  useEffect(() => {
    if (!masteryConfetti) return;
    const timer = setTimeout(() => setMasteryConfetti(false), 1700);
    return () => clearTimeout(timer);
  }, [masteryConfetti]);
  useEffect(() => {
    if (!fireworksMode) return;
    const timer = setTimeout(() => setFireworksMode(false), 1800);
    return () => clearTimeout(timer);
  }, [fireworksMode]);
  useEffect(() => {
    if (!themeUnlockShowcase) return;
    const timer = setTimeout(() => setThemeUnlockShowcase(null), 2800);
    return () => clearTimeout(timer);
  }, [themeUnlockShowcase]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("studyReminderEnabled");
    setReminderEnabled(stored === "1");
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("studyReminderEnabled", reminderEnabled ? "1" : "0");
  }, [reminderEnabled]);

  useEffect(() => {
    if (!user || !reminderEnabled) return;
    const tick = () => {
      if (typeof Notification === "undefined") return;
      if (Notification.permission !== "granted") return;
      const today = getLocalDateKey();
      const done = dailyProgressDate === today ? dailyCompleted : 0;
      if (done >= dailyGoal) return;
      const hour = new Date().getHours();
      if (hour < 17 || hour > 22) return;
      const reminderKey = `studyReminderSent:${today}`;
      if (window.localStorage.getItem(reminderKey) === "1") return;
      new Notification("Pajji Learn Reminder", {
        body: `You are at ${done}/${dailyGoal} lessons today. Keep your streak alive.`
      });
      window.localStorage.setItem(reminderKey, "1");
    };
    const interval = window.setInterval(tick, 60000);
    tick();
    return () => window.clearInterval(interval);
  }, [user, reminderEnabled, dailyCompleted, dailyGoal, dailyProgressDate]);

  useEffect(() => {
    if (!curChapter?.id) return;
    const currentNote = lessonNotes[curChapter.id] || "";
    setNoteDraft(currentNote);
    lastSavedNoteRef.current = currentNote;
    setNoteSavedAt("");
  }, [curChapter?.id, lessonNotes]);

  useEffect(() => {
    if (view !== "study" || activeTab !== "My Notes" || !user || !curChapter?.id) return;
    if (noteDraft === lastSavedNoteRef.current) return;
    if (noteAutosaveTimerRef.current) clearTimeout(noteAutosaveTimerRef.current);
    noteAutosaveTimerRef.current = setTimeout(() => {
      saveCurrentNote();
    }, 1200);
    return () => {
      if (noteAutosaveTimerRef.current) clearTimeout(noteAutosaveTimerRef.current);
    };
  }, [view, activeTab, user, curChapter?.id, noteDraft]);

  useEffect(() => {
    if (view !== "edit" || !tempChapter || !isOwner || !curBook) return;
    const payload = JSON.stringify(tempChapter);
    if (!payload || payload === lastAutosavePayloadRef.current) return;
    const timer = setTimeout(async () => {
      await saveAllChanges(true);
      lastAutosavePayloadRef.current = payload;
      setSaveStatus("Auto-saved");
      setTimeout(() => setSaveStatus(""), 1200);
    }, 2200);
    return () => clearTimeout(timer);
  }, [view, tempChapter, isOwner, curBook]);

  const liveAchievementIds = getAchievementIds({
    completedCount: completedLessons.length,
    xp: userXP,
    streak: streakCount,
    dailyGoalHits
  });
  const allUnlockedAchievementIds = Array.from(new Set([...unlockedAchievements, ...liveAchievementIds]));
  const achievementProgressList = achievementCatalog.map((a) => {
    const { progress, target } = getAchievementProgress(a.id, {
      completedCount: completedLessons.length,
      xp: userXP,
      streak: streakCount,
      dailyGoalHits,
    });
    return { ...a, progress, target, unlocked: allUnlockedAchievementIds.includes(a.id) };
  });
  const nextAchievement = achievementProgressList.find(a => !a.unlocked);
  const todayKey = getLocalDateKey();
  const todayCompletedCount = dailyProgressDate === todayKey ? dailyCompleted : 0;
  const goalProgressPct = Math.min(100, Math.round((todayCompletedCount / Math.max(1, dailyGoal)) * 100));
  const recentQuizAttempts = quizAttempts.slice(-5).reverse();
  const recentPinnedPoints = pinnedKeyPoints.slice(0, 6);
  const lessonPinnedPoints = curChapter ? pinnedKeyPoints.filter((p) => p.lessonId === curChapter.id).slice(0, 6) : [];
  const currentLessonTags = curChapter ? (noteTags[curChapter.id] || []) : [];
  const quickTagOptions = ["important", "exam", "doubt", "revise"];
  const availableNoteTags = Array.from(new Set(Object.values(noteTags).flat())).sort();
  const normalizedNotesSearch = notesSearch.trim().toLowerCase();
  const allNotesEntries = Object.entries(lessonNotes)
    .filter(([, note]) => `${note || ""}`.trim().length > 0)
    .map(([lessonId, note]) => {
      const lesson = getLessonById(lessonId);
      return {
        lessonId,
        note,
        lessonTitle: lesson?.chapter?.title || "Unknown Lesson",
        bookTitle: lesson?.book?.title || "Unknown Book",
        lesson,
        tags: noteTags[lessonId] || []
      };
    })
    .filter((item) => {
      if (!normalizedNotesSearch) return true;
      const hay = `${item.lessonTitle} ${item.bookTitle} ${item.note} ${(item.tags || []).join(" ")}`.toLowerCase();
      return hay.includes(normalizedNotesSearch);
    })
    .filter((item) => {
      if (notesTagFilter === "all") return true;
      return (item.tags || []).includes(notesTagFilter);
    });
  const lessonFlashcards = curChapter ? (flashcardsByLesson[curChapter.id] || []) : [];
  const bestQuizScore = quizAttempts.length > 0
    ? Math.max(...quizAttempts.map((a: any) => Math.round(((a.score || 0) / Math.max(1, a.total || 1)) * 100)))
    : 0;
  const getLessonAttemptSeries = (lessonId: string) =>
    quizAttempts
      .filter((a: any) => a.lessonId === lessonId)
      .slice(-5)
      .map((a: any) => Number(a.accuracy || 0));
  const getBookAttemptInsights = (book: any) => {
    const chapterIds = new Set((book.chapters || []).map((ch: any) => ch.id));
    const attempts = quizAttempts.filter((a: any) => chapterIds.has(a.lessonId));
    const weakCount = (book.chapters || []).filter((ch: any) => weakLessonIds.includes(ch.id)).length;
    const avgAccuracy = attempts.length > 0
      ? Math.round(attempts.reduce((sum: number, a: any) => sum + Number(a.accuracy || 0), 0) / attempts.length)
      : null;
    const trend = attempts.slice(-5).map((a: any) => Number(a.accuracy || 0));
    return { attemptsCount: attempts.length, weakCount, avgAccuracy, trend };
  };

  useEffect(() => {
    if (view !== "study" || activeTab !== "Quiz" || !curChapter) return;
    const quiz = normalizeQuiz(curChapter);
    if (quiz.length === 0) return;
    const sourceIndices = quizActiveIndices && quizActiveIndices.length > 0
      ? quizActiveIndices
      : quiz.map((_: any, idx: number) => idx);
    const sourceSet = new Set(sourceIndices);
    const orderedFromState = quizQuestionOrder.filter((idx: number) => sourceSet.has(idx));
    const missingIndices = sourceIndices.filter((idx: number) => !orderedFromState.includes(idx));
    const orderedQuestionIndices = [...orderedFromState, ...missingIndices];
    const maxPos = orderedQuestionIndices.length - 1;

    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase() || "";
      const isTypingField = tag === "input" || tag === "textarea" || tag === "select";
      if (isTypingField) return;

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setCurrentQuizPos((prev) => Math.max(0, prev - 1));
        return;
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        setCurrentQuizPos((prev) => Math.min(maxPos, prev + 1));
        return;
      }
      if (event.key === "Enter") {
        event.preventDefault();
        submitQuiz();
        return;
      }
      if (event.key.toLowerCase() === "r") {
        event.preventDefault();
        startQuizAttempt(curChapter, sourceIndices);
        return;
      }
      if (event.key === "?") {
        event.preventDefault();
        setShowShortcuts((prev) => !prev);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [view, activeTab, curChapter, quizActiveIndices, quizQuestionOrder, submitQuiz]);

  const getUserName = (u: any) => u?.isAnonymous ? "Guest User" : u?.email?.split('@')[0] || "User";
  const userLevel = Math.floor(userXP / 500) + 1;

  const IconHome = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
  const IconBook = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>;
  const IconTrophy = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>;
  const IconSettings = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a1 1 0 0 1 .97.757l.26 1.04a7.97 7.97 0 0 1 1.8.75l.92-.54a1 1 0 0 1 1.23.17l1.41 1.41a1 1 0 0 1 .17 1.23l-.54.92c.31.57.56 1.17.75 1.8l1.04.26A1 1 0 0 1 21 12a1 1 0 0 1-.76.97l-1.03.26a7.97 7.97 0 0 1-.75 1.8l.54.92a1 1 0 0 1-.17 1.23l-1.41 1.41a1 1 0 0 1-1.23.17l-.92-.54a7.97 7.97 0 0 1-1.8.75l-.26 1.04A1 1 0 0 1 12 21a1 1 0 0 1-.97-.76l-.26-1.03a7.97 7.97 0 0 1-1.8-.75l-.92.54a1 1 0 0 1-1.23-.17l-1.41-1.41a1 1 0 0 1-.17-1.23l.54-.92a7.97 7.97 0 0 1-.75-1.8l-1.04-.26A1 1 0 0 1 3 12a1 1 0 0 1 .76-.97l1.03-.26c.19-.63.44-1.23.75-1.8l-.54-.92a1 1 0 0 1 .17-1.23l1.41-1.41a1 1 0 0 1 1.23-.17l.92.54c.57-.31 1.17-.56 1.8-.75l.26-1.04A1 1 0 0 1 12 3z"/><circle cx="12" cy="12" r="3.2"/></svg>;

  const isHexColor = (value: string) => /^#([0-9a-fA-F]{6})$/.test(value || "");
  const hexToRgb = (hex: string) => {
    if (!isHexColor(hex)) return null;
    const clean = hex.slice(1);
    return {
      r: parseInt(clean.slice(0, 2), 16),
      g: parseInt(clean.slice(2, 4), 16),
      b: parseInt(clean.slice(4, 6), 16),
    };
  };
  const hexToRgba = (hex: string, alpha: number) => {
    const rgb = hexToRgb(hex);
    if (!rgb) return `rgba(16,185,129,${alpha})`;
    return `rgba(${rgb.r},${rgb.g},${rgb.b},${alpha})`;
  };
  const getContrastText = (hex: string) => {
    const rgb = hexToRgb(hex);
    if (!rgb) return "#f8fafc";
    const luminance = (0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b) / 255;
    return luminance > 0.55 ? "#0f172a" : "#f8fafc";
  };
  const themeAchievementRequirements: Record<string, string> = {
    ocean: "five_masteries",
    sunset: "streak_7",
    cyber: "xp_1000",
    nebula: "streak_21",
    emerald: "xp_10000",
    arctic: "hundred_masteries",
  };
  const getThemeAchievementRequirement = (themeId: string) => themeAchievementRequirements[themeId] || "";
  const getAchievementTitleById = (achievementId: string) =>
    achievementCatalog.find((a) => a.id === achievementId)?.title || achievementId;
  const isThemeAdminOnly = (themeId: string) => adminOnlyThemeIds.includes(themeId);
  const hasThemeAccess = (themeId: string) => {
    const adminAccess = !isThemeAdminOnly(themeId) || isOwner || giftedThemes.includes(themeId);
    const requiredAchievementId = getThemeAchievementRequirement(themeId);
    const achievementAccess = !requiredAchievementId || isOwner || allUnlockedAchievementIds.includes(requiredAchievementId);
    return adminAccess && achievementAccess;
  };
  const builtInThemeCards: ThemePreview[] = [
    { key: "default", label: "Default", accent: "#10b981", bg: "linear-gradient(135deg,#f8fafc,#ecfeff)", source: "builtIn" },
    { key: "f1", label: "F1", accent: "#e10600", bg: "linear-gradient(135deg,#0b0b0c,#2a2a2e)", source: "builtIn" },
    { key: "liquid", label: "Glass", accent: "#45b7ff", bg: "linear-gradient(135deg,#dff3ff,#f3f8ff)", source: "builtIn" },
    { key: "amoled", label: "AMOLED", accent: "#29f2a3", bg: "linear-gradient(135deg,#000,#0b0b0b)", source: "builtIn" },
    { key: "paper", label: "Paper", accent: "#6e5435", bg: "linear-gradient(135deg,#f6efe2,#fffaf1)", source: "builtIn" },
    { key: "ocean", label: "Ocean", accent: "#0ea5e9", bg: "linear-gradient(135deg,#e0f2fe,#cffafe)", source: "builtIn" },
    { key: "sunset", label: "Sunset", accent: "#f97316", bg: "linear-gradient(135deg,#fff3ec,#ffe4e6)", source: "builtIn" },
    { key: "cyber", label: "Cyber", accent: "#22d3ee", bg: "linear-gradient(135deg,#0f172a,#1e293b)", source: "builtIn" },
    { key: "emoji", label: "Emoji Party 🎉", accent: "#f59e0b", bg: "linear-gradient(135deg,#fff7ed,#ffedd5)", source: "builtIn" },
    { key: "nebula", label: "Nebula", accent: "#a78bfa", bg: "linear-gradient(135deg,#1b1038,#2f1f69)", source: "builtIn" },
    { key: "emerald", label: "Emerald", accent: "#22c55e", bg: "linear-gradient(135deg,#022c22,#14532d)", source: "builtIn" },
    { key: "arctic", label: "Arctic", accent: "#38bdf8", bg: "linear-gradient(135deg,#dbeafe,#ecfeff)", source: "builtIn" },
  ];
  const customThemeCards: ThemePreview[] = customThemes.map((t) => ({
    key: t.id,
    label: t.name || "Custom Theme",
    accent: t.accent || "#10b981",
    bg: `linear-gradient(135deg, ${t.background || "#0f172a"}, ${t.primary || "#1e293b"})`,
    source: "custom",
  }));
  const themePreviewCards = [...builtInThemeCards, ...customThemeCards].map((item) => ({
    ...item,
    isAdminOnly: isThemeAdminOnly(item.key),
  }));
  const visibleThemePreviewCards = isOwner
    ? themePreviewCards
    : themePreviewCards.filter((item) => !isThemeAdminOnly(item.key) || giftedThemes.includes(item.key));
  const selectedThemeCard = themePreviewCards.find((t) => t.key === uiTheme);
  const selectedThemeAchievementId = getThemeAchievementRequirement(uiTheme);
  const uiThemeLabel = selectedThemeCard
    ? `${selectedThemeCard.label}${selectedThemeCard.isAdminOnly ? " (ADMIN)" : ""}${selectedThemeAchievementId ? " (ACHIEVEMENT)" : ""}`
    : "Default Theme";
  const uiThemeClass = uiTheme === "f1"
    ? "theme-f1"
    : uiTheme === "liquid"
      ? "theme-liquid"
      : uiTheme === "amoled"
        ? "theme-amoled"
        : uiTheme === "paper"
          ? "theme-paper"
          : uiTheme === "ocean"
            ? "theme-ocean"
            : uiTheme === "sunset"
              ? "theme-sunset"
              : uiTheme === "cyber"
                ? "theme-cyber"
                : uiTheme === "emoji"
                  ? "theme-emoji"
                : uiTheme === "nebula"
                  ? "theme-nebula"
                  : uiTheme === "emerald"
                    ? "theme-emerald"
                    : uiTheme === "arctic"
                      ? "theme-arctic"
                : themePreviewCards.some((t) => t.key === uiTheme && t.source === "custom")
                  ? "theme-custom"
                  : "theme-default";
  const textSizeClass = textSize === "compact" ? "text-size-compact" : textSize === "large" ? "text-size-large" : "text-size-default";
  const motionClass = reduceMotion ? "motion-reduced" : "motion-normal";
  const contrastClass = highContrast ? "contrast-high" : "contrast-normal";
  const densityClass = sidebarDensity === "compact" ? "density-compact" : "density-comfortable";
  const activeCustomTheme = customThemes.find((t) => t.id === uiTheme);
  const customThemeVars = activeCustomTheme
    ? (() => {
        const bg = isHexColor(activeCustomTheme.background) ? activeCustomTheme.background : "#0f172a";
        const primary = isHexColor(activeCustomTheme.primary) ? activeCustomTheme.primary : "#1e293b";
        const accent = isHexColor(activeCustomTheme.accent) ? activeCustomTheme.accent : "#10b981";
        const text = getContrastText(primary);
        const muted = text === "#0f172a" ? "#475569" : "#94a3b8";
        return {
          "--bg": bg,
          "--side": bg,
          "--card": primary,
          "--text": text,
          "--muted": muted,
          "--accent": accent,
          "--accent-grad": `linear-gradient(90deg, ${accent}, ${accent})`,
          "--accent-soft": hexToRgba(accent, text === "#0f172a" ? 0.2 : 0.18),
          "--border": hexToRgba(text === "#0f172a" ? "#0f172a" : "#f8fafc", text === "#0f172a" ? 0.12 : 0.14),
          "--input-bg": hexToRgba(text === "#0f172a" ? "#0f172a" : "#f8fafc", text === "#0f172a" ? 0.06 : 0.08),
          "--danger": "#ef4444",
          "--danger-rgb": "239,68,68",
          "--warning": "#f59e0b",
          "--info": accent,
        } as Record<string, string>;
      })()
    : undefined;
  useEffect(() => {
    if (!uiTheme) return;
    if (!hasThemeAccess(uiTheme)) {
      setUiTheme("default");
      const requiredAchievementId = getThemeAchievementRequirement(uiTheme);
      if (requiredAchievementId && !isOwner && !allUnlockedAchievementIds.includes(requiredAchievementId)) {
        setSaveStatus(`Theme locked: unlock "${getAchievementTitleById(requiredAchievementId)}".`);
      } else {
        setSaveStatus("This theme is admin-only.");
      }
      setTimeout(() => setSaveStatus(""), 1800);
    }
  }, [uiTheme, isOwner, giftedThemes, adminOnlyThemeIds, allUnlockedAchievementIds]);
  const resetAllSettings = async () => {
    setTheme("dark");
    setUiTheme("default");
    setTextSize("default");
    setReduceMotion(false);
    setHighContrast(false);
    setSidebarDensity("comfortable");
    setMobileQuickSettings(true);
    setSaveStatus("Settings reset");
    setTimeout(() => setSaveStatus(""), 1500);
  };
  const applyThemePreset = (preset: "study" | "night" | "focus") => {
    if (preset === "study") {
      setTheme("light");
      setUiTheme("paper");
      setTextSize("default");
      setReduceMotion(false);
      setHighContrast(false);
      setSidebarDensity("comfortable");
      return;
    }
    if (preset === "night") {
      setTheme("dark");
      setUiTheme("amoled");
      setTextSize("default");
      setReduceMotion(true);
      setHighContrast(true);
      setSidebarDensity("compact");
      return;
    }
    setTheme("dark");
    setUiTheme("cyber");
    setTextSize("compact");
    setReduceMotion(true);
    setHighContrast(true);
    setSidebarDensity("compact");
  };
  const toggleThemeAdminOnly = async (themeId: string, makeAdminOnly: boolean) => {
    if (!isOwner) return;
    try {
      const snap = await getDoc(THEME_CONFIG_DOC);
      const data = snap.exists() ? snap.data() : {};
      const themeConfig = (data?.themeConfig && typeof data.themeConfig === "object") ? data.themeConfig : {};
      const currentIds = Array.isArray((themeConfig as any)?.adminOnlyThemeIds)
        ? (themeConfig as any).adminOnlyThemeIds.filter((id: any) => typeof id === "string")
        : [];
      const nextIds = makeAdminOnly
        ? Array.from(new Set([...currentIds, themeId]))
        : currentIds.filter((id: string) => id !== themeId);
      await setDoc(THEME_CONFIG_DOC, { themeConfig: { ...themeConfig, adminOnlyThemeIds: nextIds } }, { merge: true });
      setSaveStatus(makeAdminOnly ? "Theme marked admin-only" : "Theme open to all");
      setTimeout(() => setSaveStatus(""), 1400);
    } catch (e) {
      console.error(e);
      setSaveStatus("Failed to update theme access");
      setTimeout(() => setSaveStatus(""), 1600);
    }
  };
  const searchUsersForThemeGift = async () => {
    if (!isOwner) return;
    const q = giftUserSearch.trim().toLowerCase();
    if (!q) {
      setGiftUserResults([]);
      return;
    }
    try {
      const snap = await getDocs(query(collection(db, "users"), limit(200)));
      const matches = snap.docs
        .map((d) => ({ id: d.id, email: `${d.data()?.email || ""}`.trim() }))
        .filter((u) => !!u.email && u.email.toLowerCase().includes(q))
        .slice(0, 20);
      setGiftUserResults(matches);
    } catch (e) {
      console.error(e);
      setSaveStatus("User search failed");
      setTimeout(() => setSaveStatus(""), 1600);
    }
  };
  const giftThemeToUser = async () => {
    if (!isOwner || !giftTargetUserId || !giftThemeId) return;
    try {
      await setDoc(doc(db, "users", giftTargetUserId), {
        giftedThemes: arrayUnion(giftThemeId),
      }, { merge: true });
      setSaveStatus("Theme gifted");
      setTimeout(() => setSaveStatus(""), 1500);
    } catch (e) {
      console.error(e);
      setSaveStatus("Failed to gift theme");
      setTimeout(() => setSaveStatus(""), 1600);
    }
  };
  const createCustomTheme = async () => {
    if (!isOwner) return;
    const name = newThemeName.trim();
    if (!name) {
      setSaveStatus("Theme name required");
      setTimeout(() => setSaveStatus(""), 1300);
      return;
    }
    if (!isHexColor(newThemeBackground) || !isHexColor(newThemePrimary) || !isHexColor(newThemeAccent)) {
      setSaveStatus("Use hex colors like #0f172a");
      setTimeout(() => setSaveStatus(""), 1500);
      return;
    }
    const nextTheme: CustomTheme = {
      id: `custom-${Date.now()}`,
      name,
      background: newThemeBackground,
      primary: newThemePrimary,
      accent: newThemeAccent,
      adminOnly: newThemeAdminOnly,
      createdBy: user?.email || user?.uid || "",
      createdAt: new Date().toISOString(),
    };
    try {
      const snap = await getDoc(THEME_CONFIG_DOC);
      const data = snap.exists() ? snap.data() : {};
      const themeConfig = (data?.themeConfig && typeof data.themeConfig === "object") ? data.themeConfig : {};
      const currentThemes = Array.isArray((themeConfig as any)?.customThemes)
        ? (themeConfig as any).customThemes.filter((t: any) => t && typeof t.id === "string")
        : [];
      const currentAdminIds = Array.isArray((themeConfig as any)?.adminOnlyThemeIds)
        ? (themeConfig as any).adminOnlyThemeIds.filter((id: any) => typeof id === "string")
        : [];
      const nextAdminIds = newThemeAdminOnly
        ? Array.from(new Set([...currentAdminIds, nextTheme.id]))
        : currentAdminIds.filter((id: string) => id !== nextTheme.id);
      await setDoc(THEME_CONFIG_DOC, {
        themeConfig: {
          ...themeConfig,
          customThemes: [...currentThemes, nextTheme],
          adminOnlyThemeIds: nextAdminIds,
        },
      }, { merge: true });
      setNewThemeName("");
      setNewThemeBackground("#0f172a");
      setNewThemePrimary("#1e293b");
      setNewThemeAccent("#10b981");
      setNewThemeAdminOnly(false);
      setSaveStatus("Custom theme created");
      setTimeout(() => setSaveStatus(""), 1600);
    } catch (e) {
      console.error(e);
      setSaveStatus("Theme creation failed");
      setTimeout(() => setSaveStatus(""), 1600);
    }
  };

  if (loading) return <div style={{height: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: theme === 'dark' ? "#0f172a" : "#f8fafc", color: "var(--accent)", fontWeight: "900"}}>PAJJI LEARN...</div>;

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
    <div className={`app-container ${theme} ${uiThemeClass} ${textSizeClass} ${motionClass} ${contrastClass} ${densityClass}`} style={customThemeVars as any}>
      <style>{`
        :root {
          --accent: #10b981;
          --accent-rgb: 16, 185, 129;
          --accent-soft: rgba(16, 185, 129, 0.15);
          --accent-soft-strong: rgba(16, 185, 129, 0.25);
          --accent-grad: linear-gradient(90deg, #10b981, #34d399);
          --brand-gradient: linear-gradient(135deg, #059669, #10b981);
          --card-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
          --info: #3b82f6;
          --warning: #f59e0b;
          --danger: #ef4444;
          --danger-rgb: 239, 68, 68;
        }
        .theme-default {
          --accent: #10b981;
          --accent-rgb: 16, 185, 129;
          --accent-soft: rgba(16, 185, 129, 0.2);
          --accent-soft-strong: rgba(16, 185, 129, 0.32);
          --accent-grad: linear-gradient(90deg, #059669, #10b981 55%, #34d399);
          --brand-gradient: linear-gradient(130deg, #047857 0%, #10b981 60%, #34d399 115%);
          --card-shadow: 0 12px 30px rgba(2, 44, 34, 0.16);
          --info: #3b82f6;
          --warning: #f59e0b;
          --danger: #ef4444;
          --danger-rgb: 239, 68, 68;
        }
        .theme-f1 {
          --accent: #e10600;
          --accent-rgb: 225, 6, 0;
          --accent-soft: rgba(225, 6, 0, 0.14);
          --accent-soft-strong: rgba(225, 6, 0, 0.28);
          --accent-grad: linear-gradient(90deg, #e10600, #ff4a43);
          --brand-gradient: linear-gradient(130deg, #0b0b0c 0%, #1f1f22 48%, #e10600 128%);
          --card-shadow: 0 12px 34px rgba(0, 0, 0, 0.32);
          --info: var(--accent);
          --warning: var(--accent);
          --danger: #ff6b6b;
          --danger-rgb: 255, 107, 107;
        }
        .theme-liquid {
          --accent: #45b7ff;
          --accent-rgb: 69, 183, 255;
          --accent-soft: rgba(69, 183, 255, 0.18);
          --accent-soft-strong: rgba(69, 183, 255, 0.3);
          --accent-grad: linear-gradient(90deg, #5ed0ff, #67b7ff);
          --brand-gradient: linear-gradient(130deg, rgba(87, 198, 255, 0.9), rgba(115, 167, 255, 0.75));
          --card-shadow: 0 16px 34px rgba(22, 48, 90, 0.16);
          --info: var(--accent);
          --warning: var(--accent);
          --danger: #ff6b88;
          --danger-rgb: 255, 107, 136;
        }
        .theme-amoled {
          --accent: #29f2a3;
          --accent-rgb: 41, 242, 163;
          --accent-soft: rgba(41, 242, 163, 0.16);
          --accent-soft-strong: rgba(41, 242, 163, 0.28);
          --accent-grad: linear-gradient(90deg, #12d98e, #29f2a3);
          --brand-gradient: linear-gradient(120deg, #020202, #0f0f10 55%, #19a873 130%);
          --card-shadow: 0 10px 28px rgba(0, 0, 0, 0.52);
          --info: var(--accent);
          --warning: var(--accent);
          --danger: #ff5f5f;
          --danger-rgb: 255, 95, 95;
        }
        .theme-paper {
          --accent: #5f4b32;
          --accent-rgb: 95, 75, 50;
          --accent-soft: rgba(95, 75, 50, 0.15);
          --accent-soft-strong: rgba(95, 75, 50, 0.25);
          --accent-grad: linear-gradient(90deg, #6e5435, #8b6a42);
          --brand-gradient: linear-gradient(120deg, #c9b08b, #efe2c9);
          --card-shadow: 0 6px 22px rgba(88, 66, 38, 0.12);
          --info: var(--accent);
          --warning: var(--accent);
          --danger: #c65a3a;
          --danger-rgb: 198, 90, 58;
        }
        .theme-ocean {
          --accent: #0ea5e9;
          --accent-rgb: 14, 165, 233;
          --accent-soft: rgba(14, 165, 233, 0.15);
          --accent-soft-strong: rgba(14, 165, 233, 0.3);
          --accent-grad: linear-gradient(90deg, #0ea5e9, #06b6d4);
          --brand-gradient: linear-gradient(130deg, #0b3f6f, #0ea5e9 80%, #67e8f9 140%);
          --card-shadow: 0 10px 30px rgba(7, 48, 86, 0.24);
          --info: var(--accent);
          --warning: var(--accent);
          --danger: #fb7185;
          --danger-rgb: 251, 113, 133;
        }
        .theme-sunset {
          --accent: #f97316;
          --accent-rgb: 249, 115, 22;
          --accent-soft: rgba(249, 115, 22, 0.16);
          --accent-soft-strong: rgba(249, 115, 22, 0.3);
          --accent-grad: linear-gradient(90deg, #f97316, #ef4444);
          --brand-gradient: linear-gradient(130deg, #7c2d12, #fb7185 70%, #f59e0b 135%);
          --card-shadow: 0 10px 30px rgba(124, 45, 18, 0.22);
          --info: var(--accent);
          --warning: var(--accent);
          --danger: #dc2626;
          --danger-rgb: 220, 38, 38;
        }
        .theme-cyber {
          --accent: #22d3ee;
          --accent-rgb: 34, 211, 238;
          --accent-soft: rgba(34, 211, 238, 0.15);
          --accent-soft-strong: rgba(34, 211, 238, 0.3);
          --accent-grad: linear-gradient(90deg, #22d3ee, #a3e635);
          --brand-gradient: linear-gradient(130deg, #0a0f1f, #1e293b 58%, #22d3ee 125%);
          --card-shadow: 0 12px 32px rgba(8, 13, 28, 0.4);
          --info: var(--accent);
          --warning: var(--accent);
          --danger: #fb7185;
          --danger-rgb: 251, 113, 133;
        }
        .theme-emoji {
          --accent: #f59e0b;
          --accent-rgb: 245, 158, 11;
          --accent-soft: rgba(245, 158, 11, 0.18);
          --accent-soft-strong: rgba(245, 158, 11, 0.32);
          --accent-grad: linear-gradient(90deg, #f59e0b, #fb7185);
          --brand-gradient: linear-gradient(130deg, #f97316, #f59e0b 45%, #fb7185 100%);
          --card-shadow: 0 12px 34px rgba(124, 45, 18, 0.2);
          --info: #f59e0b;
          --warning: #f97316;
          --danger: #ef4444;
          --danger-rgb: 239, 68, 68;
        }
        .theme-nebula {
          --accent: #a78bfa;
          --accent-rgb: 167, 139, 250;
          --accent-soft: rgba(167, 139, 250, 0.17);
          --accent-soft-strong: rgba(167, 139, 250, 0.3);
          --accent-grad: linear-gradient(90deg, #8b5cf6, #a78bfa);
          --brand-gradient: linear-gradient(130deg, #120b2f, #2f1f69 62%, #6d28d9 128%);
          --card-shadow: 0 12px 34px rgba(20, 12, 44, 0.36);
          --info: var(--accent);
          --warning: var(--accent);
          --danger: #fb7185;
          --danger-rgb: 251, 113, 133;
        }
        .theme-emerald {
          --accent: #22c55e;
          --accent-rgb: 34, 197, 94;
          --accent-soft: rgba(34, 197, 94, 0.16);
          --accent-soft-strong: rgba(34, 197, 94, 0.3);
          --accent-grad: linear-gradient(90deg, #16a34a, #22c55e);
          --brand-gradient: linear-gradient(130deg, #022c22, #14532d 65%, #16a34a 130%);
          --card-shadow: 0 12px 30px rgba(4, 45, 33, 0.3);
          --info: var(--accent);
          --warning: var(--accent);
          --danger: #f87171;
          --danger-rgb: 248, 113, 113;
        }
        .theme-arctic {
          --accent: #38bdf8;
          --accent-rgb: 56, 189, 248;
          --accent-soft: rgba(56, 189, 248, 0.18);
          --accent-soft-strong: rgba(56, 189, 248, 0.3);
          --accent-grad: linear-gradient(90deg, #0ea5e9, #38bdf8);
          --brand-gradient: linear-gradient(130deg, #cffafe, #dbeafe 62%, #7dd3fc 128%);
          --card-shadow: 0 10px 28px rgba(30, 64, 175, 0.14);
          --info: var(--accent);
          --warning: var(--accent);
          --danger: #ef4444;
          --danger-rgb: 239, 68, 68;
        }
        .dark { 
          --bg: #020617; 
          --side: #0f172a; 
          --card: #1e293b; 
          --text: #f8fafc; 
          --muted: #94a3b8; 
          --border: rgba(255, 255, 255, 0.08); 
          --input-bg: rgba(0, 0, 0, 0.2); 
        }
        .theme-default.dark {
          --bg: #04140f;
          --side: #072017;
          --card: #0a2a1f;
          --text: #eafff7;
          --muted: #9adbc6;
          --border: rgba(52, 211, 153, 0.2);
          --input-bg: #0f3327;
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
        .theme-default.light {
          --bg: #effcf6;
          --side: #f7fffb;
          --card: #ffffff;
          --text: #063026;
          --muted: #2b6b57;
          --border: rgba(16, 185, 129, 0.16);
          --input-bg: #e6f8ef;
        }
        .theme-f1.dark {
          --bg: #090909;
          --side: #101012;
          --card: #16161a;
          --text: #f5f5f5;
          --muted: #a5a5ac;
          --border: rgba(225, 6, 0, 0.22);
          --input-bg: #1d1d22;
        }
        .theme-liquid.dark {
          --bg: #0b1220;
          --side: rgba(20, 33, 56, 0.56);
          --card: rgba(21, 34, 56, 0.46);
          --text: #eef4ff;
          --muted: #adc3e8;
          --border: rgba(147, 192, 255, 0.28);
          --input-bg: rgba(18, 34, 61, 0.5);
        }
        .theme-amoled.dark {
          --bg: #000000;
          --side: #000000;
          --card: #000000;
          --text: #f3f4f6;
          --muted: #9ca3af;
          --border: rgba(255, 255, 255, 0.09);
          --input-bg: #000000;
        }
        .theme-paper.dark {
          --bg: #2e251d;
          --side: #3a3026;
          --card: #4a3d30;
          --text: #f4ead8;
          --muted: #d4c3a7;
          --border: rgba(244, 234, 216, 0.16);
          --input-bg: #5a4a3a;
        }
        .theme-ocean.dark {
          --bg: #031627;
          --side: #07263d;
          --card: #0b334f;
          --text: #e0f2fe;
          --muted: #93c5fd;
          --border: rgba(125, 211, 252, 0.2);
          --input-bg: #104062;
        }
        .theme-sunset.dark {
          --bg: #2f0d0d;
          --side: #3f1616;
          --card: #572323;
          --text: #fff1ea;
          --muted: #fdba74;
          --border: rgba(253, 186, 116, 0.2);
          --input-bg: #6b2d2d;
        }
        .theme-cyber.dark {
          --bg: #050816;
          --side: #0a1024;
          --card: #111933;
          --text: #ecfeff;
          --muted: #93c5fd;
          --border: rgba(34, 211, 238, 0.24);
          --input-bg: #17213f;
        }
        .theme-emoji.dark {
          --bg: #2b1204;
          --side: #3a1707;
          --card: #4a220d;
          --text: #fff7ed;
          --muted: #fdba74;
          --border: rgba(253, 186, 116, 0.24);
          --input-bg: #5a2d14;
        }
        .theme-nebula.dark {
          --bg: #090618;
          --side: #140e2f;
          --card: #1f1745;
          --text: #efe9ff;
          --muted: #c4b5fd;
          --border: rgba(167, 139, 250, 0.24);
          --input-bg: #2a215a;
        }
        .theme-emerald.dark {
          --bg: #031610;
          --side: #05241a;
          --card: #0b3a29;
          --text: #dcfce7;
          --muted: #86efac;
          --border: rgba(52, 211, 153, 0.22);
          --input-bg: #134e3a;
        }
        .theme-arctic.dark {
          --bg: #07172d;
          --side: #0b2746;
          --card: #12365f;
          --text: #e0f2fe;
          --muted: #7dd3fc;
          --border: rgba(125, 211, 252, 0.22);
          --input-bg: #164876;
        }
        .theme-f1.light {
          --bg: #f7f7f8;
          --side: #ffffff;
          --card: #ffffff;
          --text: #101013;
          --muted: #64646d;
          --border: rgba(225, 6, 0, 0.18);
          --input-bg: #f4f4f6;
        }
        .theme-liquid.light {
          --bg: #eaf4ff;
          --side: rgba(255, 255, 255, 0.62);
          --card: rgba(255, 255, 255, 0.58);
          --text: #12223a;
          --muted: #4b5f7e;
          --border: rgba(124, 168, 232, 0.35);
          --input-bg: rgba(255, 255, 255, 0.56);
        }
        .theme-amoled.light {
          --bg: #f5f5f5;
          --side: #ffffff;
          --card: #ffffff;
          --text: #101010;
          --muted: #4b5563;
          --border: rgba(0, 0, 0, 0.08);
          --input-bg: #ededed;
        }
        .theme-paper.light {
          --bg: #f6efe2;
          --side: #fff9ef;
          --card: #fffaf1;
          --text: #3f3123;
          --muted: #7c664e;
          --border: rgba(121, 95, 63, 0.2);
          --input-bg: #f2e8d5;
        }
        .theme-ocean.light {
          --bg: #eef8ff;
          --side: #f8fcff;
          --card: #ffffff;
          --text: #0f2940;
          --muted: #34658e;
          --border: rgba(52, 101, 142, 0.18);
          --input-bg: #e7f4ff;
        }
        .theme-sunset.light {
          --bg: #fff3ec;
          --side: #fff8f3;
          --card: #fffaf7;
          --text: #4a1d12;
          --muted: #9a3412;
          --border: rgba(194, 65, 12, 0.2);
          --input-bg: #ffe8d9;
        }
        .theme-cyber.light {
          --bg: #f0f9ff;
          --side: #f8fdff;
          --card: #ffffff;
          --text: #082f49;
          --muted: #0e7490;
          --border: rgba(34, 211, 238, 0.22);
          --input-bg: #e0f7ff;
        }
        .theme-emoji.light {
          --bg: #fff7ed;
          --side: #fffaf5;
          --card: #ffffff;
          --text: #7c2d12;
          --muted: #c2410c;
          --border: rgba(194, 65, 12, 0.18);
          --input-bg: #ffedd5;
        }
        .theme-nebula.light {
          --bg: #f5f3ff;
          --side: #faf7ff;
          --card: #ffffff;
          --text: #2e1065;
          --muted: #7c3aed;
          --border: rgba(124, 58, 237, 0.18);
          --input-bg: #ede9fe;
        }
        .theme-emerald.light {
          --bg: #ecfdf5;
          --side: #f7fefb;
          --card: #ffffff;
          --text: #052e16;
          --muted: #15803d;
          --border: rgba(21, 128, 61, 0.18);
          --input-bg: #dcfce7;
        }
        .theme-arctic.light {
          --bg: #f0f9ff;
          --side: #f7fcff;
          --card: #ffffff;
          --text: #0c4a6e;
          --muted: #0369a1;
          --border: rgba(3, 105, 161, 0.16);
          --input-bg: #e0f2fe;
        }
        
        .app-container { display: flex; height: 100dvh; background: var(--bg); color: var(--text); font-family: system-ui, sans-serif; transition: 0.3s; overflow-x: hidden; }
        .text-size-default { --font-scale: 1; }
        .text-size-compact { --font-scale: 0.94; }
        .text-size-large { --font-scale: 1.08; }
        .motion-reduced *, .motion-reduced *::before, .motion-reduced *::after { transition: none !important; animation: none !important; scroll-behavior: auto !important; }
        .contrast-high.dark { --muted: #e2e8f0; --border: rgba(255, 255, 255, 0.28); }
        .contrast-high.light { --muted: #334155; --border: rgba(15, 23, 42, 0.24); }
        .theme-f1 .app-container, .theme-f1.app-container {
          background-image:
            radial-gradient(circle at 0% 0%, rgba(225, 6, 0, 0.09), transparent 42%),
            radial-gradient(circle at 100% 100%, rgba(225, 6, 0, 0.06), transparent 44%);
        }
        .theme-liquid .app-container, .theme-liquid.app-container {
          background-image:
            radial-gradient(circle at 10% 0%, rgba(119, 214, 255, 0.3), transparent 42%),
            radial-gradient(circle at 95% 95%, rgba(120, 160, 255, 0.22), transparent 44%);
        }
        .theme-amoled .app-container, .theme-amoled.app-container {
          background-image: radial-gradient(circle at 100% 0%, rgba(41, 242, 163, 0.08), transparent 30%);
        }
        .theme-default .app-container, .theme-default.app-container {
          background-image:
            radial-gradient(circle at 0% 0%, rgba(16, 185, 129, 0.17), transparent 36%),
            radial-gradient(circle at 100% 100%, rgba(52, 211, 153, 0.11), transparent 42%);
        }
        .theme-paper .app-container, .theme-paper.app-container {
          background-image: radial-gradient(circle at 10% 0%, rgba(143, 112, 74, 0.11), transparent 35%);
        }
        .theme-ocean .app-container, .theme-ocean.app-container {
          background-image:
            radial-gradient(circle at 0% 0%, rgba(14, 165, 233, 0.16), transparent 36%),
            radial-gradient(circle at 100% 100%, rgba(6, 182, 212, 0.12), transparent 42%);
        }
        .theme-sunset .app-container, .theme-sunset.app-container {
          background-image:
            radial-gradient(circle at 0% 0%, rgba(249, 115, 22, 0.2), transparent 36%),
            radial-gradient(circle at 100% 100%, rgba(239, 68, 68, 0.14), transparent 40%);
        }
        .theme-cyber .app-container, .theme-cyber.app-container {
          background-image:
            radial-gradient(circle at 0% 0%, rgba(34, 211, 238, 0.16), transparent 34%),
            radial-gradient(circle at 100% 100%, rgba(163, 230, 53, 0.12), transparent 42%);
        }
        .theme-emoji .app-container, .theme-emoji.app-container {
          background-image:
            radial-gradient(circle at 0% 0%, rgba(251, 146, 60, 0.2), transparent 34%),
            radial-gradient(circle at 100% 100%, rgba(244, 114, 182, 0.14), transparent 42%);
        }
        .theme-nebula .app-container, .theme-nebula.app-container {
          background-image:
            radial-gradient(circle at 0% 0%, rgba(167, 139, 250, 0.2), transparent 34%),
            radial-gradient(circle at 100% 100%, rgba(192, 132, 252, 0.12), transparent 42%);
        }
        .theme-emerald .app-container, .theme-emerald.app-container {
          background-image:
            radial-gradient(circle at 0% 0%, rgba(34, 197, 94, 0.18), transparent 36%),
            radial-gradient(circle at 100% 100%, rgba(16, 185, 129, 0.12), transparent 40%);
        }
        .theme-arctic .app-container, .theme-arctic.app-container {
          background-image:
            radial-gradient(circle at 0% 0%, rgba(56, 189, 248, 0.18), transparent 36%),
            radial-gradient(circle at 100% 100%, rgba(125, 211, 252, 0.14), transparent 40%);
        }
        .sidebar { width: 280px; background: var(--side); border-right: 1px solid var(--border); padding: 32px 24px; display: flex; flex-direction: column; transition: 0.3s; z-index: 100; font-size: calc(1rem * var(--font-scale)); }
        .density-compact .sidebar { width: 244px; padding: 20px 14px; }
        .theme-f1 .sidebar { box-shadow: inset -1px 0 0 rgba(225, 6, 0, 0.2); }
        .theme-liquid .sidebar {
          backdrop-filter: blur(14px) saturate(1.2);
          box-shadow: inset -1px 0 0 rgba(160, 203, 255, 0.3);
        }
        .main-content { flex: 1; padding: 48px; overflow-y: auto; font-size: calc(1rem * var(--font-scale)); overflow-x: hidden; }
        .theme-f1 .main-content {
          background-image: linear-gradient(to bottom, rgba(225, 6, 0, 0.045), transparent 18%);
        }
        .theme-liquid .main-content {
          background-image: linear-gradient(to bottom, rgba(122, 178, 255, 0.16), transparent 25%);
        }
        .card {
          background: var(--card);
          border: 1px solid var(--border);
          padding: 24px;
          border-radius: 24px;
          box-shadow: var(--card-shadow);
          position: relative;
        }
        .theme-f1 .card {
          backdrop-filter: saturate(1.08);
        }
        .theme-liquid .card {
          backdrop-filter: blur(16px) saturate(1.22);
          -webkit-backdrop-filter: blur(16px) saturate(1.22);
        }
        .page-shell { max-width: 980px; margin: 0 auto; }
        .page-header { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 24px; }
        .page-title { font-size: 30px; font-weight: 900; letter-spacing: -0.02em; line-height: 1.1; margin: 0; }
        .page-subtitle { color: var(--muted); margin: 6px 0 0 0; font-size: 14px; }
        .section-title { font-size: 20px; margin: 0 0 12px 0; font-weight: 800; }
        .stack-12 { display: flex; flex-direction: column; gap: 12px; }
        .btn { border: none; border-radius: 12px; padding: 10px 16px; font-weight: 800; cursor: pointer; line-height: 1; }
        .btn-primary { background: var(--accent); color: white; box-shadow: 0 8px 16px -8px color-mix(in oklab, var(--accent) 55%, transparent); }
        .btn-secondary { background: var(--input-bg); color: var(--text); border: 1px solid var(--border); }
        .btn-danger { background: rgba(239, 68, 68, 0.12); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.25); }
        .btn-warning { background: #fbbf24; color: #111827; }
        .btn-link { background: none; border: none; color: var(--accent); font-weight: 800; cursor: pointer; padding: 0; }
        .stat-card { border-left-width: 4px; border-left-style: solid; }
        .stat-label { font-size: 11px; font-weight: 800; opacity: 0.65; text-transform: uppercase; letter-spacing: 1px; margin: 0; }
        .stat-value { font-size: 32px; margin-top: 8px; margin-bottom: 0; font-weight: 900; }
        
        .nav-btn { width: 100%; padding: 12px 16px; border: none; border-radius: 14px; cursor: pointer; font-weight: 600; text-align: left; margin-bottom: 6px; background: transparent; color: var(--muted); display: flex; align-items: center; gap: 12px; font-size: 15px; transition: 0.2s; }
        .density-compact .nav-btn { padding: 8px 10px; margin-bottom: 4px; font-size: 13px; }
        .nav-btn svg { width: 20px; height: 20px; opacity: 0.7; }
        .nav-btn:hover { background: var(--accent-soft); color: var(--accent); }
        .nav-btn.active { background: var(--accent); color: white; box-shadow: 0 10px 15px -3px color-mix(in oklab, var(--accent) 35%, transparent); }
        .nav-btn.active svg { opacity: 1; }
        .theme-default .nav-btn.active svg, .theme-paper .nav-btn.active svg {
          border: 1px solid rgba(var(--accent-rgb), 0.65);
          border-radius: 7px;
          padding: 2px;
          box-sizing: border-box;
        }
        .theme-f1 .nav-btn.active svg, .theme-liquid .nav-btn.active svg, .theme-ocean .nav-btn.active svg, .theme-sunset .nav-btn.active svg, .theme-cyber .nav-btn.active svg, .theme-amoled .nav-btn.active svg, .theme-nebula .nav-btn.active svg, .theme-emerald .nav-btn.active svg, .theme-arctic .nav-btn.active svg, .theme-emoji .nav-btn.active svg {
          background: rgba(var(--accent-rgb), 0.22);
          border-radius: 8px;
          padding: 2px;
          box-sizing: border-box;
        }
        .profile-card { background: var(--brand-gradient); padding: 18px; border-radius: 20px; color: white; margin-bottom: 24px; box-shadow: 0 10px 20px -5px color-mix(in oklab, var(--accent) 35%, transparent); }
        .theme-liquid .profile-card {
          border: 1px solid rgba(255, 255, 255, 0.26);
          backdrop-filter: blur(14px) saturate(1.2);
          -webkit-backdrop-filter: blur(14px) saturate(1.2);
        }
        
        .tab-btn { padding: 8px 16px; border: 1px solid var(--border); border-radius: 99px; background: var(--card); color: var(--muted); cursor: pointer; font-size: 13px; font-weight: 600; margin-bottom: 8px; white-space: nowrap; flex: 0 0 auto; text-align: center; transition: 0.2s; }
        .tab-btn.active { background: var(--accent); color: white; border-color: transparent; }
        
        textarea, input[type="text"], select { width: 100%; background: var(--input-bg); color: var(--text); border: 1px solid var(--border); border-radius: 16px; padding: 18px; font-family: inherit; font-size: 16px; outline: none; }
        textarea:focus, input[type="text"]:focus, select:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(var(--accent-rgb), 0.14); }
        
        .xp-badge { background: var(--accent-soft); color: var(--accent); padding: 4px 12px; border-radius: 99px; font-size: 12px; font-weight: 700; border: 1px solid rgba(var(--accent-rgb), 0.2); }
        .mobile-header { display: none; }
        .quiz-question-card { animation: fadeSlideIn 0.2s ease; }
        .achievement-confetti {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 1202;
          overflow: hidden;
        }
        .confetti-piece {
          position: absolute;
          top: -10%;
          font-size: 18px;
          animation: confettiFall 1.6s linear forwards;
        }
        .firework-burst {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 1203;
          display: grid;
          place-items: center;
          font-size: 64px;
          animation: fireworkPulse 1.6s ease-out forwards;
        }
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes confettiFall {
          0% { transform: translateY(0) rotate(0deg); opacity: 0.95; }
          100% { transform: translateY(115vh) rotate(360deg); opacity: 0; }
        }
        @keyframes fireworkPulse {
          0% { transform: scale(0.2); opacity: 0; }
          30% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        
        @media (max-width: 768px) {
          .app-container { flex-direction: column; }
          .sidebar {
            position: fixed;
            top: auto;
            bottom: calc(env(safe-area-inset-bottom, 0px) + 12px);
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
            box-sizing: border-box;
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
            color: var(--muted);
            outline: none;
            -webkit-tap-highlight-color: transparent;
          }
          .nav-btn svg { width: 22px; height: 22px; margin-bottom: 2px; }
          .nav-btn.active { color: var(--accent); }
          .nav-btn.active svg { opacity: 1; stroke-width: 2.5px; }
          
          .main-content { padding: 20px; padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 110px); overflow-x: hidden; }
          .page-shell { max-width: 100%; }
          .mobile-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding: 12px 16px; background: var(--card); border-radius: 20px; border: 1px solid var(--border); }
          .dashboard-grid { grid-template-columns: 1fr !important; gap: 12px !important; }
          .library-grid { grid-template-columns: 1fr 1fr !important; gap: 12px !important; }
          .library-tools { grid-template-columns: 1fr !important; }
          .tab-container { overflow-x: auto; padding-bottom: 10px; gap: 8px; }
          .page-title { font-size: 24px; }
        }
      `}</style>

      <div className="sidebar">
        <div className="sidebar-extras">
            <h1 style={{fontSize: "22px", fontWeight: "900", marginBottom: "32px", letterSpacing: "-0.5px"}}>PAJJI <span style={{color: "var(--accent)"}}>LEARN</span></h1>
            <div className="profile-card">
              <p style={{fontSize: "10px", fontWeight: "800", opacity: 0.8, marginBottom: "4px"}}>LEVEL {userLevel}</p>
              <h3 style={{fontSize: "15px", marginBottom: "10px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"}}>{getUserName(user)}</h3>
              <div style={{height: "6px", background: "rgba(255,255,255,0.2)", borderRadius: "10px", overflow: "hidden"}}>
                <div style={{width: `${(userXP % 500) / 5}%`, height: "100%", background: "#fff"}}></div>
              </div>
              <p style={{fontSize: "11px", marginTop: "8px", fontWeight: "700"}}>{userXP} XP</p>
            </div>
        </div>

        <nav style={{flex: 1, display: "flex", flexDirection: "inherit", gap: "4px"}}>
          <button className={`nav-btn ${view === "dashboard" ? "active" : ""}`} onClick={() => setView("dashboard")}><IconHome /> <span>Home 🏠</span></button>
          <button className={`nav-btn ${view === "library" ? "active" : ""}`} onClick={() => setView("library")}><IconBook /> <span>Library 📚</span></button>
          <button className={`nav-btn ${view === "leaderboard" ? "active" : ""}`} onClick={() => { setView("leaderboard"); fetchLeaderboard(); }}><IconTrophy /> <span>Rankings 🏆</span></button>
          <button className={`nav-btn ${view === "settings" ? "active" : ""}`} onClick={() => setView("settings")}><IconSettings /> <span>Settings ⚙️</span></button>
        </nav>
        
        <div className="sidebar-extras" style={{marginTop: "auto"}} />
      </div>

      <div className="main-content">
        <div className="mobile-header">
            <h1 style={{fontSize: "18px", fontWeight: "900", marginLeft: "4px"}}>PAJJI <span style={{color: "var(--accent)"}}>LEARN</span></h1>
            <div style={{display: "flex", gap: "12px", alignItems: "center"}}>
                <div style={{fontSize: "11px", fontWeight: "800", background: "var(--accent)", color: "white", padding: "4px 10px", borderRadius: "20px"}}>{userXP} XP</div>
                {mobileQuickSettings && (
                  <button onClick={() => setView("settings")} style={{background: "var(--input-bg)", border: "1px solid var(--border)", fontSize: "11px", fontWeight: "800", color: "var(--accent)", padding: "4px 8px", borderRadius: "14px"}}>Settings ⚙️</button>
                )}
            </div>
        </div>

        {view === "dashboard" && (
          <div className="page-shell">
            <header className="page-header" style={{marginBottom: "28px"}}>
              <div>
                <h1 className="page-title">Hello, {getUserName(user)}!</h1>
                <p className="page-subtitle">You&apos;re doing great. Keep learning!</p>
              </div>
            </header>
            <div className="dashboard-grid" style={{display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "24px", marginBottom: "40px"}}>
              <div className="card stat-card" style={{borderLeftColor: "var(--accent)"}}>
                  <p className="stat-label">Learning Points</p>
                  <h3 className="stat-value" style={{color: "var(--accent)"}}>{dataLoading ? "..." : userXP} <span style={{fontSize: "16px", opacity: 0.5}}>XP</span></h3>
              </div>
              <div className="card stat-card" style={{borderLeftColor: "var(--info)"}}>
                  <p className="stat-label">Mastered</p>
                  <h3 className="stat-value" style={{color: "var(--info)"}}>{completedLessons.length} <span style={{fontSize: "16px", opacity: 0.5}}>Lessons</span></h3>
              </div>
              <div className="card stat-card" style={{borderLeftColor: "var(--warning)"}}>
                  <p className="stat-label">Streak</p>
                  <h3 className="stat-value" style={{color: "var(--warning)"}}>
                    {streakCount}
                    <span style={{fontSize: "16px", opacity: 0.5}}>Days</span>
                  </h3>
                  <p style={{fontSize: "11px", color: "var(--muted)", marginTop: "4px"}}>{lastStudyDate ? `Last study: ${lastStudyDate}` : "Start your streak today"}</p>
              </div>
            </div>
            <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", gap: "10px", flexWrap: "wrap"}}>
              <h2 className="section-title">Continue Learning 📚</h2>
              <button onClick={startQuickReview} className="btn btn-secondary">
                {quickReviewMode ? "Quick Review Active ⚡" : "Start Quick Review ⚡"}
              </button>
            </div>
            <div className="card" style={{marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "14px", flexWrap: "wrap"}}>
              <div style={{display: "flex", gap: "12px", alignItems: "center"}}>
                <div style={{width: "68px", height: "68px", borderRadius: "999px", display: "grid", placeItems: "center", background: `conic-gradient(var(--accent) ${goalProgressPct * 3.6}deg, rgba(148, 163, 184, 0.25) 0deg)`, padding: "6px"}}>
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
            <div className="card" style={{marginBottom: "16px", display: "flex", justifyContent: "space-between", gap: "10px", alignItems: "center", flexWrap: "wrap"}}>
              <div>
                <p style={{fontSize: "11px", color: "var(--muted)", textTransform: "uppercase", fontWeight: "800"}}>Study Reminder</p>
                <p style={{fontSize: "13px", color: "var(--muted)", marginTop: "4px"}}>Get one browser reminder in the evening if your daily goal is incomplete.</p>
              </div>
              <button
                className="btn btn-secondary"
                onClick={async () => {
                  if (!reminderEnabled && typeof Notification !== "undefined" && Notification.permission !== "granted") {
                    const permission = await Notification.requestPermission();
                    if (permission !== "granted") {
                      setSaveStatus("Notification permission blocked");
                      setTimeout(() => setSaveStatus(""), 1800);
                      return;
                    }
                  }
                  setReminderEnabled((prev) => !prev);
                }}
              >
                Reminder: {reminderEnabled ? "On" : "Off"}
              </button>
            </div>
            {resumeLesson && (
              <div className="card" style={{marginBottom: "16px", borderLeft: "4px solid var(--warning)"}}>
                <p style={{fontSize: "11px", fontWeight: "900", color: "var(--warning)", textTransform: "uppercase", marginBottom: "6px"}}>Resume Last Lesson</p>
                <h3 style={{fontSize: "18px", fontWeight: "800", marginBottom: "4px"}}>{resumeLesson.chapter.title}</h3>
                <p style={{fontSize: "13px", color: "var(--muted)", marginBottom: "14px"}}>{resumeLesson.book.title}</p>
                <button onClick={() => openLesson(resumeLesson.book, resumeLesson.chapter)} className="btn btn-warning">Resume</button>
              </div>
            )}
            <div style={{display: "flex", flexDirection: "column", gap: "12px"}}>
              {getUnmastered().slice(0, 5).map(ch => (
                <div key={ch.id} className="card" style={{display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px"}}>
                  <div>
                      <p style={{fontSize: "10px", color: "var(--accent)", fontWeight: "900", textTransform: "uppercase"}}>{ch.bookTitle}</p>
                      <h3 style={{fontSize: "16px", marginTop: "4px", fontWeight: "700"}}>{ch.title}</h3>
                  </div>
                  <button onClick={() => openLesson(ch.parentBook, ch)} style={{padding: "10px 20px", background: "var(--accent)", color: "white", borderRadius: "12px", border: "none", fontWeight: "bold", cursor: "pointer", fontSize: "13px", boxShadow: "0 4px 10px rgba(var(--accent-rgb), 0.28)"}}>Start</button>
                </div>
              ))}
              {getUnmastered().length === 0 && <div className="card" style={{textAlign: "center", padding: "40px", opacity: 0.6}}>You've mastered everything! </div>}
            </div>
            <h2 style={{fontSize: "20px", marginTop: "28px", marginBottom: "14px", fontWeight: "800"}}>Achievements 🏅</h2>
            <div className="card" style={{padding: "20px"}}>
              <p style={{fontSize: "12px", fontWeight: "700", color: "var(--muted)", marginBottom: "14px"}}>{allUnlockedAchievementIds.length}/{achievementCatalog.length} unlocked</p>
              <div style={{display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "10px"}}>
                {achievementProgressList.map(a => (
                  <div key={a.id} style={{padding: "12px", borderRadius: "14px", background: a.unlocked ? "var(--accent-soft)" : "var(--input-bg)", border: a.unlocked ? "1px solid rgba(var(--accent-rgb), 0.3)" : "1px solid var(--border)", opacity: a.unlocked ? 1 : 0.88}}>
                    <p style={{fontWeight: "800", fontSize: "13px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px"}}>
                      <span>{a.title}</span>
                      <span style={{fontSize: "10px", color: a.unlocked ? "var(--accent)" : "var(--muted)"}}>{a.unlocked ? "Unlocked" : "Locked"}</span>
                    </p>
                    <p style={{fontSize: "11px", color: "var(--muted)", marginTop: "4px"}}>{a.description}</p>
                    <div style={{marginTop: "8px"}}>
                      <div style={{height: "6px", borderRadius: "8px", background: "var(--input-bg)", border: "1px solid var(--border)", overflow: "hidden"}}>
                        <div style={{height: "100%", width: `${Math.min(100, Math.round((a.progress / Math.max(1, a.target)) * 100))}%`, background: a.unlocked ? "var(--accent)" : "#64748b"}} />
                      </div>
                      <p style={{fontSize: "10px", color: "var(--muted)", marginTop: "4px"}}>{Math.min(a.progress, a.target)}/{a.target}</p>
                    </div>
                  </div>
                ))}
              </div>
              {allUnlockedAchievementIds.length === 0 && (
                <p style={{fontSize: "13px", color: "var(--muted)", marginTop: "10px"}}>No badges unlocked yet. Complete a lesson to get your first one.</p>
              )}
              {nextAchievement && (
                <div style={{marginTop: "16px", padding: "12px", border: "1px dashed var(--border)", borderRadius: "12px"}}>
                  <p style={{fontSize: "11px", fontWeight: "800", color: "var(--muted)", textTransform: "uppercase"}}>Next Target</p>
                  <p style={{fontWeight: "800", marginTop: "4px"}}>{nextAchievement.title}</p>
                  <p style={{fontSize: "12px", color: "var(--muted)", marginTop: "2px"}}>{nextAchievement.description} ({Math.min(nextAchievement.progress, nextAchievement.target)}/{nextAchievement.target})</p>
                </div>
              )}
            </div>
            <h2 style={{fontSize: "20px", marginTop: "22px", marginBottom: "12px", fontWeight: "800"}}>Quiz Attempts</h2>
            <div className="card" style={{padding: "18px"}}>
              <div style={{display: "flex", gap: "14px", flexWrap: "wrap", marginBottom: "12px"}}>
                <div style={{fontSize: "13px", color: "var(--muted)"}}>Best: <strong style={{color: "var(--text)"}}>{bestQuizScore}%</strong></div>
                <div style={{fontSize: "13px", color: "var(--muted)"}}>Weak lessons: <strong style={{color: "var(--text)"}}>{weakLessonIds.length}</strong></div>
              </div>
              {recentQuizAttempts.length === 0 ? (
                <p style={{fontSize: "13px", color: "var(--muted)"}}>No attempts yet. Submit a quiz to start tracking.</p>
              ) : (
                <div style={{display: "flex", flexDirection: "column", gap: "8px"}}>
                  {recentQuizAttempts.map((a: any, idx: number) => (
                    <div key={`${a.lessonId}-${a.createdAt}-${idx}`} style={{display: "flex", justifyContent: "space-between", gap: "10px", border: "1px solid var(--border)", borderRadius: "10px", padding: "8px 10px"}}>
                      <div style={{fontSize: "13px"}}>
                        <div style={{fontWeight: "700"}}>{a.lessonTitle || "Lesson"}</div>
                        <div style={{fontSize: "11px", color: "var(--muted)"}}>{new Date(a.createdAt).toLocaleString()}</div>
                      </div>
                      <div style={{fontWeight: "800", color: (a.accuracy || 0) >= 70 ? "var(--accent)" : "var(--danger)"}}>{a.score}/{a.total} ({a.accuracy}%)</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <h2 style={{fontSize: "20px", marginTop: "22px", marginBottom: "12px", fontWeight: "800"}}>Pinned Key Points</h2>
            <div className="card" style={{padding: "18px"}}>
              {recentPinnedPoints.length === 0 ? (
                <p style={{fontSize: "13px", color: "var(--muted)"}}>No pinned points yet. Add them from lesson notes.</p>
              ) : (
                <div style={{display: "flex", flexDirection: "column", gap: "8px"}}>
                  {recentPinnedPoints.map((point) => {
                    const lesson = getLessonById(point.lessonId);
                    return (
                      <div key={point.id} style={{display: "flex", justifyContent: "space-between", gap: "10px", border: "1px solid var(--border)", borderRadius: "10px", padding: "8px 10px"}}>
                        <div>
                          <div style={{fontWeight: "700", fontSize: "13px"}}>{point.text}</div>
                          <div style={{fontSize: "11px", color: "var(--muted)"}}>
                            {(lesson?.book?.title || "Unknown Book")} • {(lesson?.chapter?.title || "Unknown Lesson")}
                          </div>
                        </div>
                        <div style={{display: "flex", gap: "6px", alignItems: "center"}}>
                          {lesson && (
                            <button className="btn btn-secondary" style={{padding: "6px 10px"}} onClick={() => openLesson(lesson.book, lesson.chapter)}>Open</button>
                          )}
                          <button className="btn btn-danger" style={{padding: "6px 10px"}} onClick={() => removePinnedKeyPoint(point.id)}>Remove</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <h2 style={{fontSize: "20px", marginTop: "22px", marginBottom: "12px", fontWeight: "800"}}>All Notes</h2>
            <div className="card" style={{padding: "18px"}}>
              <div style={{display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap", marginBottom: "10px"}}>
                <input
                  type="text"
                  placeholder="Search across all your notes..."
                  value={notesSearch}
                  onChange={(e) => setNotesSearch(e.target.value)}
                  style={{padding: "12px", flex: 1, minWidth: "220px"}}
                />
                <button className="btn btn-secondary" onClick={exportAllNotesMarkdown}>Export All (.md)</button>
              </div>
              <div style={{display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "8px"}}>
                <button className="btn btn-secondary" onClick={() => setNotesTagFilter("all")} style={{padding: "6px 10px", background: notesTagFilter === "all" ? "var(--accent-soft)" : "var(--input-bg)"}}>All Tags</button>
                {availableNoteTags.map((tag) => (
                  <button key={`filter-${tag}`} className="btn btn-secondary" onClick={() => setNotesTagFilter(tag)} style={{padding: "6px 10px", background: notesTagFilter === tag ? "var(--accent-soft)" : "var(--input-bg)"}}>
                    #{tag}
                  </button>
                ))}
              </div>
              {allNotesEntries.length === 0 ? (
                <p style={{fontSize: "13px", color: "var(--muted)"}}>No matching notes found.</p>
              ) : (
                <div style={{display: "flex", flexDirection: "column", gap: "8px"}}>
                  {allNotesEntries.slice(0, 20).map((item) => (
                    <div key={item.lessonId} style={{border: "1px solid var(--border)", borderRadius: "10px", padding: "8px 10px"}}>
                      <div style={{display: "flex", justifyContent: "space-between", gap: "8px", alignItems: "center"}}>
                        <div>
                          <div style={{fontWeight: "700", fontSize: "13px"}}>{item.lessonTitle}</div>
                          <div style={{fontSize: "11px", color: "var(--muted)"}}>{item.bookTitle}</div>
                        </div>
                        {(() => {
                          const lessonEntry = item.lesson;
                          if (!lessonEntry) return null;
                          return <button className="btn btn-secondary" style={{padding: "6px 10px"}} onClick={() => openLesson(lessonEntry.book, lessonEntry.chapter)}>Open</button>;
                        })()}
                      </div>
                      {(item.tags || []).length > 0 && (
                        <div style={{display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "6px"}}>
                          {(item.tags || []).map((tag: string) => (
                            <span key={`${item.lessonId}-${tag}`} style={{fontSize: "10px", fontWeight: "700", padding: "2px 6px", borderRadius: "999px", border: "1px solid var(--border)", background: "var(--input-bg)"}}>
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                      <p style={{fontSize: "12px", color: "var(--muted)", marginTop: "6px", whiteSpace: "pre-wrap"}}>{`${item.note}`.slice(0, 180)}{`${item.note}`.length > 180 ? "..." : ""}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {view === "leaderboard" && (
          <div style={{maxWidth: "600px", margin: "0 auto"}}>
            <h1 style={{textAlign: "center", marginBottom: "32px", fontSize: "28px", fontWeight: "900"}}>Top Learners 🌟</h1>
            <div style={{display: "flex", justifyContent: "center", gap: "8px", marginBottom: "14px"}}>
              <button className="btn btn-secondary" onClick={() => setLeaderboardMode("all")} style={{background: leaderboardMode === "all" ? "var(--accent-soft)" : "var(--input-bg)"}}>All Time</button>
              <button className="btn btn-secondary" onClick={() => setLeaderboardMode("weekly")} style={{background: leaderboardMode === "weekly" ? "var(--accent-soft)" : "var(--input-bg)"}}>Weekly</button>
            </div>
            {(leaderboardMode === "weekly" ? weeklyLeaderboard : leaderboard).map((p, i) => (
              <div key={p.id} className="card" style={{display: "flex", alignItems: "center", marginBottom: "12px", padding: "16px 20px", borderColor: p.id === user.uid ? "var(--accent)" : "var(--border)", background: p.id === user.uid ? "var(--accent-soft)" : "var(--card)"}}>
                <span style={{width: "56px", fontWeight: "900", fontSize: "18px", color: i === 0 ? "#fbbf24" : i === 1 ? "#94a3b8" : i === 2 ? "#b45309" : "var(--muted)"}}>
                  {i === 0 ? "👑 #1" : i === 1 ? "🥈 #2" : i === 2 ? "🥉 #3" : `#${i + 1}`}
                </span>
                <div style={{flex: 1}}>
                    <span style={{fontSize: "16px", fontWeight: "700"}}>{p.email && p.email !== "guest" ? p.email.split('@')[0] : "Guest User"}</span>
                    {p.id === user.uid && <span style={{fontSize: "10px", marginLeft: "8px", background: "var(--accent)", color: "white", padding: "2px 8px", borderRadius: "10px", fontWeight: "900"}}>YOU</span>}
                </div>
                <span className="xp-badge">{leaderboardMode === "weekly" ? (p.weeklyXP || 0) : (p.xp || 0)} XP</span>
              </div>
            ))}
          </div>
        )}

        {view === "settings" && (
          <div className="page-shell" style={{maxWidth: "760px"}}>
            <div className="page-header">
              <h1 className="page-title">Settings ⚙️</h1>
            </div>
            <div className="card" style={{marginBottom: "14px"}}>
              <p style={{fontSize: "11px", color: "var(--muted)", textTransform: "uppercase", fontWeight: "800", marginBottom: "8px"}}>App Theme</p>
              <div style={{display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "10px"}}>
                <button onClick={() => applyThemePreset("study")} className="btn btn-secondary">Preset: Study</button>
                <button onClick={() => applyThemePreset("night")} className="btn btn-secondary">Preset: Night</button>
                <button onClick={() => applyThemePreset("focus")} className="btn btn-secondary">Preset: Focus</button>
              </div>
              <div style={{display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "10px"}}>
                {visibleThemePreviewCards.map((item) => {
                  const selected = item.key === uiTheme;
                  const allowed = hasThemeAccess(item.key);
                  const showAdminTag = !!item.isAdminOnly;
                  const requiredAchievementId = getThemeAchievementRequirement(item.key);
                  const showAchievementTag = !!requiredAchievementId;
                  const achievementUnlocked = !requiredAchievementId || allUnlockedAchievementIds.includes(requiredAchievementId) || isOwner;
                  return (
                    <div key={`preview-${item.key}`} style={{border: selected ? "2px solid var(--accent)" : "1px solid var(--border)", borderRadius: "12px", padding: "10px", background: "var(--card)", opacity: allowed ? 1 : 0.6}}>
                      <button
                        onClick={() => {
                          if (!allowed) return;
                          setUiTheme(item.key);
                        }}
                        className="btn btn-secondary"
                        style={{textAlign: "left", border: "1px solid var(--border)", background: "transparent", padding: "8px", width: "100%", cursor: allowed ? "pointer" : "not-allowed"}}
                        disabled={!allowed}
                      >
                        <div style={{height: "62px", borderRadius: "10px", background: item.bg, border: "1px solid var(--border)", marginBottom: "8px", position: "relative", overflow: "hidden"}}>
                          <div style={{position: "absolute", left: "10px", top: "10px", width: "32px", height: "5px", borderRadius: "999px", background: item.accent}} />
                          <div style={{position: "absolute", left: "10px", top: "22px", width: "54px", height: "4px", borderRadius: "999px", background: "rgba(255,255,255,0.7)"}} />
                        </div>
                        <span style={{fontWeight: "800", color: selected ? "var(--accent)" : "var(--text)", fontSize: "12px"}}>
                          {item.label}{showAdminTag ? " (ADMIN)" : ""}{showAchievementTag ? " (ACHIEVEMENT)" : ""}
                        </span>
                        {!allowed && (
                          <span style={{display: "block", fontSize: "10px", color: "var(--muted)", marginTop: "4px"}}>
                            {requiredAchievementId && !achievementUnlocked
                              ? `Unlock: ${getAchievementTitleById(requiredAchievementId)}`
                              : "Locked"}
                          </span>
                        )}
                      </button>
                      {isOwner && (
                        <label style={{display: "flex", alignItems: "center", gap: "6px", marginTop: "8px", fontSize: "11px", color: "var(--muted)", fontWeight: "700"}}>
                          <input
                            type="checkbox"
                            checked={!!item.isAdminOnly}
                            onChange={(e) => toggleThemeAdminOnly(item.key, e.target.checked)}
                          />
                          Admin only
                        </label>
                      )}
                    </div>
                  );
                })}
              </div>
              <p style={{fontSize: "12px", color: "var(--muted)", marginTop: "8px"}}>Current: <strong style={{color: "var(--text)"}}>{uiThemeLabel}</strong></p>
              {!isOwner && (
                <p style={{fontSize: "11px", color: "var(--muted)", marginTop: "6px"}}>
                  Admin-only themes are hidden unless granted. Achievement themes unlock as you earn badges.
                </p>
              )}
            </div>

            {isOwner && (
              <div className="card" style={{marginBottom: "14px"}}>
                <p style={{fontSize: "11px", color: "var(--muted)", textTransform: "uppercase", fontWeight: "800", marginBottom: "8px"}}>Create Custom Theme</p>
                <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px"}}>
                  <input type="text" placeholder="Theme name" value={newThemeName} onChange={(e) => setNewThemeName(e.target.value)} />
                  <div />
                  <label style={{display: "flex", flexDirection: "column", gap: "4px", fontSize: "11px", color: "var(--muted)", fontWeight: "700"}}>
                    Background
                    <input type="text" placeholder="#0f172a" value={newThemeBackground} onChange={(e) => setNewThemeBackground(e.target.value)} />
                  </label>
                  <label style={{display: "flex", flexDirection: "column", gap: "4px", fontSize: "11px", color: "var(--muted)", fontWeight: "700"}}>
                    Primary
                    <input type="text" placeholder="#1e293b" value={newThemePrimary} onChange={(e) => setNewThemePrimary(e.target.value)} />
                  </label>
                  <label style={{display: "flex", flexDirection: "column", gap: "4px", fontSize: "11px", color: "var(--muted)", fontWeight: "700"}}>
                    Accent
                    <input type="text" placeholder="#10b981" value={newThemeAccent} onChange={(e) => setNewThemeAccent(e.target.value)} />
                  </label>
                  <label style={{display: "flex", alignItems: "center", gap: "6px", marginTop: "20px", fontSize: "12px", color: "var(--muted)", fontWeight: "700"}}>
                    <input type="checkbox" checked={newThemeAdminOnly} onChange={(e) => setNewThemeAdminOnly(e.target.checked)} />
                    Admin only
                  </label>
                </div>
                <div style={{display: "flex", gap: "8px", marginTop: "10px"}}>
                  <button onClick={createCustomTheme} className="btn btn-primary">Create Theme</button>
                </div>
              </div>
            )}

            {isOwner && (
              <div className="card" style={{marginBottom: "14px"}}>
                <p style={{fontSize: "11px", color: "var(--muted)", textTransform: "uppercase", fontWeight: "800", marginBottom: "8px"}}>Gift Admin Themes</p>
                <div style={{display: "grid", gridTemplateColumns: "1fr auto", gap: "8px", marginBottom: "8px"}}>
                  <input type="text" placeholder="Search user by email..." value={giftUserSearch} onChange={(e) => setGiftUserSearch(e.target.value)} />
                  <button onClick={searchUsersForThemeGift} className="btn btn-secondary">Search</button>
                </div>
                <div style={{display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: "8px", alignItems: "center"}}>
                  <select value={giftTargetUserId} onChange={(e) => setGiftTargetUserId(e.target.value)} style={{background: "var(--input-bg)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: "12px", padding: "10px"}}>
                    <option value="">Select user</option>
                    {giftUserResults.map((u) => (
                      <option key={`gift-user-${u.id}`} value={u.id}>{u.email}</option>
                    ))}
                  </select>
                  <select value={giftThemeId} onChange={(e) => setGiftThemeId(e.target.value)} style={{background: "var(--input-bg)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: "12px", padding: "10px"}}>
                    <option value="">Select admin theme</option>
                    {themePreviewCards.filter((t) => t.isAdminOnly).map((t) => (
                      <option key={`gift-theme-${t.key}`} value={t.key}>{t.label} (ADMIN)</option>
                    ))}
                  </select>
                  <button onClick={giftThemeToUser} className="btn btn-primary" disabled={!giftTargetUserId || !giftThemeId}>Gift</button>
                </div>
              </div>
            )}

            <div className="card" style={{marginBottom: "14px"}}>
              <p style={{fontSize: "11px", color: "var(--muted)", textTransform: "uppercase", fontWeight: "800", marginBottom: "8px"}}>Display</p>
              <div style={{display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "10px"}}>
                <button onClick={() => setTheme("light")} className="btn btn-secondary" style={{background: theme === "light" ? "var(--accent-soft)" : "var(--input-bg)", color: theme === "light" ? "var(--accent)" : "var(--text)"}}>Light</button>
                <button onClick={() => setTheme("dark")} className="btn btn-secondary" style={{background: theme === "dark" ? "var(--accent-soft)" : "var(--input-bg)", color: theme === "dark" ? "var(--accent)" : "var(--text)"}}>Dark</button>
              </div>

              <p style={{fontSize: "11px", color: "var(--muted)", textTransform: "uppercase", fontWeight: "800", marginBottom: "8px"}}>Typography Size</p>
              <div style={{display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "10px"}}>
                <button onClick={() => setTextSize("compact")} className="btn btn-secondary" style={{background: textSize === "compact" ? "var(--accent-soft)" : "var(--input-bg)", color: textSize === "compact" ? "var(--accent)" : "var(--text)"}}>Compact</button>
                <button onClick={() => setTextSize("default")} className="btn btn-secondary" style={{background: textSize === "default" ? "var(--accent-soft)" : "var(--input-bg)", color: textSize === "default" ? "var(--accent)" : "var(--text)"}}>Default</button>
                <button onClick={() => setTextSize("large")} className="btn btn-secondary" style={{background: textSize === "large" ? "var(--accent-soft)" : "var(--input-bg)", color: textSize === "large" ? "var(--accent)" : "var(--text)"}}>Large</button>
              </div>

              <p style={{fontSize: "11px", color: "var(--muted)", textTransform: "uppercase", fontWeight: "800", marginBottom: "8px"}}>Layout</p>
              <div style={{display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "10px"}}>
                <button onClick={() => setSidebarDensity("comfortable")} className="btn btn-secondary" style={{background: sidebarDensity === "comfortable" ? "var(--accent-soft)" : "var(--input-bg)", color: sidebarDensity === "comfortable" ? "var(--accent)" : "var(--text)"}}>Sidebar Comfortable</button>
                <button onClick={() => setSidebarDensity("compact")} className="btn btn-secondary" style={{background: sidebarDensity === "compact" ? "var(--accent-soft)" : "var(--input-bg)", color: sidebarDensity === "compact" ? "var(--accent)" : "var(--text)"}}>Sidebar Compact</button>
              </div>

              <p style={{fontSize: "11px", color: "var(--muted)", textTransform: "uppercase", fontWeight: "800", marginBottom: "8px"}}>Accessibility</p>
              <div style={{display: "flex", gap: "8px", flexWrap: "wrap"}}>
                <button onClick={() => setReduceMotion((v) => !v)} className="btn btn-secondary" style={{background: reduceMotion ? "var(--accent-soft)" : "var(--input-bg)", color: reduceMotion ? "var(--accent)" : "var(--text)"}}>Reduce Motion: {reduceMotion ? "On" : "Off"}</button>
                <button onClick={() => setHighContrast((v) => !v)} className="btn btn-secondary" style={{background: highContrast ? "var(--accent-soft)" : "var(--input-bg)", color: highContrast ? "var(--accent)" : "var(--text)"}}>High Contrast: {highContrast ? "On" : "Off"}</button>
                <button onClick={() => setMobileQuickSettings((v) => !v)} className="btn btn-secondary" style={{background: mobileQuickSettings ? "var(--accent-soft)" : "var(--input-bg)", color: mobileQuickSettings ? "var(--accent)" : "var(--text)"}}>Mobile Quick Settings 📱: {mobileQuickSettings ? "On" : "Off"}</button>
                <button onClick={() => setSoundEnabled((v) => !v)} className="btn btn-secondary" style={{background: soundEnabled ? "var(--accent-soft)" : "var(--input-bg)", color: soundEnabled ? "var(--accent)" : "var(--text)"}}>Victory Sound 🔊: {soundEnabled ? "On" : "Off"}</button>
              </div>
            </div>

            <div className="card">
              <p style={{fontSize: "11px", color: "var(--muted)", textTransform: "uppercase", fontWeight: "800", marginBottom: "8px"}}>Account</p>
              <div style={{display: "flex", gap: "8px", flexWrap: "wrap"}}>
                <button onClick={resetAllSettings} className="btn btn-secondary">Reset To Defaults ♻️</button>
                <button onClick={() => signOut(auth)} className="btn btn-danger">Sign Out 👋</button>
              </div>
            </div>
          </div>
        )}

        {view === "library" && (
          <div className="page-shell">
            <div className="page-header">
              <h1 className="page-title">Library 📚</h1>
              {isOwner && <button className="btn btn-primary" onClick={() => {const t = prompt("Book Name?"); if(t) { const nl = [...books, {id: Date.now().toString(), title: t, chapters: []}]; setDoc(doc(db, "data", "pajji_database"), { books: nl }); }}}>+ New Book</button>}
            </div>
            <div className="card library-tools" style={{display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "12px", padding: "14px", marginBottom: "20px"}}>
              <input type="text" placeholder="Search books or lessons..." value={libraryQuery} onChange={(e) => setLibraryQuery(e.target.value)} style={{padding: "12px"}} />
              <select value={libraryFilter} onChange={(e) => setLibraryFilter(e.target.value as "all" | "notStarted" | "inProgress" | "mastered")} style={{background: "var(--input-bg)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: "14px", padding: "12px"}}>
                <option value="all">All Books</option>
                <option value="notStarted">Not Started</option>
                <option value="inProgress">In Progress</option>
                <option value="mastered">Mastered</option>
              </select>
              <select value={librarySort} onChange={(e) => setLibrarySort(e.target.value as "default" | "lastEdited")} style={{background: "var(--input-bg)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: "14px", padding: "12px"}}>
                <option value="default">Sort: Default</option>
                <option value="lastEdited">Sort: Last Edited</option>
              </select>
            </div>
            <div className="library-grid" style={{display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "24px"}}>
              {sortedFilteredBooks.map(b => {
                const progress = getBookProgress(b);
                const insights = getBookAttemptInsights(b);
                const bookLastEditedAt = getBookLastEditedAt(b);
                return (
                <div key={b.id} className="card" style={{textAlign: "center", transition: "0.2s", cursor: "pointer"}} onClick={() => {setCurBook(b); setView("chapters");}}>
                  <div style={{height: "120px", background: "var(--input-bg)", borderRadius: "18px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "40px", marginBottom: "16px"}}>📖</div>
                  <h3 style={{fontWeight: "800", fontSize: "18px", marginBottom: "4px"}}>{b.title}</h3>
                  <p style={{fontSize: "12px", opacity: 0.5, fontWeight: "600"}}>{b.chapters?.length || 0} Lessons</p>
                  <p style={{fontSize: "11px", fontWeight: "800", color: "var(--muted)", marginTop: "10px", marginBottom: "6px"}}>{progress.masteredLessons}/{progress.totalLessons} mastered</p>
                  <div style={{height: "7px", background: "var(--input-bg)", borderRadius: "12px", overflow: "hidden", border: "1px solid var(--border)"}}>
                    <div style={{height: "100%", width: `${progress.progressPercent}%`, background: "var(--accent-grad)"}} />
                  </div>
                  <div style={{marginTop: "10px", borderTop: "1px dashed var(--border)", paddingTop: "10px"}}>
                    <p style={{fontSize: "11px", color: "var(--muted)", fontWeight: "700"}}>
                      Attempts: {insights.attemptsCount} • Avg: {insights.avgAccuracy === null ? "--" : `${insights.avgAccuracy}%`}
                    </p>
                    <p style={{fontSize: "10px", color: "var(--muted)", marginTop: "4px"}}>{formatNoteEdited(bookLastEditedAt)}</p>
                    {insights.trend.length > 0 && (
                      <div style={{display: "flex", gap: "4px", marginTop: "6px", alignItems: "flex-end", justifyContent: "center", height: "28px"}}>
                        {insights.trend.map((v: number, idx: number) => (
                          <div key={`trend-${b.id}-${idx}`} title={`${v}%`} style={{width: "8px", height: `${Math.max(4, Math.round((v / 100) * 28))}px`, borderRadius: "4px", background: v >= 70 ? "var(--accent)" : "var(--danger)"}} />
                        ))}
                      </div>
                    )}
                    {insights.weakCount > 0 && (
                      <p style={{fontSize: "10px", color: "var(--danger)", fontWeight: "800", marginTop: "6px"}}>
                        Weak tags: {insights.weakCount}
                      </p>
                    )}
                  </div>
                  {isOwner && <button className="del-btn" style={{marginTop: "16px", width: "100%", background: "rgba(var(--danger-rgb), 0.1)", border: "none", color: "var(--danger)", padding: "8px", borderRadius: "10px", fontWeight: "bold", fontSize: "11px"}} onClick={(e) => {e.stopPropagation(); deleteItem('book', b.id)}}>Delete</button>}
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
          <div className="page-shell" style={{maxWidth: "880px"}}>
            <button onClick={() => setView("library")} className="btn-link" style={{marginBottom: "16px"}}>← Library 📚</button>
            <div className="page-header">
                <h1 className="page-title">{curBook.title}</h1>
                {isOwner && <button onClick={addLesson} className="btn btn-primary">+ Add Lesson</button>}
            </div>
            {(curBook.chapters || []).map((ch: any) => (
              <div key={ch.id} className="card" style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", padding: "18px 24px"}}>
                <div style={{flex: 1}}>
                    <span style={{fontSize: "17px", fontWeight: "700"}}>{ch.title}</span>
                    {completedLessons.includes(ch.id) && <span style={{marginLeft: "12px", fontSize: "11px", color: "var(--accent)", fontWeight: "900", background: "var(--accent-soft)", padding: "2px 8px", borderRadius: "10px"}}>✓ MASTERED</span>}
                </div>
                <div style={{display: "flex", gap: "10px"}}>
                  <button onClick={() => openLesson(curBook, ch)} className="btn btn-primary" style={{padding: "8px 20px"}}>Study</button>
                  {isOwner && (<button onClick={() => {setCurChapter(ch); setTempChapter(ch); setView("edit");}} className="btn btn-secondary" style={{padding: "8px 12px"}}>✎</button>)}
                </div>
              </div>
            ))}
          </div>
        )}

        {view === "study" && curChapter && (
          <div className="page-shell" style={{maxWidth: "1000px"}}>
            <div style={{display: "flex", justifyContent: "space-between", marginBottom: "24px", alignItems: "center"}}>
              <button onClick={() => setView("chapters")} className="btn-link">← Lessons</button>
              <div style={{display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", justifyContent: "flex-end"}}>
                {quickReviewMode && (
                  <button onClick={() => setQuickReviewMode(false)} className="btn btn-secondary" style={{padding: "8px 12px"}}>End Quick Review</button>
                )}
                {!completedLessons.includes(curChapter.id) ? (
                  <button onClick={() => markCompleted(curChapter.id)} className="btn btn-warning" style={{padding: "12px 24px", borderRadius: "14px", fontSize: "14px", boxShadow: "0 10px 20px -5px rgba(251, 191, 36, 0.4)"}}>CLAIM 100 XP</button>
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
                {["Summary", "Spellings", "Quiz", "AI Explanation", "My Notes", "Video", "Book PDF", "Slides", "Infographic", "Mind Map"].map(t => (
                    <button key={t} onClick={() => switchStudyTab(t)} className={`tab-btn ${activeTab === t ? "active" : ""}`}>{t}</button>
                ))}
            </div>
            <div className="card" style={{minHeight: "500px", padding: "32px"}}>
               {["Summary", "Spellings"].includes(activeTab) && <div style={{whiteSpace: "pre-wrap", fontSize: "17px", lineHeight: "1.8", color: "var(--text)"}}>{curChapter[activeTab.toLowerCase()] || "No content uploaded yet."}</div>}
               {activeTab === "AI Explanation" && (
                 <div style={{display: "flex", flexDirection: "column", gap: "16px"}}>
                   <div style={{background: "rgba(15,23,42,0.08)", padding: "16px", borderRadius: "12px", border: "1px dashed var(--border)"}}>
                     <h3 style={{fontWeight: "800", marginBottom: "8px", color: "var(--accent)"}}>Ask AI about this lesson</h3>
                     <div style={{display: "flex", gap: "8px", flexWrap: "wrap"}}>
                       <input 
                         type="text" 
                         value={aiExplainQuestion} 
                         onChange={(e) => setAiExplainQuestion(e.target.value)} 
                         placeholder="E.g. What is the main theme of this summary?" 
                         style={{flex: 1, padding: "12px", minWidth: "200px"}} 
                         onKeyDown={(e) => { if(e.key === "Enter") askAiExplanation(); }}
                       />
                       <button onClick={askAiExplanation} className="btn btn-primary" disabled={aiExplainLoading}>
                         {aiExplainLoading ? "Thinking..." : "Ask"}
                       </button>
                     </div>
                   </div>
                   {aiExplainAnswer && (
                     <div style={{background: "var(--input-bg)", padding: "16px", borderRadius: "12px", border: "1px solid var(--border)", WebkitUserSelect: "text", userSelect: "text"}}>
                       <h4 style={{fontWeight: "800", color: "var(--accent)"}}>AI Explanation</h4>
                       <div style={{marginTop: "8px", whiteSpace: "pre-wrap", lineHeight: 1.6, fontSize: "15px"}}>{aiExplainAnswer}</div>
                     </div>
                   )}
                 </div>
               )}
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
                 const safePos = Math.max(0, Math.min(currentQuizPos, orderedQuestionIndices.length - 1));
                 const activeQuestionIndex = orderedQuestionIndices[safePos];
                 const q = quiz[activeQuestionIndex];
                 return (
                  <div style={{display: "flex", flexDirection: "column", gap: "16px", paddingBottom: "84px"}}>
                    <div style={{display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap"}}>
                      <button onClick={() => startQuizAttempt(curChapter)} style={{padding: "8px 12px", borderRadius: "10px", border: "1px solid var(--border)", background: "var(--input-bg)", color: "var(--text)", fontWeight: "700", cursor: "pointer"}}>
                        Start / Restart
                      </button>
                      <button onClick={() => startQuizAttempt(curChapter, wrongIndices)} disabled={!quizSubmitted || wrongIndices.length === 0} style={{padding: "8px 12px", borderRadius: "10px", border: "1px solid var(--border)", background: (!quizSubmitted || wrongIndices.length === 0) ? "rgba(148,163,184,0.2)" : "rgba(239,68,68,0.14)", color: "var(--text)", fontWeight: "700", cursor: (!quizSubmitted || wrongIndices.length === 0) ? "not-allowed" : "pointer", opacity: (!quizSubmitted || wrongIndices.length === 0) ? 0.55 : 1}}>
                        Retry Wrong Only
                      </button>
                      <button onClick={() => { setQuizShuffleEnabled(prev => !prev); startQuizAttempt(curChapter, questionIndicesSource); }} style={{padding: "8px 12px", borderRadius: "10px", border: "1px solid var(--border)", background: quizShuffleEnabled ? "var(--accent-soft)" : "var(--input-bg)", color: "var(--text)", fontWeight: "700", cursor: "pointer"}}>
                        Shuffle: {quizShuffleEnabled ? "On" : "Off"}
                      </button>
                      <button onClick={() => setShowShortcuts((prev) => !prev)} style={{padding: "8px 12px", borderRadius: "10px", border: "1px solid var(--border)", background: "var(--input-bg)", color: "var(--text)", fontWeight: "700", cursor: "pointer"}}>
                        Shortcuts
                      </button>
                    </div>
                    {showShortcuts && (
                      <div style={{border: "1px dashed var(--border)", borderRadius: "12px", padding: "10px 12px", background: "var(--card)", fontSize: "12px", color: "var(--muted)"}}>
                        <strong style={{color: "var(--text)"}}>Keyboard:</strong> Left/Right = navigate, Enter = submit, R = restart, ? = toggle this panel
                      </div>
                    )}
                    <div style={{display: "flex", gap: "8px", flexWrap: "wrap"}}>
                      <button onClick={useFiftyFiftyPowerUp} disabled={q.type !== "mcq" || !!usedFiftyFifty[activeQuestionIndex]} className="btn btn-secondary" style={{opacity: (q.type !== "mcq" || !!usedFiftyFifty[activeQuestionIndex]) ? 0.55 : 1}}>50:50 ✂️</button>
                      <button onClick={useHintPowerUp} disabled={!!usedHint[activeQuestionIndex]} className="btn btn-secondary" style={{opacity: usedHint[activeQuestionIndex] ? 0.55 : 1}}>Hint 💡</button>
                      <button onClick={useSkipPowerUp} disabled={!!usedSkip[activeQuestionIndex]} className="btn btn-secondary" style={{opacity: usedSkip[activeQuestionIndex] ? 0.55 : 1}}>Skip (-20 XP) ⏭️</button>
                    </div>
                    <div className="card" style={{padding: "12px 14px"}}>
                      <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px"}}>
                        <span style={{fontSize: "12px", fontWeight: "800", color: "var(--muted)"}}>Question {safePos + 1}/{orderedQuestionIndices.length}</span>
                        <span style={{fontSize: "12px", fontWeight: "800", color: "var(--accent)"}}>{Math.round(((safePos + 1) / Math.max(1, orderedQuestionIndices.length)) * 100)}%</span>
                      </div>
                      <div style={{height: "7px", borderRadius: "8px", background: "var(--input-bg)", border: "1px solid var(--border)", overflow: "hidden"}}>
                        <div style={{height: "100%", width: `${((safePos + 1) / Math.max(1, orderedQuestionIndices.length)) * 100}%`, background: "var(--accent-grad)"}} />
                      </div>
                    </div>
                    <div style={{display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(34px, 1fr))", gap: "6px"}}>
                      {orderedQuestionIndices.map((qIndex: number, navIndex: number) => {
                        const isCurrent = navIndex === safePos;
                        const isAnswered = quizAnswers[qIndex] !== undefined && `${quizAnswers[qIndex]}`.trim() !== "";
                        const reviewed = quizReview[qIndex];
                        const bg = reviewed ? (reviewed.isCorrect ? "var(--accent-soft)" : "rgba(var(--danger-rgb),0.2)") : (isAnswered ? "var(--accent-soft)" : "var(--input-bg)");
                        const border = isCurrent ? "2px solid var(--accent)" : "1px solid var(--border)";
                        return (
                          <button
                            key={`nav-${qIndex}`}
                            onClick={() => setCurrentQuizPos(navIndex)}
                            style={{height: "34px", borderRadius: "10px", border, background: bg, color: "var(--text)", fontWeight: "800", cursor: "pointer", fontSize: "12px"}}
                          >
                            {navIndex + 1}
                          </button>
                        );
                      })}
                    </div>
                    <div key={`${q.question}-${activeQuestionIndex}`} className="quiz-question-card" style={{padding: "16px", borderRadius: "16px", border: "1px solid var(--border)", background: "var(--input-bg)"}}>
                        {(() => {
                          const review = quizReview[activeQuestionIndex];
                          return (
                            <>
                        <div style={{display: "flex", justifyContent: "space-between", gap: "8px", alignItems: "center", marginBottom: "10px"}}>
                          <p style={{fontWeight: "800"}}>{safePos + 1}. {q.question}</p>
                          <span style={{fontSize: "10px", fontWeight: "800", padding: "3px 8px", borderRadius: "10px", background: "var(--accent-soft)", border: "1px solid rgba(var(--accent-rgb),0.35)"}}>
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
                                    title={`question-img-${activeQuestionIndex + 1}`}
                                    style={{width: "100%", height: "260px", borderRadius: "14px", border: "1px solid var(--border)", background: "#fff"}}
                                  />
                                ) : (
                                  <img
                                    src={formatImageLink(q.imageUrl)}
                                    alt={`question-${activeQuestionIndex + 1}`}
                                    onError={() => setQuizImageErrors(prev => ({ ...prev, [activeQuestionIndex]: true }))}
                                    style={{maxWidth: "100%", maxHeight: "260px", width: "100%", borderRadius: "14px", border: "1px solid var(--border)", objectFit: "contain", background: "#fff"}}
                                  />
                                )}
                                {quizImageErrors[activeQuestionIndex] && (
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
                            {((quizOptionOrder[activeQuestionIndex] && quizOptionOrder[activeQuestionIndex].length > 0)
                              ? quizOptionOrder[activeQuestionIndex]
                              : (q.options || []).map((_: string, opIndex: number) => opIndex).filter((opIndex: number) => `${(q.options || [])[opIndex] || ""}`.trim())
                            ).filter((originalIndex: number) => !(hiddenOptionsByQuestion[activeQuestionIndex] || []).includes(originalIndex)).map((originalIndex: number) => {
                              const op = (q.options || [])[originalIndex] || "";
                              const selected = quizAnswers[activeQuestionIndex] === originalIndex;
                              const isCorrectOption = originalIndex === q.correctIndex;
                              const showCorrectOption = quizSubmitted && isCorrectOption;
                              const showWrongSelected = quizSubmitted && selected && !isCorrectOption;
                              return (
                                <button
                                  key={`${activeQuestionIndex}-${originalIndex}`}
                                  onClick={() => {
                                    setQuizAnswers(prev => ({ ...prev, [activeQuestionIndex]: originalIndex }));
                                    setQuizSubmitted(false);
                                    setQuizReview({});
                                    setQuizResult("");
                                  }}
                                  style={{
                                    textAlign: "left",
                                    padding: "10px 12px",
                                    borderRadius: "12px",
                                    border: showWrongSelected ? "1px solid var(--danger)" : showCorrectOption ? "1px solid var(--accent)" : selected ? "1px solid var(--accent)" : "1px solid var(--border)",
                                    background: showWrongSelected ? "rgba(var(--danger-rgb),0.14)" : showCorrectOption ? "var(--accent-soft)" : selected ? "var(--accent-soft)" : "rgba(15,23,42,0.08)",
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
                            value={`${quizAnswers[activeQuestionIndex] ?? ""}`}
                            onChange={(e) => {
                              setQuizAnswers(prev => ({ ...prev, [activeQuestionIndex]: e.target.value }));
                              setQuizSubmitted(false);
                              setQuizReview({});
                              setQuizResult("");
                            }}
                            style={{padding: "12px"}}
                          />
                        )}
                        {usedHint[activeQuestionIndex] && (
                          <div style={{marginTop: "8px", fontSize: "12px", color: "var(--muted)", fontWeight: "700"}}>
                            Hint: {q.type === "mcq"
                              ? `Correct option is ${String.fromCharCode(65 + q.correctIndex)}`
                              : `Starts with "${`${q.answer || ""}`.trim().charAt(0) || ""}"`}
                          </div>
                        )}
                        {quizSubmitted && review && (
                          <div style={{marginTop: "10px", padding: "10px 12px", borderRadius: "10px", border: review.isCorrect ? "1px solid rgba(var(--accent-rgb),0.35)" : "1px solid rgba(var(--danger-rgb),0.35)", background: review.isCorrect ? "var(--accent-soft)" : "rgba(var(--danger-rgb),0.12)", fontSize: "13px"}}>
                            {review.isCorrect ? (
                              <span style={{fontWeight: "800", color: "var(--accent)"}}>Correct answer.</span>
                            ) : (
                              <span style={{fontWeight: "700", color: "var(--danger)"}}>
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
                    <div style={{position: "sticky", bottom: "10px", zIndex: 20, border: "1px solid var(--border)", background: "var(--card)", borderRadius: "14px", padding: "10px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", flexWrap: "wrap"}}>
                      <div style={{display: "flex", gap: "8px"}}>
                        <button onClick={() => setCurrentQuizPos(prev => Math.max(0, prev - 1))} disabled={safePos === 0} style={{padding: "8px 12px", borderRadius: "10px", border: "1px solid var(--border)", background: safePos === 0 ? "rgba(148,163,184,0.2)" : "var(--input-bg)", color: "var(--text)", fontWeight: "700", cursor: safePos === 0 ? "not-allowed" : "pointer"}}>Prev</button>
                        <button onClick={() => setCurrentQuizPos(prev => Math.min(orderedQuestionIndices.length - 1, prev + 1))} disabled={safePos === orderedQuestionIndices.length - 1} style={{padding: "8px 12px", borderRadius: "10px", border: "1px solid var(--border)", background: safePos === orderedQuestionIndices.length - 1 ? "rgba(148,163,184,0.2)" : "var(--input-bg)", color: "var(--text)", fontWeight: "700", cursor: safePos === orderedQuestionIndices.length - 1 ? "not-allowed" : "pointer"}}>Next</button>
                      </div>
                      <div style={{display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap"}}>
                        <button onClick={submitQuiz} style={{padding: "9px 14px", borderRadius: "10px", border: "none", background: "var(--accent)", color: "white", fontWeight: "800", cursor: "pointer"}}>Submit Quiz</button>
                        <button onClick={() => startQuizAttempt(curChapter, wrongIndices)} disabled={!quizSubmitted || wrongIndices.length === 0} style={{padding: "9px 12px", borderRadius: "10px", border: "1px solid var(--border)", background: (!quizSubmitted || wrongIndices.length === 0) ? "rgba(148,163,184,0.2)" : "rgba(var(--danger-rgb),0.14)", color: "var(--text)", fontWeight: "700", cursor: (!quizSubmitted || wrongIndices.length === 0) ? "not-allowed" : "pointer", opacity: (!quizSubmitted || wrongIndices.length === 0) ? 0.55 : 1}}>
                          Retry Wrong
                        </button>
                        {quizResult && <span style={{fontWeight: "800", color: quizResult.startsWith("Score") ? "var(--accent)" : "var(--warning)"}}>{quizResult}</span>}
                      </div>
                    </div>
                  </div>
                 );
               })()}
               {activeTab === "Video" && (curChapter.video ? <iframe width="100%" height="450px" src={formatYoutubeLink(curChapter.video)} frameBorder="0" allowFullScreen style={{borderRadius: "20px", boxShadow: "0 20px 40px rgba(0,0,0,0.2)"}} /> : "No video available.")}
               {activeTab === "My Notes" && (
                 <div style={{display: "flex", flexDirection: "column", gap: "12px"}}>
                   <div style={{display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", flexWrap: "wrap"}}>
                     <p style={{fontSize: "13px", color: "var(--muted)"}}>Write your own notes from Summary, Spellings, Quiz, PDFs, and videos.</p>
                     <span style={{fontSize: "12px", fontWeight: "700", color: noteSaving ? "var(--warning)" : "var(--accent)"}}>
                       {noteSaving ? "Saving..." : (noteSavedAt ? `Saved at ${noteSavedAt}` : "Autosave on")}
                     </span>
                   </div>
                   <textarea
                     placeholder="Type your lesson notes here..."
                     value={noteDraft}
                     onChange={(e) => setNoteDraft(e.target.value)}
                     style={{minHeight: "340px", lineHeight: 1.6}}
                   />
                   <div style={{display: "flex", gap: "8px", flexWrap: "wrap"}}>
                     <button className="btn btn-secondary" onClick={() => insertNoteTemplate("Definition")}>Template: Definition</button>
                     <button className="btn btn-secondary" onClick={() => insertNoteTemplate("Cause/Effect")}>Template: Cause/Effect</button>
                     <button className="btn btn-secondary" onClick={() => insertNoteTemplate("Timeline")}>Template: Timeline</button>
                   </div>
                   <div style={{display: "flex", gap: "8px", flexWrap: "wrap"}}>
                     <button onClick={() => saveCurrentNote()} className="btn btn-primary" disabled={noteSaving} style={{opacity: noteSaving ? 0.7 : 1}}>Save Note</button>
                     <button onClick={generateFlashcardsFromNote} className="btn btn-secondary">Generate Flashcards</button>
                     <button onClick={exportCurrentNote} className="btn btn-secondary">Export Note (.txt)</button>
                     <button
                       onClick={async () => {
                         if (!confirm("Clear note for this lesson?")) return;
                         setNoteDraft("");
                         await saveCurrentNote("");
                       }}
                       className="btn btn-secondary"
                       disabled={noteSaving}
                       style={{opacity: noteSaving ? 0.7 : 1}}
                     >
                       Clear Note
                     </button>
                   </div>
                   <div style={{border: "1px solid var(--border)", borderRadius: "12px", padding: "10px", background: "var(--input-bg)"}}>
                     <p style={{fontSize: "12px", fontWeight: "800", marginBottom: "8px"}}>Tags</p>
                     <div style={{display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "8px"}}>
                       <input
                         type="text"
                         placeholder="Add tag (example: exam)"
                         value={newTagInput}
                         onChange={(e) => setNewTagInput(e.target.value)}
                         onKeyDown={(e) => {
                           if (e.key === "Enter") {
                             e.preventDefault();
                             addTagToCurrentLesson(newTagInput);
                           }
                         }}
                         style={{padding: "10px", flex: 1, minWidth: "220px"}}
                       />
                       <button className="btn btn-secondary" onClick={() => addTagToCurrentLesson(newTagInput)}>Add Tag</button>
                     </div>
                     <div style={{display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "8px"}}>
                       {quickTagOptions.map((tag) => (
                         <button key={`quick-tag-${tag}`} className="btn btn-secondary" style={{padding: "5px 8px"}} onClick={() => addTagToCurrentLesson(tag)}>
                           + #{tag}
                         </button>
                       ))}
                     </div>
                     {currentLessonTags.length > 0 && (
                       <div style={{display: "flex", gap: "6px", flexWrap: "wrap"}}>
                         {currentLessonTags.map((tag) => (
                           <button key={`tag-${tag}`} className="btn btn-secondary" style={{padding: "4px 8px"}} onClick={() => removeTagFromCurrentLesson(tag)}>
                             #{tag} x
                           </button>
                         ))}
                       </div>
                     )}
                   </div>
                   {lessonFlashcards.length > 0 && (
                     <div style={{border: "1px solid var(--border)", borderRadius: "12px", padding: "10px", background: "var(--input-bg)"}}>
                       <p style={{fontSize: "12px", fontWeight: "800", marginBottom: "8px"}}>
                         Flashcards ({Math.min(flashcardIndex + 1, lessonFlashcards.length)}/{lessonFlashcards.length})
                       </p>
                       <div style={{border: "1px solid var(--border)", borderRadius: "12px", padding: "12px", background: "var(--card)", minHeight: "88px"}}>
                         <p style={{fontSize: "11px", color: "var(--muted)", fontWeight: "800", marginBottom: "6px"}}>Q</p>
                         <p style={{fontSize: "14px", fontWeight: "700"}}>{lessonFlashcards[flashcardIndex]?.q}</p>
                         {flashcardReveal && (
                           <>
                             <p style={{fontSize: "11px", color: "var(--muted)", fontWeight: "800", marginTop: "10px", marginBottom: "6px"}}>A</p>
                             <p style={{fontSize: "13px", color: "var(--muted)"}}>{lessonFlashcards[flashcardIndex]?.a}</p>
                           </>
                         )}
                       </div>
                       <div style={{display: "flex", gap: "8px", marginTop: "8px", flexWrap: "wrap"}}>
                         <button className="btn btn-secondary" onClick={() => setFlashcardIndex((prev) => Math.max(0, prev - 1))} disabled={flashcardIndex === 0} style={{opacity: flashcardIndex === 0 ? 0.6 : 1}}>Prev</button>
                         <button className="btn btn-secondary" onClick={() => setFlashcardReveal((prev) => !prev)}>{flashcardReveal ? "Hide Answer" : "Show Answer"}</button>
                         <button className="btn btn-secondary" onClick={() => { setFlashcardReveal(false); setFlashcardIndex((prev) => Math.min(lessonFlashcards.length - 1, prev + 1)); }} disabled={flashcardIndex >= lessonFlashcards.length - 1} style={{opacity: flashcardIndex >= lessonFlashcards.length - 1 ? 0.6 : 1}}>Next</button>
                       </div>
                     </div>
                   )}
                   <div style={{border: "1px solid var(--border)", borderRadius: "12px", padding: "10px", background: "var(--input-bg)"}}>
                     <p style={{fontSize: "12px", fontWeight: "800", marginBottom: "8px"}}>Pin Key Point</p>
                     <div style={{display: "flex", gap: "8px", flexWrap: "wrap"}}>
                       <input
                         type="text"
                         placeholder="Add a key takeaway from this lesson..."
                         value={newPinnedPointText}
                         onChange={(e) => setNewPinnedPointText(e.target.value)}
                         style={{padding: "10px", flex: 1, minWidth: "220px"}}
                       />
                       <button className="btn btn-primary" onClick={addPinnedKeyPoint}>Pin</button>
                     </div>
                     {lessonPinnedPoints.length > 0 && (
                       <div style={{display: "flex", flexDirection: "column", gap: "6px", marginTop: "10px"}}>
                         {lessonPinnedPoints.map((point) => (
                           <div key={point.id} style={{display: "flex", justifyContent: "space-between", gap: "8px", border: "1px solid var(--border)", borderRadius: "10px", padding: "6px 8px", background: "var(--card)"}}>
                             <span style={{fontSize: "12px"}}>{point.text}</span>
                             <button className="btn btn-danger" style={{padding: "4px 8px"}} onClick={() => removePinnedKeyPoint(point.id)}>x</button>
                           </div>
                         ))}
                       </div>
                     )}
                   </div>
                 </div>
               )}
               {["Book PDF", "Slides", "Infographic", "Mind Map"].includes(activeTab) && (() => { 
                 let k = activeTab === "Book PDF" ? "bookPdf" : activeTab.charAt(0).toLowerCase() + activeTab.slice(1).replace(" ", ""); 
                 let link = curChapter[k]; 
                 return (
                   <div style={{display: "flex", flexDirection: "column", gap: "20px"}}>
                     {link ? <iframe src={link.includes("drive.google.com") ? link.replace("/view", "/preview") : link} width="100%" height="600px" style={{border: "none", borderRadius: "20px"}} /> : <div style={{textAlign: "center", padding: "100px", opacity: 0.5}}>This resource hasn't been linked yet.</div>}
                     {activeTab === "Book PDF" && curChapter.audioBook && (
                        <div style={{padding: "20px", background: "var(--input-bg)", borderRadius: "20px", display: "flex", flexDirection: "column", gap: "10px"}}>
                          <h3 style={{fontSize: "16px", fontWeight: "800"}}>Audiobook Resource</h3>
                          {curChapter.audioBook.includes("drive.google.com") ? (
                            <iframe src={curChapter.audioBook.replace("/view", "/preview")} width="100%" height="150" style={{border: "none", borderRadius: "10px"}} />
                          ) : (
                            <audio controls src={curChapter.audioBook} style={{width: "100%", outline: "none"}} />
                          )}
                        </div>
                     )}
                   </div>
                 );
               })()}
            </div>
          </div>
        )}

        {view === "edit" && tempChapter && (
          <div className="card" style={{maxWidth: "900px", margin: "0 auto"}}>
            <div style={{display: "flex", justifyContent: "space-between", marginBottom: "32px"}}>
                <h2 style={{fontWeight: "900"}}>Editor</h2>
                <button onClick={() => { saveAllChanges(); lastAutosavePayloadRef.current = JSON.stringify(tempChapter || {}); setView("chapters"); }} style={{background: "var(--accent)", color: "white", padding: "12px 30px", borderRadius: "14px", border: "none", fontWeight: "800", cursor: "pointer"}}>SAVE CHANGES</button>
            </div>
            <div style={{display: "flex", flexDirection: "column", gap: "24px"}}>
                <div><label style={{color: "var(--accent)", fontWeight: "800", fontSize: "13px", textTransform: "uppercase", display: "block", marginBottom: "8px"}}>Summary</label><textarea value={tempChapter.summary || ""} onChange={(e) => setTempChapter({...tempChapter, summary: e.target.value})} /></div>
                <div><label style={{color: "var(--accent)", fontWeight: "800", fontSize: "13px", textTransform: "uppercase", display: "block", marginBottom: "8px"}}>Spellings</label><textarea placeholder="Type words here..." value={tempChapter.spellings || ""} onChange={(e) => setTempChapter({...tempChapter, spellings: e.target.value})} /></div>
                <div style={{padding: "16px", border: "1px solid var(--border)", borderRadius: "16px", background: "var(--input-bg)"}}>
                    <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", gap: "8px", flexWrap: "wrap"}}>
                      <label style={{color: "var(--accent)", fontWeight: "800", fontSize: "13px", textTransform: "uppercase"}}>Interactive Quiz</label>
                      <button onClick={addQuizQuestion} style={{padding: "8px 12px", borderRadius: "10px", border: "none", background: "var(--accent)", color: "white", fontWeight: "700", cursor: "pointer"}}>+ Add Question</button>
                    </div>
                    <div style={{display: "flex", flexDirection: "column", gap: "12px"}}>
                      {(Array.isArray(tempChapter.quiz) ? tempChapter.quiz : []).map((q: any, qIndex: number) => (
                        <div key={`edit-quiz-${qIndex}`} style={{border: "1px solid var(--border)", borderRadius: "14px", padding: "12px", background: "rgba(15,23,42,0.08)"}}>
                          <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", marginBottom: "8px"}}>
                            <p style={{fontWeight: "800", fontSize: "12px"}}>Question {qIndex + 1}</p>
                            <button onClick={() => removeQuizQuestion(qIndex)} style={{background: "rgba(var(--danger-rgb),0.14)", color: "var(--danger)", border: "1px solid rgba(var(--danger-rgb),0.3)", borderRadius: "8px", padding: "4px 8px", cursor: "pointer", fontWeight: "700"}}>Remove</button>
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
                      <div style={{display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap", marginBottom: "8px"}}>
                        <span style={{fontSize: "11px", color: "var(--muted)", fontWeight: "700"}}>Parser mode:</span>
                        <button onClick={() => setParserMode("strict")} className="btn btn-secondary" style={{padding: "6px 10px", background: parserMode === "strict" ? "var(--accent-soft)" : "var(--input-bg)"}}>Strict</button>
                        <button onClick={() => setParserMode("balanced")} className="btn btn-secondary" style={{padding: "6px 10px", background: parserMode === "balanced" ? "var(--accent-soft)" : "var(--input-bg)"}}>Balanced</button>
                        <button onClick={() => setParserMode("aggressive")} className="btn btn-secondary" style={{padding: "6px 10px", background: parserMode === "aggressive" ? "var(--accent-soft)" : "var(--input-bg)"}}>Aggressive</button>
                      </div>
                      <textarea
                        placeholder={`Paste from NotebookLM directly.\nSupported examples:\n1) What is ...?\nA) ...\nB) ...\nC) ...\nD) ...\nCorrect Answer: B\n\nQ2: Another question...\nA. ...\nB. ...\nAnswer: Option text`}
                        value={quizBuilderText}
                        onChange={(e) => setQuizBuilderText(e.target.value)}
                        style={{minHeight: "130px"}}
                      />
                      <div style={{display: "flex", gap: "8px", marginTop: "8px", flexWrap: "wrap"}}>
                        <button onClick={previewParsedQuestions} disabled={!quizBuilderText.trim()} style={{padding: "8px 12px", borderRadius: "10px", border: "1px solid var(--border)", background: !quizBuilderText.trim() ? "rgba(148,163,184,0.2)" : "var(--input-bg)", color: "var(--text)", fontWeight: "800", cursor: !quizBuilderText.trim() ? "not-allowed" : "pointer"}}>
                          Preview Paste
                        </button>
                        <button onClick={addPreviewToQuiz} disabled={parsedPreview.length === 0} style={{padding: "8px 12px", borderRadius: "10px", border: "1px solid var(--border)", background: parsedPreview.length === 0 ? "rgba(148,163,184,0.2)" : "var(--accent-soft)", color: "var(--text)", fontWeight: "800", cursor: parsedPreview.length === 0 ? "not-allowed" : "pointer"}}>
                          Add Preview
                        </button>
                        <button onClick={bulkAddQuizQuestions} style={{padding: "8px 12px", borderRadius: "10px", border: "1px solid var(--border)", background: "var(--accent-soft)", color: "var(--text)", fontWeight: "800", cursor: "pointer"}}>Parse & Add Questions</button>
                        <button onClick={aiParseQuizQuestions} disabled={aiParsingQuiz || !quizBuilderText.trim()} style={{padding: "8px 12px", borderRadius: "10px", border: "1px solid var(--border)", background: (aiParsingQuiz || !quizBuilderText.trim()) ? "rgba(148,163,184,0.2)" : "rgba(59,130,246,0.14)", color: "var(--text)", fontWeight: "800", cursor: (aiParsingQuiz || !quizBuilderText.trim()) ? "not-allowed" : "pointer", opacity: (aiParsingQuiz || !quizBuilderText.trim()) ? 0.65 : 1}}>
                          {aiParsingQuiz ? "AI Parsing..." : "AI Parse"}
                        </button>
                        <button onClick={exportQuizPack} style={{padding: "8px 12px", borderRadius: "10px", border: "1px solid var(--border)", background: "var(--input-bg)", color: "var(--text)", fontWeight: "800", cursor: "pointer"}}>Export Pack</button>
                        <button onClick={importQuizPack} disabled={!quizPackText.trim()} style={{padding: "8px 12px", borderRadius: "10px", border: "1px solid var(--border)", background: !quizPackText.trim() ? "rgba(148,163,184,0.2)" : "var(--accent-soft)", color: "var(--text)", fontWeight: "800", cursor: !quizPackText.trim() ? "not-allowed" : "pointer"}}>
                          Import Pack
                        </button>
                      </div>
                      <textarea
                        placeholder="Quiz pack JSON (exported or pasted)"
                        value={quizPackText}
                        onChange={(e) => setQuizPackText(e.target.value)}
                        style={{minHeight: "110px", marginTop: "8px"}}
                      />
                      {parsedPreview.length > 0 && (
                        <div style={{marginTop: "8px", border: "1px solid var(--border)", borderRadius: "12px", padding: "10px", background: "var(--card)"}}>
                          <p style={{fontSize: "11px", color: "var(--muted)", fontWeight: "800", marginBottom: "6px"}}>Preview ({parsedPreview.length})</p>
                          <div style={{display: "flex", flexDirection: "column", gap: "6px", maxHeight: "180px", overflowY: "auto"}}>
                            {parsedPreview.slice(0, 10).map((q: any, idx: number) => (
                              <div key={`preview-${idx}`} style={{fontSize: "12px", borderBottom: "1px dashed var(--border)", paddingBottom: "4px"}}>
                                <strong style={{fontSize: "10px", color: "var(--accent)", marginRight: "6px"}}>{q.type}</strong>{q.question}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                </div>
                <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px"}}>
                    {["video", "slides", "bookPdf", "audioBook", "infographic", "mindMap"].map(f => (
                        <div key={f}><p style={{fontSize: "11px", color: "var(--accent)", fontWeight: "800", textTransform: "uppercase", marginBottom: "6px"}}>{f}</p><input type="text" value={tempChapter[f] || ""} onChange={(e) => setTempChapter({...tempChapter, [f]: e.target.value})} style={{padding: "12px"}} /></div>
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
        {fireworksMode && (
          <div className="firework-burst">🎆🎇</div>
        )}
        {themeUnlockShowcase && (
          <div style={{position: "fixed", inset: 0, zIndex: 1204, background: "rgba(2,6,23,0.55)", display: "grid", placeItems: "center"}}>
            <div className="card" style={{maxWidth: "360px", textAlign: "center", padding: "22px"}}>
              <p style={{fontSize: "11px", color: "var(--muted)", textTransform: "uppercase", fontWeight: "900"}}>Theme Unlocked</p>
              <h3 style={{fontSize: "24px", marginTop: "8px", marginBottom: "8px", color: "var(--accent)"}}>✨ {themeUnlockShowcase.label}</h3>
              <p style={{fontSize: "13px", color: "var(--muted)"}}>You earned a new theme through achievements.</p>
              <button className="btn btn-primary" style={{marginTop: "12px"}} onClick={() => setThemeUnlockShowcase(null)}>Awesome</button>
            </div>
          </div>
        )}
        {masteryConfetti && (
          <div className="achievement-confetti">
            {["🎉", "✨", "📚", "✅", "🔥", "💯", "🏆", "🥳", "🎊", "⭐", "🚀", "🧠"].map((icon, idx) => (
              <span
                key={`mastery-confetti-${idx}`}
                className="confetti-piece"
                style={{
                  left: `${(idx * 8) + 2}%`,
                  animationDelay: `${(idx % 6) * 0.06}s`,
                }}
              >
                {icon}
              </span>
            ))}
          </div>
        )}
        {achievementToast && (
          <>
            <div className="achievement-confetti">
              {["🎉", "✨", "🏅", "🎊", "🌟", "🔥", "📚", "💯", "🥳", "🏆", "🎈", "⭐"].map((icon, idx) => (
                <span
                  key={`confetti-${idx}`}
                  className="confetti-piece"
                  style={{
                    left: `${(idx * 8) + 2}%`,
                    animationDelay: `${(idx % 6) * 0.07}s`,
                  }}
                >
                  {icon}
                </span>
              ))}
            </div>
            <div style={{position: "fixed", right: "20px", bottom: "20px", zIndex: 1201, padding: "12px 16px", borderRadius: "14px", border: "1px solid rgba(var(--accent-rgb),0.6)", background: "var(--accent)", color: "white", fontWeight: "800", boxShadow: "0 8px 18px rgba(var(--accent-rgb),0.28)"}}>
              🏆 {achievementToast}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
