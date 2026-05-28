const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

async function publishVideoToFacebook(pageId, pageToken, videoPath, title) {
    console.log(`🚀 Uploading video "${title}" to Facebook Page...`);
    
    // Try Reels endpoint first, fall back to regular /videos
    let success = false;

    // === Attempt 1: Publish as a Reel ===
    try {
        console.log('📤 Step 1: Initializing Reel upload...');
        const initUrl = `https://graph.facebook.com/v20.0/${pageId}/video_reels`;
        const initResponse = await axios.post(initUrl, {
            upload_phase: 'start',
            access_token: pageToken
        });

        const videoId = initResponse.data.video_id;
        console.log(`📋 Got video ID: ${videoId}`);

        // Step 2: Upload the video binary
        console.log('📤 Step 2: Uploading video file...');
        const uploadUrl = `https://rupload.facebook.com/video-upload/v20.0/${videoId}`;
        const fileBuffer = fs.readFileSync(videoPath);
        const fileSize = fileBuffer.length;

        await axios.post(uploadUrl, fileBuffer, {
            headers: {
                'Authorization': `OAuth ${pageToken}`,
                'offset': '0',
                'file_size': fileSize.toString(),
                'Content-Length': fileSize.toString(),
                'Content-Type': 'application/octet-stream'
            },
            maxBodyLength: Infinity,
            maxContentLength: Infinity,
            timeout: 120000
        });

        // Step 3: Finish and publish
        console.log('📤 Step 3: Publishing Reel...');
        const publishResponse = await axios.post(initUrl, {
            upload_phase: 'finish',
            video_id: videoId,
            video_state: 'PUBLISHED',
            access_token: pageToken,
            title: title,
            description: title + "\n\n#shorts #trending #viral",
            published: true
        });

        console.log('📋 Publish response:', JSON.stringify(publishResponse.data));

        if (publishResponse.data && (publishResponse.data.success || publishResponse.data.id)) {
            console.log(`✅ Successfully published as Reel! Video ID: ${videoId}`);
            
            // Wait for processing and check status
            console.log('⏳ Waiting 15s for Facebook processing before checking status...');
            await new Promise(r => setTimeout(r, 15000));
            try {
                const statusRes = await axios.get(`https://graph.facebook.com/v20.0/${videoId}`, {
                    params: { access_token: pageToken, fields: 'status,published,description,title' }
                });
                console.log('📊 Facebook Video Status:', JSON.stringify(statusRes.data, null, 2));
            } catch (e) {
                console.log('⚠️ Could not check video status:', e.response ? e.response.data : e.message);
            }
            
            return true;
        }
    } catch (reelError) {
        console.log('⚠️ Reel upload failed, falling back to regular video upload...');
        console.log('   Reason:', reelError.response ? JSON.stringify(reelError.response.data) : reelError.message);
    }

    // === Attempt 2: Fallback to regular /videos endpoint ===
    try {
        const url = `https://graph.facebook.com/v20.0/${pageId}/videos`;
        const form = new FormData();
        form.append('access_token', pageToken);
        form.append('description', title + "\n\n#shorts #trending #viral");
        form.append('published', 'true');
        form.append('source', fs.createReadStream(videoPath));

        const response = await axios.post(url, form, {
            headers: {
                ...form.getHeaders()
            },
            maxBodyLength: Infinity,
            maxContentLength: Infinity,
            timeout: 120000
        });

        if (response.data && response.data.id) {
            console.log(`✅ Successfully published as Video! Facebook Video ID: ${response.data.id}`);
            return true;
        } else {
            console.error('❌ Failed to publish, no ID returned:', response.data);
            return false;
        }
    } catch (error) {
        console.error('❌ Error publishing to Facebook:');
        if (error.response && error.response.data) {
            console.error(JSON.stringify(error.response.data, null, 2));
        } else {
            console.error(error.message);
        }
        return false;
    }
}

module.exports = {
    publishVideoToFacebook
};
