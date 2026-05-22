const axios = require('axios');
const { wrapper } = require('axios-cookiejar-support');
const { CookieJar } = require('tough-cookie');
require('dotenv').config();

async function loginAndTest() {
    const port = 3001;
    const token = process.env.DOLPHIN_API_KEY;
    
    // Create a persistent session (Cookie Jar)
    const jar = new CookieJar();
    const client = wrapper(axios.create({ jar, withCredentials: true }));

    console.log(`🔐 Logging in with persistent session...`);

    try {
        // 1. Login
        await client.post(`http://localhost:${port}/v1.0/auth/login-with-token`, { token });
        console.log("✅ Session established!");

        // 2. Fetch active profiles (Session is now in the 'jar')
        const res = await client.get(`http://localhost:${port}/v1.0/browser_profiles/active`);
        
        console.log(`🚀 SUCCESS! Found ${res.data.data ? res.data.data.length : res.data.length} active profiles.`);
        console.log(`📄 Data:`, JSON.stringify(res.data, null, 2));
    } catch (e) {
        console.log(`❌ Error: ${e.response?.data?.error || e.message}`);
        console.log("\n💡 If it says 'Module Not Found', run: npm install axios-cookiejar-support tough-cookie");
    }
}

loginAndTest();
