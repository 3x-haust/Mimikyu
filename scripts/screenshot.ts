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

  await page.goto(`http://localhost:${port}`, {
    waitUntil: "networkidle",
  });

  // 폰트 로딩 완료 대기
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(2000);

  const tempPath = scaleFactor > 1 ? resolve(outputPath + ".2x.png") : resolve(outputPath);

  await page.screenshot({
    path: tempPath,
    fullPage: false,
  });

  await browser.close();

  // 2x로 캡처한 경우 1x로 다운스케일
  if (scaleFactor > 1) {
    execSync(
      `python3 -c "from PIL import Image; img = Image.open('${tempPath}'); img = img.resize((${width}, ${height}), Image.LANCZOS); img.save('${resolve(outputPath)}')"`,
    );
    execSync(`rm '${tempPath}'`);
  }

  console.log(`Screenshot saved: ${resolve(outputPath)} (${width}x${height})`);
}

capture().catch((err) => {
  console.error("Screenshot failed:", err);
  process.exit(1);
});
