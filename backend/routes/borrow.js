const express = require('express');
const { body, validationResult, query } = require('express-validator');
const mongoose = require('mongoose');
const Book = require('../models/Book');
const Borrow = require('../models/Borrow');
const { authenticateToken, requireLibrarian } = require('../middleware/auth');

const router = express.Router();

/**
 * @route   POST /borrow
 * @desc    Borrow a book
 * @access  Private
 */
router.post('/', [
  authenticateToken,
  body('bookId')
    .notEmpty()
    .withMessage('Book ID is required')
    .isMongoId()
    .withMessage('Invalid book ID')
], async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Prevent librarians from borrowing
    if (req.user && req.user.role === 'librarian') {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({ success: false, message: 'Librarians cannot borrow books' });
    }

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { bookId } = req.body;
    const userId = req.user._id;

    // Check if book exists and is available
    const book = await Book.findById(bookId).session(session);
    if (!book) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    if (book.available <= 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Book is not available for borrowing'
      });
    }

    // Check if user already has this book borrowed
    const existingBorrow = await Borrow.findOne({
      userId,
      bookId,
      status: { $in: ['borrowed', 'overdue'] }
    }).session(session);

    if (existingBorrow) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'You have already borrowed this book'
      });
    }

    // Check borrowing limit (max 5 books per user)
    const userBorrowCount = await Borrow.countDocuments({
      userId,
      status: { $in: ['borrowed', 'overdue'] }
    }).session(session);

    if (userBorrowCount >= 5) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'You have reached the maximum borrowing limit (5 books)'
      });
    }

    // Create borrow record
    const borrow = new Borrow({
      userId,
      bookId
    });

    await borrow.save({ session });

    // Update book availability
    book.available -= 1;
    await book.save({ session });

    await session.commitTransaction();
    session.endSession();

  // Populate the borrow record for response (include cover and updatedAt)
  await borrow.populate('bookId', 'title author isbn coverUrl updatedAt');

    res.status(201).json({
      success: true,
      message: 'Book borrowed successfully',
      data: {
        borrow
      }
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({
      success: false,
      message: 'Server error while borrowing book'
    });
  }
});

/**
 * @route   POST /borrow/return
 * @desc    Return a borrowed book
 * @access  Private
 */
router.post('/return', [
  authenticateToken,
  body('borrowId')
    .notEmpty()
    .withMessage('Borrow ID is required')
    .isMongoId()
    .withMessage('Invalid borrow ID')
], async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { borrowId } = req.body;
    const userId = req.user._id;

    // Find the borrow record
    const borrow = await Borrow.findOne({
      _id: borrowId,
      userId,
      status: { $in: ['borrowed', 'overdue'] }
    }).populate('bookId').session(session);

    if (!borrow) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Borrow record not found or already returned'
      });
    }

    // Return the book
    borrow.returnDate = new Date();
    borrow.status = 'returned';
    await borrow.save({ session });

    // Update book availability
    const book = await Book.findById(borrow.bookId._id).session(session);
    book.available += 1;
    await book.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.json({
      success: true,
      message: 'Book returned successfully',
      data: {
        borrow
      }
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({
      success: false,
      message: 'Server error while returning book'
    });
  }
});

/**
 * @route   PATCH /borrow/renew/:borrowId
 * @desc    Renew a borrowed book (extend due date)
 * @access  Private
 */
router.patch('/renew/:borrowId', [authenticateToken], async (req, res) => {
  try {
    const { borrowId } = req.params;
    const userId = req.user._id;

    // Find the borrow record belonging to the user
    const borrow = await Borrow.findOne({ _id: borrowId, userId });
    if (!borrow) {
      return res.status(404).json({
        success: false,
        message: 'Borrow record not found'
      });
    }

    if (borrow.status === 'returned') {
      return res.status(400).json({
        success: false,
        message: 'Cannot renew a returned book'
      });
    }

    // Enforce a simple renewal policy: up to 2 renewals, 14 days each
    const MAX_RENEWALS = 2;
    if ((borrow.renewalCount || 0) >= MAX_RENEWALS) {
      return res.status(400).json({
        success: false,
        message: 'Maximum renewals reached'
      });
    }

    // Extend due date by 14 days from current due date or today if overdue
    const baseDate = new Date(Math.max(new Date(borrow.dueDate).getTime(), Date.now()));
    baseDate.setDate(baseDate.getDate() + 14);
    borrow.dueDate = baseDate;
    borrow.status = 'borrowed'; // reset to borrowed if it was overdue
    borrow.renewalCount = (borrow.renewalCount || 0) + 1;
    await borrow.save();

    res.json({
      success: true,
      message: 'Book renewed successfully',
      data: { borrow }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while renewing book'
    });
  }
});

