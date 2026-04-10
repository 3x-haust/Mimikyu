# Mimikyu (따라큐) - Figma Pixel Perfect Publisher

Figma 디자인 URL을 받아 픽셀 퍼펙트하게 React + Tailwind CSS로 재현합니다.

## 입력
- $ARGUMENTS: Figma URL, 프로젝트명, [출력 경로] (예: "https://www.figma.com/design/xxx/Title?node-id=1-46 MyProject ~/Desktop/my-app")
- Figma URL에서 FILE_KEY와 NODE_ID를 파싱
- 출력 경로 미지정 시 기본값: `projects/<project-name>/`

## 워크플로우

### 1. Figma 데이터 추출
- `mcp__framelink-figma__get_figma_data`로 디자인 구조 + 스타일 데이터 가져오기
- `mcp__framelink-figma__download_figma_images`로 이미지 에셋 다운로드
- `mcp__figma__view_node`로 시각 확인
- Fallback: `curl -H "X-Figma-Token: $FIGMA_ACCESS_TOKEN"` 사용

### 2. 디자인 분석
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
2. 해당 컴포넌트의 좌표/스타일/색상 수정
3. 스크린샷 재캡처 → 비교
4. **95% 이상 달성할 때까지 반복** (폰트 렌더링 차이로 99.9%는 코드만으로 불가)

## 비교 결과 해석
| 점수 | 상태 | 조치 |
|------|------|------|
| 95%+ | 완벽 (폰트 안티앨리어싱 차이 수준) | 완료 |
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
