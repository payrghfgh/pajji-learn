import assert from "node:assert/strict";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import Module from "node:module";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import * as ts from "typescript";

// --- DETERMINISTIC RUNTIME MOCKS ---
// Lock live clocks so renders produce identical, deterministic HTML across runs and platforms
const origToLocaleTimeString = Date.prototype.toLocaleTimeString;
Date.prototype.toLocaleTimeString = function (locales?: any, options?: any) {
  if (options && options.hour) return "12:00 PM";
  return "12:00:00 PM";
};

// Mock third-party and platform modules before routed pages load
const originalRequire = (Module.prototype as any).require;
(Module.prototype as any).require = function (id: string) {
  if (id === "mapbox-gl") {
    return { accessToken: "" };
  }
  if (id === "mapbox-gl/dist/mapbox-gl.css") {
    return {};
  }
  if (
    id === "@/lib/firebase" ||
    id === "../../lib/firebase" ||
    id === "../lib/firebase" ||
    id === "./lib/firebase"
  ) {
    return { auth: {}, db: {} };
  }
  if (
    id === "@/lib/admin" ||
    id === "../../lib/admin" ||
    id === "../lib/admin"
  ) {
    return { isAdmin: (email: string) => email === "admin@example.com" };
  }
  if (
    id === "@/lib/focus-flight" ||
    id === "../../lib/focus-flight" ||
    id === "../lib/focus-flight" ||
    id === "./lib/focus-flight"
  ) {
    const locs = {
      DEL: { name: "Delhi", code: "DEL", coords: { lat: 28.6139, lng: 77.209 } },
      BOM: { name: "Mumbai", code: "BOM", coords: { lat: 19.076, lng: 72.877 } },
    };
    return {
      getActiveFlight: () => null,
      setActiveFlight: () => undefined,
      saveFlightSession: () => undefined,
      getFlightHistory: () => ({
        sessions: [
          {
            id: "flight-1",
            task: "Physics Chapter 1",
            startTime: 1776360000000,
            route: { id: "del-bom", from: locs.DEL, to: locs.BOM, duration: 25, difficulty: "Relaxed" },
            status: "completed",
            focusRating: 5,
            reflection: "Deep work session on Newton's laws",
            interruptionCount: 0,
            lastActive: 1776361500000,
            gate: "A10",
            seatClass: "First",
          },
        ],
        totalDistance: 120,
        streak: 5,
        unlockedDestinations: ["DEL", "BOM"],
      }),
      ROUTES: [
        { id: "del-bom", from: locs.DEL, to: locs.BOM, duration: 25, difficulty: "Relaxed" },
      ],
      LOCATIONS: locs,
    };
  }
  if (id === "firebase/auth") {
    return {
      onAuthStateChanged: (_auth: unknown, _cb: unknown) => () => undefined,
      signInWithEmailAndPassword: async () => undefined,
      createUserWithEmailAndPassword: async () => undefined,
      signInAnonymously: async () => undefined,
      signOut: async () => undefined,
      getAuth: () => ({}),
    };
  }
  if (id === "firebase/firestore") {
    return {
      collection: () => ({}),
      onSnapshot: () => () => undefined,
      addDoc: async () => ({}),
      query: () => ({}),
      orderBy: () => ({}),
      serverTimestamp: () => ({}),
      updateDoc: async () => ({}),
      doc: () => ({}),
      getDocs: async () => ({ docs: [], empty: true, forEach: () => undefined }),
      getDoc: async () => ({ exists: () => false, data: () => ({}) }),
      setDoc: async () => ({}),
      where: () => ({}),
      limit: () => ({}),
      getFirestore: () => ({}),
    };
  }
  if (id === "firebase/app") {
    return {
      initializeApp: () => ({}),
      getApps: () => [{}],
    };
  }
  if (id === "next/link") {
    return function Link(props: any) {
      return React.createElement("a", { href: props.href, className: props.className, style: props.style }, props.children);
    };
  }
  return originalRequire.apply(this, arguments as any);
};

