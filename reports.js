let currentFilter = 'semua';
let customDateValue = '';

function filterByCustomDate() {
    const dateVal = document.getElementById('customDate').value;
    if(!dateVal) return;
    currentFilter = 'custom';
    customDateValue = dateVal;
    
    // Ubah format tanggal (YYYY-MM-DD ke gaya Indonesia)
    const [y, m, d] = dateVal.split('-');
    const customD = new Date(y, parseInt(m)-1, d);
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateText = customD.toLocaleDateString('id-ID', options);
    
    document.getElementById('periodeTextUI').innerText = dateText;
    document.getElementById('docPeriodeText').innerText = dateText;
    loadFinanceReports();
}

function filterReports(type) {
    currentFilter = type;
    document.getElementById('customDate').value = '';
    
    const labels = { 
        'hari': 'Hari Ini', 
        'bulan': 'Bulan Ini', 
        'tahun': 'Tahun Ini', 
        'semua': 'Semua Waktu' 
    };
    const dateText = labels[type];
    document.getElementById('periodeTextUI').innerText = dateText;
    document.getElementById('docPeriodeText').innerText = dateText;
    loadFinanceReports();
}

function matchDate(dateString) {
    if(currentFilter === 'semua') return true;
    const [datePart] = dateString.split(', ');
    
    if(currentFilter === 'hari') {
        return datePart === new Date().toLocaleDateString('id-ID');
    }
    if(currentFilter === 'bulan') {
        const now = new Date();
        const parts = datePart.split('/');
        return parseInt(parts[1]) === (now.getMonth() + 1) && parseInt(parts[2]) === now.getFullYear();
    }
    if(currentFilter === 'tahun') {
        const parts = datePart.split('/');
        return parseInt(parts[2]) === new Date().getFullYear();
    }
    if(currentFilter === 'custom') {
        const [cy, cm, cd] = customDateValue.split('-');
        const customFormatted = new Date(cy, parseInt(cm)-1, cd).toLocaleDateString('id-ID');
        return datePart === customFormatted;
    }
    return true;
}

function loadFinanceReports() {
    const allSales = JSON.parse(localStorage.getItem('sales') || '[]');
    const allExpenses = JSON.parse(localStorage.getItem('expenses') || '[]');
    
    const sales = allSales.filter(s => matchDate(s.date));
    const expenses = allExpenses.filter(e => matchDate(e.date));

    let totalOmzet = 0, totalLabaKotor = 0;
    
    let uiSalesHTML = '';
    let docSalesHTML = '';
    
    if(sales.length === 0) {
        uiSalesHTML = '<tr><td colspan="4" style="text-align:center; color:#999; padding:20px;">Tidak ada penjualan</td></tr>';
        docSalesHTML = '<tr><td colspan="4" style="padding:10px; border:1px solid #ddd; text-align:center; color:#999;">Tidak ada data penjualan pada periode ini</td></tr>';
    } else {
        sales.forEach(s => {
            totalOmzet += s.total; totalLabaKotor += (s.netProfit || 0);
            uiSalesHTML += `<tr><td>${s.date}</td><td>${s.user}</td><td>Rp ${s.total.toLocaleString('id-ID')}</td><td style="color:#27ae60;">+ Rp ${(s.netProfit||0).toLocaleString('id-ID')}</td></tr>`;
            docSalesHTML += `<tr>
                <td style="padding:8px; border:1px solid #ddd;">${s.date}</td>
                <td style="padding:8px; border:1px solid #ddd;">${s.user}</td>
                <td style="padding:8px; border:1px solid #ddd; text-align:right;">Rp ${s.total.toLocaleString('id-ID')}</td>
                <td style="padding:8px; border:1px solid #ddd; text-align:right; color:#27ae60;">Rp ${(s.netProfit||0).toLocaleString('id-ID')}</td>
            </tr>`;
        });
    }
    document.getElementById('uiSalesList').innerHTML = uiSalesHTML;
    document.getElementById('docSalesList').innerHTML = docSalesHTML;

    let totalPengeluaran = 0;
    let uiExpHTML = '';
    let docExpHTML = '';
    
    if(expenses.length === 0) {
        uiExpHTML = '<tr><td colspan="3" style="text-align:center; color:#999; padding:20px;">Tidak ada pengeluaran</td></tr>';
        docExpHTML = '<tr><td colspan="3" style="padding:10px; border:1px solid #ddd; text-align:center; color:#999;">Tidak ada data pengeluaran pada periode ini</td></tr>';
    } else {
        expenses.forEach(e => {
            totalPengeluaran += e.amount;
            uiExpHTML += `<tr><td>${e.date.split(', ')[0]}</td><td>${e.desc}</td><td style="color:#e74c3c;">- Rp ${e.amount.toLocaleString('id-ID')}</td></tr>`;
            docExpHTML += `<tr>
                <td style="padding:8px; border:1px solid #ddd;">${e.date.split(', ')[0]}</td>
                <td style="padding:8px; border:1px solid #ddd;">${e.desc}</td>
                <td style="padding:8px; border:1px solid #ddd; text-align:right; color:#e74c3c;">- Rp ${e.amount.toLocaleString('id-ID')}</td>
            </tr>`;
        });
    }
    document.getElementById('uiExpenseList').innerHTML = uiExpHTML;
    document.getElementById('docExpenseList').innerHTML = docExpHTML;

    const labaBersih = totalLabaKotor - totalPengeluaran;
    
    // Render ke Layar UI
    document.getElementById('uiOmzet').innerText = `Rp ${totalOmzet.toLocaleString('id-ID')}`;
    document.getElementById('uiMargin').innerText = `Rp ${totalLabaKotor.toLocaleString('id-ID')}`;
    document.getElementById('uiExpense').innerText = `Rp ${totalPengeluaran.toLocaleString('id-ID')}`;
    document.getElementById('uiNet').innerText = `Rp ${labaBersih.toLocaleString('id-ID')}`;

    // Render ke Dokumen Kertas A4
    document.getElementById('docOmzet').innerText = `Rp ${totalOmzet.toLocaleString('id-ID')}`;
    document.getElementById('docMargin').innerText = `Rp ${totalLabaKotor.toLocaleString('id-ID')}`;
    document.getElementById('docExpense').innerText = `Rp ${totalPengeluaran.toLocaleString('id-ID')}`;
    document.getElementById('docNet').innerText = `Rp ${labaBersih.toLocaleString('id-ID')}`;
}

