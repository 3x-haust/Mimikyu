"""
두 이미지를 픽셀 단위로 비교하여 일치율과 히트맵을 생성합니다.

Usage:
  python3 scripts/compare.py <design_image> <screenshot_image> [options]

Options:
  --regions              영역별 분석 포함 (3x3 그리드)
  --custom-regions FILE  JSON 파일로 커스텀 영역 정의
  --threshold N          일치 판정 임계값 (default: 30)
  --output-dir DIR       출력 디렉토리 (default: diffs)
  --bg-only              텍스트 픽셀 무시하고 배경만 비교
  --side-by-side         design | screenshot | heatmap 합성 이미지 생성
  --iteration N          반복 번호 지정 (출력 파일명 및 history.json 기록)

Output:
  - diffs/diff_heatmap.png  : 차이 히트맵 (빨강 = 불일치)
  - diffs/diff_overlay.png  : 원본 위에 차이 오버레이
  - stdout                  : 전체/영역별 일치율 JSON
"""
import sys
import json
import math
from pathlib import Path

try:
    from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageStat
except ImportError:
    print("Pillow가 필요합니다: pip3 install Pillow", file=sys.stderr)
    sys.exit(1)

import argparse


def auto_resize_design(design: Image.Image, screenshot: Image.Image) -> Image.Image:
    """디자인 이미지를 스크린샷 크기에 맞게 자동 리사이즈."""
    if design.size != screenshot.size:
        print(
            f"[resize] design {design.size} -> screenshot {screenshot.size}",
            file=sys.stderr,
        )
        design = design.resize(screenshot.size, Image.LANCZOS)
    return design


def calc_match_rate(img1: Image.Image, img2: Image.Image, threshold: int = 30) -> float:
    """두 이미지의 픽셀 일치율 계산 (threshold 이내 차이는 일치로 간주)"""
    if img1.size != img2.size:
        img2 = img2.resize(img1.size, Image.LANCZOS)

    diff = ImageChops.difference(img1.convert("RGB"), img2.convert("RGB"))
    pixels = list(diff.getdata())
    total = len(pixels)
    matching = sum(1 for r, g, b in pixels if max(r, g, b) <= threshold)
    return matching / total * 100


def create_heatmap(img1: Image.Image, img2: Image.Image) -> Image.Image:
    """차이 히트맵 생성 (빨간색이 진할수록 큰 차이)"""
    if img1.size != img2.size:
        img2 = img2.resize(img1.size, Image.LANCZOS)

    diff = ImageChops.difference(img1.convert("RGB"), img2.convert("RGB"))

    diff_gray = diff.convert("L")

    # 빨간 히트맵 생성
    heatmap = Image.new("RGB", img1.size, (0, 0, 0))
    heatmap_data = []
    for pixel in diff_gray.getdata():
        intensity = min(pixel * 4, 255)  # 4배 증폭
        heatmap_data.append((intensity, 0, 0))
    heatmap.putdata(heatmap_data)

    return heatmap


def create_overlay(original: Image.Image, heatmap: Image.Image, alpha: float = 0.5) -> Image.Image:
    """원본 위에 히트맵 오버레이"""
    original_rgb = original.convert("RGB")
    blended = Image.blend(original_rgb, heatmap, alpha)
    return blended


def analyze_regions(img1: Image.Image, img2: Image.Image, threshold: int = 30) -> dict:
    """이미지를 영역별로 나누어 분석 (3x3 그리드)"""
    w, h = img1.size
    regions = {}
    labels = [
        ["top-left", "top-center", "top-right"],
        ["mid-left", "mid-center", "mid-right"],
        ["bot-left", "bot-center", "bot-right"],
    ]

    for row in range(3):
        for col in range(3):
            x1 = col * w // 3
            y1 = row * h // 3
            x2 = (col + 1) * w // 3
            y2 = (row + 1) * h // 3

            crop1 = img1.crop((x1, y1, x2, y2))
            crop2 = img2.crop((x1, y1, x2, y2))
            rate = calc_match_rate(crop1, crop2, threshold)
            regions[labels[row][col]] = round(rate, 1)

    return regions


