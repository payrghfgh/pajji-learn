#!/usr/bin/env node
/**
 * check-design-tokens — a RATCHET, not a clean bill of health.
 *
 * THIS SCRIPT PASSES WITH ROUGHLY 1,331 HARDCODED COLOUR REFERENCES STILL IN
 * THE REPO. They live in app/admin/** and app/focus-flight/**, which are
 * whitelisted because those screens were never migrated: admin is 431 Tailwind
 * utilities with 84 hardcoded colours, the Focus Flight suite is ~900 with
 * ~130. Neither has been through the design-system pass.
 *
 * A green run therefore does NOT mean "the app is clean". It means exactly two
 * things:
 *   1. no NEW violations were added to the swept surface, and
 *   2. the screens that were swept stayed swept.
 *
 * If you are reading a green run as a quality signal, you are misreading it.
 * Delete a whitelist entry only when that screen has actually been migrated.
 *
 * NOT WIRED INTO CI. Not in package.json, not in lint. Run it by hand:
 *
 *     node scripts/check-design-tokens.mjs
 *
 * Exit 0 = nothing outside the whitelist. Exit 1 = violations.
 *
 * ── rules ──────────────────────────────────────────────────────────────────
 *
 *  1a. Tailwind colour utilities in className — bg-/text-/border-/ring-/
 *      from-/to-/via- against a named palette family. bg-emerald-500 is
 *      literally the retired #10b981.
 *  1b. Arbitrary-value hex in className — bg-[#121214], text-[#04150D].
 *      Slips 1a (no family name) and 2a (not a style object).
 *  2a. Raw hex inside a style object.
 *  2b. rgb()/rgba() inside a style object. Found eight slate-400s, a blue-500
 *      and two red-500s the hex rule had missed.
 *  3a. transition: all.
 *  3b. the transition-all Tailwind class.
 *  3c. font-syne or --font-main — the pre-redesign type system.
 *
 * ── allowlist policy ───────────────────────────────────────────────────────
 *
 * Exceptions are per-value and each carries the reason it exists. They are not
 * blanket regexes over a colour family. If an allowlisted value is ever used
 * for something other than its named purpose, it stops being an exception and
 * becomes a token — that is how --ink-on-accent was born.
 */

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SCAN_DIRS = ["app", "lib"];
const WHITELIST = ["app/admin/", "app/focus-flight/"];
const EXTENSIONS = new Set([".tsx", ".ts", ".css"]);

// ── documented exceptions ──────────────────────────────────────────────────

/** Hex values that are deliberately literal, each with its single purpose. */
const ALLOWED_HEX = new Map([
  ["#ffd700", "gold — 1st-place medal, ultra tier, LEGENDARY celebration"],
  ["#f59e0b", "gold-dark — gradient end for the same three"],
  ["#c0c0c0", "silver — 2nd-place medal"],
  ["#cd7f32", "bronze — 3rd-place medal"],
  ["#2563eb", "tier gradient stop — Pajji Pro, light end"],
  ["#1d4ed8", "tier gradient stop — Pajji Pro, dark end"],
  ["#7c3aed", "tier gradient stop — Pajji Plus, light end"],
  ["#6d28d9", "tier gradient stop — Pajji Plus, dark end"],
  ["#000", "ultra card foreground — near-black ink on gold"],
  ["#fff", "pro / plus card foreground — white on blue or purple"],
]);

/**
 * rgb()/rgba() categories that are not palette colours at all. Each is a
 * category because there are ~50 of them; unlike the medals these are not
 * identity colours, they are neutral alpha layers.
 */
