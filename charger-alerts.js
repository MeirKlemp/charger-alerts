import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import Gdk from 'gi://Gdk?version=4.0';
import Gtk from 'gi://Gtk?version=4.0';

const STATUS_DISCHARGING = "Discharging";
const BATTERY_MIN = 40;
const BATTERY_MAX = 90;
const SLEEP_SECONDS = 60;
const TIMES_TILL_GIVEUP = 10;

function show_dialog(message) {
    let window = new Gtk.Window();
    window.set_title("Dummy Window");
    window.fullscreen();

    let dialog = new Gtk.MessageDialog({
        transient_for: window,
        message_type: Gtk.MessageType.INFO,
        buttons: Gtk.ButtonsType.OK,
        text: message,
        title: "Battery Notification",
        modal: true,
    });

    dialog.connect('response', (widget, response) => {
        widget.destroy();
        window.destroy();
    });

    window.show();
    dialog.show();
 }

let times_failed = 0;
let alert_to_plug = true;
let alert_to_unplug = true;
let prev_charging_status = null;

function check_battery() {
    let [bl_success, battery_level] = GLib.spawn_command_line_sync('cat /sys/class/power_supply/BAT0/capacity');
    let [cs_success, charging_status] = GLib.spawn_command_line_sync('cat /sys/class/power_supply/BAT0/status');

    if (bl_success && cs_success) {
        battery_level = new TextDecoder('utf-8').decode(battery_level).trim();
        battery_level = parseInt(battery_level);
        charging_status = new TextDecoder('utf-8').decode(charging_status).trim();

        console.log("--------------------");
        console.log("battery:", battery_level);
        console.log("status:", charging_status);
        console.log("prev status:", prev_charging_status);
        console.log("alert to plug:", alert_to_plug);
        console.log("alert to unplug:", alert_to_unplug);

        if (alert_to_plug && charging_status === STATUS_DISCHARGING && battery_level <= BATTERY_MIN) {
            console.log("Showing dialog because battery is", battery_level + "%");
            show_dialog("Battery is at " + battery_level + "%. Please plug in the charger.");
            alert_to_plug = false;
        } else if (alert_to_unplug && charging_status !== STATUS_DISCHARGING && battery_level >= BATTERY_MAX) {
            console.log("Showing dialog because battery is", battery_level + "%");
            show_dialog("Battery is at " + battery_level + "%. Please unplug the charger.");
            alert_to_unplug = false;
        }

        if (prev_charging_status !== charging_status && (!alert_to_plug || !alert_to_unplug)) {
            alert_to_plug = true;
            alert_to_unplug = true;
        }

        prev_charging_status = charging_status
    } else {
        times_failed += 1;
        console.error(
            "Coudln't get battery & charging information:",
            "Times Tried:", times_failed,
            "Battery Level Success =", bl_success,
            "Charging Status Success =", cs_success,
        );
    }

    if (times_failed < TIMES_TILL_GIVEUP) {
        return true;
    } else {
        console.error("Failed", times_failed, "times, giving up...");
        return false;
    }
}

Gtk.init();
const loop = new GLib.MainLoop(null, false);

check_battery();
GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, SLEEP_SECONDS, () => {
    if (check_battery()) {
        return true;
    } else {
        loop.quit();
        return false;
    }
});

await loop.runAsync();
