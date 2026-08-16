const LOGO_X = [-89, 123, 335, 547, 759, 971, 1183] // 7 placeholder logos at y=1812 (local 117)

export default function Intro() {
  // Frame at (0, 1695, 1280x232) fill=#ffffff
  // Description " 대한민국 IT 프로젝트의 새로운 기준" (496, 1750, 397x30)
  //   fs=28 fw=600 lh=24 fill=#2d3648
  // Company logos row Frame 2 at (-89, 1812, 1458x60) — 7 placeholders 186x60 spaced 212px apart
  return (
    <section
      className="absolute left-0 bg-white overflow-hidden"
      style={{ top: 1695, width: 1280, height: 232 }}
    >
      <div
        className="absolute font-semibold whitespace-nowrap"
        style={{
          left: 496,
          top: 55,
          fontSize: 28,
          fontWeight: 600,
          lineHeight: '24px',
          color: '#2d3648',
        }}
      >
        {' '}대한민국 IT 프로젝트의 새로운 기준
      </div>
      {LOGO_X.map((x, i) => (
        <div
          key={i}
          className="absolute flex items-center justify-center"
          style={{ left: x, top: 117, width: 186, height: 60 }}
        >
          <div
            style={{
              width: 166,
              height: 40,
              background: '#808080',
              borderRadius: 4,
              opacity: 0.5,
            }}
          />
        </div>
      ))}
    </section>
  )
}
