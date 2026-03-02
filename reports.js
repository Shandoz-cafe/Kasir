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
    const masterProducts = JSON.parse(localStorage.getItem('products') || '[]'); // Ambil data modal gudang
    
    const sales = allSales.filter(s => matchDate(s.date));
    const expenses = allExpenses.filter(e => matchDate(e.date));

    let totalOmzet = 0, totalHPP = 0;
    let itemAnalytics = {}; 
    let chartData = {}; 

    sales.forEach(s => {
        totalOmzet += s.total; 
        
        let parts = s.date.split(', ');
        let datePart = parts[0];
        let timePart = parts[1] || "00:00:00";
        let labelKey = datePart;

        if (currentFilter === 'hari' || currentFilter === 'custom') {
            labelKey = timePart.substring(0, 2) + ":00"; 
        } else if (currentFilter === 'bulan') {
            labelKey = datePart; 
        } else if (currentFilter === 'tahun') {
            let dParts = datePart.split('/');
            let monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
            labelKey = monthNames[parseInt(dParts[1]) - 1] + " " + dParts[2]; 
        }
        
        if(!chartData[labelKey]) chartData[labelKey] = 0;
        chartData[labelKey] += s.total;

        // Hitung HPP dan Analitik Item
        s.items.forEach(item => {
            // Cari HPP di master gudang
            const dbProduct = masterProducts.find(p => p.name === item.name);
            const itemCost = dbProduct ? dbProduct.cost : 0;
            totalHPP += (itemCost * item.qty);

            if(!itemAnalytics[item.name]) itemAnalytics[item.name] = { qty: 0, total: 0 };
            itemAnalytics[item.name].qty += item.qty;
            itemAnalytics[item.name].total += item.total;
        });
    });

    let totalLabaKotor = totalOmzet - totalHPP; // Penjualan Kotor - Modal Barang

    // Urutkan item dari yang paling laku
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

    // Render Pengeluaran
    let totalPengeluaran = 0;
    let uiExpHTML = '', docExpHTML = '';
    if(expenses.length === 0) {
        uiExpHTML = '<tr><td colspan="3" style="text-align:center; color:#999; padding:15px;">Belum ada biaya tercatat</td></tr>';
        docExpHTML = '<tr><td colspan="3" style="text-align:center; padding:5px;">Nihil / Tidak ada pengeluaran.</td></tr>';
    } else {
        expenses.forEach(e => {
            totalPengeluaran += e.amount;
            uiExpHTML += `<tr style="border-bottom: 1px solid #f0f2f5;">
                <td style="padding: 8px;">${e.date.split(', ')[0]}</td>
                <td style="padding: 8px;">${e.desc}</td>
                <td style="text-align:right; color:#e74c3c; font-weight:bold; padding: 8px;">Rp ${e.amount.toLocaleString('id-ID')}</td>
            </tr>`;
            docExpHTML += `<tr>
                <td style="padding: 5px;">${e.date.split(', ')[0]}</td>
                <td style="padding: 5px;">${e.desc}</td>
                <td style="text-align:right; padding: 5px;">Rp ${e.amount.toLocaleString('id-ID')}</td>
            </tr>`;
        });
    }
    document.getElementById('uiExpenseList').innerHTML = uiExpHTML;
    document.getElementById('docExpenseLog').innerHTML = docExpHTML;

    const labaBersih = totalLabaKotor - totalPengeluaran;
    
    // UPDATE ANGKA DI DASHBOARD
    document.getElementById('uiOmzet').innerText = `Rp ${totalOmzet.toLocaleString('id-ID')}`;
    document.getElementById('uiMargin').innerText = `Rp ${totalLabaKotor.toLocaleString('id-ID')}`;
    document.getElementById('uiExpense').innerText = `Rp ${totalPengeluaran.toLocaleString('id-ID')}`;
    document.getElementById('uiNet').innerText = `Rp ${labaBersih.toLocaleString('id-ID')}`;

    // UPDATE ANGKA DI DOKUMEN PDF RESMI
    document.getElementById('docStoreName').innerText = (localStorage.getItem('storeName') || 'SHANDOZ CAFE').toUpperCase();
    document.getElementById('docOmzet').innerText = `Rp ${totalOmzet.toLocaleString('id-ID')}`;
    document.getElementById('docHPP').innerText = `(Rp ${totalHPP.toLocaleString('id-ID')})`;
    document.getElementById('docMargin').innerText = `Rp ${totalLabaKotor.toLocaleString('id-ID')}`;
    document.getElementById('docExpense').innerText = `(Rp ${totalPengeluaran.toLocaleString('id-ID')})`;
    document.getElementById('docNet').innerText = `Rp ${labaBersih.toLocaleString('id-ID')}`;

    // === MENGGAMBAR GRAFIK BATANG ===
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

// MESIN EKSPOR
function exportLaporan(format) {
    if (format === 'pdf') {
        // PDF FORMAL AKUNTANSI 
        document.getElementById('docPrintDate').innerText = new Date().toLocaleDateString('id-ID');
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
    const allSales = JSON.parse(localStorage.getItem('sales') || '[]');
    const allExpenses = JSON.parse(localStorage.getItem('expenses') || '[]');
    const masterProducts = JSON.parse(localStorage.getItem('products') || '[]');
    
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

    // SHEET 2: TRANSAKSI KASIR
    const salesData = [['Waktu & Tanggal', 'Nama Kasir', 'Daftar Menu Terjual', 'Omzet (Rp)']];
    sales.forEach(s => {
        let menuList = s.items.map(i => `${i.qty}x ${i.name}`).join(' | ');
        salesData.push([s.date, s.user || 'Admin', menuList, s.total]);
    });
    if(sales.length === 0) salesData.push(['Tidak ada data', '', '', '']);
    const wsSales = XLSX.utils.aoa_to_sheet(salesData);
    wsSales['!cols'] = [{wch: 20}, {wch: 15}, {wch: 50}, {wch: 15}];
    XLSX.utils.book_append_sheet(wb, wsSales, "Riwayat Transaksi");

    // SHEET 3: PENGELUARAN
    const expData = [['Tanggal', 'Keterangan Pengeluaran', 'Nominal (Rp)']];
    expenses.forEach(e => {
        expData.push([e.date.split(',')[0], e.desc, e.amount]);
    });
    if(expenses.length === 0) expData.push(['Tidak ada data', '', '']);
    const wsExp = XLSX.utils.aoa_to_sheet(expData);
    wsExp['!cols'] = [{wch: 15}, {wch: 40}, {wch: 15}];
    XLSX.utils.book_append_sheet(wb, wsExp, "Beban Pengeluaran");

    let fileNameDate = periodeName.replace(/[^a-zA-Z0-9]/g, '_');
    XLSX.writeFile(wb, `Laporan_${storeName}_${fileNameDate}.xlsx`);
}

document.addEventListener('DOMContentLoaded', () => { filterReports('semua'); });
