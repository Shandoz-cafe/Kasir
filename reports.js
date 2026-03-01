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
    loadFinanceReports();
}

function filterReports(type) {
    currentFilter = type; document.getElementById('customDate').value = '';
    const labels = { 'hari': 'Hari Ini', 'bulan': 'Bulan Ini', 'semua': 'Semua Waktu' };
    document.getElementById('periodeTextUI').innerText = labels[type];
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
    
    if(currentFilter === 'custom') {
        const [y, m, d] = customDateValue.split('-');
        return datePart === `${parseInt(d)}/${parseInt(m)}/${y}`;
    }
    return true;
}

function loadFinanceReports() {
    const sales = JSON.parse(localStorage.getItem('sales') || '[]');
    let totalOmzet = 0;
    let totalQty = 0;
    
    // Data untuk Chart
    const dailyOmzet = {};

    sales.forEach(sale => {
        if(matchDate(sale.date)) {
            totalOmzet += sale.total;
            sale.items.forEach(item => { totalQty += item.qty; });
            
            // Rekap harian untuk grafik
            const dateOnly = sale.date.split(',')[0].trim();
            if(!dailyOmzet[dateOnly]) dailyOmzet[dateOnly] = 0;
            dailyOmzet[dateOnly] += sale.total;
        }
    });

    // Menampilkan Angka
    document.getElementById('reportTotalOmzet').innerText = 'Rp ' + totalOmzet.toLocaleString('id-ID');
    document.getElementById('reportTotalQty').innerText = totalQty + ' Pcs';

    // Menampilkan Grafik
    renderChart(dailyOmzet);
}

function renderChart(dailyData) {
    const ctx = document.getElementById('financeChart');
    if(!ctx) return;
    
    if(myChart) myChart.destroy(); // Hapus grafik lama sebelum menggambar yang baru
    
    const labels = Object.keys(dailyData);
    const data = Object.values(dailyData);

    myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Omzet (Rp)',
                data: data,
                backgroundColor: '#3b82f6',
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

function downloadPDF() {
    // Membuka menu print bawaan HP/Browser (Bisa disimpan sebagai PDF)
    window.print();
}

document.addEventListener('DOMContentLoaded', () => loadFinanceReports());
