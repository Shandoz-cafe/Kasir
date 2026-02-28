import { auth, provider } from './firebase.js';
import { signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const loginBtn = document.getElementById('googleLoginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const loginScreen = document.getElementById('loginScreen');
const mainApp = document.getElementById('mainApp');
const userName = document.getElementById('userName');

loginBtn?.addEventListener('click', async () => {
    try {
        const result = await signInWithPopup(auth, provider);
        console.log('Login sukses:', result.user);
    } catch(e) { alert('Login gagal'); }
});

logoutBtn?.addEventListener('click', async () => {
    await signOut(auth);
});

onAuthStateChanged(auth, user => {
    if(user) {
        loginScreen.style.display='none';
        mainApp.style.display='block';
        userName.textContent = user.displayName;
    } else {
        loginScreen.style.display='block';
        mainApp.style.display='none';
    }
});
