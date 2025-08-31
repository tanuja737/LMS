export interface Book {
  _id: string;
  title: string;
  author: string;
  genre: string;
  isbn: string;
  coverImage?: string;
  available: number; // number of available copies
  quantity?: number;
  rating?: number;
  description?: string;
  publishedYear?: number;
  pages?: number;
}

export interface BorrowedBook {
  _id: string;
  book: Book;
  user: string;
  borrowedDate: string;
  dueDate: string;
  returned?: boolean;
  renewalCount?: number;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'borrower' | 'librarian';
  createdAt?: string;
}