// GamArena Traffic Engagement Script
// Simulates realistic US gamer browsing aarifalam.life

const SITE = 'https://aarifalam.life';

const PAGES = {
    landing: [SITE, `${SITE}/games`],
    browse: [`${SITE}/games`, `${SITE}/featured`, `${SITE}/new`],
    content: [`${SITE}/blog`, `${SITE}/about`],
};

// Referrer sources to look organic
const REFERRERS = [
    'https://www.google.com/search?q=free+browser+games',
    'https://www.google.com/search?q=html5+games+online+free',
    'https://www.google.com/search?q=play+games+no+download',
    'https://www.google.com/search?q=best+free+online+games+2026',
    'https://www.google.com/search?q=gamarena+games',
    'https://www.bing.com/search?q=free+browser+games',
    '', // Direct visit
];

async function runGamingTask(page) {
    try {
        // Random persona
        const personas = ['casual', 'explorer', 'gamer'];
        const persona = personas[Math.floor(Math.random() * personas.length)];
        console.log(`🎭 Persona: ${persona}`);

        // Random referrer
        const referrer = REFERRERS[Math.floor(Math.random() * REFERRERS.length)];
        if (referrer) console.log(`🔗 Referrer: ${referrer.split('?')[0]}...`);

        // --- PHASE 1: LANDING ---
        const startUrl = PAGES.landing[Math.floor(Math.random() * PAGES.landing.length)];
        console.log(`🌐 Landing: ${startUrl}`);
        await page.goto(startUrl, { 
            waitUntil: 'commit', 
            timeout: 60000,
            referer: referrer || undefined
        });
        // Wait for full page load after commit
        await page.waitForLoadState('domcontentloaded').catch(() => {});
        
        // Wait for page to render + ads to load
        await page.waitForTimeout(3000 + Math.random() * 2000);

        // Handle overlays/consent
        await clearOverlays(page);

        // --- PHASE 2: NATURAL SCROLLING ---
        console.log('📜 Scrolling...');
        const scrolls = persona === 'explorer' ? 6 : 3;
        for (let i = 0; i < scrolls; i++) {
            // Smooth scroll with random distance
            await page.mouse.wheel(0, 200 + Math.random() * 400);
            await page.waitForTimeout(1500 + Math.random() * 2500);
            
            // Random mouse movements (looks human)
            await page.mouse.move(
                100 + Math.random() * 800, 
                100 + Math.random() * 500, 
                { steps: 5 + Math.floor(Math.random() * 10) }
            );

            await clearOverlays(page);
        }

        // --- PHASE 3: CLICK INTO GAMES ---
        const gameCount = persona === 'gamer' ? 3 : 2;
        console.log(`🎮 Will visit ${gameCount} games...`);

        for (let g = 0; g < gameCount; g++) {
            // Find game links
            let gameLinks = await page.$$eval(
                'a[href*="/game/"], a[href*="/games/"]', 
                links => links
                    .map(a => a.href)
                    .filter(h => h !== window.location.href && !h.endsWith('/games') && !h.endsWith('/games/'))
            );

            if (gameLinks.length === 0) {
                // Try navigating to games page first
                console.log('🔍 No games found, going to /games...');
                await page.goto(`${SITE}/games`, { waitUntil: 'commit', timeout: 60000 });
                await page.waitForTimeout(3000);
                gameLinks = await page.$$eval(
                    'a[href*="/game/"], a[href*="/games/"]',
                    links => links
                        .map(a => a.href)
                        .filter(h => !h.endsWith('/games') && !h.endsWith('/games/'))
                );
            }

            if (gameLinks.length > 0) {
                // Pick random game
                const shuffled = gameLinks.sort(() => Math.random() - 0.5);
                const game = shuffled[0];
                console.log(`\n🕹️ [${g + 1}/${gameCount}] Opening: ${game}`);

                await page.goto(game, { waitUntil: 'commit', timeout: 60000 });
                await page.waitForTimeout(3000);
                await clearOverlays(page);

                // "Play" the game — simulate interaction
                const playTime = (60 + Math.random() * 90) * 1000; // 1-2.5 min per game
                console.log(`⏱️ Playing for ${Math.round(playTime / 1000)}s...`);

                const start = Date.now();
                while (Date.now() - start < playTime) {
                    // Mouse movements (simulates playing)
                    await page.mouse.move(
                        200 + Math.random() * 600,
                        150 + Math.random() * 400,
                        { steps: 5 }
                    );

                    // Occasional clicks (game interaction)
                    if (Math.random() > 0.6) {
                        await page.mouse.click(
                            300 + Math.random() * 400,
                            200 + Math.random() * 300
                        );
                    }

                    // Occasional keyboard (game controls)
                    if (Math.random() > 0.7) {
                        const keys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'];
                        await page.keyboard.press(keys[Math.floor(Math.random() * keys.length)]);
                    }

                    await page.waitForTimeout(8000 + Math.random() * 7000);
                    process.stdout.write('🎮 ');
                    await clearOverlays(page);
                }
                console.log('');
            } else {
                console.log('⚠️ No game links found, skipping.');
            }
        }

        // --- PHASE 4: BROWSE CONTENT (some users do this) ---
        if (persona === 'explorer' && Math.random() > 0.4) {
            const contentPage = PAGES.content[Math.floor(Math.random() * PAGES.content.length)];
            console.log(`📖 Reading: ${contentPage}`);
            await page.goto(contentPage, { waitUntil: 'commit', timeout: 60000 });
            await page.waitForTimeout(3000);

            // Scroll through content
            for (let i = 0; i < 4; i++) {
                await page.mouse.wheel(0, 300 + Math.random() * 300);
                await page.waitForTimeout(2000 + Math.random() * 3000);
            }
        }

        console.log('✅ Session complete!');

    } catch (err) {
        console.error('❌ Task Error:', err.message);
    }
}

async function clearOverlays(page) {
    try {
        const selectors = [
            'button:has-text("Consent")',
            'button:has-text("Accept")',
            'button:has-text("I agree")',
            'button:has-text("Got it")',
            'span:has-text("Close")',
            '.close-button',
            '[aria-label="Close"]',
        ];
        for (const sel of selectors) {
            const el = page.locator(sel).first();
            if (await el.isVisible({ timeout: 500 }).catch(() => false)) {
                await el.click().catch(() => {});
                console.log(`🛡️ Closed: ${sel}`);
            }
        }
    } catch (e) {}
}

module.exports = { runGamingTask };
