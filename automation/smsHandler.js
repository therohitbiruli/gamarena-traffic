require('dotenv').config();
const axios = require('axios');

const API_KEY = process.env.SMS_API_KEY;
const BASE = 'https://5sim.net/v1';
const headers = { Authorization: 'Bearer ' + API_KEY };

class SmsHandler {
    constructor() {
        this.orderId = null;
        this.phone = null;
    }

    // Buy a temporary phone number for Google verification
    async buyNumber(country = 'india', operator = 'any') {
        console.log(`[SMS] Buying number for Google (${country})...`);
        const url = `${BASE}/user/buy/activation/${country}/${operator}/google`;
        const resp = await axios.get(url, { headers });
        this.orderId = resp.data.id;
        this.phone = resp.data.phone;
        console.log(`[SMS] Got number: ${this.phone} (order: ${this.orderId})`);
        return this.phone;
    }

    // Poll for the SMS code (waits up to 120 seconds)
    async waitForCode(maxWaitSec = 120) {
        console.log(`[SMS] Waiting for verification code (max ${maxWaitSec}s)...`);
        const url = `${BASE}/user/check/${this.orderId}`;
        const startTime = Date.now();

        while ((Date.now() - startTime) < maxWaitSec * 1000) {
            const resp = await axios.get(url, { headers });
            const status = resp.data.status;

            if (resp.data.sms && resp.data.sms.length > 0) {
                const code = resp.data.sms[0].code;
                console.log(`[SMS] Got code: ${code}`);
                return code;
            }

            if (status === 'CANCELED' || status === 'TIMEOUT' || status === 'BANNED') {
                throw new Error(`SMS order ${status}`);
            }

            // Wait 5 seconds before polling again
            await new Promise(r => setTimeout(r, 5000));
            const elapsed = Math.round((Date.now() - startTime) / 1000);
            console.log(`[SMS] Still waiting... (${elapsed}s)`);
        }

        throw new Error('SMS code not received within timeout');
    }

    // Mark the number as done
    async finish() {
        if (!this.orderId) return;
        try {
            await axios.get(`${BASE}/user/finish/${this.orderId}`, { headers });
            console.log('[SMS] Order finished');
        } catch (e) {
            // Ignore finish errors
        }
    }

    // Cancel if we didn't get the code
    async cancel() {
        if (!this.orderId) return;
        try {
            await axios.get(`${BASE}/user/cancel/${this.orderId}`, { headers });
            console.log('[SMS] Order cancelled');
        } catch (e) {
            // Ignore cancel errors
        }
    }

    // Get current balance
    static async getBalance() {
        const resp = await axios.get(`${BASE}/user/profile`, { headers });
        return resp.data.balance;
    }
}

module.exports = SmsHandler;
