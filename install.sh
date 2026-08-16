#!/usr/bin/env bash
#
# Mimikyu (따라큐) — one-command installer
#
#   curl -fsSL https://raw.githubusercontent.com/3x-haust/Mimikyu/main/install.sh | bash
#
# Installs the Mimikyu skill into every agent tool it finds:
#   - Claude Code  → ~/.claude/skills/mimikyu/  (+ legacy ~/.claude/commands/mimikyu.md)
#   - Codex        → ~/.codex/skills/mimikyu/
#   - pi / OMO     → ~/.agents/skills/mimikyu/
# and copies the shared pipeline scripts to ~/.mimikyu/scripts/.
#
# No git clone, no npm, no manual folder download. Re-run anytime to update.
#
set -euo pipefail

REPO="3x-haust/Mimikyu"
BRANCH="${MIMIKYU_BRANCH:-main}"
PREFIX="${MIMIKYU_PREFIX:-$HOME/.mimikyu}"

echo "==> Mimikyu installer"
echo "    repo:   ${REPO} (${BRANCH})"
echo "    prefix: ${PREFIX}"

# --- 1. fetch the repo tarball (no git needed) -------------------------------
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

echo "==> downloading ${REPO}@${BRANCH} ..."
curl -fsSL "https://github.com/${REPO}/archive/refs/heads/${BRANCH}.tar.gz" \
  | tar -xz -C "$TMP"
SRC="$TMP/Mimikyu-${BRANCH}"
if [ ! -d "$SRC" ]; then
  SRC="$(find "$TMP" -maxdepth 2 -type d -name '*Mimikyu*' | head -1)"
fi
if [ -z "${SRC:-}" ] || [ ! -f "$SRC/skill/mimikyu/SKILL.md" ]; then
  echo "!! download failed or layout unexpected — install aborted" >&2
  exit 1
fi

# --- 2. shared scripts --------------------------------------------------------
mkdir -p "$PREFIX/scripts"
cp "$SRC"/scripts/*.ts "$SRC"/scripts/*.py "$PREFIX/scripts/" 2>/dev/null || true
echo "==> scripts -> ${PREFIX}/scripts/ ($(ls "$PREFIX/scripts" | wc -l | tr -d ' ') files)"

# --- 3. skill into every tool it finds ----------------------------------------
installed=0

install_skill_dir() {
  local dir="$1"
  if [ -d "$dir" ] || [ -d "$(dirname "$dir")" ]; then
    mkdir -p "$dir"
    cp "$SRC/skill/mimikyu/SKILL.md" "$dir/SKILL.md"
    echo "==> skill  -> $dir/SKILL.md"
    installed=$((installed + 1))
  fi
}

install_skill_dir "$HOME/.claude/skills/mimikyu"
install_skill_dir "$HOME/.codex/skills/mimikyu"
install_skill_dir "$HOME/.agents/skills/mimikyu"

# Claude Code legacy slash command (still supported)
if [ -d "$HOME/.claude/commands" ]; then
  cp "$SRC/.claude/commands/mimikyu.md" "$HOME/.claude/commands/mimikyu.md"
  echo "==> command -> $HOME/.claude/commands/mimikyu.md"
  installed=$((installed + 1))
fi

if [ "$installed" -eq 0 ]; then
  echo "!! no supported agent tool found (looked for ~/.claude, ~/.codex, ~/.agents)"
  echo "   skills were still copied to: ${PREFIX}/skill/mimikyu/SKILL.md"
  mkdir -p "$PREFIX/skill/mimikyu"
  cp "$SRC/skill/mimikyu/SKILL.md" "$PREFIX/skill/mimikyu/SKILL.md"
fi

echo
echo "==> done. Mimikyu is installed. Give your agent a Figma URL to start."
echo "    scripts live in ${PREFIX}/scripts (set MIMIKYU_PREFIX to change)."