// === 1. CONFIG FIREBASE ASLI SHANDOZ POS ===
const firebaseConfig = {
    apiKey: "AIzaSyDWXhCZu0VcDhfKijaDZycA0Th-reUAnNg",
    authDomain: "shandoz-pos.firebaseapp.com",
    databaseURL: "https://shandoz-pos-default-rtdb.firebaseio.com",
    projectId: "shandoz-pos",
    storageBucket: "shandoz-pos.firebasestorage.app",
    messagingSenderId: "451234972920",
    appId: "1:451234972920:web:dead8905720cb55329670d"
};

if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();

// === 2. MESIN SINKRONISASI OTOMATIS (AUTO-SAVE KE AWAN) ===
const originalSetItem = localStorage.setItem;
localStorage.setItem = function(key, value) {
    originalSetItem.apply(this, arguments);
    const user = auth.currentUser;
    // Cek apakah data yang diubah adalah data penting kafe
    if (user && ['products', 'sales', 'users', 'settings', 'storeName', 'storeLogo'].includes(key)) {
        try {
            const dataToSave = (key === 'storeName' || key === 'storeLogo') ? value : JSON.parse(value);
            db.ref('ShandozPOS/' + user.uid + '/' + key).set(dataToSave);
        } catch(e) { console.error("Sync Error:", e); }
    }
};

// === 3. FUNGSI CEK LOGIN (ANTI-STUCK & AUTO-PULL) ===
function checkAuth() {
    auth.onAuthStateChanged((user) => {
        const path = window.location.pathname;
        const isIndex = path.endsWith('index.html') || path.endsWith('/Kasir/') || path === '/' || path.includes('index');

        if (user) {
            localStorage.setItem('userUid', user.uid);
            localStorage.setItem('currentUser', user.displayName || user.email.split('@')[0]);

            // SEDOT DATA DARI AWAN (Agar Device Lain Update Otomatis)
            db.ref('ShandozPOS/' + user.uid).on('value', (snapshot) => {
                if (snapshot.exists()) {
                    const cloudData = snapshot.val();
                    // Update memori lokal HP tanpa memicu upload balik
                    if(cloudData.products) originalSetItem.call(localStorage, 'products', JSON.stringify(cloudData.products));
                    if(cloudData.sales) originalSetItem.call(localStorage, 'sales', JSON.stringify(cloudData.sales));
                    if(cloudData.users) originalSetItem.call(localStorage, 'users', JSON.stringify(cloudData.users));
                    if(cloudData.settings) originalSetItem.call(localStorage, 'settings', JSON.stringify(cloudData.settings));
                    if(cloudData.storeName) originalSetItem.call(localStorage, 'storeName', cloudData.storeName);
                    if(cloudData.storeLogo) originalSetItem.call(localStorage, 'storeLogo', cloudData.storeLogo);
                }
                
                // Lempar ke profiles.html jika login berhasil
                if (isIndex) window.location.href = 'profiles.html';
            });

        } else {
            // Jika belum login, pastikan user ada di halaman depan
            if (!isIndex) window.location.href = 'index.html';
        }
    });
}

// === 4. FUNGSI LOGIN & DAFTAR ===
function loginWithEmail() {
    const email = document.getElementById('loginEmail').value;
    const pass = document.getElementById('loginPass').value;
    if(!email || !pass) return alert("Isi Email & Sandi!");
    
    auth.signInWithEmailAndPassword(email, pass).catch(err => alert("Gagal: " + err.message));
}

function loginWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).catch(err => alert("Gagal Google: " + err.message));
}

function logout() {
    if(confirm("Keluar dari sistem?")) {
        auth.signOut().then(() => {
            localStorage.clear();
            window.location.href = 'index.html';
        });
    }
}
