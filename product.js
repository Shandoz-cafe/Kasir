function loadProducts() {
    const products = JSON.parse(localStorage.getItem('products') || '[]');
    const tbody = document.getElementById('productList');
    tbody.innerHTML = products.map((p, i) => `
        <tr>
            <td>${i+1}</td><td>${p.name}</td><td>Rp ${p.price}</td>
            <td><button class="danger" onclick="deleteProduct(${i})">Hapus</button></td>
        </tr>
    `).join('');
}

function addProduct() {
    const name = document.getElementById('prodName').value.trim();
    const price = parseFloat(document.getElementById('prodPrice').value);
    if(!name || isNaN(price)) return alert('Isi nama dan harga yang valid!');
    
    const products = JSON.parse(localStorage.getItem('products') || '[]');
    products.push({name, price});
    localStorage.setItem('products', JSON.stringify(products));
    
    document.getElementById('prodName').value = '';
    document.getElementById('prodPrice').value = '';
    loadProducts();
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
