const mongoose = require('mongoose');

/**
 * Book Schema for the Library Management System
 * Tracks book information and availability
 */
const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Book title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  author: {
    type: String,
    required: [true, 'Author is required'],
    trim: true,
    maxlength: [100, 'Author name cannot exceed 100 characters']
  },
  isbn: {
    type: String,
    required: [true, 'ISBN is required'],
    unique: true,
    trim: true,
    match: [/^(?:ISBN(?:-1[03])?:? )?(?=[0-9X]{10}$|(?=(?:[0-9]+[- ]){3})[- 0-9X]{13}$|97[89][0-9]{10}$|(?=(?:[0-9]+[- ]){4})[- 0-9]{17}$)(?:97[89][- ]?)?[0-9]{1,5}[- ]?[0-9]+[- ]?[0-9]+[- ]?[0-9X]$/, 'Please enter a valid ISBN']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [0, 'Quantity cannot be negative'],
    default: 1
  },
  available: {
    type: Number,
    required: [true, 'Available count is required'],
    min: [0, 'Available count cannot be negative'],
    default: function() {
      return this.quantity;
    }
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  genre: {
    type: String,
    trim: true,
    maxlength: [50, 'Genre cannot exceed 50 characters']
  },
  coverUrl: {
    type: String,
    trim: true,
    maxlength: [1000, 'Cover image URL is too long']
  },
  publishedYear: {
    type: Number,
    min: [1000, 'Published year must be valid'],
    max: [new Date().getFullYear(), 'Published year cannot be in the future']
  }
}, {
  timestamps: true
});

// Index for search functionality
bookSchema.index({ title: 'text', author: 'text', description: 'text' });

// Validate that available count doesn't exceed total quantity
bookSchema.pre('save', function(next) {
  if (this.available > this.quantity) {
    next(new Error('Available count cannot exceed total quantity'));
  } else {
    next();
  }
});

// Instance method to check if book is available
bookSchema.methods.isAvailable = function() {
  return this.available > 0;
};

// Static method to find available books
bookSchema.statics.findAvailable = function() {
  return this.find({ available: { $gt: 0 } });
};

module.exports = mongoose.model('Book', bookSchema);
