let cart = [];
let subtotal = 0, grandTotal = 0, change = 0, totalProfit = 0, discountNominal = 0;
let activePrintData = null; 
let isReprintMode = false;  

// AMBIL PENGATURAN PRINTER (Default 58mm jika belum diatur)
const getPrinterSettings = () => JSON.parse(localStorage.getItem('printerSettings') || '{"paperSize":"58", "autoPrint":false}');

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
            <div><span class="cart-item-name">${item.name}</span><span class="cart-item-qty">${item.qty} x ${item.price.toLocaleString('id-ID')}</span></div>
            <div style="display:flex; align-items:center; gap:10px;"><span class="cart-item-price">${item.total.toLocaleString('id-ID')}</span><button class="danger" style="padding:4px 8px;" onclick="cart.splice(${i}, 1); renderCart();">X</button></div>
        </div>
    `).join('');
    calculateTotal();
}

function calculateTotal() {
    subtotal = cart.reduce((sum, i) => sum + i.total, 0);
    totalProfit = cart.reduce((sum, i) => sum + i.profit, 0);
    let disc = parseFloat(document.getElementById('discountInput').value) || 0;
    discountNominal = (subtotal * Math.min(disc, 100)) / 100;
    grandTotal = subtotal - discountNominal;
    if(document.getElementById('payMethod').value !== 'Tunai') document.getElementById('cashInput').value = grandTotal;
    let cash = parseFloat(document.getElementById('cashInput').value) || 0;
    change = cash - grandTotal;
    document.getElementById('grandTotalDisplay').innerText = `Rp ${grandTotal.toLocaleString('id-ID')}`;
    const cd = document.getElementById('changeDisplay');
    cd.innerText = `Rp ${Math.max(0, change).toLocaleString('id-ID')}`;
    cd.style.color = (change < 0 && cash > 0) ? "red" : "black";
}

function previewCheckout() {
    if(cart.length === 0) return alert('Keranjang kosong!');
    if((parseFloat(document.getElementById('cashInput').value) || 0) < grandTotal) return alert('Uang kurang!');
    isReprintMode = false;
    activePrintData = { id: Date.now(), user: localStorage.getItem('currentUser'), date: new Date().toLocaleString('id-ID'), items: [...cart], subtotal, discount: discountNominal, total: grandTotal, cash: parseFloat(document.getElementById('cashInput').value) || 0, change, customer: document.getElementById('custName').value.trim() || 'Umum', method: document.getElementById('payMethod').value };
    renderPreviewModal(activePrintData, false);
}

// === MESIN STRUK DENGAN PENGATURAN UKURAN (58mm / 80mm) ===
function renderPreviewModal(data, isCopy) {
    const settings = getPrinterSettings();
    const storeName = (localStorage.getItem('storeName') || 'SHANDOZ CAFE').toUpperCase();
    const storeLogo = localStorage.getItem('storeLogo');
    
    // ATUR LEBAR BERDASARKAN SETTING (PENTING!)
    const paperWidth = settings.paperSize === "80" ? "380px" : "260px";
    const fontSize = settings.paperSize === "80" ? "14px" : "11px";

    let logoHtml = (storeLogo && storeLogo !== "undefined") ? `<center><img src="${storeLogo}" style="max-width: 100px; margin-bottom: 5px;"></center>` : '';

    let itemsHTML = data.items.map(i => `
        <tr><td colspan="2" style="font-weight:bold; padding-top:4px;">${i.name.toUpperCase()}</td></tr>
        <tr><td style="width:60%;">${i.qty}X ${i.price.toLocaleString('id-ID')}</td><td style="text-align:right; width:40%;">${i.total.toLocaleString('id-ID')}</td></tr>
    `).join('');

    let contentHTML = `
        <div style="font-family:monospace; font-size:${fontSize}; width:${paperWidth}; margin:0 auto; color:black; text-transform:uppercase; line-height:1.2; background:white; padding:5px; border:1px solid #eee;">
            ${logoHtml}
            <center><b>${storeName}</b><br>${isCopy ? '(COPY STRUK)<br>' : ''}</center>
            KASIR: ${data.user}<br>PELANGGAN: ${data.customer}
            <hr style="border:none; border-top:1px dashed black; margin:5px 0;">
            <table style="width:100%; font-size:inherit; border-collapse:collapse; table-layout:fixed;">${itemsHTML}</table>
            <hr style="border:none; border-top:1px dashed black; margin:5px 0;">
            <table style="width:100%; font-size:inherit; border-collapse:collapse; table-layout:fixed;">
                <tr><td>TOTAL:</td><td style="text-align:right;"><b>${data.total.toLocaleString('id-ID')}</b></td></tr>
                <tr><td>BAYAR:</td><td style="text-align:right;">${data.cash.toLocaleString('id-ID')}</td></tr>
                <tr><td>KEMBALI:</td><td style="text-align:right;">${data.change.toLocaleString('id-ID')}</td></tr>
            </table>
            <hr style="border:none; border-top:1px dashed black; margin:5px 0;">
            <center>SOLD ${data.items.length} ITEMS, QTY ${data.items.reduce((s,i)=>s+i.qty,0)}<br>${data.date}<br><br>** TERIMAKASIH **</center>
        </div>
    `;
    document.getElementById('receiptPreviewContent').innerHTML = contentHTML;
    document.getElementById('previewModal').style.display = 'flex';
    
    // JIKA AUTO-PRINT AKTIF, LANGSUNG TEMBAK KE PRINTER
    if(settings.autoPrint && !isCopy && !isReprintMode) { confirmAndPrint(); }
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
    // KIRIM HTML PREVIEW KE RAWBT (HASIL CETAK AKAN SAMA DENGAN PREVIEW)
    const printContent = document.getElementById('receiptPreviewContent').innerHTML;
    window.location.href = "rawbt:data:text/html;base64," + btoa(unescape(encodeURIComponent(printContent)));

    setTimeout(() => { if(!isReprintMode) { cart = []; document.getElementById('cashInput').value = ''; document.getElementById('custName').value = ''; } closePreview(); initPOS(); renderCart(); }, 1000);
}

function closePreview() { document.getElementById('previewModal').style.display = 'none'; activePrintData = null; }
if(document.getElementById('productsContainer')) { document.addEventListener('DOMContentLoaded', initPOS); }
