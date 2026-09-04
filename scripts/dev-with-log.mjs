// Dev-server wrapper that tees stdout/stderr to a log file so Playwright E2E
// tests can read server-side output (e.g. the dev-only password-reset OTP code).
import { spawn } from "node:child_process";
import { createWriteStream } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");
const port = process.env.PORT || "3000";
const logPath = resolve(projectRoot, "dev-e2e-server.log");

// Truncate the log on each server start so tests only see fresh output.
const logStream = createWriteStream(logPath, { flags: "w" });

function write(line) {
  logStream.write(line + "\n");
  process.stdout.write(line + "\n");
}

write(`[dev-with-log] starting next dev on :${port} (cwd=${projectRoot})`);

const nextCli = resolve(projectRoot, "node_modules", "next", "dist", "bin", "next");

const child = spawn(
  process.execPath,
  [nextCli, "dev", "-p", port],
  {
    cwd: projectRoot,
    env: { ...process.env, PORT: port },
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  },
);

child.stdout.on("data", (d) => {
  for (const line of d.toString().split("\n")) write(line);
});
child.stderr.on("data", (d) => {
  for (const line of d.toString().split("\n")) write(line);
});

child.on("error", (err) => {
  write(`[dev-with-log] spawn error: ${err.message}`);
  logStream.end();
});

child.on("exit", (code, signal) => {
  write(`[dev-with-log] server exited code=${code} signal=${signal}`);
  logStream.end();
  process.exit(code ?? 1);
});

process.on("SIGTERM", () => child.kill("SIGTERM"));
process.on("SIGINT", () => child.kill("SIGINT"));
