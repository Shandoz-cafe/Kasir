let cart = [];
let subtotal = 0, grandTotal = 0, change = 0, totalProfit = 0, discountNominal = 0;
let currentCategory = 'Semua', searchQuery = '';
let pendingSale = null;

function loadPOSProducts() {
    const products = JSON.parse(localStorage.getItem('products') || '[]');
    const categories = ['Semua', ...new Set(products.map(p => p.category || 'Umum'))];
    const catContainer = document.getElementById('categoryButtons');
    if(catContainer) {
        catContainer.innerHTML = categories.map(c => `<button class="category-btn ${currentCategory === c ? 'active' : ''}" onclick="setCategory('${c}')">${c}</button>`).join('');
    }

    const filtered = products.filter(p => (currentCategory === 'Semua' || (p.category || 'Umum') === currentCategory) && p.name.toLowerCase().includes(searchQuery.toLowerCase()));
    document.getElementById('productsContainer').innerHTML = filtered.map(p => {
        const isOut = p.stock < 1;
        return `<div class="product-card ${isOut ? 'empty' : ''}" onclick="${isOut ? '' : `addToCart('${p.id}')`}">
            <div class="cat-badge">${p.category || 'Umum'}</div><h4>${p.name}</h4><p class="price">Rp ${p.price.toLocaleString('id-ID')}</p><p class="stock">Stok: ${p.stock}</p>
        </div>`;
    }).join('');
}