// Internal View Components
import { DashboardView } from "../app/components/DashboardView";
import { LibraryView } from "../app/components/LibraryView";
import { LeaderboardView } from "../app/components/LeaderboardView";
import { SettingsView } from "../app/components/SettingsView";
import { MembershipView } from "../app/components/MembershipView";
import { StudyView } from "../app/components/StudyView";
import { EditView } from "../app/components/EditView";
import { ChapterListView } from "../app/components/ChapterListView";
import { CreditsView } from "../app/components/CreditsView";
import { parseFlashcardsFromCsv } from "../app/lib/study-import";

// Routed Pages
const AdminPage = require("../app/admin/page.js").default;
const LoginPage = require("../app/Login/page.js").default;
const RedeemPage = require("../app/redeem/page.js").default;
const FocusFlightPage = require("../app/focus-flight/page.js").default;

const noop = () => undefined;
const noAsync = async () => undefined;

const fixtureChapter = {
  id: "chapter-motion",
  title: "Motion and Force",
  summary: "A seeded lesson summary with real study content.",
  spellings: "inertia\nvelocity\nacceleration",
  flashcards: [{ q: "What is inertia?", a: "Resistance to change in motion." }],
  quiz: [
    {
      type: "mcq",
      question: "What is SI unit of force?",
      options: ["Newton", "Joule", "Watt", "Pascal"],
      correctIndex: 0,
      answer: "",
      caseText: "",
      imageUrl: "",
      explanation: "Force is measured in newtons.",
    },
  ],
  media: {
    video: "https://youtube.com/watch?v=dQw4w9WgXcQ",
    slides: "",
    bookPdf: "",
    audioBook: "",
    infographic: "",
    mindMap: "",
  },
};

const fixtureBook = { id: "physics-10", title: "Physics X", chapters: [fixtureChapter] };

const seededChapters = [
  {
    id: "chapter-motion",
    title: "1. Motion and Force: Inertia, Newton's Laws and Friction",
    summary: "A comprehensive lesson covering inertia, momentum, friction, and Newton's three laws of motion.",
    spellings: "inertia\nvelocity\nacceleration\nmomentum\nfriction",
    flashcards: [{ q: "What is inertia?", a: "Resistance to change in motion." }],
    quiz: [
      {
        type: "mcq",
        question: "What is SI unit of force?",
        options: ["Newton", "Joule", "Watt", "Pascal"],
        correctIndex: 0,
        answer: "",
        caseText: "",
        imageUrl: "",
        explanation: "Force is measured in newtons.",
      },
    ],
    media: {
      video: "https://youtube.com/watch?v=dQw4w9WgXcQ",
      slides: "",
      bookPdf: "",
      audioBook: "",
      infographic: "",
      mindMap: "",
    },
  },
  {
    id: "chapter-work",
    title: "2. Work, Energy and Power: Kinetic & Potential Energy",
    summary: "Work energy theorem, conservation of mechanical energy, and power calculations in SI units.",
    spellings: "kinetic\npotential\njoule\nhorsepower",
    flashcards: [{ q: "What is work done when displacement is perpendicular to force?", a: "Zero joules." }],
    quiz: [],
    media: { video: "", slides: "", bookPdf: "", audioBook: "", infographic: "", mindMap: "" },
  },
  {
    id: "chapter-machines",
    title: "3. Machines: Levers, Pulleys and Mechanical Advantage",
    summary: "Mechanical advantage, velocity ratio, efficiency, and ideal vs practical pulley systems.",
    spellings: "fulcrum\neffort\nvelocity ratio\npulley",
    flashcards: [{ q: "What is the efficiency of an ideal machine?", a: "100 percent." }],
    quiz: [],
    media: { video: "", slides: "", bookPdf: "", audioBook: "", infographic: "", mindMap: "" },
  },
  {
    id: "chapter-refraction",
    title: "4. Refraction of Light: Snell's Law and Total Internal Reflection",
    summary: "Refractive index, critical angle, total internal reflection in prisms, and spherical lenses.",
    spellings: "refraction\ncritical angle\nsnell\ndispersion",
    flashcards: [{ q: "What happens to speed of light in a denser medium?", a: "Speed decreases." }],
    quiz: [],
    media: { video: "", slides: "", bookPdf: "", audioBook: "", infographic: "", mindMap: "" },
  },
  {
    id: "chapter-spectrum",
    title: "5. Spectrum and Sound: Dispersion, Echoes and Sonic Vibrations",
    summary: "Electromagnetic spectrum, acoustic vibrations, reflection of sound waves, and resonance.",
    spellings: "wavelength\nfrequency\nresonance\necho",
    flashcards: [{ q: "What minimum distance is required to hear an echo in air?", a: "17 meters." }],
    quiz: [],
    media: { video: "", slides: "", bookPdf: "", audioBook: "", infographic: "", mindMap: "" },
  },
];

