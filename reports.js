let currentFilter = 'hari'; // Default saat buka langsung hari ini
let customDateValue = '';
let myChart = null;

function filterByCustomDate() {
    const dateVal = document.getElementById('customDate').value;
    if(!dateVal) return;
    currentFilter = 'custom'; customDateValue = dateVal;
    const [y, m, d] = dateVal.split('-');
    const dateText = new Date(y, parseInt(m)-1, d).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    document.getElementById('periodeTextUI').innerText = dateText;
    document.getElementById('docPeriodeText').innerText = dateText;
    loadFinanceReports();
}

function filterReports(type) {
    currentFilter = type; document.getElementById('customDate').value = '';
    const labels = { 'hari': 'Hari Ini', 'bulan': 'Bulan Ini', 'tahun': 'Tahun Ini', 'semua': 'Semua Waktu' };
    document.getElementById('periodeTextUI').innerText = labels[type];
    document.getElementById('docPeriodeText').innerText = labels[type];
    loadFinanceReports();
}

function matchDate(dateString) {
    if(currentFilter === 'semua') return true;
    const [datePart] = dateString.split(', ');
    if(currentFilter === 'hari') return datePart === new Date().toLocaleDateString('id-ID');
    if(currentFilter === 'bulan') {
        const now = new Date(); const parts = datePart.split('/');
        return parseInt(parts[1]) === (now.getMonth() + 1) && parseInt(parts[2]) === now.getFullYear();
    }
    if(currentFilter === 'tahun') return parseInt(datePart.split('/')[2]) === new Date().getFullYear();
    if(currentFilter === 'custom') {
        const [cy, cm, cd] = customDateValue.split('-');
        return datePart === new Date(cy, parseInt(cm)-1, cd).toLocaleDateString('id-ID');
    }
    return true;
}

