const axios = require('axios');
require('dotenv').config();

const API_KEY = process.env.SMS_API_KEY;
const COUNTRY = 'canada'; // Trying Canada again on the Emulator flow
const PRODUCT = 'google';

async function getNumber() {
    try {
        console.log(`🚀 Requesting Canadian number for ${PRODUCT}...`);
        
        const url = `https://5sim.net/v1/user/buy/activation/${COUNTRY}/any/${PRODUCT}`;
        
        const res = await axios.get(url, {
            headers: { 
                'Authorization': `Bearer ${API_KEY}`, 
                'Accept': 'application/json' 
            },
            validateStatus: false
        });

        if (res.status !== 200) {
            console.error(`\n❌ 5sim Error (${res.status}):`, res.data);
            return;
        }
        
        const { id, phone } = res.data;
        if (!phone) {
            console.error('\n❌ No number received (Out of stock). Try again in a few minutes.');
            return;
        }

        console.log(`\n✅ CANADA NUMBER: ${phone}`);
        console.log(`🆔 ID: ${id}`);
        console.log('\n1. Paste the number into Google.');
        console.log('2. Click "Next".');
        console.log('3. Waiting for SMS code...');

        let attempts = 0;
        while (attempts < 60) {
            const check = await axios.get(`https://5sim.net/v1/user/check/${id}`, {
                headers: { 'Authorization': `Bearer ${API_KEY}`, 'Accept': 'application/json' }
            });
            
            if (check.data.sms && check.data.sms.length > 0) {
                console.log(`\n🔥 SMS CODE: ${check.data.sms[0].code}`);
                return;
            }
            
            process.stdout.write('.');
            await new Promise(r => setTimeout(r, 5000));
            attempts++;
        }
        console.log('\n❌ Timeout.');
    } catch (e) {
        console.error('❌ System Error:', e.message);
    }
}

getNumber();
