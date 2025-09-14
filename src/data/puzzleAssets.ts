/**
 * 拼图素材配置
 * 包含可用于联机对战的预设拼图
 */

export interface PuzzleAsset {
  id: string;
  name: string;
  imagePath: string;
  category: 'nature' | 'animals' | 'architecture' | 'art' | 'volcanic_journey' | 'test_style';
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  description: string;
  tags: string[];
}

// 预设拼图素材 (使用实际存在的SVG文件)
export const puzzleAssets: PuzzleAsset[] = [
  // Logo类别
  {
    id: 'tauri_logo',
    name: 'Tauri Logo',
    imagePath: '/tauri.svg',
    category: 'art',
    difficulty: 'easy',
    description: 'Tauri框架官方标志',
    tags: ['Logo', '科技', '框架']
  },
  {
    id: 'vite_logo',
    name: 'Vite Logo',
    imagePath: '/vite.svg',
    category: 'art',
    difficulty: 'easy',
    description: 'Vite构建工具标志',
    tags: ['Logo', '开发', '工具']
  },
  {
    id: 'react_logo',
    name: 'React Logo',
    imagePath: '/react.svg',
    category: 'art',
    difficulty: 'medium',
    description: 'React前端框架标志',
    tags: ['Logo', 'React', '前端']
  },
  
  // 自然风光
  {
    id: 'bit',
    name: '北理工',
    imagePath: '/images/nature/BIT.jpg',
    category: 'nature',
    difficulty: 'medium',
    description: '北京理工大学的美丽校园风光',
    tags: ['大学', '校园', '教育', '建筑']
  },
  {
    id: 'white_lake_snow',
    name: '北湖雪',
    imagePath: '/images/nature/WhiteLake_Snow.jpg',
    category: 'nature',
    difficulty: 'hard',
    description: '北湖雪景，银装素裹的美丽景色',
    tags: ['雪景', '湖泊', '冬季', '自然']
  },
  {
    id: 'liangting',
    name: '北湖凉亭',
    imagePath: '/images/nature/liangting.jpg',
    category: 'nature',
    difficulty: 'medium',
    description: '北湖边的古典凉亭，宁静雅致',
    tags: ['凉亭', '湖泊', '古典', '建筑']
  },
  
  // 动物
  {
    id: 'snowbao',
    name: '诡异雪豹',
    imagePath: '/images/animals/snowbao.jpg',
    category: 'animals',
    difficulty: 'hard',
    description: '神秘的雪豹，散发着诡异的气息',
    tags: ['雪豹', '野生动物', '神秘', '雪地']
  },
  
  // 建筑
  {
    id: 'shengbide_cathedral',
    name: '圣彼得大教堂',
    imagePath: '/images/buildings/shengbidecathedral.jpg',
    category: 'architecture',
    difficulty: 'expert',
    description: '宏伟的圣彼得大教堂，建筑艺术的杰作',
    tags: ['教堂', '宗教', '建筑', '艺术', '历史']
  },
  
  // 动漫角色
  
  // 测试图片
  {
    id: 'test1',
    name: '森林花园',
    imagePath: '/images/test1.svg',
    category: 'nature',
    difficulty: 'medium',
    description: '美丽的森林花园场景',
    tags: ['花园', '森林', '美景']
  },
  {
    id: 'test2',
    name: '黄昏日落',
    imagePath: '/images/test2.svg',
    category: 'nature',
    difficulty: 'hard',
    description: '温暖的黄昏日落',
    tags: ['黄昏', '日落', '温暖']
  },
  {
    id: 'test3',
    name: '玫瑰花园',
    imagePath: '/images/test3.svg',
    category: 'nature',
    difficulty: 'easy',
    description: '浪漫的玫瑰花园',
    tags: ['玫瑰', '花园', '浪漫']
  },

  // 火山旅梦系列
  {
    id: 'misty_memory_day',
    name: 'MistyMemory_Day',
    imagePath: '/images/SolongAdele/MistyMemory_Day.png',
    category: 'volcanic_journey',
    difficulty: 'hard',
    description: '火山旅梦CG回顾：白昼雾忆',
    tags: ['火山旅梦', 'CG', '回顾']
  },
  {
    id: 'misty_memory_night',
    name: 'MistyMemory_Night',
    imagePath: '/images/SolongAdele/MistyMemory_Night.png',
    category: 'volcanic_journey',
    difficulty: 'hard',
    description: '火山旅梦CG回顾：夜晚雾忆',
    tags: ['火山旅梦', 'CG', '回顾']
  },
  {
    id: 'ill_miss_you',
    name: 'I\'llMissYou',
    imagePath: '/images/SolongAdele/I\'llMissYou.png',
    category: 'volcanic_journey',
    difficulty: 'medium',
    description: '火山旅梦CG回顾',
    tags: ['火山旅梦', 'CG', '回顾']
  },
  {
    id: 'in_the_night',
    name: 'InTheNight',
    imagePath: '/images/SolongAdele/InTheNight.png',
    category: 'volcanic_journey',
    difficulty: 'medium',
    description: '火山旅梦CG回顾',
    tags: ['火山旅梦', 'CG', '回顾']
  },
  {
    id: 'sing_with_me',
    name: 'SingWithMe',
    imagePath: '/images/SolongAdele/SingWithMe.png',
    category: 'volcanic_journey',
    difficulty: 'easy',
    description: '火山旅梦CG回顾',
    tags: ['火山旅梦', 'CG', '回顾']
  },
  {
    id: 'rain_rain_go_away',
    name: 'RainRainGoAway',
    imagePath: '/images/SolongAdele/RainRainGoAway.png',
    category: 'volcanic_journey',
    difficulty: 'medium',
    description: '火山旅梦CG回顾',
    tags: ['火山旅梦', 'CG', '回顾']
  },
  {
    id: 'enjoy_summer',
    name: 'EnjoySummer',
    imagePath: '/images/SolongAdele/EnjoySummer.png',
    category: 'volcanic_journey',
    difficulty: 'easy',
    description: '火山旅梦CG回顾',
    tags: ['火山旅梦', 'CG', '回顾']
  },
  {
    id: 'last_not_last',
    name: 'LastNotLast',
    imagePath: '/images/SolongAdele/LastNotLast.png',
    category: 'volcanic_journey',
    difficulty: 'expert',
    description: '火山旅梦CG回顾',
    tags: ['火山旅梦', 'CG', '回顾']
  },
  {
    id: 'so_long_adele',
    name: 'SoLongAdele',
    imagePath: '/images/SolongAdele/SoLongAdele.png',
    category: 'volcanic_journey',
    difficulty: 'expert',
    description: '火山旅梦CG回顾',
    tags: ['火山旅梦', 'CG', '回顾']
  },
  {
    id: 'dancing_in_the_lava',
    name: 'DancingInTheLava',
    imagePath: '/images/SolongAdele/DancingInTheLava.png',
    category: 'volcanic_journey',
    difficulty: 'expert',
    description: '火山旅梦CG回顾',
    tags: ['火山旅梦', 'CG', '回顾']
  },

  // 测试画风
  {
    id: 'landscape1',
    name: '山景风光',
    imagePath: '/images/nature/landscape1.svg',
    category: 'test_style',
    difficulty: 'medium',
    description: '美丽的山景风光',
    tags: ['山景', '风景', '自然']
  },
  {
    id: 'landscape2',
    name: '日落海景',
    imagePath: '/images/nature/landscape2.svg',
    category: 'test_style',
    difficulty: 'hard',
    description: '壮丽的落日海景',
    tags: ['海景', '落日', '浪漫']
  },
  {
    id: 'landscape3',
    name: '森林风光',
    imagePath: '/images/nature/landscape3.svg',
    category: 'test_style',
    difficulty: 'hard',
    description: '茂密的森林风光',
    tags: ['森林', '绿色', '自然']
  },
  {
    id: 'cat',
    name: '可爱小猫',
    imagePath: '/images/animals/cat.svg',
    category: 'test_style',
    difficulty: 'easy',
    description: '萌萌的小猫咪',
    tags: ['猫咪', '萌宠', '可爱']
  },
  {
    id: 'castle',
    name: '古典建筑',
    imagePath: '/images/buildings/castle.svg',
    category: 'test_style',
    difficulty: 'expert',
    description: '古典的城堡建筑',
    tags: ['城堡', '建筑', '历史']
  },
  {
    id: 'character',
    name: '动漫角色',
    imagePath: '/images/anime/character.svg',
    category: 'test_style',
    difficulty: 'medium',
    description: '可爱的动漫角色',
    tags: ['动漫', '角色', '艺术']
  }
];

