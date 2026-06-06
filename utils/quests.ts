import { getInventory, updateInventory } from './storage';

export interface Quest {
  id: string;
  title: string;
  description: string;
  target: number;
  rewardCoins: number;
  type: 'attendance' | 'questions' | 'lessons' | 'purchases';
}

export interface QuestProgress {
  attendanceClaimed: boolean;
  questionsCount: number;
  lessonsCount: number;
  purchasesCount: number;
  claimedQuestIds: string[];
}

export const DAILY_QUESTS: Quest[] = [
  {
    id: 'quest_attendance',
    title: 'Khởi nguồn tri thức ☀️',
    description: 'Báo danh học tập hàng ngày hôm nay.',
    target: 1,
    rewardCoins: 20,
    type: 'attendance'
  },
  {
    id: 'quest_questions',
    title: 'Vượt ải tư duy 🧠',
    description: 'Trả lời đúng hoặc hoàn thành 3 câu hỏi mê cung.',
    target: 3,
    rewardCoins: 50,
    type: 'questions'
  },
  {
    id: 'quest_lessons',
    title: 'Nghiên học tinh thông 📖',
    description: 'Tham khảo 1 bài giảng hoặc sơ đồ tư duy bằng AI.',
    target: 1,
    rewardCoins: 30,
    type: 'lessons'
  },
  {
    id: 'quest_purchases',
    title: 'Thăng cấp trang bị 🛒',
    description: 'Mua ít nhất 1 vật phẩm hỗ trợ tại Cửa hàng.',
    target: 1,
    rewardCoins: 40,
    type: 'purchases'
  }
];

const getLocalDateString = (): string => {
  const date = new Date();
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - (offset * 60 * 1000));
  return localDate.toISOString().split('T')[0];
};

export const questManager = {
  getStorageKey: (username: string): string => {
    const today = getLocalDateString();
    return `mazemind_quests_${username}_${today}`;
  },

  getAttendanceKey: (username: string): string => {
    return `mazemind_attendance_claimed_${username}`;
  },

  getProgress: (username: string): QuestProgress => {
    if (typeof window === 'undefined') {
      return {
        attendanceClaimed: false,
        questionsCount: 0,
        lessonsCount: 0,
        purchasesCount: 0,
        claimedQuestIds: []
      };
    }
    const key = questManager.getStorageKey(username);
    const data = localStorage.getItem(key);
    if (data) {
      try {
        return JSON.parse(data);
      } catch (e) {
        // Fallback
      }
    }
    return {
      attendanceClaimed: false,
      questionsCount: 0,
      lessonsCount: 0,
      purchasesCount: 0,
      claimedQuestIds: []
    };
  },

  saveProgress: (username: string, progress: QuestProgress) => {
    if (typeof window === 'undefined') return;
    const key = questManager.getStorageKey(username);
    localStorage.setItem(key, JSON.stringify(progress));
  },

  // Increment specific metrics
  incrementProgress: (username: string, type: 'questions' | 'lessons' | 'purchases', amount: number = 1) => {
    const progress = questManager.getProgress(username);
    if (type === 'questions') progress.questionsCount += amount;
    if (type === 'lessons') progress.lessonsCount += amount;
    if (type === 'purchases') progress.purchasesCount += amount;
    questManager.saveProgress(username, progress);
  },

  markAttendance: (username: string) => {
    const progress = questManager.getProgress(username);
    progress.attendanceClaimed = true;
    questManager.saveProgress(username, progress);
    
    // Save last claimed date globally
    const attKey = questManager.getAttendanceKey(username);
    const today = getLocalDateString();
    localStorage.setItem(attKey, today);
  },

  isAttendanceClaimedToday: (username: string): boolean => {
    if (typeof window === 'undefined') return false;
    const attKey = questManager.getAttendanceKey(username);
    const today = getLocalDateString();
    return localStorage.getItem(attKey) === today;
  },

  claimQuestReward: async (username: string, questId: string): Promise<number | null> => {
    const progress = questManager.getProgress(username);
    const quest = DAILY_QUESTS.find(q => q.id === questId);
    
    if (!quest) return null;
    
    // Prevent double claim
    if (progress.claimedQuestIds.includes(questId)) return null;

    // Verify requirements
    let completed = false;
    if (quest.type === 'attendance' && progress.attendanceClaimed) completed = true;
    if (quest.type === 'questions' && progress.questionsCount >= quest.target) completed = true;
    if (quest.type === 'lessons' && progress.lessonsCount >= quest.target) completed = true;
    if (quest.type === 'purchases' && progress.purchasesCount >= quest.target) completed = true;

    if (!completed) return null;

    // Add to claimed lists
    progress.claimedQuestIds.push(questId);
    questManager.saveProgress(username, progress);

    // Update player balance
    const inventory = await getInventory(username);
    const updatedInventory = {
      ...inventory,
      coins: inventory.coins + quest.rewardCoins
    };
    await updateInventory(username, updatedInventory);

    return quest.rewardCoins;
  },

  getAttendanceGridState: (username: string) => {
    // 7 Days Attendance grid tracker
    // Returns array of booleans indicating if Day was claimed in current week block
    const key = `mazemind_weekly_attendance_${username}`;
    if (typeof window === 'undefined') return Array(7).fill(false);
    const data = localStorage.getItem(key);
    if (data) {
      try {
        return JSON.parse(data) as boolean[];
      } catch (e) {
        // Fallback
      }
    }
    return Array(7).fill(false);
  },

  claimAttendanceDay: async (username: string, dayIndex: number): Promise<{ coins: number; item?: string } | null> => {
    const grid = questManager.getAttendanceGridState(username);
    if (grid[dayIndex]) return null; // already claimed

    const todayClaimed = questManager.isAttendanceClaimedToday(username);
    if (todayClaimed) return null; // can only claim once a day

    // Mark current day index as claimed
    grid[dayIndex] = true;
    const key = `mazemind_weekly_attendance_${username}`;
    localStorage.setItem(key, JSON.stringify(grid));
    
    // Mark today's general attendance
    questManager.markAttendance(username);

    // Day specific rewards
    let rewardCoins = 20 + dayIndex * 10;
    let rewardItem: string | undefined = undefined;

    if (dayIndex === 2) {
      rewardItem = 'AI_HINT';
    } else if (dayIndex === 5) {
      rewardItem = 'SHIELD';
    } else if (dayIndex === 6) {
      rewardCoins = 150;
    }

    // Add reward to inventory
    const inventory = await getInventory(username);
    const newItems = { ...inventory.items };
    if (rewardItem) {
      newItems[rewardItem] = (newItems[rewardItem] || 0) + 1;
    }

    await updateInventory(username, {
      ...inventory,
      coins: inventory.coins + rewardCoins,
      items: newItems
    });

    return { coins: rewardCoins, item: rewardItem };
  }
};
