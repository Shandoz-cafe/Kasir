function loadUsers() {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    document.getElementById('userList').innerHTML = users.map((u, i) => `<tr><td>${i+1}</td><td>${u.username}</td><td><span style="background:#1e3c72;color:white;padding:3px 8px;border-radius:5px;font-size:0.8rem;">${u.role||'kasir'}</span></td><td><button class="danger" style="padding:5px 10px;font-size:0.8rem;" onclick="deleteUser(${i})">Hapus</button></td></tr>`).join('');
}
function addUser() {
    const user = document.getElementById('newUsername').value.trim(), pass = document.getElementById('newPassword').value, role = document.getElementById('newRole').value;
    if(!user || !pass) return alert('Wajib isi!');
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    if(users.find(u => u.username === user)) return alert('Username terpakai!');
    users.push({username:user, password:pass, role:role}); localStorage.setItem('users', JSON.stringify(users));
    document.getElementById('newUsername').value = ''; document.getElementById('newPassword').value = ''; loadUsers();
}
function deleteUser(index) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    if(users[index].username === localStorage.getItem('currentUser')) return alert('Tidak bisa hapus akun sendiri!');
    if(confirm('Hapus?')) { users.splice(index, 1); localStorage.setItem('users', JSON.stringify(users)); loadUsers(); }
}
if(document.getElementById('userList')) { document.addEventListener('DOMContentLoaded', loadUsers); }
