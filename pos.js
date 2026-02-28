let cart = [];

// ===== Produk Offline =====
// Produk disimpan di localStorage, struktur: {id, name, price}
function getProducts() {
    return JSON.parse(localStorage.getItem('products') || '[]');
}

function saveProducts(products) {
    localStorage.setItem('products', JSON.stringify(products));
}

// ===== Keranjang =====
function addToCart() {
    const name = document.getElementById('productName').value.trim();
    const price = parseFloat(document.getElementById('productPrice').value);
    const qty = parseInt(document.getElementById('productQty').value);
    
    if(!name || isNaN(price) || isNaN(qty) || qty < 1){
        alert('Isi nama, harga dan qty valid!');
        return;
    }

    const item = {name, price, qty, total: price*qty};
    cart.push(item);
    renderCart();
}

function renderCart() {
    const list = document.getElementById('cartList');
    list.innerHTML = cart.map((item, i) => `
        <div style="margin-bottom:8px;padding:5px;border:1px solid #ccc;border-radius:5px;">
            ${item.name} | Rp ${item.price} x ${item.qty} = Rp ${item.total}
            <button onclick="removeFromCart(${i})">×</button>
        </div>
    `).join('');

    const total = cart.reduce((sum, i) => sum + i.total, 0);
    document.getElementById('cartTotal').innerText = total;
}

function removeFromCart(index){
    cart.splice(index,1);
    renderCart();
}

function clearCart(){
    cart = [];
    renderCart();
}

// ===== Checkout =====
function checkout() {
    if(cart.length === 0){
        alert('Keranjang kosong!');
        return;
    }

    // Simpan transaksi di localStorage
    const sales = JSON.parse(localStorage.getItem('sales') || '[]');
    const sale = {
        id: Date.now(),
        user: localStorage.getItem('currentUser') || 'Guest',
        date: new Date().toLocaleString(),
        items: cart,
        total: cart.reduce((sum,i)=>sum+i.total,0)
    };
    sales.push(sale);
    localStorage.setItem('sales', JSON.stringify(sales));

    // Print struk via browser
    printReceipt(sale);

    cart = [];
    renderCart();
}

// ===== Print Struk =====
function printReceipt(sale){
    let content = `===== STRUK =====\n`;
    content += `Toko: ${localStorage.getItem('storeName') || 'Toko Saya'}\n`;
    content += `Kasir: ${sale.user}\n`;
    content += `Tanggal: ${sale.date}\n`;
    content += `----------------------\n`;
    sale.items.forEach(i=>{
        content += `${i.name} x${i.qty} = Rp ${i.total}\n`;
    });
    content += `----------------------\n`;
    content += `TOTAL: Rp ${sale.total}\n`;
    content += `====================\n`;

    const printWin = window.open('', '_blank');
    printWin.document.write(`<pre>${content}</pre>`);
    printWin.document.close();
    printWin.print();
}

// ===== Back to Dashboard =====
function backToDashboard(){
    window.location.href = 'dashboard.html';
}
