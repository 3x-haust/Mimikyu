# Mimikyu (따라큐) - Figma Pixel Perfect Publisher

## 개요
Figma 디자인을 픽셀 퍼펙트하게 React + Tailwind CSS로 재현하는 도구.
Figma MCP (Framelink + 공식)로 디자인 데이터를 추출하고, Playwright + PIL로 픽셀 단위 검증 루프를 돌린다.

## 프로젝트 구조
```
Mimikyu/
├── scripts/           # 공용 스크립트 (screenshot.ts, compare.py, mimikyu.ts)
├── projects/          # 각 프로젝트별 독립 디렉토리
│   └── <project>/
│       ├── package.json       # 독립 Vite+React 프로젝트
│       ├── vite.config.ts
│       ├── index.html
│       ├── designs/           # Figma export 원본 이미지
│       ├── screenshots/       # Playwright 캡처 결과
│       ├── diffs/             # 히트맵, 오버레이, history.json
│       ├── public/assets/     # Figma에서 다운로드한 이미지 에셋
│       └── src/
│           ├── App.tsx
│           ├── main.tsx
│           ├── index.css
│           └── components/
└── CLAUDE.md
```

**프로젝트는 반드시 `projects/<project-name>/` 안에 생성한다.**

## 기술 스택
- React 19 + TypeScript + Tailwind CSS v4 (@tailwindcss/vite) + Vite
- Playwright (headless Chromium 스크린샷)
- Python PIL/Pillow (픽셀 비교 + 히트맵)
- pnpm
- Figma MCP 서버:
  - **Framelink** (`framelink-figma`) — `get_figma_data`, `download_figma_images`
  - **공식 Figma** (`figma`) — `view_node`, `add_figma_file`, `read_comments`

## 워크플로우

### Phase 1: Figma 디자인 데이터 추출

**MCP 도구를 사용하여 Figma 데이터를 가져온다:**

#### 1. Framelink MCP — 디자인 구조 + 스타일 데이터

```
mcp__framelink-figma__get_figma_data(
  fileKey: "<FILE_KEY>",
  nodeId: "<NODE_ID>"    // URL의 node-id 파라미터
)
```
- 레이아웃 구조, 스타일, 좌표, 타이포그래피 등 전체 디자인 데이터 반환
- `depth` 옵션으로 트리 탐색 깊이 제어 가능

#### 2. Framelink MCP — 이미지 에셋 다운로드

```
mcp__framelink-figma__download_figma_images(
  fileKey: "<FILE_KEY>",
  nodeId: "<NODE_ID>",
  outputDir: "public/assets/"
)
```
- 아이콘, 일러스트 등 이미지 에셋을 로컬에 다운로드

#### 3. 공식 Figma MCP — 노드 시각 확인

```
mcp__figma__view_node(
  file_key: "<FILE_KEY>",
  node_id: "<NODE_ID>"   // "1:46" 형식
)
```
- 특정 노드의 썸네일 이미지 확인용

#### Figma URL 파싱

```
https://www.figma.com/design/<FILE_KEY>/Title?node-id=<NODE_ID>
```

추출할 데이터:
- `absoluteBoundingBox` → 각 요소의 정확한 x, y, width, height
- `fills` → 배경색, 그라디언트
- `style` → font-family, font-size, font-weight, line-height, letter-spacing
- `cornerRadius` → border-radius
- `effects` → box-shadow
- `strokes` → border

#### 보조: curl 직접 호출 (MCP 불가 시 fallback)

```bash
curl -s -H "X-Figma-Token: <TOKEN>" \
  "https://api.figma.com/v1/files/<FILE_KEY>/nodes?ids=<NODE_ID>"
curl -s -H "X-Figma-Token: <TOKEN>" \
  "https://api.figma.com/v1/images/<FILE_KEY>?ids=<NODE_ID>&format=png&scale=1"
```

### Phase 2: 프로젝트 셋업

출력 경로가 지정되면 해당 경로에, 미지정 시 `projects/<name>/`에 프로젝트를 생성한다.

```bash
# 출력 경로 지정 시: <output-path>/ 에 프로젝트 생성
# 미지정 시: projects/<name>/ 에 독립 프로젝트 생성
mkdir -p <target-dir>
cd <target-dir>

# package.json, vite.config.ts, tsconfig.json, index.html 생성
# Vite 포트는 메인(3333)과 겹치지 않게 설정 (3334, 3335, ...)
# 한글 폰트 사용시 index.html에 CDN 링크 추가 (Pretendard 등)

pnpm install
```

### Phase 3: 절대 좌표 기반 코드 생성

**핵심: Figma의 absoluteBoundingBox 좌표를 그대로 사용하여 absolute positioning**

```tsx
// 부모 프레임의 x, y를 기준으로 자식 요소의 상대 좌표 계산
// 부모 프레임: { x: 100, y: 200, width: 1259, height: 977 }
// 자식 요소:  { x: 164, y: 348 }
// → left = 164 - 100 = 64, top = 348 - 200 = 148

<section className="relative w-[1259px] h-[977px]">
  <h2 className="absolute left-[64px] top-[148px] text-[64px] font-extrabold">
    제목 텍스트
  </h2>
</section>
```

규칙:
- **수치를 반올림하거나 근사치로 대체하지 않는다** — Figma 값 그대로
- 색상은 hex 그대로: `bg-[#1E1E2E]`, `text-[#666666]`
- font-size, line-height, letter-spacing 모두 Figma 수치 그대로
- `lineHeightPx` → CSS `leading-[Xpx]`로 직접 변환
- `fills`가 비어있는 노드(fills=0)는 빈 사각형이므로 렌더링하지 않음
- SVG 아이콘은 인라인 컴포넌트로 작성

