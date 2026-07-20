#!/usr/bin/env bash
# 설치 스크립트
# build.sh 실행 → 이전 설치 폴더 삭제 → 소스 복사 설치.
set -euo pipefail

UUID="tasks-in-panel-ddakker@gmail.com"
SRC_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
EXT_ROOT="${HOME}/.local/share/gnome-shell/extensions"
DEST_DIR="${EXT_ROOT}/${UUID}"

# 예전 이름으로 설치됐던 폴더들 (원본 tasks-in-panel@fthx 는 건드리지 않는다)
LEGACY_UUIDS=("tasks-in-panel-fav@ddakker" "tasks-in-panel-ddakker@ddakker")

echo "== tasks-in-panel (ddakker) 설치 =="
echo "소스   : ${SRC_DIR}"
echo "설치 위치: ${DEST_DIR}"
echo

# 1) 빌드 (스키마 컴파일 + 문법 검사)
"${SRC_DIR}/build.sh"
echo

# 2) 이전/기존 설치 폴더 삭제 (깨끗한 재설치)
for old in "${LEGACY_UUIDS[@]}" "${UUID}"; do
    if [ -d "${EXT_ROOT}/${old}" ]; then
        rm -rf "${EXT_ROOT}/${old}"
        echo "삭제: ${old}"
    fi
done

# 3) 소스 복사 (.git 및 스크립트 자기 자신은 제외)
mkdir -p "${DEST_DIR}"
rsync -a \
    --exclude '.git' \
    --exclude 'install.sh' \
    --exclude 'build.sh' \
    "${SRC_DIR}/" "${DEST_DIR}/"
echo "설치: ${DEST_DIR}"
echo

# 세션 타입 확인 (Xorg / Wayland)
SESSION_TYPE="${XDG_SESSION_TYPE:-unknown}"

echo "================================================================"
echo " 설치가 끝났습니다. 아래 순서대로 진행하세요."
echo "================================================================"
echo
echo "1) GNOME Shell 재시작 (변경 사항 적용에 필수)"
if [ "${SESSION_TYPE}" = "x11" ]; then
    echo "   - 지금 세션: Xorg(X11)"
    echo "   - Alt+F2 를 누르고 'r' 입력 후 Enter"
elif [ "${SESSION_TYPE}" = "wayland" ]; then
    echo "   - 지금 세션: Wayland"
    echo "   - Wayland 는 셸 재시작이 안 됩니다. 로그아웃 후 다시 로그인하세요."
else
    echo "   - Xorg: Alt+F2 → 'r' → Enter"
    echo "   - Wayland: 로그아웃 후 재로그인"
fi
echo
echo "2) 기존 확장 끄기 (설치돼 있다면)"
echo "   gnome-extensions disable tasks-in-panel@fthx"
echo
echo "3) 이번 개선판 켜기"
echo "   gnome-extensions enable ${UUID}"
echo
echo "4) 새 옵션 켜기"
echo "   gnome-extensions prefs ${UUID}"
echo "   → Tasks 탭 → 'Order tasks by favorites' 스위치 ON"
echo
echo "5) 확인"
echo "   - 대시(활동 화면)에 앱을 즐겨찾기로 고정하고 순서를 바꿔 보세요."
echo "   - 패널의 실행 중인 앱 순서가 대시 순서대로 따라오면 정상입니다."
echo "================================================================"
