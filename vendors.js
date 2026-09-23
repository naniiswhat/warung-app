let katalog = getKatalog();

// --- PRICING TOGGLE LOGIC ---
let jenisKemasukan = 'tetap';
const btnJenisTetap = document.getElementById('btnJenisTetap');
const btnJenisPeratus = document.getElementById('btnJenisPeratus');
const labelHargaV = document.getElementById('labelHargaV');
const newHargaV = document.getElementById('newHargaV');
const newHargaJ = document.getElementById('newHargaJ');
const sortKatalog = document.getElementById('sortKatalog');

btnJenisTetap.addEventListener('click', () => {
    jenisKemasukan = 'tetap';
    btnJenisTetap.classList.add('active');
    btnJenisPeratus.classList.remove('active');
    labelHargaV.innerText = 'Modal Vendor (RM)';
    newHargaV.value = '0.70';
    newHargaV.step = '0.10';
});

btnJenisPeratus.addEventListener('click', () => {
    jenisKemasukan = 'peratus';
    btnJenisPeratus.classList.add('active');
    btnJenisTetap.classList.remove('active');
    labelHargaV.innerText = 'Peratus Vendor (%)';
    newHargaV.value = '70'; // e.g. 70%
    newHargaV.step = '1';
});

// --- RENDER & SORT CATALOG ---
sortKatalog.addEventListener('change', renderKatalog);

function renderKatalog() {
    const container = document.getElementById('katalogContainer');
    const selectVendor = document.getElementById('selectVendorForFood');
    const sortType = sortKatalog.value; // 'az' or 'za'

    container.innerHTML = '';
    selectVendor.innerHTML = '<option value="">-- Sila Pilih Vendor --</option>';

    // 1. Sort the Vendor Names
    const vendorNames = Object.keys(katalog).sort((a, b) => {
        return sortType === 'az' ? a.localeCompare(b) : b.localeCompare(a);
    });

    vendorNames.forEach(vendorName => {
        // Populate Dropdown
        const opt = document.createElement('option');
        opt.value = vendorName;
        opt.innerText = vendorName;
        selectVendor.appendChild(opt);

        // Build UI Card
        const vendorDiv = document.createElement('div');
        vendorDiv.className = 'vendor-group';
        let itemsHtml = '';

        // 2. Sort the Food Items inside the Vendor
        const sortedFoods = [...katalog[vendorName]].sort((a, b) => {
            return sortType === 'az' ? a.nama.localeCompare(b.nama) : b.nama.localeCompare(a.nama);
        });

        sortedFoods.forEach((food) => {
            // Find original index so delete button doesn't delete the wrong item after sorting
            const originalIndex = katalog[vendorName].findIndex(f => f.nama === food.nama);

            // Add a gold percentage indicator if it was saved via the percentage mode
            let hargaLabel = `Modal: <b>RM ${food.hargaV.toFixed(2)}</b>`;
            if (food.jenis === 'peratus') {
                hargaLabel += ` <span style="font-size:0.85rem; color:var(--accent-gold); margin-left:4px;">(${food.nilaiAsal}%)</span>`;
            }

            itemsHtml += `
                <div class="item-row">
                    <div class="item-main">
                        <span class="item-name">${food.nama}</span>
                        <span class="item-stats">${hargaLabel} | Jual: <b>RM ${food.hargaJ.toFixed(2)}</b></span>
                    </div>
                    <button onclick="padamMakanan('${vendorName}', ${originalIndex})" class="btn-del" title="Buang Makanan">&times;</button>
                </div>
            `;
        });

        vendorDiv.innerHTML = `
            <div class="vendor-header">
                <h3 style="margin:0;">${vendorName}</h3>
                <button onclick="padamVendor('${vendorName}')" style="background: none; border: none; color: var(--danger); font-size: 1.5rem; cursor: pointer; padding: 0 8px;" title="Padam Vendor">&times;</button>
            </div>
            ${itemsHtml}
        `;
        container.appendChild(vendorDiv);
    });
}

// --- ADD VENDOR ---
document.getElementById('btnAddVendor').addEventListener('click', () => {
    const name = document.getElementById('newVendorName').value.trim();
    if (name) {
        if (!katalog[name]) {
            katalog[name] = [];
            saveKatalog(katalog);
            document.getElementById('newVendorName').value = '';
            renderKatalog();
        } else {
            alert("Vendor ini sudah wujud di dalam sistem!");
        }
    }
});

// --- ADD FOOD (With Percentage Math) ---
document.getElementById('btnAddFood').addEventListener('click', () => {
    const vendor = document.getElementById('selectVendorForFood').value;
    const foodName = document.getElementById('newFoodName').value.trim();
    const hargaJ = parseFloat(newHargaJ.value);
    const inputVendor = parseFloat(newHargaV.value);

    if (vendor && foodName && !isNaN(inputVendor) && !isNaN(hargaJ)) {
        let finalHargaV = 0;
        let recordJenis = 'tetap';
        let recordNilai = inputVendor;

        // Perform math immediately if percentage mode is active
        if (jenisKemasukan === 'peratus') {
            finalHargaV = hargaJ * (inputVendor / 100);
            recordJenis = 'peratus';
        } else {
            finalHargaV = inputVendor;
        }

        // Save the calculated RM value so the rest of the app doesn't break
        katalog[vendor].push({
            nama: foodName,
            hargaV: finalHargaV,
            hargaJ: hargaJ,
            jenis: recordJenis,
            nilaiAsal: recordNilai
        });

        saveKatalog(katalog);
        document.getElementById('newFoodName').value = '';
        renderKatalog();
    } else {
        alert("Sila pilih vendor dan isikan butiran makanan dengan betul.");
    }
});

// --- DELETE FUNCTIONS ---
window.padamMakanan = function (vendorName, index) {
    if (confirm(`Padam makanan ini daripada senarai ${vendorName}?`)) {
        katalog[vendorName].splice(index, 1);
        saveKatalog(katalog);
        renderKatalog();
    }
};

window.padamVendor = function (vendorName) {
    if (confirm(`PERHATIAN: Adakah anda pasti mahu memadam VENDOR ${vendorName} berserta semua senarai makanannya?`)) {
        delete katalog[vendorName];
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
        importSemuaData(e.target.result);
    };
    reader.readAsText(file);
});

// --- INITIALIZE ---
renderKatalog();