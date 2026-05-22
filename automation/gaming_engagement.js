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
        // Weighted persona selection: 35% casual, 35% explorer, 20% gamer, 10% hardcore
        const rand = Math.random();
        let persona = 'casual';
        if (rand < 0.35) {
            persona = 'casual';
        } else if (rand < 0.70) {
            persona = 'explorer';
        } else if (rand < 0.90) {
            persona = 'gamer';
        } else {
            persona = 'hardcore';
        }

        if (persona === 'hardcore') {
            console.log(`🔥 Persona: ${persona} (Hardcore Session: 10+ min, 5 games)`);
        } else {
            console.log(`🎭 Persona: ${persona}`);
        }

        // Random referrer
        const referrer = REFERRERS[Math.floor(Math.random() * REFERRERS.length)];
        if (referrer) console.log(`🔗 Referrer: ${referrer.split('?')[0]}...`);

        // --- PHASE 1: LANDING ---
        const startUrl = PAGES.landing[Math.floor(Math.random() * PAGES.landing.length)];
        let landed = false;

        // 70% chance to simulate organic search via Google to boost CPM
        if (Math.random() < 0.70) {
            landed = await simulateGoogleSearch(page);
        }

        if (!landed) {
            console.log(`🌐 Landing (Direct/Referrer fallback): ${startUrl}`);
            await page.goto(startUrl, { 
                waitUntil: 'commit', 
                timeout: 60000,
                referer: referrer || undefined
            });
        }
        
        // Wait for full page load
        await page.waitForLoadState('domcontentloaded').catch(() => {});
        await page.waitForTimeout(3000 + Math.random() * 2000);

        // Handle overlays/consent
        await clearOverlays(page);

        // --- PHASE 2: NATURAL SCROLLING ---
        console.log('📜 Scrolling...');
        const scrolls = persona === 'hardcore' ? 10 : (persona === 'explorer' ? 6 : 3);
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
        const gameCount = persona === 'hardcore' ? 5 : (persona === 'gamer' ? 3 : 2);
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

                // --- NEW HUMAN SCROLLING/READING LOOP ---
                console.log('📖 Scroll down to read instructions/details...');
                // Scroll down 600-800 pixels
                await page.mouse.wheel(0, 600 + Math.random() * 200);
                await page.waitForTimeout(3000 + Math.random() * 3000); // Read for 3-6s
                
                // Human-like reading mouse paths
                await page.mouse.move(100 + Math.random() * 400, 400 + Math.random() * 300, { steps: 8 });
                await page.waitForTimeout(2000 + Math.random() * 2000);

                console.log('🎮 Scroll back up to align and play game...');
                // Scroll back up to the game iframe
                await page.mouse.wheel(0, -900);
                await page.waitForTimeout(2000);
                await clearOverlays(page);

                // "Play" the game — simulate interaction
                let playTime;
                if (persona === 'hardcore') {
                    playTime = (100 + Math.random() * 80) * 1000; // 1.6 to 3 min per game
                } else {
                    playTime = (60 + Math.random() * 90) * 1000;  // 1 to 2.5 min per game
                }
                console.log(`⏱️ Playing for ${Math.round(playTime / 1000)}s...`);

                const start = Date.now();
                let lastScrollTime = Date.now();

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

                    // Occasional mid-game scroll check (every 30-40 seconds)
                    if (Date.now() - lastScrollTime > (30000 + Math.random() * 10000)) {
                        console.log('📖 Mid-game scroll down to check details...');
                        await page.mouse.wheel(0, 500);
                        await page.waitForTimeout(3000 + Math.random() * 2000);
                        await page.mouse.wheel(0, -500);
                        await page.waitForTimeout(2000);
                        lastScrollTime = Date.now();
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

        // --- PHASE 4: BROWSE CONTENT (explorer & hardcore users do this) ---
        if ((persona === 'explorer' || persona === 'hardcore') && Math.random() > 0.3) {
            const contentPage = PAGES.content[Math.floor(Math.random() * PAGES.content.length)];
            console.log(`📖 Reading: ${contentPage}`);
            await page.goto(contentPage, { waitUntil: 'commit', timeout: 60000 });
            await page.waitForTimeout(3000);

            // Scroll through content
            const readScrolls = persona === 'hardcore' ? 8 : 4;
            for (let i = 0; i < readScrolls; i++) {
                await page.mouse.wheel(0, 300 + Math.random() * 300);
                await page.waitForTimeout(2000 + Math.random() * 3000);
            }
        }

        console.log('✅ Session complete!');

    } catch (err) {
        console.error('❌ Task Error:', err.message);
        throw err;
    }
}

