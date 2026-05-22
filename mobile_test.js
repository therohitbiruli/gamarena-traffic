const { chromium } = require('playwright');
const delay = ms => new Promise(res => setTimeout(res, ms));

// Randomizer functions
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);

(async () => {
    console.log("🚀 Starting Agentic Direct Mobile Test with IPRoyal Proxy...");
    const browser = await chromium.launch({ 
        headless: false,
        proxy: {
            server: 'http://geo.iproyal.com:11200',
            username: 'bNGqd0Wc69NxWh7P',
            password: 'OcyWrr6NG8znObH7'
        }
    });

    // Spoof a highly trusted Mobile Android Device (Galaxy S23)
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Linux; Android 14; SM-S911B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.6261.90 Mobile Safari/537.36',
        viewport: { width: 412, height: 915 },
        deviceScaleFactor: 3,
        isMobile: true,
        hasTouch: true,
        locale: 'en-US',
        geolocation: { longitude: -122.4194, latitude: 37.7749 },
        permissions: ['geolocation']
    });

    const page = await context.newPage();

    async function fillAndVerify(selector, value) {
        const el = page.locator(selector).first();
        await el.click({ force: true, timeout: 5000 }).catch(() => {});
        await delay(200);
        await el.fill('', { force: true, timeout: 5000 }).catch(() => {});
        await delay(100);
        await el.pressSequentially(value, { delay: randomInt(40, 90), timeout: 5000 }).catch(() => {});
        await delay(500);
    }

    try {
        console.log("Navigating to Google.com organically...");
        await page.goto('https://www.google.com/?hl=en', { waitUntil: 'domcontentloaded' });
        await delay(3000);

        // Aggressively accept cookies
        const cookieOptions = [
            page.getByRole('button', { name: /Accept all/i }),
            page.locator('button:has-text("Accept all")')
        ];
        for (const cookieBtn of cookieOptions) {
            if (await cookieBtn.first().isVisible().catch(() => false)) {
                await cookieBtn.first().click({ force: true }).catch(() => {});
                break;
            }
        }
        await delay(1500);

        console.log("Clicking Sign In...");
        const signInBtn = page.locator('a:has-text("Sign in")').first();
        if (await signInBtn.isVisible()) {
            await signInBtn.click();
            await delay(4000);
        }

        console.log("Clicking Create account...");
        const createBtn = page.locator('button:has-text("Create account"), [role="button"]:has-text("Create account")').first();
        if (await createBtn.isVisible()) {
            await createBtn.click({ force: true });
            await delay(1500);
            
            const personalUse = page.locator('li:has-text("For my personal use"), span:has-text("For my personal use")').first();
            if (await personalUse.isVisible()) {
                await personalUse.click({ force: true });
            }
            await delay(4000);
        }

        console.log("Filling Name: Isabella Torres...");
        await fillAndVerify('input[name="firstName"]', "Isabella");
        await fillAndVerify('input[name="lastName"]', "Torres");
        
        console.log("Pressing Enter to proceed...");
        await page.keyboard.press('Enter');
        await delay(4000);

        console.log("Filling Birthday (May 24 1996)...");
        await fillAndVerify('input[name="day"], #day', "24");
        await fillAndVerify('input[name="year"], #year', "1996");
        
        const monthDropdown = page.locator('[name="month"], #month').first();
        if (await monthDropdown.isVisible()) {
            const nativeSelect = await monthDropdown.evaluate(el => el.tagName === 'SELECT').catch(() => false);
            if (nativeSelect) {
                await monthDropdown.selectOption({ value: "5" }).catch(() => {});
            } else {
                await monthDropdown.click({ force: true });
                await delay(500);
                const mayOption = page.locator('[data-value="5"], li:has-text("May")').first();
                if (await mayOption.isVisible()) await mayOption.click({ force: true });
            }
            await delay(500);
        }

        const genderDropdown = page.locator('[name="gender"], #gender').first();
        if (await genderDropdown.isVisible()) {
            const nativeSelect = await genderDropdown.evaluate(el => el.tagName === 'SELECT').catch(() => false);
            if (nativeSelect) {
                await genderDropdown.selectOption({ value: "2" }).catch(() => {});
            } else {
                await genderDropdown.click({ force: true });
                await delay(500);
                const femaleOption = page.locator('[data-value="2"], li:has-text("Female")').first();
                if (await femaleOption.isVisible()) await femaleOption.click({ force: true });
            }
            await delay(500);
        }

        console.log("Pressing Enter to proceed...");
        await page.keyboard.press('Enter');
        await delay(4000);

        console.log("Choosing Username: isabellatorres6031...");
        const customRadios = page.locator('input[type="radio"], div[role="radio"]');
        if (await customRadios.count() > 2) {
             await customRadios.last().click({ force: true }).catch(() => {});
             await delay(1000);
        }
        await fillAndVerify('input[name="Username"]', "isabellatorres603123");
        await page.keyboard.press('Enter');
        await delay(4000);

        console.log("Setting Password...");
        await fillAndVerify('input[name="Passwd"]', "GlobalTest123!@#");
        await fillAndVerify('input[name="PasswdAgain"]', "GlobalTest123!@#");
        
        console.log("Hitting Final Next!");
        await page.keyboard.press('Enter');
        
        console.log("✅ Script finished. Check browser to see if it asks for QR code or Phone Verification.");

    } catch (e) {
        console.error("Test failed: ", e);
    }
})();
