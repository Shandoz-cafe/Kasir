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
let isSyncingFromCloud = false;

// === LEM SUPER FIREBASE: Paksa akun nempel permanen di memori HP! ===
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch(console.error);

function showLoader(show) {
    const loader = document.getElementById('loader');
    if(loader) loader.style.display = show ? 'flex' : 'none';
}

function loginWithEmail() {
    const email = document.getElementById('loginEmail').value;
    const pass = document.getElementById('loginPass').value;
    if(!email || !pass) return alert("Masukkan Email dan Sandi!");
    showLoader(true);
    auth.signInWithEmailAndPassword(email, pass)
        .then((userCred) => handleSuccessfulLogin(userCred.user))
        .catch((error) => { showLoader(false); alert("Gagal Login: " + error.message); });
}

function registerWithEmail() {
    const name = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;
    const pass = document.getElementById('regPass').value;
    if(!name || !email || !pass) return alert("Harap isi semua kolom!");
    showLoader(true);
    auth.createUserWithEmailAndPassword(email, pass).then((userCred) => {
        userCred.user.updateProfile({ displayName: name }).then(() => handleSuccessfulLogin(userCred.user));
    }).catch((error) => { showLoader(false); alert("Gagal Daftar: " + error.message); });
}

function loginWithGoogle() {
    showLoader(true);
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).then((result) => handleSuccessfulLogin(result.user))
        .catch((error) => { showLoader(false); alert("Gagal Login Google: " + error.message); });
}

function handleSuccessfulLogin(user) {
    localStorage.setItem('currentUser', user.displayName || user.email.split('@')[0]);
    localStorage.setItem('userUid', user.uid);
    window.location.replace('profiles.html'); 
}

function logout() {
    if(confirm("Keluar dari sistem secara permanen?")) {
        auth.signOut().then(() => {
            localStorage.clear();
            window.location.replace('index.html');
        });
    }
}

// === MESIN SINKRONISASI CLOUD (SAPU JAGAT) ===
function mulaiSinkronisasiCloud() {
    const uid = localStorage.getItem('userUid');
    if (!uid) return;
    const userRef = db.ref('ShandozPOS/' + uid);

    userRef.on('value', (snap) => {
        isSyncingFromCloud = true; 
        const data = snap.val() || {};

        if (!data.products) localStorage.setItem('products', '[]');
        if (!data.sales) localStorage.setItem('sales', '[]');
        if (!data.users) localStorage.setItem('users', '[]');

        Object.keys(data).forEach(key => {
            let val = data[key];
            if (typeof val === 'object') {
                localStorage.setItem(key, JSON.stringify(val));
            } else {
                localStorage.setItem(key, val);
            }
        });

        if(typeof filterAndSortProducts === 'function') filterAndSortProducts();
        if(typeof initDashboardData === 'function') initDashboardData();
        if(typeof renderProfiles === 'function') renderProfiles();
        if(typeof loadSalesData === 'function') loadSalesData();

        isSyncingFromCloud = false; 
    });

    const originalSetItem = localStorage.setItem;
    localStorage.setItem = function(key, value) {
        originalSetItem.apply(this, arguments);
        const cloudKeys = [
            'products', 'sales', 'users', 'storeName', 'storeLogo', 'settings', 
            'expenses', 'pengeluaran', 'history', 'transactions', 'transaksi', 
            'laporan', 'printerSettings', 'orders'
        ];
        
        if (!isSyncingFromCloud && cloudKeys.includes(key)) {
            try {
                let dataToSave;
                try { dataToSave = JSON.parse(value); } catch(e) { dataToSave = value; } 
                userRef.child(key).set(dataToSave).catch(e => console.error(e));
            } catch(e) { console.error("Sync Error", e); }
        }
    };
}

// === FUNGSI CEK OTENTIKASI & JURUS BYPASS INSTAN ===
function checkAuth() {
    const path = window.location.pathname;
    const isIndex = path.endsWith('index.html') || path.endsWith('/Kasir/') || path === '/' || path.includes('index');
    const savedUid = localStorage.getItem('userUid');

    // 1. JURUS BYPASS INSTAN: Kalau buka APK dan akun masih nempel, langsung lempar ke Profil!
    if (isIndex && savedUid) {
        localStorage.removeItem('currentRole'); // Paksa Kasir masukin PIN lagi!
        window.location.replace('profiles.html');
        return;
    }

    // 2. JURUS TENDANG INSTAN: Kalau nekat buka menu tanpa login
    if (!isIndex && !savedUid) {
        window.location.replace('index.html');
        return;
    }

    auth.onAuthStateChanged((user) => {
        if (user) {
            localStorage.setItem('userUid', user.uid);
            mulaiSinkronisasiCloud();

            if (isIndex) {
                localStorage.removeItem('currentRole');
                window.location.replace('profiles.html');
            } else if (!localStorage.getItem('currentRole') && !window.location.href.includes('profiles.html')) {
                window.location.replace('profiles.html');
            }
        } else {
            if (savedUid) localStorage.clear(); // Bersihkan sisa kotoran kalau sesi Google expired
            if (!isIndex) window.location.replace('index.html');
        }
    });
}

window.addEventListener('pageshow', function (event) {
    if (event.persisted) checkAuth();
});
