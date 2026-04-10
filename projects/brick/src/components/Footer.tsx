export default function Footer() {
  return (
    <section className="relative w-[1259px] h-[597px]">
      <div className="absolute inset-0 w-[1259px] h-[597px] bg-[#FFFFFF] rounded-[20px]" />

      {/* Footer content */}
      <div className="absolute left-[30px] top-[522px] w-[1200px] flex flex-col gap-[28px]">
        {/* Divider */}
        <div className="w-full h-0 border-t border-[#DEDEDE]" />
        {/* Bottom row */}
        <div className="flex flex-row justify-between items-center w-full whitespace-nowrap">
          <span className="font-[Pretendard] font-medium text-[16px] leading-[1em] tracking-[-0.005em] text-[#666666] w-[379px]">
            © 2026 BRICK Technologies Inc. All rights reserved.
          </span>
          <div className="flex flex-row items-center gap-[42px] w-[312px]">
            <span className="font-[Pretendard] font-medium text-[16px] leading-[1em] tracking-[-0.005em] text-[#666666]">
              개인정보처리방침
            </span>
            <span className="font-[Pretendard] font-medium text-[16px] leading-[1em] tracking-[-0.005em] text-[#666666]">
              이용약관
            </span>
            <span className="font-[Pretendard] font-medium text-[16px] leading-[1em] tracking-[-0.005em] text-[#666666]">
              쿠기설정
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
