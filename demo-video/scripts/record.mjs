/**
 * 배포 사이트를 실제 API로 실행하면서 페이지 영역을 녹화한다.
 *
 *   node scripts/record.mjs demo1   → public/recordings/demo1-sc002.mp4 (+ .events.json)
 *   node scripts/record.mjs demo2   → public/recordings/demo2-sc012.mp4 (+ .events.json)
 *
 * - 시스템 Chrome을 헤드리스로 띄운다(channel: "chrome").
 * - 화면은 CDP screencast 프레임을 받아 시각대로 이어 붙인다(1920x1080, 30fps).
 * - 헤드리스 녹화에는 커서가 안 찍혀서 페이지에 커서 모양을 그려 넣는다.
 * - events.json에 클릭과 결과 도착 시각(녹화 시작 기준 초)을 남긴다. 편집할 때 이 값으로 자막과 빨리 감기 구간을 맞춘다.
 * - 판정 결과는 받은 그대로 기록한다. 결과가 기대와 다르면 events.json의 decision으로 알 수 있다.
 */
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE = "https://sageuk-check.vercel.app";
const FFMPEG = path.join(ROOT, "node_modules/@remotion/compositor-darwin-arm64/ffmpeg");
const VIEWPORT = { width: 1440, height: 810 };
const RESULT_TIMEOUT_MS = 6 * 60 * 1000;

const CASES = {
  demo1: { file: "demo1-sc002", tab: "충돌", row: "최만리 등의 언문 관련 상소" },
  demo2: { file: "demo2-sc012", tab: "검토 필요", row: "1441년 건의의 쇠그릇 지름" },
};

const key = process.argv[2];
const job = CASES[key];
if (!job) {
  console.error(`사용법: node scripts/record.mjs <${Object.keys(CASES).join("|")}>`);
  process.exit(1);
}

const outDir = path.join(ROOT, "public/recordings");
const framesDir = path.join(ROOT, "out/frames", job.file);
fs.rmSync(framesDir, { recursive: true, force: true });
fs.mkdirSync(framesDir, { recursive: true });
fs.mkdirSync(outDir, { recursive: true });

// 커서, 클릭 표시, 녹화에 방해되는 요소 숨김
const INIT_SCRIPT = `
(() => {
  const install = () => {
    if (document.getElementById("__demo_cursor")) return;
    const style = document.createElement("style");
    style.textContent = \`
      #__demo_cursor { position: fixed; left: 0; top: 0; width: 26px; height: 26px; z-index: 2147483647;
        pointer-events: none; transform: translate(-100px, -100px); transition: none; }
      .__demo_ripple { position: fixed; z-index: 2147483646; pointer-events: none; width: 44px; height: 44px;
        margin: -22px 0 0 -22px; border-radius: 999px; border: 3px solid rgba(41, 73, 61, 0.75);
        animation: __demo_ripple 520ms cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      @keyframes __demo_ripple { from { transform: scale(0.3); opacity: 1; } to { transform: scale(1.25); opacity: 0; } }
    \`;
    document.head.appendChild(style);
    const c = document.createElement("div");
    c.id = "__demo_cursor";
    c.innerHTML = '<svg width="26" height="26" viewBox="0 0 26 26"><path d="M4 2.5 L4 21 L9 16.4 L12.4 23.6 L15.6 22.1 L12.3 15 L19 15 Z" fill="#1d201b" stroke="#ffffff" stroke-width="1.6" stroke-linejoin="round"/></svg>';
    document.body.appendChild(c);
    window.addEventListener("mousemove", (e) => {
      c.style.transform = "translate(" + (e.clientX - 4) + "px," + (e.clientY - 2) + "px)";
    }, true);
    window.addEventListener("mousedown", (e) => {
      const r = document.createElement("div");
      r.className = "__demo_ripple";
      r.style.left = e.clientX + "px";
      r.style.top = e.clientY + "px";
      document.body.appendChild(r);
      setTimeout(() => r.remove(), 600);
    }, true);
  };
  // 녹화 환경의 브라우저 확장이 끼워 넣는 떠 있는 버튼을 지운다.
  setInterval(() => document.querySelectorAll("unicorn-web-assistant").forEach((el) => el.remove()), 300);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", install);
  else install();
})();
`;

const browser = await chromium.launch({
  channel: "chrome",
  headless: true,
  args: [
    "--disable-background-timer-throttling",
    "--disable-renderer-backgrounding",
    "--disable-backgrounding-occluded-windows",
  ],
});
const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 2 });
await context.addInitScript(INIT_SCRIPT);
const page = await context.newPage();

// 서비스의 진행 조회는 setInterval이라 응답이 겹칠 수 있다. 결과(completed)가 한 번 도착한 뒤
// 늦게 오는 조회 응답이 화면 전환 타이머를 지워 화면이 멈추는 문제가 있어서(서비스 버그),
// 녹화에서는 첫 completed 이후의 조회 응답만 브라우저에 넘기지 않는다. 응답 내용은 바꾸지 않는다.
let jobFinished = false;
await page.route("**/api/jobs/**", async (route) => {
  if (jobFinished) return; // 응답하지 않고 둔다
  const response = await route.fetch();
  const body = await response.text();
  if (jobFinished) return;
  if (/"status"\s*:\s*"completed"/.test(body)) jobFinished = true;
  await route.fulfill({ response, body });
});

