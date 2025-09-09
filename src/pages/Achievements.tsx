import React, { useState } from 'react';
import { Button } from '../components/common/Button';
import { useAuth } from '../contexts/AuthContext';
import { createAchievements } from '../data/achievementsData';
import './Achievements.css';

interface AchievementPageProps {
  onBackToMenu: () => void;
}

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

export const Achievements: React.FC<AchievementPageProps> = ({ onBackToMenu }) => {
  const { authState } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  const user = authState.user;

  // 从后端获取成就数据，整合组员的优化逻辑
  React.useEffect(() => {
    const fetchAchievements = async () => {
      try {
        const { apiService } = await import('../services/apiService');
        const response = await apiService.getAchievements();
        
        if (response.success && response.data) {
          // 转换后端数据格式为前端格式
          const formattedAchievements: Achievement[] = response.data.achievements.map((achievement: any) => ({
            id: achievement.id,
            title: achievement.title,
            description: achievement.description,
            icon: achievement.icon,
            category: achievement.category,
            progress: achievement.progress,
            maxProgress: achievement.maxProgress,
            isUnlocked: achievement.isUnlocked,
            unlockedAt: achievement.unlockedAt ? new Date(achievement.unlockedAt) : undefined,
            rarity: achievement.rarity,
            reward: achievement.rewardCoins > 0 || achievement.rewardExperience > 0 
              ? `金币 +${achievement.rewardCoins} 经验 +${achievement.rewardExperience}`
              : undefined
          }));
          
          setAchievements(formattedAchievements);
        } else {
          console.error('获取成就数据失败:', response.error);
          // 如果后端失败，回退到本地数据，使用组员优化的成就数据系统
          const { createAchievements } = await import('../data/achievementsData');
          const localAchievements = createAchievements({
            gamesCompleted: user?.gamesCompleted || 0,
            achievements: user?.achievements || [],
            level: user?.level || 1,
            experience: user?.experience || 0,
            coins: user?.coins || 0,
            totalScore: user?.totalScore || 0,
            bestTimes: user?.bestTimes || {},
            recentGameResults: (user as any)?.recentGameResults || [],
            difficultyStats: (user as any)?.difficultyStats || {
              easyCompleted: 0,
              mediumCompleted: 0,
              hardCompleted: 0,
              expertCompleted: 0,
            }
          });
          setAchievements(localAchievements);
        }
      } catch (error) {
        console.error('获取成就数据时发生错误:', error);
        // 回退到本地数据，使用组员优化的成就数据系统
        const { createAchievements } = await import('../data/achievementsData');
        const localAchievements = createAchievements({
          gamesCompleted: user?.gamesCompleted || 0,
          achievements: user?.achievements || [],
          level: user?.level || 1,
          experience: user?.experience || 0,
          coins: user?.coins || 0,
          totalScore: user?.totalScore || 0,
          bestTimes: user?.bestTimes || {},
          recentGameResults: (user as any)?.recentGameResults || [],
          difficultyStats: (user as any)?.difficultyStats || {
            easyCompleted: 0,
            mediumCompleted: 0,
            hardCompleted: 0,
            expertCompleted: 0,
          }
        });
        setAchievements(localAchievements);
      } finally {
        setLoading(false);
      }
    };

    if (authState.isAuthenticated) {
      fetchAchievements();
    }
  }, [authState.isAuthenticated, user]);

  const categories = [
    { id: 'all', label: '全部', icon: '🏆' },
    { id: 'progress', label: '进度成就', icon: '🧩' },
    { id: 'performance', label: '表现成就', icon: '⚡' },
    { id: 'milestone', label: '里程碑', icon: '🎯' },
    { id: 'special', label: '特殊成就', icon: '⭐' },
    { id: 'social', label: '社交成就', icon: '👥' },
    { id: 'technical', label: '技术成就', icon: '🔧' }
  ];

  const filteredAchievements = selectedCategory === 'all' 
    ? achievements 
    : achievements.filter(a => a.category === selectedCategory);

  const unlockedCount = achievements.filter(a => a.isUnlocked).length;
  const totalCount = achievements.length;

  const getRarityColor = (rarity: Achievement['rarity']) => {
    const colors = {
      common: '#6b7280',
      rare: '#3b82f6',
      epic: '#8b5cf6',
      legendary: '#f59e0b'
    };
    return colors[rarity];
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="achievements-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>加载成就数据中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="achievements-page">
      <div className="achievements-header">
        <div className="header-left">
          <Button onClick={onBackToMenu} variant="secondary" size="medium">
            ← 返回菜单
          </Button>
          <h1>🏆 成就系统</h1>
        </div>
        
        <div className="achievements-stats">
          <div className="stat-item">
            <span className="stat-value">{unlockedCount}</span>
            <span className="stat-label">已解锁</span>
          </div>
          <div className="stat-divider">/</div>
          <div className="stat-item">
            <span className="stat-value">{totalCount}</span>
            <span className="stat-label">总数</span>
          </div>
          <div className="progress-ring">
            <div 
              className="progress-fill"
              style={{ 
                '--progress': `${(unlockedCount / totalCount) * 100}%` 
              } as React.CSSProperties}
            />
            <span className="progress-text">{Math.round((unlockedCount / totalCount) * 100)}%</span>
          </div>
        </div>
      </div>

      <div className="achievements-content">
        <div className="category-tabs">
          {categories.map(category => (
            <button
              key={category.id}
              className={`category-tab ${selectedCategory === category.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category.id)}
            >
              <span className="category-icon">{category.icon}</span>
              <span className="category-label">{category.label}</span>
              <span className="category-count">
                {category.id === 'all' 
                  ? achievements.length 
                  : achievements.filter(a => a.category === category.id).length
                }
              </span>
            </button>
          ))}
        </div>

        <div className="achievements-grid">
          {filteredAchievements.map((achievement) => (
            <div 
              key={achievement.id} 
              className={`achievement-card ${achievement.isUnlocked ? 'unlocked' : 'locked'}`}
            >
              <div className="achievement-header">
                {/* 这里可以放图标和稀有度等 */}
              </div>
              <div className="achievement-content">
                <h3 className={`achievement-title ${achievement.isUnlocked ? 'unlocked-text' : 'locked-text'}`}>
                  {achievement.title}
                </h3>
                <p className="achievement-description">{achievement.description}</p>
                {typeof achievement.progress === 'number' && typeof achievement.maxProgress === 'number' && achievement.maxProgress > 1 && (
                  <div className="achievement-progress-bar">
                    <div className="progress-info">
                      <span className="progress-text">进度：</span>
                      <span className="progress-numbers">{achievement.progress} / {achievement.maxProgress}</span>
                      <span className="progress-percentage">{Math.floor((achievement.progress / achievement.maxProgress) * 100)}%</span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${Math.min(100, (achievement.progress / achievement.maxProgress) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                )}
                {achievement.reward && (
                  <div className="achievement-reward">
                    <span className="reward-label">奖励：</span>
                    <span className="reward-text">{achievement.reward}</span>
                  </div>
                )}
                {achievement.isUnlocked && achievement.unlockedAt && (
                  <div className="unlock-date">
                    解锁于 {formatDate(achievement.unlockedAt)}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredAchievements.length === 0 && (
          <div className="no-achievements">
            <div className="empty-state">
              <div className="empty-icon">🏆</div>
              <h3>暂无成就</h3>
              <p>该分类下还没有成就，继续游戏来解锁更多成就吧！</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
