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
let isSyncingFromCloud = false; // KUNCI PENGAMAN BIAR DATA GA ILANG

// === 2. FUNGSI LOADING ===
function showLoader(show) {
    const loader = document.getElementById('loader');
    if(loader) loader.style.display = show ? 'flex' : 'none';
}

// === 3. FUNGSI LOGIN (PASTI RESPON!) ===
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
    auth.signInWithPopup(provider)
        .then((result) => handleSuccessfulLogin(result.user))
        .catch((error) => { showLoader(false); alert("Gagal Login Google: " + error.message); });
}

function handleSuccessfulLogin(user) {
    localStorage.setItem('currentUser', user.displayName || user.email.split('@')[0]);
    localStorage.setItem('userUid', user.uid);
    window.location.href = 'profiles.html'; // LANGSUNG PAKSA PINDAH!
}

function logout() {
    if(confirm("Keluar dari sistem?")) {
        auth.signOut().then(() => {
            localStorage.clear();
            window.location.href = 'index.html';
        });
    }
}

// === 4. MESIN SINKRONISASI CLOUD (REAL-TIME) ===
function mulaiSinkronisasiCloud() {
    const uid = localStorage.getItem('userUid');
    if (!uid) return;

    const userRef = db.ref('ShandozPOS/' + uid);

    userRef.once('value').then((snapshot) => {
        if (!snapshot.val()) {
            const ownerName = localStorage.getItem('currentUser') || "Owner";
            userRef.set({
                users: [{id: 'owner_1', name: ownerName, role: "admin", pin: "SETUP"}],
                products: JSON.parse(localStorage.getItem('products') || '[]'),
                sales: JSON.parse(localStorage.getItem('sales') || '[]')
            });
        }

        // DENGARKAN PERUBAHAN DARI AWAN
        userRef.on('value', (snap) => {
            isSyncingFromCloud = true; 
            const data = snap.val() || {};

            localStorage.setItem('users', JSON.stringify(data.users || []));
            localStorage.setItem('products', JSON.stringify(data.products || []));
            localStorage.setItem('sales', JSON.stringify(data.sales || []));
            if (data.storeName) localStorage.setItem('storeName', data.storeName);
            if (data.storeLogo) localStorage.setItem('storeLogo', data.storeLogo);

            // REFRESH LAYAR OTOMATIS
            if(typeof filterAndSortProducts === 'function') filterAndSortProducts();
            if(typeof initDashboardData === 'function') initDashboardData();
            if(typeof renderProfiles === 'function') renderProfiles();

            isSyncingFromCloud = false; 
        });
    });

    // KIRIM KE AWAN SETIAP KASIR NGETIK
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = function(key, value) {
        originalSetItem.apply(this, arguments);
        if (!isSyncingFromCloud && ['products', 'sales', 'users', 'storeName', 'storeLogo'].includes(key)) {
            try {
                const dataToSave = (key === 'storeName' || key === 'storeLogo') ? value : JSON.parse(value);
                userRef.child(key).set(dataToSave).catch(e => console.error(e));
            } catch(e) { console.error("Format error", e); }
        }
    };
}

// === 5. FUNGSI CEK OTENTIKASI SAAT HALAMAN DIBUKA ===
function checkAuth() {
    const isIndex = window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/Kasir/') || window.location.pathname === '/' || window.location.pathname.includes('index');

    auth.onAuthStateChanged((user) => {
        if (user) {
            localStorage.setItem('userUid', user.uid);
            mulaiSinkronisasiCloud();

            if (isIndex) {
                window.location.href = 'profiles.html';
            } else if (!localStorage.getItem('currentRole') && !window.location.href.includes('profiles.html')) {
                window.location.href = 'profiles.html';
            }
        } else {
            if (!isIndex) window.location.href = 'index.html';
        }
    });
}