// --- screencast ---
const frames = [];
const cdp = await context.newCDPSession(page);
cdp.on("Page.screencastFrame", async ({ data, metadata, sessionId }) => {
  const i = frames.length;
  const name = `f_${String(i).padStart(6, "0")}.jpg`;
  fs.writeFileSync(path.join(framesDir, name), Buffer.from(data, "base64"));
  frames.push({ name, t: metadata.timestamp });
  await cdp.send("Page.screencastFrameAck", { sessionId }).catch(() => {});
});

const events = [];
const now = () => Date.now() / 1000;
let wallStart = null;
let wallEnd = null;
const mark = (name, extra = {}) => {
  const t = +(now() - wallStart).toFixed(2);
  events.push({ name, t, ...extra });
  console.log(`[${t.toFixed(1)}s] ${name}`, Object.keys(extra).length ? extra : "");
};

// --- helpers ---
let cursor = { x: VIEWPORT.width * 0.62, y: VIEWPORT.height * 0.55 };
const ease = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);

async function moveTo(x, y, ms = 700) {
  const from = { ...cursor };
  const steps = Math.max(8, Math.round(ms / 16));
  for (let i = 1; i <= steps; i++) {
    const p = ease(i / steps);
    await page.mouse.move(from.x + (x - from.x) * p, from.y + (y - from.y) * p);
    await page.waitForTimeout(16);
  }
  cursor = { x, y };
}

