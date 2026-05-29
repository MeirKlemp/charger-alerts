import GObject from 'gi://GObject';
import Gio from 'gi://Gio';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as QuickSettings from 'resource:///org/gnome/shell/ui/quickSettings.js';

const SERVICE_NAME = 'charger-alert.service';

const ChargerToggle = GObject.registerClass(
class ChargerToggle extends QuickSettings.QuickMenuToggle {
    _init() {
        super._init({
            title: 'Charger Alerts',
            iconName: 'battery-good-symbolic',
            toggleMode: true,
        });

        this.checked = false;
        this._sync();

        this.connect('clicked', () => {
            this.checked = !this.checked;
            this._apply();
        });
    }

    _run(argv) {
        Gio.Subprocess.new(argv, Gio.SubprocessFlags.NONE);
    }

    _sync() {
        try {
            let proc = Gio.Subprocess.new(
                ['systemctl', '--user', 'is-active', SERVICE_NAME],
                Gio.SubprocessFlags.STDOUT_PIPE
            );

            proc.communicate_utf8_async(null, null, (p, res) => {
                let [, out] = p.communicate_utf8_finish(res);
                this.checked = out.trim() === 'active';
                this.subtitle = this.checked ? 'Enabled' : 'Disabled';
            });
        } catch (e) {
            logError(e);
        }
    }

    _apply() {
        this._run([
            'systemctl',
            '--user',
            this.checked ? 'start' : 'stop',
            SERVICE_NAME
        ]);

        this.subtitle = this.checked ? 'Enabled' : 'Disabled';
    }
});

const ChargerIndicator = GObject.registerClass(
class ChargerIndicator extends QuickSettings.SystemIndicator {
    _init() {
        super._init();

        this._toggle = new ChargerToggle();
        this.quickSettingsItems.push(this._toggle);
    }
});

let indicator;

export function init() {}

export function enable() {
    indicator = new ChargerIndicator();

    Main.panel.statusArea.quickSettings.addExternalIndicator(indicator);
}

export function disable() {
    indicator?.destroy();
    indicator = null;
}
