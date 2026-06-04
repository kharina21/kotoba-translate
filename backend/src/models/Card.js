const mongoose = require('mongoose');

const CardSchema = new mongoose.Schema({
  deckId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Deck',
    required: true
  },
  front: {
    type: String,
    required: [true, 'Vui lòng điền mặt trước của thẻ (Tiếng Nhật).'],
    trim: true
  },
  frontReading: {
    type: mongoose.Schema.Types.Mixed, // Can be array of {text, rt} objects or simple string
    required: [true, 'Vui lòng cung cấp cách đọc (Hiragana/Furigana).']
  },
  back: {
    type: String,
    required: [true, 'Vui lòng điền mặt sau của thẻ (Ý nghĩa/Dịch).'],
    trim: true
  },
  example: {
    type: String,
    default: ''
  },
  exampleReading: {
    type: String,
    default: ''
  },
  exampleTranslation: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = require('./modelWrapper')('Card', mongoose.model('Card', CardSchema));
