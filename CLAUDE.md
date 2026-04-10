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

### Phase 1: Figma 디자인 데이터 추출 및 저장

**MCP 도구를 사용하여 Figma 데이터를 가져오고, `designs/figma-data.json`에 저장한다.**
이후 검증 루프에서는 MCP를 다시 호출하지 않고 이 파일을 참조하여 수정한다.

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
- **텍스트 요소에는 반드시 `whitespace-nowrap` 적용** — Figma에서 한 줄로 표시되는 텍스트는 코드에서도 반드시 한 줄이어야 한다
- 텍스트 컨테이너의 width는 Figma boundingBox width 이상으로 설정하여 텍스트가 넘치지 않게 한다

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
2. `designs/figma-data.json`에서 해당 영역의 원본 좌표/스타일/색상을 다시 확인하고 코드 수정
3. 스크린샷 재캡처 → 비교
4. **overall_match 99%+ AND 모든 region 각각 99%+ 달성할 때까지 반복**

### Phase 6.5: 색상 불일치 집중 수정 (95%+ 이후 정체 시)

점수가 95% 이상인데 더 오르지 않으면, 대부분 **색상 불일치**가 원인이다.
아래 절차로 색상을 집중 수정한다:

1. **figma-data.json에서 모든 색상 코드를 추출한다:**
   - `fills[].color` → `rgba(r*255, g*255, b*255, a)` → hex 변환
   - `strokes[].color` → 동일하게 변환
   - `style.fills`, `backgroundColor` 등 모든 색상 속성
   - Figma 색상은 0~1 범위이므로 반드시 `Math.round(value * 255)`로 변환

2. **현재 코드의 모든 색상 코드를 grep으로 추출한다:**
   ```bash
   grep -oE '#[0-9a-fA-F]{3,8}' src/**/*.tsx | sort -u
   ```

3. **Figma 원본 색상과 코드 색상을 1:1 대조한다:**
   - `#666` → `#666666` 처럼 축약 표기 차이 확인
   - `opacity` 가 별도로 있는지 확인 (Figma opacity × fill opacity)
   - 그라디언트의 각 color stop 값 확인

4. **불일치하는 색상을 Figma 원본 hex로 교체한다**

흔한 색상 불일치 원인:
- **축약 hex**: `#666` vs `#666666` — 항상 6자리 hex 사용
- **opacity 미반영**: Figma의 `opacity: 0.8`이 CSS에 없음 → `opacity-[0.8]` 또는 `bg-[#RRGGBB]/80`
- **fills의 color가 0~1 범위**: `{r: 0.12, g: 0.12, b: 0.18}` → `#1E1E2E` (반드시 *255 후 반올림)
- **배경 그라디언트**: Figma의 `gradientStops`를 CSS `bg-gradient-to-*`로 정확히 변환
- **stroke를 border로**: `strokes[].color`를 `border-[색상]`으로 정확히 반영

### 완료 조건 — 반드시 준수

**아래 조건을 모두 만족하기 전에는 절대 작업을 종료하지 않는다:**

- `overall_match` ≥ 99%
- `regions`의 **모든 9개 영역**(top-left ~ bot-right) **각각** ≥ 99%

**위반 시 행동:**
- 하나의 region이라도 99% 미만이면 → 해당 영역의 좌표를 계산하여 집중 수정
- 3회 연속 점수가 오르지 않으면 → Phase 6.5 색상 불일치 집중 수정 단계를 반드시 실행
- "더 이상 개선이 어렵다", "충분히 좋다" 등의 판단 금지 — **수치가 조건을 만족할 때만 종료**
- **opacity**: Figma의 fill opacity가 CSS에 반영되지 않음

### 비교 결과 해석

| 점수 | 상태 | 조치 |
|------|------|------|
| 99%+ | 완벽 (폰트 렌더링 차이 수준) | 완료 |
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
