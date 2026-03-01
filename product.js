function loadProducts() {
    const products = JSON.parse(localStorage.getItem('products') || '[]');
    const tbody = document.getElementById('productList');
    tbody.innerHTML = products.map((p, i) => `
        <tr>
            <td>${i+1}</td>
            <td style="font-family:monospace; color:#2980b9; font-weight:bold;">${p.barcode || '-'}</td>
            <td><span style="background:#e2e8f0; padding:4px 8px; border-radius:5px; font-size:0.85rem;">${p.category || 'Umum'}</span></td>
            <td><strong>${p.name}</strong></td>
            <td>Rp ${p.cost.toLocaleString('id-ID')}</td>
            <td>Rp ${p.price.toLocaleString('id-ID')}</td>
            <td><span style="background:${p.stock > 5 ? '#e8f8f5' : '#fdedec'}; color:${p.stock > 5 ? '#27ae60' : '#e74c3c'}; padding:6px 12px; border-radius:20px; font-weight:bold;">${p.stock}</span></td>
            <td>
                <button class="warning" style="padding: 6px 10px; font-size: 0.8rem;" onclick="addStock(${i})">+ Stok</button>
                <button class="danger" style="padding: 6px 10px; font-size: 0.8rem;" onclick="deleteProduct(${i})">Hapus</button>
            </td>
        </tr>
    `).join('');
}

function addProduct() {
    const name = document.getElementById('prodName').value.trim();
    const category = document.getElementById('prodCategory').value.trim() || 'Umum';
    const barcode = document.getElementById('prodBarcode').value.trim();
    const cost = parseFloat(document.getElementById('prodCost').value);
    const price = parseFloat(document.getElementById('prodPrice').value);
    const stock = parseInt(document.getElementById('prodStock').value);
    
    if(!name || isNaN(cost) || isNaN(price) || isNaN(stock)) return alert('Isi data dengan benar!');
    
    const products = JSON.parse(localStorage.getItem('products') || '[]');
    // Cek barcode ganda (kalau ada isinya)
    if(barcode && products.find(p => p.barcode === barcode)) return alert('Barcode ini sudah dipakai produk lain!');

    products.push({ id: Date.now().toString(), barcode, name, category, cost, price, stock });
    localStorage.setItem('products', JSON.stringify(products));
    
    document.getElementById('prodName').value = ''; document.getElementById('prodCategory').value = ''; document.getElementById('prodBarcode').value = '';
    document.getElementById('prodCost').value = ''; document.getElementById('prodPrice').value = ''; document.getElementById('prodStock').value = '';
    loadProducts();
}

function addStock(index) {
    const products = JSON.parse(localStorage.getItem('products') || '[]');
    const tambah = parseInt(prompt(`Tambah stok untuk ${products[index].name} sebanyak:`));
    if(tambah && !isNaN(tambah)) { products[index].stock += tambah; localStorage.setItem('products', JSON.stringify(products)); loadProducts(); }
}

function deleteProduct(index) {
    if(confirm('Hapus produk ini?')) {
        const products = JSON.parse(localStorage.getItem('products') || '[]');
        products.splice(index, 1); localStorage.setItem('products', JSON.stringify(products)); loadProducts();
    }
}

// === LOGIKA KAMERA SCANNER ===
let html5QrcodeScanner = null;

function openScanner() {
    document.getElementById('scannerModal').style.display = 'flex';
    html5QrcodeScanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: {width: 250, height: 250} }, false);
    html5QrcodeScanner.render((decodedText) => {
        // Jika sukses scan
        document.getElementById('prodBarcode').value = decodedText;
        closeScanner();
    }, (error) => { /* abaikan error pencarian */ });
}

function closeScanner() {
    if(html5QrcodeScanner) { html5QrcodeScanner.clear(); }
    document.getElementById('scannerModal').style.display = 'none';
}

if(document.getElementById('productList')) { document.addEventListener('DOMContentLoaded', loadProducts); }
