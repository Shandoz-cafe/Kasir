let cart = [];
let subtotal = 0, grandTotal = 0, change = 0, totalProfit = 0, discountNominal = 0;
let pendingSale = null;

function initPOS() {
    document.getElementById('kasirNameDisplay').innerText = localStorage.getItem('currentUser');
    const role = localStorage.getItem('currentRole');
    const navBtn = document.getElementById('navButton');
    if (role === 'admin') { navBtn.innerText = '⬅️ Dashboard'; navBtn.className = 'warning'; } 
    else { navBtn.innerText = '🛑 Tutup Kasir'; navBtn.className = 'danger'; }

    const products = JSON.parse(localStorage.getItem('products') || '[]');
    let categories = [...new Set(products.map(p => p.category || 'Umum'))];
    categories.sort((a, b) => a.localeCompare(b)); 

    const catOptions = document.getElementById('categoryOptions');
    if(catOptions) {
        catOptions.innerHTML = `<option value="cat-Semua">Semua Kategori</option>` + 
            categories.map(c => `<option value="cat-${c}">${c}</option>`).join('');
    }
    filterAndSortProducts();
}

function handleNav() {
    const role = localStorage.getItem('currentRole');
    if (role === 'admin') { window.location.href = 'dashboard.html'; } 
    else { localStorage.removeItem('currentUser'); localStorage.removeItem('currentRole'); localStorage.removeItem('currentShift'); window.location.href = 'index.html'; }
}

function filterAndSortProducts() {
    const products = JSON.parse(localStorage.getItem('products') || '[]');
    const searchQuery = document.getElementById('searchInput').value.toLowerCase();
    const filterValue = document.getElementById('filterSelect').value; 

    let filtered = products.filter(p => p.name.toLowerCase().includes(searchQuery));
    if (filterValue.startsWith('cat-')) {
        const selectedCat = filterValue.replace('cat-', '');
        if (selectedCat !== 'Semua') { filtered = filtered.filter(p => (p.category || 'Umum') === selectedCat); }
        filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else if (filterValue === 'sort-AZ') { filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else if (filterValue === 'sort-ZA') { filtered.sort((a, b) => b.name.localeCompare(a.name)); }

    // Merender tampilan produk gaya flat
    document.getElementById('productsContainer').innerHTML = filtered.map(p => {
        const isOut = p.stock < 1;
        return `<div class="product-item ${isOut ? 'empty' : ''}" onclick="${isOut ? '' : `addToCart('${p.id}')`}">
            <span class="item-cat">${p.category || 'Umum'}</span>
            <div class="item-name">${p.name}</div>
            <div class="item-price">Rp ${p.price.toLocaleString('id-ID')}</div>
            <span class="item-stock">Stok: ${p.stock}</span>
        </div>`;
    }).join('');
}

// Scanner Kamera Saja (Karena Scanner USB otomatis bertindak seperti keyboard, tidak butuh input box khusus)
let html5QrcodeScanner = null;
function openScanner() {
    document.getElementById('scannerModal').style.display = 'flex';
    html5QrcodeScanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: {width: 250, height: 250} }, false);
    html5QrcodeScanner.render((decodedText) => {
        closeScanner();
        const p = JSON.parse(localStorage.getItem('products') || '[]').find(x => x.barcode === decodedText);
        if(p) { if(p.stock < 1) alert('Stok HABIS!'); else addToCart(p.id); } else alert('Barcode tidak ditemukan!');
    }, (error) => {});
}
function closeScanner() {
    if(html5QrcodeScanner) { html5QrcodeScanner.clear(); }
    document.getElementById('scannerModal').style.display = 'none';
}

function addToCart(id) {
    const products = JSON.parse(localStorage.getItem('products') || '[]');
    const p = products.find(x => x.id === id);
    const existing = cart.find(x => x.id === id);
    
    if(existing) {
        if(existing.qty >= p.stock) return alert('Stok kurang!');
        existing.qty++; existing.total = existing.qty * existing.price; existing.profit = (existing.price - existing.cost) * existing.qty;
    } else {
        cart.push({ id: p.id, name: p.name, price: p.price, cost: p.cost, qty: 1, total: p.price, profit: p.price - p.cost });
    }
    renderCart();
}

function renderCart() {
    // Merender item keranjang rapi
    document.getElementById('cartItems').innerHTML = cart.map((item, i) => `
        <div class="cart-item">
            <div class="cart-item-info">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-qty">${item.qty} x Rp ${item.price.toLocaleString('id-ID')}</div>
            </div>
            <div style="display:flex; align-items:center; gap:10px;">
                <div class="cart-item-price">Rp ${item.total.toLocaleString('id-ID')}</div>
                <button class="danger" style="padding:4px 8px;" onclick="cart.splice(${i}, 1); renderCart();">X</button>
            </div>
        </div>
    `).join('');
    calculateTotal();
}

