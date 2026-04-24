//    Tasks in panel
//    GNOME Shell extension
//    @fthx 2026
//    Light style mode copied from @fmuellner GNOME official extension


import Clutter from 'gi://Clutter';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import GObject from 'gi://GObject';
import Meta from 'gi://Meta';
import Shell from 'gi://Shell';
import St from 'gi://St';

import * as AppFavorites from 'resource:///org/gnome/shell/ui/appFavorites.js';
import { AppMenu } from 'resource:///org/gnome/shell/ui/appMenu.js';
import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import { SystemIndicator } from 'resource:///org/gnome/shell/ui/quickSettings.js';


const ICON_SIZE = 18; // px
const UNFOCUSED_TASK_BUTTON_OPACITY = 128; // 0...255
const SHOW_DESKTOP_ICON_NAME = 'focus-windows-symbolic';
const FAVORITES_ICON_NAME = 'starred-symbolic';
const RECENT_APPS_ICON_NAME = 'document-open-recent-symbolic';

const LightStyleMode = GObject.registerClass(
    class LightStyleMode extends GObject.Object {
        _init() {
            super._init();

            this._savedColorScheme = Main.sessionMode.colorScheme;
            this._updateColorScheme('prefer-light');
        }

        _updateColorScheme(scheme) {
            Main.sessionMode.colorScheme = scheme;
            St.Settings.get().notify('color-scheme');
        }

        destroy() {
            this._updateColorScheme(this._savedColorScheme);
        }
    });

const ShowDesktopButton = GObject.registerClass(
    class ShowDesktopButton extends PanelMenu.Button {
        _init() {
            super._init();

            this._makeButtonBox();

            if (this._clickGesture)
                this.remove_action(this._clickGesture);
            this._clickGesture = new Clutter.ClickGesture();
            this._clickGesture.connect('recognize', () => this._toggleAllWindows());
            this.add_action(this._clickGesture);

            if (!Main.panel.statusArea['showDesktopButton'])
                Main.panel.addToStatusArea('showDesktopButton', this, -1);
        }

        _makeButtonBox() {
            this._box = new St.BoxLayout();

            this._icon = new St.Icon({ icon_name: SHOW_DESKTOP_ICON_NAME, style_class: 'system-status-icon' });
            this._box.add_child(this._icon);

            this.add_child(this._box);
        }

        _toggleAllWindows() {
            const activeWorkspace = global.workspace_manager.get_active_workspace();
            const allWindows = activeWorkspace?.list_windows();
            const notAllWindowsMinimized = allWindows?.some(window => !window?.minimized);

            if (notAllWindowsMinimized) {
                for (const window of allWindows) {
                    if (!window?.minimized && window?.can_minimize())
                        window?.minimize();
                }
            } else {
                for (const window of allWindows) {
                    window?.unminimize();
                }
            }
        }
    });

const UserIdButton = GObject.registerClass(
    class UserIdButton extends SystemIndicator {
        _init() {
            super._init()

            this._indicator = this._addIndicator();

            const userId = new St.Label({ text: `${GLib.get_real_name()}  `, y_align: Clutter.ActorAlign.CENTER });
            this.add_child(userId);

            Main.panel.statusArea.quickSettings.addExternalIndicator(this);
        }

        destroy() {
            this._indicator?.destroy();
            this._indicator = null;

            super.destroy();
        }
    });

const FavoritesMenuButton = GObject.registerClass(
    class FavoritesMenuButton extends PanelMenu.Button {
        _init() {
            super._init(0.5);

            this._makeButtonBox();

            AppFavorites.getAppFavorites().connectObject('changed', () => this._updateFavorites(), this);
        }

        _makeButtonBox() {
            this._box = new St.BoxLayout();

            this._icon = new St.Icon({ icon_name: FAVORITES_ICON_NAME, style_class: 'system-status-icon' });
            this._box.add_child(this._icon);

            this.add_child(this._box);

            this._updateFavorites();
        }

        _updateFavorites() {
            this.menu?.removeAll();

            const favorites = AppFavorites.getAppFavorites().getFavorites() ?? [];

            for (const favorite of favorites) {
                const item = new PopupMenu.PopupImageMenuItem(favorite?.get_name(), favorite?.icon);
                this.menu?.addMenuItem(item);

                item.connect('activate', () => favorite?.activate());
            }
        }

        destroy() {
            this.menu?.removeAll();
            AppFavorites.getAppFavorites()?.disconnectObject(this);

            super.destroy();
        }
    });

