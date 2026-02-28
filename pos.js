let cart = [];
let subtotal = 0, grandTotal = 0, change = 0, totalProfit = 0;
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

function calculateTotal() {
    subtotal = cart.reduce((sum, i) => sum + i.total, 0);
    totalProfit = cart.reduce((sum, i) => sum + i.profit, 0);
    let discount = parseFloat(document.getElementById('discountInput').value) || 0;
    if(discount > subtotal) { discount = subtotal; document.getElementById('discountInput').value = subtotal; }
    grandTotal = subtotal - discount;
    let cash = parseFloat(document.getElementById('cashInput').value) || 0;
    change = cash - grandTotal;

    document.getElementById('subtotalDisplay').innerText = `Rp ${subtotal.toLocaleString('id-ID')}`;
    document.getElementById('grandTotalDisplay').innerText = `Rp ${grandTotal.toLocaleString('id-ID')}`;
    const cd = document.getElementById('changeDisplay');
    if (change < 0 && cash > 0) { cd.innerText = "Uang Kurang!"; cd.style.color = "#e74c3c"; } 
    else { cd.innerText = `Rp ${Math.max(0, change).toLocaleString('id-ID')}`; cd.style.color = "#2a5298"; }
}

// === FITUR PREVIEW STRUK ===
function previewCheckout() {
    if(cart.length === 0) return alert('Keranjang kosong!');
    let cash = parseFloat(document.getElementById('cashInput').value) || 0;
    let discount = parseFloat(document.getElementById('discountInput').value) || 0;
    if(cash < grandTotal) return alert('Uang bayar kurang!');

    pendingSale = { id: Date.now(), user: localStorage.getItem('currentUser'), date: new Date().toLocaleString('id-ID'), items: cart, subtotal, discount, total: grandTotal, cash, change, netProfit: totalProfit - discount };

    // Build HTML Preview
    const storeName = localStorage.getItem('storeName') || 'Toko Saya';
    const storeLogo = localStorage.getItem('storeLogo');
    let logoHtml = storeLogo ? `<img src="${storeLogo}" style="max-width: 50px; display: block; margin: 0 auto 5px auto; filter: grayscale(100%);">` : '';

    let contentHTML = `
        <div style="text-align: center;">${logoHtml}<strong>${storeName}</strong><br><small>Kasir: ${pendingSale.user}<br>${pendingSale.date}</small></div>
        <div style="border-bottom: 1px dashed #000; margin: 5px 0;"></div>
        <table style="width:100%; font-size: 11px;">
            ${pendingSale.items.map(i => `<tr><td colspan="2"><strong>${i.name}</strong></td></tr><tr><td>${i.qty}x ${i.price}</td><td style="text-align:right;">${i.total}</td></tr>`).join('')}
        </table>
        <div style="border-bottom: 1px dashed #000; margin: 5px 0;"></div>
        <div style="text-align: right;"><strong>TOTAL: Rp ${pendingSale.total}</strong></div>
        <div style="text-align: center; margin-top:10px;"><small>Terima Kasih!</small></div>
        
        <div style="border-top: 2px dashed #000; margin-top: 20px; padding-top: 10px; text-align: center;"><strong>--- TIKET DAPUR ---</strong><br><small>ID: ${pendingSale.id}</small></div>
        <table style="width:100%; font-size: 13px; margin-top:10px;">
            ${pendingSale.items.map(i => `<tr><td style="padding-bottom:5px;"><strong>${i.name}</strong></td><td style="text-align:right;"><strong>x ${i.qty}</strong></td></tr>`).join('')}
        </table>
    `;

    document.getElementById('receiptPreviewContent').innerHTML = contentHTML;
    document.getElementById('previewModal').style.display = 'flex';
}

function closePreview() {
    document.getElementById('previewModal').style.display = 'none';
    pendingSale = null;
}

