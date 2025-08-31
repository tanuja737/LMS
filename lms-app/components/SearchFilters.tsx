import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from 'react-native';
import { X, Check } from 'lucide-react-native';

interface SearchFiltersProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: FilterOptions) => void;
}

interface FilterOptions {
  genres: string[];
  availability: 'all' | 'available' | 'unavailable';
  sortBy: 'title' | 'author' | 'rating' | 'newest';
}

const genres = [
  'Fiction', 'Non-Fiction', 'Mystery', 'Romance', 'Science Fiction',
  'Fantasy', 'Biography', 'History', 'Self-Help', 'Business'
];

const availabilityOptions = [
  { key: 'all', label: 'All Books' },
  { key: 'available', label: 'Available Only' },
  { key: 'unavailable', label: 'Checked Out' },
];

const sortOptions = [
  { key: 'title', label: 'Title (A-Z)' },
  { key: 'author', label: 'Author (A-Z)' },
  { key: 'rating', label: 'Highest Rated' },
  { key: 'newest', label: 'Newest First' },
];

export default function SearchFilters({ visible, onClose, onApply }: SearchFiltersProps) {
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [availability, setAvailability] = useState<'all' | 'available' | 'unavailable'>('all');
  const [sortBy, setSortBy] = useState<'title' | 'author' | 'rating' | 'newest'>('title');

  const toggleGenre = (genre: string) => {
    if (selectedGenres.includes(genre)) {
      setSelectedGenres(selectedGenres.filter(g => g !== genre));
    } else {
      setSelectedGenres([...selectedGenres, genre]);
    }
  };

  const handleApply = () => {
    onApply({
      genres: selectedGenres,
      availability,
      sortBy,
    });
    onClose();
  };

  const clearFilters = () => {
    setSelectedGenres([]);
    setAvailability('all');
    setSortBy('title');
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#6B7280" />
          </TouchableOpacity>
          <Text style={styles.title}>Filters</Text>
          <TouchableOpacity onPress={clearFilters}>
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Genres</Text>
            <View style={styles.genresGrid}>
              {genres.map((genre) => (
                <TouchableOpacity
                  key={genre}
                  style={[
                    styles.genreChip,
                    selectedGenres.includes(genre) && styles.genreChipSelected,
                  ]}
                  onPress={() => toggleGenre(genre)}
                >
                  {selectedGenres.includes(genre) && (
                    <Check size={14} color="#FFFFFF" style={styles.checkIcon} />
                  )}
                  <Text style={[
                    styles.genreText,
                    selectedGenres.includes(genre) && styles.genreTextSelected,
                  ]}>
                    {genre}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Availability</Text>
            <View style={styles.optionsContainer}>
              {availabilityOptions.map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.optionButton,
                    availability === option.key && styles.optionButtonSelected,
                  ]}
                  onPress={() => setAvailability(option.key as any)}
                >
                  <Text style={[
                    styles.optionText,
                    availability === option.key && styles.optionTextSelected,
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sort By</Text>
            <View style={styles.optionsContainer}>
              {sortOptions.map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.optionButton,
                    sortBy === option.key && styles.optionButtonSelected,
                  ]}
                  onPress={() => setSortBy(option.key as any)}
                >
                  <Text style={[
                    styles.optionText,
                    sortBy === option.key && styles.optionTextSelected,
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
            <Text style={styles.applyButtonText}>Apply Filters</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  clearText: {
    fontSize: 16,
    color: '#2563EB',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
  },
  genresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  genreChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  genreChipSelected: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  checkIcon: {
    marginRight: 6,
  },
  genreText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  genreTextSelected: {
    color: '#FFFFFF',
  },
  optionsContainer: {
    gap: 8,
  },
  optionButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  optionButtonSelected: {
    backgroundColor: '#EBF4FF',
    borderColor: '#2563EB',
  },
  optionText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  optionTextSelected: {
    color: '#2563EB',
  },
  footer: {
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  applyButton: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});