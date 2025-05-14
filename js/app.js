// app.js
const BookManager = {
    STORAGE_KEY: 'book-data',
    currentFilter: 'all', // 'all', 'completed', 'uncompleted'
    currentSearch: '',
    
    init() {
        this.loadBooks();
        this.setupEventListeners();
        this.setupSearch();
        this.setupDatePickers();
        this.showNotification('Aplikasi siap digunakan!', 'info');
    },
    
    loadBooks() {
        try {
            const books = JSON.parse(localStorage.getItem(this.STORAGE_KEY)) || [];
            this.books = books; // Simpan di instance untuk akses mudah
            this.renderBooks(books);
            this.updateStats();
            return books;
        } catch (error) {
            console.error('Error loading books:', error);
            this.showNotification('Gagal memuat data buku', 'error');
            return [];
        }
    },
    
    saveBooks(books) {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(books));
            this.books = books; // Update referensi
            this.updateStats();
        } catch (error) {
            console.error('Error saving books:', error);
            this.showNotification('Gagal menyimpan data', 'error');
        }
    },
    
    addBook(title, author, year, isComplete = false) {
        // Validasi input
        if (!title || !author || !year) {
            this.showNotification('Harap isi semua field yang diperlukan', 'error');
            return false;
        }

        const newBook = {
            id: Date.now().toString(),
            title: title.trim(),
            author: author.trim(),
            year: parseInt(year),
            isComplete,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        const books = this.loadBooks();
        books.unshift(newBook); // Tambahkan di awal array
        this.saveBooks(books);
        this.renderBooks(books);
        this.showNotification('Buku berhasil ditambahkan', 'success');
        this.resetForm();
        return true;
    },
    
    toggleBookStatus(id) {
        const books = this.loadBooks();
        const bookIndex = books.findIndex(book => book.id === id);
        
        if (bookIndex !== -1) {
            books[bookIndex].isComplete = !books[bookIndex].isComplete;
            books[bookIndex].updatedAt = new Date().toISOString();
            this.saveBooks(books);
            
            const status = books[bookIndex].isComplete ? 'selesai' : 'belum selesai';
            this.showNotification(`Status buku diubah menjadi ${status}`, 'success');
        }
    },
    
    deleteBook(id) {
        if (confirm('Apakah Anda yakin ingin menghapus buku ini?')) {
            const books = this.loadBooks();
            const filteredBooks = books.filter(book => book.id !== id);
            this.saveBooks(filteredBooks);
            this.showNotification('Buku berhasil dihapus', 'success');
        }
    },
    
    editBook(id, newData) {
        const books = this.loadBooks();
        const bookIndex = books.findIndex(book => book.id === id);
        
        if (bookIndex !== -1) {
            books[bookIndex] = {
                ...books[bookIndex],
                ...newData,
                updatedAt: new Date().toISOString()
            };
            this.saveBooks(books);
            this.showNotification('Buku berhasil diperbarui', 'success');
            return true;
        }
        return false;
    },
    
    filterBooks(status) {
        this.currentFilter = status;
        this.applyFilters();
    },
    
    searchBooks(query) {
        this.currentSearch = query.toLowerCase();
        this.applyFilters();
    },
    
    applyFilters() {
        let filteredBooks = [...this.books];
        
        // Apply search filter
        if (this.currentSearch) {
            filteredBooks = filteredBooks.filter(book => 
                book.title.toLowerCase().includes(this.currentSearch) || 
                book.author.toLowerCase().includes(this.currentSearch)
            );
        }
        
        // Apply status filter
        if (this.currentFilter !== 'all') {
            const isComplete = this.currentFilter === 'completed';
            filteredBooks = filteredBooks.filter(book => book.isComplete === isComplete);
        }
        
        this.renderBooks(filteredBooks);
    },
    
    renderBooks(books) {
        const unfinishedList = document.getElementById('incompleteBookshelfList');
        const completedList = document.getElementById('completeBookshelfList');
        
        // Clear existing content
        unfinishedList.innerHTML = '';
        completedList.innerHTML = '';
        
        if (books.length === 0) {
            const emptyMessage = `
                <div class="empty-state">
                    <i class="fas fa-book-open"></i>
                    <p>Tidak ada buku yang ditemukan</p>
                </div>
            `;
            unfinishedList.innerHTML = emptyMessage;
            return;
        }
        
        books.forEach(book => {
            const bookElement = this.createBookElement(book);
            if (book.isComplete) {
                completedList.appendChild(bookElement);
            } else {
                unfinishedList.appendChild(bookElement);
            }
        });
    },
    
    createBookElement(book) {
        const bookElement = document.createElement('article');
        bookElement.className = 'book-card';
        bookElement.innerHTML = `
            <div class="book-info">
                <h3>${book.title}</h3>
                <p class="author">Oleh: ${book.author}</p>
                <p class="year">Tahun: ${book.year}</p>
                <p class="meta">Ditambahkan: ${this.formatDate(book.createdAt)}</p>
            </div>
            <div class="book-actions">
                <button class="btn-toggle" data-id="${book.id}">
                    <i class="fas fa-${book.isComplete ? 'undo' : 'check'}"></i>
                </button>
                <button class="btn-edit" data-id="${book.id}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-delete" data-id="${book.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        return bookElement;
    },
    
    setupEventListeners() {
        // Form submission
        document.getElementById('inputBook').addEventListener('submit', (e) => {
            e.preventDefault();
            const title = document.getElementById('inputBookTitle').value;
            const author = document.getElementById('inputBookAuthor').value;
            const year = document.getElementById('inputBookYear').value;
            const isComplete = document.getElementById('inputBookIsComplete').checked;
            
            this.addBook(title, author, year, isComplete);
        });
        
        // Event delegation for dynamic buttons
        document.addEventListener('click', (e) => {
            const bookCard = e.target.closest('.book-card');
            if (!bookCard) return;
            
            const id = e.target.closest('button')?.dataset.id;
            if (!id) return;
            
            if (e.target.closest('.btn-toggle')) {
                this.toggleBookStatus(id);
            } else if (e.target.closest('.btn-delete')) {
                this.deleteBook(id);
            } else if (e.target.closest('.btn-edit')) {
                this.openEditModal(id);
            }
        });
        
        // Filter buttons
        document.getElementById('filterAll').addEventListener('click', () => this.filterBooks('all'));
        document.getElementById('filterCompleted').addEventListener('click', () => this.filterBooks('completed'));
        document.getElementById('filterUncompleted').addEventListener('click', () => this.filterBooks('uncompleted'));
    },
    
    setupSearch() {
        const searchInput = document.getElementById('searchBook');
        searchInput.addEventListener('input', (e) => {
            this.searchBooks(e.target.value);
        });
    },
    
    setupDatePickers() {
        // Inisialisasi datepicker jika diperlukan
        if (document.getElementById('inputBookYear')) {
            flatpickr('#inputBookYear', {
                dateFormat: 'Y',
                maxDate: new Date().getFullYear().toString()
            });
        }
    },
    
    openEditModal(id) {
        const book = this.books.find(b => b.id === id);
        if (!book) return;
        
        // Isi form edit
        document.getElementById('editBookId').value = book.id;
        document.getElementById('editBookTitle').value = book.title;
        document.getElementById('editBookAuthor').value = book.author;
        document.getElementById('editBookYear').value = book.year;
        document.getElementById('editBookIsComplete').checked = book.isComplete;
        
        // Tampilkan modal
        const editModal = new bootstrap.Modal(document.getElementById('editBookModal'));
        editModal.show();
        
        // Handle form submission
        document.getElementById('editBookForm').onsubmit = (e) => {
            e.preventDefault();
            const newData = {
                title: document.getElementById('editBookTitle').value,
                author: document.getElementById('editBookAuthor').value,
                year: document.getElementById('editBookYear').value,
                isComplete: document.getElementById('editBookIsComplete').checked
            };
            
            if (this.editBook(id, newData)) {
                editModal.hide();
            }
        };
    },
    
    updateStats() {
        const totalBooks = this.books.length;
        const completedBooks = this.books.filter(book => book.isComplete).length;
        
        document.getElementById('totalBooksCount').textContent = totalBooks;
        document.getElementById('completedBooksCount').textContent = completedBooks;
        document.getElementById('uncompletedBooksCount').textContent = totalBooks - completedBooks;
    },
    
    resetForm() {
        document.getElementById('inputBook').reset();
        document.getElementById('inputBookTitle').focus();
    },
    
    formatDate(dateString) {
        const options = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return new Date(dateString).toLocaleDateString('id-ID', options);
    },
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${this.getNotificationIcon(type)}"></i>
                <span>${message}</span>
            </div>
        `;
        
        const container = document.getElementById('notificationContainer');
        container.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    },
    
    getNotificationIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }
};

document.addEventListener('DOMContentLoaded', () => {
    BookManager.init();
});