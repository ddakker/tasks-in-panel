//    Tasks in panel
//    GNOME Shell extension
//    @fthx 2025
//    Light style mode copied from @fmuellner GNOME official extension
//    Power profile indicator copied from @fthx dedicated extension (help of @fmuellner)


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
const FAVORITES_ICON_NAME = 'starred-symbolic'; // favorites symbolic icon name

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

const PowerProfileIndicator = GObject.registerClass(
    class PowerProfileIndicator extends SystemIndicator {
        _init() {
            super._init();

            this._indicator = this._addIndicator();

            this._setIcon();
            this.get_parent()?.connectObject('notify::allocation', () => this._setIcon(), this);

            this.connectObject('scroll-event', (actor, event) => this._onScroll(event), this);
        }

        _setIcon() {
            if (this._toggle)
                return;

            Main.panel.statusArea.quickSettings?.addExternalIndicator(this);
            this.get_parent()?.set_child_above_sibling(this, null);

            this._toggle = Main.panel.statusArea.quickSettings?._powerProfiles?.quickSettingsItems[0];
            this._toggle?.bind_property('icon-name', this._indicator, 'icon-name', GObject.BindingFlags.SYNC_CREATE);
        }

        _setProfile(profile) {
            if (this._toggle?._proxy)
                this._toggle._proxy.ActiveProfile = profile;
        }

        _onScroll(event) {
            const activeProfile = this._toggle?._proxy?.ActiveProfile;
            const availableProfiles = this._toggle?._proxy?.Profiles?.map(p => p.Profile.unpack()).reverse();
            const activeProfileIndex = availableProfiles?.indexOf(activeProfile);

            let newProfile = activeProfile;

            switch (event?.get_scroll_direction()) {
                case Clutter.ScrollDirection.UP:
                    newProfile = availableProfiles[Math.max(activeProfileIndex - 1, 0)];
                    this._setProfile(newProfile);
                    break;
                case Clutter.ScrollDirection.DOWN:
                    newProfile = availableProfiles[Math.min(activeProfileIndex + 1, availableProfiles.length - 1)];
                    this._setProfile(newProfile);
                    break;
            }

            return Clutter.EVENT_STOP;
        }

        destroy() {
            this.get_parent()?.disconnectObject(this);

            this._indicator?.destroy();
            this._indicator = null;

            super.destroy();
        }
    });

const UserIdButton = GObject.registerClass(
    class UserIdButton extends SystemIndicator {
        _init() {
            super._init()

            this._indicator = this._addIndicator();

            const userId = new St.Label({ text: `${GLib.get_real_name()}  `, y_align: Clutter.ActorAlign.CENTER });
            this.add_child(userId);

            Main.panel.statusArea.quickSettings?.addExternalIndicator(this);
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
            super._init(0.0);

            this._makeButtonBox();

            AppFavorites.getAppFavorites()?.connectObject('changed', () => this._updateFavorites(), this);
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
                this.menu.addMenuItem(item);

                item?.connectObject('activate', () => this._activateFavorite(favorite), this);
            }
        }

        _activateFavorite(favorite) {
            if (favorite?.can_open_new_window())
                favorite?.open_new_window(-1);
        }

        destroy() {
            this.menu?.removeAll();
            AppFavorites.getAppFavorites()?.disconnectObject(this);

            super.destroy();
        }
    });

const WorkspacesBar = GObject.registerClass(
    class WorkspacesBar extends PanelMenu.Button {
        _init() {
            super._init();
            this.reactive = false;

            this._box = new St.BoxLayout();
            this.add_child(this._box);

            if (!Main.panel.statusArea['workspacesBarButton'])
                Main.panel.addToStatusArea('workspacesBarButton', this, 0, 'left');
        }

        destroy() {
            this._box.destroy_all_children();

            super.destroy();
        }
    });

