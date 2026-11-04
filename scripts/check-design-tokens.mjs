#!/usr/bin/env node
/**
 * check-design-tokens — a RATCHET, not a clean bill of health.
 *
 * THIS SCRIPT PASSES WITH 281 HARDCODED COLOUR REFERENCES STILL IN THE REPO.
 * They all live in app/focus-flight/**, which is whitelisted because that suite
 * has never been migrated: 256 Tailwind colour utilities, 18 raw hex values and
 * 7 rgb()/rgba() calls across 8 files.
 *
 * app/admin/** was tokenised screen by screen and is NO LONGER whitelisted. It
 * is covered by every rule below, which is why removing an entry is the last
 * act of a migration rather than the first.
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
 *  2c. hex and rgb()/rgba() inside CSS declarations in <style> blocks. Added
 *      because .btn-danger was sitting on the dead palette and no rule could
 *      see it — the script only ever looked at style objects. Theme-override
 *      blocks are skipped by documented range.
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
 *
 * The rgb()/rgba() CATEGORIES are held to a stricter standard: each may match
 * only literal 0,0,0 alpha, literal 255,255,255 alpha, or a token-driven alpha.
 * A HUE INSIDE AN ALLOWLISTED CATEGORY IS A BUG IN THE ALLOWLIST, NOT A VALUE
 * TO ADD. Hues are identity; they belong in the per-value list with a reason.
 */

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SCAN_DIRS = ["app", "lib"];
const WHITELIST = ["app/focus-flight/"];
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
 * rgb()/rgba() CATEGORIES. Every pattern here must be provably neutral: literal
 * 0,0,0 or 255,255,255 alpha, or a token-driven alpha. That is the whole test.
 *
 * A HUE INSIDE ONE OF THESE CATEGORIES IS A BUG IN THE ALLOWLIST, NOT A VALUE
 * TO ADD. If you find yourself wanting to extend a pattern to cover a colour,
 * the colour is identity, not neutrality — give it a per-value entry in
 * ALLOWED_RGB_VALUES with its reason, or promote it to a token.
 */
const ALLOWED_RGB_CATEGORIES = [
  { re: /^rgba?\(\s*0\s*,\s*0\s*,\s*0\s*[,)]/,
    why: "neutral black alpha — scrim or shadow, no hue" },
  { re: /^rgba?\(\s*255\s*,\s*255\s*,\s*255\s*[,)]/,
    why: "neutral white alpha — overlay or hairline, no hue" },
  { re: /^rgba?\(\s*var\(--[a-z-]+\)\s*[,)]/,
    why: "token-driven alpha, e.g. rgba(var(--accent-rgb), .14)" },
];

/**
 * Per-value rgb()/rgba() exceptions. Identity colours, each with its single
 * purpose — the same policy as ALLOWED_HEX. A hue belongs here, never in a
 * category above.
 */
const ALLOWED_RGB_VALUES = new Map([
  // Gold — celebration glow and the ultra rarity border.
  ["rgba(255,215,0,0.5)", "gold celebration glow — LEGENDARY only"],
  ["rgba(255,215,0,0.3)", "gold celebration glow — LEGENDARY only"],
  ["rgba(255,215,0,0.2)", "gold celebration glow — LEGENDARY only"],
  ["rgba(255,215,0,0.1)", "gold celebration glow — LEGENDARY only"],
  ["rgba(255,215,0,0.6)", "ultra rarity border — gold"],
  // Diamond rarity — cyan. A tier identity, like the medals above.
  ["rgba(0,255,255,0.4)", "diamond rarity glow — cyan"],
  ["rgba(0,255,255,0.6)", "diamond rarity border — cyan"],
  ["rgba(0,255,255,0.1)", "diamond rarity fill — cyan"],
  // Epic rarity — violet.
  ["rgba(168,85,247,0.4)", "epic rarity glow — violet"],
  ["rgba(168,85,247,0.6)", "epic rarity border — violet"],
]);

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
  {
    file: "app/page.tsx",
    start: /\.theme-[a-z0-9]+[^{]*\{/,
    braceMatched: true,
    why: "theme override data — each theme defines its own --accent, --bg and "
       + "--danger-rgb. These ARE the palette a user picks, not styling debt.",
  },
  {
    file: "app/page.tsx",
    start: /\n\s*\.(?:dark|light|contrast-high(?:\.[a-z]+)?)\s*\{/,
    braceMatched: true,
    why: "global palette override data — the .dark/.light base sets and the "
       + "contrast-high accessibility variants. Data, like the themes above.",
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
  // Allows one level of nesting so rgba(var(--x-rgb), .14) is matched whole.
  re: /rgba?\((?:[^()]|\([^()]*\))*\)/g,
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

function styleBlockRanges(src) {
  const out = [];
  const re = /<style>\{`([\s\S]*?)`\}<\/style>/g;
  let m;
  while ((m = re.exec(src))) {
    const offset = m.index + m[0].indexOf(m[1]);
    out.push({ start: offset, end: offset + m[1].length });
  }
  return out;
}

/** Why an rgb()/rgba() value is allowed, or null if it is not. */
function rgbWhy(value) {
  const norm = value.replace(/\s+/g, "");
  if (ALLOWED_RGB_VALUES.has(norm)) return ALLOWED_RGB_VALUES.get(norm);
  const cat = ALLOWED_RGB_CATEGORIES.find((a) => a.re.test(value));
  return cat ? cat.why : null;
}

function blockRanges(src, spec) {
  const out = [];
  const startRe = new RegExp(spec.start.source, "g");
  let m;
  while ((m = startRe.exec(src))) {
    if (spec.braceMatched) {
      // Theme blocks use compound selectors and close inline, so the end has to
      // be found by counting braces rather than by matching a line shape.
      const open = src.indexOf("{", m.index);
      if (open < 0) continue;
      let depth = 0;
      let j = open;
      for (; j < src.length; j++) {
        if (src[j] === "{") depth++;
        else if (src[j] === "}") { depth--; if (depth === 0) break; }
      }
      out.push({ start: m.index, end: j });
      startRe.lastIndex = j;
      continue;
    }
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
        const why = rgbWhy(m[0]);
        if (why) { allowed.push({ file: rel, line: lineOf(src, abs), match: m[0], why }); continue; }
        record(RULE_2B.id, rel, src, abs, m[0], snippet(block, m.index));
      }
    }

    // 2c — CSS declarations inside <style> blocks. The script used to look only
    // at style objects, which is why a live .btn-danger could sit on the dead
    // palette and still produce a green run.
    for (const { start, end } of styleBlockRanges(src)) {
      const block = src.slice(start, end);
      for (const rule of [RULE_2A, RULE_2B]) {
        rule.re.lastIndex = 0;
        let m;
        while ((m = rule.re.exec(block))) {
          const abs = start + m.index;
          if (inDataBlock(abs)) continue;
          const why = rule === RULE_2A
            ? ALLOWED_HEX.get(m[0].toLowerCase())
            : rgbWhy(m[0]);
          if (why) { allowed.push({ file: rel, line: lineOf(src, abs), match: m[0], why }); continue; }
          record(rule.id, rel, src, abs, m[0], snippet(block, m.index));
        }
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
console.log("Whitelisted and NOT clean: focus-flight/** (281 hardcoded colour");
console.log("references). Green means no new ones and the swept screens stayed");
console.log("swept. It does not mean the app is clean.");
console.log("");
process.exit(violations.length === 0 ? 0 : 1);