function loadFinanceReports() {
    let allSales = []; let allExpenses = []; let masterProducts = [];
    try { allSales = JSON.parse(localStorage.getItem('sales') || '[]'); if(!Array.isArray(allSales)) allSales = Object.values(allSales); } catch(e) {}
    try { allExpenses = JSON.parse(localStorage.getItem('expenses') || '[]'); if(!Array.isArray(allExpenses)) allExpenses = Object.values(allExpenses); } catch(e) {}
    try { masterProducts = JSON.parse(localStorage.getItem('products') || '[]'); if(!Array.isArray(masterProducts)) masterProducts = Object.values(masterProducts); } catch(e) {}
    
    const sales = allSales.filter(s => matchDate(s.date));
    const expenses = allExpenses.filter(e => matchDate(e.date));

    let totalOmzet = 0, totalHPP = 0, totalPengeluaran = 0;
    let itemAnalytics = {}; 
    let chartData = {}; 
    let docSalesHTML = ''; // Untuk nampung rincian PDF

    // 1. PROSES DATA PENJUALAN
    sales.forEach(s => {
        totalOmzet += s.total; 
        
        let parts = s.date.split(', ');
        let datePart = parts[0];
        let timePart = parts[1] || "00:00:00";
        let labelKey = "";

        // LOGIKA GRAFIK DINAMIS
        if (currentFilter === 'hari' || currentFilter === 'custom') {
            labelKey = timePart.substring(0, 5); // Tampilkan Jam:Menit (ex: 14:30)
        } else if (currentFilter === 'bulan') {
            let dParts = datePart.split('/');
            labelKey = dParts[0] + "/" + dParts[1]; // Tampilkan Tanggal/Bulan (ex: 03/03)
        } else if (currentFilter === 'tahun') {
            let monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
            labelKey = monthNames[parseInt(datePart.split('/')[1]) - 1]; // Tampilkan Nama Bulan
        } else {
            let monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
            labelKey = monthNames[parseInt(datePart.split('/')[1]) - 1] + " " + datePart.split('/')[2];
        }
        
        if(!chartData[labelKey]) chartData[labelKey] = 0;
        chartData[labelKey] += s.total;

        // PROSES RINCIAN ITEM & HPP
        s.items.forEach(item => {
            const dbProduct = masterProducts.find(p => p.name === item.name);
            const itemCost = dbProduct ? dbProduct.cost : 0;
            totalHPP += (itemCost * item.qty);

            // Tulis baris untuk PDF
            let shortId = String(s.id).slice(-6);
            docSalesHTML += `
                <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 6px;">${currentFilter === 'hari' ? timePart : s.date}</td>
                    <td style="padding: 6px; font-family: monospace; color: #64748b;">#${shortId}</td>
                    <td style="padding: 6px; font-weight: bold;">${item.name}</td>
                    <td style="padding: 6px; text-align: center;">${item.qty}</td>
                    <td style="padding: 6px; text-align: right; color: #ef4444;">${itemCost.toLocaleString('id-ID')}</td>
                    <td style="padding: 6px; text-align: right;">${item.price.toLocaleString('id-ID')}</td>
                    <td style="padding: 6px; text-align: right; font-weight: bold;">${item.total.toLocaleString('id-ID')}</td>
                </tr>
            `;

            // Hitung Menu Terlaris UI
            if(!itemAnalytics[item.name]) itemAnalytics[item.name] = { qty: 0, total: 0 };
            itemAnalytics[item.name].qty += item.qty;
            itemAnalytics[item.name].total += item.total;
        });
    });

    if(sales.length === 0) {
        docSalesHTML = '<tr><td colspan="7" style="text-align:center; padding:15px; font-style:italic;">Tidak ada transaksi pada periode ini.</td></tr>';
    }
    document.getElementById('docSalesLog').innerHTML = docSalesHTML;

    let totalLabaKotor = totalOmzet - totalHPP; 

    // 2. PROSES ITEM TERLARIS (UI)
    let sortedItems = Object.keys(itemAnalytics).map(key => {
        return { name: key, qty: itemAnalytics[key].qty, total: itemAnalytics[key].total };
    }).sort((a, b) => b.qty - a.qty); 

    let uiTopHTML = '';
    if(sortedItems.length === 0) {
        uiTopHTML = '<tr><td colspan="3" style="text-align:center; color:#999; padding:15px;">Belum ada data penjualan</td></tr>';
    } else {
        sortedItems.forEach(item => {
            uiTopHTML += `<tr style="border-bottom: 1px solid #f0f2f5;">
                <td style="padding: 8px;"><strong>${item.name}</strong></td>
                <td style="text-align:center; padding: 8px;">${item.qty}</td>
                <td style="text-align:right; color:#27ae60; font-weight:bold; padding: 8px;">Rp ${item.total.toLocaleString('id-ID')}</td>
            </tr>`;
        });
    }
    document.getElementById('uiTopItems').innerHTML = uiTopHTML;

    // 3. PROSES PENGELUARAN (UI & PDF)
    let uiExpHTML = '', docExpHTML = '';
    if(expenses.length === 0) {
        uiExpHTML = '<tr><td colspan="3" style="text-align:center; color:#999; padding:15px;">Belum ada biaya tercatat</td></tr>';
        docExpHTML = '<tr><td colspan="3" style="text-align:center; padding:15px; font-style:italic;">Tidak ada pengeluaran operasional.</td></tr>';
    } else {
        expenses.forEach(e => {
            totalPengeluaran += e.amount;
            uiExpHTML += `<tr style="border-bottom: 1px solid #f0f2f5;">
                <td style="padding: 8px;">${e.date.split(', ')[0]}</td>
                <td style="padding: 8px;">${e.desc}</td>
                <td style="text-align:right; color:#e74c3c; font-weight:bold; padding: 8px;">Rp ${e.amount.toLocaleString('id-ID')}</td>
            </tr>`;
            docExpHTML += `<tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 6px;">${e.date}</td>
                <td style="padding: 6px;">${e.desc}</td>
                <td style="text-align:right; padding: 6px; font-weight:bold;">Rp ${e.amount.toLocaleString('id-ID')}</td>
            </tr>`;
        });
    }
    document.getElementById('uiExpenseList').innerHTML = uiExpHTML;
    document.getElementById('docExpenseLog').innerHTML = docExpHTML;

    const labaBersih = totalLabaKotor - totalPengeluaran;
    
    // UPDATE ANGKA RINGKASAN UI
    document.getElementById('uiOmzet').innerText = `Rp ${totalOmzet.toLocaleString('id-ID')}`;
    document.getElementById('uiMargin').innerText = `Rp ${totalLabaKotor.toLocaleString('id-ID')}`;
    document.getElementById('uiExpense').innerText = `Rp ${totalPengeluaran.toLocaleString('id-ID')}`;
    document.getElementById('uiNet').innerText = `Rp ${labaBersih.toLocaleString('id-ID')}`;

    // UPDATE ANGKA COVER PDF
    document.getElementById('docStoreName').innerText = (localStorage.getItem('storeName') || 'SHANDOZ CAFE').toUpperCase();
    document.getElementById('docOmzet').innerText = `Rp ${totalOmzet.toLocaleString('id-ID')}`;
    document.getElementById('docHPP').innerText = `(Rp ${totalHPP.toLocaleString('id-ID')})`;
    document.getElementById('docMargin').innerText = `Rp ${totalLabaKotor.toLocaleString('id-ID')}`;
    document.getElementById('docExpense').innerText = `(Rp ${totalPengeluaran.toLocaleString('id-ID')})`;
    document.getElementById('docNet').innerText = `Rp ${labaBersih.toLocaleString('id-ID')}`;

    // === MENGGAMBAR GRAFIK GARIS (LINE CHART) ELEGAN ===
    // Urutkan label X-Axis agar waktu/tanggalnya berurutan
    const labels = Object.keys(chartData).sort((a,b) => {
        if(currentFilter === 'hari' || currentFilter === 'custom') return a.localeCompare(b);
        return a.localeCompare(b); // Sorting standar cukup untuk format DD/MM
    }); 
    const dataOmzet = labels.map(label => chartData[label]);

    const ctx = document.getElementById('salesChart').getContext('2d');
    if(myChart) myChart.destroy(); 
    
    myChart = new Chart(ctx, {
        type: 'line', // Ganti jadi grafik garis
        data: {
            labels: labels.length > 0 ? labels : ['00:00'],
            datasets: [{
                label: 'Penjualan Kotor (Rp)',
                data: dataOmzet.length > 0 ? dataOmzet : [0],
                backgroundColor: 'rgba(59, 130, 246, 0.15)', // Warna biru transparan (Fill)
                borderColor: '#3b82f6', // Warna garis biru tajam
                borderWidth: 3,
                pointBackgroundColor: '#fff',
                pointBorderColor: '#3b82f6',
                pointBorderWidth: 2,
                pointRadius: 4,
                fill: true, // Mengaktifkan background gradient di bawah garis
                tension: 0.3 // Membuat garisnya melengkung halus (curved)
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { 
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) { return 'Rp ' + context.raw.toLocaleString('id-ID'); }
                    }
                }
            },
            scales: { 
                x: { grid: { display: false } }, // Hilangkan garis vertikal biar bersih
                y: { 
                    beginAtZero: true, 
                    border: { display: false },
                    ticks: { callback: function(value) { return 'Rp ' + (value/1000) + 'k'; } } 
                } 
            }
        }
    });
}