const RecentAppsMenuButton = GObject.registerClass(
    class RecentAppsMenuButton extends PanelMenu.Button {
        _init(globalRecentApps) {
            super._init(0.5);

            this._globalRecentApps = globalRecentApps;

            this._makeButtonBox();
        }

        _makeButtonBox() {
            this._box = new St.BoxLayout();

            this._icon = new St.Icon({ icon_name: RECENT_APPS_ICON_NAME, style_class: 'system-status-icon' });
            this._box.add_child(this._icon);

            this.add_child(this._box);
        }

        _updateRecentApps() {
            this.menu?.removeAll();

            const recentApps = this._globalRecentApps.recentApps ?? [];

            for (const app of recentApps) {
                const item = new PopupMenu.PopupImageMenuItem(app?.get_name(), app?.icon);
                this.menu?.addMenuItem(item);

                item.connect('activate', () => app?.activate());
            }
        }

        destroy() {
            this.menu?.removeAll();

            super.destroy();
        }
    });

const WorkspacesBar = GObject.registerClass(
    class WorkspacesBar extends PanelMenu.Button {
        _init(settings) {
            super._init();
            this.reactive = false;

            this._settings = settings;

            const mutterSettings = new Gio.Settings({ schema_id: 'org.gnome.mutter' });
            const isDynamicWorkspaces = mutterSettings?.get_boolean('dynamic-workspaces');

            this._box = new St.BoxLayout();

            if (!isDynamicWorkspaces && this._settings?.get_boolean('show-plus-minus'))
                this._makeControlsBox();

            this.add_child(this._box);

            if (!Main.panel.statusArea['workspacesBarButton'])
                Main.panel.addToStatusArea('workspacesBarButton', this, 0, 'left');
        }

        _makeControlsBox() {
            this._controlsBox = new St.BoxLayout({ y_align: Clutter.ActorAlign.CENTER });
            this._controlsBox.add_style_class_name('plus-minus');

            this._plusButton = new St.Button({ label: '+' });
            this._minusButton = new St.Button({ label: '−' });

            this._controlsBox.add_child(this._plusButton);
            this._controlsBox.add_child(this._minusButton);

            this._plusButton.connect('clicked', () => this._addWorkspace());
            this._minusButton.connect('clicked', () => this._removeWorkspace());

            this._box.add_child(this._controlsBox);
        }

        _addWorkspace() {
            global.workspace_manager.append_new_workspace(false, global.get_current_time());
        }

        _removeWorkspace() {
            if (global.workspace_manager.n_workspaces > 1) {
                const activeWorkspace = global.workspace_manager.get_active_workspace();
                global.workspace_manager.remove_workspace(activeWorkspace, global.get_current_time());
            }
        }

        destroy() {
            this._plusButton?.destroy();
            this._minusButton?.destroy();
            this._box.destroy_all_children();

            super.destroy();
        }
    });

