<?php
/**
 * WE Villa Nusantara - API Villa (CRUD)
 * Endpoint: /api/villas.php
 *
 * GET    /api/villas.php          → Daftar semua villa
 * GET    /api/villas.php?id=1     → Detail villa
 * POST   /api/villas.php          → Tambah villa
 * PUT    /api/villas.php?id=1     → Update villa
 * DELETE /api/villas.php?id=1     → Hapus villa
 */

require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$id     = isset($_GET['id']) ? (int)$_GET['id'] : null;
$db     = getDB();

// ── GET: Ambil data villa ────────────────────────────────────
if ($method === 'GET') {
    if ($id) {
        $stmt = $db->prepare("SELECT * FROM villas WHERE id = ?");
        $stmt->bind_param('i', $id);
        $stmt->execute();
        $row = $stmt->get_result()->fetch_assoc();
        $stmt->close();
        if (!$row) respond(false, null, 'Villa tidak ditemukan.', 404);
        respond(true, $row);
    }

    $search = clean($_GET['search'] ?? '');
    $status = clean($_GET['status'] ?? '');

    $sql    = "SELECT * FROM villas WHERE 1=1";
    $params = [];
    $types  = '';

    if ($search) {
        $sql    .= " AND (nama LIKE ? OR lokasi LIKE ?)";
        $like    = "%$search%";
        $params  = array_merge($params, [$like, $like]);
        $types  .= 'ss';
    }
    if ($status) {
        $sql    .= " AND status = ?";
        $params[] = $status;
        $types   .= 's';
    }
    $sql .= " ORDER BY id DESC";

    $stmt = $db->prepare($sql);
    if ($types) $stmt->bind_param($types, ...$params);
    $stmt->execute();
    $rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    $stmt->close();
    respond(true, $rows);
}

// ── POST: Tambah villa ───────────────────────────────────────
if ($method === 'POST') {
    $body = getBody();

    $nama      = clean($body['nama']      ?? '');
    $lokasi    = clean($body['lokasi']    ?? '');
    $kapasitas = (int)($body['kapasitas'] ?? 0);
    $harga     = (float)($body['harga']   ?? 0);
    $fasilitas = clean($body['fasilitas'] ?? '');
    $deskripsi = clean($body['deskripsi'] ?? '');
    $status    = clean($body['status']    ?? 'Tersedia');

    if (!$nama || !$lokasi || !$kapasitas || !$harga) {
        respond(false, null, 'Field nama, lokasi, kapasitas, dan harga wajib diisi.', 400);
    }

    // Generate kode villa unik
    $res  = $db->query("SELECT COUNT(*)+1 AS n FROM villas");
    $n    = (int)($res->fetch_assoc()['n']);
    $kode = 'VL-' . str_pad($n, 3, '0', STR_PAD_LEFT);

    $stmt = $db->prepare(
        "INSERT INTO villas (kode,nama,lokasi,kapasitas,harga,fasilitas,deskripsi,status)
         VALUES (?,?,?,?,?,?,?,?)"
    );
    $stmt->bind_param('sssidsss', $kode, $nama, $lokasi, $kapasitas, $harga, $fasilitas, $deskripsi, $status);

    if (!$stmt->execute()) {
        respond(false, null, 'Gagal menyimpan: ' . $stmt->error, 500);
    }
    $newId = $stmt->insert_id;
    $stmt->close();

    $stmt2 = $db->prepare("SELECT * FROM villas WHERE id = ?");
    $stmt2->bind_param('i', $newId);
    $stmt2->execute();
    $row = $stmt2->get_result()->fetch_assoc();
    $stmt2->close();

    respond(true, $row, 'Villa berhasil ditambahkan.', 201);
}

// ── PUT: Update villa ────────────────────────────────────────
if ($method === 'PUT') {
    if (!$id) respond(false, null, 'ID villa wajib disertakan.', 400);

    $body = getBody();

    $nama      = clean($body['nama']      ?? '');
    $lokasi    = clean($body['lokasi']    ?? '');
    $kapasitas = (int)($body['kapasitas'] ?? 0);
    $harga     = (float)($body['harga']   ?? 0);
    $fasilitas = clean($body['fasilitas'] ?? '');
    $deskripsi = clean($body['deskripsi'] ?? '');
    $status    = clean($body['status']    ?? 'Tersedia');

    if (!$nama || !$lokasi || !$kapasitas || !$harga) {
        respond(false, null, 'Field nama, lokasi, kapasitas, dan harga wajib diisi.', 400);
    }

    $stmt = $db->prepare(
        "UPDATE villas SET nama=?,lokasi=?,kapasitas=?,harga=?,fasilitas=?,deskripsi=?,status=?
         WHERE id=?"
    );
    $stmt->bind_param('ssidsssi', $nama, $lokasi, $kapasitas, $harga, $fasilitas, $deskripsi, $status, $id);

    if (!$stmt->execute()) {
        respond(false, null, 'Gagal update: ' . $stmt->error, 500);
    }
    $stmt->close();

    $stmt2 = $db->prepare("SELECT * FROM villas WHERE id = ?");
    $stmt2->bind_param('i', $id);
    $stmt2->execute();
    $row = $stmt2->get_result()->fetch_assoc();
    $stmt2->close();

    respond(true, $row, 'Villa berhasil diperbarui.');
}

// ── DELETE: Hapus villa ──────────────────────────────────────
if ($method === 'DELETE') {
    if (!$id) respond(false, null, 'ID villa wajib disertakan.', 400);

    // Cek ada transaksi aktif
    $chk  = $db->prepare("SELECT COUNT(*) AS n FROM transaksi WHERE villa_id=? AND status NOT IN ('Selesai','Batal')");
    $chk->bind_param('i', $id);
    $chk->execute();
    $count = (int)$chk->get_result()->fetch_assoc()['n'];
    $chk->close();

    if ($count > 0) {
        respond(false, null, 'Villa tidak bisa dihapus karena masih ada transaksi aktif.', 409);
    }

    $stmt = $db->prepare("DELETE FROM villas WHERE id=?");
    $stmt->bind_param('i', $id);
    if (!$stmt->execute()) {
        respond(false, null, 'Gagal hapus: ' . $stmt->error, 500);
    }
    $stmt->close();
    respond(true, null, 'Villa berhasil dihapus.');
}

respond(false, null, 'Method tidak didukung.', 405);
