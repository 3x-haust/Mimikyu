/**
 * Mimikyu structural verifier — figma-data.json 기준 DOM 구조 검증
 *
 * figma-data.json에서 추출한 각 TEXT 노드의 (위치, 색, 폰트) 기대값을
 * 실제 실행 중인 페이지의 DOM에서 측정해 1:1 대조한다.
 * 픽셀 diff가 "어디가/얼마나"만 알려주는 한계를 보완해,
 * Element 단위로 expected vs actual 수치를 출력한다.
 *
 * Usage:
 *   npx tsx scripts/verify.ts --data <figma-data.json> [--port 3333] [--node-id 184:7833]
 *
 * Exit code: 0 = 모든 체크 통과, 1 = mismatch 존재
 */
import { chromium } from "playwright";
import { existsSync, readFileSync, readdirSync } from "fs";

interface BBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface TextNode {
  name: string;
  characters: string;
  bbox: BBox;
  fontSize: number | null;
  fontWeight: number | null;
  lineHeightPx: number | null;
  letterSpacing: number | null;
  colorHex: string | null;
}

// --- args ---------------------------------------------------------------
const argv = process.argv.slice(2);
function flag(name: string): string | undefined {
  const i = argv.indexOf(name);
  return i !== -1 ? argv[i + 1] : undefined;
}
const dataPath = argv.find((a) => !a.startsWith("--"));
const port = parseInt(flag("--port") || "3333", 10);
const nodeId = flag("--node-id");

if (!dataPath || !existsSync(dataPath)) {
  console.error("Usage: npx tsx scripts/verify.ts <figma-data.json> [--port N] [--node-id ID]");
  process.exit(2);
}

// --- figma-data.json 파싱 ----------------------------------------------------
const raw = JSON.parse(readFileSync(dataPath, "utf-8"));
const allDocs: Array<{ id: string; doc: Record<string, unknown>; frame: BBox }> = [];
for (const [id, entry] of Object.entries((raw.nodes ?? {}) as Record<string, { document?: Record<string, unknown> }>)) {
  const doc = entry?.document;
  if (doc && doc.absoluteBoundingBox) {
    allDocs.push({ id, doc, frame: doc.absoluteBoundingBox as BBox });
  }
}

let docs = allDocs;
if (nodeId) {
  const hit = allDocs.find((d) => d.id === nodeId);
  if (!hit) {
    console.error(`[error] node ${nodeId} not found in ${dataPath}`);
    process.exit(2);
  }
  docs = [hit];
}
if (docs.length === 0) {
  console.error(`[error] no FRAME nodes found in ${dataPath} — is this figma-data.json?`);
  process.exit(2);
}

// 전체 페이지 뷰포트 = 모든 프레임(섹션)의 합집합
const viewport = docs.reduce(
  (acc, d) => ({
    width: Math.max(acc.width, d.frame.x + d.frame.width - Math.min(...docs.map((x) => x.frame.x))),
    height: Math.max(acc.height, d.frame.y + d.frame.height - Math.min(...docs.map((x) => x.frame.y))),
  }),
  { width: 0, height: 0 }
);

function hexFromFill(fills: unknown): string | null {
  const f = Array.isArray(fills) ? (fills as Array<Record<string, unknown>>).find((x) => x.type === "SOLID") : null;
  if (!f) return null;
  const c = f.color as { r: number; g: number; b: number };
  const o = typeof f.opacity === "number" ? f.opacity : 1;
  const to = (v: number) => Math.round(Math.min(1, Math.max(0, v * o)) * 255);
  const h = (v: number) => to(v).toString(16).padStart(2, "0");
  return `#${h(c.r)}${h(c.g)}${h(c.b)}`;
}