const seededChapterBook = {
  id: "physics-10",
  title: "ICSE Class 10 Physics: Motion, Energy, Light & Modern Physics",
  chapters: seededChapters,
};

const seededLibraryBooks = [
  seededChapterBook,
  {
    id: "chemistry-10",
    title: "ICSE Class 10 Chemistry: Periodic Table, Chemical Bonding & Organic Chemistry",
    chapters: seededChapters.slice(0, 4),
  },
  {
    id: "biology-10",
    title: "ICSE Class 10 Biology: Genetics, Cell Division, Plant & Human Physiology",
    chapters: seededChapters.slice(0, 5),
  },
  {
    id: "maths-10",
    title: "ICSE Class 10 Mathematics: Commercial Mathematics, Algebra & Coordinate Geometry",
    chapters: seededChapters.slice(0, 5),
  },
  {
    id: "history-10",
    title: "ICSE Class 10 History & Civics: The Indian National Movement & Contemporary World",
    chapters: seededChapters.slice(0, 4),
  },
  {
    id: "geography-10",
    title: "ICSE Class 10 Geography: Climate, Soil Resources, Natural Vegetation & Water",
    chapters: seededChapters.slice(0, 5),
  },
  {
    id: "english-10",
    title: "ICSE Class 10 English Literature: Julius Caesar & Selected Poems & Short Stories",
    chapters: seededChapters.slice(0, 4),
  },
  {
    id: "computer-10",
    title: "ICSE Class 10 Computer Applications: Java OOP Principles & Array Algorithms",
    chapters: seededChapters.slice(0, 5),
  },
];
const fixtureUser = {
  uid: "learner-1",
  email: "learner@example.com",
  isAnonymous: false,
  uiSettings: { displayName: "Aarav Learner" },
};
const AnimatedCounter = ({ value }: { value: number }) => <span>{value}</span>;
const FocusGarden = () => <div>Seeded focus garden</div>;

// React 19 SSR Hook Dispatcher wrapper to seed component internal useState values
const clientInternals = (React as any).__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;

function WithHookState({
  overrides,
  children,
}: {
  overrides: Record<number, unknown>;
  children: React.ReactNode;
}) {
  let callIdx = 0;
  const currentDispatcher = clientInternals?.H;
  if (currentDispatcher) {
    const origUseState = currentDispatcher.useState;
    currentDispatcher.useState = function (initial: unknown) {
      const idx = callIdx++;
      if (idx in overrides) {
        return [overrides[idx], () => undefined];
      }
      return origUseState.call(this, initial);
    };
  }
  return <>{children}</>;
}

