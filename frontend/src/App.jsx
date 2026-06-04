import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/layout/Navbar';

// Pages
import TranslatePage from './pages/Translate';
import PublicDecks from './pages/PublicDecks';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import DeckDetail from './pages/DeckDetail';
import StudyPage from './pages/Study';
import AIFlashcards from './pages/AIFlashcards';

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-accent-teal border-t-transparent animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function AppContent() {
  return (
    <Router>
      <div className="relative min-h-screen pb-16">
        {/* Global Paper Film Grain Texture */}
        <div className="grain-overlay"></div>
        
        {/* Navigation Bar */}
        <Navbar />

        {/* Routes */}
        <main className="container mx-auto mt-6">
          <Routes>
            <Route path="/" element={<TranslatePage />} />
            <Route path="/public-decks" element={<PublicDecks />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Private Routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/deck/:deckId" element={<DeckDetail />} />
            <Route path="/study/:deckId" element={<StudyPage />} />
            <Route path="/ai-flashcards" element={
              <ProtectedRoute>
                <AIFlashcards />
              </ProtectedRoute>
            } />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