const texts: Array<TextNode & { origin: { x: number; y: number } }> = [];
function walk(node: Record<string, unknown>, origin: { x: number; y: number }) {
  const bb = node.absoluteBoundingBox as BBox | undefined;
  if (node.type === "TEXT" && bb) {
    const style = (node.style ?? {}) as Record<string, unknown>;
    const chars = (node.characters as string) ?? "";
    if (chars.trim().length > 0) {
      texts.push({
        name: (node.name as string) ?? "",
        characters: chars,
        bbox: { x: bb.x, y: bb.y, width: bb.width, height: bb.height },
        fontSize: typeof style.fontSize === "number" ? style.fontSize : null,
        fontWeight: typeof style.fontWeight === "number" ? style.fontWeight : null,
        lineHeightPx: typeof style.lineHeightPx === "number" ? style.lineHeightPx : null,
        letterSpacing: typeof style.letterSpacing === "number" ? style.letterSpacing : null,
        colorHex: hexFromFill(node.fills),
        origin,
      });
    }
  }
  for (const child of (node.children as Array<Record<string, unknown>>) ?? []) {
    walk(child, origin);
  }
}
for (const d of docs) {
  walk(d.doc, { x: d.frame.x, y: d.frame.y });
}

// frame(문서) 원점 기준 상대 좌표 = 페이지 좌표 (페이지는 프레임 집합을 (0,0)에 렌더링)
const rel = (bb: BBox, origin: { x: number; y: number }) => ({
  x: bb.x - origin.x,
  y: bb.y - origin.y,
  w: bb.width,
  h: bb.height,
});

// --- Playwright 브라우저 시작 (fallback: 설치된 chromium 직접 지정) ------------
const CACHE = `${process.env.HOME}/Library/Caches/ms-playwright`;
function pickExecutable(): string | undefined {
  try {
    return readdirSync(CACHE).find((d) => d.startsWith("chromium-"));
  } catch {
    return undefined;
  }
}

async function launch() {
  try {
    return await chromium.launch();
  } catch {
    const build = pickExecutable();
    if (!build) throw new Error("chromium not installed — run: npx playwright install chromium");
    const p = `${CACHE}/${build}/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`;
    return chromium.launch({ executablePath: p });
  }
}

