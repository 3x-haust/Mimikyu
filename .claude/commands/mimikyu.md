# Mimikyu (따라큐) - Figma Pixel Perfect Publisher

Figma 디자인 URL을 받아 픽셀 퍼펙트하게 React + Tailwind CSS로 재현합니다.

## 입력
- $ARGUMENTS: Figma URL, 프로젝트명, [출력 경로] (예: "https://www.figma.com/design/xxx/Title?node-id=1-46 MyProject ~/Desktop/my-app")
- Figma URL에서 FILE_KEY와 NODE_ID를 파싱
- 출력 경로 미지정 시 기본값: `projects/<project-name>/`

## 워크플로우

### 1. Figma 데이터 추출 및 저장
- `mcp__framelink-figma__get_figma_data`로 디자인 구조 + 스타일 데이터 가져오기
- `mcp__framelink-figma__download_figma_images`로 이미지 에셋 다운로드
- `mcp__figma__view_node`로 시각 확인
- Fallback: `curl -H "X-Figma-Token: $FIGMA_ACCESS_TOKEN"` 사용
- **추출한 Figma 데이터를 `designs/figma-data.json`에 저장한다** — MCP에서 받은 원본 JSON을 그대로 저장
- 이후 검증 루프에서 MCP를 다시 호출하지 않고 이 파일을 참조하여 수정한다

### 2. 디자인 분석
- `designs/figma-data.json`을 읽어서 분석한다
- absoluteBoundingBox에서 각 요소의 정확한 x, y, width, height 추출
- fills → 배경색/그라디언트, style → 폰트, cornerRadius → border-radius
- 부모 프레임 기준 상대 좌표 계산: `left = child.x - parent.x`
- 섹션 간 간격 계산: `gap = sectionB.y - (sectionA.y + sectionA.height)`
- lineHeightPx 값을 CSS leading-[Xpx]로 직접 변환

### 3. 프로젝트 셋업
- 출력 경로가 지정되면 해당 경로에, 미지정 시 `projects/<project-name>/`에 독립 Vite+React+Tailwind 프로젝트 생성
- 포트는 3334, 3335 등 겹치지 않게 설정
- 한글 폰트 CDN 추가 (Pretendard 등)

### 3.5. 의존성 자동 설치
프로젝트 셋업 후 필요한 모든 의존성을 자동으로 설치한다:
```bash
# Node 의존성
pnpm install

# Playwright (스크린샷 캡처용)
npx playwright install chromium

# Python Pillow (픽셀 비교용) — 미설치 시 자동 설치
pip3 install Pillow 2>/dev/null || pip install Pillow
```
- 각 도구가 이미 설치되어 있으면 스킵한다
- 설치 실패 시 사용자에게 안내하고 계속 진행

### 4. 코드 생성
- Figma 절대 좌표 기반 absolute positioning으로 컴포넌트 작성
- 모든 수치는 Figma 원본 그대로 — 반올림 금지
- 색상은 hex 그대로: `bg-[#1E1E2E]`, `text-[#666666]`
- fills=0인 빈 사각형(이미지 없음)은 렌더링하지 않음
- SVG 아이콘은 인라인 컴포넌트로
- **텍스트 요소에는 반드시 `whitespace-nowrap` 적용** — 텍스트가 width 부족으로 줄바꿈되면 레이아웃이 깨짐. Figma에서 한 줄로 표시되는 텍스트는 코드에서도 반드시 한 줄이어야 한다
- 텍스트 컨테이너의 width는 Figma의 boundingBox width 이상으로 설정하여 텍스트가 넘치지 않게 한다

### 5. 이미지 사용 원칙
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

### 6. Figma 노드를 PNG로 export → designs/ 폴더에 저장
```
curl -s -H "X-Figma-Token: $TOKEN" \
  "https://api.figma.com/v1/images/<FILE_KEY>?ids=<NODE_ID>&format=png&scale=1"
```

### 7. 픽셀 비교 검증 루프
```bash
# dev server 시작
cd projects/<name> && pnpm dev &

# 스크린샷 캡처
PORT=<port> npx tsx ../../scripts/screenshot.ts screenshots/v1.png <width> <height>

# 픽셀 비교
python3 ../../scripts/compare.py designs/desktop.png screenshots/v1.png \
  --regions --iteration 1
```

### 8. 수정 → 재검증 반복
1. 히트맵에서 빨간 영역 확인 (빨강 = 위치 + 색상 불일치)
2. `designs/figma-data.json`에서 해당 영역의 원본 좌표/스타일/색상을 다시 확인하고 코드 수정
3. 스크린샷 재캡처 → 비교
4. **overall_match 99%+ AND 모든 region 각각 99%+ 달성할 때까지 반복**

### 8.5. 색상 불일치 집중 수정 (95%+ 이후 정체 시)
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

## 완료 조건 — 반드시 준수

**아래 조건을 모두 만족하기 전에는 절대 작업을 종료하지 않는다:**

- `overall_match` ≥ 99%
- `regions`의 **모든 9개 영역**(top-left, top-center, top-right, mid-left, mid-center, mid-right, bot-left, bot-center, bot-right) **각각** ≥ 99%

**위반 시 행동:**
- 하나의 region이라도 99% 미만이면 → 해당 영역의 좌표를 계산하여 집중 수정
- 3회 연속 점수가 오르지 않으면 → 8.5 색상 불일치 집중 수정 단계를 반드시 실행
- "더 이상 개선이 어렵다", "충분히 좋다" 등의 판단 금지 — **수치가 조건을 만족할 때만 종료**

## 비교 결과 해석
| 점수 | 상태 | 조치 |
|------|------|------|
| 99%+ | 완벽 (폰트 안티앨리어싱 차이 수준) | 완료 |
| 85-95% | 미세 조정 필요 | 폰트, 색상, 간격 확인 |
| 85% 미만 | 구조적 차이 | 레이아웃 + 좌표 재검토 |

## 중요 원칙
1. **"거의 완벽"이라고 스스로 판단하지 말 것** — PIL diff만 신뢰
2. **히트맵이 검어질 때까지** 반복 수정
3. 색상은 Figma fills/strokes의 hex 값 그대로 — 근사치 금지
4. Figma lineHeightPx → CSS leading-[Xpx] 직접 변환
5. fills=0인 노드는 빈 사각형 → 이미지 렌더링 하지 않음
6. **이미지는 로고, 3D 오브젝트, 사진 등 코드로 재현 불가한 에셋에만 사용**
7. **텍스트, 버튼, 레이아웃, 섹션 등은 반드시 React + Tailwind 코드로 구현**
