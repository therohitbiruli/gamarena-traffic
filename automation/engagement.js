const { chromium } = require('playwright-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
chromium.use(StealthPlugin());

const delay = ms => new Promise(res => setTimeout(res, ms));

async function engageOnSite(wsEndpoint) {
    let browser;
    try {
        console.log(`[ENGAGE] Connecting to browser via ${wsEndpoint}...`);
        browser = await chromium.connectOverCDP(wsEndpoint);
        const context = browser.contexts()[0] || await browser.newContext();
        const page = await context.newPage();

        // 1. Navigate to OnlyChudai
        console.log("[ENGAGE] Navigating to onlychudai.com...");
        await page.goto('https://onlychudai.com', { waitUntil: 'domcontentloaded', timeout: 60000 });
        await delay(2000 + Math.random() * 3000);

        // 2. Human-like scrolling behavior
        console.log("[ENGAGE] Performing human-like scrolling...");
        await humanLikeScroll(page);

        // 3. Find and click a random video thumbnail
        console.log("[ENGAGE] Looking for videos to watch...");
        // Select thumbnails - likely <img> inside <a> or just <a> with 'video' in URL
        const thumbnails = await page.$$('a[href*="/video/"], a[href*="/v/"], .video-thumbnail, a:has(img)');
        if (thumbnails.length > 0) {
            const randomIndex = Math.floor(Math.random() * Math.min(thumbnails.length, 10));
            console.log(`[ENGAGE] Clicking video #${randomIndex + 1}...`);
            
            // Move mouse to thumbnail before clicking
            const box = await thumbnails[randomIndex].boundingBox();
            if (box) {
                await page.mouse.move(box.x + box.width/2, box.y + box.height/2, { steps: 10 });
                await delay(500);
            }
            
            await thumbnails[randomIndex].click();
            await page.waitForLoadState('domcontentloaded');
            
            // 4. "Watch" the video for a random duration
            const watchTime = 30000 + Math.random() * 60000; // 30-90 seconds
            console.log(`[ENGAGE] Watching video for ${(watchTime/1000).toFixed(0)} seconds...`);
            
            // Perform small scrolls while watching
            let spent = 0;
            while (spent < watchTime) {
                const step = 5000 + Math.random() * 5000;
                await delay(step);
                spent += step;
                
                // Occasional jitter/scroll
                if (Math.random() > 0.5) {
                    await page.mouse.wheel(0, (Math.random() - 0.5) * 200);
                }
            }
            
            console.log("[ENGAGE] Finished watching video.");
        } else {
            console.log("[ENGAGE] Warning: Could not find any video thumbnails.");
        }

        console.log("[ENGAGE] Engagement session complete.");
    } catch (e) {
        console.error("[ENGAGE] Error during session:", e.message);
    } finally {
        if (browser) {
            // Keep it open for a moment before closing if needed, or close immediately
            await delay(2000);
            // await browser.close(); // Optional: Dolphin handler might handle closing
        }
    }
}

async function humanLikeScroll(page) {
    const scrolls = 3 + Math.floor(Math.random() * 5);
    for (let i = 0; i < scrolls; i++) {
        const amount = 300 + Math.floor(Math.random() * 500);
        await page.mouse.wheel(0, amount);
        await delay(1000 + Math.random() * 2000);
    }
}

module.exports = { engageOnSite };
