// Default user auto dibuat
if (!localStorage.getItem("users")) {
    const defaultUsers = [
        { username: "shandoz", password: "shandoz88", role: "admin" }
    ];
    localStorage.setItem("users", JSON.stringify(defaultUsers));
}

function login() {
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    const users = JSON.parse(localStorage.getItem("users")) || [];

    const found = users.find(u => u.username === username && u.password === password);

    if (found) {
        localStorage.setItem("loggedInUser", JSON.stringify(found));
        alert("Login berhasil");
        window.location.href = "dashboard.html";
    } else {
        alert("Username atau password salah");
    }
}
