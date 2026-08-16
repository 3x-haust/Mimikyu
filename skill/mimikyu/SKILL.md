---
name: mimikyu
description: >-
  Figma-pixel-perfect implementation pipeline (Mimikyu / 따라큐). Turns a Figma
  design into web code with a measured measure-implement-measure loop: pull
  Figma data once into figma-data.json (source of truth), generate code with
  exact absolute coordinates, screenshot the running app with Playwright,
  pixel-compare with PIL, and structurally verify the live DOM against the
  Figma data (expected vs actual x/y/color/font per text node). Keep looping
  until overall_match >= 99% AND every region >= 99% AND zero structural
  mismatches. The stack (React, Vue, vanilla, …) is chosen by the user, never
  forced — ask or offer options when unspecified. Use when given a figma.com
  URL, 피그마 링크, 피그마 그대로, 픽셀 퍼펙트, pixel perfect, or "make it
  look exactly like the Figma".
---

# Mimikyu (따라큐)

## What this skill is

This skill implements a **Figma → code → measured verification → fix** loop. The
Figma design is the source of truth; `designs/figma-data.json` (extracted once
via Figma MCP / API) is the machine-readable contract. You do not judge
"looks close" — you measure.

The skill is deliberately **stack-agnostic and structure-agnostic**: whatever
the user asked for (React + Tailwind, Vue, vanilla HTML/CSS/JS, Next.js, an
existing project) is honored as-is. Nothing is forced.

**Works for a single frame OR a whole page.** `figma-data.json` from Figma may
contain one node (a screen) or many (a full page / whole document). When no
`--node-id` is given, verify.ts walks every top-level frame in the file and
checks the whole page.

## Non-negotiables

1. **Never code from memory of the design.** Always re-read `figma-data.json`
   for coordinates, colors, fonts, and spacing before generating or editing.
2. **Never round Figma values.** Use `absoluteBoundingBox` x/y/width/height,
   `lineHeightPx`, `letterSpacing`, corner radius, and hex colors exactly as
   extracted (r*255, g*255, b*255, rounded once).
3. **Never invent design decisions.** No "extra padding looks better", no
   approximating a color with a nearby one. If Figma says it, ship it.
4. **Images only** for assets that code cannot reproduce (photos, 3D renders,
   illustrations, logos). Text, buttons, cards, sections, and icons must be
   implemented as code (components / HTML+CSS / inline SVG) in the chosen
   stack — never screenshots of the design.
5. **Do not declare done.** The pipeline below decides. Only exit the loop when
   every gate passes.

## Install (one command)

No git clone needed — pipe the installer:

```bash
curl -fsSL https://raw.githubusercontent.com/3x-haust/Mimikyu/main/install.sh | bash
```

It detects Claude Code, Codex, and pi (`.agents`), copies the skill into each,
and puts the pipeline scripts in `~/.mimikyu/scripts/`. Rerun to update.

## Pipeline

### Phase 0 — Stack & structure (ask first, never assume)

Before any code is written:

1. **Stack.** If the user already said what they want (React + Tailwind, Vue,
   vanilla, Next.js, Svelte, …) use exactly that. If they didn't, ask them —
   do not silently default. Offer concrete options:

   ```text
   어떤 스택으로 구현할까요? (Which stack?)
   1) React + Tailwind (기본 템플릿)
   2) Vue
   3) Vanilla HTML/CSS/JS (단일 페이지)
   4) 기존 프로젝트에 추가 (existing project)
   5) 직접 지정
   ```

   One quick question up front beats fifty fixes later. If the environment is
   non-interactive and no stack was given, use the default React + Tailwind
   template and say so explicitly in the first report.

2. **Structure.** If the user gave an output path or an existing project, work
   inside it — never create a new folder against their layout. If they gave
   nothing, propose a project directory (`projects/<name>/` or a sensible
   one-off dir) and confirm; only scaffold it after the stack is decided.

### Phase 1 — Extract (once)

1. From the Figma URL, parse `FILE_KEY` and `NODE_ID`.
2. Pull design data (prefer Framelink MCP `get_figma_data`, fallback to the
   public API with a Figma token) and **save the raw JSON to
   `designs/figma-data.json`**.
3. Download image assets into `public/assets/` and export the frame as a PNG
   (`designs/desktop.png`) at the design's exact size.
4. Never call the Figma API again during the loop — `figma-data.json` is the
   contract.

### Phase 2 — Implementation map

Before writing code, write a short mapping in the project README or
`docs/implementation-map.md`:

```text
Figma node id → component → file → selector
184:7833     → Header  → src/components/Header.tsx → header
```

Every future diff must be traceable down to a component file and selector.

### Phase 3 — Implement

