#!/bin/bash
# Script to start a live VNC Desktop inside GitHub Codespaces

echo "📦 Installing VNC, NoVNC, and desktop environment..."
sudo apt-get update
sudo apt-get install -y x11vnc novnc websockify fluxbox xterm

echo "🖥️ Starting Xvfb (Virtual Monitor) on Display :99..."
# Kill any existing Xvfb on port 99
sudo killall Xvfb 2>/dev/null || true
Xvfb :99 -screen 0 1280x720x24 &
sleep 2

export DISPLAY=:99

echo "🎨 Starting Window Manager (fluxbox)..."
fluxbox &
sleep 1

echo "🛡️ Starting x11vnc server..."
x11vnc -display :99 -forever -shared -nopw -listen localhost -xkb &
sleep 1

echo "🌐 Starting NoVNC Web Proxy on Port 6080..."
if command -v novnc_proxy &> /dev/null; then
    novnc_proxy --vnc localhost:5900 --listen 6080 &
elif [ -f /usr/share/novnc/utils/novnc_proxy ]; then
    /usr/share/novnc/utils/novnc_proxy --vnc localhost:5900 --listen 6080 &
else
    websockify --web /usr/share/novnc 6080 localhost:5900 &
fi

echo "=========================================================="
echo "🎉 LIVE DESKTOP STARTED SUCCESSFULLY!"
echo "=========================================================="
echo "👉 Instructions:"
echo "1. Go to the 'PORTS' tab at the bottom of Codespaces."
echo "2. Find port 6080, hover over the Local Address, and click the Globe icon (Open in Browser)."
echo "3. Click 'Connect' on the webpage that opens."
echo "4. In your terminal, run: export DISPLAY=:99 && node run_gamarena.js 2 1"
echo "5. Watch the browser scroll, play games, and click LIVE in the VNC tab!"
echo "=========================================================="
