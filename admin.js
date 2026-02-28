// ===== ADMIN JS =====

// Ambil semua user dari localStorage
function getUsers() {
    return JSON.parse(localStorage.getItem('users') || '[]');
}

// Simpan user ke localStorage
function saveUsers(users) {
    localStorage.setItem('users', JSON.stringify(users));
}

// Render tabel user
function renderUsers() {
    const users = getUsers();
    const tbody = document.getElementById('userList');
    tbody.innerHTML = users.map((u,i)=>`
        <tr>
            <td>${i+1}</td>
            <td>${u.username}</td>
            <td>******</td>
            <td>
                <button class="edit" onclick="editUser(${i})">Edit Password</button>
                <button class="delete" onclick="deleteUser(${i})">Hapus</button>
            </td>
        </tr>
    `).join('');
}

// Tambah user baru
function addUser() {
    const username = document.getElementById('newUser').value.trim();
    const password = document.getElementById('newPass').value;
    if(!username || !password){ alert('Username dan password harus diisi!'); return; }

    const users = getUsers();
    if(users.some(u=>u.username===username)){ alert('Username sudah ada!'); return; }

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