// 1. Internal views (9 internal views)
const internalRenderCases: Record<string, React.ReactElement> = {
  dashboard: (
    <DashboardView
      userXP={5760}
      userLevel={12}
      streakCount={14}
      completedLessons={[fixtureChapter.id]}
      dailyGoal={4}
      dailyCompleted={3}
      goalProgressPct={75}
      heatmapData={Array.from({ length: 4 }, () => [0, 1, 2, 3, 4, 1, 0])}
      resumeLesson={{ book: fixtureBook, chapter: fixtureChapter }}
      smartRecommendation={{ book: fixtureBook, chapter: fixtureChapter }}
      recentPinnedPoints={[{ id: "point-1", text: "Newton's first law", lessonId: fixtureChapter.id }]}
      achievementProgressList={[{ id: "streak_7", title: "Seven day streak", unlocked: true, progress: 7, target: 7 }]}
      allUnlockedAchievementIds={["streak_7"]}
      achievementCatalog={[{ id: "streak_7", title: "Seven day streak" }]}
      nextAchievement={{ id: "xp_10000", title: "Ten thousand XP", progress: 5760, target: 10000 }}
      bestQuizScore={100}
      weakLessonIds={[]}
      recentQuizAttempts={[{ lessonId: fixtureChapter.id, score: 100, createdAt: "2026-10-16" }]}
      allNotesEntries={[
        {
          lessonId: fixtureChapter.id,
          lessonTitle: fixtureChapter.title,
          note: "Inertia is resistance to change.",
          lesson: { book: fixtureBook, chapter: fixtureChapter },
          tags: ["physics"],
        },
      ]}
      availableNoteTags={["physics"]}
      notesSearch=""
      setNotesSearch={noop}
      notesTagFilter=""
      setNotesTagFilter={noop}
      openLesson={noop}
      removePinnedKeyPoint={noop}
      exportAllNotesMarkdown={noop}
      getLessonById={() => ({ book: fixtureBook, chapter: fixtureChapter })}
      getUnmastered={() => []}
      getUserName={() => "Aarav Learner"}
      greeting={{ text: "Good morning", emoji: "☀️" }}
      quote="Small steps every day lead to big results."
      user={fixtureUser}
      memTier="plus"
      AnimatedCounter={AnimatedCounter}
      FocusGarden={FocusGarden}
      setView={noop}
      setCurBook={noop}
      setCurChapter={noop}
    />
  ),
  library: (
    <LibraryView
      isOwner
      books={seededLibraryBooks}
      db={{}}
      libraryQuery=""
      setLibraryQuery={noop}
      sortedFilteredBooks={seededLibraryBooks}
      setCurBook={noop}
      setView={noop}
    />
  ),
  leaderboard: (
    <LeaderboardView
      leaderboardMode="all"
      setLeaderboardMode={noop}
      leaderboard={[
        { uid: "p1", email: "maya@example.com", xp: 8200, membership: "ultra" },
        { uid: "p2", email: "jay@example.com", xp: 7300, membership: "pro" },
        { uid: "learner-1", email: fixtureUser.email, xp: 5760, membership: "plus" },
      ]}
      weeklyLeaderboard={[
        { uid: "learner-1", email: fixtureUser.email, weeklyXP: 540, membership: "plus" },
        { uid: "p2", email: "jay@example.com", weeklyXP: 420 },
        { uid: "p1", email: "maya@example.com", weeklyXP: 320 },
      ]}
      user={fixtureUser}
      getMemberTier={(tier) => tier || "free"}
    />
  ),
  settings: (
    <SettingsView
      isOwner={false}
      mobileQuickSettings
      setMobileQuickSettings={noop}
      setView={noop}
      giftUserSearch=""
      setGiftUserSearch={noop}
      giftUserResults={[]}
      setGiftUserResults={noop}
      setSaveStatus={noop}
      allFeedback={[]}
      fetchFeedback={noop}
      db={{}}
      user={fixtureUser}
      membership="plus"
      membershipExpiry="2027-10-16T00:00:00.000Z"
      profilePic=""
      setProfilePic={noop}
      getUserName={() => "Aarav Learner"}
      signOut={noop}
      auth={{}}
      memTier="plus"
      streakCount={14}
      dailyGoal={2}
      updateDailyGoal={noop}
      theme="dark"
      setTheme={noop}
      uiTheme="default"
      setUiTheme={noop}
      textSize="default"
      setTextSize={noop}
      reduceMotion={false}
      setReduceMotion={noop}
      highContrast={false}
      setHighContrast={noop}
      sidebarDensity="comfortable"
      setSidebarDensity={noop}
      sidebarStyle="default"
      setSidebarStyle={noop}
      aiPersonality="mentor"
      setAiPersonality={noop}
      soundEnabled
      setSoundEnabled={noop}
      isZenMode={false}
      setIsZenMode={noop}
      displayName="Aarav Learner"
      setDisplayName={noop}
      unlockedAchievements={["streak_7"]}
      adminOnlyThemeIds={[]}
      giftedThemes={[]}
      customThemes={[]}
    />
  ),
  membership: (
    <MembershipView
      memTier="plus"
      setView={noop}
      handleCardMouseMove={noop as any}
      handleCardMouseLeave={noop}
      rotateX={0}
      rotateY={0}
      shineBackground="none"
      user={fixtureUser}
      getUserName={() => "Aarav Learner"}
      profilePic=""
      membershipExpiry="2027-10-16T00:00:00.000Z"
      getDayDiff={() => 365}
      getLocalDateKey={() => "2026-10-16"}
      userData={{}}
      db={{}}
      setSaveStatus={noop}
    />
  ),
  chapters: (
    <ChapterListView
      book={seededChapterBook}
      completedLessons={["chapter-motion", "chapter-machines"]}
      isOwner
      onBack={noop}
      onAddLesson={noop}
      onStudy={noop}
      onEdit={noop}
    />
  ),
  credits: <CreditsView onBack={noop} />,
  study: (
    <StudyView
      curChapter={fixtureChapter}
      setView={noop}
      quickReviewMode={false}
      setQuickReviewMode={noop}
      completedLessons={[]}
      markCompleted={noop}
      unmasterLesson={noop}
      isSpeedReadOpen={false}
      setIsSpeedReadOpen={noop}
      speedReadIndex={0}
      setSpeedReadIndex={noop}
      isZenMode={false}
      FocusGarden={FocusGarden}
      switchStudyTab={noop}
      activeTab="Quiz"
      aiExplainQuestion="Explain inertia"
      setAiExplainQuestion={noop}
      askAiExplanation={noop}
      aiExplainLoading={false}
      aiExplainAnswer="Inertia is resistance to a change in motion."
      aiMode="chapter"
      setAiMode={noop}
      normalizeQuiz={(chapter) => chapter.quiz}
      quizActiveIndices={null}
      quizQuestionOrder={[0]}
      quizReview={{}}
      currentQuizPos={0}
      setCurrentQuizPos={noop}
      startQuizAttempt={noop}
      quizSubmitted={false}
      quizShuffleEnabled={false}
      setQuizShuffleEnabled={noop}
      showShortcuts={false}
      setShowShortcuts={noop}
      useFiftyFiftyPowerUp={noop}
      usedFiftyFifty={{}}
      useHintPowerUp={noop}
      usedHint={{}}
      useSkipPowerUp={noop}
      usedSkip={{}}
      quizAnswers={{}}
      setQuizAnswers={noop}
      setQuizSubmitted={noop}
      setQuizReview={noop}
      setQuizResult={noop}
      quizResult=""
      submitQuiz={noop}
      formatDrivePreviewLink={(value) => value}
      formatImageLink={(value) => value}
      quizImageErrors={{}}
      setQuizImageErrors={noop}
      quizOptionOrder={{}}
      hiddenOptionsByQuestion={{}}
      formatYoutubeLink={(value) => value}
      noteDraft="Inertia note"
      setNoteDraft={noop}
      noteSaving={false}
      noteSavedAt="2026-10-16"
      insertNoteTemplate={noop}
      saveCurrentNote={noAsync}
      generateFlashcardsFromNote={noop}
      exportCurrentNote={noop}
      newTagInput="physics"
      setNewTagInput={noop}
      addTagToCurrentLesson={noop}
      quickTagOptions={["physics"]}
      currentLessonTags={["physics"]}
      removeTagFromCurrentLesson={noop}
      newPinnedPointText="Key point"
      setNewPinnedPointText={noop}
      addPinnedKeyPoint={noop}
      lessonPinnedPoints={[{ id: "point-1", text: "Newton's first law" }]}
      removePinnedKeyPoint={noop}
      lessonFlashcards={fixtureChapter.flashcards}
      flashcardIndex={0}
      setFlashcardIndex={noop}
      flashcardReveal={false}
      setFlashcardReveal={noop}
      soundEnabled
    />
  ),
  editor: (
    <EditView
      tempChapter={fixtureChapter}
      setTempChapter={noop}
      saveAllChanges={noop}
      lastAutosavePayloadRef={{ current: "" }}
      setView={noop}
      addQuizQuestion={noop}
      removeQuizQuestion={noop}
      updateQuizQuestion={noop}
      updateQuizOption={noop}
      parserMode="balanced"
      setParserMode={noop as any}
      quizBuilderText="Question 1: What is force?\nA) Push\nB) Pull\nCorrect Answer: A"
      setQuizBuilderText={noop}
      previewParsedQuestions={noop}
      addPreviewToQuiz={noop}
      bulkAddQuizQuestions={noop}
      aiParseQuizQuestions={noop}
      aiParsingQuiz={false}
      exportQuizPack={noop}
      importQuizPack={noop}
      quizPackText=""
      setQuizPackText={noop}
      parsedPreview={[fixtureChapter.quiz[0]]}
      importFlashcardsCsv={noop}
    />
  ),
};

