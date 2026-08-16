<p align="center">
  <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/778.png" alt="Mimikyu" width="200" />
</p>

<h1 align="center">Mimikyu (따라큐)</h1>

<p align="center">
  Figma design → web code (따라큐) with a measured verification loop — not a "looks close" guess.
</p>

<p align="center">
  <a href="#-what-is-this">What</a> · <a href="#-install">Install</a> · <a href="#-usage">Usage</a> · <a href="#-how-it-works">How it works</a> · <a href="#-completion-gates">Completion gates</a>
</p>

---

## Why this exists

AI code generation produces screens that *look* similar but never match the
design: colors slightly off, 2px spacing differences, wrong font weight, a
button 16px to the left. Pixel-level reproduction fails because "similar" is
judged by eye, not measured.

Mimikyu fixes that by treating the Figma file as the **source of truth** and
running a machine-measured loop:

```
Figma → figma-data.json (contract) → web code → screenshot → pixel diff → structural verify → fix → repeat
```

You don't tell the agent "looks different". It *quantifies* the difference:
`CTA x: expected 436.5 / actual 373.0`, `color: expected #ffffff / actual #000000`.

> Name origin: Mimikyu, the Pokémon that copies whatever it looks at, perfectly.

---

## 🚀 Install (one command)

No git clone, no npm, no manual folder download:

```bash
curl -fsSL https://raw.githubusercontent.com/3x-haust/Mimikyu/main/install.sh | bash
```

The installer detects Claude Code, Codex, and pi (`.agents`), copies the
skill into each tool, and puts the pipeline scripts in
`~/.mimikyu/scripts/`. Re-run it anytime to update. Prefer manual? That still
works:

```bash
# Claude Code
mkdir -p ~/.claude/skills/mimikyu && cp skill/mimikyu/SKILL.md ~/.claude/skills/mimikyu/

# Codex
mkdir -p ~/.codex/skills/mimikyu && cp skill/mimikyu/SKILL.md ~/.codex/skills/mimikyu/

# pi (OMO-style agents)
mkdir -p ~/.agents/skills/mimikyu && cp skill/mimikyu/SKILL.md ~/.agents/skills/mimikyu/
```

Claude Code users can also keep the legacy slash command:

```bash
mkdir -p ~/.claude/commands && cp .claude/commands/mimikyu.md ~/.claude/commands/
```

### Requirements

- Node.js 20+, pnpm
- Python 3 + Pillow
- Playwright (Chromium)
- Figma MCP or a Figma personal access token

The skill installs missing dependencies automatically (pnpm → Pillow →
Playwright Chromium) when it runs.

### Figma MCP setup

Create `.mcp.json` at the project root (copy `.mcp.example.json` and fill in
your token):

```json
{
  "mcpServers": {
    "framelink-figma": {
      "command": "npx",
      "args": ["-y", "figma-developer-mcp", "--figma-api-key=YOUR_TOKEN", "--stdio"]
    },
    "figma": {
      "command": "npx",
      "args": ["-y", "figma-mcp"],
      "env": { "FIGMA_API_KEY": "YOUR_TOKEN" }
    }
  }
}
```

---

## 💡 Usage

Give your agent a Figma URL and a project name. The skill drives the whole
pipeline: extraction → code → screenshot → pixel diff → structural verify →
fix loop.

```
https://www.figma.com/design/FILE_KEY/Title?node-id=1-46 MyProject
```

### Stack & structure are your call

The skill never forces a stack or a folder layout:

- **Say what you want** — "React + Tailwind", "Vue", "vanilla", "Next.js",
  "add it to my existing project at ~/app" — and it uses exactly that.
- **If you don't specify**, the agent asks you first (options like
  React + Tailwind / Vue / vanilla / existing project / custom) before
  writing any code. It only falls back to the React + Tailwind default in
  non-interactive environments, and states that choice explicitly.
- **Existing projects are respected** — no new folder is created against your
  layout.

With no path given, a project directory (e.g. `projects/<name>/` for the
React default) is proposed and confirmed before scaffolding. The pipeline
scripts are found under `~/.mimikyu/scripts/` (one-command install) or repo
`scripts/` (checkout).

### Whole page or single screen — both work

Give the skill one frame (a screen) **or** the whole page / document. It
works the same for either:

- `figma-data.json` can hold one node or many top-level frames.
- When no `--node-id` is passed, `verify.ts` walks **every** frame in the
  file and checks the entire page; pass `--node-id` to scope it to one
  screen.
- Pixel compare uses your exported page PNG either way.

### Running the loop manually

