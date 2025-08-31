import React, { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Users, BookOpen, Link as LinkIcon, Image as ImageIcon, ClipboardPaste } from 'lucide-react';
import { useLibrary } from '../../context/LibraryContext';
import { Book } from '../../types';

export const AdminPanel: React.FC = () => {
  const { books, borrowedBooks, addBook, updateBook, deleteBook, fetchAllBorrows, error } = useLibrary();
  const [activeTab, setActiveTab] = useState<'books' | 'users' | 'add-book'>('books');
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [addCoverError, setAddCoverError] = useState<string | null>(null);
  const [editCoverError, setEditCoverError] = useState<string | null>(null);

  const [newBook, setNewBook] = useState({
    title: '',
    author: '',
    isbn: '',
    category: '',
    description: '',
  coverUrl: '',
    totalCopies: 1,
    availableCopies: 1,
    publishedYear: new Date().getFullYear(),
    tags: [] as string[],
  });

  const handleAddBook = (e: React.FormEvent) => {
    e.preventDefault();
    addBook(newBook);
    setNewBook({
      title: '',
      author: '',
      isbn: '',
      category: '',
      description: '',
      coverUrl: '',
      totalCopies: 1,
      availableCopies: 1,
      publishedYear: new Date().getFullYear(),
      tags: [],
    });
    setActiveTab('books');
  };

  const handleUpdateBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingBook) {
      updateBook(editingBook.id, editingBook);
      setEditingBook(null);
      setActiveTab('books');
    }
  };

  const handleDeleteBook = async (id: string, title: string) => {
    const confirmed = confirm(`Delete "${title}"? This action cannot be undone.`);
    if (!confirmed) return;
    setDeletingId(id);
    const ok = await deleteBook(id);
    setDeletingId(null);
    if (!ok) {
      alert('Failed to delete book. It may have active borrows or a server error occurred.');
    }
  };

  // Helpers for cover URL (online image)
  const useOpenLibraryCoverForAdd = () => {
    if (!newBook.isbn.trim()) {
      alert('Please enter an ISBN first.');
      return;
    }
    const url = `https://covers.openlibrary.org/b/isbn/${encodeURIComponent(newBook.isbn)}-L.jpg`;
    setNewBook({ ...newBook, coverUrl: url });
    setAddCoverError(null);
  };

  const useOpenLibraryCoverForEdit = () => {
    if (!editingBook) return;
    if (!editingBook.isbn.trim()) {
      alert('Please enter an ISBN first.');
      return;
    }
    const url = `https://covers.openlibrary.org/b/isbn/${encodeURIComponent(editingBook.isbn)}-L.jpg`;
    setEditingBook({ ...editingBook, coverUrl: url });
    setEditCoverError(null);
  };

  const pasteUrlIntoAdd = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (/^https?:\/\//i.test(text)) {
        setNewBook({ ...newBook, coverUrl: text.trim() });
        setAddCoverError(null);
      } else {
        alert('Clipboard does not contain a valid URL.');
      }
    } catch {
      alert('Could not read from clipboard. Please paste manually.');
    }
  };

  const pasteUrlIntoEdit = async () => {
    if (!editingBook) return;
    try {
      const text = await navigator.clipboard.readText();
      if (/^https?:\/\//i.test(text)) {
        setEditingBook({ ...editingBook, coverUrl: text.trim() });
        setEditCoverError(null);
      } else {
        alert('Clipboard does not contain a valid URL.');
      }
    } catch {
      alert('Could not read from clipboard. Please paste manually.');
    }
  };

  const activeBorrowedBooks = borrowedBooks.filter(record => record.status === 'active');

  useEffect(() => {
    if (activeTab === 'users') {
      fetchAllBorrows();
    }
  }, [activeTab, fetchAllBorrows]);

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        {error && (
          <div className="mb-4 rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
            {error}
          </div>
        )}
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Admin Dashboard</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center space-x-3">
              <BookOpen className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-blue-600">{books.length}</p>
                <p className="text-sm text-blue-700">Total Books</p>
              </div>
            </div>
          </div>
          
          <div className="bg-amber-50 p-4 rounded-lg">
            <div className="flex items-center space-x-3">
              <Users className="w-8 h-8 text-amber-600" />
              <div>
                <p className="text-2xl font-bold text-amber-600">{activeBorrowedBooks.length}</p>
                <p className="text-sm text-amber-700">Active Borrows</p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center space-x-3">
              <BookOpen className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {books.reduce((sum, book) => sum + book.availableCopies, 0)}
                </p>
                <p className="text-sm text-green-700">Available Copies</p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('books')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'books'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Manage Books
            </button>
            <button
              onClick={() => setActiveTab('add-book')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'add-book'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Add New Book
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'users'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Borrowed Books
            </button>
          </nav>
        </div>

        {activeTab === 'books' && (
          <div className="space-y-4">
            {books.map((book) => (
              <div key={book.id} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <img
                      src={book.coverUrl ? `${book.coverUrl}${book.updatedAt ? `?t=${encodeURIComponent(book.updatedAt)}` : ''}` : ''}
                      alt={book.title}
                      className="w-12 h-16 object-cover rounded"
                    />
                    <div>
                      <h4 className="font-semibold text-gray-900">{book.title}</h4>
                      <p className="text-sm text-gray-600">{book.author}</p>
                      <p className="text-xs text-gray-500">
                        {book.availableCopies}/{book.totalCopies} available
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setEditingBook(book)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteBook(book.id, book.title)}
                      disabled={deletingId === book.id}
                      className={`p-2 rounded-lg transition-colors ${
                        deletingId === book.id
                          ? 'text-red-400 bg-red-50 cursor-not-allowed'
                          : 'text-red-600 hover:bg-red-50'
                      }`}
                    >
                      <Trash2 className={`w-4 h-4 ${deletingId === book.id ? 'animate-pulse' : ''}`} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'add-book' && (
          <form onSubmit={handleAddBook} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Book Title"
                value={newBook.title}
                onChange={(e) => setNewBook({ ...newBook, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
              <input
                type="text"
                placeholder="Author"
                value={newBook.author}
                onChange={(e) => setNewBook({ ...newBook, author: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
              <input
                type="text"
                placeholder="ISBN"
                value={newBook.isbn}
                onChange={(e) => setNewBook({ ...newBook, isbn: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
              <input
                type="text"
                placeholder="Category"
                value={newBook.category}
                onChange={(e) => setNewBook({ ...newBook, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
              <input
                type="url"
                placeholder="Cover Image URL"
                value={newBook.coverUrl}
                onChange={(e) => setNewBook({ ...newBook, coverUrl: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                pattern="https?://.*"
              />
              <input
                type="number"
                placeholder="Total Copies"
                value={newBook.totalCopies}
                onChange={(e) => setNewBook({ ...newBook, totalCopies: parseInt(e.target.value), availableCopies: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                min="1"
                required
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={pasteUrlIntoAdd}
                className="inline-flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
                title="Paste URL from clipboard"
              >
                <ClipboardPaste className="w-4 h-4" /> Paste URL
              </button>
              <button
                type="button"
                onClick={useOpenLibraryCoverForAdd}
                className="inline-flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
                title="Use OpenLibrary cover from ISBN"
              >
                <LinkIcon className="w-4 h-4" /> Use ISBN Cover
              </button>
            </div>
            {newBook.coverUrl && (
              <div className="flex items-start gap-4">
                <div className="w-24 h-32 overflow-hidden rounded border">
                  <img
                    src={newBook.coverUrl}
                    alt="Cover Preview"
                    className="w-full h-full object-cover"
                    onError={() => setAddCoverError('Could not load image from the provided URL.')}
                    onLoad={() => setAddCoverError(null)}
                  />
                </div>
                <div className="text-sm text-gray-600">
                  <div className="flex items-center gap-2 mb-1"><ImageIcon className="w-4 h-4" /> Preview</div>
                  {addCoverError && (
                    <p className="text-red-600">{addCoverError}</p>
                  )}
                </div>
              </div>
            )}
            <textarea
              placeholder="Book Description"
              value={newBook.description}
              onChange={(e) => setNewBook({ ...newBook, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={3}
              required
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 transition-all duration-200"
            >
              <Plus className="w-4 h-4 inline mr-2" />
              Add Book
            </button>
          </form>
        )}

        {activeTab === 'users' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Currently Borrowed Books</h3>
            {activeBorrowedBooks.length === 0 ? (
              <p className="text-gray-600">No books are currently borrowed.</p>
            ) : (
              activeBorrowedBooks.map((record) => (
                <div key={record.id} className="p-4 border border-gray-200 rounded-lg">
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
                        <p className="text-xs text-gray-500">
                          Due: {new Date(record.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">
                        {record.userName || record.userEmail ? (
                          <>
                            <span className="font-medium">{record.userName || 'Borrower'}</span>
                            {record.userEmail && (
                              <span className="text-gray-500"> • {record.userEmail}</span>
                            )}
                          </>
                        ) : (
                          <>User ID: {record.userId}</>
                        )}
                      </p>
                      <p className="text-xs text-gray-500">
                        Borrowed: {new Date(record.borrowDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {editingBook && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-xl max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Book</h3>
            <form onSubmit={handleUpdateBook} className="space-y-4">
              <input
                type="text"
                placeholder="Book Title"
                value={editingBook.title}
                onChange={(e) => setEditingBook({ ...editingBook, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
              <input
                type="text"
                placeholder="Author"
                value={editingBook.author}
                onChange={(e) => setEditingBook({ ...editingBook, author: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
              <input
                type="number"
                placeholder="Total Copies"
                value={editingBook.totalCopies}
                onChange={(e) => setEditingBook({ ...editingBook, totalCopies: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                min="1"
                required
              />
              <input
                type="url"
                placeholder="Cover Image URL"
                value={editingBook.coverUrl}
                onChange={(e) => setEditingBook({ ...editingBook, coverUrl: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                pattern="https?://.*"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={pasteUrlIntoEdit}
                  className="inline-flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
                  title="Paste URL from clipboard"
                >
                  <ClipboardPaste className="w-4 h-4" /> Paste URL
                </button>
                <button
                  type="button"
                  onClick={useOpenLibraryCoverForEdit}
                  className="inline-flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
                  title="Use OpenLibrary cover from ISBN"
                >
                  <LinkIcon className="w-4 h-4" /> Use ISBN Cover
                </button>
              </div>
              {editingBook.coverUrl && (
                <div className="flex items-start gap-4">
                  <div className="w-24 h-32 overflow-hidden rounded border">
                    <img
                      src={editingBook.coverUrl}
                      alt="Cover Preview"
                      className="w-full h-full object-cover"
                      onError={() => setEditCoverError('Could not load image from the provided URL.')}
                      onLoad={() => setEditCoverError(null)}
                    />
                  </div>
                  <div className="text-sm text-gray-600">
                    <div className="flex items-center gap-2 mb-1"><ImageIcon className="w-4 h-4" /> Preview</div>
                    {editCoverError && (
                      <p className="text-red-600">{editCoverError}</p>
                    )}
                  </div>
                </div>
              )}
              <div className="flex space-x-2">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Update Book
                </button>
                <button
                  type="button"
                  onClick={() => setEditingBook(null)}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};