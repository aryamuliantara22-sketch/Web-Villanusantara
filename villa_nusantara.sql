-- ============================================================
-- WE Villa Nusantara - Database Schema & Seed Data
-- Untuk: phpMyAdmin / MySQL (XAMPP)
-- Versi: 1.0.0
-- ============================================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+07:00";

-- Buat database
CREATE DATABASE IF NOT EXISTS `villa_nusantara`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `villa_nusantara`;

-- ============================================================
-- TABEL: users (Admin login)
-- ============================================================
CREATE TABLE IF NOT EXISTS `users` (
  `id`         INT(11)      NOT NULL AUTO_INCREMENT,
  `username`   VARCHAR(50)  NOT NULL UNIQUE,
  `password`   VARCHAR(255) NOT NULL COMMENT 'bcrypt hash',
  `nama`       VARCHAR(100) NOT NULL,
  `role`       ENUM('superadmin','admin') NOT NULL DEFAULT 'admin',
  `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Password: admin123 (bcrypt)
INSERT INTO `users` (`username`, `password`, `nama`, `role`) VALUES
('admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Administrator', 'superadmin');

-- ============================================================
-- TABEL: villas
-- ============================================================
CREATE TABLE IF NOT EXISTS `villas` (
  `id`          INT(11)       NOT NULL AUTO_INCREMENT,
  `kode`        VARCHAR(20)   NOT NULL UNIQUE,
  `nama`        VARCHAR(100)  NOT NULL,
  `lokasi`      VARCHAR(150)  NOT NULL,
  `kapasitas`   INT(11)       NOT NULL DEFAULT 1,
  `harga`       DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `fasilitas`   TEXT,
  `deskripsi`   TEXT,
  `status`      ENUM('Tersedia','Disewa','Maintenance') NOT NULL DEFAULT 'Tersedia',
  `created_at`  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `villas` (`kode`,`nama`,`lokasi`,`kapasitas`,`harga`,`fasilitas`,`deskripsi`,`status`) VALUES
('VL-001','Villa Nirwana Ubud','Ubud, Bali',8,2800000.00,'WiFi, AC, Private Pool, Sarapan Pagi, Taman Tropis, Dapur','Villa mewah di jantung Ubud dikelilingi hutan tropis dan sawah hijau yang menenangkan jiwa.','Tersedia'),
('VL-002','Villa Karang Seminyak','Seminyak, Bali',10,4500000.00,'WiFi, AC, Kolam Renang, Akses Pantai, Bar, BBQ, Butler Service','Villa premium tepi pantai Seminyak dengan pemandangan sunset yang spektakuler dan akses langsung ke pasir putih.','Disewa'),
('VL-003','Villa Danau Beratan','Bedugul, Bali',6,1900000.00,'WiFi, AC, Teras Danau, Perahu Kayak, Dapur Lengkap, Fireplace','Villa romantis di tepi Danau Beratan dengan suasana berkabut nan sejuk, cocok untuk bulan madu dan rekreasi keluarga.','Tersedia'),
('VL-004','Villa Sawah Tegalalang','Tegalalang, Bali',4,1500000.00,'WiFi, Infinity Pool, Sarapan Pagi, Yoga Deck, Sepeda Gratis','Villa minimalis modern dengan infinity pool menghadap langsung terasering sawah Tegalalang yang ikonik.','Tersedia');

-- ============================================================
-- TABEL: pelanggan
-- ============================================================
CREATE TABLE IF NOT EXISTS `pelanggan` (
  `id`          INT(11)      NOT NULL AUTO_INCREMENT,
  `nama`        VARCHAR(100) NOT NULL,
  `email`       VARCHAR(150) NOT NULL UNIQUE,
  `hp`          VARCHAR(20)  NOT NULL,
  `ktp`         VARCHAR(20)  DEFAULT NULL,
  `alamat`      TEXT,
  `created_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `pelanggan` (`nama`,`email`,`hp`,`ktp`,`alamat`) VALUES
('Budi Santoso','budi.santoso@gmail.com','081234567890','3174012345678901','Jl. Merdeka No. 12, Jakarta Selatan'),
('Siti Rahayu','siti.rahayu@yahoo.com','082345678901','3578023456789012','Jl. Melati No. 5, Surabaya'),
('Andi Wijaya','andi.wijaya@outlook.com','083456789012','3271034567890123','Jl. Pahlawan No. 88, Bandung'),
('Dewi Lestari','dewi.lestari@gmail.com','085678901234','5171045678901234','Jl. Sudirman No. 20, Denpasar'),
('Riko Prasetyo','riko.prasetyo@gmail.com','087890123456','3578056789012345','Jl. Ahmad Yani No. 45, Malang');

-- ============================================================
-- TABEL: transaksi
-- ============================================================
CREATE TABLE IF NOT EXISTS `transaksi` (
  `id`           INT(11)       NOT NULL AUTO_INCREMENT,
  `no_trx`       VARCHAR(30)   NOT NULL UNIQUE,
  `pelanggan_id` INT(11)       NOT NULL,
  `villa_id`     INT(11)       NOT NULL,
  `checkin`      DATE          NOT NULL,
  `checkout`     DATE          NOT NULL,
  `durasi`       INT(11)       NOT NULL DEFAULT 1 COMMENT 'Jumlah malam',
  `total`        DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `pembayaran`   ENUM('Transfer Bank','Tunai','QRIS','Kartu Kredit') NOT NULL DEFAULT 'Transfer Bank',
  `status`       ENUM('Pending','Konfirmasi','Selesai','Batal') NOT NULL DEFAULT 'Pending',
  `catatan`      TEXT,
  `created_at`   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_pelanggan` (`pelanggan_id`),
  INDEX `idx_villa`     (`villa_id`),
  INDEX `idx_status`    (`status`),
  CONSTRAINT `fk_trx_pelanggan` FOREIGN KEY (`pelanggan_id`) REFERENCES `pelanggan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_trx_villa`     FOREIGN KEY (`villa_id`)     REFERENCES `villas`(`id`)    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `transaksi` (`no_trx`,`pelanggan_id`,`villa_id`,`checkin`,`checkout`,`durasi`,`total`,`pembayaran`,`status`,`catatan`) VALUES
('TRX-2025-0001',1,1,'2025-06-01','2025-06-04',3,8400000.00,'Transfer Bank','Selesai','Tamu VIP, siapkan buah selamat datang dan karangan bunga.'),
('TRX-2025-0002',2,2,'2025-07-10','2025-07-14',4,18000000.00,'QRIS','Selesai','Paket honeymoon, siapkan dekorasi kamar romantis.'),
('TRX-2025-0003',3,3,'2025-08-05','2025-08-08',3,5700000.00,'Transfer Bank','Konfirmasi','Rombongan keluarga, butuh extra matress untuk 2 anak.'),
('TRX-2025-0004',4,4,'2025-09-15','2025-09-18',3,4500000.00,'Kartu Kredit','Pending','Menunggu konfirmasi pembayaran dari tamu.'),
('TRX-2025-0005',5,1,'2025-10-20','2025-10-24',4,11200000.00,'Transfer Bank','Konfirmasi','Tamu repeat, berikan welcome drink gratis.');

-- ============================================================
-- VIEW: v_transaksi_detail (untuk laporan)
-- ============================================================
CREATE OR REPLACE VIEW `v_transaksi_detail` AS
SELECT
  t.id,
  t.no_trx,
  p.nama    AS nama_pelanggan,
  p.email   AS email_pelanggan,
  p.hp      AS hp_pelanggan,
  v.kode    AS kode_villa,
  v.nama    AS nama_villa,
  v.lokasi  AS lokasi_villa,
  t.checkin,
  t.checkout,
  t.durasi,
  t.total,
  t.pembayaran,
  t.status,
  t.catatan,
  t.created_at
FROM `transaksi` t
JOIN `pelanggan` p ON p.id = t.pelanggan_id
JOIN `villas`    v ON v.id = t.villa_id;

-- ============================================================
-- VIEW: v_dashboard_stats
-- ============================================================
CREATE OR REPLACE VIEW `v_dashboard_stats` AS
SELECT
  (SELECT COUNT(*) FROM villas)    AS total_villa,
  (SELECT COUNT(*) FROM pelanggan) AS total_pelanggan,
  (SELECT COUNT(*) FROM transaksi) AS total_transaksi,
  (SELECT COALESCE(SUM(total),0) FROM transaksi WHERE status IN ('Selesai','Konfirmasi')) AS total_pendapatan;