async function main(): Promise<number> {
  const browser = await launch();
  try {
    const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height }, deviceScaleFactor: 1 });
  await page.goto(`http://localhost:${port}`, { waitUntil: "networkidle" });
  await page.evaluate(() => (document as Document & { fonts: FontFaceSet }).fonts.ready);
  await page.waitForTimeout(1500);

  // 모든 텍스트 요소 측정
  const domTexts = await page.evaluate(() => {
    const out: Array<{ text: string; x: number; y: number; w: number; h: number; color: string; font: string; size: number; weight: number; lh: number | null; ls: number | null }> = [];
    for (const el of document.querySelectorAll("span, h1, h2, h3, h4, h5, h6, p, a, button, li, div")) {
      if (el.children.length > 0) continue; // leaf 텍스트 요소만 (부모 색상 상속 오염 방지)
      const t = (el.textContent ?? "").replace(/\s+/g, " ").trim();
      if (!t) continue;
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      const lh = parseFloat(cs.lineHeight);
      const ls = parseFloat(cs.letterSpacing);
      out.push({
        text: t,
        x: r.x, y: r.y, w: r.width, h: r.height,
        color: cs.color,
        font: cs.fontFamily.split(",")[0].replace(/["']/g, "").trim(),
        size: parseFloat(cs.fontSize),
        weight: parseInt(cs.fontWeight, 10),
        lh: Number.isFinite(lh) ? lh : null,
        ls: Number.isFinite(ls) ? ls : null,
      });
    }
    return out;
  });

  // --- 매칭: Figma TEXT → DOM 요소 (정규화된 텍스트로, 동일 텍스트 다수면 위치 근접 우선)
  const used = new Set<number>();
  const results: Array<{ node: TextNode; el: (typeof domTexts)[number] | null; checks: Array<{ prop: string; exp: string; act: string; pass: boolean }> }> = [];

  for (const tn of texts) {
    const norm = tn.characters.replace(/\s+/g, " ").trim();
    const expected = rel(tn.bbox, tn.origin);
    const candidates = domTexts
      .map((el, i) => ({ el, i, dist: Math.hypot(el.x + el.w / 2 - (expected.x + expected.w / 2), el.y + el.h / 2 - (expected.y + expected.h / 2)) }))
      .filter((c) => !used.has(c.i) && c.el.text === norm)
      .sort((a, b) => a.dist - b.dist);
    const match = candidates[0];
    if (!match) {
      results.push({ node: tn, el: null, checks: [] });
      continue;
    }
    used.add(match.i);
    const el = match.el;
    const checks: Array<{ prop: string; exp: string; act: string; pass: boolean }> = [];

    const pos = (prop: string, exp: number, act: number, tol: number) =>
      checks.push({ prop, exp: exp.toFixed(1), act: act.toFixed(1), pass: Math.abs(exp - act) <= tol });
    pos("x", expected.x, el.x, 2);
    pos("y", expected.y, el.y, 2);

    if (tn.colorHex) {
      const hex = (c: string) => {
        const m = c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (!m) return null;
        return `#${[1, 2, 3].map((k) => Number(m[k]).toString(16).padStart(2, "0")).join("")}`;
      };
      const actHex = hex(el.color);
      checks.push({ prop: "color", exp: tn.colorHex, act: actHex ?? el.color, pass: actHex === tn.colorHex });
    }
    if (tn.fontSize !== null) {
      checks.push({ prop: "fontSize", exp: String(tn.fontSize), act: el.size.toFixed(1), pass: Math.abs(tn.fontSize - el.size) <= 0.5 });
    }
    if (tn.fontWeight !== null) {
      checks.push({ prop: "fontWeight", exp: String(tn.fontWeight), act: String(el.weight), pass: tn.fontWeight === el.weight });
    }
    if (tn.lineHeightPx !== null && el.lh !== null) {
      // Figma lineHeightPx 메타데이터는 실제 렌더링 bbox와 불일치할 수 있으므로
      // 시각적 진실(source of truth)은 bbox 높이 / 줄 수 로 구한다.
      const lineCount = Math.max(1, (tn.characters.match(/[\n\u2028\u2029]/g) ?? []).length + 1);
      const derivedLh = tn.bbox.height / lineCount;
      const expLh = Math.abs(tn.lineHeightPx - derivedLh) <= 4 ? tn.lineHeightPx : derivedLh;
      checks.push({ prop: "lineHeight", exp: `${expLh.toFixed(1)} (figma ${tn.lineHeightPx.toFixed(1)})`, act: el.lh.toFixed(1), pass: Math.abs(expLh - el.lh) <= 1 });
    }
    if (tn.letterSpacing !== null && el.ls !== null) {
      checks.push({ prop: "letterSpacing", exp: tn.letterSpacing.toFixed(2), act: el.ls.toFixed(2), pass: Math.abs(tn.letterSpacing - el.ls) <= 0.5 });
    }
    results.push({ node: tn, el, checks });
  }

  // --- 리포트 ---------------------------------------------------------------
  const total = results.length;
  const matched = results.filter((r) => r.el).length;
  const unmatched = results.filter((r) => !r.el);
  const failed = results.filter((r) => r.checks.some((c) => !c.pass));
  const failChecks = results.flatMap((r) => r.checks.filter((c) => !c.pass));

  console.log(`\nMimikyu Structural Verify — ${total} text nodes, ${matched} matched, ${failChecks.length} mismatches, ${unmatched.length} unmatched\n`);
  for (const r of results) {
    if (!r.el) {
      console.log(`  ⚠️  ${r.node.name} — DOM에서 텍스트를 찾지 못함 (미구현 변형/라이브러리 프레임일 수 있음): "${r.node.characters.replace(/\s+/g, " ").slice(0, 30)}"`);
      continue;
    }
    const bad = r.checks.filter((c) => !c.pass);
    if (bad.length === 0) continue;
    console.log(`  ❌ ${r.node.name} ("${r.node.characters.replace(/\s+/g, " ").slice(0, 24)}")`);
    for (const c of bad) {
      console.log(`      ${c.prop}: expected ${c.exp} / actual ${c.act}`);
    }
  }
  const totalChecks = results.reduce((a, r) => a + r.checks.length, 0);
  console.log(`\n  nodes: ${total - failed.length}/${total} passed · checks: ${totalChecks - failChecks.length}/${totalChecks} passed`);
  // unmatched(미구현 변형)는 경고로 취급, exit code는 매칭된 노드의 체크 실패만 반영
  return failChecks.length > 0 ? 1 : 0;
  } finally {
    await browser.close();
  }
}

main().then((code) => process.exit(code)).catch((err) => {
  console.error("Verify failed:", err);
  process.exit(1);
});