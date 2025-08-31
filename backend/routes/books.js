const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Book = require('../models/Book');
const { authenticateToken, requireLibrarian } = require('../middleware/auth');

const router = express.Router();

/**
 * @route   GET /books
 * @desc    Get all books with optional search and pagination
 * @access  Public
 */
router.get('/', [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('search')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Search term cannot be empty'),
  query('available')
    .optional()
    .isBoolean()
    .withMessage('Available must be a boolean value')
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
    const { search, available } = req.query;

    // Build query
    let query = {};

    // Add search functionality
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by availability
    if (available === 'true') {
      query.available = { $gt: 0 };
    }

    // Get books with pagination
    const books = await Book.find(query)
      .sort({ title: 1 })
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const totalBooks = await Book.countDocuments(query);
    const totalPages = Math.ceil(totalBooks / limit);

    res.json({
      success: true,
      data: {
        books,
        pagination: {
          currentPage: page,
          totalPages,
          totalBooks,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get books error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching books'
    });
  }
});

/**
 * @route   GET /books/:id
 * @desc    Get a single book by ID
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    res.json({
      success: true,
      data: {
        book
      }
    });
  } catch (error) {
    console.error('Get book error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid book ID'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error while fetching book'
    });
  }
});

/**
 * @route   POST /books
 * @desc    Create a new book (Librarians only)
 * @access  Private (Librarian)
 */
router.post('/', [
  authenticateToken,
  requireLibrarian,
  // Validation middleware
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 200 })
    .withMessage('Title cannot exceed 200 characters'),
  body('author')
    .trim()
    .notEmpty()
    .withMessage('Author is required')
    .isLength({ max: 100 })
    .withMessage('Author name cannot exceed 100 characters'),
  body('isbn')
    .trim()
    .notEmpty()
    .withMessage('ISBN is required')
    .matches(/^(?:ISBN(?:-1[03])?:? )?(?=[0-9X]{10}$|(?=(?:[0-9]+[- ]){3})[- 0-9X]{13}$|97[89][0-9]{10}$|(?=(?:[0-9]+[- ]){4})[- 0-9]{17}$)(?:97[89][- ]?)?[0-9]{1,5}[- ]?[0-9]+[- ]?[0-9]+[- ]?[0-9X]$/)
    .withMessage('Please provide a valid ISBN'),
  body('quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
  body('genre')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Genre cannot exceed 50 characters'),
  body('publishedYear')
    .optional()
    .isInt({ min: 1000, max: new Date().getFullYear() })
    .withMessage('Published year must be valid')
  ,
  body('coverUrl')
    .optional()
    .isString()
    .isLength({ max: 1000 })
    .withMessage('Cover URL too long')
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

  const { title, author, isbn, quantity, description, genre, publishedYear, coverUrl } = req.body;

    // Check if book with same ISBN already exists
    const existingBook = await Book.findOne({ isbn });
    if (existingBook) {
      return res.status(400).json({
        success: false,
        message: 'Book with this ISBN already exists'
      });
    }

    // Create new book
    const book = new Book({
      title,
      author,
      isbn,
      quantity,
      available: quantity, // Initially all copies are available
      description,
      genre,
  publishedYear,
  coverUrl
    });

    await book.save();

    res.status(201).json({
      success: true,
      message: 'Book created successfully',
      data: {
        book
      }
    });
  } catch (error) {
    console.error('Create book error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating book'
    });
  }
});

/**
 * @route   PUT /books/:id
 * @desc    Update a book (Librarians only)
 * @access  Private (Librarian)
 */
router.put('/:id', [
  authenticateToken,
  requireLibrarian,
  // Validation middleware
  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Title cannot be empty')
    .isLength({ max: 200 })
    .withMessage('Title cannot exceed 200 characters'),
  body('author')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Author cannot be empty')
    .isLength({ max: 100 })
    .withMessage('Author name cannot exceed 100 characters'),
  body('isbn')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('ISBN cannot be empty')
    .matches(/^(?:ISBN(?:-1[03])?:? )?(?=[0-9X]{10}$|(?=(?:[0-9]+[- ]){3})[- 0-9X]{13}$|97[89][0-9]{10}$|(?=(?:[0-9]+[- ]){4})[- 0-9]{17}$)(?:97[89][- ]?)?[0-9]{1,5}[- ]?[0-9]+[- ]?[0-9]+[- ]?[0-9X]$/)
    .withMessage('Please provide a valid ISBN'),
  body('quantity')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Quantity cannot be negative'),
  body('available')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Available count cannot be negative'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
  body('genre')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Genre cannot exceed 50 characters'),
  body('publishedYear')
    .optional()
    .isInt({ min: 1000, max: new Date().getFullYear() })
    .withMessage('Published year must be valid'),
  body('coverUrl')
    .optional()
    .isString()
    .isLength({ max: 1000 })
    .withMessage('Cover URL too long')
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

    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    // Check if ISBN is being changed and if it conflicts
    if (req.body.isbn && req.body.isbn !== book.isbn) {
      const existingBook = await Book.findOne({ isbn: req.body.isbn });
      if (existingBook) {
        return res.status(400).json({
          success: false,
          message: 'Book with this ISBN already exists'
        });
      }
    }

    // Validate available count doesn't exceed quantity
    const newQuantity = req.body.quantity !== undefined ? req.body.quantity : book.quantity;
    const newAvailable = req.body.available !== undefined ? req.body.available : book.available;

    if (newAvailable > newQuantity) {
      return res.status(400).json({
        success: false,
        message: 'Available count cannot exceed total quantity'
      });
    }

    // Update book
    Object.keys(req.body).forEach(key => {
      book[key] = req.body[key];
    });

    await book.save();

    res.json({
      success: true,
      message: 'Book updated successfully',
      data: {
        book
      }
    });
  } catch (error) {
    console.error('Update book error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid book ID'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error while updating book'
    });
  }
});

/**
 * @route   DELETE /books/:id
 * @desc    Delete a book (Librarians only)
 * @access  Private (Librarian)
 */
router.delete('/:id', [authenticateToken, requireLibrarian], async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    // Check if book is currently borrowed
    const Borrow = require('../models/Borrow');
    const activeBorrows = await Borrow.find({
      bookId: book._id,
      status: { $in: ['borrowed', 'overdue'] }
    });

    if (activeBorrows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete book with active borrows'
      });
    }

    await Book.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Book deleted successfully'
    });
  } catch (error) {
    console.error('Delete book error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid book ID'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error while deleting book'
    });
  }
});

module.exports = router;
