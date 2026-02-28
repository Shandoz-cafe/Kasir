let currentFilter = 'semua';

function loadFinanceReports() {
    const allSales = JSON.parse(localStorage.getItem('sales') || '[]');
    const allExpenses = JSON.parse(localStorage.getItem('expenses') || '[]');
    
    const now = new Date();
    const todayStr = now.toLocaleDateString('id-ID');
    const monthStr = now.getMonth() + '/' + now.getFullYear();
    const yearStr = now.getFullYear().toString();

    // Filter Data
    const sales = allSales.filter(s => {
        if(currentFilter === 'hari') return s.date.includes(todayStr);
        if(currentFilter === 'bulan') return s.date.includes(monthStr);
        if(currentFilter === 'tahun') return s.date.includes(yearStr);
        return true;
    });

    let totalOmzet = 0, totalLabaKotor = 0;
    const salesTbody = document.getElementById('salesList');
    salesTbody.innerHTML = sales.map((s) => {
        totalOmzet += s.total; totalLabaKotor += (s.netProfit || 0);
        return `<tr><td>${s.date}</td><td>${s.user}</td><td>Rp ${s.total.toLocaleString('id-ID')}</td><td style="color:#27ae60;">+ Rp ${(s.netProfit||0).toLocaleString('id-ID')}</td></tr>`;
    }).join('');

    const expenses = allExpenses.filter(e => {
        if(currentFilter === 'hari') return e.date.includes(todayStr);
        if(currentFilter === 'bulan') return e.date.includes(monthStr);
        if(currentFilter === 'tahun') return e.date.includes(yearStr);
        return true;
    });

    let totalPengeluaran = expenses.reduce((sum, e) => sum + e.amount, 0);
    const labaBersih = totalLabaKotor - totalPengeluaran;

    document.getElementById('sumOmzet').innerText = `Rp ${totalOmzet.toLocaleString('id-ID')}`;
    document.getElementById('sumMargin').innerText = `Rp ${totalLabaKotor.toLocaleString('id-ID')}`;
    document.getElementById('sumExpense').innerText = `Rp ${totalPengeluaran.toLocaleString('id-ID')}`;
    document.getElementById('sumNet').innerText = `Rp ${labaBersih.toLocaleString('id-ID')}`;
}

function filterReports(type) {
    currentFilter = type;
    const labels = { 'hari': 'Hari Ini', 'bulan': 'Bulan Ini', 'tahun': 'Tahun Ini', 'semua': 'Semua Waktu' };
    document.getElementById('periodeText').innerText = labels[type];
    loadFinanceReports();
}

function exportLaporan(format) {
    const element = document.getElementById('printTableArea');
    html2canvas(element).then(canvas => {
        if (format === 'jpg') {
            const link = document.createElement('a');
            link.download = `Laporan_${currentFilter}.jpg`;
            link.href = canvas.toDataURL('image/jpeg');
            link.click();
        } else if (format === 'pdf') {
            const imgData = canvas.toDataURL('image/png');
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
            pdf.addImage(imgData, 'PNG', 0, 10, pdfWidth, pdfHeight);
            pdf.save(`Laporan_${currentFilter}.pdf`);
        }
    });
}

document.addEventListener('DOMContentLoaded', loadFinanceReports);
