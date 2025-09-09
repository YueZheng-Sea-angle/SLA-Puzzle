import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getLevelProgress } from '../../utils/experienceSystem';
import { AvatarSelector } from './AvatarSelector';
import './UserProfile.css';

interface UserProfileProps {
  onOpenShop?: () => void;
  onOpenProfile?: () => void;
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

export const UserProfile: React.FC<UserProfileProps> = ({ onOpenShop, onOpenProfile }) => {
  const { authState, logout, resetUserProgress } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // 如果正在加载，显示加载状态
  if (authState.isLoading) {
    return (
      <div className="user-profile">
        <div className="user-profile-header">
          <div className="user-avatar">
            <span>⏳</span>
          </div>
        </div>
      </div>
    );
  }

  // 如果未认证，不显示
  if (!authState.isAuthenticated || !authState.user) {
    return null;
  }

  const user = authState.user;
  const levelProgress = getLevelProgress(user.level, user.experience);

  const handleLogout = () => {
    logout();
    setShowDropdown(false);
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
      setShowDropdown(false);
    }
  };

  const handleResetCancel = () => {
    setShowResetConfirm(false);
  };

  const handleAvatarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowAvatarSelector(true);
    setShowDropdown(false);
  };

  const handleShopClick = () => {
    if (onOpenShop) {
      onOpenShop();
    }
    setShowDropdown(false);
  };

  const handleProfileClick = () => {
    if (onOpenProfile) {
      onOpenProfile();
    }
    setShowDropdown(false);
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
    <div className="user-profile">
      <div className="user-profile-header">
        <div 
          className={`user-avatar ${user.avatarFrame && (user.ownedItems || []).includes(user.avatarFrame) ? 'with-frame' : ''}`}
          onClick={handleAvatarClick}
          title="点击更改头像"
        >
          {renderAvatar()}
        </div>
        <button
          className="user-profile-button"
          onClick={() => setShowDropdown(!showDropdown)}
        >
          <span className="user-name">{user.username}</span>
          <span className="dropdown-arrow">▼</span>
        </button>
      </div>

      {showDropdown && (
        <div className="user-dropdown">
          <div className="user-info">
            <div className="user-info-item">
              <span className="label">💰 金币:</span>
              <span className="value coins">{(user.coins || 0).toLocaleString()}</span>
            </div>
            <div className="user-info-item">
              <span className="label">⭐ 经验:</span>
              <span className="value experience">{user.experience || 0}</span>
            </div>
            <div className="user-info-item">
              <span className="label">🏆 等级:</span>
              <span className="value level">{user.level || 1}</span>
            </div>
            <div className="level-progress">
              <div className="progress-info">
                <span className="progress-text">距离下一级: {levelProgress.expToNext} 经验</span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${levelProgress.progressPercentage}%` }}
                ></div>
              </div>
            </div>
            <div className="user-info-divider"></div>
            <div className="user-info-item">
              <span className="label">完成游戏:</span>
              <span className="value">{user.gamesCompleted || 0}</span>
            </div>
          </div>
          <div className="dropdown-divider"></div>
          {onOpenProfile && (
            <button className="dropdown-item profile-button" onClick={handleProfileClick}>
              <span>👤</span>
              个人资料
            </button>
          )}
          {onOpenShop && (
            <button className="dropdown-item shop-button" onClick={handleShopClick}>
              <span>🛒</span>
              进入商店
            </button>
          )}
          <button 
            className="dropdown-item reset-button" 
            onClick={() => setShowResetConfirm(true)}
            style={{ color: '#ff6b6b' }}
          >
            <span>🔄</span>
            重置进度
          </button>
          <button className="dropdown-item logout-button" onClick={handleLogout}>
            <span>🚪</span>
            退出登录
          </button>
        </div>
      )}

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

      {showDropdown && (
        <div
          className="dropdown-overlay"
          onClick={() => setShowDropdown(false)}
        ></div>
      )}

      <AvatarSelector
        isOpen={showAvatarSelector}
        onClose={() => setShowAvatarSelector(false)}
      />
    </div>
  );
};
