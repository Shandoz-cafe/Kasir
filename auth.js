// ===================================================================
// MESIN CLOUD SHANDOZ - FIREBASE REALTIME SYNC
// ===================================================================

// 1. Memuat Sistem Firebase secara Otomatis
const scriptApp = document.createElement('script');
scriptApp.src = "https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js";
document.head.appendChild(scriptApp);

scriptApp.onload = () => {
    const scriptDb = document.createElement('script');
    scriptDb.src = "https://www.gstatic.com/firebasejs/8.10.1/firebase-database.js";
    document.head.appendChild(scriptDb);

    scriptDb.onload = () => {
        mulaiSinkronisasiCloud();
    };
};

let isSyncingFromCloud = false;

function mulaiSinkronisasiCloud() {
    // 2. Kunci Rahasia Firebase Kamu
    const firebaseConfig = {
        apiKey: "AIzaSyDWXhCZu0VcDhfKijaDZycA0Th-reUAnNg",
        authDomain: "shandoz-pos.firebaseapp.com",
        databaseURL: "https://shandoz-pos-default-rtdb.firebaseio.com",
        projectId: "shandoz-pos",
        storageBucket: "shandoz-pos.firebasestorage.app",
        messagingSenderId: "451234972920",
        appId: "1:451234972920:web:dead8905720cb55329670d"
    };

    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    const db = firebase.database();

    console.log("☁️ Terhubung ke Server SHANDOZ Cloud...");

    // 3. Proses Migrasi & Sinkronisasi
    db.ref('/').once('value').then((snapshot) => {
        const cloudData = snapshot.val();
        
        // JIKA SERVER KOSONG (Pertama Kali): Upload data dari HP ini ke Cloud!
        if (!cloudData || !cloudData.users) {
            console.log("🚀 Server kosong, mengunggah data lokal ke Cloud...");
            const localData = {
                users: JSON.parse(localStorage.getItem('users') || '[{"username":"admin","pin":"1234","role":"admin"}]'),
                products: JSON.parse(localStorage.getItem('products') || '[]'),
                sales: JSON.parse(localStorage.getItem('sales') || '[]'),
                expenses: JSON.parse(localStorage.getItem('expenses') || '[]'),
                openBills: JSON.parse(localStorage.getItem('openBills') || '[]')
            };
            db.ref('/').set(localData);
        }

        // 4. MENDENGARKAN PERUBAHAN DARI CLOUD (REAL-TIME)
        db.ref('/').on('value', (snap) => {
            isSyncingFromCloud = true; // Kunci agar tidak terjadi loop
            const data = snap.val() || {};
            
            // Timpa memori lokal dengan data terbaru dari Cloud
            localStorage.setItem('users', JSON.stringify(data.users || []));
            localStorage.setItem('products', JSON.stringify(data.products || []));
            localStorage.setItem('sales', JSON.stringify(data.sales || []));
            localStorage.setItem('expenses', JSON.stringify(data.expenses || []));
            localStorage.setItem('openBills', JSON.stringify(data.openBills || []));

            // Perbarui layar secara otomatis jika ada data yang masuk
            if(typeof filterAndSortProducts === 'function') filterAndSortProducts();
            if(typeof loadProducts === 'function') loadProducts();
            if(typeof loadFinanceReports === 'function') loadFinanceReports();
            if(typeof loadUsers === 'function') loadUsers();
            if(typeof renderLoginUsers === 'function') renderLoginUsers();

            isSyncingFromCloud = false; // Buka kunci
        });
    });

    // 5. TRIK AJAIB: Membajak fungsi simpan agar otomatis terkirim ke Server
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = function(key, value) {
        // Simpan di HP (seperti biasa)
        originalSetItem.apply(this, arguments);
        
        // JIKA BUKAN DARI PROSES SYNC, KIRIM KE CLOUD!
        if (!isSyncingFromCloud && ['users', 'products', 'sales', 'expenses', 'openBills'].includes(key)) {
            db.ref(key).set(JSON.parse(value));
        }
    };
}

// ===================================================================
// FUNGSI LOGIN & LOGOUT STANDAR
// ===================================================================
function logout() {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('currentRole');
    localStorage.removeItem('currentShift');
    window.location.href = 'index.html';
}

function checkAuth() {
    if(!localStorage.getItem('currentUser')) {
        window.location.href = 'index.html';
    }
}
