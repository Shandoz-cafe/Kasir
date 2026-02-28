const currentUser = JSON.parse(localStorage.getItem('currentUser'));
if(!currentUser || currentUser.role!=='admin') window.location.href='index.html';

// Produk
const dataKey = 'kasirData_'+currentUser.username;
let userData = JSON.parse(localStorage.getItem(dataKey));
if(!userData.products) userData.products=[];
let products = userData.products;

const prodList = document.getElementById('prodList');
function renderProductsAdmin(){
    prodList.innerHTML='';
    products.forEach((p,i)=>{
        const div = document.createElement('div');
        div.innerHTML=`${p.name} | Rp ${p.price} | Stok ${p.stock} 
        <button onclick="deleteProduct(${i})">Hapus</button>`;
        prodList.appendChild(div);
    });
}
function addProduct(){
    const name=document.getElementById('prodName').value.trim();
    const price=parseInt(document.getElementById('prodPrice').value);
    const stock=parseInt(document.getElementById('prodStock').value);
    if(!name||!price||!stock)return alert('Isi semua data!');
    products.push({id:Date.now(), name, price, stock});
    userData.products=products;
    localStorage.setItem(dataKey, JSON.stringify(userData));
    renderProductsAdmin();
}
function deleteProduct(i){ products.splice(i,1); userData.products=products; localStorage.setItem(dataKey, JSON.stringify(userData)); renderProductsAdmin();}
renderProductsAdmin();

// Akun
let users = JSON.parse(localStorage.getItem('kasirUsers')) || [];
const userList = document.getElementById('userList');
function renderUsers(){
    userList.innerHTML='';
    users.forEach((u,i)=>{
        const div=document.createElement('div');
        div.innerHTML=`${u.username} | ${u.role} 
        <button onclick="deleteUser(${i})">Hapus</button>`;
        userList.appendChild(div);
    });
}
function addUser(){
    const user=document.getElementById('accUser').value.trim();
    const pass=document.getElementById('accPass').value.trim();
    const role=document.getElementById('accRole').value;
    if(!user||!pass) return alert('Isi semua data!');
    if(users.find(u=>u.username===user)) return alert('Username sudah ada!');
    users.push({username:user,password:pass,role});
    localStorage.setItem('kasirUsers', JSON.stringify(users));
    // buat data kosong untuk user baru
    localStorage.setItem('kasirData_'+user, JSON.stringify({products:[], sales:[], settings:{storeName:'Cafe Bandung', autoPrint:true}}));
    renderUsers();
}
function deleteUser(i){
    const delUser = users[i].username;
    users.splice(i,1);
    localStorage.setItem('kasirUsers', JSON.stringify(users));
    localStorage.removeItem('kasirData_'+delUser);
    renderUsers();
}
renderUsers();
