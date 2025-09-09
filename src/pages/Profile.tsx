import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getLevelProgress } from '../utils/experienceSystem';
import { AvatarSelector } from '../components/auth/AvatarSelector';
import { Button } from '../components/common/Button';
import { createAchievements } from '../data/achievementsData';
import './Profile.css';

interface ProfilePageProps {
  onBackToMenu: () => void;
}

// 头像映射
const avatarMap: Record<string, string> = {
  'default_user': '👤',
  'default_smile': '😊',
  'default_star': '⭐',
  'default_heart': '❤️',
  'avatar_cat': '🐱',
  'avatar_robot': '🤖',
  'avatar_unicorn': '🦄',
  'avatar_crown': '👑',
};

export const Profile: React.FC<ProfilePageProps> = ({ onBackToMenu }) => {
  const { authState, logout, resetUserProgress } = useAuth();
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  if (!authState.isAuthenticated || !authState.user) {
    return (
      <div className="profile-page">
        <div className="profile-error">
          <h2>用户未登录</h2>
          <Button onClick={onBackToMenu}>返回菜单</Button>
        </div>
      </div>
    );
  }

  const user = authState.user;
  const levelProgress = getLevelProgress(user.level, user.experience);

  const handleLogout = () => {
    logout();
    onBackToMenu();
  };

  const handleResetConfirm = async () => {
    setIsResetting(true);
    try {
      const success = await resetUserProgress();
      if (success) {
        alert('账号进度重置成功！等级、金币、经验已重置到初始状态。');
      } else {
        alert('重置失败，请重试。');
      }
    } catch (error) {
      console.error('重置过程出错:', error);
      alert('重置过程出现错误，请重试。');
    } finally {
      setIsResetting(false);
      setShowResetConfirm(false);
    }
  };

  const handleResetCancel = () => {
    setShowResetConfirm(false);
  };

  const renderAvatar = () => {
    const owned = user.ownedItems || [];
    // 如果是默认头像（id 以 default_ 开头），直接渲染
    if (user.avatar && /^default_/.test(user.avatar) && avatarMap[user.avatar]) {
      return <span className="avatar-emoji">{avatarMap[user.avatar]}</span>;
    }
    // 如果是商店购买头像，需校验 owned
    if (user.avatar && avatarMap[user.avatar]) {
      if (!owned.includes(user.avatar)) {
        return <span className="avatar-emoji">{avatarMap['default_user']}</span>;
      }
      return <span className="avatar-emoji">{avatarMap[user.avatar]}</span>;
    }
    // 如果是直接的emoji字符串（兼容旧数据）
    if (user.avatar && user.avatar.length <= 2) {
      return <span className="avatar-emoji">{user.avatar}</span>;
    }
    // 如果是图片URL
    if (user.avatar && user.avatar.startsWith('http')) {
      return <img src={user.avatar} alt={user.username} />;
    }
    // 默认显示用户名首字母
    return <span>{user.username.charAt(0).toUpperCase()}</span>;
  };

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="header-left">
          <Button onClick={onBackToMenu} variant="secondary" size="medium">
            ← 返回菜单
          </Button>
          <h1>👤 个人资料</h1>
        </div>
      </div>

      <div className="profile-content">
        <div className="profile-card">
          {/* 头像区域 */}
          <div className="avatar-section">
            <div 
              className={`profile-avatar ${user.avatarFrame && (user.ownedItems || []).includes(user.avatarFrame) ? 'with-frame' : ''}`}
              onClick={() => setShowAvatarSelector(true)}
            >
              {renderAvatar()}
            </div>
            <button
              className="change-avatar-btn"
              onClick={() => setShowAvatarSelector(true)}
            >
              更换头像
            </button>
          </div>

          {/* 用户信息区域 */}
          <div className="user-info-section">
            <h2 className="username">{user.username}</h2>
            
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-icon">💰</div>
                <div className="stat-content">
                  <div className="stat-value">{(user.coins || 0).toLocaleString()}</div>
                  <div className="stat-label">金币</div>
                </div>
              </div>
              
              <div className="stat-item">
                <div className="stat-icon">🏆</div>
                <div className="stat-content">
                  <div className="stat-value">{user.level || 1}</div>
                  <div className="stat-label">等级</div>
                </div>
              </div>
              
              <div className="stat-item">
                <div className="stat-icon">⭐</div>
                <div className="stat-content">
                  <div className="stat-value">{user.experience || 0}</div>
                  <div className="stat-label">经验</div>
                </div>
              </div>
              
              <div className="stat-item">
                <div className="stat-icon">🎮</div>
                <div className="stat-content">
                  <div className="stat-value">{user.gamesCompleted || 0}</div>
                  <div className="stat-label">完成游戏</div>
                </div>
              </div>
            </div>

            {/* 经验进度条 */}
            <div className="level-progress-section">
              <div className="progress-info">
                <span className="progress-label">距离下一级</span>
                <span className="progress-text">{levelProgress.expToNext} 经验</span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${levelProgress.progressPercentage}%` }}
                ></div>
              </div>
              <div className="progress-percentage">{levelProgress.progressPercentage.toFixed(1)}%</div>
            </div>
          </div>
        </div>

        {/* 成就区域 */}
        <div className="achievements-section">
          <h3>🏆 我的成就</h3>
          <div className="achievements-grid">
            {user.achievements && user.achievements.length > 0 ? (
              user.achievements.map((achievementId, index) => {
                const allAchievements = createAchievements({
                  gamesCompleted: user.gamesCompleted || 0,
                  achievements: user.achievements || [],
                  level: user.level || 1,
                  experience: user.experience || 0,
                  coins: user.coins || 0,
                  totalScore: user.totalScore || 0,
                  bestTimes: user.bestTimes,
                  recentGameResults: (user as any).recentGameResults || [],
                  difficultyStats: (user as any).difficultyStats || {
                    easyCompleted: 0,
                    mediumCompleted: 0,
                    hardCompleted: 0,
                    expertCompleted: 0,
                  }
                });
                const found = allAchievements.find((a: any) => a.id === achievementId);
                return (
                  <div key={index} className="achievement-item">
                    <span className="achievement-icon">{found ? found.icon : '🏆'}</span>
                    <span className="achievement-name">{found ? found.title : achievementId}</span>
                  </div>
                );
              })
            ) : (
              <div className="no-achievements">
                <span className="empty-icon">🎯</span>
                <p>还没有获得成就，继续努力吧！</p>
              </div>
            )}
          </div>
        </div>

        {/* 操作按钮区域 */}
        <div className="actions-section">
          <button 
            className="action-btn reset-btn" 
            onClick={() => setShowResetConfirm(true)}
          >
            <span>🔄</span>
            重置进度
          </button>
          <button 
            className="action-btn logout-btn" 
            onClick={handleLogout}
          >
            <span>🚪</span>
            退出登录
          </button>
        </div>
      </div>

      {/* 重置确认对话框 */}
      {showResetConfirm && (
        <div className="reset-confirm-overlay">
          <div className="reset-confirm-dialog">
            <h3>⚠️ 确认重置进度</h3>
            <p>您确定要重置账号进度吗？此操作将会：</p>
            <ul>
              <li>等级重置为 1 级</li>
              <li>经验重置为 0</li>
              <li>金币重置为 100</li>
              <li>清空所有成就</li>
              <li>清空最佳时间记录</li>
              <li>重置游戏完成次数</li>
            </ul>
            <p style={{ color: '#ff6b6b', fontWeight: 'bold' }}>
              此操作不可撤销！
            </p>
            <div className="reset-confirm-buttons">
              <button 
                className="reset-cancel-btn" 
                onClick={handleResetCancel}
                disabled={isResetting}
              >
                取消
              </button>
              <button 
                className="reset-confirm-btn" 
                onClick={handleResetConfirm}
                disabled={isResetting}
              >
                {isResetting ? '重置中...' : '确认重置'}
              </button>
            </div>
          </div>
        </div>
      )}

      <AvatarSelector
        isOpen={showAvatarSelector}
        onClose={() => setShowAvatarSelector(false)}
      />
    </div>
  );
};
