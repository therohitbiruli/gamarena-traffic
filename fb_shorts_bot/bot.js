require('dotenv').config();
const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
const { getNextVideoToProcess, downloadVideo } = require('./fetcher');
const { publishVideoToFacebook } = require('./publisher');
const db = require('./database');

async function processNextVideo(pageId, pageToken, youtubeUrl, accountName) {
    console.log(`\n========================================`);
    console.log(`⏰ [${new Date().toLocaleString()}] Processing: ${accountName}`);
    console.log(`========================================`);

    // 1. Get the oldest unprocessed video
    const video = await getNextVideoToProcess(youtubeUrl);
    
    if (!video) {
        console.log(`🛑 No new videos to process for ${accountName}.`);
        return;
    }

    console.log(`🎬 Target Video: [${video.id}] ${video.title}`);

    // 2. Download the video
    const tempFilePath = path.join(__dirname, `temp_${video.id}.mp4`);
    const downloadSuccess = await downloadVideo(video.url, tempFilePath);

    if (!downloadSuccess) {
        console.log(`🛑 Download failed for ${accountName}. Skipping this cycle.`);
        return;
    }

    // 3. Upload to Facebook
    const uploadSuccess = await publishVideoToFacebook(pageId, pageToken, tempFilePath, video.title);

    // 4. Clean up temp file
    if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
        console.log('🗑️ Temp video file deleted.');
    }

    // 5. Save to database if successful
    if (uploadSuccess) {
        db.addProcessedId(video.id);
        console.log(`✅ Success! Video [${video.id}] logged to history.json.`);
    } else {
        console.log(`❌ Upload Failed for ${accountName}. Will be retried next time.`);
    }
}

async function runAllAccounts() {
    let accountIndex = 1;
    
    while (true) {
        const pageId = process.env[`FB_PAGE_ID_${accountIndex}`];
        const pageToken = process.env[`FB_PAGE_TOKEN_${accountIndex}`];
        const youtubeUrl = process.env[`YOUTUBE_CHANNEL_URL_${accountIndex}`];

        if (!pageId || !pageToken || !youtubeUrl) {
            // Check if there is a legacy un-numbered setup, just in case
            if (accountIndex === 1 && process.env.FB_PAGE_ID) {
                await processNextVideo(process.env.FB_PAGE_ID, process.env.FB_PAGE_TOKEN, process.env.YOUTUBE_CHANNEL_URL, "Account 1 (Legacy)");
            } else if (accountIndex > 1) {
                console.log(`\n✅ Finished processing all ${accountIndex - 1} configured accounts.`);
            } else {
                console.log(`❌ No accounts configured in environment variables!`);
            }
            break;
        }

        await processNextVideo(pageId, pageToken, youtubeUrl, `Account ${accountIndex}`);
        accountIndex++;
    }
}

// Check arguments for manual run
const args = process.argv.slice(2);
if (args.includes('--run-now')) {
    console.log('🚀 Running manual one-time execution for all accounts...');
    runAllAccounts();
} else {
    console.log('⏳ Starting background scheduler...');
    console.log('📅 Schedule: 8:00 AM, 2:00 PM, and 8:00 PM every day.');
    
    // Cron expression: "At minute 0 past hour 8, 14, and 20."
    cron.schedule('0 8,14,20 * * *', () => {
        runAllAccounts();
    });
}
