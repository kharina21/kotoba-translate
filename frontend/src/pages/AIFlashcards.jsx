import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Sparkle, Cards, ArrowLeft, Warning, Check, Plus, FolderSimple, Trash } from '@phosphor-icons/react';
import { motion } from 'motion/react';

export default function AIFlashcards() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const deckIdFromUrl = searchParams.get('deckId');

  // Decks state
  const [decks, setDecks] = useState([]);
  const [selectedDeckId, setSelectedDeckId] = useState(deckIdFromUrl || '');
  const [newDeckName, setNewDeckName] = useState('');
  
  // AI inputs and results
  const [rawText, setRawText] = useState('こんにちは。日本語を勉強します。寿司が大好きです。');
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  
  const [generatedCards, setGeneratedCards] = useState([]);
  const [selectedIndices, setSelectedIndices] = useState([]);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Fetch user decks for selection
  useEffect(() => {
    const fetchDecks = async () => {
      try {
        const res = await axios.get('/api/decks');
        if (res.data.success) {
          setDecks(res.data.data);
          if (!deckIdFromUrl && res.data.data.length > 0) {
            setSelectedDeckId(res.data.data[0]._id);
          }
        }
      } catch (err) {
        console.error('Error fetching decks:', err);
      }
    };
    fetchDecks();
  }, [deckIdFromUrl]);

  // AI Card generation call
  const handleGenerateCards = async (e) => {
    e.preventDefault();
    if (!rawText.trim()) return;

    setLoading(true);
    setError('');
    setSuccessMsg('');
    setGeneratedCards([]);
    
    try {
      const res = await axios.post('/api/cards/ai/generate', { rawText });
      if (res.data.success && Array.isArray(res.data.data)) {
        setGeneratedCards(res.data.data);
        // Select all by default
        setSelectedIndices(res.data.data.map((_, idx) => idx));
      } else {
        setError('Không nhận được dữ liệu thẻ học hợp lệ từ AI.');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi yêu cầu AI tạo thẻ.');
    } finally {
      setLoading(false);
    }
  };

  // Toggle checklist selection
  const handleToggleSelect = (index) => {
    if (selectedIndices.includes(index)) {
      setSelectedIndices(selectedIndices.filter(i => i !== index));
    } else {
      setSelectedIndices([...selectedIndices, index]);
    }
  };

  // Save selected cards
  const handleSaveCards = async () => {
    if (selectedIndices.length === 0) {
      setError('Vui lòng chọn ít nhất một thẻ học để lưu.');
      return;
    }

    let targetDeckId = selectedDeckId;
    setSaveLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      // 1. If "Create new deck" is chosen
      if (selectedDeckId === 'new') {
        if (!newDeckName.trim()) {
          setError('Vui lòng nhập tên cho bộ thẻ học mới.');
          setSaveLoading(false);
          return;
        }
        const createRes = await axios.post('/api/decks', { name: newDeckName, description: 'Được tạo tự động bằng AI' });
        if (createRes.data.success) {
          targetDeckId = createRes.data.data._id;
        } else {
          setError('Không thể tạo bộ thẻ mới.');
          setSaveLoading(false);
          return;
        }
      }

      if (!targetDeckId) {
        setError('Vui lòng chọn hoặc tạo mới một bộ thẻ.');
        setSaveLoading(false);
        return;
      }

      // 2. Batch Save cards to the deck
      const cardsToSave = generatedCards.filter((_, idx) => selectedIndices.includes(idx));
      const saveRes = await axios.post('/api/cards/ai/save', {
        deckId: targetDeckId,
        cards: cardsToSave
      });

      if (saveRes.data.success) {
        setSuccessMsg(saveRes.data.message);
        // Empty state
        setGeneratedCards([]);
        setSelectedIndices([]);
        setNewDeckName('');
        
        // Wait and redirect to the deck details
        setTimeout(() => {
          navigate(`/deck/${targetDeckId}`);
        }, 1500);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Lỗi khi lưu thẻ học vào cơ sở dữ liệu.');
    } finally {
      setSaveLoading(false);
    }
  };

  // Helper to render Furigana on card previews
  const renderRuby = (front, frontReading) => {
    if (typeof frontReading === 'object' && Array.isArray(frontReading)) {
      return frontReading.map((seg, idx) => (
        <ruby key={idx} className="text-white font-semibold">
          {seg.text}
          {seg.rt && <rt>{seg.rt}</rt>}
        </ruby>
      ));
    }
    return (
      <ruby className="text-white font-semibold">
        {front}
        {frontReading && <rt>{frontReading}</rt>}
      </ruby>
    );
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 relative">
      <div className="glow-orb glow-orb-teal"></div>
      <div className="glow-orb glow-orb-purple"></div>

      <div className="mb-10 text-left">
        <span className="rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-medium bg-white/5 border border-white/10 text-accent-teal">
          Trí tuệ nhân tạo (Generative AI)
        </span>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mt-3">
          Tạo thẻ Flashcard học tập bằng AI
        </h1>
        <p className="text-sm text-gray-400 mt-2 max-w-[65ch]">
          Dán bất kỳ đoạn văn bản, tài liệu, hay danh sách từ vựng tiếng Nhật nào. AI sẽ tự động phân tích cấu trúc, nghĩa từ, bổ sung Hiragana Furigana và đặt câu ví dụ để giúp bạn ghi nhớ.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Input Section */}
        <div className="lg:col-span-5 space-y-6">
          <div className="double-bezel-outer">
            <div className="double-bezel-inner">
              <form onSubmit={handleGenerateCards} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 block">Tài liệu học tập hoặc ghi chú</label>
                  <textarea 
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    placeholder="Dán nội dung tiếng Nhật cần học vào đây..."
                    className="w-full h-48 px-4 py-3 bg-white/3 border border-white/10 rounded-xl text-sm focus:border-accent-teal focus:ring-1 focus:ring-accent-teal outline-none transition-all duration-300 resize-none placeholder-gray-700"
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full btn-premium btn-teal py-3 text-xs font-semibold rounded-xl flex items-center justify-center gap-2"
                >
                  <Sparkle size={16} />
                  {loading ? 'AI đang phân tích & soạn thảo...' : 'AI Phân Tích & Tạo Thẻ'}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Right Output Review Section */}
        <div className="lg:col-span-7 space-y-6">
          {error && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm">
              {successMsg}
            </div>
          )}

          {loading ? (
            <div className="glass-panel p-20 rounded-3xl flex flex-col items-center justify-center space-y-4">
              <div className="w-8 h-8 rounded-full border-2 border-accent-teal border-t-transparent animate-spin"></div>
              <p className="text-sm text-gray-400">Trí tuệ nhân tạo đang phân tách từ vựng...</p>
            </div>
          ) : generatedCards.length > 0 ? (
            <div className="space-y-6">
              {/* Configuration panel to save */}
              <div className="double-bezel-outer">
                <div className="double-bezel-inner space-y-5">
                  <h3 className="text-sm font-bold text-white">Lưu thẻ học vào bộ bài</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    {/* Select existing or new */}
                    <div className="space-y-1.5">
                      <label className="text-gray-400 uppercase tracking-wider font-semibold">Chọn bộ thẻ học</label>
                      <select 
                        value={selectedDeckId}
                        onChange={(e) => setSelectedDeckId(e.target.value)}
                        className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl outline-none focus:border-accent-teal"
                      >
                        {decks.map(d => (
                          <option key={d._id} value={d._id}>{d.name}</option>
                        ))}
                        <option value="new">+ Tạo bộ thẻ học mới</option>
                      </select>
                    </div>

                    {/* If new is selected */}
                    {selectedDeckId === 'new' && (
                      <div className="space-y-1.5">
                        <label className="text-gray-400 uppercase tracking-wider font-semibold">Tên bộ thẻ học mới</label>
                        <input 
                          type="text" 
                          value={newDeckName}
                          onChange={(e) => setNewDeckName(e.target.value)}
                          placeholder="vd: Bài học từ AI..."
                          className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl outline-none focus:border-accent-teal"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <span className="text-xs text-gray-400">
                      Đã chọn {selectedIndices.length} / {generatedCards.length} thẻ học
                    </span>
                    <button 
                      onClick={handleSaveCards}
                      disabled={saveLoading}
                      className="btn-premium btn-teal px-6 py-2.5 text-xs font-semibold rounded-full flex items-center gap-2 cursor-pointer"
                    >
                      {saveLoading ? 'Đang lưu thẻ...' : 'Lưu thẻ vào hệ thống'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Cards Checklist Grid */}
              <div className="space-y-3">
                <div className="flex justify-between items-center px-1">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Xem trước thẻ học gợi ý</h3>
                  <button 
                    onClick={() => {
                      if (selectedIndices.length === generatedCards.length) {
                        setSelectedIndices([]);
                      } else {
                        setSelectedIndices(generatedCards.map((_, i) => i));
                      }
                    }}
                    className="text-xs text-accent-teal hover:underline"
                  >
                    {selectedIndices.length === generatedCards.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                  </button>
                </div>

                <div className="space-y-3">
                  {generatedCards.map((card, idx) => {
                    const isSelected = selectedIndices.includes(idx);
                    return (
                      <div 
                        key={idx}
                        onClick={() => handleToggleSelect(idx)}
                        className={`glass-panel p-5 rounded-2xl border transition-all duration-300 flex items-start gap-4 cursor-pointer
                          ${isSelected ? 'border-accent-teal/40 bg-accent-teal/3' : 'border-white/5 hover:border-white/10'}`}
                      >
                        {/* Custom checkbox */}
                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-all
                          ${isSelected ? 'bg-accent-teal border-accent-teal text-black' : 'border-white/20 bg-white/2'}`}>
                          {isSelected && <Check size={12} weight="bold" />}
                        </div>

                        <div className="space-y-3 flex-1 min-w-0">
                          {/* Card Front & Meaning */}
                          <div className="flex items-baseline gap-2.5 flex-wrap">
                            <div className="text-lg">
                              {renderRuby(card.front, card.frontReading)}
                            </div>
                            <span className="text-sm text-gray-300 font-medium">— {card.back}</span>
                          </div>

                          {/* Card Example */}
                          {card.example && (
                            <div className="pl-3 border-l border-white/8 space-y-0.5 text-xs">
                              <div className="text-gray-400 flex items-center gap-1.5 flex-wrap">
                                <span className="text-accent-teal font-semibold font-mono">Ví dụ:</span>
                                <span>{card.example}</span>
                              </div>
                              {card.exampleReading && (
                                <div className="text-[10px] text-gray-500 italic">
                                  Đọc: {card.exampleReading}
                                </div>
                              )}
                              {card.exampleTranslation && (
                                <div className="text-gray-400">{card.exampleTranslation}</div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-panel p-16 rounded-3xl text-center text-gray-500 space-y-4">
              <Cards size={48} className="mx-auto text-gray-600" />
              <p className="text-sm font-medium">Nhập hoặc dán tài liệu học tập của bạn ở khung bên trái để AI trích xuất flashcard tự động.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
