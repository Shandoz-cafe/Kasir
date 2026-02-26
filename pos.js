// js/pos.js
import { db } from "./firebase.js";
import { collection, addDoc, getDocs, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let cart = [];
let products = [];

const productsContainer = document.getElementById("products");
const cartContainer = document.getElementById("cartItems");
const totalElement = document.getElementById("total");
const kembaliElement = document.getElementById("kembali");
const bayarInput = document.getElementById("bayar");

async function loadProducts() {
    const snap = await getDocs(collection(db, "products"));
    products = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    renderProducts();
}

function renderProducts() {
    productsContainer.innerHTML = "";
    products.forEach(p => {
        const div = document.createElement("div");
        div.className = "product-card";
        div.innerHTML = `<h4>${p.name}</h4><p>Rp ${p.price}</p><button onclick="addToCart('${p.id}')">Tambah</button>`;
        productsContainer.appendChild(div);
    });
}

function addToCart(id) {
    const product = products.find(p => p.id === id);
    const existing = cart.find(c => c.id === id);

    if(existing) existing.qty += 1;
    else cart.push({ ...product, qty: 1 });

    renderCart();
}

function renderCart() {
    cartContainer.innerHTML = "";
    let total = 0;

    cart.forEach(item => {
        total += item.price * item.qty;
        const div = document.createElement("div");
        div.className = "cart-item";
        div.innerHTML = `<span>${item.name} x${item.qty}</span><span>Rp ${item.price*item.qty}</span>`;
        cartContainer.appendChild(div);
    });

    totalElement.innerText = "Rp " + total;
}

function generateReceipt() {
    let html = "<h3 style='text-align:center;'>Cafe Bandung</h3><hr>";
    cart.forEach(item => {
        html += `<div>${item.name} x${item.qty} - Rp ${item.price*item.qty}</div>`;
    });
    const total = cart.reduce((sum,i)=>sum+i.price*i.qty,0);
    html += "<hr>";
    html += `<div>Total: Rp ${total}</div>`;
    const bayar = parseInt(bayarInput.value) || 0;
    html += `<div>Bayar: Rp ${bayar}</div>`;
    const kembali = bayar - total;
    html += `<div>Kembali: Rp ${kembali}</div><hr>`;
    html += "<div style='text-align:center;'>Terima Kasih!</div>";
    return html;
}

function showReceipt() {
    const receiptContent = document.getElementById("receiptContent");
    receiptContent.innerHTML = generateReceipt();
    document.getElementById("receiptPreview").style.display = "block";
}

function printReceipt() {
    const content = document.getElementById("receiptContent").innerHTML;
    const w = window.open('', '_blank');
    w.document.write(`<html><head><title>Struk</title></head><body>${content}</body></html>`);
    w.document.close();
    w.print();
}

async function checkout() {
    const bayar = parseInt(bayarInput.value);
    const total = cart.reduce((sum,i)=>sum+i.price*i.qty,0);
    if(bayar < total){ alert("Uang kurang!"); return;}
    const kembali = bayar - total;
    kembaliElement.innerText = "Rp " + kembali;

    // Simpan ke Firestore
    await addDoc(collection(db, "transactions"), {
        items: cart,
        total,
        bayar,
        kembali,
        createdAt: new Date()
    });

    // Kurangi stok
    for(let item of cart){
        const prod = products.find(p=>p.id===item.id);
        prod.stock = (prod.stock || 100) - item.qty;
        await setDoc(doc(db, "products", prod.id), prod);
    }

    // Tampilkan struk
    showReceipt();

    cart = [];
    renderCart();
    bayarInput.value = "";
}

window.addToCart = addToCart;
loadProducts();
