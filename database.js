// database.js - The Shared Brain

// Default catalog for first-time users
const defaultKatalog = {
    "Makcik Kiah": [
        { nama: "Nasi Lemak Biasa", hargaV: 1.00, hargaJ: 1.50 },
        { nama: "Nasi Lemak Telur Mata", hargaV: 1.50, hargaJ: 2.00 },
        { nama: "Karipap Pusing", hargaV: 0.40, hargaJ: 0.50 }
    ],
    "Pak Abu": [
        { nama: "Bihun Goreng", hargaV: 1.20, hargaJ: 1.50 },
        { nama: "Mee Goreng", hargaV: 1.20, hargaJ: 1.50 }
    ],
    "Kak Long": [
        { nama: "Kuey Teow", hargaV: 1.50, hargaJ: 2.00 },
        { nama: "Laksa", hargaV: 2.50, hargaJ: 3.50 }
    ]
};

// --- CATALOG FUNCTIONS ---
function getKatalog() {
    const data = localStorage.getItem('warungKatalog');
    if (data) {
        return JSON.parse(data); // Return saved data if it exists
    } else {
        // First time loading: save the default catalog and return it
        saveKatalog(defaultKatalog);
        return defaultKatalog;
    }
}

function saveKatalog(data) {
    localStorage.setItem('warungKatalog', JSON.stringify(data));
}

// --- SALES RECORD FUNCTIONS ---
function getJualan() {
    return JSON.parse(localStorage.getItem('warungData')) || [];
}

function saveJualan(data) {
    localStorage.setItem('warungData', JSON.stringify(data));
}

// --- HISTORY FUNCTIONS ---
function getHistory() {
    return JSON.parse(localStorage.getItem('warungHistory')) || {};
}

function saveHistory(historyData) {
    localStorage.setItem('warungHistory', JSON.stringify(historyData));
}

function archiveDailyData(tarikh, dailyData) {
    const history = getHistory();

    // If this date already exists, combine the old and new sales!
    if (history[tarikh]) {
        history[tarikh] = history[tarikh].concat(dailyData);
    } else {
        history[tarikh] = dailyData;
    }

    saveHistory(history);
}