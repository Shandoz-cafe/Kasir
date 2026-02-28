// Akun default offline
const defaultUser = { username: 'admin', password: '1234' };

const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const loginScreen = document.getElementById('loginScreen');
const mainApp = document.getElementById('mainApp');
const userNameSpan = document.getElementById('userName');
const loginMsg = document.getElementById('loginMsg');

loginBtn.addEventListener('click', () => {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    // Cek localStorage atau default
    let user = JSON.parse(localStorage.getItem('kasirUser')) || defaultUser;

    if(username === user.username && password === user.password){
        loginScreen.style.display='none';
        mainApp.style.display='block';
        userNameSpan.textContent = username;
    } else {
        loginMsg.textContent = 'Username atau password salah';
    }
});

logoutBtn.addEventListener('click', () => {
    loginScreen.style.display='block';
    mainApp.style.display='none';
});
