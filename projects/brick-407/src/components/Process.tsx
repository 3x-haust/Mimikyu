type Row = {
  img: string
  badgeOffsetX: number
  badge: string
  title: string
  body: string
}

// Row 1 y=2165, Row 2 y=2603, Row 3 y=3041 (delta=438)
// All relative to section top (y=1927): local y = 238, 676, 1114
const ROWS: Row[] = [
  {
    img: '/assets/process-row-1.png',
    badgeOffsetX: 43, // 165-122
    badge: '프로젝트 등록',
    title: '기획의 시작,\n정교한 로드맵 구축',
    body: '프로젝트 내용만 써도 brick이 적합한 규모와\n방향을 빠르게 제안해 드려요.',
  },
  {
    img: '/assets/process-row-2.png',
    badgeOffsetX: 58, // 180-122
    badge: '전문가 연결',
    title: '검증된 파트너,\n최적의 팀 매칭',
    body: '나에게 잘 맞는 디자이너·개발자를 만나보세요.\n포트폴리오를 비교하고,\nbrick이 추천하는 전문가도 확인할 수 있어요.',
  },
  {
    img: '/assets/process-row-3.png',
    badgeOffsetX: 72, // 194-122
    badge: '프로젝트 완성',
    title: '완성도 높은 런칭,\n투명한 사후 관리',
    body: '계약부터 마무리까지 편하게 진행하세요.\n진행 상황을 투명하게 공유받으며 좋은 결과물을 받아보세요.\n필요할 때 언제든 brick이 함께할게요.',
  },
]

const STEP_LABELS = [
  { x: 692, text: '프로젝트 등록' },
  { x: 864, text: '전문가 연결' },
  { x: 1022, text: '프로젝트 완성' },
]

export default function Process() {
  // Section (0, 1927, 1280x1602) fill=#ffffff
  // Eyebrow (586, 2027) fs=24 fw=700 lh=24 #ff543c  local(586, 100)
  // Heading (179, 2079) fs=36 fw=600 lh=24 #2d3648  local(179, 152)
  return (
    <section
      className="absolute left-0 bg-white"
      style={{ top: 1927, width: 1280, height: 1602 }}
    >
      <div
        className="absolute font-bold whitespace-nowrap"
        style={{
          left: 586,
          top: 100,
          fontSize: 24,
          fontWeight: 700,
          lineHeight: '24px',
          color: '#ff543c',
        }}
      >
        이용 프로세스
      </div>
      <h2
        className="absolute font-semibold whitespace-nowrap"
        style={{
          left: 179,
          top: 152,
          fontSize: 36,
          fontWeight: 600,
          lineHeight: '24px',
          color: '#2d3648',
        }}
      >
        디자인부터 개발까지, brick과 함께라면 프로젝트가 훨씬 수월해요
      </h2>
      {ROWS.map((row, i) => {
        const rowTop = 238 + i * 438 // local top of this row (first at y=2165 → 238)
        return (
          <div key={i} className="absolute left-0" style={{ top: rowTop, width: 1280, height: 379 }}>
            <img
              src={row.img}
              alt=""
              className="absolute rounded-[20px]"
              style={{ left: 122, top: 0, width: 487, height: 368 }}
              draggable={false}
            />
            <div
              className="absolute font-bold whitespace-nowrap"
              style={{
                left: 122 + row.badgeOffsetX,
                top: 89,
                fontSize: 20,
                fontWeight: 700,
                lineHeight: '24px',
                color: '#ff543c',
              }}
            >
              {row.badge}
            </div>
            <h3
              className="absolute font-bold whitespace-pre"
              style={{
                left: 122,
                top: 141,
                fontSize: 40,
                fontWeight: 700,
                lineHeight: '48px',
                color: '#2b2b2b',
              }}
            >
              {row.title}
            </h3>
            <p
              className="absolute font-semibold whitespace-pre"
              style={{
                left: 122,
                top: 259,
                fontSize: 20,
                fontWeight: 600,
                lineHeight: '24px',
                color: '#808080',
              }}
            >
              {row.body}
            </p>
            {STEP_LABELS.map((step, si) => (
              <div
                key={si}
                className="absolute font-semibold whitespace-nowrap"
                style={{
                  left: step.x,
                  top: 344,
                  fontSize: 16,
                  fontWeight: 600,
                  lineHeight: '24px',
                  color: si === i ? '#ff543c' : '#808080',
                }}
              >
                {step.text}
              </div>
            ))}
          </div>
        )
      })}
    </section>
  )
}
