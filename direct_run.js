const { firefox } = require('playwright');
const { runGamingTask } = require('./automation/gaming_engagement');
require('dotenv').config();

const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0',
    'Mozilla/5.0 (Windows NT 11.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0'
];

async function runSession(sessionIndex) {
    console.log(`\n💎 [User #${sessionIndex + 1}] Launching session...`);
    
    // We are using the RAW credentials that we KNOW work for you
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
        const context = await browser.newContext({
            userAgent: USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)],
            viewport: { width: 1280, height: 720 }
        });

        const page = await context.newPage();
        
        // Anti-detect measures
        await page.addInitScript(() => {
            Object.defineProperty(navigator, 'webdriver', { get: () => false });
        });

        // This runs the "Chaos Engine" (Scroll -> Pick Game -> Stay 5 mins)
        await runGamingTask(page);

    } catch (err) {
        console.error(`❌ [User #${sessionIndex + 1}] Failed:`, err.message);
    } finally {
        await browser.close();
        console.log(`⏹️ [User #${sessionIndex + 1}] Finished.`);
    }
}

async function startParallelEngine() {
    const TOTAL_SESSIONS = 10;
    const CONCURRENT_LIMIT = 3; 
    
    console.log(`🚀 Starting ${TOTAL_SESSIONS} users (${CONCURRENT_LIMIT} at a time)...`);
    
    for (let i = 0; i < TOTAL_SESSIONS; i += CONCURRENT_LIMIT) {
        const batch = [];
        for (let j = 0; j < CONCURRENT_LIMIT && (i + j) < TOTAL_SESSIONS; j++) {
            batch.push(runSession(i + j));
        }
        await Promise.all(batch);
        console.log('⏳ Batch done. Cooling down for 10s...');
        await new Promise(r => setTimeout(r, 10000));
    }
}

startParallelEngine().catch(console.error);
