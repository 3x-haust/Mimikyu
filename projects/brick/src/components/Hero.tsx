export default function Hero() {
  return (
    <section className="relative w-[1259px] h-[766px]">
      {/* Background */}
      <div className="absolute inset-0 w-[1259px] h-[766px] bg-[#FFFFFF] rounded-[20px] overflow-hidden">
        <img
          src="/assets/noisy-gradients-rendered.png"
          className="absolute inset-0 w-[1259px] h-[766px] rounded-[20px]"
          alt=""
        />
      </div>

      {/* Badge */}
      <div
        className="absolute left-[64px] top-[122px] flex flex-row justify-center items-center gap-[8px] bg-[#FFFFFF] border border-[#E7E3F4] rounded-[25px]"
        style={{ padding: '12px 16px', height: '35px' }}
      >
        <span className="font-[Inter] font-medium text-[16px] leading-[1.45em] tracking-[-0.005em] text-[#0D0D0D]">
          모듈형 IT 아웃소싱 플랫폼
        </span>
      </div>

      {/* Title */}
      <h1 className="absolute left-[64px] top-[169px] w-[544px] h-[212px] font-[Pretendard] font-extrabold text-[96px] leading-[1.1em] tracking-[-0.005em] text-[#000000]">
        모든 기획을,{'\n'}완벽하게 조립.
      </h1>

      {/* Subtitle */}
      <p className="absolute left-[64px] top-[402px] w-[469px] h-[60px] font-[Pretendard] font-medium text-[24px] leading-[1.25em] tracking-[-0.005em] text-[#666666]">
        하이엔드 프로젝트 매칭의 새로운 기준.{'\n'}정교하게 설계된 모듈로 당신의 비전을 완성하세요.
      </p>

      {/* Buttons */}
      <div className="absolute left-[64px] top-[513px] flex flex-row items-center gap-[10px]">
        <button className="flex flex-row justify-center items-center gap-[8px] w-[260px] h-[64px] bg-[#000000] rounded-[35px]" style={{ padding: '12px 32px' }}>
          <span className="font-[Inter] font-medium text-[22px] leading-[1.45em] tracking-[-0.005em] text-[#FFFFFF]">
            프로젝트 시작하기
          </span>
          <div className="w-[24px] h-[24px] relative">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute left-[5px] top-[5px]">
              <path d="M7 1L13 7M13 7L7 13M13 7H1" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" transform="rotate(45, 7, 7)" />
            </svg>
          </div>
        </button>
        <button className="flex flex-row justify-center items-center gap-[8px] w-[185px] h-[64px] bg-[#FFFFFF] rounded-[35px]" style={{ padding: '12px 32px' }}>
          <span className="font-[Inter] font-medium text-[22px] leading-[1.45em] tracking-[-0.005em] text-[#000000]">
            파트너스 찾기
          </span>
        </button>
      </div>

      {/* 3D Image */}
      <img
        src="/assets/hero-3d-rendered.png"
        className="absolute left-[644px] top-[178px] w-[555px] h-[379px]"
        alt=""
      />
    </section>
  );
}
