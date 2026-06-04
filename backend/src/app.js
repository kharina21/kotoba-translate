import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

import authRoutes from './routes/authRoutes.js';
import translateRoutes from './routes/translateRoutes.js';
import folderRoutes from './routes/folderRoutes.js';
import deckRoutes from './routes/deckRoutes.js';
import cardRoutes from './routes/cardRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

export default app;
