export default function Search() {
  // Frame 1272638486 at (0, 3529, 1280x656). Container fill=#ffffff
  // Visual too complex (Ellipse + content) — use full section export as background
  return (
    <section
      className="absolute left-0 bg-white overflow-hidden"
      style={{ top: 3529, width: 1280, height: 656 }}
    >
      <img
        src="/assets/search-section.png"
        alt=""
        className="absolute"
        style={{ left: 0, top: 0, width: 1280, height: 656 }}
        draggable={false}
      />
    </section>
  )
}
