const axios = require('axios');
require('dotenv').config();

const API_KEY = process.env.SMS_API_KEY;

async function checkSms() {
    try {
        console.log('🔍 Checking for active numbers on 5sim...');
        
        const headers = { 
            'Authorization': API_KEY, 
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        };

        // 1. Get active orders
        const res = await axios.get('https://5sim.net/v1/user/orders/active', { headers });

        if (!res.data || res.data.length === 0) {
            console.log('❌ No active numbers found. Check the 5sim website manually.');
            return;
        }

        const order = res.data[0];
        console.log(`✅ Found Active Number: ${order.phone} (ID: ${order.id})`);
        console.log('⏳ Waiting for the code...');

        let lastSmsCount = order.sms ? order.sms.length : 0;
        
        while (true) {
            const check = await axios.get(`https://5sim.net/v1/user/check/${order.id}`, { headers });
            const currentSms = check.data.sms || [];
            
            if (currentSms.length > lastSmsCount) {
                const newCode = currentSms[currentSms.length - 1].code;
                console.log(`\n🔥 NEW SMS CODE: ${newCode}`);
                return;
            }
            
            process.stdout.write('.');
            await new Promise(r => setTimeout(r, 4000));
        }
    } catch (e) {
        console.error('❌ Error:', e.message);
    }
}

checkSms();
