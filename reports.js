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
    currentFilter = type; 
    document.getElementById('customDate').value = '';
    const labels = { 'hari': 'Hari Ini', 'bulan': 'Bulan Ini', 'tahun': 'Tahun Ini', 'semua': 'Semua Waktu' };
    document.getElementById('periodeTextUI').innerText = labels[type];
    document.getElementById('docPeriodeText').innerText = labels[type];
    loadFinanceReports();
}

// FIX TERPENTING: MESIN PEMBACA TANGGAL ANTI-ERROR
function matchDate(dateString) {
    if(currentFilter === 'semua') return true;
    
    // Pecah string "DD/MM/YYYY, HH:MM:SS" jadi bagian-bagian
    let parts = dateString.split(',');
    let datePart = parts[0].trim(); 
    
    // Cari pemisah (bisa / atau - tergantung HP)
    let dParts = datePart.split('/');
    if(dParts.length !== 3) dParts = datePart.split('-');
    if(dParts.length !== 3) return false;

    // Ubah jadi angka murni biar nggak salah baca (ex: "03" jadi 3)
    let d = parseInt(dParts[0]);
    let m = parseInt(dParts[1]);
    let y = parseInt(dParts[2]);

    let now = new Date();
    
    if(currentFilter === 'hari') {
        return d === now.getDate() && m === (now.getMonth() + 1) && y === now.getFullYear();
    }
    if(currentFilter === 'bulan') {
        return m === (now.getMonth() + 1) && y === now.getFullYear();
    }
    if(currentFilter === 'tahun') {
        return y === now.getFullYear();
    }
    if(currentFilter === 'custom') {
        const [cy, cm, cd] = customDateValue.split('-');
        return d === parseInt(cd) && m === parseInt(cm) && y === parseInt(cy);
    }
    return true;
}

