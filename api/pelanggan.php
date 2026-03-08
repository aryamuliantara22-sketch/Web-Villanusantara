<?php
/**
 * WE Villa Nusantara - API Pelanggan (CRUD)
 * Endpoint: /api/pelanggan.php
 *
 * GET    /api/pelanggan.php          → Daftar semua pelanggan
 * GET    /api/pelanggan.php?id=1     → Detail pelanggan
 * POST   /api/pelanggan.php          → Tambah pelanggan
 * PUT    /api/pelanggan.php?id=1     → Update pelanggan
 * DELETE /api/pelanggan.php?id=1     → Hapus pelanggan
 */

require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$id     = isset($_GET['id']) ? (int)$_GET['id'] : null;
$db     = getDB();

// ── GET ──────────────────────────────────────────────────────
if ($method === 'GET') {
    if ($id) {
        $stmt = $db->prepare(
            "SELECT p.*, COUNT(t.id) AS total_transaksi
             FROM pelanggan p
             LEFT JOIN transaksi t ON t.pelanggan_id = p.id
             WHERE p.id = ?
             GROUP BY p.id"
        );
        $stmt->bind_param('i', $id);
        $stmt->execute();
        $row = $stmt->get_result()->fetch_assoc();
        $stmt->close();
        if (!$row) respond(false, null, 'Pelanggan tidak ditemukan.', 404);
        respond(true, $row);
    }

    $search = clean($_GET['search'] ?? '');
    $sql    = "SELECT p.*, COUNT(t.id) AS total_transaksi
               FROM pelanggan p
               LEFT JOIN transaksi t ON t.pelanggan_id = p.id
               WHERE 1=1";
    $params = [];
    $types  = '';

    if ($search) {
        $sql    .= " AND (p.nama LIKE ? OR p.email LIKE ? OR p.hp LIKE ?)";
        $like    = "%$search%";
        $params  = [$like, $like, $like];
        $types   = 'sss';
    }
    $sql .= " GROUP BY p.id ORDER BY p.id DESC";

    $stmt = $db->prepare($sql);
    if ($types) $stmt->bind_param($types, ...$params);
    $stmt->execute();
    $rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    $stmt->close();
    respond(true, $rows);
}

// ── POST ─────────────────────────────────────────────────────
if ($method === 'POST') {
    $body   = getBody();
    $nama   = clean($body['nama']   ?? '');
    $email  = clean($body['email']  ?? '');
    $hp     = clean($body['hp']     ?? '');
    $ktp    = clean($body['ktp']    ?? '');
    $alamat = clean($body['alamat'] ?? '');

    if (!$nama || !$email || !$hp) {
        respond(false, null, 'Field nama, email, dan HP wajib diisi.', 400);
    }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        respond(false, null, 'Format email tidak valid.', 400);
    }

    // Cek duplikasi email
    $chk = $db->prepare("SELECT id FROM pelanggan WHERE email = ? LIMIT 1");
    $chk->bind_param('s', $email);
    $chk->execute();
    if ($chk->get_result()->num_rows > 0) {
        respond(false, null, 'Email sudah terdaftar.', 409);
    }
    $chk->close();

    $stmt = $db->prepare("INSERT INTO pelanggan (nama,email,hp,ktp,alamat) VALUES (?,?,?,?,?)");
    $stmt->bind_param('sssss', $nama, $email, $hp, $ktp, $alamat);
    if (!$stmt->execute()) {
        respond(false, null, 'Gagal menyimpan: ' . $stmt->error, 500);
    }
    $newId = $stmt->insert_id;
    $stmt->close();

    $stmt2 = $db->prepare("SELECT * FROM pelanggan WHERE id = ?");
    $stmt2->bind_param('i', $newId);
    $stmt2->execute();
    $row = $stmt2->get_result()->fetch_assoc();
    $stmt2->close();

    respond(true, $row, 'Pelanggan berhasil ditambahkan.', 201);
}

// ── PUT ──────────────────────────────────────────────────────
if ($method === 'PUT') {
    if (!$id) respond(false, null, 'ID wajib disertakan.', 400);

    $body   = getBody();
    $nama   = clean($body['nama']   ?? '');
    $email  = clean($body['email']  ?? '');
    $hp     = clean($body['hp']     ?? '');
    $ktp    = clean($body['ktp']    ?? '');
    $alamat = clean($body['alamat'] ?? '');

    if (!$nama || !$email || !$hp) {
        respond(false, null, 'Field nama, email, dan HP wajib diisi.', 400);
    }

    // Cek duplikasi email (selain id ini sendiri)
    $chk = $db->prepare("SELECT id FROM pelanggan WHERE email = ? AND id != ? LIMIT 1");
    $chk->bind_param('si', $email, $id);
    $chk->execute();
    if ($chk->get_result()->num_rows > 0) {
        respond(false, null, 'Email sudah digunakan pelanggan lain.', 409);
    }
    $chk->close();

    $stmt = $db->prepare("UPDATE pelanggan SET nama=?,email=?,hp=?,ktp=?,alamat=? WHERE id=?");
    $stmt->bind_param('sssssi', $nama, $email, $hp, $ktp, $alamat, $id);
    if (!$stmt->execute()) {
        respond(false, null, 'Gagal update: ' . $stmt->error, 500);
    }
    $stmt->close();

    $stmt2 = $db->prepare("SELECT * FROM pelanggan WHERE id = ?");
    $stmt2->bind_param('i', $id);
    $stmt2->execute();
    $row = $stmt2->get_result()->fetch_assoc();
    $stmt2->close();

    respond(true, $row, 'Pelanggan berhasil diperbarui.');
}

// ── DELETE ───────────────────────────────────────────────────
if ($method === 'DELETE') {
    if (!$id) respond(false, null, 'ID wajib disertakan.', 400);

    $chk = $db->prepare("SELECT COUNT(*) AS n FROM transaksi WHERE pelanggan_id=? AND status NOT IN ('Selesai','Batal')");
    $chk->bind_param('i', $id);
    $chk->execute();
    $count = (int)$chk->get_result()->fetch_assoc()['n'];
    $chk->close();

    if ($count > 0) {
        respond(false, null, 'Pelanggan tidak bisa dihapus, masih ada transaksi aktif.', 409);
    }

    $stmt = $db->prepare("DELETE FROM pelanggan WHERE id=?");
    $stmt->bind_param('i', $id);
    if (!$stmt->execute()) respond(false, null, 'Gagal hapus: ' . $stmt->error, 500);
    $stmt->close();
    respond(true, null, 'Pelanggan berhasil dihapus.');
}

respond(false, null, 'Method tidak didukung.', 405);
