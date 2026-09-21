const tarikhMulaInput = document.getElementById('tarikhMula');
const tarikhAkhirInput = document.getElementById('tarikhAkhir');
const container = document.getElementById('sejarahContainer');

// Set default inputs to today
const todayStr = new Date().toISOString().split('T')[0];
tarikhMulaInput.value = todayStr;
tarikhAkhirInput.value = todayStr;

function ambilDataJulat(mula, akhir) {
    const history = getHistory();
    const dates = Object.keys(history).sort();
    const filteredDates = dates.filter(d => d >= mula && d <= akhir);

    let combinedItems = [];
    filteredDates.forEach(dateKey => {
        history[dateKey].forEach((entry, idx) => {
            combinedItems.push({
                ...entry,
                tarikhAsal: dateKey,
                indexAsal: idx
            });
        });
    });
    return { combinedItems, totalDays: filteredDates.length };
}

function renderLaporan() {
    const mula = tarikhMulaInput.value;
    const akhir = tarikhAkhirInput.value;

    if (!mula || !akhir) {
        container.innerHTML = '<p style="text-align:center; color:#64748b; font-size: 1.1rem;">Sila pilih tarikh mula dan akhir.</p>';
        return;
    }

    const { combinedItems, totalDays } = ambilDataJulat(mula, akhir);

    if (combinedItems.length === 0) {
        container.innerHTML = `<p style="text-align:center; color:#64748b; font-size: 1.1rem; padding: 20px 0;">Tiada rekod jualan antara <b>${mula}</b> hingga <b>${akhir}</b>.</p>`;
        return;
    }

    container.innerHTML = '';
    let grandPayout = 0;
    let grandUntung = 0;
    const grouped = {};

    // Calculate totals
    combinedItems.forEach(item => {
        grandPayout += item.payout;
        grandUntung += item.untung;

        if (!grouped[item.vendor]) {
            grouped[item.vendor] = { vendorTotal: 0, items: [] };
        }
        grouped[item.vendor].vendorTotal += item.payout;
        grouped[item.vendor].items.push(item);
    });

    // 1. Render Summary Header (Uses the Dashboard's grand-total styling)
    const rangeHeader = document.createElement('div');
    rangeHeader.className = 'results grand-total';
    rangeHeader.style.marginTop = '0';
    rangeHeader.style.marginBottom = '24px';
    rangeHeader.innerHTML = `
        <h2 style="text-align: left; margin-bottom: 12px; color: var(--accent-gold); border-bottom: none;">Laporan: ${mula} hingga ${akhir}</h2>
        <p>Bayaran Semua Vendor: <span>RM <b>${grandPayout.toFixed(2)}</b></span></p>
        <p>Untung Bersih Warung: <span>RM <b>${grandUntung.toFixed(2)}</b></span></p>
        <p style="font-size: 0.95rem; color: var(--text-muted); margin-top: 12px; border-top: none; padding-top: 0;">* Berdasarkan rekod dari ${totalDays} hari jualan.</p>
    `;
    container.appendChild(rangeHeader);

    // 2. Render Vendor Data (Uses the Dashboard's item-row styling)
    for (const vendorName in grouped) {
        const vData = grouped[vendorName];
        const vBox = document.createElement('div');
        vBox.className = 'vendor-group';
        vBox.innerHTML = `
            <div class="vendor-header">
                <div>
                    <h3>${vendorName}</h3>
                    <span class="vendor-payout-text">Jumlah Payout: <b>RM ${vData.vendorTotal.toFixed(2)}</b></span>
                </div>
            </div>
        `;

        vData.items.forEach(item => {
            const row = document.createElement('div');
            row.className = 'item-row';
            row.innerHTML = `
                <div class="item-main">
                    <span class="item-name">${item.makanan}</span>
                    <span class="item-stats">
                        Jual: <b>${item.laku || 0}</b> | Baki: <b>${item.baki}</b> 
                        <span style="font-size:0.85rem; color:#94a3b8; margin-left:8px;">(${item.tarikhAsal})</span>
                    </span>
                </div>
                <div class="item-right">
                    <span class="item-amount" style="margin-right: 12px;">RM ${item.payout.toFixed(2)}</span>
                    <button onclick="padamRekodSejarah('${item.tarikhAsal}', ${item.indexAsal})" class="btn-del" title="Padam Rekod Ini">&times;</button>
                </div>
            `;
            vBox.appendChild(row);
        });

        container.appendChild(vBox);
    }
}

