export default function CTA() {
  return (
    <section className="relative w-[1259px] h-[597px]">
      <div className="absolute inset-0 w-[1259px] h-[597px] bg-[#FFFFFF] rounded-[20px]" />

      {/* Title - bbox 614x140, 2 lines of 64px → leading 70px */}
      <h2 className="absolute left-[322px] top-[118px] w-[614px] h-[140px] font-[Pretendard] font-extrabold text-[64px] leading-[70px] tracking-[-0.005em] text-[#000000] text-center whitespace-pre-line">
        {"가장 견고한 프로젝트를\n시작할 준비가\u00A0되셨나요?"}
      </h2>

      {/* Subtitle - bbox 650x64, 2 lines of 24px → leading 32px */}
      <p className="absolute left-[304px] top-[305px] w-[650px] h-[64px] font-[Pretendard] font-medium text-[24px] leading-[32px] tracking-[-0.005em] text-[#666666] text-center whitespace-pre-line">
        {"이미 수많은 기업들이 BRICK을 통해 최고의 엔지니어링 팀을 구성하고\n혁신적인 제품을 만들고 있습니다."}
      </p>

      {/* Buttons */}
      <div className="absolute left-[364px] top-[416px] flex flex-row items-center gap-[10px]">
        <button className="flex flex-row justify-center items-center gap-[8px] w-[260px] h-[64px] bg-[#000000] rounded-[35px]" style={{ padding: '12px 32px' }}>
          <span className="font-[Inter] font-medium text-[22px] leading-[1.45em] tracking-[-0.005em] text-[#FFFFFF] whitespace-nowrap">
            무료 견적 받기
          </span>
        </button>
        <button className="flex flex-row justify-center items-center gap-[8px] w-[260px] h-[64px] bg-[#EBEBEB] rounded-[35px]" style={{ padding: '12px 32px' }}>
          <span className="font-[Inter] font-medium text-[22px] leading-[1.45em] tracking-[-0.005em] text-[#000000] whitespace-nowrap">
            상담 신청하기
          </span>
        </button>
      </div>
    </section>
  );
}
