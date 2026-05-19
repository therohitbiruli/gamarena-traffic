const Dolphin = require('./dolphin_handler');
const AdbHandler = require('./adb_handler');
const { chromium } = require('playwright');
const axios = require('axios');
require('dotenv').config();

const SITE_URL = 'https://onlychudai.com';
const DESKTOP_PROFILES = [
    '772440227', // Profile 5
    '772440188', // Profile 4
    '772440139', // Profile 3
    '772440068', // Profile 2
    '771556673'  // Gmail Base
];

const MOBILE_WORKERS = [0, 1, 2, 3, 4]; // LDPlayer indices Worker-1 to Worker-5

class TrafficSimulator {
    constructor() {
        this.proxyConfig = {
            host: process.env.PROXY_HOST,
            port: parseInt(process.env.PROXY_PORT),
            username: process.env.PROXY_USER,
            password: process.env.PROXY_PASS
        };
    }

    async runDesktopSession(profileId) {
        console.log(`\n--- [DESKTOP] Starting Session for Profile ${profileId} ---`);
        
        // 1. Inject fresh US Proxy
        const sessionUser = `${this.proxyConfig.username}_country-us_session-${Math.random().toString(36).substring(7)}`;
        await Dolphin.updateProxy(profileId, {
            ...this.proxyConfig,
            username: sessionUser
        });

        // 2. Start Dolphin
        const wsEndpoint = await Dolphin.startProfile(profileId);
        if (!wsEndpoint || wsEndpoint === 'MANUAL_OK') {
            console.error(`[DESKTOP] Profile ${profileId} automation bridge unavailable.`);
            return;
        }

        const browser = await chromium.connectOverCDP(wsEndpoint);
        const context = browser.contexts()[0];
        const page = context.pages()[0] || await context.newPage();

        try {
            await this.performDesktopEngagement(page);
        } catch (e) {
            console.error(`[DESKTOP] Engagement Error:`, e.message);
        } finally {
            await browser.close();
            await Dolphin.stopProfile(profileId);
        }
    }

    async performDesktopEngagement(page) {
        console.log(`[ENGAGE] Navigating to ${SITE_URL}...`);
        await page.goto(SITE_URL, { waitUntil: 'networkidle' });

        // Search for video thumbnail
        console.log(`[ENGAGE] Searching for video...`);
        const videoLinks = await page.$$eval('a[href*="/video/"]', links => links.map(a => a.href));
        
        if (videoLinks.length > 0) {
            const randomVideo = videoLinks[Math.floor(Math.random() * Math.min(videoLinks.length, 5))];
            await page.goto(randomVideo, { waitUntil: 'networkidle' });
            
            // Watch & Interact
            await this.videoEngagementLoop(page);
        } else {
            console.log(`[ENGAGE] No videos found, performing generic browsing.`);
            await page.mouse.wheel(0, 1000);
            await page.waitForTimeout(5000);
        }
    }

    async videoEngagementLoop(page) {
        try {
            console.log(`[ENGAGE] Watching video...`);
            await page.waitForSelector('video', { timeout: 10000 });
            await page.click('video');
            
            // Watch for 3-5 minutes
            const watchTime = (Math.floor(Math.random() * 3) + 3) * 60 * 1000;
            console.log(`[ENGAGE] Watching for ${watchTime/1000}s...`);
            await page.waitForTimeout(watchTime);

            // Click related video
            console.log(`[ENGAGE] Clicking related video...`);
            const related = await page.$$('a[href*="/video/"]');
            if (related.length > 5) {
                await related[Math.floor(Math.random() * 5) + 5].click(); 
                await page.waitForLoadState('networkidle');
                
                // Watch second video for 2-4 minutes
                const secondWatch = (Math.floor(Math.random() * 3) + 2) * 60 * 1000;
                console.log(`[ENGAGE] Watching second video for ${secondWatch/1000}s...`);
                await page.waitForTimeout(secondWatch);
            }
        } catch (e) {
            console.log(`[ENGAGE] Interaction skipped: ${e.message}`);
        }
    }

    async runMobileSession(index) {
        console.log(`\n--- [MOBILE] Starting Session for Worker-${index + 1} ---`);
        const adb = new AdbHandler(index);
        
        try {
            await adb.start();
            
            // Navigate to URL
            console.log(`[MOBILE] Opening browser to ${SITE_URL}...`);
            adb.exec(`shell am start -a android.intent.action.VIEW -d ${SITE_URL}`);
            await new Promise(r => setTimeout(r, 10000));

            // Perform basic interactions (Scroll, Tap)
            console.log(`[MOBILE] Simulating engagement...`);
            for (let i = 0; i < 5; i++) {
                console.log(`[MOBILE] Scrolling...`);
                await adb.swipe(500, 1500, 500, 500, 800);
                await new Promise(r => setTimeout(r, 5000));
                
                if (i === 1) {
                    console.log(`[MOBILE] Tapping center (likely video)...`);
                    await adb.tap(500, 1000);
                    // Stay for 3 mins
                    await new Promise(r => setTimeout(r, 180000));
                }
            }
            
            console.log(`[MOBILE] Session complete.`);
        } catch (e) {
            console.error(`[MOBILE] Error:`, e.message);
        } finally {
            await adb.stop();
        }
    }

    async start() {
        console.log(`🚀 STARTING GLOBAL TRAFFIC SIMULATION (5 DESKTOP + 5 MOBILE)`);
        
        // We'll alternate between Desktop and Mobile
        for (let i = 0; i < 5; i++) {
            // Run Desktop
            try {
                await this.runDesktopSession(DESKTOP_PROFILES[i]);
            } catch (e) {}

            // Run Mobile
            try {
                await this.runMobileSession(MOBILE_WORKERS[i]);
            } catch (e) {}

            console.log(`\n[CYCLE] Finished pair ${i+1}/5. Cooldown before next...`);
            await new Promise(r => setTimeout(r, 30000));
        }
        
        console.log(`\n✅ ALL 10 SESSIONS COMPLETE.`);
    }
}

const simulator = new TrafficSimulator();
simulator.start();
