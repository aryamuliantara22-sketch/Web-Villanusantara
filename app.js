/**
 * WE Villa Nusantara — Admin JS
 * Terhubung ke API PHP/MySQL melalui XAMPP
 * @version 2.0.0 (PHP + MySQL Edition)
 */

// ============================================================
// CONFIG API
// ============================================================
const API = {
  BASE:       'api',
  auth:       'api/auth.php',
  villas:     'api/villas.php',
  pelanggan:  'api/pelanggan.php',
  transaksi:  'api/transaksi.php',

  /**
   * HTTP request ke API PHP
   * @param {string} url    - Endpoint
   * @param {string} method - HTTP method
   * @param {Object} body   - Request body (opsional)
   * @returns {Promise<Object>} Response JSON
   */
  async request(url, method = 'GET', body = null) {
    const opts = {
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    if (body) opts.body = JSON.stringify(body);
    try {
      const res  = await fetch(url, opts);
      const json = await res.json();
      return json;
    } catch (err) {
      console.error('API Error:', err);
      return { success: false, message: 'Gagal terhubung ke server. Pastikan XAMPP aktif.' };
    }
  },

  get:    (url)       => API.request(url, 'GET'),
  post:   (url, body) => API.request(url, 'POST',   body),
  put:    (url, body) => API.request(url, 'PUT',    body),
  delete: (url)       => API.request(url, 'DELETE'),
};

// ============================================================
// STATE
// ============================================================
const state = {
  section:        'dashboard',
  editId:         null,
  deleteCallback: null,
  villaCache:     [],   // Cache untuk dropdown
  pelangganCache: [],
};

// ============================================================
// UTILITY
// ============================================================
const Util = {
  /** Format angka ke Rupiah */
  formatRupiah(num) {
    return 'Rp ' + Number(num || 0).toLocaleString('id-ID');
  },

  /** Format tanggal ke format Indonesia */
  formatDate(str) {
    if (!str) return '—';
    const months = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
    const d = new Date(str);
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  },

  /** Hitung selisih hari */
  daysDiff(from, to) {
    if (!from || !to) return 0;
    return Math.max(0, Math.round((new Date(to) - new Date(from)) / 86400000));
  },

  /** Escape HTML */
  esc(str) {
    return String(str || '')
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  },

  /** Badge villa */
  badgeVilla(status) {
    const m = { 'Tersedia':'badge-green','Disewa':'badge-blue','Maintenance':'badge-yellow' };
    return `<span class="badge ${m[status]||'badge-gray'}">${this.esc(status)}</span>`;
  },

  /** Badge transaksi */
  badgeTrx(status) {
    const m = { 'Pending':'badge-yellow','Konfirmasi':'badge-teal','Selesai':'badge-green','Batal':'badge-red' };
    return `<span class="badge ${m[status]||'badge-gray'}">${this.esc(status)}</span>`;
  },

  /** Icon edit */
  iconEdit: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5l3 3L12 15H9v-3L18.5 2.5z"/></svg>`,

  /** Icon hapus */
  iconHapus: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>`,
};

// ============================================================
// TOAST
// ============================================================
function showToast(msg, isError = false) {
  const toast = document.getElementById('toast');
  document.getElementById('toast-msg').textContent = msg;
  toast.classList.remove('hidden','error');
  if (isError) toast.classList.add('error');
  document.getElementById('toast-icon').innerHTML = isError
    ? `<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>`
    : `<polyline points="20 6 9 17 4 12"/>`;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toast.classList.add('hidden'), 3200);
}

// ============================================================
// LOADER
// ============================================================
function setLoader(show) {
  document.getElementById('section-loader').classList.toggle('hidden', !show);
}

// ============================================================
// MODAL
// ============================================================
function openModal(id) {
  document.getElementById(id).classList.remove('hidden');
}
function closeModal(id) {
  document.getElementById(id).classList.add('hidden');
  state.editId = null;
  // Reset form inputs di dalam modal
  const modal = document.getElementById(id);
  modal.querySelectorAll('input:not([type=hidden]), select, textarea').forEach(el => el.value = '');
  // Reset hidden ID fields
  const idFields = {
    'modal-villa':     'villa-id',
    'modal-pelanggan': 'pelanggan-id',
    'modal-transaksi': 'transaksi-id',
  };
  if (idFields[id]) {
    const f = document.getElementById(idFields[id]);
    if (f) f.value = '';
  }
}

// ============================================================
// NAVIGATION
// ============================================================
function navigateTo(section) {
  state.section = section;
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));

  const btn = document.querySelector(`[data-section="${section}"]`);
  if (btn) btn.classList.add('active');
  const sec = document.getElementById(`section-${section}`);
  if (sec) sec.classList.add('active');

  const titles = { dashboard:'Dashboard', villa:'Kelola Villa', pelanggan:'Kelola Pelanggan', transaksi:'Kelola Transaksi' };
  document.getElementById('page-title').textContent = titles[section] || section;

  if (window.innerWidth <= 768) document.getElementById('sidebar').classList.remove('open');

  switch(section) {
    case 'dashboard': loadDashboard(); break;
    case 'villa':     loadVilla();     break;
    case 'pelanggan': loadPelanggan(); break;
    case 'transaksi': loadTransaksi(); break;
  }
}

// ============================================================
// DASHBOARD
// ============================================================
async function loadDashboard() {
  setLoader(true);
  try {
    // Load stats
    const stats = await API.get(`${API.transaksi}?action=stats`);
    if (stats.success && stats.data) {
      document.getElementById('stat-villa').textContent      = stats.data.total_villa      || 0;
      document.getElementById('stat-pelanggan').textContent  = stats.data.total_pelanggan  || 0;
      document.getElementById('stat-transaksi').textContent  = stats.data.total_transaksi  || 0;
      document.getElementById('stat-pendapatan').textContent = Util.formatRupiah(stats.data.total_pendapatan || 0);
    }

    // Load transaksi terbaru
    const trxRes = await API.get(`${API.transaksi}`);
    const tbody  = document.getElementById('dashboard-transaksi-body');
    if (trxRes.success && trxRes.data.length > 0) {
      tbody.innerHTML = trxRes.data.slice(0, 5).map(t => `
        <tr>
          <td>${Util.esc(t.no_trx)}</td>
          <td>${Util.esc(t.nama_pelanggan)}</td>
          <td>${Util.esc(t.nama_villa)}</td>
          <td>${Util.formatRupiah(t.total)}</td>
          <td>${Util.badgeTrx(t.status)}</td>
        </tr>`).join('');
    } else {
      tbody.innerHTML = `<tr><td colspan="5" class="empty-row">Belum ada transaksi</td></tr>`;
    }

    // Load status villa
    const villaRes = await API.get(API.villas);
    const avList   = document.getElementById('villa-availability-list');
    if (villaRes.success && villaRes.data.length > 0) {
      avList.innerHTML = villaRes.data.map(v => `
        <div class="availability-item">
          <span class="availability-name">${Util.esc(v.nama)}</span>
          ${Util.badgeVilla(v.status)}
        </div>`).join('');
    } else {
      avList.innerHTML = `<p class="empty-text">Belum ada villa</p>`;
    }
  } catch(e) {
    showToast('Gagal memuat dashboard', true);
  }
  setLoader(false);
}

// ============================================================
// VILLA
// ============================================================
async function loadVilla(search = '') {
  setLoader(true);
  const url   = search ? `${API.villas}?search=${encodeURIComponent(search)}` : API.villas;
  const res   = await API.get(url);
  const tbody = document.getElementById('villa-table-body');
  if (res.success && res.data.length > 0) {
    tbody.innerHTML = res.data.map((v, i) => `
      <tr>
        <td>${i+1}</td>
        <td><code style="font-size:11px;color:var(--green-700)">${Util.esc(v.kode)}</code></td>
        <td><strong>${Util.esc(v.nama)}</strong></td>
        <td>${Util.esc(v.lokasi)}</td>
        <td>${Util.esc(v.kapasitas)} orang</td>
        <td>${Util.formatRupiah(v.harga)}</td>
        <td>${Util.badgeVilla(v.status)}</td>
        <td>
          <div class="action-group">
            <button class="btn-icon edit" title="Edit" onclick="editVilla(${v.id})">${Util.iconEdit}</button>
            <button class="btn-icon hapus" title="Hapus" onclick="confirmHapus('villa',${v.id},'${Util.esc(v.nama)}')">${Util.iconHapus}</button>
          </div>
        </td>
      </tr>`).join('');
    state.villaCache = res.data;
  } else {
    tbody.innerHTML = `<tr><td colspan="8" class="empty-row">Belum ada data villa</td></tr>`;
  }
  setLoader(false);
}

function openModalVilla() {
  document.getElementById('modal-villa-title').textContent = 'Tambah Villa';
  document.getElementById('villa-status').value = 'Tersedia';
  openModal('modal-villa');
}

async function editVilla(id) {
  setLoader(true);
  const res = await API.get(`${API.villas}?id=${id}`);
  setLoader(false);
  if (!res.success) { showToast('Gagal memuat data villa', true); return; }
  const v = res.data;
  state.editId = id;
  document.getElementById('villa-id').value        = v.id;
  document.getElementById('villa-nama').value      = v.nama;
  document.getElementById('villa-lokasi').value    = v.lokasi;
  document.getElementById('villa-kapasitas').value = v.kapasitas;
  document.getElementById('villa-harga').value     = v.harga;
  document.getElementById('villa-fasilitas').value = v.fasilitas || '';
  document.getElementById('villa-status').value    = v.status;
  document.getElementById('villa-deskripsi').value = v.deskripsi || '';
  document.getElementById('modal-villa-title').textContent = 'Edit Villa';
  openModal('modal-villa');
}

async function saveVilla() {
  const nama      = document.getElementById('villa-nama').value.trim();
  const lokasi    = document.getElementById('villa-lokasi').value.trim();
  const kapasitas = document.getElementById('villa-kapasitas').value;
  const harga     = document.getElementById('villa-harga').value;
  const fasilitas = document.getElementById('villa-fasilitas').value.trim();
  const status    = document.getElementById('villa-status').value;
  const deskripsi = document.getElementById('villa-deskripsi').value.trim();

  if (!nama || !lokasi || !kapasitas || !harga) { showToast('Harap isi semua field wajib!', true); return; }

  const body = { nama, lokasi, kapasitas: +kapasitas, harga: +harga, fasilitas, deskripsi, status };
  const btn  = document.getElementById('btn-save-villa');
  btn.disabled = true; btn.textContent = 'Menyimpan...';

  let res;
  if (state.editId) {
    res = await API.put(`${API.villas}?id=${state.editId}`, body);
  } else {
    res = await API.post(API.villas, body);
  }
  btn.disabled = false; btn.textContent = 'Simpan';

  if (!res.success) { showToast(res.message || 'Gagal menyimpan', true); return; }
  closeModal('modal-villa');
  loadVilla();
  loadDashboard();
  showToast(state.editId ? 'Villa berhasil diperbarui!' : 'Villa berhasil ditambahkan!');
  state.editId = null;
}

// ============================================================
// PELANGGAN
// ============================================================
async function loadPelanggan(search = '') {
  setLoader(true);
  const url   = search ? `${API.pelanggan}?search=${encodeURIComponent(search)}` : API.pelanggan;
  const res   = await API.get(url);
  const tbody = document.getElementById('pelanggan-table-body');
  if (res.success && res.data.length > 0) {
    tbody.innerHTML = res.data.map((p, i) => `
      <tr>
        <td>${i+1}</td>
        <td><strong>${Util.esc(p.nama)}</strong></td>
        <td>${Util.esc(p.email)}</td>
        <td>${Util.esc(p.hp)}</td>
        <td>${Util.esc(p.alamat || '—')}</td>
        <td>${p.total_transaksi || 0} transaksi</td>
        <td>
          <div class="action-group">
            <button class="btn-icon edit" title="Edit" onclick="editPelanggan(${p.id})">${Util.iconEdit}</button>
            <button class="btn-icon hapus" title="Hapus" onclick="confirmHapus('pelanggan',${p.id},'${Util.esc(p.nama)}')">${Util.iconHapus}</button>
          </div>
        </td>
      </tr>`).join('');
    state.pelangganCache = res.data;
  } else {
    tbody.innerHTML = `<tr><td colspan="7" class="empty-row">Belum ada data pelanggan</td></tr>`;
  }
  setLoader(false);
}

function openModalPelanggan() {
  document.getElementById('modal-pelanggan-title').textContent = 'Tambah Pelanggan';
  openModal('modal-pelanggan');
}

async function editPelanggan(id) {
  setLoader(true);
  const res = await API.get(`${API.pelanggan}?id=${id}`);
  setLoader(false);
  if (!res.success) { showToast('Gagal memuat data pelanggan', true); return; }
  const p = res.data;
  state.editId = id;
  document.getElementById('pelanggan-id').value     = p.id;
  document.getElementById('pelanggan-nama').value   = p.nama;
  document.getElementById('pelanggan-email').value  = p.email;
  document.getElementById('pelanggan-hp').value     = p.hp;
  document.getElementById('pelanggan-ktp').value    = p.ktp || '';
  document.getElementById('pelanggan-alamat').value = p.alamat || '';
  document.getElementById('modal-pelanggan-title').textContent = 'Edit Pelanggan';
  openModal('modal-pelanggan');
}

async function savePelanggan() {
  const nama   = document.getElementById('pelanggan-nama').value.trim();
  const email  = document.getElementById('pelanggan-email').value.trim();
  const hp     = document.getElementById('pelanggan-hp').value.trim();
  const ktp    = document.getElementById('pelanggan-ktp').value.trim();
  const alamat = document.getElementById('pelanggan-alamat').value.trim();

  if (!nama || !email || !hp) { showToast('Harap isi semua field wajib!', true); return; }

  const btn = document.getElementById('btn-save-pelanggan');
  btn.disabled = true; btn.textContent = 'Menyimpan...';

  const body = { nama, email, hp, ktp, alamat };
  const res  = state.editId
    ? await API.put(`${API.pelanggan}?id=${state.editId}`, body)
    : await API.post(API.pelanggan, body);

  btn.disabled = false; btn.textContent = 'Simpan';
  if (!res.success) { showToast(res.message || 'Gagal menyimpan', true); return; }
  closeModal('modal-pelanggan');
  loadPelanggan();
  showToast(state.editId ? 'Pelanggan berhasil diperbarui!' : 'Pelanggan berhasil ditambahkan!');
  state.editId = null;
}

// ============================================================
// TRANSAKSI
// ============================================================
async function loadTransaksi(search = '') {
  setLoader(true);
  const url   = search ? `${API.transaksi}?search=${encodeURIComponent(search)}` : API.transaksi;
  const res   = await API.get(url);
  const tbody = document.getElementById('transaksi-table-body');
  if (res.success && res.data.length > 0) {
    tbody.innerHTML = res.data.map(t => `
      <tr>
        <td><strong>${Util.esc(t.no_trx)}</strong></td>
        <td>${Util.esc(t.nama_pelanggan)}</td>
        <td>${Util.esc(t.nama_villa)}</td>
        <td>${Util.formatDate(t.checkin)}</td>
        <td>${Util.formatDate(t.checkout)}</td>
        <td>${t.durasi} malam</td>
        <td>${Util.formatRupiah(t.total)}</td>
        <td>${Util.badgeTrx(t.status)}</td>
        <td>
          <div class="action-group">
            <button class="btn-icon edit" title="Edit" onclick="editTransaksi(${t.id})">${Util.iconEdit}</button>
            <button class="btn-icon hapus" title="Hapus" onclick="confirmHapus('transaksi',${t.id},'${Util.esc(t.no_trx)}')">${Util.iconHapus}</button>
          </div>
        </td>
      </tr>`).join('');
  } else {
    tbody.innerHTML = `<tr><td colspan="9" class="empty-row">Belum ada data transaksi</td></tr>`;
  }
  setLoader(false);
}

/** Isi dropdown pelanggan & villa pada form transaksi */
async function populateTransaksiDropdowns(selPId = '', selVId = '') {
  // Ambil dari cache atau API
  const [pRes, vRes] = await Promise.all([
    state.pelangganCache.length ? Promise.resolve({ success:true, data:state.pelangganCache }) : API.get(API.pelanggan),
    state.villaCache.length     ? Promise.resolve({ success:true, data:state.villaCache })     : API.get(API.villas),
  ]);

  const selP = document.getElementById('transaksi-pelanggan');
  const selV = document.getElementById('transaksi-villa');

  selP.innerHTML = `<option value="">-- Pilih Pelanggan --</option>` +
    (pRes.data || []).map(p => `<option value="${p.id}" ${String(p.id)===String(selPId)?'selected':''}>${Util.esc(p.nama)}</option>`).join('');

  selV.innerHTML = `<option value="">-- Pilih Villa --</option>` +
    (vRes.data || []).map(v => `<option value="${v.id}" data-harga="${v.harga}" ${String(v.id)===String(selVId)?'selected':''}>${Util.esc(v.nama)} — ${Util.formatRupiah(v.harga)}/malam</option>`).join('');
}

function hitungTotal() {
  const checkin  = document.getElementById('transaksi-checkin').value;
  const checkout = document.getElementById('transaksi-checkout').value;
  const opt      = document.getElementById('transaksi-villa').selectedOptions[0];
  const harga    = opt ? Number(opt.dataset.harga || 0) : 0;
  const durasi   = Util.daysDiff(checkin, checkout);
  const total    = durasi * harga;
  document.getElementById('transaksi-durasi').value        = durasi > 0 ? `${durasi} malam` : '';
  document.getElementById('transaksi-total-display').value = total > 0 ? Util.formatRupiah(total) : '';
}

async function openModalTransaksi() {
  document.getElementById('modal-transaksi-title').textContent = 'Tambah Transaksi';
  await populateTransaksiDropdowns();
  openModal('modal-transaksi');
}

async function editTransaksi(id) {
  setLoader(true);
  const res = await API.get(`${API.transaksi}?id=${id}`);
  setLoader(false);
  if (!res.success) { showToast('Gagal memuat data transaksi', true); return; }
  const t = res.data;
  state.editId = id;

  document.getElementById('transaksi-id').value = t.id;
  await populateTransaksiDropdowns(t.pelanggan_id, t.villa_id);

  document.getElementById('transaksi-checkin').value    = t.checkin;
  document.getElementById('transaksi-checkout').value   = t.checkout;
  document.getElementById('transaksi-pembayaran').value = t.pembayaran;
  document.getElementById('transaksi-status').value     = t.status;
  document.getElementById('transaksi-catatan').value    = t.catatan || '';
  hitungTotal();
  document.getElementById('modal-transaksi-title').textContent = 'Edit Transaksi';
  openModal('modal-transaksi');
}

async function saveTransaksi() {
  const pelangganId = document.getElementById('transaksi-pelanggan').value;
  const villaId     = document.getElementById('transaksi-villa').value;
  const checkin     = document.getElementById('transaksi-checkin').value;
  const checkout    = document.getElementById('transaksi-checkout').value;
  const pembayaran  = document.getElementById('transaksi-pembayaran').value;
  const status      = document.getElementById('transaksi-status').value;
  const catatan     = document.getElementById('transaksi-catatan').value.trim();

  if (!pelangganId || !villaId || !checkin || !checkout) { showToast('Harap isi semua field wajib!', true); return; }
  if (new Date(checkout) <= new Date(checkin)) { showToast('Checkout harus setelah check-in!', true); return; }

  const btn = document.getElementById('btn-save-transaksi');
  btn.disabled = true; btn.textContent = 'Menyimpan...';

  const body = { pelanggan_id: +pelangganId, villa_id: +villaId, checkin, checkout, pembayaran, status, catatan };
  const res  = state.editId
    ? await API.put(`${API.transaksi}?id=${state.editId}`, body)
    : await API.post(API.transaksi, body);

  btn.disabled = false; btn.textContent = 'Simpan';
  if (!res.success) { showToast(res.message || 'Gagal menyimpan', true); return; }
  closeModal('modal-transaksi');
  loadTransaksi();
  loadDashboard();
  showToast(state.editId ? 'Transaksi berhasil diperbarui!' : 'Transaksi berhasil ditambahkan!');
  state.editId = null;
}

// ============================================================
// HAPUS
// ============================================================
function confirmHapus(type, id, label) {
  const msgs = { villa:`Hapus villa "${label}"?`, pelanggan:`Hapus pelanggan "${label}"?`, transaksi:`Hapus transaksi "${label}"?` };
  document.getElementById('hapus-message').textContent = msgs[type] || 'Hapus data ini?';

  state.deleteCallback = async () => {
    const urls = { villa: `${API.villas}?id=${id}`, pelanggan: `${API.pelanggan}?id=${id}`, transaksi: `${API.transaksi}?id=${id}` };
    setLoader(true);
    const res = await API.delete(urls[type]);
    setLoader(false);
    if (!res.success) { showToast(res.message || 'Gagal menghapus', true); closeModal('modal-hapus'); return; }
    closeModal('modal-hapus');
    switch(type) { case 'villa': loadVilla(); break; case 'pelanggan': loadPelanggan(); break; case 'transaksi': loadTransaksi(); break; }
    loadDashboard();
    showToast('Data berhasil dihapus!');
  };

  document.getElementById('btn-konfirmasi-hapus').onclick = state.deleteCallback;
  openModal('modal-hapus');
}

// ============================================================
// AUTH
// ============================================================
async function handleLogin(e) {
  e.preventDefault();
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;
  const errEl    = document.getElementById('login-error');
  const btnLogin = document.getElementById('btn-login');

  btnLogin.disabled = true; btnLogin.textContent = 'Masuk...';
  const res = await API.post(`${API.auth}?action=login`, { username, password });
  btnLogin.disabled = false; btnLogin.textContent = 'Masuk';

  if (res.success) {
    errEl.classList.add('hidden');
    const nama = res.data?.nama || 'Admin';
    document.getElementById('admin-name').textContent  = nama;
    document.getElementById('admin-avatar').textContent = nama.charAt(0).toUpperCase();
    showApp();
  } else {
    errEl.textContent = res.message || 'Username atau password salah.';
    errEl.classList.remove('hidden');
  }
}

async function logout() {
  await API.post(`${API.auth}?action=logout`);
  document.getElementById('page-app').classList.remove('active');
  document.getElementById('page-login').classList.add('active');
  document.getElementById('login-form').reset();
  document.getElementById('login-error').classList.add('hidden');
}

function showApp() {
  document.getElementById('page-login').classList.remove('active');
  document.getElementById('page-app').classList.add('active');
  navigateTo('dashboard');
  updateDate();
}

// ============================================================
// DATE
// ============================================================
function updateDate() {
  const el  = document.getElementById('topbar-date');
  if (!el) return;
  const now = new Date();
  const days   = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
  const months = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
  el.textContent = `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
}

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
  updateDate();
  setInterval(updateDate, 60000);

  // Login form
  document.getElementById('login-form').addEventListener('submit', handleLogin);

  // Toggle password
  document.getElementById('toggle-pw-btn').addEventListener('click', () => {
    const inp  = document.getElementById('login-password');
    const icon = document.getElementById('eye-icon');
    const hide = inp.type === 'password';
    inp.type = hide ? 'text' : 'password';
    icon.innerHTML = hide
      ? `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>`
      : `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>`;
  });

  // Sidebar nav
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => navigateTo(btn.dataset.section));
  });

  // Sidebar toggle mobile
  document.getElementById('sidebar-toggle').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
  });

  // Logout
  document.getElementById('btn-logout').addEventListener('click', logout);

  // Tambah buttons
  document.getElementById('btn-tambah-villa').addEventListener('click',     openModalVilla);
  document.getElementById('btn-tambah-pelanggan').addEventListener('click', openModalPelanggan);
  document.getElementById('btn-tambah-transaksi').addEventListener('click', openModalTransaksi);

  // Save buttons
  document.getElementById('btn-save-villa').addEventListener('click',     saveVilla);
  document.getElementById('btn-save-pelanggan').addEventListener('click', savePelanggan);
  document.getElementById('btn-save-transaksi').addEventListener('click', saveTransaksi);

  // Close modal buttons
  document.querySelectorAll('.modal-close, [data-modal]').forEach(btn => {
    btn.addEventListener('click', () => closeModal(btn.dataset.modal));
  });

  // Tutup modal klik backdrop
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) closeModal(overlay.id);
    });
  });

  // Hitung total otomatis
  ['transaksi-checkin','transaksi-checkout','transaksi-villa'].forEach(id => {
    document.getElementById(id)?.addEventListener('change', hitungTotal);
  });

  // Search dengan debounce
  let searchTimers = {};
  const searches = { 'search-villa': loadVilla, 'search-pelanggan': loadPelanggan, 'search-transaksi': loadTransaksi };
  Object.entries(searches).forEach(([id, fn]) => {
    document.getElementById(id)?.addEventListener('input', e => {
      clearTimeout(searchTimers[id]);
      searchTimers[id] = setTimeout(() => fn(e.target.value), 400);
    });
  });

  // Cek session
  const sessRes = await API.get(`${API.auth}?action=check`);
  if (sessRes.success) {
    const nama = sessRes.data?.nama || 'Admin';
    document.getElementById('admin-name').textContent   = nama;
    document.getElementById('admin-avatar').textContent = nama.charAt(0).toUpperCase();
    showApp();
  }
});
