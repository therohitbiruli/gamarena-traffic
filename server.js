const express = require('express');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const AndroidCreator = require('./automation/android_creator.js');

const app = express();
const port = 3000;

app.use(express.static(path.join(__dirname)));
app.use(express.json());

const ACCOUNTS_FILE = path.join(__dirname, 'accounts.json');

const firstNames = ['James', 'Robert', 'John', 'Michael', 'David', 'William', 'Richard', 'Joseph', 'Thomas', 'Charles', 'Christopher', 'Daniel', 'Matthew', 'Anthony', 'Mark', 'Donald', 'Steven', 'Paul', 'Andrew', 'Joshua'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'];

const workers = {};
let accounts = [];
if (fs.existsSync(ACCOUNTS_FILE)) {
    try {
        const content = fs.readFileSync(ACCOUNTS_FILE, 'utf8').trim();
        accounts = content ? JSON.parse(content) : [];
    } catch(e) { accounts = []; }
}

function saveAccounts() {
    fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(accounts, null, 2));
}

function generateIdentity() {
    const fn = firstNames[Math.floor(Math.random() * firstNames.length)];
    const ln = lastNames[Math.floor(Math.random() * lastNames.length)];
    const day = Math.floor(Math.random() * 28) + 1;
    const month = Math.floor(Math.random() * 12) + 1;
    const year = Math.floor(Math.random() * (2000 - 1980 + 1)) + 1980;
    const suffix = Math.floor(Math.random() * 9999);
    const suggestedEmail = `${fn.toLowerCase()}${ln.toLowerCase()}${suffix}@gmail.com`;
    const password = `Pass!${Math.floor(Math.random() * 999999)}`;
    return { firstName: fn, lastName: ln, birthDay: day, birthMonth: month, birthYear: year, dob: `${day}/${month}/${year}`, email: suggestedEmail, password };
}

app.get('/api/workers', (req, res) => {
    const status = {};
    for (let i = 1; i <= 5; i++) {
        const w = workers[i];
        status[i] = w ? { 
            status: w.status, 
            message: w.message, 
            ip: w.currentIp,
            identity: w.identity,
            sms: w.smsData,
            id: i 
        } : { status: 'IDLE', message: 'Waiting to start...', id: i };
    }
    res.json(status);
});

app.post('/api/worker/start', async (req, res) => {
    const { id } = req.body;
    if (!id || id < 1 || id > 5) return res.status(400).json({ error: 'Invalid ID' });
    
    // index is 0-based for AdbHandler
    const workerIndex = id - 1;

    if (workers[id]) {
        await workers[id].close().catch(() => {});
        delete workers[id];
    }

    const creator = new AndroidCreator(workerIndex);
    const identity = generateIdentity();
    workers[id] = creator;

    (async () => {
        try {
            await creator.init();
            await creator.createAccount(identity);
        } catch (e) {
            console.error(`[SERVER] Worker ${id} Error:`, e.message);
        }
    })();

    res.json({ success: true });
});

app.post('/api/worker/sms/buy', async (req, res) => {
    const { id } = req.body;
    const worker = workers[id];
    if (!worker) return res.status(404).json({ error: 'Worker not found' });
    
    try {
        const phone = await worker.buySms();
        worker.smsData = { phone, code: 'Waiting...' };
        res.json({ success: true, phone });
        
        // Start polling in background
        const code = await worker.pollSms();
        worker.smsData.code = code;
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/worker/type', async (req, res) => {
    const { id, text } = req.body;
    const name = `Worker-${id}`;
    console.log(`[TYPER] Typing "${text}" into ${name}...`);
    
    // Ghost Typer: Focus window and send keys using PowerShell
    const psCommand = `powershell -Command "Add-Type -TypeDefinition \\"using System; using System.Runtime.InteropServices; public class Win32 { [DllImport('user32.dll')] public static extern bool SetForegroundWindow(IntPtr hWnd); [DllImport('user32.dll')] public static extern IntPtr FindWindow(string lpClassName, string lpWindowName); }\\"; \\$hwnd = [Win32]::FindWindow(null, '${name}'); if (\\$hwnd -ne [IntPtr]::Zero) { [Win32]::SetForegroundWindow(\\$hwnd); Start-Sleep -m 100; [System.Windows.Forms.SendKeys]::SendWait('${text}'); }"`;
    
    try {
        require('child_process').execSync(psCommand);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/worker/stop', async (req, res) => {
    const { id, saveSuccess } = req.body;
    const worker = workers[id];
    if (!worker) return res.json({ success: true });

    if (saveSuccess && worker.identity) {
        accounts.push({
            ...worker.identity,
            date: new Date().toISOString().split('T')[0]
        });
        saveAccounts();
    }

    try {
        await worker.close().catch(() => {});
        delete workers[id];
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/accounts/add', (req, res) => {
    const { email, password, profileId } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Missing entry' });
    accounts.push({ email, password, profileId, date: new Date().toISOString().split('T')[0] });
    saveAccounts();
    res.json({ success: true });
});

app.get('/api/accounts', (req, res) => {
    res.json(accounts);
});

app.listen(port, () => {
    console.log(`\n🚀 G-Bulk ANDROID EDITION running at http://localhost:${port}`);
});
