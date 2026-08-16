export default function Navbar() {
  // Frame "네부바_로그인 전" at local (10, 12, 1259x79) fill=#ffffff/0.5 r=20
  // BRICK Logo 1 at (59, 32, 133x40)
  // Nav links at y=39 fs=18 fw=500 #666666
  // Login pill (1005, 28, 76x47) #ffffff r=25; "로그인" (1021, 40) fs=16 fw=500 #000000
  // CTA  pill (1091, 28, 129x47) #ff543c r=25; "무료 견적 받기" (1107, 40) fs=16 fw=500 #ffffff
  return (
    <header className="absolute left-[10px] top-[12px] w-[1259px] h-[79px] bg-white/50 rounded-[20px]">
      <img
        src="/assets/brick-logo.svg"
        alt="BRICK"
        className="absolute left-[59px] top-[32px] w-[133px] h-[40px]"
        draggable={false}
      />
      <a
        className="absolute left-[367px] top-[39px] text-[18px] font-medium text-[#666666] whitespace-nowrap"
        style={{ lineHeight: '26px' }}
      >
        기능 마켓
      </a>
      <a
        className="absolute left-[456px] top-[39px] text-[18px] font-medium text-[#666666] whitespace-nowrap"
        style={{ lineHeight: '26px' }}
      >
        제작 의뢰
      </a>
      <a
        className="absolute left-[545px] top-[39px] text-[18px] font-medium text-[#666666] whitespace-nowrap"
        style={{ lineHeight: '26px' }}
      >
        포트폴리오
      </a>
      <a
        className="absolute left-[645px] top-[39px] text-[18px] font-medium text-[#666666] whitespace-nowrap"
        style={{ lineHeight: '26px' }}
      >
        파트너 지원
      </a>
      <a
        className="absolute left-[749px] top-[39px] text-[18px] font-medium text-[#666666] whitespace-nowrap"
        style={{ lineHeight: '26px' }}
      >
        이용 가이드
      </a>
      <div className="absolute left-[1005px] top-[28px] w-[76px] h-[47px] bg-white rounded-[25px] flex items-center justify-center">
        <span
          className="text-[16px] font-medium text-black whitespace-nowrap"
          style={{ lineHeight: '23.2px' }}
        >
          로그인
        </span>
      </div>
      <div className="absolute left-[1091px] top-[28px] w-[129px] h-[47px] bg-[#ff543c] rounded-[25px] flex items-center justify-center">
        <span
          className="text-[16px] font-medium text-white whitespace-nowrap"
          style={{ lineHeight: '23.2px' }}
        >
          무료 견적 받기
        </span>
      </div>
    </header>
  )
}
