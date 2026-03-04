function loadProducts() {
    const products = JSON.parse(localStorage.getItem('products') || '[]');
    const role = localStorage.getItem('currentRole') || 'cashier'; // Deteksi Jabatan
    
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
                
                ${role === 'admin' ? `<button class="bg-danger" style="padding: 6px 10px; font-size: 11px; border-radius:6px; color:white; border:none;" onclick="deleteProduct(${i})">Hapus</button>` : ''}
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
    
    // NOTIFIKASI PINTAR: Ngasih tahu Bos bagian mana yang kurang pake Custom Alert
    if(!name || isNaN(cost) || isNaN(price) || isNaN(stock)) {
        return customAlert('Pastikan Nama, Modal, Harga Jual, dan Stok sudah terisi semua dengan angka!', 'Data Belum Lengkap', '❌');
    }
    
    const products = JSON.parse(localStorage.getItem('products') || '[]');
    
    // CEK BARCODE DOBEL
    if(barcode && products.find(p => p.barcode === barcode)) {
        return customAlert('Kode Barcode ini sudah dipakai untuk barang lain. Silakan gunakan kode lain.', 'Barcode Ganda', '⚠️');
    }

    products.push({ id: Date.now().toString(), barcode, name, category, cost, price, stock });
    localStorage.setItem('products', JSON.stringify(products));
    
    // BERSIHKAN FORM OTOMATIS SETELAH DISIMPAN
    document.getElementById('prodName').value = ''; 
    document.getElementById('prodCategory').value = ''; 
    document.getElementById('prodBarcode').value = '';
    document.getElementById('prodCost').value = ''; 
    document.getElementById('prodPrice').value = ''; 
    document.getElementById('prodStock').value = '';
    
    loadProducts();
    customAlert(`Barang <b>${name}</b> sukses ditambahkan ke gudang!`, "Berhasil Disimpan", "✅");
}

function addStock(index) {
    const products = JSON.parse(localStorage.getItem('products') || '[]');
    
    // MENGGUNAKAN CUSTOM PROMPT MODERN
    customPrompt(`Masukkan jumlah stok yang ingin ditambahkan untuk:<br><br><b style="font-size:16px; color:#3b82f6;">${products[index].name}</b>`, (val) => {
        const tambah = parseInt(val);
        if(tambah && !isNaN(tambah)) { 
            products[index].stock += tambah; 
            localStorage.setItem('products', JSON.stringify(products)); 
            loadProducts(); 
            customAlert(`Stok berhasil ditambah sebanyak <b>${tambah}</b>.`, "Stok Diperbarui", "📦");
        } else {
            customAlert("Angka yang dimasukkan tidak valid atau dibatalkan.", "Gagal Menambah Stok", "❌");
        }
    }, "Tambah Stok Barang", "➕", "number");
}

function deleteProduct(index) {
    // PENGAMAN GANDA ANTI-KASIR
    if(localStorage.getItem('currentRole') !== 'admin') {
        return customAlert("Akses Ditolak! Fitur hapus barang khusus untuk Owner.", "Akses Terbatas", "⛔");
    }
    
    const products = JSON.parse(localStorage.getItem('products') || '[]');
    
    // MENGGUNAKAN CUSTOM CONFIRM MODERN
    customConfirm(`Yakin ingin menghapus produk <b>${products[index].name}</b> secara permanen dari menu?`, () => {
        products.splice(index, 1); 
        localStorage.setItem('products', JSON.stringify(products)); 
        loadProducts();
        customAlert("Barang telah berhasil dihapus dari sistem.", "Terhapus", "🗑️");
    }, "Hapus Produk", "⚠️");
}

// === LOGIKA KAMERA SCANNER BARCODE ===
let html5QrcodeScanner = null;

function openScanner() {
    document.getElementById('scannerModal').style.display = 'flex';
    html5QrcodeScanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: {width: 250, height: 250} }, false);
    html5QrcodeScanner.render((decodedText) => {
        document.getElementById('prodBarcode').value = decodedText;
        closeScanner();
    }, (error) => {});
}

function closeScanner() {
    if(html5QrcodeScanner) { html5QrcodeScanner.clear(); }
    document.getElementById('scannerModal').style.display = 'none';
}

if(document.getElementById('productList')) { 
    document.addEventListener('DOMContentLoaded', loadProducts); 
}
