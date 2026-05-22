const AdbHandler = require('../automation/adb_handler');

const devices = AdbHandler.listDevices();
console.log(`\n🔍 Found ${devices.length} devices:`);
devices.forEach((d, i) => console.log(`${i+1}. ${d}`));

if (devices.length === 0) {
    console.log("❌ NO DEVICES DETECTED. Make sure LDPlayer is RUNNING and 'ADB Debugging' is enabled in Settings -> Others.");
} else {
    console.log("✅ Success! Ready to start generation.");
}