function addExpense() {
    const desc = document.getElementById('expDesc').value.trim();
    const amount = parseFloat(document.getElementById('expAmount').value);
    if(!desc || isNaN(amount)) return alert('Isi keterangan dan nominal!');
    let expenses = [];
    try { expenses = JSON.parse(localStorage.getItem('expenses') || '[]'); if(!Array.isArray(expenses)) expenses = Object.values(expenses); } catch(e) { expenses = []; }
    
    expenses.push({ id: Date.now(), date: new Date().toLocaleString('id-ID'), desc: desc, amount: amount });
    localStorage.setItem('expenses', JSON.stringify(expenses));
    document.getElementById('expDesc').value = ''; document.getElementById('expAmount').value = '';
    loadFinanceReports();
}

// MESIN EKSPOR
function exportLaporan(format) {
    if (format === 'pdf') {
        document.getElementById('docPrintDate').innerText = new Date().toLocaleString('id-ID');
        window.print();
    } 
    else if (format === 'jpg') {
        const controlPanel = document.getElementById('controlPanel');
        controlPanel.style.display = 'none'; 
        const uiContainer = document.getElementById('uiContainer');
        html2canvas(uiContainer, { scale: 2, useCORS: true, backgroundColor: '#f0f2f5' }).then(canvas => {
            controlPanel.style.display = 'flex'; 
            let fileNameDate = document.getElementById('periodeTextUI').innerText.replace(/[^a-zA-Z0-9]/g, '_');
            const link = document.createElement('a');
            link.download = `Visual_Laporan_${fileNameDate}.jpg`;
            link.href = canvas.toDataURL('image/jpeg', 1.0);
            link.click();
        });
    } 
    else if (format === 'excel') {
        buatLaporanExcelAsli();
    }
}

