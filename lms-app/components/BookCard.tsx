import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { Star } from 'lucide-react-native';

interface Book {
  id: number;
  title: string;
  author: string;
  genre?: string;
  image: string;
  available: boolean;
  rating?: number;
}

interface BookCardProps {
  book: Book;
  onPress?: () => void;
  onBorrow?: () => void;
  showActions?: boolean;
}

export default function BookCard({ 
  book, 
  onPress, 
  onBorrow, 
  showActions = true 
}: BookCardProps) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <Image source={{ uri: book.image }} style={styles.image} />
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {book.title}
        </Text>
        <Text style={styles.author} numberOfLines={1}>
          by {book.author}
        </Text>
        {book.genre && (
          <Text style={styles.genre}>{book.genre}</Text>
        )}
        
        <View style={styles.footer}>
          {book.rating && (
            <View style={styles.ratingContainer}>
              <Star size={12} color="#F59E0B" />
              <Text style={styles.rating}>{book.rating}</Text>
            </View>
          )}
          
          {showActions && (
            <TouchableOpacity
              style={[
                styles.borrowButton,
                !book.available && styles.borrowButtonDisabled,
              ]}
              onPress={onBorrow}
              disabled={!book.available}
            >
              <Text
                style={[
                  styles.borrowButtonText,
                  !book.available && styles.borrowButtonTextDisabled,
                ]}
              >
                {book.available ? 'Borrow' : 'Unavailable'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
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
  image: {
    width: '100%',
    height: 200,
    backgroundColor: '#F1F5F9',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
    lineHeight: 20,
  },
  author: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 4,
  },
  genre: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
});