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

// === FUNGSI BARU: MINTA GANTI PASSWORD VIA EMAIL ===
function requestPasswordReset() {
    // Kalau dia lagi di dalam aplikasi (sudah login)
    const currentUser = auth.currentUser;
    let emailTarget = currentUser ? currentUser.email : null;
    
    // Kalau dia lagi di luar (halaman depan) atau ga kedeteksi
    if (!emailTarget) {
        emailTarget = prompt("Masukkan Email akun Shandoz POS Anda untuk mereset Password:");
    } else {
        const confirmReset = confirm("Kirim link ganti sandi ke email Anda (" + emailTarget + ") ?");
        if(!confirmReset) return;
    }

    if(!emailTarget) return;

    auth.sendPasswordResetEmail(emailTarget).then(() => {
        alert("🔒 Berhasil! Tautan aman untuk mengganti password telah dikirim ke " + emailTarget + ". Silakan cek kotak masuk atau folder spam Anda.");
    }).catch(err => {
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
