import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const client = path.join(root, "dist/client");
const server = path.join(root, "dist/server");
const project = process.env.CLOUDFLARE_PAGES_PROJECT || "plan3-web3";

if (!existsSync(path.join(client, "_next")) || !existsSync(path.join(server, "index.js"))) {
  console.error("Build Plan3 with `npm run build` before deploying to Pages.");
  process.exit(1);
}

const staging = mkdtempSync(path.join(tmpdir(), "plan3-pages-"));

try {
  cpSync(client, staging, {
    recursive: true,
    filter: (source) => ![".vite", ".assetsignore"].includes(path.basename(source)),
  });
  cpSync(server, path.join(staging, "_worker.js"), {
    recursive: true,
    filter: (source) => ![".vite", "wrangler.json"].includes(path.basename(source)),
  });

  const revision = spawnSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" });
  const args = [
    path.join(root, "node_modules/wrangler/bin/wrangler.js"),
    "pages", "deploy", staging,
    "--project-name", project,
    "--branch", "main",
    "--no-bundle",
  ];
  if (revision.status === 0) args.push("--commit-hash", revision.stdout.trim());

  const result = spawnSync(process.execPath, args, {
    cwd: staging,
    env: {
      ...process.env,
      WRANGLER_WRITE_LOGS: "false",
      WRANGLER_LOG_PATH: path.join(root, ".sites-runtime/wrangler/pages-deploy.log"),
    },
    stdio: "inherit",
  });
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
} finally {
  rmSync(staging, { recursive: true, force: true });
}