### 이미지 사용 원칙

**이미지는 코드로 재현 불가능한 에셋에만 사용한다:**
- 로고 (logo.png 등)
- 3D 오브젝트, 일러스트레이션
- 사진, 스크린샷
- 복잡한 그래픽 에셋

**이미지로 대체하면 안 되는 것:**
- 텍스트 → React 컴포넌트 + Tailwind로 구현
- 버튼 → HTML button + Tailwind 스타일링
- 카드, 섹션 배경 → CSS로 구현
- 아이콘 → 인라인 SVG로 구현
- 레이아웃/구조 → absolute positioning으로 구현

이미지 에셋은 `public/assets/`에 다운로드하여 `<img src="/assets/..." />`로 사용

### Phase 4: 섹션 간격 계산

App.tsx에서 각 섹션 사이 간격은 Figma의 절대 좌표로 계산:

```
섹션A 끝: y_a + height_a
섹션B 시작: y_b
간격 = y_b - (y_a + height_a)
```

```tsx
<div className="w-[1280px] mx-auto flex flex-col items-center">
  <div className="h-[19px]" />   {/* 상단 여백 */}
  <Header />
  <div className="h-[16px]" />   {/* 계산된 간격 */}
  <Hero />
  <div className="h-[368px]" />  {/* 계산된 간격 */}
  <Modules />
</div>
```

### Phase 5: 픽셀 비교 검증 루프

```bash
# 1. dev server 시작 (프로젝트 디렉토리에서)
cd projects/<name> && pnpm dev

# 2. 스크린샷 캡처
PORT=<port> npx tsx ../../scripts/screenshot.ts screenshots/v1.png <width> <height>

# 3. 픽셀 비교
python3 ../../scripts/compare.py designs/desktop.png screenshots/v1.png \
  --regions --iteration 1

# 4. 결과 확인
# - diffs/v1_diff_heatmap.png  (빨간색 = 불일치 영역)
# - diffs/v1_diff_overlay.png  (원본에 차이 오버레이)
# - stdout JSON (전체/영역별 일치율)
```

옵션:
- `--regions` : 3x3 그리드 영역별 분석
- `--custom-regions FILE` : JSON으로 영역 정의 `{"header": [0,0,1280,80]}`
- `--bg-only` : 텍스트 무시, 배경/레이아웃만 비교
- `--side-by-side` : design | screenshot | heatmap 합성 이미지
- `--iteration N` : 버전 추적 + history.json 기록
- `--threshold N` : 일치 판정 임계값 (default: 30)

### Phase 6: 수정 → 재검증 반복

1. 히트맵에서 빨간 영역 확인 (빨강 = 위치 불일치 + 색상 불일치 모두 포함)
2. 해당 컴포넌트의 **좌표, 크기, 색상, 폰트, 간격** 모두 수정
3. 스크린샷 재캡처 → 비교
4. **95% 이상 달성할 때까지 반복**

## 비교 방식

PIL diff는 **RGB 픽셀 단위 비교**를 수행한다:
- 각 픽셀의 R, G, B 채널별 차이를 계산
- 모든 채널의 최대 차이가 threshold(기본 30) 이하이면 "일치"
- 즉, **위치뿐 아니라 색상도 정확히 일치해야** 점수가 오른다

### 색상 불일치의 주요 원인
- **배경색**: hex 값이 Figma와 다름 (예: `#e0e0e0` vs `#dedede`)
- **텍스트 색상**: `#666` vs `#666666` 등 약간의 차이
- **그라디언트/이미지**: 원본 에셋과 렌더링 차이
- **border/stroke 색상**: Figma stroke 값과 CSS border 값 불일치
- **opacity**: Figma의 fill opacity가 CSS에 반영되지 않음

### 비교 결과 해석

| 점수 | 상태 | 조치 |
|------|------|------|
| 95%+ | 완벽 (폰트 렌더링 차이 수준) | 완료 |
| 85-95% | 미세 조정 필요 | padding, margin, color, border-radius 확인 |
| 85% 미만 | 구조적 차이 | 레이아웃 + 색상 + 좌표 전면 재검토 |

## 중요 원칙

1. **"거의 완벽"이라고 스스로 판단하지 말 것** — PIL diff만 신뢰
2. **히트맵이 검어질 때까지** 반복 수정
3. Figma absoluteBoundingBox 좌표를 기준으로 absolute positioning
4. 모든 수치는 Figma 원본 그대로 — 반올림 금지
5. **색상은 Figma fills/strokes의 hex 값 그대로** — 근사치 사용 금지
6. Figma의 `cornerRadius`, `strokeWeight`, `opacity` 등 모든 속성을 정확히 반영
7. Figma `lineHeightPx` → CSS `leading-[Xpx]` 직접 변환
8. `fills`가 비어있는 노드(fills=0)는 빈 사각형 → 이미지 렌더링하지 않음
9. **이미지는 로고, 3D 오브젝트, 사진 등 코드로 재현 불가한 에셋에만 사용**
10. **텍스트, 버튼, 레이아웃, 섹션 등은 반드시 React + Tailwind 코드로 구현**
11. 폰트 렌더링 차이 (anti-aliasing)는 코드로 해결 불가 — bg-only 99%+ 목표
