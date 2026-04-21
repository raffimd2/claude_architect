#!/usr/bin/env bash
# check-setup.sh — verify the viewer's lab environment is ready for the series.
set -u

ok()   { printf "\033[32m✅\033[0m %s\n" "$1"; }
fail() { printf "\033[31m❌\033[0m %s\n" "$1"; FAILED=1; }
warn() { printf "\033[33m⚠\033[0m  %s\n" "$1"; }

FAILED=0

# ---------- ANTHROPIC_API_KEY ----------
if [[ -n "${ANTHROPIC_API_KEY:-}" ]]; then
  mask="${ANTHROPIC_API_KEY: -4}"
  ok "ANTHROPIC_API_KEY is set (sk-ant-...${mask})"
else
  fail "ANTHROPIC_API_KEY is not set. Export it in your shell or add to a .env file."
fi

# ---------- node ----------
if command -v node >/dev/null 2>&1; then
  NODE_V=$(node --version | sed 's/^v//')
  MAJOR=${NODE_V%%.*}
  if (( MAJOR >= 20 )); then
    ok "node v${NODE_V}"
  else
    fail "node v${NODE_V} — need v20 or higher. Run: nvm install 20"
  fi
else
  fail "node is not installed. Install via nvm (https://github.com/nvm-sh/nvm)."
fi

# ---------- npm ----------
if command -v npm >/dev/null 2>&1; then
  ok "npm $(npm --version)"
else
  fail "npm is not installed (ships with node)."
fi

# ---------- claude code ----------
if command -v claude >/dev/null 2>&1; then
  ok "claude $(claude --version 2>/dev/null | head -n1)"
else
  warn "claude CLI not found. Install: npm install -g @anthropic-ai/claude-code"
fi

# ---------- git ----------
if command -v git >/dev/null 2>&1; then
  ok "git $(git --version | awk '{print $3}')"
else
  fail "git is not installed."
fi

echo
if (( FAILED == 0 )); then
  ok "setup OK — you are ready for Module 1."
  exit 0
else
  echo "Fix the items marked ❌ and re-run this script."
  exit 1
fi