const WorkspaceButton = GObject.registerClass(
    class WorkspaceButton extends St.Bin {
        _init(workspace) {
            super._init({ reactive: true });

            this._workspace = workspace;

            this._makeButtonBox();

            this._updateIndex();
            this._updateFocus();

            this._connectSignals();
        }

        _connectSignals() {
            global.workspace_manager.connectObject(
                'active-workspace-changed', () => this._updateFocus(),
                'workspace-removed', () => this._onWorkspaceRemoved(),
                'notify::n-workspaces', () => this._onWorkspaceRemoved(),
                this);
            this._workspace?.connectObject('notify::workspace-index', () => this._updateIndex(), this);
            this.connectObject('button-press-event', (widget, event) => this._onClick(event), this);
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

        _onClick(event) {
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
        _init(settings, window) {
            super._init();

            this._settings = settings;
            this._window = window;

            this._makeButtonBox();

            this._updateApp();
            this._updateTitle();
            this._updateVisibility();

            const windowId = this._window?.get_id();
            const buttonId = `taskButton${windowId}`;

            let side;
            if (this._settings?.get_boolean('center-tasks'))
                side = 'center';
            else
                side = 'left';

            if (windowId && !Main.panel.statusArea[buttonId])
                Main.panel.addToStatusArea(buttonId, this, 99, side);

            this._connectSignals();
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
                'unmanaging', () => this.destroy(), GObject.ConnectFlags.AFTER,
                'workspace-changed', () => this._updateVisibility(), GObject.ConnectFlags.AFTER,
                this);

            this.connectObject(
                'notify::hover', () => this._onHover(),
                'button-press-event', (actor, event) => this._onClick(event),
                this);
        }

        _disconnectSignals() {
            global.workspace_manager.disconnectObject(this);
            global.display.disconnectObject(this);

            this._window?.disconnectObject(this);
        }

        _makeButtonBox() {
            this._box = new St.BoxLayout({ reactive: true, track_hover: true, style_class: 'task-box' });

            const buttonWidth = this._settings?.get_int('button-width');
            if (this._settings?.get_boolean('show-window-title') && buttonWidth > -1)
                this._box.set_style(`-st-natural-width: 9999px; max-width: ${buttonWidth}px;`);

            this._icon = new St.Icon({ fallback_gicon: null });
            this._box.add_child(this._icon);
            this._icon.visible = this._settings?.get_boolean('show-window-icon');
            if (this._settings?.get_boolean('desaturate-icon')) {
                const desaturate = new Clutter.DesaturateEffect();
                this._icon.add_effect(desaturate);
            }

            this._title = new St.Label({ style_class: 'task-label', y_align: Clutter.ActorAlign.CENTER });
            this._box.add_child(this._title);
            this._title.visible = this._settings?.get_boolean('show-window-title');

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

        _onClick(event) {
            if (this._settings?.get_boolean('show-focused-window'))
                return Clutter.EVENT_PROPAGATE;

            const button = event?.get_button();

            if (button === Clutter.BUTTON_PRIMARY) {
                this.menu?.close();

                this._toggleWindow();

                return Clutter.EVENT_STOP;
            }

            if (button === Clutter.BUTTON_MIDDLE) {
                this.menu?.close();

                if (this._app?.can_open_new_window())
                    this._app?.open_new_window(-1);
                Main.overview.hide();

                return Clutter.EVENT_STOP;
            }

            return Clutter.EVENT_PROPAGATE;
        }

        _onHover() {
            if (!this._settings?.get_boolean('hover-raise-window') || Main.overview.visible || !Main.wm._canScroll)
                return;

            if (this.hover) {
                const monitorIndex = this._window?.get_monitor();
                const monitorWindows = this._window?.get_workspace()?.list_windows()
                    .filter(w => !w.minimized && w.get_monitor() === monitorIndex);
                this._windowOnTop = global.display.sort_windows_by_stacking(monitorWindows)?.at(-1);

                this._raiseWindowTimeout = GLib.timeout_add(GLib.PRIORITY_DEFAULT, this._settings?.get_int('hover-delay'), () => {
                    if (this.hover)
                        this._window?.raise();

                    this._raiseWindowTimeout = null;
                    return GLib.SOURCE_REMOVE;
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
            if (wmClass?.startsWith('chrome'))
                this._icon.set_gicon(Gio.Icon.new_for_string(wmClass));
            else
                this._icon.set_gicon(this._app.icon);

            this.menu.setApp(this._app);

            this._icon.set_icon_size(ICON_SIZE);
        }

        _updateDemandsAttention() {
            if (this._settings?.get_boolean('show-focused-window'))
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
            this._windowHasFocus = this._window?.appears_focused || (focusWindow?.get_transient_for() === this._window);

            if (this._settings?.get_boolean('show-focused-window'))
                return;

            if (this._windowIsOnActiveWorkspace && this._windowHasFocus)
                this._box.add_style_class_name('task-box-focus');
            else
                this._box.remove_style_class_name('task-box-focus');
        }

        _updateTitle() {
            this._title.text = this._window?.title ?? '';
        }

        _updateVisibility() {
            this._activeWorkspace = global.workspace_manager.get_active_workspace();
            this._windowIsOnActiveWorkspace = this._window?.located_on_workspace(this._activeWorkspace);

            this._updateFocus();

            this.visible = !this._window?.skip_taskbar
                && (!this._settings?.get_boolean('show-active-workspace') || this._windowIsOnActiveWorkspace)
                && (!this._settings?.get_boolean('show-focused-window') || this._windowHasFocus);
        }

        destroy() {
            this._disconnectSignals();

            if (this._raiseWindowTimeout) {
                GLib.Source.remove(this._raiseWindowTimeout);
                this._raiseWindowTimeout = null;
            }

            super.destroy();
        }
    });

const TasksInPanel = GObject.registerClass(
    class TasksInPanel extends GObject.Object {
        _init(settings) {
            super._init();

            this._settings = settings;

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

            Main.panel.statusArea.activities.visible = this._settings?.get_boolean('show-activities');

            if (this._settings?.get_boolean('show-user-id'))
                this._userIdButton = new UserIdButton();

            if (this._settings?.get_boolean('show-power-profile'))
                this._powerProfileIndicator = new PowerProfileIndicator();

            this._moveDate(this._settings?.get_boolean('move-date'));

            if (this._settings?.get_boolean('show-favorites-menu'))
                this._initFavoritesMenu();

            if (this._settings?.get_boolean('show-workspaces-bar'))
                this._initWorkspacesBar();
        }

        _initFavoritesMenu() {
            this._favoritesMenuButton = new FavoritesMenuButton();

            if (!Main.panel.statusArea['favoritesMenuButton'])
                Main.panel.addToStatusArea('favoritesMenuButton', this._favoritesMenuButton, 99, 'left');
        }

        _initTaskBar() {
            this._makeTaskBarTimeout = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 500, () => {
                this._makeTaskbar();

                this._makeTaskBarTimeout = null;
                return GLib.SOURCE_REMOVE;
            });
        }

        _initWorkspacesBar() {
            this._makeWorkspacesBarTimeout = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 500, () => {
                this._workspacesBar = new WorkspacesBar();

                const workspacesNumber = global.workspace_manager.n_workspaces;

                for (let workspaceIndex = 0; workspaceIndex < workspacesNumber; workspaceIndex++) {
                    const workspace = global.workspace_manager.get_workspace_by_index(workspaceIndex);

                    this._makeWorkspaceButton(workspaceIndex);
                }

                global.workspace_manager.connectObject('workspace-added', (wm, index) => this._makeWorkspaceButton(index), this);

                this._makeWorkspacesBarTimeout = null;
                return GLib.SOURCE_REMOVE;
            });
        }

        _destroyFavoritesMenuButton() {
            this._favoritesMenuButton?.destroy();
            this._favoritesMenuButton = null;
        }

        _destroyTaskbar() {
            if (this._makeTaskBarTimeout) {
                GLib.Source.remove(this._makeTaskBarTimeout);
                this._makeTaskBarTimeout = null;
            }

            for (const box of [Main.panel._leftBox, Main.panel._centerBox]) {
                for (const bin of box.get_children()) {
                    const button = bin?.child;

                    if (button && button instanceof TaskButton)
                        button.destroy();
                }
            }
        }

        _destroyWorkspacesBar() {
            if (this._makeWorkspacesBarTimeout) {
                GLib.Source.remove(this._makeWorkspacesBarTimeout);
                this._makeWorkspacesBarTimeout = null;
            }

            this._workspacesBar?.destroy();
            this._workspacesBar = null;
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

            new TaskButton(this._settings, window);
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

            Main.panel._updatePanel();
        }

        destroy() {
            this._lightStyleMode?.destroy();
            Main.panel.remove_style_class_name('panel-yaru-like');
            Main.panel.remove_style_class_name('panel-accent');
            Main.panel.statusArea.activities.visible = true;
            this._userIdButton?.destroy();
            this._powerProfileIndicator?.destroy();
            this._moveDate(false);

            this._disconnectSignals();

            this._destroyFavoritesMenuButton();
            this._destroyWorkspacesBar();
            this._destroyTaskbar();
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

        this._tasksInPanel = new TasksInPanel(this._settings);
    }

    disable() {
        this._settings?.disconnectObject(this);
        this._settings = null;

        this._tasksInPanel?.destroy();
        this._tasksInPanel = null;
    }
}
