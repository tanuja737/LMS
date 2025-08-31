import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Calendar, Book, RotateCcw, RefreshCcw } from 'lucide-react-native';
import { useBorrows } from '../../hooks/useBorrows';

export default function BorrowedScreen() {
  const { borrows, isLoading, returnBook, renewBook, loadUserBorrows } = useBorrows();
  const activeBorrows = borrows.filter(b => b.status === 'borrowed' || b.status === 'overdue');
  const [refreshing, setRefreshing] = useState(false);
  const didAutoRefresh = useRef(false);

  const refresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await loadUserBorrows();
    } finally {
      setRefreshing(false);
    }
  }, [loadUserBorrows]);

  const handleReturn = async (borrowId: string, bookTitle: string) => {
    Alert.alert('Return Book', `Are you sure you want to return "${bookTitle}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Return',
        onPress: async () => {
          try {
            const resp = await returnBook(borrowId);
            if (resp.success) {
              Alert.alert('Success', 'Book returned successfully!');
              if (!didAutoRefresh.current) {
                didAutoRefresh.current = true;
                await loadUserBorrows();
              }
            } else {
              Alert.alert('Failed', resp.message || 'Unable to return book');
            }
          } catch (e: any) {
            Alert.alert('Error', e?.message || 'Unable to return book');
          }
        },
      },
    ]);
  };

  const handleRenew = async (borrowId: string, bookTitle: string) => {
    Alert.alert('Renew Book', `Renew "${bookTitle}" for another 14 days?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Renew',
        onPress: async () => {
          try {
            const resp = await renewBook(borrowId);
            if (resp.success) {
              Alert.alert('Success', 'Book renewed successfully!');
              if (!didAutoRefresh.current) {
                didAutoRefresh.current = true;
                await loadUserBorrows();
              }
            } else {
              Alert.alert('Failed', resp.message || 'Unable to renew book');
            }
          } catch (e: any) {
            Alert.alert('Error', e?.message || 'Unable to renew book');
          }
        },
      },
    ]);
  };

  const daysLeft = (dueDate: string) => {
    const end = new Date(dueDate).getTime();
    const now = Date.now();
    return Math.ceil((end - now) / (1000 * 60 * 60 * 24));
  };

  const getStatusColor = (dLeft: number) => {
    if (dLeft < 0) return '#EF4444';
    if (dLeft <= 3) return '#F59E0B';
    return '#10B981';
  };

  const getStatusText = (dLeft: number) => {
    if (dLeft < 0) return `Overdue by ${Math.abs(dLeft)} days`;
    if (dLeft === 0) return 'Due today';
    if (dLeft === 1) return 'Due tomorrow';
    return `${dLeft} days left`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Books</Text>
  <Text style={styles.subtitle}>{activeBorrows.length} books borrowed</Text>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
      >
        {isLoading ? (
          <View style={styles.loading}> 
            <ActivityIndicator size="large" color="#2563EB" />
          </View>
    ) : activeBorrows.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Book size={48} color="#9CA3AF" />
            </View>
            <Text style={styles.emptyTitle}>No borrowed books</Text>
            <Text style={styles.emptyText}>
              Visit the search tab to find and borrow books
            </Text>
          </View>
        ) : (
          <View style={styles.booksList}>
      {activeBorrows.map((b) => (
              <View key={b._id} style={styles.bookCard}>
                <Image source={{ uri: b.bookId?.coverImage || 'https://images.pexels.com/photos/1029141/pexels-photo-1029141.jpeg?auto=compress&cs=tinysrgb&w=300' }} style={styles.bookImage} />
                <View style={styles.bookDetails}>
                  <Text style={styles.bookTitle} numberOfLines={2}>
                    {b.bookId?.title}
                  </Text>
                  <Text style={styles.bookAuthor} numberOfLines={1}>
                    by {b.bookId?.author}
                  </Text>
                  
                  <View style={styles.dateInfo}>
                    <View style={styles.dateRow}>
                      <Calendar size={14} color="#64748B" />
                      <Text style={styles.dateText}>Due: {new Date(b.dueDate).toLocaleDateString()}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(daysLeft(b.dueDate)) + '20' }]}>
                      <Text style={[styles.statusText, { color: getStatusColor(daysLeft(b.dueDate)) }]}>
                        {getStatusText(daysLeft(b.dueDate))}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.actions}>
                    <TouchableOpacity
                      style={styles.renewButton}
                      onPress={() => handleRenew(b._id, b.bookId?.title)}
                    >
                      <RotateCcw size={16} color="#4F46E5" />
                      <Text style={styles.renewButtonText}>Renew</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.returnButton}
                      onPress={() => handleReturn(b._id, b.bookId?.title)}
                    >
                      <Text style={styles.returnButtonText}>Return</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
      <View style={styles.fabContainer}>
        <TouchableOpacity style={styles.fab} onPress={refresh}>
          <RefreshCcw size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
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
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
  },
  content: {
    flex: 1,
  },
  loading: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
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
    height: 140,
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
    marginBottom: 12,
  },
  dateInfo: {
    marginBottom: 16,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateText: {
    fontSize: 12,
    color: '#64748B',
    marginLeft: 6,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  fabContainer: {
    position: 'absolute',
    right: 16,
    bottom: 24,
  },
  fab: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  renewButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2FF',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  renewButtonDisabled: {
    backgroundColor: '#F1F5F9',
  },
  renewButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#4F46E5',
    marginLeft: 4,
  },
  renewButtonTextDisabled: {
    color: '#9CA3AF',
  },
  returnButton: {
    flex: 1,
    backgroundColor: '#2563EB',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  returnButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 48,
    marginTop: 60,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
});