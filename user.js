// ===== USER OFFLINE =====

// Ambil semua user
function getUsers() {
    return JSON.parse(localStorage.getItem('users') || '[]');
}

// Simpan user
function saveUsers(users) {
    localStorage.setItem('users', JSON.stringify(users));
}

// Render daftar user di tabel
function renderUsers() {
    const list = document.getElementById('userList');
    const users = getUsers();
    list.innerHTML = users.map((u,i)=>`
        <tr>
            <td>${i+1}</td>
            <td>${u.username}</td>
            <td>******</td>
            <td>
                <button onclick="editUser(${i})">Edit Password</button>
                <button onclick="deleteUser(${i})">Hapus</button>
            </td>
        </tr>
    `).join('');
}

// Tambah user baru
function addUser() {
    const username = document.getElementById('newUser').value.trim();
    const password = document.getElementById('newPass').value;
    if(!username || !password){
        alert('Username dan password harus diisi!');
        return;
    }
    const users = getUsers();
    if(users.some(u=>u.username === username)){
        alert('Username sudah ada!');
        return;
    }
    users.push({username, password});
    saveUsers(users);
    renderUsers();
    document.getElementById('newUser').value = '';
    document.getElementById('newPass').value = '';
}

// Edit password user
function editUser(index) {
    const users = getUsers();
    const user = users[index];
    const newPass = prompt(`Ganti password untuk ${user.username}:`, user.password);
    if(newPass){
        user.password = newPass;
        saveUsers(users);
        renderUsers();
    }
}

// Hapus user
function deleteUser(index) {
    const users = getUsers();
    if(confirm(`Hapus user ${users[index].username}?`)){
        users.splice(index,1);
        saveUsers(users);
        renderUsers();
    }
}

// Inisialisasi
document.addEventListener('DOMContentLoaded', renderUsers);
