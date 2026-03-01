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

function showLoader(show) {
    const loader = document.getElementById('loader');
    if(loader) loader.style.display = show ? 'flex' : 'none';
}

function loginWithGoogle() {
    showLoader(true);
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).then((result) => handleSuccessfulLogin(result.user))
        .catch((error) => { showLoader(false); alert("Gagal Login Google: " + error.message); });
}

function registerWithEmail() {
    const name = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;
    const pass = document.getElementById('regPass').value;
    if(!name || !email || !pass) return alert("Harap isi semua kolom!");
    if(pass.length < 6) return alert("Sandi minimal 6 karakter!");
    showLoader(true);
    auth.createUserWithEmailAndPassword(email, pass).then((userCred) => {
        userCred.user.updateProfile({ displayName: name }).then(() => handleSuccessfulLogin(userCred.user));
    }).catch((error) => { showLoader(false); alert("Gagal Daftar: " + error.message); });
}

function loginWithEmail() {
    const email = document.getElementById('loginEmail').value;
    const pass = document.getElementById('loginPass').value;
    if(!email || !pass) return alert("Masukkan Email dan Sandi!");
    showLoader(true);
    auth.signInWithEmailAndPassword(email, pass).then((userCred) => handleSuccessfulLogin(userCred.user))
        .catch((error) => { showLoader(false); alert("Gagal Login: Email atau sandi salah."); });
}

function handleSuccessfulLogin(user) {
    localStorage.setItem('userUid', user.uid); 
    // ARAHKAN KE LAYAR PILIH AKUN (NETFLIX STYLE)
    window.location.href = 'profiles.html';
}

function mulaiSinkronisasiCloud() {
    const uid = localStorage.getItem('userUid');
    if (!uid) return;
    const userRef = db.ref('tenants/' + uid);

    userRef.once('value').then((snapshot) => {
        if (!snapshot.val()) {
            // JIKA AKUN BARU, BUATKAN PIN DEFAULT OWNER: 1234
            userRef.set({
                users: [{id: 'owner_1', name: "Owner / Admin", role: "admin", pin: "1234"}],
                products: JSON.parse(localStorage.getItem('products') || '[]'),
                sales: JSON.parse(localStorage.getItem('sales') || '[]')
            });
        }
        
        userRef.on('value', (snap) => {
            isSyncingFromCloud = true;
            const data = snap.val() || {};
            localStorage.setItem('users', JSON.stringify(data.users || []));
            localStorage.setItem('products', JSON.stringify(data.products || []));
            localStorage.setItem('sales', JSON.stringify(data.sales || []));
            
            if(typeof filterAndSortProducts === 'function') filterAndSortProducts();
            if(typeof initDashboardData === 'function') initDashboardData();
            if(typeof renderProfiles === 'function') renderProfiles();
            if(typeof renderUserList === 'function') renderUserList();
            isSyncingFromCloud = false;
        });
    });

    const originalSetItem = localStorage.setItem;
    localStorage.setItem = function(key, value) {
        originalSetItem.apply(this, arguments);
        if (!isSyncingFromCloud && ['products', 'sales', 'users'].includes(key)) {
            userRef.child(key).set(JSON.parse(value));
        }
    };
}

function logout() {
    auth.signOut().then(() => {
        localStorage.clear();
        window.location.href = 'index.html';
    });
}

function checkAuth() {
    if(!localStorage.getItem('userUid')) {
        window.location.href = 'index.html';
    } else {
        mulaiSinkronisasiCloud();
        // Cegah masuk dashboard jika belum masukin PIN Profil
        if(!localStorage.getItem('currentRole') && !window.location.href.includes('profiles.html')) {
            window.location.href = 'profiles.html';
        }
    }
}
