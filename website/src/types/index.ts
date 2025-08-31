export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  createdAt: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  category: string;
  description: string;
  coverUrl: string;
  totalCopies: number;
  availableCopies: number;
  publishedYear: number;
  tags: string[];
  updatedAt?: string;
}

export interface BorrowRecord {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  bookId: string;
  borrowDate: string;
  dueDate: string;
  returnDate?: string;
  status: 'active' | 'returned' | 'overdue';
  book: Book;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}