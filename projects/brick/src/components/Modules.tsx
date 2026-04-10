interface ModuleCardProps {
  smallIcon: string;
  smallIconSize: { w: number; h: number };
  smallIconOffset: { x: number; y: number };
  largeIcon: string;
  largeIconSize: { w: number; h: number };
  largeIconOffset: { x: number; y: number };
  title: string;
  titleWidth: number;
  description: string;
  descWidth: number;
  price: string;
  priceWidth: number;
  tag: string;
}

function ModuleCard({
  smallIcon, smallIconSize, smallIconOffset,
  largeIcon, largeIconSize, largeIconOffset,
  title, titleWidth, description, descWidth,
  price, priceWidth, tag,
}: ModuleCardProps) {
  return (
    <div className="relative w-[360px] h-[200px]">
      {/* Card border */}
      <div className="absolute inset-0 w-[360px] h-[200px] bg-[#FFFFFF] border-[2.472766876220703px] border-[#DEDEDE] rounded-[12.3638334274292px]" />
      {/* Icon background */}
      <div className="absolute left-[17px] top-[18px] w-[50px] h-[50px] bg-[#F5F5F5] rounded-[12.3638334274292px]" />
      {/* Small icon */}
      <img
        src={smallIcon}
        className="absolute"
        style={{
          left: `${smallIconOffset.x}px`,
          top: `${smallIconOffset.y}px`,
          width: `${smallIconSize.w}px`,
          height: `${smallIconSize.h}px`,
        }}
        alt=""
      />
      {/* Large faded icon */}
      <img
        src={largeIcon}
        className="absolute"
        style={{
          left: `${largeIconOffset.x}px`,
          top: `${largeIconOffset.y}px`,
          width: `${largeIconSize.w}px`,
          height: `${largeIconSize.h}px`,
        }}
        alt=""
      />
      {/* Price */}
      <span
        className="absolute top-[66.24px] font-[Pretendard] font-medium text-[12.3638334274292px] leading-[0.8em] tracking-[-0.005em] text-[#949494]"
        style={{ left: '282.19px', width: `${priceWidth}px` }}
      >
        {price}
      </span>
      {/* Title */}
      <span
        className="absolute left-[17px] top-[86px] font-[Pretendard] font-semibold text-[22px] leading-[0.8em] tracking-[-0.005em] text-[#000000]"
        style={{ width: `${titleWidth}px` }}
      >
        {title}
      </span>
      {/* Description */}
      <span
        className="absolute left-[17px] top-[127px] font-[Pretendard] font-semibold text-[11px] leading-[1.2em] tracking-[-0.005em] text-[#575757]"
        style={{ width: `${descWidth}px` }}
      >
        {description}
      </span>
      {/* Tag */}
      <div className="absolute left-[17px] top-[167px] flex flex-row justify-center items-center gap-[10px] bg-[#EBEBEB] rounded-[28.848947525024414px]" style={{ padding: '1px 9px', height: '17px' }}>
        <span className="font-[Pretendard] font-medium text-[9px] leading-[1.45em] tracking-[-0.005em] text-[#000000]">
          {tag}
        </span>
      </div>
    </div>
  );
}

