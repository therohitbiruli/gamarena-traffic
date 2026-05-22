const { chromium, firefox } = require('playwright');
const ProxyChain = require('proxy-chain');

async function testDeep() {
    const proxyUrl = `http://2605185frVI-resi_region-US_California:DZwo3X4gAdIZYhW@ca.proxy-jet.io:1010`;
    const localProxy = await ProxyChain.anonymizeProxy(proxyUrl);
    console.log(`Bridge: ${localProxy}\n`);

    // Test 1: Chromium with longer timeout
    console.log('═══ TEST 1: Chromium (60s timeout) ═══');
    const browser1 = await chromium.launch({
        headless: false,
        proxy: { server: localProxy }
    });
    const page1 = await browser1.newPage();
    try {
        console.log('Loading aarifalam.life (60s timeout)...');
        const resp = await page1.goto('https://aarifalam.life', { 
            timeout: 60000,
            waitUntil: 'commit'  // Just wait for first response, not full load
        });
        console.log(`✅ Status: ${resp.status()}`);
        console.log(`   URL: ${resp.url()}`);
        
        // Check if it's a Cloudflare challenge
        const title = await page1.title().catch(() => 'N/A');
        console.log(`   Title: ${title}`);
        
        const bodyText = await page1.innerText('body').catch(() => '');
        if (bodyText.includes('challenge') || bodyText.includes('Checking') || bodyText.includes('Verify')) {
            console.log('   ⚠️ CLOUDFLARE CHALLENGE DETECTED!');
            console.log(`   Body preview: ${bodyText.substring(0, 200)}`);
        } else {
            console.log(`   Body preview: ${bodyText.substring(0, 150)}`);
        }
    } catch(e) {
        console.log(`❌ Failed: ${e.message.split('\n')[0]}`);
    }
    await browser1.close();

    // Test 2: Try HTTP (non-SSL) version
    console.log('\n═══ TEST 2: HTTP (non-SSL) ═══');
    const browser2 = await chromium.launch({
        headless: false,
        proxy: { server: localProxy }
    });
    const page2 = await browser2.newPage();
    try {
        console.log('Loading http://aarifalam.life ...');
        const resp = await page2.goto('http://aarifalam.life', { timeout: 30000, waitUntil: 'commit' });
        console.log(`✅ Status: ${resp.status()}, URL: ${resp.url()}`);
    } catch(e) {
        console.log(`❌ Failed: ${e.message.split('\n')[0]}`);
    }
    await browser2.close();

    // Test 3: Try another Cloudflare site to see if CF generally works
    console.log('\n═══ TEST 3: Another Cloudflare site (discord.com) ═══');
    const browser3 = await chromium.launch({
        headless: false,
        proxy: { server: localProxy }
    });
    const page3 = await browser3.newPage();
    try {
        const resp = await page3.goto('https://discord.com', { timeout: 30000, waitUntil: 'commit' });
        console.log(`✅ Status: ${resp.status()}`);
    } catch(e) {
        console.log(`❌ Failed: ${e.message.split('\n')[0]}`);
    }
    await browser3.close();

    await ProxyChain.closeAnonymizedProxy(localProxy);
    console.log('\n✅ All tests done.');
}

testDeep().catch(console.error);