function handlePaymentMethod() {
    const method = document.getElementById('payMethod').value;
    const cashInput = document.getElementById('cashInput');
    if(method !== 'Tunai') { cashInput.value = grandTotal; cashInput.disabled = true; } 
    else { cashInput.value = ''; cashInput.disabled = false; }
    calculateTotal();
}

function calculateTotal() {
    subtotal = cart.reduce((sum, i) => sum + i.total, 0);
    totalProfit = cart.reduce((sum, i) => sum + i.profit, 0);
    
    let discountPercent = parseFloat(document.getElementById('discountInput').value) || 0;
    if(discountPercent > 100) discountPercent = 100;
    discountNominal = (subtotal * discountPercent) / 100;
    
    grandTotal = subtotal - discountNominal;
    
    const method = document.getElementById('payMethod').value;
    if(method !== 'Tunai') document.getElementById('cashInput').value = grandTotal;
    
    let cash = parseFloat(document.getElementById('cashInput').value) || 0;
    change = cash - grandTotal;

    document.getElementById('subtotalDisplay').innerText = `Rp ${subtotal.toLocaleString('id-ID')}`;
    document.getElementById('grandTotalDisplay').innerText = `Rp ${grandTotal.toLocaleString('id-ID')}`;
    const cd = document.getElementById('changeDisplay');
    if (change < 0 && cash > 0) { cd.innerText = "Kurang!"; cd.style.color = "#ef4444"; } 
    else { cd.innerText = `Rp ${Math.max(0, change).toLocaleString('id-ID')}`; cd.style.color = "#059669"; }
}

function previewCheckout() {
    if(cart.length === 0) return alert('Keranjang kosong!');
    let cash = parseFloat(document.getElementById('cashInput').value) || 0;
    if(cash < grandTotal) return alert('Uang bayar kurang!');

    const custName = document.getElementById('custName').value.trim() || 'Umum';
    const payMethod = document.getElementById('payMethod').value;
    const shiftId = localStorage.getItem('currentShift') || 'No-Shift';

    pendingSale = { 
        id: Date.now(), user: localStorage.getItem('currentUser'), shiftId: shiftId, date: new Date().toLocaleString('id-ID'), 
        items: cart, subtotal, discount: discountNominal, total: grandTotal, cash, change, 
        netProfit: totalProfit - discountNominal, customer: custName, method: payMethod
    };

    const storeName = localStorage.getItem('storeName') || 'Toko Saya';
    const storeLogo = localStorage.getItem('storeLogo');
    let logoHtml = storeLogo ? `<img src="${storeLogo}" style="max-width: 50px; display: block; margin: 0 auto 5px auto; filter: grayscale(100%);">` : '';

    let contentHTML = `
        <div style="text-align: center;">${logoHtml}<strong>${storeName}</strong><br><small>Kasir: ${pendingSale.user}<br>${pendingSale.date}</small></div>
        <div style="text-align: left; margin-top:5px;"><small>Pelanggan: <strong>${pendingSale.customer}</strong></small></div>
        <div style="border-bottom: 1px dashed #000; margin: 5px 0;"></div>
        <table style="width:100%; font-size: 11px;">
            ${pendingSale.items.map(i => `<tr><td colspan="2"><strong>${i.name}</strong></td></tr><tr><td>${i.qty}x ${i.price}</td><td style="text-align:right;">${i.total}</td></tr>`).join('')}
        </table>
        <div style="border-bottom: 1px dashed #000; margin: 5px 0;"></div>
        <table style="width:100%; font-size: 11px;">
            <tr><td>Subtotal</td><td style="text-align:right;">${pendingSale.subtotal}</td></tr>
            ${pendingSale.discount > 0 ? `<tr><td>Diskon</td><td style="text-align:right;">-${pendingSale.discount}</td></tr>` : ''}
            <tr><td><strong>TOTAL</strong></td><td style="text-align:right;"><strong>Rp ${pendingSale.total}</strong></td></tr>
            <tr><td>${pendingSale.method}</td><td style="text-align:right;">${pendingSale.cash}</td></tr>
            <tr><td>Kembali</td><td style="text-align:right;">${pendingSale.change}</td></tr>
        </table>
        <div style="text-align: center; margin-top:10px;"><small>Terima Kasih!</small></div>
    `;
    document.getElementById('receiptPreviewContent').innerHTML = contentHTML;
    document.getElementById('previewModal').style.display = 'flex';
}

