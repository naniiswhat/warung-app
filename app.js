// Grab sales from database.js
let senaraiJualan = getJualan();

// Inputs
const vendorNameInput = document.getElementById('vendorName');
const foodNameInput = document.getElementById('foodName');
const hargaVendorInput = document.getElementById('hargaVendor');
const hargaJualInput = document.getElementById('hargaJual');
const qtyHantarInput = document.getElementById('qtyHantar');
const qtyLakuInput = document.getElementById('qtyLaku');

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

function tambahRekod() {
    // 1. Calculate Math
    const hargaV = parseFloat(hargaVendorInput.value) || 0;
    const hargaJ = parseFloat(hargaJualInput.value) || 0;
    const hantar = parseInt(qtyHantarInput.value) || 0;
    const laku = parseInt(qtyLakuInput.value) || 0;

    const baki = hantar - laku;
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
    container.innerHTML = ''; // Clear current view

    let jumlahPayout = 0;
    let jumlahUntung = 0;

    // 1. Organize data into Vendor Groups
    const groupedData = {};

    senaraiJualan.forEach((item, index) => {
        jumlahPayout += item.payout;
        jumlahUntung += item.untung;

        // If this vendor doesn't exist in our group yet, create them
        if (!groupedData[item.vendor]) {
            groupedData[item.vendor] = {
                vendorTotal: 0,
                items: []
            };
        }

        // Add this item's payout to the vendor's subtotal
        groupedData[item.vendor].vendorTotal += item.payout;
        // Save the item along with its original array index for the Padam button
        groupedData[item.vendor].items.push({ ...item, originalIndex: index });
    });

    // 2. Render the Groups to the screen
    for (const vendorName in groupedData) {
        const vendorData = groupedData[vendorName];

        // Create the Vendor Container
        const vendorGroupDiv = document.createElement('div');
        vendorGroupDiv.className = 'vendor-group';
        vendorGroupDiv.innerHTML = `
            <div class="vendor-header">
                <h3>Vendor: ${vendorName || "Tidak Dinamakan"}</h3>
                <p>Bayar Vendor: RM ${vendorData.vendorTotal.toFixed(2)}</p>
                <!-- ADD THE WHATSAPP BUTTON HERE -->
                <button onclick="hantarWhatsApp('${vendorName}')" class="btn-whatsapp">Hantar Resit WhatsApp</button>
            </div>
        `;

        // Loop through this specific vendor's foods and create their cards
        vendorData.items.forEach(item => {
            const card = document.createElement('div');
            card.className = 'results item-card';
            card.innerHTML = `
                <p><strong>${item.makanan}</strong></p>
                <p>Baki Pulangkan: <span>${item.baki}</span></p>
                <p>Bayaran: RM <span>${item.payout.toFixed(2)}</span></p>
                <p>Untung: RM <span>${item.untung.toFixed(2)}</span></p>
                <button onclick="padamItem(${item.originalIndex})" class="btn-padam">Padam</button>
            `;
            vendorGroupDiv.appendChild(card);
        });

        // Add the whole vendor block to the main screen
        container.appendChild(vendorGroupDiv);
    }

    // Update Grand Totals at the very bottom
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