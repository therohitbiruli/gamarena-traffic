async function fetchWorkers() {
    try {
        const response = await fetch('/api/workers');
        const data = await response.json();
        updateGrid(data);
    } catch (e) {
        console.error('Failed to fetch workers', e);
    }
}

async function fetchAccounts() {
    try {
        const response = await fetch('/api/accounts');
        const data = await response.json();
        updateInventory(data);
    } catch (e) {
        console.error('Failed to fetch accounts', e);
    }
}

function updateGrid(workers) {
    const grid = document.getElementById('workerGrid');
    grid.innerHTML = '';

    for (let i = 1; i <= 5; i++) {
        const worker = workers[i];
        const card = document.createElement('div');
        card.className = `worker-card ${worker.status?.toLowerCase() || 'idle'}`;
        
        const identityHtml = worker.identity ? `
            <div class="identity-card">
                <div class="id-row">
                    <span>👤 First Name:</span> 
                    <strong>${worker.identity.firstName}</strong>
                    <button class="btn-tiny" onclick="typeText(${i}, '${worker.identity.firstName}')" title="Type into LDPlayer">⌨️</button>
                </div>
                <div class="id-row">
                    <span>👤 Last Name:</span> 
                    <strong>${worker.identity.lastName}</strong>
                    <button class="btn-tiny" onclick="typeText(${i}, '${worker.identity.lastName}')" title="Type into LDPlayer">⌨️</button>
                </div>
                <div class="id-row">
                    <span>📅 DOB:</span> 
                    <strong>${worker.identity.dob}</strong>
                </div>
                <div class="id-row">
                    <span>📧 Gmail:</span> 
                    <strong>${worker.identity.email}</strong>
                    <button class="btn-tiny" onclick="typeText(${i}, '${worker.identity.email.split('@')[0]}')" title="Type into LDPlayer">⌨️</button>
                </div>
                <div class="id-row">
                    <span>🔑 Pass:</span> 
                    <strong>${worker.identity.password}</strong>
                    <button class="btn-tiny" onclick="typeText(${i}, '${worker.identity.password}')" title="Type into LDPlayer">⌨️</button>
                </div>
            </div>
        ` : '';

        const smsHtml = worker.status === 'AWAITING_SMS' || worker.sms ? `
            <div class="sms-card">
                <div class="id-row"><span>📞 Number:</span> <strong style="color: #00ff00">${worker.sms?.phone || 'Awaiting...'}</strong></div>
                <div class="code-display">OTP: ${worker.sms?.code || '--- ---'}</div>
                ${!worker.sms ? `<button class="btn btn-sms" onclick="buySms(${i})">Buy Indian SMS Number</button>` : ''}
            </div>
        ` : '';

        card.innerHTML = `
            <div class="worker-header">
                <span class="worker-id">Worker #${i}</span>
                <span class="worker-ip">${worker.ip || '---'}</span>
            </div>
            <div class="status-badge ${worker.status?.toLowerCase() || 'idle'}">${worker.status || 'IDLE'}</div>
            <div class="status-message">${worker.message || 'Ready to deploy.'}</div>
            
            ${identityHtml}
            ${smsHtml}

            <div class="card-actions">
                ${worker.status === 'IDLE' || worker.status === 'ERROR' ? `
                    <button class="btn btn-start" onclick="startWorker(${i})">Deploy Android</button>
                ` : `
                    <button class="btn btn-success" onclick="stopWorker(${i}, true)">Save & Finish</button>
                    <button class="btn btn-stop" onclick="stopWorker(${i}, false)">Reset/Kill</button>
                `}
            </div>
        `;
        grid.appendChild(card);
    }

    const inv = document.getElementById('inventorySection');
    if (inv) grid.appendChild(inv);
}

function updateInventory(accounts) {
    const body = document.getElementById('inventoryBody');
    body.innerHTML = '';
    accounts.slice().reverse().forEach(acc => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${acc.date}</td><td style="color:#fff">${acc.email}</td><td>${acc.password}</td><td>${acc.firstName} ${acc.lastName}</td>`;
        body.appendChild(tr);
    });
}

async function startWorker(id) {
    await fetch('/api/worker/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
    });
    fetchWorkers();
}

async function buySms(id) {
    await fetch('/api/worker/sms/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
    });
    fetchWorkers();
}

async function stopWorker(id, saveSuccess) {
    await fetch('/api/worker/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, saveSuccess })
    });
    fetchWorkers();
    if (saveSuccess) fetchAccounts();
}

function exportCSV() {
    fetch('/api/accounts').then(res => res.json()).then(data => {
        let csv = 'Date,Email,Password,Name,DOB\n';
        data.forEach(acc => { csv += `${acc.date},${acc.email},${acc.password},${acc.firstName} ${acc.lastName},${acc.dob}\n`; });
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('href', url);
        a.setAttribute('download', 'gmail_android_export.csv');
        a.click();
    });
}

async function typeText(id, text) {
    await fetch('/api/worker/type', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, text })
    });
}

setInterval(fetchWorkers, 2000);
fetchWorkers();
fetchAccounts();