window.padamRekodSejarah = function (tarikh, index) {
    if (confirm(`Padam rekod ini daripada sejarah tarikh ${tarikh}?`)) {
        const history = getHistory();
        if (history[tarikh]) {
            history[tarikh].splice(index, 1);
            if (history[tarikh].length === 0) {
                delete history[tarikh];
            }
            saveHistory(history);
            renderLaporan();
        }
    }
};

document.getElementById('btnFilterRange').addEventListener('click', renderLaporan);
document.getElementById('btnSetHariIni').addEventListener('click', () => {
    tarikhMulaInput.value = todayStr;
    tarikhAkhirInput.value = todayStr;
    renderLaporan();
});

renderLaporan();

// ==========================================
// --- 2. MANUAL HISTORY ENTRY LOGIC ---
// ==========================================

const manualTarikh = document.getElementById('manualTarikh');
const manualVendorName = document.getElementById('manualVendorName');
const manualFoodName = document.getElementById('manualFoodName');
const manualHargaV = document.getElementById('manualHargaV');
const manualHargaJ = document.getElementById('manualHargaJ');
const manualQtyHantar = document.getElementById('manualQtyHantar');
const manualQtyLaku = document.getElementById('manualQtyLaku');

manualTarikh.value = todayStr; // Default to today

function initManualDropdowns() {
    const katalog = getKatalog();
    manualVendorName.innerHTML = '';

    for (const vendor in katalog) {
        const option = document.createElement('option');
        option.value = vendor;
        option.innerText = vendor;
        manualVendorName.appendChild(option);
    }
    updateManualFoodDropdown();
}

function updateManualFoodDropdown() {
    const katalog = getKatalog();
    const selectedVendor = manualVendorName.value;
    const foods = katalog[selectedVendor] || [];

    manualFoodName.innerHTML = '';
    foods.forEach(food => {
        const option = document.createElement('option');
        option.value = food.nama;
        option.innerText = food.nama;
        option.dataset.hargaV = food.hargaV;
        option.dataset.hargaJ = food.hargaJ;
        manualFoodName.appendChild(option);
    });
    autofillManualPrices();
}

function autofillManualPrices() {
    const selectedOption = manualFoodName.options[manualFoodName.selectedIndex];
    if (selectedOption) {
        manualHargaV.value = parseFloat(selectedOption.dataset.hargaV).toFixed(2);
        manualHargaJ.value = parseFloat(selectedOption.dataset.hargaJ).toFixed(2);
    }
}

// Event Listeners for Manual Dropdowns
manualVendorName.addEventListener('change', updateManualFoodDropdown);
manualFoodName.addEventListener('change', autofillManualPrices);

// Add to History Action
document.getElementById('btnTambahManual').addEventListener('click', () => {
    const tarikh = manualTarikh.value;
    const vendor = manualVendorName.value;
    const makanan = manualFoodName.value;
    const hargaV = parseFloat(manualHargaV.value) || 0;
    const hargaJ = parseFloat(manualHargaJ.value) || 0;
    const hantar = parseInt(manualQtyHantar.value) || 0;
    const laku = parseInt(manualQtyLaku.value) || 0;

    if (!tarikh || !vendor || !makanan) {
        alert("Sila lengkapkan maklumat vendor dan makanan.");
        return;
    }

    const baki = hantar - laku;
    const payout = laku * hargaV;
    const untung = laku * (hargaJ - hargaV);

    const rekodBaru = {
        vendor: vendor,
        makanan: makanan,
        laku: laku,
        baki: baki,
        payout: payout,
        untung: untung
    };

    // Push directly into the history database for the selected date
    archiveDailyData(tarikh, [rekodBaru]);

    // Auto-update the viewer to show the date she just added data to
    tarikhMulaInput.value = tarikh;
    tarikhAkhirInput.value = tarikh;
    renderLaporan();

    alert(`Rekod ${makanan} berjaya ditambah ke tarikh ${tarikh}!`);
});

// Initialize on page load
initManualDropdowns();