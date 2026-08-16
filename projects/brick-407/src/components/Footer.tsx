const COLS = [
  {
    title: 'Features',
    left: 745,
    items: ['Core features', 'Pro experience', 'Integrations'],
  },
  {
    title: 'Learn more',
    left: 915,
    items: ['Blog', 'Case studies', 'Customer stories', 'Best practices'],
  },
  {
    title: 'Support',
    left: 1085,
    items: ['Contact', 'Support', 'Legal'],
  },
]

export default function Footer() {
  // Frame 13 (0, 5865, 1280x433)
  return (
    <footer className="absolute left-0 top-[5865px] w-[1280px] h-[433px] bg-white">
      <div className="absolute left-[39px] top-[58px] text-[28px] font-extrabold text-black tracking-[-0.5px]">
        BRICK
      </div>
      <div
        className="absolute left-[63px] top-[106px] text-[16px] font-medium text-[#888888]"
        style={{ lineHeight: '23.2px' }}
      >
        Descriptive line about what your company does.
      </div>
      {COLS.map((col) => (
        <div key={col.title} className="absolute top-[58px]" style={{ left: col.left }}>
          <div
            className="text-[16px] font-semibold text-black whitespace-nowrap"
            style={{ lineHeight: '23.2px' }}
          >
            {col.title}
          </div>
          {col.items.map((item, i) => (
            <div
              key={i}
              className="mt-[8px] text-[16px] font-medium text-[#666666] whitespace-nowrap"
              style={{ lineHeight: '23.2px' }}
            >
              {item}
            </div>
          ))}
        </div>
      ))}
      <div
        className="absolute left-[39px] top-[389px] text-[16px] font-medium text-[#888888]"
        style={{ lineHeight: '16px' }}
      >
        © 2026 BRICK Technologies Inc. All rights reserved.
      </div>
      <div
        className="absolute left-[927px] top-[389px] text-[16px] font-medium text-[#888888] whitespace-nowrap"
        style={{ lineHeight: '16px' }}
      >
        개인정보처리방침
      </div>
      <div
        className="absolute left-[1080px] top-[389px] text-[16px] font-medium text-[#888888] whitespace-nowrap"
        style={{ lineHeight: '16px' }}
      >
        이용약관
      </div>
      <div
        className="absolute left-[1178px] top-[389px] text-[16px] font-medium text-[#888888] whitespace-nowrap"
        style={{ lineHeight: '16px' }}
      >
        쿠기설정
      </div>
    </footer>
  )
}