function closePreview() { document.getElementById('previewModal').style.display = 'none'; pendingSale = null; }

function confirmAndPrint() {
    if(!pendingSale) return;
    const products = JSON.parse(localStorage.getItem('products') || '[]');
    pendingSale.items.forEach(cItem => { const p = products.find(x => x.id === cItem.id); if(p) p.stock -= cItem.qty; });
    localStorage.setItem('products', JSON.stringify(products));

    const sales = JSON.parse(localStorage.getItem('sales') || '[]');
    sales.push(pendingSale); localStorage.setItem('sales', JSON.stringify(sales));

    const storeName = localStorage.getItem('storeName') || 'Toko Saya';
    const storeLogo = localStorage.getItem('storeLogo');
    let logoHtml = storeLogo ? `<img src="${storeLogo}" style="width: 50%; max-width: 150px; margin-bottom: 10px;">` : '';
    
    let printHTML = `<div style="text-align: center; font-family: monospace;">${logoHtml}<h3 style="margin:0;">${storeName}</h3><p style="margin:0; font-size:12px;">Kasir: ${pendingSale.user}<br>${pendingSale.date}</p></div><div style="text-align: left; font-family: monospace; font-size:12px; margin-top:5px;">Pelanggan: <strong>${pendingSale.customer}</strong></div><div style="border-bottom: 1px dashed #000; margin: 5px 0;"></div><table style="width:100%; font-family: monospace; font-size: 12px; border-collapse: collapse;">${pendingSale.items.map(i => `<tr><td colspan="2"><b>${i.name}</b></td></tr><tr><td>${i.qty}x ${i.price.toLocaleString('id-ID')}</td><td style="text-align:right;">${i.total.toLocaleString('id-ID')}</td></tr>`).join('')}</table><div style="border-bottom: 1px dashed #000; margin: 5px 0;"></div><table style="width:100%; font-family: monospace; font-size: 12px; border-collapse: collapse;"><tr><td>Subtotal</td><td style="text-align:right;">${pendingSale.subtotal.toLocaleString('id-ID')}</td></tr>${pendingSale.discount > 0 ? `<tr><td>Diskon</td><td style="text-align:right;">-${pendingSale.discount.toLocaleString('id-ID')}</td></tr>` : ''}<tr><td><b>TOTAL</b></td><td style="text-align:right;"><b>Rp ${pendingSale.total.toLocaleString('id-ID')}</b></td></tr><tr><td>Bayar (${pendingSale.method})</td><td style="text-align:right;">${pendingSale.cash.toLocaleString('id-ID')}</td></tr><tr><td>Kembalian</td><td style="text-align:right;">${pendingSale.change.toLocaleString('id-ID')}</td></tr></table><div style="text-align: center; font-family: monospace; font-size: 12px; margin-top:15px;">Terima Kasih!</div>`;

    const base64html = btoa(unescape(encodeURIComponent(printHTML)));
    window.location.href = "rawbt:data:text/html;base64," + base64html;

    setTimeout(() => { 
        cart = []; document.getElementById('discountInput').value = 0; document.getElementById('cashInput').value = ''; document.getElementById('custName').value = '';
        closePreview(); initPOS(); renderCart();
    }, 1500);
}

// FITUR HOLD BILL
function saveOpenBill() {
    if(cart.length === 0) return alert('Keranjang kosong!');
    const custName = document.getElementById('custName').value.trim();
    if(!custName) return alert('Masukkan Nama/Meja!');
    const openBills = JSON.parse(localStorage.getItem('openBills') || '[]');
    openBills.push({ id: "BILL-" + Date.now(), customer: custName, time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }), items: cart, total: grandTotal });
    localStorage.setItem('openBills', JSON.stringify(openBills));
    cart = []; document.getElementById('discountInput').value = 0; document.getElementById('cashInput').value = ''; document.getElementById('custName').value = ''; renderCart();
}
function showOpenBills() {
    const openBills = JSON.parse(localStorage.getItem('openBills') || '[]');
    const container = document.getElementById('openBillContent');
    if(openBills.length === 0) { container.innerHTML = '<p style="text-align:center; padding:20px;">Kosong.</p>'; } 
    else { container.innerHTML = openBills.map((b, i) => `<div style="border:1px solid #cbd5e1; padding:10px; border-radius:6px; margin-bottom:10px; display:flex; justify-content:space-between;"><div><strong>${b.customer}</strong> (${b.time})<br><span style="color:#059669; font-weight:bold;">Rp ${b.total.toLocaleString('id-ID')}</span></div><div style="display:flex; gap:5px;"><button class="primary" onclick="recallBill(${i})">Panggil</button><button class="danger" onclick="deleteBill(${i})">X</button></div></div>`).join(''); }
    document.getElementById('openBillModal').style.display = 'flex';
}
function closeOpenBillModal() { document.getElementById('openBillModal').style.display = 'none'; }
function recallBill(index) {
    if(cart.length > 0 && !confirm('Ada pesanan. Timpa?')) return;
    const openBills = JSON.parse(localStorage.getItem('openBills') || '[]');
    cart = openBills[index].items; document.getElementById('custName').value = openBills[index].customer; renderCart();
    openBills.splice(index, 1); localStorage.setItem('openBills', JSON.stringify(openBills)); closeOpenBillModal();
}
function deleteBill(index) {
    if(confirm('Hapus tiket?')) { const openBills = JSON.parse(localStorage.getItem('openBills') || '[]'); openBills.splice(index, 1); localStorage.setItem('openBills', JSON.stringify(openBills)); showOpenBills(); }
}

