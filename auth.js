// Konfigurasi Firebase Anda
const firebaseConfig = {
    apiKey: "AIzaSyDWXhCZu0VcDhfKijaDZycA0Th-reUAnNg",
    authDomain: "shandoz-pos.firebaseapp.com",
    databaseURL: "https://shandoz-pos-default-rtdb.firebaseio.com",
    projectId: "shandoz-pos",
    storageBucket: "shandoz-pos.firebasestorage.app",
    messagingSenderId: "451234972920",
    appId: "1:451234972920:web:dead8905720cb55329670d"
};

// Inisialisasi Firebase jika belum jalan
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.database();
let isSyncingFromCloud = false;

// Tampilkan / Sembunyikan Loading
function showLoader(show) {
    const loader = document.getElementById('loader');
    if(loader) loader.style.display = show ? 'flex' : 'none';
}

// 1. LOGIN DENGAN GOOGLE
function loginWithGoogle() {
    showLoader(true);
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).then((result) => {
        handleSuccessfulLogin(result.user);
    }).catch((error) => {
        showLoader(false);
        alert("Gagal Login Google: " + error.message);
    });
}

// 2. DAFTAR DENGAN EMAIL & PASSWORD
function registerWithEmail() {
    const name = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;
    const pass = document.getElementById('regPass').value;

    if(!name || !email || !pass) return alert("Harap isi semua kolom!");
    if(pass.length < 6) return alert("Sandi minimal 6 karakter!");

    showLoader(true);
    auth.createUserWithEmailAndPassword(email, pass).then((userCredential) => {
        const user = userCredential.user;
        // Update nama profil
        user.updateProfile({ displayName: name }).then(() => {
            handleSuccessfulLogin(user);
        });
    }).catch((error) => {
        showLoader(false);
        alert("Gagal Daftar: " + error.message);
    });
}

// 3. LOGIN DENGAN EMAIL & PASSWORD
function loginWithEmail() {
    const email = document.getElementById('loginEmail').value;
    const pass = document.getElementById('loginPass').value;

    if(!email || !pass) return alert("Masukkan Email dan Sandi!");

    showLoader(true);
    auth.signInWithEmailAndPassword(email, pass).then((userCredential) => {
        handleSuccessfulLogin(userCredential.user);
    }).catch((error) => {
        showLoader(false);
        alert("Gagal Login: Email atau sandi salah.");
    });
}

// 4. PROSES SETELAH LOGIN SUKSES
function handleSuccessfulLogin(user) {
    // Simpan data user ke memori HP
    localStorage.setItem('currentUser', user.displayName || user.email.split('@')[0]);
    localStorage.setItem('userUid', user.uid); 
    localStorage.setItem('currentRole', 'admin'); // Pemilik akun otomatis jadi admin

    // Buka akses ke Dashboard
    window.location.href = 'dashboard.html';
}

// 5. SISTEM SINKRONISASI DATA MULTI-TENANT (SaaS)
// Memastikan User A tidak bisa melihat data produk User B
function mulaiSinkronisasiCloud() {
    const uid = localStorage.getItem('userUid');
    if (!uid) return; // Jika belum login, hentikan

    // Data sekarang disimpan di folder khusus per-UID pengguna
    const userRef = db.ref('tenants/' + uid);

    userRef.once('value').then((snapshot) => {
        if (!snapshot.val()) {
            // Jika user baru, buatkan database kosong
            userRef.set({
                products: JSON.parse(localStorage.getItem('products') || '[]'),
                sales: JSON.parse(localStorage.getItem('sales') || '[]')
            });
        }
        
        // Dengarkan perubahan data secara realtime
        userRef.on('value', (snap) => {
            isSyncingFromCloud = true;
            const data = snap.val() || {};
            localStorage.setItem('products', JSON.stringify(data.products || []));
            localStorage.setItem('sales', JSON.stringify(data.sales || []));
            
            // Refresh layar jika ada fungsi
            if(typeof filterAndSortProducts === 'function') filterAndSortProducts();
            if(typeof initDashboardData === 'function') initDashboardData();
            isSyncingFromCloud = false;
        });
    });

    // Cegat fungsi simpan lokal, lalu lempar ke cloud
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = function(key, value) {
        originalSetItem.apply(this, arguments);
        if (!isSyncingFromCloud && ['products', 'sales'].includes(key)) {
            userRef.child(key).set(JSON.parse(value));
        }
    };
}

// 6. LOGOUT
function logout() {
    auth.signOut().then(() => {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('userUid');
        localStorage.removeItem('currentRole');
        window.location.href = 'index.html';
    });
}

// 7. PROTEKSI HALAMAN (Taruh di dashboard.html dll)
function checkAuth() {
    if(!localStorage.getItem('userUid')) {
        window.location.href = 'index.html';
    } else {
        mulaiSinkronisasiCloud();
    }
}
