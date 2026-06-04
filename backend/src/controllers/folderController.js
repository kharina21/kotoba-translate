const Folder = require('../models/Folder');
const Deck = require('../models/Deck');

// @desc    Get all folders for current user
// @route   GET /api/folders
// @access  Private
const getFolders = async (req, res) => {
  try {
    const folders = await Folder.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, data: folders });
  } catch (error) {
    console.error('Get Folders Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single folder details
// @route   GET /api/folders/:id
// @access  Private
const getFolderById = async (req, res) => {
  try {
    const folder = await Folder.findOne({ _id: req.params.id, userId: req.user._id });
    if (!folder) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thư mục này.' });
    }

    // Get all decks inside this folder
    const decks = await Deck.find({ folderId: folder._id, userId: req.user._id });

    res.json({
      success: true,
      data: {
        folder,
        decks
      }
    });
  } catch (error) {
    console.error('Get Folder By ID Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create folder
// @route   POST /api/folders
// @access  Private
const createFolder = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Tên thư mục là bắt buộc.' });
    }

    const folder = await Folder.create({
      name,
      description: description || '',
      userId: req.user._id
    });

    res.status(201).json({ success: true, data: folder });
  } catch (error) {
    console.error('Create Folder Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update folder
// @route   PUT /api/folders/:id
// @access  Private
const updateFolder = async (req, res) => {
  try {
    const { name, description } = req.body;
    let folder = await Folder.findOne({ _id: req.params.id, userId: req.user._id });

    if (!folder) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thư mục này.' });
    }

    folder.name = name || folder.name;
    folder.description = description !== undefined ? description : folder.description;

    await folder.save();

    res.json({ success: true, data: folder });
  } catch (error) {
    console.error('Update Folder Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete folder
// @route   DELETE /api/folders/:id
// @access  Private
const deleteFolder = async (req, res) => {
  try {
    const folder = await Folder.findOne({ _id: req.params.id, userId: req.user._id });

    if (!folder) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thư mục này.' });
    }

    // Unlink all decks inside this folder (set folderId to null)
    await Deck.updateMany({ folderId: folder._id }, { folderId: null });

    // Remove folder
    await Folder.deleteOne({ _id: folder._id });

    res.json({ success: true, message: 'Đã xóa thư mục và giải phóng các bộ bài học liên quan.' });
  } catch (error) {
    console.error('Delete Folder Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getFolders,
  getFolderById,
  createFolder,
  updateFolder,
  deleteFolder
};
