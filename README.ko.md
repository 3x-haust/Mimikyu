<p align="center">
  <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/778.png" alt="Mimikyu" width="200" />
</p>

<h1 align="center">Mimikyu (따라큐)</h1>

<p align="center">
  Figma 디자인을 픽셀 퍼펙트하게 따라하는 — 측정 기반 검증 루프 (스택 자유)
</p>

<p align="center">
  <a href="#-이-도구는">이 도구는</a> · <a href="#-설치">설치</a> · <a href="#-사용법">사용법</a> · <a href="#-동작-원리">동작 원리</a> · <a href="#-완료-조건">완료 조건</a>
</p>

---

## 왜 만들었나요?

AI 코드 생성 결과는 항상 "비슷해 보이지만" 디자인과 어긋납니다.
색이 살짝 다르고, 텍스트가 2px 어긋나고, 버튼이 16px 왼쪽으로 밀려 있습니다.
그런데 "살짝 다르다"는 판단은 눈으로 하기 때문에 수정도 추측이 됩니다.

Mimikyu는 Figma를 **유일한 기준(Source of Truth)**으로 삼고, 결과를 숫자로 측정합니다.

```
Figma → figma-data.json (계약서) → 웹 코드 → 스크린샷 → 픽셀 비교 → 구조 검증 → 수정 → 반복
```

"어디가 다른지"를 AI가 추측하지 않습니다. 이렇게 출력합니다:

`CTA x: expected 436.5 / actual 373.0`, `color: expected #ffffff / actual #000000`

> 이름 유래: 원본을 그대로 따라하려는 포켓몬 따라큐(Mimikyu)

---

## 🚀 설치 (명령어 하나)

깃 클론도, npm도, 수동 폴더 다운로드도 필요 없습니다:

```bash
curl -fsSL https://raw.githubusercontent.com/3x-haust/Mimikyu/main/install.sh | bash
```

설치 스크립트가 Claude Code, Codex, pi(`.agents`)를 자동 감지해
각 도구에 스킬을 복사하고, 파이프라인 스크립트는 `~/.mimikyu/scripts/`에
넣습니다. 다시 실행하면 업데이트됩니다. 수동으로도 설치 가능합니다:

```bash
# Claude Code
mkdir -p ~/.claude/skills/mimikyu && cp skill/mimikyu/SKILL.md ~/.claude/skills/mimikyu/

# Codex
mkdir -p ~/.codex/skills/mimikyu && cp skill/mimikyu/SKILL.md ~/.codex/skills/mimikyu/

# pi (OMO 계열 에이전트)
mkdir -p ~/.agents/skills/mimikyu && cp skill/mimikyu/SKILL.md ~/.agents/skills/mimikyu/
```

Claude Code는 기존 슬래시 커맨드도 그대로 쓸 수 있습니다:

```bash
mkdir -p ~/.claude/commands && cp .claude/commands/mimikyu.md ~/.claude/commands/
```

### 필요한 것

- Node.js 20+, pnpm
- Python 3 + Pillow
- Playwright (Chromium)
- Figma MCP 또는 Figma personal access token

스킬이 실행되면 pnpm → Pillow → Playwright Chromium 을 자동으로 설치합니다.

### Figma MCP 설정

프로젝트 루트에 `.mcp.json` 생성 (`.mcp.example.json` 복사 후 토큰 입력):

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

---

## 💡 사용법

에이전트에게 Figma URL과 프로젝트 이름을 넘기면
추출 → 코드 생성 → 스크린샷 → 픽셀 비교 → 구조 검증 → 수정 루프까지 전부 실행합니다.

```
https://www.figma.com/design/FILE_KEY/Title?node-id=1-46 MyProject
```

### 스택과 폴더는 당신이 정합니다

스킬은 스택이나 폴더 구조를 강제하지 않습니다:

- **원하는 걸 말하면** — "React + Tailwind", "Vue", "vanilla", "Next.js",
  "내 기존 프로젝트 ~/app에 추가" — 그대로 따릅니다.
- **말하지 않으면** 에이전트가 먼저 물어봅니다 (React + Tailwind / Vue /
  vanilla / 기존 프로젝트 / 직접 지정). 비대화형 환경에서만 기본 템플릿으로
  폴백하고, 그 선택을 첫 리포트에 명시합니다.
- **기존 프로젝트는 존중** — 사용자 레이아웃을 무시하고 새 폴더를 만들지 않습니다.

경로를 안 주면 (React 기본 템플릿 기준) `projects/<name>/` 같은 제안 디렉토리를
만들기 전에 먼저 확인합니다. 파이프라인 스크립트는 원클릭 설치 시
`~/.mimikyu/scripts/`, 체크아웃 상태면 저장소 `scripts/`에 있습니다.

### 화면 한 개도, 전체 페이지도 가능

한 프레임(화면 하나) **또는** 전체 페이지/문서 — 둘 다 똑같이 동작합니다:

- `figma-data.json`에 노드 하나 또는 여러 최상위 프레임이 들어갈 수 있습니다.
- `--node-id`를 안 넘기면 `verify.ts`가 파일의 **모든 프레임**을 돌며
  전체 페이지를 검증합니다. 한 화면만 검사하려면 `--node-id`로 지정하세요.
- 픽셀 비교는 어느 쪽이든 export한 페이지 PNG를 사용합니다.

### 수동으로 루프 돌리기

