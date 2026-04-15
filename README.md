<p align="center">
  <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/778.png" alt="Mimikyu" width="200" />
</p>

<h1 align="center">Mimikyu (따라큐)</h1>

<p align="center">
  Figma 디자인을 픽셀 퍼펙트하게 따라하는 Claude Code 스킬
</p>

<p align="center">
  <a href="#-설치">설치</a> · <a href="#-사용법">사용법</a> · <a href="#-어떻게-동작하나요">동작 원리</a> · <a href="#-비교-옵션">옵션</a>
</p>

---

## 왜 만들었나요?

작년부터 수없이 많은 시도를 해봤습니다.
Figma 자체에서 주는 코드, Anima, Locofy 같은 플러그인, Cursor, Copilot, Claude Code까지.

**하지만 단 한 번도, 디자이너의 디자인을 "그대로" 복제하지 못했습니다.**

결국 AI에게 매번 이런 피드백을 반복하게 됩니다:

> "컬러랑 아이콘이 다르잖아 왜이런거야?"
>
> "하...... 걍 비교할 수 있게 원본 디자인과 현재 모습 캡처 줄게 확인해봐"
>
> "아니 원본 디자인과 다르잖아!! 안보여??? 그냥 딱봐도 다르잖아"

**이제 클로드한테 화 안 내도 됩니다.** 그게 따라큐를 만든 이유입니다.

Figma URL을 주면 디자인 데이터를 자동으로 읽어오고, React + Tailwind CSS 코드를 생성한 뒤,
실제 렌더링 결과를 원본 디자인과 **픽셀 단위로 비교**합니다.
차이가 있으면? 히트맵으로 "여기가 다르다"고 정확히 알려주고, 수정하고, 다시 비교합니다.

사람 눈으로 판단하지 않습니다. "딱 봐도 다른" 일이 없도록,
**overall 99%+, 모든 영역 각각 99%+를 달성할 때까지** 기계적으로 반복합니다.

> 이름의 유래: 포켓몬 따라큐(Mimikyu)처럼, 원본을 완벽하게 따라하려고 합니다.

---

## 🚀 설치

### Claude Code 스킬로 설치하기 (권장)

```bash
claude skill install github:3x-haust/Mimikyu
```

직접 클론하고 싶다면:

```bash
git clone https://github.com/3x-haust/Mimikyu.git ~/.claude/commands/mimikyu
```

### 필요한 것들

