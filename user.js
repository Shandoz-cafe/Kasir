function loadUsers() {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    document.getElementById('userList').innerHTML = users.map((u, i) => `<tr><td>${i+1}</td><td><strong>${u.username}</strong></td><td><span style="background:#1e3c72;color:white;padding:3px 8px;border-radius:5px;font-size:0.8rem;text-transform:uppercase;">${u.role||'kasir'}</span></td><td style="letter-spacing:2px; font-weight:bold; color:#e74c3c;">${u.pin}</td><td><button class="danger" style="padding:5px 10px;font-size:0.8rem;" onclick="deleteUser(${i})">Hapus</button></td></tr>`).join('');
}
function addUser() {
    const user = document.getElementById('newUsername').value.trim();
    const pin = document.getElementById('newPin').value;
    const role = document.getElementById('newRole').value;
    if(!user || pin.length !== 4) return alert('Wajib isi Nama dan PIN 4 Angka!');
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    if(users.find(u => u.username === user)) return alert('Nama sudah terpakai!');
    users.push({username:user, pin:pin, role:role}); localStorage.setItem('users', JSON.stringify(users));
    document.getElementById('newUsername').value = ''; document.getElementById('newPin').value = ''; loadUsers();
}
function deleteUser(index) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    if(users[index].username === localStorage.getItem('currentUser')) return alert('Tidak bisa hapus akun sendiri!');
    if(confirm('Hapus akun ini?')) { users.splice(index, 1); localStorage.setItem('users', JSON.stringify(users)); loadUsers(); }
}
if(document.getElementById('userList')) { document.addEventListener('DOMContentLoaded', loadUsers); }
