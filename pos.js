let cart = [];
let subtotal = 0, grandTotal = 0, change = 0, totalProfit = 0, discountNominal = 0;
let activePrintData = null; 
let isReprintMode = false;  

const getPrinterSettings = () => {
    const saved = localStorage.getItem('printerSettings');
    return saved ? JSON.parse(saved) : {"paperSize":"58", "autoPrint":false};
};

function initPOS() {
    const userDisplay = document.getElementById('kasirNameDisplay');
    if(userDisplay) userDisplay.innerText = localStorage.getItem('currentUser');
    const products = JSON.parse(localStorage.getItem('products') || '[]');
    let categories = [...new Set(products.map(p => p.category || 'Umum'))];
    categories.sort((a, b) => a.localeCompare(b)); 
    const catOptions = document.getElementById('categoryOptions');
    if(catOptions) catOptions.innerHTML = categories.map(c => `<option value="cat-${c}">${c}</option>`).join('');
    filterAndSortProducts();
}

function filterAndSortProducts() {
    const products = JSON.parse(localStorage.getItem('products') || '[]');
    const searchQuery = document.getElementById('searchInput').value.toLowerCase();
    const filterValue = document.getElementById('filterSelect').value; 
    let filtered = products.filter(p => p.name.toLowerCase().includes(searchQuery));
    if (filterValue.startsWith('cat-')) {
        const selectedCat = filterValue.replace('cat-', '');
        if (selectedCat !== 'Semua') filtered = filtered.filter(p => (p.category || 'Umum') === selectedCat);
    }
    const container = document.getElementById('productsContainer');
    if(!container) return;
    container.innerHTML = filtered.map(p => {
        const isOut = p.stock < 1;
        return `<div class="product-item ${isOut ? 'empty' : ''}" onclick="${isOut ? '' : `addToCart('${p.id}')`}">
            <span class="item-cat">${p.category || 'Umum'}</span>
            <div class="item-name">${p.name}</div>
            <div class="item-price">Rp ${p.price.toLocaleString('id-ID')}</div>
        </div>`;
    }).join('');
}

function addToCart(id) {
    const products = JSON.parse(localStorage.getItem('products') || '[]');
    const p = products.find(x => x.id === id);
    const existing = cart.find(x => x.id === id);
    if(existing) {
        if(existing.qty >= p.stock) return alert('Stok kurang!');
        existing.qty++; existing.total = existing.qty * existing.price;
    } else {
        cart.push({ id: p.id, name: p.name, price: p.price, cost: p.cost, qty: 1, total: p.price });
    }
    renderCart();
}

function renderCart() {
    const container = document.getElementById('cartItems');
    if(!container) return;
    container.innerHTML = cart.map((item, i) => `
        <div class="cart-item">
            <div style="flex:1;"><b style="font-size:14px;">${item.name}</b><br><small>${item.qty} x ${item.price.toLocaleString('id-ID')}</small></div>
            <div style="text-align:right;"><b style="display:block;">${item.total.toLocaleString('id-ID')}</b>
                <button class="danger" style="padding:2px 8px; font-size:10px;" onclick="cart.splice(${i}, 1); renderCart();">Hapus</button>
            </div>
        </div>
    `).join('');
    calculateTotal();
}

function calculateTotal() {
    subtotal = cart.reduce((sum, i) => sum + i.total, 0);
    let disc = parseFloat(document.getElementById('discountInput').value) || 0;
    discountNominal = (subtotal * Math.min(disc, 100)) / 100;
    grandTotal = subtotal - discountNominal;
    if(document.getElementById('payMethod').value !== 'Tunai') document.getElementById('cashInput').value = grandTotal;
    let cash = parseFloat(document.getElementById('cashInput').value) || 0;
    change = cash - grandTotal;
    document.getElementById('grandTotalDisplay').innerText = `Rp ${grandTotal.toLocaleString('id-ID')}`;
    const cd = document.getElementById('changeDisplay');
    cd.innerText = `Rp ${Math.max(0, change).toLocaleString('id-ID')}`;
    cd.style.color = (change < 0 && cash > 0) ? "red" : "#2ecc71";
}

function previewCheckout() {
    if(cart.length === 0) return alert('Pilih produk dulu!');
    if((parseFloat(document.getElementById('cashInput').value) || 0) < grandTotal) return alert('Uang bayar kurang!');
    isReprintMode = false;
    activePrintData = { id: Date.now(), user: localStorage.getItem('currentUser'), date: new Date().toLocaleString('id-ID'), items: [...cart], subtotal, discount: discountNominal, total: grandTotal, cash: parseFloat(document.getElementById('cashInput').value) || 0, change, customer: document.getElementById('custName').value.trim() || 'Pelanggan Umum', method: document.getElementById('payMethod').value };
    renderPreviewModal(activePrintData, false);
}

function reprintSale(saleId) {
    const sales = JSON.parse(localStorage.getItem('sales') || '[]');
    const sale = sales.find(s => s.id == saleId);
    if(!sale) return alert('Data tidak ditemukan');
    isReprintMode = true; activePrintData = sale;
    document.getElementById('historyModal').style.display = 'none';
    renderPreviewModal(activePrintData, true);
}

