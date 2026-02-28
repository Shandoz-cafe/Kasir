// ===== Auth Offline =====

// Data user disimpan di localStorage
// Struktur: { username: "user", password: "1234" }

function getUsers() {
    return JSON.parse(localStorage.getItem('users') || '[]');
}

function saveUsers(users) {
    localStorage.setItem('users', JSON.stringify(users));
}

// Login
function login() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const users = getUsers();
    const user = users.find(u => u.username === username && u.password === password);
    const msg = document.getElementById('loginMsg');

    if(user){
        localStorage.setItem('currentUser', username);
        msg.style.color = 'green';
        msg.innerText = 'Login berhasil! Redirecting...';
        setTimeout(()=>{ window.location.href = 'dashboard.html'; }, 1000);
    } else {
        msg.style.color = 'red';
        msg.innerText = 'Username atau password salah!';
    }
}

// Register
function register() {
    const username = document.getElementById('regUser').value.trim();
    const password = document.getElementById('regPass').value;
    const users = getUsers();
    const msg = document.getElementById('regMsg');

    if(users.some(u=>u.username===username)){
        msg.style.color = 'red';
        msg.innerText = 'Username sudah ada!';
        return;
    }
    users.push({username, password});
    saveUsers(users);
    msg.style.color = 'green';
    msg.innerText = 'User berhasil didaftarkan!';
}

// Ganti password
function changePassword() {
    const username = document.getElementById('chgUser').value.trim();
    const oldPass = document.getElementById('oldPass').value;
    const newPass = document.getElementById('newPass').value;
    const users = getUsers();
    const msg = document.getElementById('chgMsg');

    const user = users.find(u => u.username === username && u.password === oldPass);
    if(user){
        user.password = newPass;
        saveUsers(users);
        msg.style.color = 'green';
        msg.innerText = 'Password berhasil diganti!';
    } else {
        msg.style.color = 'red';
        msg.innerText = 'Username atau password lama salah!';
    }
}
