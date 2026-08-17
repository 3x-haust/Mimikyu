/**
 * Playwright를 사용해 현재 Vite 개발서버의 스크린샷을 캡처합니다.
 * Usage: pnpm screenshot [output_path] [width] [height]
 *
 * 2x 해상도로 캡처 후 1x로 다운스케일하여 안티앨리어싱 차이를 줄입니다.
 */
import { chromium } from "playwright";
import { resolve } from "path";
import { execSync } from "child_process";
import { readdirSync } from "fs";

const CACHE = `${process.env.HOME}/Library/Caches/ms-playwright`;

async function launch() {
  try {
    return await chromium.launch();
  } catch {
    const build = readdirSync(CACHE).find((d) => d.startsWith("chromium-"));
    if (!build) throw new Error("chromium not installed — run: npx playwright install chromium");
    const p = `${CACHE}/${build}/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`;
    return chromium.launch({ executablePath: p });
  }
}

const outputPath = process.argv[2] || "screenshots/current.png";
const width = parseInt(process.argv[3] || "1440", 10);
const height = parseInt(process.argv[4] || "900", 10);
const port = parseInt(process.env.PORT || "3333", 10);
const scaleFactor = parseInt(process.env.SCALE || "1", 10);

async function capture() {
  const browser = await launch();
  const page = await browser.newPage({
    viewport: { width, height },
    deviceScaleFactor: scaleFactor,
  });

  // (중요) motion(reveal) 요소를 최종 상태로 렌더 — prefers-reduced-motion: reduce emulation.
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(`http://localhost:${port}`, {
    waitUntil: "networkidle",
  });

  // 폰트 로딩 완료 대기
  await page.evaluate(() => document.fonts.ready);

  // 스크롤로 below-fold + motion reveal 을 전부 트리거한 뒤 맨 위로 복귀
  await page.evaluate(async () => {
    const h = document.body.scrollHeight;
    for (let y = 0; y <= h; y += 700) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 40));
    }
    window.scrollTo(0, 0);
  });

  // 이미지 전부 decode (lazy → eager)
  await page.evaluate(async () => {
    for (const image of document.images) image.loading = "eager";
    await Promise.all(
      [...document.images].map((image) =>
        image.complete
          ? image.decode().catch(() => {})
          : new Promise<void>((resolve) => {
              const t = window.setTimeout(resolve, 8000);
              image.addEventListener("load", () => { window.clearTimeout(t); resolve(); }, { once: true });
              image.addEventListener("error", () => { window.clearTimeout(t); resolve(); }, { once: true });
            }),
      ),
    );
  });
  await page.waitForTimeout(300);

  // (중요) 실제 렌더링 폭 검사 — 사용자가 지적한 핵심:
  // 디자인 export 폭과 동일한 폭으로 강제 캡처하면, 실제 페이지가 그 폭에서
  // 다르게 reflow(overlap 등)돼도 캡처가 "똑같은 폭"이라 AI 가 못 알아차린다.
  // 실제 렌더 폭이 요청 폭과 다르면 경고를 터뜨린다.
  const layout = await page.evaluate(() => ({
    clientW: document.documentElement.clientWidth,
    scrollW: document.body ? document.body.scrollWidth : 0,
    scrollH: document.body ? document.body.scrollHeight : 0,
    overflowX: document.body ? document.body.scrollWidth > document.documentElement.clientWidth : false,
  }));
  if (layout.overflowX) {
    console.warn(`[render-width] ⚠️  horizontal overflow: captures ${layout.scrollW}px content, viewport ${layout.clientW}px — elements are cut/overlapping off-screen.`);
  }
  if (layout.clientW !== undefined && Math.abs(layout.clientW - width) > 1) {
    console.warn(`[render-width] ⚠️  viewport is ${width}px but page renders at ${layout.clientW}px — reflow may hide width-dependent overlap.`);
  }

  const tempPath = scaleFactor > 1 ? resolve(outputPath + ".2x.png") : resolve(outputPath);

  await page.screenshot({
    path: tempPath,
    fullPage: true,
  });

  await browser.close();

  // 2x로 캡처한 경우 1x로 다운스케일
  if (scaleFactor > 1) {
    execSync(
      `python3 -c "from PIL import Image; img = Image.open('${tempPath}'); img = img.resize((${width}, ${height}), Image.LANCZOS); img.save('${resolve(outputPath)}')"`,
    );
    execSync(`rm '${tempPath}'`);
  }

  console.log(`Screenshot saved: ${resolve(outputPath)} (${width}x${height}) fullPage`);
}

capture().catch((err) => {
  console.error("Screenshot failed:", err);
  process.exit(1);
});
