// ====================== VARIABEL GLOBAL ======================
let peminjamanList = [];
let currentInvoice = null;
let currentPage = 1;
const itemsPerPage = 10;
let reportChart = null;
let unsubscribePeminjaman = null;
let unsubscribeRiwayat = null;
const DENDA_PER_HARI = 5000;

// ====================== INISIALISASI ======================
document.addEventListener('DOMContentLoaded', function() {
  // Set tanggal default
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('tanggalPinjam').value = today;
  document.getElementById('modalTanggalKembali').value = today;
  document.getElementById('filterDari').value = getFirstDayOfMonth();
  document.getElementById('filterSampai').value = today;
  document.getElementById('reportDate').value = getCurrentWeek();
  
  // Event listeners
  document.getElementById('lamaPinjam').addEventListener('change', hitungJatuhTempo);
  document.getElementById('tanggalPinjam').addEventListener('change', hitungJatuhTempo);
  
  // Setup listeners lainnya
  setupEventListeners();
  
  // Load data awal
  loadPeminjaman();
  loadRiwayat();
  generateReport();
  
  // Notifikasi selamat datang
  showAlert('info', 'Selamat datang di Sistem Peminjaman Buku Perpustakaan');
});

// ====================== FUNGSI FIRESTORE ======================
async function simpanPeminjaman(data) {
  const { error } = await supabase
    .from('peminjaman')
    .insert([data]);

  if (error) {
    console.error('Gagal menyimpan:', error.message);
  } else {
    alert('Data berhasil disimpan!');
  }
}

// Contoh pemakaian:
simpanPeminjaman({
  nama: "Andi",
  no_hp: "081234567890",
  judul_buku: "Laskar Pelangi",
  tanggal_pinjam: "2025-05-15",
  lama_pinjam: 7,
  tanggal_kembali: "2025-05-22",
  denda: 0
});

async function loadPeminjaman() {
  showLoading('Memuat data peminjaman...');
  
  try {
    // Hentikan listener sebelumnya jika ada
    if (unsubscribePeminjaman) unsubscribePeminjaman();
    
    unsubscribePeminjaman = db.collection('peminjaman')
      .where('tglKembali', '==', null)
      .orderBy('tglPinjam', 'asc')
      .onSnapshot(snapshot => {
        peminjamanList = [];
        snapshot.forEach(doc => {
          peminjamanList.push({ id: doc.id, ...doc.data() });
        });
        updateTabelPengembalian();
        hideLoading();
      }, error => {
        console.error("Error loading peminjaman:", error);
        showAlert('error', 'Gagal memuat data peminjaman');
        hideLoading();
      });
  } catch (error) {
    console.error("Error loading peminjaman:", error);
    showAlert('error', 'Gagal memuat data peminjaman');
    hideLoading();
  }
}

async function loadRiwayat() {
  showLoading('Memuat data riwayat...');
  
  try {
    // Hentikan listener sebelumnya jika ada
    if (unsubscribeRiwayat) unsubscribeRiwayat();
    
    const dari = document.getElementById('filterDari').value;
    const sampai = document.getElementById('filterSampai').value;
    const searchTerm = document.getElementById('searchRiwayat').value.toLowerCase();
    
    unsubscribeRiwayat = db.collection('peminjaman')
      .where('tglPinjam', '>=', dari)
      .where('tglPinjam', '<=', sampai + 'T23:59:59')
      .orderBy('tglPinjam', 'desc')
      .onSnapshot(snapshot => {
        let filteredData = [];
        snapshot.forEach(doc => {
          const data = { id: doc.id, ...doc.data() };
          if (!searchTerm || 
              data.nama.toLowerCase().includes(searchTerm) || 
              data.judul.toLowerCase().includes(searchTerm) || 
              data.kodeBuku.toLowerCase().includes(searchTerm)) {
            filteredData.push(data);
          }
        });
        updateRiwayatUI(filteredData);
        hideLoading();
      }, error => {
        console.error("Error loading riwayat:", error);
        showAlert('error', 'Gagal memuat data riwayat');
        hideLoading();
      });
  } catch (error) {
    console.error("Error loading riwayat:", error);
    showAlert('error', 'Gagal memuat data riwayat');
    hideLoading();
  }
}

// ====================== FUNGSI PEMINJAMAN ======================
async function tampilkanPeminjaman() {
  const { data, error } = await supabase
    .from('peminjaman')
    .select('*')
    .order('tanggal_pinjam', { ascending: false });

  if (error) {
    console.error(error);
    return;
  }

  data.forEach(item => {
    console.log(item.nama, item.judul_buku, item.tanggal_kembali);
    // Tambahkan logika untuk menampilkan di tabel HTML
  });
}

