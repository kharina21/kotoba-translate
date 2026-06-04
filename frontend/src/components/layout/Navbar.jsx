import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Translate, Cards, SquaresFour, SignOut, SignIn, UserPlus, Globe } from '@phosphor-icons/react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  const linkClass = (path) => `
    flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300
    ${isActive(path) 
      ? 'bg-white/10 text-accent-teal shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] border border-white/10' 
      : 'text-gray-400 hover:text-white hover:bg-white/5'}
  `;

  return (
    <nav className="sticky top-4 z-40 mx-auto w-full max-w-6xl px-4">
      <div className="glass-panel py-3 px-6 rounded-full flex justify-between items-center border border-white/8 shadow-2xl">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <span className="w-8 h-8 rounded-full bg-linear-to-tr from-accent-teal to-accent-purple flex items-center justify-center font-bold text-black text-sm group-hover:scale-105 transition-all duration-300">
            K
          </span>
          <span className="font-bold tracking-tight text-lg bg-linear-to-r from-white to-gray-400 bg-clip-text text-transparent group-hover:to-accent-teal transition-all duration-300">
            Kotoba<span className="text-accent-teal">AI</span>
          </span>
        </Link>

        {/* Menu Items */}
        <div className="hidden md:flex items-center gap-2">
          <Link to="/" className={linkClass('/')}>
            <Translate size={18} />
            Dịch thuật
          </Link>
          <Link to="/public-decks" className={linkClass('/public-decks')}>
            <Globe size={18} />
            Thư viện chung
          </Link>
          {user && (
            <>
              <Link to="/dashboard" className={linkClass('/dashboard')}>
                <SquaresFour size={18} />
                Bộ từ vựng
              </Link>
              <Link to="/ai-flashcards" className={linkClass('/ai-flashcards')}>
                <Cards size={18} />
                Tạo thẻ AI
              </Link>
            </>
          )}
        </div>

        {/* Auth Buttons */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              {/* Profile details */}
              <div className="flex items-center gap-2 bg-white/5 pr-3 pl-1 py-1 rounded-full border border-white/5">
                {user.avatar ? (
                  <img 
                    src={user.avatar.startsWith('http') ? user.avatar : `http://localhost:5000${user.avatar}`}
                    alt={user.username} 
                    className="w-7 h-7 rounded-full object-cover border border-white/20"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-accent-teal flex items-center justify-center text-xs font-bold text-black">
                    {user.username.substring(0, 2).toUpperCase()}
                  </div>
                )}
                <span className="text-xs font-medium text-gray-300 hidden sm:inline">{user.username}</span>
              </div>
              
              {/* Log Out */}
              <button 
                onClick={handleLogout}
                className="p-2 rounded-full hover:bg-rose-500/10 text-gray-400 hover:text-rose-400 transition-all duration-300 cursor-pointer"
                title="Đăng xuất"
              >
                <SignOut size={20} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link 
                to="/login"
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium text-gray-300 hover:text-white hover:bg-white/5 border border-transparent transition-all duration-300"
              >
                <SignIn size={14} />
                Đăng nhập
              </Link>
              <Link 
                to="/register"
                className="flex items-center gap-1.5 px-4 py-1.5 bg-white text-black hover:bg-gray-100 rounded-full text-xs font-semibold hover:scale-105 active:scale-95 transition-all duration-300"
              >
                <UserPlus size={14} />
                Đăng ký
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