```bash
cd projects/<name>

# 한 번에: 스크린샷 → 픽셀 비교 → 구조 검증
npx tsx ../../scripts/mimikyu.ts designs/desktop.png \
  --width 1280 --height 4836 --port 3334 \
  --verify designs/figma-data.json --node-id 184:7833 --skip-server

# 또는 단계별로
npx tsx ../../scripts/screenshot.ts screenshots/v1.png 1280 4836
python3 ../../scripts/compare.py designs/desktop.png screenshots/v1.png --regions --iteration 1
npx tsx ../../scripts/verify.ts designs/figma-data.json --port 3334 --node-id 184:7833

# 반복 히스토리
npx tsx ../../scripts/mimikyu.ts --history
```

---

## 🔍 동작 원리

### 두 개의 독립 검증 신호

| 도구 | 측정 대상 | 알려주는 것 |
|------|-----------|-------------|
| `compare.py` (PIL) | export된 디자인 PNG와의 픽셀 일치율 | "어디가/얼마나" — 전체 %, 9개 영역 %, 히트맵 |
| `verify.ts` (Playwright + DOM) | 텍스트 노드별 x, y, color, fontSize, fontWeight, lineHeight, letterSpacing vs `figma-data.json` | "무엇이 정확히 틀렸는지" — 노드별 expected vs actual |

픽셀 diff는 거친 탐지기, 구조 검증은 정밀 검사기입니다.
루프가 95~97%에서 정체할 때(전형적인 "색 살짝 다름 / 줄 3px 짧음" 벽),
`verify.ts`가 고칠 정확한 수치를 돌려줍니다 — 히트맵을 쳐다보며 추측할 필요가 없습니다.

`figma-data.json`은 Figma MCP/API로 **한 번만** 추출하고 전체 루프에서
재사용합니다. 구현과 검증 도구가 함께 읽는 계약서입니다.

### 수정 우선순위

1. **P0** 페이지 구조 / 뷰포트 / 라우팅 / 큰 컨테이너
2. **P1** 위치, 너비, 높이, 간격
3. **P2** 타이포그래피, 색상, 에셋
4. **P3** 보더, 라디우스, 그림자
5. **P4** 1px 단위 디테일

수정값은 `verify.ts` 출력과 `figma-data.json`에서 그대로 가져옵니다 —
눈대중 없이, 반올림 없이.

---

## 🎛️ compare.py 옵션

| 옵션 | 설명 |
|------|------|
| `--regions` | 3x3 그리드 영역별 분석 |
| `--custom-regions FILE` | JSON으로 영역 정의 `{"header": [0,0,1280,80]}` |
| `--threshold N` | 채널당 일치 판정 기준값 (기본 30, 낮을수록 엄격) |
| `--bg-only` | 텍스트 픽셀 무시, 배경/레이아웃만 비교 |
| `--side-by-side` | design \| screenshot \| heatmap 나란히 출력 |
| `--iteration N` | 반복 번호 기록 (diffs/history.json) |

---

## ✅ 완료 조건

아래 게이트가 **전부** 통과해야 스킬이 종료할 수 있습니다:

```
[ ] figma-data.json 추출 완료 (고정)
[ ] 구현 맵 작성 (Figma 노드 → 컴포넌트 → 파일 → 셀렉터)
[ ] overall_match  >= 99%
[ ] 모든 region    >= 99%   (top-left ~ bot-right 전부)
[ ] verify.ts mismatch == 0 (exit code 0)
[ ] critical mismatch == 0 (틀린 텍스트/에셋/색/폰트/내비게이션)
[ ] interaction 확인 (디자인에 정의된 경우)
[ ] 최종 스크린샷 + 리포트 생성
```

하나라도 실패하면 **완료가 아닙니다** — 고치고 다시 실행합니다.

### 중단 조건

- 3회 연속 점수 미개선 → `figma-data.json`에서 수정 목록을 재추출해 1:1 대조
- 또 3회 미개선 → 숫자와 함께 사용자에게 보고하고 넘깁니다.
  무한 반복 금지, 에이전트의 "충분히 좋다" 판단 금지.

---

## 📁 프로젝트 구조

아래는 **기본 React + Tailwind 템플릿** 레이아웃입니다. 다른 스택이나 기존
프로젝트를 쓰면 스킬이 그 구조를 따릅니다. `designs/`, `screenshots/`,
`diffs/`는 앱 코드 옆에 작업 폴더로 유지됩니다.

```
Mimikyu/
├── scripts/
│   ├── mimikyu.ts       # 루프 오케스트레이터 (스크린샷 → 비교 → 검증)
│   ├── screenshot.ts    # Playwright 캡처 (뷰포트/DPR 반영)
│   ├── compare.py       # PIL 픽셀 비교 + 히트맵 + 히스토리
│   └── verify.ts        # DOM vs figma-data 구조 검증
├── skill/mimikyu/       # 범용 SKILL.md (Claude Code / Codex / pi)
├── .claude/commands/    # 레거시 Claude Code 슬래시 커맨드
└── projects/<name>/     # 기본 템플릿: 디자인당 하나의 독립 앱
    ├── designs/         # figma-data.json (계약서) + desktop.png (원본)
    ├── screenshots/     # Playwright 캡처 결과
    ├── diffs/           # 히트맵, 오버레이, history.json
    ├── public/assets/   # Figma에서 다운로드한 이미지
    └── src/components/  # 컴포넌트 (구현 맵으로 연결)
```

## 기술 스택

- **기본 템플릿**: React 19, TypeScript, Tailwind CSS v4, Vite — 단, 스킬은
  스택에 독립적; 사용자가 원하는 스택을 그대로 사용
- **Screenshot**: Playwright (headless Chromium)
- **Comparison**: Python PIL/Pillow + DOM 구조 검증
- **Figma**: Framelink MCP, Official Figma MCP (REST fallback)

## License

MIT

## English

English guide: [README.md](README.md)