function loadProducts() {
    const products = JSON.parse(localStorage.getItem('products') || '[]');
    const tbody = document.getElementById('productList');
    tbody.innerHTML = products.map((p, i) => {
        const margin = p.price - p.cost;
        return `<tr>
            <td>${i+1}</td>
            <td><strong>${p.name}</strong></td>
            <td>Rp ${p.cost.toLocaleString('id-ID')}</td>
            <td>Rp ${p.price.toLocaleString('id-ID')}</td>
            <td style="color: #27ae60; font-weight:bold;">Rp ${margin.toLocaleString('id-ID')}</td>
            <td><span style="background:${p.stock > 5 ? '#e8f8f5' : '#fdedec'}; color:${p.stock > 5 ? '#27ae60' : '#e74c3c'}; padding:4px 10px; border-radius:20px; font-weight:bold;">${p.stock}</span></td>
            <td>
                <button class="warning" style="padding: 6px 10px; font-size: 0.8rem;" onclick="addStock(${i})">+ Stok</button>
                <button class="danger" style="padding: 6px 10px; font-size: 0.8rem;" onclick="deleteProduct(${i})">Hapus</button>
            </td>
        </tr>`;
    }).join('');
}

function addProduct() {
    const name = document.getElementById('prodName').value.trim();
    const cost = parseFloat(document.getElementById('prodCost').value);
    const price = parseFloat(document.getElementById('prodPrice').value);
    const stock = parseInt(document.getElementById('prodStock').value);
    
    if(!name || isNaN(cost) || isNaN(price) || isNaN(stock)) return alert('Isi semua data dengan benar!');
    
    const products = JSON.parse(localStorage.getItem('products') || '[]');
    products.push({ id: Date.now().toString(), name, cost, price, stock });
    localStorage.setItem('products', JSON.stringify(products));
    
    document.getElementById('prodName').value = ''; document.getElementById('prodCost').value = '';
    document.getElementById('prodPrice').value = ''; document.getElementById('prodStock').value = '';
    loadProducts();
}

function addStock(index) {
    const products = JSON.parse(localStorage.getItem('products') || '[]');
    const tambah = parseInt(prompt(`Tambah stok untuk ${products[index].name} sebanyak:`));
    if(tambah && !isNaN(tambah)) {
        products[index].stock += tambah;
        localStorage.setItem('products', JSON.stringify(products));
        loadProducts();
    }
}

function deleteProduct(index) {
    if(confirm('Hapus produk ini?')) {
        const products = JSON.parse(localStorage.getItem('products') || '[]');
        products.splice(index, 1);
        localStorage.setItem('products', JSON.stringify(products));
        loadProducts();
    }
}

if(document.getElementById('productList')) { document.addEventListener('DOMContentLoaded', loadProducts); }
