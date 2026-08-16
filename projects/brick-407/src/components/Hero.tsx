export default function Hero() {
  // hero frame local (0, 0, 1280x795)
  // Pattern (−80, 0, 1440x795)
  // Subtitle (347, 248, 586x33) fs=28 fw=700 lh=33.414 black center
  // BRICK wordmark "d" frame (349, 301, 583x192)
  // Build Your Vision (450, 501, 380x30) fs=25 fw=700 lh=29.834
  // 3D bricks cluster Group 55 (−46, −3, 1372x764)
  return (
    <section
      className="absolute left-0 top-0 overflow-hidden"
      style={{ width: 1280, height: 795 }}
    >
      <img
        src="/assets/hero-pattern.png"
        alt=""
        className="absolute"
        style={{ left: -80, top: 0, width: 1440, height: 795 }}
        draggable={false}
      />
      <img
        src="/assets/hero-bricks.png"
        alt=""
        className="absolute"
        style={{ left: -46, top: -3, width: 1372, height: 764 }}
        draggable={false}
      />
      <div
        className="absolute text-center whitespace-nowrap"
        style={{
          left: 347,
          top: 248,
          width: 586,
          fontSize: 28,
          fontWeight: 700,
          lineHeight: '33.414px',
          color: '#000000',
        }}
      >
        당신의 아이디어를 벽돌처럼 쌓아 올리는 IT 개발 파트너.
      </div>
      <img
        src="/assets/brick-logo.svg"
        alt="BRICK"
        className="absolute"
        style={{ left: 349, top: 301, width: 583, height: 192 }}
        draggable={false}
      />
      <div
        className="absolute text-center whitespace-nowrap"
        style={{
          left: 450,
          top: 501,
          width: 380,
          fontSize: 25,
          fontWeight: 700,
          lineHeight: '29.834px',
          color: '#000000',
        }}
      >
        Build Your Vision, Brick by Brick.
      </div>
    </section>
  )
}
