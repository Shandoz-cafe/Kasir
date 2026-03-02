// === 1. CONFIG FIREBASE BOS (WAJIB DIGANTI SAMA KODE DARI GOOGLE) ===
const firebaseConfig = {
    apiKey: "API_KEY_KAMU",
    authDomain: "PROJECT_ID.firebaseapp.com",
    databaseURL: "https://PROJECT_ID-default-rtdb.firebaseio.com",
    projectId: "PROJECT_ID",
    storageBucket: "PROJECT_ID.appspot.com",
    messagingSenderId: "SENDER_ID",
    appId: "APP_ID"
};

// Inisialisasi Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.database();

// === 2. MESIN SINKRONISASI OTOMATIS (CLOUD SYNC HACK) ===
// Ini adalah kode rahasia yang akan mencegat setiap kali aplikasi menyimpan data di HP, 
// dan sepersekian detik kemudian langsung menembakkannya ke Cloud Firebase!
const originalSetItem = localStorage.setItem;
localStorage.setItem = function(key, value) {
    // 1. Simpan di memori lokal HP biar aplikasi tetap ngebut
    originalSetItem.apply(this, arguments); 
    
    // 2. Langsung Backup ke Awan!
    const user = auth.currentUser;
    if (user && ['products', 'sales', 'users', 'storeName', 'storeLogo', 'printerSettings'].includes(key)) {
        db.ref('ShandozPOS/' + user.uid + '/' + key).set(value)
          .catch(err => console.error("Gagal backup ke awan: ", err));
    }
};

// === 3. FUNGSI PENGECEKAN LOGIN & TARIK DATA OTOMATIS ===
function checkAuth() {
    auth.onAuthStateChanged((user) => {
        const path = window.location.pathname;
        const isIndex = path.endsWith('index.html') || path === '/';

        if (user) {
            // BEGITU LOGIN: Sedot kembali semua data dari Cloud ke HP baru/website!
            db.ref('ShandozPOS/' + user.uid).once('value').then((snapshot) => {
                if (snapshot.exists()) {
                    const cloudData = snapshot.val();
                    // Pulihkan data tanpa memicu upload ulang
                    if(cloudData.products) originalSetItem.call(localStorage, 'products', cloudData.products);
                    if(cloudData.sales) originalSetItem.call(localStorage, 'sales', cloudData.sales);
                    if(cloudData.users) originalSetItem.call(localStorage, 'users', cloudData.users);
                    if(cloudData.storeName) originalSetItem.call(localStorage, 'storeName', cloudData.storeName);
                    if(cloudData.storeLogo) originalSetItem.call(localStorage, 'storeLogo', cloudData.storeLogo);
                    if(cloudData.printerSettings) originalSetItem.call(localStorage, 'printerSettings', cloudData.printerSettings);
                }
                
                // Kalau lagi di halaman login, pindahkan ke pilih profil
                if (isIndex) window.location.href = 'profiles.html';
            }).catch(error => {
                console.error("Gagal narik data:", error);
                if (isIndex) window.location.href = 'profiles.html'; // Tetap masuk walau offline
            });

        } else {
            // Kalau belum login, lempar ke depan
            if (!isIndex) window.location.href = 'index.html';
        }
    });
}

// === 4. FUNGSI LOGIN & DAFTAR ===
function loginWithEmail() {
    const email = document.getElementById('loginEmail').value;
    const pass = document.getElementById('loginPass').value;
    if(!email || !pass) return alert("Email dan Sandi wajib diisi!");
    
    const loader = document.getElementById('loader');
    if(loader) loader.style.display = 'flex';
    
    auth.signInWithEmailAndPassword(email, pass).catch((error) => {
        if(loader) loader.style.display = 'none';
        alert("Gagal Masuk: " + error.message);
    });
}

function registerWithEmail() {
    const name = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;
    const pass = document.getElementById('regPass').value;
    if(!name || !email || !pass) return alert("Isi semua data!");

    const loader = document.getElementById('loader');
    if(loader) loader.style.display = 'flex';

    auth.createUserWithEmailAndPassword(email, pass).then((userCredential) => {
        // Bikin Profil Owner Default & Langsung tembak ke Cloud lewat setItem hack
        const defaultUser = [{ id: 'admin_'+Date.now(), name: name, role: 'admin', pin: 'SETUP' }];
        localStorage.setItem('users', JSON.stringify(defaultUser));
    }).catch((error) => {
        if(loader) loader.style.display = 'none';
        alert("Gagal Daftar: " + error.message);
    });
}

function loginWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).catch((error) => alert("Gagal Google Login: " + error.message));
}

// === 5. FUNGSI LOGOUT (SEKARANG SUDAH AMAN) ===
function logout() {
    if(confirm("Yakin ingin keluar dari sistem?")) {
        auth.signOut().then(() => {
            localStorage.clear(); // Aman dibersihkan dari HP karena data sudah tersimpan di Awan
            window.location.href = 'index.html';
        });
    }
}
