export default function Header() {
  return (
    <section className="relative w-[1259px] h-[79px] bg-[#FFFFFF] rounded-[20px]" style={{ padding: '16px 58px 16px 49px' }}>
      <div className="flex flex-row items-center gap-[142px]">
        {/* Logo + Name */}
        <div className="flex flex-row items-center gap-[8px]">
          <img src="/assets/logo.png" className="w-[40px] h-[40px]" alt="Logo" />
          <span className="font-[Pretendard] font-semibold text-[24px] leading-[1.45em] tracking-[-0.02em] text-[#000000]">
            Namedly
          </span>
        </div>

        {/* Nav Links */}
        <div className="flex flex-row items-center gap-[22px]">
          <span className="font-[Pretendard] font-bold text-[18px] leading-[1.45em] tracking-[-0.005em] text-[#666666]">
            프로젝트 등록
          </span>
          <span className="font-[Pretendard] font-medium text-[18px] leading-[1.45em] tracking-[-0.005em] text-[#666666]">
            프로젝트 찾기
          </span>
          <span className="font-[Pretendard] font-medium text-[18px] leading-[1.45em] tracking-[-0.005em] text-[#666666]">
            파트너스 찾기
          </span>
          <span className="font-[Pretendard] font-medium text-[18px] leading-[1.45em] tracking-[-0.005em] text-[#666666]">
            이용방법
          </span>
          <span className="font-[Pretendard] font-medium text-[18px] leading-[1.45em] tracking-[-0.005em] text-[#666666]">
            포트폴리오
          </span>
        </div>

        {/* Buttons */}
        <div className="flex flex-row items-center gap-[10px]">
          <button className="flex flex-row justify-center items-center gap-[8px] bg-[#FFFFFF] border border-[#F5F5F5] rounded-[25px]" style={{ padding: '12px 16px' }}>
            <span className="font-[Inter] font-medium text-[16px] leading-[1.45em] tracking-[-0.005em] text-[#000000]">
              로그인
            </span>
          </button>
          <button className="flex flex-row justify-center items-center gap-[8px] bg-[#000000] rounded-[25px]" style={{ padding: '12px 16px' }}>
            <span className="font-[Inter] font-medium text-[16px] leading-[1.45em] tracking-[-0.005em] text-[#FFFFFF]">
              무료 견적 받기
            </span>
          </button>
        </div>
      </div>
    </section>
  );
}
