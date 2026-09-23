let senaraiJualan = getJualan();

// Inputs
const vendorNameInput = document.getElementById('vendorName');
const foodNameInput = document.getElementById('foodName');
const qtyHantarInput = document.getElementById('qtyHantar');
const pricePreview = document.getElementById('pricePreview');

function initDropdowns() {
    const katalog = getKatalog();
    vendorNameInput.innerHTML = '';

    for (const vendor in katalog) {
        const option = document.createElement('option');
        option.value = vendor;
        option.innerText = vendor;
        vendorNameInput.appendChild(option);
    }
    updateFoodDropdown();
}

function updateFoodDropdown() {
    const katalog = getKatalog();
    const selectedVendor = vendorNameInput.value;
    const foods = katalog[selectedVendor] || [];

    foodNameInput.innerHTML = '';
    foods.forEach(food => {
        const option = document.createElement('option');
        option.value = food.nama;
        option.innerText = food.nama;
        option.dataset.hargaV = food.hargaV;
        option.dataset.hargaJ = food.hargaJ;
        foodNameInput.appendChild(option);
    });

    autofillPrices();
}

// Shows the reference price in the morning UI without needing inputs
function autofillPrices() {
    const selectedOption = foodNameInput.options[foodNameInput.selectedIndex];
    if (selectedOption) {
        const hV = parseFloat(selectedOption.dataset.hargaV).toFixed(2);
        const hJ = parseFloat(selectedOption.dataset.hargaJ).toFixed(2);
        pricePreview.innerHTML = `Modal: <b>RM ${hV}</b> | Jual: <b>RM ${hJ}</b>`;
    }
}

vendorNameInput.addEventListener('change', updateFoodDropdown);
foodNameInput.addEventListener('change', autofillPrices);

// --- 1. MORNING ENTRY (Hantar) ---
document.getElementById('btnTambahPagi').addEventListener('click', () => {
    const vendor = vendorNameInput.value;
    const makanan = foodNameInput.value;
    const hantar = parseInt(qtyHantarInput.value) || 0;

    const selectedOption = foodNameInput.options[foodNameInput.selectedIndex];
    const hargaV = parseFloat(selectedOption.dataset.hargaV) || 0;
    const hargaJ = parseFloat(selectedOption.dataset.hargaJ) || 0;

    if (hantar <= 0) { alert('Sila masukkan kuantiti hantar yang sah.'); return; }

    // Push item as 'pending'
    const rekodBaru = {
        vendor: vendor,
        makanan: makanan,
        hargaV: hargaV,
        hargaJ: hargaJ,
        hantar: hantar,
        laku: 0,
        baki: 0,
        payout: 0,
        untung: 0,
        status: 'pending',
        isPaid: false // Preparing data for Phase 2.1 History
    };

    senaraiJualan.push(rekodBaru);
    saveJualan(senaraiJualan);
    renderPaparan();
});

// --- 2. EVENING VERIFICATION (Baki) ---
window.sahkanPetang = function (index) {
    const item = senaraiJualan[index];
    const inputBaki = document.getElementById(`inputBaki_${index}`);
    const bakiStr = inputBaki.value;

    if (bakiStr === '') { alert('Sila masukkan jumlah baki (masukkan 0 jika habis).'); return; }

    const baki = parseInt(bakiStr);

    if (baki < 0 || baki > item.hantar) {
        alert(`Ralat: Baki tidak sah. Mesti antara 0 dan ${item.hantar}.`);
        return;
    }

    // Finalize math
    item.baki = baki;
    item.laku = item.hantar - item.baki;
    item.payout = item.laku * item.hargaV;
    item.untung = item.laku * (item.hargaJ - item.hargaV);
    item.status = 'selesai'; // Lock the item

    saveJualan(senaraiJualan);
    renderPaparan();
};

window.undoPetang = function (index) {
    const item = senaraiJualan[index];
    item.status = 'pending';
    item.laku = 0;
    item.baki = 0;
    item.payout = 0;
    item.untung = 0;
    saveJualan(senaraiJualan);
    renderPaparan();
};

window.padamItem = function (index) {
    if (confirm("Padam kemasukan ini dari sesi hari ini?")) {
        senaraiJualan.splice(index, 1);
        saveJualan(senaraiJualan);
        renderPaparan();
    }
}

