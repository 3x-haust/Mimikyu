const LEFT = [
  { q: '비용은 보통 얼마나 드나요?', a: '기능 마켓에서 담으신 브릭의 개수와 복잡도에 따라 달라져요.  하지만 표준화된 블록을 사용하기 때문에 일반적인 외주보다  훨씬 합리적인 견적을 받아보실 수 있어요.' },
  { q: '제작 기간은 얼마나 걸릴까요?' },
  { q: '제작 기간은 얼마나 걸릴까요?' },
]
const RIGHT = [
  { q: '제작 기간은 얼마나 걸릴까요?' },
  { q: '개발 후에도 유지보수를 해주시나요?' },
  { q: '일반 외주랑 뭐가 다른가요?' },
  { q: '일반 외주랑 뭐가 다른가요?' },
]

export default function Faq() {
  // Frame (0, 5042, 1280x756)
  // Eyebrow (105, 5142) fs=24 fw=700 "궁금한 점이 있으신가요?"
  // Heading  (105, 5194) fs=36 fw=600 "BRICK에 대해 자주 묻는 질문들이에요"
  return (
    <section className="absolute left-0 top-[5042px] w-[1280px] h-[756px]">
      <div
        className="absolute left-[105px] top-[100px] text-[24px] font-bold text-[#ff6b1a] whitespace-nowrap"
        style={{ lineHeight: '24px' }}
      >
        궁금한 점이 있으신가요?
      </div>
      <h2
        className="absolute left-[105px] top-[152px] text-[36px] font-semibold text-black whitespace-nowrap"
        style={{ lineHeight: '24px' }}
      >
        BRICK에 대해 자주 묻는 질문들이에요
      </h2>
      <div className="absolute left-[105px] top-[262px] w-[520px]">
        {LEFT.map((f, i) => (
          <div key={i} className="border-b border-[#e6e6e6] py-[20px]">
            <div className="text-[20px] font-medium text-black whitespace-nowrap" style={{ lineHeight: '30px' }}>
              {f.q}
            </div>
            {f.a && (
              <p className="mt-[14px] text-[16px] font-normal text-[#666666]" style={{ lineHeight: '24px' }}>
                {f.a}
              </p>
            )}
          </div>
        ))}
      </div>
      <div className="absolute left-[664px] top-[262px] w-[520px]">
        {RIGHT.map((f, i) => (
          <div key={i} className="border-b border-[#e6e6e6] py-[20px]">
            <div className="text-[20px] font-medium text-black whitespace-nowrap" style={{ lineHeight: '30px' }}>
              {f.q}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
