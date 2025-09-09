import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthState, User, LoginCredentials, RegisterCredentials, GameCompletionResult } from '../types';
import { apiService, User as ApiUser } from '../services/apiService';
import { formatApiError } from '../utils/errorFormatter';

// 转换API用户类型到内部用户类型
const convertApiUserToUser = (apiUser: ApiUser): User => {
  return {
    ...apiUser,
    createdAt: new Date(apiUser.createdAt),
    lastLoginAt: new Date(apiUser.lastLoginAt),
  };
};

interface AuthContextType {
  authState: AuthState;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  register: (credentials: RegisterCredentials) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
  updateUserRewards: (coins: number, experience: number) => Promise<boolean>;
  updateUserProfile: (updates: Partial<User>) => Promise<boolean>;
  handleGameCompletion: (result: GameCompletionResult) => Promise<boolean>;
  resetUserProgress: () => Promise<boolean>;
  setAuthenticatedUser: (user: User, token: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    isLoading: true,
    error: null,
  });

  // 添加 AuthProvider 生命周期调试
  useEffect(() => {
    console.log('🟢 AuthProvider 挂载');
    return () => {
      console.log('🟢 AuthProvider 卸载');
    };
  }, []);

  // 添加防重复提交的状态
  const [processingGameCompletion, setProcessingGameCompletion] = useState(false);

  useEffect(() => {
    // 检查是否有保存的登录状态
    const initializeAuth = async () => {
      if (apiService.isAuthenticated()) {
        try {
          const response = await apiService.getUserProfile();
          if (response.success && response.data) {
            let user = convertApiUserToUser(response.data.user);
            
            // 整合组员的头像显示修复：清理可能不属于当前用户的头像/头像框（防止不同账号互相污染）
            const owned = user.ownedItems || [];
            if (user.avatar && !/^default_/.test(user.avatar) && !(typeof user.avatar === 'string' && user.avatar.length <= 2) && !(user.avatar as string).startsWith?.('http') && !owned.includes(user.avatar)) {
              user.avatar = 'default_user';
            }
            if (user.avatarFrame && !owned.includes(user.avatarFrame)) {
              user.avatarFrame = undefined;
            }
            
            setAuthState({
              isAuthenticated: true,
              user: user,
              isLoading: false,
              error: null,
            });
            return;
          }
        } catch (error) {
          console.error('获取用户信息失败:', error);
          apiService.clearAuth();
        }
      }
      
      setAuthState(prev => ({ ...prev, isLoading: false }));
    };

    initializeAuth();
  }, []);

  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await apiService.login(credentials);
      
      if (response.success && response.data) {
        let user = convertApiUserToUser(response.data.user);
        
        // 整合组员的头像显示修复：清理头像/头像框，确保只有当前账号拥有的物品才能生效
        const owned = user.ownedItems || [];
        if (user.avatar && !/^default_/.test(user.avatar) && !(typeof user.avatar === 'string' && user.avatar.length <= 2) && !(user.avatar as string).startsWith?.('http') && !owned.includes(user.avatar)) {
          user.avatar = 'default_user';
        }
        if (user.avatarFrame && !owned.includes(user.avatarFrame)) {
          user.avatarFrame = undefined;
        }
        
        setAuthState({
          isAuthenticated: true,
          user: user,
          isLoading: false,
          error: null,
        });
        return true;
      } else {
        const errorMessage = formatApiError(
          response.error || '登录失败，请稍后重试',
          response.code,
          response.details
        );
        setTimeout(() => {
          setAuthState(prev => ({
            ...prev,
            isLoading: false,
            error: errorMessage,
          }));
        }, 0);
        return false;
      }
    } catch (error) {
      setTimeout(() => {
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: '登录失败，请稍后重试',
        }));
      }, 0);
      return false;
    }
  };

  const register = async (credentials: RegisterCredentials): Promise<boolean> => {
    console.log('开始注册流程');
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // 验证输入
      if (credentials.password !== credentials.confirmPassword) {
        console.log('密码不一致，前端验证失败');
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: '两次输入的密码不一致',
        }));
        return false;
      }

      console.log('发送注册请求到后端');
      const response = await apiService.register(credentials);
      console.log('收到后端响应:', response);
      
      if (response.success && response.data) {
        console.log('注册成功');
        setAuthState({
          isAuthenticated: true,
          user: convertApiUserToUser(response.data.user),
          isLoading: false,
          error: null,
        });
        return true;
      } else {
        console.log('注册失败，显示错误信息');
        const errorMessage = formatApiError(
          response.error || '注册失败，请稍后重试',
          response.code,
          response.details
        );
        console.log('格式化后的错误信息:', errorMessage);
        console.log('准备使用 requestAnimationFrame 延迟更新状态...');
        
        // 使用 requestAnimationFrame 确保状态更新在下一个渲染帧中执行
        requestAnimationFrame(() => {
          console.log('执行 requestAnimationFrame 状态更新');
          setAuthState(prev => ({
            ...prev,
            isLoading: false,
            error: errorMessage,
          }));
        });
        
        return false;
      }
    } catch (error) {
      console.error('注册过程中发生异常:', error);
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: '注册过程中发生错误，请稍后重试',
      }));
      return false;
    }
  };

  const logout = async () => {
    try {
      await apiService.logout();
    } catch (error) {
      console.error('登出请求失败:', error);
    } finally {
      apiService.clearAuth();
      setAuthState({
        isAuthenticated: false,
        user: null,
        isLoading: false,
        error: null,
      });
    }
  };

  const clearError = () => {
    setAuthState(prev => ({ ...prev, error: null }));
  };

  const updateUserRewards = async (coins: number, experience: number): Promise<boolean> => {
    if (!authState.isAuthenticated || !authState.user) {
      return false;
    }

    try {
      // 调用后端API更新用户奖励
      const response = await apiService.updateUserRewards(coins, experience);
      
      if (response.success) {
        // 重新获取用户数据来确保状态同步
        const userResponse = await apiService.getUserProfile();
        if (userResponse.success && userResponse.data?.user) {
          setAuthState(prev => ({
            ...prev,
            user: convertApiUserToUser(userResponse.data!.user),
          }));
        }
        return true;
      } else {
        console.error('更新用户奖励失败:', response.error);
        return false;
      }
    } catch (error) {
      console.error('更新用户奖励失败:', error);
      return false;
    }
  };

  const updateUserProfile = async (updates: Partial<User>): Promise<boolean> => {
    if (!authState.isAuthenticated || !authState.user) {
      return false;
    }

    try {
      const currentUser = authState.user;
      
      // 整合组员的头像显示修复：验证 avatar 和 avatarFrame 是否由用户拥有或为默认项
      const owned = currentUser.ownedItems || [];
      const sanitizedUpdates: Partial<User> = { ...updates };
      if (updates.avatar) {
        const av = updates.avatar as string;
        const isDefault = /^default_/.test(av) || (typeof av === 'string' && av.length <= 2) || av.startsWith('http');
        // 如果头像不是默认资源、不是emoji，也不是URL，则必须在 ownedItems 中
        if (!isDefault && !owned.includes(av)) {
          // 不允许非法设置
          delete sanitizedUpdates.avatar;
        }
      }
      if (updates.avatarFrame && !owned.includes(updates.avatarFrame as string)) {
        delete sanitizedUpdates.avatarFrame;
      }

      // 调用后端API更新用户资料，先转换类型
      const apiUpdates: Partial<ApiUser> = {
        ...sanitizedUpdates,
        createdAt: sanitizedUpdates.createdAt?.toISOString(),
        lastLoginAt: sanitizedUpdates.lastLoginAt?.toISOString(),
      };
      const response = await apiService.updateUserProfile(apiUpdates);
      
      if (response.success) {
        // 重新获取用户数据来确保状态同步
        const userResponse = await apiService.getUserProfile();
        if (userResponse.success && userResponse.data?.user) {
          setAuthState(prev => ({
            ...prev,
            user: convertApiUserToUser(userResponse.data!.user),
          }));
        }
        return true;
      } else {
        console.error('更新用户资料失败:', response.error);
        return false;
      }
    } catch (error) {
      console.error('更新用户资料失败:', error);
      return false;
    }
  };

  const handleGameCompletion = async (result: GameCompletionResult): Promise<boolean> => {
    if (!authState.isAuthenticated || !authState.user || processingGameCompletion) {
      return false;
    }

    setProcessingGameCompletion(true);

    try {
      // 调用后端 API 记录游戏完成
      const gameCompletionData = {
        puzzleName: '自定义拼图', // 默认名称，后续可以传递实际的拼图名称
        difficulty: result.difficulty,
        pieceShape: 'square' as const, // 修复类型错误，使用具体的字面量类型
        gridSize: `${Math.sqrt(result.totalPieces || 9)}x${Math.sqrt(result.totalPieces || 9)}`, // 根据总片数计算网格大小
        totalPieces: result.totalPieces || 9,
        completionTime: result.completionTime,
        moves: result.moves,
        coinsEarned: result.rewards.coins,
        experienceEarned: result.rewards.experience
      };

      const response = await apiService.recordGameCompletion(gameCompletionData);
      
      if (response.success) {
        // 检查并解锁成就
        await checkAndUnlockAchievements(result, authState.user);
        
        // 重新获取用户数据（包含更新后的金币、经验和成就）
        const userResponse = await apiService.getUserProfile();
        if (userResponse.success && userResponse.data?.user) {
          setAuthState(prev => ({
            ...prev,
            user: convertApiUserToUser(userResponse.data!.user)
          }));
        }

        return true;
      } else {
        console.error('记录游戏完成失败:', response.error);
        return false;
      }
    } catch (error) {
      console.error('处理游戏完成结果失败:', error);
      return false;
    } finally {
      setProcessingGameCompletion(false);
    }
  };


  // 重置用户进度（等级、金币、经验、成就等）
  const resetUserProgress = async (): Promise<boolean> => {
    try {
      // 调用后端API重置用户进度，如果方法不存在则使用updateUserProfile来重置
      // 首先重置用户的基本数据
      const resetData = {
        experience: 0,
        coins: 100,
        level: 1,
        gamesCompleted: 0,
        achievements: [],
        bestTimes: {},
        totalScore: 0
      };
      
      const response = await apiService.updateUserProfile(resetData);
      
      if (response.success) {
        // 重新获取用户数据来确保状态同步
        const userResponse = await apiService.getUserProfile();
        if (userResponse.success && userResponse.data?.user) {
          setAuthState(prev => ({
            ...prev,
            user: convertApiUserToUser(userResponse.data!.user),
          }));
        }
        console.log('用户进度重置成功');
        return true;
      } else {
        console.error('重置用户进度失败:', response.error);
        return false;
      }
    } catch (error) {
      console.error('重置用户进度失败:', error);
      return false;
    }
  };

  // 检查并解锁成就
  const checkAndUnlockAchievements = async (gameResult: GameCompletionResult, user: User) => {
    try {
      const achievementsToUnlock = [];

      // 检查各种成就条件
      const gamesCompleted = (user.gamesCompleted || 0) + 1;

      // 进度成就
      if (gamesCompleted === 1) {
        achievementsToUnlock.push({ achievementId: 'first_game', progress: 1 });
      }
      if (gamesCompleted === 10) {
        achievementsToUnlock.push({ achievementId: 'games_10', progress: 1 });
      }
      if (gamesCompleted === 50) {
        achievementsToUnlock.push({ achievementId: 'games_50', progress: 1 });
      }
      if (gamesCompleted === 100) {
        achievementsToUnlock.push({ achievementId: 'games_100', progress: 1 });
      }

      // 难度成就
      if (gameResult.difficulty === 'easy') {
        achievementsToUnlock.push({ achievementId: 'easy_master', progress: 1 });
      }
      if (gameResult.difficulty === 'hard') {
        achievementsToUnlock.push({ achievementId: 'hard_challenger', progress: 1 });
      }
      if (gameResult.difficulty === 'expert') {
        achievementsToUnlock.push({ achievementId: 'expert_solver', progress: 1 });
      }

      // 速度成就（假设小于60秒为快速完成）
      if (gameResult.completionTime < 60) {
        achievementsToUnlock.push({ achievementId: 'speed_demon', progress: 1 });
      }

      // 新记录成就
      if (gameResult.isNewRecord) {
        achievementsToUnlock.push({ achievementId: 'record_breaker', progress: 1 });
      }

      // 批量解锁成就
      if (achievementsToUnlock.length > 0) {
        console.log('尝试解锁成就:', achievementsToUnlock);
        const response = await apiService.batchUpdateAchievements(achievementsToUnlock);
        
        if (response.success) {
          console.log('成就解锁成功:', response.data);
        } else {
          console.error('成就解锁失败:', response.error);
        }
      }
    } catch (error) {
      console.error('检查成就时发生错误:', error);
    }
  };

  const setAuthenticatedUser = (user: User, token: string) => {
    console.log('直接设置认证用户状态');
    apiService.setToken(token);
    setAuthState({
      isAuthenticated: true,
      user: user,
      isLoading: false,
      error: null,
    });
  };

  const value: AuthContextType = {
    authState,
    login,
    register,
    logout,
    clearError,
    updateUserRewards,
    updateUserProfile,
    handleGameCompletion,
    resetUserProgress,
    setAuthenticatedUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
