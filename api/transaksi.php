<?php
/**
 * WE Villa Nusantara - API Transaksi (CRUD)
 * Endpoint: /api/transaksi.php
 *
 * GET    /api/transaksi.php          → Daftar semua transaksi
 * GET    /api/transaksi.php?id=1     → Detail transaksi
 * POST   /api/transaksi.php          → Tambah transaksi
 * PUT    /api/transaksi.php?id=1     → Update transaksi
 * DELETE /api/transaksi.php?id=1     → Hapus transaksi
 * GET    /api/transaksi.php?action=stats → Statistik dashboard
 */

require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$id     = isset($_GET['id'])     ? (int)$_GET['id'] : null;
$action = clean($_GET['action'] ?? '');
$db     = getDB();

// ── GET: Stats dashboard ─────────────────────────────────────
if ($method === 'GET' && $action === 'stats') {
    $row = $db->query("SELECT * FROM v_dashboard_stats")->fetch_assoc();
    respond(true, $row);
}

// ── GET: Detail / Daftar ─────────────────────────────────────
if ($method === 'GET') {
    if ($id) {
        $stmt = $db->prepare("SELECT * FROM v_transaksi_detail WHERE id = ?");
        $stmt->bind_param('i', $id);
        $stmt->execute();
        $row = $stmt->get_result()->fetch_assoc();
        $stmt->close();
        if (!$row) respond(false, null, 'Transaksi tidak ditemukan.', 404);
        respond(true, $row);
    }

    $search = clean($_GET['search'] ?? '');
    $status = clean($_GET['status'] ?? '');
    $sql    = "SELECT * FROM v_transaksi_detail WHERE 1=1";
    $params = [];
    $types  = '';

    if ($search) {
        $sql   .= " AND (no_trx LIKE ? OR nama_pelanggan LIKE ? OR nama_villa LIKE ?)";
        $like   = "%$search%";
        $params = array_merge($params, [$like, $like, $like]);
        $types .= 'sss';
    }
    if ($status) {
        $sql   .= " AND status = ?";
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

// ── POST: Tambah transaksi ───────────────────────────────────
if ($method === 'POST') {
    $body        = getBody();
    $pelangganId = (int)($body['pelanggan_id'] ?? 0);
    $villaId     = (int)($body['villa_id']     ?? 0);
    $checkin     = clean($body['checkin']      ?? '');
    $checkout    = clean($body['checkout']     ?? '');
    $pembayaran  = clean($body['pembayaran']   ?? 'Transfer Bank');
    $status      = clean($body['status']       ?? 'Pending');
    $catatan     = clean($body['catatan']      ?? '');

    if (!$pelangganId || !$villaId || !$checkin || !$checkout) {
        respond(false, null, 'Field pelanggan, villa, checkin, checkout wajib diisi.', 400);
    }

    $dtIn  = new DateTime($checkin);
    $dtOut = new DateTime($checkout);
    if ($dtOut <= $dtIn) {
        respond(false, null, 'Tanggal checkout harus setelah checkin.', 400);
    }
    $durasi = (int)$dtIn->diff($dtOut)->days;

    // Ambil harga villa
    $vStmt = $db->prepare("SELECT harga FROM villas WHERE id = ?");
    $vStmt->bind_param('i', $villaId);
    $vStmt->execute();
    $villa = $vStmt->get_result()->fetch_assoc();
    $vStmt->close();
    if (!$villa) respond(false, null, 'Villa tidak ditemukan.', 404);

    $total = $durasi * (float)$villa['harga'];

    // Generate nomor transaksi
    $res   = $db->query("SELECT COUNT(*)+1 AS n FROM transaksi");
    $n     = (int)$res->fetch_assoc()['n'];
    $noTrx = 'TRX-' . date('Y') . '-' . str_pad($n, 4, '0', STR_PAD_LEFT);

    $stmt = $db->prepare(
        "INSERT INTO transaksi (no_trx,pelanggan_id,villa_id,checkin,checkout,durasi,total,pembayaran,status,catatan)
         VALUES (?,?,?,?,?,?,?,?,?,?)"
    );
    $stmt->bind_param('siissidss s', $noTrx, $pelangganId, $villaId, $checkin, $checkout, $durasi, $total, $pembayaran, $status, $catatan);
    // fix: rebind
    $stmt->close();
    $stmt = $db->prepare(
        "INSERT INTO transaksi (no_trx,pelanggan_id,villa_id,checkin,checkout,durasi,total,pembayaran,status,catatan)
         VALUES (?,?,?,?,?,?,?,?,?,?)"
    );
    $stmt->bind_param('siissidss' . 's', $noTrx, $pelangganId, $villaId, $checkin, $checkout, $durasi, $total, $pembayaran, $status, $catatan);
    $stmt->close();

    // Gunakan query langsung untuk keamanan
    $noTrxE     = $db->real_escape_string($noTrx);
    $checkinE   = $db->real_escape_string($checkin);
    $checkoutE  = $db->real_escape_string($checkout);
    $pembE      = $db->real_escape_string($pembayaran);
    $statusE    = $db->real_escape_string($status);
    $catatanE   = $db->real_escape_string($catatan);

    $sql = "INSERT INTO transaksi (no_trx,pelanggan_id,villa_id,checkin,checkout,durasi,total,pembayaran,status,catatan)
            VALUES ('$noTrxE',$pelangganId,$villaId,'$checkinE','$checkoutE',$durasi,$total,'$pembE','$statusE','$catatanE')";

    if (!$db->query($sql)) {
        respond(false, null, 'Gagal menyimpan: ' . $db->error, 500);
    }
    $newId = $db->insert_id;

    $stmt2 = $db->prepare("SELECT * FROM v_transaksi_detail WHERE id = ?");
    $stmt2->bind_param('i', $newId);
    $stmt2->execute();
    $row = $stmt2->get_result()->fetch_assoc();
    $stmt2->close();

    respond(true, $row, 'Transaksi berhasil ditambahkan.', 201);
}

// ── PUT: Update transaksi ────────────────────────────────────
if ($method === 'PUT') {
    if (!$id) respond(false, null, 'ID wajib disertakan.', 400);

    $body        = getBody();
    $pelangganId = (int)($body['pelanggan_id'] ?? 0);
    $villaId     = (int)($body['villa_id']     ?? 0);
    $checkin     = clean($body['checkin']      ?? '');
    $checkout    = clean($body['checkout']     ?? '');
    $pembayaran  = clean($body['pembayaran']   ?? 'Transfer Bank');
    $status      = clean($body['status']       ?? 'Pending');
    $catatan     = clean($body['catatan']      ?? '');

    if (!$pelangganId || !$villaId || !$checkin || !$checkout) {
        respond(false, null, 'Field wajib tidak boleh kosong.', 400);
    }

    $dtIn  = new DateTime($checkin);
    $dtOut = new DateTime($checkout);
    $durasi = (int)$dtIn->diff($dtOut)->days;

    $vStmt = $db->prepare("SELECT harga FROM villas WHERE id = ?");
    $vStmt->bind_param('i', $villaId);
    $vStmt->execute();
    $villa = $vStmt->get_result()->fetch_assoc();
    $vStmt->close();
    $total = $durasi * (float)($villa['harga'] ?? 0);

    $stmt = $db->prepare(
        "UPDATE transaksi SET pelanggan_id=?,villa_id=?,checkin=?,checkout=?,durasi=?,total=?,pembayaran=?,status=?,catatan=?
         WHERE id=?"
    );
    $stmt->bind_param('iissidsssi', $pelangganId, $villaId, $checkin, $checkout, $durasi, $total, $pembayaran, $status, $catatan, $id);
    if (!$stmt->execute()) respond(false, null, 'Gagal update: ' . $stmt->error, 500);
    $stmt->close();

    $stmt2 = $db->prepare("SELECT * FROM v_transaksi_detail WHERE id = ?");
    $stmt2->bind_param('i', $id);
    $stmt2->execute();
    $row = $stmt2->get_result()->fetch_assoc();
    $stmt2->close();

    respond(true, $row, 'Transaksi berhasil diperbarui.');
}

// ── DELETE ───────────────────────────────────────────────────
if ($method === 'DELETE') {
    if (!$id) respond(false, null, 'ID wajib disertakan.', 400);
    $stmt = $db->prepare("DELETE FROM transaksi WHERE id=?");
    $stmt->bind_param('i', $id);
    if (!$stmt->execute()) respond(false, null, 'Gagal hapus: ' . $stmt->error, 500);
    $stmt->close();
    respond(true, null, 'Transaksi berhasil dihapus.');
}

respond(false, null, 'Method tidak didukung.', 405);