const ALLOWED_RGB_FN = [
  { re: /^rgba?\(\s*0\s*,\s*0\s*,\s*0\s*[,)]/,
    why: "neutral scrim or shadow — carries no palette hue" },
  { re: /^rgba?\(\s*255\s*,\s*255\s*,\s*255\s*[,)]/,
    why: "neutral overlay or hairline — carries no palette hue" },
  { re: /^rgba?\(\s*var\(--/,
    why: "token-driven alpha, e.g. rgba(var(--accent-rgb), .14)" },
  { re: /^rgba?\(\s*255\s*,\s*215\s*,\s*0\s*[,)]/,
    why: "gold celebration glow — LEGENDARY and ultra only" },
];

/**
 * Named source blocks that are data rather than styling. Skipped by name so a
 * future edit cannot quietly move a palette literal into one and have it pass
 * by accident of not being a style object.
 */
const ALLOWED_BLOCKS = [
  {
    file: "app/components/SettingsView.tsx",
    start: /const builtInThemeCards\s*=\s*\[/,
    end: /\n\s*\];/,
    why: "theme preview data — each theme's own accent and background gradient, "
       + "rendered as a swatch. Tokenising these would destroy what they show.",
  },
];

// ── rules ──────────────────────────────────────────────────────────────────

const COLOUR_FAMILIES =
  "white|black|gray|slate|zinc|neutral|stone|red|orange|amber|yellow|lime|" +
  "green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose";
const UTILITIES = "bg|text|border|ring|from|to|via";

const RULE_1A = {
  id: "tw-colour-utility",
  label: "Tailwind colour utility in className",
  re: new RegExp(`\\b(?:${UTILITIES})-(?:${COLOUR_FAMILIES})(?:-\\d{2,3})?\\b`, "g"),
};

const RULE_1B = {
  id: "tw-arbitrary-hex",
  label: "Arbitrary-value hex in className",
  re: new RegExp(`\\b(?:${UTILITIES})-\\[#[0-9a-fA-F]{3,8}\\]`, "g"),
};

const RULE_2A = {
  id: "raw-hex-in-style",
  label: "Raw hex inside a style object",
  re: /#[0-9a-fA-F]{3,8}\b/g,
};

const RULE_2B = {
  id: "raw-rgb-in-style",
  label: "rgb()/rgba() inside a style object",
  re: /rgba?\([^)]*\)/g,
};

const RULE_3 = [
  { id: "transition-all-css", label: "transition: all", re: /transition\s*:\s*all\b/g },
  { id: "transition-all-class", label: "transition-all class", re: /(?<![\w-])transition-all(?![\w-])/g },
  { id: "font-syne", label: "font-syne reference", re: /font-syne/g },
  { id: "font-main", label: "--font-main reference", re: /--font-main/g },
];

// ── helpers ────────────────────────────────────────────────────────────────

function walk(dir, out = []) {
  let entries;
  try { entries = fs.readdirSync(dir); } catch { return out; }
  for (const entry of entries) {
    if (entry === "node_modules" || entry.startsWith(".")) continue;
    const full = path.join(dir, entry);
    if (fs.statSync(full).isDirectory()) walk(full, out);
    else if (EXTENSIONS.has(path.extname(entry))) out.push(full);
  }
  return out;
}

function classNameValues(src) {
  const out = [];
  const re = /className=(?:"([^"]*)"|\{`([^`]*)`\}|\{"([^"]*)"\})/g;
  let m;
  while ((m = re.exec(src))) out.push({ value: m[1] ?? m[2] ?? m[3] ?? "", index: m.index });
  return out;
}

