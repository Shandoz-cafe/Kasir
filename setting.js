// ===== SETTINGS OFFLINE =====

// Ambil settings dari localStorage
function getSettings() {
    return JSON.parse(localStorage.getItem('settings') || '{}');
}

// Simpan settings
function saveSettings(settings) {
    localStorage.setItem('settings', JSON.stringify(settings));
}

// Render settings ke halaman
function renderSettings() {
    const settings = getSettings();
    document.getElementById('storeName').value = settings.storeName || 'Toko Saya';
    if(settings.logo){
        document.getElementById('logoPreview').src = settings.logo;
    }
}

// Simpan setting dari input
function saveSettingChanges() {
    const storeName = document.getElementById('storeName').value.trim();
    const logoSrc = document.getElementById('logoPreview').src || '';
    const settings = {storeName, logo: logoSrc};
    saveSettings(settings);
    alert('Settings tersimpan!');
}

// Upload logo
function uploadLogo(event) {
    const file = event.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = function(e){
        document.getElementById('logoPreview').src = e.target.result;
    }
    reader.readAsDataURL(file);
}

// Inisialisasi
document.addEventListener('DOMContentLoaded', renderSettings);
