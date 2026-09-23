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
        container.innerHTML = '<p style="text-align:center; color: var(--text-muted); font-size: 1.1rem;">Sila pilih tarikh mula dan akhir.</p>';
        return;
    }

    const { combinedItems, totalDays } = ambilDataJulat(mula, akhir);

    if (combinedItems.length === 0) {
        container.innerHTML = `<p style="text-align:center; color: var(--text-muted); font-size: 1.1rem; padding: 20px 0;">Tiada rekod jualan antara <b>${mula}</b> hingga <b>${akhir}</b>.</p>`;
        return;
    }

    container.innerHTML = '';
    let grandPayout = 0;
    let grandUntung = 0;
    let grandBelumBayar = 0; // New variable to track outstanding debt
    const grouped = {};

    // Grouping & Calculating logic with isPaid check
    combinedItems.forEach(item => {
        grandPayout += item.payout;
        grandUntung += item.untung;

        // If it is NOT marked paid, add to outstanding debt
        if (!item.isPaid) {
            grandBelumBayar += item.payout;
        }

        if (!grouped[item.vendor]) {
            // Assume vendor is fully paid until we find an unpaid item
            grouped[item.vendor] = { vendorTotal: 0, vendorBelumBayar: 0, items: [], allPaid: true };
        }

        grouped[item.vendor].vendorTotal += item.payout;
        grouped[item.vendor].items.push(item);

        if (!item.isPaid) {
            grouped[item.vendor].vendorBelumBayar += item.payout;
            grouped[item.vendor].allPaid = false;
        }
    });

    // 1. Render Summary Header
    const rangeHeader = document.createElement('div');
    rangeHeader.className = 'results grand-total';
    rangeHeader.style.marginTop = '0';
    rangeHeader.style.marginBottom = '24px';
    rangeHeader.innerHTML = `
        <h2 style="text-align: left; margin-bottom: 12px; color: var(--accent-gold); border-bottom: none;">Laporan: ${mula} hingga ${akhir}</h2>
        <p>Keseluruhan Payout Vendor: <span>RM <b>${grandPayout.toFixed(2)}</b></span></p>
        <p>Untung Bersih Warung: <span>RM <b>${grandUntung.toFixed(2)}</b></span></p>
        <hr style="border: 1px solid var(--border-color); margin: 12px 0;">
        <p style="color: #ef4444;">Baki Belum Dibayar: <span>RM <b style="color: #ef4444;">${grandBelumBayar.toFixed(2)}</b></span></p>
        <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 12px; border-top: none; padding-top: 0;">* Berdasarkan rekod dari ${totalDays} hari jualan.</p>
    `;
    container.appendChild(rangeHeader);

    // 2. Render Vendor Data
    for (const vendorName in grouped) {
        const vData = grouped[vendorName];
        const vBox = document.createElement('div');
        vBox.className = 'vendor-group';

        // Define button styles based on paid status
        const paidBtnStyle = vData.allPaid
            ? 'background: transparent; border: 1.5px solid var(--whatsapp); color: var(--whatsapp);'
            : 'background: transparent; border: 1.5px solid var(--text-muted); color: var(--text-muted);';

        const paidBtnText = vData.allPaid ? '✓ Telah Dibayar' : 'Tanda Sudah Bayar';

        vBox.innerHTML = `
            <div class="vendor-header" style="display: flex; flex-direction: column; align-items: stretch; gap: 12px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <h3>${vendorName}</h3>
                    <span class="vendor-payout-text">Total: <b>RM ${vData.vendorTotal.toFixed(2)}</b></span>
                </div>
                <div style="display: flex; gap: 8px;">
                    <button onclick="toggleVendorPaid('${vendorName}', '${mula}', '${akhir}')" class="btn-primary" style="margin: 0; font-size: 0.9rem; padding: 8px; ${paidBtnStyle}">
                        ${paidBtnText}
                    </button>
                    <button onclick="hantarWhatsAppSejarah('${vendorName}', '${mula}', '${akhir}')" class="btn-whatsapp-compact" style="flex: 1; text-align: center;">
                        Hantar Resit
                    </button>
                </div>
            </div>
        `;

        vData.items.forEach(item => {
            const row = document.createElement('div');
            row.className = 'item-row';
            // Visually dim paid items
            if (item.isPaid) row.style.opacity = '0.6';

            row.innerHTML = `
                <div class="item-main">
                    <span class="item-name">${item.makanan}</span>
                    <span class="item-stats">
                        Jual: <b>${item.laku || 0}</b> | Baki: <b>${item.baki}</b> 
                        <span style="font-size:0.85rem; color:var(--text-muted); margin-left:8px;">(${item.tarikhAsal})</span>
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

// --- NEW FUNCTION: Toggle Paid Status ---
window.toggleVendorPaid = function (vendorName, mula, akhir) {
    const history = getHistory();
    const { combinedItems } = ambilDataJulat(mula, akhir);

    // Check if currently all paid to determine toggle direction
    const vendorItems = combinedItems.filter(item => item.vendor === vendorName);
    const currentlyAllPaid = vendorItems.every(item => item.isPaid);
    const newPaidStatus = !currentlyAllPaid;

    // Update the real history database using the tracked original indexes
    vendorItems.forEach(item => {
        history[item.tarikhAsal][item.indexAsal].isPaid = newPaidStatus;
    });

    saveHistory(history);
    renderLaporan(); // Refresh the screen
};

// --- NEW FUNCTION: WhatsApp from History ---
window.hantarWhatsAppSejarah = function (vendorName, mula, akhir) {
    const { combinedItems } = ambilDataJulat(mula, akhir);
    const vendorItems = combinedItems.filter(item => item.vendor === vendorName);

    if (vendorItems.length === 0) return;

    let totalPayout = 0;

    // Formatting the message header
    let dateHeader = mula === akhir ? mula : `${mula} hingga ${akhir}`;
    let message = `*Resit Jualan Warung*\nVendor: ${vendorName}\nTarikh: ${dateHeader}\n\n`;

    // Group identical items across multiple days to make the receipt cleaner
    const receiptItems = {};
    vendorItems.forEach(item => {
        totalPayout += item.payout;
        if (!receiptItems[item.makanan]) {
            receiptItems[item.makanan] = { laku: 0, baki: 0, payout: 0 };
        }
        receiptItems[item.makanan].laku += (item.laku || 0);
        receiptItems[item.makanan].baki += item.baki;
        receiptItems[item.makanan].payout += item.payout;
    });

    // Formatting the items
    for (const makanan in receiptItems) {
        const details = receiptItems[makanan];
        message += `    *${makanan}*\n`;
        message += `    Jual: ${details.laku} | Baki: ${details.baki}\n`;
        message += `    Bayaran: RM ${details.payout.toFixed(2)}\n\n`;
    }

    // Formatting the Grand Total
    message += `*Jumlah Bayaran: RM ${totalPayout.toFixed(2)}*\n`;
    message += `Terima kasih!`;

    const waLink = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(waLink, '_blank');
};

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