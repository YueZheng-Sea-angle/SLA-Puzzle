import React, { useState, useEffect } from 'react';
import { UserProfile } from '../components/auth/UserProfile';
import { SummerAnimation } from '../components/common/SummerAnimation';
import { themeManager, ThemeState } from '../services/themeService';
import { musicManager } from '../services/musicService';
import { shouldShowTransitionAnimation } from '../utils/animationSettings';
import '../styles/HomePage.css';

interface HomePageProps {
  onOpenSinglePlayer: () => void;
  onOpenMultiplayer: () => void;
  onOpenEditor: () => void;
  onOpenSettings: () => void;
  onOpenProfile: () => void;
  onOpenShop: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onOpenSinglePlayer,
  onOpenMultiplayer,
  onOpenEditor,
  onOpenSettings,
  onOpenProfile,
  onOpenShop
}) => {
  const [themeState, setThemeState] = useState<ThemeState>(themeManager.getThemeState());
  const [showAnimation, setShowAnimation] = useState(false);
  const [animationType, setAnimationType] = useState<'single' | 'multiplayer' | 'editor' | null>(null);

  useEffect(() => {
    // 订阅主题变化
    const unsubscribe = themeManager.subscribe(setThemeState);
    
    // 播放大厅音乐
    musicManager.playLobbyMusic();
    
    // 清理函数
    return () => {
      unsubscribe();
      // 注意：不在这里停止音乐，因为可能需要在其他页面继续播放
    };
  }, []);

  // 处理进入单人游戏
  const handleOpenSinglePlayer = () => {
    if (shouldShowTransitionAnimation()) {
      setAnimationType('single');
      setShowAnimation(true);
    } else {
      onOpenSinglePlayer();
    }
  };

  // 处理进入多人对战
  const handleOpenMultiplayer = () => {
    if (shouldShowTransitionAnimation()) {
      setAnimationType('multiplayer');
      setShowAnimation(true);
    } else {
      onOpenMultiplayer();
    }
  };

  // 处理进入拼图编辑器
  const handleOpenEditor = () => {
    if (shouldShowTransitionAnimation()) {
      setAnimationType('editor');
      setShowAnimation(true);
    } else {
      onOpenEditor();
    }
  };

  // 动画完成后的回调
  const handleAnimationComplete = () => {
    setShowAnimation(false);
    setAnimationType(null);
    
    switch (animationType) {
      case 'single':
        onOpenSinglePlayer();
        break;
      case 'multiplayer':
        onOpenMultiplayer();
        break;
      case 'editor':
        onOpenEditor();
        break;
    }
  };

  return (
    <div 
      className="home-page"
      style={{
        backgroundImage: `url(${themeState.backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="home-overlay">
        {/* 用户头像区域 */}
        <div className="home-user-profile">
          <UserProfile onOpenShop={onOpenShop} onOpenProfile={onOpenProfile} />
        </div>
        
        <div className="home-container">
          {/* 游戏标题 */}
          <div className="home-header">
            <h1 className="home-title">
              <span className="home-icon">🧩</span>
              拼图大师
            </h1>
            <p className="home-subtitle">慵懒夏日，轻松拼图</p>
          </div>

          {/* 主要功能区域 */}
          <div className="home-menu">
            <div className="menu-grid">
              <button 
                className="menu-item"
                onClick={handleOpenSinglePlayer}
              >
                <div className="menu-icon">🎯</div>
                <div className="menu-text">
                  <h3>单人游戏</h3>
                  <p>享受独自解谜的乐趣</p>
                </div>
              </button>

              <button 
                className="menu-item"
                onClick={handleOpenMultiplayer}
              >
                <div className="menu-icon">⚔️</div>
                <div className="menu-text">
                  <h3>多人对战</h3>
                  <p>与朋友一起竞技</p>
                </div>
              </button>

              <button 
                className="menu-item"
                onClick={handleOpenEditor}
              >
                <div className="menu-icon">🎨</div>
                <div className="menu-text">
                  <h3>拼图编辑器</h3>
                  <p>创造属于你的拼图</p>
                </div>
              </button>

              <button 
                className="menu-item"
                onClick={onOpenSettings}
              >
                <div className="menu-icon">⚙️</div>
                <div className="menu-text">
                  <h3>设置</h3>
                  <p>个性化你的游戏体验</p>
                </div>
              </button>
            </div>
          </div>

          {/* 底部装饰 */}
          <div className="home-footer">
            <div className="decorative-elements">
              <span className="summer-icon">🌸</span>
              <span className="summer-icon">🌺</span>
              <span className="summer-icon">🌸</span>
            </div>
          </div>
        </div>
      </div>

      {/* 夏日动画效果 */}
      <SummerAnimation 
        isVisible={showAnimation} 
        onComplete={handleAnimationComplete}
        title={
          animationType === 'single' ? "SLA 爱之歌" :
          animationType === 'multiplayer' ? "SLA-EX 常青树" :
          animationType === 'editor' ? "SLA-S 答案在风中" :
          "拼图大师"
        }
        subtitle="欢迎来到"
        description={
          animationType === 'single' ? "此生挚爱，爱如火山。" :
          animationType === 'multiplayer' ? "往事长青，一见如旧。" :
          animationType === 'editor' ? "火山屹立，沙滩安歇，大海回归......我们无法视而不见。" :
          "享受清爽夏日时光"
        }
      />
    </div>
  );
};
