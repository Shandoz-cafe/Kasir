let products = JSON.parse(localStorage.getItem('products')) || [];

function renderProducts(){
    const productList = document.getElementById('productList');
    productList.innerHTML = products.map((p,i)=>{
        return `<div>
            ${p.name} - Rp ${p.price} - Stok: ${p.stock}
            <button onclick="editProduct(${i})">✏️ Edit</button>
            <button onclick="deleteProduct(${i})">🗑️ Hapus</button>
        </div>`;
    }).join('');
    localStorage.setItem('products', JSON.stringify(products));
}

window.addProduct = () => {
    const name = document.getElementById('productName').value.trim();
    const price = parseInt(document.getElementById('productPrice').value||0);
    const stock = parseInt(document.getElementById('productStock').value||0);
    if(!name || price<=0 || stock<0) return alert('Isi semua field dengan benar');

    products.push({name, price, stock});
    renderProducts();
}

window.editProduct = (i) => {
    const p = products[i];
    const newName = prompt('Nama produk', p.name);
    const newPrice = parseInt(prompt('Harga produk', p.price));
    const newStock = parseInt(prompt('Stok produk', p.stock));
    if(newName && newPrice>=0 && newStock>=0){
        products[i] = {name:newName, price:newPrice, stock:newStock};
        renderProducts();
    }
}

window.deleteProduct = (i) => {
    if(confirm('Hapus produk ini?')){
        products.splice(i,1);
        renderProducts();
    }
}

renderProducts();
