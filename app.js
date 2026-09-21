// Grab sales from database.js
let senaraiJualan = getJualan();

// Inputs
const vendorNameInput = document.getElementById('vendorName');
const foodNameInput = document.getElementById('foodName');
const hargaVendorInput = document.getElementById('hargaVendor');
const hargaJualInput = document.getElementById('hargaJual');
const qtyHantarInput = document.getElementById('qtyHantar');
const qtyInputDinamik = document.getElementById('qtyInputDinamik');
const labelKuantitiDinamik = document.getElementById('labelKuantitiDinamik');
const btnModeLaku = document.getElementById('btnModeLaku');
const btnModeBaki = document.getElementById('btnModeBaki');

let kemasukanMode = 'laku'; // Default mode

function initDropdowns() {
    const katalog = getKatalog(); // Pull from LS
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
    const katalog = getKatalog(); // Pull from LS
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

function autofillPrices() {
    const selectedOption = foodNameInput.options[foodNameInput.selectedIndex];
    if (selectedOption) {
        document.getElementById('hargaVendor').value = parseFloat(selectedOption.dataset.hargaV).toFixed(2);
        document.getElementById('hargaJual').value = parseFloat(selectedOption.dataset.hargaJ).toFixed(2);
    }
}

vendorNameInput.addEventListener('change', updateFoodDropdown);
foodNameInput.addEventListener('change', autofillPrices);

// --- AUTO-CALCULATE TOGGLE LOGIC ---
btnModeLaku.addEventListener('click', () => {
    kemasukanMode = 'laku';
    btnModeLaku.classList.add('active');
    btnModeBaki.classList.remove('active');
    labelKuantitiDinamik.innerText = 'Laku (Terjual)';
    qtyInputDinamik.value = '0';
});

btnModeBaki.addEventListener('click', () => {
    kemasukanMode = 'baki';
    btnModeBaki.classList.add('active');
    btnModeLaku.classList.remove('active');
    labelKuantitiDinamik.innerText = 'Baki (Sisa)';
    qtyInputDinamik.value = '0';
});

function tambahRekod() {
    // 1. Calculate Math
    const hargaV = parseFloat(hargaVendorInput.value) || 0;
    const hargaJ = parseFloat(hargaJualInput.value) || 0;
    const hantar = parseInt(qtyHantarInput.value) || 0;

    // The user's input could be the "Laku" OR the "Baki" depending on the toggle
    const inputDinamik = parseInt(qtyInputDinamik.value) || 0;

    let laku = 0;
    let baki = 0;

    if (kemasukanMode === 'laku') {
        laku = inputDinamik;
        baki = hantar - laku;
    } else if (kemasukanMode === 'baki') {
        baki = inputDinamik;
        laku = hantar - baki;
    }

    // Failsafe to prevent negative leftovers
    if (baki < 0) {
        alert("Ralat: Jumlah laku tidak boleh melebihi kuantiti hantar.");
        return;
    }

    const payout = laku * hargaV;
    const untung = laku * (hargaJ - hargaV);

    // 2. Create Data Object
    const rekodBaru = {
        vendor: vendorNameInput.value,
        makanan: foodNameInput.value,
        laku: laku,
        baki: baki,
        payout: payout,
        untung: untung
    };

    // 3. Save to Array and LocalStorage
    senaraiJualan.push(rekodBaru);
    saveJualan(senaraiJualan);

    // 4. Update UI
    renderPaparan();
}

function renderPaparan() {
    const container = document.getElementById('senaraiContainer');
    container.innerHTML = '';

    let jumlahPayout = 0;
    let jumlahUntung = 0;
    const groupedData = {};

    senaraiJualan.forEach((item, index) => {
        jumlahPayout += item.payout;
        jumlahUntung += item.untung;

        if (!groupedData[item.vendor]) {
            groupedData[item.vendor] = { vendorTotal: 0, items: [] };
        }
        groupedData[item.vendor].vendorTotal += item.payout;
        groupedData[item.vendor].items.push({ ...item, originalIndex: index });
    });

    if (Object.keys(groupedData).length === 0) {
        container.innerHTML = '<p style="color: var(--text-muted); font-size: 1.1rem; padding: 20px 0; text-align: center;">Belum ada jualan direkodkan hari ini.</p>';
    }

    for (const vendorName in groupedData) {
        const vendorData = groupedData[vendorName];
        const vendorGroupDiv = document.createElement('div');
        vendorGroupDiv.className = 'vendor-group';

        // Header with inline WhatsApp button & large total
        vendorGroupDiv.innerHTML = `
            <div class="vendor-header">
                <div>
                    <h3>${vendorName || "Tidak Dinamakan"}</h3>
                    <span class="vendor-payout-text">Bayar: <b>RM ${vendorData.vendorTotal.toFixed(2)}</b></span>
                </div>
                <button onclick="hantarWhatsApp('${vendorName}')" class="btn-whatsapp-compact">
                    Hantar WhatsApp
                </button>
            </div>
        `;

        // Compact horizontal row per item
        vendorData.items.forEach(item => {
            const row = document.createElement('div');
            row.className = 'item-row';
            row.innerHTML = `
                <div class="item-main">
                    <span class="item-name">${item.makanan}</span>
                    <span class="item-stats">Jual: <b>${item.laku || 0}</b> | Baki: <b>${item.baki}</b></span>
                </div>
                <div class="item-right">
                    <span class="item-amount">RM ${item.payout.toFixed(2)}</span>
                    <button onclick="padamItem(${item.originalIndex})" class="btn-del" title="Padam">&times;</button>
                </div>
            `;
            vendorGroupDiv.appendChild(row);
        });

        container.appendChild(vendorGroupDiv);
    }

    document.getElementById('grandPayout').innerText = jumlahPayout.toFixed(2);
    document.getElementById('grandUntung').innerText = jumlahUntung.toFixed(2);
}

function padamItem(index) {
    if (confirm("Padam rekod makanan ini?")) {
        senaraiJualan.splice(index, 1); // Removes 1 item at the given index
        saveJualan(senaraiJualan); // Update save data
        renderPaparan(); // Refresh the screen
    }
}

function tutupKedai() {
    if (senaraiJualan.length === 0) {
        alert("Tiada rekod jualan untuk disimpan hari ini.");
        return;
    }

    if (confirm("Tutup kedai dan simpan rekod hari ini ke dalam Sejarah?")) {
        // Generate today's date in YYYY-MM-DD format
        const today = new Date().toISOString().split('T')[0];

        // Let the user confirm or edit the date
        const tarikhPilihan = prompt("Sila sahkan tarikh untuk rekod ini (YYYY-MM-DD):", today);

        if (tarikhPilihan) {
            // Save to history using our new database.js function
            archiveDailyData(tarikhPilihan, senaraiJualan);

            // Clear current day's dashboard
            senaraiJualan = [];
            saveJualan(senaraiJualan);
            renderPaparan();

            alert("Rekod berjaya disimpan ke Sejarah!");
        }
    }
}

// Event Listeners for Buttons
document.getElementById('btnTambah').addEventListener('click', tambahRekod);
document.getElementById('btnTutup').addEventListener('click', tutupKedai);

// Initial Load
initDropdowns();
renderPaparan();

// --- WHATSAPP RECEIPT GENERATOR ---
window.hantarWhatsApp = function (vendorName) {
    // 1. Gather only the items for this specific vendor
    const items = senaraiJualan.filter(item => item.vendor === vendorName);
    if (items.length === 0) return;

    let totalPayout = 0;

    // 2. Format the Header
    const tarikh = new Date().toLocaleDateString('ms-MY');
    let message = `*Resit Jualan Warung*\nVendor: ${vendorName}\nTarikh: ${tarikh}\n\n`;

    // 3. Format the Items
    items.forEach(item => {
        totalPayout += item.payout;
        // Check if laku exists (for compatibility with old saved data)
        const lakuText = item.laku !== undefined ? item.laku : "N/A";

        message += `    *${item.makanan}*\n`;
        message += `    Jual: ${lakuText} | Baki: ${item.baki}\n`;
        message += `    Bayaran: RM ${item.payout.toFixed(2)}\n\n`;
    });

    // 4. Format the Grand Total
    message += `*Jumlah Bayaran: RM ${totalPayout.toFixed(2)}*\n`;
    message += `Terima kasih!`;

    // 5. Open WhatsApp
    // This URL opens WhatsApp and pre-fills the message text. 
    // Your mom just selects the contact from her list.
    const waLink = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(waLink, '_blank');
};