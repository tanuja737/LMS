import axios from 'axios';

// Prefer env, otherwise fall back to the deployed Render API
// Cast import.meta to any to avoid TS complaining in non-Vite toolchains
const ENV_API: string | undefined = (import.meta as any)?.env?.VITE_API_URL;
const API_BASE_URL = ENV_API || 'https://api-lms-u1ki.onrender.com/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
});

export const setAuthToken = (token?: string | null) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

// Auth endpoints
export const authApi = {
  me: () => api.get('/auth/me'),
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  register: (data: { name: string; email: string; password: string; role?: 'borrower' | 'librarian' }) => api.post('/auth/register', data),
};

// Types for backend payloads and responses
export type BookCreatePayload = {
  title: string;
  author: string;
  isbn: string;
  quantity: number;
  available: number;
  description?: string;
  genre?: string;
  publishedYear?: number;
  coverUrl?: string;
};

export type BookUpdatePayload = Partial<BookCreatePayload>;

type BackendBook = {
  _id: string;
  title: string;
  author: string;
  isbn: string;
  description?: string;
  genre?: string;
  coverUrl?: string;
  quantity?: number;
  totalCopies?: number;
  available?: number;
  availableCopies?: number;
  publishedYear?: number;
  tags?: string[];
  updatedAt?: string;
};

type BackendUserMinimal = {
  _id: string;
  name?: string;
  email?: string;
};

type BackendBorrow = {
  _id: string;
  userId: string | BackendUserMinimal;
  bookId: string | BackendBook;
  borrowDate: string;
  dueDate: string;
  returnDate?: string;
  status: 'borrowed' | 'returned' | 'overdue';
};

// Books endpoints
export const booksApi = {
  list: (params: { search?: string; page?: number; limit?: number } = {}) =>
    api.get('/books', { params: { page: 1, limit: 20, ...params } }),
  get: (id: string) => api.get(`/books/${id}`),
  create: (payload: BookCreatePayload) => api.post('/books', payload),
  update: (id: string, payload: BookUpdatePayload) => api.put(`/books/${id}`, payload),
  remove: (id: string) => api.delete(`/books/${id}`),
};

// Borrow endpoints
export const borrowApi = {
  myBooks: () => api.get('/borrow/my-books'),
  create: (bookId: string) => api.post('/borrow', { bookId }),
  return: (borrowId: string) => api.post('/borrow/return', { borrowId }),
  renew: (borrowId: string) => api.patch(`/borrow/renew/${borrowId}`),
  all: (page = 1, limit = 10) => api.get('/borrow/all', { params: { page, limit } }),
  stats: () => api.get('/borrow/stats'),
};

// Helpers to map backend -> website types
export const mapBookFromBackend = (b: BackendBook) => ({
  id: b._id,
  title: b.title,
  author: b.author,
  isbn: b.isbn,
  category: b.genre || 'General',
  description: b.description || '',
  coverUrl: b.coverUrl || '',
  totalCopies: typeof b.quantity === 'number' ? b.quantity : (b.totalCopies ?? 0),
  availableCopies: typeof b.available === 'number' ? b.available : (b.availableCopies ?? 0),
  publishedYear: b.publishedYear || new Date().getFullYear(),
  tags: b.tags || [],
  updatedAt: b.updatedAt,
});

export const mapBorrowFromBackend = (r: BackendBorrow) => ({
  id: r._id,
  userId: typeof r.userId === 'object' ? r.userId._id : r.userId,
  userName: typeof r.userId === 'object' ? (r.userId.name || '') : undefined,
  userEmail: typeof r.userId === 'object' ? (r.userId.email || '') : undefined,
  bookId: typeof r.bookId === 'object' ? r.bookId._id : r.bookId,
  borrowDate: r.borrowDate,
  dueDate: r.dueDate,
  returnDate: r.returnDate,
  status: r.status === 'borrowed' ? 'active' : (r.status || 'active'),
  book: r.bookId && typeof r.bookId === 'object' ? mapBookFromBackend(r.bookId) : undefined,
});
