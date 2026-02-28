function loadSettings() {
    document.getElementById('storeNameInput').value = localStorage.getItem('storeName') || '';
    const savedLogo = localStorage.getItem('storeLogo');
    if (savedLogo) { const preview = document.getElementById('logoPreview'); preview.src = savedLogo; preview.style.display = 'inline-block'; }
}
function previewLogo(event) {
    const file = event.target.files[0];
    if (file) { const reader = new FileReader(); reader.onload = function(e) { const preview = document.getElementById('logoPreview'); preview.src = e.target.result; preview.style.display = 'inline-block'; }; reader.readAsDataURL(file); }
}
function saveSettings() {
    const newName = document.getElementById('storeNameInput').value.trim();
    if(newName) localStorage.setItem('storeName', newName);
    const previewSrc = document.getElementById('logoPreview').src;
    if (previewSrc && previewSrc.startsWith('data:image')) { localStorage.setItem('storeLogo', previewSrc); }
    alert('Pengaturan tersimpan!');
}
if(document.getElementById('storeNameInput')) { document.addEventListener('DOMContentLoaded', loadSettings); }
