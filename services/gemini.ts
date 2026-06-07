
import { GoogleGenAI, Type, Chat, Modality } from "@google/genai";
import { Difficulty, Question, Grade, Subject, Curriculum } from "../types";

// Defining missing interfaces that are imported by components/WelcomeScreen.tsx and utils/storage.ts
export interface Section {
  title: string;
  content: string;
}

export interface MindMapNode {
  id: string;
  label: string;
  parentId?: string;
  summary?: string;
}

export interface Lesson {
  id: string;
  title: string;
  content: string;
  sections?: Section[];
  keyTerms?: { term: string; definition: string }[];
  quickQuiz?: { question: string; options: string[]; correctAnswerIndex: number }[];
  mindMap?: MindMapNode[];
}

export interface StudyGuide {
  id: string;
  grade: Grade;
  subject: Subject;
  semester: 1 | 2;
  lessons: Lesson[];
}

// Correct API key usage for Vite. Fallback to empty string to prevent top-level crash if env is not set in Vercel.
const apiKey = process.env.GEMINI_API_KEY || "missing_api_key";
const ai = new GoogleGenAI({ apiKey });

const MODEL_PRO = "gemini-1.5-pro";
const MODEL_FLASH = "gemini-1.5-flash";
const MODEL_TTS = "gemini-1.5-flash";

export const generateStudyGuide = async (grade: Grade, subject: Subject, semester: 1 | 2, curriculum: Curriculum): Promise<StudyGuide | null> => {
  const cacheId = `guide-${grade}-${subject}-${semester}-${curriculum}`;
  try {
    // Check server cache first
    const cached = await fetch(`/api/lessons/${cacheId}`).then(r => r.ok ? r.json() : null).catch(() => null);
    if (cached) return cached;

    const prompt = `Bạn là chuyên gia biên soạn sách giáo khoa. 
    Hãy lập danh sách các bài học trọng tâm môn ${subject} lớp ${grade} học kỳ ${semester} theo bộ sách "${curriculum}" (Chương trình GDPT mới).
    Đảm bảo danh sách đầy đủ, chính xác, bám sát mục lục của bộ sách "${curriculum}".
    
    Trả về JSON với cấu trúc: { "lessons": [{ "id": "string", "title": "string", "content": "Mô tả ngắn gọn mục tiêu bài học" }] }`;
    
    const response = await ai.models.generateContent({
      model: MODEL_PRO,
      contents: prompt,
      config: { 
        responseMimeType: "application/json",
        tools: [{ googleSearch: {} }]
      }
    });
    const data = JSON.parse(cleanJson(response.text || "{}"));
    const result = { id: `${grade}-${subject}-${semester}-${curriculum}`, grade, subject, semester, lessons: data.lessons };
    
    // Save to server cache
    await fetch('/api/lessons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: cacheId, data: result })
    }).catch(console.error);

    return result;
  } catch (err) {
    console.error(err);
    return null;
  }
};

