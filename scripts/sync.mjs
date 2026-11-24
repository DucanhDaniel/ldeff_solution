// Sync solved questions from ldeff.vutrinh.net into this repo.
//
// Auth: the site's API wants a Clerk session JWT that lives only 60 seconds, so
// we keep the long-lived Clerk `__client` cookie (from clerk.ldeff.vutrinh.net)
// in the CLERK_CLIENT secret and mint fresh JWTs from it while running.
//
// Usage: CLERK_CLIENT=... node scripts/sync.mjs
// Node 18+ (global fetch), no dependencies.

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SITE = "https://ldeff.vutrinh.net";
const CLERK = "https://clerk.ldeff.vutrinh.net";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MODES = {
  sql: { dir: "sql", ext: "sql" },
  dataframe: { dir: "dataframe", ext: "py" },
};
const CONCURRENCY = 4;
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/158.0.0.0 Safari/537.36";

const clientCookie = (process.env.CLERK_CLIENT || "").trim().replace(/^__client=/, "");
if (!clientCookie) {
  console.error("Missing CLERK_CLIENT (value of the __client cookie on clerk.ldeff.vutrinh.net).");
  process.exit(1);
}

const clerkHeaders = {
  Cookie: `__client=${clientCookie}`,
  Origin: SITE,
  Referer: `${SITE}/`,
  "User-Agent": UA,
};

async function clerk(method, p) {
  const res = await fetch(`${CLERK}${p}`, {
    method,
    headers: { ...clerkHeaders, "Content-Type": "application/x-www-form-urlencoded" },
    body: method === "POST" ? "" : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Clerk ${method} ${p} -> ${res.status}: ${text.slice(0, 300)}`);
  return JSON.parse(text);
}

let sessionId = null;
let token = null;
let tokenExp = 0;

async function getToken() {
  // Refresh 15s before expiry; tokens last ~60s.
  if (token && Date.now() / 1000 < tokenExp - 15) return token;
  if (!sessionId) {
    const { response: client } = await clerk("GET", "/v1/client");
    const active = (client?.sessions || []).filter((s) => s.status === "active");
    const s = active.find((x) => x.id === client.last_active_session_id) || active[0];
    if (!s) {
      throw new Error("No active Clerk session: the __client cookie expired or was signed out. Update the CLERK_CLIENT secret.");
    }
    sessionId = s.id;
  }
  const { jwt } = await clerk("POST", `/v1/client/sessions/${sessionId}/tokens`);
  const payload = JSON.parse(Buffer.from(jwt.split(".")[1], "base64url").toString());
  token = jwt;
  tokenExp = payload.exp;
  return token;
}

async function api(p, { auth = true } = {}, attempt = 1) {
  const headers = { Accept: "*/*", "User-Agent": UA, Referer: `${SITE}/practice` };
  if (auth) headers.Authorization = `Bearer ${await getToken()}`;
  const res = await fetch(`${SITE}/api${p}`, { headers });
  if ((res.status === 429 || res.status >= 500) && attempt < 4) {
    await new Promise((r) => setTimeout(r, 2000 * attempt));
    return api(p, { auth }, attempt + 1);
  }
  if (res.status === 401 && auth && attempt < 2) {
    token = null; // force a fresh JWT once
    return api(p, { auth }, attempt + 1);
  }
  if (!res.ok) throw new Error(`GET /api${p} -> ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return res.json();
}

async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: limit }, async () => {
      while (i < items.length) {
        const idx = i++;
        out[idx] = await fn(items[idx]);
      }
    }),
  );
  return out;
}

async function readOr(file, fallback) {
  try {
    return await readFile(file, "utf8");
  } catch {
    return fallback;
  }
}

function renderProgress(bank, solved) {
  const lines = [];
  for (const [mode, { dir, ext }] of Object.entries(MODES)) {
    const qs = bank.questions.filter((q) => q.mode === mode).sort((a, b) => a.n - b.n);
    const done = qs.filter((q) => solved.has(q.id));
    lines.push(`### ${mode.toUpperCase()} — ${done.length}/${qs.length}`, "");
    for (const level of ["easy", "medium", "hard"]) {
      const total = qs.filter((q) => q.level === level).length;
      const n = done.filter((q) => q.level === level).length;
      if (total) lines.push(`- ${level}: ${n}/${total}`);
    }
    lines.push("");
    if (done.length) {
      lines.push("| # | Question | Level | Points | Solved at |", "|---|---|---|---|---|");
      for (const q of done) {
        const file = `${dir}/${q.n}_${q.id}.${ext}`;
        const link = `${SITE}/practice/${mode}/${q.id}`;
        const at = (solved.get(q.id).solved_at || "").slice(0, 10);
        lines.push(`| ${q.n} | [${q.title}](${link}) · [code](${file}) | ${q.level} | ${q.points} | ${at} |`);
      }
      lines.push("");
    }
  }
  return lines.join("\n");
}

async function main() {
  const bank = await api("/practice/bank", { auth: false });
  const questions = bank.questions.filter((q) => MODES[q.mode]);
  await getToken(); // fail fast on bad credentials
  console.log(`Bank: ${questions.length} questions. Fetching your submissions...`);

  const solved = new Map();
  let written = 0;
  await mapLimit(questions, CONCURRENCY, async (q) => {
    const mine = await api(`/practice/questions/${q.id}/mine`);
    if (!mine.solved) return;
    solved.set(q.id, mine);
    const code = mine.last_submit_code || mine.last_code;
    if (!code) return;
    const { dir, ext } = MODES[q.mode];
    const file = path.join(ROOT, dir, `${q.n}_${q.id}.${ext}`);
    const body = code.endsWith("\n") ? code : code + "\n";
    if ((await readOr(file, null)) === body) return;
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, body);
    written++;
    console.log(`  wrote ${path.relative(ROOT, file)}`);
  });

  const readmePath = path.join(ROOT, "README.md");
  const start = "<!-- progress:start -->";
  const end = "<!-- progress:end -->";
  let readme = await readOr(readmePath, `# ideff_solution\n\nMy solutions to ${SITE}/practice\n\n${start}\n${end}\n`);
  if (!readme.includes(start)) readme += `\n${start}\n${end}\n`;
  const block = `${start}\n## Progress\n\n${renderProgress(bank, solved)}\n${end}`;
  readme = readme.replace(new RegExp(`${start}[\\s\\S]*?${end}`), block);
  await writeFile(readmePath, readme);

  console.log(`Solved: ${solved.size}/${questions.length}. Files changed: ${written}.`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
