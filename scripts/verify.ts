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
const viewportW = flag("--viewport-width");
const viewportH = flag("--viewport-height");

if (!dataPath || !existsSync(dataPath)) {
  console.error("Usage: npx tsx scripts/verify.ts <figma-data.json> [--port N] [--node-id ID] [--viewport-width W] [--viewport-height H]");
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
    const page = await browser.newPage({
      viewport: { width: viewportW ? parseInt(viewportW, 10) : viewport.width, height: viewportH ? parseInt(viewportH, 10) : viewport.height },
      deviceScaleFactor: 1
    });
    // (중요) motion(reveal) 요소를 강제로 최종 상태로 렌더 — reducedMotion query emulation.
    // 원본 페이지의 Reveal 컴포넌트는 prefers-reduced-motion: reduce 시 initial=false 로 항상 노출한다.
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(`http://localhost:${port}`, { waitUntil: "networkidle" });
    // 폰트 로딩 대기
    await page.evaluate(() => (document as Document & { fonts: FontFaceSet }).fonts.ready);

    // (중요) 스크롤 진입 시 나타나는 Motion reveal 요소를 전부 트리거하고 맨 위로 복귀.
    // 아래 폴드의 섹션을 렌더링해야 전체 페이지 검증이 의미 있다.
    await page.evaluate(async () => {
      const height = document.body.scrollHeight;
      for (let y = 0; y <= height; y += 700) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 40));
      }
      window.scrollTo(0, 0);
    });
    // 이미지가 전부 decode 완료될 때까지 대기 (lazy/eager)
    await page.evaluate(async () => {
      for (const image of document.images) image.loading = "eager";
      await Promise.all([...document.images].map((image) =>
        image.complete ? image.decode().catch(() => {}) :
        new Promise<void>((resolve) => {
          const t = window.setTimeout(resolve, 8000);
          image.addEventListener("load", () => { window.clearTimeout(t); resolve(); }, { once: true });
          image.addEventListener("error", () => { window.clearTimeout(t); resolve(); }, { once: true });
        })
      ));
    });
    await page.waitForTimeout(300);

  // 모든 텍스트 요소 측정 — 컨테이너(h1/h2/button 등) 도 포함해 `<br>`/span 자식 구조도 잡는다.
  const domTexts = await page.evaluate(() => {
    const out: Array<{ text: string; norm: string; leaf: boolean; x: number; y: number; w: number; h: number; color: string; font: string; size: number; weight: number; lh: number | null; ls: number | null }> = [];
    const seen = new Set<string>();
    for (const el of document.querySelectorAll("h1, h2, h3, h4, h5, h6, p, a, button, li, span, div")) {
      // leaf 텍스트 요소 + 컨테이너 둘 다 후보. 단, 동일 (tag+x+y) 중복은 건너밨다.
      const t = (el.textContent ?? "").replace(/\s+/g, " ").trim();
      if (!t) continue;
      if (t.length > 200) continue; // 내부에 너무 긴 집합 텍스트(레이아/그리드)는 단일 노드 매칭 대상에서 제외
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      const cs = getComputedStyle(el);
      // 색은 실제 보이는 자식 요소에서 가져오는 게 정확하지만, 컨테이너도 폰트 속성은 유효.
      const lh = parseFloat(cs.lineHeight);
      const ls = parseFloat(cs.letterSpacing);
      const key = `${el.tagName}|${Math.round(r.x)}|${Math.round(r.y)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const norm = t.replace(/\s+/g, "").toLowerCase();
      out.push({
        text: t,
        norm,
        leaf: el.children.length === 0,
        x: r.x, y: r.y, w: r.width, h: r.height,
        color: cs.color,
        font: cs.fontFamily.split(",")[0].replace(/["'“”]/g, "").trim(),
        size: parseFloat(cs.fontSize),
        weight: parseInt(cs.fontWeight, 10),
        lh: Number.isFinite(lh) ? lh : null,
        ls: Number.isFinite(ls) ? ls : null,
      });
      // 겹침(overlap) 검사용은 아래 별도 rects 수집에서 처리
    }
    return out;
  });
  const rects = await page.evaluate(() => {
    const out: Array<{ t: string; x: number; y: number; w: number; h: number }> = [];
    for (const el of document.querySelectorAll("h1, h2, h3, h4, h5, h6, p, a, button, li, span")) {
      if (el.children.length > 0) continue;
      const t = (el.textContent ?? " ".trim());
      const r = el.getBoundingClientRect();
      if (r.width > 2 && r.height > 2 && t.length >= 2) out.push({ t: t.slice(0, 24), x: r.x, y: r.y, w: r.width, h: r.height });
    }
    return out;
  });

  // --- 겹침(overlap) 검사: 텍스트 요소가 서로 심하게 겹치면 렌더링 결함 (critical)
  const overlapIssues: Array<{ a: string; b: string; ratio: number }> = [];
  for (let i = 0; i < rects.length; i++) {
    for (let j = i + 1; j < rects.length; j++) {
      const A = rects[i], B = rects[j];
      const ix = Math.max(0, Math.min(A.x + A.w, B.x + B.w) - Math.max(A.x, B.x));
      const iy = Math.max(0, Math.min(A.y + A.h, B.y + B.h) - Math.max(A.y, B.y));
      const inter = ix * iy;
      if (inter <= 0) continue;
      const smaller = Math.min(A.w * A.h, B.w * B.h);
      if (inter / smaller > 0.3 && A.t !== B.t) {
        overlapIssues.push({ a: A.t, b: B.t, ratio: inter / smaller });
      }
    }
  }

  // --- 매칭: Figma TEXT → DOM 요소 (정규화된 텍스트로, 동일 텍스트 다수면 위치 근접 우선)
  const used = new Set<number>();
  const results: Array<{ node: TextNode; el: (typeof domTexts)[number] | null; checks: Array<{ prop: string; exp: string; act: string; pass: boolean }> }> = [];

  for (const tn of texts) {
    const norm = tn.characters.replace(/\s+/g, "").trim().toLowerCase();
    const expected = rel(tn.bbox, tn.origin);
    const candidates = domTexts
      .map((el, i) => ({ el, i, dist: Math.hypot(el.x + el.w / 2 - (expected.x + expected.w / 2), el.y + el.h / 2 - (expected.y + expected.h / 2)) }))
      .filter((c) => !used.has(c.i) && c.el.norm === norm)
      // 리프(실제 텍스트만 가진 요소)를 우선, 같은 텍스트면 더 작은 요소(더 정밀) 선호
      .sort((a, b) => (Number(b.el.leaf) - Number(a.el.leaf)) || (a.el.w + a.el.h - (b.el.w + b.el.h)) || (a.dist - b.dist));
    const exact = candidates.find((c) => c.el.leaf) ?? candidates.find((c) => !c.el.leaf);
    let match = exact;
    if (!match && norm.length >= 4) {
      // 정확 일치가 없으면 포함 관계(부분 일치)로 후보를 넓힘 — 단 위치가 근접해야 함.
      const partial = domTexts
        .map((el, i) => ({ el, i, dist: Math.hypot(el.x + el.w / 2 - (expected.x + expected.w / 2), el.y + el.h / 2 - (expected.y + expected.h / 2)) }))
        .filter((c) => !used.has(c.i) && (c.el.norm.includes(norm) || norm.includes(c.el.norm)))
        .filter((c) => c.dist < 60 && c.el.leaf) // 부분 일치는 리프만 (컨테이너 오염 방지)
        .sort((a, b) => a.dist - b.dist);
      match = partial[0];
    }
    if (!match) {
      if (tn.characters.trim().length >= 2) {
        results.push({ node: tn, el: null, checks: [] });
      }
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
  // 겹침 이슈는 렌더링 결함이므로 critical mismatch 로 취급
  if (overlapIssues.length > 0) {
    console.log(`\n  🚫 겹친(overlapping) 텍스트 요소 ${overlapIssues.length}개 발견 (렌더링 결함):`);
    for (const o of overlapIssues.slice(0, 20)) {
      console.log(`      "${o.a}" <-> "${o.b}" (겹침 ${(o.ratio * 100).toFixed(0)}%)`);
    }
    if (overlapIssues.length > 20) console.log(`      ... 외 ${overlapIssues.length - 20}개`);
  }
  console.log(`\n  nodes: ${total - failed.length}/${total} passed · checks: ${totalChecks - failChecks.length}/${totalChecks} passed · overlaps: ${overlapIssues.length}`);
  // unmatched(미구현 변형)는 경고로 취급, exit code는 매칭 노드의 체크 실패와 겹침 결함을 반영
  return (failChecks.length > 0 || overlapIssues.length > 0) ? 1 : 0;
  } finally {
    await browser.close();
  }
}

main().then((code) => process.exit(code)).catch((err) => {
  console.error("Verify failed:", err);
  process.exit(1);
});