#!/bin/bash

set -e

VERSION="0.1.0"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJ_ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

echo "Starting build pipeline for version ${VERSION}..."

echo "[1/2] Building surveyopsplus-base:${VERSION}..."
docker build -t "surveyopsplus-base:${VERSION}" -f base/Dockerfile "${PROJ_ROOT_DIR}"

echo "[2/2] Building surveyopsplus-server:${VERSION}..."
docker build -t "surveyopsplus-server:${VERSION}" -f server/Dockerfile "${PROJ_ROOT_DIR}"

echo "All images built successfully with version ${VERSION}"
