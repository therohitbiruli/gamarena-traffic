const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class AdbHandler {
    constructor(index = 0) {
        this.index = index;
        this.adbPath = 'D:\\LDPlayer\\LDPlayer9\\adb.exe';
        this.consolePath = 'D:\\LDPlayer\\LDPlayer9\\dnconsole.exe';
        this.serial = null; // Will be set after connection
    }

    async start() {
        const name = `Worker-${this.index + 1}`;
        console.log(`[ADB] Starting LDPlayer: ${name}...`);
        
        try {
            // Check if running
            const listOutput = execSync(`"${this.consolePath}" list2`, { encoding: 'utf8' });
            const line = listOutput.split('\n').find(l => l.includes(name));
            
            if (line) {
                const parts = line.split(',');
                if (parts[4] === '1') { // Already running
                    const port = parts[5];
                    this.serial = `127.0.0.1:${port}`;
                    console.log(`[ADB] ${name} already running on ${this.serial}`);
                } else {
                    execSync(`"${this.consolePath}" launch --name ${name}`);
                    // Wait for it to appear in list2 with a port
                    let attempts = 0;
                    while (attempts < 60) {
                        const check = execSync(`"${this.consolePath}" list2`, { encoding: 'utf8' });
                        const checkLine = check.split('\n').find(l => l.includes(name));
                        const checkParts = checkLine.split(',');
                        if (checkParts[4] === '1' && checkParts[5] !== '-1') {
                            this.serial = `127.0.0.1:${checkParts[5]}`;
                            break;
                        }
                        await new Promise(r => setTimeout(r, 2000));
                        attempts++;
                    }
                }
            }
            
            if (!this.serial) throw new Error("Timed out waiting for LDPlayer to start/port-bind");

            // Connect ADB
            console.log(`[ADB] Connecting to ${this.serial}...`);
            execSync(`"${this.adbPath}" connect ${this.serial}`);
            
            // Wait for 'device' status
            let deviceReady = false;
            for (let i = 0; i < 30; i++) {
                const status = execSync(`"${this.adbPath}" -s ${this.serial} get-state`, { encoding: 'utf8' }).trim();
                if (status === 'device') {
                    deviceReady = true;
                    break;
                }
                await new Promise(r => setTimeout(r, 1000));
            }
            
            if (!deviceReady) throw new Error("ADB device status never reached 'device'");
            
            console.log(`[ADB] ✅ ${name} is ready.`);
            return true;
        } catch (e) {
            console.error(`[ADB] Launch Error: ${e.message}`);
            return false;
        }
    }

    async stop() {
        const name = `Worker-${this.index + 1}`;
        console.log(`[ADB] Stopping ${name}...`);
        try {
            execSync(`"${this.consolePath}" quit --name ${name}`);
            return true;
        } catch (e) {
            return false;
        }
    }

    exec(command) {
        if (!this.serial) return null;
        try {
            const fullCommand = `"${this.adbPath}" -s ${this.serial} ${command}`;
            return execSync(fullCommand, { encoding: 'utf8', stdio: 'pipe' });
        } catch (e) {
            return null;
        }
    }

    async tap(x, y) {
        this.exec(`shell input tap ${x} ${y}`);
    }

    async type(text) {
        // Handle spaces and special chars
        const safeText = text.replace(/ /g, '%s');
        this.exec(`shell input text "${safeText}"`);
    }

    async key(code) {
        this.exec(`shell input keyevent ${code}`);
    }

    async swipe(x1, y1, x2, y2, duration = 300) {
        this.exec(`shell input swipe ${x1} ${y1} ${x2} ${y2} ${duration}`);
    }

    async getScreenXml() {
        const xml = this.exec('exec-out uiautomator dump /dev/tty');
        if (xml && xml.includes('<?xml')) {
            return xml.split('UI hierchary dumped to:')[0].trim();
        }
        return null;
    }

    async findElement(filter) {
        const xml = await this.getScreenXml();
        if (!xml) return null;
        const regexText = new RegExp(`<node[^>]*?(text|resource-id|content-desc)="${filter}"[^>]*?bounds="\\[(\\d+),(\\d+)\\]\\[(\\d+),(\\d+)\\]"`, 'i');
        const match = xml.match(regexText);
        if (match) {
            const x1 = parseInt(match[2]), y1 = parseInt(match[3]), x2 = parseInt(match[4]), y2 = parseInt(match[5]);
            return { x: Math.floor((x1 + x2) / 2), y: Math.floor((y1 + y2) / 2) };
        }
        return null;
    }

    async clickElement(filter) {
        const coords = await this.findElement(filter);
        if (coords) {
            await this.tap(coords.x, coords.y);
            return true;
        }
        return false;
    }

    async waitAndClick(filter, timeout = 15000) {
        const start = Date.now();
        while (Date.now() - start < timeout) {
            if (await this.clickElement(filter)) return true;
            await new Promise(r => setTimeout(r, 1500));
        }
        return false;
    }

    async waitForText(target, timeout = 15000) {
        const start = Date.now();
        while (Date.now() - start < timeout) {
            const xml = await this.getScreenXml();
            if (xml && xml.includes(target)) return true;
            await new Promise(r => setTimeout(r, 2000));
        }
        return false;
    }

    async findElementsByClass(className) {
        const xml = await this.getScreenXml();
        if (!xml) return [];
        const results = [];
        const regex = new RegExp(`<node[^>]*?class="${className}"[^>]*?bounds="\\[(\\d+),(\\d+)\\]\\[(\\d+),(\\d+)\\]"`, 'gi');
        let match;
        while ((match = regex.exec(xml)) !== null) {
            const x1 = parseInt(match[1]), y1 = parseInt(match[2]), x2 = parseInt(match[3]), y2 = parseInt(match[4]);
            results.push({ x: Math.floor((x1 + x2) / 2), y: Math.floor((y1 + y2) / 2) });
        }
        return results;
    }
}

module.exports = AdbHandler;
