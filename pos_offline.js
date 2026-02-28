let cart = [];
let products = JSON.parse(localStorage.getItem('products')) || [];

function renderCart(){
    const cartList = document.getElementById('cartList');
    let totalAll = 0;
    cartList.innerHTML = cart.map((c,i)=>{
        totalAll += c.total;
        return `<div>${c.name} x${c.qty} = Rp ${c.total} <button onclick="cart.splice(${i},1);renderCart()">×</button></div>`;
    }).join('');
    document.getElementById('cartTotal').textContent = totalAll;
}

window.addToCart = () => {
    const name = document.getElementById('saleProduct').value.trim();
    const qty = parseInt(document.getElementById('saleQty').value||'1');
    const product = products.find(p=>p.name.toLowerCase()===name.toLowerCase());
    if(!product) return alert('Produk tidak ditemukan');
    if(qty>product.stock) return alert('Stok tidak cukup');

    const total = qty * product.price;
    cart.push({name, qty, price: product.price, total});
    renderCart();
}

window.clearCart = () => { cart=[]; renderCart(); }

window.checkout = () => {
    if(cart.length===0) return alert('Keranjang kosong');
    // Kurangi stok
    cart.forEach(c=>{
        const p = products.find(p=>p.name===c.name);
        p.stock -= c.qty;
    });
    localStorage.setItem('products', JSON.stringify(products));
    alert('Transaksi berhasil!');
    cart = [];
    renderCart();
}
