import React, { useState } from 'react';
import { Button } from '../components/common/Button';
import './Achievements.css';

interface AchievementPageProps {
  onBackToMenu: () => void;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'puzzle' | 'time' | 'skill' | 'special';
  progress: number;
  maxProgress: number;
  isUnlocked: boolean;
  unlockedAt?: Date;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  reward?: string;
}

export const Achievements: React.FC<AchievementPageProps> = ({ onBackToMenu }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // 模拟成就数据
  const achievements: Achievement[] = [
    {
      id: 'first-puzzle',
      title: '初次尝试',
      description: '完成你的第一个拼图',
      icon: '🎯',
      category: 'puzzle',
      progress: 1,
      maxProgress: 1,
      isUnlocked: true,
      unlockedAt: new Date('2024-01-15'),
      rarity: 'common',
      reward: '经验值 +10'
    },
    {
      id: 'speed-demon',
      title: '速度恶魔',
      description: '在3分钟内完成一个4×4拼图',
      icon: '⚡',
      category: 'time',
      progress: 0,
      maxProgress: 1,
      isUnlocked: false,
      rarity: 'rare',
      reward: '称号：闪电手'
    },
    {
      id: 'puzzle-master',
      title: '拼图大师',
      description: '完成100个拼图',
      icon: '👑',
      category: 'puzzle',
      progress: 23,
      maxProgress: 100,
      isUnlocked: false,
      rarity: 'epic',
      reward: '解锁特殊边框'
    },
    {
      id: 'perfect-score',
      title: '完美表现',
      description: '不使用提示完成一个6×6拼图',
      icon: '💎',
      category: 'skill',
      progress: 0,
      maxProgress: 1,
      isUnlocked: false,
      rarity: 'legendary',
      reward: '特殊头像框'
    },
    {
      id: 'daily-warrior',
      title: '每日战士',
      description: '连续7天完成每日挑战',
      icon: '🔥',
      category: 'special',
      progress: 3,
      maxProgress: 7,
      isUnlocked: false,
      rarity: 'rare',
      reward: '每日奖励翻倍'
    },
    {
      id: 'collector',
      title: '收藏家',
      description: '制作10个自定义拼图',
      icon: '🎨',
      category: 'special',
      progress: 1,
      maxProgress: 10,
      isUnlocked: false,
      rarity: 'epic',
      reward: '额外素材库'
    }
  ];

  const categories = [
    { id: 'all', label: '全部', icon: '🏆' },
    { id: 'puzzle', label: '拼图挑战', icon: '🧩' },
    { id: 'time', label: '速度挑战', icon: '⏱️' },
    { id: 'skill', label: '技巧挑战', icon: '🎯' },
    { id: 'special', label: '特殊成就', icon: '⭐' }
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
              <span className="tab-icon">{category.icon}</span>
              <span className="tab-label">{category.label}</span>
              <span className="tab-count">
                {category.id === 'all' 
                  ? achievements.length 
                  : achievements.filter(a => a.category === category.id).length
                }
              </span>
            </button>
          ))}
        </div>

        <div className="achievements-grid">
          {filteredAchievements.map(achievement => (
            <div 
              key={achievement.id}
              className={`achievement-card ${achievement.isUnlocked ? 'unlocked' : 'locked'}`}
              style={{ 
                '--rarity-color': getRarityColor(achievement.rarity) 
              } as React.CSSProperties}
            >
              <div className="achievement-header">
                <div className="achievement-icon">
                  {achievement.isUnlocked ? achievement.icon : '🔒'}
                </div>
                <div className="rarity-badge" data-rarity={achievement.rarity}>
                  {achievement.rarity === 'common' && '普通'}
                  {achievement.rarity === 'rare' && '稀有'}
                  {achievement.rarity === 'epic' && '史诗'}
                  {achievement.rarity === 'legendary' && '传奇'}
                </div>
              </div>

              <div className="achievement-content">
                <h3 className="achievement-title">{achievement.title}</h3>
                <p className="achievement-description">{achievement.description}</p>
                
                {!achievement.isUnlocked && achievement.maxProgress > 1 && (
                  <div className="achievement-progress">
                    <div className="progress-bar">
                      <div 
                        className="progress-fill"
                        style={{ width: `${(achievement.progress / achievement.maxProgress) * 100}%` }}
                      />
                    </div>
                    <span className="progress-text">
                      {achievement.progress} / {achievement.maxProgress}
                    </span>
                  </div>
                )}

                {achievement.reward && (
                  <div className="achievement-reward">
                    <span className="reward-label">🎁 奖励:</span>
                    <span className="reward-text">{achievement.reward}</span>
                  </div>
                )}

                {achievement.isUnlocked && achievement.unlockedAt && (
                  <div className="unlocked-info">
                    <span className="unlocked-date">
                      📅 {formatDate(achievement.unlockedAt)}
                    </span>
                  </div>
                )}
              </div>

              {achievement.isUnlocked && (
                <div className="achievement-status">
                  <span className="status-badge unlocked">✓ 已解锁</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredAchievements.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">🏆</div>
            <h3>暂无成就</h3>
            <p>该分类下还没有成就，继续努力游戏解锁更多成就吧！</p>
          </div>
        )}
      </div>

      <div className="achievements-tips">
        <h4>💡 成就提示</h4>
        <div className="tips-grid">
          <div className="tip-item">
            <span className="tip-icon">🎯</span>
            <span className="tip-text">完成更多拼图来解锁拼图挑战成就</span>
          </div>
          <div className="tip-item">
            <span className="tip-icon">⚡</span>
            <span className="tip-text">提高游戏速度来获得时间挑战成就</span>
          </div>
          <div className="tip-item">
            <span className="tip-icon">🎨</span>
            <span className="tip-text">使用拼图编辑器制作自定义拼图</span>
          </div>
          <div className="tip-item">
            <span className="tip-icon">🔥</span>
            <span className="tip-text">每日坚持挑战来获得连击成就</span>
          </div>
        </div>
      </div>
    </div>
  );
};
