// Book data management
const BookManager = {
    init() {
      this.loadBooks();
      this.setupEventListeners();
    },
  
    loadBooks() {
      this.books = this.getBooksFromStorage();
      this.renderBooks(this.books);
    },
  
    getBooksFromStorage() {
      try {
        return JSON.parse(localStorage.getItem('books')) || [];
      } catch (error) {
        console.error('Error loading books:', error);
        this.showAlert('Gagal memuat data', 'error');
        return [];
      }
    },
  
    saveBooksToStorage(books) {
      try {
        localStorage.setItem('books', JSON.stringify(books));
        return true;
      } catch (error) {
        console.error('Error saving books:', error);
        this.showAlert('Gagal menyimpan data', 'error');
        return false;
      }
    },
  
    addBook(title, author, year, isComplete = false) {
      // Validate inputs
      if (!title || !author || !year) {
        this.showAlert('Harap isi semua field yang diperlukan', 'error');
        return false;
      }
  
      if (isNaN(year) || year.length !== 4) {
        this.showAlert('Tahun harus berupa angka 4 digit', 'error');
        return false;
      }
  
      const newBook = {
        id: Date.now().toString(),
        title: title.trim(),
        author: author.trim(),
        year: parseInt(year),
        isComplete,
        createdAt: new Date().toISOString()
      };
  
      this.books.unshift(newBook);
      this.saveBooksToStorage(this.books);
      this.renderBooks(this.books);
      this.showAlert('Buku berhasil ditambahkan', 'success');
      this.resetForm();
      return true;
    },
  
    toggleBookStatus(id) {
      const bookIndex = this.books.findIndex(book => book.id === id);
      
      if (bookIndex !== -1) {
        this.books[bookIndex].isComplete = !this.books[bookIndex].isComplete;
        this.saveBooksToStorage(this.books);
        this.renderBooks(this.books);
        
        const status = this.books[bookIndex].isComplete ? 'selesai' : 'belum selesai';
        this.showAlert(`Status buku diubah menjadi ${status}`, 'success');
      }
    },
  
    deleteBook(id) {
      if (confirm('Apakah Anda yakin ingin menghapus buku ini?')) {
        this.books = this.books.filter(book => book.id !== id);
        this.saveBooksToStorage(this.books);
        this.renderBooks(this.books);
        this.showAlert('Buku berhasil dihapus', 'success');
      }
    },
  
    renderBooks(books = this.books) {
      const unfinishedList = document.getElementById('incompleteBookshelfList');
      const completedList = document.getElementById('completeBookshelfList');
      
      unfinishedList.innerHTML = '';
      completedList.innerHTML = '';
  
      if (books.length === 0) {
        unfinishedList.innerHTML = '<p class="empty-message">Tidak ada buku yang ditemukan</p>';
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
      const element = document.createElement('article');
      element.className = 'book-item';
      element.innerHTML = `
        <h3>${book.title}</h3>
        <p>Penulis: ${book.author}</p>
        <p>Tahun: ${book.year}</p>
        <div class="action">
          <button class="green" data-id="${book.id}">
            ${book.isComplete ? 'Belum selesai' : 'Selesai'}
          </button>
          <button class="red" data-id="${book.id}">Hapus</button>
        </div>
      `;
      return element;
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
  
      // Event delegation for buttons
      document.addEventListener('click', (e) => {
        const target = e.target.closest('button');
        if (!target || !target.dataset.id) return;
        
        const id = target.dataset.id;
        if (target.classList.contains('green')) {
          this.toggleBookStatus(id);
        } else if (target.classList.contains('red')) {
          this.deleteBook(id);
        }
      });
  
      // Search functionality
      document.getElementById('searchBook').addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const filteredBooks = this.books.filter(book => 
          book.title.toLowerCase().includes(query) || 
          book.author.toLowerCase().includes(query)
        );
        this.renderBooks(filteredBooks);
      });
    },
  
    resetForm() {
      document.getElementById('inputBook').reset();
      document.getElementById('inputBookTitle').focus();
    },
  
    showAlert(message, type = 'info') {
      const alert = document.createElement('div');
      alert.className = `alert alert-${type}`;
      alert.textContent = message;
      
      const container = document.getElementById('alertContainer');
      container.appendChild(alert);
      
      setTimeout(() => {
        alert.classList.add('fade-out');
        setTimeout(() => alert.remove(), 300);
      }, 3000);
    }
  };
  
  // Initialize the app
  document.addEventListener('DOMContentLoaded', () => {
    BookManager.init();
  });