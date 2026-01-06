import { spawnSync } from "node:child_process";

function usage() {
  console.log(
    "Uso:\n  node scripts/release.mjs <patch|minor|major> <resumen>\n\nEjemplo:\n  node scripts/release.mjs patch \"importa excel + permisos\"\n",
  );
}

const [bump, ...rest] = process.argv.slice(2);
const summary = rest.join(" ").trim();

if (!bump || !["patch", "minor", "major"].includes(bump) || !summary) {
  usage();
  process.exit(1);
}

const msg = `v%s - ${summary}`;

const res = spawnSync(
  process.platform === "win32" ? "npm.cmd" : "npm",
  ["version", bump, "-m", msg],
  { stdio: "inherit" },
);

process.exit(res.status ?? 1);
