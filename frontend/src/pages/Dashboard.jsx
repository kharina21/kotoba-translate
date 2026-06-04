import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  FolderPlus, Plus, Folder, Cards, ShareNetwork, LockKeyOpen, Lock, 
  Trash, Pencil, ArrowRight, MagnifyingGlass, Swap, FileImage, X, FolderSimple
} from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'motion/react';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Decks and Folders states
  const [folders, setFolders] = useState([]);
  const [decks, setDecks] = useState([]);
  const [selectedFolderId, setSelectedFolderId] = useState('all'); // 'all', 'uncategorized', or folderId
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Loading state
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [isDeckModalOpen, setIsDeckModalOpen] = useState(false);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);

  // Form states
  const [folderForm, setFolderForm] = useState({ id: '', name: '', description: '' });
  const [deckForm, setDeckForm] = useState({ id: '', name: '', description: '', isPublic: false, folderId: '', file: null });
  const [selectedDeckToMove, setSelectedDeckToMove] = useState(null);

  // Fetch all folders and decks
  const fetchData = async () => {
    try {
      setLoading(true);
      const [foldersRes, decksRes] = await Promise.all([
        axios.get('/api/folders'),
        axios.get('/api/decks')
      ]);

      if (foldersRes.data.success) setFolders(foldersRes.data.data);
      if (decksRes.data.success) setDecks(decksRes.data.data);
    } catch (err) {
      console.error('Fetch dashboard data error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- Folder CRUD ---
  const handleFolderSubmit = async (e) => {
    e.preventDefault();
    if (!folderForm.name.trim()) return;

    try {
      if (folderForm.id) {
        // Update
        const res = await axios.put(`/api/folders/${folderForm.id}`, folderForm);
        if (res.data.success) {
          setFolders(folders.map(f => f._id === folderForm.id ? res.data.data : f));
        }
      } else {
        // Create
        const res = await axios.post('/api/folders', folderForm);
        if (res.data.success) {
          setFolders([res.data.data, ...folders]);
        }
      }
      closeFolderModal();
    } catch (err) {
      console.error('Folder action error:', err);
    }
  };

  const handleEditFolder = (folder) => {
    setFolderForm({ id: folder._id, name: folder.name, description: folder.description });
    setIsFolderModalOpen(true);
  };

  const handleDeleteFolder = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa thư mục này? Các bộ thẻ học bên trong sẽ không bị xóa mà chỉ được chuyển ra danh sách chưa phân loại.')) return;
    try {
      const res = await axios.delete(`/api/folders/${id}`);
      if (res.data.success) {
        setFolders(folders.filter(f => f._id !== id));
        // Relink decks inside folder locally
        setDecks(decks.map(d => d.folderId === id ? { ...d, folderId: null } : d));
        if (selectedFolderId === id) setSelectedFolderId('all');
      }
    } catch (err) {
      console.error('Delete folder error:', err);
    }
  };

  const closeFolderModal = () => {
    setFolderForm({ id: '', name: '', description: '' });
    setIsFolderModalOpen(false);
  };

  // --- Deck CRUD ---
  const handleDeckSubmit = async (e) => {
    e.preventDefault();
    if (!deckForm.name.trim()) return;

    const formData = new FormData();
    formData.append('name', deckForm.name);
    formData.append('description', deckForm.description);
    formData.append('isPublic', deckForm.isPublic);
    formData.append('folderId', deckForm.folderId || '');
    if (deckForm.file) {
      formData.append('coverImage', deckForm.file);
    }

    try {
      if (deckForm.id) {
        // Update
        const res = await axios.put(`/api/decks/${deckForm.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (res.data.success) {
          setDecks(decks.map(d => d._id === deckForm.id ? res.data.data : d));
        }
      } else {
        // Create
        const res = await axios.post('/api/decks', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (res.data.success) {
          setDecks([res.data.data, ...decks]);
        }
      }
      closeDeckModal();
    } catch (err) {
      console.error('Deck action error:', err);
    }
  };

  const handleEditDeck = (deck, e) => {
    e.stopPropagation();
    e.preventDefault();
    setDeckForm({
      id: deck._id,
      name: deck.name,
      description: deck.description,
      isPublic: deck.isPublic,
      folderId: deck.folderId || '',
      file: null
    });
    setIsDeckModalOpen(true);
  };

  const handleDeleteDeck = async (id, e) => {
    e.stopPropagation();
    e.preventDefault();
    if (!window.confirm('Bạn có chắc chắn muốn xóa bộ từ vựng này và tất cả thẻ học bên trong?')) return;
    try {
      const res = await axios.delete(`/api/decks/${id}`);
      if (res.data.success) {
        setDecks(decks.filter(d => d._id !== id));
      }
    } catch (err) {
      console.error('Delete deck error:', err);
    }
  };

  const closeDeckModal = () => {
    setDeckForm({ id: '', name: '', description: '', isPublic: false, folderId: '', file: null });
    setIsDeckModalOpen(false);
  };

  // --- Move Deck ---
  const handleOpenMoveModal = (deck, e) => {
    e.stopPropagation();
    e.preventDefault();
    setSelectedDeckToMove(deck);
    setIsMoveModalOpen(true);
  };

  const handleMoveDeck = async (folderId) => {
    try {
      const res = await axios.put(`/api/decks/${selectedDeckToMove._id}`, {
        folderId: folderId === 'null' ? '' : folderId
      });
      if (res.data.success) {
        setDecks(decks.map(d => d._id === selectedDeckToMove._id ? res.data.data : d));
      }
      setIsMoveModalOpen(false);
      setSelectedDeckToMove(null);
    } catch (err) {
      console.error('Move deck error:', err);
    }
  };

  // --- Filtering & Searching logic ---
  const filteredDecks = decks.filter(deck => {
    // 1. Folder check
    if (selectedFolderId === 'uncategorized' && deck.folderId !== null) return false;
    if (selectedFolderId !== 'all' && selectedFolderId !== 'uncategorized' && deck.folderId !== selectedFolderId) return false;

    // 2. Search check
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const nameMatch = deck.name.toLowerCase().includes(query);
      const descMatch = deck.description.toLowerCase().includes(query);
      return nameMatch || descMatch;
    }

    return true;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 relative">
      <div className="glow-orb glow-orb-teal"></div>
      <div className="glow-orb glow-orb-purple"></div>

      {/* Greeting and summary bar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 z-10 relative">
        <div>
          <span className="rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-medium bg-white/5 border border-white/10 text-accent-teal">
            Không gian cá nhân
          </span>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mt-3">
            Hộp thẻ từ vựng của {user?.username}
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Quản lý các thư mục và bộ thẻ học flashcard để ôn luyện thông minh.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsFolderModalOpen(true)}
            className="btn-premium btn-secondary px-4 py-2.5 text-xs rounded-full flex items-center gap-2 cursor-pointer"
          >
            <FolderPlus size={16} />
            Thêm thư mục
          </button>
          <button 
            onClick={() => setIsDeckModalOpen(true)}
            className="btn-premium btn-teal px-4 py-2.5 text-xs rounded-full flex items-center gap-2 cursor-pointer"
          >
            <Plus size={16} />
            Tạo bộ thẻ mới
          </button>
        </div>
      </div>

      {/* Folders Tab Bar Navigation */}
      <div className="mb-8 z-10 relative">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3 pl-1">Thư mục bài học</h3>
        <div className="flex items-center flex-wrap gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button 
            onClick={() => setSelectedFolderId('all')}
            className={`px-4 py-2 rounded-full text-xs font-medium border transition-all duration-300 flex items-center gap-1.5 cursor-pointer
              ${selectedFolderId === 'all' 
                ? 'bg-accent-teal/10 border-accent-teal/30 text-accent-teal' 
                : 'bg-white/3 border-white/5 text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            <Folder size={14} />
            Tất cả bộ ({decks.length})
          </button>

          {folders.map(folder => (
            <div 
              key={folder._id} 
              className={`flex items-center rounded-full border transition-all duration-300 bg-white/3 border-white/5 pr-2 pl-4 py-1 gap-2 text-xs font-medium
                ${selectedFolderId === folder._id ? 'bg-accent-teal/10 border-accent-teal/30 text-accent-teal' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
              <button 
                onClick={() => setSelectedFolderId(folder._id)}
                className="flex items-center gap-1.5 py-1 cursor-pointer"
              >
                <Folder size={14} />
                {folder.name}
              </button>
              
              {/* Folder Actions */}
              <div className="flex items-center gap-1 ml-1 border-l border-white/10 pl-2">
                <button 
                  onClick={() => handleEditFolder(folder)}
                  className="p-1 hover:text-accent-teal rounded transition-colors cursor-pointer"
                  title="Sửa tên thư mục"
                >
                  <Pencil size={12} />
                </button>
                <button 
                  onClick={() => handleDeleteFolder(folder._id)}
                  className="p-1 hover:text-rose-400 rounded transition-colors cursor-pointer"
                  title="Xóa thư mục"
                >
                  <Trash size={12} />
                </button>
              </div>
            </div>
          ))}

          <button 
            onClick={() => setSelectedFolderId('uncategorized')}
            className={`px-4 py-2 rounded-full text-xs font-medium border transition-all duration-300 flex items-center gap-1.5 cursor-pointer
              ${selectedFolderId === 'uncategorized' 
                ? 'bg-accent-teal/10 border-accent-teal/30 text-accent-teal' 
                : 'bg-white/3 border-white/5 text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            <FolderSimple size={14} />
            Chưa phân loại ({decks.filter(d => !d.folderId).length})
          </button>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="mb-6 relative z-10 max-w-md">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
          <MagnifyingGlass size={16} />
        </span>
        <input 
          type="text" 
          placeholder="Tìm kiếm bộ thẻ từ vựng..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-11 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-full text-xs outline-none focus:border-accent-teal transition-all"
        />
      </div>

      {/* Decks Grid List (Asymmetric Bento Style) */}
      <div className="z-10 relative">
        {loading ? (
          <div className="glass-panel p-20 rounded-3xl flex flex-col items-center justify-center space-y-4">
            <div className="w-8 h-8 rounded-full border-2 border-accent-teal border-t-transparent animate-spin"></div>
            <p className="text-xs text-gray-500">Đang đồng bộ dữ liệu với học viện...</p>
          </div>
        ) : filteredDecks.length === 0 ? (
          <div className="glass-panel p-16 rounded-3xl text-center text-gray-500 space-y-4">
            <Cards size={48} className="mx-auto text-gray-600" />
            <p className="text-sm font-medium">Chưa có bộ từ vựng nào trong danh mục này.</p>
            <button 
              onClick={() => setIsDeckModalOpen(true)}
              className="btn-premium btn-teal px-4 py-2 text-xs rounded-full cursor-pointer"
            >
              Tạo bộ thẻ học đầu tiên
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDecks.map((deck, index) => {
              // Asymmetric sizes dynamically (every 3rd or 4th is larger for bento style)
              const isBentoHero = index % 5 === 0;
              return (
                <motion.div
                  key={deck._id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                  className={`group relative overflow-hidden rounded-3xl border border-white/8 bg-glass-card shadow-lg hover:border-accent-teal/50 hover:shadow-2xl transition-all duration-500 
                    ${isBentoHero ? 'md:col-span-2' : ''}`}
                >
                  <Link to={`/deck/${deck._id}`} className="block h-full">
                    {/* Deck Cover Image Banner */}
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
                      
                      {/* Privacy Tag */}
                      <span className={`absolute top-4 left-4 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 border
                        ${deck.isPublic 
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                          : 'bg-zinc-500/10 border-zinc-500/20 text-zinc-400'}`}>
                        {deck.isPublic ? <LockKeyOpen size={10} /> : <Lock size={10} />}
                        {deck.isPublic ? 'Công khai' : 'Riêng tư'}
                      </span>
                    </div>

                    {/* Deck Details */}
                    <div className="p-6 space-y-4">
                      <div>
                        <h2 className="text-lg font-bold text-white group-hover:text-accent-teal transition-colors duration-300">
                          {deck.name}
                        </h2>
                        <p className="text-xs text-gray-400 line-clamp-2 mt-1 leading-relaxed">
                          {deck.description || 'Chưa có mô tả.'}
                        </p>
                      </div>

                      {/* Info Footer */}
                      <div className="flex items-center justify-between pt-4 border-t border-white/5 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Cards size={14} className="text-accent-teal" />
                          Ôn tập thẻ học
                        </span>
                        
                        {/* Interactive Edit / Delete Controls */}
                        <div className="flex items-center gap-1.5 z-20">
                          <button 
                            onClick={(e) => handleOpenMoveModal(deck, e)}
                            className="p-2 hover:bg-white/5 text-gray-400 hover:text-white rounded-full transition-colors cursor-pointer"
                            title="Di chuyển vào thư mục"
                          >
                            <Swap size={14} />
                          </button>
                          <button 
                            onClick={(e) => handleEditDeck(deck, e)}
                            className="p-2 hover:bg-white/5 text-gray-400 hover:text-white rounded-full transition-colors cursor-pointer"
                            title="Chỉnh sửa bộ thẻ"
                          >
                            <Pencil size={14} />
                          </button>
                          <button 
                            onClick={(e) => handleDeleteDeck(deck._id, e)}
                            className="p-2 hover:bg-rose-500/10 text-gray-400 hover:text-rose-400 rounded-full transition-colors cursor-pointer"
                            title="Xóa bộ thẻ"
                          >
                            <Trash size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* 1. FOLDER DIALOG MODAL */}
      <AnimatePresence>
        {isFolderModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/85 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md double-bezel-outer"
            >
              <div className="double-bezel-inner relative">
                <button onClick={closeFolderModal} className="absolute right-4 top-4 p-2 bg-white/5 hover:bg-white/10 rounded-full cursor-pointer">
                  <X size={16} />
                </button>
                <h3 className="text-lg font-bold text-white mb-4">
                  {folderForm.id ? 'Cập nhật thư mục' : 'Thêm thư mục học tập mới'}
                </h3>
                <form onSubmit={handleFolderSubmit} className="space-y-4 text-xs">
                  <div className="space-y-2">
                    <label className="text-gray-400 uppercase tracking-wider font-semibold">Tên thư mục</label>
                    <input 
                      type="text" 
                      value={folderForm.name} 
                      onChange={(e) => setFolderForm({ ...folderForm, name: e.target.value })}
                      placeholder="vd: Hán tự N5, Giao tiếp nhà hàng..."
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm focus:border-accent-teal outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-gray-400 uppercase tracking-wider font-semibold">Mô tả chi tiết</label>
                    <textarea 
                      value={folderForm.description} 
                      onChange={(e) => setFolderForm({ ...folderForm, description: e.target.value })}
                      placeholder="Mô tả thư mục học tập..."
                      className="w-full h-24 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm focus:border-accent-teal outline-none resize-none"
                    />
                  </div>
                  <button type="submit" className="w-full btn-premium btn-teal py-3 text-xs font-semibold rounded-xl">
                    {folderForm.id ? 'Lưu thay đổi' : 'Tạo thư mục'}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. DECK DIALOG MODAL */}
      <AnimatePresence>
        {isDeckModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/85 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md double-bezel-outer"
            >
              <div className="double-bezel-inner relative">
                <button onClick={closeDeckModal} className="absolute right-4 top-4 p-2 bg-white/5 hover:bg-white/10 rounded-full cursor-pointer">
                  <X size={16} />
                </button>
                <h3 className="text-lg font-bold text-white mb-4">
                  {deckForm.id ? 'Cập nhật bộ thẻ' : 'Tạo bộ thẻ từ vựng mới'}
                </h3>
                <form onSubmit={handleDeckSubmit} className="space-y-4 text-xs">
                  <div className="space-y-1.5">
                    <label className="text-gray-400 uppercase tracking-wider font-semibold">Tên bộ thẻ học</label>
                    <input 
                      type="text" 
                      value={deckForm.name} 
                      onChange={(e) => setDeckForm({ ...deckForm, name: e.target.value })}
                      placeholder="vd: Minna No Nihongo Bài 1..."
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm focus:border-accent-teal outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-gray-400 uppercase tracking-wider font-semibold">Mô tả</label>
                    <textarea 
                      value={deckForm.description} 
                      onChange={(e) => setDeckForm({ ...deckForm, description: e.target.value })}
                      placeholder="Tóm tắt nội dung bài học..."
                      className="w-full h-20 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm focus:border-accent-teal outline-none resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-gray-400 uppercase tracking-wider font-semibold">Thư mục bài học</label>
                      <select 
                        value={deckForm.folderId} 
                        onChange={(e) => setDeckForm({ ...deckForm, folderId: e.target.value })}
                        className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs outline-none focus:border-accent-teal"
                      >
                        <option value="">Chưa phân loại (Root)</option>
                        {folders.map(f => (
                          <option key={f._id} value={f._id}>{f.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-gray-400 uppercase tracking-wider font-semibold">Chế độ chia sẻ</label>
                      <select 
                        value={deckForm.isPublic} 
                        onChange={(e) => setDeckForm({ ...deckForm, isPublic: e.target.value === 'true' })}
                        className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs outline-none focus:border-accent-teal"
                      >
                        <option value="false">Riêng tư</option>
                        <option value="true">Công khai thư viện</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-gray-400 uppercase tracking-wider font-semibold">Ảnh nền bài học (Cover Image)</label>
                    <div className="relative">
                      <input 
                        type="file" 
                        onChange={(e) => setDeckForm({ ...deckForm, file: e.target.files[0] })}
                        accept="image/*"
                        className="hidden" 
                        id="deck-file-upload"
                      />
                      <label 
                        htmlFor="deck-file-upload"
                        className="w-full py-3 bg-white/3 border border-dashed border-white/10 hover:border-accent-teal hover:bg-white/5 rounded-xl cursor-pointer flex items-center justify-center gap-2 text-gray-400 hover:text-white transition-all"
                      >
                        <FileImage size={18} />
                        {deckForm.file ? deckForm.file.name : 'Chọn một tệp ảnh để tải lên'}
                      </label>
                    </div>
                  </div>
                  <button type="submit" className="w-full btn-premium btn-teal py-3 text-xs font-semibold rounded-xl">
                    {deckForm.id ? 'Lưu thay đổi' : 'Tạo bộ thẻ'}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. MOVE TO FOLDER MODAL */}
      <AnimatePresence>
        {isMoveModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/85 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm double-bezel-outer"
            >
              <div className="double-bezel-inner relative">
                <button onClick={() => setIsMoveModalOpen(false)} className="absolute right-4 top-4 p-2 bg-white/5 hover:bg-white/10 rounded-full cursor-pointer">
                  <X size={16} />
                </button>
                <h3 className="text-sm font-bold text-white mb-4">
                  Di chuyển bộ: <span className="text-accent-teal">"{selectedDeckToMove?.name}"</span>
                </h3>
                <div className="space-y-2 text-xs">
                  <button 
                    onClick={() => handleMoveDeck('null')}
                    className="w-full py-3 px-4 bg-white/3 hover:bg-white/5 hover:text-accent-teal border border-white/5 rounded-xl text-left font-medium transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <FolderSimple size={16} />
                    Chưa phân loại (Root)
                  </button>
                  {folders.map(folder => (
                    <button 
                      key={folder._id}
                      onClick={() => handleMoveDeck(folder._id)}
                      className="w-full py-3 px-4 bg-white/3 hover:bg-white/5 hover:text-accent-teal border border-white/5 rounded-xl text-left font-medium transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      <Folder size={16} />
                      {folder.name}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
