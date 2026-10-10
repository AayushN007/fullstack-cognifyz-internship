'use strict';

const express = require('express');
const path = require('path');
const { body, validationResult } = require('express-validator');

const app = express();
const PORT = process.env.PORT || 3000;

/* ---------- Middleware Configuration ---------- */
// Serve static assets (index.html, styles.css, main.js) from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Parse incoming request bodies (JSON and URL-encoded forms)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ---------- Task 2: In-Memory Data Storage ---------- */
// Temporary server-side storage for submitted feedback
const feedbackStore = [
  {
    id: 1728570000000,
    name: 'Priya Nair',
    email: 'priya@example.com',
    rating: 5,
    message: 'Super smooth experience - the live validation is really helpful!',
    createdAt: 1728570000000
  },
  {
    id: 1728483600000,
    name: 'Rahul Verma',
    email: 'rahul@example.com',
    rating: 4,
    message: 'Clean layout and fast server response. Works great on mobile.',
    createdAt: 1728483600000
  }
];

// In-memory storage for user registrations
const userStore = [];

/* ---------- Task 5: RESTful API Endpoints ---------- */

/**
  * GET /api/feedback
  * Fetch all feedback entries
  */
app.get('/api/feedback', (req, res) => {
  res.status(200).json(feedbackStore);
});

/**
  * POST /api/feedback
  * Task 2: Server-side validation for feedback submission
  */
app.post(
  '/api/feedback',
  [
    body('name')
      .trim()
      .notEmpty().withMessage('Name is required.')
      .isLength({ min: 2 }).withMessage('Name must be at least 2 characters.')
      .matches(/^[A-Za-z][A-Za-z\s'.-]*$/).withMessage('Name contains invalid characters.'),
    body('email')
      .trim()
      .notEmpty().withMessage('Email is required.')
      .isEmail().withMessage('Must be a valid email address.')
      .normalizeEmail(),
    body('rating')
      .isInt({ min: 1, max: 5 }).withMessage('Rating must be an integer between 1 and 5.'),
    body('message')
      .trim()
      .notEmpty().withMessage('Feedback message is required.')
      .isLength({ min: 10, max: 300 }).withMessage('Feedback must be between 10 and 300 characters.')
  ],
  (req, res) => {
    // Check validation errors from express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: errors.array()[0].msg,
        errors: errors.array()
      });
    }

    const { name, email, rating, message } = req.body;

    const newFeedback = {
      id: Date.now(),
      name,
      email,
      rating: Number(rating),
      message,
      createdAt: Date.now()
    };

    // Save to temporary server storage
    feedbackStore.unshift(newFeedback);

    res.status(201).json(newFeedback);
  }
);

/**
  * POST /api/register
  * Task 2: Server-side validation for user signup
  */
app.post(
  '/api/register',
  [
    body('name')
      .trim()
      .notEmpty().withMessage('Name is required.')
      .isLength({ min: 2 }).withMessage('Name must be at least 2 characters.'),
    body('email')
      .trim()
      .notEmpty().withMessage('Email is required.')
      .isEmail().withMessage('Must be a valid email address.')
      .normalizeEmail(),
    body('password')
      .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long.')
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: errors.array()[0].msg,
        errors: errors.array()
      });
    }

    const { name, email, password } = req.body;

    // Check duplicate user
    const existing = userStore.find(u => u.email === email);
    if (existing) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }

    const newUser = { id: Date.now(), name, email, createdAt: Date.now() };
    userStore.push({ ...newUser, password }); // Note: Auth hashing (bcrypt) will be added in Task 6

    res.status(201).json({
      message: 'Account registered successfully.',
      user: newUser
    });
  }
);

/* ---------- Catch-all & Server Launch ---------- */
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
