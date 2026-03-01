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

// === FUNGSI DESAIN STRUK (PREVIEW) - DIKUNCI ANTI BERANTAKAN DI APK ===
function renderPreviewModal(data, isCopy) {
    const storeName = localStorage.getItem('storeName') || 'Toko Saya';
    
    // Desain Preview menggunakan gaya monospaced murni yang di-lock max-width nya
    let contentHTML = `
        <div style="font-family: 'Courier New', Courier, monospace; font-size: 13px; color: #000; width: 100%; max-width: 320px; margin: 0 auto;">
            <div style="text-align: center;">
                <strong style="font-size: 16px;">${storeName}</strong><br>
                ${isCopy ? '(COPY)<br>' : ''}
                Kasir: ${data.user}<br>
                ${data.date}
            </div>
            <div style="border-top: 1px dashed #000; margin: 8px 0;"></div>
            <div style="text-align: left;">Pelanggan: <strong>${data.customer}</strong></div>
            <div style="border-top: 1px dashed #000; margin: 8px 0;"></div>
            <table style="width: 100%; font-size: 13px; font-family: inherit; border-collapse: collapse;">
                ${data.items.map(i => `
                    <tr><td colspan="2" style="padding: 2px 0;"><strong>${i.name}</strong></td></tr>
                    <tr>
                        <td style="padding: 0 0 4px 0;">${i.qty} x ${i.price.toLocaleString('id-ID')}</td>
                        <td style="text-align: right; padding: 0 0 4px 0;">${i.total.toLocaleString('id-ID')}</td>
                    </tr>
                `).join('')}
            </table>
            <div style="border-top: 1px dashed #000; margin: 8px 0;"></div>
            <table style="width: 100%; font-size: 13px; font-family: inherit; border-collapse: collapse;">
                <tr><td style="padding: 2px 0;"><strong>TOTAL</strong></td><td style="text-align: right;"><strong>Rp ${data.total.toLocaleString('id-ID')}</strong></td></tr>
                <tr><td style="padding: 2px 0;">Bayar (${data.method})</td><td style="text-align: right;">${data.cash.toLocaleString('id-ID')}</td></tr>
                <tr><td style="padding: 2px 0;">Kembali</td><td style="text-align: right;">${data.change.toLocaleString('id-ID')}</td></tr>
            </table>
            <div style="border-top: 1px dashed #000; margin: 8px 0;"></div>
            <div style="text-align: center; margin-top: 8px;">Terima Kasih!</div>
        </div>
    `;
    
    document.getElementById('receiptPreviewContent').innerHTML = contentHTML;
    document.getElementById('previewModal').style.display = 'flex';
}

function closePreview() { document.getElementById('previewModal').style.display = 'none'; activePrintData = null; }

// === FUNGSI CETAK KE RAWBT - DESAIN KHUSUS THERMAL 58MM ===
function confirmAndPrint() {
    if(!activePrintData) return;
    
    // Simpan data jika transaksi baru
    if (!isReprintMode) {
        const products = JSON.parse(localStorage.getItem('products') || '[]');
        activePrintData.items.forEach(cItem => { const p = products.find(x => x.id === cItem.id); if(p) p.stock -= cItem.qty; });
        localStorage.setItem('products', JSON.stringify(products));
        const sales = JSON.parse(localStorage.getItem('sales') || '[]');
        sales.push(activePrintData); localStorage.setItem('sales', JSON.stringify(sales));
    }

    const storeName = localStorage.getItem('storeName') || 'Toko Saya';
    let copyTag = isReprintMode ? "(COPY)<br>" : "";
    
    // Kodingan HTML Mentah yang 100% dipahami RawBT tanpa merusak tabel
    let printHTML = `
        <div style="font-family: monospace; font-size: 24px; color: black; width: 100%;">
            <div style="text-align: center;">
                <b>${storeName}</b><br>
                ${copyTag}
                Kasir: ${activePrintData.user}<br>
                ${activePrintData.date}
            </div>
            <hr style="border-top: 1px dashed black; border-bottom: none; margin: 5px 0;">
            <div>Pelanggan: <b>${activePrintData.customer}</b></div>
            <hr style="border-top: 1px dashed black; border-bottom: none; margin: 5px 0;">
            <table style="width: 100%; font-family: monospace; font-size: 24px;">
                ${activePrintData.items.map(i => `
                    <tr><td colspan="2"><b>${i.name}</b></td></tr>
                    <tr>
                        <td>${i.qty} x ${i.price.toLocaleString('id-ID')}</td>
                        <td style="text-align: right;">${i.total.toLocaleString('id-ID')}</td>
                    </tr>
                `).join('')}
            </table>
            <hr style="border-top: 1px dashed black; border-bottom: none; margin: 5px 0;">
            <table style="width: 100%; font-family: monospace; font-size: 24px;">
                <tr><td><b>TOTAL</b></td><td style="text-align: right;"><b>Rp ${activePrintData.total.toLocaleString('id-ID')}</b></td></tr>
                <tr><td>Bayar</td><td style="text-align: right;">${activePrintData.cash.toLocaleString('id-ID')}</td></tr>
                <tr><td>Kembali</td><td style="text-align: right;">${activePrintData.change.toLocaleString('id-ID')}</td></tr>
            </table>
            <hr style="border-top: 1px dashed black; border-bottom: none; margin: 5px 0;">
            <div style="text-align: center;">Terima Kasih!</div>
        </div>
    `;

    // Lempar ke aplikasi RawBT
    window.location.href = "rawbt:data:text/html;base64," + btoa(unescape(encodeURIComponent(printHTML)));

    setTimeout(() => { 
        if(!isReprintMode) { cart = []; document.getElementById('cashInput').value = ''; document.getElementById('custName').value = ''; }
        closePreview(); initPOS(); renderCart();
    }, 1500);
}

// HOLD & HISTORY LOGIC
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
