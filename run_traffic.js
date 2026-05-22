const dolphin = require('./automation/dolphin_handler');
const gamingEngagement = require('./automation/gaming_engagement');
require('dotenv').config();

const TOTAL_SESSIONS = 5; // Matches your Dolphin Anty Free tier limit
const MAX_CONCURRENT = 1; 

async function runTraffic() {
    console.log("🚀 Starting GamxCloud Gaming Traffic Bot...");
    
    // 1. Get all available profiles
    const profiles = await dolphin.getProfiles();
    console.log(`[MAIN] Found ${profiles.length} profiles in your Dolphin Anty account.`);

    if (profiles.length === 0) {
        console.error("❌ No profiles found. Please create some profiles in Dolphin Anty first.");
        return;
    }

    // 2. Loop through and run sessions
    const targetProfiles = profiles.slice(0, TOTAL_SESSIONS);
    
    for (const profile of targetProfiles) {
        console.log(`\n💎 Processing Profile: ${profile.name} (ID: ${profile.id})`);
        
        try {
            // Start the profile and get the WebSocket endpoint
            const wsEndpoint = await dolphin.startProfile(profile.id);
            
            if (wsEndpoint && wsEndpoint !== 'MANUAL_OK') {
                console.log(`✅ Profile started. Running engagement...`);
                
                // Run the gaming engagement script
                await gamingEngagement(wsEndpoint);
                
            } else if (wsEndpoint === 'MANUAL_OK') {
                console.log("⚠️ Profile started in Manual Mode (No automation endpoint found). Skipping automated engagement.");
            } else {
                console.error("❌ Failed to start profile correctly.");
            }
        } catch (err) {
            console.error(`❌ Error with profile ${profile.name}:`, err.message);
        } finally {
            console.log(`⏹️ Stopping profile ${profile.name}...`);
            await dolphin.stopProfile(profile.id);
            // Cooldown between profiles
            await new Promise(r => setTimeout(r, 5000));
        }
    }

    console.log("\n🏁 All traffic sessions completed! Site metrics should start updating soon.");
}

runTraffic().catch(console.error);