// 根据难度获取拼图
export const getPuzzlesByDifficulty = (difficulty: 'easy' | 'medium' | 'hard' | 'expert'): PuzzleAsset[] => {
  return puzzleAssets.filter(puzzle => puzzle.difficulty === difficulty);
};

// 根据类别获取拼图
export const getPuzzlesByCategory = (category: string): PuzzleAsset[] => {
  return puzzleAssets.filter(puzzle => puzzle.category === category);
};

// 获取随机拼图
export const getRandomPuzzle = (): PuzzleAsset => {
  const randomIndex = Math.floor(Math.random() * puzzleAssets.length);
  return puzzleAssets[randomIndex];
};

// 根据ID获取拼图
export const getPuzzleById = (id: string): PuzzleAsset | undefined => {
  return puzzleAssets.find(puzzle => puzzle.id === id);
};

// 获取所有类别
export const getAllCategories = (): string[] => {
  return Array.from(new Set(puzzleAssets.map(puzzle => puzzle.category)));
};

// 获取所有难度
export const getAllDifficulties = (): string[] => {
  return ['easy', 'medium', 'hard', 'expert'];
};

// 难度标签映射
export const difficultyLabels = {
  easy: '简单',
  medium: '中等',
  hard: '困难',
  expert: '专家'
};

// 类别标签映射
export const categoryLabels = {
  nature: '自然风光',
  animals: '动物世界',
  architecture: '建筑艺术',
  art: '艺术作品',
  volcanic_journey: '火山旅梦',
  test_style: '测试画风'
};
