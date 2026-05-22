const AdbHandler = require('./automation/adb_handler');

(async () => {
    const adb = new AdbHandler();
    console.log("Checking screen for 'System Apps'...");
    const xml = await adb.getScreenXml();
    // fs.writeFileSync('debug_screen.xml', xml); // For debugging
    
    const element = await adb.findElement('System Apps');
    if (element) {
        console.log(`Found 'System Apps' at: ${element.x}, ${element.y}`);
        await adb.tap(element.x, element.y);
        console.log("Tapped 'System Apps'. Waiting 2 seconds...");
        await new Promise(r => setTimeout(r, 2000));
        
        console.log("Looking for 'Settings'...");
        const settings = await adb.findElement('Settings');
        if (settings) {
            console.log(`Found 'Settings' at: ${settings.x}, ${settings.y}`);
            await adb.tap(settings.x, settings.y);
            console.log("Tapped 'Settings'.");
        } else {
            console.log("Could not find 'Settings' icon.");
        }
    } else {
        console.log("Could not find 'System Apps' folder.");
        // Try searching for 'Play Store' or something else common
        const playStore = await adb.findElement('Play Store');
        if (playStore) console.log("Found Play Store instead.");
    }
})();
