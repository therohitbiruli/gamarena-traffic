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
            landed = await simulateGoogleSearch(page, startUrl);
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
        const scrolls = persona === 'hardcore' ? 5 : (persona === 'explorer' ? 4 : 2);
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
        const gameCount = 3; // Ensure exactly 3 games are visited
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
                console.log('📖 Scroll down to read instructions/details and view ads...');
                // First scroll to start reading
                await page.mouse.wheel(0, 500 + Math.random() * 300);
                await page.waitForTimeout(2000 + Math.random() * 2000);
                
                // Human-like reading mouse paths
                await page.mouse.move(100 + Math.random() * 400, 400 + Math.random() * 300, { steps: 8 });
                await page.waitForTimeout(1500 + Math.random() * 1500);

                // Second scroll further down to read the full "how to play" and trigger lower ads
                console.log('📖 Scrolling further down...');
                await page.mouse.wheel(0, 600 + Math.random() * 400);
                await page.waitForTimeout(3000 + Math.random() * 3000); // Spend time reading
                
                await page.mouse.move(200 + Math.random() * 500, 300 + Math.random() * 400, { steps: 6 });
                await page.waitForTimeout(2000 + Math.random() * 2000);

                console.log('🎮 Scroll back up to align and play game...');
                // Scroll back up to the game iframe (adjust distance for two scrolls)
                await page.mouse.wheel(0, -1500 - Math.random() * 500);
                await page.waitForTimeout(2000);
                await clearOverlays(page);

                // "Play" the game — simulate interaction
                let playTime;
                if (persona === 'hardcore') {
                    playTime = (45 + Math.random() * 30) * 1000; // 45 to 75 seconds per game
                } else {
                    playTime = (30 + Math.random() * 30) * 1000;  // 30 to 60 seconds per game
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

        // --- PHASE 4: BROWSE CONTENT ---
        // Skipped: Exit immediately after playing games as requested
        console.log('🚪 Exiting session after playing 3 games.');

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

async function simulateGoogleSearch(page, startUrl) {
    try {
        console.log('🎯 Bypassing Google CAPTCHA via direct organic referrer injection...');
        
        // Randomize Google search result parameters to prevent fingerprinting of the referrer URL
        const ids = [
            '2ahUKEwjG1rOq5sP-AhXiSmwGHV28D60QFnoECA0QAQ',
            '2ahUKEwi5m7qO6cP-AhXFSmwGHd1pD20QFnoECBMQAQ',
            '2ahUKEwjFv96Y6sP-AhXmSmwGHa9bD20QFnoECB4QAQ',
            '2ahUKEwi4n8uG68P-AhXlSmwGHb3cD20QFnoECCQQAQ',
            '2ahUKEwj7i7j0kMP-AhXpSmwGHY_cD20QFnoECA8QAQ'
        ];
        const usgs = [
            'AOvVaw193_J1-Uu15p26y08K2qXh',
            'AOvVaw218_A1-Uu22p26y08K2qXa',
            'AOvVaw156_C1-Uu18p26y08K2qXb',
            'AOvVaw314_D1-Uu12p26y08K2qXc',
            'AOvVaw254_F1-Uu16p26y08K2qXd'
        ];
        const selectedId = ids[Math.floor(Math.random() * ids.length)];
        const selectedUsg = usgs[Math.floor(Math.random() * usgs.length)];
        
        // Construct standard Google organic click referrer
        const selectedReferrer = `https://www.google.com/url?sa=t&rct=j&q=&esrc=s&source=web&cd=&ved=${selectedId}&url=${encodeURIComponent(startUrl)}&usg=${selectedUsg}`;
        
        console.log(`🌐 Landing (Injected Google Referrer): ${startUrl}`);
        await page.goto(startUrl, {
            waitUntil: 'commit',
            timeout: 60000,
            referer: selectedReferrer
        });
        return true;
    } catch (err) {
        console.warn(`⚠️ Referrer injection failed: ${err.message}.`);
        return false;
    }
}

module.exports = { runGamingTask };
