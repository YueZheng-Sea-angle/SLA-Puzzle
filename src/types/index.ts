// 拼图块数据结构
export interface PuzzlePiece {
  id: string;
  originalIndex: number; // 原始编号 (0-8, 0-15, 0-24, 0-35)
  currentSlot: number | null; // 当前所在答题卡槽位，null表示在处理区
  correctSlot: number; // 正确的槽位编号
  rotation: number; // 旋转角度 (0, 90, 180, 270)
  isFlipped: boolean; // 是否翻转
  imageData: string; // base64 或路径
  width: number;
  height: number;
  shape: PieceShape;
  triangleType?: 'upper' | 'lower'; // 三角形类型，仅当shape为triangle时有效
}

// 拼图形状类型
export type PieceShape = 'square' | 'triangle' | 'irregular';

// 拼图配置
export interface PuzzleConfig {
  id: string;
  name: string;
  originalImage: string;
  gridSize: { rows: number; cols: number };
  pieceShape: PieceShape;
  difficulty: DifficultyLevel;
  pieces: PuzzlePiece[];
  createdAt: Date;
  updatedAt: Date;
}

// 难度等级
export type DifficultyLevel = 'easy' | 'medium' | 'hard' | 'expert';

// 游戏状态
export interface GameState {
  config: PuzzleConfig;
  startTime: Date;
  endTime?: Date;
  moves: number;
  isCompleted: boolean;
  elapsedTime: number;
  history: GameMove[];
  answerGrid: (PuzzlePiece | null)[]; // 答题卡网格，存储每个槽位的拼图块
}

// 游戏操作
export interface GameMove {
  id: string;
  pieceId: string;
  action: 'place' | 'remove' | 'rotate' | 'flip' | 'replace';
  fromSlot?: number | null; // 从哪个槽位移动（null表示从处理区）
  toSlot?: number | null; // 移动到哪个槽位（null表示移回处理区）
  replacedPieceId?: string; // 被替换的拼图块ID（仅用于replace操作）
  timestamp: Date;
}

// 素材数据
export interface Asset {
  id: string;
  name: string;
  category: string;
  tags: string[];
  filePath: string;
  thumbnail: string;
  width: number;
  height: number;
  fileSize: number;
  createdAt: Date;
}

// 排行榜记录
export interface LeaderboardEntry {
  id: string;
  puzzleId: string;
  puzzleName: string; // 拼图名称，便于显示
  playerName: string;
  completionTime: number; // 秒
  moves: number;
  difficulty: DifficultyLevel;
  pieceShape: PieceShape; // 拼图形状
  gridSize: string; // 网格大小，如"3x3"
  completedAt: Date;
}

// 编辑器状态
export interface EditorState {
  currentAsset?: Asset;
  gridSize: { rows: number; cols: number };
  pieceShape: PieceShape;
  previewPieces: PuzzlePiece[];
  isGenerating: boolean;
}

// API 响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// Tauri 命令参数类型
export interface CreatePuzzleParams {
  imagePath: string;
  gridSize: { rows: number; cols: number };
  pieceShape: PieceShape;
  name: string;
}

export interface SaveGameParams {
  gameState: GameState;
}

export interface LoadGameParams {
  gameId: string;
}

// 用户相关类型
export interface User {
  id: string;
  username: string;
  avatar?: string;
  avatarFrame?: string; // 头像框
  createdAt: Date;
  lastLoginAt: Date;
  level: number;
  experience: number; // 当前经验值
  coins: number; // 金币数量
  totalScore: number;
  gamesCompleted: number;
  achievements?: string[]; // 已解锁的成就ID列表
  bestTimes?: Record<string, number>; // 各难度最佳时间记录
  ownedItems?: string[]; // 拥有的商店物品ID列表
  recentGameResults?: Array<{
    moves: number;
    totalPieces: number;
    timestamp: Date;
  }>; // 最近游戏结果，用于连续成就追踪
}

// 奖励类型
export interface GameReward {
  coins: number;
  experience: number;
  achievements?: Achievement[];
}

// 成就类型
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'progress' | 'performance' | 'special' | 'milestone';
  unlocked: boolean;
  unlockedAt?: Date;
}

// 游戏完成结果
export interface GameCompletionResult {
  completionTime: number;
  moves: number;
  difficulty: DifficultyLevel;
  isNewRecord: boolean;
  totalPieces?: number; // 总拼图块数，用于成就计算
  rewards: GameReward;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  password: string;
  confirmPassword: string;
}