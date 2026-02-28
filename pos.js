import { db } from './firebase.js';
import { collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let cart = [];
const cartList = document.getElementById('cartList');
const cartTotal = document.getElementById('cartTotal');

window.addToCart = () => {
    const name = document.getElementById('saleProduct').value;
    const qty = parseInt(document.getElementById('saleQty').value || '1');
    const price = 10000; // contoh, nanti bisa ambil dari Firestore
    const total = price * qty;
    cart.push({ name, qty, price, total });
    renderCart();
};

function renderCart() {
    let html = '';
    let totalAll = 0;
    cart.forEach((item,i) => {
        html += `<div>${item.name} x${item.qty} = Rp ${item.total} <button onclick="cart.splice(${i},1);renderCart();">×</button></div>`;
        totalAll += item.total;
    });
    cartList.innerHTML = html;
    cartTotal.textContent = `Rp ${totalAll}`;
}

window.clearCart = () => { cart=[]; renderCart(); }

window.checkout = async () => {
    if(cart.length===0){ alert('Keranjang kosong'); return; }
    await addDoc(collection(db,'sales'),{ date:new Date().toISOString(), items:cart });
    alert('Transaksi tersimpan!'); cart=[]; renderCart();
};
