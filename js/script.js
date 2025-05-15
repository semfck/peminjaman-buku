// Konfigurasi Firebase
const firebaseConfig = {
    apiKey: "AIzaSy...",
    authDomain: "peminjaman-buku.firebaseapp.com",
    projectId: "peminjaman-buku",
    storageBucket: "peminjaman-buku.appspot.com",
    messagingSenderId: "123...",
    appId: "1:123..."
  };
  
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
  const db = firebase.firestore();
  
  // Fungsi menyimpan data
  async function simpanData() {
    try {
      const docRef = await db.collection("peminjaman").add({
        nama: document.getElementById('nama').value,
        buku: document.getElementById('buku').value,
        tanggal: document.getElementById('tanggal').value,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      showAlert('success', 'Data berhasil disimpan!');
      loadData(); // Memuat ulang data
    } catch (error) {
      showAlert('danger', 'Gagal menyimpan data: ' + error.message);
    }
  }
  
  // Fungsi memuat data
  function loadData() {
    db.collection("peminjaman")
      .orderBy("createdAt", "desc")
      .onSnapshot((snapshot) => {
        const data = [];
        snapshot.forEach((doc) => {
          data.push({ id: doc.id, ...doc.data() });
        });
        renderTable(data);
      });
  }