async function handleGoogleVignette(page) {
    try {
        if (page.url().includes('#google_vignette')) {
            console.log('🛡️ Google Vignette detected!');
            
            // Wait 4-9 seconds to look like a human reading the ad
            const waitBeforeAction = 4000 + Math.random() * 5000;
            await page.waitForTimeout(waitBeforeAction);

            const closeBtnSelectors = [
                '#dismiss-button',
                '[aria-label="Close ad"]',
                'div[role="button"]:has-text("Close")',
                'span:has-text("Close")',
                'button:has-text("Close")',
                'text=Close',
                '.dismiss-button',
                '#dismiss'
            ];

            // Scan all frames for one containing a close button
            const frames = page.frames();
            let adFrame = null;
            let foundCloseBtn = null;

            for (const f of frames) {
                const url = f.url() || '';
                const name = f.name() || '';
                if (url.includes('googleads') || name.includes('ad_iframe') || name.includes('google_ads_iframe') || name.includes('aswift')) {
                    for (const sel of closeBtnSelectors) {
                        try {
                            const btn = f.locator(sel).first();
                            if (await btn.isVisible({ timeout: 200 }).catch(() => false)) {
                                adFrame = f;
                                foundCloseBtn = btn;
                                console.log(`🎯 Found close button inside ad frame using: "${sel}"`);
                                break;
                            }
                        } catch (err) {}
                    }
                }
                if (adFrame) break;
            }

            // If we didn't find the frame through the normal scan, check the main page as a fallback
            if (!foundCloseBtn) {
                for (const sel of closeBtnSelectors) {
                    try {
                        const btn = page.locator(sel).first();
                        if (await btn.isVisible({ timeout: 200 }).catch(() => false)) {
                            foundCloseBtn = btn;
                            console.log(`🎯 Found close button on main page using: "${sel}"`);
                            break;
                        }
                    } catch (err) {}
                }
            }

            if (foundCloseBtn) {
                // 8% organic chance to click the ad (helps with CTR and looks highly real)
                const shouldClickAd = Math.random() < 0.08; 
                
                if (shouldClickAd && adFrame) {
                    console.log('🖱️ Clicking Google Vignette ad organically...');
                    const adLink = adFrame.locator('a, canvas, #ad_canvas, .creative').first();
                    if (await adLink.isVisible().catch(() => false)) {
                        const popupPromise = page.context().waitForEvent('page', { timeout: 10000 }).catch(() => null);
                        await adLink.click({ force: true }).catch(() => {});
                        
                        const popup = await popupPromise;
                        if (popup) {
                            console.log(`🔗 Opened advertiser page: ${popup.url()}`);
                            // Wait on advertiser page for 15-30 seconds to simulate real human visit
                            await popup.waitForLoadState('domcontentloaded').catch(() => {});
                            await popup.waitForTimeout(15000 + Math.random() * 15000);
                            await popup.close().catch(() => {});
                            console.log('❌ Closed advertiser page.');
                        }
                        return;
                    }
                }

                console.log('❌ Clicking close button to dismiss Vignette.');
                await foundCloseBtn.click({ force: true }).catch(() => {});
                await page.waitForTimeout(2000);
            } else {
                // Ultimate Fallback: Press Escape key twice
                console.log('⌨️ Close button not found. Pressing Escape key to dismiss Vignette...');
                await page.keyboard.press('Escape');
                await page.waitForTimeout(1000);
                await page.keyboard.press('Escape');
                await page.waitForTimeout(2000);
            }
        }
    } catch (e) {
        console.error('⚠️ Error handling vignette:', e.message);
    }
}

async function clearOverlays(page) {
    try {
        // Handle Google Vignette interstitial ads
        await handleGoogleVignette(page);

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

async function simulateGoogleSearch(page) {
    try {
        console.log('🔍 Navigating to Google to perform search...');
        await page.goto('https://www.google.com', { waitUntil: 'domcontentloaded', timeout: 30000 });
        
        // Reject/Accept Google Consent banners if visible
        const consentButtons = [
            'button:has-text("Accept all")',
            'button:has-text("I agree")',
            '#L2AGLb'
        ];
        for (const btnSelector of consentButtons) {
            const btn = page.locator(btnSelector).first();
            if (await btn.isVisible({ timeout: 1500 }).catch(() => false)) {
                await btn.click().catch(() => {});
                await page.waitForTimeout(1000);
            }
        }

        // Locate search bar
        const searchBar = page.locator('textarea[name="q"], input[name="q"], [aria-label="Search"]').first();
        if (!(await searchBar.isVisible({ timeout: 5000 }).catch(() => false))) {
            throw new Error('Search input not found on Google.');
        }

        // Type query naturally
        const query = 'GAMARENA | Play 1000+ Free Browser Games - No Login';
        console.log(`⌨️ Typing query: "${query}"`);
        await searchBar.click();
        await page.keyboard.type(query, { delay: 50 + Math.random() * 80 });
        await page.waitForTimeout(500 + Math.random() * 500);
        await page.keyboard.press('Enter');

        // Wait for results
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(2000 + Math.random() * 2000);

        // Check for Google CAPTCHA / Unusual Traffic Block page
        const pageText = await page.innerText('body').catch(() => '');
        if (
            pageText.includes('unusual traffic') || 
            pageText.includes('reCAPTCHA') || 
            pageText.includes('detected unusual') || 
            await page.locator('iframe[src*="recaptcha"]').isVisible({ timeout: 500 }).catch(() => false)
        ) {
            console.log('🚨 Google CAPTCHA detected! Throwing error to force IP rotation...');
            throw new Error('Google CAPTCHA triggered (bad proxy IP reputation).');
        }

        // Find and click target link containing aarifalam.life
        const targetLink = page.locator('a[href*="aarifalam.life"]').first();
        if (await targetLink.isVisible({ timeout: 8000 }).catch(() => false)) {
            console.log('🎯 Found site link in Google search results. Clicking...');
            await targetLink.click();
            return true;
        } else {
            console.log('⚠️ Could not find link in Google search results.');
            return false;
        }
    } catch (err) {
        if (err.message.includes('CAPTCHA')) {
            throw err; // bubble up captcha errors to force proxy rotation
        }
        console.warn(`⚠️ Google search simulation failed: ${err.message}. Falling back to direct visit.`);
        return false;
    }
}

module.exports = { runGamingTask };