export const generateLessonDetails = async (grade: Grade, subject: Subject, lessonTitle: string, curriculum: Curriculum): Promise<Lesson | null> => {
  const cacheId = `lesson-${grade}-${subject}-${lessonTitle}-${curriculum}`.replace(/\s+/g, '_');
  try {
    // Check server cache first
    const cached = await fetch(`/api/lessons/${cacheId}`).then(r => r.ok ? r.json() : null).catch(() => null);
    if (cached) return cached;

    const prompt = `Bạn là một giáo viên ưu tú. Hãy viết nội dung bài giảng chi tiết, chính xác 100% và dễ hiểu cho bài: "${lessonTitle}" môn ${subject} lớp ${grade} thuộc bộ sách "${curriculum}".
    
    YÊU CẦU:
    1. Nội dung phải chuẩn xác về mặt khoa học, sư phạm và bám sát nội dung bộ sách "${curriculum}".
    2. Chia nhỏ bài học thành các phần (sections) logic: Khám phá, Kiến thức trọng tâm, Ví dụ minh họa, Ghi nhớ.
    3. Ngôn ngữ phù hợp với lứa tuổi học sinh lớp ${grade}.
    4. Sử dụng Google Search để kiểm chứng các số liệu hoặc sự kiện lịch sử/khoa học nếu có.
    5. Trích xuất 3-5 thuật ngữ quan trọng (keyTerms) và định nghĩa của chúng.
    6. Tạo 3 câu hỏi trắc nghiệm nhanh (quickQuiz) để kiểm tra mức độ hiểu bài.

    Trả về JSON với cấu trúc: 
    { 
      "id": "string", 
      "title": "string", 
      "content": "Tóm tắt bài học", 
      "sections": [{ "title": "string", "content": "Nội dung chi tiết" }],
      "keyTerms": [{ "term": "string", "definition": "string" }],
      "quickQuiz": [{ "question": "string", "options": ["string"], "correctAnswerIndex": number }]
    }`;
    
    const response = await ai.models.generateContent({
      model: MODEL_PRO,
      contents: prompt,
      config: { 
        responseMimeType: "application/json",
        tools: [{ googleSearch: {} }]
      }
    });
    const result = JSON.parse(cleanJson(response.text || "{}"));

    // Save to server cache
    await fetch('/api/lessons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: cacheId, data: result })
    }).catch(console.error);

    return result;
  } catch (err) {
    console.error(err);
    return null;
  }
};

const questionSchema = {
  type: Type.OBJECT,
  properties: {
    questions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.INTEGER },
          text: { type: Type.STRING },
          options: { type: Type.ARRAY, items: { type: Type.STRING } },
          correctAnswerIndex: { type: Type.INTEGER },
          explanation: { type: Type.STRING },
          topic: { type: Type.STRING }
        },
        required: ["id", "text", "options", "correctAnswerIndex", "explanation", "topic"]
      }
    }
  }
};

const cleanJson = (text: string): string => {
  const match = text.match(/\{[\s\S]*\}/);
  return match ? match[0] : text;
};

export const generateMazeQuestions = async (grade: Grade, subject: Subject, difficulty: Difficulty, count: number): Promise<Question[]> => {
  const prompt = `Bạn là một chuyên gia giáo dục hàng đầu Việt Nam, am hiểu sâu sắc chương trình giáo dục phổ thông mới.
  Nhiệm vụ: Tạo ${count} câu hỏi trắc nghiệm chất lượng cao cho học sinh lớp ${grade}, môn ${subject}, mức độ ${difficulty}.
  
  YÊU CẦU BẮT BUỘC:
  1. Độ chính xác kiến thức: 100%. Sử dụng dữ liệu thực tế và chuẩn xác nhất.
  2. Cấu trúc câu hỏi: Rõ ràng, không gây hiểu lầm.
  3. Đáp án nhiễu: Phải có tính logic, phản ánh các lỗi sai thường gặp của học sinh.
  4. Lời giải chi tiết: Giải thích tại sao đáp án đó đúng và các đáp án khác sai.
  5. Bám sát khung chương trình của Bộ Giáo dục và Đào tạo.

  Trả về JSON theo định dạng schema đã cung cấp.`;

  const response = await ai.models.generateContent({
    model: MODEL_PRO,
    contents: prompt,
    config: { 
      responseMimeType: "application/json", 
      responseSchema: questionSchema,
      tools: [{ googleSearch: {} }]
    }
  });
  
  return JSON.parse(cleanJson(response.text || "{}")).questions;
};

export const getDeepExplanation = async (question: Question, userAnswer: string): Promise<string> => {
  const prompt = `Bạn là một chuyên gia tư vấn giáo dục. 
  Câu hỏi: ${question.text}
  Đáp án đúng: ${question.options[question.correctAnswerIndex]}
  Học sinh chọn: ${userAnswer}
  
  Nhiệm vụ:
  1. Phân tích logic tại sao học sinh chọn sai (dựa trên đáp án học sinh chọn).
  2. Giải thích kiến thức nền tảng một cách chuẩn xác 100%.
  3. Cung cấp ví dụ thực tế hoặc mẹo ghi nhớ (mnemonic) độc đáo.
  4. Kiểm chứng các sự kiện/số liệu bằng Google Search nếu cần thiết.`;

  const response = await ai.models.generateContent({
    model: MODEL_PRO,
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }]
    }
  });

  return response.text || "Không thể tải lời giải chuyên sâu lúc này.";
};

