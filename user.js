function loadUsers() {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const tbody = document.getElementById('userList');
    tbody.innerHTML = users.map((u, i) => `
        <tr>
            <td>${i+1}</td><td>${u.username}</td><td>${u.role || 'kasir'}</td>
            <td><button class="danger" onclick="deleteUser(${i})">Hapus</button></td>
        </tr>
    `).join('');
}

function addUser() {
    const username = document.getElementById('newUsername').value.trim();
    const password = document.getElementById('newPassword').value;
    const role = document.getElementById('newRole').value;
    
    if(!username || !password) return alert('Username dan password wajib diisi!');
    
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    if(users.find(u => u.username === username)) return alert('Username sudah dipakai!');
    
    users.push({username, password, role});
    localStorage.setItem('users', JSON.stringify(users));
    
    document.getElementById('newUsername').value = '';
    document.getElementById('newPassword').value = '';
    loadUsers();
}

function deleteUser(index) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    if(users[index].username === localStorage.getItem('currentUser')) return alert('Tidak bisa menghapus akun yang sedang dipakai!');
    
    if(confirm('Hapus user ini?')) {
        users.splice(index, 1);
        localStorage.setItem('users', JSON.stringify(users));
        loadUsers();
    }
}

if(document.getElementById('userList')) { document.addEventListener('DOMContentLoaded', loadUsers); }
