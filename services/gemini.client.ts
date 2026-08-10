import { Question, Grade, Subject, Curriculum } from '../types';

interface ChatPayloadMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

const fetchJson = async (endpoint: string, body: any) => {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`AI request failed (${res.status}): ${text}`);
  }

  return res.json();
};

export const getDeepExplanation = async (question: Question, userAnswer: string) => {
  const data = await fetchJson('/api/gemini/deep-explanation', { question, userAnswer });
  return data.text || '';
};

export const getAIHint = async (question: Question) => {
  const data = await fetchJson('/api/gemini/ai-hint', { question });
  return data.text || '';
};

export const getAILearningHistoryThinkingAnalysis = async (question: Question, userAnswer: string, thinkingErrors: any[]) => {
  const data = await fetchJson('/api/gemini/analyze-thinking', { question, userAnswer, thinkingErrors });
  return data.text || '';
};

export const getStudyGuide = async (grade: Grade, subject: Subject, semester: 1 | 2, curriculum: Curriculum) => {
  const data = await fetchJson('/api/gemini/lesson-guide', { grade, subject, semester, curriculum });
  return data.result || null;
};

export const getLessonDetails = async (grade: Grade, subject: Subject, lessonTitle: string, curriculum: Curriculum) => {
  const data = await fetchJson('/api/gemini/lesson-details', { grade, subject, lessonTitle, curriculum });
  return data.result || null;
};

export const getMindMap = async (grade: Grade, subject: Subject, lessonTitle: string, curriculum: Curriculum) => {
  const data = await fetchJson('/api/gemini/mindmap', { grade, subject, lessonTitle, curriculum });
  return data.result || null;
};

export const sendChatMessage = async (
  messages: ChatPayloadMessage[],
  lessonTitle?: string,
  lessonContent?: string
) => {
  const data = await fetchJson('/api/gemini/chat', { messages, lessonTitle, lessonContent });
  return data.text || '';
};

export const generateSpeech = async (text: string) => {
  const data = await fetchJson('/api/gemini/speech', { text });
  return data.audioBase64 || null;
};

export const generateMazeQuestions = async (grade: Grade, subject: Subject, difficulty: string, count: number) => {
  const data = await fetchJson('/api/gemini/maze-questions', { grade, subject, difficulty, count });
  return data.questions || [];
};

export const analyzeThinkingError = async (
  questionText: string,
  options: string[],
  userAnswerIndex: number,
  correctAnswerIndex: number,
  explanation: string
) => {
  const data = await fetchJson('/api/gemini/analyze-error', { questionText, options, userAnswerIndex, correctAnswerIndex, explanation });
  return data.analysis || null;
};

export type GeminiChatMessage = ChatPayloadMessage;

export default {
  getDeepExplanation,
  getAIHint,
  getAILearningHistoryThinkingAnalysis,
  getStudyGuide,
  getLessonDetails,
  getMindMap,
  sendChatMessage,
  generateSpeech,
  generateMazeQuestions,
  analyzeThinkingError,
};
