
import React, { useState, useEffect } from 'react';
import { GameState, NodeStatus, MazeNode, NodeType, GameSettings, Grade, Subject, User, Difficulty, GameOverReason } from './types';
import { generateMazeQuestions, analyzeThinkingError } from './services/gemini';
import { auth, gameStorage, statsStorage } from './utils/storage';
import { questManager } from './utils/quests';
import { sound } from './utils/audio';
import WelcomeScreen, { TabType } from './components/WelcomeScreen';
import AuthScreen from './components/AuthScreen';
import GameMap from './components/GameMap';
import QuestionModal from './components/QuestionModal';
import LandingPage from './components/LandingPage';
import GameOverview from './components/GameOverview';
import ResultScreen from './components/ResultScreen';
import ProfileModal from './components/ProfileModal';
import { Toaster, toast } from 'sonner';
import AppSidebar from './components/Sidebar';
import AIChatFloating from './components/AIChatFloating';
import { Heart, Timer, Trophy, BookOpen, Loader2, Home, Info, Moon, Sun, User as UserIcon, Settings, LogOut, LayoutDashboard, Gamepad2, Library, ShoppingBag, GraduationCap, Brain, Sparkles, Menu, Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const INITIAL_HEARTS = 3;

// --- MEMORY OPTIMIZATION: OBJECT POOLING FOR MAZE NODES ---
const mazeNodePool: MazeNode[] = [];

const getMazeNode = (id: number, row: number, col: number, type: NodeType, status: NodeStatus, question?: any): MazeNode => {
  const node = mazeNodePool.pop() || { id, row, col, type, status, question };
  node.id = id;
  node.row = row;
  node.col = col;
  node.type = type;
  node.status = status;
  node.question = question;
  return node;
};

const releaseMazeNodes = (nodes: MazeNode[]) => {
  mazeNodePool.push(...nodes);
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isDark, setIsDark] = useState(false);
  const [soundMuted, setSoundMuted] = useState(sound.isMuted());

  const handleToggleSound = () => {
    const nextMuted = sound.toggleMute();
    setSoundMuted(nextMuted);
  };
  // Add initializing state to prevent flash of Landing page
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [hasSavedGame, setHasSavedGame] = useState(false);
  
  // Global Navigation State
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [gameState, setGameState] = useState<GameState>({
    screen: 'LANDING',
    settings: {
        grade: Grade.NINE,
        subject: Subject.MATH_ALG,
        gridSize: 3,
        timeLimit: 15,
        suddenDeath: false,
    },
    hearts: INITIAL_HEARTS,
    score: 0,
    nodes: [],
    currentNodeId: null,
    history: [],
    startTime: null,
    timeLeft: 0,
    gameOverReason: null
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [showMobileOverview, setShowMobileOverview] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  // Theme Init
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDark(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDark(true);
    }
  };

  // Check for saved game availability when on Welcome screen
  useEffect(() => {
    const checkSavedGame = async () => {
        if (user && gameState.screen === 'WELCOME') {
            const saved = await gameStorage.loadGameState(user.username);
            setHasSavedGame(!!saved && saved.screen === 'GAME');
        }
    };
    checkSavedGame();
  }, [user, gameState.screen]);

  // Initial Load - Check for Session
  useEffect(() => {
    const checkSession = async () => {
        // Simulate a small delay to ensure DB read (and for smooth UX)
        await new Promise(resolve => setTimeout(resolve, 500));

        const currentUser = auth.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          
          // Try to load saved game state
          const savedState = await gameStorage.loadGameState(currentUser.username);
          if (savedState) {
            setGameState(savedState);
            // If game is active, switch tab to practice
             if (savedState.screen === 'GAME') {
                setActiveTab('practice');
             }
          } else {
            setGameState(prev => ({ ...prev, screen: 'WELCOME' }));
          }
        }
        // Done checking
        setIsCheckingSession(false);
    };

    checkSession();
  }, []);

  // Timer Logic
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (gameState.screen === 'GAME' && gameState.timeLeft > 0) {
      timer = setInterval(() => {
        setGameState(prev => {
          const newTime = prev.timeLeft - 1;
          
          if (newTime <= 0) {
            const newState: GameState = { 
              ...prev, 
              timeLeft: 0, 
              screen: 'GAME_OVER',
              gameOverReason: 'TIMEOUT'
            };
            if (user) gameStorage.saveGameState(user.username, newState);
            return newState;
          }
          return { ...prev, timeLeft: newTime };
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [gameState.screen, gameState.timeLeft, user]);

  const handleEnterAuth = () => {
    setGameState(prev => ({ ...prev, screen: 'AUTH' }));
  };

  const handleLogin = async (loggedInUser: User) => {
    setUser(loggedInUser);
    
    const savedState = await gameStorage.loadGameState(loggedInUser.username);
    if (savedState) {
      setGameState(savedState);
      if (savedState.screen === 'GAME') {
        setActiveTab('practice');
      }
    } else {
      setGameState(prev => ({ ...prev, screen: 'WELCOME' }));
    }
  };

  const handleLogout = async () => {
    if (user && gameState.screen !== 'LANDING' && gameState.screen !== 'AUTH') {
      await gameStorage.saveGameState(user.username, gameState);
    }

    auth.logout();
    setUser(null);
    setGameState(prev => ({ ...prev, screen: 'LANDING' }));
    setActiveTab('dashboard');
  };

  const handleStartGame = async (settings: GameSettings) => {
    if (user) {
      await gameStorage.clearGameState(user.username);
      // Increment games played stat
      await statsStorage.updateStats(user.username, { gamesPlayed: 1 });
    }

    setIsLoading(true);
    setLoadingText('AI đang tối ưu hóa độ chính xác và thiết lập mê cung tri thức...');
    setShowMobileOverview(false);
    
    const count = settings.gridSize * settings.gridSize;

    setGameState(prev => ({ ...prev, screen: 'LOADING', settings, gameOverReason: null }));

    try {
      const generatedQuestions = await generateMazeQuestions(settings.grade, settings.subject, settings.difficulty || Difficulty.MEDIUM, count);
      
      // Release old nodes to pool
      releaseMazeNodes(gameState.nodes);

      const initialNodes: MazeNode[] = [];
      let idCounter = 1;
      const rows = settings.gridSize;
      const cols = settings.gridSize;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const isStart = r === 0 && c === 0;
          const isBoss = r === rows - 1 && c === cols - 1;
          
          initialNodes.push(getMazeNode(
            idCounter,
            r,
            c,
            isStart ? NodeType.START : isBoss ? NodeType.BOSS : NodeType.NORMAL,
            isStart ? NodeStatus.UNLOCKED : NodeStatus.LOCKED,
            generatedQuestions[idCounter - 1]
          ));
          idCounter++;
        }
      }

      const newState: GameState = {
        ...gameState,
        screen: 'GAME',
        nodes: initialNodes,
        hearts: settings.suddenDeath ? 1 : INITIAL_HEARTS,
        score: 0,
        currentNodeId: null,
        history: [],
        startTime: Date.now(),
        timeLeft: settings.timeLimit * 60,
        gameOverReason: null,
        settings
      };

      setGameState(newState);
      setActiveTab('practice'); // Switch to practice tab to show the game
      if (user) await gameStorage.saveGameState(user.username, newState);

    } catch (error) {
      alert("Không thể kết nối với AI. Vui lòng kiểm tra lại.");
      setGameState(prev => ({ ...prev, screen: 'WELCOME' }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResumeGame = async () => {
    if (user) {
      const saved = await gameStorage.loadGameState(user.username);
      if (saved) {
        setGameState(saved);
        setActiveTab('practice');
      }
    }
  };

  const handleNodeClick = (nodeId: number) => {
    sound.playMove();
    setGameState(prev => ({ ...prev, currentNodeId: nodeId }));
  };

  const handleAnswer = async (isCorrect: boolean, selectedOptionIndex?: number | null) => {
    const currentNodeId = gameState.currentNodeId;
    if (currentNodeId === null) return;

    const currentNode = gameState.nodes.find(n => n.id === currentNodeId);
    if (!currentNode) return;

    if (user) {
      questManager.incrementProgress(user.username, 'questions', 1);
    }

    let updatedNodes = [...gameState.nodes];
    let newScreen = gameState.screen;
    let newScore = gameState.score;
    let newHearts = gameState.hearts;
    let failReason: GameOverReason = null;
    let newHistory = [...gameState.history];

    if (isCorrect) {
      const pointsEarned = 100;
      newScore += pointsEarned; 
      
      // Track history
      newHistory.push(currentNodeId);

      // Update User Stats for correct answer, score and streak
      if (user) {
        await statsStorage.updateStats(user.username, { 
          questionsAnswered: 1,
          totalScore: pointsEarned,
          nodeCompleted: true,
          subject: gameState.settings.subject
        });
      }

      updatedNodes = updatedNodes.map(node => 
        node.id === currentNodeId ? { ...node, status: NodeStatus.COMPLETED } : node
      );

      if (currentNode.type === NodeType.BOSS) {
        newScreen = 'VICTORY';
        sound.playWin();
      } else {
        updatedNodes = updatedNodes.map(node => {
          if (node.status === NodeStatus.LOCKED) {
            const dx = Math.abs(node.col - currentNode.col);
            const dy = Math.abs(node.row - currentNode.row);
            if ((dx === 1 && dy === 0) || (dx === 0 && dy === 1)) {
               return { ...node, status: NodeStatus.UNLOCKED };
            }
          }
          return node;
        });
      }
    } else {
      if (gameState.settings.suddenDeath) {
        newHearts = 0;
        newScreen = 'GAME_OVER';
        failReason = 'SUDDEN_DEATH';
      } else {
        newHearts -= 1;
        if (newHearts <= 0) {
          newScreen = 'GAME_OVER';
          failReason = 'NO_HEARTS';
        }
      }

      // Phân tích lỗi tư duy bằng Gemini Pro dưới nền
      if (user && currentNode?.question && selectedOptionIndex !== undefined && selectedOptionIndex !== null) {
        const q = currentNode.question;
        const optText = q.options[selectedOptionIndex];
        const correctOptText = q.options[q.correctAnswerIndex];

        analyzeThinkingError(q.text, q.options, selectedOptionIndex, q.correctAnswerIndex, q.explanation)
          .then(analysis => {
            if (analysis) {
              statsStorage.recordThinkingError(
                user.username,
                analysis.errorType,
                analysis.shortAnalysis,
                analysis.suggestion,
                q.text,
                optText,
                correctOptText
              ).catch(err => console.error("Lỗi khi lưu lỗi tư duy:", err));
            }
          })
          .catch(err => console.error("Lỗi khi phân tích lỗi tư duy từ Gemini:", err));
      }
    }

    // Update high score if game ended
    if ((newScreen === 'VICTORY' || newScreen === 'GAME_OVER') && user) {
      await statsStorage.updateStats(user.username, { highScore: newScore });
    }

    const newState: GameState = {
      ...gameState,
      nodes: updatedNodes,
      currentNodeId: null,
      score: newScore,
      hearts: newHearts,
      screen: newScreen,
      history: newHistory,
      gameOverReason: failReason
    };

    setGameState(newState);
    if (user) await gameStorage.saveGameState(user.username, newState);
  };

  const handleRestart = async () => {
    if (user) await gameStorage.clearGameState(user.username);
    
    // Release nodes to pool
    releaseMazeNodes(gameState.nodes);

    setGameState(prev => ({
      ...prev,
      screen: 'WELCOME',
      nodes: [],
      currentNodeId: null,
      history: [],
      gameOverReason: null
    }));
    setActiveTab('practice'); // Keep on practice tab to show setup
  };
  
  const handleExit = async () => {
     if (user && gameState.screen === 'GAME') {
       await gameStorage.saveGameState(user.username, gameState);
     }

     setGameState(prev => ({
       ...prev,
       screen: 'WELCOME',
       currentNodeId: null,
       gameOverReason: null
     }));
     setActiveTab('dashboard');
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // INITIALIZATION LOADING SCREEN
  if (isCheckingSession) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent blur-3xl"></div>
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative z-10 flex flex-col items-center"
        >
          <div className="w-24 h-24 rounded-3xl bg-primary/10 flex items-center justify-center mb-8 relative">
            <div className="absolute inset-0 rounded-3xl border-2 border-primary/20 animate-ping"></div>
            <Brain size={48} className="text-primary" />
          </div>
          <h2 className="text-2xl font-display font-bold text-white mb-2 tracking-tight">24hoc AI</h2>
          <div className="flex items-center gap-2 text-white/40 text-sm font-black uppercase tracking-[0.3em]">
            <Loader2 size={16} className="animate-spin" />
            Đang đồng bộ tri thức
          </div>
        </motion.div>
      </div>
    );
  }

  if (gameState.screen === 'LANDING') {
    return <LandingPage onStart={handleEnterAuth} isDark={isDark} toggleTheme={toggleTheme} />;
  }

  if (!user || gameState.screen === 'AUTH') {
    return <AuthScreen onLogin={handleLogin} />;
  }

  // Helper to check if we are viewing the game
  const isGameVisible = activeTab === 'practice' && (gameState.screen === 'GAME' || gameState.screen === 'VICTORY' || gameState.screen === 'GAME_OVER');

  // HEADER CONTENT
  const renderHeader = () => {
    if (isGameVisible) {
        // Game Mode Header
        return (
          <header className="h-16 md:h-20 bg-surface/80 backdrop-blur-xl border-b border-border flex items-center justify-between px-4 md:px-10 shrink-0 z-20 shadow-sm">
             <div className="flex items-center gap-3 md:gap-6">
                <button 
                   onClick={() => setShowMobileOverview(true)}
                   className="md:hidden p-2 text-muted hover:text-primary hover:bg-background rounded-xl transition-colors"
                >
                   <Info size={20} />
                </button>
    
                <div className="hidden md:flex items-center gap-3 text-sm font-black uppercase tracking-widest text-muted bg-zinc-100 dark:bg-zinc-800 px-4 py-2 rounded-2xl border border-border">
                   <BookOpen size={16} className="text-primary"/>
                   <span className="text-text">{gameState.settings.subject} • Lớp {gameState.settings.grade}</span>
                </div>
                <button 
                  onClick={handleExit}
                  className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted hover:text-text hover:bg-zinc-100 dark:hover:bg-zinc-800 px-3 md:px-4 py-2 rounded-2xl transition-all"
                >
                  <Home size={16}/>
                  <span className="hidden sm:inline">Thoát</span>
                </button>
             </div>
    
             <div className="flex items-center gap-2 md:gap-8">
                <div className="flex items-center gap-2 md:gap-3 bg-zinc-100 dark:bg-zinc-800 px-3 md:px-4 py-1.5 md:py-2 rounded-2xl border border-border">
                   <Timer size={16} className={gameState.timeLeft < 60 ? 'text-danger animate-pulse' : 'text-primary'}/>
                   <span className={`font-mono font-black text-lg md:text-xl ${gameState.timeLeft < 60 ? 'text-danger' : 'text-text'} w-12 md:w-14 text-center`}>
                     {formatTime(gameState.timeLeft)}
                   </span>
                </div>
    
                <div className="flex items-center gap-1">
                   {Array.from({ length: INITIAL_HEARTS }).map((_, i) => (
                     <Heart 
                       key={i} 
                       className={`transition-all duration-500 ${i < gameState.hearts ? 'fill-danger text-danger scale-100 md:scale-110' : 'text-zinc-200 dark:text-zinc-800 fill-zinc-200 dark:fill-zinc-800 scale-75 md:scale-90'} md:w-[22px] md:h-[22px]`} 
                       size={18} 
                     />
                   ))}
                </div>
                
                <div className="flex items-center gap-2 md:gap-3 bg-yellow-500/10 px-3 md:px-5 py-1.5 md:py-2 rounded-2xl border border-yellow-500/20 shadow-sm">
                   <Trophy size={16} className="text-yellow-600 md:w-[18px] md:h-[18px]"/>
                   <span className="font-display font-black text-lg md:text-xl text-yellow-700">{gameState.score}</span>
                </div>
             </div>
          </header>
        );
    } else {
        // Standard View Header (Simplified - moved logic to Sidebar)
        // We only show a simple header on mobile if needed, but Sidebar handles it
        return null;
    }
  };

  // CURRENT NODE Logic for Modal
  const currentNode = gameState.nodes.find(n => n.id === gameState.currentNodeId);
  const currentQuestion = currentNode?.question;
  const isReviewMode = currentNode?.status === NodeStatus.COMPLETED;

  // MAIN CONTENT RENDERER
  const renderContent = () => {
    if (gameState.screen === 'LOADING') {
        return (
          <div className="flex-1 flex flex-col items-center justify-center text-text relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent blur-3xl"></div>
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="relative z-10 flex flex-col items-center max-w-md px-6 text-center"
            >
              <div className="w-20 h-20 rounded-[2rem] bg-primary/10 flex items-center justify-center mb-10 relative">
                <Sparkles size={40} className="text-primary animate-pulse" />
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 rounded-[2rem] border-2 border-dashed border-primary/30"
                ></motion.div>
              </div>
              <h2 className="text-3xl font-display font-bold mb-4 tracking-tight">Khởi tạo Mê cung</h2>
              <p className="text-muted text-lg font-medium leading-relaxed mb-12">
                {loadingText}
              </p>
              <div className="w-64 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden mb-4">
                <motion.div 
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 3, ease: "easeInOut" }}
                  className="h-full bg-gradient-to-r from-primary to-secondary"
                ></motion.div>
              </div>
              <div className="text-[10px] font-black text-muted uppercase tracking-[0.4em]">
                AI Engine v2.5 • Neural Processing
              </div>
            </motion.div>
          </div>
        );
    }

    if (isGameVisible) {
        const completedCount = gameState.nodes.filter(n => n.status === NodeStatus.COMPLETED).length;
        const lastCompletedNodeId = gameState.history.length > 0 ? gameState.history[gameState.history.length - 1] : null;

        return (
            <div className="flex flex-1 overflow-hidden h-full relative">
                <main className="flex-1 relative bg-background flex flex-col min-w-0">
                    {(gameState.screen === 'VICTORY' || gameState.screen === 'GAME_OVER') ? (
                    <ResultScreen 
                        type={gameState.screen}
                        score={gameState.score}
                        reason={gameState.gameOverReason}
                        onRetry={handleRestart}
                        onExit={handleExit}
                    />
                    ) : (
                    <GameMap 
                        nodes={gameState.nodes} 
                        onNodeClick={handleNodeClick}
                        rows={gameState.settings.gridSize}
                        cols={gameState.settings.gridSize}
                        />
                    )}
                </main>

                <aside className="hidden lg:block w-80 bg-surface border-l border-border z-10 shadow-xl overflow-auto">
                    <GameOverview 
                        nodes={gameState.nodes}
                        totalQuestions={gameState.nodes.length}
                        completedCount={completedCount}
                        lastCompletedNodeId={lastCompletedNodeId}
                        onNodeClick={handleNodeClick}
                    />
                </aside>

                {showMobileOverview && (
                    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm md:hidden flex justify-end">
                        <div className="w-4/5 max-w-sm h-full bg-surface shadow-2xl animate-in slide-in-from-right duration-300">
                            <GameOverview 
                                nodes={gameState.nodes}
                                totalQuestions={gameState.nodes.length}
                                completedCount={completedCount}
                                onClose={() => setShowMobileOverview(false)}
                                lastCompletedNodeId={lastCompletedNodeId}
                                onNodeClick={(id) => {
                                    handleNodeClick(id);
                                    setShowMobileOverview(false);
                                }}
                            />
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // Standard Dashboard View with Sidebar
    return (
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-background">
            <AppSidebar 
                activeTab={activeTab}
                onTabChange={setActiveTab}
                onLogout={handleLogout}
                onProfileClick={() => setShowProfile(true)}
                user={user}
                isCollapsed={isSidebarCollapsed}
                setIsCollapsed={setIsSidebarCollapsed}
                isMobileOpen={isMobileMenuOpen}
                setIsMobileOpen={setIsMobileMenuOpen}
                soundMuted={soundMuted}
                onToggleSound={handleToggleSound}
            />
            
            <main className={`flex-1 overflow-y-auto transition-all duration-300 ${isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
                {/* Header for Desktop Dashboard (Theme Toggle etc) */}
                <div className="hidden lg:flex h-20 items-center justify-end px-10 border-b border-border bg-surface/50 backdrop-blur-md sticky top-0 z-20">
                     <div className="flex items-center gap-4">
                        <button
                          onClick={handleToggleSound}
                          className="w-10 h-10 flex items-center justify-center text-muted hover:text-primary hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all rounded-xl"
                          title={soundMuted ? "Bật âm thanh" : "Tắt âm thanh"}
                        >
                          {soundMuted ? <VolumeX size={20} /> : <Volume2 size={20} className="text-primary" />}
                        </button>
                        <button
                          onClick={toggleTheme}
                          className="w-10 h-10 flex items-center justify-center text-muted hover:text-primary hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all rounded-xl"
                        >
                          {isDark ? <Sun size={20} /> : <Moon size={20} />}
                        </button>
                        <div className="w-px h-6 bg-border mx-2" />
                        <div className="flex items-center gap-3">
                           <div className="text-right">
                              <p className="text-[10px] font-black text-muted uppercase tracking-widest leading-none mb-1">Cấp độ</p>
                              <p className="font-bold text-sm text-primary">Kinh nghiệm 2,450</p>
                           </div>
                           <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <Trophy size={18} className="text-primary" />
                           </div>
                        </div>
                     </div>
                </div>

                <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                      >
                        <WelcomeScreen 
                            user={user} 
                            activeTab={activeTab}
                            onStart={handleStartGame} 
                            onResume={handleResumeGame}
                            hasSavedGame={hasSavedGame}
                            onTabChange={setActiveTab}
                        />
                      </motion.div>
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
  };

  return (
    <div className="h-screen flex flex-col bg-background text-text overflow-hidden">
      
      {renderHeader()}

      {/* Content Container */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {renderContent()}
      </div>

      {gameState.currentNodeId && currentQuestion && (
        <QuestionModal 
          question={currentQuestion}
          onAnswer={handleAnswer}
          onClose={() => setGameState(prev => ({ ...prev, currentNodeId: null }))}
          isReview={isReviewMode}
          nodeType={currentNode?.type}
        />
      )}

      {showProfile && user && (
        <ProfileModal user={user} onClose={() => setShowProfile(false)} />
      )}

      <AIChatFloating />
      <Toaster position="top-right" richColors closeButton />
    </div>
  );
};

export default App;
