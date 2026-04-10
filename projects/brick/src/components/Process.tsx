interface StepProps {
  number: string;
  badge: string;
  title: string;
  description: string;
}

function Step({ number, badge, title, description }: StepProps) {
  return (
    <div className="flex flex-col gap-[23px]">
      {/* Number */}
      <span className="font-[Pretendard] font-extrabold text-[64px] leading-[0.8em] tracking-[-0.005em] text-[#757575]">
        {number}
      </span>
      {/* Badge */}
      <div className="w-[50px] h-[50px] bg-[#F5F5F5] rounded-[12.3638334274292px] flex flex-col justify-center items-center" style={{ padding: '15px 19px 16px' }}>
        <span className="font-[Pretendard] font-extrabold text-[24px] leading-[0.8em] tracking-[-0.005em] text-[#757575]">
          {badge}
        </span>
      </div>
      {/* Content */}
      <div className="flex flex-col gap-[25px]">
        <span className="font-[Pretendard] font-extrabold text-[32px] leading-[0.8em] tracking-[-0.005em] text-[#575757]">
          {title}
        </span>
        <span className="font-[Pretendard] font-semibold text-[16px] leading-[0.75em] tracking-[-0.005em] text-[#949494] whitespace-pre-line">
          {description}
        </span>
      </div>
    </div>
  );
}

export default function Process() {
  return (
    <section className="relative w-[1259px] h-[977px]">
      {/* Background */}
      <div className="absolute inset-0 w-[1259px] h-[977px] bg-[#FFFFFF] rounded-[20px]" />

      {/* Title */}
      <h2 className="absolute left-[64px] top-[148px] w-[400px] h-[118px] font-[Pretendard] font-extrabold text-[64px] leading-[0.8em] tracking-[-0.005em] text-[#000000] whitespace-pre-line">
        {"우리가 탁월함을\n조립하는 방법."}
      </h2>

      {/* Subtitle */}
      <p className="absolute left-[64px] top-[296px] w-[598px] h-[54px] font-[Pretendard] font-medium text-[24px] leading-[0.8em] tracking-[-0.005em] text-[#666666] whitespace-pre-line">
        {"우리의 프로세스는 건축학적 정밀함에서 영감을 받았습니다. \n견고하고 확장 가능하며 유지보수가 쉬운 소프트웨어를 만듭니다."}
      </p>

      {/* Steps */}
      <div className="absolute left-[64px] top-[497px]">
        <Step
          number="01"
          badge="1"
          title="프로젝트 분석"
          description={"요구사항을 분석하고 효율적인 실행을\n위해 모듈형 '브릭'으로 세분화합니다."}
        />
      </div>
      <div className="absolute left-[358px] top-[497px]">
        <Step
          number="02"
          badge="2"
          title="전문가 매칭"
          description={"검증된 상위 3%의 글로벌 개발자\n네트워크에서 프로젝트에 가장 적합한 \n전문가를 매칭합니다."}
        />
      </div>
      <div className="absolute left-[655px] top-[497px]">
        <Step
          number="03"
          badge="3"
          title="모듈형 조립"
          description={"표준화된 프레임워크를 사용하여 개발을\n시작하며, 고품질의 유지보수 가능한\n코드를 보장합니다."}
        />
      </div>
      <div className="absolute left-[952px] top-[497px]">
        <Step
          number="04"
          badge="4"
          title="품질 보증"
          description={"모든 모듈은 최종 조립 및 인프라\n배포 전에 철저히 테스트되고 검증됩니다."}
        />
      </div>

      {/* Horizontal Line */}
      <div className="absolute left-[72px] top-[607px] w-[1114px] h-0 border-t-[2px] border-[#A3A3A3]" />
    </section>
  );
}
