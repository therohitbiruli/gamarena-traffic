const youtubedl = require('youtube-dl-exec');
const fs = require('fs');
const path = require('path');
const db = require('./database');

async function getNextVideoToProcess(channelUrl) {
    console.log(`🔍 Fetching videos from ${channelUrl}...`);
    try {
        const output = await youtubedl(channelUrl, {
            dumpSingleJson: true,
            flatPlaylist: true
        });

        if (!output || !output.entries || output.entries.length === 0) {
            console.log('❌ No videos found on the channel.');
            return null;
        }

        // Reverse the array to process from Oldest to Newest
        const videos = output.entries.reverse();
        console.log(`✅ Found ${videos.length} total videos.`);

        // Find the first video that is NOT in the database
        for (const video of videos) {
            if (!db.isProcessed(video.id)) {
                return video;
            }
        }

        console.log('✅ All videos have already been processed!');
        return null;

    } catch (error) {
        console.error('❌ Error fetching video list:', error.message);
        return null;
    }
}

async function downloadVideo(videoUrl, outputPath) {
    console.log(`⬇️ Downloading video from ${videoUrl}...`);
    try {
        await youtubedl(videoUrl, {
            output: `"${outputPath}"`,
            format: 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
            noWarnings: true
        });
        
        if (fs.existsSync(outputPath)) {
            console.log('✅ Download complete!');
            return true;
        } else {
            console.error('❌ Download finished but file not found.');
            return false;
        }
    } catch (error) {
        console.error('❌ Error downloading video:', error.message);
        return false;
    }
}

module.exports = {
    getNextVideoToProcess,
    downloadVideo
};
