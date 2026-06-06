#!/bin/bash
set -euo pipefail
# prerequisite.sh — Checks macOS system for SurveyOpsPlus backend requirements

missing=()

echo ""
echo "Checking SurveyOpsPlus Backend Prerequisites..."
echo ""

# Homebrew
if command -v brew &>/dev/null; then
    echo "[OK] Homebrew found: $(brew --version | head -1)"
else
    echo "[MISSING] Homebrew not found. See: https://brew.sh"
    missing+=("homebrew")
fi

# Python
if command -v python3 &>/dev/null; then
    version=$(python3 --version 2>&1)
    major=$(python3 -c 'import sys; print(sys.version_info.major)')
    minor=$(python3 -c 'import sys; print(sys.version_info.minor)')
    if [ "$major" -ge 3 ] && [ "$minor" -ge 10 ]; then
        echo "[OK] Python found: $version"
    else
        echo "[FAIL] Python 3.10+ required. Found: $version"
        missing+=("python (3.10+)")
    fi
else
    echo "[MISSING] Python3 not found."
    missing+=("python")
fi

# pip
if command -v pip3 &>/dev/null; then
    echo "[OK] pip found: $(pip3 --version)"
else
    echo "[MISSING] pip not found."
    missing+=("pip")
fi

# Docker
if command -v docker &>/dev/null; then
    echo "[OK] Docker found: $(docker --version)"
else
    echo "[MISSING] Docker not found. See: https://www.docker.com/products/docker-desktop/"
    missing+=("docker")
fi

# Docker Compose
if docker compose version &>/dev/null; then
    echo "[OK] Docker Compose found: $(docker compose version)"
else
    echo "[MISSING] Docker Compose not found."
    missing+=("docker-compose")
fi

# Git
if command -v git &>/dev/null; then
    echo "[OK] Git found: $(git --version)"
else
    echo "[MISSING] Git not found."
    missing+=("git")
fi

echo ""
if [ ${#missing[@]} -eq 0 ]; then
    echo "All prerequisites met. You are good to go!"
else
    echo "The following prerequisites are missing:"
    for item in "${missing[@]}"; do
        echo "  - $item"
    done
    echo ""
    echo "Please install the missing tools before continuing."
fi