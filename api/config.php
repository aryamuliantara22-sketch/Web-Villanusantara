<?php
/**
 * WE Villa Nusantara - Konfigurasi Database
 * Hubungkan ke XAMPP / phpMyAdmin
 */

define('DB_HOST',     'localhost');
define('DB_USER',     'root');       // Ganti jika pakai user lain
define('DB_PASS',     '');           // Ganti jika ada password MySQL
define('DB_NAME',     'villa_nusantara');
define('DB_CHARSET',  'utf8mb4');

// ── Koneksi MySQLi ──────────────────────────────────────────
function getDB(): mysqli {
    static $conn = null;
    if ($conn === null) {
        $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
        if ($conn->connect_error) {
            http_response_code(500);
            die(json_encode([
                'success' => false,
                'message' => 'Koneksi database gagal: ' . $conn->connect_error
            ]));
        }
        $conn->set_charset(DB_CHARSET);
    }
    return $conn;
}

// ── CORS & JSON Header ──────────────────────────────────────
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// ── Helper: Ambil JSON body dari request ────────────────────
function getBody(): array {
    $raw = file_get_contents('php://input');
    return $raw ? (json_decode($raw, true) ?? []) : [];
}

// ── Helper: Kirim respons JSON ──────────────────────────────
function respond(bool $success, mixed $data = null, string $msg = '', int $code = 200): void {
    http_response_code($code);
    echo json_encode([
        'success' => $success,
        'message' => $msg,
        'data'    => $data,
    ], JSON_UNESCAPED_UNICODE);
    exit();
}

// ── Sanitasi input ──────────────────────────────────────────
function clean(string $str): string {
    return htmlspecialchars(strip_tags(trim($str)), ENT_QUOTES, 'UTF-8');
}
