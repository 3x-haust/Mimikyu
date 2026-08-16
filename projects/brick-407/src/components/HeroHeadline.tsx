export default function HeroHeadline() {
  // Section "Frame" at local (0, 795, 1280x900) fill=#ffffff
  // Heading (80, 1090, 544x158) fs=66 fw=700 lh=79.2 #2b2b2b  "내 아이디어를\n브릭처럼 쌓다"
  // Description (80, 1266, 438x49) fs=20 fw=600 lh=24 #808080
  // Btn1 (80, 1347, 201x54) r=20 #ff543c; text (96, 1362) fs=20 fw=700 #fcfcfc
  // Btn2 (291, 1347, 124x54) r=20 #fcfcfc; text (307, 1362) fs=20 fw=700 #2b2b2b
  // Image (656, 895, 544x700) r=20
  return (
    <section
      className="absolute left-0 bg-white"
      style={{ top: 795, width: 1280, height: 900 }}
    >
      <img
        src="/assets/hero-right.png"
        alt=""
        className="absolute rounded-[20px]"
        style={{ left: 656, top: 100, width: 544, height: 700 }}
        draggable={false}
      />
      <h1
        className="absolute font-bold whitespace-pre"
        style={{
          left: 80,
          top: 295,
          width: 544,
          fontSize: 66,
          fontWeight: 700,
          lineHeight: '79.2px',
          color: '#2b2b2b',
        }}
      >
        내 아이디어를{'\n'}브릭처럼 쌓다
      </h1>
      <p
        className="absolute font-semibold whitespace-pre"
        style={{
          left: 80,
          top: 471,
          width: 438,
          fontSize: 20,
          fontWeight: 600,
          lineHeight: '24px',
          color: '#808080',
        }}
      >
        필요한 개발 기능을 선택하고 실시간 견적을 받아보세요.{'\n'}외주 프로젝트 기획·진행·관리까지 한 곳에서 해결합니다.
      </p>
      <div
        className="absolute rounded-[20px] bg-[#ff543c] flex items-center"
        style={{ left: 80, top: 552, width: 201, height: 54 }}
      >
        <span
          className="absolute font-bold whitespace-nowrap"
          style={{
            left: 16,
            top: 15,
            fontSize: 20,
            fontWeight: 700,
            lineHeight: '24px',
            color: '#fcfcfc',
          }}
        >
          프로젝트 시작하기
        </span>
      </div>
      <div
        className="absolute rounded-[20px] bg-[#fcfcfc] flex items-center"
        style={{ left: 291, top: 552, width: 124, height: 54 }}
      >
        <span
          className="absolute font-bold whitespace-nowrap"
          style={{
            left: 16,
            top: 15,
            fontSize: 20,
            fontWeight: 700,
            lineHeight: '24px',
            color: '#2b2b2b',
          }}
        >
          서비스 소개
        </span>
      </div>
    </section>
  )
}
