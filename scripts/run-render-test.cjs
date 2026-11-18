const { execFileSync } = require("node:child_process");
const { rmSync, statSync, existsSync } = require("node:fs");
const { join } = require("node:path");

// 1. Always purge .test-dist completely
rmSync(".test-dist", { recursive: true, force: true });

// 2. Recompile from clean source
console.log("==> Recompiling test harness from source...");
execFileSync("npx", ["tsc", "-p", "scripts/tsconfig.render.json"], { stdio: "inherit" });

// 3. Print source vs build mtimes for key components
const filesToCheck = [
  { label: "DashboardView", src: "app/components/DashboardView.tsx", dist: ".test-dist/app/components/DashboardView.js" },
  { label: "LibraryView",   src: "app/components/LibraryView.tsx",   dist: ".test-dist/app/components/LibraryView.js" },
  { label: "render-test",   src: "scripts/render-test.tsx",          dist: ".test-dist/scripts/render-test.js" },
];

console.log("==> Verifying source vs build artifact mtimes:");
for (const { label, src, dist } of filesToCheck) {
  const srcMtime = existsSync(src) ? statSync(src).mtime.toISOString() : "MISSING";
  const distMtime = existsSync(dist) ? statSync(dist).mtime.toISOString() : "MISSING";
  console.log(`    [${label}] source: ${srcMtime} | build: ${distMtime}`);
}

// 4. Run the suite
execFileSync(process.execPath, [".test-dist/scripts/render-test.js"], {
  stdio: "inherit",
  env: { ...process.env, UPDATE_BASELINES: process.env.UPDATE_BASELINES || "" },
});

