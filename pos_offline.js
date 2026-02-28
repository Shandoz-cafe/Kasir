const currentUser = JSON.parse(localStorage.getItem('currentUser'));
if(!currentUser) window.location.href='index.html';

const dataKey = 'kasirData_'+currentUser.username;
let userData = JSON.parse(localStorage.getItem(dataKey));

let products = userData.products;
let cart = [];

const productsGrid = document.getElementById('productsGrid');
const cartItems = document.getElementById('cartItems');
const cartTotal = document.getElementById('cartTotal');

function logout(){ localStorage.removeItem('currentUser'); }

function renderProducts(){
    productsGrid.innerHTML='';
    products.forEach(p=>{
        const card = document.createElement('div');
        card.className='product-card';
        card.innerHTML=`<h4>${p.name}</h4><div>Rp ${p.price.toLocaleString()}</div>
        <button onclick="addToCart(${p.id})">Tambah</button>`;
        productsGrid.appendChild(card);
    });
}

function addToCart(id){
    const prod = products.find(p=>p.id===id);
    if(!prod || prod.stock<=0){ alert('Stok habis'); return; }
    const cartItem = cart.find(c=>c.id===id);
    if(cartItem) cartItem.qty++; else cart.push({id:prod.id,name:prod.name,price:prod.price,qty:1});
    renderCart();
}

function renderCart(){
    cartItems.innerHTML='';
    let total=0;
    cart.forEach((c,i)=>{
        total += c.price*c.qty;
        const div = document.createElement('div');
        div.className='cart-item';
        div.innerHTML=`<span>${c.name} x${c.qty}</span> <span>Rp ${(c.price*c.qty).toLocaleString()} 
        <button onclick="removeCart(${i})">x</button></span>`;
        cartItems.appendChild(div);
    });
    cartTotal.innerText=total.toLocaleString();
}

function removeCart(i){ cart.splice(i,1); renderCart(); }

function checkout(){
    if(cart.length===0){ alert('Keranjang kosong!'); return; }
    
    cart.forEach(c=>{
        const prod = products.find(p=>p.id===c.id);
        prod.stock -= c.qty;
    });
    
    userData.products = products;
    
    if(!userData.sales) userData.sales=[];
    userData.sales.push({date:new Date().toISOString(), items:cart, total:cart.reduce((sum,c)=>sum+c.qty*c.price,0)});
    
    localStorage.setItem(dataKey, JSON.stringify(userData));
    
    // Print
    let receipt='===== STRUK =====\n';
    cart.forEach(c=>{ receipt+=`${c.name} x${c.qty} = Rp ${(c.price*c.qty).toLocaleString()}\n`; });
    receipt += `Total: Rp ${cart.reduce((sum,c)=>sum+c.price*c.qty,0).toLocaleString()}\n================\nTerima Kasih!`;
    
    const printWin = window.open('','', 'width=300,height=400');
    printWin.document.write('<pre>'+receipt+'</pre>');
    printWin.print();
    
    cart=[];
    renderCart();
    renderProducts();
}

renderProducts();
renderCart();
