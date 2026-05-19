const axios = require('axios');
require('dotenv').config();

class SMSHandler {
    constructor() {
        this.apiKey = process.env.SMS_API_KEY;
        this.baseUrl = 'https://5sim.net/v1/user';
        this.headers = {
            'Authorization': `Bearer ${this.apiKey}`,
            'Accept': 'application/json'
        };
    }

    async getNumber(country = 'usa', service = 'google') {
        try {
            console.log(`📡 Requesting ${service} number for ${country}...`);
            const response = await axios.get(`${this.baseUrl}/buy/activation/${country}/any/${service}`, {
                headers: this.headers
            });
            return response.data; // { id, phone, operator, product, price, status }
        } catch (error) {
            console.error('❌ Failed to get number:', error.response?.data || error.message);
            throw error;
        }
    }

    async getOTP(id) {
        try {
            console.log(`⏳ Waiting for OTP for ID: ${id}...`);
            // Poll for 2 minutes
            for (let i = 0; i < 24; i++) {
                const response = await axios.get(`${this.baseUrl}/check/${id}`, {
                    headers: this.headers
                });
                
                if (response.data.sms && response.data.sms.length > 0) {
                    const otp = response.data.sms[0].code;
                    console.log(`✅ OTP Received: ${otp}`);
                    return otp;
                }
                
                await new Promise(r => setTimeout(r, 5000));
            }
            throw new Error('OTP Timeout');
        } catch (error) {
            console.error('❌ Failed to get OTP:', error.message);
            throw error;
        }
    }

    async finishActivation(id) {
        await axios.get(`${this.baseUrl}/finish/${id}`, { headers: this.headers });
    }

    async cancelActivation(id) {
        await axios.get(`${this.baseUrl}/cancel/${id}`, { headers: this.headers });
    }
}

module.exports = new SMSHandler();
