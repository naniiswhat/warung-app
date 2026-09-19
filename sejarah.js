const tarikhSelect = document.getElementById('tarikhSejarah');
const container = document.getElementById('sejarahContainer');

// 1. Populate the Date Dropdown on load
function initSejarah() {
    const history = getHistory();
    const dates = Object.keys(history).sort((a, b) => b.localeCompare(a));

    tarikhSelect.innerHTML = '<option value="">-- Sila Pilih Tarikh --</option>';

    if (dates.length === 0) {
        tarikhSelect.innerHTML = '<option value="">Tiada rekod dijumpai</option>';
        return;
    }

    dates.forEach(date => {
        const opt = document.createElement('option');
        opt.value = date;
        opt.innerText = date;
        tarikhSelect.appendChild(opt);
    });

    // AUTO-LOAD THE NEWEST DATE
    if (dates.length > 0) {
        tarikhSelect.value = dates[0];
        renderSejarah();
    }
}

// 2. Render the specific date's data
function renderSejarah() {
    const selectedDate = tarikhSelect.value;

    if (!selectedDate) {
        container.innerHTML = '<p style="text-align:center; color:#64748b; margin-top:20px;">Sila pilih tarikh untuk melihat rekod.</p>';
        return;
    }

    const history = getHistory();
    const dataTarikh = history[selectedDate] || [];

    container.innerHTML = '';
    let jumlahPayout = 0;
    let jumlahUntung = 0;
    const groupedData = {};

    // Grouping Logic (Identical to Dashboard)
    dataTarikh.forEach(item => {
        jumlahPayout += item.payout;
        jumlahUntung += item.untung;

        if (!groupedData[item.vendor]) {
            groupedData[item.vendor] = { vendorTotal: 0, items: [] };
        }
        groupedData[item.vendor].vendorTotal += item.payout;
        groupedData[item.vendor].items.push(item);
    });

    // Render Logic
    for (const vendorName in groupedData) {
        const vendorData = groupedData[vendorName];

        const vendorGroupDiv = document.createElement('div');
        vendorGroupDiv.className = 'vendor-group';
        vendorGroupDiv.innerHTML = `
            <div class="vendor-header">
                <h3 style="margin:0;">${vendorName}</h3>
                <p>Bayar Vendor: RM ${vendorData.vendorTotal.toFixed(2)}</p>
            </div>
        `;

        vendorData.items.forEach(item => {
            const card = document.createElement('div');
            card.className = 'results item-card';
            card.innerHTML = `
                <p><strong>${item.makanan}</strong></p>
                <p>Baki Pulangkan: <span>${item.baki}</span></p>
                <p>Bayaran: RM <span>${item.payout.toFixed(2)}</span></p>
                <p>Untung: RM <span>${item.untung.toFixed(2)}</span></p>
            `;
            vendorGroupDiv.appendChild(card);
        });
        container.appendChild(vendorGroupDiv);
    }

    // Add Grand Totals at the bottom
    if (dataTarikh.length > 0) {
        const grandDiv = document.createElement('div');
        grandDiv.className = 'results grand-total';
        grandDiv.innerHTML = `
            <p>Jumlah Keseluruhan Vendor: RM <span>${jumlahPayout.toFixed(2)}</span></p>
            <p><strong>Jumlah Untung Bersih: RM <span>${jumlahUntung.toFixed(2)}</span></strong></p>
        `;
        container.appendChild(grandDiv);
    }
}

// Add event listener to update the view when a new date is selected
tarikhSelect.addEventListener('change', renderSejarah);

// Run on page load
initSejarah();