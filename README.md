# WE Villa Nusantara — Admin System
## Panduan Instalasi & Penggunaan

---

## Struktur Proyek

```
villa_nusantara/          ← Folder ini → letakkan di htdocs XAMPP
├── index.html            ← Halaman utama aplikasi
├── assets/
│   ├── css/
│   │   └── style.css     ← Stylesheet minimalis hijau
│   └── js/
│       └── app.js        ← Logika JavaScript (API calls)
└── api/
    ├── config.php        ← Konfigurasi koneksi database
    ├── auth.php          ← API login/logout/session
    ├── villas.php        ← API CRUD villa
    ├── pelanggan.php     ← API CRUD pelanggan
    └── transaksi.php     ← API CRUD transaksi
```

---

## Langkah Instalasi

### 1. Import Database ke phpMyAdmin
1. Buka browser → `http://localhost/phpmyadmin`
2. Klik **"Import"** di menu atas
3. Pilih file `villa_nusantara.sql` (dari folder `xampp/`)
4. Klik **"Go"** / **"Kirim"**
5. Database `villa_nusantara` akan otomatis terbuat beserta tabelnya

### 2. Letakkan Folder di XAMPP htdocs
1. Salin folder `villa_nusantara/` ini ke:
   - **Windows:** `C:\xampp\htdocs\`
   - **Mac/Linux:** `/Applications/XAMPP/htdocs/`
2. Pastikan XAMPP **Apache** dan **MySQL** sudah aktif

### 3. Konfigurasi Database (jika diperlukan)
Edit file `api/config.php`:
```php
define('DB_HOST', 'localhost');   // Biasanya tidak perlu diubah
define('DB_USER', 'root');        // Ganti jika pakai user lain
define('DB_PASS', '');            // Isi jika MySQL ada password
define('DB_NAME', 'villa_nusantara');
```

### 4. Akses Aplikasi
Buka browser → `http://localhost/villa_nusantara`

---

## Login
| Field    | Value     |
|----------|-----------|
| Username | `admin`   |
| Password | `admin123`|

---

## Fitur Aplikasi
- **Dashboard** — Statistik villa, pelanggan, transaksi, pendapatan
- **Kelola Villa** — Tambah, edit, hapus, cari villa
- **Kelola Pelanggan** — Tambah, edit, hapus, cari pelanggan
- **Kelola Transaksi** — Tambah, edit, hapus, hitung total otomatis

---

## Teknologi
- **Frontend:** HTML5, CSS3, JavaScript (Vanilla)
- **Backend:** PHP 7.4+ (MySQLi)
- **Database:** MySQL 5.7+ / MariaDB
- **Server:** XAMPP (Apache + MySQL)
