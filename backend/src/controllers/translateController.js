const { translateJapaneseText } = require('../services/aiService');

// @desc    Translate and parse Japanese text
// @route   POST /api/translate
// @access  Public
const translateText = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.trim() === '') {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp văn bản cần dịch.' });
    }

    const translationData = await translateJapaneseText(text);

    res.json({
      success: true,
      data: translationData
    });
  } catch (error) {
    console.error('Translate Controller Error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  translateText
};