const WorkspaceButton = GObject.registerClass(
    class WorkspaceButton extends St.Button {
        _init(workspace) {
            super._init();

            this._workspace = workspace;

            const mutterSettings = new Gio.Settings({ schema_id: 'org.gnome.mutter' });
            this._isDynamicWorkspaces = mutterSettings?.get_boolean('dynamic-workspaces');

            this._makeButtonBox();

            this._updateIndex();
            this._updateFocus();
            this._updateOpacity();

            this._connectSignals();
        }

        _connectSignals() {
            global.workspace_manager.connectObject(
                'active-workspace-changed', () => this._updateFocus(),
                'workspace-removed', () => this._onWorkspaceRemoved(),
                'notify::n-workspaces', () => this._onWorkspaceRemoved(),
                this);
            this._workspace?.connectObject(
                'notify::workspace-index', () => this._updateIndex(),
                'notify::n-windows', () => this._updateOpacity(),
                this);

            this.connect('clicked', () => this._onClick());
        }

        _disconnectSignals() {
            global.workspace_manager.disconnectObject(this);
            this._workspace?.disconnectObject(this);
        }

        _makeButtonBox() {
            this._workspaceIndex = new St.Label({ reactive: true, track_hover: true, y_align: Clutter.ActorAlign.CENTER });
            this._workspaceIndex.add_style_class_name('workspace-button');

            this.add_child(this._workspaceIndex);
        }

        _onClick() {
            if (global.workspace_manager.get_active_workspace() === this._workspace)
                Main.overview.toggle();
            else if (this._workspace && this._isWorkspaceMapped())
                this._workspace.activate(global.get_current_time());

            return Clutter.EVENT_STOP;
        }

        _updateFocus() {
            if (this._workspace?.active) {
                this._workspaceIndex?.remove_style_class_name('workspace-button-inactive');
                this._workspaceIndex?.add_style_class_name('workspace-button-active');
            } else {
                this._workspaceIndex?.remove_style_class_name('workspace-button-active');
                this._workspaceIndex?.add_style_class_name('workspace-button-inactive');
            }

            this._updateOpacity();
        }

        _updateOpacity() {
            if (this._workspace?.n_windows === 0 && !this._workspace?.active && !this._isDynamicWorkspaces)
                this._workspaceIndex?.add_style_class_name('workspace-button-no-windows');
            else
                this._workspaceIndex?.remove_style_class_name('workspace-button-no-windows');
        }

        _updateIndex() {
            if (this._workspace && this._isWorkspaceMapped())
                this._workspaceIndex.text = String(this._workspace.index() + 1);
        }

        _isWorkspaceMapped() {
            const n_workspaces = global.workspace_manager.n_workspaces;

            for (let index = 0; index < n_workspaces; index++) {
                if (global.workspace_manager.get_workspace_by_index(index) === this._workspace)
                    return true;
            }

            return false;
        }

        _onWorkspaceRemoved() {
            if (!this._workspace || !this._isWorkspaceMapped())
                this.destroy();
        }

        destroy() {
            this._disconnectSignals();
            this.get_parent()?.remove_child(this);

            super.destroy();
        }
    });

