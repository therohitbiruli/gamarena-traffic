const AdbHandler = require('./automation/adb_handler');
const AndroidCreator = require('./automation/android_creator');

(async () => {
    const adb = new AdbHandler();
    const creator = new AndroidCreator(adb);

    const testUser = {
        firstName: "Marcus",
        lastName: "Aurelius",
        birthDay: 26,
        birthMonth: 4,
        birthYear: 1990,
        gender: 1, // Male
        username: "marcus.aurelius.test.9912",
        password: "GlobalTest123!@#"
    };

    try {
        console.log("Starting Android Creation Test...");
        await creator.createAccount(testUser);
    } catch (e) {
        console.error("Android Creation Test Failed: ", e.message);
    }
})();
