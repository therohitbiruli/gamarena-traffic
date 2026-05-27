const ProxyChain = require('proxy-chain');
const { exec } = require('child_process');
const http = require('http');

async function main() {
    console.log('🌍 Setting up San Diego Proxy Bridge...');
    console.log('');

    require('dotenv').config();

    // Create a totally unique ProxyJet rotating IP for the US
    const sessionId = Math.random().toString(36).substring(2, 10);
    const proxyUser = `${process.env.PROXY_USER}-resi_region-US_California-session-${sessionId}`;
    const proxyUrl = `http://${proxyUser}:${process.env.PROXY_PASS}@${process.env.PROXY_HOST}:${process.env.PROXY_PORT}`;
    
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

    // Launch REAL Chrome with unique, clean profile + proxy (NO Playwright!)
    const profileName = `chrome_console_${Date.now()}`;
    const tempProfile = require('path').join(__dirname, 'tmp', profileName);
    
    // Some basic fingerprint fuzzing
    const userAgents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36'
    ];
    const randomUA = userAgents[Math.floor(Math.random() * userAgents.length)];

    const chromeArgs = [
        `"${chromePath}"`,
        `--proxy-server=${localProxy}`,
        `--user-data-dir="${tempProfile}"`,
        `--user-agent="${randomUA}"`,
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
    console.log('  🎯 UNIQUE CHROME DEVICE LAUNCHED');
    console.log('  📍 Location: United States (Random IP)');
    console.log(`  👤 Profile ID: ${profileName}`);
    console.log('');
    console.log('  The browser opened with an IP check page.');
    console.log('  You should see a completely fresh, unique IP.');
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