function setCategory(cat) { currentCategory = cat; loadPOSProducts(); }
function filterProducts() { searchQuery = document.getElementById('searchInput').value; loadPOSProducts(); }

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
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; border-bottom:1px solid #eee; padding-bottom:8px;">
            <div style="line-height:1.3;"><strong>${item.name}</strong><br><small>${item.qty} x Rp ${item.price.toLocaleString('id-ID')}</small></div>
            <div style="display:flex; align-items:center; gap:15px;">
                <strong>Rp ${item.total.toLocaleString('id-ID')}</strong><button class="danger" style="padding:4px 10px;" onclick="cart.splice(${i}, 1); renderCart();">X</button>
            </div>
        </div>
    `).join('');
    calculateTotal();
}

function handlePaymentMethod() {
    const method = document.getElementById('payMethod').value;
    const cashInput = document.getElementById('cashInput');
    if(method !== 'Tunai') {
        cashInput.value = grandTotal;
        cashInput.disabled = true;
    } else {
        cashInput.value = '';
        cashInput.disabled = false;
    }
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
    if (change < 0 && cash > 0) { cd.innerText = "Uang Kurang!"; cd.style.color = "#e74c3c"; } 
    else { cd.innerText = `Rp ${Math.max(0, change).toLocaleString('id-ID')}`; cd.style.color = "#2a5298"; }
}

function previewCheckout() {
    if(cart.length === 0) return alert('Keranjang kosong!');
    let cash = parseFloat(document.getElementById('cashInput').value) || 0;
    if(cash < grandTotal) return alert('Uang bayar kurang!');

    const custName = document.getElementById('custName').value.trim() || 'Pelanggan Umum';
    const payMethod = document.getElementById('payMethod').value;

    pendingSale = { 
        id: Date.now(), user: localStorage.getItem('currentUser'), date: new Date().toLocaleString('id-ID'), 
        items: cart, subtotal, discount: discountNominal, total: grandTotal, cash, change, 
        netProfit: totalProfit - discountNominal, customer: custName, method: payMethod
    };

    const storeName = localStorage.getItem('storeName') || 'Toko Saya';
    
    // Tampilan HTML untuk Preview di Layar (Visual saja)
    let contentHTML = `
        <div style="text-align: center;"><strong>${storeName}</strong><br><small>Kasir: ${pendingSale.user}<br>${pendingSale.date}</small></div>
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
        
        <div style="border-top: 2px dashed #000; margin-top: 20px; padding-top: 10px; text-align: center;"><strong>--- TIKET DAPUR ---</strong><br><small>ID: ${pendingSale.id}</small></div>
        <div style="text-align: left; margin-top:5px;"><small>Pelanggan: <strong>${pendingSale.customer}</strong></small></div>
        <table style="width:100%; font-size: 13px; margin-top:10px;">
            ${pendingSale.items.map(i => `<tr><td style="padding-bottom:5px;"><strong>${i.name}</strong></td><td style="text-align:right;"><strong>x ${i.qty}</strong></td></tr>`).join('')}
        </table>
    `;

    document.getElementById('receiptPreviewContent').innerHTML = contentHTML;
    document.getElementById('previewModal').style.display = 'flex';
}

function closePreview() { document.getElementById('previewModal').style.display = 'none'; pendingSale = null; }

function confirmAndPrint() {
    if(!pendingSale) return;

    // Potong Stok
    const products = JSON.parse(localStorage.getItem('products') || '[]');
    pendingSale.items.forEach(cItem => { const p = products.find(x => x.id === cItem.id); if(p) p.stock -= cItem.qty; });
    localStorage.setItem('products', JSON.stringify(products));

    // Simpan Laporan
    const sales = JSON.parse(localStorage.getItem('sales') || '[]');
    sales.push(pendingSale); localStorage.setItem('sales', JSON.stringify(sales));

    const storeName = localStorage.getItem('storeName') || 'Toko Saya';
    
    // HTML Khusus yang akan dikirim langsung ke mesin RawBT
    let printHTML = `
    <div style="text-align: center; font-family: monospace;">
        <h3 style="margin:0;">${storeName}</h3>
        <p style="margin:0; font-size:12px;">Kasir: ${pendingSale.user}<br>${pendingSale.date}</p>
    </div>
    <div style="text-align: left; font-family: monospace; font-size:12px; margin-top:5px;">Pelanggan: <strong>${pendingSale.customer}</strong></div>
    <div style="border-bottom: 1px dashed #000; margin: 5px 0;"></div>
    <table style="width:100%; font-family: monospace; font-size: 12px; border-collapse: collapse;">
        ${pendingSale.items.map(i => `<tr><td colspan="2"><b>${i.name}</b></td></tr><tr><td>${i.qty}x ${i.price.toLocaleString('id-ID')}</td><td style="text-align:right;">${i.total.toLocaleString('id-ID')}</td></tr>`).join('')}
    </table>
    <div style="border-bottom: 1px dashed #000; margin: 5px 0;"></div>
    <table style="width:100%; font-family: monospace; font-size: 12px; border-collapse: collapse;">
        <tr><td>Subtotal</td><td style="text-align:right;">${pendingSale.subtotal.toLocaleString('id-ID')}</td></tr>
        ${pendingSale.discount > 0 ? `<tr><td>Diskon</td><td style="text-align:right;">-${pendingSale.discount.toLocaleString('id-ID')}</td></tr>` : ''}
        <tr><td><b>TOTAL</b></td><td style="text-align:right;"><b>Rp ${pendingSale.total.toLocaleString('id-ID')}</b></td></tr>
        <tr><td>Bayar (${pendingSale.method})</td><td style="text-align:right;">${pendingSale.cash.toLocaleString('id-ID')}</td></tr>
        <tr><td>Kembalian</td><td style="text-align:right;">${pendingSale.change.toLocaleString('id-ID')}</td></tr>
    </table>
    <div style="text-align: center; font-family: monospace; font-size: 12px; margin-top:10px;">Terima Kasih!</div>

    <div style="margin-top: 40px; border-top: 2px dashed #000; padding-top: 15px; text-align: center; font-family: monospace;">
        <h3 style="margin:0;">--- TIKET DAPUR ---</h3>
        <p style="margin:0; font-size:12px;">ID: ${pendingSale.id}<br>${pendingSale.date}</p>
    </div>
    <div style="text-align: left; font-family: monospace; font-size:12px; margin-top:5px;">Pelanggan: <strong>${pendingSale.customer}</strong></div>
    <div style="border-bottom: 1px dashed #000; margin: 5px 0;"></div>
    <table style="width:100%; font-family: monospace; font-size: 14px; border-collapse: collapse;">
        ${pendingSale.items.map(i => `<tr><td style="padding-bottom:5px;"><b>${i.name}</b></td><td style="text-align:right;"><b>x ${i.qty}</b></td></tr>`).join('')}
    </table>
    <div style="text-align: center; font-family: monospace; font-size: 10px; margin-top:20px;">.</div>
    `;

    // TRIK BYPASS ANDROID PDF -> LANGSUNG KE RAWBT
    const base64html = btoa(unescape(encodeURIComponent(printHTML)));
    const rawbtUrl = "rawbt:data:text/html;base64," + base64html;
    
    // Eksekusi print langsung via URL RawBT
    window.location.href = rawbtUrl;

    // Reset keranjang setelah ngeprint
    setTimeout(() => { 
        cart = []; 
        document.getElementById('discountInput').value = 0; 
        document.getElementById('cashInput').value = ''; 
        document.getElementById('custName').value = '';
        closePreview(); 
        loadPOSProducts(); 
        renderCart();
    }, 1500);
}

if(document.getElementById('productsContainer')) { document.addEventListener('DOMContentLoaded', loadPOSProducts); }
