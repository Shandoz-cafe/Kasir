let cart = [];
let subtotal = 0, grandTotal = 0, change = 0, totalProfit = 0;
let currentCategory = 'Semua';
let searchQuery = '';

function loadPOSProducts() {
    const products = JSON.parse(localStorage.getItem('products') || '[]');
    
    // Auto-Generate Tombol Kategori
    const categories = ['Semua', ...new Set(products.map(p => p.category || 'Umum'))];
    const catContainer = document.getElementById('categoryButtons');
    if(catContainer) {
        catContainer.innerHTML = categories.map(c => `
            <button class="category-btn ${currentCategory === c ? 'active' : ''}" onclick="setCategory('${c}')">${c}</button>
        `).join('');
    }

    // Filter by Kategori & Pencarian
    const filtered = products.filter(p => {
        const matchCat = currentCategory === 'Semua' || (p.category || 'Umum') === currentCategory;
        const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchCat && matchSearch;
    });

    const container = document.getElementById('productsContainer');
    container.innerHTML = filtered.map((p) => {
        const isOut = p.stock < 1;
        return `<div class="product-card ${isOut ? 'empty' : ''}" onclick="${isOut ? '' : `addToCart('${p.id}')`}">
            <div class="cat-badge">${p.category || 'Umum'}</div>
            <h4>${p.name}</h4>
            <p class="price">Rp ${p.price.toLocaleString('id-ID')}</p>
            <p class="stock">Stok: ${p.stock}</p>
        </div>`;
    }).join('');
}

function setCategory(cat) { currentCategory = cat; loadPOSProducts(); }
function filterProducts() { searchQuery = document.getElementById('searchInput').value; loadPOSProducts(); }

function addToCart(id) {
    const products = JSON.parse(localStorage.getItem('products') || '[]');
    const product = products.find(p => p.id === id);
    const existing = cart.find(item => item.id === id);
    
    if(existing) {
        if(existing.qty >= product.stock) return alert('Stok tidak mencukupi!');
        existing.qty++; existing.total = existing.qty * existing.price; existing.profit = (existing.price - existing.cost) * existing.qty;
    } else {
        cart.push({ id: product.id, name: product.name, price: product.price, cost: product.cost, qty: 1, total: product.price, profit: product.price - product.cost });
    }
    renderCart();
}

function renderCart() {
    const list = document.getElementById('cartItems');
    list.innerHTML = cart.map((item, i) => `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; border-bottom:1px solid #eee; padding-bottom:8px;">
            <div style="line-height:1.3; font-size:1.1rem;"><strong>${item.name}</strong><br><small style="color:#7f8c8d;">${item.qty} x Rp ${item.price.toLocaleString('id-ID')}</small></div>
            <div style="display:flex; align-items:center; gap:15px;">
                <strong style="font-size:1.1rem;">Rp ${item.total.toLocaleString('id-ID')}</strong>
                <button class="danger" style="padding:6px 12px; font-size:0.9rem; border-radius:8px;" onclick="removeFromCart(${i})">X</button>
            </div>
        </div>
    `).join('');
    calculateTotal();
}

function removeFromCart(index){ cart.splice(index, 1); renderCart(); }

function calculateTotal() {
    subtotal = cart.reduce((sum, item) => sum + item.total, 0);
    totalProfit = cart.reduce((sum, item) => sum + item.profit, 0);
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

function checkout() {
    if(cart.length === 0) return alert('Keranjang kosong!');
    let cash = parseFloat(document.getElementById('cashInput').value) || 0;
    let discount = parseFloat(document.getElementById('discountInput').value) || 0;
    if(cash < grandTotal) return alert('Uang pelanggan kurang!');

    const products = JSON.parse(localStorage.getItem('products') || '[]');
    cart.forEach(cItem => { const p = products.find(p => p.id === cItem.id); if(p) p.stock -= cItem.qty; });
    localStorage.setItem('products', JSON.stringify(products));

    const sales = JSON.parse(localStorage.getItem('sales') || '[]');
    const sale = { id: Date.now(), user: localStorage.getItem('currentUser'), date: new Date().toLocaleString('id-ID'), items: cart, subtotal: subtotal, discount: discount, total: grandTotal, cash: cash, change: change, netProfit: totalProfit - discount };
    sales.push(sale); localStorage.setItem('sales', JSON.stringify(sales));
    
    printReceipt(sale);
    cart = []; document.getElementById('discountInput').value = 0; document.getElementById('cashInput').value = ''; renderCart(); loadPOSProducts();
}

function printReceipt(sale) {
    const storeName = localStorage.getItem('storeName') || 'Toko Saya';
    const storeLogo = localStorage.getItem('storeLogo');
    let logoHtml = storeLogo ? `<img src="${storeLogo}" style="max-width: 60px; display: block; margin: 0 auto 5px auto; filter: grayscale(100%);">` : '';

    let content = `
    <style>
        @page { margin: 0; size: 58mm auto; } 
        body { font-family: 'Courier New', monospace; width: 58mm; padding: 5px; margin: 0 auto; font-size: 11px; color: black; background: white; }
        .center { text-align: center; } .line { border-bottom: 1px dashed #000; margin: 5px 0; }
        table { width: 100%; border-collapse: collapse; } td { padding: 3px 0; }
        .right { text-align: right; } .bold { font-weight: bold; }
    </style>
    <div class="center">${logoHtml}<h3 style="margin:0; font-size:14px;">${storeName}</h3><p style="margin: 3px 0; font-size: 10px;">ID: ${sale.id}<br>Kasir: ${sale.user}<br>${sale.date}</p></div>
    <div class="line"></div>
    <table>${sale.items.map(i => `<tr><td colspan="2" class="bold">${i.name}</td></tr><tr><td>${i.qty}x ${i.price.toLocaleString('id-ID')}</td><td class="right">${i.total.toLocaleString('id-ID')}</td></tr>`).join('')}</table>
    <div class="line"></div>
    <table>
        <tr><td>Subtotal</td><td class="right">${sale.subtotal.toLocaleString('id-ID')}</td></tr>
        ${sale.discount > 0 ? `<tr><td>Diskon</td><td class="right">- ${sale.discount.toLocaleString('id-ID')}</td></tr>` : ''}
        <tr><td class="bold">TOTAL</td><td class="right bold">Rp ${sale.total.toLocaleString('id-ID')}</td></tr>
    </table>
    <div class="line"></div>
    <table><tr><td>Tunai</td><td class="right">${sale.cash.toLocaleString('id-ID')}</td></tr><tr><td>Kembali</td><td class="right">${sale.change.toLocaleString('id-ID')}</td></tr></table>
    <div class="center" style="margin-top:15px; font-size: 10px;"><p>Terima kasih!</p></div>
    `;

    document.body.innerHTML = content;
    setTimeout(() => { window.print(); window.location.reload(); }, 500);
}

if(document.getElementById('productsContainer')) { document.addEventListener('DOMContentLoaded', loadPOSProducts); }