export default function Modules() {
  return (
    <section className="relative w-[1259px] h-[977px]">
      {/* Background */}
      <div className="absolute inset-0 w-[1259px] h-[977px] bg-[#FFFFFF] rounded-[20px]" />

      {/* Badge */}
      <div
        className="absolute left-[64px] top-[82px] flex flex-row justify-center items-center gap-[8px] bg-[#F5F5F5] border border-[#BFBFBF] rounded-[25px]"
        style={{ padding: '12px 16px', height: '35px' }}
      >
        <span className="font-[Inter] font-medium text-[14px] leading-[1.45em] tracking-[-0.005em] text-[#0D0D0D]">
          BRICK MARKET
        </span>
      </div>

      {/* Title */}
      <h2 className="absolute left-[64px] top-[148px] w-[469px] h-[118px] font-[Pretendard] font-extrabold text-[64px] leading-[0.8em] tracking-[-0.005em] text-[#000000] whitespace-pre-line">
        {"현대적인 팀을 위한\n모듈형 컴포넌트."}
      </h2>

      {/* Subtitle */}
      <p className="absolute left-[64px] top-[296px] w-[515px] h-[54px] font-[Pretendard] font-medium text-[24px] leading-[0.8em] tracking-[-0.005em] text-[#666666] whitespace-pre-line">
        {"새로 발명하지 마세요. 검증된 프리빌트 모듈을 사용하여\n개발 속도를 획기적으로 높이세요."}
      </p>

      {/* Browse all modules link */}
      <div className="absolute left-[997px] top-[317px] w-[202px] h-[32px]">
        <span className="absolute left-0 top-0 w-[173px] h-[32px] font-[Inter] font-medium text-[22px] leading-[1.45em] tracking-[-0.005em] text-[#000000]">
          모든 모듈 둘러보기
        </span>
        <div className="absolute left-[178px] top-[4px] w-[24px] h-[24px]">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute left-[5px] top-[5px]">
            <path d="M7 1L13 7M13 7L7 13M13 7H1" stroke="#000000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" transform="rotate(45, 7, 7)" />
          </svg>
        </div>
      </div>

      {/* Row 1 */}
      <div className="absolute left-[64px] top-[419px]">
        <ModuleCard
          smallIcon="/assets/icon-shield-small.svg"
          smallIconSize={{ w: 33, h: 33 }}
          smallIconOffset={{ x: 26, y: 26 }}
          largeIcon="/assets/icon-shield-large.svg"
          largeIconSize={{ w: 94, h: 94 }}
          largeIconOffset={{ x: 235, y: 18 }}
          title="인증모듈"
          titleWidth={76}
          description="어떤 스택에도 즉시 통합 가능한 안전하고 확장 가능한 인증 시스템입니다."
          descWidth={310}
          price="₩650,000"
          priceWidth={60}
          tag="보안"
        />
      </div>
      <div className="absolute left-[447px] top-[419px]">
        <ModuleCard
          smallIcon="/assets/icon-creditcard-small.svg"
          smallIconSize={{ w: 28, h: 28 }}
          smallIconOffset={{ x: 28, y: 29 }}
          largeIcon="/assets/icon-creditcard-large.svg"
          largeIconSize={{ w: 94, h: 94 }}
          largeIconOffset={{ x: 235, y: 18 }}
          title="결제 게이트웨이"
          titleWidth={138}
          description="100개 이상의 통화와 현지 결제 수단을 지원하는 글로벌 결제 프로세싱입니다."
          descWidth={329}
          price="₩1,200,000"
          priceWidth={68}
          tag="핀테크"
        />
      </div>
      <div className="absolute left-[830px] top-[419px]">
        <ModuleCard
          smallIcon="/assets/icon-lightning-standalone.svg"
          smallIconSize={{ w: 33, h: 33 }}
          smallIconOffset={{ x: 25, y: 26 }}
          largeIcon="/assets/icon-lightning-small.svg"
          largeIconSize={{ w: 94, h: 94 }}
          largeIconOffset={{ x: 235, y: 19 }}
          title="실시간 엔진"
          titleWidth={100}
          description="협업 및 라이브 기능을 위한 저지연 웹소켓 인프라입니다."
          descWidth={239}
          price="₩950,000"
          priceWidth={60}
          tag="성능"
        />
      </div>

      {/* Row 2 */}
      <div className="absolute left-[64px] top-[642px]">
        <ModuleCard
          smallIcon="/assets/icon-people-small.svg"
          smallIconSize={{ w: 33, h: 33 }}
          smallIconOffset={{ x: 26, y: 26 }}
          largeIcon="/assets/icon-people-large.svg"
          largeIconSize={{ w: 94, h: 94 }}
          largeIconOffset={{ x: 235, y: 18 }}
          title="팀 스케일링"
          titleWidth={100}
          description="기존 엔지니어링 팀을 보강할 수 있는 온디맨드 시니어 개발자 매칭입니다."
          descWidth={310}
          price="별도문의"
          priceWidth={43}
          tag="아웃소싱"
        />
      </div>
      <div className="absolute left-[447px] top-[642px]">
        <ModuleCard
          smallIcon="/assets/icon-globe-large.svg"
          smallIconSize={{ w: 33, h: 33 }}
          smallIconOffset={{ x: 25, y: 26 }}
          largeIcon="/assets/icon-globe-large.svg"
          largeIconSize={{ w: 74, h: 77 }}
          largeIconOffset={{ x: 245, y: 28 }}
          title="글로벌 CDN"
          titleWidth={109}
          description="번개처럼 빠른 앱을 위한 엣지 컴퓨팅 및 콘텐츠 전송 네트워크입니다."
          descWidth={291}
          price="₩650,000"
          priceWidth={60}
          tag="인프라"
        />
      </div>
      <div className="absolute left-[830px] top-[642px]">
        <ModuleCard
          smallIcon="/assets/icon-code-small.svg"
          smallIconSize={{ w: 33, h: 33 }}
          smallIconOffset={{ x: 25, y: 26 }}
          largeIcon="/assets/icon-code-large.svg"
          largeIconSize={{ w: 94, h: 94 }}
          largeIconOffset={{ x: 235, y: 19 }}
          title="커스텀 스튜디오"
          titleWidth={138}
          description="기획부터 배포까지 제품 개발의 전 과정을 책임집니다."
          descWidth={227}
          price="견적문의"
          priceWidth={43}
          tag="풀서비스"
        />
      </div>
    </section>
  );
}
