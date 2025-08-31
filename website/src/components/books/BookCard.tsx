import React, { useState } from 'react';
import { Calendar, User, BookOpen, Clock, Check } from 'lucide-react';
import { Book } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useLibrary } from '../../context/LibraryContext';

interface BookCardProps {
  book: Book;
}

export const BookCard: React.FC<BookCardProps> = ({ book }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const { user } = useAuth();
  const { borrowBook } = useLibrary();

  const handleBorrow = async () => {
    if (!user || book.availableCopies <= 0) return;
    
    setIsLoading(true);
    try {
  await borrowBook(book.id);
    } finally {
      setIsLoading(false);
    }
  };

  const isAvailable = book.availableCopies > 0;

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden group">
      <div className="relative">
        <img
          src={book.coverUrl ? `${book.coverUrl}${book.updatedAt ? `?t=${encodeURIComponent(book.updatedAt)}` : ''}` : ''}
          alt={book.title}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-2 right-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            isAvailable 
              ? 'bg-green-100 text-green-700' 
              : 'bg-red-100 text-red-700'
          }`}>
            {isAvailable ? `${book.availableCopies} available` : 'Not available'}
          </span>
        </div>
      </div>

      <div className="p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-2">
            {book.title}
          </h3>
          <div className="flex items-center text-gray-600 mb-2">
            <User className="w-4 h-4 mr-1" />
            <span className="text-sm">{book.author}</span>
          </div>
          <div className="flex items-center text-gray-500 mb-3">
            <Calendar className="w-4 h-4 mr-1" />
            <span className="text-sm">{book.publishedYear}</span>
            <span className="mx-2">•</span>
            <span className="text-sm">{book.category}</span>
          </div>
        </div>

        {showDetails && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700 mb-2">{book.description}</p>
            <div className="flex flex-wrap gap-1">
              {book.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
          >
            {showDetails ? 'Show Less' : 'More Details'}
          </button>

          {user?.role !== 'admin' && (
            <button
              onClick={handleBorrow}
              disabled={!isAvailable || isLoading}
              className={`flex items-center space-x-1 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                isAvailable && !isLoading
                  ? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500'
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isLoading ? (
                <Clock className="w-4 h-4 animate-spin" />
              ) : isAvailable ? (
                <BookOpen className="w-4 h-4" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              <span>
                {isLoading ? 'Borrowing...' : isAvailable ? 'Borrow' : 'Unavailable'}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};