// HISTORY KASIR
function showPosHistory() {
    const sales = JSON.parse(localStorage.getItem('sales') || '[]');
    const recentSales = sales.slice(-15).reverse();
    const tbody = document.getElementById('posHistoryList');
    if(recentSales.length === 0) { tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:15px;">Belum ada transaksi</td></tr>'; } 
    else { tbody.innerHTML = recentSales.map(s => `<tr style="border-bottom: 1px solid #eee;"><td style="padding: 8px 5px;">${s.date}</td><td>${s.customer || 'Umum'}</td><td style="color:#059669; font-weight:bold;">Rp ${s.total.toLocaleString('id-ID')}</td><td><button class="primary" style="padding: 4px 8px; font-size: 0.8rem;" onclick="reprintSale(${s.id})">🖨️</button></td></tr>`).join(''); }
    document.getElementById('historyModal').style.display = 'flex';
}
function closePosHistory() { document.getElementById('historyModal').style.display = 'none'; }
function reprintSale(saleId) {
    const sales = JSON.parse(localStorage.getItem('sales') || '[]'); const sale = sales.find(s => s.id === saleId); if(!sale) return;
    const storeName = localStorage.getItem('storeName') || 'Toko Saya'; const storeLogo = localStorage.getItem('storeLogo'); let logoHtml = storeLogo ? `<img src="${storeLogo}" style="width: 50%; max-width: 150px; margin-bottom: 10px;">` : '';
    let printHTML = `<div style="text-align: center; font-family: monospace;">${logoHtml}<h3 style="margin:0;">${storeName}</h3><p style="margin:0; font-size:12px;">(COPY) Kasir: ${sale.user}<br>${sale.date}</p></div><div style="text-align: left; font-family: monospace; font-size:12px; margin-top:5px;">Pelanggan: <strong>${sale.customer}</strong></div><div style="border-bottom: 1px dashed #000; margin: 5px 0;"></div><table style="width:100%; font-family: monospace; font-size: 12px; border-collapse: collapse;">${sale.items.map(i => `<tr><td colspan="2"><b>${i.name}</b></td></tr><tr><td>${i.qty}x ${i.price.toLocaleString('id-ID')}</td><td style="text-align:right;">${i.total.toLocaleString('id-ID')}</td></tr>`).join('')}</table><div style="border-bottom: 1px dashed #000; margin: 5px 0;"></div><table style="width:100%; font-family: monospace; font-size: 12px; border-collapse: collapse;"><tr><td>Subtotal</td><td style="text-align:right;">${sale.subtotal.toLocaleString('id-ID')}</td></tr>${sale.discount > 0 ? `<tr><td>Diskon</td><td style="text-align:right;">-${sale.discount.toLocaleString('id-ID')}</td></tr>` : ''}<tr><td><b>TOTAL</b></td><td style="text-align:right;"><b>Rp ${sale.total.toLocaleString('id-ID')}</b></td></tr><tr><td>Bayar (${sale.method})</td><td style="text-align:right;">${sale.cash.toLocaleString('id-ID')}</td></tr><tr><td>Kembalian</td><td style="text-align:right;">${sale.change.toLocaleString('id-ID')}</td></tr></table><div style="text-align: center; font-family: monospace; font-size: 12px; margin-top:15px;">Terima Kasih!</div>`;
    const base64html = btoa(unescape(encodeURIComponent(printHTML))); window.location.href = "rawbt:data:text/html;base64," + base64html;
}

if(document.getElementById('productsContainer')) { document.addEventListener('DOMContentLoaded', initPOS); }
