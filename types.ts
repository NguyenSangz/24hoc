
export enum Difficulty {
  EASY = 'Dễ',
  MEDIUM = 'Trung bình',
  HARD = 'Khó'
}

export enum Grade {
  SIX = '6',
  SEVEN = '7',
  EIGHT = '8',
  NINE = '9'
}

export enum Subject {
  MATH_ALG = 'Toán (Đại số)',
  MATH_GEO = 'Toán (Hình học)',
  LIT = 'Ngữ văn',
  ENG = 'Tiếng Anh',
  HIST = 'Lịch sử',
  GEO = 'Địa lý',
  PHYS = 'Vật lý',
  CHEM = 'Hóa học',
  BIO = 'Sinh học'
}

export interface MasteryData {
  subject: Subject;
  score: number;
}

export interface ThinkingErrorExample {
  questionText: string;
  chosenOption: string;
  correctOption: string;
  analysis: string;
  timestamp: number;
}

export interface ThinkingErrorRecord {
  errorType: string;
  count: number;
  shortAnalysis?: string;
  suggestion?: string;
  examples: ThinkingErrorExample[];
}

export interface UserStats {
  gamesPlayed: number;
  questionsAnswered: number;
  totalScore: number;
  highScore: number;
  streak: number;
  lastCompletedDate?: string;
  nodeCompleted?: boolean;
  subject?: Subject;
  mastery?: MasteryData[];
  scoreHistory?: { date: string; score: number }[];
  thinkingErrors?: ThinkingErrorRecord[];
}

export interface User {
  username: string;
  displayName: string;
  stats?: UserStats;
}

export interface Question {
  id: number;
  text: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  topic: string;
  isThinkingMode?: boolean; // Đánh dấu câu hỏi cần tư duy sâu (như Boss)
}

export enum NodeStatus {
  LOCKED = 'LOCKED',
  UNLOCKED = 'UNLOCKED',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

export enum NodeType {
  START = 'START',
  NORMAL = 'NORMAL',
  BOSS = 'BOSS'
}

export interface MazeNode {
  id: number;
  type: NodeType;
  status: NodeStatus;
  question?: Question;
  row: number;
  col: number;
}

export enum Curriculum {
  KNTT = 'Kết nối tri thức',
  CANH_DIEU = 'Cánh diều',
  CHAN_TROI = 'Chân trời sáng tạo'
}

export interface GameSettings {
  grade: Grade;
  subject: Subject;
  gridSize: number;
  timeLimit: number;
  suddenDeath: boolean;
  difficulty?: Difficulty;
}

export type GameOverReason = 'TIMEOUT' | 'NO_HEARTS' | 'SUDDEN_DEATH' | null;

export type ItemType = 'AI_TICKET' | 'SHIELD' | 'DEEP_THINK' | 'AI_HINT'; 

export interface GameState {
  screen: 'LANDING' | 'AUTH' | 'WELCOME' | 'LOADING' | 'GAME' | 'GAME_OVER' | 'VICTORY';
  settings: GameSettings;
  hearts: number;
  score: number;
  nodes: MazeNode[];
  currentNodeId: number | null;
  history: number[];
  startTime: number | null;
  timeLeft: number;
  gameOverReason: GameOverReason;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  isThinking?: boolean;
  isLoading?: boolean;
}
