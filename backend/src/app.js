const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const authRoutes = require('./routes/authRoutes');
const translateRoutes = require('./routes/translateRoutes');
const folderRoutes = require('./routes/folderRoutes');
const deckRoutes = require('./routes/deckRoutes');
const cardRoutes = require('./routes/cardRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve Static Uploads
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/translate', translateRoutes);
app.use('/api/folders', folderRoutes);
app.use('/api/decks', deckRoutes);
app.use('/api/cards', cardRoutes);

// Base route
app.get('/', (req, res) => {
  res.json({ success: true, message: 'Welcome to KotobaTranslate API' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Global Error Handler:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Đã xảy ra lỗi máy chủ nội bộ.'
  });
});

module.exports = app;
