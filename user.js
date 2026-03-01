function loadUsers() {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    document.getElementById('userList').innerHTML = users.map((u, i) => `
        <tr>
            <td>${i+1}</td>
            <td><strong style="font-size: 1.1rem; color: #2c3e50;">${u.username}</strong></td>
            <td><span style="background:#1e3c72;color:white;padding:3px 8px;border-radius:5px;font-size:0.8rem;text-transform:uppercase;">${u.role||'kasir'}</span></td>
            <td style="letter-spacing:2px; font-weight:bold; color:#e74c3c;">${u.pin}</td>
            <td><button class="danger" style="padding:6px 12px; border-radius:8px;" onclick="deleteUser(${i})">🗑️ Hapus</button></td>
        </tr>
    `).join('');
}

function addUser() {
    const user = document.getElementById('newUsername').value.trim();
    const pin = document.getElementById('newPin').value;
    const role = document.getElementById('newRole').value;
    
    if(!user || pin.length !== 4) return alert('Wajib isi Nama dan buat PIN 4 Angka!');
    
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    if(users.find(u => u.username.toLowerCase() === user.toLowerCase())) return alert('Nama ini sudah terpakai, gunakan nama lain!');
    
    users.push({username:user, pin:pin, role:role}); 
    localStorage.setItem('users', JSON.stringify(users));
    
    document.getElementById('newUsername').value = ''; 
    document.getElementById('newPin').value = ''; 
    loadUsers();
    
    alert(`Pengguna [${user}] berhasil ditambahkan!`);
}

function deleteUser(index) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    if(users[index].username === localStorage.getItem('currentUser')) return alert('Tidak bisa hapus akun Anda sendiri saat sedang login!');
    
    if(confirm(`Yakin ingin MENGHAPUS pengguna [${users[index].username}] secara permanen?`)) { 
        users.splice(index, 1); 
        localStorage.setItem('users', JSON.stringify(users)); 
        loadUsers(); 
    }
}

if(document.getElementById('userList')) { document.addEventListener('DOMContentLoaded', loadUsers); }
