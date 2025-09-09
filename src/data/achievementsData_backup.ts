/**
 * 扩展成就数据定义
 * 基于拼图大师项目的各种功能设计的丰富成就系统
 */

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'progress' | 'performance' | 'special' | 'milestone' | 'social' | 'technical';
  progress?: number;
  maxProgress?: number;
  isUnlocked: boolean;
  unlockedAt?: Date;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  reward?: string;
}

interface UserStats {
  gamesCompleted: number;
  achievements: string[];
  level: number;
  experience: number;
  coins: number;
  totalScore: number;
  bestTimes?: Record<string, number>;
  recentGameResults?: Array<{
    moves: number;
    totalPieces: number;
    timestamp: Date;
  }>;
}

// 计算高效解谜者成就进度
function calculateEfficientSolverProgress(userStats: UserStats): number {
  const { recentGameResults } = userStats;
  if (!recentGameResults || recentGameResults.length === 0) {
    return 0;
  }

  // 检查最近的游戏是否连续符合条件
  let consecutiveCount = 0;
  for (let i = recentGameResults.length - 1; i >= 0 && consecutiveCount < 3; i--) {
    const game = recentGameResults[i];
    if (game.moves <= game.totalPieces * 1.5) {
      consecutiveCount++;
    } else {
      break; // 如果有一局不符合条件，连续计数中断
    }
  }

  return Math.min(consecutiveCount, 3);
}

