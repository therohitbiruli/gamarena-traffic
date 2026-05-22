const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth')();
chromium.use(stealth);

const ProxyChain = require('proxy-chain');
const { runGamingTask } = require('./automation/gaming_engagement');
require('dotenv').config();

// US Desktop User Agents (high CPM)
const DESKTOP_UAS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:126.0) Gecko/20100101 Firefox/126.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15',
];

const VIEWPORTS = [
    { width: 1920, height: 1080 },
    { width: 1366, height: 768 },
    { width: 1536, height: 864 },
    { width: 1440, height: 900 },
    { width: 1280, height: 720 },
];

async function runSession(index) {
    const ua = DESKTOP_UAS[Math.floor(Math.random() * DESKTOP_UAS.length)];
    const vp = VIEWPORTS[Math.floor(Math.random() * VIEWPORTS.length)];
    const sessionId = Math.random().toString(36).substring(2, 10);

    console.log(`\n💎 [Session #${index + 1}] Launching...`);
    console.log(`   🖥️ ${vp.width}x${vp.height}`);

    // Build proxy URL with auth — proxy-chain handles auth bridging
    const username = `${process.env.PROXY_USER}-resi_region-US_California`;
    const proxyUrl = `http://${encodeURIComponent(username)}:${encodeURIComponent(process.env.PROXY_PASS)}@${process.env.PROXY_HOST}:${process.env.PROXY_PORT}`;
    
    // Create local anonymous proxy (handles auth for us)
    const localProxy = await ProxyChain.anonymizeProxy(proxyUrl);
    console.log(`   🔗 Proxy bridge: ${localProxy}`);

    let browser = null;
    try {
        const isHeadless = process.env.HEADLESS === 'true';

        browser = await chromium.launch({
            headless: isHeadless, // Default to headful (false) to bypass Cloudflare. Use XVFB on Linux.
            proxy: { server: localProxy },
            args: [
                '--disable-blink-features=AutomationControlled',
                '--disable-gpu',
                '--mute-audio',
                '--disable-dev-shm-usage',
                '--js-flags="--max-old-space-size=256"',
                '--disable-software-rasterizer'
            ]
        });

        const context = await browser.newContext({
            viewport: vp,
            userAgent: ua,
            locale: 'en-US',
            timezoneId: 'America/Los_Angeles',
            recordVideo: {
                dir: 'videos/',
                size: vp
            }
        });

        // Block fonts to save bandwidth
        await context.route('**/*.{woff,woff2,ttf,otf}', r => r.abort());

        await context.addInitScript(() => {
            Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
        });

        const page = await context.newPage();
        page.setDefaultTimeout(60000);

        // Verify IP
        try {
            await page.goto('https://api.ipify.org?format=json', { timeout: 10000 });
            const body = await page.innerText('body');
            const ip = JSON.parse(body).ip;
            console.log(`   ✅ IP: ${ip}`);
        } catch(e) {
            console.log(`   ⚠️ IP check skipped`);
        }

        // Run engagement
        await runGamingTask(page);

        // Log video path if successfully created
        try {
            const video = page.video();
            if (video) {
                const videoPath = await video.path();
                console.log(`   📹 Video saved: ${videoPath.split('/').pop()}`);
            }
        } catch (e) {
            // Silence video path errors
        }

        return true;

    } catch (err) {
        console.error(`   ❌ [Session #${index + 1}] Failed:`, err.message);
        return false;
    } finally {
        // Safe cleanup with timeouts to prevent hanging the runner
        try {
            if (browser) {
                await Promise.race([
                    browser.close(),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Browser close timeout')), 5000))
                ]);
            }
        } catch (e) {
            console.error(`   ⚠️ Browser close: ${e.message}`);
        }
        try {
            // Pass true to force close all active connections on the proxy
            await ProxyChain.closeAnonymizedProxy(localProxy, true);
        } catch (e) {
            console.error(`   ⚠️ Proxy close: ${e.message}`);
        }
        console.log(`   ⏹️ [Session #${index + 1}] Done.`);
    }
}

async function startTraffic() {
    const TOTAL = parseInt(process.argv[2]) || 5;
    const CONCURRENT = parseInt(process.argv[3]) || 2;

    console.log('🚀 ═══════════════════════════════════════════');
    console.log(`   GamArena Traffic Engine (Proxy Bridge Mode)`);
    console.log(`   Target: https://aarifalam.life`);
    console.log(`   Sessions: ${TOTAL} | Concurrent: ${CONCURRENT}`);
    console.log(`   Proxy: ${process.env.PROXY_HOST}:${process.env.PROXY_PORT}`);
    console.log('🚀 ═══════════════════════════════════════════\n');

    for (let i = 0; i < TOTAL; i += CONCURRENT) {
        const batch = [];
        for (let j = 0; j < CONCURRENT && (i + j) < TOTAL; j++) {
            await new Promise(r => setTimeout(r, 3000 + Math.random() * 2000));
            
            const sessionIndex = i + j;
            batch.push((async () => {
                let success = false;
                let attempts = 0;
                while (!success && attempts < 3) {
                    attempts++;
                    if (attempts > 1) {
                        console.log(`\n🔄 [Session #${sessionIndex + 1}] Retrying session (Attempt ${attempts}/3) with a fresh IP...`);
                        await new Promise(r => setTimeout(r, 5000)); // wait 5s before retry
                    }
                    success = await runSession(sessionIndex);
                }
                if (!success) {
                    console.error(`\n❌ [Session #${sessionIndex + 1}] Failed completely after 3 attempts.`);
                }
            })());
        }
        await Promise.all(batch);

        if (i + CONCURRENT < TOTAL) {
            const cooldown = 10000 + Math.random() * 10000;
            console.log(`\n⏳ Cooldown ${Math.round(cooldown/1000)}s before next batch...\n`);
            await new Promise(r => setTimeout(r, cooldown));
        }
    }

    console.log('\n✅ ALL SESSIONS COMPLETE!');
}

startTraffic().catch(console.error);