export const getAIHint = async (question: Question): Promise<string> => {
  const prompt = `Bạn là một giáo viên tận tâm. 
  Câu hỏi: ${question.text}
  Các lựa chọn: ${question.options.join(', ')}
  Đáp án đúng (để bạn biết, không được nói thẳng): ${question.options[question.correctAnswerIndex]}
  
  Nhiệm vụ:
  Hãy đưa ra một gợi ý thông minh, gợi mở hoặc cung cấp một phần kiến thức liên quan để giúp học sinh tự tìm ra đáp án đúng.
  TUYỆT ĐỐI KHÔNG được nói thẳng đáp án hoặc chỉ số đáp án.
  Hãy viết ngắn gọn, súc tích và khơi gợi tư duy.`;

  const response = await ai.models.generateContent({
    model: MODEL_PRO,
    contents: prompt
  });

  return response.text || "AI đang bận, hãy thử lại sau nhé!";
};

export const createLessonChatSession = (grade: Grade, subject: Subject, lessonTitle: string, lessonContent: string): Chat => {
  return ai.chats.create({
    model: MODEL_PRO,
    config: {
      systemInstruction: `Bạn là Gia sư AI 24hoc bậc thầy môn ${subject} lớp ${grade}. 
      Nhiệm vụ: Giải thích các khái niệm khó bằng cách chia nhỏ chúng. Luôn khuyến khích học sinh.
      Bạn có khả năng suy nghĩ sâu để giải quyết các vấn đề phức tạp.
      Nội dung bài học hiện tại: ${lessonTitle} - ${lessonContent}`
    },
  });
};