/**
 * @route   GET /borrow/my-books
 * @desc    Get current user's borrowed books
 * @access  Private
 */
router.get('/my-books', [
  authenticateToken,
  query('status')
    .optional()
    .isIn(['borrowed', 'returned', 'overdue', 'all'])
    .withMessage('Status must be borrowed, returned, overdue, or all')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const userId = req.user._id;
    const { status = 'all' } = req.query;

    // Build query
    let query = { userId };
    if (status !== 'all') {
      query.status = status;
    }

    // Get user's borrow records
    const borrows = await Borrow.find(query)
      .populate('bookId', 'title author isbn description genre coverUrl updatedAt')
      .sort({ borrowDate: -1 });

    // Update overdue status for borrowed books
    const borrowsToUpdate = borrows.filter(borrow => 
      borrow.status === 'borrowed' && new Date() > borrow.dueDate
    );

    if (borrowsToUpdate.length > 0) {
      await Promise.all(borrowsToUpdate.map(async (borrow) => {
        borrow.status = 'overdue';
        return borrow.save();
      }));
    }

    res.json({
      success: true,
      data: {
        borrows
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching borrowed books'
    });
  }
});

/**
 * @route   GET /borrow/all
 * @desc    Get all borrow records (Librarians only)
 * @access  Private (Librarian)
 */
router.get('/all', [
  authenticateToken,
  requireLibrarian,
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('status')
    .optional()
    .isIn(['borrowed', 'returned', 'overdue', 'all'])
    .withMessage('Status must be borrowed, returned, overdue, or all'),
  query('userId')
    .optional()
    .isMongoId()
    .withMessage('Invalid user ID')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { status = 'all', userId } = req.query;

    // Build query
    let query = {};
    if (status !== 'all') {
      query.status = status;
    }
    if (userId) {
      query.userId = userId;
    }

    // Get borrow records with pagination
    const borrows = await Borrow.find(query)
      .populate('userId', 'name email')
      .populate('bookId', 'title author isbn coverUrl updatedAt')
      .sort({ borrowDate: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const totalBorrows = await Borrow.countDocuments(query);
    const totalPages = Math.ceil(totalBorrows / limit);

    // Update overdue status for borrowed books
    const borrowsToUpdate = borrows.filter(borrow => 
      borrow.status === 'borrowed' && new Date() > borrow.dueDate
    );

    if (borrowsToUpdate.length > 0) {
      await Promise.all(borrowsToUpdate.map(async (borrow) => {
        borrow.status = 'overdue';
        return borrow.save();
      }));
    }

    res.json({
      success: true,
      data: {
        borrows,
        pagination: {
          currentPage: page,
          totalPages,
          totalBorrows,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching borrow records'
    });
  }
});

/**
 * @route   GET /borrow/overdue
 * @desc    Get overdue books (Librarians only)
 * @access  Private (Librarian)
 */
router.get('/overdue', [authenticateToken, requireLibrarian], async (req, res) => {
  try {
    // Find and update overdue books
  const overdueBorrows = await Borrow.find({
      status: 'borrowed',
      dueDate: { $lt: new Date() }
    })
  .populate('userId', 'name email')
  .populate('bookId', 'title author isbn coverUrl updatedAt');

    // Update status to overdue
    await Promise.all(overdueBorrows.map(async (borrow) => {
      borrow.status = 'overdue';
      return borrow.save();
    }));

    res.json({
      success: true,
      data: {
        overdueBorrows
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching overdue books'
    });
  }
});

/**
 * @route   GET /borrow/stats
 * @desc    Get borrowing statistics (Librarians only)
 * @access  Private (Librarian)
 */
router.get('/stats', [authenticateToken, requireLibrarian], async (req, res) => {
  try {
    const stats = await Promise.all([
      // Total books
      Book.countDocuments(),
      // Available books
      Book.countDocuments({ available: { $gt: 0 } }),
      // Currently borrowed books
      Borrow.countDocuments({ status: 'borrowed' }),
      // Overdue books
      Borrow.countDocuments({ status: 'overdue' }),
      // Total borrows this month
      Borrow.countDocuments({
        borrowDate: {
          $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        }
      })
    ]);

    res.json({
      success: true,
      data: {
        totalBooks: stats[0],
        availableBooks: stats[1],
        currentlyBorrowed: stats[2],
        overdueBooks: stats[3],
        borrowsThisMonth: stats[4]
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching statistics'
    });
  }
});

module.exports = router;
