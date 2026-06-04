const mongoose = require('mongoose');
const User = require('./src/models/User');
const Folder = require('./src/models/Folder');
const Deck = require('./src/models/Deck');
const Card = require('./src/models/Card');
const dotenv = require('dotenv');

dotenv.config();

const connectDB = require('./src/config/db');

const seedData = async () => {
  try {
    await connectDB();
    console.log('Database initialization completed for seeding...');

    // 1. Create or Find Demo User
    let demoUser = await User.findOne({ username: 'demouser' });
    if (!demoUser) {
      demoUser = await User.create({
        username: 'demouser',
        email: 'demouser@gmail.com',
        password: 'password123',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'
      });
      console.log('Demo user created: demouser / password123');
    } else {
      console.log('Demo user already exists.');
    }

    // 2. Clear old demo data for clean seeding (Optional, but let's keep it safe)
    await Folder.deleteMany({ userId: demoUser._id });
    await Deck.deleteMany({ userId: demoUser._id });
    
    // 3. Create Folder
    const folder = await Folder.create({
      name: 'Giao tiếp hàng ngày 🇯🇵',
      description: 'Các thư mục lưu bài học giao tiếp tiếng Nhật cơ bản nhất.',
      userId: demoUser._id
    });
    console.log('Folder created:', folder.name);

    // 4. Create Public Deck
    const publicDeck = await Deck.create({
      name: 'Chào hỏi cơ bản (Greetings)',
      description: 'Những câu chào hỏi và mẫu câu lịch sự thông dụng hàng ngày trong tiếng Nhật.',
      isPublic: true,
      coverImage: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=500&q=80', // Japan temple
      userId: demoUser._id,
      folderId: folder._id
    });
    console.log('Public Deck created:', publicDeck.name);

    // 5. Create Cards
    const cards = [
      {
        deckId: publicDeck._id,
        front: 'こんにちは',
        frontReading: [{ text: 'こんにちは', rt: '' }],
        back: 'Xin chào (Chào buổi chiều)',
        example: '皆さん、こんにちは。',
        exampleReading: 'みなさん、こんにちは。',
        exampleTranslation: 'Xin chào mọi người.'
      },
      {
        deckId: publicDeck._id,
        front: 'ありがとう',
        frontReading: [{ text: 'ありがとう', rt: '' }],
        back: 'Cảm ơn',
        example: '手伝ってくれてありがとう。',
        exampleReading: 'てつだってくれてありがとう。',
        exampleTranslation: 'Cảm ơn vì đã giúp đỡ tôi.'
      },
      {
        deckId: publicDeck._id,
        front: 'すみません',
        frontReading: [{ text: 'すみません', rt: '' }],
        back: 'Xin lỗi / Xin hỏi (gây sự chú ý)',
        example: 'すみません、駅は đâu ですか？',
        exampleReading: 'すみません、えきはどこですか？',
        exampleTranslation: 'Xin lỗi, nhà ga ở đâu thế ạ?'
      },
      {
        deckId: publicDeck._id,
        front: '日本語',
        frontReading: [
          { text: '日', rt: 'に' },
          { text: '本', rt: 'ほん' },
          { text: '語', rt: 'ご' }
        ],
        back: 'Tiếng Nhật',
        example: '日本語を勉強します。',
        exampleReading: 'にほんごをべんきょうします。',
        exampleTranslation: 'Tôi học tiếng Nhật.'
      },
      {
        deckId: publicDeck._id,
        front: '先生',
        frontReading: [
          { text: '先', rt: 'せん' },
          { text: '生', rt: 'せい' }
        ],
        back: 'Giáo viên, bác sĩ, người đi trước',
        example: '田中先生は優しいです。',
        exampleReading: 'たなかせんせいはやさしいです。',
        exampleTranslation: 'Thầy Tanaka rất hiền từ.'
      }
    ];

    await Card.insertMany(cards);
    console.log('Seeded 5 basic Japanese flashcards.');

    // 6. Create a Private Deck as well to verify privacy filter works
    const privateDeck = await Deck.create({
      name: 'Từ vựng đồ ăn (Food Vocabulary)',
      description: 'Bài học riêng tư về chủ đề ăn uống, ẩm thực sushi, ramen...',
      isPublic: false,
      coverImage: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=500&q=80', // Sushi
      userId: demoUser._id,
      folderId: folder._id
    });
    
    await Card.create({
      deckId: privateDeck._id,
      front: '寿司',
      frontReading: [
        { text: '寿', rt: 'す' },
        { text: '司', rt: 'し' }
      ],
      back: 'Món Sushi',
      example: 'お寿司が大好きです。',
      exampleReading: 'おすしがだいすきです。',
      exampleTranslation: 'Tôi cực kỳ thích ăn sushi.'
    });
    console.log('Private Deck created:', privateDeck.name);

    console.log('Data successfully seeded!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seedData();
