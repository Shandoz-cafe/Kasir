let currentFilter = 'semua';
let customDateValue = '';

function filterByCustomDate() {
    const dateVal = document.getElementById('customDate').value; // Format: YYYY-MM-DD
    if(!dateVal) return;
    currentFilter = 'custom';
    customDateValue = dateVal;
    
    // Konversi YYYY-MM-DD ke teks format Indonesia
    const [y, m, d] = dateVal.split('-');
    const customD = new Date(y, parseInt(m)-1, d);
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    
    document.getElementById('periodeText').innerText = customD.toLocaleDateString('id-ID', options);
    loadFinanceReports();
}

function filterReports(type) {
    currentFilter = type;
    document.getElementById('customDate').value = ''; // Reset date picker
    
    const labels = { 
        'hari': 'Hari Ini', 
        'bulan': 'Bulan Ini', 
        'tahun': 'Tahun Ini', 
        'semua': 'Semua Waktu' 
    };
    document.getElementById('periodeText').innerText = labels[type];
    loadFinanceReports();
}

function matchDate(dateString) {
    // dateString format contoh: "28/2/2026, 14:30:00"
    if(currentFilter === 'semua') return true;
    
    const [datePart] = dateString.split(', ');
    
    if(currentFilter === 'hari') {
        const today = new Date().toLocaleDateString('id-ID');
        return datePart === today;
    }
    if(currentFilter === 'bulan') {
        const now = new Date();
        const m = now.getMonth() + 1;
        const y = now.getFullYear();
        const parts = datePart.split('/');
        return parseInt(parts[1]) === m && parseInt(parts[2]) === y;
    }
    if(currentFilter === 'tahun') {
        const y = new Date().getFullYear();
        const parts = datePart.split('/');
        return parseInt(parts[2]) === y;
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
    
    // Saring data sesuai filter tanggal
    const sales = allSales.filter(s => matchDate(s.date));
    const expenses = allExpenses.filter(e => matchDate(e.date));

    // Hitung Pemasukan
    let totalOmzet = 0, totalLabaKotor = 0;
    const salesTbody = document.getElementById('salesList');
    
    if(sales.length === 0) {
        salesTbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#999;">Tidak ada penjualan di tanggal ini</td></tr>';
    } else {
        salesTbody.innerHTML = sales.map((s) => {
            totalOmzet += s.total; totalLabaKotor += (s.netProfit || 0);
            return `<tr><td>${s.date}</td><td>${s.user}</td><td>Rp ${s.total.toLocaleString('id-ID')}</td><td style="color:#27ae60;">+ Rp ${(s.netProfit||0).toLocaleString('id-ID')}</td></tr>`;
        }).join('');
    }

    // Hitung Pengeluaran
    let totalPengeluaran = 0;
    const expTbody = document.getElementById('expenseList');
    
    if(expenses.length === 0) {
        expTbody.innerHTML = '<tr><td colspan="3" style="text-align:center; color:#999;">Tidak ada pengeluaran</td></tr>';
    } else {
        expTbody.innerHTML = expenses.map((e) => {
            totalPengeluaran += e.amount;
            return `<tr><td>${e.date.split(', ')[0]}</td><td>${e.desc}</td><td style="color:#e74c3c;">- Rp ${e.amount.toLocaleString('id-ID')}</td></tr>`;
        }).join('');
    }

    // Update Angka di Ringkasan Atas
    const labaBersih = totalLabaKotor - totalPengeluaran;
    document.getElementById('sumOmzet').innerText = `Rp ${totalOmzet.toLocaleString('id-ID')}`;
    document.getElementById('sumMargin').innerText = `Rp ${totalLabaKotor.toLocaleString('id-ID')}`;
    document.getElementById('sumExpense').innerText = `Rp ${totalPengeluaran.toLocaleString('id-ID')}`;
    document.getElementById('sumNet').innerText = `Rp ${labaBersih.toLocaleString('id-ID')}`;
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
    const printArea = document.getElementById('printArea');
    
    // Tambahkan kelas khusus print agar tampilannya berubah jadi dokumen resmi
    printArea.classList.add('print-mode');
    
    html2canvas(printArea, { scale: 2 }).then(canvas => {
        // Hapus kelas khusus setelah berhasil direkam
        printArea.classList.remove('print-mode');
        
        // Bersihkan nama file dari spasi atau karakter aneh
        let fileNameDate = document.getElementById('periodeText').innerText.replace(/[^a-zA-Z0-9]/g, '_');
        
        if (format === 'jpg') {
            const link = document.createElement('a');
            link.download = `Laporan_Shandoz_${fileNameDate}.jpg`;
            link.href = canvas.toDataURL('image/jpeg', 0.9);
            link.click();
        } else if (format === 'pdf') {
            const imgData = canvas.toDataURL('image/png');
            const { jsPDF } = window.jspdf;
            
            // Format A4 Portrait
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            
            pdf.addImage(imgData, 'PNG', 0, 10, pdfWidth, pdfHeight);
            pdf.save(`Laporan_Shandoz_${fileNameDate}.pdf`);
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    // Default tampilkan semua waktu saat pertama kali buka
    filterReports('semua');
});
