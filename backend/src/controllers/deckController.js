import Deck from '../models/Deck.js';
import Card from '../models/Card.js';

// @desc    Get user decks (optionally filtered by folderId)
// @route   GET /api/decks
// @access  Private
const getDecks = async (req, res) => {
  try {
    const { folderId } = req.query;
    const filter = { userId: req.user._id };
    
    if (folderId) {
      filter.folderId = folderId === 'null' ? null : folderId;
    }

    const decks = await Deck.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: decks });
  } catch (error) {
    console.error('Get Decks Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get public shared decks
// @route   GET /api/decks/public
// @access  Public
const getPublicDecks = async (req, res) => {
  try {
    // Populate the owner's username for public visibility
    const decks = await Deck.find({ isPublic: true })
      .populate('userId', 'username avatar')
      .sort({ createdAt: -1 });
      
    res.json({ success: true, data: decks });
  } catch (error) {
    console.error('Get Public Decks Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single deck with cards
// @route   GET /api/decks/:id
// @access  Public/Private (depending on public status)
const getDeckById = async (req, res) => {
  try {
    const deck = await Deck.findById(req.params.id).populate('userId', 'username avatar');
    
    if (!deck) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bộ thẻ học này.' });
    }

    // Check if deck is private and current user does not own it
    const isOwner = req.user && deck.userId._id.toString() === req.user._id.toString();
    if (!deck.isPublic && !isOwner) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền truy cập bộ thẻ học riêng tư này.' });
    }

    // Find all cards inside this deck
    const cards = await Card.find({ deckId: deck._id }).sort({ createdAt: 1 });

    res.json({
      success: true,
      data: {
        deck,
        cards,
        isOwner
      }
    });
  } catch (error) {
    console.error('Get Deck By ID Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create deck
// @route   POST /api/decks
// @access  Private
const createDeck = async (req, res) => {
  try {
    const { name, description, isPublic, folderId } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Tên bộ thẻ học là bắt buộc.' });
    }

    let coverImage = '';
    if (req.file) {
      coverImage = req.file.path ? req.file.path : `/uploads/${req.file.filename}`;
    }

    const deck = await Deck.create({
      name,
      description: description || '',
      isPublic: isPublic === 'true' || isPublic === true,
      coverImage,
      userId: req.user._id,
      folderId: folderId && folderId !== 'null' && folderId !== '' ? folderId : null
    });

    res.status(201).json({ success: true, data: deck });
  } catch (error) {
    console.error('Create Deck Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update deck details
// @route   PUT /api/decks/:id
// @access  Private
const updateDeck = async (req, res) => {
  try {
    const { name, description, isPublic, folderId } = req.body;
    let deck = await Deck.findOne({ _id: req.params.id, userId: req.user._id });

    if (!deck) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bộ thẻ học này.' });
    }

    deck.name = name || deck.name;
    deck.description = description !== undefined ? description : deck.description;
    
    if (isPublic !== undefined) {
      deck.isPublic = isPublic === 'true' || isPublic === true;
    }
    
    if (folderId !== undefined) {
      deck.folderId = folderId && folderId !== 'null' && folderId !== '' ? folderId : null;
    }

    if (req.file) {
      deck.coverImage = req.file.path ? req.file.path : `/uploads/${req.file.filename}`;
    }

    await deck.save();

    res.json({ success: true, data: deck });
  } catch (error) {
    console.error('Update Deck Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete deck
// @route   DELETE /api/decks/:id
// @access  Private
const deleteDeck = async (req, res) => {
  try {
    const deck = await Deck.findOne({ _id: req.params.id, userId: req.user._id });

    if (!deck) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bộ thẻ học này.' });
    }

    // Cascade delete cards in this deck
    await Card.deleteMany({ deckId: deck._id });

    // Remove deck
    await Deck.deleteOne({ _id: deck._id });

    res.json({ success: true, message: 'Đã xóa bộ thẻ học và tất cả các thẻ liên quan.' });
  } catch (error) {
    console.error('Delete Deck Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export {
  getDecks,
  getPublicDecks,
  getDeckById,
  createDeck,
  updateDeck,
  deleteDeck
};
