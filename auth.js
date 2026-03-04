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

// =========================================================================
// === MESIN INJEKSI CUSTOM DIALOG GLOBAL (OTOMATIS MUNCUL DI SEMUA HALAMAN) ===
// =========================================================================
document.addEventListener('DOMContentLoaded', () => {
    // 1. Injeksi CSS Otomatis
    if (!document.getElementById('customDialogStyle')) {
        const style = document.createElement('style');
        style.id = 'customDialogStyle';
        style.innerHTML = `
            .custom-dialog-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(15, 23, 42, 0.7); z-index: 999999; display: none; justify-content: center; align-items: center; backdrop-filter: blur(5px); }
            .custom-dialog-box { background: white; width: 90%; max-width: 340px; border-radius: 20px; padding: 25px 20px; text-align: center; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); transform: scale(0.9); animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
            @keyframes popIn { to { transform: scale(1); } }
            .dialog-icon { font-size: 45px; margin-bottom: 10px; line-height: 1; }
            .dialog-title { color: #0f172a; font-size: 18px; font-weight: 700; margin-bottom: 8px; }
            .dialog-message { color: #475569; font-size: 13px; margin-bottom: 25px; line-height: 1.5; }
            .dialog-actions { display: flex; gap: 10px; justify-content: center; }
            .btn-dialog { flex: 1; padding: 12px; border-radius: 12px; font-weight: 600; font-size: 14px; border: none; cursor: pointer; transition: 0.2s; }
            .btn-dialog:active { transform: scale(0.95); }
            .btn-dialog-ok { background: #3b82f6; color: white; }
            .btn-dialog-cancel { background: #f1f5f9; color: #475569; }
            @media print { .custom-dialog-overlay { display: none !important; } }
        `;
        document.head.appendChild(style);
    }

    // 2. Injeksi HTML Otomatis
    if (!document.getElementById('customDialog')) {
        const dialogHTML = `
        <div class="custom-dialog-overlay" id="customDialog">
            <div class="custom-dialog-box">
                <div class="dialog-icon" id="dialogIcon">⚠️</div>
                <div class="dialog-title" id="dialogTitle">Peringatan</div>
                <div class="dialog-message" id="dialogMessage">Pesan error di sini.</div>
                <div class="dialog-actions">
                    <button class="btn-dialog btn-dialog-cancel" id="btnDialogCancel" style="display: none;">Batal</button>
                    <button class="btn-dialog btn-dialog-ok" id="btnDialogOk">OK</button>
                </div>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', dialogHTML);
    }
});

// FUNGSI PEMANGGIL GLOBAL
let dialogCallback = null;

window.customAlert = function(message, title="Pemberitahuan", icon="ℹ️") {
    const dlg = document.getElementById('customDialog');
    if(!dlg) return alert(message); // Fallback darurat

    document.getElementById('dialogIcon').innerText = icon;
    document.getElementById('dialogTitle').innerText = title;
    document.getElementById('dialogMessage').innerHTML = message;
    document.getElementById('btnDialogCancel').style.display = 'none';
    
    let btnOk = document.getElementById('btnDialogOk');
    btnOk.innerText = "Oke Mengerti";
    btnOk.style.background = "#3b82f6";
    btnOk.style.color = "white";
    
    btnOk.onclick = () => { dlg.style.display = 'none'; };
    dlg.style.display = 'flex';
};

window.customConfirm = function(message, callback, title="Konfirmasi", icon="⚠️") {
    const dlg = document.getElementById('customDialog');
    if(!dlg) { if(confirm(message)) callback(); return; }

    document.getElementById('dialogIcon').innerText = icon;
    document.getElementById('dialogTitle').innerText = title;
    document.getElementById('dialogMessage').innerHTML = message;
    document.getElementById('btnDialogCancel').style.display = 'block';
    
    let btnOk = document.getElementById('btnDialogOk');
    btnOk.innerText = "Ya, Lanjutkan";
    btnOk.style.background = "#10b981"; // Hijau
    btnOk.style.color = "white";
    
    dialogCallback = callback;
    
    btnOk.onclick = () => {
        dlg.style.display = 'none';
        if(dialogCallback) dialogCallback();
    };
    
    document.getElementById('btnDialogCancel').onclick = () => {
        dlg.style.display = 'none';
    };
    
    dlg.style.display = 'flex';
};
// =========================================================================

function showLoader(show) {
    const loader = document.getElementById('loader');
    if(loader) loader.style.display = show ? 'flex' : 'none';
}

function loginWithEmail() {
    const email = document.getElementById('loginEmail').value;
    const pass = document.getElementById('loginPass').value;
    if(!email || !pass) return customAlert("Masukkan Email dan Sandi yang valid!", "Peringatan", "📝");
    
    showLoader(true);
    auth.signInWithEmailAndPassword(email, pass)
        .then((userCred) => handleSuccessfulLogin(userCred.user))
        .catch((error) => { showLoader(false); customAlert("Gagal Login: " + error.message, "Error", "❌"); });
}

function registerWithEmail() {
    const name = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;
    const pass = document.getElementById('regPass').value;
    if(!name || !email || !pass) return customAlert("Harap isi semua kolom pendaftaran!", "Data Tidak Lengkap", "📝");
    
    showLoader(true);
    auth.createUserWithEmailAndPassword(email, pass).then((userCred) => {
        userCred.user.updateProfile({ displayName: name }).then(() => {
            userCred.user.sendEmailVerification().then(() => {
                customAlert("Pendaftaran Berhasil! Email verifikasi telah dikirim.", "Sukses", "🎉");
                handleSuccessfulLogin(userCred.user);
            }).catch(e => {
                handleSuccessfulLogin(userCred.user);
            });
        });
    }).catch((error) => { showLoader(false); customAlert("Gagal Mendaftar: " + error.message, "Pendaftaran Gagal", "❌"); });
}

function loginWithGoogle() {
    showLoader(true);
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).then((result) => handleSuccessfulLogin(result.user))
        .catch((error) => { showLoader(false); customAlert("Gagal Login dengan Google: " + error.message, "Error Google", "❌"); });
}

function requestPasswordReset() {
    const loginInput = document.getElementById('loginEmail');
    let emailTarget = loginInput ? loginInput.value.trim() : "";
    
    if (!emailTarget) {
        emailTarget = prompt("Masukkan Email Anda untuk mereset sandi:");
        if(!emailTarget) return;
        executeReset(emailTarget);
    } else {
        customConfirm("Kirim link ganti sandi ke alamat email <b>" + emailTarget + "</b> ?", () => {
            executeReset(emailTarget);
        }, "Reset Sandi", "📧");
    }

    function executeReset(email) {
        showLoader(true);
        auth.sendPasswordResetEmail(email).then(() => {
            showLoader(false);
            customAlert("Link ganti sandi telah dikirim ke email " + email, "Terkirim", "🔒");
        }).catch(err => { 
            showLoader(false); 
            customAlert("Gagal mengirim email reset: " + err.message, "Error", "❌"); 
        });
    }
}

function handleSuccessfulLogin(user) {
    localStorage.setItem('currentUser', user.displayName || user.email.split('@')[0]);
    localStorage.setItem('userUid', user.uid);
    window.location.replace('profiles.html'); 
}

function logout() {
    customConfirm("Yakin ingin keluar dari sistem kasir secara permanen?", () => {
        auth.signOut().then(() => {
            localStorage.clear();
            window.location.replace('index.html');
        });
    }, "Keluar Sistem", "🛑");
}

// === MESIN SINKRONISASI CLOUD (ULTIMATE + WATCHDOG) ===
function mulaiSinkronisasiCloud() {
    const uid = localStorage.getItem('userUid');
    if (!uid) return;
    const userRef = db.ref('ShandozPOS/' + uid);

    // 1. SEDOT DATA DARI AWAN (DOWNLOAD)
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

        const cloudKeys = ['products', 'sales', 'users', 'expenses', 'storeName', 'storeLogo', 'printerSettings', 'appLang'];
        
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

    // 2. SENSOR PINTU DEPAN (OVERRIDE LOKAL) - FIX ANTI TABRAKAN
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = function(key, value) {
        originalSetItem.apply(this, arguments);
        // Sales dan Expenses Dikeluarkan dari override massal biar nggak saling timpa
        const cloudKeys = ['products', 'users', 'storeName', 'storeLogo', 'printerSettings', 'appLang'];
        if (!isSyncingFromCloud && cloudKeys.includes(key)) {
            userRef.child(key).set(value).catch(e => console.error(e));
        }
    };

    // 3. MESIN WATCHDOG (SATPAM PATROLI TIAP 2 DETIK) - FIX ANTI TABRAKAN
    const watchKeys = ['products', 'users'];
    let lastStates = {};
    watchKeys.forEach(k => lastStates[k] = localStorage.getItem(k));

    setInterval(() => {
        if (isSyncingFromCloud) return; 
        
        watchKeys.forEach(key => {
            let currentState = localStorage.getItem(key);
            if (currentState !== lastStates[key] && currentState !== null) {
                lastStates[key] = currentState; 
                userRef.child(key).set(currentState).catch(e => console.error("Gagal Auto-Save:", e));
            }
        });
    }, 2000);
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
