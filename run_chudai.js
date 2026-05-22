const { firefox, devices } = require('playwright');
const { runChudaiTask } = require('./automation/chudai_engagement');
require('dotenv').config();

const DESKTOP_UAS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0',
    'Mozilla/5.0 (Windows NT 11.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0'
];

const MOBILE_CONFIGS = [
    { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/122.0 Mobile/15E148 Safari/605.1.15', viewport: { width: 390, height: 844 } },
    { userAgent: 'Mozilla/5.0 (Android 14; Mobile; rv:122.0) Gecko/122.0 Firefox/122.0', viewport: { width: 360, height: 800 } },
    { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/117.0 Mobile/15E148 Safari/605.1.15', viewport: { width: 428, height: 926 } },
    { userAgent: 'Mozilla/5.0 (Android 13; Mobile; rv:109.0) Gecko/115.0 Firefox/115.0', viewport: { width: 412, height: 915 } },
    { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1', viewport: { width: 375, height: 667 } }
];

async function runSession(index) {
    const isMobile = index >= 5; 
    const personaType = isMobile ? 'MOBILE' : 'DESKTOP';
    
    console.log(`💎 [User #${index + 1} | ${personaType}] Launching (Firefox Stable Mode)...`);
    
    const proxy = {
        server: `http://${process.env.PROXY_HOST}:${process.env.PROXY_PORT}`,
        username: process.env.PROXY_USER,
        password: process.env.PROXY_PASS
    };

    const browser = await firefox.launch({ 
        headless: false,
        proxy: proxy
    });

    try {
        let contextOptions = {
            viewport: { width: 1280, height: 720 },
            userAgent: DESKTOP_UAS[Math.floor(Math.random() * DESKTOP_UAS.length)]
        };

        if (isMobile) {
            const mobileConfig = MOBILE_CONFIGS[index - 5];
            contextOptions = { 
                userAgent: mobileConfig.userAgent,
                viewport: mobileConfig.viewport
            };
            console.log(`📱 Emulating Phone...`);
        }

        const context = await browser.newContext(contextOptions);
        const page = await context.newPage();
        
        await page.addInitScript(() => {
            Object.defineProperty(navigator, 'webdriver', { get: () => false });
        });

        await runChudaiTask(page, isMobile);

    } catch (err) {
        console.error(`❌ [User #${index + 1}] Failed:`, err.message);
    } finally {
        await browser.close();
        console.log(`⏹️ [User #${index + 1}] Finished.`);
    }
}

async function startTrafficEngine() {
    const TOTAL_SESSIONS = 10;
    const CONCURRENT_LIMIT = 3; 
    
    console.log(`🚀 Starting ${TOTAL_SESSIONS} Firefox sessions (${CONCURRENT_LIMIT} concurrent)...`);
    
    for (let i = 0; i < TOTAL_SESSIONS; i += CONCURRENT_LIMIT) {
        const batch = [];
        for (let j = 0; j < CONCURRENT_LIMIT && (i + j) < TOTAL_SESSIONS; j++) {
            console.log(`⏳ Staggering launch for User #${i + j + 1}...`);
            batch.push(runSession(i + j));
            await new Promise(r => setTimeout(r, 5000));
        }
        await Promise.all(batch);
        console.log('\n⏳ Batch done. Cooling down for 20s...');
        await new Promise(r => setTimeout(r, 20000));
    }
}

startTrafficEngine().catch(console.error);
