#!/usr/bin/env bash
# 빌드 스크립트
# GNOME 확장은 컴파일이 없으므로, gsettings 스키마 컴파일과 JS 문법 검사를 수행한다.
set -euo pipefail

SRC_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "== 빌드 =="

# 1) gsettings 스키마 컴파일 (schemas/gschemas.compiled 생성)
glib-compile-schemas "${SRC_DIR}/schemas"
echo "  - 스키마 컴파일 완료"

# 2) JS 문법 검사 (node 가 있으면)
if command -v node >/dev/null 2>&1; then
    for f in extension.js prefs.js; do
        node --check "${SRC_DIR}/${f}"
        echo "  - ${f} 문법 OK"
    done
else
    echo "  - node 없음: JS 문법 검사 건너뜀"
fi

echo "빌드 완료."
