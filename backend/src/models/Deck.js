import mongoose from 'mongoose';

const DeckSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Vui lòng cung cấp tên bộ thẻ học.'],
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  coverImage: {
    type: String,
    default: ''
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  folderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Folder',
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

import wrapModel from './modelWrapper.js';
export default wrapModel('Deck', mongoose.model('Deck', DeckSchema));