Work in the **user's chosen stack** and structure. Absolute positions and
values always come from Figma:

- Compute child coordinates relative to the parent frame:
  `left = child.x - parent.x`, `top = child.y - parent.y`.
- Layout with absolute positioning per the Figma absoluteBoundingBox (in any
  stack: CSS `position: absolute`, React inline styles, etc.).
- Convert styles directly: `lineHeightPx → line-height`,
  `letterSpacing → letter-spacing`, fills/strokes → hex colors
  (expand shorthand `#666` → `#666666`, respect opacity).
- `fills=0` nodes are empty boxes — do not render them.
- Text that is one line in Figma must stay one line in code:
  `white-space: nowrap`. Multi-line Figma text uses the exact `\n` breaks.
- Prefer `white-space: pre-line` over manual margin hacks for multi-line text.

### Phase 4 — Verify loop

```bash
# 1. dev server (project dir)
pnpm dev

# 2. one-command loop: screenshot + pixel compare + structural verify
npx tsx ../../scripts/mimikyu.ts designs/desktop.png \
  --width <W> --height <H> --port <PORT> \
  --verify designs/figma-data.json --node-id <NODE_ID> --skip-server

# or manually:
npx tsx ../../scripts/screenshot.ts screenshots/v1.png <W> <H>
python3 ../../scripts/compare.py designs/desktop.png screenshots/v1.png --regions --iteration 1
npx tsx ../../scripts/verify.ts designs/figma-data.json --port <PORT> --node-id <NODE_ID>
```

Outputs:
- `compare.py` → `overall_match` + 9 region scores + heatmap + history.json
- `verify.ts` → per-TEXT-node expected vs actual for x, y, color,
  fontSize, fontWeight, lineHeight, letterSpacing

### Phase 5 — Fix, driven by data

Fix order (P0 → P4):

1. **P0** page structure / viewport / route / major containers
2. **P1** position, width, height, spacing (compare.py regions + verify x/y)
3. **P2** typography, color, assets (verify fontSize/weight/color)
4. **P3** border, radius, shadow
5. **P4** 1px details

For every mismatch:
- Look up the node in `figma-data.json`, find the owning component in the
  implementation map, edit the exact value, re-run the loop.
- When stuck ≥ 95%: re-extract every color from `figma-data.json` and grep the
  code (`grep -oE '#[0-9a-fA-F]{3,8}' src/**/*.tsx`) and diff 1:1. Fix shorthand
  hex, missing opacity, and gradient stops.

### Phase 6 — Interactions (if the design includes them)

If the Figma file has prototype interactions, verify them in the browser:
click → screenshot → compare against the Figma interaction state. For
components without explicit interactions, at minimum sanity-check semantic
behavior: buttons are clickable, inputs focusable, links navigable, toggles
toggle, modals open/close.

## Completion gates — ALL must pass

```
[ ] figma-data.json extracted and stable
[ ] implementation map written
[ ] overall_match  >= 99%
[ ] every region    >= 99%   (all nine: top-left … bot-right)
[ ] verify.ts mismatches == 0 (exit code 0)
[ ] critical mismatches == 0 (wrong text/asset/color/font/navigation)
[ ] interactions checked
[ ] final screenshot + report produced
```

If a gate fails, you are NOT done — fix and re-run.

## Stop condition

Do not loop forever:

- If the score has not improved for **3 consecutive iterations**, re-derive the
  fix list from `figma-data.json` (colors 1:1, coordinates, fonts) instead of
  guessing.
- If it still does not improve for another 3, report to the user with a
  concrete report (numbers, per-element deltas, remaining mismatches) and hand
  over. Never silently stop; never declare done while a gate fails.

## Output when done

Always end with the measured report:

```text
Figma Implementation Report
Visual fidelity: 99.2% (overall) · regions: min 99.1%
Structural verify: 0 mismatches
Remaining: [none | font anti-aliasing only]
```

## Project layout

The layout below is the **default template only** — it is what the default
React + Tailwind scaffold produces. If the user chose a different stack or an
existing project, follow their structure instead and adapt these paths
(designs/, screenshots/, diffs/ stay as working folders next to the app code):

```text
projects/<name>/
├── designs/            # figma-data.json (contract) + desktop.png (source PNG)
├── screenshots/        # Playwright captures per iteration
├── diffs/              # heatmaps, overlays, history.json
├── public/assets/      # Figma-downloaded assets
└── src/components/     # components (mapped in implementation map)
```

Shared scripts live in the Mimikyu install: `~/.mimikyu/scripts/` (or the repo
`scripts/` if working from a checkout): `mimikyu.ts` (orchestrator),
`screenshot.ts` (Playwright), `compare.py` (PIL pixel diff), `verify.ts`
(DOM vs figma-data structural check).