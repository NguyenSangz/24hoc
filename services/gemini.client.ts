// Client-side lightweight wrappers that call server API endpoints for AI functions
export const getDeepExplanation = async (question: any, userAnswer: string) => {
  const res = await fetch('/api/gemini/deep-explanation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, userAnswer })
  });
  const data = await res.json();
  return data.text || '';
};

export const getAIHint = async (question: any) => {
  const res = await fetch('/api/gemini/ai-hint', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question })
  });
  const data = await res.json();
  return data.text || '';
};

export const getAILearningHistoryThinkingAnalysis = async (question: any, userAnswer: string, thinkingErrors: any[]) => {
  const res = await fetch('/api/gemini/analyze-thinking', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, userAnswer, thinkingErrors })
  });
  const data = await res.json();
  return data.text || '';
};

export default {
  getDeepExplanation,
  getAIHint,
  getAILearningHistoryThinkingAnalysis
};
