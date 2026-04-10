/**
 * Mimikyu (따라큐) - 픽셀 퍼펙트 피드백 루프 오케스트레이터
 *
 * 워크플로우:
 * 1. Vite 개발서버 시작
 * 2. Playwright로 현재 구현 스크린샷 캡처
 * 3. 디자인 이미지와 PIL 픽셀 비교
 * 4. 차이점 분석 결과 출력
 *
 * Usage: pnpm mimikyu <design_image_path> [options]
 */
import { execSync, spawn, type ChildProcess } from "child_process";
import { existsSync, readFileSync, mkdirSync } from "fs";
import { resolve } from "path";

const args = process.argv.slice(2);

interface ParsedArgs {
  designPath: string | undefined;
  width: number | undefined;
  height: number | undefined;
  threshold: number;
  skipServer: boolean;
  port: number;
  history: boolean;
  bgOnly: boolean;
  sideBySide: boolean;
}

function parseArgs(): ParsedArgs {
  const designPath = args.find((a) => !a.startsWith("--"));

  function getFlag(flag: string): string | undefined {
    const idx = args.indexOf(flag);
    return idx !== -1 ? args[idx + 1] : undefined;
  }

  const widthStr = getFlag("--width");
  const heightStr = getFlag("--height");
  const thresholdStr = getFlag("--threshold");
  const portStr = getFlag("--port");

  return {
    designPath,
    width: widthStr !== undefined ? parseInt(widthStr, 10) : undefined,
    height: heightStr !== undefined ? parseInt(heightStr, 10) : undefined,
    threshold: thresholdStr !== undefined ? parseInt(thresholdStr, 10) : 30,
    skipServer: args.includes("--skip-server"),
    port: portStr !== undefined ? parseInt(portStr, 10) : 3333,
    history: args.includes("--history"),
    bgOnly: args.includes("--bg-only"),
    sideBySide: args.includes("--side-by-side"),
  };
}

function getImageSize(imagePath: string): { width: number; height: number } {
  const result = execSync(
    `python3 -c "from PIL import Image; img=Image.open('${imagePath}'); print(f'{img.width} {img.height}')"`,
    { encoding: "utf-8" }
  ).trim();
  const [width, height] = result.split(" ").map(Number);
  return { width, height };
}

function getNextIteration(): number {
  const historyPath = "diffs/history.json";
  if (!existsSync(historyPath)) return 1;
  try {
    const history = JSON.parse(readFileSync(historyPath, "utf-8"));
    return Array.isArray(history) ? history.length + 1 : 1;
  } catch {
    return 1;
  }
}


function waitForServer(port: number, timeout = 15000): Promise<void> {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const check = () => {
      try {
        execSync(`curl -s -o /dev/null -w "%{http_code}" http://localhost:${port}`, {
          stdio: "pipe",
        });
        resolve();
      } catch {
        if (Date.now() - start > timeout) {
          reject(new Error(`Server did not start within ${timeout}ms`));
        } else {
          setTimeout(check, 500);
        }
      }
    };
    check();
  });
}

function printSummaryTable(
  iteration: number,
  overall: number,
  regions: Record<string, number>
): void {
  const BOX_WIDTH = 44;
  const title = `Mimikyu v${iteration} — Overall: ${overall.toFixed(1)}%`;
  const titlePadded = title.padEnd(BOX_WIDTH - 2);

  const lines: string[] = [];
  lines.push(`╔${"═".repeat(BOX_WIDTH)}╗`);
  lines.push(`║  ${titlePadded}║`);
  lines.push(`╠${"═".repeat(BOX_WIDTH)}╣`);

  const header = "Region".padEnd(16) + "Score".padEnd(9) + "Status";
  lines.push(`║  ${header.padEnd(BOX_WIDTH - 2)}║`);

  for (const [region, score] of Object.entries(regions)) {
    const status = score >= 95 ? "✅" : score >= 85 ? "🔶" : "❌";
    const scoreStr = `${score.toFixed(1)}%`;
    const row = region.padEnd(16) + scoreStr.padEnd(9) + status;
    lines.push(`║  ${row.padEnd(BOX_WIDTH - 2)}║`);
  }

  lines.push(`╚${"═".repeat(BOX_WIDTH)}╝`);
  console.log("\n" + lines.join("\n") + "\n");
}

