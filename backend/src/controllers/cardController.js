const Card = require('../models/Card');
const Deck = require('../models/Deck');
const { generateFlashcardsFromText } = require('../services/aiService');

// @desc    Get cards for a deck
// @route   GET /api/cards/deck/:deckId
// @access  Public/Private (auth handled inside by checking deck parent)
const getCardsByDeck = async (req, res) => {
  try {
    const deck = await Deck.findById(req.params.deckId);
    if (!deck) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bộ thẻ học này.' });
    }

    // Auth check if deck is private
    if (!deck.isPublic) {
      if (!req.user || deck.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Bạn không có quyền truy cập thẻ học của bộ này.' });
      }
    }

    const cards = await Card.find({ deckId: deck._id }).sort({ createdAt: 1 });
    res.json({ success: true, data: cards });
  } catch (error) {
    console.error('Get Cards Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create manual card
// @route   POST /api/cards
// @access  Private
const createCard = async (req, res) => {
  try {
    const { deckId, front, frontReading, back, example, exampleReading, exampleTranslation } = req.body;

    if (!deckId || !front || !frontReading || !back) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp đầy đủ thông tin: deckId, mặt trước, cách đọc và mặt sau.' });
    }

    // Verify deck ownership
    const deck = await Deck.findOne({ _id: deckId, userId: req.user._id });
    if (!deck) {
      return res.status(403).json({ success: false, message: 'Bộ thẻ học không tồn tại hoặc bạn không sở hữu bộ thẻ này.' });
    }

    const card = await Card.create({
      deckId,
      front,
      frontReading, // Could be text segments or a string
      back,
      example: example || '',
      exampleReading: exampleReading || '',
      exampleTranslation: exampleTranslation || ''
    });

    res.status(201).json({ success: true, data: card });
  } catch (error) {
    console.error('Create Card Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update card
// @route   PUT /api/cards/:id
// @access  Private
const updateCard = async (req, res) => {
  try {
    const { front, frontReading, back, example, exampleReading, exampleTranslation } = req.body;
    let card = await Card.findById(req.params.id);

    if (!card) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thẻ học này.' });
    }

    // Verify deck ownership
    const deck = await Deck.findOne({ _id: card.deckId, userId: req.user._id });
    if (!deck) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền chỉnh sửa thẻ học thuộc bộ này.' });
    }

    card.front = front || card.front;
    card.frontReading = frontReading || card.frontReading;
    card.back = back || card.back;
    card.example = example !== undefined ? example : card.example;
    card.exampleReading = exampleReading !== undefined ? exampleReading : card.exampleReading;
    card.exampleTranslation = exampleTranslation !== undefined ? exampleTranslation : card.exampleTranslation;

    await card.save();

    res.json({ success: true, data: card });
  } catch (error) {
    console.error('Update Card Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete card
// @route   DELETE /api/cards/:id
// @access  Private
const deleteCard = async (req, res) => {
  try {
    const card = await Card.findById(req.params.id);

    if (!card) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thẻ học này.' });
    }

    // Verify deck ownership
    const deck = await Deck.findOne({ _id: card.deckId, userId: req.user._id });
    if (!deck) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền xóa thẻ học thuộc bộ này.' });
    }

    await Card.deleteOne({ _id: card._id });

    res.json({ success: true, message: 'Đã xóa thẻ học thành công.' });
  } catch (error) {
    console.error('Delete Card Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Generate cards using AI based on raw text
// @route   POST /api/cards/ai/generate
// @access  Private
const generateAICards = async (req, res) => {
  try {
    const { rawText } = req.body;

    if (!rawText || rawText.trim() === '') {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp văn bản học tập để AI xử lý.' });
    }

    const cardsPreview = await generateFlashcardsFromText(rawText);

    res.json({
      success: true,
      data: cardsPreview
    });
  } catch (error) {
    console.error('Generate AI Cards Error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Save AI generated cards in bulk to a deck
// @route   POST /api/cards/ai/save
// @access  Private
const saveAICards = async (req, res) => {
  try {
    const { deckId, cards } = req.body;

    if (!deckId || !cards || !Array.isArray(cards) || cards.length === 0) {
      return res.status(400).json({ success: false, message: 'Thông tin deckId hoặc danh sách cards không hợp lệ.' });
    }

    // Verify deck ownership
    const deck = await Deck.findOne({ _id: deckId, userId: req.user._id });
    if (!deck) {
      return res.status(403).json({ success: false, message: 'Bộ thẻ học không tồn tại hoặc bạn không sở hữu bộ thẻ này.' });
    }

    // Format cards with deckId
    const formattedCards = cards.map(c => ({
      deckId,
      front: c.front,
      frontReading: c.frontReading,
      back: c.back,
      example: c.example || '',
      exampleReading: c.exampleReading || '',
      exampleTranslation: c.exampleTranslation || ''
    }));

    // Bulk insert
    const insertedCards = await Card.insertMany(formattedCards);

    res.status(201).json({
      success: true,
      message: `Đã lưu thành công ${insertedCards.length} thẻ học mới vào bộ bài.`,
      data: insertedCards
    });
  } catch (error) {
    console.error('Save AI Cards Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getCardsByDeck,
  createCard,
  updateCard,
  deleteCard,
  generateAICards,
  saveAICards
};
