---
name: mimikyu
description: >-
  Figma → code → measured verification loop (Mimikyu / 따라큐). Turns a Figma
  design into web code and keeps looping until the rendered result actually
  matches the design, measured — not judged by eye. Pull Figma data once into
  figma-data.json (the machine-readable source of truth), generate code, run
  the app, capture a full-page screenshot with Playwright, pixel-compare with
  PIL, and structurally verify the live DOM against figma-data.json (expected
  vs actual x/y/color/font per text node). Loop until overall_match >= 99% AND
  every region >= 99% AND zero structural mismatches. Everything else (stack,
  folder structure, project layout, implementation approach) is the AI's
  autonomous call unless the user specifies it. Use when given a figma.com
  URL, 피그마 링크, 피그마 그대로, 픽셀 퍼펙트, pixel perfect, or "make it
  look exactly like the Figma".
---

# Mimikyu (따라큐)

## Design → Code → Measure loop

The Figma design is the source of truth; `figma-data.json` is the
machine-readable contract. You do not judge "looks close" — you measure and
loop until the numbers pass.

```
FIGMA DATA → code → run app → screenshot → pixel diff → structural verify → fix → re-loop
```

## What the AI decides vs what is fixed

**Everything is the AI's call unless the user specifies it**: stack
(React/Vue/vanilla/Next/…), folder structure, project layout, component
organization, how the app is built. Follow user-provided stack or structure
exactly when given; otherwise decide sensibly and move — do not ask permission
on choices the user didn't care about.

**What is dictated (never the AI's call):** the measurement loop and its
completion gates below. Those are the correctness contract.

## Steps

### 1. Extract (once)

1. Parse `FILE_KEY` / `NODE_ID` from the Figma URL.
2. Pull design data (Framelink MCP `get_figma_data`, or the public Figma API)
   and save the raw JSON as `figma-data.json` — this is the contract.
3. Download real image assets (photos/3D/logo/illustrations) and export the
   frame as a reference PNG.
4. Do **not** call Figma again during the loop; everything reads
   `figma-data.json`.

The contract may hold one node (a screen) or many (a whole page) — verify all
of them, or scope with `--node-id`.

### 2. Generate code

Work in the chosen stack/structure. All geometry and style values come from
`figma-data.json`. The AI decides how to structure components, files, and
layout — but the measured result must match the design.

### 3. Verify loop

Capture is **full-page and motion-aware** so it reflects the real rendered
site: `prefers-reduced-motion: reduce` is emulated, the page is scrolled to
trigger `whileInView` reveals, images are forced eager and settled, and capture
is `fullPage: true`.

```bash
# one-command loop: screenshot (motion-aware full page) + pixel diff + structural verify
npx tsx ../../scripts/mimikyu.ts designs/desktop.png \
  --width <W> --height <H> --port <PORT> \
  --verify designs/figma-data.json --node-id <NODE_ID> --skip-server

# or manually:
npx tsx ../../scripts/screenshot.ts screenshots/v1.png <W> <H>
python3 ../../scripts/compare.py designs/desktop.png screenshots/v1.png --regions --iteration 1
npx tsx ../../scripts/verify.ts designs/figma-data.json --port <PORT> --node-id <NODE_ID>
```

Two independent signals:
- `compare.py` (PIL): overall + per-region pixel match + heatmap. **Hard-fails
  on any size mismatch** instead of resizing — a same-size capture must not
  mask a real width/reflow bug.
- `verify.ts` (DOM): per-TEXT-node expected vs actual x/y/color/fontSize/
  fontWeight/lineHeight/letterSpacing. Matching is whitespace- and
  linebreak-insensitive. It also flags **overlapping text boxes (>30%
  overlap) as critical mismatches** and supports `--viewport-width` /
  `--viewport-height` for checking other (e.g. mobile) widths.

### 4. Fix, driven by the numbers

Fix what the data says, in order from biggest impact: structure/viewport first,
then position/spacing, then typography/color, then border/shadow/1px detail.
Each fix: find the node in `figma-data.json`, edit the exact value, re-run the
loop. When stuck ≥95%, re-extract every color 1:1 from `figma-data.json` and
replace the code's values.

### 5. Behaviors (if the design has interactions)

If prototype interactions exist, verify them in a real browser (click →
screenshot → compare against the Figma state; toggles toggle, inputs focus,
links navigate, modals open/close).

## Hard rules

1. **Never code from memory.** Re-read `figma-data.json` for every value.
2. **Never round or approximate.** Use Figma's numbers and hex colors exactly
   (r*255, g*255, b*255, rounded once).
3. **Never invent design decisions.** No "this looks better with extra
   padding" — if Figma doesn't say it, don't add it.
4. **Never use the design/screenshot images as app assets.** `designs/`
   (reference PNG) and `screenshots/` (captures) are for measuring only — never
   `<img>` them, copy them into the app, or serve them. Only real Figma assets
   (photo/3D/logo/illustration) are legitimate images in the app.
5. **Do not declare done.** Only the gates below end the loop.

## Completion gates — ALL must pass

```
[ ] figma-data.json extracted and stable
[ ] overall_match  >= 99%
[ ] every region    >= 99%   (all nine: top-left … bot-right)
[ ] verify.ts structural mismatches == 0 (exit 0)
[ ] critical mismatches == 0 (wrong text/asset/color/font/navigation, overlap)
[ ] interactions checked (if the design defines them)
[ ] final screenshot + measured report produced
```

Dynamic- or API-driven content that is empty/stubbed/differs from Figma
placeholders is reported as *unmatched* (warning), not a critical mismatch —
don't loop forever trying to pixel-match content that only exists with data.

## Stop condition

- No improvement for **3 consecutive iterations** → re-derive the fix list from
  `figma-data.json` (colors 1:1, coordinates, fonts) instead of guessing.
- Still no improvement after another 3 → report with concrete numbers
  (per-element deltas, remaining mismatches) and hand over. Never silently
  stop, never declare done while a gate fails.

## Output when done

```text
Figma Implementation Report
Visual fidelity: 99.2% (overall) · regions: min 99.1%
Structural verify: 0 mismatches
Remaining: [none | font anti-aliasing only]
```

## Scripts

`~/.mimikyu/scripts/` (or the repo `scripts/`): `mimikyu.ts` (orchestrator),
`screenshot.ts` (Playwright capture), `compare.py` (PIL pixel diff),
`verify.ts` (DOM vs figma-data structural check + overlap detection).
