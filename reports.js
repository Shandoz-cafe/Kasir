function loadFinanceReports() {
    const sales = JSON.parse(localStorage.getItem('sales') || '[]');
    const expenses = JSON.parse(localStorage.getItem('expenses') || '[]');
    
    // Hitung Pemasukan & Laba
    let totalOmzet = 0, totalLabaKotor = 0;
    const salesTbody = document.getElementById('salesList');
    salesTbody.innerHTML = sales.map((s, i) => {
        totalOmzet += s.total; totalLabaKotor += (s.netProfit || 0);
        return `<tr><td>${i+1}</td><td>${s.date}</td><td>Rp ${s.total.toLocaleString('id-ID')}</td><td style="color:#27ae60;">+ Rp ${(s.netProfit||0).toLocaleString('id-ID')}</td></tr>`;
    }).join('');

    // Hitung Pengeluaran
    let totalPengeluaran = 0;
    const expTbody = document.getElementById('expenseList');
    expTbody.innerHTML = expenses.map((e, i) => {
        totalPengeluaran += e.amount;
        return `<tr><td>${i+1}</td><td>${e.date}</td><td>${e.desc}</td><td style="color:#e74c3c;">- Rp ${e.amount.toLocaleString('id-ID')}</td></tr>`;
    }).join('');

    // Update Dashboard Kartu
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

// Fungsi clearFinanceData dihapus demi keamanan riwayat omzet toko

if(document.getElementById('salesList')) { document.addEventListener('DOMContentLoaded', loadFinanceReports); }
