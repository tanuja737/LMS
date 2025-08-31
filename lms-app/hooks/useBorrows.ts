import { useState, useEffect } from 'react';
import ApiService from '../services/api';
import { Book } from '../types/book';

type BorrowStatus = 'borrowed' | 'returned' | 'overdue';
export interface BorrowRecord {
  _id: string;
  userId: string;
  bookId: Book;
  borrowDate: string;
  dueDate: string;
  returnDate?: string | null;
  status: BorrowStatus;
  renewalCount?: number;
}

export const useBorrows = () => {
  const [borrows, setBorrows] = useState<BorrowRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadUserBorrows = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await ApiService.getUserBorrows();

      if (response.success) {
        setBorrows(response.borrows as BorrowRecord[]);
      } else {
        setError(response.message || 'Failed to load borrowed books');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load borrowed books');
    } finally {
      setIsLoading(false);
    }
  };

  const returnBook = async (borrowId: string) => {
    try {
      const response = await ApiService.returnBook(borrowId);
      if (response.success) {
        // Refresh borrows list
        await loadUserBorrows();
      }
      return response;
    } catch (error) {
      throw error;
    }
  };

  const renewBook = async (borrowId: string) => {
    try {
      const response = await ApiService.renewBook(borrowId);
      if (response.success) {
        // Refresh borrows list
        await loadUserBorrows();
      }
      return response;
    } catch (error) {
      throw error;
    }
  };

  useEffect(() => {
    loadUserBorrows();
  }, []);

  return {
    borrows,
    isLoading,
    error,
    loadUserBorrows,
    returnBook,
    renewBook,
  };
};
