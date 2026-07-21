# Tasks in panel (ddakker)

***한국어** · [English](README.en.md)*

[fthx/tasks-in-panel](https://github.com/fthx/tasks-in-panel) 을 fork 한 GNOME Shell 확장이다.

원본은 GNOME Shell 스타일을 해치지 않는 가벼운 작업 표시줄(taskbar)이다.
이 fork 는 거기에 **두 가지**를 추가했다.

| 추가 기능 | 설명 |
|---|---|
| 즐겨찾기 순 정렬 | 패널의 태스크 버튼을 대시(즐겨찾기) 등록 순서대로 정렬 |
| 다국어(i18n) | 설정 창 문자열의 gettext 번역 지원 (현재 한국어 제공) |

원본의 나머지 기능과 동작은 그대로다.

- 대상: GNOME Shell 50
- UUID: `tasks-in-panel-ddakker@gmail.com`
- 스키마: `org.gnome.shell.extensions.tasks-in-panel-ddakker`

---

## 추가 기능 1 — 즐겨찾기 순 정렬

원본은 태스크 버튼이 **창이 열린 순서**대로 붙는다.
그래서 앱을 껐다 켜면 패널에서 위치가 계속 바뀐다.

이 fork 는 `order-by-favorites` 옵션을 켜면 태스크 버튼이
**대시(즐겨찾기) 목록 순서**를 따라간다. 앱을 다시 실행해도 자리가 유지된다.

### 켜는 법

설정 창 → **태스크(Tasks)** 탭 → **"즐겨찾기 순서로 태스크 정렬"** ON

```bash
gnome-extensions prefs tasks-in-panel-ddakker@gmail.com
```

### 동작 방식

`extension.js` 에 세 부분으로 구현돼 있다.

| 위치 | 역할 |
|---|---|
| `_updateFavoriteRank()` | 이 창의 앱이 즐겨찾기 목록에서 몇 번째인지 계산해 `_favoriteRank` 에 저장 |
| `_taskPosition()` | 새 태스크 버튼을 넣을 때, 순위가 자기보다 뒤인 첫 버튼 **앞**에 삽입 |
| `_reorderTasksByFavorites()` | 대시 순서가 바뀌면 이미 떠 있는 버튼들을 통째로 다시 정렬 |

즐겨찾기에 **없는** 앱은 `favorites.length` 순위를 받는다.
즉 즐겨찾기 앱들이 앞에 모이고, 나머지는 그 뒤에 실행순으로 붙는다.

옵션이 꺼져 있으면 `_favoriteRank` 는 0, `_taskPosition()` 은 `99` 를 반환해
원본과 동일하게 동작한다.

---

## 추가 기능 2 — 다국어(i18n)

설정 창의 문자열을 gettext 로 번역할 수 있게 했다. 현재 **한국어** 번역이 들어 있다.

### 구성

| 경로 | 내용 |
|---|---|
| `po/tasks-in-panel-ddakker.pot` | 번역 템플릿 (소스에서 자동 추출) |
| `po/ko.po` | 한국어 번역 원본 — **번역은 이 파일만 고친다** |
| `locale/ko/LC_MESSAGES/*.mo` | `build.sh` 가 만든 컴파일 결과 (직접 수정 금지) |

`metadata.json` 의 `"gettext-domain": "tasks-in-panel-ddakker"` 로 도메인을 등록하고,
`prefs.js` 에서 `gettext as _` 를 import 해 모든 UI 문자열을 `_('...')` 로 감쌌다.

### 번역 수정하기

```bash
# 1) po/ko.po 의 msgstr 를 수정
# 2) 빌드 (.pot 갱신 + .mo 컴파일)
./build.sh
# 3) 설치
./install.sh
```

### 새 언어 추가하기

```bash
msginit -i po/tasks-in-panel-ddakker.pot -l ja -o po/ja.po
# po/ja.po 번역 후
./build.sh
```

`build.sh` 는 `po/*.po` 를 전부 훑어 각각 `locale/<언어>/LC_MESSAGES/` 에 컴파일한다.

### 소스에 문자열을 새로 추가했다면

반드시 `_('...')` 로 감싸야 추출된다. 이후 `./build.sh` 를 돌리면
`xgettext` 가 `extension.js` / `prefs.js` 를 다시 스캔해 `.pot` 을 갱신한다.
갱신된 `.pot` 을 기존 `.po` 에 병합하려면:

```bash
msgmerge -U po/ko.po po/tasks-in-panel-ddakker.pot
```

---

## 빌드 / 설치

```bash
./build.sh     # 스키마 컴파일 + JS 문법 검사 + 번역(.mo) 컴파일
./install.sh   # build.sh 실행 후 ~/.local/share/gnome-shell/extensions/ 에 설치
```

`install.sh` 는 기존 설치 폴더를 지우고 다시 복사한다.
`po/` 는 번역 소스라 런타임에 불필요하므로 설치 대상에서 제외되고, 컴파일된 `locale/` 만 설치된다.

### 필요한 도구

| 도구 | 용도 | 없을 때 |
|---|---|---|
| `glib-compile-schemas` | 스키마 컴파일 | **필수** |
| `msgfmt` / `xgettext` (gettext) | 번역 빌드 | 건너뜀 (번역 미적용) |
| `node` | JS 문법 검사 | 건너뜀 |

### 설치 후 반영

GNOME Shell 재시작이 필요하다.

- **Xorg**: `Alt+F2` → `r` → Enter
- **Wayland**: 로그아웃 후 재로그인 (Wayland 는 셸 재시작 불가)

```bash
gnome-extensions disable tasks-in-panel@fthx        # 원본이 켜져 있다면
gnome-extensions enable tasks-in-panel-ddakker@gmail.com
```

---

## 설정 변경 시 주의사항

### 터미널로 설정을 바꿀 땐 `gsettings` 대신 `dconf`

이 확장의 스키마는 시스템 기본 schemadir 에 설치되지 않는다.
그래서 맨 `gsettings set` 은 **`"스키마가 없습니다"` 오류로 실패**한다.
오류가 눈에 잘 안 띄어 "적용했는데 효과가 없다"고 오진하기 쉽다.

```bash
# 권장 — 경로 문제 없음
dconf write /org/gnome/shell/extensions/tasks-in-panel-ddakker/<키> <값>

# 또는 schemadir 를 명시
gsettings --schemadir ~/.local/share/gnome-shell/extensions/tasks-in-panel-ddakker@gmail.com/schemas \
  set org.gnome.shell.extensions.tasks-in-panel-ddakker <키> <값>
```

현재 저장값 확인:

```bash
dconf dump /org/gnome/shell/extensions/tasks-in-panel-ddakker/
```

변경 후에는 `dconf read` 로 값이 실제로 들어갔는지 확인하는 편이 안전하다.

### 설정 변경에는 빌드도 재로그인도 필요 없다

`extension.js` 가 설정의 `changed` 시그널을 받아 `_restart()` 로 스스로 재시작한다.
값만 바뀌면 즉시 반영된다. 빌드가 필요한 경우는 **코드나 번역을 고쳤을 때**뿐이다.

### 워크스페이스 표시: 번호 바 vs 가로 점

이 두 옵션은 **짝으로** 움직인다. 한쪽만 건드리면 표시가 통째로 사라진다.

| 키 | 효과 |
|---|---|
| `show-workspaces-bar` | 이 확장이 그리는 **번호 바(1, 2)** 표시 여부 |
| `show-activities` | GNOME 기본 **가로 점(●●●)** 인디케이터 표시 여부 |

`show-activities` 가 `false` 면 확장이 `Main.panel.statusArea.activities?.hide()` 로
GNOME 기본 점 인디케이터를 숨긴다. 따라서 번호 바만 끄면 그 자리가 빈 채로 남는다.

GNOME 기본 가로 점을 쓰려면 둘 다 설정해야 한다:

```bash
dconf write /org/gnome/shell/extensions/tasks-in-panel-ddakker/show-workspaces-bar false
dconf write /org/gnome/shell/extensions/tasks-in-panel-ddakker/show-activities true
```

---

## 라이선스

원본과 동일하다. [LICENSE](LICENSE) 참고.
