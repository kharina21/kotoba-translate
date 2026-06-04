import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import { 
  Cards, SpeakerHigh, ArrowLeft, ArrowRight, Trophy, Clock, 
  ArrowCounterClockwise, CheckCircle, XCircle, Lightning, GameController, Eye 
} from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';

export default function StudyPage() {
  const { deckId } = useParams();

  const [deck, setDeck] = useState(null);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Game modes: 'menu', 'flashcard', 'quiz', 'match'
  const [studyMode, setStudyMode] = useState('menu');

  const fetchDeckAndCards = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await axios.get(`/api/decks/${deckId}`);
      if (res.data.success) {
        setDeck(res.data.data.deck);
        setCards(res.data.data.cards);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Không thể tải học phần ôn tập.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeckAndCards();
  }, [deckId]);

  // Audio Speech Synthesis
  const handlePlayAudio = (textToSpeak) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = 'ja-JP';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Helper to render Furigana
  const renderRuby = (front, frontReading) => {
    if (typeof frontReading === 'object' && Array.isArray(frontReading)) {
      return frontReading.map((seg, idx) => (
        <ruby key={idx} className="text-white font-bold">
          {seg.text}
          {seg.rt && <rt>{seg.rt}</rt>}
        </ruby>
      ));
    }
    return (
      <ruby className="text-white font-bold">
        {front}
        {frontReading && <rt>{frontReading}</rt>}
      </ruby>
    );
  };

  // Render subcomponents for each game mode
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 relative min-h-[85vh]">
      <div className="glow-orb glow-orb-teal"></div>
      <div className="glow-orb glow-orb-purple"></div>

      {/* Back button */}
      <Link 
        to={`/deck/${deckId}`}
        className="inline-flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors mb-6 z-10 relative"
      >
        <ArrowLeft size={14} />
        Quay lại học phần "{deck?.name}"
      </Link>

      {loading ? (
        <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
          <div className="w-8 h-8 rounded-full border-2 border-accent-teal border-t-transparent animate-spin"></div>
          <p className="text-sm text-gray-500">Đang chuẩn bị học cụ và tải thẻ bài...</p>
        </div>
      ) : error || cards.length === 0 ? (
        <div className="glass-panel p-16 rounded-3xl text-center text-gray-500 space-y-4">
          <p className="text-sm font-medium">{error || 'Bộ thẻ học này trống. Cần có ít nhất 1 thẻ để bắt đầu ôn tập.'}</p>
        </div>
      ) : (
        <div className="z-10 relative">
          {studyMode === 'menu' && (
            <StudyMenu deck={deck} cards={cards} setStudyMode={setStudyMode} />
          )}
          {studyMode === 'flashcard' && (
            <FlashcardMode cards={cards} renderRuby={renderRuby} handlePlayAudio={handlePlayAudio} setStudyMode={setStudyMode} />
          )}
          {studyMode === 'quiz' && (
            <QuizMode cards={cards} renderRuby={renderRuby} handlePlayAudio={handlePlayAudio} setStudyMode={setStudyMode} />
          )}
          {studyMode === 'match' && (
            <MatchMode cards={cards} renderRuby={renderRuby} handlePlayAudio={handlePlayAudio} setStudyMode={setStudyMode} />
          )}
        </div>
      )}
    </div>
  );
}

