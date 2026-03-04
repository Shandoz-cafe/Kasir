let currentFilter = 'hari'; // Default saat buka langsung hari ini
let customDateValue = '';
let myChart = null;

function filterByCustomDate() {
    const dateVal = document.getElementById('customDate').value;
    if(!dateVal) return;
    currentFilter = 'custom'; customDateValue = dateVal;
    const [y, m, d] = dateVal.split('-');
    
    const lang = localStorage.getItem('appLang') || 'id';
    const locale = lang === 'en' ? 'en-US' : 'id-ID';
    
    const dateText = new Date(y, parseInt(m)-1, d).toLocaleDateString(locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    document.getElementById('periodeTextUI').innerText = dateText;
    document.getElementById('docPeriodeText').innerText = dateText;
    loadFinanceReports();
}

function filterReports(type) {
    currentFilter = type; 
    document.getElementById('customDate').value = '';
    const lang = localStorage.getItem('appLang') || 'id';
    
    let labels = {};
    if (lang === 'en') {
        labels = { 'hari': 'Today', 'bulan': 'This Month', 'tahun': 'This Year', 'semua': 'All Time' };
    } else {
        labels = { 'hari': 'Hari Ini', 'bulan': 'Bulan Ini', 'tahun': 'Tahun Ini', 'semua': 'Semua Waktu' };
    }
    
    document.getElementById('periodeTextUI').innerText = labels[type];
    document.getElementById('docPeriodeText').innerText = labels[type];
    loadFinanceReports();
}

// FIX TERPENTING: MESIN PEMBACA TANGGAL ANTI-ERROR
function matchDate(item) {
    if(currentFilter === 'semua') return true;
    
    let d, m, y;
    let now = new Date();

    if (item.timestamp) {
        let itemDate = new Date(item.timestamp);
        d = itemDate.getDate();
        m = itemDate.getMonth() + 1;
        y = itemDate.getFullYear();
    } else {
        let parts = item.date.split(',');
        let datePart = parts[0].trim(); 
        let dParts = datePart.split('/');
        if(dParts.length !== 3) dParts = datePart.split('-');
        if(dParts.length !== 3) return false;

        d = parseInt(dParts[0]);
        m = parseInt(dParts[1]);
        y = parseInt(dParts[2]);
    }

    if(currentFilter === 'hari') {
        return d === now.getDate() && m === (now.getMonth() + 1) && y === now.getFullYear();
    }
    if(currentFilter === 'bulan') {
        return m === (now.getMonth() + 1) && y === now.getFullYear();
    }
    if(currentFilter === 'tahun') {
        return y === now.getFullYear();
    }
    if(currentFilter === 'custom') {
        const [cy, cm, cd] = customDateValue.split('-');
        return d === parseInt(cd) && m === parseInt(cm) && y === parseInt(cy);
    }
    return true;
}

function loadFinanceReports() {
    const lang = localStorage.getItem('appLang') || 'id';
    
    let allSales = []; let allExpenses = []; let masterProducts = [];
    try { allSales = JSON.parse(localStorage.getItem('sales') || '[]'); if(!Array.isArray(allSales)) allSales = Object.values(allSales); } catch(e) {}
    try { allExpenses = JSON.parse(localStorage.getItem('expenses') || '[]'); if(!Array.isArray(allExpenses)) allExpenses = Object.values(allExpenses); } catch(e) {}
    try { masterProducts = JSON.parse(localStorage.getItem('products') || '[]'); if(!Array.isArray(masterProducts)) masterProducts = Object.values(masterProducts); } catch(e) {}
    
    const sales = allSales.filter(s => matchDate(s));
    const expenses = allExpenses.filter(e => matchDate(e));

    let totalOmzet = 0, totalHPP = 0, totalPengeluaran = 0;
    let itemAnalytics = {}; 
    let chartData = {}; 
    let docSalesHTML = ''; 

    sales.forEach(s => {
        totalOmzet += s.total; 
        
        let parts = s.date.split(',');
        let datePart = parts[0].trim();
        let timePart = parts.length > 1 ? parts[1].trim().replace('.', ':') : "00:00:00";
        
        let dParts = datePart.split('/');
        if(dParts.length !== 3) dParts = datePart.split('-');
        let d = dParts[0].padStart(2, '0');
        let m = dParts[1].padStart(2, '0');
        let y = dParts[2];

        let labelKey = "";
        let monthNames = lang === 'en' 
            ? ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
            : ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
        
        if (currentFilter === 'hari' || currentFilter === 'custom') {
            labelKey = timePart.substring(0, 5); 
        } else if (currentFilter === 'bulan') {
            labelKey = d + "/" + m; 
        } else if (currentFilter === 'tahun') {
            labelKey = monthNames[parseInt(m) - 1]; 
        } else {
            labelKey = monthNames[parseInt(m) - 1] + " " + y; 
        }
        
        if(!chartData[labelKey]) chartData[labelKey] = 0;
        chartData[labelKey] += s.total;

        s.items.forEach(item => {
            const dbProduct = masterProducts.find(p => p.name === item.name);
            const itemCost = dbProduct ? dbProduct.cost : 0;
            totalHPP += (itemCost * item.qty);

            let shortId = String(s.id).slice(-6);
            let displayTime = currentFilter === 'hari' ? timePart : `${datePart} ${timePart.substring(0,5)}`;
            
            docSalesHTML += `
                <tr>
                    <td>${displayTime}</td>
                    <td>#${shortId}<br><b>${item.name}</b></td>
                    <td style="text-align: center;">${item.qty}</td>
                    <td style="text-align: right; color: #e74c3c;">${itemCost.toLocaleString('id-ID')}</td>
                    <td style="text-align: right;">${item.price.toLocaleString('id-ID')}</td>
                    <td style="text-align: right; font-weight: bold;">${item.total.toLocaleString('id-ID')}</td>
                </tr>
            `;

            if(!itemAnalytics[item.name]) itemAnalytics[item.name] = { qty: 0, total: 0 };
            itemAnalytics[item.name].qty += item.qty;
            itemAnalytics[item.name].total += item.total;
        });
    });

    if(sales.length === 0) {
        let msg = lang === 'en' ? 'No transactions in this period.' : 'Tidak ada transaksi pada periode ini.';
        docSalesHTML = `<tr><td colspan="6" style="text-align:center; padding:15px; font-style:italic;">${msg}</td></tr>`;
    }
    document.getElementById('docSalesLog').innerHTML = docSalesHTML;

    let totalLabaKotor = totalOmzet - totalHPP; 

    let sortedItems = Object.keys(itemAnalytics).map(key => {
        return { name: key, qty: itemAnalytics[key].qty, total: itemAnalytics[key].total };
    }).sort((a, b) => b.qty - a.qty); 

    let uiTopHTML = '';
    if(sortedItems.length === 0) {
        let msg = lang === 'en' ? 'No sales data yet' : 'Belum ada data penjualan';
        uiTopHTML = `<tr><td colspan="3" style="text-align:center; color:#999; padding:15px;">${msg}</td></tr>`;
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

    let uiExpHTML = '', docExpHTML = '';
    if(expenses.length === 0) {
        let msgUI = lang === 'en' ? 'No expenses recorded' : 'Belum ada biaya tercatat';
        let msgDoc = lang === 'en' ? 'No operational expenses.' : 'Tidak ada pengeluaran operasional.';
        uiExpHTML = `<tr><td colspan="3" style="text-align:center; color:#999; padding:15px;">${msgUI}</td></tr>`;
        docExpHTML = `<tr><td colspan="3" style="text-align:center; padding:15px; font-style:italic;">${msgDoc}</td></tr>`;
    } else {
        expenses.forEach(e => {
            totalPengeluaran += e.amount;
            uiExpHTML += `<tr style="border-bottom: 1px solid #f0f2f5;">
                <td style="padding: 8px;">${e.date.split(',')[0]}</td>
                <td style="padding: 8px;">${e.desc}</td>
                <td style="text-align:right; color:#e74c3c; font-weight:bold; padding: 8px;">Rp ${e.amount.toLocaleString('id-ID')}</td>
            </tr>`;
            docExpHTML += `<tr>
                <td>${e.date}</td>
                <td>${e.desc}</td>
                <td style="text-align:right; font-weight:bold;">Rp ${e.amount.toLocaleString('id-ID')}</td>
            </tr>`;
        });
    }
    document.getElementById('uiExpenseList').innerHTML = uiExpHTML;
    document.getElementById('docExpenseLog').innerHTML = docExpHTML;

    const labaBersih = totalLabaKotor - totalPengeluaran;
    
    document.getElementById('uiOmzet').innerText = `Rp ${totalOmzet.toLocaleString('id-ID')}`;
    document.getElementById('uiMargin').innerText = `Rp ${totalLabaKotor.toLocaleString('id-ID')}`;
    document.getElementById('uiExpense').innerText = `Rp ${totalPengeluaran.toLocaleString('id-ID')}`;
    document.getElementById('uiNet').innerText = `Rp ${labaBersih.toLocaleString('id-ID')}`;

    document.getElementById('docStoreName').innerText = (localStorage.getItem('storeName') || 'SHANDOZ CAFE').toUpperCase();
    document.getElementById('docOmzet').innerText = `Rp ${totalOmzet.toLocaleString('id-ID')}`;
    document.getElementById('docHPP').innerText = `(Rp ${totalHPP.toLocaleString('id-ID')})`;
    document.getElementById('docMargin').innerText = `Rp ${totalLabaKotor.toLocaleString('id-ID')}`;
    document.getElementById('docExpense').innerText = `(Rp ${totalPengeluaran.toLocaleString('id-ID')})`;
    document.getElementById('docNet').innerText = `Rp ${labaBersih.toLocaleString('id-ID')}`;

    const monthOrder = { "Jan":1, "Feb":2, "Mar":3, "Apr":4, "Mei":5, "Jun":6, "Jul":7, "Ags":8, "Sep":9, "Okt":10, "Nov":11, "Des":12, "May":5, "Aug":8, "Oct":10, "Dec":12 };
    const labels = Object.keys(chartData).sort((a,b) => {
        if(currentFilter === 'tahun' || currentFilter === 'semua') {
            let mA = a.split(' ')[0]; let mB = b.split(' ')[0];
            let yA = a.split(' ')[1] || "0"; let yB = b.split(' ')[1] || "0";
            if (yA !== yB) return parseInt(yA) - parseInt(yB);
            return monthOrder[mA] - monthOrder[mB];
        }
        return a.localeCompare(b);
    }); 
    const dataOmzet = labels.map(label => chartData[label]);

    const ctx = document.getElementById('salesChart').getContext('2d');
    if(myChart) myChart.destroy(); 
    
    let chartLabel = lang === 'en' ? 'Revenue' : 'Omzet';
    
    myChart = new Chart(ctx, {
        type: 'line', 
        data: {
            labels: labels.length > 0 ? labels : ['00:00'],
            datasets: [{
                label: chartLabel,
                data: dataOmzet.length > 0 ? dataOmzet : [0],
                backgroundColor: 'rgba(59, 130, 246, 0.15)', borderColor: '#3b82f6', borderWidth: 3,
                pointBackgroundColor: '#fff', pointBorderColor: '#3b82f6', pointBorderWidth: 2, pointRadius: 4, fill: true, tension: 0.3 
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: { callbacks: { label: function(context) { return 'Rp ' + context.raw.toLocaleString('id-ID'); } } } },
            scales: { x: { grid: { display: false } }, y: { beginAtZero: true, border: { display: false }, ticks: { callback: function(value) { return 'Rp ' + (value/1000) + 'k'; } } } }
        }
    });
}

function addExpense() {
    const lang = localStorage.getItem('appLang') || 'id';
    const desc = document.getElementById('expDesc').value.trim();
    const amount = parseFloat(document.getElementById('expAmount').value);
    
    if(!desc || isNaN(amount)) {
        let msg = lang === 'en' ? 'Please fill in the description and amount!' : 'Isi keterangan dan nominal!';
        return alert(msg);
    }
    
    let expenses = [];
    try { expenses = JSON.parse(localStorage.getItem('expenses') || '[]'); if(!Array.isArray(expenses)) expenses = Object.values(expenses); } catch(e) { expenses = []; }
    
    const nowTime = Date.now();
    const newExpense = { 
        id: nowTime, timestamp: nowTime, date: new Date().toLocaleString('id-ID'), desc: desc, amount: amount 
    };
    
    expenses.push(newExpense);
    localStorage.setItem('expenses', JSON.stringify(expenses));
    
    const uid = localStorage.getItem('userUid');
    if (uid && typeof firebase !== 'undefined') {
        firebase.database().ref('ShandozPOS/' + uid + '/expenses/' + newExpense.id).set(newExpense)
        .catch(err => console.error("Gagal sinkron pengeluaran ke cloud:", err));
    }

    document.getElementById('expDesc').value = ''; document.getElementById('expAmount').value = '';
    loadFinanceReports();
}

// MESIN EKSPOR: CUMA BISA PDF & WORK 100% (FUNGSI ASLI KEMBALI)
function exportLaporan(format) {
    if (format === 'pdf') {
        document.getElementById('docPrintDate').innerText = new Date().toLocaleString('id-ID');
        window.print(); // Memanggil mesin cetak PDF HP bawaan
    } 
}

document.addEventListener('DOMContentLoaded', () => { filterReports('hari'); });
