const MobileGmailCreator = require('./automation/creator.js');
require('dotenv').config();

async function testUniqueIPs() {
    console.log("🚀 Starting IP Uniqueness Test (3 Profiles)...");
    
    // We test with 3 profiles to save time/bandwidth
    const profileIds = [1, 2, 3];
    const results = [];

    for (const id of profileIds) {
        console.log(`\n--- Testing Profile ${id} ---`);
        const creator = new MobileGmailCreator(id);
        try {
            await creator.init();
            console.log(`✅ Profile ${id} initialized with IP: ${creator.currentIp}`);
            results.push({ id, ip: creator.currentIp });
        } catch (e) {
            console.error(`❌ Profile ${id} failed: ${e.message}`);
        } finally {
            await creator.close();
        }
    }

    console.log("\n📊 --- FINAL RESULTS ---");
    results.forEach(r => console.log(`Profile #${r.id}: ${r.ip}`));
    
    const uniqueIps = new Set(results.map(r => r.ip));
    if (uniqueIps.size === results.length) {
        console.log("\n💎 SUCCESS: All profiles have DIFFERENT IP addresses.");
    } else {
        console.log("\n⚠️ WARNING: Some profiles share the same IP. Check your proxy plan.");
    }
}

testUniqueIPs();
