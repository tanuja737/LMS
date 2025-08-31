const mongoose = require('mongoose');

/**
 * Borrow Schema for the Library Management System
 * Tracks book borrowing and returning
 */
const borrowSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  bookId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: [true, 'Book ID is required']
  },
  borrowDate: {
    type: Date,
    default: Date.now,
    required: true
  },
  dueDate: {
    type: Date,
    required: true,
    default: function() {
      // Set due date to 14 days from borrow date
      const date = new Date();
      date.setDate(date.getDate() + 14);
      return date;
    }
  },
  returnDate: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['borrowed', 'returned', 'overdue'],
    default: 'borrowed'
  },
  renewalCount: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true
});

// Index for efficient queries
borrowSchema.index({ userId: 1, status: 1 });
borrowSchema.index({ bookId: 1, status: 1 });
borrowSchema.index({ dueDate: 1, status: 1 });

// Virtual for calculating if book is overdue
borrowSchema.virtual('isOverdue').get(function() {
  if (this.status === 'returned') return false;
  return new Date() > this.dueDate;
});

// Pre-save middleware to update status based on due date
borrowSchema.pre('save', function(next) {
  if (this.status === 'borrowed' && new Date() > this.dueDate) {
    this.status = 'overdue';
  }
  next();
});

// Instance method to return book
borrowSchema.methods.returnBook = function() {
  this.returnDate = new Date();
  this.status = 'returned';
  return this.save();
};

// Static method to find overdue books
borrowSchema.statics.findOverdue = function() {
  return this.find({
    status: 'borrowed',
    dueDate: { $lt: new Date() }
  }).populate('userId bookId');
};

// Static method to find user's active borrows
borrowSchema.statics.findUserActive = function(userId) {
  return this.find({
    userId: userId,
    status: { $in: ['borrowed', 'overdue'] }
  }).populate('bookId');
};

module.exports = mongoose.model('Borrow', borrowSchema);
