import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Translate, SpeakerHigh, MagnifyingGlass, BookOpen, Question, X } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'motion/react';

export default function TranslatePage() {
  const [text, setText] = useState('日本語を勉強します');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  
  // Kanji detail modal state
  const [selectedKanji, setSelectedKanji] = useState(null);

  // Play text-to-speech
  const handlePlayAudio = (textToSpeak) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = 'ja-JP';
      utterance.rate = 0.85; // Slightly slower for language learners

      const voices = window.speechSynthesis.getVoices();
      const jaVoice = voices.find(v => v.lang.startsWith('ja') || v.lang.includes('JP'));
      if (jaVoice) {
        utterance.voice = jaVoice;
      }
      window.speechSynthesis.speak(utterance);
    } else {
      alert('Trình duyệt của bạn không hỗ trợ phát âm âm thanh.');
    }
  };

  // Run voice load trigger for Chrome/Safari
  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
    }
  }, []);

  const handleTranslate = async (e) => {
    if (e) e.preventDefault();
    if (!text.trim()) return;

    setLoading(true);
    setError('');
    
    try {
      const res = await axios.post('/api/translate', { text });
      if (res.data.success) {
        setResult(res.data.data);
      } else {
        setError(res.data.message || 'Dịch thuật thất bại.');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Có lỗi kết nối xảy ra khi dịch thuật.');
    } finally {
      setLoading(false);
    }
  };



  const handleKanjiClick = (kanjiChar) => {
    // Clean string to get single kanji characters only
    const cleanChar = kanjiChar.trim();
    if (!cleanChar) return;
    
    // Look up kanji in the translation data
    if (result && result.kanjiDetails) {
      const details = result.kanjiDetails.find(k => k.character === cleanChar || cleanChar.includes(k.character));
      if (details) {
        setSelectedKanji(details);
        return;
      }
    }

    // Dynamic mock fallback if not found in list
    setSelectedKanji({
      character: cleanChar[0],
      meaning: 'Hán tự trong đoạn văn (Chi tiết dịch mẫu)',
      onyomi: 'オンヨミ',
      kunyomi: 'くんよみ',
      strokes: 6,
      strokeOrderDescription: 'Viết các nét từ trên xuống dưới, từ trái sang phải.'
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 relative">
      <div className="glow-orb glow-orb-teal"></div>
      <div className="glow-orb glow-orb-purple"></div>

      {/* Page Header */}
      <div className="mb-10 text-left">
        <span className="rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-medium bg-white/5 border border-white/10 text-accent-teal">
          Học tập thông minh
        </span>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mt-3">
          Tra cứu & Dịch thuật tiếng Nhật
        </h1>
        <p className="text-sm text-gray-400 mt-2 max-w-[65ch]">
          Dịch câu tiếng Nhật thông minh có phiên âm Hiragana ngay bên trên chữ Kanji. Nhấp vào chữ Kanji bất kỳ để xem cách đọc âm On/Kun và nét viết chi tiết.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Translation Input */}
        <div className="lg:col-span-5 space-y-6">
          <div className="double-bezel-outer">
            <div className="double-bezel-inner">
              <form onSubmit={handleTranslate} className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">Văn bản tiếng Nhật</label>
                    <span className="text-[10px] text-gray-500 font-mono">Nhập câu hoặc từ</span>
                  </div>
                  <textarea 
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="日本語を勉強します..."
                    className="w-full h-40 px-4 py-3 bg-white/3 border border-white/10 rounded-xl text-lg focus:border-accent-teal focus:ring-1 focus:ring-accent-teal outline-none transition-all duration-300 resize-none placeholder-gray-700"
                  />
                </div>
                
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full btn-premium btn-teal py-3 text-sm font-semibold rounded-xl flex items-center justify-center gap-2"
                >
                  {loading ? (
                    'Đang phân tích...'
                  ) : (
                    <>
                      <MagnifyingGlass size={18} />
                      Tra cứu & Phân tích
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Quick tips list */}
          <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-accent-teal flex items-center gap-2">
              <Question size={16} />
              Mẹo học tập
            </h3>
            <ul className="text-xs text-gray-400 space-y-2 list-disc list-inside">
              <li>Bạn có thể nhấp vào loa phát thanh để nghe đọc thử cả câu.</li>
              <li>Chữ viết trên chữ Kanji là cách đọc Hiragana (Furigana).</li>
              <li>Nhấp thẳng vào chữ Kanji trong ô kết quả để xem chi tiết từ điển.</li>
            </ul>
          </div>
        </div>

        {/* Right Side: Analytical Results */}
        <div className="lg:col-span-7 space-y-6">
          {error && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm">
              {error}
            </div>
          )}

          {loading ? (
            <div className="glass-panel p-12 rounded-3xl flex flex-col items-center justify-center space-y-4">
              <div className="w-8 h-8 rounded-full border-2 border-accent-teal border-t-transparent animate-spin"></div>
              <p className="text-sm text-gray-400">Trí tuệ nhân tạo đang phân tích cấu trúc câu...</p>
            </div>
          ) : result ? (
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              {/* Natural translation result */}
              <div className="double-bezel-outer">
                <div className="double-bezel-inner space-y-6">
                  {/* Furigana Display */}
                  <div className="p-5 bg-white/3 rounded-2xl border border-white/5 flex flex-wrap items-end gap-x-2 gap-y-4 relative">
                    {/* Read TTS button */}
                    <button 
                      onClick={() => handlePlayAudio(result.original)}
                      className="absolute right-4 top-4 p-2 bg-white/5 hover:bg-accent-teal hover:text-black rounded-full border border-white/10 transition-all duration-300 cursor-pointer"
                      title="Nghe đọc thử"
                    >
                      <SpeakerHigh size={16} />
                    </button>

                    <div className="text-2xl md:text-3xl font-medium tracking-wide flex flex-wrap items-end pr-10">
                      {result.furigana && result.furigana.map((seg, idx) => {
                        const isKanji = seg.rt && seg.rt.length > 0;
                        return (
                          <ruby 
                            key={idx} 
                            className={`${isKanji ? 'kanji-clickable text-white font-semibold' : 'text-gray-300'}`}
                            onClick={() => {
                              if (isKanji) {
                                // If multiple characters, split or handle clicked char
                                handleKanjiClick(seg.text);
                              }
                            }}
                          >
                            {seg.text}
                            {seg.rt ? <rt>{seg.rt}</rt> : <rt className="h-[1.2em]"></rt>}
                          </ruby>
                        );
                      })}
                    </div>
                  </div>

                  {/* Translation Meaning */}
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Bản dịch nghĩa</h4>
                    <p className="text-lg text-gray-100 font-medium leading-relaxed">
                      {result.translation}
                    </p>
                  </div>
                </div>
              </div>

              {/* Words breakdown list */}
              {result.words && result.words.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-2 pl-1">
                    <BookOpen size={18} className="text-accent-teal" />
                    Từ vựng chi tiết ({result.words.length})
                  </h3>
                  <div className="space-y-3">
                    {result.words.map((word, idx) => (
                      <div key={idx} className="glass-panel p-5 rounded-2xl border border-white/5 hover:border-white/10 transition-all duration-300">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                          <div className="flex items-baseline gap-2">
                            <span className="text-lg font-bold text-white tracking-wide">
                              {word.word}
                            </span>
                            <span className="text-xs text-accent-teal font-medium bg-accent-teal/10 px-2 py-0.5 rounded-full">
                              {word.reading}
                            </span>
                          </div>
                          {word.kanji && word.kanji.length > 0 && (
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-gray-500 font-medium">Hán tự:</span>
                              {word.kanji.map((k, kIdx) => (
                                <button 
                                  key={kIdx}
                                  onClick={() => handleKanjiClick(k)}
                                  className="text-xs bg-white/5 hover:bg-accent-teal hover:text-black w-6 h-6 rounded-md flex items-center justify-center font-bold transition-all duration-200"
                                >
                                  {k}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-gray-300 font-medium mb-3">{word.meaning}</p>
                        
                        {/* Context Example */}
                        {word.example && (
                          <div className="pl-3 border-l border-white/10 space-y-1 text-xs">
                            <div className="flex items-center gap-1.5 text-gray-400">
                              <span className="font-semibold text-accent-teal font-mono">Ví dụ:</span>
                              <span>{word.example.japanese}</span>
                              <button 
                                onClick={() => handlePlayAudio(word.example.japanese)}
                                className="hover:text-accent-teal transition-colors"
                              >
                                <SpeakerHigh size={12} />
                              </button>
                            </div>
                            <div className="text-[10px] text-gray-500 italic pr-4 pl-1">
                              Phiên âm: {word.example.reading}
                            </div>
                            <div className="text-gray-400 pl-1">
                              Dịch: {word.example.translation}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <div className="glass-panel p-12 rounded-3xl text-center text-gray-500">
              Nhập câu tiếng Nhật bên trái và nhấn nút tra cứu để phân tích ngữ pháp.
            </div>
          )}
        </div>
      </div>

      {/* Kanji Detail Overlay (Modal) */}
      <AnimatePresence>
        {selectedKanji && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
              className="w-full max-w-lg double-bezel-outer"
            >
              <div className="double-bezel-inner relative">
                {/* Close Button */}
                <button 
                  onClick={() => setSelectedKanji(null)}
                  className="absolute right-4 top-4 p-2 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>

                <div className="flex gap-6 items-start mt-4">
                  {/* Kanji Massive Glypht */}
                  <div className="shrink-0 flex flex-col items-center gap-2">
                    <span className="w-24 h-24 bg-linear-to-b from-white/10 to-white/2 rounded-2xl border border-white/15 shadow-xl flex items-center justify-center text-5xl font-bold text-white">
                      {selectedKanji.character}
                    </span>
                    <span className="text-[10px] text-gray-500 font-mono uppercase tracking-wider">
                      Số nét: {selectedKanji.strokes}
                    </span>
                  </div>

                  {/* Kanji dictionary values */}
                  <div className="space-y-4 flex-1">
                    <div>
                      <span className="text-[10px] text-accent-teal uppercase tracking-widest font-bold">Từ điển Hán tự</span>
                      <h2 className="text-xl font-bold text-white mt-0.5">{selectedKanji.character} ({selectedKanji.meaning.split('(')[0].trim()})</h2>
                      <p className="text-sm text-gray-400 mt-1">{selectedKanji.meaning}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 bg-white/3 p-3 rounded-xl border border-white/5 text-xs">
                      <div>
                        <span className="text-gray-500 font-semibold uppercase tracking-wider block text-[9px]">Âm Onyomi (On)</span>
                        <span className="font-mono text-accent-purple text-sm block mt-1 font-semibold">
                          {selectedKanji.onyomi || '—'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 font-semibold uppercase tracking-wider block text-[9px]">Âm Kunyomi (Kun)</span>
                        <span className="font-mono text-accent-teal text-sm block mt-1 font-semibold">
                          {selectedKanji.kunyomi || '—'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stroke Order Detail */}
                <div className="mt-6 border-t border-white/8 pt-5">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Thứ tự các nét viết</h4>
                  <p className="text-sm text-gray-300 leading-relaxed bg-white/3 p-4 rounded-xl border border-white/5 font-medium">
                    {selectedKanji.strokeOrderDescription}
                  </p>
                </div>

                <div className="mt-6 flex justify-end">
                  <button 
                    onClick={() => setSelectedKanji(null)}
                    className="btn-premium btn-secondary px-5 py-2 text-xs rounded-full cursor-pointer"
                  >
                    Đóng cửa sổ
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
