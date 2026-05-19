const axios = require('axios');

class DolphinHandler {
    constructor() {
        this.localUrl = 'http://localhost:3001/v1.0';
        this.cloudUrl = 'https://dolphin-anty-api.com';
        this.authenticated = false;
    }

    async authenticate() {
        try {
            await axios.post(`${this.localUrl}/auth/login-with-token`, { token: process.env.DOLPHIN_API_KEY });
            this.authenticated = true;
            return true;
        } catch (e) {
            return false;
        }
    }

    getHeaders() {
        return { 'Authorization': `Bearer ${process.env.DOLPHIN_API_KEY}` };
    }

    async getProfiles() {
        try {
            const response = await axios.get(`${this.cloudUrl}/browser_profiles`, {
                headers: this.getHeaders()
            });
            return response.data.data;
        } catch (e) { return []; }
    }

    async startProfile(dolphinId) {
        try {
            await this.authenticate();
            console.log(`[DOLPHIN] Launching profile ${dolphinId}...`);
            const res = await axios.get(`${this.localUrl}/browser_profiles/${dolphinId}/start`, {
                headers: this.getHeaders(),
                timeout: 30000
            });
            
            if (res.data && res.data.port) {
                return `ws://127.0.0.1:${res.data.port}/devtools/browser/`;
            }

            console.log(`[DOLPHIN] Waiting for browser window to stabilize...`);
            for (let i = 0; i < 10; i++) {
                await new Promise(r => setTimeout(r, 2000));
                const port = await this.getActivePort(dolphinId);
                if (port) return port;
            }
            return null;
        } catch (e) {
            return this.getActivePort(dolphinId);
        }
    }

    async getActivePort(dolphinId) {
        try {
            const response = await axios.get(`${this.localUrl}/browser_profiles/active`, { headers: this.getHeaders() });
            const activeList = response.data.data || response.data || [];
            
            console.log(`[DEBUG] Active List Content:`, JSON.stringify(activeList, null, 2));
            
            const active = activeList.find(p => String(p.id) === String(dolphinId) || String(p.browser_profile_id) === String(dolphinId));
            
            if (active) {
                const port = active.port || active.debug_port || (active.automation && active.automation.port);
                if (port) return `ws://127.0.0.1:${port}/devtools/browser/`;
            }

            // ULTIMATE FALLBACK: Scan for any open DevTools port
            return await this.scanForPort();
        } catch (e) { 
            return await this.scanForPort();
        }
    }

    async scanForPort() {
        // We scan common port ranges where Dolphin opens the debugger
        for (let port = 10000; port < 11000; port++) {
            try {
                const res = await axios.get(`http://127.0.0.1:${port}/json/version`, { timeout: 30 });
                if (res.data && res.data.webSocketDebuggerUrl) {
                    console.log(`[DOLPHIN] Found active connection on port ${port}`);
                    return res.data.webSocketDebuggerUrl;
                }
            } catch (err) { }
        }
        return null;
    }

    async stopProfile(dolphinId) {
        try {
            await axios.get(`${this.localUrl}/browser_profiles/${dolphinId}/stop`, { headers: this.getHeaders() });
        } catch (e) { }
    }
}

module.exports = new DolphinHandler();