function styleRanges(src) {
  const ranges = [];
  const marker = /style=\{\{/g;
  let m;
  while ((m = marker.exec(src))) {
    let depth = 0;
    let i = m.index + "style=".length;
    for (; i < src.length; i++) {
      if (src[i] === "{") depth++;
      else if (src[i] === "}") { depth--; if (depth === 0) break; }
    }
    ranges.push({ start: m.index, end: i });
  }
  return ranges;
}

function blockRanges(src, spec) {
  const out = [];
  const startRe = new RegExp(spec.start.source, "g");
  let m;
  while ((m = startRe.exec(src))) {
    const rest = src.slice(m.index);
    const endM = rest.match(spec.end);
    if (endM) out.push({ start: m.index, end: m.index + endM.index + endM[0].length });
  }
  return out;
}

function lineOf(src, index) {
  let line = 1;
  for (let i = 0; i < index && i < src.length; i++) if (src[i] === "\n") line++;
  return line;
}

function snippet(text, index, len = 55) {
  const raw = text.slice(Math.max(0, index - 22), index + len).replace(/\s+/g, " ").trim();
  return raw.length > 76 ? raw.slice(0, 73) + "..." : raw;
}

// ── scan ───────────────────────────────────────────────────────────────────

const violations = [];
const allowed = [];
const skippedFiles = [];

const LABELS = new Map(
  [RULE_1A, RULE_1B, RULE_2A, RULE_2B, ...RULE_3].map((r) => [r.id, r.label])
);

function record(rule, file, src, index, match, context) {
  violations.push({
    rule,
    label: LABELS.get(rule) ?? rule,
    file,
    line: lineOf(src, index),
    match,
    context,
  });
}

function checkFile(full) {
  const rel = path.relative(ROOT, full).split(path.sep).join("/");
  if (WHITELIST.some((w) => rel.startsWith(w))) { skippedFiles.push(rel); return; }

  const src = fs.readFileSync(full, "utf8");
  const isCss = full.endsWith(".css");

  // named data blocks to skip entirely
  const dataBlocks = ALLOWED_BLOCKS.filter((b) => b.file === rel)
    .flatMap((b) => blockRanges(src, b).map((r) => ({ ...r, why: b.why })));
  const inDataBlock = (i) => dataBlocks.find((r) => i >= r.start && i <= r.end);

  if (!isCss) {
    // 1a / 1b — className utilities
    for (const { value, index } of classNameValues(src)) {
      for (const rule of [RULE_1A, RULE_1B]) {
        rule.re.lastIndex = 0;
        let m;
        while ((m = rule.re.exec(value))) {
          record(rule.id, rel, src, index, m[0], snippet(value, m.index));
        }
      }
    }

    // 2a / 2b — inside style objects
    for (const { start, end } of styleRanges(src)) {
      const block = src.slice(start, end + 1);

      RULE_2A.re.lastIndex = 0;
      let m;
      while ((m = RULE_2A.re.exec(block))) {
        const abs = start + m.index;
        const why = ALLOWED_HEX.get(m[0].toLowerCase());
        if (why) { allowed.push({ file: rel, line: lineOf(src, abs), match: m[0], why }); continue; }
        if (inDataBlock(abs)) { allowed.push({ file: rel, line: lineOf(src, abs), match: m[0], why: inDataBlock(abs).why }); continue; }
        record(RULE_2A.id, rel, src, abs, m[0], snippet(block, m.index));
      }

      RULE_2B.re.lastIndex = 0;
      while ((m = RULE_2B.re.exec(block))) {
        const abs = start + m.index;
        const hit = ALLOWED_RGB_FN.find((a) => a.re.test(m[0]));
        if (hit) { allowed.push({ file: rel, line: lineOf(src, abs), match: m[0], why: hit.why }); continue; }
        record(RULE_2B.id, rel, src, abs, m[0], snippet(block, m.index));
      }
    }
  }

  // 3 — both TSX and CSS
  for (const rule of RULE_3) {
    rule.re.lastIndex = 0;
    let m;
    while ((m = rule.re.exec(src))) {
      const abs = m.index;
      if (inDataBlock(abs)) continue;
      record(rule.id, rel, src, abs, m[0], snippet(src, abs));
    }
  }
}

for (const dir of SCAN_DIRS) {
  for (const full of walk(path.join(ROOT, dir))) checkFile(full);
}

// ── report ─────────────────────────────────────────────────────────────────

const order = [
  "tw-colour-utility", "tw-arbitrary-hex",
  "raw-hex-in-style", "raw-rgb-in-style",
  "transition-all-css", "transition-all-class", "font-syne", "font-main",
];

const byRule = new Map();
for (const v of violations) {
  if (!byRule.has(v.rule)) byRule.set(v.rule, []);
  byRule.get(v.rule).push(v);
}

console.log("");
console.log("check-design-tokens — RATCHET, not a clean bill of health");
console.log("=".repeat(66));
console.log(`scanned app/ and lib/  |  whitelisted: ${WHITELIST.join(", ")} (${skippedFiles.length} files)`);
console.log("");

for (const id of order) {
  const list = byRule.get(id);
  if (!list) continue;
  console.log(`[${list[0].label}]  ${list.length}`);
  for (const v of list) {
    console.log(`  ${v.file}:${v.line}  ${v.match}`);
    console.log(`      ${v.context}`);
  }
  console.log("");
}

console.log("=".repeat(66));
console.log(`violations outside the whitelist: ${violations.length}`);
console.log(`allowed by documented exception:  ${allowed.length}`);
console.log("");
console.log("Whitelisted and NOT clean: admin/**, focus-flight/** (~1,331 hardcoded");
console.log("colour references). Green means no new ones and the swept screens");
console.log("stayed swept. It does not mean the app is clean.");
console.log("");
process.exit(violations.length === 0 ? 0 : 1);