export const createAchievements = (
  userStats: UserStats
): Achievement[] => {
  const { gamesCompleted, achievements: userAchievements, level: userLevel, bestTimes } = userStats;

  return [
  // === 基础进度成就 ===
  {
    id: 'first_game',
    title: '初次体验',
    description: '完成第一个拼图',
    icon: '🎯',
    category: 'progress',
    progress: gamesCompleted >= 1 ? 1 : 0,
    maxProgress: 1,
    isUnlocked: userAchievements.includes('first_game'),
    unlockedAt: userAchievements.includes('first_game') ? new Date('2024-01-15') : undefined,
    rarity: 'common',
    reward: '经验值 +10'
  },
  {
    id: 'games_10',
    title: '拼图新手',
    description: '完成10个拼图',
    icon: '🏅',
    category: 'progress',
    progress: Math.min(gamesCompleted, 10),
    maxProgress: 10,
    isUnlocked: userAchievements.includes('games_10'),
    rarity: 'common',
    reward: '金币 +50'
  },
  {
    id: 'games_50',
    title: '拼图达人',
    description: '完成50个拼图',
    icon: '🏆',
    category: 'progress',
    progress: Math.min(gamesCompleted, 50),
    maxProgress: 50,
    isUnlocked: userAchievements.includes('games_50'),
    rarity: 'rare',
    reward: '特殊称号'
  },
  {
    id: 'games_100',
    title: '拼图大师',
    description: '完成100个拼图',
    icon: '👑',
    category: 'milestone',
    progress: Math.min(gamesCompleted, 100),
    maxProgress: 100,
    isUnlocked: userAchievements.includes('games_100'),
    rarity: 'epic',
    reward: '解锁特殊边框'
  },
  {
    id: 'games_500',
    title: '拼图宗师',
    description: '完成500个拼图',
    icon: '🎖️',
    category: 'milestone',
    progress: Math.min(gamesCompleted, 500),
    maxProgress: 500,
    isUnlocked: userAchievements.includes('games_500'),
    rarity: 'legendary',
    reward: '传奇头像框'
  },

  // === 难度成就 ===
  {
    id: 'easy_master',
    title: '简单模式专家',
    description: '完成20个简单难度拼图',
    icon: '😊',
    category: 'progress',
    progress: userAchievements.includes('easy_master') ? 20 : Math.min(Math.floor(gamesCompleted * 0.4), 19),
    maxProgress: 20,
    isUnlocked: userAchievements.includes('easy_master'),
    rarity: 'common',
    reward: '金币 +30'
  },
  {
    id: 'hard_challenger',
    title: '困难挑战者',
    description: '完成10个困难难度拼图',
    icon: '😤',
    category: 'progress',
    progress: userAchievements.includes('hard_challenger') ? 10 : Math.min(Math.floor(gamesCompleted * 0.2), 9),
    maxProgress: 10,
    isUnlocked: userAchievements.includes('hard_challenger'),
    rarity: 'rare',
    reward: '经验值 +100'
  },
  {
    id: 'expert_elite',
    title: '专家精英',
    description: '完成5个专家难度拼图',
    icon: '🔥',
    category: 'milestone',
    progress: userAchievements.includes('expert_elite') ? 5 : Math.min(Math.floor(gamesCompleted * 0.1), 4),
    maxProgress: 5,
    isUnlocked: userAchievements.includes('expert_elite'),
    rarity: 'epic',
    reward: '专家称号'
  },

  // === 速度成就 ===
  {
    id: 'speed_demon',
    title: '速度恶魔',
    description: '在3分钟内完成中等难度拼图',
    icon: '⚡',
    category: 'performance',
    progress: userAchievements.includes('speed_demon') ? 1 : 0,
    maxProgress: 1,
    isUnlocked: userAchievements.includes('speed_demon'),
    rarity: 'rare',
    reward: '称号：闪电手'
  },
  {
    id: 'speed_runner',
    title: '速度跑者',
    description: '在2分钟内完成任意难度拼图',
    icon: '🏃',
    category: 'performance',
    progress: userAchievements.includes('speed_runner') ? 1 : 0,
    maxProgress: 1,
    isUnlocked: userAchievements.includes('speed_runner'),
    rarity: 'rare',
    reward: '称号：极速达人'
  },
  {
    id: 'lightning_fast',
    title: '闪电快手',
    description: '在1分钟内完成简单难度拼图',
    icon: '⚡',
    category: 'performance',
    progress: (bestTimes && Object.values(bestTimes).some(time => time <= 60)) ? 1 : 0,
    maxProgress: 1,
    isUnlocked: userAchievements.includes('lightning_fast'),
    rarity: 'epic',
    reward: '特殊动画效果'
  },
  {
    id: 'time_master',
    title: '时间大师',
    description: '在5次游戏中都打破个人最佳记录',
    icon: '⏱️',
    category: 'performance',
    progress: userAchievements.includes('time_master') ? 5 : Math.min(Math.floor(gamesCompleted * 0.1), 4),
    maxProgress: 5,
    isUnlocked: userAchievements.includes('time_master'),
    rarity: 'legendary',
    reward: '时间之神称号'
  },

  // === 技巧成就 ===
  {
    id: 'perfectionist',
    title: '完美主义者',
    description: '用最少步数完成拼图',
    icon: '💎',
    category: 'performance',
    progress: userAchievements.includes('perfectionist') ? 1 : 0,
    maxProgress: 1,
    isUnlocked: userAchievements.includes('perfectionist'),
    rarity: 'legendary',
    reward: '特殊头像框'
  },
  {
    id: 'efficient_solver',
    title: '高效解谜者',
    description: '连续三次使用步数不超过总拼图数的1.5倍',
    icon: '🧠',
    category: 'performance',
    progress: userAchievements.includes('efficient_solver') ? 3 : calculateEfficientSolverProgress(userStats),
    maxProgress: 3,
    isUnlocked: userAchievements.includes('efficient_solver'),
    rarity: 'epic',
    reward: '智慧之光特效'
  },
  {
    id: 'no_mistakes',
    title: '零失误专家',
    description: '完成拼图过程中不放错任何拼块',
    icon: '🎯',
    category: 'performance',
    progress: userAchievements.includes('no_mistakes') ? 1 : 0,
    maxProgress: 1,
    isUnlocked: userAchievements.includes('no_mistakes'),
    rarity: 'legendary',
    reward: '完美主义者徽章'
  },

  // === 特殊时间成就 ===
  {
    id: 'night_owl',
    title: '夜猫子',
    description: '在凌晨2-6点完成拼图',
    icon: '🦉',
    category: 'special',
    progress: userAchievements.includes('night_owl') ? 1 : 0,
    maxProgress: 1,
    isUnlocked: userAchievements.includes('night_owl'),
    rarity: 'rare',
    reward: '夜行者称号'
  },
  {
    id: 'early_bird',
    title: '早起鸟儿',
    description: '在早上5-7点完成拼图',
    icon: '🐦',
    category: 'special',
    progress: userAchievements.includes('early_bird') ? 1 : 0,
    maxProgress: 1,
    isUnlocked: userAchievements.includes('early_bird'),
    rarity: 'rare',
    reward: '晨光加成'
  },
  {
    id: 'weekend_warrior',
    title: '周末战士',
    description: '在周末完成拼图',
    icon: '🏖️',
    category: 'special',
    progress: userAchievements.includes('weekend_warrior') ? 1 : 0,
    maxProgress: 1,
    isUnlocked: userAchievements.includes('weekend_warrior'),
    rarity: 'epic',
    reward: '休闲大师称号'
  },

  // === 等级成就 ===
  {
    id: 'level_up',
    title: '等级提升',
    description: '升级到新等级',
    icon: '⬆️',
    category: 'milestone',
    progress: userLevel,
    maxProgress: userLevel,
    isUnlocked: userAchievements.includes('level_up') || userLevel > 1,
    rarity: 'common',
    reward: '解锁新功能'
  },
  {
    id: 'level_10',
    title: '十级达人',
    description: '达到10级',
    icon: '🔟',
    category: 'milestone',
    progress: Math.min(userLevel, 10),
    maxProgress: 10,
    isUnlocked: userAchievements.includes('level_10') || userLevel >= 10,
    rarity: 'rare',
    reward: '达人称号'
  },
  {
    id: 'level_25',
    title: '二十五级大师',
    description: '达到25级',
    icon: '🌟',
    category: 'milestone',
    progress: Math.min(userLevel, 25),
    maxProgress: 25,
    isUnlocked: userAchievements.includes('level_25') || userLevel >= 25,
    rarity: 'epic',
    reward: '大师光环'
  },
  {
    id: 'max_level',
    title: '满级传说',
    description: '达到50级（最高等级）',
    icon: '💫',
    category: 'milestone',
    progress: Math.min(userLevel, 50),
    maxProgress: 50,
    isUnlocked: userAchievements.includes('max_level') || userLevel >= 50,
    rarity: 'legendary',
    reward: '传说级称号'
  }
  ];
};
