function getProducts() {
    return JSON.parse(localStorage.getItem('products') || '[]');
}

function saveProducts(products) {
    localStorage.setItem('products', JSON.stringify(products));
}

// Render daftar produk
function renderProducts() {
    const list = document.getElementById('productList');
    const products = getProducts();
    list.innerHTML = products.map((p,i)=>`
        <tr>
            <td>${i+1}</td>
            <td>${p.name}</td>
            <td>Rp ${p.price}</td>
            <td>
                <button onclick="editProduct(${i})">Edit</button>
                <button onclick="deleteProduct(${i})">Hapus</button>
            </td>
        </tr>
    `).join('');
}

// Tambah produk baru
function addProduct() {
    const name = document.getElementById('prodName').value.trim();
    const price = parseFloat(document.getElementById('prodPrice').value);
    if(!name || isNaN(price)){
        alert('Nama dan harga harus valid!');
        return;
    }
    const products = getProducts();
    products.push({name, price});
    saveProducts(products);
    renderProducts();
    document.getElementById('prodName').value = '';
    document.getElementById('prodPrice').value = '';
}

// Edit produk
function editProduct(index) {
    const products = getProducts();
    const p = products[index];
    const newName = prompt('Nama produk:', p.name);
    const newPrice = prompt('Harga:', p.price);
    if(newName && !isNaN(newPrice)){
        p.name = newName;
        p.price = parseFloat(newPrice);
        saveProducts(products);
        renderProducts();
    }
}

// Hapus produk
function deleteProduct(index) {
    const products = getProducts();
    if(confirm(`Hapus produk ${products[index].name}?`)){
        products.splice(index,1);
        saveProducts(products);
        renderProducts();
    }
}

// Init
document.addEventListener('DOMContentLoaded', renderProducts);
