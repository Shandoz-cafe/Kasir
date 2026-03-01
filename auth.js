const scriptApp = document.createElement('script');
scriptApp.src = "https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js";
document.head.appendChild(scriptApp);

scriptApp.onload = () => {
    const scriptDb = document.createElement('script');
    scriptDb.src = "https://www.gstatic.com/firebasejs/8.10.1/firebase-database.js";
    document.head.appendChild(scriptDb);
    scriptDb.onload = () => mulaiSinkronisasiCloud();
};

let isSyncingFromCloud = false;

function mulaiSinkronisasiCloud() {
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
    const db = firebase.database();

    db.ref('/').once('value').then((snapshot) => {
        if (!snapshot.val() || !snapshot.val().users) {
            db.ref('/').set({
                users: JSON.parse(localStorage.getItem('users') || '[{"username":"admin","pin":"1234","role":"admin"}]'),
                products: JSON.parse(localStorage.getItem('products') || '[]'),
                sales: JSON.parse(localStorage.getItem('sales') || '[]')
            });
        }
        
        db.ref('/').on('value', (snap) => {
            isSyncingFromCloud = true;
            const data = snap.val() || {};
            localStorage.setItem('users', JSON.stringify(data.users || []));
            localStorage.setItem('products', JSON.stringify(data.products || []));
            localStorage.setItem('sales', JSON.stringify(data.sales || []));
            
            if(typeof filterAndSortProducts === 'function') filterAndSortProducts();
            if(typeof loadProducts === 'function') loadProducts();
            isSyncingFromCloud = false;
        });
    });

    const originalSetItem = localStorage.setItem;
    localStorage.setItem = function(key, value) {
        originalSetItem.apply(this, arguments);
        if (!isSyncingFromCloud && ['users', 'products', 'sales'].includes(key)) {
            db.ref(key).set(JSON.parse(value));
        }
    };
}

function logout() {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('currentRole');
    window.location.href = 'index.html';
}

function checkAuth() {
    if(!localStorage.getItem('currentUser')) window.location.href = 'index.html';
}