// MESIN PERAKIT EXCEL
function buatLaporanExcelAsli() {
    let allSales = []; let allExpenses = []; let masterProducts = [];
    try { allSales = JSON.parse(localStorage.getItem('sales') || '[]'); if(!Array.isArray(allSales)) allSales = Object.values(allSales); } catch(e) {}
    try { allExpenses = JSON.parse(localStorage.getItem('expenses') || '[]'); if(!Array.isArray(allExpenses)) allExpenses = Object.values(allExpenses); } catch(e) {}
    try { masterProducts = JSON.parse(localStorage.getItem('products') || '[]'); if(!Array.isArray(masterProducts)) masterProducts = Object.values(masterProducts); } catch(e) {}
    
    const sales = allSales.filter(s => matchDate(s.date));
    const expenses = allExpenses.filter(e => matchDate(e.date));

    const wb = XLSX.utils.book_new(); 
    const periodeName = document.getElementById('periodeTextUI').innerText;
    const storeName = (localStorage.getItem('storeName') || 'SHANDOZ CAFE').toUpperCase();

    // SHEET 1: RINGKASAN
    let totalOmzet = 0, totalHPP = 0, totalPengeluaran = 0;
    sales.forEach(s => { 
        totalOmzet += s.total; 
        s.items.forEach(item => {
            const dbProduct = masterProducts.find(p => p.name === item.name);
            totalHPP += ((dbProduct ? dbProduct.cost : 0) * item.qty);
        });
    });
    expenses.forEach(e => { totalPengeluaran += e.amount; });
    
    let totalLabaKotor = totalOmzet - totalHPP;
    const labaBersih = totalLabaKotor - totalPengeluaran;

    const summaryData = [
        ['LAPORAN LABA RUGI (INCOME STATEMENT)'],
        [storeName],
        ['Periode', periodeName],
        [''],
        ['KATEGORI', 'NOMINAL (Rp)'],
        ['PENDAPATAN / PENJUALAN KOTOR', totalOmzet],
        ['Harga Pokok Penjualan (HPP)', -totalHPP],
        ['LABA KOTOR (GROSS PROFIT)', totalLabaKotor],
        ['Beban Operasional', -totalPengeluaran],
        ['LABA BERSIH (NET INCOME)', labaBersih]
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    wsSummary['!cols'] = [{wch: 35}, {wch: 20}]; 
    XLSX.utils.book_append_sheet(wb, wsSummary, "Laba Rugi");

    // SHEET 2: RINCIAN ITEM TERJUAL
    const salesData = [['Waktu & Tanggal', 'Struk ID', 'Nama Kasir', 'Nama Item', 'Qty', 'HPP/Item', 'Harga Jual', 'Total Omzet']];
    sales.forEach(s => {
        let shortId = String(s.id).slice(-6);
        s.items.forEach(item => {
            const dbProduct = masterProducts.find(p => p.name === item.name);
            const itemCost = dbProduct ? dbProduct.cost : 0;
            salesData.push([s.date, "#"+shortId, s.user || 'Admin', item.name, item.qty, itemCost, item.price, item.total]);
        });
    });
    if(sales.length === 0) salesData.push(['Tidak ada data', '', '', '', '', '', '', '']);
    const wsSales = XLSX.utils.aoa_to_sheet(salesData);
    wsSales['!cols'] = [{wch: 20}, {wch: 12}, {wch: 15}, {wch: 25}, {wch: 8}, {wch: 12}, {wch: 12}, {wch: 15}];
    XLSX.utils.book_append_sheet(wb, wsSales, "Rincian Transaksi");

    // SHEET 3: PENGELUARAN
    const expData = [['Tanggal & Waktu', 'Keterangan Pengeluaran', 'Nominal (Rp)']];
    expenses.forEach(e => {
        expData.push([e.date, e.desc, e.amount]);
    });
    if(expenses.length === 0) expData.push(['Tidak ada data', '', '']);
    const wsExp = XLSX.utils.aoa_to_sheet(expData);
    wsExp['!cols'] = [{wch: 20}, {wch: 40}, {wch: 15}];
    XLSX.utils.book_append_sheet(wb, wsExp, "Beban Pengeluaran");

    let fileNameDate = periodeName.replace(/[^a-zA-Z0-9]/g, '_');
    XLSX.writeFile(wb, `Laporan_${storeName}_${fileNameDate}.xlsx`);
}

document.addEventListener('DOMContentLoaded', () => { filterReports('hari'); });
