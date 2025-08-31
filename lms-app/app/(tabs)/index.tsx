import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Book, TrendingUp, Clock, Star } from 'lucide-react-native';
import { useFeaturedBooks } from '../../hooks/useBooks';
import { useAuthContext } from '../../context/AuthContext';
import { useBorrows } from '../../hooks/useBorrows';

const quickActions = [
  {
    title: 'Search Books',
    icon: <Book size={24} color="#2563EB" />,
    action: () => router.push('/(tabs)/search'),
  },
  {
    title: 'Popular',
    icon: <TrendingUp size={24} color="#10B981" />,
    action: () => router.push('/(tabs)/search'),
  },
  {
    title: 'New Arrivals',
    icon: <Star size={24} color="#F59E0B" />,
    action: () => router.push('/(tabs)/search'),
  },
  {
    title: 'Due Soon',
    icon: <Clock size={24} color="#EF4444" />,
    action: () => router.push('/(tabs)/borrowed'),
  },
];

export default function HomeScreen() {
  const { featuredBooks, isLoading: booksLoading } = useFeaturedBooks();
  const { user } = useAuthContext();
  const { borrows, isLoading: borrowsLoading } = useBorrows();

  const now = new Date();
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const booksBorrowed = borrows.filter(b => b.status === 'borrowed' || b.status === 'overdue').length;
  const dueThisWeek = borrows.filter(b => {
    const due = new Date(b.dueDate);
    return b.status === 'borrowed' && due >= now && due <= in7Days;
  }).length;
  const booksRead = borrows.filter(b => b.status === 'returned').length;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Good morning!</Text>
        <Text style={styles.userName}>{user?.name || 'Guest'}</Text>
      </View>

      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {quickActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={styles.actionCard}
              onPress={action.action}
            >
              <View style={styles.actionIcon}>{action.icon}</View>
              <Text style={styles.actionTitle}>{action.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Featured Books</Text>
        {booksLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2563EB" />
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.booksContainer}>
              {featuredBooks.map((book) => (
                <TouchableOpacity key={book._id} style={styles.bookCard}>
                  <Image 
                    source={{ 
                      uri: book.coverImage || 'https://images.pexels.com/photos/1029141/pexels-photo-1029141.jpeg?auto=compress&cs=tinysrgb&w=300'
                    }} 
                    style={styles.bookImage} 
                  />
                  <View style={styles.bookInfo}>
                    <Text style={styles.bookTitle} numberOfLines={2}>
                      {book.title}
                    </Text>
                    <Text style={styles.bookAuthor} numberOfLines={1}>
                      {book.author}
                    </Text>
                    <View style={[
                      styles.statusBadge,
                      (book.available ?? 0) > 0 ? styles.availableBadge : styles.unavailableBadge
                    ]}>
                      <Text style={[
                        styles.statusText,
                        (book.available ?? 0) > 0 ? styles.availableText : styles.unavailableText
                      ]}>
                        {(book.available ?? 0) > 0 ? 'Available' : 'Checked Out'}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        )}
      </View>

      <View style={styles.stats}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{borrowsLoading ? '—' : booksBorrowed}</Text>
          <Text style={styles.statLabel}>Books Borrowed</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{borrowsLoading ? '—' : dueThisWeek}</Text>
          <Text style={styles.statLabel}>Due This Week</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{borrowsLoading ? '—' : booksRead}</Text>
          <Text style={styles.statLabel}>Books Read</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    padding: 24,
    paddingTop: 60,
    backgroundColor: '#FFFFFF',
  },
  greeting: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
  },
  quickActions: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  actionIcon: {
    width: 48,
    height: 48,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  booksContainer: {
    flexDirection: 'row',
    gap: 16,
    paddingRight: 24,
  },
  bookCard: {
    width: 160,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
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
    width: '100%',
    height: 200,
    backgroundColor: '#F1F5F9',
  },
  bookInfo: {
    padding: 12,
  },
  bookTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
    lineHeight: 18,
  },
  bookAuthor: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  availableBadge: {
    backgroundColor: '#D1FAE5',
  },
  unavailableBadge: {
    backgroundColor: '#FEE2E2',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '500',
  },
  availableText: {
    color: '#065F46',
  },
  unavailableText: {
    color: '#991B1B',
  },
  stats: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2563EB',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
});