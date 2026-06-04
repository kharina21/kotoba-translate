import { GoogleGenerativeAI } from '@google/generative-ai';

const hasApiKey = !!process.env.GEMINI_API_KEY;
let model;

if (hasApiKey) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  model = genAI.getGenerativeModel({ 
    model: 'gemini-3.5-flash',
    generationConfig: { responseMimeType: "application/json" }
  });
  console.log('Gemini AI Service initialized using gemini-3.5-flash.');
} else {
  console.log('No Gemini API Key found. Running AI Service in Mock/Offline mode.');
}

// Helper to strip markdown JSON blocks if present
const cleanJSONString = (str) => {
  let cleaned = str.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.substring(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.substring(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.substring(0, cleaned.length - 3);
  }
  return cleaned.trim();
};

// Fallback/Mock Database for common phrases to demonstrate offline mode
const MOCK_TRANSLATIONS = {
  "日本語を勉強します": {
    translation: "Tôi học tiếng Nhật.",
    original: "日本語を勉強します",
    furigana: [
      { text: "日", rt: "に" },
      { text: "本", rt: "ほん" },
      { text: "語", rt: "ご" },
      { text: "を", rt: "" },
      { text: "勉", rt: "べん" },
      { text: "強", rt: "きょう" },
      { text: "します", rt: "" }
    ],
    words: [
      {
        word: "日本語",
        reading: "にほんご",
        meaning: "tiếng Nhật",
        kanji: ["日", "本", "語"],
        example: {
          japanese: "日本語を話します。",
          reading: "にほんごをはなします。",
          translation: "Tôi nói tiếng Nhật."
        }
      },
      {
        word: "勉強",
        reading: "べんきょう",
        meaning: "học tập, học hành",
        kanji: ["勉", "強"],
        example: {
          japanese: "毎日日本語を勉強します。",
          reading: "まいにちにほんごをべんきょうします。",
          translation: "Tôi học tiếng Nhật mỗi ngày."
        }
      }
    ],
    kanjiDetails: [
      {
        character: "日",
        meaning: "Nhật (ngày, mặt trời)",
        onyomi: "ニチ, ジツ",
        kunyomi: "ひ, -び, -か",
        strokes: 4,
        strokeOrderDescription: "Nét 1 thẳng đứng bên trái. Nét 2 vẽ khung trên và phải gập xuống. Nét 3 vạch ngang ngắn ở giữa. Nét 4 vạch ngang dưới cùng đóng khung lại."
      },
      {
        character: "本",
        meaning: "Bản (sách, gốc rễ)",
        onyomi: "ホン",
        kunyomi: "moto",
        strokes: 5,
        strokeOrderDescription: "Nét 1 vạch ngang. Nét 2 nét thẳng đứng cắt nét ngang. Nét 3 nét phẩy bên trái. Nét 4 nét mác bên phải. Nét 5 một vạch ngang ngắn ở chân nét dọc."
      },
      {
        character: "語",
        meaning: "Ngôn (ngôn ngữ, từ ngữ)",
        onyomi: "ゴ",
        kunyomi: "kata-ru",
        strokes: 14,
        strokeOrderDescription: "Bên trái là bộ Ngôn (言) viết trước: nét chấm, 3 nét ngang, bộ Khẩu. Bên phải viết sau: nét ngang, nét chéo bên trái, nét chéo bên phải tạo thành hình chữ ngũ, bên dưới là bộ Khẩu."
      },
      {
        character: "勉",
        meaning: "Miễn (cố gắng)",
        onyomi: "ベン",
        kunyomi: "tsuto-meru",
        strokes: 10,
        strokeOrderDescription: "Viết nửa trên bên trái trước, sau đó là bộ Lực (力) ở góc dưới bên phải."
      },
      {
        character: "強",
        meaning: "Cường (mạnh mẽ)",
        onyomi: "キョウ, ゴウ",
        kunyomi: "tsuyo-i",
        strokes: 11,
        strokeOrderDescription: "Viết bộ Cung (弓) ở bên trái trước, sau đó viết phần bên phải từ trên xuống dưới."
      }
    ]
  },
  "こんにちは": {
    translation: "Xin chào (chào buổi chiều).",
    original: "こんにちは",
    furigana: [{ text: "こんにちは", rt: "" }],
    words: [
      {
        word: "こんにちは",
        reading: "こんにちは",
        meaning: "Xin chào",
        kanji: [],
        example: {
          japanese: "皆さん, こんにちは。",
          reading: "みなさん, こんにちは。",
          translation: "Chào mọi người."
        }
      }
    ],
    kanjiDetails: []
  }
};

const translateJapaneseText = async (text) => {
  const trimmed = text.trim();
  
  if (!hasApiKey) {
    // If mocked, look for exact match or generate a smart mock
    if (MOCK_TRANSLATIONS[trimmed]) {
      return MOCK_TRANSLATIONS[trimmed];
    }
    
    // Dynamic mock for any other input
    return {
      translation: `[Bản dịch thử nghiệm] Ý nghĩa của câu "${trimmed}" (Chưa cấu hình GEMINI_API_KEY)`,
      original: trimmed,
      furigana: trimmed.split('').map(char => {
        // Mock simple furigana mappings for demo kanji
        if (char === '猫') return { text: '猫', rt: 'ねこ' };
        if (char === '犬') return { text: '犬', rt: 'いぬ' };
        if (char === '花') return { text: '花', rt: 'はな' };
        if (char === '水') return { text: '水', rt: 'みず' };
        return { text: char, rt: '' };
      }),
      words: [
        {
          word: trimmed,
          reading: trimmed,
          meaning: "Nghĩa mẫu từ hệ thống offline",
          kanji: trimmed.split('').filter(c => /[一-龠]/.test(c)),
          example: {
            japanese: `${trimmed}が面白いですね。`,
            reading: `${trimmed}がおもしろいですね。`,
            translation: `Việc "${trimmed}" thật thú vị nhỉ.`
          }
        }
      ],
      kanjiDetails: trimmed.split('').filter(c => /[一-龠]/.test(c)).map(kanji => ({
        character: kanji,
        meaning: `Kanji ${kanji} (Nghĩa mẫu)`,
        onyomi: "ON_YOMI",
        kunyomi: "kun_yomi",
        strokes: 5,
        strokeOrderDescription: "Nét trái trước, nét phải sau, từ trên xuống dưới."
      }))
    };
  }

  try {
    const prompt = `
      You are a professional Japanese-Vietnamese translator and lexicographer.
      Analyze the following Japanese text: "${trimmed}".
      Provide a translation into Vietnamese, a breakdown of individual vocabulary words, and details about each unique Kanji character found in the text.
      Return ONLY a single valid JSON object. Do not wrap it in markdown block.
      Format the response exactly as this JSON schema:
      {
        "translation": "Vietnamese translation of the text",
        "original": "the original input text",
        "furigana": [
           {"text": "kanji or word segment", "rt": "its hiragana reading, or empty string if it does not have a reading (like hiragana, katakana, particles, punctuation)"}
        ],
        "words": [
           {
             "word": "vocabulary word (dictionary form)",
             "reading": "hiragana reading",
             "meaning": "Vietnamese meaning",
             "kanji": ["list of kanji characters contained in this word"],
             "example": {
               "japanese": "example sentence containing this word in Japanese",
               "reading": "hiragana reading of the example sentence",
               "translation": "Vietnamese translation of the example sentence"
             }
           }
        ],
        "kanjiDetails": [
           {
             "character": "Kanji character",
             "meaning": "Vietnamese meaning (e.g. Nhật (ngày, mặt trời))",
             "onyomi": "Onyomi readings (in Katakana)",
             "kunyomi": "Kunyomi readings (in Hiragana)",
             "strokes": 5,
             "strokeOrderDescription": "Short step-by-step stroke order instructions in Vietnamese"
           }
        ]
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const textOutput = cleanJSONString(response.text());
    return JSON.parse(textOutput);
  } catch (error) {
    console.error('Gemini API Translation Error:', error);
    throw new Error('Đã xảy ra lỗi khi gọi AI dịch thuật. Vui lòng kiểm tra API Key hoặc thử lại.');
  }
};

const generateFlashcardsFromText = async (rawText) => {
  if (!hasApiKey) {
    // Generate simulated flashcards from user text input
    const words = rawText.split(/[\s,，、.。\n]+/).filter(w => w.trim().length > 0);
    const mockCards = words.slice(0, 8).map((word, idx) => {
      // Mock furigana mapping
      const characters = word.split('').map(char => {
        if (/[一-龠]/.test(char)) {
          return { text: char, rt: 'yomi' };
        }
        return { text: char, rt: '' };
      });
      
      return {
        front: word,
        frontReading: characters,
        back: `Ý nghĩa số ${idx + 1} của từ "${word}" từ văn bản của bạn.`,
        example: `${word}を使用します。`,
        exampleReading: `${word}をしようします。`,
        exampleTranslation: `Sử dụng "${word}".`
      };
    });

    if (mockCards.length === 0) {
      return [{
        front: "桜",
        frontReading: [{ text: "桜", rt: "さくら" }],
        back: "Hoa anh đào",
        example: "日本の桜はとても綺麗です。",
        exampleReading: "にほんのさくらはとてもきれいですか。",
        exampleTranslation: "Hoa anh đào của Nhật Bản rất đẹp."
      }];
    }
    return mockCards;
  }

  try {
    const prompt = `
      You are a Japanese learning assistant.
      Analyze this study text or content: "${rawText}".
      Extract the key Japanese vocabulary words, expressions, or grammar points to create flashcards.
      You must output a single JSON array of objects. Do not wrap in markdown code blocks.
      Each object must match this JSON schema:
      {
        "front": "Japanese word (with Kanji if applicable, e.g., 勉強)",
        "frontReading": [
           {"text": "segment", "rt": "reading or empty string for kana"}
        ],
        "back": "Vietnamese meaning / explanation",
        "example": "Japanese example sentence using the word",
        "exampleReading": "Hiragana reading of example sentence",
        "exampleTranslation": "Vietnamese translation of example sentence"
      }
      Extract between 5 and 15 flashcards depending on the length of input. Ensure translations are accurate and contextually relevant.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const textOutput = cleanJSONString(response.text());
    return JSON.parse(textOutput);
  } catch (error) {
    console.error('Gemini API Card Generation Error:', error);
    throw new Error('Đã xảy ra lỗi khi tạo flashcard bằng AI. Vui lòng thử lại sau.');
  }
};

export {
  translateJapaneseText,
  generateFlashcardsFromText
};
