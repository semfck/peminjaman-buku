document.addEventListener('DOMContentLoaded', function() {
    // Data buku contoh
    const books = [
        { 
            id: 1, 
            title: "Laskar Pelangi", 
            author: "Andrea Hirata", 
            category: "fiksi", 
            year: 2005, 
            available: true,
            cover: "assets/img/laskar-pelangi.jpg"
        },
        { 
            id: 2, 
            title: "Bumi Manusia", 
            author: "Pramoedya Ananta Toer", 
            category: "fiksi", 
            year: 1980, 
            available: false,
            cover: "assets/img/bumi-manusia.jpg"
        },
        { 
            id: 3, 
            title: "Sapiens", 
            author: "Yuval Noah Harari", 
            category: "non-fiksi", 
            year: 2011, 
            available: true,
            cover: "assets/img/sapiens.jpg"
        },
        { 
            id: 4, 
            title: "Sejarah Indonesia Modern", 
            author: "M.C. Ricklefs", 
            category: "sejarah", 
            year: 1981, 
            available: true,
            cover: "assets/img/sejarah-indonesia.jpg"
        },
        { 
            id: 5, 
            title: "Cosmos", 
            author: "Carl Sagan", 
            category: "sains", 
            year: 1980, 
            available: true,
            cover: "assets/img/cosmos.jpg"
        },
        { 
            id: 6, 
            title: "The Innovators", 
            author: "Walter Isaacson", 
            category: "non-fiksi", 
            year: 2014, 
            available: false,
            cover: "assets/img/innovators.jpg"
        }
    ];

    // Fungsi untuk menampilkan buku
    function displayBooks(booksToDisplay) {
        const bookList = document.getElementById('bookList');
        bookList.innerHTML = '';

        if (booksToDisplay.length === 0) {
            bookList.innerHTML = '<div class="col-12"><div class="alert alert-info">Tidak ada buku yang ditemukan.</div></div>';
            return;
        }

        booksToDisplay.forEach(book => {
            const bookCol = document.createElement('div');
            bookCol.className = 'col-md-4 mb-4';
            
            const availabilityBadge = book.available 
                ? '<span class="badge bg-success">Tersedia</span>'
                : '<span class="badge bg-danger">Dipinjam</span>';
            
            bookCol.innerHTML = `
                <div class="card h-100">
                    <img src="${book.cover}" class="card-img-top" alt="${book.title}" style="height: 200px; object-fit: cover;">
                    <div class="card-body">
                        <h5 class="card-title">${book.title}</h5>
                        <p class="card-text">Penulis: ${book.author}</p>
                        <p class="card-text">Tahun: ${book.year}</p>
                        <p class="card-text">Kategori: ${book.category}</p>
                        ${availabilityBadge}
                    </div>
                    <div class="card-footer bg-transparent">
                        <button class="btn btn-primary btn-sm" onclick="pinjamBuku(${book.id})" ${!book.available ? 'disabled' : ''}>
                            Pinjam Buku
                        </button>
                    </div>
                </div>
            `;
            
            bookList.appendChild(bookCol);
        });
    }

    // Fungsi untuk memfilter buku
    function filterBooks() {
        const category = document.getElementById('filterCategory').value;
        const availability = document.getElementById('filterAvailability').value;
        
        let filteredBooks = books;
        
        if (category) {
            filteredBooks = filteredBooks.filter(book => book.category === category);
        }
        
        if (availability) {
            const isAvailable = availability === 'tersedia';
            filteredBooks = filteredBooks.filter(book => book.available === isAvailable);
        }
        
        displayBooks(filteredBooks);
    }

    // Fungsi untuk mencari buku
    function searchBooks() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const filteredBooks = books.filter(book => 
            book.title.toLowerCase().includes(searchTerm) || 
            book.author.toLowerCase().includes(searchTerm)
        );
        
        displayBooks(filteredBooks);
    }

    // Event listeners
    document.getElementById('filterCategory').addEventListener('change', filterBooks);
    document.getElementById('filterAvailability').addEventListener('change', filterBooks);
    document.getElementById('resetFilter').addEventListener('click', function() {
        document.getElementById('filterCategory').value = '';
        document.getElementById('filterAvailability').value = '';
        displayBooks(books);
    });
    document.getElementById('searchBtn').addEventListener('click', searchBooks);
    document.getElementById('searchInput').addEventListener('keyup', function(e) {
        if (e.key === 'Enter') {
            searchBooks();
        }
    });

    // Fungsi global untuk pinjam buku
    window.pinjamBuku = function(bookId) {
        const book = books.find(b => b.id === bookId);
        if (book && book.available) {
            // Simpan buku yang dipilih ke localStorage untuk form peminjaman
            localStorage.setItem('selectedBook', JSON.stringify(book));
            // Redirect ke halaman peminjaman
            window.location.href = 'peminjaman.html';
        }
    };

    // Tampilkan semua buku saat pertama kali load
    displayBooks(books);
});