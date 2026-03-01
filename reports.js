let currentFilter = 'semua';
let customDateValue = '';
let myChart = null; // Menyimpan grafik agar bisa di-update

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
    let itemAnalytics = {}; // Untuk menghitung barang terlaris
    let chartData = {}; // Untuk Grafik: { "Tanggal 1": Total, "Tanggal 2": Total }

    sales.forEach(s => {
        totalOmzet += s.total; 
        totalLabaKotor += (s.netProfit || 0);
        
        // Ambil tanggal saja (tanpa jam) untuk sumbu X grafik
        let tglAja = s.date.split(', ')[0];
        if(!chartData[tglAja]) chartData[tglAja] = 0;
        chartData[tglAja] += s.total;

        // Analitik per barang
        s.items.forEach(item => {
            if(!itemAnalytics[item.name]) itemAnalytics[item.name] = { qty: 0, total: 0 };
            itemAnalytics[item.name].qty += item.qty;
            itemAnalytics[item.name].total += item.total;
        });
    });

    // Render Tabel Top Items
    let sortedItems = Object.keys(itemAnalytics).map(key => {
        return { name: key, qty: itemAnalytics[key].qty, total: itemAnalytics[key].total };
    }).sort((a, b) => b.qty - a.qty); // Urutkan dari terjual paling banyak

    const topItemsTbody = document.getElementById('topItemsList');
    if(sortedItems.length === 0) {
        topItemsTbody.innerHTML = '<tr><td colspan="3" style="text-align:center; color:#999; padding:15px;">Belum ada data</td></tr>';
    } else {
        topItemsTbody.innerHTML = sortedItems.map(item => `
            <tr style="border-bottom: 1px solid #f0f2f5;">
                <td style="padding: 10px 5px;"><strong>${item.name}</strong></td>
                <td style="text-align:center;">${item.qty}</td>
                <td style="text-align:right; color:#27ae60; font-weight:bold;">Rp ${item.total.toLocaleString('id-ID')}</td>
            </tr>
        `).join('');
    }

    // Render Pengeluaran
    let totalPengeluaran = 0;
    let uiExpHTML = '';
    if(expenses.length === 0) {
        uiExpHTML = '<tr><td colspan="3" style="text-align:center; color:#999; padding:15px;">Belum ada biaya tercatat</td></tr>';
    } else {
        expenses.forEach(e => {
            totalPengeluaran += e.amount;
            uiExpHTML += `<tr style="border-bottom: 1px solid #f0f2f5;">
                <td style="padding: 10px 5px;">${e.date.split(', ')[0]}</td>
                <td>${e.desc}</td>
                <td style="text-align:right; color:#e74c3c; font-weight:bold;">Rp ${e.amount.toLocaleString('id-ID')}</td>
            </tr>`;
        });
    }
    document.getElementById('uiExpenseList').innerHTML = uiExpHTML;

    // Update Ringkasan Atas
    const labaBersih = totalLabaKotor - totalPengeluaran;
    document.getElementById('uiOmzet').innerText = `Rp ${totalOmzet.toLocaleString('id-ID')}`;
    document.getElementById('uiMargin').innerText = `Rp ${totalLabaKotor.toLocaleString('id-ID')}`;
    document.getElementById('uiExpense').innerText = `Rp ${totalPengeluaran.toLocaleString('id-ID')}`;
    document.getElementById('uiNet').innerText = `Rp ${labaBersih.toLocaleString('id-ID')}`;

    // === MENGGAMBAR GRAFIK (CHART.JS) ===
    const ctx = document.getElementById('salesChart').getContext('2d');
    const labels = Object.keys(chartData); // Sumbu X (Tanggal)
    const dataOmzet = Object.values(chartData); // Sumbu Y (Uang)

    if(myChart) myChart.destroy(); // Hapus grafik lama kalau filter diubah
    
    myChart = new Chart(ctx, {
        type: 'line', // Tipe grafik garis seperti Loyverse
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
                tension: 0.3 // Garisnya melengkung halus
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true, ticks: { callback: function(value) { return 'Rp ' + value.toLocaleString('id-ID'); } } } },
            animation: { duration: 0 } // Matikan animasi agar gampang diekspor ke PDF
        }
    });

    // Siapkan PDF Data
    document.getElementById('pdfContentArea').innerHTML = `
        <div style="display:flex; justify-content:space-between; margin-bottom: 20px;">
            <h3>Total Penjualan: Rp ${totalOmzet.toLocaleString('id-ID')}</h3>
            <h3 style="color:#e74c3c;">Total Beban: Rp ${totalPengeluaran.toLocaleString('id-ID')}</h3>
        </div>
        <h4>Top 10 Menu Terjual:</h4>
        <ul>${sortedItems.slice(0, 10).map(i => `<li>${i.name} (${i.qty} item) - Rp ${i.total.toLocaleString('id-ID')}</li>`).join('')}</ul>
    `;
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
    const printArea = document.getElementById('exportDocument');
    printArea.parentElement.style.height = 'auto';
    printArea.parentElement.style.width = 'auto';
    
    html2canvas(printArea, { scale: 2 }).then(canvas => {
        printArea.parentElement.style.height = '0';
        printArea.parentElement.style.width = '0';
        
        if (format === 'pdf') {
            const imgData = canvas.toDataURL('image/png');
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`Laporan_Shandoz.pdf`);
        }
    });
}

document.addEventListener('DOMContentLoaded', () => { filterReports('semua'); });
