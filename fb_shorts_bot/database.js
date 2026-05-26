const fs = require('fs');
const path = require('path');

const historyFile = path.join(__dirname, 'history.json');

function initHistory() {
    if (!fs.existsSync(historyFile)) {
        fs.writeFileSync(historyFile, JSON.stringify([]));
    }
}

function getProcessedIds() {
    initHistory();
    const data = fs.readFileSync(historyFile, 'utf8');
    return JSON.parse(data);
}

function addProcessedId(id) {
    const ids = getProcessedIds();
    if (!ids.includes(id)) {
        ids.push(id);
        fs.writeFileSync(historyFile, JSON.stringify(ids, null, 2));
    }
}

function isProcessed(id) {
    const ids = getProcessedIds();
    return ids.includes(id);
}

module.exports = {
    getProcessedIds,
    addProcessedId,
    isProcessed
};
