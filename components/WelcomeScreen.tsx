
import React, { useState, useEffect, useRef } from 'react';
import { Grade, Subject, GameSettings, User, UserStats, ChatMessage, MasteryData, Difficulty, Curriculum } from '../types';
import { Clock, Grid3X3, Zap, Play, Trophy, Star, Crown, Sparkles, Target, Brain, ShoppingBag, BookOpen, FileText, ArrowRight, Coins, ExternalLink, Loader2, ChevronRight, Search, Book, Video, ArrowLeft, List, Globe, MessageCircle, Send, X, Bot, Volume2, Shield, Network, Settings, Code2, GraduationCap, Flame, Heart, Share2, UserCheck, MessageSquare, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { statsStorage, getInventory, updateInventory } from '../utils/storage';
import { questManager, DAILY_QUESTS } from '../utils/quests';
import { sound } from '../utils/audio';
import { createLessonChatSession, generateSpeech, Lesson, generateStudyGuide, generateLessonDetails, StudyGuide, generateMindMap } from '../services/gemini';
import { Chat } from "@google/genai";
import { toast } from 'sonner';
import Leaderboard from './Leaderboard';
import ActivityFeed from './ActivityFeed';
import { History as HistoryIcon } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export type TabType = 'dashboard' | 'practice' | 'documents' | 'shop' | 'leaderboard';

interface WelcomeScreenProps {
  user: User;
  activeTab: TabType;
  onStart: (settings: GameSettings) => void;
  onResume?: () => void;
  hasSavedGame?: boolean;
  onTabChange: (tab: TabType) => void; 
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ user, activeTab, onStart, onResume, hasSavedGame, onTabChange }) => {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [inventory, setInventory] = useState({ coins: 0, items: {} as any });
  const [showStreakCelebration, setShowStreakCelebration] = useState(false);
  const prevStreakRef = useRef<number | null>(null);

  // Quest State & Actions
  const [questProgress, setQuestProgress] = useState(() => questManager.getProgress(user.username));

  const refreshQuests = () => {
    setQuestProgress(questManager.getProgress(user.username));
  };

  const handleClaimQuest = async (questId: string) => {
    const reward = await questManager.claimQuestReward(user.username, questId);
    if (reward) {
      sound.playCorrect();
      toast.success(`🎉 Chúc mừng! Bạn đã nhận ${reward} xu thưởng cho nhiệm vụ hàng ngày!`);
      refreshQuests();
      const userInventory = await getInventory(user.username);
      setInventory(userInventory);
    } else {
      toast.error("Không thể nhận thưởng hoặc bạn chưa hoàn tất điều kiện nhiệm vụ.");
    }
  };

  const handleClaimAttendance = async (dayIdx: number) => {
    const result = await questManager.claimAttendanceDay(user.username, dayIdx);
    if (result) {
      sound.playWin();
      let msg = `🌟 Điểm danh thành công! Nhận ${result.coins} xu`;
      if (result.item) {
        let itemName = result.item === 'SHIELD' ? 'Khiên Bảo Vệ 🛡️' : 'Gợi ý AI 💡';
        msg += ` và nhận thêm 1 x ${itemName}!`;
      }
      toast.success(msg);
      refreshQuests();
      const userInventory = await getInventory(user.username);
      setInventory(userInventory);
    } else {
      toast.error("Điểm danh thất bại hoặc hôm nay bạn đã điểm danh rồi!");
    }
  };
  
  // Practice State
  const [grade, setGrade] = useState<Grade>(Grade.NINE);
  const [subject, setSubject] = useState<Subject>(Subject.MATH_ALG);
  const [curriculum, setCurriculum] = useState<Curriculum>(Curriculum.KNTT);
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.MEDIUM);
  const [gridSize, setGridSize] = useState(3);
  const [timeLimit, setTimeLimit] = useState(15);
  const [suddenDeath, setSuddenDeath] = useState(false);

  // Documents State
  const [selectedDocSubject, setSelectedDocSubject] = useState<Subject | null>(null);
  const [docGrade, setDocGrade] = useState<Grade>(Grade.NINE);
  const [docSemester, setDocSemester] = useState<1 | 2>(1);
  const [studyGuide, setStudyGuide] = useState<StudyGuide | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [isDocLoading, setIsDocLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Lesson[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Focus Mind Map & Flashcard States
  const [isMindMapOpen, setIsMindMapOpen] = useState(false);
  const [mindMapNodes, setMindMapNodes] = useState<any[] | null>(null);
  const [isMindMapLoading, setIsMindMapLoading] = useState(false);
  const [isFlashcardsOpen, setIsFlashcardsOpen] = useState(false);
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [isCardFlipped, setIsCardFlipped] = useState(false);

  // Chat & TTS State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [showQuizResults, setShowQuizResults] = useState(false);

  // Lesson publisher & stories/sharing states
  const [stories, setStories] = useState<any[]>([]);
  const [newStoryText, setNewStoryText] = useState('');
  const [newStoryTag, setNewStoryTag] = useState('Kinh nghiệm 💡');

  const getInstructorForSubject = (subjectStr: Subject | string | null) => {
    const defaultInstructor = {
      name: 'Ban Học Thuật MazeMind',
      role: 'Đội ngũ Giám định & Sáng tạo học liệu',
      bio: 'Sách bài tập và kiến thức nền tảng đã được tự động tuyển chọn kỹ càng để rèn luyện thói quen tư duy đột phá.',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
      color: 'from-purple-500 to-indigo-500'
    };

    if (!subjectStr) return defaultInstructor;

    switch (subjectStr) {
      case Subject.MATH_ALG:
      case Subject.MATH_GEO:
        return {
          name: 'Thầy Nguyễn Minh Trí',
          role: 'Tiến sĩ Đại số & Hình học tương tác',
          bio: 'Nguyên giảng viên Chuyên Toán. Thầy luôn cấu trúc bài học thành các chương trình khúc chiết giúp bứt phá tư duy gốc rễ.',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
          color: 'from-blue-500 to-indigo-600'
        };
      case Subject.PHYS:
        return {
          name: 'Thầy Vũ Anh Tú',
          role: 'Thạc sĩ Vật lý Động lực học & Cơ chất',
          bio: 'Thầy luôn kết hợp lý thuyết khó bằng sơ đồ trực quan và ứng dụng thực tiễn của các định luật cơ học vũ trụ.',
          avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
          color: 'from-indigo-500 to-blue-600'
        };
      case Subject.CHEM:
        return {
          name: 'Cô Lê Mai Thảo',
          role: 'Giảng viên Hoá học Phản ứng hữu cơ',
          bio: 'Phục dựng liên tiếp các mindmap phản ứng hoá học hữu cơ phức tạp thành dải biểu đồ cực kỳ sống động, dễ ghi nhớ.',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
          color: 'from-pink-500 to-purple-600'
        };
      case Subject.BIO:
        return {
          name: 'Cô Dương Thuỳ Linh',
          role: 'Nghiên cứu sinh Thạc sĩ Di truyền học',
          bio: 'Đam mê khám phá cấu trúc mã ADN và thế giới tự nhiên kỳ bí. Giúp các em tiếp cận Sinh học một cách trực quan, vui nhộn.',
          avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80',
          color: 'from-emerald-500 to-teal-600'
        };
      case Subject.ENG:
        return {
          name: 'Cô Nguyễn Mai Lan',
          role: 'Cựu Thủ khoa Ngôn ngữ Anh, IELTS 8.5',
          bio: 'Nhà sư phạm tâm huyết mang đến phương pháp tích luỹ từ vựng đỉnh cao, bẻ khoá ngữ pháp khó thông qua tư duy thông ngữ.',
          avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&q=80',
          color: 'from-orange-500 to-amber-600'
        };
      case Subject.LIT:
        return {
          name: 'Cô Phan Minh Hằng',
          role: 'Thạc sĩ Lý luận Văn học & Cảm thụ',
          bio: 'Người thổi hồn vào từng áng văn trung đại và hiện đại dạt dào cảm xúc giúp mở rộng năng lực thẩm văn bản sâu sắc rộng mở.',
          avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
          color: 'from-rose-500 to-red-600'
        };
      case Subject.HIST:
      case Subject.GEO:
        return {
          name: 'Thầy Trịnh Gia Bảo',
          role: 'Thạc sĩ Sử-Địa đại cương & Bản đồ học',
          bio: 'Hào hùng liên kết các mốc sử vàng dân tộc kết hợp ranh giới tự nhiên để thăng tiến động lực rèn luyện cho thế hệ trẻ.',
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80',
          color: 'from-yellow-600 to-amber-700'
        };
      default:
        return defaultInstructor;
    }
  };

  const getInitialStoriesForLesson = (lessonTitle: string) => {
    return [
      {
        id: 'story-1',
        username: 'Trợ lý Lập trình Google Gemini AI 🤖',
        avatar: 'G3',
        avatarBg: 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white',
        tag: 'Khởi nguồn Ý tưởng 💡',
        content: `Ý tưởng kiến tạo MazeMind nảy sinh từ khát vọng biến các bài học khô khan lớp 9-12 thành một cuộc phiêu lưu nhập vai cuốn hút (Gamified Learning). Chúng tôi đã cùng bắt tay xây dựng khung ứng dụng bằng TypeScript & React, đồng bộ giao diện theo chuẩn hiện đại tối giản với Tailwind CSS. Điểm nhấn đỉnh cao là cơ chế phân tích bài viết và chẩn đoán thói quen lỗi tư duy học tập trực tiếp kết nối với dòng chảy xử lý thông tin siêu việt của mô hình Gemini v3, giúp tạo bài học mới linh động trong tích tắc!`,
        createdAt: 'Hành trình kiến lập',
        likes: 124,
        liked: false,
        isCustom: false
      },
      {
        id: 'story-2',
        username: 'Đội ngũ Lập trình (MazeMind Team) 🚀',
        avatar: 'MM',
        avatarBg: 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white',
        tag: 'Hành trình Code 💻',
        content: `Chào các bạn học sinh! Để hoàn thiện một sản phẩm tinh tế như MazeMind ngày hôm nay, chúng tôi đã đẩy qua hơn 7 phiên bản cập nhật lớn: nâng cấp thuật toán sinh lưới mê cung thông minh, tối ưu trải nghiệm âm chuẩn Voice TTS bằng tiếng Việt truyền cảm, và bứt phá bằng hồ sơ chẩn đoán học tập trực quan Recharts (XP Curve, Mastery Index). Mê cung tri thức này là sự kết tinh của tư duy đột phá và nỗ lực tối ưu hóa trải nghiệm không ngừng nghỉ!`,
        createdAt: 'Đồng hành phát triển',
        likes: 98,
        liked: false,
        isCustom: false
      }
    ];
  };

  useEffect(() => {
    if (selectedLesson) {
      const key = `maze_lesson_stories_${selectedLesson.title}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        try {
          setStories(JSON.parse(saved));
        } catch (e) {
          const initial = getInitialStoriesForLesson(selectedLesson.title);
          setStories(initial);
          localStorage.setItem(key, JSON.stringify(initial));
        }
      } else {
        const initial = getInitialStoriesForLesson(selectedLesson.title);
        setStories(initial);
        localStorage.setItem(key, JSON.stringify(initial));
      }
    }
  }, [selectedLesson?.title]);

  const handlePublishStory = () => {
    if (!newStoryText.trim()) {
      toast.error('Vui lòng nhập nội dung câu chuyện học tập trước khi đăng tải nhé.');
      return;
    }
    
    if (!selectedLesson) return;

    const key = `maze_lesson_stories_${selectedLesson.title}`;
    const initials = user.displayName 
      ? user.displayName.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase() 
      : (user.username || 'HS').substring(0, 2).toUpperCase();
    
    const userStory = {
      id: `story-${Date.now()}`,
      username: `${user.displayName || user.username} (Tôi)`,
      avatar: initials,
      avatarBg: 'bg-primary text-primary-text ring-2 ring-primary/40',
      tag: newStoryTag,
      content: newStoryText.trim(),
      createdAt: 'Vừa xong',
      likes: 0,
      liked: false,
      isCustom: true
    };

    const updatedStories = [userStory, ...stories];
    setStories(updatedStories);
    localStorage.setItem(key, JSON.stringify(updatedStories));
    
    setNewStoryText('');
    sound.playCorrect();
    toast.success('🎉 Đã chia sẻ câu chuyện học tập của bạn thành công! Cảm ơn bạn đóng góp chia sẻ.');
    
    questManager.incrementProgress(user.username, 'lessons');
    refreshQuests();
  };

  const handleDeleteStory = (storyId: string) => {
    if (!selectedLesson) return;
    const key = `maze_lesson_stories_${selectedLesson.title}`;
    const updated = stories.filter(s => s.id !== storyId);
    setStories(updated);
    localStorage.setItem(key, JSON.stringify(updated));
    sound.playClick();
    toast.success('Đã xoá câu chuyện chia sẻ của bạn.');
  };

  const handleLikeStory = (storyId: string) => {
    if (!selectedLesson) return;
    const key = `maze_lesson_stories_${selectedLesson.title}`;
    
    const updated = stories.map(s => {
      if (s.id === storyId) {
        const liked = !s.liked;
        return {
          ...s,
          liked: liked,
          likes: liked ? s.likes + 1 : s.likes - 1
        };
      }
      return s;
    });

    setStories(updated);
    localStorage.setItem(key, JSON.stringify(updated));
    sound.playClick();
  };

  useEffect(() => {
    const loadData = async () => {
        const userStats = await statsStorage.getStats(user.username);
        if (prevStreakRef.current === null) {
          prevStreakRef.current = userStats.streak || 0;
        }
        setStats(userStats);
        const userInventory = await getInventory(user.username);
        setInventory(userInventory);
        refreshQuests();
    };
    loadData();
  }, [user.username, activeTab]);

  useEffect(() => {
    if (stats) {
      const currentStreak = stats.streak || 0;
      if (prevStreakRef.current !== null && currentStreak > prevStreakRef.current) {
        setShowStreakCelebration(true);
        toast.success(`🔥 Bạn đã đạt chuỗi ${currentStreak} ngày học liên tiếp! Thật xuất sắc!`, {
          duration: 4000
        });
        
        const timer = setTimeout(() => {
          setShowStreakCelebration(false);
        }, 4000);
        return () => clearTimeout(timer);
      }
      prevStreakRef.current = currentStreak;
    }
  }, [stats?.streak]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleStart = () => {
    onStart({ grade, subject, gridSize, timeLimit, suddenDeath, difficulty });
  };

  const handleBuyItem = async (itemId: string, price: number) => {
    if (inventory.coins >= price) {
        const newInv = { ...inventory, coins: inventory.coins - price };
        newInv.items[itemId] = (newInv.items[itemId] || 0) + 1;
        await updateInventory(user.username, newInv);
        setInventory(newInv);
        questManager.incrementProgress(user.username, 'purchases', 1);
        refreshQuests();
        toast.success("Mua vật phẩm thành công!");
    } else {
        toast.error("Bạn không đủ xu để mua vật phẩm này!");
    }
  };

  const handleLoadGuide = async (subj: Subject) => {
    setSelectedDocSubject(subj);
    setIsDocLoading(true);
    // UI feedback for high-accuracy optimization
    setLoadingText(`AI đang tối ưu hóa độ chính xác bài học 100% theo bộ sách ${curriculum} lớp ${docGrade} học kỳ ${docSemester}...`);
    const guide = await generateStudyGuide(docGrade, subj, docSemester, curriculum);
    setStudyGuide(guide);
    setIsDocLoading(false);
  };

  const handleLoadLesson = async (lessonTitle: string) => {
    setIsDocLoading(true);
    setLoadingText(`AI đang kiểm chứng kiến thức và biên soạn bài giảng chuẩn xác theo bộ sách ${curriculum} lớp ${docGrade}...`);
    const lesson = await generateLessonDetails(docGrade, selectedDocSubject!, lessonTitle, curriculum);
    setSelectedLesson(lesson);
    setQuizAnswers({});
    setShowQuizResults(false);
    
    // Reset secondary feature states
    setIsMindMapOpen(false);
    setMindMapNodes(null);
    setIsFlashcardsOpen(false);
    setActiveCardIndex(0);
    setIsCardFlipped(false);

    setIsDocLoading(false);
    questManager.incrementProgress(user.username, 'lessons', 1);
    refreshQuests();
  };

  const handleToggleMindMap = async () => {
    if (isMindMapOpen) {
      setIsMindMapOpen(false);
      return;
    }
    setIsMindMapOpen(true);
    setIsFlashcardsOpen(false); // Close flashcards if open
    if (!mindMapNodes && selectedLesson && selectedDocSubject) {
      setIsMindMapLoading(true);
      const nodes = await generateMindMap(docGrade, selectedDocSubject, selectedLesson.title, curriculum);
      setMindMapNodes(nodes);
      setIsMindMapLoading(false);
    }
  };

  const handleTTS = async () => {
    if (isSpeaking) {
      audioSourceRef.current?.stop();
      setIsSpeaking(false);
      return;
    }
    if (!selectedLesson) return;
    
    setIsSpeaking(true);
    const textToRead = selectedLesson.sections?.map(s => s.content).join('. ') || selectedLesson.content;
    const source = await generateSpeech(textToRead);
    if (source) {
      audioSourceRef.current = source;
      source.onended = () => setIsSpeaking(false);
      source.start();
    } else {
      setIsSpeaking(false);
    }
  };

  const openChat = () => {
    if (!selectedLesson || !selectedDocSubject) return;
    const session = createLessonChatSession(docGrade, selectedDocSubject, selectedLesson.title, selectedLesson.content);
    setChatSession(session);
    setChatMessages([]);
  };

  const handleSendChat = async () => {
    if (!chatInput.trim() || !chatSession) return;

    const userMsg: ChatMessage = { role: 'user', text: chatInput };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const response = await chatSession.sendMessage({ message: userMsg.text });
      const botMsg: ChatMessage = { role: 'model', text: response.text || "Xin lỗi, tôi gặp chút trục trặc." };
      setChatMessages(prev => [...prev, botMsg]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleQuizAnswer = (qIdx: number, aIdx: number) => {
    if (showQuizResults) return;
    setQuizAnswers(prev => ({ ...prev, [qIdx]: aIdx }));
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const results = await fetch(`/api/lessons/search?q=${encodeURIComponent(query)}`).then(r => r.json());
      setSearchResults(results);
    } catch (e) {
      console.error("Search failed", e);
    } finally {
      setIsSearching(false);
    }
  };

  const submitQuiz = () => {
    setShowQuizResults(true);
  };

  const renderMasteryRadar = (mastery: MasteryData[]) => {
    if (!mastery || mastery.length === 0) return null;
    const points = mastery.map((m, i) => {
      const angle = (i / mastery.length) * 2 * Math.PI;
      const r = (m.score / 100) * 40;
      return `${50 + r * Math.cos(angle)},${50 + r * Math.sin(angle)}`;
    }).join(' ');

    return (
      <div className="w-full h-48 flex items-center justify-center bg-surface border border-border rounded-2xl relative overflow-hidden">
        <svg viewBox="0 0 100 100" className="w-32 h-32 transform -rotate-90">
          <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-border" />
          <circle cx="50" cy="50" r="20" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-border" />
          <polygon points={points} fill="rgba(79, 70, 229, 0.3)" stroke="var(--color-primary)" strokeWidth="1" />
        </svg>
        <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none">
           <div className="flex justify-between text-[10px] font-bold text-muted uppercase">
             <span>Toán</span>
             <span>Văn</span>
           </div>
           <div className="flex justify-between text-[10px] font-bold text-muted uppercase">
             <span>Anh</span>
             <span>Lý</span>
           </div>
        </div>
      </div>
    );
  };

  const renderSubjectMasteryBars = (mastery: MasteryData[]) => {
    const getSubjectScore = (subjName: string): number => {
      const match = mastery.find(m => m.subject === subjName);
      return match ? match.score : 0;
    };

    const mathScore1 = getSubjectScore(Subject.MATH_ALG);
    const mathScore2 = getSubjectScore(Subject.MATH_GEO);
    const mathScore = Math.round((mathScore1 + mathScore2) / 2) || 15;
    const litScore = getSubjectScore(Subject.LIT);
    const engScore = getSubjectScore(Subject.ENG);
    
    // Science index score combination: Phys/Chem/Bio average
    const physScore = getSubjectScore(Subject.PHYS);
    const chemScore = getSubjectScore(Subject.CHEM);
    const bioScore = getSubjectScore(Subject.BIO);
    const scienceScore = Math.round((physScore + chemScore + bioScore) / 3) || 15;

    const subjectsToDisplay = [
      { name: 'Toán học', icon: '📐', score: mathScore, color: 'bg-indigo-500' },
      { name: 'Ngữ văn', icon: '✍️', score: litScore, color: 'bg-emerald-500' },
      { name: 'Tiếng Anh', icon: '🇬🇧', score: engScore, color: 'bg-sky-500' },
      { name: 'Khoa học', icon: '🧪', score: scienceScore, color: 'bg-amber-500' }
    ];

    const getRankInfo = (score: number) => {
      if (score < 20) {
        return {
          rankName: 'Tập sự',
          nextRankName: 'Khám phá',
          thresholdMin: 0,
          thresholdMax: 20,
          progressPercent: Math.round((score / 20) * 100),
          nextPoints: 20 - score,
          badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
        };
      } else if (score < 40) {
        return {
          rankName: 'Khám phá',
          nextRankName: 'Thành thạo',
          thresholdMin: 20,
          thresholdMax: 40,
          progressPercent: Math.round(((score - 20) / (40 - 20)) * 100),
          nextPoints: 40 - score,
          badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
        };
      } else if (score < 70) {
        return {
          rankName: 'Thành thạo',
          nextRankName: 'Chuyên gia',
          thresholdMin: 40,
          thresholdMax: 70,
          progressPercent: Math.round(((score - 40) / (70 - 40)) * 100),
          nextPoints: 70 - score,
          badgeColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
        };
      } else if (score < 90) {
        return {
          rankName: 'Chuyên gia',
          nextRankName: 'Huyền thoại',
          thresholdMin: 70,
          thresholdMax: 90,
          progressPercent: Math.round(((score - 70) / (90 - 70)) * 100),
          nextPoints: 90 - score,
          badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
        };
      } else {
        return {
          rankName: 'Huyền thoại',
          nextRankName: null,
          thresholdMin: 90,
          thresholdMax: 100,
          progressPercent: 100,
          nextPoints: 0,
          badgeColor: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
        };
      }
    };

    return (
      <div className="space-y-4 font-sans text-left">
        {subjectsToDisplay.map((subj) => {
          const rank = getRankInfo(subj.score);
          return (
            <div key={subj.name} className="p-4 rounded-2xl bg-background/50 border border-border/60 hover:border-border transition-all">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{subj.icon}</span>
                  <span className="font-extrabold text-sm text-text">{subj.name}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black text-muted">{subj.score} XP</span>
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${rank.badgeColor}`}>
                    {rank.rankName}
                  </span>
                </div>
              </div>

              {/* Progress bar container */}
              <div className="relative pt-1">
                <div className="flex mb-1 items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">
                      Độ tiến trình: {rank.progressPercent}%
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-muted-foreground">
                      {rank.nextRankName ? `Cần ${rank.nextPoints} XP để đạt ${rank.nextRankName}` : 'Đạt cấp tối đa 👑'}
                    </span>
                  </div>
                </div>
                <div className="overflow-hidden h-2.5 text-xs flex rounded-full bg-border">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${rank.progressPercent}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${subj.color} rounded-full`}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };
  
  const renderThinkingErrorsSection = () => {
    const errors = stats?.thinkingErrors || [];
    if (errors.length === 0) {
      return (
        <div className="bg-surface border border-border rounded-[2.5rem] p-8 md:p-10 shadow-xl relative overflow-hidden text-left">
          <div className="absolute top-0 right-0 p-10 opacity-5">
            <Brain size={120} className="text-primary animate-pulse" />
          </div>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
              <Brain size={20} />
            </div>
            <div>
              <h3 className="font-bold text-lg">Chẩn đoán Lỗi tư duy</h3>
              <p className="text-xs text-muted">Phân tích thói quen làm bài cùng AI Gemini Pro</p>
            </div>
          </div>
          
          <div className="flex flex-col items-center justify-center text-center py-12 px-4 border border-dashed border-border/80 rounded-3xl bg-background/30 backdrop-blur-sm">
            <div className="w-16 h-16 rounded-full bg-pulse bg-purple-500/5 border border-purple-500/10 flex items-center justify-center text-purple-400 mb-4">
              <Sparkles size={28} className="animate-pulse" />
            </div>
            <h4 className="font-black text-sm uppercase tracking-wide mb-1">Chưa có dữ liệu chẩn đoán</h4>
            <p className="text-xs text-muted max-w-sm leading-relaxed">
              Hãy tham gia các thử thách mê cung và giải bài học. Khi bạn chọn sai phương án, AI Gemini Pro sẽ chẩn đoán thói quen và phân tích lỗi tư duy của bạn tại đây!
            </p>
          </div>
        </div>
      );
    }

    // Sắp xếp lỗi có tần suất từ cao xuống thấp
    const sortedErrors = [...errors].sort((a, b) => b.count - a.count);
    const totalCount = sortedErrors.reduce((sum, e) => sum + e.count, 0);

    const errorColors: Record<string, { bg: string, text: string, progress: string }> = {
      "Sai sót cẩu thả": { bg: "bg-amber-500/10", text: "text-amber-500", progress: "bg-amber-500" },
      "Hiểu sai khái niệm": { bg: "bg-red-500/10", text: "text-red-500", progress: "bg-red-500" },
      "Giả định sai lầm": { bg: "bg-blue-500/10", text: "text-blue-500", progress: "bg-blue-500" },
      "Sai số tính toán": { bg: "bg-emerald-500/10", text: "text-emerald-500", progress: "bg-emerald-500" },
      "Áp dụng sai quy tắc": { bg: "bg-orange-500/10", text: "text-orange-500", progress: "bg-orange-500" },
      "Lập luận thiếu logic": { bg: "bg-purple-500/10", text: "text-purple-500", progress: "bg-purple-500" }
    };

    const getColors = (type: string) => errorColors[type] || { bg: "bg-zinc-500/10", text: "text-zinc-500", progress: "bg-zinc-500" };

    return (
      <div className="bg-surface border border-border rounded-[2.5rem] p-8 md:p-10 shadow-xl relative overflow-hidden text-left">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Brain size={120} className="text-primary" />
        </div>
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
              <Brain size={20} />
            </div>
            <div>
              <h3 className="font-bold text-lg text-left">Chẩn đoán Lỗi tư duy</h3>
              <p className="text-xs text-muted text-left">Phân tích hành vi & kiểu sai lầm bằng AI Gemini Pro</p>
            </div>
          </div>
          <div className="sm:text-right flex items-center sm:block gap-2 justify-between">
            <span className="text-[10px] font-black text-muted uppercase tracking-widest block leading-none sm:mb-1">Tổng lỗi đã lưu</span>
            <span className="text-xl font-bold text-purple-500 leading-none">{totalCount}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Chart/List of Errors */}
          <div className="space-y-5">
            <h4 className="text-xs font-black text-muted uppercase tracking-[0.15em] mb-2 text-left">Mật độ các lỗi tư duy thường gặp</h4>
            <div className="space-y-4">
              {sortedErrors.map((error, idx) => {
                const colors = getColors(error.errorType);
                const percent = Math.round((error.count / totalCount) * 100);
                return (
                  <div key={idx} className="bg-background/40 hover:bg-background/80 p-4 rounded-2xl border border-border/60 transition-all duration-300">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${colors.progress}`} />
                        <span className="font-bold text-sm text-text">{error.errorType}</span>
                      </div>
                      <span className="font-mono text-xs text-muted font-bold">{error.count} lần ({percent}%)</span>
                    </div>
                    
                    {/* Progress Bar Container */}
                    <div className="h-2 w-full bg-border/40 rounded-full overflow-hidden mb-2">
                      <motion.div
                        className={`h-full ${colors.progress}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${percent}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                      />
                    </div>
                    {error.shortAnalysis && (
                      <p className="text-xs text-muted text-left italic">
                        "{error.shortAnalysis}"
                      </p>
                    )}
                    {error.suggestion && (
                      <div className="mt-2 text-[11px] text-primary/90 flex gap-1 items-start text-left bg-primary/5 p-2 rounded-lg border border-primary/10">
                        <span className="font-bold shrink-0">✨ Tip học tập:</span>
                        <span>{error.suggestion}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Interactive Case Detail analysis / Latest mistakes */}
          <div className="space-y-5 bg-background/30 p-6 rounded-[2rem] border border-border/80">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-xs font-black text-muted uppercase tracking-[0.15em] text-left">Ví dụ thực tế sai lầm của bạn</h4>
              <Sparkles size={16} className="text-purple-400 animate-pulse" />
            </div>

            <div className="max-h-[360px] overflow-y-auto pr-1 space-y-4 custom-scrollbar">
              {sortedErrors.flatMap(e => e.examples.map(ex => ({ ...ex, errorType: e.errorType }))).sort((a, b) => b.timestamp - a.timestamp).slice(0, 5).map((ex, exIdx) => {
                const colors = getColors(ex.errorType);
                return (
                  <div key={exIdx} className="bg-surface/95 border border-border/85 p-4 rounded-xl text-left space-y-3 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start gap-2">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${colors.bg} ${colors.text}`}>
                        {ex.errorType}
                      </span>
                      <span className="text-[10px] text-muted font-mono shrink-0">
                        {new Date(ex.timestamp).toLocaleDateString('vi-VN')}
                      </span>
                    </div>

                    <div>
                      <p className="text-[9px] font-black text-muted uppercase tracking-widest leading-none mb-1">CÂU HỎI SAI</p>
                      <p className="text-sm font-bold text-text line-clamp-2 leading-relaxed">{ex.questionText}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-red-500/5 border border-red-500/10 p-2 rounded-lg">
                        <span className="text-[9px] font-black text-red-500/80 uppercase tracking-widest block mb-0.5">Bạn chọn</span>
                        <span className="font-bold text-red-600 dark:text-red-400 truncate block">{ex.chosenOption}</span>
                      </div>
                      <div className="bg-success/5 border border-success/10 p-2 rounded-lg">
                        <span className="text-[9px] font-black text-success/80 uppercase tracking-widest block mb-0.5">Đáp án đúng</span>
                        <span className="font-bold text-success-text truncate block">{ex.correctOption}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-border/60 bg-muted/20 -mx-4 -mb-4 p-4 rounded-b-xl text-xs space-y-1">
                      <div className="font-black text-[9px] text-muted uppercase tracking-widest">PHÂN TÍCH LỖI SAI (GEMINI PRO)</div>
                      <p className="text-muted leading-relaxed italic">{ex.analysis}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderDashboard = () => {
    const level = stats ? Math.floor(stats.totalScore / 1000) + 1 : 1;
    const getRankTitle = (lvl: number) => {
      if (lvl >= 50) return { title: 'Đại Tôn Sư', color: 'text-yellow-500' };
      if (lvl >= 30) return { title: 'Bậc Thầy Tri Thức', color: 'text-red-500' };
      if (lvl >= 20) return { title: 'Nhà Thông Thái', color: 'text-purple-500' };
      if (lvl >= 10) return { title: 'Học Giả Ưu Tú', color: 'text-blue-400' };
      if (lvl >= 5) return { title: 'Nhà Thám Hiểm', color: 'text-emerald-400' };
      return { title: 'Học Viên Tập Sự', color: 'text-muted' };
    };
    const rank = getRankTitle(level);

    const chartData = React.useMemo(() => {
      const history = stats?.scoreHistory || [];
      if (history.length >= 2) {
        return history;
      }
      
      const total = stats?.totalScore || 0;
      const days = 7;
      const sData = [];
      const today = new Date();
      
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        const dateStr = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
        
        const progressFactor = (days - i) / days; 
        const baseVal = Math.floor(total * 0.4); 
        const val = i === 0 ? total : Math.floor(baseVal + (total - baseVal) * progressFactor * (0.85 + Math.random() * 0.15));
        
        sData.push({
          date: dateStr,
          score: val
        });
      }
      return sData;
    }, [stats?.scoreHistory, stats?.totalScore]);

     return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto"
      >
         {/* Celebration Overlay for Streak Increase */}
         <AnimatePresence>
           {showStreakCelebration && (
             <motion.div
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
             >
                <motion.div 
                  initial={{ scale: 0.8, y: 50 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.8, y: 50 }}
                  transition={{ type: "spring", damping: 15 }}
                  className="bg-surface border border-orange-500/30 p-8 md:p-12 rounded-[2.5rem] shadow-2xl flex flex-col items-center text-center max-w-sm relative overflow-hidden"
                >
                   {/* Glow effect */}
                   <div className="absolute inset-0 bg-radial-gradient from-orange-500/10 to-transparent pointer-events-none" />
                   
                   {/* Animated large flame */}
                   <motion.div 
                     animate={{ 
                       scale: [1, 1.2, 0.95, 1.1, 1],
                       rotate: [0, -8, 8, -3, 0]
                     }}
                     transition={{ repeat: Infinity, duration: 2, repeatType: "reverse" }}
                     className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white shadow-xl shadow-orange-500/30 mb-6"
                   >
                      <Flame size={48} className="fill-white" />
                   </motion.div>

                   <h3 className="text-3xl font-extrabold font-display text-text mb-2">CHUỖI NGÀY MỚI!</h3>
                   <h4 className="text-5xl font-black font-display text-orange-500 mb-4">🔥 {stats?.streak} ngày</h4>
                   <p className="text-muted font-medium text-sm leading-relaxed px-2">
                      Bạn đang duy trì ngọn lửa học tập rất tuyệt vời! Tiếp tục thực hiện thử thách hàng ngày nhé!
                   </p>
                   
                   <button
                     onClick={() => setShowStreakCelebration(false)}
                     className="mt-8 px-8 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:shadow-lg shadow-orange-500/20 active:scale-95 transition-all"
                   >
                     Tuyệt vời!
                   </button>
                </motion.div>
             </motion.div>
           )}
         </AnimatePresence>

         {/* Welcome Hero */}
         <div className="relative overflow-hidden rounded-[2.5rem] bg-surface border border-border p-6 md:p-12 shadow-2xl">
            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8 md:gap-12">
               <div className="flex flex-col md:flex-row items-center gap-8 text-center md:text-left flex-1">
                  <motion.div 
                    whileHover={{ scale: 1.05, rotate: 5 }}
                    className="w-28 h-28 md:w-40 md:h-40 rounded-3xl md:rounded-[2.5rem] bg-gradient-to-br from-primary to-secondary p-1 shadow-2xl shadow-primary/20"
                  >
                     <div className="w-full h-full rounded-[1.6rem] md:rounded-[2.2rem] bg-surface flex items-center justify-center text-5xl md:text-7xl font-display font-black text-primary">
                       {user.displayName.charAt(0)}
                     </div>
                  </motion.div>
                  <div>
                     <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-[0.2em] mb-6 border border-primary/20">
                       Học viên cấp {level}
                     </div>
                     <h2 className="text-4xl md:text-6xl font-display font-black tracking-tight mb-4 text-text leading-[1.1]">
                        Chào học giả,<br />
                        <span className="text-primary">{user.displayName}</span>
                     </h2>
                     <p className="text-muted font-medium text-lg md:text-xl">
                        Cấp bậc: <span className={`${rank.color} font-black`}>{rank.title}</span>
                     </p>
                  </div>
               </div>

               <div className="hidden lg:grid grid-cols-2 gap-4 w-full max-w-xs shrink-0">
                  {/* Streak Card spanning two columns */}
                  <motion.div 
                    layout
                    className="col-span-2 bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20 p-5 rounded-3xl flex items-center justify-between relative overflow-hidden group hover:border-orange-500/40 hover:shadow-lg transition-all"
                  >
                     <div className="flex flex-col gap-0.5 z-10">
                        <p className="text-[10px] font-black uppercase text-orange-600 dark:text-orange-400 tracking-widest">Chuỗi Học Tập 🔥</p>
                        <div className="flex items-baseline gap-1">
                           <span className="text-3xl font-black text-text font-display leading-none">{stats?.streak || 0}</span>
                           <span className="text-xs font-bold text-muted">ngày liên tiếp</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1">
                           {stats?.streak && stats.streak > 0 ? 'Duy trì ngọn lửa học tập!' : 'Hoàn thành chặng học để bắt đầu!'}
                        </p>
                     </div>
                     <motion.div
                       animate={stats?.streak && stats.streak > 0 ? {
                         scale: [1, 1.15, 1],
                         rotate: [0, -5, 5, 0]
                       } : {}}
                       transition={{
                         repeat: stats?.streak && stats.streak > 0 ? Infinity : 0,
                         duration: 2,
                         repeatType: "reverse"
                       }}
                       className="p-3 bg-orange-500 rounded-2xl text-white shadow-lg shadow-orange-500/30 shrink-0 z-10"
                     >
                        <Flame size={24} className="fill-white" />
                     </motion.div>
                     <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-orange-500/10 rounded-full blur-xl group-hover:bg-orange-500/20 transition-all duration-300"></div>
                  </motion.div>

                  {[
                    { label: 'Số dư tri thức', value: inventory.coins, unit: 'xu', icon: Coins, color: 'text-yellow-500' },
                    { label: 'Phòng thủ', value: inventory.items['SHIELD'] || 0, unit: 'khiên', icon: Shield, color: 'text-blue-500' },
                    { label: 'Học vượt', value: inventory.items['SKIP'] || 0, unit: 'lượt', icon: Zap, color: 'text-purple-500' },
                    { label: 'Thành tựu', value: stats?.highScore || 0, unit: 'điểm', icon: Trophy, color: 'text-orange-500' },
                  ].map((stat, i) => (
                    <div key={i} className="bg-background border border-border p-4 rounded-3xl flex flex-col gap-2">
                       <stat.icon size={20} className={stat.color} />
                       <div className="text-xl font-black text-text leading-none">{stat.value}</div>
                       <p className="text-[10px] font-black uppercase text-muted tracking-widest">{stat.label}</p>
                    </div>
                  ))}
               </div>
            </div>
            
            {/* Ambient Background */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[140px] -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-secondary/5 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2"></div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Quick Actions & Activity */}
            <div className="lg:col-span-2 space-y-8">
               <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 md:gap-6">
                {[
                  { id: 'practice', title: 'Luyện tập', icon: Play, color: 'text-blue-600', bg: 'bg-blue-500/10' },
                  { id: 'documents', title: 'Tài liệu', icon: BookOpen, color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
                  { id: 'shop', title: 'Cửa hàng', icon: ShoppingBag, color: 'text-purple-600', bg: 'bg-purple-500/10' },
                  { id: 'leaderboard', title: 'Xếp hạng', icon: Trophy, color: 'text-orange-600', bg: 'bg-orange-500/10' },
                ].map((item) => (
                  <button 
                    key={item.id}
                    onClick={() => onTabChange(item.id as TabType)} 
                    className="flex flex-col items-center gap-4 p-6 bg-surface border border-border rounded-[2rem] hover:border-primary/30 transition-all group hover:shadow-lg hover:-translate-y-1"
                  >
                     <div className={`w-14 h-14 rounded-2xl ${item.bg} ${item.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        <item.icon size={28} />
                     </div>
                     <span className="font-bold text-sm">{item.title}</span>
                  </button>
                ))}
               </div>

               {/* LineChart: User's scores progress in the past 7 days */}
               <div className="bg-surface border border-border rounded-[2.5rem] p-6 md:p-8 shadow-xl relative overflow-hidden">
                  <div className="flex items-center justify-between mb-6">
                     <div>
                        <h3 className="text-xs font-black text-muted uppercase tracking-[0.2em] mb-1">Xu hướng học tập</h3>
                        <h4 className="text-xl font-bold text-text">Tiến độ điểm số 7 ngày qua</h4>
                     </div>
                     <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                        <Sparkles size={18} />
                     </div>
                  </div>

                  <div className="h-64 sm:h-72 w-full">
                     <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                           <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(229, 231, 235, 0.4)" strokeOpacity={0.5} />
                           <XAxis 
                              dataKey="date" 
                              stroke="#888888" 
                              fontSize={11} 
                              fontWeight={600}
                              tickLine={false} 
                              axisLine={false} 
                              dy={10}
                           />
                           <YAxis 
                              stroke="#888888" 
                              fontSize={11} 
                              fontWeight={600}
                              tickLine={false} 
                              axisLine={false} 
                              dx={-5}
                           />
                           <Tooltip 
                              contentStyle={{ 
                                 backgroundColor: 'var(--color-surface, #ffffff)', 
                                 border: '1px solid var(--color-border, #e5e7eb)', 
                                 borderRadius: '16px',
                                 boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                              }}
                              labelClassName="text-xs font-bold text-muted uppercase tracking-wider mb-1"
                           />
                           <Line 
                              type="monotone" 
                              dataKey="score" 
                              name="Điểm tích lũy"
                              stroke="#4f46e5" 
                              strokeWidth={3.5}
                              dot={{ r: 4, strokeWidth: 2, fill: '#ffffff', stroke: '#4f46e5' }}
                              activeDot={{ r: 7, strokeWidth: 1, fill: '#4f46e5' }}
                           />
                        </LineChart>
                     </ResponsiveContainer>
                  </div>
               </div>

               {renderThinkingErrorsSection()}

               <div className="bg-surface border border-border rounded-[2.5rem] p-8 md:p-10 shadow-xl overflow-hidden relative">
                  <div className="absolute top-0 right-0 p-10 opacity-5">
                    <HistoryIcon size={120} />
                  </div>
                  <ActivityFeed />
               </div>
            </div>

            {/* Right Column: Skills & Goals */}
            <div className="space-y-8">
              <div className="bg-surface border border-border rounded-[2.5rem] p-8 shadow-xl">
                 <div className="flex items-center justify-between mb-8">
                   <h3 className="text-xs font-black text-muted uppercase tracking-[0.2em]">Kỹ năng tri thức</h3>
                   <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                     <Target size={20} />
                   </div>
                 </div>
                 <div className="flex flex-col gap-6 w-full">
                   {stats?.mastery && stats.mastery.length > 0 ? (
                     <>
                       {renderMasteryRadar(stats.mastery)}
                       <div className="border-t border-border/85 pt-6">
                         <h4 className="text-xs font-black text-muted uppercase tracking-[0.15em] mb-4 text-left">Tiến trình thông thạo</h4>
                         {renderSubjectMasteryBars(stats.mastery)}
                       </div>
                     </>
                   ) : (
                      <div className="flex flex-col items-center justify-center text-center gap-4 py-8 w-full">
                         <div className="w-16 h-16 rounded-[2rem] bg-zinc-50 dark:bg-zinc-800/50 border border-border flex items-center justify-center text-muted">
                           <Brain size={32} />
                         </div>
                         <p className="text-xs text-muted font-bold uppercase tracking-wider leading-relaxed px-4">
                           Hoàn thành bài tập để phân tích năng lực
                         </p>
                      </div>
                   )}
                 </div>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group">
                 <div className="relative z-10 space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xs font-black text-zinc-500 uppercase tracking-[0.2em]">Bảng Nhiệm Vụ</h3>
                      <div className="w-6 h-6 rounded-lg bg-zinc-800 flex items-center justify-center text-xs animate-pulse">📅</div>
                    </div>
                    
                    {/* Attendance Grid System */}
                    {(() => {
                      const gridState = (() => {
                        let currentGrid = questManager.getAttendanceGridState(user.username);
                        const isTodayClaimed = questManager.isAttendanceClaimedToday(user.username);
                        if (currentGrid.every(val => val) && !isTodayClaimed) {
                          const resetGrid = Array(7).fill(false);
                          localStorage.setItem(`mazemind_weekly_attendance_${user.username}`, JSON.stringify(resetGrid));
                          return resetGrid;
                        }
                        return currentGrid;
                      })();

                      const isTodayClaimed = questManager.isAttendanceClaimedToday(user.username);
                      const nextClaimIndex = gridState.findIndex(val => !val);

                      return (
                        <div className="bg-zinc-800/20 p-4 rounded-3xl border border-zinc-850 space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Học tập 7 ngày</span>
                            <span className="text-[9px] text-zinc-500">
                              {isTodayClaimed ? "Đã điểm danh hôm nay ✓" : "Báo danh nhận quà!"}
                            </span>
                          </div>
                          <div className="grid grid-cols-7 gap-1.5 justify-items-center">
                            {gridState.map((claimed, idx) => {
                              const isNext = idx === nextClaimIndex;
                              const canClick = isNext && !isTodayClaimed;
                              
                              return (
                                <button
                                  key={idx}
                                  disabled={!canClick}
                                  onClick={() => handleClaimAttendance(idx)}
                                  className={`w-9 h-11 rounded-xl flex flex-col items-center justify-between py-1.5 transition-all relative overflow-hidden ${
                                    claimed 
                                      ? 'bg-primary text-primary-text border border-primary/20 scale-[0.98]' 
                                      : isNext && !isTodayClaimed
                                        ? 'bg-zinc-800 text-yellow-400 border border-yellow-500/50 shadow-lg shadow-yellow-500/10 animate-pulse cursor-pointer hover:scale-105 active:scale-95'
                                        : 'bg-zinc-800/40 text-zinc-600 border border-transparent'
                                  }`}
                                  title={`Ngày ${idx + 1}`}
                                >
                                  <span className="text-[8px] font-black uppercase">D{idx + 1}</span>
                                  {claimed ? (
                                    <span className="text-[9px] font-bold text-white">✓</span>
                                  ) : (
                                    <span className="text-[9px] font-semibold text-zinc-500">
                                      {idx === 2 ? '💡' : idx === 5 ? '🛡️' : '💎'}
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Quest List with dynamic progress */}
                    <div className="space-y-3">
                      {DAILY_QUESTS.map((quest) => {
                        let current = 0;
                        if (quest.type === 'attendance') {
                          current = questProgress.attendanceClaimed ? 1 : 0;
                        } else if (quest.type === 'questions') {
                          current = questProgress.questionsCount;
                        } else if (quest.type === 'lessons') {
                          current = questProgress.lessonsCount;
                        } else if (quest.type === 'purchases') {
                          current = questProgress.purchasesCount;
                        }
                        
                        const isCompleted = current >= quest.target;
                        const isClaimed = questProgress.claimedQuestIds.includes(quest.id);
                        const percent = Math.min(100, Math.round((current / quest.target) * 100));

                        return (
                          <div 
                            key={quest.id} 
                            className={`p-3.5 rounded-3xl border transition-all ${
                              isClaimed 
                                ? 'bg-zinc-800/10 border-zinc-850 opacity-50' 
                                : isCompleted 
                                  ? 'bg-primary/10 border-primary/20 shadow-md shadow-primary/5' 
                                  : 'bg-zinc-850/40 border-zinc-800/80'
                            }`}
                          >
                            <div className="flex justify-between items-start gap-3">
                              <div className="space-y-0.5 text-left flex-1">
                                <h5 className="font-bold text-xs text-white flex items-center gap-1.5 flex-wrap">
                                  {quest.title}
                                  {!isClaimed && isCompleted && (
                                    <span className="text-[8px] font-black uppercase text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 px-1.5 py-0.5 rounded animate-bounce">Sẵn sàng!</span>
                                  )}
                                </h5>
                                <p className="text-[9px] text-zinc-400 leading-snug">{quest.description}</p>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="text-[11px] font-black text-yellow-500 flex items-center gap-0.5 justify-end">
                                  +{quest.rewardCoins} xu
                                </span>
                                <span className="text-[9px] font-bold text-zinc-500 block">
                                  {Math.min(quest.target, current)}/{quest.target}
                                </span>
                              </div>
                            </div>

                            {/* Progress bar */}
                            <div className="mt-2.5 flex items-center gap-3">
                              <div className="flex-1 h-1.5 bg-zinc-800/80 rounded-full overflow-hidden">
                                <motion.div
                                  className={`h-full ${isClaimed ? 'bg-zinc-650' : isCompleted ? 'bg-primary' : 'bg-zinc-500'}`}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${percent}%` }}
                                  transition={{ duration: 0.5 }}
                                />
                              </div>
                              
                              {isClaimed ? (
                                <span className="text-[9px] text-zinc-500 font-semibold px-2 py-0.5">Đã nhận ✓</span>
                              ) : isCompleted ? (
                                <button
                                  onClick={() => handleClaimQuest(quest.id)}
                                  className="px-2.5 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-zinc-950 text-[9px] font-black uppercase tracking-wider rounded-lg shadow-lg active:scale-95 cursor-pointer"
                                >
                                  Nhận
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    if (quest.type === 'questions') onTabChange('practice');
                                    if (quest.type === 'lessons') onTabChange('documents');
                                    if (quest.type === 'purchases') onTabChange('shop');
                                  }}
                                  className="px-2 py-0.5 bg-zinc-800 hover:bg-zinc-750 hover:text-white text-zinc-400 text-[8px] font-bold uppercase tracking-wider rounded border border-zinc-700 cursor-pointer"
                                >
                                  Làm
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                 </div>
                 {/* Decorative background flare */}
                 <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-primary/20 rounded-full blur-3xl group-hover:bg-primary/30 transition-all"></div>
              </div>
            </div>
         </div>
      </motion.div>
    );
};

  const renderPractice = () => (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto"
    >
      <div className="text-center space-y-2">
        <h2 className="text-4xl font-display font-bold tracking-tight">Thiết lập Mê cung</h2>
        <p className="text-muted font-medium">Tùy chỉnh thử thách của bạn để bắt đầu hành trình tri thức.</p>
      </div>
      
        <div className="card p-6 md:p-10 rounded-[2rem] md:rounded-[2.5rem] bg-surface border-border shadow-2xl shadow-black/5 space-y-8 md:space-y-10">
        <div className="space-y-4">
          <label className="text-xs font-black text-muted uppercase tracking-[0.2em] flex items-center gap-2">
            <BookOpen size={14} className="text-primary" />
            Chọn môn học
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {Object.values(Subject).map(s => (
              <button
                key={s}
                onClick={() => setSubject(s)}
                className={`p-4 rounded-3xl transition-all border-2 flex items-center justify-center ${
                  subject === s 
                    ? 'bg-primary border-primary text-primary-text shadow-lg shadow-primary/20 scale-[1.02]' 
                    : 'bg-surface border-border hover:border-primary/40 text-muted hover:text-text'
                }`}
              >
                <span className="font-bold text-sm text-center w-full truncate">{s}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <label className="text-xs font-black text-muted uppercase tracking-[0.2em] flex items-center gap-2">
              <Target size={14} className="text-primary" />
              Độ khó
            </label>
            <div className="grid grid-cols-3 gap-2 p-1.5 bg-surface rounded-2xl border border-border">
              {[
                { value: Difficulty.EASY, label: 'Dễ' },
                { value: Difficulty.MEDIUM, label: 'Trung bình' },
                { value: Difficulty.HARD, label: 'Khó' }
              ].map(d => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => setDifficulty(d.value)}
                  className={`py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                    difficulty === d.value 
                      ? 'bg-primary text-primary-text shadow-sm'
                      : 'hover:bg-background text-muted hover:text-text'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <label className="text-xs font-black text-muted uppercase tracking-[0.2em] flex items-center gap-2">
              <Grid3X3 size={14} className="text-primary" />
              Kích thước mê cung
            </label>
            <select 
              value={gridSize}
              onChange={(e) => setGridSize(Number(e.target.value))}
              className="w-full p-4 rounded-2xl bg-surface border-2 border-border outline-none focus:border-primary font-bold text-sm appearance-none cursor-pointer"
            >
              <option value={3}>3x3 • Chế độ nhanh</option>
              <option value={4}>4x4 • Chế độ tiêu chuẩn</option>
              <option value={5}>5x5 • Chế độ thử thách</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between p-6 bg-surface border-2 border-border rounded-3xl group hover:border-primary/20 transition-all">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-danger/10 text-danger flex items-center justify-center">
              <Zap size={24} className="fill-current" />
            </div>
            <div>
              <h4 className="font-bold text-lg">Chế độ Sinh tồn</h4>
              <p className="text-xs text-muted font-medium">Chỉ cần sai 1 câu, hành trình sẽ kết thúc ngay lập tức.</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" checked={suddenDeath} onChange={(e) => setSuddenDeath(e.target.checked)} />
            <div className="w-14 h-8 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-primary-text after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-primary-text after:border-border after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-danger shadow-inner"></div>
          </label>
        </div>

        <div className="flex flex-col gap-4 pt-4">
          <button 
            onClick={handleStart} 
            className="w-full btn-primary py-5 rounded-[1.5rem] font-black text-xl flex justify-center items-center gap-3 shadow-2xl shadow-primary/30 hover:scale-[1.02] transition-all group"
          >
            <Play size={28} className="fill-current group-hover:scale-110 transition-transform"/> 
            KHỞI HÀNH NGAY
          </button>
          
          {hasSavedGame && onResume && (
            <button 
              onClick={onResume} 
              className="w-full py-5 rounded-[1.5rem] font-bold text-primary bg-primary/5 border-2 border-primary/10 hover:bg-primary/10 transition-all flex justify-center items-center gap-3"
            >
              <Clock size={22}/> TIẾP TỤC HÀNH TRÌNH ĐANG DỞ
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );

  const renderFlashcardsSection = () => {
    // We use selectedLesson.keyTerms or a fallback list from Sections
    const list = selectedLesson && selectedLesson.keyTerms && selectedLesson.keyTerms.length > 0 
      ? selectedLesson.keyTerms 
      : (selectedLesson?.sections || []).map((s, idx) => ({ term: s.title, definition: s.content.substring(0, 150) + "..." }));

    if (!list || list.length === 0) {
      return (
        <div className="text-center py-10 text-muted">Không có thuật ngữ nào để luyện tập.</div>
      );
    }

    const currentCard = list[activeCardIndex];

    const speakTerm = (text: string) => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'vi-VN';
        window.speechSynthesis.speak(utterance);
      } else {
        toast.error("Trình duyệt không hỗ trợ Đọc thuật ngữ!");
      }
    };

    return (
      <div className="py-6 flex flex-col items-center">
        {/* Progress bar */}
        <div className="w-full max-w-md flex justify-between items-center mb-6">
          <span className="text-xs font-bold text-muted uppercase tracking-widest">Tiến độ ôn tập</span>
          <span className="text-xs font-black text-primary">{activeCardIndex + 1} / {list.length} thẻ</span>
        </div>
        <div className="w-full max-w-md h-1.5 bg-background border border-border rounded-full overflow-hidden mb-8">
          <div className="h-full bg-primary transition-all duration-300" style={{ width: `${((activeCardIndex + 1) / list.length) * 100}%` }}></div>
        </div>

        {/* 3D Card Flipper Container */}
        <div 
          onClick={() => setIsCardFlipped(!isCardFlipped)}
          className="w-full max-w-md h-64 md:h-80 cursor-pointer relative group perspective-1000 mb-8"
        >
          <motion.div
            animate={{ rotateY: isCardFlipped ? 180 : 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="w-full h-full relative preserve-3d"
          >
            {/* Front Card (Term) */}
            <div 
              className={`absolute inset-0 w-full h-full card rounded-[2rem] p-6 flex flex-col justify-between items-center text-center transition-all bg-surface border-border hover:border-primary/50 shadow-lg backface-hidden ${isCardFlipped ? 'pointer-events-none opacity-0' : 'opacity-100'}`}
            >
              <div className="w-full flex justify-end">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    speakTerm(currentCard.term);
                  }}
                  className="p-2 bg-background border border-border hover:bg-primary/5 text-muted hover:text-primary rounded-xl transition-all"
                >
                  <Volume2 size={16}/>
                </button>
              </div>
              <div className="px-4">
                <p className="text-xs font-black text-muted uppercase tracking-[0.2em] mb-3">Thuật ngữ</p>
                <h3 className="text-2xl md:text-3xl font-display font-black text-text leading-tight">{currentCard.term}</h3>
              </div>
              <div className="text-xs text-muted/60 font-bold flex items-center gap-1">
                <Sparkles size={12} className="text-yellow-500"/>
                Bấm vào thẻ để xem Định nghĩa
              </div>
            </div>

            {/* Back Card (Definition) */}
            <div 
              className={`absolute inset-0 w-full h-full card rounded-[2rem] p-6 flex flex-col justify-between items-center text-center transition-all bg-primary text-primary-text border-primary hover:border-primary shadow-lg backface-hidden ${isCardFlipped ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
              style={{ transform: 'rotateY(180deg)' }}
            >
              <div className="w-full flex justify-end">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    speakTerm(currentCard.definition);
                  }}
                  className="p-2 bg-white/10 hover:bg-white/20 text-primary-text rounded-xl transition-all"
                >
                  <Volume2 size={16}/>
                </button>
              </div>
              <div className="px-4 overflow-y-auto max-h-36 md:max-h-48 custom-scrollbar">
                <p className="text-xs font-black text-white/60 dark:text-black/60 uppercase tracking-[0.2em] mb-3">Định nghĩa & ý nghĩa</p>
                <p className="text-base md:text-lg font-medium leading-relaxed">{currentCard.definition}</p>
              </div>
              <div className="text-xs text-white/60 dark:text-black/60 font-medium">Bấm vào thẻ để quay lại</div>
            </div>
          </motion.div>
        </div>

        {/* Carousel actions */}
        <div className="flex gap-4 items-center">
          <button 
            disabled={activeCardIndex === 0}
            onClick={() => {
              setActiveCardIndex(activeCardIndex - 1);
              setIsCardFlipped(false);
            }}
            className="px-5 py-3 rounded-xl bg-background border border-border text-muted hover:text-text disabled:opacity-30 transition-all flex items-center gap-2 text-xs font-black uppercase tracking-widest"
          >
            Quay lại
          </button>
          
          <button 
            onClick={() => setIsCardFlipped(!isCardFlipped)}
            className="px-6 py-3 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-all text-xs font-black uppercase tracking-widest"
          >
            Lật thẻ
          </button>

          <button 
            onClick={() => {
              if (activeCardIndex === list.length - 1) {
                toast.success("Tuyệt vời! Bạn đã ôn luyện tất cả thẻ từ vựng bài học này!");
                setActiveCardIndex(0);
              } else {
                setActiveCardIndex(activeCardIndex + 1);
              }
              setIsCardFlipped(false);
            }}
            className="px-5 py-3 rounded-xl bg-primary text-primary-text hover:shadow-lg hover:shadow-primary/20 transition-all flex items-center gap-2 text-xs font-black uppercase tracking-widest"
          >
            {activeCardIndex === list.length - 1 ? "Hoàn thành" : "Tiếp theo"}
          </button>
        </div>
      </div>
    );
  };

  const renderMindMapSection = () => {
    if (isMindMapLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-primary animate-pulse">
          <Loader2 className="animate-spin mb-4" size={48}/>
          <p className="font-bold text-lg">AI đang kết tinh khối óc, lập Sơ đồ tư duy học thuật...</p>
        </div>
      );
    }

    if (!mindMapNodes || mindMapNodes.length === 0) {
      return (
        <div className="text-center py-12">
          <p className="text-muted italic">Không thể phân tích sơ đồ tư duy cho bài học lúc này. Thử lại sau nhé!</p>
          <button onClick={handleToggleMindMap} className="mt-4 px-6 py-2.5 bg-primary text-primary-text rounded-xl font-bold">Thử lại</button>
        </div>
      );
    }

    const rootNode = mindMapNodes.find(n => !n.parentId || n.id === 'goc' || n.parentId === '') || mindMapNodes[0];
    const branches = mindMapNodes.filter(n => n.parentId === rootNode.id);

    return (
      <div className="py-6 space-y-8">
        <div className="text-center max-w-xl mx-auto mb-4">
          <p className="text-sm text-muted">Sơ đồ bám sát 100% nội dung bài giảng, trình bày dưới góc nhìn phân cấp tinh gọn.</p>
        </div>

        <div className="flex flex-col items-center gap-8 relative p-6 bg-zinc-50 dark:bg-zinc-950/20 rounded-[2rem] border border-border overflow-x-auto min-w-full">
          
          {/* Root Card */}
          <motion.div 
            whileHover={{ scale: 1.03 }}
            className="card p-6 bg-primary text-primary-text border-primary rounded-2xl shadow-xl w-64 text-center ring-4 ring-primary/10 relative z-10"
          >
            <div className="text-[10px] font-black uppercase text-primary-text/60 tracking-widest mb-1">Chương Trọng Tâm</div>
            <h4 className="font-display font-black text-sm md:text-base leading-snug">{rootNode.label}</h4>
            <div className="text-[10px] text-primary-text/80 mt-2 font-medium leading-normal italic">{rootNode.summary}</div>
          </motion.div>

          {/* Connective Line to Branches */}
          <div className="w-0.5 h-8 bg-primary/20 dark:bg-primary/40"></div>

          {/* Branches Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-5xl items-start relative">
            
            {branches.map((branch, bIdx) => {
              const leaves = mindMapNodes.filter(n => n.parentId === branch.id);
              
              return (
                <div key={branch.id} className="flex flex-col items-center gap-4 relative">
                  
                  {/* Branch Card */}
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    className="card p-5 bg-surface border-2 border-primary/20 hover:border-primary/50 rounded-2xl shadow-md w-full text-center relative z-10"
                  >
                    <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs mx-auto mb-2">
                      {bIdx + 1}
                    </div>
                    <h5 className="font-bold text-xs md:text-sm text-text leading-snug">{branch.label}</h5>
                    <p className="text-xs text-muted leading-relaxed mt-2">{branch.summary}</p>
                  </motion.div>

                  {/* Connective Line to Leaves */}
                  {leaves.length > 0 && <div className="w-0.5 h-6 bg-primary/10 dark:bg-primary/30"></div>}

                  {/* Leaves List */}
                  {leaves.length > 0 && (
                    <div className="w-full space-y-3">
                      {leaves.map((leaf) => (
                        <motion.div 
                          key={leaf.id}
                          whileHover={{ scale: 1.01 }}
                          className="p-3.5 bg-background border border-border hover:border-primary hover:shadow-sm rounded-xl text-left"
                        >
                          <div className="font-bold text-xs text-text">{leaf.label}</div>
                          {leaf.summary && <p className="text-[11px] text-muted leading-relaxed mt-1">{leaf.summary}</p>}
                        </motion.div>
                      ))}
                    </div>
                  )}

                </div>
              );
            })}

          </div>

        </div>
      </div>
    );
  };

  const renderDocuments = () => {
    if (selectedLesson) {
      return (
        <div className="flex flex-col lg:flex-row gap-6 animate-in fade-in duration-500 max-w-6xl mx-auto">
          <div className="flex-1 space-y-6">
            <button onClick={() => setSelectedLesson(null)} className="flex items-center gap-2 text-muted hover:text-primary transition-colors">
              <ArrowLeft size={20}/> Quay lại danh sách
            </button>
            
            <div className="card overflow-hidden bg-surface shadow-xl border border-border rounded-[2rem]">
              <div className="h-40 md:h-48 w-full relative bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                <BookOpen size={60} className="text-primary/40 md:w-[80px] md:h-[80px]" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6 md:p-8">
                   <div className="text-white">
                      <div className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80 mb-2">Chương trình chuẩn quốc gia</div>
                      <h2 className="text-2xl md:text-3xl font-serif font-bold">{selectedLesson.title}</h2>
                   </div>
                </div>
              </div>

              <div className="p-6 md:p-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 border-b border-border pb-6">
                  <div>
                    <div className="text-[10px] md:text-xs font-bold text-primary uppercase tracking-widest mb-1">{selectedDocSubject} • Lớp {docGrade} • HK {docSemester} • {curriculum}</div>
                    <h2 className="text-lg md:text-xl font-bold text-text">Chi tiết bài giảng</h2>
                  </div>
                <div className="flex gap-2 w-full sm:w-auto flex-wrap">
                  <button onClick={handleTTS} className={`p-2.5 md:p-3 rounded-xl flex items-center justify-center gap-2 transition-all ${isSpeaking ? 'bg-success/10 text-success scale-105' : 'bg-background border border-border hover:bg-success/5 text-muted'}`}>
                    {isSpeaking ? <Volume2 size={18} className="animate-pulse"/> : <Play size={18}/>}
                    <span className="font-bold text-xs md:text-sm">{isSpeaking ? 'Dừng đọc' : 'Nghe giảng'}</span>
                  </button>
                  <button onClick={openChat} className="p-2.5 md:p-3 rounded-xl bg-primary text-primary-text hover:shadow-lg hover:shadow-primary/20 transition-all flex items-center justify-center gap-2">
                    <Bot size={18}/>
                    <span className="font-bold text-xs md:text-sm">Hỏi Gia sư AI</span>
                  </button>
                  <button onClick={handleToggleMindMap} className={`p-2.5 md:p-3 rounded-xl flex items-center justify-center gap-2 transition-all ${isMindMapOpen ? 'bg-primary text-primary-text scale-105' : 'bg-background border border-border hover:bg-primary/5 text-muted'}`}>
                    <Network size={18}/>
                    <span className="font-bold text-xs md:text-sm">Sơ đồ tư duy AI</span>
                  </button>
                  <button onClick={() => { setIsFlashcardsOpen(!isFlashcardsOpen); setIsMindMapOpen(false); }} className={`p-2.5 md:p-3 rounded-xl flex items-center justify-center gap-2 transition-all ${isFlashcardsOpen ? 'bg-primary text-primary-text scale-105' : 'bg-background border border-border hover:bg-primary/5 text-muted'}`}>
                    <BookOpen size={18}/>
                    <span className="font-bold text-xs md:text-sm">Flashcards</span>
                  </button>
                </div>
              </div>
              
              {isMindMapOpen ? (
                renderMindMapSection()
              ) : isFlashcardsOpen ? (
                renderFlashcardsSection()
              ) : (
                <>
                  {/* Instructor/Publisher Info */}
                  {(() => {
                    const inst = getInstructorForSubject(selectedDocSubject);
                    return (
                      <div className="mb-10 p-5 rounded-3xl bg-gradient-to-r from-surface to-background border border-border/80 flex flex-col sm:flex-row items-start sm:items-center gap-4 transition-all hover:border-primary/40 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-5 text-primary pointer-events-none group-hover:scale-110 transition-transform duration-300">
                          <GraduationCap size={110} />
                        </div>
                        <img 
                          src={inst.avatar} 
                          alt={inst.name} 
                          referrerPolicy="no-referrer"
                          className="w-14 h-14 rounded-full object-cover shadow-md border-2 border-primary/20 shrink-0" 
                        />
                        <div className="space-y-1 text-left relative z-10">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-text text-sm sm:text-base">{inst.name}</span>
                            <span className="text-[10px] bg-primary/10 text-primary font-black px-2 py-0.5 rounded-full uppercase flex items-center gap-1">
                              <UserCheck size={10} /> Người Soạn Giáo Trình
                            </span>
                          </div>
                          <p className="text-xs text-primary font-black uppercase tracking-wider">{inst.role}</p>
                          <p className="text-[11px] text-muted leading-relaxed max-w-2xl">{inst.bio}</p>
                        </div>
                      </div>
                    );
                  })()}

                  <div className="space-y-8 md:space-y-10 text-zinc-800 dark:text-zinc-200 leading-relaxed font-sans">
                    {selectedLesson.sections ? (
                      selectedLesson.sections.map((sec, i) => (
                        <div key={i} className="group">
                          <h3 className="text-xl md:text-2xl font-bold mb-4 flex items-center gap-3 text-zinc-900 dark:text-zinc-100">
                            <span className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs md:text-sm">{i + 1}</span>
                            {sec.title}
                          </h3>
                          <div className="pl-10 md:pl-11 border-l-2 border-zinc-100 dark:border-zinc-800 group-hover:border-primary transition-colors py-1">
                            <p className="text-base md:text-lg">{sec.content}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-lg md:text-xl">{selectedLesson.content}</p>
                    )}
                  </div>

                  {/* Quick Quiz Section */}
                  {selectedLesson.quickQuiz && (
                    <div className="mt-16 pt-12 border-t border-zinc-100 dark:border-zinc-800">
                      <h3 className="text-2xl font-bold mb-8 flex items-center gap-2">
                        <Sparkles className="text-yellow-500"/>
                        Kiểm tra nhanh kiến thức
                      </h3>
                      <div className="space-y-8">
                        {selectedLesson.quickQuiz.map((q, qIdx) => (
                          <div key={qIdx} className="space-y-4">
                            <p className="font-bold text-lg">{qIdx + 1}. {q.question}</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {q.options.map((opt, aIdx) => {
                                const isSelected = quizAnswers[qIdx] === aIdx;
                                const isCorrect = q.correctAnswerIndex === aIdx;
                                let btnClass = "p-4 rounded-xl border text-left transition-all ";
                                
                                if (showQuizResults) {
                                  if (isCorrect) btnClass += "bg-success/10 border-success text-success";
                                  else if (isSelected) btnClass += "bg-danger/10 border-danger text-danger";
                                  else btnClass += "bg-surface border-border text-muted opacity-50";
                                } else {
                                  btnClass += isSelected ? "bg-primary/10 border-primary text-primary" : "bg-surface border-border hover:border-primary";
                                }

                                return (
                                  <button 
                                    key={aIdx} 
                                    onClick={() => handleQuizAnswer(qIdx, aIdx)}
                                    className={btnClass}
                                  >
                                    {opt}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                      {!showQuizResults && Object.keys(quizAnswers).length === selectedLesson.quickQuiz.length && (
                        <button 
                          onClick={submitQuiz}
                          className="mt-8 w-full btn-primary py-4 rounded-xl font-bold text-lg"
                        >
                          Kiểm tra đáp án
                        </button>
                      )}
                    </div>
                  )}

                  {/* Story & Discussion Feed */}
                  <div className="mt-16 pt-12 border-t border-border space-y-8">
                    <div className="text-left space-y-2">
                      <div className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Diễn đàn trao đổi</div>
                      <h3 className="text-xl sm:text-2xl font-bold text-text flex items-center gap-2.5">
                        <MessageSquare className="text-primary" size={24} />
                        Câu chuyện học tập & Thảo luận
                      </h3>
                      <p className="text-xs text-muted">
                        Nơi các học sinh chia sẻ trải nghiệm, mẹo học nhanh và hành trình vượt ải mê cung bài học này.
                      </p>
                    </div>

                    {/* New Story Form */}
                    <div className="bg-gradient-to-br from-surface to-background p-5 rounded-2xl border border-primary/10 space-y-4 text-left">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <span className="font-bold text-xs uppercase tracking-wider text-text flex items-center gap-2">
                          <Sparkles size={14} className="text-yellow-500 animate-pulse" />
                          Viết câu chuyện của bạn
                        </span>
                        
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <span className="text-[11px] font-bold text-muted whitespace-nowrap">Chủ đề:</span>
                          <select 
                            value={newStoryTag}
                            onChange={(e) => setNewStoryTag(e.target.value)}
                            className="bg-background border border-border text-xs rounded-lg px-2 py-1 outline-none text-text focus:border-primary font-bold"
                          >
                            <option value="Kinh nghiệm 💡">Kinh nghiệm 💡</option>
                            <option value="Nhật ký học 🔥">Nhật ký học 🔥</option>
                            <option value="Mẹo giải nhanh ⚡">Mẹo giải nhanh ⚡</option>
                            <option value="Thắc mắc ❓">Thắc mắc ❓</option>
                          </select>
                        </div>
                      </div>

                      <div className="relative">
                        <textarea
                          placeholder="Chia sẻ kinh nghiệm học tập của bạn, bạn đã giải bài này như thế nào? Cách bạn khắc phục khó khăn..."
                          value={newStoryText}
                          onChange={(e) => setNewStoryText(e.target.value)}
                          maxLength={500}
                          rows={3}
                          className="w-full bg-background border border-border rounded-xl p-3.5 text-sm my-1 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all text-text font-medium placeholder:text-muted/60 resize-none"
                        />
                        <div className="absolute bottom-2.5 right-3.5 text-[10px] font-mono text-muted/60">
                          {newStoryText.length}/500
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <button
                          onClick={handlePublishStory}
                          className="btn-primary py-2.5 px-6 rounded-xl font-bold text-xs flex items-center gap-2 transition-transform active:scale-95 text-primary-text"
                        >
                          <Send size={12} />
                          Đăng câu chuyện của tôi
                        </button>
                      </div>
                    </div>

                    {/* Shared Stories list */}
                    <div className="space-y-4">
                      {stories.length === 0 ? (
                        <div className="p-10 border border-dashed border-border rounded-2xl flex flex-col items-center justify-center text-center">
                          <MessageCircle size={32} className="text-muted/40 mb-2" />
                          <p className="text-xs text-muted font-bold">Chưa có câu chuyện nào được chia sẻ.</p>
                          <p className="text-[11px] text-muted/60">Hãy là người đầu tiên đăng câu chuyện học tập của bạn!</p>
                        </div>
                      ) : (
                        <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1.5 custom-scrollbar">
                          {stories.map((story) => (
                            <div 
                              key={story.id} 
                              className="p-4 bg-background/50 hover:bg-background rounded-2xl border border-border/60 transition-all hover:border-border text-left relative group overflow-hidden"
                            >
                              <div className="flex items-start gap-3.5">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 select-none ${story.avatarBg || 'bg-primary/10 text-primary'}`}>
                                  {story.avatar}
                                </div>
                                
                                <div className="space-y-1 flex-1">
                                  <div className="flex flex-wrap justify-between items-baseline gap-2">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="font-bold text-xs text-text">{story.username}</span>
                                      <span className="text-[10px] uppercase font-black bg-primary/10 text-primary px-2 py-0.5 rounded-full scale-90">
                                        {story.tag}
                                      </span>
                                    </div>
                                    <span className="text-[10px] font-mono text-muted">{story.createdAt}</span>
                                  </div>
                                  
                                  <p className="text-xs sm:text-sm text-text leading-relaxed whitespace-pre-wrap font-medium pt-1">
                                    {story.content}
                                  </p>

                                  <div className="flex items-center gap-3 pt-2.5">
                                    <button 
                                      onClick={() => handleLikeStory(story.id)}
                                      className={`flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-lg transition-colors ${story.liked ? 'bg-rose-500/10 text-rose-500' : 'text-muted hover:text-rose-500 hover:bg-rose-500/5'}`}
                                    >
                                      <Heart size={12} fill={story.liked ? 'currentColor' : 'none'} className={story.liked ? 'scale-110' : ''} />
                                      <span>Thích ({story.likes})</span>
                                    </button>

                                    {story.isCustom && (
                                      <button 
                                        onClick={() => handleDeleteStory(story.id)}
                                        className="flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-lg text-muted hover:text-danger hover:bg-danger/5 transition-colors ml-auto sm:opacity-0 group-hover:opacity-100"
                                      >
                                        <Trash2 size={12} />
                                        <span>Xoá</span>
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar for Key Terms */}
          <div className="w-full lg:w-80 space-y-6">
            <div className="card p-6 bg-surface border-border lg:sticky lg:top-24 rounded-[2rem]">
              <h3 className="text-sm font-bold text-muted uppercase tracking-widest mb-4 flex items-center gap-2">
                <List size={16}/>
                Thuật ngữ quan trọng
              </h3>
              <div className="space-y-4">
                {selectedLesson.keyTerms?.map((term, i) => (
                  <div key={i} className="group">
                    <div className="font-bold text-text group-hover:text-primary transition-colors">{term.term}</div>
                    <div className="text-xs text-muted mt-1 leading-relaxed">{term.definition}</div>
                  </div>
                ))}
                {!selectedLesson.keyTerms && <p className="text-xs text-muted italic">Đang phân tích thuật ngữ...</p>}
              </div>
              
              <div className="mt-8 pt-6 border-t border-border">
                <div className="flex items-center gap-2 text-xs font-bold text-muted mb-3">
                  <Target size={14}/>
                  TIẾN ĐỘ BÀI HỌC
                </div>
                <div className="w-full h-2 bg-background rounded-full overflow-hidden">
                  <div className="h-full bg-primary w-1/3"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (studyGuide) {
      return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-3xl mx-auto">
          <button onClick={() => setStudyGuide(null)} className="flex items-center gap-2 text-muted hover:text-primary transition-colors">
            <ArrowLeft size={20}/> Chọn môn khác
          </button>
          <h2 className="text-2xl font-bold">Mục lục: {studyGuide.subject} Lớp {studyGuide.grade} (Học kỳ {studyGuide.semester})</h2>
          <div className="grid gap-4">
            {studyGuide.lessons.map((lesson, i) => (
              <button key={i} onClick={() => handleLoadLesson(lesson.title)} className="card p-6 flex justify-between items-center hover:border-primary transition-all text-left group">
                <div>
                  <h4 className="font-bold text-lg group-hover:text-primary transition-colors">{lesson.title}</h4>
                  <p className="text-sm text-muted mt-1">{lesson.content}</p>
                </div>
                <ChevronRight className="text-muted group-hover:text-primary transition-colors"/>
              </button>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6 animate-in fade-in duration-500 max-w-3xl mx-auto">
        <div className="flex flex-col items-center gap-6 mb-8">
          <h2 className="text-3xl font-bold text-center">Tài liệu học tập</h2>
          
          {/* Search Bar with Trie Optimization */}
          <div className="w-full relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted group-focus-within:text-primary transition-colors">
              <Search size={20} />
            </div>
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Tìm kiếm bài học (Tối ưu hóa bởi Trie Algorithm)..."
              className="w-full pl-12 pr-12 py-4 bg-surface border-2 border-border rounded-2xl outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium"
            />
            {isSearching && (
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                <Loader2 size={20} className="animate-spin text-primary" />
              </div>
            )}
            
            <AnimatePresence>
              {searchQuery.length >= 2 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-surface border border-border rounded-2xl shadow-2xl z-50 overflow-hidden"
                >
                  {searchResults.length > 0 ? (
                    <div className="max-h-60 overflow-y-auto custom-scrollbar">
                      {searchResults.map((lesson, i) => (
                        <button 
                          key={i}
                          onClick={() => {
                            setSelectedLesson(lesson);
                            setSearchQuery('');
                            setSearchResults([]);
                          }}
                          className="w-full px-6 py-4 text-left hover:bg-primary/5 flex items-center justify-between group border-b border-border last:border-0"
                        >
                          <div>
                            <div className="font-bold text-text group-hover:text-primary transition-colors">{lesson.title}</div>
                            <div className="text-xs text-muted truncate max-w-xs">{lesson.content}</div>
                          </div>
                          <ArrowRight size={16} className="text-muted group-hover:text-primary group-hover:translate-x-1 transition-all" />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-muted italic">
                      {!isSearching && "Không tìm thấy bài học nào phù hợp."}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex flex-wrap gap-6 w-full justify-center">
            <div className="flex flex-col items-center gap-2">
              <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Khối lớp</span>
              <div className="flex gap-1 p-1 bg-surface border border-border rounded-xl">
                {[Grade.SIX, Grade.SEVEN, Grade.EIGHT, Grade.NINE].map(g => (
                  <button
                    key={g}
                    onClick={() => setDocGrade(g)}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${docGrade === g ? 'bg-primary text-primary-text shadow-md' : 'hover:bg-primary/5 text-muted'}`}
                  >
                    Lớp {g}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col items-center gap-2">
              <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Học kỳ</span>
              <div className="flex gap-1 p-1 bg-surface border border-border rounded-xl">
                {[1, 2].map(s => (
                  <button
                    key={s}
                    onClick={() => setDocSemester(s as 1 | 2)}
                    className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${docSemester === s ? 'bg-primary text-primary-text shadow-md' : 'hover:bg-primary/5 text-muted'}`}
                  >
                    Kỳ {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col items-center gap-2">
              <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Bộ sách</span>
              <div className="flex gap-1 p-1 bg-surface border border-border rounded-xl">
                {Object.values(Curriculum).map(c => (
                  <button
                    key={c}
                    onClick={() => setCurriculum(c)}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${curriculum === c ? 'bg-primary text-primary-text shadow-md' : 'hover:bg-primary/5 text-muted'}`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {isDocLoading && (
          <div className="space-y-8 animate-pulse max-w-5xl mx-auto py-6">
            <div className="h-10 w-48 bg-border rounded-xl"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="p-6 bg-surface border border-border rounded-3xl space-y-4">
                  <div className="w-10 h-10 rounded-2xl bg-border"></div>
                  <div className="h-5 w-3/4 bg-border rounded-lg"></div>
                  <div className="h-3 w-full bg-border rounded-lg"></div>
                  <div className="h-3 w-5/6 bg-border rounded-lg"></div>
                </div>
              ))}
            </div>
            <div className="flex flex-col items-center justify-center pt-8 text-primary">
              <Loader2 className="animate-spin mb-4" size={36} />
              <p className="font-extrabold text-sm tracking-widest uppercase text-muted text-center max-w-lg leading-relaxed">{loadingText}</p>
            </div>
          </div>
        )}
        {!isDocLoading && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.values(Subject).map(s => (
              <button key={s} onClick={() => handleLoadGuide(s)} className="card p-6 flex flex-col items-center justify-center gap-3 hover:border-primary transition-all">
                <Book size={32} className="text-primary"/>
                <span className="font-bold">{s}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderShop = () => (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold">Cửa hàng Vật phẩm</h2>
        <div className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-full font-bold flex items-center gap-2">
          <Coins size={20}/> {inventory.coins} xu
        </div>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
        <div className="card p-6 flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
            <Shield size={40}/>
          </div>
          <h3 className="text-xl font-bold mb-2">Khiên Bảo Vệ</h3>
          <p className="text-sm text-muted mb-6">Bảo vệ bạn khỏi 1 lần trả lời sai. Không bị mất tim.</p>
          <button onClick={() => handleBuyItem('SHIELD', 100)} className="w-full py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors flex justify-center items-center gap-2">
            Mua (100 <Coins size={16}/>)
          </button>
          <p className="text-xs text-muted mt-2">Đang có: {inventory.items['SHIELD'] || 0}</p>
        </div>
        
        <div className="card p-6 flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mb-4">
            <Brain size={40}/>
          </div>
          <h3 className="text-xl font-bold mb-2">Tư Duy Sâu</h3>
          <p className="text-sm text-muted mb-6">Sử dụng AI Pro để phân tích sâu lỗi sai của bạn.</p>
          <button onClick={() => handleBuyItem('DEEP_THINK', 50)} className="w-full py-3 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-700 transition-colors flex justify-center items-center gap-2">
            Mua (50 <Coins size={16}/>)
          </button>
          <p className="text-xs text-muted mt-2">Đang có: {inventory.items['DEEP_THINK'] || 0}</p>
        </div>

        <div className="card p-6 flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mb-4">
            <Zap size={40}/>
          </div>
          <h3 className="text-xl font-bold mb-2">Gợi ý AI</h3>
          <p className="text-sm text-muted mb-6">Nhận gợi ý thông minh từ AI để tìm ra đáp án đúng.</p>
          <button onClick={() => handleBuyItem('AI_HINT', 30)} className="w-full py-3 rounded-xl bg-orange-600 text-white font-bold hover:bg-orange-700 transition-colors flex justify-center items-center gap-2">
            Mua (30 <Coins size={16}/>)
          </button>
          <p className="text-xs text-muted mt-2">Đang có: {inventory.items['AI_HINT'] || 0}</p>
        </div>
      </div>
    </div>
  );

  const renderChat = () => (
    <div className="fixed bottom-6 right-6 w-96 h-[500px] bg-surface border border-border rounded-3xl shadow-2xl flex flex-col overflow-hidden z-50 animate-in slide-in-from-bottom duration-300">
        <div className="p-4 bg-primary text-primary-text flex justify-between items-center">
            <div className="flex items-center gap-2">
                <div className="p-2 bg-white/20 rounded-full animate-pulse">
                    <Brain size={20}/>
                </div>
                <div>
                    <h4 className="font-bold text-sm">Gia sư 24hoc Pro</h4>
                    <p className="text-[10px] opacity-80">Đang hoạt động (Thinking Mode)</p>
                </div>
            </div>
            <button onClick={() => setChatSession(null)} className="p-1 hover:bg-white/20 rounded-full">
                <X size={20}/>
            </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {chatMessages.length === 0 && (
                <div className="text-center py-10 text-muted">
                    <Bot size={40} className="mx-auto mb-2 opacity-20"/>
                    <p className="text-sm">Hãy hỏi tôi bất cứ điều gì về bài học này!</p>
                </div>
            )}
            {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                        msg.role === 'user' 
                        ? 'bg-primary text-primary-text rounded-tr-none' 
                        : 'bg-background border border-border rounded-tl-none'
                    }`}>
                        {msg.text}
                    </div>
                </div>
            ))}
            {isChatLoading && (
                <div className="flex justify-start">
                    <div className="bg-background border border-border p-3 rounded-2xl rounded-tl-none flex items-center gap-2 text-xs text-muted italic">
                        <Network size={14} className="animate-spin text-primary"/>
                        AI đang suy nghĩ sâu...
                    </div>
                </div>
            )}
            <div ref={chatEndRef}/>
        </div>

        <div className="p-4 border-t border-border flex gap-2 bg-background/50">
            <input 
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                placeholder="Đặt câu hỏi..."
                className="flex-1 bg-surface border border-border rounded-xl px-4 py-2 text-sm outline-none focus:border-primary"
            />
            <button 
                onClick={handleSendChat}
                disabled={isChatLoading}
                className="p-2 bg-primary text-primary-text rounded-xl hover:scale-105 transition-transform disabled:opacity-50"
            >
                <Send size={20}/>
            </button>
        </div>
    </div>
  );

  return (
    <div className="w-full h-full overflow-y-auto p-4 md:p-8 custom-scrollbar">
      {activeTab === 'dashboard' && renderDashboard()}
      {activeTab === 'practice' && renderPractice()}
      {activeTab === 'documents' && renderDocuments()}
      {activeTab === 'shop' && renderShop()}
      {activeTab === 'leaderboard' && <Leaderboard />}
      {chatSession && renderChat()}
    </div>
  );
};

export default WelcomeScreen;