function addExpense() {
    const desc = document.getElementById('expDesc').value.trim();
    const amount = parseFloat(document.getElementById('expAmount').value);
    if(!desc || isNaN(amount)) return alert('Isi keterangan dan nominal pengeluaran!');
    
    const expenses = JSON.parse(localStorage.getItem('expenses') || '[]');
    expenses.push({ id: Date.now(), date: new Date().toLocaleString('id-ID'), desc: desc, amount: amount });
    localStorage.setItem('expenses', JSON.stringify(expenses));
    
    document.getElementById('expDesc').value = ''; document.getElementById('expAmount').value = '';
    loadFinanceReports();
}

function exportLaporan(format) {
    document.getElementById('docPrintDate').innerText = new Date().toLocaleString('id-ID');
    
    // Tarik template kertas A4 dari persembunyian
    const printArea = document.getElementById('exportDocument');
    printArea.parentElement.style.height = 'auto';
    printArea.parentElement.style.width = 'auto';
    printArea.style.position = 'absolute';
    printArea.style.top = '0';
    printArea.style.left = '0';
    printArea.style.zIndex = '-1';

    // Memotret template kertas dengan resolusi HD
    html2canvas(printArea, { scale: 2, useCORS: true }).then(canvas => {
        
        // Sembunyikan lagi kertasnya
        printArea.parentElement.style.height = '0';
        printArea.parentElement.style.width = '0';
        printArea.style.position = 'static';
        
        let fileNameDate = document.getElementById('docPeriodeText').innerText.replace(/[^a-zA-Z0-9]/g, '_');
        
        if (format === 'jpg') {
            const link = document.createElement('a');
            link.download = `Laporan_Keuangan_${fileNameDate}.jpg`;
            link.href = canvas.toDataURL('image/jpeg', 1.0);
            link.click();
        } else if (format === 'pdf') {
            const imgData = canvas.toDataURL('image/png');
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`Laporan_Keuangan_${fileNameDate}.pdf`);
        }
    });
}

document.addEventListener('DOMContentLoaded', () => { filterReports('semua'); });