const TaskButton = GObject.registerClass(
    class TaskButton extends PanelMenu.Button {
        _init(settings, globalRecentApps, window) {
            super._init();

            this._settings = settings;
            this._globalRecentApps = globalRecentApps;
            this._window = window;

            this._importSettings();

            this._makeButtonBox();

            const side = this._centerTasks ? 'center' : 'left';
            const windowId = this._window?.get_id();
            const buttonId = `taskButton${windowId}`;
            if (windowId && !Main.panel.statusArea[buttonId])
                Main.panel.addToStatusArea(buttonId, this, 99, side);

            this._updateApp();
            this._updateTitle();
            this._updateVisibility();

            this._connectSignals();
        }

        _importSettings() {
            this._centerTasks = this._settings?.get_boolean('center-tasks');
            this._showFocusedWindow = this._settings?.get_boolean('show-focused-window');
            this._hoverRaiseWindow = this._settings?.get_boolean('hover-raise-window');
            this._hoverDelay = this._settings?.get_int('hover-delay');
            this._undecoratedTaskButtons = this._settings?.get_boolean('undecorated-task-buttons');
            this._showActiveWorkspace = this._settings?.get_boolean('show-active-workspace');
            this._showWindowTitle = this._settings?.get_boolean('show-window-title');
            this._showWindowApp = this._settings?.get_boolean('show-window-app');
            this._showWindowIcon = this._settings?.get_boolean('show-window-icon');
            this._desaturateIcon = this._settings?.get_boolean('desaturate-icon');
            this._buttonWidth = this._settings?.get_int('button-width');
            this._groupWindows = this._settings?.get_boolean('group-windows');
            this._showRecentAppsMenu = this._settings?.get_boolean('show-recent-apps-menu');
            this._recentAppsListLength = this._settings?.get_int('recent-apps-list-length');
            this._animateOnClose = this._settings?.get_boolean('animate-on-close');
        }

        _connectSignals() {
            global.workspace_manager.connectObject('active-workspace-changed', () => this._updateVisibility(), this);
            global.display.connectObject('notify::focus-window', () => this._updateVisibility(), GObject.ConnectFlags.AFTER, this);

            this._window?.connectObject(
                'notify::demands-attention', () => this._updateDemandsAttention(), GObject.ConnectFlags.AFTER,
                'notify::gtk-application-id', () => this._updateApp(), GObject.ConnectFlags.AFTER,
                'notify::skip-taskbar', () => this._updateVisibility(), GObject.ConnectFlags.AFTER,
                'notify::title', () => this._updateTitle(), GObject.ConnectFlags.AFTER,
                'notify::urgent', () => this._updateDemandsAttention(), GObject.ConnectFlags.AFTER,
                'notify::wm-class', () => this._updateApp(), GObject.ConnectFlags.AFTER,
                'unmanaging', () => this._animatedDestroy(), GObject.ConnectFlags.AFTER,
                'workspace-changed', () => this._updateVisibility(), GObject.ConnectFlags.AFTER,
                this);

            this.connect('notify::hover', () => this._onHover());

            if (this._clickGesture)
                this.remove_action(this._clickGesture);
            this._clickGesture = new Clutter.ClickGesture();
            this._clickGesture.connect('recognize', gesture => this._onClick(gesture));
            this.add_action(this._clickGesture);
        }

        _disconnectSignals() {
            global.workspace_manager.disconnectObject(this);
            global.display.disconnectObject(this);

            this._window?.disconnectObject(this);
            this._app?.disconnectObject(this);
        }

        _makeButtonBox() {
            this._box = new St.BoxLayout({ reactive: true, track_hover: true });
            if (!this._showFocusedWindow && !this._undecoratedTaskButtons)
                this._box.add_style_class_name('task-box');

            if (this._showWindowTitle && this._buttonWidth > -1)
                this._box.set_style(`-st-natural-width: 9999px; max-width: ${this._buttonWidth}px;`);

            this._icon = new St.Icon({ fallback_gicon: null });
            this._box.add_child(this._icon);
            this._icon.visible = this._showWindowIcon;
            if (this._desaturateIcon) {
                const desaturate = new Clutter.DesaturateEffect();
                this._icon.add_effect(desaturate);
            }

            this._title = new St.Label({ style_class: 'task-label', y_align: Clutter.ActorAlign.CENTER });
            this._box.add_child(this._title);
            this._title.visible = this._showWindowTitle;

            this._separator = new St.Label({ text: '—', style_class: 'task-label', y_align: Clutter.ActorAlign.CENTER });
            this._box.add_child(this._separator);
            this._separator.visible = this._showWindowApp && this._showWindowTitle;

            this._appName = new St.Label({ style_class: 'task-label', y_align: Clutter.ActorAlign.CENTER });
            this._box.add_child(this._appName);
            this._appName.visible = this._showWindowApp;

            this.add_child(this._box);

            this.setMenu(new AppMenu(this));
        }

        _toggleWindow() {
            this._windowOnTop = null;

            if (this._windowIsOnActiveWorkspace && this._windowHasFocus) {
                if (this._window?.can_minimize() && !Main.overview.visible)
                    this._window?.minimize();
            } else {
                this._window?.activate(global.get_current_time());
                this._window?.focus(global.get_current_time());
            }
            Main.overview.hide();
        }

        _onClick(gesture) {
            const button = gesture?.get_button();

            switch (button) {
                case Clutter.BUTTON_PRIMARY:
                    if (this._showFocusedWindow)
                        this.menu?.toggle();
                    else
                        this._toggleWindow();
                    return Clutter.EVENT_STOP;
                    break;
                case Clutter.BUTTON_SECONDARY:
                    this.menu?.toggle();
                    return Clutter.EVENT_STOP;
                    break;
                case Clutter.BUTTON_MIDDLE:
                    if (this._app?.can_open_new_window())
                        this._app?.open_new_window(-1);
                    Main.overview.hide();
                    return Clutter.EVENT_STOP;
                    break;
                default:
                    return Clutter.EVENT_PROPAGATE;
                    break;
            }
        }

        _onHover() {
            if (!this._hoverRaiseWindow || Main.overview.visible || !Main.wm._canScroll)
                return;

            if (this.hover) {
                const monitorIndex = this._window?.get_monitor();
                const monitorWindows = this._window?.get_workspace()?.list_windows().filter(w => w.get_monitor() === monitorIndex);
                this._windowOnTop = global.display.sort_windows_by_stacking(monitorWindows)?.at(-1);

                GLib.timeout_add_once(GLib.PRIORITY_DEFAULT, this._hoverDelay, () => {
                    if (this.hover)
                        this._window?.raise();
                });
            } else
                this._windowOnTop?.raise();
        }

        _updateApp() {
            if (this._window)
                this._app = Shell.WindowTracker.get_default().get_window_app(this._window);
            if (!this._app)
                return;

            const wmClass = this._window?.wm_class;
            const icon = wmClass?.startsWith('chrome') ? Gio.Icon.new_for_string(wmClass) : this._app.icon;
            this._icon.set_gicon(icon);
            this._icon.set_icon_size(ICON_SIZE);

            this._appName.text = this._app.get_name() ?? '';

            this.menu.setApp(this._app);

            if (this._showRecentAppsMenu && this._app.app_info) {
                let recentApps = this._globalRecentApps.recentApps;
                recentApps = recentApps.filter(a => a !== this._app);
                recentApps.unshift(this._app);
                recentApps.length = Math.min(recentApps.length, this._recentAppsListLength ?? 8);
                this._globalRecentApps.recentApps = recentApps;
            }

            if (this._groupWindows)
                this._app.connectObject('windows-changed', () => this._updateVisibility(), this);
        }

        _updateDemandsAttention() {
            if (this._showFocusedWindow || this._undecoratedTaskButtons)
                return;

            if (this._window?.demands_attention) {
                this._box.add_style_class_name('task-box-demands-attention');
                this.visible = true;
            } else {
                this._box.remove_style_class_name('task-box-demands-attention');
                this._updateVisibility();
            }
        }

        _updateFocus() {
            const focusWindow = global.display.focus_window;
            this._windowHasFocus = this._window?.appears_focused || focusWindow?.get_transient_for() === this._window;

            if (this._showFocusedWindow)
                return;

            const isFocused = this._windowIsOnActiveWorkspace && this._windowHasFocus;
            if (this._undecoratedTaskButtons)
                this._box.opacity = isFocused ? 255 : UNFOCUSED_TASK_BUTTON_OPACITY;
            else
                isFocused
                    ? this._box.add_style_class_name('task-box-focus')
                    : this._box.remove_style_class_name('task-box-focus');
        }

        _updateTitle() {
            this._title.text = this._window?.title ?? '';
        }

        _updateVisibility() {
            const activeWorkspace = global.workspace_manager.get_active_workspace();
            this._windowIsOnActiveWorkspace = this._window?.located_on_workspace(activeWorkspace);

            if (this._groupWindows) {
                const appWindows = (this._app?.get_windows() ?? []).filter(w => w.window_type !== Meta.WindowType.MODAL_DIALOG);
                const appWindowsOnActiveWorkspace = appWindows?.filter(w => w.located_on_workspace(activeWorkspace));
                const candidateWindows = appWindowsOnActiveWorkspace?.length > 0 ? appWindowsOnActiveWorkspace : appWindows;
                const focusWindow = global.display.focus_window;
                const appWindowOnTop = focusWindow && candidateWindows?.includes(focusWindow)
                    ? focusWindow
                    : global.display.sort_windows_by_stacking(candidateWindows).at(-1);
                this._isAppWindowOnTop = this._window === appWindowOnTop || this._window?.get_transient_for() === appWindowOnTop;
            }

            this._updateFocus();

            this.visible = !this._window?.skip_taskbar
                && (!this._showActiveWorkspace || this._windowIsOnActiveWorkspace)
                && (!this._showFocusedWindow || this._windowHasFocus)
                && (!this._groupWindows || this._isAppWindowOnTop);
        }

        _animatedDestroy() {
            this._disconnectSignals();

            if (this._animateOnClose) {
                this.opacity = 0;
                this._box.ease({
                    width: 0,
                    duration: 150,
                    mode: Clutter.AnimationMode.EASE_OUT_QUAD,
                    onStopped: () => super.destroy(),
                });
            } else
                super.destroy();
        }

        vfunc_event(event) {
            return Clutter.EVENT_PROPAGATE;
        }

        destroy() {
            this._disconnectSignals();

            super.destroy();
        }
    });

