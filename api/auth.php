<?php
/**
 * WE Villa Nusantara - API Auth (Login / Logout / Session)
 * Endpoint: /api/auth.php
 */

require_once 'config.php';
session_start();

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// ── POST /api/auth.php?action=login ─────────────────────────
if ($method === 'POST' && $action === 'login') {
    $body     = getBody();
    $username = clean($body['username'] ?? '');
    $password = $body['password'] ?? '';

    if (!$username || !$password) {
        respond(false, null, 'Username dan password wajib diisi.', 400);
    }

    $db   = getDB();
    $stmt = $db->prepare("SELECT id, username, password, nama, role FROM users WHERE username = ? LIMIT 1");
    $stmt->bind_param('s', $username);
    $stmt->execute();
    $result = $stmt->get_result();
    $user   = $result->fetch_assoc();
    $stmt->close();

    // Cek password — support bcrypt hash ATAU plain 'admin123' untuk demo
    $valid = false;
    if ($user) {
        if (password_verify($password, $user['password'])) {
            $valid = true;
        } elseif ($password === 'admin123' && $username === 'admin') {
            // Fallback demo: plain password
            $valid = true;
        }
    }

    if (!$valid) {
        respond(false, null, 'Username atau password salah.', 401);
    }

    // Simpan sesi
    $_SESSION['user_id']   = $user['id'];
    $_SESSION['username']  = $user['username'];
    $_SESSION['nama']      = $user['nama'];
    $_SESSION['role']      = $user['role'];

    respond(true, [
        'id'       => $user['id'],
        'username' => $user['username'],
        'nama'     => $user['nama'],
        'role'     => $user['role'],
    ], 'Login berhasil.');
}

// ── POST /api/auth.php?action=logout ────────────────────────
if ($method === 'POST' && $action === 'logout') {
    session_destroy();
    respond(true, null, 'Logout berhasil.');
}

// ── GET /api/auth.php?action=check ──────────────────────────
if ($method === 'GET' && $action === 'check') {
    if (!empty($_SESSION['user_id'])) {
        respond(true, [
            'id'       => $_SESSION['user_id'],
            'username' => $_SESSION['username'],
            'nama'     => $_SESSION['nama'],
            'role'     => $_SESSION['role'],
        ], 'Session aktif.');
    } else {
        respond(false, null, 'Belum login.', 401);
    }
}

respond(false, null, 'Endpoint tidak ditemukan.', 404);
