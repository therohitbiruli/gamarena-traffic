const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

async function publishVideoToFacebook(pageId, pageToken, videoPath, title) {
    console.log(`🚀 Uploading video "${title}" to Facebook Page...`);
    
    // Facebook Graph API Video Upload Endpoint
    const url = `https://graph.facebook.com/v20.0/${pageId}/videos`;

    try {
        const form = new FormData();
        form.append('access_token', pageToken);
        form.append('description', title + "\n\n#shorts #trending #viral"); 
        form.append('source', fs.createReadStream(videoPath));

        const response = await axios.post(url, form, {
            headers: {
                ...form.getHeaders()
            },
            // Uploads can take a bit, increase timeout
            maxBodyLength: Infinity,
            maxContentLength: Infinity,
            timeout: 60000 
        });

        if (response.data && response.data.id) {
            console.log(`✅ Successfully published! Facebook Video ID: ${response.data.id}`);
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
