#!/bin/sh


SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
LOCAL_SHARE_DIR=~/.local/share/charger-alerts

mkdir -p ~/.config/systemd/user
mkdir -p ~/.local/share/gnome-shell/extensions

ln -sfnv $SCRIPT_DIR $LOCAL_SHARE_DIR
ln -sfv "$LOCAL_SHARE_DIR/systemd.service/charger-alerts.service" ~/.config/systemd/user/charger-alerts.service
ln -sfnv "$LOCAL_SHARE_DIR/toggle" ~/.local/share/gnome-shell/extensions/charger-alerts@meirklemp

systemctl --user daemon-reload
systemctl --user enable charger-alerts.service

gnome-extensions enable charger-alerts@meirklemp

echo "Now restart GNOME Shell (Alt+F2 → r, or log out/in)"
