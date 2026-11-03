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
 * Exit code 0 = no violations outside the whitelist. Exit code 1 = violations.
 *
 * Three rules, each one a thing the design pass enforced by hand:
 *
 *   1. Tailwind colour utilities in className — bg-/text-/border-/ring-/
 *      from-/to-/via- against a named palette family. These bypass the token
 *      system entirely; bg-emerald-500 is literally the retired #10b981.
 *   2. Raw hex inside a style object — a value that should be a var(--token).
 *   3. transition: all, plus any font-syne or --font-main reference.
 *      transition: all animates properties nobody chose, and those two font
 *      variables belong to the pre-redesign type system that was removed.
 */

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SCAN_DIRS = ["app", "lib"];
const WHITELIST = ["app/admin/", "app/focus-flight/"];
const EXTENSIONS = new Set([".tsx", ".ts", ".css"]);

// ── rule definitions ───────────────────────────────────────────────────────

const COLOUR_FAMILIES =
  "white|black|gray|slate|zinc|neutral|stone|red|orange|amber|yellow|lime|" +
  "green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose";
const UTILITIES = "bg|text|border|ring|from|to|via";

const RULE_1 = {
  id: "tailwind-colour-utility",
  label: "Tailwind colour utility in className",
  re: new RegExp(
    `\\b(?:${UTILITIES})-(?:${COLOUR_FAMILIES})(?:-\\d{2,3})?\\b`,
    "g"
  ),
};

const RULE_2 = {
  id: "raw-hex-in-style",
  label: "Raw hex inside a style object",
  re: /#[0-9a-fA-F]{3,8}\b/g,
};

const RULE_3 = [
  {
    id: "transition-all",
    label: "transition: all",
    re: /transition\s*:\s*all\b/g,
  },
  {
    id: "font-syne",
    label: "font-syne reference",
    re: /font-syne/g,
  },
  {
    id: "font-main",
    label: "--font-main reference",
    re: /--font-main/g,
  },
];

// ── file walking ───────────────────────────────────────────────────────────

function walk(dir, out = []) {
  let entries;
  try {
    entries = fs.readdirSync(dir);
  } catch {
    return out;
  }
  for (const entry of entries) {
    if (entry === "node_modules" || entry.startsWith(".")) continue;
    const full = path.join(dir, entry);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walk(full, out);
    else if (EXTENSIONS.has(path.extname(entry))) out.push(full);
  }
  return out;
}

function isWhitelisted(rel) {
  return WHITELIST.some((w) => rel.startsWith(w));
}

// ── extraction helpers ─────────────────────────────────────────────────────

/** Every className value in a file: className="..." and className={`...`}. */
function classNameValues(src) {
  const out = [];
  const re = /className=(?:"([^"]*)"|\{`([^`]*)`\}|\{"([^"]*)"\})/g;
  let m;
  while ((m = re.exec(src))) {
    const value = m[1] ?? m[2] ?? m[3] ?? "";
    out.push({ value, index: m.index });
  }
  return out;
}

/**
 * Ranges of every style={{ ... }} object literal, found by brace counting so
 * nested objects and ternaries inside the value do not confuse it.
 */
function styleRanges(src) {
  const ranges = [];
  const marker = /style=\{\{/g;
  let m;
  while ((m = marker.exec(src))) {
    let depth = 0;
    let i = m.index + "style=".length; // points at the outer '{'
    for (; i < src.length; i++) {
      const c = src[i];
      if (c === "{") depth++;
      else if (c === "}") {
        depth--;
        if (depth === 0) break;
      }
    }
    ranges.push({ start: m.index, end: i });
  }
  return ranges;
}

function lineOf(src, index) {
  let line = 1;
  for (let i = 0; i < index && i < src.length; i++) {
    if (src[i] === "\n") line++;
  }
  return line;
}

function snippet(text, index, len = 60) {
  const from = Math.max(0, index - 25);
  const raw = text.slice(from, index + len).replace(/\s+/g, " ").trim();
  return raw.length > 78 ? raw.slice(0, 75) + "..." : raw;
}

// ── checks ─────────────────────────────────────────────────────────────────

const violations = [];
const skippedFiles = [];

function checkFile(full) {
  const rel = path.relative(ROOT, full).split(path.sep).join("/");
  if (isWhitelisted(rel)) {
    skippedFiles.push(rel);
    return;
  }

  const src = fs.readFileSync(full, "utf8");
  const isCss = full.endsWith(".css");

  // rule 1 — Tailwind colour utilities, only meaningful in TSX/JSX
  if (!isCss) {
    for (const { value, index } of classNameValues(src)) {
      RULE_1.re.lastIndex = 0;
      let m;
      while ((m = RULE_1.re.exec(value))) {
        violations.push({
          rule: RULE_1.id,
          label: RULE_1.label,
          file: rel,
          line: lineOf(src, index),
          match: m[0],
          context: snippet(value, m.index),
        });
      }
    }

    // rule 2 — raw hex inside style objects
    const ranges = styleRanges(src);
    for (const { start, end } of ranges) {
      const block = src.slice(start, end + 1);
      RULE_2.re.lastIndex = 0;
      let m;
      while ((m = RULE_2.re.exec(block))) {
        violations.push({
          rule: RULE_2.id,
          label: RULE_2.label,
          file: rel,
          line: lineOf(src, start + m.index),
          match: m[0],
          context: snippet(block, m.index),
        });
      }
    }
  }

  // rule 3 — applies to both TSX and CSS
  for (const rule of RULE_3) {
    rule.re.lastIndex = 0;
    let m;
    while ((m = rule.re.exec(src))) {
      violations.push({
        rule: rule.id,
        label: rule.label,
        file: rel,
        line: lineOf(src, m.index),
        match: m[0],
        context: snippet(src, m.index),
      });
    }
  }
}

for (const dir of SCAN_DIRS) {
  for (const full of walk(path.join(ROOT, dir))) checkFile(full);
}

// ── report ─────────────────────────────────────────────────────────────────

const byRule = new Map();
for (const v of violations) {
  if (!byRule.has(v.rule)) byRule.set(v.rule, []);
  byRule.get(v.rule).push(v);
}

console.log("");
console.log("check-design-tokens — RATCHET, not a clean bill of health");
console.log("=".repeat(64));
console.log(
  `scanned app/ and lib/  |  whitelisted: ${WHITELIST.join(", ")}` +
    `  (${skippedFiles.length} files skipped)`
);
console.log("");

if (violations.length === 0) {
  console.log("No violations outside the whitelist.");
  console.log("");
  console.log(
    "This does NOT mean the app is clean. ~1,331 hardcoded colour references"
  );
  console.log(
    "remain in the whitelisted screens. Green means only that no new ones were"
  );
  console.log("added and the swept screens stayed swept.");
  console.log("");
  process.exit(0);
}

const order = [
  "tailwind-colour-utility",
  "raw-hex-in-style",
  "transition-all",
  "font-syne",
  "font-main",
];

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

console.log("=".repeat(64));
console.log(`${violations.length} violation(s) outside the whitelist.`);
console.log(
  "Whitelisted screens (not counted, not clean): admin/**, focus-flight/**."
);
console.log("");
process.exit(1);
