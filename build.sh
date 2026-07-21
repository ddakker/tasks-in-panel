#!/usr/bin/env bash
# 빌드 스크립트
# GNOME 확장은 컴파일이 없으므로, gsettings 스키마 컴파일과 JS 문법 검사를 수행한다.
set -euo pipefail

SRC_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GETTEXT_DOMAIN="tasks-in-panel-ddakker"

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

# 3) 번역 빌드 (po/*.po -> locale/<언어>/LC_MESSAGES/<도메인>.mo)
if command -v msgfmt >/dev/null 2>&1; then
    # 3-1) 소스에서 번역 대상 문자열을 다시 추출해 .pot 갱신
    if command -v xgettext >/dev/null 2>&1; then
        # -D 로 기준 디렉터리를 지정해 .pot 에 상대 경로가 기록되게 한다.
        xgettext --from-code=UTF-8 --language=JavaScript --keyword=_ \
            --package-name="${GETTEXT_DOMAIN}" \
            -D "${SRC_DIR}" -o "${SRC_DIR}/po/${GETTEXT_DOMAIN}.pot" \
            extension.js prefs.js
        echo "  - 번역 템플릿(.pot) 갱신"
    fi

    # 3-2) 각 언어의 .po 를 .mo 로 컴파일
    for po in "${SRC_DIR}"/po/*.po; do
        [ -e "${po}" ] || continue
        lang="$(basename "${po}" .po)"
        mo_dir="${SRC_DIR}/locale/${lang}/LC_MESSAGES"
        mkdir -p "${mo_dir}"
        msgfmt "${po}" -o "${mo_dir}/${GETTEXT_DOMAIN}.mo"
        echo "  - 번역 컴파일: ${lang}"
    done
else
    echo "  - msgfmt 없음: 번역 빌드 건너뜀 (gettext 패키지 설치 필요)"
fi

echo "빌드 완료."
