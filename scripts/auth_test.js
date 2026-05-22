const axios = require('axios');
require('dotenv').config();

const token = process.env.DOLPHIN_API_KEY;
const localUrl = 'http://localhost:3001/v1.0';

async function test() {
    console.log("Testing Cloud API...");
    try {
        const cloud = await axios.get('https://dolphin-anty-api.com/browser_profiles', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log("✅ Cloud API OK. Profiles found:", cloud.data.data?.length);
    } catch (e) {
        console.error("❌ Cloud API Failed:", e.response?.data || e.message);
    }

    console.log("\nTesting Local API with single instance...");
    const local = axios.create({ baseURL: localUrl });
    try {
        const login = await local.post('/auth/login-with-token', { token });
        console.log("✅ Local Login OK. Response Headers:");
        console.log(JSON.stringify(login.headers, null, 2));
        
        // Manual cookie tracking if needed
        const cookies = login.headers['set-cookie'];
        if (cookies) console.log("🍪 Cookies found:", cookies);
        
        console.log("\nTesting Local /browser_profiles (Custom 'token' header)...");
        try {
            const list = await local.get('/browser_profiles', {
                headers: { 'token': token }
            });
            console.log("✅ Local Profiles (Custom Header) OK");
        } catch (e) {
            console.error("❌ Local Profiles (Custom Header) Failed:", e.response?.data || e.message);
        }
    } catch (e) {
        console.error("❌ Local Login Failed:", e.response?.data || e.message);
    }
}
test();
