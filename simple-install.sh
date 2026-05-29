#!/bin/sh


SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
LOCAL_SHARE_DIR=~/.local/share/charger-alerts

ln -sfnv $SCRIPT_DIR $LOCAL_SHARE_DIR
ln -sfv $LOCAL_SHARE_DIR/systemd.service/charger-alerts.service ~/.config/systemd/user/charger-alerts.service
ln -sfnv $LOCAL_SHARE_DIR/toggle ~/.local/share/gnome-shell/extensions/charger-alerts@meirklemp
