import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { Book, BorrowRecord } from '../types';
import { booksApi, borrowApi, mapBookFromBackend, mapBorrowFromBackend, BookUpdatePayload } from '../services/api';

interface LibraryContextType {
  books: Book[];
  borrowedBooks: BorrowRecord[];
  loading: boolean;
  error?: string | null;
  fetchBooks: (query?: string) => Promise<void>;
  searchBooks: (query: string) => Promise<void>;
  fetchUserBorrows: () => Promise<void>;
  fetchAllBorrows: () => Promise<void>;
  borrowBook: (bookId: string) => Promise<boolean>;
  returnBook: (recordId: string) => Promise<boolean>;
  renewBook: (recordId: string) => Promise<boolean>;
  addBook: (book: Omit<Book, 'id'>) => Promise<boolean>;
  updateBook: (id: string, updates: Partial<Book>) => Promise<boolean>;
  deleteBook: (id: string) => Promise<boolean>;
}

const LibraryContext = createContext<LibraryContextType | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export const useLibrary = () => {
  const context = useContext(LibraryContext);
  if (!context) {
    throw new Error('useLibrary must be used within a LibraryProvider');
  }
  return context;
};

interface LibraryProviderProps {
  children: ReactNode;
}

export const LibraryProvider: React.FC<LibraryProviderProps> = ({ children }) => {
  const [books, setBooks] = useState<Book[]>([]);
  const [borrowedBooks, setBorrowedBooks] = useState<BorrowRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBooks = useCallback(async (query = '') => {
    setLoading(true);
    setError(null);
    try {
      const res = await booksApi.list(query ? { search: query, page: 1, limit: 50 } : { page: 1, limit: 50 });
      const data = res.data.data.books || res.data.data;
      const mapped = (data || []).map(mapBookFromBackend);
      setBooks(mapped);
    } catch (e) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err?.response?.data?.message || 'Failed to fetch books');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // initial load
    fetchBooks();
  }, [fetchBooks]);

  const searchBooks = async (query: string) => fetchBooks(query);

  const fetchUserBorrows = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await borrowApi.myBooks();
      const borrows = res.data.data.borrows || [];
      const mapped = borrows.map(mapBorrowFromBackend);
      setBorrowedBooks(mapped);
    } catch (e) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err?.response?.data?.message || 'Failed to fetch borrowed books');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAllBorrows = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await borrowApi.all(1, 10);
      const borrows = res.data.data.borrows || [];
      const mapped = borrows.map(mapBorrowFromBackend);
      setBorrowedBooks(mapped);
    } catch (e) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err?.response?.data?.message || 'Failed to fetch borrow records');
    } finally {
      setLoading(false);
    }
  }, []);

  const borrowBook = async (bookId: string): Promise<boolean> => {
    try {
      await borrowApi.create(bookId);
      await fetchUserBorrows();
      await fetchBooks();
      return true;
    } catch {
      return false;
    }
  };

  const returnBook = async (recordId: string): Promise<boolean> => {
    try {
      await borrowApi.return(recordId);
      await fetchUserBorrows();
      await fetchBooks();
      return true;
    } catch {
      return false;
    }
  };

  const renewBook = async (recordId: string): Promise<boolean> => {
    try {
      await borrowApi.renew(recordId);
      await fetchUserBorrows();
      return true;
    } catch {
      return false;
    }
  };

  const addBook = async (book: Omit<Book, 'id'>): Promise<boolean> => {
    try {
      const payload = {
        title: book.title,
        author: book.author,
        isbn: book.isbn,
        quantity: book.totalCopies,
        available: book.availableCopies,
        description: book.description,
        genre: book.category,
        publishedYear: book.publishedYear,
  coverUrl: book.coverUrl,
      };
      await booksApi.create(payload);
      await fetchBooks();
      return true;
    } catch {
      return false;
    }
  };

  const updateBook = async (id: string, updates: Partial<Book>): Promise<boolean> => {
    try {
      const payload: BookUpdatePayload = {};
      if (updates.title !== undefined) payload.title = updates.title;
      if (updates.author !== undefined) payload.author = updates.author;
      if (updates.isbn !== undefined) payload.isbn = updates.isbn;
      if (updates.totalCopies !== undefined) payload.quantity = updates.totalCopies;
      if (updates.availableCopies !== undefined) payload.available = updates.availableCopies;
      if (updates.description !== undefined) payload.description = updates.description;
      if (updates.category !== undefined) payload.genre = updates.category;
      if (updates.publishedYear !== undefined) payload.publishedYear = updates.publishedYear;
  if (updates.coverUrl !== undefined) payload.coverUrl = updates.coverUrl;
      await booksApi.update(id, payload);
      await fetchBooks();
      return true;
    } catch {
      return false;
    }
  };

  const deleteBook = async (id: string): Promise<boolean> => {
    try {
      await booksApi.remove(id);
      await fetchBooks();
      return true;
    } catch (e) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err?.response?.data?.message || 'Failed to delete book');
      return false;
    }
  };

  const value: LibraryContextType = {
    books,
    borrowedBooks,
    loading,
    error,
    fetchBooks,
    searchBooks,
    fetchUserBorrows,
    fetchAllBorrows,
    borrowBook,
    returnBook,
    renewBook,
    addBook,
    updateBook,
    deleteBook,
  };

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
};