function showHistory(): void {
  const historyPath = "diffs/history.json";
  if (!existsSync(historyPath)) {
    console.log("No history found. Run mimikyu at least once first.");
    return;
  }

  let history: Array<{ iteration: number; overall_match: number; regions?: Record<string, number> }>;
  try {
    history = JSON.parse(readFileSync(historyPath, "utf-8"));
  } catch {
    console.error("Failed to parse history.json");
    return;
  }

  const BOX_WIDTH = 44;
  console.log(`\n╔${"═".repeat(BOX_WIDTH)}╗`);
  console.log(`║  ${"Mimikyu — Iteration History".padEnd(BOX_WIDTH - 2)}║`);
  console.log(`╠${"═".repeat(BOX_WIDTH)}╣`);
  const header = "Version".padEnd(12) + "Overall".padEnd(12) + "Trend";
  console.log(`║  ${header.padEnd(BOX_WIDTH - 2)}║`);

  let prev: number | null = null;
  for (const entry of history) {
    const overall = entry.overall_match;
    const trend =
      prev === null ? "—" : overall > prev ? "↑" : overall < prev ? "↓" : "=";
    const row =
      `v${entry.iteration}`.padEnd(12) +
      `${overall.toFixed(1)}%`.padEnd(12) +
      trend;
    console.log(`║  ${row.padEnd(BOX_WIDTH - 2)}║`);
    prev = overall;
  }

  console.log(`╚${"═".repeat(BOX_WIDTH)}╝\n`);
}

async function main() {
  const { designPath, width, height, threshold, skipServer, port, history, bgOnly, sideBySide } =
    parseArgs();

  if (history) {
    showHistory();
    return;
  }

  if (!designPath) {
    console.log(`
╔══════════════════════════════════════════════════╗
║  Mimikyu (따라큐) - Pixel Perfect Feedback Loop  ║
╚══════════════════════════════════════════════════╝

Usage:
  pnpm mimikyu <design_image> [options]

Options:
  --width <n>       뷰포트 너비 (auto-detected from image)
  --height <n>      뷰포트 높이 (auto-detected from image)
  --threshold <n>   일치 판정 임계값 0-255 (default: 30)
  --skip-server     이미 실행 중인 dev server 사용
  --port <n>        dev server 포트 (default: 3333)
  --history         반복 히스토리 보기
  --bg-only         배경만 비교 (compare.py pass-through)
  --side-by-side    나란히 비교 출력 (compare.py pass-through)

Example:
  pnpm mimikyu designs/dashboard.png
  pnpm mimikyu designs/login.png --width 1280 --height 720
  pnpm mimikyu designs/home.png --history
    `);
    process.exit(0);
  }

  if (!existsSync(designPath)) {
    console.error(`Design image not found: ${designPath}`);
    process.exit(1);
  }

  // Auto-detect viewport from image unless overridden
  let viewportWidth = width;
  let viewportHeight = height;

  if (viewportWidth === undefined || viewportHeight === undefined) {
    console.log("Auto-detecting viewport from design image...");
    try {
      const size = getImageSize(resolve(designPath));
      viewportWidth = viewportWidth ?? size.width;
      viewportHeight = viewportHeight ?? size.height;
      console.log(`Detected size: ${viewportWidth}x${viewportHeight}`);
    } catch (err) {
      console.error("Failed to detect image size, falling back to 1440x900:", err);
      viewportWidth = viewportWidth ?? 1440;
      viewportHeight = viewportHeight ?? 900;
    }
  }

  const iteration = getNextIteration();
  mkdirSync("screenshots", { recursive: true });
  mkdirSync("diffs", { recursive: true });

  const screenshotPath = `screenshots/v${iteration}.png`;

  let devServer: ChildProcess | null = null;

  try {
    // 1. Dev server 시작 (필요시)
    if (!skipServer) {
      console.log("Starting Vite dev server...");
      devServer = spawn("pnpm", ["dev"], {
        stdio: "pipe",
        detached: false,
      });
      await waitForServer(port);
      console.log(`Dev server ready on http://localhost:${port}`);
    }

    // 2. Screenshot 캡처
    console.log(`Capturing screenshot (${viewportWidth}x${viewportHeight}) -> ${screenshotPath}`);
    execSync(
      `pnpm screenshot ${screenshotPath} ${viewportWidth} ${viewportHeight}`,
      { stdio: "inherit" }
    );

    // 3. PIL 비교
    console.log("Comparing pixels...");

    const passThroughFlags = [
      bgOnly ? "--bg-only" : "",
      sideBySide ? "--side-by-side" : "",
    ]
      .filter(Boolean)
      .join(" ");

    const compareCmd = [
      `python3 scripts/compare.py`,
      `"${resolve(designPath)}"`,
      `"${resolve(screenshotPath)}"`,
      `--regions`,
      `--threshold ${threshold}`,
      `--iteration ${iteration}`,
      passThroughFlags,
    ]
      .filter(Boolean)
      .join(" ");

    const result = execSync(compareCmd, { encoding: "utf-8" });

    const data = JSON.parse(result);

    // 4. Summary table
    const regions: Record<string, number> = data.regions ?? {};
    printSummaryTable(iteration, data.overall_match, regions);

    console.log(`  Screenshot: ${screenshotPath}`);
    console.log(`  Heatmap:    ${data.heatmap}`);
    if (data.overlay) console.log(`  Overlay:    ${data.overlay}`);
    if (data.side_by_side) console.log(`  Side-by-side: ${data.side_by_side}`);
    console.log();
  } finally {
    if (devServer) {
      devServer.kill();
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
