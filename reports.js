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

    let docSalesHTML = ''; // Untuk PDF/JPG
    
    sales.forEach(s => {
        totalOmzet += s.total; 
        totalLabaKotor += (s.netProfit || 0);
        
        // --- LOGIKA GRAFIK PINTAR BERDASARKAN FILTER WAKTU ---
        let parts = s.date.split(', ');
        let datePart = parts[0];
        let timePart = parts[1] || "00:00:00";
        let labelKey = datePart;

        if (currentFilter === 'hari' || currentFilter === 'custom') {
            labelKey = timePart.substring(0, 2) + ":00"; // Contoh: "08:00", "09:00"
        } else if (currentFilter === 'bulan') {
            labelKey = datePart; // Contoh: "01/03/2026"
        } else if (currentFilter === 'tahun') {
            let dParts = datePart.split('/');
            let monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
            labelKey = monthNames[parseInt(dParts[1]) - 1] + " " + dParts[2]; // Contoh: "Mar 2026"
        }
        
        if(!chartData[labelKey]) chartData[labelKey] = 0;
        chartData[labelKey] += s.total;

        // --- ANALITIK BARANG ---
        s.items.forEach(item => {
            if(!itemAnalytics[item.name]) itemAnalytics[item.name] = { qty: 0, total: 0 };
            itemAnalytics[item.name].qty += item.qty;
            itemAnalytics[item.name].total += item.total;
        });

        // --- RAKIT TABEL TRANSAKSI UNTUK DOKUMEN CETAK ---
        docSalesHTML += `<tr>
            <td>${s.date}</td>
            <td>${s.shiftId || s.user}</td>
            <td style="text-align:right;">Rp ${s.total.toLocaleString('id-ID')}</td>
            <td style="text-align:right; color:#27ae60;">Rp ${(s.netProfit||0).toLocaleString('id-ID')}</td>
        </tr>`;
    });

    // Urutkan item dari yang paling laku
    let sortedItems = Object.keys(itemAnalytics).map(key => {
        return { name: key, qty: itemAnalytics[key].qty, total: itemAnalytics[key].total };
    }).sort((a, b) => b.qty - a.qty); 

    // Render Tabel Top Items di Layar & Dokumen
    let uiTopHTML = '', docTopHTML = '';
    if(sortedItems.length === 0) {
        uiTopHTML = '<tr><td colspan="3" style="text-align:center; color:#999; padding:15px;">Belum ada data penjualan</td></tr>';
        docTopHTML = '<tr><td colspan="3" style="text-align:center;">Tidak ada data pada periode ini</td></tr>';
    } else {
        sortedItems.forEach(item => {
            uiTopHTML += `<tr style="border-bottom: 1px solid #f0f2f5;">
                <td style="padding: 10px 5px;"><strong>${item.name}</strong></td>
                <td style="text-align:center;">${item.qty}</td>
                <td style="text-align:right; color:#27ae60; font-weight:bold;">Rp ${item.total.toLocaleString('id-ID')}</td>
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

    // Render Pengeluaran
    let totalPengeluaran = 0;
    let uiExpHTML = '', docExpHTML = '';
    if(expenses.length === 0) {
        uiExpHTML = '<tr><td colspan="3" style="text-align:center; color:#999; padding:15px;">Belum ada biaya tercatat</td></tr>';
        docExpHTML = '<tr><td colspan="3" style="text-align:center;">Tidak ada pengeluaran.</td></tr>';
    } else {
        expenses.forEach(e => {
            totalPengeluaran += e.amount;
            uiExpHTML += `<tr style="border-bottom: 1px solid #f0f2f5;">
                <td style="padding: 10px 5px;">${e.date.split(', ')[0]}</td>
                <td>${e.desc}</td>
                <td style="text-align:right; color:#e74c3c; font-weight:bold;">Rp ${e.amount.toLocaleString('id-ID')}</td>
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

    // Update Angka Ringkasan
    const labaBersih = totalLabaKotor - totalPengeluaran;
    
    document.getElementById('uiOmzet').innerText = `Rp ${totalOmzet.toLocaleString('id-ID')}`;
    document.getElementById('uiMargin').innerText = `Rp ${totalLabaKotor.toLocaleString('id-ID')}`;
    document.getElementById('uiExpense').innerText = `Rp ${totalPengeluaran.toLocaleString('id-ID')}`;
    document.getElementById('uiNet').innerText = `Rp ${labaBersih.toLocaleString('id-ID')}`;

    document.getElementById('docOmzet').innerText = `Rp ${totalOmzet.toLocaleString('id-ID')}`;
    document.getElementById('docMargin').innerText = `Rp ${totalLabaKotor.toLocaleString('id-ID')}`;
    document.getElementById('docExpense').innerText = `Rp ${totalPengeluaran.toLocaleString('id-ID')}`;
    document.getElementById('docNet').innerText = `Rp ${labaBersih.toLocaleString('id-ID')}`;

    // === MENGGAMBAR GRAFIK PINTAR ===
    // Sortir urutan waktu agar grafiknya berurutan dari kiri ke kanan
    const labels = Object.keys(chartData).sort(); 
    const dataOmzet = labels.map(label => chartData[label]);

    const ctx = document.getElementById('salesChart').getContext('2d');
    if(myChart) myChart.destroy(); 
    
    myChart = new Chart(ctx, {
        type: 'line', 
        data: {
            labels: labels.length > 0 ? labels : ['Belum ada data'],
            datasets: [{
                label: 'Penjualan Kotor (Rp)',
                data: dataOmzet.length > 0 ? dataOmzet : [0],
                borderColor: '#27ae60',
                backgroundColor: 'rgba(39, 174, 96, 0.1)',
                borderWidth: 3,
                pointBackgroundColor: '#27ae60',
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true, ticks: { callback: function(value) { return 'Rp ' + value.toLocaleString('id-ID'); } } } }
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

function exportLaporan(format) {
    document.getElementById('docPrintDate').innerText = new Date().toLocaleString('id-ID');
    
    // Trik memunculkan dokumen rahasia sejenak untuk difoto
    const printLayer = document.getElementById('printLayer');
    printLayer.style.left = '0';
    printLayer.style.top = '0';
    printLayer.style.zIndex = '9999';
    
    html2canvas(document.getElementById('exportDocument'), { scale: 2, useCORS: true }).then(canvas => {
        // Sembunyikan lagi dokumennya setelah difoto
        printLayer.style.left = '-9999px';
        printLayer.style.top = '-9999px';
        printLayer.style.zIndex = '-1';
        
        let fileNameDate = document.getElementById('docPeriodeText').innerText.replace(/[^a-zA-Z0-9]/g, '_');
        
        if (format === 'jpg') {
            const link = document.createElement('a');
            link.download = `Laporan_Shandoz_${fileNameDate}.jpg`;
            link.href = canvas.toDataURL('image/jpeg', 1.0);
            link.click();
        } else if (format === 'pdf') {
            const imgData = canvas.toDataURL('image/png');
            const { jsPDF } = window.jspdf;
            
            // Format PDF ke ukuran kertas A4
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`Laporan_Shandoz_${fileNameDate}.pdf`);
        }
    });
}

document.addEventListener('DOMContentLoaded', () => { filterReports('semua'); });
