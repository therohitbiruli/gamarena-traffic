const { chromium } = require('playwright');
const delay = ms => new Promise(res => setTimeout(res, ms));

(async () => {
    console.log("🚀 Starting Agentic Backdoor Test with IPRoyal Proxy...");
    const browser = await chromium.launch({ 
        headless: false,
        proxy: {
            server: 'http://geo.iproyal.com:11200',
            username: 'bNGqd0Wc69NxWh7P',
            password: 'OcyWrr6NG8znObH7'
        }
    });

    // Spoof a highly trusted Mobile Android Device (Pixel 7)
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36',
        viewport: { width: 412, height: 915 },
        deviceScaleFactor: 2.625,
        isMobile: true,
        hasTouch: true
    });

    const page = await context.newPage();
    try {
        console.log("Spotify -> Google Backdoor: Navigating...");
        await page.goto('https://www.spotify.com/us/signup', { waitUntil: 'domcontentloaded' });
        await delay(2000);

        console.log("Clicking Sign up with Google...");
        const popupPromise = page.waitForEvent('popup');
        await page.locator('button:has-text("Sign up with Google")').first().click({ force: true });
        
        const popup = await popupPromise;
        await popup.waitForLoadState('domcontentloaded');
        console.log(`Popup loaded URL: ${popup.url()}`);
        await delay(3000);

        console.log("Looking for Create account...");
        const createBtn = popup.locator('button:has-text("Create account"), span:has-text("Create account")').first();
        if (await createBtn.isVisible()) {
            await createBtn.click({ force: true });
            console.log("Clicked Create Account!");
            await delay(1000);
            
            const personalUse = popup.locator('li:has-text("For my personal use"), span:has-text("For my personal use")').first();
            if (await personalUse.isVisible()) {
                await personalUse.click();
            }
            console.log("✅ Successfully hit the Google Account creation via Backdoor!");
            console.log("Please check your screen - you can manually try filling it in from here and see if it asks for a QR code.");
        } else {
            console.log("Could not find Create Account in popup.");
        }

    } catch (e) {
        console.error("Test failed: ", e);
    }
})();
