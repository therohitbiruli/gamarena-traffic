const { publishVideoToFacebook } = require('./publisher');
const fs = require('fs');

async function manualUpload() {
    console.log('🚀 RUNNING MANUAL UPLOAD...');
    
    // Pick account 1
    const accountConfig = {
        pageId: process.env.FB_PAGE_ID_1,
        pageName: "India Page",
        channelUrl: process.env.YOUTUBE_CHANNEL_URL_1,
        accessToken: process.env.FB_PAGE_TOKEN_1
    };

    const videoInfo = {
        id: "Fcs-bhhuBtQ",
        title: "Test Video To Verify Audio",
        description: "This is a test upload to verify if audio works on Facebook Reels. #test #shorts"
    };

    if(fs.existsSync('test_dl.mp4')) {
        console.log('✅ Found test_dl.mp4! Uploading...');
        const success = await publishVideoToFacebook(accountConfig.pageId, accountConfig.accessToken, 'test_dl.mp4', videoInfo.title);
        if(success) {
            console.log('✅ Manual upload successful!');
        } else {
            console.log('❌ Manual upload failed!');
        }
    } else {
        console.log('❌ test_dl.mp4 not found!');
    }
}

manualUpload();
