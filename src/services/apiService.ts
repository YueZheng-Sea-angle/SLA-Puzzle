/**
 * 后端API服务
 * 用于与拼图大师后端服务器通信
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  details?: any; // 用于存储验证错误详情
}

export interface User {
  id: string;
  username: string;
  email?: string;
  avatar?: string;
  avatarFrame?: string;
  level: number;
  experience: number;
  coins: number;
  totalScore: number;
  gamesCompleted: number;
  totalPlayTime: number;
  createdAt: string;
  lastLoginAt: string;
  ownedItems?: string[];
  achievements?: string[];
  bestTimes?: Record<string, number>;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  email?: string;
  password: string;
  confirmPassword: string;
}

export interface GameCompletionData {
  puzzleName?: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  pieceShape: 'square' | 'triangle' | 'irregular';
  gridSize: string;
  totalPieces: number;
  completionTime: number;
  moves: number;
  coinsEarned?: number;
  experienceEarned?: number;
}

export interface PuzzleConfigData {
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  gridSize: string;
  imageName?: string;
  imageData?: string;
}

export interface RoomPlayer {
  userId: string;
  username: string;
  status: 'joined' | 'ready' | 'playing' | 'finished' | 'disconnected';
  isHost: boolean;
  completionTime?: number;
  movesCount: number;
  joinedAt: string;
  readyAt?: string;
  finishedAt?: string;
}

export interface MultiplayerRoom {
  id: string;
  roomCode: string;
  roomName: string;
  hostUserId: string;
  maxPlayers: number;
  currentPlayers: number;
  status: 'waiting' | 'ready' | 'playing' | 'finished' | 'closed';
  puzzleConfig: PuzzleConfigData;
  createdAt: string;
  gameStartedAt?: string;
  gameFinishedAt?: string;
  players: RoomPlayer[];
}

export interface MultiplayerGameRecord {
  id: string;
  roomCode: string;
  gameMode: 'versus' | 'cooperative';
  totalPlayers: number;
  winnerUsername?: string;
  isWinner: boolean;
  gameDuration: number;
  puzzleDifficulty: 'easy' | 'medium' | 'hard' | 'expert';
  puzzleGridSize: string;
  myCompletionTime?: number;
  myMovesCount: number;
  myRank: number;
  finishedAt: string;
}

class ApiService {
  private baseURL: string;
  private token: string | null = null;

  constructor() {
    // 从环境变量或配置文件获取API基础URL
    // 使用云端服务器作为默认API地址
    this.baseURL = import.meta.env.VITE_API_BASE_URL || 'https://api.sla.edev.uno/api';

    // 从localStorage获取保存的token
    this.token = localStorage.getItem('puzzle_auth_token');
  }

  /**
   * 设置认证token
   */
  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('puzzle_auth_token', token);
    } else {
      localStorage.removeItem('puzzle_auth_token');
    }
  }

  /**
   * 获取认证token
   */
  getToken(): string | null {
    return this.token;
  }

  /**
   * 通用HTTP请求方法
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>,
    };

    // 添加认证头
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || '请求失败',
          code: data.code,
          details: data.details,
        };
      }

      return data;
    } catch (error) {
      console.error('API请求错误:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '网络错误',
        code: 'NETWORK_ERROR',
      };
    }
  }

  /**
   * 用户注册
   */
  async register(credentials: RegisterCredentials): Promise<ApiResponse<{ token: string; user: User }>> {
    const response = await this.request<{ token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.success && response.data && response.data.token) {
      this.setToken(response.data.token);
    }

    return response;
  }

  /**
   * 用户登录
   */
  async login(credentials: LoginCredentials): Promise<ApiResponse<{ token: string; user: User }>> {
    const response = await this.request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.success && response.data && response.data.token) {
      this.setToken(response.data.token);
    }

    return response;
  }

  /**
   * 用户登出
   */
  async logout(): Promise<ApiResponse<void>> {
    const response = await this.request<void>('/auth/logout', {
      method: 'POST',
    });

    // 无论服务器响应如何，都清除本地token
    this.setToken(null);

    return response;
  }

  /**
   * 获取用户信息
   */
  async getUserProfile(): Promise<ApiResponse<{ user: User }>> {
    return this.request<{ user: User }>('/auth/profile');
  }

  /**
   * 更新用户资料
   */
  async updateUserProfile(updates: Partial<User>): Promise<ApiResponse<void>> {
    return this.request<void>('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  /**
   * 获取用户统计信息
   */
  async getUserStats(): Promise<ApiResponse<any>> {
    return this.request('/users/stats');
  }

  /**
   * 更新用户奖励
   */
  async updateUserRewards(coins: number, experience: number): Promise<ApiResponse<any>> {
    return this.request('/users/rewards', {
      method: 'POST',
      body: JSON.stringify({ coins, experience }),
    });
  }

  /**
   * 获取用户拥有的物品
   */
  async getOwnedItems(): Promise<ApiResponse<any>> {
    return this.request('/users/owned-items');
  }

  /**
   * 获得新物品
   */
  async acquireItem(itemType: string, itemId: string, cost: number = 0): Promise<ApiResponse<any>> {
    return this.request('/users/acquire-item', {
      method: 'POST',
      body: JSON.stringify({ itemType, itemId, cost }),
    });
  }

  /**
   * 获取所有成就
   */
  async getAchievements(): Promise<ApiResponse<any>> {
    return this.request('/achievements');
  }

  /**
   * 获取用户成就
   */
  async getUserAchievements(): Promise<ApiResponse<any>> {
    return this.request('/achievements/user');
  }

  /**
   * 解锁成就
   */
  async unlockAchievement(achievementId: string, progress: number = 1): Promise<ApiResponse<any>> {
    return this.request('/achievements/unlock', {
      method: 'POST',
      body: JSON.stringify({ achievementId, progress }),
    });
  }

  /**
   * 批量更新成就
   */
  async batchUpdateAchievements(achievements: Array<{ achievementId: string; progress: number }>): Promise<ApiResponse<any>> {
    return this.request('/achievements/batch-update', {
      method: 'POST',
      body: JSON.stringify({ achievements }),
    });
  }

  /**
   * 记录游戏完成
   */
  async recordGameCompletion(gameData: GameCompletionData): Promise<ApiResponse<any>> {
    return this.request('/games/complete', {
      method: 'POST',
      body: JSON.stringify(gameData),
    });
  }

  /**
   * 获取游戏历史
   */
  async getGameHistory(page: number = 1, limit: number = 20, filters?: any): Promise<ApiResponse<any>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters,
    });

    return this.request(`/games/history?${params}`);
  }

  /**
   * 获取排行榜
   */
  async getLeaderboard(filters?: any): Promise<ApiResponse<any>> {
    const params = new URLSearchParams(filters || {});
    return this.request(`/games/leaderboard?${params}`);
  }

  /**
   * 获取游戏统计
   */
  async getGameStats(): Promise<ApiResponse<any>> {
    return this.request('/games/stats');
  }

  /**
   * 创建联机对战房间
   */
  async createMultiplayerRoom(roomData: {
    roomName: string;
    puzzleConfig: PuzzleConfigData;
    maxPlayers?: number;
  }): Promise<ApiResponse<{ room: MultiplayerRoom }>> {
    return this.request('/multiplayer/rooms', {
      method: 'POST',
      body: JSON.stringify(roomData),
    });
  }

  /**
   * 通过房间代码加入房间
   */
  async joinRoom(roomCode: string): Promise<ApiResponse<{ room: MultiplayerRoom }>> {
    return this.request('/multiplayer/rooms/join', {
      method: 'POST',
      body: JSON.stringify({ roomCode }),
    });
  }

  /**
   * 获取房间信息
   */
  async getRoomInfo(roomCode: string): Promise<ApiResponse<{ room: MultiplayerRoom }>> {
    return this.request(`/multiplayer/rooms/${roomCode}`);
  }

  /**
   * 设置玩家准备状态
   */
  async setPlayerReady(roomCode: string): Promise<ApiResponse<{ room: MultiplayerRoom }>> {
    return this.request(`/multiplayer/rooms/${roomCode}/ready`, {
      method: 'POST',
    });
  }

  /**
   * 房主开始游戏
   */
  async startMultiplayerGame(roomCode: string): Promise<ApiResponse<{ room: MultiplayerRoom }>> {
    return this.request(`/multiplayer/rooms/${roomCode}/start`, {
      method: 'POST',
    });
  }

  /**
   * 完成联机游戏
   */
  async finishMultiplayerGame(roomCode: string, gameData: {
    completionTime: number;
    movesCount: number;
  }): Promise<ApiResponse<{ gameEnded: boolean; room: MultiplayerRoom }>> {
    return this.request(`/multiplayer/rooms/${roomCode}/finish`, {
      method: 'POST',
      body: JSON.stringify(gameData),
    });
  }

  /**
   * 离开房间
   */
  async leaveRoom(roomCode: string): Promise<ApiResponse<{ message: string }>> {
    return this.request(`/multiplayer/rooms/${roomCode}/leave`, {
      method: 'POST',
    });
  }

  /**
   * 重置房间状态（游戏结束后重新开始）
   */
  async resetRoom(roomCode: string): Promise<ApiResponse<{ room: MultiplayerRoom }>> {
    return this.request(`/multiplayer/rooms/${roomCode}/reset`, {
      method: 'POST',
    });
  }

  /**
   * 获取多人游戏历史记录
   */
  async getMultiplayerHistory(page: number = 1, limit: number = 10): Promise<ApiResponse<{
    records: MultiplayerGameRecord[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    return this.request(`/multiplayer/history?${params}`);
  }

  /**
   * 健康检查
   */
  async healthCheck(): Promise<ApiResponse<any>> {
    return this.request('/health');
  }

  /**
   * 检查是否已登录
   */
  isAuthenticated(): boolean {
    return !!this.token;
  }

  /**
   * 清除认证信息
   */
  clearAuth(): void {
    this.setToken(null);
  }
}

// 创建单例实例
export const apiService = new ApiService();


// 移除原有的cloudStorage接口，确保所有数据交互都通过API完成
// 不再使用localStorage作为回退方案，所有数据操作都必须通过数据库完成