def analyze_custom_regions(
    img1: Image.Image, img2: Image.Image, regions_def: dict, threshold: int = 30
) -> dict:
    """JSON 파일로 정의된 커스텀 영역별 분석.

    regions_def example:
        {"sidebar": [0, 0, 240, 900], "header": [240, 0, 1440, 64]}
    """
    results = {}
    for name, coords in regions_def.items():
        x1, y1, x2, y2 = coords
        crop1 = img1.crop((x1, y1, x2, y2))
        crop2 = img2.crop((x1, y1, x2, y2))
        rate = calc_match_rate(crop1, crop2, threshold)
        results[name] = round(rate, 1)
    return results


def _is_text_pixel(img_gray: Image.Image, x: int, y: int, radius: int = 2) -> bool:
    """주변 픽셀의 분산이 높으면 텍스트/엣지 픽셀로 판단."""
    w, h = img_gray.size
    x1 = max(0, x - radius)
    y1 = max(0, y - radius)
    x2 = min(w, x + radius + 1)
    y2 = min(h, y + radius + 1)
    patch = img_gray.crop((x1, y1, x2, y2))
    stat = ImageStat.Stat(patch)
    # stddev > 20 이면 텍스트/안티앨리어싱 엣지로 간주
    return stat.stddev[0] > 20


def build_text_mask(img: Image.Image, radius: int = 2) -> list[bool]:
    """각 픽셀이 텍스트 영역인지 여부를 bool 리스트로 반환."""
    gray = img.convert("L")
    w, h = gray.size
    mask = []
    for y in range(h):
        for x in range(w):
            mask.append(_is_text_pixel(gray, x, y, radius))
    return mask


def calc_bg_match_rate(
    img1: Image.Image, img2: Image.Image, threshold: int = 30
) -> float:
    """텍스트 픽셀을 무시하고 배경만 비교한 일치율."""
    if img1.size != img2.size:
        img2 = img2.resize(img1.size, Image.LANCZOS)

    print("[bg-only] building text mask (this may take a moment)...", file=sys.stderr)
    # 두 이미지 중 어느 쪽이든 텍스트로 보이면 제외
    mask1 = build_text_mask(img1)
    mask2 = build_text_mask(img2)

    diff = ImageChops.difference(img1.convert("RGB"), img2.convert("RGB"))
    pixels = list(diff.getdata())

    bg_pixels = [
        px for px, m1, m2 in zip(pixels, mask1, mask2) if not m1 and not m2
    ]

    if not bg_pixels:
        return 0.0

    matching = sum(1 for r, g, b in bg_pixels if max(r, g, b) <= threshold)
    return matching / len(bg_pixels) * 100


def create_side_by_side(
    design: Image.Image, screenshot: Image.Image, heatmap: Image.Image
) -> Image.Image:
    """design | screenshot | heatmap 을 가로로 합친 이미지 생성."""
    w, h = design.size
    combined = Image.new("RGB", (w * 3, h), (30, 30, 30))
    combined.paste(design.convert("RGB"), (0, 0))
    combined.paste(screenshot.convert("RGB"), (w, 0))
    combined.paste(heatmap.convert("RGB"), (w * 2, 0))

    # 구분선 및 레이블
    draw = ImageDraw.Draw(combined)
    label_y = 10
    label_color = (255, 255, 255)
    for col, label in enumerate(["Design", "Screenshot", "Heatmap"]):
        draw.text((col * w + 10, label_y), label, fill=label_color)

    return combined


