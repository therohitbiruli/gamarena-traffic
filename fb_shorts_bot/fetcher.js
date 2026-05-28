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
    console.log(`⬇️ Downloading video from ${videoUrl}...`);
    
    // Attempt 1: Use youtube-dl directly (Best Quality, Audio+Video, Free)
    try {
        console.log('📡 Attempting primary download via native yt-dlp...');
        
        const { execSync } = require('child_process');
        
        // Dynamically install yt-dlp since we can't edit Github Actions workflows
        console.log('📦 Installing/Updating yt-dlp...');
        try { execSync('python3 -m pip install -U yt-dlp', { stdio: 'ignore' }); } catch(e) {}
        
        let command = `python3 -m yt_dlp -o "${outputPath}" -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best" --extractor-args "youtube:player_client=ios,android,web" --no-warnings "${videoUrl}"`;
        
        if (fs.existsSync(cookiesPath)) {
            command += ` --cookies "${cookiesPath}"`;
        }

        execSync(command, { stdio: 'inherit' });
        
        if (fs.existsSync(outputPath)) {
            console.log('✅ Download complete via native yt-dlp!');
            return true;
        }
    } catch (err) {
        console.log('⚠️ yt-dlp download failed, falling back to RapidAPI...');
    }

    // Attempt 2: Cobalt Proxy API Fallback (Bypasses IP blocks)
    console.log('📡 Attempting fallback download via Cobalt APIs...');
    const axios = require('axios');
    
    // List of public Cobalt instances to try in order
    const cobaltInstances = [
        'https://api.cobalt.tools',
        'https://co.wuk.sh',
        'https://cobalt.kwiatektv.me',
        'https://cobalt.qewertyy.dev'
    ];

    let downloadSuccess = false;

    for (const instance of cobaltInstances) {
        console.log(`📡 Trying Cobalt Instance: ${instance}...`);
        try {
            const res = await axios.post(`${instance}/api/json`, {
                url: videoUrl,
                vQuality: '720',
                filenamePattern: 'classic',
                isAudioOnly: false,
                disableMetadata: true
            }, {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                },
                timeout: 10000
            });

            if (res.data && res.data.url) {
                const downloadLink = res.data.url;
                console.log(`✅ Found proxied URL from ${instance}`);
                
                console.log('✅ Streaming URL to file...');
                const response = await axios({
                    url: downloadLink,
                    method: 'GET',
                    responseType: 'stream',
                    validateStatus: status => status === 200,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    },
                    timeout: 60000
                });

                const contentType = response.headers['content-type'];
                if (!contentType || !contentType.startsWith('video/')) {
                    throw new Error(`Non-video content: ${contentType}`);
                }

                const writer = fs.createWriteStream(outputPath);
                response.data.pipe(writer);

                downloadSuccess = await new Promise((resolve) => {
                    writer.on('finish', () => {
                        const stat = fs.statSync(outputPath);
                        if (stat.size < 100000) {
                            console.error('❌ Downloaded file is too small! Size:', stat.size);
                            try { fs.unlinkSync(outputPath); } catch(e) {}
                            resolve(false);
                        } else {
                            console.log('✅ Cobalt Download complete! Size:', stat.size);
                            resolve(true);
                        }
                    });
                    writer.on('error', (err) => {
                        console.error('❌ Error writing video file:', err.message);
                        resolve(false);
                    });
                });

                if (downloadSuccess) break; // Exit loop if successful
            }
        } catch (err) {
            console.log(`⚠️ Instance ${instance} failed:`, err.message);
        }
    }

    if (!downloadSuccess) {
        console.error('❌ FATAL: Could not download the video from any source.');
        return false;
    }

    return true;
}

module.exports = {
    getNextVideoToProcess,
    downloadVideo
};