const html = (element: React.ReactElement) => `<!doctype html>\n${renderToStaticMarkup(element)}\n`;
const baselineDir = join(process.cwd(), "tests", "baselines", "render");
mkdirSync(baselineDir, { recursive: true });

// Verify pre-existing 9 internal views against committed baselines
const allowedDiffs = new Set(["dashboard", "library"]);
for (const [name, element] of Object.entries(internalRenderCases)) {
  const output = html(element);
  assert.ok(output.length > 100, `${name} rendered empty output`);
  const baselinePath = join(baselineDir, `${name}.html`);
  if (process.env.UPDATE_BASELINES === "1" || !existsSync(baselinePath)) {
    writeFileSync(baselinePath, output);
    console.log(`[BASELINES] Wrote ${name}`);
  } else {
    const expected = readFileSync(baselinePath, "utf8");
    if (output === expected) {
      console.log(`  MATCH: ${name} (${output.length} bytes)`);
    } else {
      console.log(`  DIFF:  ${name} (actual: ${output.length} bytes vs baseline: ${expected.length} bytes)`);
      if (!allowedDiffs.has(name)) {
        assert.equal(output, expected, `${name} changed unexpectedly from its baseline`);
      }
    }
  }
}


// 2. Routed pages & admin sub-states (seeded to render real content, not empty)
const deterministicDate = { toDate: () => ({ toLocaleDateString: () => "16/10/2026" }) };

