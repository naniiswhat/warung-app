// Pull the shared catalog from database.js
let katalog = getKatalog();

// --- 1. RENDER THE CATALOG & DROPDOWNS ---
function renderKatalog() {
    const container = document.getElementById('katalogContainer');
    const selectVendor = document.getElementById('selectVendorForFood');

    // Clear current views
    container.innerHTML = '<h2 style="text-align: left; margin-bottom: 12px;">Senarai Katalog Semasa</h2>';
    selectVendor.innerHTML = '<option value="">-- Sila Pilih Vendor --</option>';

    // Loop through the catalog dictionary
    for (const vendorName in katalog) {

        // A. Populate the "Tambah Makanan" dropdown
        const opt = document.createElement('option');
        opt.value = vendorName;
        opt.innerText = vendorName;
        selectVendor.appendChild(opt);

        // B. Build the visual vendor card
        const vendorDiv = document.createElement('div');
        vendorDiv.className = 'vendor-group';

        let itemsHtml = '';

        // Build compact horizontal row per item (matches dashboard style)
        katalog[vendorName].forEach((food, index) => {
            itemsHtml += `
                <div class="item-row">
                    <div class="item-main">
                        <span class="item-name">${food.nama}</span>
                        <span class="item-stats">Modal: <b>RM ${food.hargaV.toFixed(2)}</b> | Jual: <b>RM ${food.hargaJ.toFixed(2)}</b></span>
                    </div>
                    <button onclick="padamMakanan('${vendorName}', ${index})" class="btn-del" title="Buang Makanan">&times;</button>
                </div>
            `;
        });

        // Vendor Header with Delete Button
        vendorDiv.innerHTML = `
            <div class="vendor-header" style="display: flex; justify-content: space-between; align-items: center;">
                <h3 style="margin:0;">${vendorName}</h3>
                <button onclick="padamVendor('${vendorName}')" style="background: none; border: none; color: #ef4444; font-size: 1.5rem; cursor: pointer; padding: 0 8px;" title="Padam Vendor">&times;</button>
            </div>
            ${itemsHtml}
        `;

        container.appendChild(vendorDiv);
    }
}

// --- 2. ADD NEW VENDOR ---
document.getElementById('btnAddVendor').addEventListener('click', () => {
    const name = document.getElementById('newVendorName').value.trim();
    if (name) {
        if (!katalog[name]) {
            katalog[name] = []; // Create an empty array for their foods
            saveKatalog(katalog); // Save to LocalStorage via database.js
            document.getElementById('newVendorName').value = ''; // Clear input
            renderKatalog(); // Refresh screen
        } else {
            alert("Vendor ini sudah wujud di dalam sistem!");
        }
    }
});

// --- 3. ADD NEW FOOD ---
document.getElementById('btnAddFood').addEventListener('click', () => {
    const vendor = document.getElementById('selectVendorForFood').value;
    const foodName = document.getElementById('newFoodName').value.trim();
    const hargaV = parseFloat(document.getElementById('newHargaV').value);
    const hargaJ = parseFloat(document.getElementById('newHargaJ').value);

    if (vendor && foodName && !isNaN(hargaV) && !isNaN(hargaJ)) {
        // Push the new food object into the selected vendor's array
        katalog[vendor].push({ nama: foodName, hargaV: hargaV, hargaJ: hargaJ });
        saveKatalog(katalog);

        document.getElementById('newFoodName').value = ''; // Clear input
        renderKatalog(); // Refresh screen
    } else {
        alert("Sila pilih vendor dan isikan butiran makanan dengan betul.");
    }
});

// --- 4. DELETE FUNCTIONS ---
window.padamMakanan = function (vendorName, index) {
    if (confirm(`Padam makanan ini daripada senarai ${vendorName}?`)) {
        katalog[vendorName].splice(index, 1);
        saveKatalog(katalog);
        renderKatalog();
    }
};

window.padamVendor = function (vendorName) {
    if (confirm(`PERHATIAN: Adakah anda pasti mahu memadam VENDOR ${vendorName} berserta semua senarai makanannya?`)) {
        delete katalog[vendorName]; // Completely removes the key from the dictionary
        saveKatalog(katalog);
        renderKatalog();
    }
};

// --- BACKUP / IMPORT LISTENER ---
document.getElementById('btnImport').addEventListener('click', () => {
    const fileInput = document.getElementById('importFile');
    if (fileInput.files.length === 0) {
        alert("Sila pilih fail backup (.json) terlebih dahulu.");
        return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = function (e) {
        const contents = e.target.result;
        importSemuaData(contents); // This calls the function in database.js
    };

    reader.readAsText(file);
});

// --- INITIALIZE ---
renderKatalog();