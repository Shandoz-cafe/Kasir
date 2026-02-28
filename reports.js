function loadReports() {
    const sales = JSON.parse(localStorage.getItem('sales') || '[]');
    const tbody = document.getElementById('reportList');
    let totalRevenue = 0;
    
    tbody.innerHTML = sales.map((s, i) => {
        totalRevenue += s.total;
        const itemsList = s.items.map(item => `${item.name} (${item.qty})`).join(', ');
        return `
            <tr>
                <td>${i+1}</td><td>${s.date}</td><td>${s.user}</td>
                <td>${itemsList}</td><td>Rp ${s.total}</td>
            </tr>
        `;
    }).join('');
    
    document.getElementById('totalRevenue').innerText = totalRevenue;
}

function clearReports() {
    if(confirm('Yakin ingin menghapus SEMUA data laporan penjualan?')) {
        localStorage.removeItem('sales');
        loadReports();
    }
}

if(document.getElementById('reportList')) { document.addEventListener('DOMContentLoaded', loadReports); }
