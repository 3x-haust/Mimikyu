/**
 * Playwright를 사용해 현재 Vite 개발서버의 스크린샷을 캡처합니다.
 * Usage: pnpm screenshot [output_path] [width] [height]
 */
import { chromium } from "playwright";
import { resolve } from "path";

const outputPath = process.argv[2] || "screenshots/current.png";
const width = parseInt(process.argv[3] || "1440", 10);
const height = parseInt(process.argv[4] || "900", 10);
const port = parseInt(process.env.PORT || "3333", 10);

async function capture() {
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width, height },
    deviceScaleFactor: 1,
  });

  await page.goto(`http://localhost:${port}`, {
    waitUntil: "networkidle",
  });

  // 폰트 로딩 완료 대기
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(2000);

  await page.screenshot({
    path: resolve(outputPath),
    fullPage: false,
  });

  console.log(`Screenshot saved: ${resolve(outputPath)} (${width}x${height})`);
  await browser.close();
}

capture().catch((err) => {
  console.error("Screenshot failed:", err);
  process.exit(1);
});
