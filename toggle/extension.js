import GObject from 'gi://GObject';
import Gio from 'gi://Gio';

import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as QuickSettings from 'resource:///org/gnome/shell/ui/quickSettings.js';

const SERVICE = 'charger-alerts.service';

const ChargerToggle = GObject.registerClass(
class ChargerToggle extends QuickSettings.QuickToggle {
    _init() {
        super._init({
            title: 'Charger Alerts',
            iconName: 'battery-good-charging-symbolic',
            toggleMode: true,
        });

        this.checked = false;

        this._sync();

        this.connect('clicked', () => {
            this._toggleService(this.checked);
            this._sync();
        });
    }

    _sync() {
        try {
            const proc = Gio.Subprocess.new(
                ['systemctl', '--user', 'is-active', SERVICE],
                Gio.SubprocessFlags.STDOUT_PIPE
            );

            proc.communicate_utf8_async(null, null, (p, res) => {
                try {
                    let [, out] = p.communicate_utf8_finish(res);
                    this.checked = out.trim() === 'active';
                } catch (e) {
                    logError(e);
                }
            });
        } catch (e) {
            logError(e);
        }
    }

    _toggleService(start) {
        try {
            const proc = Gio.Subprocess.new([
                    'systemctl', '--user',
                    start ? 'start' : 'stop',
                    SERVICE
                ],
                Gio.SubprocessFlags.NONE
            );
        } catch (e) {
            logError(e);
        }
    }
});

const ChargerIndicator = GObject.registerClass(
class ChargerIndicator extends QuickSettings.SystemIndicator {
    _init() {
        super._init();

        this._toggle = new ChargerToggle();
        this.quickSettingsItems.push(this._toggle);
    }

    destroy() {
        this.quickSettingsItems.forEach(item => item.destroy());
        super.destroy();
    }
});

export default class ChargerExtension extends Extension {
    enable() {
        this._indicator = new ChargerIndicator();

        Main.panel.statusArea.quickSettings.addExternalIndicator(
            this._indicator
        );
    }

    disable() {
        this._indicator?.destroy();
        this._indicator = null;
    }
}
