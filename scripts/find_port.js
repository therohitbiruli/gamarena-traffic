const axios = require('axios');

async function findPort() {
    const ports = [9222, 31427, 29157, 45507];
    console.log("Searching for active DevTools ports...");
    
    for (const port of ports) {
        try {
            console.log(`Checking port ${port}...`);
            const res = await axios.get(`http://127.0.0.1:${port}/json/version`, { timeout: 1000 });
            if (res.data && res.data.webSocketDebuggerUrl) {
                console.log(`✅ FOUND! Port: ${port}`);
                console.log(`WebSocket: ${res.data.webSocketDebuggerUrl}`);
                return;
            }
        } catch (e) {
            // ignore
        }
    }
    console.log("❌ No DevTools ports found. Please ensure the profile is RUNNING.");
}
findPort();
