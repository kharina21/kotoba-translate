import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Configure axios defaults on component mount
  useEffect(() => {
    const token = localStorage.getItem('kotoba_token') || sessionStorage.getItem('kotoba_token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUserProfile();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUserProfile = async () => {
    try {
      const res = await axios.get('/api/auth/me');
      if (res.data.success) {
        setUser(res.data.data);
      } else {
        logout();
      }
    } catch (err) {
      console.error('Fetch profile error:', err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (emailOrUsername, password, rememberMe = false) => {
    try {
      const res = await axios.post('/api/auth/login', { emailOrUsername, password });
      
      if (res.data.success) {
        const { token, ...userData } = res.data.data;
        
        // Save token depending on Remember Me preference
        if (rememberMe) {
          localStorage.setItem('kotoba_token', token);
          localStorage.setItem('kotoba_remembered_username', emailOrUsername);
        } else {
          sessionStorage.setItem('kotoba_token', token);
          localStorage.removeItem('kotoba_remembered_username');
        }

        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setUser(userData);
        return { success: true };
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra thông tin.';
      return { success: false, message: errMsg };
    }
  };

  const register = async (username, email, password) => {
    try {
      const res = await axios.post('/api/auth/register', { username, email, password });
      
      if (res.data.success) {
        const { token, ...userData } = res.data.data;
        
        // Default register doesn't remember, or we save to sessionStorage
        sessionStorage.setItem('kotoba_token', token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setUser(userData);
        return { success: true };
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Đăng ký thất bại. Tên đăng nhập hoặc email đã tồn tại.';
      return { success: false, message: errMsg };
    }
  };

  const logout = () => {
    localStorage.removeItem('kotoba_token');
    sessionStorage.removeItem('kotoba_token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const updateAvatar = async (formData) => {
    try {
      const res = await axios.put('/api/auth/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      if (res.data.success) {
        setUser(res.data.data);
        return { success: true };
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Không thể cập nhật ảnh đại diện.';
      return { success: false, message: errMsg };
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateAvatar }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
