import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';
import Adw from 'gi://Adw';

import { ExtensionPreferences } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';


export default class TasksInPanelPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        window._settings = this.getSettings();

        const page = new Adw.PreferencesPage({
            title: 'Tasks in Panel extension',
            icon_name: 'dialog-information-symbolic',
        });
        window.add(page);


        /* Global */

        const groupGlobal = new Adw.PreferencesGroup({
            title: 'Global',
        });
        page.add(groupGlobal);

        const lightStyle = new Adw.SwitchRow({
            title: 'Light style mode',
            subtitle: 'GNOME Shell items follow dark/light style toggle.',
        });
        groupGlobal.add(lightStyle);
        window._settings.bind('light-style', lightStyle, 'active', Gio.SettingsBindFlags.DEFAULT);

        const yaruPanel = new Adw.SwitchRow({
            title: 'Yaru-like panel',
            subtitle: 'Dark grey or white background, normal-weighted fonts.',
        });
        groupGlobal.add(yaruPanel);
        window._settings.bind('yaru-panel', yaruPanel, 'active', Gio.SettingsBindFlags.DEFAULT);

        const accentPanel = new Adw.SwitchRow({
            title: 'Accent-colored panel',
            subtitle: 'Background color is based on GNOME accent color.',
        });
        groupGlobal.add(accentPanel);
        window._settings.bind('accent-panel', accentPanel, 'active', Gio.SettingsBindFlags.DEFAULT);

        const scrollPanel = new Adw.SwitchRow({
            title: 'Scroll on panel to switch workspace',
        });
        groupGlobal.add(scrollPanel);
        window._settings.bind('scroll-panel', scrollPanel, 'active', Gio.SettingsBindFlags.DEFAULT);


        /* Indicators */

        const groupIndicators = new Adw.PreferencesGroup({
            title: 'Indicators',
        });
        page.add(groupIndicators);

        const showPowerProfile = new Adw.SwitchRow({
            title: 'Show power profile indicator',
            subtitle: 'Scroll to change power profile.',
        });
        groupIndicators.add(showPowerProfile);
        window._settings.bind('show-power-profile', showPowerProfile, 'active', Gio.SettingsBindFlags.DEFAULT);

        const showUserId = new Adw.SwitchRow({
            title: 'Show user name',
        });
        groupIndicators.add(showUserId);
        window._settings.bind('show-user-id', showUserId, 'active', Gio.SettingsBindFlags.DEFAULT);

        const moveDate = new Adw.SwitchRow({
            title: 'Move date menu button to the right',
        });
        groupIndicators.add(moveDate);
        window._settings.bind('move-date', moveDate, 'active', Gio.SettingsBindFlags.DEFAULT);

        const showActivities = new Adw.SwitchRow({
            title: 'Show activities indicator',
        });
        groupIndicators.add(showActivities);
        window._settings.bind('show-activities', showActivities, 'active', Gio.SettingsBindFlags.DEFAULT);

        const showWorkspacesBar = new Adw.SwitchRow({
            title: 'Show workspaces bar',
        });
        groupIndicators.add(showWorkspacesBar);
        window._settings.bind('show-workspaces-bar', showWorkspacesBar, 'active', Gio.SettingsBindFlags.DEFAULT);

        const showFavoritesMenu = new Adw.SwitchRow({
            title: 'Show favorites menu button',
        });
        groupIndicators.add(showFavoritesMenu);
        window._settings.bind('show-favorites-menu', showFavoritesMenu, 'active', Gio.SettingsBindFlags.DEFAULT);

        const centerTasks = new Adw.SwitchRow({
            title: 'Move tasks to the center',
            subtitle: 'Tasks are by default located at the left.',
        });
        groupIndicators.add(centerTasks);
        window._settings.bind('center-tasks', centerTasks, 'active', Gio.SettingsBindFlags.DEFAULT);


        /* Tasks */

        const groupTasks = new Adw.PreferencesGroup({
            title: 'Tasks',
        });
        page.add(groupTasks);

        const showWindowIcon = new Adw.SwitchRow({
            title: 'Show window icon',
        });
        groupTasks.add(showWindowIcon);
        window._settings.bind('show-window-icon', showWindowIcon, 'active', Gio.SettingsBindFlags.DEFAULT);

        const showWindowTitle = new Adw.SwitchRow({
            title: 'Show window title',
        });
        groupTasks.add(showWindowTitle);
        window._settings.bind('show-window-title', showWindowTitle, 'active', Gio.SettingsBindFlags.DEFAULT);

        const showOnlyActiveWorkspace = new Adw.SwitchRow({
            title: 'Show on active workspace only',
        });
        groupTasks.add(showOnlyActiveWorkspace);
        window._settings.bind('show-active-workspace', showOnlyActiveWorkspace, 'active', Gio.SettingsBindFlags.DEFAULT);

        const showFocusedWindow = new Adw.SwitchRow({
            title: 'Show focused window only',
        });
        groupTasks.add(showFocusedWindow);
        window._settings.bind('show-focused-window', showFocusedWindow, 'active', Gio.SettingsBindFlags.DEFAULT);

        const hoverRaiseWindow = new Adw.SwitchRow({
            title: 'Raise window on hover',
        });
        groupTasks.add(hoverRaiseWindow);
        window._settings.bind('hover-raise-window', hoverRaiseWindow, 'active', Gio.SettingsBindFlags.DEFAULT);

        const adjustmentRaiseWindowDelay = new Gtk.Adjustment({
            lower: 0,
            upper: 1000,
            step_increment: 50,
        });

        const raiseWindowDelay = new Adw.SpinRow({
            title: 'Raise window on hover delay (ms)',
            adjustment: adjustmentRaiseWindowDelay,
        });
        groupTasks.add(raiseWindowDelay);
        window._settings.bind('hover-delay', raiseWindowDelay, 'value', Gio.SettingsBindFlags.DEFAULT);

        const desaturateIcon = new Adw.SwitchRow({
            title: 'Monochrome icon',
            subtitle: 'Some apps do not have a symbolic icon, so simply monochrome here.',
        });
        groupTasks.add(desaturateIcon);
        window._settings.bind('desaturate-icon', desaturateIcon, 'active', Gio.SettingsBindFlags.DEFAULT);

        const adjustmentButtonWidth = new Gtk.Adjustment({
            lower: -1,
            upper: 999,
            step_increment: 10,
        });

        const buttonWidth = new Adw.SpinRow({
            title: 'Task button natural width (px)',
            subtitle: 'Will be reduced if the available width is insufficient.\nSet -1 for fitted width.',
            adjustment: adjustmentButtonWidth,
        });
        groupTasks.add(buttonWidth);
        window._settings.bind('button-width', buttonWidth, 'value', Gio.SettingsBindFlags.DEFAULT);
    }
}
