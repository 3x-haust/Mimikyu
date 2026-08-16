export default function HelloBar() {
  // Hello Bar (0, 5798, 1280x67) — no own bg fill in data (transparent over #ebebeb)
  // Title (135, 5818) fs=22 fw=700 lh=26.625 fill=#ffffff
  // Primary button (939, 5808, 206x47) fill=#ff543c r=25
  //   Text "무료로 견적 조립 시작하기" (955, 5820) fs=16 fw=500 lh=23.2 #ffffff
  // White title on transparent/gray bg wouldn't render — data implies dark bar, so use #2d3648
  return (
    <section
      className="absolute left-0"
      style={{ top: 5798, width: 1280, height: 67, background: '#2d3648' }}
    >
      <div
        className="absolute whitespace-nowrap font-bold"
        style={{
          left: 135,
          top: 20,
          fontSize: 22,
          fontWeight: 700,
          lineHeight: '26.625px',
          color: '#ffffff',
        }}
      >
        아이디어만 있으면 충분해요. 완공은 BRICK에게 맡기세요.
      </div>
      <div
        className="absolute flex items-center justify-center"
        style={{ left: 939, top: 10, width: 206, height: 47, background: '#ff543c', borderRadius: 25 }}
      >
        <span
          className="whitespace-nowrap font-medium"
          style={{
            fontSize: 16,
            fontWeight: 500,
            lineHeight: '23.2px',
            color: '#ffffff',
          }}
        >
          무료로 견적 조립 시작하기
        </span>
      </div>
    </section>
  )
}
