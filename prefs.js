import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';
import Adw from 'gi://Adw';

import { ExtensionPreferences } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';


export default class PowerProfilePreferences extends ExtensionPreferences {
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

        const yaruPanel = new Adw.SwitchRow({
            title: 'Yaru-like panel',
            subtitle: 'Dark grey background, normal-weighted fonts',
        });
        groupGlobal.add(yaruPanel);
        window._settings.bind('yaru-panel', yaruPanel, 'active', Gio.SettingsBindFlags.DEFAULT);


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

        const moveDate = new Adw.SwitchRow({
            title: 'Move date to the right',
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
            subtitle: 'Tasks are by default located at the left',
        });
        groupIndicators.add(centerTasks);
        window._settings.bind('center-tasks', centerTasks, 'active', Gio.SettingsBindFlags.DEFAULT);


        /* Tasks */

        const groupTasks = new Adw.PreferencesGroup({
            title: 'Tasks',
        });
        page.add(groupTasks);

        const showWindowIcon = new Adw.SwitchRow({
            title: 'Show window icon inside task button',
        });
        groupTasks.add(showWindowIcon);
        window._settings.bind('show-window-icon', showWindowIcon, 'active', Gio.SettingsBindFlags.DEFAULT);

        const showWindowTitle = new Adw.SwitchRow({
            title: 'Show window title inside task button',
        });
        groupTasks.add(showWindowTitle);
        window._settings.bind('show-window-title', showWindowTitle, 'active', Gio.SettingsBindFlags.DEFAULT);

        const showOnlyActiveWorkspace = new Adw.SwitchRow({
            title: 'Show only tasks on active workspace',
        });
        groupTasks.add(showOnlyActiveWorkspace);
        window._settings.bind('show-active-workspace', showOnlyActiveWorkspace, 'active', Gio.SettingsBindFlags.DEFAULT);

        const showFocusedWindow = new Adw.SwitchRow({
            title: 'Show only task for focused window',
        });
        groupTasks.add(showFocusedWindow);
        window._settings.bind('show-focused-window', showFocusedWindow, 'active', Gio.SettingsBindFlags.DEFAULT);











        /*
                
                
        
        
                
        
                
        
                const coloredDot = new Adw.SwitchRow({
                    title: 'Colored running app indicator',
                    subtitle: 'Accent color is used',
                });
                groupStyle.add(coloredDot);
                window._settings.bind('colored-dot', coloredDot, 'active', Gio.SettingsBindFlags.DEFAULT);
        
                const adjustmentButtonMargin = new Gtk.Adjustment({
                    lower: 0,
                    upper: 20,
                    step_increment: 1,
                });
        
                const buttonMargin = new Adw.SpinRow({
                    title: 'App button horizontal margin',
                    subtitle: 'Default: 2px',
                    adjustment: adjustmentButtonMargin
                });
                groupStyle.add(buttonMargin);
                window._settings.bind('button-margin', buttonMargin, 'value', Gio.SettingsBindFlags.DEFAULT);
        
                const adjustmentPanelHeight = new Gtk.Adjustment({
                    lower: 16,
                    upper: 64,
                    step_increment: 1,
                });
        
                const panelHeight = new Adw.SpinRow({
                    title: 'Top panel height',
                    subtitle: 'Default: 32px\nVisible height will be changed according to the scale factor',
                    adjustment: adjustmentPanelHeight
                });
                groupStyle.add(panelHeight);
                window._settings.bind('panel-height', panelHeight, 'value', Gio.SettingsBindFlags.DEFAULT);
        
                const adjustmentIconSize = new Gtk.Adjustment({
                    lower: 12,
                    upper: 56,
                    step_increment: 1,
                });
        
                const iconSize = new Adw.SpinRow({
                    title: 'Icon size',
                    subtitle: 'Default: 20px\nVisible size will be changed according to the scale factor',
                    adjustment: adjustmentIconSize
                });
                groupStyle.add(iconSize);
                window._settings.bind('icon-size', iconSize, 'value', Gio.SettingsBindFlags.DEFAULT);*/
    }
}
