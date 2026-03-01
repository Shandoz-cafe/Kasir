// === SISTEM KEAMANAN BARU (PIN) ===
const currentUsers = JSON.parse(localStorage.getItem("users") || "[]");

// Deteksi kalau masih pakai sistem password lama, otomatis di-reset!
if (currentUsers.length === 0 || !currentUsers[0].pin) {
    localStorage.setItem("users", JSON.stringify([
        { username: "admin", pin: "1234", role: "admin" },
        { username: "kasir", pin: "0000", role: "kasir" }
    ]));
}

if (!localStorage.getItem("storeName")) {
    localStorage.setItem("storeName", "SHANDOZ Cafe & Coffee Bar");
}

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
