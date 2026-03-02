// === KAMUS PINTAR SHANDOZ POS ===
const translations = {
    id: {
        // Menu Atas
        "dash_info": "ℹ️ Info",
        "dash_profile": "👥 Ganti Profil",
        "dash_logout": "🛑 Keluar",
        "dash_welcome": "Halo, {name}! 👋",
        "dash_sub": "Selamat datang di Shandoz Command Center. Semua fitur telah dibuka penuh.",
        "dash_income": "Pendapatan Hari Ini",
        "dash_tickets": "Total Tiket",
        "dash_apps": "Aplikasi Utama",
        // Nama Aplikasi
        "app_pos": "KASIR (POS)",
        "app_inv": "GUDANG / MENU",
        "app_rep": "LAPORAN KEUANGAN",
        "app_set": "PENGATURAN TOKO",
        // Halaman Setting
        "set_title": "⚙️ Pengaturan Sistem",
        "set_back": "⬅️ Dashboard",
        "set_store": "🏪 Profil Usaha & Printer",
        "set_store_name": "Nama Kafe / Toko (Tampil di Struk)",
        "set_print_size": "Ukuran Kertas Printer Bluetooth",
        "set_btn_store": "💾 Simpan Pengaturan Toko",
        "set_lang_title": "🌐 Bahasa / Language",
        "set_lang_label": "Pilih Bahasa Aplikasi",
        "set_btn_lang": "💾 Simpan Bahasa",
        "set_sec_title": "🛡️ Pusat Keamanan Owner",
        "set_sec_desc1": "Perubahan PIN akan dilindungi oleh kode OTP yang dikirim otomatis ke Email Anda.",
        "set_btn_pin": "🔑 Ganti PIN Kasir Owner",
        "set_sec_desc2": "Lupa atau ingin mengganti kata sandi login Google Anda?",
        "set_btn_pass": "📧 Kirim Link Ganti Password"
    },
    en: {
        // Top Menu
        "dash_info": "ℹ️ Info",
        "dash_profile": "👥 Change Profile",
        "dash_logout": "🛑 Logout",
        "dash_welcome": "Hello, {name}! 👋",
        "dash_sub": "Welcome to Shandoz Command Center. All features are fully unlocked.",
        "dash_income": "Today's Income",
        "dash_tickets": "Total Tickets",
        "dash_apps": "Main Applications",
        // App Names
        "app_pos": "CASHIER (POS)",
        "app_inv": "INVENTORY / MENU",
        "app_rep": "FINANCIAL REPORTS",
        "app_set": "STORE SETTINGS",
        // Settings Page
        "set_title": "⚙️ System Settings",
        "set_back": "⬅️ Dashboard",
        "set_store": "🏪 Store Profile & Printer",
        "set_store_name": "Cafe / Store Name (Receipt)",
        "set_print_size": "Bluetooth Printer Paper Size",
        "set_btn_store": "💾 Save Store Settings",
        "set_lang_title": "🌐 Bahasa / Language",
        "set_lang_label": "Select App Language",
        "set_btn_lang": "💾 Save Language",
        "set_sec_title": "🛡️ Owner Security Center",
        "set_sec_desc1": "PIN changes will be protected by an OTP code sent automatically to your Email.",
        "set_btn_pin": "🔑 Change Owner PIN",
        "set_sec_desc2": "Forgot or want to change your Google login password?",
        "set_btn_pass": "📧 Send Password Reset Link"
    }
};

// Fungsi Mengganti & Menyimpan Bahasa
function setLanguage(lang) {
    localStorage.setItem('appLang', lang);
    applyLanguage();
}

// Fungsi Menerapkan Teks ke Layar
function applyLanguage() {
    const lang = localStorage.getItem('appLang') || 'id'; // Default Indonesia
    const dict = translations[lang];
    if (!dict) return;

    // Cari semua elemen yang punya label "data-i18n"
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (dict[key]) {
            // Trik khusus untuk menyisipkan nama pengguna yang dinamis
            if(dict[key].includes('{name}')) {
                const userName = localStorage.getItem('currentUser') || 'User';
                el.innerHTML = dict[key].replace('{name}', '<span id="userNameDisplay">' + userName.toUpperCase() + '</span>');
            } else {
                el.innerHTML = dict[key];
            }
        }
    });
}

// Terapkan bahasa otomatis saat halaman dimuat
document.addEventListener('DOMContentLoaded', applyLanguage);
