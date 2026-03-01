function loadProducts() {
    const products = JSON.parse(localStorage.getItem('products') || '[]');
    const tbody = document.getElementById('productList');
    tbody.innerHTML = products.map((p, i) => `
        <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 12px; color: #475569;">${i+1}</td>
            <td style="font-family:monospace; color:#3b82f6; font-weight:bold;">${p.barcode || '-'}</td>
            <td><span style="background:#f1f5f9; color:#475569; padding:4px 8px; border-radius:6px; font-size:11px; font-weight:600;">${p.category || 'Umum'}</span></td>
            <td><strong style="color:#0f172a; font-size:14px;">${p.name}</strong></td>
            <td style="color:#64748b;">Rp ${p.cost.toLocaleString('id-ID')}</td>
            <td style="color:#10b981; font-weight:bold;">Rp ${p.price.toLocaleString('id-ID')}</td>
            <td><span style="background:${p.stock > 5 ? '#dcfce7' : '#fee2e2'}; color:${p.stock > 5 ? '#15803d' : '#b91c1c'}; padding:4px 10px; border-radius:10px; font-weight:bold; font-size:12px;">${p.stock}</span></td>
            <td style="display:flex; gap:5px; padding-top:10px;">
                <button class="bg-warning" style="padding: 6px 10px; font-size: 11px; border-radius:6px; color:white; border:none;" onclick="addStock(${i})">+ Stok</button>
                <button class="bg-danger" style="padding: 6px 10px; font-size: 11px; border-radius:6px; color:white; border:none;" onclick="deleteProduct(${i})">Hapus</button>
            </td>
        </tr>
    `).join('');
}

function addProduct() {
    const name = document.getElementById('prodName').value;
    const cat = document.getElementById('prodCategory').value || 'Umum';
    const barcode = document.getElementById('prodBarcode').value;
    const cost = parseFloat(document.getElementById('prodCost').value) || 0;
    const price = parseFloat(document.getElementById('prodPrice').value) || 0;
    const stock = parseInt(document.getElementById('prodStock').value) || 0;

    if(!name || price <= 0) return alert('Nama dan Harga Jual wajib diisi!');

    const products = JSON.parse(localStorage.getItem('products') || '[]');
    products.push({ id: 'prod_'+Date.now(), name, category: cat, barcode, cost, price, stock });
    localStorage.setItem('products', JSON.stringify(products));

    document.getElementById('prodName').value = ''; 
    document.getElementById('prodCategory').value = ''; 
    document.getElementById('prodBarcode').value = ''; 
    document.getElementById('prodCost').value = ''; 
    document.getElementById('prodPrice').value = ''; 
    document.getElementById('prodStock').value = '';
    
    loadProducts();
    alert("Produk berhasil ditambahkan!");
}

function addStock(index) {
    const products = JSON.parse(localStorage.getItem('products') || '[]');
    const tambah = parseInt(prompt(`Tambah stok untuk [${products[index].name}] sebanyak:`));
    if(tambah && !isNaN(tambah)) { 
        products[index].stock += tambah; 
        localStorage.setItem('products', JSON.stringify(products)); 
        loadProducts(); 
    }
}

function deleteProduct(index) {
    const products = JSON.parse(localStorage.getItem('products') || '[]');
    if(confirm(`Yakin ingin menghapus produk [${products[index].name}]?`)) {
        products.splice(index, 1); 
        localStorage.setItem('products', JSON.stringify(products)); 
        loadProducts();
    }
}

// === LOGIKA KAMERA SCANNER ===
let html5QrcodeScanner = null;

function openScanner() {
    document.getElementById('scannerModal').style.display = 'flex';
    html5QrcodeScanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: {width: 250, height: 250} }, false);
    html5QrcodeScanner.render((decodedText) => {
        document.getElementById('prodBarcode').value = decodedText;
        closeScanner();
    }, (error) => { /* abaikan error pencarian */ });
}

function closeScanner() {
    if(html5QrcodeScanner) { html5QrcodeScanner.clear(); }
    document.getElementById('scannerModal').style.display = 'none';
}

if(document.getElementById('productList')) { document.addEventListener('DOMContentLoaded', loadProducts); }
