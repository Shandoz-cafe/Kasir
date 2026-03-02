let currentFilter = 'semua';
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
    const allSales = JSON.parse(localStorage.getItem('sales') || '[]');
    const allExpenses = JSON.parse(localStorage.getItem('expenses') || '[]');
    
    const sales = allSales.filter(s => matchDate(s.date));
    const expenses = allExpenses.filter(e => matchDate(e.date));

    let totalOmzet = 0, totalLabaKotor = 0;
    let itemAnalytics = {}; 
    let chartData = {}; 

    let docSalesHTML = ''; 
    
    sales.forEach(s => {
        totalOmzet += s.total; 
        totalLabaKotor += (s.netProfit || 0);
        
        let parts = s.date.split(', ');
        let datePart = parts[0];
        let timePart = parts[1] || "00:00:00";
        let labelKey = datePart;

        if (currentFilter === 'hari' || currentFilter === 'custom') {
            labelKey = timePart.substring(0, 2) + ":00"; // Menjadi Jam
        } else if (currentFilter === 'bulan') {
            labelKey = datePart; // Menjadi Tanggal
        } else if (currentFilter === 'tahun') {
            let dParts = datePart.split('/');
            let monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
            labelKey = monthNames[parseInt(dParts[1]) - 1] + " " + dParts[2]; // Menjadi Bulan
        }
        
        if(!chartData[labelKey]) chartData[labelKey] = 0;
        chartData[labelKey] += s.total;

        s.items.forEach(item => {
            if(!itemAnalytics[item.name]) itemAnalytics[item.name] = { qty: 0, total: 0 };
            itemAnalytics[item.name].qty += item.qty;
            itemAnalytics[item.name].total += item.total;
        });

        docSalesHTML += `<tr>
            <td>${s.date}</td>
            <td>${s.user || 'Admin'}</td>
            <td style="text-align:right;">Rp ${s.total.toLocaleString('id-ID')}</td>
            <td style="text-align:right; color:#27ae60;">Rp ${(s.netProfit||0).toLocaleString('id-ID')}</td>
        </tr>`;
    });

    let sortedItems = Object.keys(itemAnalytics).map(key => {
        return { name: key, qty: itemAnalytics[key].qty, total: itemAnalytics[key].total };
    }).sort((a, b) => b.qty - a.qty); 

    let uiTopHTML = '', docTopHTML = '';
    if(sortedItems.length === 0) {
        uiTopHTML = '<tr><td colspan="3" style="text-align:center; color:#999; padding:15px;">Belum ada data penjualan</td></tr>';
        docTopHTML = '<tr><td colspan="3" style="text-align:center;">Tidak ada data pada periode ini</td></tr>';
    } else {
        sortedItems.forEach(item => {
            uiTopHTML += `<tr style="border-bottom: 1px solid #f0f2f5;">
                <td style="padding: 8px;"><strong>${item.name}</strong></td>
                <td style="text-align:center; padding: 8px;">${item.qty}</td>
                <td style="text-align:right; color:#27ae60; font-weight:bold; padding: 8px;">Rp ${item.total.toLocaleString('id-ID')}</td>
            </tr>`;
            docTopHTML += `<tr>
                <td>${item.name}</td>
                <td style="text-align:center;">${item.qty} Item</td>
                <td style="text-align:right;">Rp ${item.total.toLocaleString('id-ID')}</td>
            </tr>`;
        });
    }
    document.getElementById('uiTopItems').innerHTML = uiTopHTML;
    document.getElementById('docTopItems').innerHTML = docTopHTML;
    document.getElementById('docSalesLog').innerHTML = docSalesHTML || '<tr><td colspan="4" style="text-align:center;">Tidak ada transaksi.</td></tr>';

    let totalPengeluaran = 0;
    let uiExpHTML = '', docExpHTML = '';
    if(expenses.length === 0) {
        uiExpHTML = '<tr><td colspan="3" style="text-align:center; color:#999; padding:15px;">Belum ada biaya tercatat</td></tr>';
        docExpHTML = '<tr><td colspan="3" style="text-align:center;">Tidak ada pengeluaran.</td></tr>';
    } else {
        expenses.forEach(e => {
            totalPengeluaran += e.amount;
            uiExpHTML += `<tr style="border-bottom: 1px solid #f0f2f5;">
                <td style="padding: 8px;">${e.date.split(', ')[0]}</td>
                <td style="padding: 8px;">${e.desc}</td>
                <td style="text-align:right; color:#e74c3c; font-weight:bold; padding: 8px;">Rp ${e.amount.toLocaleString('id-ID')}</td>
            </tr>`;
            docExpHTML += `<tr>
                <td>${e.date.split(', ')[0]}</td>
                <td>${e.desc}</td>
                <td style="text-align:right; color:#e74c3c;">Rp ${e.amount.toLocaleString('id-ID')}</td>
            </tr>`;
        });
    }
    document.getElementById('uiExpenseList').innerHTML = uiExpHTML;
    document.getElementById('docExpenseLog').innerHTML = docExpHTML;

    const labaBersih = totalLabaKotor - totalPengeluaran;
    
    document.getElementById('uiOmzet').innerText = `Rp ${totalOmzet.toLocaleString('id-ID')}`;
    document.getElementById('uiMargin').innerText = `Rp ${totalLabaKotor.toLocaleString('id-ID')}`;
    document.getElementById('uiExpense').innerText = `Rp ${totalPengeluaran.toLocaleString('id-ID')}`;
    document.getElementById('uiNet').innerText = `Rp ${labaBersih.toLocaleString('id-ID')}`;

    document.getElementById('docOmzet').innerText = `Rp ${totalOmzet.toLocaleString('id-ID')}`;
    document.getElementById('docMargin').innerText = `Rp ${totalLabaKotor.toLocaleString('id-ID')}`;
    document.getElementById('docExpense').innerText = `Rp ${totalPengeluaran.toLocaleString('id-ID')}`;
    document.getElementById('docNet').innerText = `Rp ${labaBersih.toLocaleString('id-ID')}`;

    // === MENGGAMBAR GRAFIK BATANG (BAR) ===
    const labels = Object.keys(chartData).sort(); 
    const dataOmzet = labels.map(label => chartData[label]);

    const ctx = document.getElementById('salesChart').getContext('2d');
    if(myChart) myChart.destroy(); 
    
    myChart = new Chart(ctx, {
        type: 'bar', 
        data: {
            labels: labels.length > 0 ? labels : ['Belum ada data'],
            datasets: [{
                label: 'Penjualan Kotor (Rp)',
                data: dataOmzet.length > 0 ? dataOmzet : [0],
                backgroundColor: 'rgba(52, 152, 219, 0.8)',
                borderColor: '#2980b9',
                borderWidth: 1,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true, ticks: { callback: function(value) { return 'Rp ' + (value/1000) + 'k'; } } } }
        }
    });
}

