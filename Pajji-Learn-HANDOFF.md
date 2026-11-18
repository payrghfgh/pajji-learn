# Pajji Learn — handoff spec

**Read this before you touch the redesign plan.**

The redesign plan (`Pajji-Learn-Redesign.html`) is the **visual target only**. It is a static mockup: no scripts, no handlers, no data. Its own build-spec section says so, and says the behavioural source of truth is the `pajrghfgh/pajji-learn` repo.

So do **not** port the HTML literally. Match the layout; take every name, formula, field and gate from the code.

---

## The three inputs

| Input | Use it for | Don't use it for |
|---|---|---|
| `Pajji-Learn-Redesign.html` | Layout, spacing, colour, type — the visual target | Behaviour, data shapes, anything dynamic |
| `github.com/pajrghfgh/pajji-learn` | Every formula, field name, Firestore shape, gate | Visual decisions — its styling is what's being replaced |
| `Pajji-Learn-Prototype.html` *(optional)* | A working reference: every screen interactive | Shipping — it's a single-file mockup |

`Pajji-Learn-React-App.zip` is a **Next.js + TypeScript reference implementation** of the plan, already 1:1 with the frames, typed and tested. Start from it if you want a running baseline rather than an empty repo.

---

## Hard rules

1. **Do not invent a data shape. Do not rename an existing Firestore field.** The app and the AdminHub read the same documents.
2. **Build as React components inside the existing Next.js app.** Reuse the state in `app/page.tsx` — the screens already map onto components that exist.
3. **Split `app/page.tsx` first.** It is ~5,200 lines and holds view routing, XP/streak/level, the quiz engine and every subscription. Nothing else is pleasant until that's done.

---

## Design tokens

Copy these verbatim — they are the plan's own values.

```css
--ink-0:#08090C; --ink-1:#0D0F13; --ink-2:#13161C; --ink-3:#1A1F27; --ink-4:#232A34;
--line:rgba(255,255,255,.07); --line-2:rgba(255,255,255,.13);
--text:#EEF2F6; --dim:#9AA6B4; --faint:#5F6B79;

--jade:#19C37D;  --jade-d:#0C6B45;  --jade-soft:rgba(25,195,125,.13);
--amber:#FFB020; --amber-d:#9C6A00; --amber-soft:rgba(255,176,32,.14);
--azure:#4EA8FF; --azure-d:#1B5FA8; --azure-soft:rgba(78,168,255,.14);
--coral:#FF6B6B; --coral-d:#A83535; --coral-soft:rgba(255,107,107,.14);

--r-s:10px; --r-m:16px; --r-l:22px; --r-xl:30px;

--disp:'Bricolage Grotesque',ui-sans-serif,system-ui,sans-serif;
--body:'Plus Jakarta Sans',ui-sans-serif,system-ui,sans-serif;
--mono:'Azeret Mono',ui-monospace,monospace;
```

**Colour has a job — never use it decoratively.**
Jade = progress · Amber = effort/streak · Azure = subjects · Coral = mistakes.

**Frames are drawn at 1440×1024 (desktop) and 390×844 (mobile).** Both exist for every screen. The desktop frame is a flex **row** (rail + main); the mobile frame is a flex **column** with the tab bar pinned at the bottom. That column is what pins the bar — get it wrong and the bar floats.

---

## Screens

Every screen has a desktop **and** a mobile frame. Mobile is not the desktop squeezed — it is its own layout.