// --- SUB-COMPONENT: STUDY MODE SELECTION MENU ---
function StudyMenu({ deck, cards, setStudyMode }) {
  return (
    <div className="space-y-8">
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-bold tracking-tight text-white">Lựa chọn chế độ học tập</h1>
        <p className="text-sm text-gray-400 max-w-[60ch] mx-auto">
          Chọn phương pháp học phù hợp nhất với mục tiêu ôn tập của bạn cho học phần <strong>"{deck.name}"</strong> ({cards.length} thẻ).
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        {/* Flashcard Mode */}
        <div 
          onClick={() => setStudyMode('flashcard')}
          className="double-bezel-outer group cursor-pointer hover:border-accent-teal/30 hover:scale-[1.02] transition-all duration-300"
        >
          <div className="double-bezel-inner text-center py-8 space-y-4 h-full flex flex-col justify-between">
            <span className="inline-block p-4 bg-accent-teal/10 rounded-2xl border border-accent-teal/20 text-accent-teal group-hover:scale-110 transition-transform duration-300 mx-auto">
              <Cards size={36} />
            </span>
            <div>
              <h3 className="text-lg font-bold text-white mb-2">Thẻ ghi nhớ 3D</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Xem lại từ vựng dưới dạng thẻ lật xoay 3D trực quan, hỗ trợ âm thanh phát âm mẫu.
              </p>
            </div>
            <span className="text-xs text-accent-teal font-semibold group-hover:underline">Bắt đầu học</span>
          </div>
        </div>

        {/* Kahoot Quiz Mode */}
        <div 
          onClick={() => setStudyMode('quiz')}
          className="double-bezel-outer group cursor-pointer hover:border-accent-purple/30 hover:scale-[1.02] transition-all duration-300"
        >
          <div className="double-bezel-inner text-center py-8 space-y-4 h-full flex flex-col justify-between">
            <span className="inline-block p-4 bg-accent-purple/10 rounded-2xl border border-accent-purple/20 text-accent-purple group-hover:scale-110 transition-transform duration-300 mx-auto">
              <Trophy size={36} />
            </span>
            <div>
              <h3 className="text-lg font-bold text-white mb-2">Trắc nghiệm Kahoot</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Trả lời nhanh trắc nghiệm tính giờ lấy điểm thưởng. Tạo không khí thi đấu sôi nổi.
              </p>
            </div>
            <span className="text-xs text-accent-purple font-semibold group-hover:underline">Bắt đầu chơi</span>
          </div>
        </div>

        {/* Matching Tiles Mode */}
        <div 
          onClick={() => setStudyMode('match')}
          className="double-bezel-outer group cursor-pointer hover:border-accent-cyan/30 hover:scale-[1.02] transition-all duration-300"
        >
          <div className="double-bezel-inner text-center py-8 space-y-4 h-full flex flex-col justify-between">
            <span className="inline-block p-4 bg-accent-cyan/10 rounded-2xl border border-accent-cyan/20 text-accent-cyan group-hover:scale-110 transition-transform duration-300 mx-auto">
              <GameController size={36} />
            </span>
            <div>
              <h3 className="text-lg font-bold text-white mb-2">Ghép cặp tốc độ</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Nhanh tay nối các chữ tiếng Nhật với ý nghĩa tiếng Việt tương ứng dưới áp lực thời gian.
              </p>
            </div>
            <span className="text-xs text-accent-cyan font-semibold group-hover:underline">Bắt đầu ghép</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- SUB-COMPONENT: FLASHCARD MODE ---
function FlashcardMode({ cards, renderRuby, handlePlayAudio, setStudyMode }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [learnedCount, setLearnedCount] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);

  const currentCard = cards[currentIndex];

  const handleNext = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % cards.length);
    }, 150);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
    }, 150);
  };

  const handleAction = (type) => {
    if (type === 'learned') setLearnedCount(l => l + 1);
    if (type === 'review') setReviewCount(r => r + 1);
    handleNext();
  };

  return (
    <div className="max-w-xl mx-auto space-y-8">
      {/* Progress Bar */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>Thẻ {currentIndex + 1} / {cards.length}</span>
        <div className="flex gap-4">
          <span className="text-emerald-400">Đã thuộc: {learnedCount}</span>
          <span className="text-rose-400">Cần ôn: {reviewCount}</span>
        </div>
      </div>

      <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
        <div 
          className="bg-accent-teal h-full transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
        ></div>
      </div>

      {/* 3D Flipping Card Container */}
      <div 
        className={`card-container ${isFlipped ? 'is-flipped' : ''}`}
        onClick={() => {
          setIsFlipped(!isFlipped);
          if (!isFlipped) handlePlayAudio(currentCard.front); // Speak when showing front
        }}
      >
        <div className="card-inner cursor-pointer">
          {/* Front Face */}
          <div className="card-face">
            <div className="w-full h-full glass-panel border border-white/10 rounded-3xl flex flex-col justify-between items-center p-8 bg-linear-to-b from-white/3 to-transparent relative shadow-2xl">
              <span className="text-[10px] text-gray-500 font-mono uppercase tracking-widest absolute top-6">Mặt trước (Tiếng Nhật)</span>
              
              <div className="text-4xl text-center select-none py-10 flex flex-wrap justify-center">
                {renderRuby(currentCard.front, currentCard.frontReading)}
              </div>

              <div className="flex items-center gap-2 text-gray-500 group">
                <Eye size={16} />
                <span className="text-xs">Nhấp để xem bản dịch</span>
              </div>
            </div>
          </div>

          {/* Back Face */}
          <div className="card-face card-back">
            <div className="w-full h-full glass-panel border border-accent-teal/20 rounded-3xl flex flex-col justify-between items-center p-8 bg-linear-to-b from-accent-teal/5 to-transparent relative shadow-2xl">
              <span className="text-[10px] text-accent-teal font-mono uppercase tracking-widest absolute top-6">Mặt sau (Bản dịch)</span>
              
              <div className="text-center space-y-4 py-8">
                <p className="text-2xl font-bold text-white select-none">{currentCard.back}</p>
                {currentCard.example && (
                  <div className="space-y-1 text-xs text-gray-400 max-w-[90%] mx-auto leading-relaxed border-t border-white/5 pt-3">
                    <p className="text-gray-300 font-semibold">{currentCard.example}</p>
                    {currentCard.exampleReading && <p className="text-gray-500 text-[10px] italic">Đọc: {currentCard.exampleReading}</p>}
                    {currentCard.exampleTranslation && <p>{currentCard.exampleTranslation}</p>}
                  </div>
                )}
              </div>

              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handlePlayAudio(currentCard.front);
                }}
                className="p-3 bg-white/5 hover:bg-accent-teal hover:text-black border border-white/10 rounded-full transition-all duration-300 cursor-pointer"
                title="Nghe lại"
              >
                <SpeakerHigh size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex justify-between items-center gap-4">
        <button 
          onClick={handlePrev}
          className="p-3 bg-white/5 hover:bg-white/10 text-white rounded-full border border-white/10 transition-colors cursor-pointer"
        >
          <ArrowLeft size={18} />
        </button>

        <div className="flex gap-3 flex-1 justify-center max-w-sm">
          <button 
            onClick={() => handleAction('review')}
            className="w-1/2 btn-premium btn-secondary py-3 text-xs font-semibold rounded-full border-rose-500/20 hover:bg-rose-500/10 hover:text-rose-400"
          >
            Chưa thuộc (Review)
          </button>
          <button 
            onClick={() => handleAction('learned')}
            className="w-1/2 btn-premium btn-teal py-3 text-xs font-semibold rounded-full"
          >
            Đã thuộc (Got it)
          </button>
        </div>

        <button 
          onClick={handleNext}
          className="p-3 bg-white/5 hover:bg-white/10 text-white rounded-full border border-white/10 transition-colors cursor-pointer"
        >
          <ArrowRight size={18} />
        </button>
      </div>

      <div className="text-center pt-4">
        <button 
          onClick={() => setStudyMode('menu')}
          className="text-xs text-gray-500 hover:text-white underline cursor-pointer"
        >
          Thay đổi chế độ học
        </button>
      </div>
    </div>
  );
}