function addExpense() {
    const desc = document.getElementById('expDesc').value.trim();
    const amount = parseFloat(document.getElementById('expAmount').value);
    if(!desc || isNaN(amount)) return alert('Isi keterangan dan nominal!');
    const expenses = JSON.parse(localStorage.getItem('expenses') || '[]');
    expenses.push({ id: Date.now(), date: new Date().toLocaleString('id-ID'), desc: desc, amount: amount });
    localStorage.setItem('expenses', JSON.stringify(expenses));
    document.getElementById('expDesc').value = ''; document.getElementById('expAmount').value = '';
    loadFinanceReports();
}

// ==========================================
// MESIN EKSPOR: JPG, PDF ASLI, & EXCEL PROFESIONAL
// ==========================================
function exportLaporan(format) {
    if (format === 'pdf') {
        // 1. PDF ASLI (Bawaan HP/Sistem)
        document.getElementById('docPrintDate').innerText = new Date().toLocaleString('id-ID');
        window.print();
    } 
    else if (format === 'jpg') {
        // 2. JPG GAMBAR (Screenshot bersih tanpa tombol)
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
        // 3. EXCEL ASLI (.xlsx) DENGAN SHEET TERPISAH
        buatLaporanExcelAsli();
    }
}

// MESIN PERAKIT EXCEL
function buatLaporanExcelAsli() {
    const allSales = JSON.parse(localStorage.getItem('sales') || '[]');
    const allExpenses = JSON.parse(localStorage.getItem('expenses') || '[]');
    
    // Filter sesuai pilihan di layar
    const sales = allSales.filter(s => matchDate(s.date));
    const expenses = allExpenses.filter(e => matchDate(e.date));

    const wb = XLSX.utils.book_new(); // Buat file Excel Baru
    const periodeName = document.getElementById('periodeTextUI').innerText;

    // --- SHEET 1: RINGKASAN ---
    let totalOmzet = 0, totalLabaKotor = 0, totalPengeluaran = 0, totalTiket = sales.length;
    sales.forEach(s => { totalOmzet += s.total; totalLabaKotor += (s.netProfit || 0); });
    expenses.forEach(e => { totalPengeluaran += e.amount; });
    const labaBersih = totalLabaKotor - totalPengeluaran;

    const summaryData = [
        ['LAPORAN KEUANGAN SHANDOZ POS'],
        ['Periode Filter', periodeName],
        ['Dicetak Pada', new Date().toLocaleString('id-ID')],
        [''],
        ['KATEGORI', 'NOMINAL (Rp) / JUMLAH'],
        ['Total Omzet (Penjualan Kotor)', totalOmzet],
        ['Laba Kotor (Margin Barang)', totalLabaKotor],
        ['Total Pengeluaran (Belanja)', totalPengeluaran],
        ['LABA BERSIH (Keuntungan)', labaBersih],
        ['Total Transaksi (Struk Keluar)', totalTiket]
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    wsSummary['!cols'] = [{wch: 35}, {wch: 25}]; // Atur lebar kolom
    XLSX.utils.book_append_sheet(wb, wsSummary, "1. Ringkasan Laba Rugi");

    // --- SHEET 2: DATA TRANSAKSI KASIR ---
    const salesData = [['Waktu & Tanggal', 'Nama Kasir', 'Daftar Menu Terjual', 'Omzet (Rp)', 'Laba Kotor (Rp)']];
    sales.forEach(s => {
        let menuList = s.items.map(i => `${i.qty}x ${i.name}`).join(' | ');
        salesData.push([s.date, s.user || 'Admin', menuList, s.total, (s.netProfit || 0)]);
    });
    if(sales.length === 0) salesData.push(['Tidak ada data', '', '', '', '']);
    const wsSales = XLSX.utils.aoa_to_sheet(salesData);
    wsSales['!cols'] = [{wch: 20}, {wch: 15}, {wch: 50}, {wch: 15}, {wch: 15}];
    XLSX.utils.book_append_sheet(wb, wsSales, "2. Riwayat Transaksi");

    // --- SHEET 3: PENGELUARAN ---
    const expData = [['Tanggal', 'Keterangan Pengeluaran', 'Nominal (Rp)']];
    expenses.forEach(e => {
        let dateOnly = e.date.split(',')[0] || e.date;
        expData.push([dateOnly, e.desc, e.amount]);
    });
    if(expenses.length === 0) expData.push(['Tidak ada data', '', '']);
    const wsExp = XLSX.utils.aoa_to_sheet(expData);
    wsExp['!cols'] = [{wch: 15}, {wch: 40}, {wch: 15}];
    XLSX.utils.book_append_sheet(wb, wsExp, "3. Pengeluaran Toko");

    // --- SHEET 4: ITEM TERLARIS ---
    let itemAnalytics = {};
    sales.forEach(s => {
        s.items.forEach(item => {
            if(!itemAnalytics[item.name]) itemAnalytics[item.name] = { qty: 0, total: 0 };
            itemAnalytics[item.name].qty += item.qty;
            itemAnalytics[item.name].total += item.total;
        });
    });
    let sortedItems = Object.keys(itemAnalytics).map(key => {
        return { name: key, qty: itemAnalytics[key].qty, total: itemAnalytics[key].total };
    }).sort((a, b) => b.qty - a.qty);

    const itemsData = [['Peringkat', 'Nama Menu / Produk', 'Jumlah Terjual (Pcs)', 'Total Omzet (Rp)']];
    sortedItems.forEach((i, index) => {
        itemsData.push([index + 1, i.name, i.qty, i.total]);
    });
    if(sortedItems.length === 0) itemsData.push(['-', 'Tidak ada data', '', '']);
    const wsItems = XLSX.utils.aoa_to_sheet(itemsData);
    wsItems['!cols'] = [{wch: 10}, {wch: 35}, {wch: 20}, {wch: 20}];
    XLSX.utils.book_append_sheet(wb, wsItems, "4. Menu Terlaris");

    // --- EKSEKUSI DOWNLOAD EXCEL ---
    let fileNameDate = periodeName.replace(/[^a-zA-Z0-9]/g, '_');
    XLSX.writeFile(wb, `Laporan_Excel_Shandoz_${fileNameDate}.xlsx`);
}

document.addEventListener('DOMContentLoaded', () => { filterReports('semua'); });
