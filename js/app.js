/**
 * Book Management System
 * A comprehensive solution for managing book collections with local storage
 */
const BookManager = {
    // Initialize the application
    init() {
      this.cacheDOM();
      this.loadBooks();
      this.setupEventListeners();
    },
  
    // Cache DOM elements for better performance
    cacheDOM() {
      this.dom = {
        form: document.getElementById('inputBook'),
        titleInput: document.getElementById('inputBookTitle'),
        authorInput: document.getElementById('inputBookAuthor'),
        yearInput: document.getElementById('inputBookYear'),
        isCompleteInput: document.getElementById('inputBookIsComplete'),
        searchInput: document.getElementById('searchBook'),
        unfinishedList: document.getElementById('incompleteBookshelfList'),
        completedList: document.getElementById('completeBookshelfList'),
        alertContainer: document.getElementById('alertContainer')
      };
    },
  
    // Load books from storage and render them
    loadBooks() {
      this.books = this.getBooksFromStorage();
      this.renderBooks();
    },
  
    // Get books from localStorage with error handling
    getBooksFromStorage() {
      try {
        const books = localStorage.getItem('books');
        return books ? JSON.parse(books) : [];
      } catch (error) {
        console.error('Error loading books:', error);
        this.showAlert('Gagal memuat data buku', 'error');
        return [];
      }
    },
  
    // Save books to localStorage with error handling
    saveBooksToStorage() {
      try {
        localStorage.setItem('books', JSON.stringify(this.books));
        return true;
      } catch (error) {
        console.error('Error saving books:', error);
        this.showAlert('Gagal menyimpan data buku', 'error');
        return false;
      }
    },
  
    // Add a new book to the collection
    addBook(title, author, year, isComplete = false) {
      // Input validation
      if (!this.validateInputs(title, author, year)) {
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
  
      this.books.unshift(newBook);
      this.saveBooksToStorage();
      this.renderBooks();
      this.showAlert('Buku berhasil ditambahkan', 'success');
      this.resetForm();
      return true;
    },
  
    // Validate form inputs
    validateInputs(title, author, year) {
      if (!title || !author || !year) {
        this.showAlert('Harap isi semua field yang diperlukan', 'error');
        return false;
      }
  
      if (isNaN(year) || year.length !== 4) {
        this.showAlert('Tahun harus berupa angka 4 digit', 'error');
        return false;
      }
  
      return true;
    },
  
    // Toggle book completion status
    toggleBookStatus(id) {
      const bookIndex = this.findBookIndex(id);
      
      if (bookIndex !== -1) {
        this.books[bookIndex].isComplete = !this.books[bookIndex].isComplete;
        this.books[bookIndex].updatedAt = new Date().toISOString();
        this.saveBooksToStorage();
        this.renderBooks();
        
        const status = this.books[bookIndex].isComplete ? 'selesai dibaca' : 'belum selesai dibaca';
        this.showAlert(`Status buku diubah menjadi "${status}"`, 'success');
        return true;
      }
      return false;
    },
  
    // Find book index by ID
    findBookIndex(id) {
      return this.books.findIndex(book => book.id === id);
    },
  
    // Delete a book from the collection
    deleteBook(id) {
      if (confirm('Apakah Anda yakin ingin menghapus buku ini?')) {
        const initialLength = this.books.length;
        this.books = this.books.filter(book => book.id !== id);
        
        if (this.books.length < initialLength) {
          this.saveBooksToStorage();
          this.renderBooks();
          this.showAlert('Buku berhasil dihapus', 'success');
          return true;
        }
      }
      return false;
    },
  
    // Render books to the DOM
    renderBooks(books = this.books) {
      this.dom.unfinishedList.innerHTML = '';
      this.dom.completedList.innerHTML = '';
  
      if (books.length === 0) {
        this.dom.unfinishedList.innerHTML = this.createEmptyState('Tidak ada buku yang ditemukan');
        return;
      }
  
      books.forEach(book => {
        const bookElement = this.createBookElement(book);
        const targetList = book.isComplete ? this.dom.completedList : this.dom.unfinishedList;
        targetList.appendChild(bookElement);
      });
    },
  
    // Create empty state message
    createEmptyState(message) {
      return `
        <div class="empty-state">
          <i class="fas fa-book-open empty-state__icon"></i>
          <p class="empty-message">${message}</p>
        </div>
      `;
    },
  
    // Create book DOM element
    createBookElement(book) {
      const element = document.createElement('article');
      element.className = 'book-item card';
      element.innerHTML = `
        <div class="card__body">
          <h3 class="book-title">${this.escapeHTML(book.title)}</h3>
          <p class="book-author">Penulis: ${this.escapeHTML(book.author)}</p>
          <p class="book-year">Tahun: ${book.year}</p>
          <p class="book-updated">Terakhir diupdate: ${new Date(book.updatedAt).toLocaleDateString()}</p>
          <div class="action-buttons flex gap-2">
            <button class="btn btn--${book.isComplete ? 'warning' : 'success'}" data-id="${book.id}" data-action="toggle">
              ${book.isComplete ? 'Belum Selesai' : 'Selesai Dibaca'}
            </button>
            <button class="btn btn--danger" data-id="${book.id}" data-action="delete">
              Hapus
            </button>
            <button class="btn btn--outline-primary" data-id="${book.id}" data-action="edit">
              Edit
            </button>
          </div>
        </div>
      `;
      return element;
    },
  
    // Basic HTML escaping for security
    escapeHTML(str) {
      return str.replace(/[&<>'"]/g, 
        tag => ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          "'": '&#39;',
          '"': '&quot;'
        }[tag]));
    },
  
    // Set up event listeners
    setupEventListeners() {
      // Form submission
      this.dom.form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.addBook(
          this.dom.titleInput.value,
          this.dom.authorInput.value,
          this.dom.yearInput.value,
          this.dom.isCompleteInput.checked
        );
      });
  
      // Event delegation for all buttons
      document.addEventListener('click', (e) => {
        const button = e.target.closest('[data-id][data-action]');
        if (!button) return;
  
        const { id, action } = button.dataset;
        
        switch (action) {
          case 'toggle':
            this.toggleBookStatus(id);
            break;
          case 'delete':
            this.deleteBook(id);
            break;
          case 'edit':
            this.editBook(id);
            break;
        }
      });
  
      // Search functionality with debounce
      this.dom.searchInput.addEventListener('input', this.debounce(() => {
        const query = this.dom.searchInput.value.toLowerCase();
        const filteredBooks = this.books.filter(book => 
          book.title.toLowerCase().includes(query) || 
          book.author.toLowerCase().includes(query)
        );
        this.renderBooks(filteredBooks);
      }, 300));
    },
  
    // Simple debounce function
    debounce(func, delay) {
      let timeoutId;
      return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
      };
    },
  
    // Reset form inputs
    resetForm() {
      this.dom.form.reset();
      this.dom.titleInput.focus();
    },
  
    // Show alert message
    showAlert(message, type = 'info') {
      const alert = document.createElement('div');
      alert.className = `alert alert--${type} fade-in`;
      alert.innerHTML = `
        <i class="fas ${this.getAlertIcon(type)}"></i>
        <span>${message}</span>
      `;
      
      this.dom.alertContainer.appendChild(alert);
      
      setTimeout(() => {
        alert.classList.add('fade-out');
        setTimeout(() => alert.remove(), 300);
      }, 3000);
    },
  
    // Get appropriate icon for alert type
    getAlertIcon(type) {
      const icons = {
        success: 'fa-check-circle',
        error: 'fa-times-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
      };
      return icons[type] || 'fa-info-circle';
    },
  
    // Edit book functionality (to be implemented)
    editBook(id) {
      const bookIndex = this.findBookIndex(id);
      if (bookIndex !== -1) {
        const book = this.books[bookIndex];
        this.dom.titleInput.value = book.title;
        this.dom.authorInput.value = book.author;
        this.dom.yearInput.value = book.year;
        this.dom.isCompleteInput.checked = book.isComplete;
        
        // Change form to edit mode
        this.dom.form.dataset.editId = id;
        this.dom.titleInput.focus();
        this.showAlert('Silahkan edit buku', 'info');
      }
    }
  };
  
  // Initialize the app when DOM is fully loaded
  document.addEventListener('DOMContentLoaded', () => {
    BookManager.init();
  });