// --- 3. RENDER FEED ---
function renderPaparan() {
    const container = document.getElementById('senaraiContainer');
    container.innerHTML = '';

    let jumlahPayout = 0;
    let jumlahUntung = 0;
    const groupedData = {};

    senaraiJualan.forEach((item, index) => {
        // ONLY count math for items that have been verified in the evening
        if (item.status === 'selesai') {
            jumlahPayout += item.payout;
            jumlahUntung += item.untung;
        }

        if (!groupedData[item.vendor]) {
            groupedData[item.vendor] = { vendorTotal: 0, items: [] };
        }
        if (item.status === 'selesai') {
            groupedData[item.vendor].vendorTotal += item.payout;
        }
        groupedData[item.vendor].items.push({ ...item, originalIndex: index });
    });

    if (Object.keys(groupedData).length === 0) {
        container.innerHTML = `<p style="color: var(--text-muted); font-size: 1.1rem; padding: 20px 0; text-align: center;">Belum ada kemasukan sesi pagi direkodkan.</p>`;
    }

    for (const vendorName in groupedData) {
        const vendorData = groupedData[vendorName];
        const vendorGroupDiv = document.createElement('div');
        vendorGroupDiv.className = 'vendor-group';

        vendorGroupDiv.innerHTML = `
            <div class="vendor-header">
                <div>
                    <h3>${vendorName || "Tidak Dinamakan"}</h3>
                    <span class="vendor-payout-text">Bayar: <b>RM ${vendorData.vendorTotal.toFixed(2)}</b></span>
                </div>
                <button onclick="hantarWhatsApp('${vendorName}')" class="btn-whatsapp-compact">Hantar WhatsApp</button>
            </div>
        `;

        vendorData.items.forEach(item => {
            const row = document.createElement('div');
            row.className = 'item-row';

            if (item.status === 'pending') {
                // UI for Morning (Needs Action)
                row.style.borderLeft = '4px solid #f59e0b'; // Amber warning
                row.innerHTML = `
                    <div class="item-main">
                        <span class="item-name">${item.makanan}</span>
                        <span class="item-stats">Hantar: <b style="color: var(--text-main);">${item.hantar}</b> | Modal: RM ${item.hargaV.toFixed(2)}</span>
                    </div>
                    <div class="item-right" style="gap: 8px;">
                        <input type="number" id="inputBaki_${item.originalIndex}" class="baki-input-box" placeholder="Baki" min="0" max="${item.hantar}">
                        <button onclick="sahkanPetang(${item.originalIndex})" class="btn-sahkan">Sahkan</button>
                        <button onclick="padamItem(${item.originalIndex})" class="btn-del" style="background:transparent; color:var(--danger); border:none; width:auto; font-size:1.8rem; padding:0;">&times;</button>
                    </div>
                `;
            } else {
                // UI for Evening (Completed)
                row.style.borderLeft = '4px solid var(--whatsapp)'; // Green confirmed
                row.innerHTML = `
                    <div class="item-main">
                        <span class="item-name">${item.makanan}</span>
                        <span class="item-stats">Hantar: ${item.hantar} | Jual: <b>${item.laku}</b> | Baki: <b>${item.baki}</b></span>
                    </div>
                    <div class="item-right">
                        <div style="display:flex; flex-direction:column; align-items:flex-end;">
                            <span class="item-amount">RM ${item.payout.toFixed(2)}</span>
                            <button onclick="undoPetang(${item.originalIndex})" class="btn-undo">Ubah Baki</button>
                        </div>
                    </div>
                `;
            }
            vendorGroupDiv.appendChild(row);
        });

        container.appendChild(vendorGroupDiv);
    }

    document.getElementById('grandPayout').innerText = jumlahPayout.toFixed(2);
    document.getElementById('grandUntung').innerText = jumlahUntung.toFixed(2);
}

// --- 4. CLOSE SHOP & PUSH TO HISTORY ---
document.getElementById('btnTutup').addEventListener('click', () => {
    if (senaraiJualan.length === 0) {
        alert("Tiada rekod untuk disimpan hari ini.");
        return;
    }

    // Safety check for forgotten items
    const pendingItems = senaraiJualan.filter(item => item.status === 'pending');
    if (pendingItems.length > 0) {
        if (!confirm(`Terdapat ${pendingItems.length} makanan yang belum disahkan baki.\n\nJika anda tutup kedai sekarang, item yang belum disahkan TIDAK akan dikira dan TIDAK akan direkodkan dalam sejarah.\n\nTeruskan tutup kedai?`)) {
            return;
        }
    }

    const completedItems = senaraiJualan.filter(item => item.status === 'selesai');
    if (completedItems.length === 0) {
        alert("Tiada jualan yang telah disahkan untuk disimpan ke sejarah.");
        return;
    }

    if (confirm("Tutup kedai dan simpan rekod yang sah ke dalam Sejarah?")) {
        const today = new Date().toISOString().split('T')[0];
        const tarikhPilihan = prompt("Sila sahkan tarikh untuk rekod ini (YYYY-MM-DD):", today);

        if (tarikhPilihan) {
            archiveDailyData(tarikhPilihan, completedItems); // Only save finished items
            senaraiJualan = []; // Wipe the active session clean
            saveJualan(senaraiJualan);
            renderPaparan();
            alert("Rekod berjaya disimpan ke Sejarah!");
        }
    }
});

// --- WHATSAPP GENERATOR (Updated) ---
window.hantarWhatsApp = function (vendorName) {
    // Only fetch finished items for the receipt
    const items = senaraiJualan.filter(item => item.vendor === vendorName && item.status === 'selesai');

    if (items.length === 0) {
        alert("Sila sahkan sekurang-kurangnya satu baki makanan untuk vendor ini sebelum menghantar resit.");
        return;
    }

    let totalPayout = 0;
    const tarikh = new Date().toLocaleDateString('ms-MY');
    let message = `*Resit Jualan Warung*\nVendor: ${vendorName}\nTarikh: ${tarikh}\n\n`;

    items.forEach(item => {
        totalPayout += item.payout;
        message += `    *${item.makanan}*\n`;
        message += `    Jual: ${item.laku} | Baki: ${item.baki}\n`;
        message += `    Bayaran: RM ${item.payout.toFixed(2)}\n\n`;
    });

    message += `*Jumlah Bayaran: RM ${totalPayout.toFixed(2)}*\n`;
    message += `Terima kasih!`;

    const waLink = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(waLink, '_blank');
};

// Initial Load
initDropdowns();
renderPaparan();