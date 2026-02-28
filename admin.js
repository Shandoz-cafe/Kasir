import { db } from './firebase.js';
import { collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const productList = document.getElementById('productList');

window.addProduct = async () => {
    const name = document.getElementById('productName').value;
    const price = parseInt(document.getElementById('productPrice').value || '0');
    const stock = parseInt(document.getElementById('productStock').value || '0');
    if(!name){ alert('Nama kosong'); return; }
    await addDoc(collection(db,'products'), { name, price, stock });
    alert('Produk ditambahkan');
    loadProducts();
};

async function loadProducts() {
    const snapshot = await getDocs(collection(db,'products'));
    let html='';
    snapshot.forEach(doc=>{ const p=doc.data(); html+=`<div>${p.name} - Rp ${p.price} - Stok: ${p.stock}</div>`; });
    productList.innerHTML = html;
}

loadProducts();

window.logout = async () => { window.location='index.html'; }
