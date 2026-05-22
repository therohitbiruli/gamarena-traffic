const axios = require('axios');
const readline = require('readline');
require('dotenv').config();

const API_KEY = process.env.SMS_API_KEY;

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function startPolling(id) {
    console.log(`\n🔍 Monitoring ID: ${id}...`);
    const headers = { 
        'Authorization': API_KEY, 
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0'
    };

    let lastSmsCount = 0;
    while (true) {
        try {
            const check = await axios.get(`https://5sim.net/v1/user/check/${id}`, { headers });
            const currentSms = check.data.sms || [];
            
            if (currentSms.length > lastSmsCount) {
                const newCode = currentSms[currentSms.length - 1].code;
                console.log(`\n🔥 CODE RECEIVED: ${newCode}`);
                console.log(`📩 Text: ${currentSms[currentSms.length - 1].text}`);
                lastSmsCount = currentSms.length;
            }
        } catch (e) {
            process.stdout.write('!');
        }
        process.stdout.write('.');
        await new Promise(r => setTimeout(r, 4000));
    }
}

rl.question('👉 Paste your 5sim Order ID here: ', (answer) => {
    startPolling(answer.trim());
});