async function simpanPeminjaman() {
  const form = document.getElementById('formPeminjaman');
  if (!form.checkValidity()) {
    form.classList.add('was-validated');
    showAlert('error', 'Harap isi semua field yang wajib dengan data yang valid!');
    return;
  }
  
  showLoading('Menyimpan data peminjaman...');
  
  try {
    const peminjaman = {
      nama: document.getElementById('namaPeminjam').value.trim(),
      noHp: document.getElementById('noHp').value.trim(),
      email: document.getElementById('email').value.trim() || null,
      judul: document.getElementById('judulBuku').value.trim(),
      kodeBuku: document.getElementById('kodeBuku').value.trim(),
      tglPinjam: document.getElementById('tanggalPinjam').value,
      tglTempo: hitungJatuhTempo(true),
      tglKembali: null,
      denda: 0,
      hariTelat: 0,
      status: 'Dipinjam',
      invoice: null,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('peminjaman').add(peminjaman);
    
    // Reset form
    form.reset();
    form.classList.remove('was-validated');
    document.getElementById('tanggalPinjam').value = new Date().toISOString().split('T')[0];
    document.getElementById('jatuhTempo').value = '';
    
    hideLoading();
    showAlert('success', 'Peminjaman berhasil disimpan!');
    
    // Navigasi ke tab pengembalian
    document.getElementById('pengembalian-tab').click();
  } catch (error) {
    console.error("Error saving peminjaman:", error);
    hideLoading();
    showAlert('error', 'Gagal menyimpan data peminjaman');
  }
}

function hitungJatuhTempo(returnDate = false) {
  const tglPinjam = document.getElementById('tanggalPinjam').value;
  const lamaPinjam = parseInt(document.getElementById('lamaPinjam').value);
  
  if (tglPinjam && lamaPinjam) {
    const tglPinjamObj = new Date(tglPinjam);
    const tglTempo = new Date(tglPinjamObj);
    tglTempo.setDate(tglPinjamObj.getDate() + (lamaPinjam * 7));
    
    const formattedDate = formatDate(tglTempo.toISOString().split('T')[0]);
    document.getElementById('jatuhTempo').value = formattedDate;
    
    if (returnDate) {
      return tglTempo.toISOString().split('T')[0];
    }
  }
  return null;
}

// ====================== FUNGSI PENGEMBALIAN ======================
async function prosesPengembalian() {
  const id = document.getElementById('pengembalianModal').getAttribute('data-peminjaman-id');
  const tglKembali = document.getElementById('modalTanggalKembali').value;
  
  if (!tglKembali) {
    showAlert('error', 'Harap masukkan tanggal kembali!');
    return;
  }

  showLoading('Memproses pengembalian...');
  
  try {
    const peminjamanRef = db.collection('peminjaman').doc(id);
    const doc = await peminjamanRef.get();
    
    if (!doc.exists) {
      throw new Error('Data peminjaman tidak ditemukan');
    }
    
    const peminjaman = doc.data();
    const tglKembaliObj = new Date(tglKembali);
    const tglTempoObj = new Date(peminjaman.tglTempo);
    
    let hariTelat = 0;
    let denda = 0;
    
    if (tglKembaliObj > tglTempoObj) {
      const diffTime = tglKembaliObj - tglTempoObj;
      hariTelat = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      denda = hariTelat * DENDA_PER_HARI;
    }
    
    let invoiceNumber = null;
    if (denda > 0) {
      const invoiceCount = await db.collection('peminjaman')
        .where('invoice', '!=', null)
        .count()
        .get();
      invoiceNumber = `INV-${new Date().getFullYear()}-${(invoiceCount.data().count + 1).toString().padStart(3, '0')}`;
    }
    
    await peminjamanRef.update({
      tglKembali: tglKembali,
      denda: denda,
      hariTelat: hariTelat,
      status: denda > 0 ? 'Dikembalikan' : 'Lunas',
      invoice: invoiceNumber,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    pengembalianModal.hide();
    
    if (denda > 0) {
      showInvoice({ 
        id, 
        ...peminjaman, 
        tglKembali, 
        denda, 
        hariTelat, 
        invoice: invoiceNumber, 
        status: 'Dikembalikan' 
      });
      showAlert('warning', `Buku berhasil dikembalikan dengan denda ${formatCurrency(denda)} (terlambat ${hariTelat} hari)`);
    } else {
      showAlert('success', 'Buku berhasil dikembalikan tepat waktu!');
    }
    
    hideLoading();
  } catch (error) {
    console.error("Error processing pengembalian:", error);
    hideLoading();
    showAlert('error', 'Gagal memproses pengembalian');
  }
}

// ====================== FUNGSI UTILITAS ======================
function formatDate(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('id-ID', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

function formatCurrency(amount) {
  return 'Rp' + amount.toLocaleString('id-ID');
}

function showAlert(type, message) {
  const alertContainer = document.getElementById('alertContainer');
  const icons = {
    success: 'fa-check-circle',
    error: 'fa-times-circle',
    warning: 'fa-exclamation-triangle',
    info: 'fa-info-circle'
  };
  
  const alertEl = document.createElement('div');
  alertEl.className = `alert alert-${type} alert-dismissible fade show animate__animated animate__fadeInRight`;
  alertEl.innerHTML = `
    <div class="d-flex align-items-center">
      <i class="fas ${icons[type] || 'fa-bell'} me-2"></i>
      <div>${message}</div>
      <button type="button" class="btn-close ms-auto" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>
  `;
  
  alertContainer.appendChild(alertEl);
  
  setTimeout(() => {
    alertEl.classList.remove('show');
    setTimeout(() => alertEl.remove(), 150);
  }, 3000);
}

// Fungsi lainnya tetap sama seperti sebelumnya...

const supabaseUrl = 'https://supabase.com/dashboard/project/xqnlchcbxekwulncjvfy';
const supabaseKey = 'sbp_4798bd4469989abd477bbaad6bcd4da51a235b1a';
const supabase = supabase.createClient(supabaseUrl, supabaseKey);
