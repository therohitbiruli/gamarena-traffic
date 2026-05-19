// No special requirements needed here

async function runChudaiTask(page, isMobile = false) {
    try {
        console.log(`🌐 [ADULT-ENGINE] Starting High-eCPM Session (Mode: ${isMobile ? 'Mobile' : 'Desktop'})`);

        const SITE_URL = 'https://onlychudai.com';
        await page.goto(SITE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
        
        // --- EXOCLICK TRIGGER 1: THE FIRST CLICK (Pop-under / Interstitial) ---
        console.log('⚡ Triggering Pop-under / Interstitial...');
        await page.mouse.click(200 + Math.random() * 200, 200 + Math.random() * 200);
        await page.waitForTimeout(3000); 

        // Handle ads
        async function clearAds() {
            try {
                const selectors = ['button:has-text("Consent")', 'span:has-text("Close")', '.close-button', '.exoclick-ad-container + .close', 'div[class*="close"]'];
                for (const selector of selectors) {
                    const el = page.locator(selector).first();
                    if (await el.isVisible()) {
                        await el.click();
                        console.log(`🛡️ Closed overlay: ${selector}`);
                    }
                }
            } catch (e) {}
        }
        await clearAds();

        // --- NAVIGATION LOOP (3-4 Videos) ---
        const videoCount = 2 + Math.floor(Math.random() * 2);
        console.log(`🌀 Plan: Engage with ${videoCount} videos.`);

        for (let v = 0; v < videoCount; v++) {
            console.log(`\n🎞️ Video ${v + 1} of ${videoCount}...`);
            
            // 1. Find and Click Video
            let videoLinks = await page.$$eval('a[href*="/video/"]', links => links.map(a => a.href));
            if (videoLinks.length > 0) {
                const target = videoLinks[Math.floor(Math.random() * Math.min(videoLinks.length, 10))];
                await page.goto(target, { waitUntil: 'domcontentloaded' });
            }

            await clearAds();

            // 2. Playback & Seeking
            try {
                const video = page.locator('video').first();
                await video.waitFor({ state: 'visible', timeout: 10000 });
                await video.click(); 
                
                const watchTime = (120 + Math.random() * 120) * 1000; // 2-4m
                console.log(`⏱️ Watching for ${Math.round(watchTime/1000)}s...`);
                
                const startWatch = Date.now();
                let hasSought = false;

                while (Date.now() - startWatch < watchTime) {
                    await page.waitForTimeout(15000);
                    process.stdout.write('🔥 ');
                    
                    // --- EXOCLICK TRIGGER 2: VIDEO SEEKING (Triggers Mid-rolls) ---
                    if (!hasSought && Math.random() > 0.5) {
                        console.log('\n⏩ Simulating Seeking (Mid-roll trigger)...');
                        await page.keyboard.press('ArrowRight'); // Skip 5s or trigger player seek
                        hasSought = true;
                    }
                    
                    await clearAds();
                }
            } catch (e) {
                console.log(`⚠️ Playback skip: ${e.message}`);
            }

            console.log('\n🔗 Switching to related content...');
        }

        console.log('✅ High-eCPM cycle complete!');

    } catch (err) {
        console.error('❌ Engagement Failed:', err.message);
    }
}

module.exports = { runChudaiTask };