// === CETAK 2 STRUK (Kasir + Dapur) ===
function confirmAndPrint() {
    if(!pendingSale) return;

    // Potong Stok
    const products = JSON.parse(localStorage.getItem('products') || '[]');
    pendingSale.items.forEach(cItem => { const p = products.find(x => x.id === cItem.id); if(p) p.stock -= cItem.qty; });
    localStorage.setItem('products', JSON.stringify(products));

    // Simpan Laporan
    const sales = JSON.parse(localStorage.getItem('sales') || '[]');
    sales.push(pendingSale); localStorage.setItem('sales', JSON.stringify(sales));

    // Siapkan Tampilan Print (Kasir + Tiket Dapur)
    const storeName = localStorage.getItem('storeName') || 'Toko Saya';
    const storeLogo = localStorage.getItem('storeLogo');
    let logoHtml = storeLogo ? `<img src="${storeLogo}" style="max-width: 60px; display: block; margin: 0 auto 5px auto; filter: grayscale(100%);">` : '';

    let printHTML = `
    <style>
        @page { margin: 0; size: 58mm auto; } 
        body { font-family: 'Courier New', monospace; width: 58mm; padding: 5px; margin: 0 auto; font-size: 11px; color: black; background: white; }
        .center { text-align: center; } .line { border-bottom: 1px dashed #000; margin: 5px 0; }
        table { width: 100%; border-collapse: collapse; } td { padding: 3px 0; }
        .right { text-align: right; } .bold { font-weight: bold; }
        .dapur-ticket { margin-top: 40px; border-top: 2px dashed #000; padding-top: 15px; } /* Jarak untuk disobek */
    </style>
    <div class="center">${logoHtml}<h3 style="margin:0; font-size:14px;">${storeName}</h3><p style="margin: 3px 0; font-size: 10px;">ID: ${pendingSale.id}<br>Kasir: ${pendingSale.user}<br>${pendingSale.date}</p></div>
    <div class="line"></div>
    <table>${pendingSale.items.map(i => `<tr><td colspan="2" class="bold">${i.name}</td></tr><tr><td>${i.qty}x ${i.price.toLocaleString('id-ID')}</td><td class="right">${i.total.toLocaleString('id-ID')}</td></tr>`).join('')}</table>
    <div class="line"></div>
    <table>
        <tr><td>Subtotal</td><td class="right">${pendingSale.subtotal.toLocaleString('id-ID')}</td></tr>
        ${pendingSale.discount > 0 ? `<tr><td>Diskon</td><td class="right">- ${pendingSale.discount.toLocaleString('id-ID')}</td></tr>` : ''}
        <tr><td class="bold">TOTAL</td><td class="right bold">Rp ${pendingSale.total.toLocaleString('id-ID')}</td></tr>
    </table>
    <div class="line"></div>
    <table><tr><td>Tunai</td><td class="right">${pendingSale.cash.toLocaleString('id-ID')}</td></tr><tr><td>Kembali</td><td class="right">${pendingSale.change.toLocaleString('id-ID')}</td></tr></table>
    <div class="center" style="margin-top:15px; font-size: 10px;"><p>Terima kasih!</p></div>

    <div class="dapur-ticket center">
        <h3 style="margin:0;">--- TIKET DAPUR ---</h3>
        <p style="margin: 3px 0; font-size: 10px;">ID: ${pendingSale.id}<br>${pendingSale.date}</p>
    </div>
    <div class="line"></div>
    <table style="font-size: 13px;">
        ${pendingSale.items.map(i => `<tr><td class="bold" style="padding-bottom:8px;">${i.name}</td><td class="right bold" style="font-size: 14px;">x ${i.qty}</td></tr>`).join('')}
    </table>
    <div class="center" style="margin-top:20px; font-size: 10px;">.</div>
    `;

    document.body.innerHTML = printHTML;
    setTimeout(() => { window.print(); window.location.reload(); }, 500);
}

if(document.getElementById('productsContainer')) { document.addEventListener('DOMContentLoaded', loadPOSProducts); }
