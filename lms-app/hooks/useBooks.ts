import { useState, useEffect } from 'react';
import ApiService from '../services/api';
import { Book } from '../types/book';

export const useBooks = (initialParams = {}) => {
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<any>(null);

  const loadBooks = async (params = {}) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await ApiService.getBooks({ ...initialParams, ...params });
      
      if (response.success) {
        setBooks(response.books);
        setPagination(response.pagination);
      } else {
        setError(response.message || 'Failed to load books');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load books');
    } finally {
      setIsLoading(false);
    }
  };

  const searchBooks = async (searchTerm: string) => {
    await loadBooks({ search: searchTerm, page: 1 });
  };

  const filterByGenre = async (genre: string) => {
    await loadBooks({ genre, page: 1 });
  };

  const borrowBook = async (bookId: string) => {
    try {
      const response = await ApiService.borrowBook(bookId);
      if (response.success) {
        // Refresh books list to update availability
        await loadBooks();
      }
      return response;
    } catch (error) {
      throw error;
    }
  };

  useEffect(() => {
    loadBooks();
  }, []);

  return {
    books,
    isLoading,
    error,
    pagination,
    loadBooks,
    searchBooks,
    filterByGenre,
    borrowBook,
  };
};

export const useFeaturedBooks = () => {
  const [featuredBooks, setFeaturedBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFeaturedBooks = async () => {
    try {
      console.log('🚀 Loading featured books...');
      setIsLoading(true);
      setError(null);
      const response = await ApiService.getFeaturedBooks();
      console.log('📚 Featured books response in hook:', response);
      
      if (response.success) {
        console.log('✅ Setting featured books:', response.books);
        setFeaturedBooks(response.books);
      } else {
        console.error('❌ Failed to load featured books');
        setError('Failed to load featured books');
      }
    } catch (err: any) {
      console.error('💥 Exception in loadFeaturedBooks:', err);
      setError(err?.message || 'Failed to load featured books');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFeaturedBooks();
  }, []);

  return {
    featuredBooks,
    isLoading,
    error,
    loadFeaturedBooks,
  };
};
