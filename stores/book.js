// stores/book.js
import { defineStore } from 'pinia';

export const useBookStore = defineStore('books', {
  state: () => ({
    books: [],
    loading: false
  }),
  actions: {
    async fetchBooks() {
      this.loading = true;
      const { data } = await api.get('/api/books');
      this.books = data;
      this.loading = false;
    }
  },
  persist: true // Untuk penyimpanan lokal
});