```bash
cd projects/<name>

# One shot: screenshot → pixel compare → structural verify
npx tsx ../../scripts/mimikyu.ts designs/desktop.png \
  --width 1280 --height 4836 --port 3334 \
  --verify designs/figma-data.json --node-id 184:7833 --skip-server

# Or step by step
npx tsx ../../scripts/screenshot.ts screenshots/v1.png 1280 4836
python3 ../../scripts/compare.py designs/desktop.png screenshots/v1.png --regions --iteration 1
npx tsx ../../scripts/verify.ts designs/figma-data.json --port 3334 --node-id 184:7833

# Iteration history
npx tsx ../../scripts/mimikyu.ts --history
```

---

## 🔍 How it works

### Two independent verification signals

| Tool | Measures | Answers |
|------|----------|---------|
| `compare.py` (PIL) | Pixel match vs the exported design PNG | "Where and how much" — overall %, 9 region %, heatmap |
| `verify.ts` (Playwright + DOM) | Each text node's x, y, color, fontSize, fontWeight, lineHeight, letterSpacing vs `figma-data.json` | "What exactly is wrong" — expected vs actual per node |

The pixel diff is the coarse detector; the structural verify is the precise
one. When the loop stalls at 95–97% (the classic "color is slightly off / line
is 3px short" wall), `verify.ts` returns the exact value to fix instead of
leaving you to guess at a heatmap.

`figma-data.json` is extracted **once** via Figma MCP/API and reused for the
whole loop — it is the contract the implementation and the verifier both read.

### Fix loop priority

1. **P0** page structure / viewport / routing / major containers
2. **P1** position, width, height, spacing
3. **P2** typography, color, assets
4. **P3** border, radius, shadow
5. **P4** 1px details

Fix values come from `verify.ts` output and `figma-data.json` directly — no
eyeballing, no rounding.

---

## 🎛️ compare.py options

| Option | Description |
|--------|-------------|
| `--regions` | 3×3 grid per-region analysis |
| `--custom-regions FILE` | JSON-defined regions `{"header": [0,0,1280,80]}` |
| `--threshold N` | Match threshold per channel (default 30, lower = stricter) |
| `--bg-only` | Ignore text pixels; background/layout only |
| `--side-by-side` | design \| screenshot \| heatmap side-by-side image |
| `--iteration N` | Version tracking into `diffs/history.json` |

---

## ✅ Completion gates

All of these must pass before the agent may stop:

```
[ ] figma-data.json extracted and stable
[ ] implementation map written (Figma node → component → file → selector)
[ ] overall_match  >= 99%
[ ] every region    >= 99%   (top-left … bot-right, all nine)
[ ] verify.ts mismatches == 0 (exit code 0)
[ ] critical mismatches == 0 (wrong text/asset/color/font/navigation)
[ ] interactions checked (if the design defines them)
[ ] final screenshot + report produced
```

If a gate fails the agent is **not done** — it fixes and re-runs.

### Stop condition

- No score improvement for 3 consecutive iterations → re-derive the fix list
  from `figma-data.json` (colors 1:1, coordinates, fonts) instead of guessing.
- Still no improvement for another 3 → report with concrete numbers and hand
  over. No silent infinite looping, no "good enough" declared by the agent.

---

## 📁 Project structure

Below is the **default React + Tailwind template layout**. With a different
stack or an existing project, the skill follows your structure instead;
`designs/`, `screenshots/`, `diffs/` remain as working folders beside the app
code.

```
Mimikyu/
├── scripts/
│   ├── mimikyu.ts       # loop orchestrator (screenshot → compare → verify)
│   ├── screenshot.ts    # Playwright capture (viewport/DPR-aware)
│   ├── compare.py       # PIL pixel diff + heatmap + history
│   └── verify.ts        # DOM vs figma-data structural check
├── skill/mimikyu/       # generic SKILL.md (Claude Code / Codex / pi)
├── .claude/commands/    # legacy Claude Code slash command
└── projects/<name>/     # default template: one independent app per design
    ├── designs/         # figma-data.json (contract) + desktop.png (source)
    ├── screenshots/     # Playwright captures
    ├── diffs/           # heatmaps, overlays, history.json
    ├── public/assets/   # Figma-downloaded images
    └── src/components/  # components (mapped in implementation map)
```

## Tech stack

- **Default template**: React 19, TypeScript, Tailwind CSS v4, Vite — but the
  skill is stack-agnostic; use whatever the user asks for
- **Screenshot**: Playwright (headless Chromium)
- **Comparison**: Python PIL/Pillow + DOM structural verification
- **Figma integration**: Framelink MCP, Official Figma MCP (or REST fallback)

## License

MIT

## 한국어

한국어 가이드는 [README.ko.md](README.ko.md) 를 참고하세요.