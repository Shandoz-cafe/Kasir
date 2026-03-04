// === KAMUS PINTAR VIREXON ===
const translations = {
    id: {
        // Dashboard & Sidebar
        "dash_welcome": "Halo, {name}! 👋",
        "dash_sub": "Selamat datang di VIREXON Enterprise Command Center. Semua fitur telah dibuka penuh.",
        "dash_income": "Pendapatan Hari Ini",
        "dash_tickets": "Total Tiket",
        "dash_apps": "Aplikasi Utama",
        "app_pos": "KASIR (POS)",
        "app_inv": "GUDANG / MENU",
        "app_rep": "LAPORAN KEUANGAN",
        "app_proc": "PENGADAAN & OPNAME",
        
        "side_pos": "<i>🛒</i> Penjualan (POS)",
        "side_history": "<i>🧾</i> Riwayat Struk",
        "side_inv": "<i>📦</i> Data Barang",
        "side_proc": "<i>📋</i> Stock Opname & PO",
        "side_rep": "<i>📊</i> Back Office (Laporan)",
        "side_set": "<i>⚙️</i> Pengaturan Toko",
        "side_info": "<i>ℹ️</i> Dukungan & Info",
        "side_logout": "<i>🛑</i> Keluar Sistem",

        // Global (Tombol Kembali)
        "btn_back_dash": "⬅️ Dashboard",
        "btn_back_only": "⬅ Kembali",

        // Kasir (POS)
        "pos_title": "<span style='color:#10b981;'>●</span> POS KASIR",
        "pos_history_btn": "🕒 Riwayat",
        "pos_search_ph": "🔍 Cari menu...",
        "pos_all_cat": "Semua Kategori",
        "pos_cust_ph": "Nama Pelanggan",
        "pos_pay_text": "Bayar (Rp):",
        "pos_change_text": "Kembali: ",
        "pos_btn_charge": "BAYAR",

        // Procurement & Opname
        "proc_title": "📋 Procurement & PO",
        "proc_lock_title": "Area Terbatas Manajemen",
        "proc_lock_desc": "Masukkan PIN Keamanan Owner untuk mengakses menu Pengadaan & Opname.",
        "proc_btn_unlock": "Buka Kunci 🔓",
        "proc_warn_title": "Area Khusus Manajemen (GA / Owner)",
        "proc_warn_desc": "Gunakan modul ini untuk menyesuaikan stok fisik (Opname) dan merencanakan daftar belanja.",
        "proc_opname_title": "📦 Audit Fisik / Stock Opname",
        "proc_btn_refresh": "🔄 Refresh",
        "proc_po_title": "📝 Buat Daftar Belanja (Purchase Order)",
        "proc_lbl_item": "Nama Barang / Bahan",
        "proc_ph_item": "Contoh: Biji Kopi Arabica",
        "proc_lbl_cat": "Kategori",
        "proc_cat_bahan": "Bahan Baku (F&B)",
        "proc_cat_pack": "Packaging",
        "proc_cat_alat": "Peralatan (Asset)",
        "proc_cat_bersih": "Alat Kebersihan",
        "proc_cat_lain": "Lainnya",
        "proc_lbl_qty": "Jumlah (Qty)",
        "proc_lbl_unit": "Satuan",
        "proc_lbl_price": "Estimasi Harga Satuan",
        "proc_est_sub": "Estimasi Subtotal: ",
        "proc_btn_add": "➕ Masukkan ke Daftar",
        "proc_est_grand": "Grand Total Estimasi: ",
        "proc_btn_save": "📄 SIMPAN & CETAK DOKUMEN PO (PDF)",
        "proc_history_title": "📂 Riwayat Dokumen PO",
        "proc_ph_search": "🔍 Cari No. Ref PO...",
        "proc_btn_reset": "Reset",

        // Pengaturan
        "set_title": "⚙️ Pengaturan Sistem",
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
        // Dashboard & Sidebar
        "dash_welcome": "Hello, {name}! 👋",
        "dash_sub": "Welcome to VIREXON Enterprise Command Center. All features are fully unlocked.",
        "dash_income": "Today's Income",
        "dash_tickets": "Total Tickets",
        "dash_apps": "Main Applications",
        "app_pos": "CASHIER (POS)",
        "app_inv": "INVENTORY / MENU",
        "app_rep": "FINANCIAL REPORTS",
        "app_proc": "PROCUREMENT & OPNAME",
        
        "side_pos": "<i>🛒</i> Sales (POS)",
        "side_history": "<i>🧾</i> Receipt History",
        "side_inv": "<i>📦</i> Inventory Data",
        "side_proc": "<i>📋</i> Stock Opname & PO",
        "side_rep": "<i>📊</i> Back Office (Reports)",
        "side_set": "<i>⚙️</i> Store Settings",
        "side_info": "<i>ℹ️</i> Support & Info",
        "side_logout": "<i>🛑</i> Logout System",

        // Global (Tombol Kembali)
        "btn_back_dash": "⬅️ Dashboard",
        "btn_back_only": "⬅ Back",

        // Kasir (POS)
        "pos_title": "<span style='color:#10b981;'>●</span> POS CASHIER",
        "pos_history_btn": "🕒 History",
        "pos_search_ph": "🔍 Search menu...",
        "pos_all_cat": "All Categories",
        "pos_cust_ph": "Customer Name",
        "pos_pay_text": "Pay (Rp):",
        "pos_change_text": "Change: ",
        "pos_btn_charge": "CHARGE",

        // Procurement & Opname
        "proc_title": "📋 Procurement & PO",
        "proc_lock_title": "Management Restricted Area",
        "proc_lock_desc": "Enter Owner Security PIN to access Procurement & Opname menu.",
        "proc_btn_unlock": "Unlock 🔓",
        "proc_warn_title": "Management Exclusive Area (GA / Owner)",
        "proc_warn_desc": "Use this module to adjust physical stock (Opname) and plan shopping lists.",
        "proc_opname_title": "📦 Physical Audit / Stock Opname",
        "proc_btn_refresh": "🔄 Refresh",
        "proc_po_title": "📝 Create Shopping List (Purchase Order)",
        "proc_lbl_item": "Item / Material Name",
        "proc_ph_item": "Example: Arabica Coffee Beans",
        "proc_lbl_cat": "Category",
        "proc_cat_bahan": "Raw Material (F&B)",
        "proc_cat_pack": "Packaging",
        "proc_cat_alat": "Equipment (Asset)",
        "proc_cat_bersih": "Cleaning Supplies",
        "proc_cat_lain": "Others",
        "proc_lbl_qty": "Quantity (Qty)",
        "proc_lbl_unit": "Unit",
        "proc_lbl_price": "Estimated Unit Price",
        "proc_est_sub": "Estimated Subtotal: ",
        "proc_btn_add": "➕ Add to List",
        "proc_est_grand": "Estimated Grand Total: ",
        "proc_btn_save": "📄 SAVE & PRINT PO DOCUMENT (PDF)",
        "proc_history_title": "📂 PO Document History",
        "proc_ph_search": "🔍 Search PO Ref No...",
        "proc_btn_reset": "Reset",

        // Pengaturan
        "set_title": "⚙️ System Settings",
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

    // 1. Ganti teks biasa (innerHTML)
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

    // 2. Ganti teks di dalam input box (placeholder)
    document.querySelectorAll('[data-i18n-ph]').forEach(el => {
        const key = el.getAttribute('data-i18n-ph');
        if (dict[key]) {
            el.placeholder = dict[key];
        }
    });
}

// Terapkan bahasa otomatis saat halaman dimuat
document.addEventListener('DOMContentLoaded', applyLanguage);
