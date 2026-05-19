const AdbHandler = require('./adb_handler');
const SmsHandler = require('./smsHandler');
const delay = ms => new Promise(res => setTimeout(res, ms));

class AndroidCreator {
    constructor(index) {
        this.index = index;
        this.adb = new AdbHandler(index);
        this.sms = new SmsHandler();
        this.currentIp = 'Checking...';
        this.status = 'READY';
        this.message = 'Waiting to start...';
        this.identity = null;
    }

    async init() {
        this.status = 'INITIALIZING';
        this.message = '🚀 Launching LDPlayer...';
        const started = await this.adb.start();
        if (!started) throw new Error("Failed to start LDPlayer instance.");

        this.status = 'READY';
        this.message = '📱 Android System Online.';
        
        // Try to get IP (not essential for Android mode but nice to have)
        this.currentIp = 'Android Context';
    }

    async createAccount(userDetails) {
        this.identity = userDetails;
        this.status = 'AUTOMATING';
        this.message = '🏠 Preparing Home Screen...';

        try {
            await this.adb.key(3); // HOME
            await delay(2000);

            this.message = '⚙️ Opening account settings...';
            await this.adb.exec('shell am start -a android.settings.ADD_ACCOUNT_SETTINGS');
            await delay(3000);

            this.message = '🔍 Selecting Google...';
            const googleFound = await this.adb.waitAndClick('Google', 10000);
            if (!googleFound) {
                // Fallback: try to find by specific class if text fails
                await this.adb.tap(120, 200); // Guessed coordinate for 240x320
            }
            await delay(6000);

            this.message = '📝 Clicking Create account...';
            await this.adb.waitAndClick('Create account', 30000);
            await delay(1500);
            await this.adb.waitAndClick('For my personal use', 5000);
            await delay(5000);

            this.message = '👤 Entering Name...';
            await this.adb.type(userDetails.firstName);
            await this.adb.key(66); // ENTER
            await delay(2000);
            await this.adb.type(userDetails.lastName);
            await this.adb.key(66); // ENTER
            await delay(1000);
            await this.adb.waitAndClick('Next', 5000);
            await delay(5000);

            this.message = '🎂 Entering Birthday...';
            // Day
            await this.adb.tap(60, 150); // Approximate for 240x320
            await this.adb.type(String(userDetails.birthDay));
            // Year
            await this.adb.tap(180, 150);
            await this.adb.type(String(userDetails.birthYear));
            // Month (Simplified for manual verify if needed)
            this.message = '🎂 Please select month & gender if stuck...';
            await delay(5000);
            await this.adb.waitAndClick('Next', 10000);

            this.message = '📧 Choosing Username...';
            await this.adb.waitAndClick('Create your own', 10000);
            await delay(2000);
            await this.adb.type(userDetails.email.split('@')[0]);
            await this.adb.key(66);
            await delay(1000);
            await this.adb.waitAndClick('Next', 10000);

            this.message = '🔑 Setting Password...';
            await this.adb.type(userDetails.password);
            await this.adb.key(66);
            await delay(4000);

            this.message = '📱 Checking for skip/SMS...';
            const skip = await this.adb.findElement('Skip');
            if (skip) {
                await this.adb.tap(skip.x, skip.y);
                this.message = '✅ Account creation success (Skipped SMS)!';
            } else {
                this.message = '⚠️ SMS Verification Required.';
                this.status = 'AWAITING_SMS';
            }

        } catch (e) {
            this.status = 'ERROR';
            this.message = '❌ ' + e.message;
            throw e;
        }
    }

    async buySms() {
        this.message = '💳 Buying SMS number...';
        const phone = await this.sms.buyNumber('india');
        this.message = `📞 Number: ${phone}`;
        return phone;
    }

    async pollSms() {
        this.message = '⏳ Waiting for OTP...';
        const code = await this.sms.waitForCode(180);
        this.message = `🔢 OTP: ${code}`;
        return code;
    }

    async close() {
        await this.adb.stop();
        this.status = 'IDLE';
        this.message = 'Closed.';
    }
}

module.exports = AndroidCreator;