export const generateSpeech = async (text: string) => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_TTS,
      contents: [{ parts: [{ text: `Đọc bài giảng sau bằng tiếng Việt: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) return null;

    const decode = (base64: string) => {
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
      return bytes;
    };

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    
    const dataInt16 = new Int16Array(decode(base64Audio).buffer);
    const buffer = audioContext.createBuffer(1, dataInt16.length, 24000);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;

    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);
    return source;
  } catch (err) {
    console.error("TTS Error", err);
    return null;
  }
};

export const generateMindMap = async (grade: Grade, subject: Subject, lessonTitle: string, curriculum: Curriculum): Promise<MindMapNode[] | null> => {
  const cacheId = `mindmap-${grade}-${subject}-${lessonTitle}-${curriculum}`.replace(/\s+/g, '_');
  try {
    const cached = await fetch(`/api/lessons/${cacheId}`).then(r => r.ok ? r.json() : null).catch(() => null);
    if (cached) return cached;

    const prompt = `Bạn là chuyên gia giáo dục thiết kế sơ đồ tư duy (mindmap) cho bài học.
    Hãy phân tích và tạo một sơ đồ tư duy phân cấp chi tiết cho bài: "${lessonTitle}" môn ${subject} lớp ${grade} thuộc bộ sách "${curriculum}".
    Sơ đồ phải có cấu trúc cây rõ ràng, kết nối chặt chẽ và học thuật 100%:
    - 1 nút gốc (root node) đại diện cho tên chính xác của bài học. Trường parentId sẽ để trống hoặc không khai báo cho nút này.
    - 3 đến 5 nút nhánh chính (main branches) tương ứng với các phần lý thuyết trọng tâm của bài. Các nút nhánh chính này PHẢI có parentId trỏ đến id của nút gốc.
    - Mỗi nhánh chính chia tiếp thành 2-3 nút chi tiết hơn (sub-branches) chứa khái niệm cốt lõi, ví dụ hoặc công thức. Chúng phải có parentId trỏ tới nhánh chính tương ứng.
    - Mỗi nút phải có trường "summary" chứa 1-2 câu giải thích ngắn gọn, súc tích khi rê chuột hoặc bấm xem chi tiết.

    Trả về đúng dạng cấu trúc JSON đối tượng sau:
    {
      "nodes": [
        { "id": "goc", "label": "${lessonTitle}", "summary": "Nút gốc trung tâm của bài học: ${lessonTitle}" },
        { "id": "nhanh1", "label": "Tên nhánh chính 1", "parentId": "goc", "summary": "Mô tả khái quát nhánh chính 1" },
        { "id": "con1", "label": "Khái niệm cụ thể", "parentId": "nhanh1", "summary": "Giải thích chi tiết hơn hoặc công thức liên quan" }
      ]
    }
    Hãy soạn thảo bằng tiếng Việt chuẩn ngữ pháp, súc tích, sinh động và khoa học nhất.`;

    const response = await ai.models.generateContent({
      model: MODEL_PRO,
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const result = JSON.parse(cleanJson(response.text || "{}")).nodes;
    // Lưu cache lên server
    await fetch('/api/lessons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: cacheId, data: result })
    }).catch(console.error);

    return result;
  } catch (err) {
    console.error("Failed to generate mindmap:", err);
    return null;
  }
};

export interface ThinkingErrorAnalysis {
  errorType: string;
  shortAnalysis: string;
  suggestion: string;
}

export const analyzeThinkingError = async (
  questionText: string,
  options: string[],
  userAnswerIndex: number,
  correctAnswerIndex: number,
  explanation: string
): Promise<ThinkingErrorAnalysis | null> => {
  try {
    const prompt = `Bạn là một nhà tâm lý học giáo dục và chuyên gia phân tích tư duy học tập hàng đầu.
    Hãy phân tích lỗi sai của học sinh khi chọn đáp án sai dựa trên thông tin câu hỏi và đáp án:
    
    Câu hỏi: ${questionText}
    Lựa chọn sai của học sinh: ${options[userAnswerIndex]}
    Đáp án đúng của câu hỏi: ${options[correctAnswerIndex]}
    Giải thích chi tiết đáp án đúng: ${explanation}
    
    Nhiệm vụ:
    Phân loại và trả về chính xác một trong các 'lỗi tư duy thường gặp' sau đây:
    1. "Sai sót cẩu thả" (Carelessness): Sẩy chân do cẩu thả, đọc lướt, không đọc hết câu hỏi, nhầm lẫn dấu.
    2. "Hiểu sai khái niệm" (Concept Misunderstanding): Hiểu sai về định nghĩa hoặc tính chất cơ bản của chủ đề kiến thức.
    3. "Giả định sai lầm" (False Assumption): Giản định linh tinh, suy diễn từ thực tế một cách vô căn cứ học thuật.
    4. "Sai số tính toán" (Calculation Error): Phép tính cộng trừ nhân chia bị nhầm lẫn hoặc sai thứ tự ưu tiên.
    5. "Áp dụng sai quy tắc" (Rule Misapplication): Lấy công thức hoặc quy luật này lắp cho chủ đề khác không liên quan.
    6. "Lập luận thiếu logic" (Faulty Deduction): Suy nghĩ nhảy cóc, chọn bừa hoặc lập luận mâu thuẫn.

    Hãy phân tích thật ngắn gọn tầm 1-2 câu lý do cụ thể tại sao học sinh chọn đáp án sai này.
    
    Trả về cấu trúc JSON sau:
    {
      "errorType": "Sai sót cẩu thả" | "Hiểu sai khái niệm" | "Giả định sai lầm" | "Sai số tính toán" | "Áp dụng sai quy tắc" | "Lập luận thiếu logic",
      "shortAnalysis": "Mô tả nguyên nhân sai lầm, ngắn gọn 1-2 câu tiếng Việt.",
      "suggestion": "Mẹo hữu ích 1 câu giúp học sinh không lặp lại lỗi này."
    }`;

    const response = await ai.models.generateContent({
      model: MODEL_PRO,
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const parsed = JSON.parse(cleanJson(response.text || "{}"));
    return {
      errorType: parsed.errorType || "Sai sót cẩu thả",
      shortAnalysis: parsed.shortAnalysis || "Bạn có thể đã vội vàng chọn đáp án này mà chưa đối chiếu đủ các dữ kiện.",
      suggestion: parsed.suggestion || "Hãy suy luận cẩn thận từng bước và kiểm tra lại đáp án của mình nhé!"
    };
  } catch (err) {
    console.error("Failed to analyze thinking error:", err);
    return null;
  }
};

export const getAILearningHistoryThinkingAnalysis = async (
  question: Question,
  userAnswer: string,
  thinkingErrors: any[]
): Promise<string> => {
  try {
    const historySummary = thinkingErrors && thinkingErrors.length > 0 
      ? thinkingErrors.map(e => `- Loại lỗi: "${e.errorType}" (Số lần gặp: ${e.count}). Ví dụ tiêu biểu: "${e.examples?.[0]?.questionText || "N/A"}" -> Bạn chọn: "${e.examples?.[0]?.chosenOption || "N/A"}" (Phân tích: ${e.examples?.[0]?.analysis || "N/A"})`).join("\n")
      : "Học sinh chưa có lịch sử lỗi tư duy tích lũy đáng kể trong quá khứ.";

    const prompt = `Bạn là một chuyên gia tâm lý học giáo dục hàng đầu và là trợ lý giảng dạy AI siêu việt.
    Hãy thực hiện một buổi "Phân Tích Tư Duy Chi Tiết" (Reasoning & Learning Style Diagnostic) về lỗi sai lúc này của học sinh, đồng thời kết hợp đối chiếu với "Lịch sử lỗi tư duy" lưu trữ trong hồ sơ của họ để tìm ra mô thức hành vi nhầm lẫn trong quá khứ và đưa ra giải pháp giải quyết tận gốc vấn đề học tập của họ.

    CẢNH BÁO: Hãy viết nội dung phân tích bằng tiếng Việt tự nhiên, sâu sắc, trực diện, giàu tính sư phạm, khích lệ và trình bày bằng Markdown thật sinh động, đẹp đẽ.

    THÔNG TIN CHI TIẾT VỀ CÂU HỎI & LỖI SAI:
    - Câu hỏi hiện tại: "${question.text}"
    - Các phương án chọn lựa: ${question.options.map((o, idx) => "[" + String.fromCharCode(65 + idx) + "] " + o).join(", ")}
    - Đáp án đúng của câu hỏi: "${question.options[question.correctAnswerIndex]}"
    - Học sinh chọn nhầm đáp án: "${userAnswer}"
    - Lời giải thích sẵn có: "${question.explanation}"

    LỊCH SỬ HỒ SƠ LỖI TƯ DUY TÍCH LŨY CỦA HỌC SĨNH:
    ${historySummary}

    Nhiệm vụ của bạn:
    1. **Chẩn đoán vết rạn tư duy (Cognitive Gap)**: Tại sao học sinh lại nhầm lẫn chọn phương án "${userAnswer}"? Phân tích logic sai đằng sau nó.
    2. **Xâu chuỗi lịch sử học tập**: Liên kết lỗi sai hiện quả này với danh sách lịch sử lỗi tư duy đã tích lũy bên trên để chỉ ra thói quen tư duy lặp đi lặp lại (Ví dụ: "Học sinh thường mắc 'Sai sót cẩu thả' hoặc 'Hiểu sai khái niệm' và lỗi lần này cực kỳ bộc lộ cùng một mô thức...").
    3. **Tái thiết lập hệ tri thức**: Giải thích nguyên lý gốc rễ bản chất của bài học/câu hỏi hiện tại một cách sáng tỏ nhất.
    4. **Bản đồ hành động (Action Plan)**: Đưa ra 2-3 lời khuyên rèn luyện thói quen tư duy chỉnh chu thực tế, dễ thực hiện để học sinh phòng tránh.`;

    const response = await ai.models.generateContent({
      model: MODEL_PRO,
      contents: prompt,
      config: {
        thinkingConfig: {
          thinkingBudget: 32768
        },
        tools: [{ googleSearch: {} }]
      }
    });

    return response.text || "Không thể tải phân tích tư duy nâng cao lúc này.";
  } catch (err) {
    console.error("Lỗi khi chạy Phân tích Tư duy sâu:", err);
    return "Phân tích tư duy đã gặp sự cố kết nối. Vui lòng thử lại sau!";
  }
};

