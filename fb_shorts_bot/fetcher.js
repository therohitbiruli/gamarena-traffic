const youtubedl = require('youtube-dl-exec');
const fs = require('fs');
const path = require('path');
const db = require('./database');

const cookiesPath = path.join(__dirname, 'cookies.txt');

async function getNextVideoToProcess(channelUrl) {
    console.log(`🔍 Fetching videos from ${channelUrl}...`);
    try {
        const options = {
            dumpSingleJson: true,
            flatPlaylist: true
        };
        
        if (fs.existsSync(cookiesPath)) {
            options.cookies = cookiesPath;
            console.log('🍪 Using YouTube Cookies for authentication!');
        }

        const output = await youtubedl(channelUrl, options);

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
    console.log(`⬇️ Downloading video from ${videoUrl} via RapidAPI...`);
    const axios = require('axios');
    const videoId = videoUrl.split('v=')[1] || videoUrl.split('/').pop();
    
    const apiKey = process.env.RAPIDAPI_KEY || '20e388f737msh77002f578d86abp1c58abjsn488181a65fd2';
    let downloadLink = null;

    try {
        // Attempt 1: Cloud Api Hub - Youtube Downloader
        console.log('📡 Requesting download link from Cloud Api Hub RapidAPI...');
        const res1 = await axios.get('https://cloud-api-hub-youtube-downloader.p.rapidapi.com/download', {
            params: { id: videoId, filter: 'audioandvideo' },
            headers: { 'X-RapidAPI-Key': apiKey, 'X-RapidAPI-Host': 'cloud-api-hub-youtube-downloader.p.rapidapi.com' }
        });
        const jsonStr = JSON.stringify(res1.data);
        const urlMatch = jsonStr.match(/"(https:\/\/[^"]+googlevideo\.com\/videoplayback[^"]+)"/);
        if (urlMatch) downloadLink = urlMatch[1];
    } catch (err) {
        console.log('⚠️ Primary RapidAPI failed:', err.response ? JSON.stringify(err.response.data) : err.message);
    }

    if (!downloadLink) {
        try {
            // Attempt 2: fallback (youtube-media-downloader)
            console.log('📡 Trying Fallback RapidAPI (youtube-media-downloader)...');
            const res2 = await axios.get('https://youtube-media-downloader.p.rapidapi.com/v2/video/details', {
                params: { videoId: videoId },
                headers: { 'X-RapidAPI-Key': apiKey, 'X-RapidAPI-Host': 'youtube-media-downloader.p.rapidapi.com' }
            });
            const jsonStr2 = JSON.stringify(res2.data);
            const urlMatch2 = jsonStr2.match(/"(https:\/\/[^"]+googlevideo\.com\/videoplayback[^"]+)"/);
            if (urlMatch2) downloadLink = urlMatch2[1];
        } catch (err) {
            console.log('⚠️ Fallback RapidAPI failed:', err.response ? JSON.stringify(err.response.data) : err.message);
        }
    }

    if (!downloadLink) {
        console.error('❌ FATAL: Could not get a valid MP4 download link from RapidAPI. Make sure your RapidAPI Key is actively subscribed to the Free plan on one of the APIs above.');
        return false;
    }

    console.log('✅ Found MP4 Download Link! Streaming to file...');
    
    try {
        const writer = fs.createWriteStream(outputPath);
        const response = await axios({
            url: downloadLink,
            method: 'GET',
            responseType: 'stream'
        });

        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', () => {
                console.log('✅ Download complete!');
                resolve(true);
            });
            writer.on('error', (err) => {
                console.error('❌ Error writing video file:', err);
                resolve(false);
            });
        });
    } catch (error) {
        console.error('❌ Error streaming video file:', error.message);
        return false;
    }
}

module.exports = {
    getNextVideoToProcess,
    downloadVideo
};
