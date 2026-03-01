let cart = [];
let grandTotal = 0, change = 0;
let activePrintData = null; 
let isReprintMode = false;  

const getPrinterSettings = () => JSON.parse(localStorage.getItem('printerSettings') || '{"paperSize":"58", "autoPrint":true}');

function initPOS() {
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
            <span style="font-size:11px; color:#888;">${p.category || 'Umum'}</span>
            <div style="font-weight:bold; margin-top:5px;">${p.name}</div>
            <div style="color:#10b981; font-weight:bold; margin-top:auto;">Rp ${p.price.toLocaleString('id-ID')}</div>
        </div>`;
    }).join('');
}

function addToCart(id) {
    const products = JSON.parse(localStorage.getItem('products') || '[]');
    const p = products.find(x => x.id === id);
    const existing = cart.find(x => x.id === id);
    if(existing) {
        if(existing.qty >= p.stock) return alert('Stok Habis!');
        existing.qty++; existing.total = existing.qty * existing.price;
    } else {
        cart.push({ id: p.id, name: p.name, price: p.price, qty: 1, total: p.price });
    }
    renderCart();
}

function renderCart() {
    const container = document.getElementById('cartItems');
    container.innerHTML = cart.map((item, i) => `
        <div class="cart-item">
            <div style="flex:1;"><b>${item.name}</b><br><small style="color:#666;">${item.qty} x ${item.price.toLocaleString('id-ID')}</small></div>
            <div style="text-align:right;"><b>${item.total.toLocaleString('id-ID')}</b><br>
            <button class="bg-danger" style="padding:4px 8px; font-size:10px; margin-top:5px; border-radius:4px; color:white; border:none;" onclick="cart.splice(${i}, 1); renderCart();">X Hapus</button></div>
        </div>
    `).join('');
    calculateTotal();
}

function calculateTotal() {
    grandTotal = cart.reduce((sum, i) => sum + i.total, 0);
    if(document.getElementById('payMethod').value !== 'Tunai') document.getElementById('cashInput').value = grandTotal;
    let cash = parseFloat(document.getElementById('cashInput').value) || 0;
    change = cash - grandTotal;
    document.getElementById('grandTotalDisplay').innerText = `Rp ${grandTotal.toLocaleString('id-ID')}`;
    const cd = document.getElementById('changeDisplay');
    cd.innerText = `Rp ${Math.max(0, change).toLocaleString('id-ID')}`;
    cd.style.color = (change < 0 && cash > 0) ? "red" : "#10b981";
}

function previewCheckout() {
    if(cart.length === 0) return alert('Keranjang Kosong!');
    let cash = parseFloat(document.getElementById('cashInput').value) || 0;
    if(cash < grandTotal) return alert('Uang Pembayaran Kurang!');

    isReprintMode = false;
    activePrintData = { id: Date.now(), user: localStorage.getItem('currentUser') || 'Admin', date: new Date().toLocaleString('id-ID'), items: [...cart], total: grandTotal, cash, change, customer: document.getElementById('custName').value.trim() || 'Umum', method: document.getElementById('payMethod').value };
    renderPreviewModal(activePrintData, false);
}

function reprintSale(saleId) {
    const sales = JSON.parse(localStorage.getItem('sales') || '[]');
    const sale = sales.find(s => String(s.id) === String(saleId));
    if(!sale) return alert('Data tidak ditemukan');
    isReprintMode = true; activePrintData = sale;
    document.getElementById('historyModal').style.display = 'none';
    renderPreviewModal(activePrintData, true);
}

function renderPreviewModal(data, isCopy) {
    const settings = getPrinterSettings();
    const storeName = (localStorage.getItem('storeName') || 'SHANDOZ CAFE').toUpperCase();
    const storeLogo = localStorage.getItem('storeLogo');
    
    const maxWidth = settings.paperSize === "80" ? "380px" : "280px";
    let logoHtml = (storeLogo && storeLogo !== "") ? `<div style="text-align:center; margin-bottom:10px;"><img src="${storeLogo}" style="max-width:140px; max-height:80px; object-fit:contain;"></div>` : '';

    let itemsHTML = data.items.map(i => `
        <tr><td colspan="2" style="font-weight:bold; padding-top:4px;">${i.name.toUpperCase()}</td></tr>
        <tr><td style="width:60%; padding-bottom:4px;">${i.qty} x ${i.price.toLocaleString('id-ID')}</td><td style="text-align:right; width:40%; font-weight:bold;">${i.total.toLocaleString('id-ID')}</td></tr>
    `).join('');

    let contentHTML = `
        <div id="printArea" style="font-family:monospace; font-size:12px; width:${maxWidth}; margin:0 auto; color:black; background:white; padding:15px; box-sizing:border-box;">
            ${logoHtml}
            <div style="text-align:center; margin-bottom:10px; line-height:1.2;">
                <strong style="font-size:16px;">${storeName}</strong><br>
                ${isCopy ? '(COPY STRUK)<br>' : ''}
            </div>
            
            <div style="text-align:left; margin-bottom:5px;">
                KASIR : ${data.user}<br>CUST  : ${data.customer}
            </div>

            <hr style="border-top:1px dashed black; margin:5px 0;">
            <table style="width:100%; border-collapse:collapse; table-layout:fixed; font-size:inherit;">${itemsHTML}</table>
            <hr style="border-top:1px dashed black; margin:5px 0;">
            
            <table style="width:100%; border-collapse:collapse; table-layout:fixed; font-size:inherit;">
                <tr><td style="width:60%;">TOTAL:</td><td style="text-align:right; font-weight:bold; width:40%;">${data.total.toLocaleString('id-ID')}</td></tr>
                <tr><td>BAYAR (${data.method}):</td><td style="text-align:right;">${data.cash.toLocaleString('id-ID')}</td></tr>
                <tr><td>KEMBALI:</td><td style="text-align:right;">${data.change.toLocaleString('id-ID')}</td></tr>
            </table>
            
            <hr style="border-top:1px dashed black; margin:5px 0;">
            <div style="text-align:center; margin-top:10px;">
                Total Items: ${data.items.length}<br>${data.date}<br><br>
                ** TERIMAKASIH **<br>
                <span style="font-size:9px; color:#555; display:block; margin-top:10px;">SHANDOZ SYSTEMS LTD. | CERTIFIED CLOUD POS</span>
            </div>
        </div>
    `;
    
    document.getElementById('receiptPreviewContent').innerHTML = contentHTML;
    document.getElementById('previewModal').style.display = 'flex';
    
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
    
    const printHTML = document.getElementById('receiptPreviewContent').innerHTML;
    window.location.href = "rawbt:data:text/html;base64," + btoa(unescape(encodeURIComponent(printHTML)));

    setTimeout(() => { 
        if(!isReprintMode) { cart = []; document.getElementById('cashInput').value = ''; document.getElementById('custName').value = ''; }
        closePreview(); initPOS(); renderCart();
    }, 1500);
}

function showPosHistory() {
    const sales = JSON.parse(localStorage.getItem('sales') || '[]');
    const recentSales = sales.slice(-20).reverse();
    const tbody = document.getElementById('posHistoryList');
    if(!tbody) return;
    
    if(recentSales.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding:20px;">Belum ada transaksi</td></tr>';
    } else {
        tbody.innerHTML = recentSales.map(s => `
            <tr>
                <td style="padding:15px; border-bottom:1px solid #e2e8f0;">
                    <b>${s.date.split(', ')[1]}</b><br><small style="color:#666;">${s.customer}</small>
                </td>
                <td style="padding:15px; border-bottom:1px solid #e2e8f0; text-align:right; font-weight:bold; color:#10b981;">
                    ${s.total.toLocaleString('id-ID')}
                </td>
                <td style="padding:15px; border-bottom:1px solid #e2e8f0; text-align:center;">
                    <button class="bg-primary" style="padding:8px 15px; color:white; border:none; border-radius:8px;" onclick="reprintSale('${s.id}')">🖨️ Cetak</button>
                </td>
            </tr>
        `).join('');
    }
    document.getElementById('historyModal').style.display = 'flex';
}

function closePreview() { document.getElementById('previewModal').style.display = 'none'; activePrintData = null; }
function closePosHistory() { document.getElementById('historyModal').style.display = 'none'; }

document.addEventListener('DOMContentLoaded', initPOS);
