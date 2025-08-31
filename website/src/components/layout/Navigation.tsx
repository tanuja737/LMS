import React from 'react';
import { Home, BookOpen, User, Settings } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface NavigationProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeView, onViewChange }) => {
  const { user } = useAuth();

  const navigationItems = [
    { id: 'catalog', label: 'Book Catalog', icon: BookOpen },
    { id: 'dashboard', label: 'My Dashboard', icon: Home },
    ...(user?.role === 'admin' ? [{ id: 'admin', label: 'Admin Panel', icon: Settings }] : []),
  ];

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-8 overflow-x-auto">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`flex items-center space-x-2 py-4 px-3 border-b-2 font-medium text-sm transition-all duration-200 ${
                  activeView === item.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};