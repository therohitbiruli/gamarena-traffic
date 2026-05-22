const axios = require('axios');
require('dotenv').config();

async function check() {
    const localUrl = 'http://localhost:3001/v1.0';
    try {
        const response = await axios.get(`${localUrl}/browser_profiles/active`, {
            headers: { 'Authorization': `Bearer ${process.env.DOLPHIN_API_KEY}` }
        });
        console.log(JSON.stringify(response.data, null, 2));
    } catch (e) {
        console.error(e.response?.data || e.message);
    }
}
check();