const TasksInPanel = GObject.registerClass(
    class TasksInPanel extends GObject.Object {
        _init(settings) {
            super._init();

            this._settings = settings;

            this._showRecentAppsMenu = this._settings?.get_boolean('show-recent-apps-menu');

            this._initSettings();
            this._initTaskBar();
        }

        _connectSignals() {
            global.display.connectObject('window-created', (display, window) => this._makeTaskButton(window), this);

            if (this._settings?.get_boolean('scroll-panel'))
                Main.panel.connectObject('scroll-event', (actor, event) => Main.wm.handleWorkspaceScroll(event), this);
        }

        _disconnectSignals() {
            global.display.disconnectObject(this);
            global.workspace_manager.disconnectObject(this);

            Main.panel.disconnectObject(this);
        }

        _initSettings() {
            if (this._settings?.get_boolean('light-style'))
                this._lightStyleMode = new LightStyleMode();

            if (this._settings?.get_boolean('yaru-panel'))
                Main.panel.add_style_class_name('panel-yaru-like');

            if (this._settings?.get_boolean('accent-panel'))
                Main.panel.add_style_class_name('panel-accent');

            if (this._settings?.get_boolean('use-background-color')) {
                const style = `background-color: ${this._settings?.get_string('background-color')};`

                Main.panel.set_style(style);
                Main.panel.connectObject('style-changed', () => Main.panel.set_style(style), this);
            }

            if (this._settings?.get_boolean('show-user-id'))
                this._userIdButton = new UserIdButton();

            this._moveDate(this._settings?.get_boolean('move-date'));
            Main.panel._updatePanel();

            if (!this._settings?.get_boolean('show-activities'))
                Main.panel.statusArea.activities?.hide();

            if (this._settings?.get_boolean('show-favorites-menu'))
                this._initFavoritesMenu();

            if (this._settings?.get_boolean('show-recent-apps-menu'))
                this._initRecentAppsMenu();

            if (this._settings?.get_boolean('show-workspaces-bar'))
                this._initWorkspacesBar();

            if (this._settings?.get_boolean('show-show-desktop'))
                this._showDesktopButton = new ShowDesktopButton();
        }

        _initFavoritesMenu() {
            this._favoritesMenuButton = new FavoritesMenuButton();

            if (!Main.panel.statusArea['favoritesMenuButton'])
                Main.panel.addToStatusArea('favoritesMenuButton', this._favoritesMenuButton, 99, 'left');
        }

        _initRecentAppsMenu() {
            this._globalRecentApps = { recentApps: [] };

            this._recentAppsMenuButton = new RecentAppsMenuButton(this._globalRecentApps);

            if (!Main.panel.statusArea['recentAppsMenuButton'])
                Main.panel.addToStatusArea('recentAppsMenuButton', this._recentAppsMenuButton, 99, 'left');
        }

        _initTaskBar() {
            GLib.timeout_add_once(GLib.PRIORITY_DEFAULT, 500, () => {
                this._makeTaskbar();
            });
        }

        _initWorkspacesBar() {
            GLib.timeout_add_once(GLib.PRIORITY_DEFAULT, 500, () => {
                this._workspacesBar = new WorkspacesBar(this._settings);

                const workspacesNumber = global.workspace_manager.n_workspaces;

                for (let workspaceIndex = 0; workspaceIndex < workspacesNumber; workspaceIndex++) {
                    const workspace = global.workspace_manager.get_workspace_by_index(workspaceIndex);

                    this._makeWorkspaceButton(workspaceIndex);
                }

                global.workspace_manager.connectObject('workspace-added', (wm, index) => this._makeWorkspaceButton(index), this);
            });
        }

        _makeTaskbar() {
            const workspacesNumber = global.workspace_manager.n_workspaces;

            for (let workspaceIndex = 0; workspaceIndex < workspacesNumber; workspaceIndex++) {
                const workspace = global.workspace_manager.get_workspace_by_index(workspaceIndex);
                const windowsList = workspace?.list_windows() ?? [];
                const windowsListSorted = global.display.sort_windows_by_stacking(windowsList);

                for (const window of windowsListSorted)
                    this._makeTaskButton(window);
            }

            this._connectSignals();
        }

        _makeWorkspaceButton(index) {
            const workspace = global.workspace_manager.get_workspace_by_index(index);
            if (!workspace || !this._workspacesBar || !this._workspacesBar._box)
                return;

            for (const bin of this._workspacesBar._box.get_children()) {
                if (workspace === bin?._workspace)
                    return;
            }

            this._workspacesBar._box.add_child(new WorkspaceButton(workspace));
        }

        _makeTaskButton(window) {
            if (!window || window.skip_taskbar || window.window_type === Meta.WindowType.MODAL_DIALOG)
                return;

            new TaskButton(this._settings, this._globalRecentApps, window);

            if (this._showRecentAppsMenu) {
                GLib.idle_add_once(GLib.PRIORITY_DEFAULT, () => {
                    this._recentAppsMenuButton?._updateRecentApps();
                });
            }
        }

        _moveDate(active) {
            const panel = Main.sessionMode.panel;

            if (active) {
                panel.center = panel.center.filter(item => item !== 'dateMenu');
                if (!panel.right.includes('dateMenu'))
                    panel.right.unshift('dateMenu');
            } else {
                panel.right = panel.right.filter(item => item !== 'dateMenu');
                panel.center.unshift('dateMenu');
            }
        }

        _destroyTaskbar() {
            for (const box of [Main.panel._leftBox, Main.panel._centerBox]) {
                for (const bin of box.get_children()) {
                    const button = bin?.child;

                    if (button && button instanceof TaskButton)
                        button.destroy();
                }
            }
        }

        _destroyWorkspacesBar() {
            this._workspacesBar?.destroy();
            this._workspacesBar = null;
        }

        _destroyItems() {
            this._userIdButton?.destroy();
            this._userIdButton = null;

            this._showDesktopButton?.destroy();
            this._showDesktopButton = null;

            this._favoritesMenuButton?.destroy();
            this._favoritesMenuButton = null;

            this._recentAppsMenuButton?.destroy();
            this._recentAppsMenuButton = null;

            this._destroyWorkspacesBar();
            this._destroyTaskbar();
        }

        destroy() {
            this._disconnectSignals();

            this._lightStyleMode?.destroy();
            this._lightStyleMode = null;

            Main.panel.remove_style_class_name('panel-yaru-like');
            Main.panel.remove_style_class_name('panel-accent');
            if (this._settings?.get_boolean('use-background-color'))
                Main.panel.set_style('background-color: black;');

            Main.panel.statusArea.activities?.show();
            this._moveDate(false);

            this._destroyItems();

            Main.panel._updatePanel();

            if (this._globalRecentApps) {
                this._globalRecentApps.recentApps = null;
                this._globalRecentApps = null;
            }
        }
    });

export default class TasksInPanelExtension extends Extension {
    constructor(metadata) {
        super(metadata);
    }

    _restart() {
        this.disable();
        this.enable();
    }

    enable() {
        this._settings = this.getSettings();
        this._settings?.connectObject('changed', () => this._restart(), this);

        this._mutterSettings = new Gio.Settings({ schema_id: 'org.gnome.mutter' });
        this._mutterSettings?.connectObject('changed::dynamic-workspaces', () => this._restart(), this);

        this._tasksInPanel = new TasksInPanel(this._settings);
    }

    disable() {
        this._settings?.disconnectObject(this);
        this._settings = null;

        this._mutterSettings?.disconnectObject(this);
        this._mutterSettings = null;

        this._tasksInPanel?.destroy();
        this._tasksInPanel = null;
    }
}