async function center(locator) {
  const box = await locator.boundingBox();
  if (!box) throw new Error("요소 위치를 찾지 못했어요");
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

/** 요소가 화면 밖이면 부드럽게 스크롤해서 보이게 한다. */
async function ensureVisible(locator, margin = 120) {
  const box = await locator.boundingBox();
  if (!box) return;
  if (box.y >= margin && box.y + box.height <= VIEWPORT.height - margin) return;
  const current = await page.evaluate(() => window.scrollY);
  const target = current + box.y - VIEWPORT.height * 0.35;
  await smoothScroll(Math.max(0, target));
}

async function smoothScroll(targetY, ms = 1100) {
  await page.evaluate(
    ({ targetY, ms }) =>
      new Promise((resolve) => {
        const startY = window.scrollY;
        const t0 = performance.now();
        const ease = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
        const step = (t) => {
          const p = Math.min(1, (t - t0) / ms);
          window.scrollTo(0, startY + (targetY - startY) * ease(p));
          if (p < 1) requestAnimationFrame(step);
          else resolve();
        };
        requestAnimationFrame(step);
      }),
    { targetY, ms },
  );
  await page.waitForTimeout(150);
}

async function clickOn(locator, { name, pauseBefore = 350, pauseAfter = 900, move = 750 } = {}) {
  await ensureVisible(locator);
  const { x, y } = await center(locator);
  await moveTo(x, y, move);
  await page.waitForTimeout(pauseBefore);
  await page.mouse.down();
  await page.waitForTimeout(70);
  await page.mouse.up();
  if (name) mark(name);
  await page.waitForTimeout(pauseAfter);
}

async function hover(locator, { name, pause = 1200, move = 750 } = {}) {
  await ensureVisible(locator);
  const { x, y } = await center(locator);
  await moveTo(x, y, move);
  if (name) mark(name);
  await page.waitForTimeout(pause);
}

// --- flow ---
try {
  await page.goto(`${SITE}/verify`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await page.mouse.move(cursor.x, cursor.y);

  await cdp.send("Page.startScreencast", { format: "jpeg", quality: 90, maxWidth: 1920, maxHeight: 1080, everyNthFrame: 2 });
  wallStart = now();
  mark("record_start");
  await page.waitForTimeout(1500);

  // 샘플 고르기
  const sampleTitle = page.getByText("샘플로 해 보기");
  await smoothScroll((await page.evaluate(() => window.scrollY)) + (await sampleTitle.boundingBox()).y - 140);
  await page.waitForTimeout(400);
  await clickOn(page.locator("button[role=tab], button", { hasText: job.tab }).first(), { name: "tab_click", pauseAfter: 700 });
  await clickOn(page.locator("#sample-tabpanel button", { hasText: job.row }), { name: "sample_click", pauseAfter: 1400 });

  // 위로 올라가 고른 파일과 판정 시작 버튼 보여 주기
  await smoothScroll(0, 1000);
  await page.waitForTimeout(900);
  await clickOn(page.locator("button", { hasText: "판정 시작" }), { name: "start_click", pauseAfter: 300 });

  // 진행 화면
  await page.getByText("지난 시간").waitFor({ timeout: 30000 });
  mark("progress_shown");
  await moveTo(VIEWPORT.width * 0.8, VIEWPORT.height * 0.62, 900);

  // 결과 기다리기 (오류가 나면 멈춘다)
  const t0 = Date.now();
  for (;;) {
    if (await page.getByText("판정 근거").count()) break;
    if (await page.getByText("결과를 받지 못했어요").count()) throw new Error("워크플로우가 결과를 주지 못했어요");
    if (Date.now() - t0 > RESULT_TIMEOUT_MS) throw new Error("결과가 제때 오지 않았어요");
    // 화면의 "지난 시간"이 멈추면 페이지가 굳은 것이다. 일찍 알아챈다.
    if ((Date.now() - t0) % 15000 < 500) {
      const shown = await page.evaluate(() => document.body.innerText.match(/지난 시간\s*([^\n]+)/)?.[1] ?? "");
      console.log(`  기다리는 중 ${Math.round((Date.now() - t0) / 1000)}초, 화면 표시: ${shown}`);
    }
    await page.waitForTimeout(500);
  }
  const decisionText = await page
    .locator("main")
    .first()
    .evaluate((el) => {
      const m = el.innerText.match(/(일치|충돌|검토 필요)/);
      return m ? m[1] : null;
    });
  mark("result_shown", { waitedSeconds: Math.round((Date.now() - t0) / 1000) });
  await page.waitForTimeout(2600);

  // 판정 근거의 쪽 번호 누르기 (쪽이 다른 근거를 두 개까지)
  const citations = page.locator('button[aria-label^="근거 "]');
  const count = await citations.count();
  const seenPages = new Set();
  let clicked = 0;
  for (let i = 0; i < count && clicked < 2; i++) {
    const label = await citations.nth(i).getAttribute("aria-label");
    const pageNo = label?.match(/원문 (\d+)쪽/)?.[1];
    if (!pageNo || seenPages.has(pageNo)) continue;
    seenPages.add(pageNo);
    await clickOn(citations.nth(i), { name: "citation_click", pauseAfter: 3200 });
    events[events.length - 1].label = label;
    clicked++;
  }

  // 왼쪽 쪽 번호 줄 (문서별 묶음)
  const pageNav = page.locator('[aria-label="문서별 쪽 이동"]');
  if (await pageNav.count()) {
    await hover(pageNav.first(), { name: "page_groups", pause: 600 });
    const navButtons = pageNav.first().locator("button");
    const n = await navButtons.count();
    for (const idx of [0, n - 1].filter((v, i, a) => v >= 0 && a.indexOf(v) === i)) {
      await clickOn(navButtons.nth(idx), { name: "page_nav_click", pauseAfter: 1600, move: 600 });
    }
  }

  // 사료 출처
  const source = page.getByText("사료 출처").first();
  if (await source.count()) await hover(source, { name: "source_reference", pause: 3000 });

  await page.waitForTimeout(1200);
  mark("record_end", { decision: decisionText });
} catch (err) {
  mark("error", { message: String(err?.message ?? err) });
  await page.screenshot({ path: path.join(ROOT, "out", `${job.file}-error.png`) }).catch(() => {});
  process.exitCode = 1;
} finally {
  wallEnd = now();
  await cdp.send("Page.stopScreencast").catch(() => {});
  await page.waitForTimeout(300);
  await browser.close();
}

// --- frames → mp4 ---
if (frames.length < 2) {
  console.error("프레임이 없어요");
  process.exit(1);
}
// 화면이 멈춰 있으면 프레임이 오지 않으므로, 마지막 프레임을 녹화를 멈춘 시각까지 늘린다.
const lastT = Math.max(frames[frames.length - 1].t + 0.5, wallEnd);
const list = frames
  .map((f, i) => {
    const next = i + 1 < frames.length ? frames[i + 1].t : lastT;
    return `file '${f.name}'\nduration ${Math.max(0.001, next - f.t).toFixed(4)}`;
  })
  .join("\n");
fs.writeFileSync(path.join(framesDir, "list.txt"), `${list}\nfile '${frames[frames.length - 1].name}'\n`);

const mp4 = path.join(outDir, `${job.file}.mp4`);
execFileSync(
  FFMPEG,
  [
    "-y", "-loglevel", "error",
    "-f", "concat", "-safe", "0", "-i", "list.txt",
    "-fps_mode", "cfr", "-r", "30", "-pix_fmt", "yuv420p",
    "-c:v", "libx264", "-crf", "16", "-preset", "medium",
    mp4,
  ],
  { cwd: framesDir, stdio: "inherit", env: { ...process.env, DYLD_LIBRARY_PATH: path.dirname(FFMPEG) } },
);

// 이벤트 시각을 영상 기준으로 맞춘다(첫 프레임이 0초).
// screencast 타임스탬프는 epoch 초라서 벽시계 기준 이벤트와 바로 뺄 수 있다.
const offset = frames[0].t - wallStart;
const videoEvents = events.map((e) => ({ ...e, t: +(e.t - offset).toFixed(2) }));
fs.writeFileSync(
  path.join(outDir, `${job.file}.events.json`),
  JSON.stringify(
    { case: key, site: SITE, frames: frames.length, durationSec: +(lastT - frames[0].t).toFixed(2), events: videoEvents },
    null,
    2,
  ),
);
console.log(`저장: ${mp4}`);
