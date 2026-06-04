import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Play, Cards, Plus, Pencil, Trash, SpeakerHigh, ArrowLeft, 
  LockKeyOpen, Lock, Sparkle, X, Warning, ClipboardText 
} from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'motion/react';

export default function DeckDetail() {
  const { deckId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [deck, setDeck] = useState(null);
  const [cards, setCards] = useState([]);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Manual Card Modal states
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [cardForm, setCardForm] = useState({
    id: '',
    front: '',
    frontReading: '',
    back: '',
    example: '',
    exampleReading: '',
    exampleTranslation: ''
  });

  const fetchDeckDetails = async () => {
    try {
      setLoading(true);
      setError('');
      // Use standard axios get (which will send Bearer header if logged in)
      const res = await axios.get(`/api/decks/${deckId}`);
      if (res.data.success) {
        setDeck(res.data.data.deck);
        setCards(res.data.data.cards);
        setIsOwner(res.data.data.isOwner);
      }
    } catch (err) {
      console.error('Fetch deck error:', err);
      setError(err.response?.data?.message || 'Không thể tìm thấy bộ thẻ học này.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeckDetails();
  }, [deckId]);

  // Audio speech synthesis helper
  const handlePlayAudio = (textToSpeak, e) => {
    if (e) e.stopPropagation();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = 'ja-JP';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  // --- Card CRUD Operations ---
  const handleCardSubmit = async (e) => {
    e.preventDefault();
    if (!cardForm.front.trim() || !cardForm.frontReading.trim() || !cardForm.back.trim()) return;

    try {
      if (cardForm.id) {
        // Update Card
        const res = await axios.put(`/api/cards/${cardForm.id}`, cardForm);
        if (res.data.success) {
          setCards(cards.map(c => c._id === cardForm.id ? res.data.data : c));
        }
      } else {
        // Create Card
        const res = await axios.post('/api/cards', {
          deckId,
          ...cardForm
        });
        if (res.data.success) {
          setCards([...cards, res.data.data]);
        }
      }
      closeCardModal();
    } catch (err) {
      console.error('Submit card error:', err);
    }
  };

  const handleEditCard = (card) => {
    setCardForm({
      id: card._id,
      front: card.front,
      // Parse frontReading in input: if object array, extract readings as simple text or string
      frontReading: typeof card.frontReading === 'object' && Array.isArray(card.frontReading)
        ? card.frontReading.map(seg => seg.rt || seg.text).join('')
        : card.frontReading,
      back: card.back,
      example: card.example || '',
      exampleReading: card.exampleReading || '',
      exampleTranslation: card.exampleTranslation || ''
    });
    setIsCardModalOpen(true);
  };

  const handleDeleteCard = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa thẻ từ vựng này không?')) return;
    try {
      const res = await axios.delete(`/api/cards/${id}`);
      if (res.data.success) {
        setCards(cards.filter(c => c._id !== id));
      }
    } catch (err) {
      console.error('Delete card error:', err);
    }
  };

  const closeCardModal = () => {
    setCardForm({
      id: '',
      front: '',
      frontReading: '',
      back: '',
      example: '',
      exampleReading: '',
      exampleTranslation: ''
    });
    setIsCardModalOpen(false);
  };

  // Helper to render Furigana on card rows
  const renderRuby = (front, frontReading) => {
    if (typeof frontReading === 'object' && Array.isArray(frontReading)) {
      return frontReading.map((seg, idx) => (
        <ruby key={idx} className="text-white font-semibold">
          {seg.text}
          {seg.rt && <rt>{seg.rt}</rt>}
        </ruby>
      ));
    }
    // String fallback
    return (
      <ruby className="text-white font-semibold">
        {front}
        {frontReading && <rt>{frontReading}</rt>}
      </ruby>
    );
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-8 h-8 rounded-full border-2 border-accent-teal border-t-transparent animate-spin"></div>
        <p className="text-sm text-gray-500">Đang nạp bộ thẻ bài và đồng bộ học phần...</p>
      </div>
    );
  }

  if (error || !deck) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-6">
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-center gap-3">
          <Warning size={24} className="shrink-0" />
          <span>{error || 'Không tìm thấy bộ thẻ bài yêu cầu.'}</span>
        </div>
        <Link to="/dashboard" className="btn-premium btn-secondary px-6 py-2.5 rounded-full inline-flex items-center gap-2">
          <ArrowLeft size={16} />
          Quay lại bảng điều khiển
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 relative">
      <div className="glow-orb glow-orb-teal"></div>
      <div className="glow-orb glow-orb-purple"></div>

      {/* Back button */}
      <Link 
        to={isOwner ? "/dashboard" : "/public-decks"} 
        className="inline-flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors mb-6"
      >
        <ArrowLeft size={14} />
        {isOwner ? "Bảng điều khiển cá nhân" : "Thư viện cộng đồng"}
      </Link>

      {/* Deck Hero Panel */}
      <div className="double-bezel-outer mb-10 z-10 relative">
        <div className="double-bezel-inner">
          <div className="flex flex-col md:flex-row gap-8 items-start md:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
              {/* Deck image cover mockup */}
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border border-white/10 shrink-0 bg-white/3">
                {deck.coverImage ? (
                  <img 
                    src={deck.coverImage.startsWith('http') ? deck.coverImage : `http://localhost:5000${deck.coverImage}`} 
                    alt={deck.name} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-linear-to-br from-white/5 to-white/0 flex items-center justify-center font-bold text-white/10 text-3xl">
                    KOTO
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 border
                    ${deck.isPublic ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-zinc-500/10 border-zinc-500/20 text-zinc-400'}`}>
                    {deck.isPublic ? <LockKeyOpen size={10} /> : <Lock size={10} />}
                    {deck.isPublic ? 'Công khai' : 'Riêng tư'}
                  </span>
                  <span className="text-[10px] text-gray-500">Tác giả: {deck.userId?.username || 'Hệ thống'}</span>
                </div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">{deck.name}</h1>
                <p className="text-sm text-gray-400 leading-relaxed max-w-[55ch]">
                  {deck.description || 'Chưa có mô tả chi tiết cho học phần này.'}
                </p>
              </div>
            </div>

            {/* CTA action cards */}
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto shrink-0 border-t border-white/5 pt-4 md:border-t-0 md:pt-0">
              {cards.length > 0 && (
                <button 
                  onClick={() => navigate(`/study/${deck._id}`)}
                  className="btn-premium btn-teal px-6 py-3 text-xs font-semibold rounded-full flex items-center gap-2 cursor-pointer w-full sm:w-auto justify-center"
                >
                  <Play size={16} weight="fill" />
                  Bắt đầu học ngay ({cards.length})
                </button>
              )}
              {isOwner && (
                <>
                  <button 
                    onClick={() => navigate(`/ai-flashcards?deckId=${deck._id}`)}
                    className="btn-premium btn-secondary px-4 py-3 text-xs font-semibold rounded-full flex items-center gap-2 cursor-pointer w-full sm:w-auto justify-center"
                  >
                    <Sparkle size={16} className="text-accent-teal" />
                    AI nạp thẻ nhanh
                  </button>
                  <button 
                    onClick={() => setIsCardModalOpen(true)}
                    className="btn-premium btn-secondary px-4 py-3 text-xs font-semibold rounded-full flex items-center gap-2 cursor-pointer w-full sm:w-auto justify-center"
                  >
                    <Plus size={16} />
                    Thêm thẻ thủ công
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Cards List Section */}
      <div className="space-y-4 z-10 relative">
        <div className="flex justify-between items-center pl-1">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-2">
            <ClipboardText size={18} className="text-accent-teal" />
            Danh sách từ vựng ({cards.length})
          </h3>
          <span className="text-[10px] text-gray-500 font-mono">Bài học ôn tập</span>
        </div>

        {cards.length === 0 ? (
          <div className="glass-panel p-16 rounded-3xl text-center text-gray-500 space-y-4">
            <Cards size={48} className="mx-auto text-gray-600" />
            <p className="text-sm font-medium">Bộ từ vựng này hiện chưa có thẻ học nào.</p>
            {isOwner && (
              <div className="flex items-center justify-center gap-3">
                <button 
                  onClick={() => navigate(`/ai-flashcards?deckId=${deck._id}`)}
                  className="btn-premium btn-teal px-5 py-2 text-xs rounded-full flex items-center gap-2 cursor-pointer"
                >
                  <Sparkle size={14} />
                  Tạo thẻ học bằng AI
                </button>
                <button 
                  onClick={() => setIsCardModalOpen(true)}
                  className="btn-premium btn-secondary px-5 py-2 text-xs rounded-full flex items-center gap-2 cursor-pointer"
                >
                  <Plus size={14} />
                  Thêm thủ công
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cards.map((card, idx) => (
              <div 
                key={card._id}
                className="glass-panel p-5 rounded-2xl border border-white/5 hover:border-white/10 transition-all duration-300 flex items-start justify-between gap-4 group"
              >
                <div className="space-y-3 flex-1 min-w-0">
                  <div className="flex items-baseline gap-2.5 flex-wrap">
                    <span className="text-xs text-gray-500 font-mono">#{idx + 1}</span>
                    <div className="text-xl">
                      {renderRuby(card.front, card.frontReading)}
                    </div>
                    <button 
                      onClick={() => handlePlayAudio(card.front)}
                      className="text-gray-500 hover:text-accent-teal transition-colors p-1"
                    >
                      <SpeakerHigh size={14} />
                    </button>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-gray-500">Ý nghĩa</h4>
                    <p className="text-sm text-gray-300 font-medium">{card.back}</p>
                  </div>

                  {card.example && (
                    <div className="pl-3 border-l border-white/8 space-y-1 text-xs">
                      <div className="text-gray-400 flex items-center gap-1.5 flex-wrap">
                        <span className="text-accent-teal font-semibold font-mono">VD:</span>
                        <span>{card.example}</span>
                        <button onClick={() => handlePlayAudio(card.example)} className="hover:text-accent-teal text-gray-500 transition-colors">
                          <SpeakerHigh size={12} />
                        </button>
                      </div>
                      {card.exampleReading && (
                        <div className="text-[10px] text-gray-500 italic pr-2 pl-1">
                          Cách đọc: {card.exampleReading}
                        </div>
                      )}
                      {card.exampleTranslation && (
                        <div className="text-gray-400 pl-1">{card.exampleTranslation}</div>
                      )}
                    </div>
                  )}
                </div>

                {/* Edit/Delete control columns for owners */}
                {isOwner && (
                  <div className="flex items-center gap-1 border-l border-white/5 pl-3 self-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button 
                      onClick={() => handleEditCard(card)}
                      className="p-2 hover:bg-white/5 text-gray-400 hover:text-white rounded-full transition-colors cursor-pointer"
                      title="Sửa thẻ học"
                    >
                      <Pencil size={14} />
                    </button>
                    <button 
                      onClick={() => handleDeleteCard(card._id)}
                      className="p-2 hover:bg-rose-500/10 text-gray-400 hover:text-rose-400 rounded-full transition-colors cursor-pointer"
                      title="Xóa thẻ học"
                    >
                      <Trash size={14} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MANUAL CARD MODAL */}
      <AnimatePresence>
        {isCardModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/85 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg double-bezel-outer"
            >
              <div className="double-bezel-inner relative">
                <button onClick={closeCardModal} className="absolute right-4 top-4 p-2 bg-white/5 hover:bg-white/10 rounded-full cursor-pointer">
                  <X size={16} />
                </button>
                <h3 className="text-lg font-bold text-white mb-4">
                  {cardForm.id ? 'Cập nhật thẻ từ vựng' : 'Thêm thẻ học từ vựng mới'}
                </h3>
                <form onSubmit={handleCardSubmit} className="space-y-4 text-xs">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-gray-400 uppercase tracking-wider font-semibold">Mặt trước (Tiếng Nhật)</label>
                      <input 
                        type="text" 
                        value={cardForm.front} 
                        onChange={(e) => setCardForm({ ...cardForm, front: e.target.value })}
                        placeholder="vd: 勉強"
                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm focus:border-accent-teal outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-gray-400 uppercase tracking-wider font-semibold">Phiên âm (Hiragana)</label>
                      <input 
                        type="text" 
                        value={cardForm.frontReading} 
                        onChange={(e) => setCardForm({ ...cardForm, frontReading: e.target.value })}
                        placeholder="vd: べんきょう"
                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm focus:border-accent-teal outline-none"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-gray-400 uppercase tracking-wider font-semibold">Mặt sau (Dịch nghĩa / Ý nghĩa)</label>
                    <input 
                      type="text" 
                      value={cardForm.back} 
                      onChange={(e) => setCardForm({ ...cardForm, back: e.target.value })}
                      placeholder="vd: Học tập, cố gắng..."
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm focus:border-accent-teal outline-none"
                    />
                  </div>
                  <div className="border-t border-white/5 pt-4 space-y-3">
                    <h4 className="font-semibold text-accent-teal">Ví dụ đi kèm (Tùy chọn)</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-gray-500 uppercase tracking-wider font-semibold">Câu ví dụ (Kanji)</label>
                        <input 
                          type="text" 
                          value={cardForm.example} 
                          onChange={(e) => setCardForm({ ...cardForm, example: e.target.value })}
                          placeholder="vd: 日本語を勉強します。"
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl focus:border-accent-teal outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-gray-500 uppercase tracking-wider font-semibold">Phiên âm câu ví dụ</label>
                        <input 
                          type="text" 
                          value={cardForm.exampleReading} 
                          onChange={(e) => setCardForm({ ...cardForm, exampleReading: e.target.value })}
                          placeholder="vd: にほんごをべんきょうします。"
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl focus:border-accent-teal outline-none"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-gray-500 uppercase tracking-wider font-semibold">Dịch nghĩa câu ví dụ</label>
                      <input 
                        type="text" 
                        value={cardForm.exampleTranslation} 
                        onChange={(e) => setCardForm({ ...cardForm, exampleTranslation: e.target.value })}
                        placeholder="vd: Tôi học tiếng Nhật."
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl focus:border-accent-teal outline-none"
                      />
                    </div>
                  </div>
                  <button type="submit" className="w-full btn-premium btn-teal py-3 text-xs font-semibold rounded-xl mt-2">
                    {cardForm.id ? 'Lưu thay đổi' : 'Tạo thẻ học'}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
