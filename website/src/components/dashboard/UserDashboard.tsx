import React, { useEffect } from 'react';
import { Calendar, Clock, BookOpen, RotateCcw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLibrary } from '../../context/LibraryContext';

export const UserDashboard: React.FC = () => {
  const { user } = useAuth();
  const { borrowedBooks, returnBook, fetchUserBorrows, renewBook } = useLibrary();

  useEffect(() => {
    fetchUserBorrows();
  }, [fetchUserBorrows]);

  const userBorrowedBooks = borrowedBooks.filter(record => 
    record.userId === user?.id && record.status === 'active'
  );

  const handleReturn = async (recordId: string) => {
    await returnBook(recordId);
  };

  const handleRenew = async (recordId: string) => {
    await renewBook(recordId);
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">My Dashboard</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center space-x-3">
              <BookOpen className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-blue-600">{userBorrowedBooks.length}</p>
                <p className="text-sm text-blue-700">Books Borrowed</p>
              </div>
            </div>
          </div>
          
          <div className="bg-amber-50 p-4 rounded-lg">
            <div className="flex items-center space-x-3">
              <Clock className="w-8 h-8 text-amber-600" />
              <div>
                <p className="text-2xl font-bold text-amber-600">
                  {userBorrowedBooks.filter(b => isOverdue(b.dueDate)).length}
                </p>
                <p className="text-sm text-amber-700">Overdue Books</p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center space-x-3">
              <RotateCcw className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {borrowedBooks.filter(b => b.userId === user?.id && b.status === 'returned').length}
                </p>
                <p className="text-sm text-green-700">Books Returned</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {userBorrowedBooks.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Currently Borrowed Books</h3>
          
          <div className="space-y-4">
            {userBorrowedBooks.map((record) => (
              <div
                key={record.id}
                className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                  isOverdue(record.dueDate)
                    ? 'border-red-200 bg-red-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <img
                      src={record.book.coverUrl ? `${record.book.coverUrl}${record.book.updatedAt ? `?t=${encodeURIComponent(record.book.updatedAt)}` : ''}` : ''}
                      alt={record.book.title}
                      className="w-12 h-16 object-cover rounded"
                    />
                    <div>
                      <h4 className="font-semibold text-gray-900">{record.book.title}</h4>
                      <p className="text-sm text-gray-600">{record.book.author}</p>
                      <div className="flex items-center space-x-4 mt-2">
                        <div className="flex items-center space-x-1 text-sm text-gray-500">
                          <Calendar className="w-4 h-4" />
                          <span>Due: {new Date(record.dueDate).toLocaleDateString()}</span>
                        </div>
                        {isOverdue(record.dueDate) && (
                          <span className="text-red-600 text-sm font-medium">OVERDUE</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleRenew(record.id)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                    >
                      Renew
                    </button>
                    <button
                      onClick={() => handleReturn(record.id)}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 focus:ring-2 focus:ring-green-500 transition-all duration-200"
                    >
                      Return Book
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {userBorrowedBooks.length === 0 && (
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 text-center">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No books borrowed</h3>
          <p className="text-gray-600">Browse our collection and borrow your first book!</p>
        </div>
      )}
    </div>
  );
};