import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LibraryProvider, useLibrary } from './context/LibraryContext';
import { LoginForm } from './components/auth/LoginForm';
import { RegisterForm } from './components/auth/RegisterForm';
import { Header } from './components/layout/Header';
import { Navigation } from './components/layout/Navigation';
import { BookGrid } from './components/books/BookGrid';
import { BookFilters } from './components/books/BookFilters';
import { UserDashboard } from './components/dashboard/UserDashboard';
import { AdminPanel } from './components/admin/AdminPanel';
import { LoadingSpinner } from './components/common/LoadingSpinner';

const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {isLogin ? (
          <LoginForm onToggleMode={() => setIsLogin(false)} />
        ) : (
          <RegisterForm onToggleMode={() => setIsLogin(true)} />
        )}
      </div>
    </div>
  );
};

const MainApp: React.FC = () => {
  const [activeView, setActiveView] = useState('catalog');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const { books, fetchBooks } = useLibrary();

  React.useEffect(() => {
    fetchBooks(searchQuery);
  }, [fetchBooks, searchQuery]);

  const filteredBooks = React.useMemo(() => {
    let result = books;
    if (selectedCategory) {
      result = result.filter(book => book.category === selectedCategory);
    }
    return result;
  }, [books, selectedCategory]);

  const categories = React.useMemo(() => {
    return Array.from(new Set(books.map(book => book.category))).sort();
  }, [books]);

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <UserDashboard />;
      case 'admin':
        return <AdminPanel />;
      case 'catalog':
      default:
        return (
          <div>
            <BookFilters
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              categories={categories}
            />
            <BookGrid books={filteredBooks} searchQuery={searchQuery} />
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onSearchChange={setSearchQuery} searchQuery={searchQuery} />
      <Navigation activeView={activeView} onViewChange={setActiveView} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </main>
    </div>
  );
};

const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  return (
    <LibraryProvider>
      <MainApp />
    </LibraryProvider>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;