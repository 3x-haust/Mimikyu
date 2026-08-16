const CARDS = [
  { left: -142, img: '/assets/case-0.png' },
  { left: 257, img: '/assets/case-1.png' },
  { left: 656, img: '/assets/case-2.png' },
  { left: 1055, img: '/assets/case-3.png' },
]

export default function Cases() {
  // Section (0, 4185, 1280x857) fill=#ffffff
  // Eyebrow (572, 4285) fs=24 fw=700 lh=24 #ff543c → local (572, 100)
  // Heading (267, 4337) fs=36 fw=600 lh=24 #2d3648 → local (267, 152)
  // Cards (-142, 257, 656, 1055) y=4423 local=238 w=367 h=519
  return (
    <section
      className="absolute left-0 bg-white overflow-hidden"
      style={{ top: 4185, width: 1280, height: 857 }}
    >
      <div
        className="absolute font-bold whitespace-nowrap"
        style={{
          left: 572,
          top: 100,
          fontSize: 24,
          fontWeight: 700,
          lineHeight: '24px',
          color: '#ff543c',
        }}
      >
        함께 쌓은 브릭
      </div>
      <h2
        className="absolute font-semibold whitespace-nowrap"
        style={{
          left: 267,
          top: 152,
          fontSize: 36,
          fontWeight: 600,
          lineHeight: '24px',
          color: '#2d3648',
        }}
      >
        BRICK이 차곡차곡 쌓아 온 성공 사례들을 만나보세요
      </h2>
      {CARDS.map((c, i) => (
        <img
          key={i}
          src={c.img}
          alt=""
          className="absolute"
          style={{ left: c.left, top: 238, width: 367, height: 519 }}
          draggable={false}
        />
      ))}
    </section>
  )
}