| # | Screen | The idea |
|---|---|---|
| 1 | **Landing** | Full-width, **no app rail**. A promise, a preview, one button. |
| 2 | **Sign in / Sign up** | Split: left panel sells the streak, right panel gets out of the way. |
| 3 | **Dashboard** | Bento grid, one dominant "resume" tile; XP and streak as sidekicks. |
| 4 | **Study** | One card, one question. 11 tabs: Summary, Spellings, Flashcards, Quiz, AI Explanation, My Notes, Video, Book PDF, Slides, Infographic, Mind Map. |
| 5 | **Library** | A shelf, not a spreadsheet. Cover art, progress per book, filter rail. |
| 6 | **Leaderboard** | Podium, but your own row is pinned so the comparison motivates. |
| 7 | **Membership** | **No prices anywhere.** Free, and a barter with Pajji Services. |
| 8 | **Settings** | All 15 themes in one gallery, plus Light / Dark / System. |
| 9 | **Focus Flight** | A 25-minute flight turns a study block into a journey. |
| 10 | **Book — chapter list** | Study opens the lesson; the pencil opens the editor. |
| 11 | **Editor — content** | Summary, Spellings, then the quiz builder. |
| 12 | **Editor — bulk & attachments** | Paste a NotebookLM quiz, import a CSV, six media slots. |
| 13 | **Admin — Promo Codes** | Bulk-generate, tier + duration, live inventory. |
| 14 | **Admin — User Management** | Every account with its real numbers. |
| 15 | **Admin — AI Engine** | Live persona, model and response cap for the Groq calls. |
| 16 | **Settings — Admin tab** | Membership manager + feedback queue. |
| 17 | **Admin — access denied** | The gate runs before a single admin read. |

---

## Behaviour — take these from the code, not the mockup

**Level:** `floor(XP / 500) + 1`. The mockup's 5,760 XP is Level 12.
**XP:** 10 per flashcard, 10 per correct quiz answer, 20 on Ultra.
**Quiz skip cost:** Ultra/Pro 0, Plus 10, Free 20.
**Admin gate:** `isAdmin(user.email)` — checked *before* any admin read.
**Promo codes** write to `promo_codes`; **AI config** writes to `settings/ai_config`.

### Themes — two independent axes

Theme (colour identity) and mode (Light / Dark / System) are **separate**. 15 themes:

`Default · Midnight · Ember · Ocean · Violet · Rose · Lime · Gold · Cyber · Forest · Arctic · Paper · Zenith · Sand · Williams Blue`

Gating: **6 free**, some **Plus-only** (Williams Blue among them), **zenith/midnight Ultra-only**, six achievement-gated. Use the app's existing `hasThemeAccess()` — do not re-derive the rules.

---

## Data shapes (from the code — do not change these)

```
Book    { id, title, chapters }            // no icon field
Chapter { id, title, summary, spellings, flashcards[], quiz[], media{} }
Flashcard { q, a }
QuizQuestion { type, question, options[], correct }
media   { video, slides, bookPdf, audioBook, infographic, mindMap }
```

### Two known traps

- **Subject icons.** The mockup's ⚛ ⚗ ∑ ✎ are literal characters. The app renders a hardcoded 📖 for every book and the document has no icon field. Add a **title→icon map** (title contains Physics → ⚛, Chemistry → ⚗, Maths → ∑, English → ✎, else 📖) plus an optional `icon` field that overrides it.
- **Flashcards have two import paths.** `importFlashcardsCsv()` in `EditView` takes a NotebookLM CSV (`Question,Answer` or `Front,Back`, capped at **300** cards) and **replaces** the deck. `generateFlashcardsFromNote()` is a local line parser on the note.

---

## Verification

Before calling it done:

1. `npx tsc --noEmit` — zero errors.
2. Render **every** screen and assert non-empty output. (The reference app does this with `react-dom/server` + a seeded store — see `scripts/render-test.tsx`.)
3. Unit-test the parsers: the NotebookLM bulk parser (wrapped questions, `A)` options, `Correct Answer: A`) and the CSV importer. Quoted CSV fields containing commas are a known failure mode — `"what, is","the answer"` must parse.
4. Click **every** `data-act` / interactive element in **both** layouts and assert zero console errors.
5. On mobile, assert the tab bar is **pinned to the bottom** and the rail is hidden.

---

## Known gaps in the plan's own data

The frames disagree with each other in places — treat the code as right:

- Dashboard shows **5,760 XP / Level 12**; the chapter-list and editor frames show **1,970 XP / Lvl 5**.
- Dashboard says **today's goal 70%**; Settings says **daily goal 4 lessons**. 70% of 4 isn't a whole number — the mockup is internally inconsistent.

Pick the Dashboard's numbers (most visible) and keep the app self-consistent.
