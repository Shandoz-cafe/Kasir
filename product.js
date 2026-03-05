// Fungsi untuk memuat dropdown kategori secara otomatis (Urut A-Z)
function updateCategoryDropdown(products, currentLang) {
    const dropdown = document.getElementById('filterCatDropdown');
    const selectedValue = dropdown.value; // Simpan pilihan saat ini
    
    // Ambil semua kategori unik, abaikan huruf besar/kecil, lalu urutkan A-Z
    let categories = [...new Set(products.map(p => p.category ? p.category.trim() : (currentLang === 'en' ? 'General' : 'Umum')))];
    categories.sort((a, b) => a.localeCompare(b));
    
    const allText = currentLang === 'en' ? 'All Categories' : 'Semua Kategori';
    let optionsHtml = `<option value="ALL" data-i18n="inv_filter_all">${allText}</option>`;
    
    categories.forEach(c => {
        optionsHtml += `<option value="${c}">${c}</option>`;
    });
    
    dropdown.innerHTML = optionsHtml;
    // Kembalikan pilihan sebelumnya jika masih ada di daftar
    if(categories.includes(selectedValue) || selectedValue === 'ALL') {
        dropdown.value = selectedValue;
    }
}

function loadProducts() {
    const products = JSON.parse(localStorage.getItem('products') || '[]');
    const role = localStorage.getItem('currentRole') || 'cashier'; 
    const lang = localStorage.getItem('appLang') || 'id';
    
    // Update isi Dropdown Kategori
    updateCategoryDropdown(products, lang);
    
    // Ambil nilai dari kolom pencarian dan filter
    const searchQuery = (document.getElementById('searchItemInput')?.value || '').toLowerCase();
    const filterCat = document.getElementById('filterCatDropdown')?.value || 'ALL';
    
    // PROSES 1: FILTERING (Pencarian & Kategori)
    let filteredProducts = products.filter(p => {
        const matchName = p.name.toLowerCase().includes(searchQuery);
        const cat = p.category ? p.category.trim() : (lang === 'en' ? 'General' : 'Umum');
        const matchCat = (filterCat === 'ALL') || (cat === filterCat);
        return matchName && matchCat;
    });
    
    // PROSES 2: SORTING A-Z BERDASARKAN NAMA ITEM
    filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
    
    const btnStock = lang === 'en' ? '+ Stock' : '+ Stok';
    const btnDel = lang === 'en' ? 'Delete' : 'Hapus';
    const tbody = document.getElementById('productList');
    
    // Jika data kosong setelah difilter
    if(filteredProducts.length === 0) {
        let emptyMsg = lang === 'en' ? 'No items found.' : 'Item tidak ditemukan.';
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding: 20px; color: #94a3b8; font-style: italic;">${emptyMsg}</td></tr>`;
        return;
    }

    tbody.innerHTML = filteredProducts.map((p, i) => `
        <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 12px; color: #475569;">${i+1}</td>
            <td style="font-family:monospace; color:#3b82f6; font-weight:bold;">${p.barcode || '-'}</td>
            <td><span style="background:#f1f5f9; color:#475569; padding:4px 8px; border-radius:6px; font-size:11px; font-weight:600;">${p.category || (lang==='en'?'General':'Umum')}</span></td>
            <td><strong style="color:#0f172a; font-size:14px;">${p.name}</strong></td>
            <td style="color:#64748b;">Rp ${p.cost.toLocaleString('id-ID')}</td>
            <td style="color:#10b981; font-weight:bold;">Rp ${p.price.toLocaleString('id-ID')}</td>
            <td><span style="background:${p.stock > 5 ? '#dcfce7' : '#fee2e2'}; color:${p.stock > 5 ? '#15803d' : '#b91c1c'}; padding:4px 10px; border-radius:10px; font-weight:bold; font-size:12px;">${p.stock}</span></td>
            <td style="display:flex; gap:5px; padding-top:10px;">
                <button class="bg-warning" style="padding: 6px 10px; font-size: 11px; border-radius:6px; color:white; border:none;" onclick="addStock('${p.id}')">${btnStock}</button>
                
                ${role === 'admin' ? `<button class="bg-danger" style="padding: 6px 10px; font-size: 11px; border-radius:6px; color:white; border:none;" onclick="deleteProduct('${p.id}')">${btnDel}</button>` : ''}
            </td>
        </tr>
    `).join('');
}

