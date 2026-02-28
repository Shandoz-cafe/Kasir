// ===== REPORTS OFFLINE =====

// Ambil semua transaksi
function getSales() {
    return JSON.parse(localStorage.getItem('sales') || '[]');
}

// Render laporan
function renderReports() {
    const sales = getSales();
    const list = document.getElementById('reportList');
    list.innerHTML = sales.map((s,i)=>`
        <tr>
            <td>${i+1}</td>
            <td>${s.date}</td>
            <td>${s.user}</td>
            <td>${s.items.map(it=>`${it.name} x${it.qty}`).join(', ')}</td>
            <td>Rp ${s.total}</td>
        </tr>
    `).join('');

    const totalRevenue = sales.reduce((sum,s)=>sum+s.total,0);
    document.getElementById('totalRevenue').innerText = `Rp ${totalRevenue}`;
}

// Cetak laporan
function printReport() {
    const sales = getSales();
    let content = `===== LAPORAN TRANSAKSI =====\n`;
    sales.forEach(s=>{
        content += `\nTanggal: ${s.date}\nKasir: ${s.user}\n`;
        s.items.forEach(it=>{
            content += `${it.name} x${it.qty} = Rp ${it.total}\n`;
        });
        content += `Total: Rp ${s.total}\n----------------\n`;
    });
    content += `\nTOTAL KESELURUHAN: Rp ${sales.reduce((sum,s)=>sum+s.total,0)}\n`;

    const printWin = window.open('', '_blank');
    printWin.document.write(`<pre>${content}</pre>`);
    printWin.document.close();
    printWin.print();
}

// Inisialisasi
document.addEventListener('DOMContentLoaded', renderReports);
