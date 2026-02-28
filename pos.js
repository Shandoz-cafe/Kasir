let cart = [];

function loadPOSProducts() {
    const products = JSON.parse(localStorage.getItem('products') || '[]');
    const container = document.getElementById('productsContainer');
    container.innerHTML = products.map((p) => `
        <div class="card" style="width:150px; text-align:center; cursor:pointer;" onclick="addToCart('${p.name}', ${p.price})">
            <h4 style="margin:0 0 10px 0;">${p.name}</h4>
            <p style="margin:0; color:#27ae60; font-weight:bold;">Rp ${p.price}</p>
        </div>
    `).join('');
}

function addToCart(name, price) {
    const existing = cart.find(item => item.name === name);
    if(existing) {
        existing.qty++;
        existing.total = existing.qty * existing.price;
    } else {
        cart.push({name, price, qty: 1, total: price});
    }
    renderCart();
}

function renderCart() {
    const list = document.getElementById('cartItems');
    list.innerHTML = cart.map((item, i) => `
        <div style="display:flex; justify-content:space-between; margin-bottom:10px; border-bottom:1px solid #eee; padding-bottom:5px;">
            <span>${item.name} (x${item.qty})</span>
            <span>Rp ${item.total} <button class="danger" style="padding:2px 5px;" onclick="removeFromCart(${i})">X</button></span>
        </div>
    `).join('');
    document.getElementById('cartTotal').innerText = cart.reduce((sum, i) => sum + i.total, 0);
}

function removeFromCart(index){
    cart.splice(index, 1); renderCart();
}

function checkout() {
    if(cart.length === 0) return alert('Keranjang kosong!');
    const sales = JSON.parse(localStorage.getItem('sales') || '[]');
    const sale = {
        id: Date.now(),
        user: localStorage.getItem('currentUser'),
        date: new Date().toLocaleString('id-ID'),
        items: cart,
        total: cart.reduce((sum,i)=>sum+i.total,0)
    };
    sales.push(sale);
    localStorage.setItem('sales', JSON.stringify(sales));
    printReceipt(sale);
    cart = []; renderCart();
}

function printReceipt(sale) {
    const storeName = localStorage.getItem('storeName') || 'Toko Saya';
    const storeLogo = localStorage.getItem('storeLogo');
    let logoHtml = storeLogo ? `<img src="${storeLogo}" style="max-width: 60px; display: block; margin: 0 auto 5px auto; filter: grayscale(100%);">` : '';

    let content = `
    <style>
        @page { margin: 0; }
        body { font-family: 'Courier New', monospace; width: 58mm; padding: 5px; margin: 0 auto; font-size: 12px; color: black; }
        .center { text-align: center; } .line { border-bottom: 1px dashed #000; margin: 5px 0; }
        table { width: 100%; border-collapse: collapse; } td { padding: 2px 0; font-size: 11px; }
        .right { text-align: right; } .bold { font-weight: bold; }
    </style>
    <div class="center">${logoHtml}<h3 style="margin:0;">${storeName}</h3><p style="margin: 2px 0; font-size: 10px;">Kasir: ${sale.user}<br>${sale.date}</p></div>
    <div class="line"></div>
    <table>${sale.items.map(i => `<tr><td colspan="2">${i.name}</td></tr><tr><td>${i.qty}x ${i.price}</td><td class="right">Rp ${i.total}</td></tr>`).join('')}</table>
    <div class="line"></div>
    <div class="right bold">TOTAL: Rp ${sale.total}</div>
    <div class="center" style="margin-top:10px; font-size: 11px;"><p>Terima Kasih!</p></div>
    `;

    const printWin = window.open('', '_blank');
    printWin.document.write(content);
    printWin.document.close();
    setTimeout(() => { printWin.print(); printWin.close(); }, 500);
}

if(document.getElementById('productsContainer')) { document.addEventListener('DOMContentLoaded', loadPOSProducts); }
