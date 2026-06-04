import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Globe, MagnifyingGlass, Cards, User, LockKeyOpen } from '@phosphor-icons/react';
import { motion } from 'motion/react';

export default function PublicDecks() {
  const [publicDecks, setPublicDecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchPublicDecks = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/decks/public');
      if (res.data.success) {
        setPublicDecks(res.data.data);
      }
    } catch (err) {
      console.error('Fetch public decks error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPublicDecks();
  }, []);

  const filteredDecks = publicDecks.filter(deck => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    
    const nameMatch = deck.name.toLowerCase().includes(query);
    const descMatch = deck.description.toLowerCase().includes(query);
    const authorMatch = deck.userId?.username?.toLowerCase().includes(query);
    
    return nameMatch || descMatch || authorMatch;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 relative">
      <div className="glow-orb glow-orb-teal"></div>
      <div className="glow-orb glow-orb-purple"></div>

      {/* Header */}
      <div className="mb-10 text-left">
        <span className="rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-medium bg-white/5 border border-white/10 text-accent-teal">
          Khám phá cộng đồng
        </span>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mt-3">
          Thư viện học phần công khai
        </h1>
        <p className="text-sm text-gray-400 mt-2 max-w-[65ch]">
          Tìm kiếm và học tập miễn phí từ các bộ thẻ học flashcard được chia sẻ công khai bởi các thành viên khác trong học viện.
        </p>
      </div>

      {/* Search Input Bar */}
      <div className="mb-8 relative z-10 max-w-md">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
          <MagnifyingGlass size={16} />
        </span>
        <input 
          type="text" 
          placeholder="Tìm tên bộ thẻ, mô tả hoặc tác giả..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-11 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-full text-xs outline-none focus:border-accent-teal transition-all"
        />
      </div>

      {/* Public Decks Grid */}
      <div className="z-10 relative">
        {loading ? (
          <div className="glass-panel p-20 rounded-3xl flex flex-col items-center justify-center space-y-4">
            <div className="w-8 h-8 rounded-full border-2 border-accent-teal border-t-transparent animate-spin"></div>
            <p className="text-xs text-gray-500">Đang quét thư viện công khai...</p>
          </div>
        ) : filteredDecks.length === 0 ? (
          <div className="glass-panel p-16 rounded-3xl text-center text-gray-500 space-y-4">
            <Globe size={48} className="mx-auto text-gray-600" />
            <p className="text-sm font-medium">Không tìm thấy bộ thẻ học nào phù hợp với từ khóa.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDecks.map((deck, index) => (
              <motion.div
                key={deck._id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                className="group relative overflow-hidden rounded-3xl border border-white/8 bg-glass-card shadow-lg hover:border-accent-teal/50 hover:shadow-2xl transition-all duration-500"
              >
                <Link to={`/deck/${deck._id}`} className="block h-full">
                  {/* Deck Cover Image */}
                  <div className="h-32 w-full relative overflow-hidden bg-white/2 border-b border-white/5">
                    {deck.coverImage ? (
                      <img 
                        src={deck.coverImage.startsWith('http') ? deck.coverImage : `http://localhost:5000${deck.coverImage}`}
                        alt={deck.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700 opacity-60"
                      />
                    ) : (
                      <div className="w-full h-full bg-linear-to-br from-white/3 to-white/0 flex items-center justify-center text-white/5 text-6xl font-bold">
                        KOTO
                      </div>
                    )}
                    
                    <span className="absolute top-4 left-4 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 border bg-emerald-500/10 border-emerald-500/20 text-emerald-400">
                      <LockKeyOpen size={10} />
                      Chia sẻ công khai
                    </span>
                  </div>

                  {/* Deck Info */}
                  <div className="p-6 space-y-4">
                    <div>
                      <h2 className="text-lg font-bold text-white group-hover:text-accent-teal transition-colors duration-300">
                        {deck.name}
                      </h2>
                      <p className="text-xs text-gray-400 line-clamp-2 mt-1 leading-relaxed">
                        {deck.description || 'Chưa có mô tả.'}
                      </p>
                    </div>

                    {/* Author and icons */}
                    <div className="flex items-center justify-between pt-4 border-t border-white/5 text-xs text-gray-500">
                      <span className="flex items-center gap-1.5">
                        <Cards size={14} className="text-accent-teal" />
                        Ôn tập thẻ học
                      </span>

                      {/* Author credentials */}
                      <div className="flex items-center gap-1.5 text-gray-400">
                        {deck.userId?.avatar ? (
                          <img 
                            src={deck.userId.avatar.startsWith('http') ? deck.userId.avatar : `http://localhost:5000${deck.userId.avatar}`}
                            alt={deck.userId?.username} 
                            className="w-4 h-4 rounded-full object-cover border border-white/10"
                          />
                        ) : (
                          <User size={12} className="text-accent-purple" />
                        )}
                        <span className="text-[10px] font-medium">{deck.userId?.username || 'Hệ thống'}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
