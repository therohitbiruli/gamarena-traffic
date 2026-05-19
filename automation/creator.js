const { chromium } = require('playwright');
const dolphin = require('./dolphin_handler.js');
require('dotenv').config();

const delay = ms => new Promise(res => setTimeout(res, ms));

class MobileGmailCreator {
    constructor(profileId) {
        this.profileId = profileId;
        this.browser = null;
        this.page = null;
        this.dolphinId = null;
        this.currentIp = 'Manual Mode';
    }

    async init() {
        console.log(`[INIT] Dolphin Manual Integration for Profile: ${this.profileId}`);
        
        // 1. Ensure Profile
        this.dolphinId = await dolphin.ensureProfile(this.profileId);
        if (!this.dolphinId) throw new Error("Could not link/create Dolphin profile.");

        // 2. Proxy
        const sessionChars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        let sessionId = '';
        for (let i = 0; i < 8; i++) sessionId += sessionChars.charAt(Math.floor(Math.random() * sessionChars.length));
        
        await dolphin.updateProxy(this.dolphinId, {
            host: process.env.PROXY_HOST,
            port: process.env.PROXY_PORT,
            username: process.env.PROXY_USER,
            password: `${process.env.PROXY_PASS}_session-${sessionId}_lifetime-10m`
        });

        // 3. Start
        const wsEndpoint = await dolphin.startProfile(this.dolphinId);
        if (!wsEndpoint) throw new Error("Dolphin Local API error.");

        if (wsEndpoint === 'MANUAL_OK') {
            console.log(`[INIT] Profile ${this.profileId} started in MANUAL mode (free plan).`);
            return;
        }

        // 4. Connect Playwright (Only if on Paid plan)
        try {
            this.browser = await chromium.connectOverCDP(wsEndpoint);
            const context = this.browser.contexts()[0];
            await context.route('**/*.{png,jpg,jpeg,gif,webp,svg,woff,woff2,ttf,otf}', r => r.abort());
            this.page = context.pages()[0] || await context.newPage();
            this.page.setDefaultTimeout(30000);
            
            // Try to get IP
            await this.page.goto('https://api.ipify.org?format=json', { timeout: 10000 }).catch(() => null);
            const body = await this.page.innerText('body').catch(() => null);
            if (body && body.includes('ip')) {
                this.currentIp = JSON.parse(body).ip;
            }
        } catch (e) {
            console.log(`[INIT] Playwright connection skipped (Normal for Manual Mode).`);
        }
    }

    async close() {
        try {
            if (this.browser) await this.browser.close().catch(() => {});
            if (this.dolphinId) await dolphin.stopProfile(this.dolphinId);
        } catch (e) { }
        finally {
            this.browser = null;
            this.page = null;
        }
    }
}

module.exports = MobileGmailCreator;