def append_history(
    output_dir: Path,
    iteration: int,
    result: dict,
) -> None:
    """diffs/history.json 에 반복 결과를 추가."""
    history_path = output_dir / "history.json"
    history: list = []
    if history_path.exists():
        try:
            history = json.loads(history_path.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError):
            history = []

    entry = {
        "iteration": iteration,
        "overall_match": result.get("overall_match"),
        "bg_match": result.get("bg_match"),
        "heatmap": result.get("heatmap"),
        "overlay": result.get("overlay"),
    }
    if "regions" in result:
        entry["regions"] = result["regions"]
    if "custom_regions" in result:
        entry["custom_regions"] = result["custom_regions"]

    history.append(entry)
    history_path.write_text(
        json.dumps(history, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    print(f"[history] appended iteration {iteration} to {history_path}", file=sys.stderr)


def main():
    parser = argparse.ArgumentParser(description="Mimikyu 픽셀 비교 도구")
    parser.add_argument("design", help="원본 디자인 이미지 경로")
    parser.add_argument("screenshot", help="스크린샷 이미지 경로")
    parser.add_argument("--regions", action="store_true", help="영역별 분석 포함 (3x3 그리드)")
    parser.add_argument(
        "--custom-regions",
        metavar="FILE",
        help="커스텀 영역 정의 JSON 파일 경로",
    )
    parser.add_argument("--threshold", type=int, default=30, help="일치 판정 임계값 (0-255)")
    parser.add_argument("--output-dir", default="diffs", help="출력 디렉토리")
    parser.add_argument(
        "--bg-only",
        action="store_true",
        help="텍스트 픽셀 무시, 배경만 비교한 layout match score 추가",
    )
    parser.add_argument(
        "--side-by-side",
        action="store_true",
        help="design | screenshot | heatmap 합성 이미지 생성",
    )
    parser.add_argument(
        "--iteration",
        type=int,
        metavar="N",
        help="반복 번호 (출력 파일명 접두사 및 history.json 기록)",
    )
    args = parser.parse_args()

    design = Image.open(args.design)
    screenshot = Image.open(args.screenshot)

    # Feature 1: auto-resize design to match screenshot
    design = auto_resize_design(design, screenshot)

    output_dir = Path(args.output_dir)
    output_dir.mkdir(exist_ok=True)

    # Determine file prefix for iteration tracking (Feature 5)
    prefix = f"v{args.iteration}_" if args.iteration is not None else ""

    # 전체 일치율
    overall = calc_match_rate(design, screenshot, args.threshold)

    # 히트맵 생성
    heatmap = create_heatmap(design, screenshot)
    heatmap_path = output_dir / f"{prefix}diff_heatmap.png"
    heatmap.save(heatmap_path)

    # 오버레이 생성
    overlay = create_overlay(design, heatmap, 0.4)
    overlay_path = output_dir / f"{prefix}diff_overlay.png"
    overlay.save(overlay_path)

    # 결과 구성
    result = {
        "overall_match": round(overall, 1),
        "design_size": list(design.size),
        "screenshot_size": list(screenshot.size),
        "threshold": args.threshold,
        "heatmap": str(heatmap_path),
        "overlay": str(overlay_path),
    }

    if args.iteration is not None:
        result["iteration"] = args.iteration

    # Feature 3: background-only comparison
    if args.bg_only:
        bg_rate = calc_bg_match_rate(design, screenshot, args.threshold)
        result["bg_match"] = round(bg_rate, 1)

    # 3x3 grid regions
    if args.regions:
        result["regions"] = analyze_regions(design, screenshot, args.threshold)

    # Feature 2: custom regions
    if args.custom_regions:
        regions_file = Path(args.custom_regions)
        if not regions_file.exists():
            print(f"[error] custom-regions file not found: {regions_file}", file=sys.stderr)
            sys.exit(1)
        regions_def = json.loads(regions_file.read_text(encoding="utf-8"))
        result["custom_regions"] = analyze_custom_regions(
            design, screenshot, regions_def, args.threshold
        )

    # Feature 4: side-by-side image
    if args.side_by_side:
        sbs = create_side_by_side(design, screenshot, heatmap)
        sbs_path = output_dir / f"{prefix}side_by_side.png"
        sbs.save(sbs_path)
        result["side_by_side"] = str(sbs_path)

    # Feature 5: append to history.json
    if args.iteration is not None:
        append_history(output_dir, args.iteration, result)

    print(json.dumps(result, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
