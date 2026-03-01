let cart = [];
let subtotal = 0, grandTotal = 0, change = 0, totalProfit = 0, discountNominal = 0;
let activePrintData = null; 
let isReprintMode = false;  

function initPOS() {
    document.getElementById('kasirNameDisplay').innerText = localStorage.getItem('currentUser');
    const products = JSON.parse(localStorage.getItem('products') || '[]');
    let categories = [...new Set(products.map(p => p.category || 'Umum'))];
    categories.sort((a, b) => a.localeCompare(b)); 

    const catOptions = document.getElementById('categoryOptions');
    if(catOptions) {
        catOptions.innerHTML = categories.map(c => `<option value="cat-${c}">${c}</option>`).join('');
    }
    filterAndSortProducts();
}

function handleNav() {
    if (localStorage.getItem('currentRole') === 'admin') window.location.href = 'dashboard.html';
    else { localStorage.clear(); window.location.href = 'index.html'; }
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

    document.getElementById('productsContainer').innerHTML = filtered.map(p => {
        const isOut = p.stock < 1;
        return `<div class="product-item ${isOut ? 'empty' : ''}" onclick="${isOut ? '' : `addToCart('${p.id}')`}">
            <span class="item-cat">${p.category || 'Umum'}</span>
            <div class="item-name">${p.name}</div>
            <div class="item-price">Rp ${p.price.toLocaleString('id-ID')}</div>
        </div>`;
    }).join('');
}

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
function closeScanner() { if(html5QrcodeScanner) { html5QrcodeScanner.clear(); } document.getElementById('scannerModal').style.display = 'none'; }

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
    document.getElementById('cartItems').innerHTML = cart.map((item, i) => `
        <div class="cart-item">
            <div>
                <span class="cart-item-name">${item.name}</span>
                <span class="cart-item-qty">${item.qty} x Rp ${item.price.toLocaleString('id-ID')}</span>
            </div>
            <div style="display:flex; align-items:center; gap:15px;">
                <span class="cart-item-price">Rp ${item.total.toLocaleString('id-ID')}</span>
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

    document.getElementById('grandTotalDisplay').innerText = `Rp ${grandTotal.toLocaleString('id-ID')}`;
    const cd = document.getElementById('changeDisplay');
    if (change < 0 && cash > 0) { cd.innerText = "Kurang!"; cd.style.color = "#f44336"; } 
    else { cd.innerText = `Rp ${Math.max(0, change).toLocaleString('id-ID')}`; cd.style.color = "#212121"; }
}

function previewCheckout() {
    if(cart.length === 0) return alert('Keranjang kosong!');
    let cash = parseFloat(document.getElementById('cashInput').value) || 0;
    if(cash < grandTotal) return alert('Uang bayar kurang!');

    isReprintMode = false;
    document.getElementById('previewTitle').innerText = "Konfirmasi Transaksi";
    activePrintData = { 
        id: Date.now(), user: localStorage.getItem('currentUser'), shiftId: (localStorage.getItem('currentShift') || 'No-Shift'), 
        date: new Date().toLocaleString('id-ID'), items: cart, subtotal, discount: discountNominal, total: grandTotal, 
        cash, change, netProfit: totalProfit - discountNominal, 
        customer: document.getElementById('custName').value.trim() || 'Umum', 
        method: document.getElementById('payMethod').value
    };
    renderPreviewModal(activePrintData, false);
}

function reprintSale(saleId) {
    const sales = JSON.parse(localStorage.getItem('sales') || '[]'); 
    const sale = sales.find(s => s.id === saleId); 
    if(!sale) return;
    isReprintMode = true; 
    activePrintData = sale;
    document.getElementById('previewTitle').innerText = "Cetak Ulang (Copy)";
    document.getElementById('historyModal').style.display = 'none'; 
    renderPreviewModal(activePrintData, true); 
}

// === FUNGSI DESAIN PREVIEW STRUK (THERMAL FIX) ===
function renderPreviewModal(data, isCopy) {
    const storeName = (localStorage.getItem('storeName') || 'SHANDOZ CAFE').toUpperCase();
    const storeLogo = localStorage.getItem('storeLogo');
    
    // Validasi Logo: Pastikan src tidak kosong
    let logoHtml = '';
    if(storeLogo && storeLogo !== "" && storeLogo !== "undefined") {
        logoHtml = `<div style="text-align: center;"><img src="${storeLogo}" style="max-width: 120px; max-height: 80px; margin-bottom: 10px; display: inline-block;"></div>`;
    }

    const totalQty = data.items.reduce((sum, item) => sum + item.qty, 0);
    
    let itemsHTML = data.items.map(i => `
        <tr style="vertical-align: top;">
            <td colspan="2" style="padding: 2px 0; word-wrap: break-word; font-weight: bold;">${i.name.toUpperCase()}</td>
        </tr>
        <tr style="border-bottom: 1px dotted #ccc;">
            <td style="padding: 0 0 5px 0; width: 60%;">${i.qty}X ${i.price.toLocaleString('id-ID')}</td>
            <td style="text-align: right; padding: 0 0 5px 0; width: 40%; font-weight: bold;">${i.total.toLocaleString('id-ID')}</td>
        </tr>
    `).join('');

    let contentHTML = `
        <div style="font-family: 'Courier New', Courier, monospace; font-size: 13px; color: #000; width: 100%; box-sizing: border-box; text-transform: uppercase; line-height: 1.2;">
            ${logoHtml}
            <div style="text-align: center; margin-bottom: 5px;">
                <strong style="font-size: 16px;">${storeName}</strong><br>
                ${isCopy ? '(COPY STRUK)<br>' : ''}
            </div>
            
            <div style="text-align: left; margin-bottom: 5px;">
                KASIR : ${data.user}<br>
                PELANGGAN : ${data.customer}
            </div>

            <div style="border-top: 1px dashed #000; margin: 5px 0;"></div>
            
            <table style="width: 100%; font-size: 13px; font-family: inherit; border-collapse: collapse; table-layout: fixed;">
                ${itemsHTML}
            </table>
            
            <div style="border-top: 1px dashed #000; margin: 5px 0;"></div>
            
            <table style="width: 100%; font-size: 13px; font-family: inherit; border-collapse: collapse; table-layout: fixed;">
                <tr><td style="padding: 2px 0;">TOTAL:</td><td style="text-align: right; font-weight: bold;">${data.total.toLocaleString('id-ID')}</td></tr>
                <tr><td style="padding: 2px 0;">${data.method === 'Tunai' ? 'TUNAI:' : data.method.toUpperCase() + ':'}</td><td style="text-align: right;">${data.cash.toLocaleString('id-ID')}</td></tr>
                <tr><td style="padding: 2px 0;">KEMBALI:</td><td style="text-align: right;">${data.change.toLocaleString('id-ID')}</td></tr>
            </table>
            
            <div style="border-top: 1px dashed #000; margin: 5px 0;"></div>
            
            <div style="text-align: center; margin-top: 10px;">
                SOLD ${data.items.length} ITEMS, QTY ${totalQty}<br>
                ${data.date}<br><br>
                ** TERIMAKASIH **<br>
                ATAS KUNJUNGAN ANDA
            </div>
        </div>
    `;
    
    document.getElementById('receiptPreviewContent').innerHTML = contentHTML;
    document.getElementById('previewModal').style.display = 'flex';
}

function closePreview() { document.getElementById('previewModal').style.display = 'none'; activePrintData = null; }

// === FUNGSI CETAK KE RAWBT (UKURAN 58MM FIX) ===
function confirmAndPrint() {
    if(!activePrintData) return;
    
    if (!isReprintMode) {
        const products = JSON.parse(localStorage.getItem('products') || '[]');
        activePrintData.items.forEach(cItem => { const p = products.find(x => x.id === cItem.id); if(p) p.stock -= cItem.qty; });
        localStorage.setItem('products', JSON.stringify(products));
        const sales = JSON.parse(localStorage.getItem('sales') || '[]');
        sales.push(activePrintData); localStorage.setItem('sales', JSON.stringify(sales));
    }

    const storeName = (localStorage.getItem('storeName') || 'SHANDOZ CAFE').toUpperCase();
    const storeLogo = localStorage.getItem('storeLogo');
    
    let logoPrintHtml = '';
    if(storeLogo && storeLogo !== "" && storeLogo !== "undefined") {
        logoPrintHtml = `<div style="text-align:center;"><img src="${storeLogo}" style="max-width: 150px; display: block; margin: 0 auto 10px auto;"></div>`;
    }

    const totalQty = activePrintData.items.reduce((sum, item) => sum + item.qty, 0);
    let copyTag = isReprintMode ? "(COPY STRUK)<br>" : "";
    
    let itemsHTML = activePrintData.items.map(i => `
        <tr style="vertical-align: top;">
            <td colspan="2" style="padding-bottom:2px; font-weight: bold;">${i.name.toUpperCase()}</td>
        </tr>
        <tr>
            <td style="padding-bottom:5px; width: 60%;">${i.qty}X ${i.price.toLocaleString('id-ID')}</td>
            <td style="text-align: right; padding-bottom:5px; width: 40%; font-weight: bold;">${i.total.toLocaleString('id-ID')}</td>
        </tr>
    `).join('');

    let printHTML = `
        <div style="font-family: monospace; font-size: 24px; color: black; width: 100%; text-transform: uppercase;">
            ${logoPrintHtml}
            <div style="text-align: center; margin-bottom: 10px;">
                <b>${storeName}</b><br>
                ${copyTag}
            </div>
            
            <div style="text-align: left;">
                KASIR : ${activePrintData.user}<br>
                PELANGGAN: ${activePrintData.customer}
            </div>

            <hr style="border-top: 1px dashed black; border-bottom: none; margin: 8px 0;">
            
            <table style="width: 100%; font-family: monospace; font-size: 24px; border-collapse: collapse; table-layout: fixed;">
                ${itemsHTML}
            </table>
            
            <hr style="border-top: 1px dashed black; border-bottom: none; margin: 8px 0;">
            
            <table style="width: 100%; font-family: monospace; font-size: 24px; border-collapse: collapse; table-layout: fixed;">
                <tr><td style="width: 50%;">TOTAL:</td><td style="text-align: right; width: 50%;"><b>${activePrintData.total.toLocaleString('id-ID')}</b></td></tr>
                <tr><td style="width: 50%;">BAYAR:</td><td style="text-align: right; width: 50%;">${activePrintData.cash.toLocaleString('id-ID')}</td></tr>
                <tr><td style="width: 50%;">KEMBALI:</td><td style="text-align: right; width: 50%;">${activePrintData.change.toLocaleString('id-ID')}</td></tr>
            </table>
            
            <hr style="border-top: 1px dashed black; border-bottom: none; margin: 8px 0;">
            
            <div style="text-align: center; margin-top: 15px;">
                SOLD ${activePrintData.items.length} ITEMS, QTY ${totalQty}<br>
                ${activePrintData.date}<br><br>
                ** TERIMAKASIH **<br>
                ATAS KUNJUNGAN ANDA
                <br><br><br>
            </div>
        </div>
    `;

    window.location.href = "rawbt:data:text/html;base64," + btoa(unescape(encodeURIComponent(printHTML)));

    setTimeout(() => { 
        if(!isReprintMode) { cart = []; document.getElementById('cashInput').value = ''; document.getElementById('custName').value = ''; }
        closePreview(); initPOS(); renderCart();
    }, 1500);
}

// HOLD & HISTORY LOGIC (RETAINED)
function saveOpenBill() {
    if(cart.length === 0) return alert('Keranjang kosong!');
    const custName = document.getElementById('custName').value.trim();
    if(!custName) return alert('Masukkan Nama!');
    const openBills = JSON.parse(localStorage.getItem('openBills') || '[]');
    openBills.push({ id: "BILL-" + Date.now(), customer: custName, time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }), items: cart, total: grandTotal });
    localStorage.setItem('openBills', JSON.stringify(openBills));
    cart = []; document.getElementById('cashInput').value = ''; document.getElementById('custName').value = ''; renderCart();
}
function showOpenBills() {
    const openBills = JSON.parse(localStorage.getItem('openBills') || '[]');
    const container = document.getElementById('openBillContent');
    if(openBills.length === 0) { container.innerHTML = '<p style="text-align:center;">Kosong.</p>'; } 
    else { container.innerHTML = openBills.map((b, i) => `<div style="border:1px solid #ddd; padding:10px; margin-bottom:10px; display:flex; justify-content:space-between;"><div><strong>${b.customer}</strong><br>Rp ${b.total.toLocaleString('id-ID')}</div><div style="display:flex; gap:5px;"><button class="primary" onclick="recallBill(${i})">Panggil</button><button class="danger" onclick="deleteBill(${i})">X</button></div></div>`).join(''); }
    document.getElementById('openBillModal').style.display = 'flex';
}
function closeOpenBillModal() { document.getElementById('openBillModal').style.display = 'none'; }
function recallBill(index) {
    if(cart.length > 0 && !confirm('Timpa pesanan?')) return;
    const openBills = JSON.parse(localStorage.getItem('openBills') || '[]');
    cart = openBills[index].items; document.getElementById('custName').value = openBills[index].customer; renderCart();
    openBills.splice(index, 1); localStorage.setItem('openBills', JSON.stringify(openBills)); closeOpenBillModal();
}
function deleteBill(index) {
    if(confirm('Hapus tiket?')) { const openBills = JSON.parse(localStorage.getItem('openBills') || '[]'); openBills.splice(index, 1); localStorage.setItem('openBills', JSON.stringify(openBills)); showOpenBills(); }
}

function showPosHistory() {
    const sales = JSON.parse(localStorage.getItem('sales') || '[]');
    const recentSales = sales.slice(-15).reverse();
    const tbody = document.getElementById('posHistoryList');
    if(recentSales.length === 0) { tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Belum ada transaksi</td></tr>'; } 
    else { tbody.innerHTML = recentSales.map(s => `<tr><td style="border-bottom: 1px solid #eee; padding: 10px 5px;">${s.date.split(', ')[1]}</td><td style="border-bottom: 1px solid #eee;">${s.customer || '-'}</td><td style="border-bottom: 1px solid #eee; color:#4caf50;">Rp ${s.total.toLocaleString('id-ID')}</td><td style="border-bottom: 1px solid #eee;"><button class="primary" style="padding: 4px 8px;" onclick="reprintSale(${s.id})">🖨️</button></td></tr>`).join(''); }
    document.getElementById('historyModal').style.display = 'flex';
}
function closePosHistory() { document.getElementById('historyModal').style.display = 'none'; }

if(document.getElementById('productsContainer')) { document.addEventListener('DOMContentLoaded', initPOS); }
