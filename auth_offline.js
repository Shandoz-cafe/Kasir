// Default users
if(!localStorage.getItem('kasirUsers')){
    localStorage.setItem('kasirUsers', JSON.stringify([
        {username:'admin', password:'1234', role:'admin'}
    ]));
}

// Login
function login(){
    const user = document.getElementById('username').value.trim();
    const pass = document.getElementById('password').value.trim();
    const users = JSON.parse(localStorage.getItem('kasirUsers')) || [];
    const match = users.find(u => u.username===user && u.password===pass);
    if(match){
        localStorage.setItem('currentUser', JSON.stringify(match));
        // load data user jika belum ada
        if(!localStorage.getItem('kasirData_'+user)){
            localStorage.setItem('kasirData_'+user, JSON.stringify({
                products: [],
                sales: [],
                settings: {storeName:'Cafe Bandung', autoPrint:true}
            }));
        }
        window.location.href = match.role==='admin' ? 'admin.html' : 'pos.html';
    } else {
        document.getElementById('loginMsg').innerText = "Username / Password salah!";
    }
}

// Ganti password
function changePassword(){
    const user = document.getElementById('chgUser').value.trim();
    const oldPass = document.getElementById('oldPass').value.trim();
    const newPass = document.getElementById('newPass').value.trim();
    if(!user || !oldPass || !newPass) return alert('Isi semua data!');
    
    const users = JSON.parse(localStorage.getItem('kasirUsers')) || [];
    const idx = users.findIndex(u=>u.username===user && u.password===oldPass);
    if(idx===-1){ 
        document.getElementById('chgMsg').style.color='red';
        document.getElementById('chgMsg').innerText='Username / Password lama salah!';
        return;
    }
    users[idx].password = newPass;
    localStorage.setItem('kasirUsers', JSON.stringify(users));
    document.getElementById('chgMsg').style.color='green';
    document.getElementById('chgMsg').innerText='Password berhasil diubah!';
}
