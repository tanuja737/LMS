import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Search, Filter, Book } from 'lucide-react-native';
import { useBooks } from '../../hooks/useBooks';

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const { books, isLoading, searchBooks, borrowBook } = useBooks();

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      // Load all books when search is empty
      searchBooks('');
    } else {
      searchBooks(query);
    }
  };

  const handleBorrow = async (bookId: string) => {
    try {
      const response = await borrowBook(bookId);
      if (response.success) {
        Alert.alert('Success', 'Book borrowed successfully!');
      } else {
        Alert.alert('Error', response.message || 'Failed to borrow book');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to borrow book');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Search Library</Text>
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Search size={20} color="#9CA3AF" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search books, authors, genres..."
              value={searchQuery}
              onChangeText={handleSearch}
              placeholderTextColor="#9CA3AF"
            />
          </View>
          <TouchableOpacity style={styles.filterButton}>
            <Filter size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2563EB" />
            <Text style={styles.loadingText}>Searching books...</Text>
          </View>
        ) : books.length === 0 ? (
          <View style={styles.emptyState}>
            <Book size={48} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No books found</Text>
            <Text style={styles.emptyText}>Try adjusting your search criteria</Text>
          </View>
        ) : (
          <View style={styles.booksList}>
            {books.map((book) => (
              <View key={book._id} style={styles.bookCard}>
                <Image 
                  source={{ 
                    uri: book.coverImage || 'https://images.pexels.com/photos/1029141/pexels-photo-1029141.jpeg?auto=compress&cs=tinysrgb&w=300'
                  }} 
                  style={styles.bookImage} 
                />
                <View style={styles.bookDetails}>
                  <Text style={styles.bookTitle} numberOfLines={2}>
                    {book.title}
                  </Text>
                  <Text style={styles.bookAuthor} numberOfLines={1}>
                    by {book.author}
                  </Text>
                  <Text style={styles.bookGenre}>{book.genre}</Text>
                  <View style={styles.bookFooter}>
                    <View style={styles.ratingContainer}>
                      <Text style={styles.rating}>★ {book.rating || 'N/A'}</Text>
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.borrowButton,
                        ((book.available ?? 0) <= 0) && styles.borrowButtonDisabled,
                      ]}
                      onPress={() => handleBorrow(book._id)}
                      disabled={(book.available ?? 0) <= 0}
                    >
                      <Text
                        style={[
                          styles.borrowButtonText,
                          ((book.available ?? 0) <= 0) && styles.borrowButtonTextDisabled,
                        ]}
                      >
                        {(book.available ?? 0) > 0 ? 'Borrow' : 'Unavailable'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1E293B',
  },
  filterButton: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  booksList: {
    padding: 24,
    gap: 16,
  },
  bookCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bookImage: {
    width: 80,
    height: 120,
    backgroundColor: '#F1F5F9',
  },
  bookDetails: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
    lineHeight: 20,
  },
  bookAuthor: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 4,
  },
  bookGenre: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 12,
  },
  bookFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '500',
  },
  borrowButton: {
    backgroundColor: '#2563EB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  borrowButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  borrowButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  borrowButtonTextDisabled: {
    color: '#9CA3AF',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});