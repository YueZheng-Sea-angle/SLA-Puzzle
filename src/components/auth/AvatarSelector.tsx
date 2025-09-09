import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './AvatarSelector.css';

interface AvatarSelectorProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AvatarItem {
  id: string;
  name: string;
  icon: string;
  type: 'avatar' | 'frame';
  category: 'default' | 'purchased';
}

const defaultAvatars: AvatarItem[] = [
  { id: 'default_user', name: '默认头像', icon: '👤', type: 'avatar', category: 'default' },
  { id: 'default_smile', name: '笑脸', icon: '😊', type: 'avatar', category: 'default' },
  { id: 'default_star', name: '星星', icon: '⭐', type: 'avatar', category: 'default' },
  { id: 'default_heart', name: '爱心', icon: '❤️', type: 'avatar', category: 'default' },
];

const defaultFrames: AvatarItem[] = [
  { id: 'frame_none', name: '无边框', icon: '⭕', type: 'frame', category: 'default' },
];

const purchasedAvatars: AvatarItem[] = [
  { id: 'avatar_cat', name: '可爱小猫', icon: '🐱', type: 'avatar', category: 'purchased' },
  { id: 'avatar_robot', name: '机器人', icon: '🤖', type: 'avatar', category: 'purchased' },
  { id: 'avatar_unicorn', name: '独角兽', icon: '🦄', type: 'avatar', category: 'purchased' },
  { id: 'avatar_crown', name: '皇冠头像', icon: '👑', type: 'avatar', category: 'purchased' },
];

const purchasedFrames: AvatarItem[] = [
  { id: 'decoration_frame', name: '金色边框', icon: '🖼️', type: 'frame', category: 'purchased' },
  { id: 'decoration_glow', name: '光环特效', icon: '✨', type: 'frame', category: 'purchased' },
];

export const AvatarSelector: React.FC<AvatarSelectorProps> = ({ isOpen, onClose }) => {
  const { authState, updateUserProfile } = useAuth();
  const [selectedTab, setSelectedTab] = useState<'avatar' | 'frame'>('avatar');
  const [selectedAvatar, setSelectedAvatar] = useState<string>(authState.user?.avatar || 'default_user');
  const [selectedFrame, setSelectedFrame] = useState<string>(authState.user?.avatarFrame || 'frame_none');

  if (!isOpen || !authState.user) return null;

  const user = authState.user;
  const userOwnedItems = user.ownedItems || [];

  // 过滤用户拥有的物品
  const availableAvatars = [
    ...defaultAvatars,
    ...purchasedAvatars.filter(item => userOwnedItems.includes(item.id))
  ];

  const availableFrames = [
    ...defaultFrames,
    ...purchasedFrames.filter(item => userOwnedItems.includes(item.id))
  ];

  const handleAvatarSelect = (avatarId: string) => {
    setSelectedAvatar(avatarId);
  };

  const handleFrameSelect = (frameId: string) => {
    setSelectedFrame(frameId);
  };

  const handleSave = async () => {
    try {
      // 验证所选头像是否可用
      const isAvatarValid = defaultAvatars.some(avatar => avatar.id === selectedAvatar) || 
                           (purchasedAvatars.some(avatar => avatar.id === selectedAvatar) && userOwnedItems.includes(selectedAvatar));
      
      // 验证所选边框是否可用
      const isFrameValid = defaultFrames.some(frame => frame.id === selectedFrame) || 
                          (purchasedFrames.some(frame => frame.id === selectedFrame) && userOwnedItems.includes(selectedFrame));

      if (!isAvatarValid) {
        alert('您没有权限使用此头像，请先购买！');
        return;
      }

      if (!isFrameValid) {
        alert('您没有权限使用此边框，请先购买！');
        return;
      }

      // 使用AuthContext的更新函数
      const success = await updateUserProfile({
        avatar: selectedAvatar,
        avatarFrame: selectedFrame === 'frame_none' ? undefined : selectedFrame
      });
      
      if (success) {
        onClose();
      } else {
        alert('更新头像失败，请重试');
      }
    } catch (error) {
      console.error('更新头像失败:', error);
      alert('更新头像失败，请重试');
    }
  };

  return (
    <div className="avatar-selector-overlay" onClick={onClose}>
      <div className="avatar-selector-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>自定义头像</h3>
          <button className="close-button" onClick={onClose}>✕</button>
        </div>

        <div className="modal-content">
          {/* 选项卡 */}
          <div className="selector-tabs">
            <button
              className={`tab ${selectedTab === 'avatar' ? 'active' : ''}`}
              onClick={() => setSelectedTab('avatar')}
            >
              <span className="tab-icon">👤</span>
              <span>头像</span>
            </button>
            <button
              className={`tab ${selectedTab === 'frame' ? 'active' : ''}`}
              onClick={() => setSelectedTab('frame')}
            >
              <span className="tab-icon">🖼️</span>
              <span>边框</span>
            </button>
          </div>

          {/* 选择区域 */}
          <div className="selector-content">
            {selectedTab === 'avatar' && (
              <div className="items-grid">
                {availableAvatars.map((avatar) => (
                  <button
                    key={avatar.id}
                    className={`item-card ${selectedAvatar === avatar.id ? 'selected' : ''} ${avatar.category}`}
                    onClick={() => handleAvatarSelect(avatar.id)}
                  >
                    <div className="item-icon">
                      {avatar.id === 'default_user' ? user.username.charAt(0).toUpperCase() : avatar.icon}
                    </div>
                    <div className="item-name">{avatar.name}</div>
                    {avatar.category === 'purchased' && (
                      <div className="owned-badge">已拥有</div>
                    )}
                  </button>
                ))}
                
                {purchasedAvatars.filter(item => !userOwnedItems.includes(item.id)).length > 0 && (
                  <>
                    <div className="section-divider">
                      <span>未拥有的头像</span>
                    </div>
                    {purchasedAvatars
                      .filter(item => !userOwnedItems.includes(item.id))
                      .map((avatar) => (
                        <div key={avatar.id} className="item-card locked">
                          <div className="item-icon">🔒</div>
                          <div className="item-name">{avatar.name}</div>
                          <div className="locked-badge">前往商店购买</div>
                        </div>
                      ))}
                  </>
                )}
              </div>
            )}

            {selectedTab === 'frame' && (
              <div className="items-grid">
                {availableFrames.map((frame) => (
                  <button
                    key={frame.id}
                    className={`item-card ${selectedFrame === frame.id ? 'selected' : ''} ${frame.category}`}
                    onClick={() => handleFrameSelect(frame.id)}
                  >
                    <div className="item-icon">{frame.icon}</div>
                    <div className="item-name">{frame.name}</div>
                    {frame.category === 'purchased' && (
                      <div className="owned-badge">已拥有</div>
                    )}
                  </button>
                ))}
                
                {purchasedFrames.filter(item => !userOwnedItems.includes(item.id)).length > 0 && (
                  <>
                    <div className="section-divider">
                      <span>未拥有的边框</span>
                    </div>
                    {purchasedFrames
                      .filter(item => !userOwnedItems.includes(item.id))
                      .map((frame) => (
                        <div key={frame.id} className="item-card locked">
                          <div className="item-icon">🔒</div>
                          <div className="item-name">{frame.name}</div>
                          <div className="locked-badge">前往商店购买</div>
                        </div>
                      ))}
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="cancel-button" onClick={onClose}>
            取消
          </button>
          <button className="save-button" onClick={handleSave}>
            保存更改
          </button>
        </div>
      </div>
    </div>
  );
};