// --- SUB-COMPONENT: KHOOT QUIZ MODE ---
function QuizMode({ cards, renderRuby, handlePlayAudio, setStudyMode }) {
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  
  // Game state
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [timer, setTimer] = useState(15);
  const [isGameOver, setIsGameOver] = useState(false);

  const timerIntervalRef = useRef(null);

  // Generate Kahoot-style questions dynamically on start
  useEffect(() => {
    const qList = cards.map((card, idx) => {
      // Correct answer is the card back translation
      const correctAnswer = card.back;
      
      // Select 3 random wrong answers from other cards
      const otherCardBacks = cards
        .filter((_, oIdx) => oIdx !== idx)
        .map(c => c.back);
        
      // Shuffle wrong answers and pick 3
      const shuffledWrong = otherCardBacks.sort(() => 0.5 - Math.random());
      const selectedWrong = shuffledWrong.slice(0, 3);
      
      // If we don't have enough wrong cards, fill with generic mock words
      while (selectedWrong.length < 3) {
        selectedWrong.push(`Nghĩa bổ sung ${selectedWrong.length + 1}`);
      }

      // Combine and shuffle options
      const options = [correctAnswer, ...selectedWrong].sort(() => 0.5 - Math.random());

      return {
        card,
        questionText: `Nghĩa tiếng Việt của từ "${card.front}" là gì?`,
        options,
        correctAnswer
      };
    });

    setQuestions(qList.sort(() => 0.5 - Math.random()));
  }, [cards]);

  // Start question timer countdown
  const startTimer = () => {
    clearInterval(timerIntervalRef.current);
    setTimer(15);
    timerIntervalRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timerIntervalRef.current);
          handleTimeOut();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    if (questions.length > 0 && !isGameOver) {
      startTimer();
    }
    return () => clearInterval(timerIntervalRef.current);
  }, [currentIdx, questions, isGameOver]);

  const handleTimeOut = () => {
    setSelectedAnswer('');
    setHasSubmitted(true);
  };

  const handleAnswerClick = (ans) => {
    if (hasSubmitted) return;
    
    clearInterval(timerIntervalRef.current);
    setSelectedAnswer(ans);
    setHasSubmitted(true);

    const currentQ = questions[currentIdx];
    if (ans === currentQ.correctAnswer) {
      // Correct score + speed bonus points
      const points = 100 + timer * 10;
      setScore(prev => prev + points);
      triggerConfettiBurst(false); // Small confetti
    }
  };

  const triggerConfettiBurst = (isGrand) => {
    if (isGrand) {
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
    } else {
      confetti({ particleCount: 30, spread: 40, origin: { y: 0.8 } });
    }
  };

  const handleNextQuestion = () => {
    setSelectedAnswer(null);
    setHasSubmitted(false);
    
    if (currentIdx + 1 < questions.length) {
      setCurrentIdx(currentIdx + 1);
    } else {
      setIsGameOver(true);
      triggerConfettiBurst(true); // Huge grand celebration
    }
  };

  const restartQuiz = () => {
    setCurrentIdx(0);
    setScore(0);
    setIsGameOver(false);
    setSelectedAnswer(null);
    setHasSubmitted(false);
    // Re-shuffle list
    setQuestions(prev => [...prev].sort(() => 0.5 - Math.random()));
  };

  if (questions.length === 0) return null;

  const currentQ = questions[currentIdx];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Game Over Screen */}
      {isGameOver ? (
        <div className="double-bezel-outer z-10 relative">
          <div className="double-bezel-inner text-center py-12 space-y-6">
            <span className="inline-block p-5 bg-accent-purple/10 rounded-full border border-accent-purple/20 text-accent-purple mb-2 animate-bounce">
              <Trophy size={48} />
            </span>
            <div>
              <h2 className="text-2xl font-bold text-white">Hoàn thành thử thách!</h2>
              <p className="text-sm text-gray-400 mt-2">Bạn đã xuất sắc vượt qua các câu hỏi trắc nghiệm tiếng Nhật.</p>
            </div>
            
            <div className="py-4 px-6 bg-white/5 border border-white/10 rounded-2xl max-w-xs mx-auto space-y-1">
              <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Tổng điểm đạt được</span>
              <p className="text-3xl font-extrabold text-accent-teal font-mono">{score} pts</p>
            </div>

            <div className="flex gap-4 max-w-sm mx-auto">
              <button 
                onClick={() => setStudyMode('menu')}
                className="w-1/2 btn-premium btn-secondary py-3 text-xs font-semibold rounded-full"
              >
                Về chế độ học
              </button>
              <button 
                onClick={restartQuiz}
                className="w-1/2 btn-premium btn-teal py-3 text-xs font-semibold rounded-full flex items-center justify-center gap-2"
              >
                <ArrowCounterClockwise size={16} />
                Chơi lại
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Header Stats bar */}
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span className="font-semibold">Câu {currentIdx + 1} / {questions.length}</span>
            <div className="flex items-center gap-4 font-mono font-bold text-white">
              <span className="flex items-center gap-1 text-accent-purple">
                <Lightning size={14} />
                {score} pts
              </span>
              <span className={`flex items-center gap-1 ${timer < 5 ? 'text-rose-400 animate-pulse' : 'text-gray-300'}`}>
                <Clock size={14} />
                {timer}s
              </span>
            </div>
          </div>

          <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-accent-purple h-full transition-all duration-300"
              style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
            ></div>
          </div>

          {/* Question display card */}
          <div className="double-bezel-outer">
            <div className="double-bezel-inner py-10 flex flex-col justify-center items-center text-center space-y-4">
              <span className="text-[9px] text-gray-500 uppercase tracking-widest font-semibold">Thử thách từ điển</span>
              <h2 className="text-xl md:text-2xl font-bold text-white px-6">
                Nghĩa tiếng Việt của từ:
              </h2>
              <div className="text-3xl py-4 select-none flex items-center justify-center gap-2">
                {renderRuby(currentQ.card.front, currentQ.card.frontReading)}
                <button 
                  onClick={() => handlePlayAudio(currentQ.card.front)}
                  className="p-1.5 hover:bg-white/5 rounded-full border border-white/5 text-gray-400 hover:text-white"
                >
                  <SpeakerHigh size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Answers options layout (Grid 2x2 matching Kahoot colors) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {currentQ.options.map((opt, oIdx) => {
              const isCorrectOpt = opt === currentQ.correctAnswer;
              const isSelectedOpt = opt === selectedAnswer;
              
              // Custom colors for Kahoot representation (Red, Blue, Yellow, Green)
              const kahootBgs = [
                'bg-rose-500/10 border-rose-500/30 text-rose-300 hover:bg-rose-500/15',
                'bg-blue-500/10 border-blue-500/30 text-blue-300 hover:bg-blue-500/15',
                'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/15',
                'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/15'
              ];

              let borderStyles = kahootBgs[oIdx % 4];
              
              if (hasSubmitted) {
                if (isCorrectOpt) {
                  borderStyles = 'bg-emerald-500/20 border-emerald-500 text-emerald-400 font-bold scale-[1.01]';
                } else if (isSelectedOpt) {
                  borderStyles = 'bg-rose-500/20 border-rose-500 text-rose-400 opacity-60 line-through';
                } else {
                  borderStyles = 'border-white/5 bg-white/2 opacity-30';
                }
              }

              return (
                <button
                  key={oIdx}
                  disabled={hasSubmitted}
                  onClick={() => handleAnswerClick(opt)}
                  className={`w-full py-4 px-6 rounded-2xl border text-sm font-medium text-left transition-all duration-300 flex items-center justify-between gap-4 cursor-pointer
                    ${borderStyles}`}
                >
                  <span>{opt}</span>
                  {hasSubmitted && isCorrectOpt && <CheckCircle size={20} className="text-emerald-400 shrink-0" />}
                  {hasSubmitted && isSelectedOpt && !isCorrectOpt && <XCircle size={20} className="text-rose-400 shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Continue button */}
          {hasSubmitted && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-end pt-2"
            >
              <button
                onClick={handleNextQuestion}
                className="btn-premium btn-teal px-6 py-2.5 text-xs font-semibold rounded-full flex items-center gap-2 cursor-pointer"
              >
                {currentIdx + 1 === questions.length ? 'Xem kết quả' : 'Câu tiếp theo'}
                <ArrowRight size={14} />
              </button>
            </motion.div>
          )}

          <div className="text-center pt-4">
            <button 
              onClick={() => setStudyMode('menu')}
              className="text-xs text-gray-500 hover:text-white underline cursor-pointer"
            >
              Hủy trò chơi
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- SUB-COMPONENT: SPEED MATCHING TILES MODE ---
function MatchMode({ cards, renderRuby, handlePlayAudio, setStudyMode }) {
  const [tiles, setTiles] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [matchedIds, setMatchedIds] = useState([]);
  const [mismatchedIds, setMismatchedIds] = useState([]);

  // Timer state
  const [seconds, setSeconds] = useState(0);
  const [isWon, setIsWon] = useState(false);
  const [bestTime, setBestTime] = useState(
    localStorage.getItem(`best_time_${cards[0].deckId}`) || null
  );

  const timerRef = useRef(null);

  // Initialize matching pairs grid (Max 5 pairs = 10 tiles to be readable)
  const initializeGame = () => {
    clearInterval(timerRef.current);
    setSeconds(0);
    setIsWon(false);
    setSelectedId(null);
    setMatchedIds([]);
    setMismatchedIds([]);

    const gamePairs = cards.slice(0, 5); // Pick top 5 pairs
    
    // Create Japanese card tiles
    const jpTiles = gamePairs.map(card => ({
      id: `jp-${card._id}`,
      cardId: card._id,
      text: card.front,
      reading: card.frontReading,
      type: 'jp'
    }));

    // Create Vietnamese meaning tiles
    const vnTiles = gamePairs.map(card => ({
      id: `vn-${card._id}`,
      cardId: card._id,
      text: card.back,
      type: 'vn'
    }));

    // Shuffle and set
    setTiles([...jpTiles, ...vnTiles].sort(() => 0.5 - Math.random()));

    // Start Timer
    timerRef.current = setInterval(() => {
      setSeconds(s => s + 1);
    }, 1000);
  };

  useEffect(() => {
    initializeGame();
    return () => clearInterval(timerRef.current);
  }, [cards]);

  const handleTileClick = (tile) => {
    if (matchedIds.includes(tile.id) || mismatchedIds.includes(tile.id)) return;

    // First Tile Selection
    if (selectedId === null) {
      setSelectedId(tile.id);
      if (tile.type === 'jp') handlePlayAudio(tile.text);
      return;
    }

    // Clicked same tile -> Unselect
    if (selectedId === tile.id) {
      setSelectedId(null);
      return;
    }

    const firstTile = tiles.find(t => t.id === selectedId);
    
    // Check Match
    if (firstTile.cardId === tile.cardId && firstTile.type !== tile.type) {
      // Correct Match
      const matched = [...matchedIds, firstTile.id, tile.id];
      setMatchedIds(matched);
      setSelectedId(null);

      // Check win condition
      if (matched.length === tiles.length) {
        clearInterval(timerRef.current);
        setIsWon(true);
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 } });
        
        // Save best time
        const prevBest = localStorage.getItem(`best_time_${cards[0].deckId}`);
        if (!prevBest || seconds < parseInt(prevBest)) {
          localStorage.setItem(`best_time_${cards[0].deckId}`, String(seconds));
          setBestTime(seconds);
        }
      }
    } else {
      // Wrong Match
      setMismatchedIds([firstTile.id, tile.id]);
      setSelectedId(null);
      
      // Flash red and reset selection
      setTimeout(() => {
        setMismatchedIds([]);
      }, 500);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {isWon ? (
        <div className="double-bezel-outer">
          <div className="double-bezel-inner text-center py-12 space-y-6">
            <span className="inline-block p-5 bg-accent-cyan/10 rounded-full border border-accent-cyan/20 text-accent-cyan mb-2 animate-bounce">
              <Trophy size={48} />
            </span>
            <div>
              <h2 className="text-2xl font-bold text-white">Xuất sắc hoàn thành ghép cặp!</h2>
              <p className="text-sm text-gray-400 mt-2">Tất cả các cặp từ vựng đã được ghép nối chính xác.</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
              <div className="py-4 px-4 bg-white/5 border border-white/10 rounded-2xl space-y-1">
                <span className="text-[10px] text-gray-500 uppercase tracking-wider block">Thời gian chơi</span>
                <p className="text-2xl font-extrabold text-accent-cyan font-mono">{seconds}s</p>
              </div>
              <div className="py-4 px-4 bg-white/5 border border-white/10 rounded-2xl space-y-1">
                <span className="text-[10px] text-gray-500 uppercase tracking-wider block">Kỷ lục của bạn</span>
                <p className="text-2xl font-extrabold text-accent-teal font-mono">{bestTime ? `${bestTime}s` : '—'}</p>
              </div>
            </div>

            <div className="flex gap-4 max-w-sm mx-auto text-xs">
              <button 
                onClick={() => setStudyMode('menu')}
                className="w-1/2 btn-premium btn-secondary py-3 font-semibold rounded-full"
              >
                Về chế độ học
              </button>
              <button 
                onClick={initializeGame}
                className="w-1/2 btn-premium btn-teal py-3 font-semibold rounded-full flex items-center justify-center gap-2"
              >
                <ArrowCounterClockwise size={16} />
                Chơi lại
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Header Stats bar */}
          <div className="flex items-center justify-between text-xs text-gray-400 px-1">
            <span className="font-semibold">Ghép cặp tiếng Nhật — tiếng Việt</span>
            <div className="flex items-center gap-4 font-mono font-bold text-white">
              <span className="flex items-center gap-1 text-accent-cyan">
                <Clock size={14} />
                Thời gian: {seconds}s
              </span>
              {bestTime && (
                <span className="text-gray-500">
                  Kỷ lục: {bestTime}s
                </span>
              )}
            </div>
          </div>

          {/* Tiles Grid Board */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {tiles.map(tile => {
              const isSelected = selectedId === tile.id;
              const isMatched = matchedIds.includes(tile.id);
              const isMismatched = mismatchedIds.includes(tile.id);

              let tileStyle = 'border-white/8 bg-white/3 text-gray-200 hover:border-white/20';

              if (isSelected) {
                tileStyle = 'border-accent-cyan bg-accent-cyan/15 text-accent-cyan font-semibold scale-95 shadow-[0_0_15px_rgba(6,182,212,0.2)]';
              } else if (isMatched) {
                tileStyle = 'opacity-0 scale-90 pointer-events-none transition-all duration-500';
              } else if (isMismatched) {
                tileStyle = 'border-rose-500 bg-rose-500/20 text-rose-300 animate-pulse';
              }

              return (
                <button
                  key={tile.id}
                  disabled={isMatched}
                  onClick={() => handleTileClick(tile)}
                  className={`aspect-square w-full rounded-2xl border text-center p-3 text-xs leading-relaxed flex items-center justify-center flex-col transition-all duration-300 cursor-pointer
                    ${tileStyle}`}
                >
                  {tile.type === 'jp' ? (
                    <div className="text-sm font-semibold tracking-wide select-none">
                      {renderRuby(tile.text, tile.reading)}
                    </div>
                  ) : (
                    <span className="font-semibold line-clamp-3 select-none">{tile.text}</span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="text-center pt-8">
            <button 
              onClick={() => setStudyMode('menu')}
              className="text-xs text-gray-500 hover:text-white underline cursor-pointer"
            >
              Hủy trò chơi
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