function renderPreviewModal(data, isCopy) {
    const settings = getPrinterSettings();
    const storeName = (localStorage.getItem('storeName') || 'SHANDOZ CAFE').toUpperCase();
    const storeLogo = localStorage.getItem('storeLogo');
    const paperWidth = settings.paperSize === "80" ? "380px" : "260px";
    const fontSize = settings.paperSize === "80" ? "14px" : "12px";
    let logoHtml = (storeLogo && storeLogo !== "undefined") ? `<div style="text-align:center;"><img src="${storeLogo}" style="max-width:120px; max-height:80px; margin-bottom:10px;"></div>` : '';

    let itemsHTML = data.items.map(i => `
        <tr><td colspan="2" style="font-weight:bold; padding-top:5px; word-wrap:break-word;">${i.name.toUpperCase()}</td></tr>
        <tr><td style="width:55%; padding-bottom:5px;">${i.qty} x ${i.price.toLocaleString('id-ID')}</td>
            <td style="text-align:right; width:45%; font-weight:bold;">${i.total.toLocaleString('id-ID')}</td></tr>
    `).join('');

    let contentHTML = `
        <div style="font-family:'Courier New', monospace; font-size:${fontSize}; width:${paperWidth}; margin:0 auto; color:black; text-transform:uppercase; line-height:1.2; background:white; padding:10px; border:1px solid #ddd;">
            ${logoHtml}
            <div style="text-align:center; margin-bottom:10px;"><b style="font-size:16px;">${storeName}</b><br>${isCopy ? '<small>(COPY STRUK)</small><br>' : ''}</div>
            <div style="font-size:11px;">KASIR: ${data.user}<br>CUST : ${data.customer}</div>
            <hr style="border:none; border-top:1px dashed black; margin:8px 0;">
            <table style="width:100%; font-size:inherit; border-collapse:collapse; table-layout:fixed;">${itemsHTML}</table>
            <hr style="border:none; border-top:1px dashed black; margin:8px 0;">
            <table style="width:100%; font-size:inherit; border-collapse:collapse; table-layout:fixed;">
                <tr><td>TOTAL:</td><td style="text-align:right; font-weight:bold;">${data.total.toLocaleString('id-ID')}</td></tr>
                <tr><td>BAYAR:</td><td style="text-align:right;">${data.cash.toLocaleString('id-ID')}</td></tr>
                <tr><td>KEMBALI:</td><td style="text-align:right;">${data.change.toLocaleString('id-ID')}</td></tr>
            </table>
            <hr style="border:none; border-top:1px dashed black; margin:8px 0;">
            <div style="text-align:center; font-size:10px; margin-top:10px;">${data.date}<br>SISTEM: SHANDOZ SYSTEMS LTD.<br><br>*** TERIMAKASIH ***</div>
        </div>
    `;
    document.getElementById('receiptPreviewContent').innerHTML = contentHTML;
    document.getElementById('previewModal').style.display = 'flex';
    if(settings.autoPrint && !isCopy && !isReprintMode) confirmAndPrint();
}

function confirmAndPrint() {
    if(!activePrintData) return;
    if (!isReprintMode) {
        const products = JSON.parse(localStorage.getItem('products') || '[]');
        activePrintData.items.forEach(cItem => { const p = products.find(x => x.id === cItem.id); if(p) p.stock -= cItem.qty; });
        localStorage.setItem('products', JSON.stringify(products));
        const sales = JSON.parse(localStorage.getItem('sales') || '[]');
        sales.push(activePrintData); localStorage.setItem('sales', JSON.stringify(sales));
    }
    const printHTML = document.getElementById('receiptPreviewContent').innerHTML;
    window.location.href = "rawbt:data:text/html;base64," + btoa(unescape(encodeURIComponent(printHTML)));
    setTimeout(() => { 
        if(!isReprintMode) { cart = []; document.getElementById('cashInput').value = ''; document.getElementById('custName').value = ''; }
        closePreview(); initPOS(); renderCart();
    }, 1200);
}

function showPosHistory() {
    const sales = JSON.parse(localStorage.getItem('sales') || '[]');
    const recentSales = sales.slice(-20).reverse();
    const tbody = document.getElementById('posHistoryList');
    if(!tbody) return;
    tbody.innerHTML = recentSales.length === 0 ? '<tr><td colspan="4" style="text-align:center; padding:20px;">Belum ada data</td></tr>' : 
        recentSales.map(s => `<tr><td style="padding:10px;">${s.date.split(', ')[1]}</td><td>${s.customer}</td><td style="font-weight:bold;">${s.total.toLocaleString('id-ID')}</td>
        <td><button class="primary" onclick="reprintSale('${s.id}')">🖨️</button></td></tr>`).join('');
    document.getElementById('historyModal').style.display = 'flex';
}

function closePreview() { document.getElementById('previewModal').style.display = 'none'; activePrintData = null; }
function closePosHistory() { document.getElementById('historyModal').style.display = 'none'; }
document.addEventListener('DOMContentLoaded', initPOS);