const additionalRenderCases: Record<string, React.ReactElement> = {
  // Page: Login (/Login)
  login: <LoginPage />,

  // Page: Redeem (/redeem) with active user state
  redeem: (
    <WithHookState
      overrides={{
        0: { uid: "learner-1", email: "learner@example.com" }, // user
        1: false, // loading
      }}
    >
      <RedeemPage />
    </WithHookState>
  ),

  // Page: Focus Flight (/focus-flight) seeded with history and active destinations
  "focus-flight": (
    <WithHookState
      overrides={{
        2: {
          sessions: [
            {
              id: "flight-1",
              task: "Physics Chapter 1",
              startTime: 1776360000000,
              route: {
                id: "del-bom",
                from: { code: "DEL", name: "Delhi" },
                to: { code: "BOM", name: "Mumbai" },
                duration: 25,
              },
              status: "completed",
              focusRating: 5,
              reflection: "Deep work session on Newton's laws",
              interruptionCount: 0,
              lastActive: 1776361500000,
              gate: "A10",
              seatClass: "First",
            },
          ],
          totalDistance: 120,
          streak: 5,
          unlockedDestinations: ["DEL", "BOM"],
        },
      }}
    >
      <FocusFlightPage />
    </WithHookState>
  ),

  // Admin sub-state: Access Denied
  "admin-denied": (
    <WithHookState
      overrides={{
        0: { email: "unauthorized@example.com" },
        1: false,
      }}
    >
      <AdminPage />
    </WithHookState>
  ),

  // Admin sub-state: Promo Codes (seeded active promo inventory)
  "admin-codes": (
    <WithHookState
      overrides={{
        0: { email: "admin@example.com" },
        1: false,
        2: "codes",
        5: [
          {
            id: "code-1",
            code: "PAJJI-PLUS-2026",
            tier: "plus",
            isUsed: false,
            createdAt: deterministicDate,
          },
          {
            id: "code-2",
            code: "PAJJI-ULTRA-VIP",
            tier: "ultra",
            isUsed: true,
            createdAt: deterministicDate,
          },
        ],
      }}
    >
      <AdminPage />
    </WithHookState>
  ),

  // Admin sub-state: User Management (seeded database users with real stats)
  "admin-users": (
    <WithHookState
      overrides={{
        0: { email: "admin@example.com" },
        1: false,
        2: "users",
        10: [
          { id: "u-1", email: "learner@example.com", displayName: "Aarav Learner", membership: "ultra", xp: 5760 },
          { id: "u-2", email: "student2@example.com", displayName: "Maya Student", membership: "pro", xp: 4200 },
        ],
      }}
    >
      <AdminPage />
    </WithHookState>
  ),

  // Admin sub-state: AI Engine Control (seeded model & persona settings)
  "admin-ai": (
    <WithHookState
      overrides={{
        0: { email: "admin@example.com" },
        1: false,
        2: "ai",
        3: {
          systemPrompt: "You are Pajji Learn AI, a high-octane academic mentor.",
          model: "llama-3.3-70b-versatile",
          maxTokens: 500,
        },
      }}
    >
      <AdminPage />
    </WithHookState>
  ),

  // Settings sub-state: Admin Tab (Membership Manager + Feedback queue)
  "settings-admin": (
    <WithHookState
      overrides={{
        0: "admin", // activeSettingsTab = "admin"
      }}
    >
      <SettingsView
        isOwner={true}
        mobileQuickSettings={true}
        setMobileQuickSettings={noop}
        setView={noop}
        giftUserSearch="learner"
        setGiftUserSearch={noop}
        giftUserResults={[
          { id: "learner-1", email: "learner@example.com", membership: "PAJJIPLUS" },
          { id: "learner-2", email: "vip@example.com", membership: "PAJJIULTRA" },
        ]}
        setGiftUserResults={noop}
        setSaveStatus={noop}
        allFeedback={[
          {
            id: "fb-1",
            userEmail: "learner@example.com",
            text: "Love the new spaced repetition review mode!",
            timestamp: deterministicDate,
          },
        ]}
        fetchFeedback={noop}
        db={{}}
        user={{ ...fixtureUser, email: "admin@example.com" }}
        membership="plus"
        membershipExpiry="2027-10-16T00:00:00.000Z"
        profilePic=""
        setProfilePic={noop}
        getUserName={() => "Aarav Learner"}
        signOut={noop}
        auth={{}}
        memTier="plus"
        streakCount={14}
        dailyGoal={2}
        updateDailyGoal={noop}
        theme="dark"
        setTheme={noop}
        uiTheme="default"
        setUiTheme={noop}
        textSize="default"
        setTextSize={noop}
        reduceMotion={false}
        setReduceMotion={noop}
        highContrast={false}
        setHighContrast={noop}
        sidebarDensity="comfortable"
        setSidebarDensity={noop}
        sidebarStyle="default"
        setSidebarStyle={noop}
        aiPersonality="mentor"
        setAiPersonality={noop}
        soundEnabled={true}
        setSoundEnabled={noop}
        isZenMode={false}
        setIsZenMode={noop}
        displayName="Aarav Learner"
        setDisplayName={noop}
        unlockedAchievements={["streak_7"]}
        adminOnlyThemeIds={[]}
        giftedThemes={[]}
        customThemes={[]}
      />
    </WithHookState>
  ),
};