- [Claude Code](https://claude.ai/code) (MCP 지원 필요)
- Node.js 20+, pnpm
- Python 3 + Pillow
- Playwright

> 걱정 마세요! `/mimikyu` 스킬로 실행하면 **pnpm, Pillow, Playwright 전부 자동으로 설치**됩니다.
> 수동으로 하나하나 설치할 필요 없습니다.

<details>
<summary>그래도 직접 설치하고 싶다면</summary>

```bash
pnpm install
pip3 install Pillow
npx playwright install chromium
```

</details>

### Figma MCP 설정

Figma 데이터를 가져오려면 MCP 서버 설정이 필요합니다.
프로젝트 루트에 `.mcp.json` 파일을 만들어주세요 (`.mcp.example.json`을 복사해서 토큰만 바꾸면 됩니다):

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

### `/mimikyu` 스킬로 실행하기 (권장)

Claude Code에서 Figma URL과 프로젝트 이름만 넘겨주세요.
데이터 추출, 의존성 설치, 코드 생성, 픽셀 검증까지 전부 알아서 합니다:

```
# 기본 — projects/MyProject/ 에 생성됩니다
/mimikyu https://www.figma.com/design/FILE_KEY/Title?node-id=1-46 MyProject

# 원하는 경로에 생성하고 싶다면
/mimikyu https://www.figma.com/design/FILE_KEY/Title?node-id=1-46 MyProject ~/Desktop/my-app
```

### 수동으로 비교 루프 돌리기

이미 프로젝트가 있다면 직접 실행할 수도 있습니다:

```bash
cd projects/<name>

# 디자인 이미지와 비교 (서버 시작 → 스크린샷 → 비교 → 결과)
pnpm mimikyu designs/desktop.png

# 옵션도 넣을 수 있어요
pnpm mimikyu designs/desktop.png --threshold 20 --bg-only --side-by-side

# 지금까지 몇 번 반복했는지 히스토리 확인
pnpm mimikyu --history
```

### 스크립트 개별 실행

스크린샷이나 비교만 따로 하고 싶을 때:

```bash
# 스크린샷만 찍기
PORT=3334 npx tsx ../../scripts/screenshot.ts screenshots/v1.png 1280 720

# 비교만 하기
python3 ../../scripts/compare.py designs/desktop.png screenshots/v1.png \
  --regions --iteration 1 --side-by-side
```

---

## 🔍 어떻게 동작하나요?

```
Figma Design → MCP 데이터 추출 → React 코드 생성 → 스크린샷 캡처 → 픽셀 비교 → 수정 반복
```

1. **Figma MCP**로 디자인의 레이아웃, 색상, 폰트, 좌표 데이터를 가져오고, `designs/figma-data.json`에 저장합니다
2. 저장된 Figma 데이터를 기반으로 `absoluteBoundingBox` 좌표 그대로 **absolute positioning** 코드를 생성합니다 (반올림 없이 Figma 값 그대로!)
3. **Playwright**로 실제 브라우저에서 렌더링된 결과를 스크린샷으로 찍습니다
4. **PIL**로 원본 디자인과 스크린샷을 RGB 픽셀 단위로 비교하고, 차이가 나는 부분을 빨간 히트맵으로 보여줍니다
5. `figma-data.json`에서 원본 수치를 다시 확인하고 코드를 수정한 뒤, 3→4를 반복합니다

Figma MCP는 처음 한 번만 호출하고, 이후 수정 루프에서는 저장된 데이터를 참조합니다.
사람 눈으로 "이 정도면 됐다"고 판단하지 않습니다.
**overall 99%+, 모든 region 각각 99%+를 달성할 때까지** 기계적으로 반복합니다.

---

## 🎛️ 비교 옵션

| 옵션 | 설명 |
|------|------|
| `--regions` | 이미지를 3x3 그리드로 나눠서 영역별로 분석합니다 |
| `--custom-regions FILE` | JSON 파일로 원하는 영역을 직접 정의할 수 있습니다 |
| `--threshold N` | 일치 판정 기준값입니다 (기본 30, 낮을수록 엄격) |
| `--bg-only` | 텍스트를 무시하고 배경/레이아웃만 비교합니다 |
| `--side-by-side` | 원본 \| 스크린샷 \| 히트맵을 나란히 보여줍니다 |
| `--iteration N` | 반복 번호를 지정하고 history.json에 기록합니다 |

---

## 📊 점수는 어떻게 읽나요?

각 픽셀의 R, G, B 채널 차이를 계산해서, 모든 채널의 최대 차이가 threshold 이하이면 "일치"로 판정합니다.

| 점수 | 의미 | 다음 단계 |
|------|------|-----------|
| **99%+** | 거의 완벽합니다! 남은 차이는 폰트 안티앨리어싱 정도예요 | 완료 |
| **85-95%** | 조금만 더 다듬으면 됩니다 | padding, color, border-radius 확인 |
| **85% 미만** | 구조적으로 다른 부분이 있어요 | 레이아웃과 좌표를 다시 확인해주세요 |

**완료 조건**: `overall_match` ≥ 99% 이면서 3x3 그리드의 **모든 region이 각각 99% 이상**이어야 합니다. 하나의 영역이라도 99% 미만이면 해당 영역을 집중적으로 수정합니다.

---

## 📁 프로젝트 구조

```
Mimikyu/
├── scripts/
│   ├── mimikyu.ts       # 전체 루프를 관리하는 오케스트레이터
│   ├── screenshot.ts    # Playwright 스크린샷 캡처
│   └── compare.py       # PIL 픽셀 비교 + 히트맵 생성
├── projects/            # 프로젝트별 독립 디렉토리
│   └── <project>/
│       ├── designs/     # Figma에서 export한 원본 이미지
│       ├── screenshots/ # Playwright가 찍은 스크린샷
│       ├── diffs/       # 히트맵, 오버레이, history.json
│       ├── public/assets/  # Figma에서 다운로드한 이미지 에셋
│       └── src/         # React 컴포넌트 코드
└── CLAUDE.md
```

## 기술 스택

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Vite
- **Screenshot**: Playwright (headless Chromium)
- **Comparison**: Python PIL/Pillow
- **Figma Integration**: Framelink MCP, Official Figma MCP

## License

MIT
