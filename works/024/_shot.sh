#!/bin/zsh
# shot.sh <url> <out.png> [w] [h] [budget]
HS=$(ls -d ~/Library/Caches/ms-playwright/chromium_headless_shell-1254/chrome-headless-shell-mac-arm64/chrome-headless-shell)
UD=$(mktemp -d)
W=${3:-1200}; H=${4:-1500}; B=${5:-6000}
$HS --no-sandbox --enable-unsafe-swiftshader --ignore-gpu-blocklist --hide-scrollbars --force-device-scale-factor=1 --window-size=$W,$H --virtual-time-budget=$B --timeout=40000 --user-data-dir=$UD --screenshot=$2 "$1" >/dev/null 2>&1 &
PID=$!
( sleep 60; kill -9 $PID 2>/dev/null ) &
wait $PID
rm -rf $UD