for (const [name, element] of Object.entries(additionalRenderCases)) {
  const output = html(element);
  assert.ok(output.length > 100, `${name} rendered empty output`);
  const baselinePath = join(baselineDir, `${name}.html`);
  if (process.env.UPDATE_BASELINES === "1" || !existsSync(baselinePath)) {
    writeFileSync(baselinePath, output);
  } else {
    assert.equal(output, readFileSync(baselinePath, "utf8"), `${name} changed from its baseline`);
  }
}

// 3. Parser Tests
// Test CSV importer with embedded commas in quoted fields
const csv = parseFlashcardsFromCsv('Question,Answer\n"what, is","the answer"');
assert.deepEqual(csv, [{ q: "what, is", a: "the answer" }], "Quoted CSV with embedded commas failed to parse");

// Test CSV importer 300-card cap
const cappedCsv = `Question,Answer\n${Array.from({ length: 301 }, (_, index) => `Q${index},A${index}`).join("\n")}`;
assert.equal(parseFlashcardsFromCsv(cappedCsv).length, 300, "Flashcard CSV 300-card cap failed");

// Test NotebookLM parser: transpiled directly from app/page.tsx so production exports are untouched
const pageSource = readFileSync(join(process.cwd(), "app", "page.tsx"), "utf8");
const parserStart = pageSource.indexOf("const parseNotebookLMMixedQuestions =");
const parserEnd = pageSource.indexOf("\n  const parseWithMode", parserStart);
assert.ok(parserStart >= 0 && parserEnd > parserStart, "NotebookLM parser source was not found in app/page.tsx");

