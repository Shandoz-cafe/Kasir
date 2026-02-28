if (!localStorage.getItem("users")) {
    localStorage.setItem("users", JSON.stringify([{ username: "shandoz", password: "shandoz88", role: "admin" }]));
}
if (!localStorage.getItem("storeName")) {
    localStorage.setItem("storeName", "SHANDOZ Cafe & Coffee Bar");
}

function login() {
    const userForm = document.getElementById('loginUser').value.trim();
    const passForm = document.getElementById('loginPass').value;
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const validUser = users.find(u => u.username === userForm && u.password === passForm);
    
    if(validUser) {
        localStorage.setItem('currentUser', validUser.username);
        localStorage.setItem('currentRole', validUser.role || 'kasir');
        window.location.href = 'dashboard.html';
    } else { alert('Username atau password salah!'); }
}

function logout() {
    localStorage.removeItem('currentUser'); localStorage.removeItem('currentRole');
    window.location.href = 'index.html';
}

function checkAuth() { if(!localStorage.getItem('currentUser')) window.location.href = 'index.html'; }