function addProduct() {
    const lang = localStorage.getItem('appLang') || 'id';
    const name = document.getElementById('prodName').value.trim();
    const category = document.getElementById('prodCategory').value.trim() || (lang==='en'?'General':'Umum');
    const barcode = document.getElementById('prodBarcode').value.trim();
    const cost = parseFloat(document.getElementById('prodCost').value);
    const price = parseFloat(document.getElementById('prodPrice').value);
    const stock = parseInt(document.getElementById('prodStock').value);
    
    if(!name || isNaN(cost) || isNaN(price) || isNaN(stock)) {
        let msg = lang === 'en' 
            ? 'Please ensure Name, Cost, Selling Price, and Stock are filled with numbers!' 
            : 'Pastikan Nama, Modal, Harga Jual, dan Stok sudah terisi semua dengan angka!';
        let title = lang === 'en' ? 'Incomplete Data' : 'Data Belum Lengkap';
        return customAlert(msg, title, '❌');
    }
    
    const products = JSON.parse(localStorage.getItem('products') || '[]');
    
    if(barcode && products.find(p => p.barcode === barcode)) {
        let msg = lang === 'en' ? 'This barcode is already in use for another product.' : 'Kode Barcode ini sudah dipakai untuk barang lain. Silakan gunakan kode lain.';
        let title = lang === 'en' ? 'Duplicate Barcode' : 'Barcode Ganda';
        return customAlert(msg, title, '⚠️');
    }

    products.push({ id: Date.now().toString(), barcode, name, category, cost, price, stock });
    localStorage.setItem('products', JSON.stringify(products));
    
    document.getElementById('prodName').value = ''; 
    document.getElementById('prodCategory').value = ''; 
    document.getElementById('prodBarcode').value = '';
    document.getElementById('prodCost').value = ''; 
    document.getElementById('prodPrice').value = ''; 
    document.getElementById('prodStock').value = '';
    
    loadProducts();
    let msgSuccess = lang === 'en' ? `Product <b>${name}</b> successfully added!` : `Barang <b>${name}</b> sukses ditambahkan ke gudang!`;
    let titleSuccess = lang === 'en' ? 'Saved Successfully' : 'Berhasil Disimpan';
    customAlert(msgSuccess, titleSuccess, "✅");
}

// PERUBAHAN PENTING: Menerima ID item, bukan Index. Supaya akurat saat disortir.
function addStock(id) {
    const lang = localStorage.getItem('appLang') || 'id';
    const products = JSON.parse(localStorage.getItem('products') || '[]');
    
    // Cari index asli dari ID
    const index = products.findIndex(p => String(p.id) === String(id));
    if(index === -1) return;

    let promptMsg = lang === 'en' 
        ? `Enter the amount of stock to add for:<br><br><b style="font-size:16px; color:#3b82f6;">${products[index].name}</b>`
        : `Masukkan jumlah stok yang ingin ditambahkan untuk:<br><br><b style="font-size:16px; color:#3b82f6;">${products[index].name}</b>`;
    let promptTitle = lang === 'en' ? 'Add Stock' : 'Tambah Stok Barang';
    
    customPrompt(promptMsg, (val) => {
        const tambah = parseInt(val);
        if(tambah && !isNaN(tambah)) { 
            products[index].stock += tambah; 
            localStorage.setItem('products', JSON.stringify(products)); 
            loadProducts(); 
            let successMsg = lang === 'en' ? `Stock successfully increased by <b>${tambah}</b>.` : `Stok berhasil ditambah sebanyak <b>${tambah}</b>.`;
            let successTitle = lang === 'en' ? 'Stock Updated' : 'Stok Diperbarui';
            customAlert(successMsg, successTitle, "📦");
        } else {
            let failMsg = lang === 'en' ? 'Invalid number entered or action cancelled.' : 'Angka yang dimasukkan tidak valid atau dibatalkan.';
            let failTitle = lang === 'en' ? 'Failed to Add Stock' : 'Gagal Menambah Stok';
            customAlert(failMsg, failTitle, "❌");
        }
    }, promptTitle, "➕", "number");
}

// PERUBAHAN PENTING: Menerima ID item, bukan Index.
function deleteProduct(id) {
    const lang = localStorage.getItem('appLang') || 'id';
    
    if(localStorage.getItem('currentRole') !== 'admin') {
        let msg = lang === 'en' ? 'Access Denied! Delete feature is only for Owner.' : 'Akses Ditolak! Fitur hapus barang khusus untuk Owner.';
        let title = lang === 'en' ? 'Restricted Access' : 'Akses Terbatas';
        return customAlert(msg, title, "⛔");
    }
    
    const products = JSON.parse(localStorage.getItem('products') || '[]');
    
    // Cari index asli dari ID
    const index = products.findIndex(p => String(p.id) === String(id));
    if(index === -1) return;
    
    let confirmMsg = lang === 'en' 
        ? `Are you sure you want to permanently delete <b>${products[index].name}</b> from the menu?` 
        : `Yakin ingin menghapus produk <b>${products[index].name}</b> secara permanen dari menu?`;
    let confirmTitle = lang === 'en' ? 'Delete Product' : 'Hapus Produk';

    customConfirm(confirmMsg, () => {
        products.splice(index, 1); 
        localStorage.setItem('products', JSON.stringify(products)); 
        loadProducts();
        let successMsg = lang === 'en' ? 'Item successfully deleted from the system.' : 'Barang telah berhasil dihapus dari sistem.';
        let successTitle = lang === 'en' ? 'Deleted' : 'Terhapus';
        customAlert(successMsg, successTitle, "🗑️");
    }, confirmTitle, "⚠️");
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
