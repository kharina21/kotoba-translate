import mongoose from 'mongoose';
import wrapModel from './modelWrapper.js';

const TranslationCacheSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default wrapModel('TranslationCache', mongoose.model('TranslationCache', TranslationCacheSchema));
