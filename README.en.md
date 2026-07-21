# Tasks in panel (ddakker)

*[한국어](README.md) · **English***

A GNOME Shell extension forked from [fthx/tasks-in-panel](https://github.com/fthx/tasks-in-panel).

The upstream project is a lightweight taskbar that respects the GNOME Shell style.
This fork adds **two** things on top of it.

| Added feature | Description |
|---|---|
| Order by favorites | Sorts panel task buttons to follow the dash (favorites) order |
| i18n | gettext translation support for preference strings (Korean included) |

Everything else behaves exactly like upstream.

- Target: GNOME Shell 50
- UUID: `tasks-in-panel-ddakker@gmail.com`
- Schema: `org.gnome.shell.extensions.tasks-in-panel-ddakker`

---

## Feature 1 — Order tasks by favorites

Upstream appends task buttons in the order **windows were opened**, so a button
moves around every time you close and relaunch an app.

With the `order-by-favorites` option enabled, this fork makes task buttons follow
the **dash (favorites) order** instead, so each app keeps its position across restarts.

### Enabling it

Preferences → **Tasks** tab → **"Order tasks by favorites"** ON

```bash
gnome-extensions prefs tasks-in-panel-ddakker@gmail.com
```

### How it works

The feature is implemented in `extension.js` in three parts.

| Function | Role |
|---|---|
| `_updateFavoriteRank()` | Finds the app's index in the favorites list and stores it in `_favoriteRank` |
| `_taskPosition()` | Inserts a new task button **before** the first button with a higher rank |
| `_reorderTasksByFavorites()` | Re-sorts all existing buttons when the dash order changes |

Apps **not** in the favorites list get a rank of `favorites.length`. Favorite apps
therefore cluster at the front, and everything else follows in launch order.

When the option is off, `_favoriteRank` stays 0 and `_taskPosition()` returns `99`,
which reproduces the upstream behavior exactly.

---

## Feature 2 — i18n

Preference strings can now be translated via gettext. A **Korean** translation is included.

### Layout

| Path | Contents |
|---|---|
| `po/tasks-in-panel-ddakker.pot` | Translation template (auto-extracted from source) |
| `po/ko.po` | Korean translation source — **edit only this file** |
| `locale/ko/LC_MESSAGES/*.mo` | Compiled output produced by `build.sh` (do not edit) |

`metadata.json` registers the domain via `"gettext-domain": "tasks-in-panel-ddakker"`,
and `prefs.js` imports `gettext as _` so every UI string is wrapped in `_('...')`.

### Editing a translation

```bash
# 1) Edit the msgstr entries in po/ko.po
# 2) Build (refresh .pot + compile .mo)
./build.sh
# 3) Install
./install.sh
```

### Adding a new language

```bash
msginit -i po/tasks-in-panel-ddakker.pot -l ja -o po/ja.po
# translate po/ja.po, then
./build.sh
```

`build.sh` walks every `po/*.po` and compiles each into `locale/<lang>/LC_MESSAGES/`.

### After adding new strings to the source

Wrap them in `_('...')` so they can be extracted. Running `./build.sh` then re-scans
`extension.js` / `prefs.js` with `xgettext` and refreshes the `.pot`.
To merge the refreshed template into an existing `.po`:

```bash
msgmerge -U po/ko.po po/tasks-in-panel-ddakker.pot
```

---

## Build / Install

```bash
./build.sh     # compile schemas + check JS syntax + compile translations (.mo)
./install.sh   # runs build.sh, then installs into ~/.local/share/gnome-shell/extensions/
```

`install.sh` removes the previous install directory and copies the source again.
`po/` is translation source and not needed at runtime, so it is excluded from the
install; only the compiled `locale/` is installed.

### Required tools

| Tool | Purpose | If missing |
|---|---|---|
| `glib-compile-schemas` | Schema compilation | **Required** |
| `msgfmt` / `xgettext` (gettext) | Translation build | Skipped (no translations) |
| `node` | JS syntax check | Skipped |

### Applying the install

GNOME Shell must be restarted.

- **Xorg**: `Alt+F2` → `r` → Enter
- **Wayland**: log out and back in (Wayland cannot restart the shell)

```bash
gnome-extensions disable tasks-in-panel@fthx        # if upstream is enabled
gnome-extensions enable tasks-in-panel-ddakker@gmail.com
```

---

## Notes on changing settings

### Use `dconf`, not bare `gsettings`

This extension's schema is not installed into the system default schemadir, so a
bare `gsettings set` **fails with `"No such schema"`**. The error is easy to miss,
which makes it easy to misdiagnose as "I changed it but nothing happened."

```bash
# Recommended — no schemadir issues
dconf write /org/gnome/shell/extensions/tasks-in-panel-ddakker/<key> <value>

# Or pass the schemadir explicitly
gsettings --schemadir ~/.local/share/gnome-shell/extensions/tasks-in-panel-ddakker@gmail.com/schemas \
  set org.gnome.shell.extensions.tasks-in-panel-ddakker <key> <value>
```

Inspect the stored values with:

```bash
dconf dump /org/gnome/shell/extensions/tasks-in-panel-ddakker/
```

After writing, confirm with `dconf read` that the value actually landed.

### Changing a setting needs neither a build nor a re-login

`extension.js` listens for the settings `changed` signal and calls `_restart()` on
itself, so value changes apply immediately. A build is only needed when you change
**code or translations**.

### Workspace display: numbered bar vs. horizontal dots

These two options move **as a pair**. Changing only one leaves the area blank.

| Key | Effect |
|---|---|
| `show-workspaces-bar` | Whether this extension draws its **numbered bar (1, 2)** |
| `show-activities` | Whether the GNOME default **horizontal dots (●●●)** indicator shows |

When `show-activities` is `false`, the extension hides the GNOME default indicator
via `Main.panel.statusArea.activities?.hide()`. So turning off just the numbered bar
leaves an empty gap.

To use the GNOME default horizontal dots, set both:

```bash
dconf write /org/gnome/shell/extensions/tasks-in-panel-ddakker/show-workspaces-bar false
dconf write /org/gnome/shell/extensions/tasks-in-panel-ddakker/show-activities true
```

---

## License

Same as upstream. See [LICENSE](LICENSE).
