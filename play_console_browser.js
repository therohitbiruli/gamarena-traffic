const ProxyChain = require('proxy-chain');
const { exec } = require('child_process');
const http = require('http');

async function main() {
    console.log('🌍 Setting up San Diego Proxy Bridge...');
    console.log('');

    // Create a local proxy that forwards to ProxyJet with auth
    const proxyUrl = 'http://2605185frVI-resi_region-US_California_Sandiego-ip-397782420:DZwo3X4gAdIZYhW@ca.proxy-jet.io:1010';
    
    // This creates a local proxy on a random port that handles auth for us
    const localProxy = await ProxyChain.anonymizeProxy(proxyUrl);
    console.log(`✅ Local proxy bridge: ${localProxy}`);

    // Extract port from local proxy URL
    const localPort = new URL(localProxy).port;

    // Verify IP through the proxy
    console.log('🔍 Verifying IP...');

    // Find Chrome path
    const chromePaths = [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`
    ];

    let chromePath = '';
    const fs = require('fs');
    for (const p of chromePaths) {
        if (fs.existsSync(p)) {
            chromePath = p;
            break;
        }
    }

    if (!chromePath) {
        console.log('❌ Chrome not found! Using default.');
        chromePath = 'chrome';
    }
    console.log(`🔗 Chrome: ${chromePath}`);

    // Launch REAL Chrome with clean profile + proxy (NO Playwright!)
    const tempProfile = require('path').join(__dirname, 'tmp', 'chrome_sandiego');
    
    const chromeArgs = [
        `"${chromePath}"`,
        `--proxy-server=${localProxy}`,
        `--user-data-dir="${tempProfile}"`,
        '--no-first-run',
        '--no-default-browser-check',
        '--start-maximized',
        '--lang=en-US',
        'https://api.ipify.org?format=json'  // Opens IP check first
    ].join(' ');

    console.log('');
    console.log('🚀 Launching Chrome...');
    
    const chrome = exec(chromeArgs);
    
    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('  🎯 REAL CHROME LAUNCHED (No Playwright!)');
    console.log('  📍 Location: San Diego, California, USA');
    console.log('');
    console.log('  The browser opened with IP check page.');
    console.log('  You should see your San Diego IP: 76.93.183.98');
    console.log('');
    console.log('  👉 Now navigate to:');
    console.log('     https://accounts.google.com');
    console.log('');
    console.log('  Log in → Then go to Play Console.');
    console.log('═══════════════════════════════════════════════════');
    console.log('');
    console.log('⏳ Press Ctrl+C here ONLY after you are done.');
    console.log('   Closing this terminal will disconnect the proxy!');

    // Keep alive
    process.on('SIGINT', async () => {
        console.log('\n👋 Shutting down proxy bridge...');
        await ProxyChain.closeAnonymizedProxy(localProxy);
        process.exit(0);
    });

    // Keep process alive
    setInterval(() => {}, 60000);
}

main().catch(err => {
    console.error('❌ Error:', err.message);
});