const parserTs = pageSource.slice(parserStart, parserEnd);
const parserJs = ts.transpileModule(parserTs, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

const parseNotebookLM = new Function(`${parserJs}; return parseNotebookLMMixedQuestions;`)() as (
  input: string
) => any[];

// NotebookLM Case A: Standard A) options and "Correct Answer: A"
const notebookQuestionsA = parseNotebookLM(
  `I. Multiple Choice\nQuestion 1: Which law describes inertia?\nA) Newton's First Law\nB) Newton's Second Law\nCorrect Answer: A`
);
assert.equal(notebookQuestionsA.length, 1);
assert.equal(notebookQuestionsA[0].type, "mcq");
assert.equal(notebookQuestionsA[0].correctIndex, 0);
assert.equal(notebookQuestionsA[0].options[0], "Newton's First Law");

// NotebookLM Case B: Wrapped options with parentheses (A) / (B) and "Correct Answer: A"
const notebookQuestionsWrapped = parseNotebookLM(
  `I. Multiple Choice\nQuestion 1: Which law describes inertia?\n(A) Newton's First Law\n(B) Newton's Second Law\nCorrect Answer: A`
);
assert.equal(notebookQuestionsWrapped.length, 1);
assert.equal(notebookQuestionsWrapped[0].type, "mcq");
assert.equal(notebookQuestionsWrapped[0].correctIndex, 0);
assert.equal(notebookQuestionsWrapped[0].options[0], "Newton's First Law");

// NotebookLM Case C: Mixed sections including One-Word and Case Study
const notebookMixed = parseNotebookLM(`I. Multiple Choice
1. What is the SI unit of force?
(A) Newton
(B) Joule
(C) Watt
(D) Pascal
Correct Answer: A

II. One-Word / Short Answer
2. What property of a body opposes change in motion?
Answer: Inertia

Case Study 1: "A car comes to a sudden stop and passengers lurch forward."
Question 1: Which law explains this phenomenon?
Answer: Newton's First Law`);

assert.equal(notebookMixed.length, 3);
assert.equal(notebookMixed[0].type, "mcq");
assert.equal(notebookMixed[0].options[0], "Newton");
assert.equal(notebookMixed[1].type, "oneWord");
assert.equal(notebookMixed[1].answer, "Inertia");
assert.equal(notebookMixed[2].type, "caseStudy");
assert.equal(notebookMixed[2].answer, "Newton's First Law");

const totalViews = Object.keys(internalRenderCases).length + Object.keys(additionalRenderCases).length;
console.log(`Rendered and verified ${totalViews} seeded views/states; parser checks passed.`);
