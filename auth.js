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

// === LEM SUPER FIREBASE ===
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

// === UPDATE: PENAMBAHAN EMAIL SAMBUTAN & VERIFIKASI ===
function registerWithEmail() {
    const name = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;
    const pass = document.getElementById('regPass').value;
    if(!name || !email || !pass) return alert("Harap isi semua kolom!");
    
    showLoader(true);
    auth.createUserWithEmailAndPassword(email, pass).then((userCred) => {
        userCred.user.updateProfile({ displayName: name }).then(() => {
            // FIREBASE OTOMATIS NGIRIM EMAIL SAMBUTAN & LINK VERIFIKASI
            userCred.user.sendEmailVerification().then(() => {
                alert("Pendaftaran Berhasil! Email sambutan & link verifikasi telah dikirim ke " + email + ".");
                handleSuccessfulLogin(userCred.user);
            }).catch(e => {
                console.log("Gagal kirim email sambutan", e);
                handleSuccessfulLogin(userCred.user);
            });
        });
    }).catch((error) => { showLoader(false); alert("Gagal Daftar: " + error.message); });
}

function loginWithGoogle() {
    showLoader(true);
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).then((result) => handleSuccessfulLogin(result.user))
        .catch((error) => { showLoader(false); alert("Gagal Login Google: " + error.message); });
}

// === FUNGSI BARU: MINTA GANTI PASSWORD VIA EMAIL (ANTI-GHOSTING) ===
function requestPasswordReset() {
    // 1. Coba intip apakah Bos sudah ngetik email di kolom login
    const loginInput = document.getElementById('loginEmail');
    let emailTarget = loginInput ? loginInput.value.trim() : "";

    // 2. Kalau kolom isiannya kosong, paksa Bos ketik manual
    if (!emailTarget) {
        emailTarget = prompt("Masukkan Alamat Email akun Anda untuk mereset kata sandi:");
    } else {
        // Kalau udah ngetik di kolom login, konfirmasi dulu biar ga salah kirim
        const confirmReset = confirm("Kirim link ganti sandi ke email: " + emailTarget + " ?");
        if (!confirmReset) return;
    }

    // Kalau Bos klik Batal atau ngosongin isian, hentikan proses
    if (!emailTarget) return;

    showLoader(true);
    auth.sendPasswordResetEmail(emailTarget).then(() => {
        showLoader(false);
        alert("🔒 Berhasil! Tautan aman untuk mengganti kata sandi telah dikirim ke " + emailTarget + ". Silakan cek kotak masuk atau folder spam Anda.");
    }).catch(err => {
        showLoader(false);
        alert("Gagal mengirim email: " + err.message);
    });
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

// === MESIN SINKRONISASI CLOUD ===
function mulaiSinkronisasiCloud() {
    const uid = localStorage.getItem('userUid');
    if (!uid) return;
    const userRef = db.ref('ShandozPOS/' + uid);

    userRef.on('value', (snap) => {
        isSyncingFromCloud = true; 
        const data = snap.val() || {};

        let usersData = data.users;
        if (!usersData || usersData === '[]' || (Array.isArray(usersData) && usersData.length === 0)) {
            const ownerName = localStorage.getItem('currentUser') || "Owner";
            const defaultArray = [{ id: 'owner_1', name: ownerName, role: 'admin', pin: 'SETUP' }];
            usersData = JSON.stringify(defaultArray);
            userRef.child('users').set(usersData); 
        }

        const cloudKeys = ['products', 'sales', 'users', 'expenses', 'storeName', 'storeLogo', 'printerSettings'];
        
        cloudKeys.forEach(key => {
            let val = (key === 'users' && !data.users) ? usersData : data[key];
            if (val !== undefined) {
                if (typeof val === 'object') {
                    if (['products', 'sales', 'users', 'expenses'].includes(key) && !Array.isArray(val)) {
                        val = Object.values(val); 
                    }
                    localStorage.setItem(key, JSON.stringify(val));
                } else {
                    localStorage.setItem(key, val);
                }
            }
        });

        if (!localStorage.getItem('products')) localStorage.setItem('products', '[]');
        if (!localStorage.getItem('sales')) localStorage.setItem('sales', '[]');
        if (!localStorage.getItem('expenses')) localStorage.setItem('expenses', '[]');
        if (!localStorage.getItem('users')) localStorage.setItem('users', '[]');

        if(typeof filterAndSortProducts === 'function') filterAndSortProducts();
        if(typeof initDashboardData === 'function') initDashboardData();
        if(typeof renderProfiles === 'function') renderProfiles();
        if(typeof loadFinanceReports === 'function') loadFinanceReports();

        isSyncingFromCloud = false; 
    });

    const originalSetItem = localStorage.setItem;
    localStorage.setItem = function(key, value) {
        originalSetItem.apply(this, arguments);
        const cloudKeys = ['products', 'sales', 'users', 'expenses', 'storeName', 'storeLogo', 'printerSettings'];
        
        if (!isSyncingFromCloud && cloudKeys.includes(key)) {
            userRef.child(key).set(value).catch(e => console.error(e));
        }
    };
}

// === FUNGSI CEK OTENTIKASI ===
function checkAuth() {
    const path = window.location.pathname;
    const isIndex = path.endsWith('index.html') || path.endsWith('/Kasir/') || path === '/' || path.includes('index');
    const savedUid = localStorage.getItem('userUid');

    if (isIndex && savedUid) {
        localStorage.removeItem('currentRole'); 
        window.location.replace('profiles.html');
        return;
    }

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
            if (savedUid) localStorage.clear(); 
            if (!isIndex) window.location.replace('index.html');
        }
    });
}

window.addEventListener('pageshow', function (event) {
    if (event.persisted) checkAuth();
});