function loadFinanceReports() {
    let allSales = []; let allExpenses = []; let masterProducts = [];
    try { allSales = JSON.parse(localStorage.getItem('sales') || '[]'); if(!Array.isArray(allSales)) allSales = Object.values(allSales); } catch(e) {}
    try { allExpenses = JSON.parse(localStorage.getItem('expenses') || '[]'); if(!Array.isArray(allExpenses)) allExpenses = Object.values(allExpenses); } catch(e) {}
    try { masterProducts = JSON.parse(localStorage.getItem('products') || '[]'); if(!Array.isArray(masterProducts)) masterProducts = Object.values(masterProducts); } catch(e) {}
    
    // Filter data berdasarkan tombol yang dipilih
    const sales = allSales.filter(s => matchDate(s.date));
    const expenses = allExpenses.filter(e => matchDate(e.date));

    let totalOmzet = 0, totalHPP = 0, totalPengeluaran = 0;
    let itemAnalytics = {}; 
    let chartData = {}; 
    let docSalesHTML = ''; // Untuk nampung rincian PDF (Buku Besar)

    // 1. PROSES DATA PENJUALAN & GRAFIK
    sales.forEach(s => {
        totalOmzet += s.total; 
        
        // Membedah Waktu untuk Grafik
        let parts = s.date.split(',');
        let datePart = parts[0].trim();
        let timePart = parts.length > 1 ? parts[1].trim().replace('.', ':') : "00:00:00";
        
        let dParts = datePart.split('/');
        if(dParts.length !== 3) dParts = datePart.split('-');
        let d = dParts[0].padStart(2, '0');
        let m = dParts[1].padStart(2, '0');
        let y = dParts[2];

        let labelKey = "";
        let monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
        
        // Aturan Sumbu Bawah Grafik Dinamis
        if (currentFilter === 'hari' || currentFilter === 'custom') {
            labelKey = timePart.substring(0, 5); // Tampil Jam (ex: 14:30)
        } else if (currentFilter === 'bulan') {
            labelKey = d + "/" + m; // Tampil Tanggal (ex: 03/03)
        } else if (currentFilter === 'tahun') {
            labelKey = monthNames[parseInt(m) - 1]; // Tampil Bulan (ex: Mar)
        } else {
            labelKey = monthNames[parseInt(m) - 1] + " " + y; // Tampil Bulan Tahun
        }
        
        if(!chartData[labelKey]) chartData[labelKey] = 0;
        chartData[labelKey] += s.total;

        // PROSES RINCIAN ITEM & HPP (UNTUK PDF BERLEMBAR-LEMBAR)
        s.items.forEach(item => {
            const dbProduct = masterProducts.find(p => p.name === item.name);
            const itemCost = dbProduct ? dbProduct.cost : 0;
            totalHPP += (itemCost * item.qty);

            let shortId = String(s.id).slice(-6);
            let displayTime = currentFilter === 'hari' ? timePart : `${datePart} ${timePart.substring(0,5)}`;
            
            docSalesHTML += `
                <tr>
                    <td>${displayTime}</td>
                    <td>#${shortId}<br><b>${item.name}</b></td>
                    <td style="text-align: center;">${item.qty}</td>
                    <td style="text-align: right; color: #e74c3c;">${itemCost.toLocaleString('id-ID')}</td>
                    <td style="text-align: right;">${item.price.toLocaleString('id-ID')}</td>
                    <td style="text-align: right; font-weight: bold;">${item.total.toLocaleString('id-ID')}</td>
                </tr>
            `;

            if(!itemAnalytics[item.name]) itemAnalytics[item.name] = { qty: 0, total: 0 };
            itemAnalytics[item.name].qty += item.qty;
            itemAnalytics[item.name].total += item.total;
        });
    });

    if(sales.length === 0) {
        docSalesHTML = '<tr><td colspan="6" style="text-align:center; padding:15px; font-style:italic;">Tidak ada transaksi pada periode ini.</td></tr>';
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
                <td style="padding: 8px;">${e.date.split(',')[0]}</td>
                <td style="padding: 8px;">${e.desc}</td>
                <td style="text-align:right; color:#e74c3c; font-weight:bold; padding: 8px;">Rp ${e.amount.toLocaleString('id-ID')}</td>
            </tr>`;
            docExpHTML += `<tr>
                <td>${e.date}</td>
                <td>${e.desc}</td>
                <td style="text-align:right; font-weight:bold;">Rp ${e.amount.toLocaleString('id-ID')}</td>
            </tr>`;
        });
    }
    document.getElementById('uiExpenseList').innerHTML = uiExpHTML;
    document.getElementById('docExpenseLog').innerHTML = docExpHTML;

    const labaBersih = totalLabaKotor - totalPengeluaran;
    
    // UPDATE ANGKA UI
    document.getElementById('uiOmzet').innerText = `Rp ${totalOmzet.toLocaleString('id-ID')}`;
    document.getElementById('uiMargin').innerText = `Rp ${totalLabaKotor.toLocaleString('id-ID')}`;
    document.getElementById('uiExpense').innerText = `Rp ${totalPengeluaran.toLocaleString('id-ID')}`;
    document.getElementById('uiNet').innerText = `Rp ${labaBersih.toLocaleString('id-ID')}`;

    // UPDATE ANGKA PDF
    document.getElementById('docStoreName').innerText = (localStorage.getItem('storeName') || 'SHANDOZ CAFE').toUpperCase();
    document.getElementById('docOmzet').innerText = `Rp ${totalOmzet.toLocaleString('id-ID')}`;
    document.getElementById('docHPP').innerText = `(Rp ${totalHPP.toLocaleString('id-ID')})`;
    document.getElementById('docMargin').innerText = `Rp ${totalLabaKotor.toLocaleString('id-ID')}`;
    document.getElementById('docExpense').innerText = `(Rp ${totalPengeluaran.toLocaleString('id-ID')})`;
    document.getElementById('docNet').innerText = `Rp ${labaBersih.toLocaleString('id-ID')}`;

    // === MENGGAMBAR GRAFIK GARIS (LINE CHART) ELEGAN ===
    const monthOrder = { "Jan":1, "Feb":2, "Mar":3, "Apr":4, "Mei":5, "Jun":6, "Jul":7, "Ags":8, "Sep":9, "Okt":10, "Nov":11, "Des":12 };
    const labels = Object.keys(chartData).sort((a,b) => {
        if(currentFilter === 'tahun' || currentFilter === 'semua') {
            let mA = a.split(' ')[0]; let mB = b.split(' ')[0];
            let yA = a.split(' ')[1] || "0"; let yB = b.split(' ')[1] || "0";
            if (yA !== yB) return parseInt(yA) - parseInt(yB);
            return monthOrder[mA] - monthOrder[mB];
        }
        return a.localeCompare(b);
    }); 
    const dataOmzet = labels.map(label => chartData[label]);

    const ctx = document.getElementById('salesChart').getContext('2d');
    if(myChart) myChart.destroy(); 
    
    myChart = new Chart(ctx, {
        type: 'line', 
        data: {
            labels: labels.length > 0 ? labels : ['00:00'],
            datasets: [{
                label: 'Omzet',
                data: dataOmzet.length > 0 ? dataOmzet : [0],
                backgroundColor: 'rgba(59, 130, 246, 0.15)', 
                borderColor: '#3b82f6', 
                borderWidth: 3,
                pointBackgroundColor: '#fff',
                pointBorderColor: '#3b82f6',
                pointBorderWidth: 2,
                pointRadius: 4,
                fill: true, 
                tension: 0.3 
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { 
                legend: { display: false },
                tooltip: { callbacks: { label: function(context) { return 'Rp ' + context.raw.toLocaleString('id-ID'); } } }
            },
            scales: { 
                x: { grid: { display: false } }, 
                y: { beginAtZero: true, border: { display: false }, ticks: { callback: function(value) { return 'Rp ' + (value/1000) + 'k'; } } } 
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

// MESIN EKSPOR (TOMBOL PDF SEKARANG PASTI JALAN)
function exportLaporan(format) {
    if (format === 'pdf') {
        document.getElementById('docPrintDate').innerText = new Date().toLocaleString('id-ID');
        window.print(); // Ini perintah bawaan HP/Browser untuk memanggil mesin PDF
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
