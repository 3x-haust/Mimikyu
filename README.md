# Mimikyu (따라큐)

Figma 디자인을 **픽셀 퍼펙트**하게 React + Tailwind CSS로 재현하는 Claude Code 스킬.

Figma MCP로 디자인 데이터를 추출하고, Playwright + PIL로 픽셀 단위 검증 루프를 돌려 **95% 이상 일치율**을 달성할 때까지 자동 반복한다.

## How It Works

```
Figma Design → MCP 데이터 추출 → React 코드 생성 → 스크린샷 캡처 → 픽셀 비교 → 수정 반복
```

1. **Figma MCP**로 레이아웃, 스타일, 에셋 데이터 추출
2. `absoluteBoundingBox` 좌표 기반 **absolute positioning**으로 코드 생성
3. **Playwright**로 구현 결과 스크린샷 캡처
4. **PIL**로 디자인 원본과 픽셀 단위 비교 → 히트맵 생성
5. 히트맵의 빨간 영역을 수정하고 **95%+ 달성까지 반복**

## Project Structure

```
Mimikyu/
├── scripts/
│   ├── mimikyu.ts       # 피드백 루프 오케스트레이터
│   ├── screenshot.ts    # Playwright 스크린샷 캡처
│   └── compare.py       # PIL 픽셀 비교 + 히트맵
├── projects/            # 각 프로젝트별 독립 디렉토리
│   └── <project>/
│       ├── designs/     # Figma export 원본 이미지
│       ├── screenshots/ # Playwright 캡처 결과
│       ├── diffs/       # 히트맵, 오버레이, history.json
│       ├── public/assets/
│       └── src/
└── CLAUDE.md            # Claude Code 스킬 정의
```

## Install

### Claude Code 스킬로 설치 (권장)

```bash
claude skill install github:3x-haust/Mimikyu
```

또는 수동으로:

```bash
git clone https://github.com/3x-haust/Mimikyu.git ~/.claude/commands/mimikyu
```

### Prerequisites

- [Claude Code](https://claude.ai/code) with MCP support
- Node.js 20+, pnpm
- Python 3 + Pillow
- Playwright

### Setup

**1. MCP 서버 설정**

`.mcp.json`을 프로젝트 루트에 생성한다 (`.mcp.example.json` 참고):

```json
{
  "mcpServers": {
    "framelink-figma": {
      "command": "npx",
      "args": ["-y", "figma-developer-mcp", "--figma-api-key=YOUR_TOKEN", "--stdio"]
    },
    "figma": {
      "command": "npx",
      "args": ["-y", "figma-mcp"],
      "env": { "FIGMA_API_KEY": "YOUR_TOKEN" }
    }
  }
}
```

**2. 의존성 설치 (수동 설치 시)**

```bash
pnpm install
pip3 install Pillow
npx playwright install chromium
```

> `/mimikyu` 스킬로 실행하면 의존성이 자동으로 설치된다. 수동 실행 시에만 위 명령을 직접 실행하면 된다.

## Usage

### Claude Code 스킬로 사용 (권장)

Claude Code에서 Figma URL을 전달하면 의존성 설치부터 전체 워크플로우가 자동 실행된다:

```
# 기본 (projects/<name>/ 에 생성)
/mimikyu https://www.figma.com/design/FILE_KEY/Title?node-id=1-46 MyProject

# 출력 경로 지정
/mimikyu https://www.figma.com/design/FILE_KEY/Title?node-id=1-46 MyProject ~/Desktop/my-app
```

### 수동 실행

```bash
cd projects/<name>

# 피드백 루프 한 사이클
pnpm mimikyu designs/desktop.png

# 옵션
pnpm mimikyu designs/desktop.png --threshold 20 --bg-only --side-by-side

# 히스토리 확인
pnpm mimikyu --history
```

### 개별 스크립트

```bash
# 스크린샷 캡처
PORT=3334 npx tsx ../../scripts/screenshot.ts screenshots/v1.png 1280 720

# 픽셀 비교
python3 ../../scripts/compare.py designs/desktop.png screenshots/v1.png \
  --regions --iteration 1 --side-by-side
```

## Compare Options

| 옵션 | 설명 |
|------|------|
| `--regions` | 3x3 그리드 영역별 분석 |
| `--custom-regions FILE` | JSON으로 커스텀 영역 정의 |
| `--threshold N` | 일치 판정 임계값 (default: 30) |
| `--bg-only` | 텍스트 무시, 배경/레이아웃만 비교 |
| `--side-by-side` | design \| screenshot \| heatmap 합성 이미지 |
| `--iteration N` | 버전 추적 + history.json 기록 |

## Score Guide

| 점수 | 상태 | 조치 |
|------|------|------|
| **95%+** | 완료 | 폰트 렌더링 차이 수준 |
| **85-95%** | 미세 조정 | padding, margin, color 확인 |
| **85% 미만** | 구조적 차이 | 레이아웃 전면 재검토 |

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Vite
- **Screenshot**: Playwright (headless Chromium)
- **Comparison**: Python PIL/Pillow
- **Figma Integration**: Framelink MCP, Official Figma MCP

## License

MIT
