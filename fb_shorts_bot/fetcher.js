const youtubedl = require('youtube-dl-exec');
const fs = require('fs');
const path = require('path');
const db = require('./database');

const cookiesPath = path.join(__dirname, 'cookies.txt');
const relativeCookiesPath = 'cookies.txt';

async function getNextVideoToProcess(channelUrl) {
    console.log(`🔍 Fetching videos from ${channelUrl}...`);
    try {
        const options = {
            dumpSingleJson: true,
            flatPlaylist: true
        };
        
        if (fs.existsSync(cookiesPath)) {
            options.cookies = relativeCookiesPath;
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
    console.log(`⬇️ Downloading video from ${videoUrl}...`);
    
    // Attempt 1: Use youtube-dl directly (Best Quality, Audio+Video, Free)
    try {
        console.log('📡 Attempting primary download via native yt-dlp...');
        
        // Use youtube-dl-exec to download (automatically handles binary and OS differences)
        const downloadOptions = {
            output: outputPath,
            format: 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
            noWarnings: true
        };

        if (fs.existsSync(cookiesPath)) {
            downloadOptions.cookies = relativeCookiesPath;
        }

        await youtubedl(videoUrl, downloadOptions);
        
        if (fs.existsSync(outputPath)) {
            console.log('✅ Download complete via native yt-dlp!');
            return true;
        }
    } catch (err) {
        console.log('⚠️ yt-dlp download failed, falling back to RapidAPI...');
    }

    // Attempt 2: RapidAPI Fallback
    console.log('📡 Attempting fallback download via RapidAPI...');
    const axios = require('axios');
    const videoId = videoUrl.split('v=')[1] || videoUrl.split('/').pop();
    const apiKey = process.env.RAPIDAPI_KEY || '20e388f737msh778002f578d86abp1c58abjsn488181a65fd2';
    let downloadLink = null;

    try {
        // YouTube Media Downloader (Attempt first because it returns real MP4s)
        console.log('📡 Trying Fallback RapidAPI (youtube-media-downloader)...');
        const res2 = await axios.get('https://youtube-media-downloader.p.rapidapi.com/v2/video/details', {
            params: { videoId: videoId },
            headers: { 'X-RapidAPI-Key': apiKey, 'X-RapidAPI-Host': 'youtube-media-downloader.p.rapidapi.com' }
        });
        const d2 = res2.data;
        if (d2.videos && d2.videos.items && d2.videos.items.length > 0) {
            const muxed = d2.videos.items.find(v => v.hasAudio === true || v.hasAudio === undefined);
            if (muxed && muxed.url) {
                downloadLink = muxed.url;
                console.log(`✅ Found muxed format from youtube-media-downloader`);
            }
        }
    } catch (err) {
        console.log('⚠️ youtube-media-downloader failed:', err.message);
    }

    if (!downloadLink) {
        try {
            // Cloud Api Hub (Fallback)
            console.log('📡 Requesting download link from Cloud Api Hub...');
            const res1 = await axios.get('https://cloud-api-hub-youtube-downloader.p.rapidapi.com/download', {
                params: { id: videoId },
                headers: { 'X-RapidAPI-Key': apiKey, 'X-RapidAPI-Host': 'cloud-api-hub-youtube-downloader.p.rapidapi.com' }
            });
            
            const data = res1.data;
            let formats = [];
            if (Array.isArray(data)) formats = data;
            else if (data && data.formats) formats = data.formats;
            
            if (formats.length > 0) {
                const muxed = formats.find(f => f.acodec && f.acodec !== 'none' && f.vcodec && f.vcodec !== 'none' && !f.url.includes('hls'));
                if (muxed && muxed.url) {
                    downloadLink = muxed.url;
                    console.log(`✅ Found muxed format from Cloud Api Hub`);
                }
            }
        } catch (err) {
            console.log('⚠️ Cloud Api Hub failed:', err.message);
        }
    }

    if (!downloadLink) {
        console.error('❌ FATAL: Could not get any download link.');
        return false;
    }

    console.log('✅ Streaming URL to file...');
    try {
        const response = await axios({
            url: downloadLink,
            method: 'GET',
            responseType: 'stream',
            validateStatus: status => status === 200, // Only accept 200 OK
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        const contentType = response.headers['content-type'];
        if (!contentType || !contentType.startsWith('video/')) {
            throw new Error(`RapidAPI returned non-video content: ${contentType}`);
        }

        const writer = fs.createWriteStream(outputPath);
        response.data.pipe(writer);

        return new Promise((resolve) => {
            writer.on('finish', () => {
                const stat = fs.statSync(outputPath);
                if (stat.size < 100000) { // If less than 100KB, it's a corrupted stream or error page
                    console.error('❌ RapidAPI downloaded file is too small! Size:', stat.size);
                    try { fs.unlinkSync(outputPath); } catch(e) {}
                    resolve(false);
                } else {
                    console.log('✅ RapidAPI Download complete! Size:', stat.size);
                    resolve(true);
                }
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
