import React, { useState, useEffect } from 'react';
import { Button } from '../components/common/Button';
import { musicManager, BATTLE_MUSIC_OPTIONS } from '../services/musicService';
import { themeManager, ThemeState } from '../services/themeService';
import './Settings.css';

interface SettingsProps {
  onBackToHome: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ onBackToHome }) => {
  const [musicSettings, setMusicSettings] = useState(musicManager.getSettings());
  const [themeState, setThemeState] = useState<ThemeState>(themeManager.getThemeState());
  const [themeSettings, setThemeSettings] = useState(themeManager.getSettings());
  const [showAnimation, setShowAnimation] = useState(() => {
    const saved = localStorage.getItem('showAnimation');
    return saved !== null ? JSON.parse(saved) : true; // 默认开启
  });

  // 订阅主题变化
  useEffect(() => {
    const unsubscribe = themeManager.subscribe(setThemeState);
    return unsubscribe;
  }, []);

  // 处理音乐开关变化
  const handleMusicEnabledChange = (enabled: boolean) => {
    musicManager.setEnabled(enabled);
    setMusicSettings(musicManager.getSettings());
  };

  // 处理音量变化
  const handleVolumeChange = (volume: number) => {
    musicManager.setVolume(volume / 100);
    setMusicSettings(musicManager.getSettings());
  };

  // 处理战斗音乐模式变化
  const handleBattleMusicModeChange = (mode: 'random' | 'specific') => {
    musicManager.setBattleMusicMode(mode);
    setMusicSettings(musicManager.getSettings());
  };

  // 处理指定战斗音乐变化
  const handleSpecificBattleMusicChange = (music: string) => {
    musicManager.setSpecificBattleMusic(music);
    setMusicSettings(musicManager.getSettings());
  };

  // 处理主题模式变化
  const handleThemeModeChange = (auto: boolean) => {
    themeManager.setThemeMode(auto ? 'auto' : 'manual');
    setThemeSettings(themeManager.getSettings());
  };

  // 手动切换昼夜
  const handleToggleTheme = () => {
    const newTheme = themeManager.toggleManualTheme();
    setThemeSettings(themeManager.getSettings());
    
    // 同时播放对应的大厅音乐
    musicManager.playLobbyMusic(newTheme);
  };

  // 处理动画开关变化
  const handleAnimationToggle = (enabled: boolean) => {
    setShowAnimation(enabled);
    localStorage.setItem('showAnimation', JSON.stringify(enabled));
  };

  return (
    <div 
      className="settings-page"
      style={{
        backgroundImage: `url(${themeState.backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="settings-overlay">
        <div className="settings-container">
          {/* 顶部导航 */}
          <div className="settings-header">
            <button
              onClick={onBackToHome}
              className="back-button"
            >
              ← 返回首页
            </button>
            <h1 className="settings-title">
              <span className="settings-icon">⚙️</span>
              设置
            </h1>
          </div>

          {/* 设置内容 */}
          <div className="settings-content">
            {/* 主题设置暂时隐藏 */}
            {false && (
              <div className="settings-section">
                <h2>🎨 主题设置</h2>
                <div className="setting-item">
                  <label>当前主题</label>
                  <div className="theme-preview">
                    <div className="theme-color primary"></div>
                    <div className="theme-color secondary"></div>
                    <div className="theme-color accent"></div>
                    <span>慵懒夏日淡粉色</span>
                  </div>
                </div>
              </div>
            )}

            <div className="settings-section">
              <h2>🎮 游戏设置</h2>
              <div className="setting-item">
                <label>背景音乐</label>
                <div className="setting-control">
                  <label className="toggle">
                    <input 
                      type="checkbox" 
                      checked={musicSettings.enabled}
                      onChange={(e) => handleMusicEnabledChange(e.target.checked)}
                    />
                    <span className="slider"></span>
                  </label>
                </div>
                <p className="setting-description">
                  开启/关闭背景音乐
                </p>
              </div>
              
              {musicSettings.enabled && (
                <>
                  <div className="setting-item">
                    <label>音乐音量</label>
                    <div className="setting-control">
                      <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value={Math.round(musicSettings.volume * 100)}
                        onChange={(e) => handleVolumeChange(Number(e.target.value))}
                      />
                      <span>{Math.round(musicSettings.volume * 100)}%</span>
                    </div>
                  </div>

                  <div className="setting-item">
                    <label>拼图音乐模式</label>
                    <div className="setting-control">
                      <select 
                        value={musicSettings.battleMusicMode}
                        onChange={(e) => handleBattleMusicModeChange(e.target.value as 'random' | 'specific')}
                      >
                        <option value="random">随机播放</option>
                        <option value="specific">指定曲目</option>
                      </select>
                    </div>
                    <p className="setting-description">
                      选择拼图关卡的音乐播放方式
                    </p>
                  </div>

                  {musicSettings.battleMusicMode === 'specific' && (
                    <div className="setting-item">
                      <label>指定拼图音乐</label>
                      <div className="setting-control">
                        <select 
                          value={musicSettings.specificBattleMusic}
                          onChange={(e) => handleSpecificBattleMusicChange(e.target.value)}
                        >
                          {BATTLE_MUSIC_OPTIONS.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </>
              )}

              <div className="setting-item">
                <label>自动保存</label>
                <div className="setting-control">
                  <label className="toggle">
                    <input type="checkbox" defaultChecked />
                    <span className="slider"></span>
                  </label>
                </div>
              </div>
            </div>

            <div className="settings-section">
              <h2>🌅 背景设置</h2>
              <div className="setting-item">
                <label>日夜模式</label>
                <div className="setting-control">
                  <label className="toggle">
                    <input 
                      type="checkbox" 
                      checked={themeSettings.mode === 'auto'}
                      onChange={(e) => handleThemeModeChange(e.target.checked)}
                    />
                    <span className="slider"></span>
                  </label>
                </div>
                <p className="setting-description">
                  {themeSettings.mode === 'auto' 
                    ? '根据时间自动切换日夜背景 (06:00-18:00为白天)'
                    : '手动控制日夜背景主题'
                  }
                </p>
              </div>

              <div className="setting-item">
                <label>当前主题</label>
                <div className="setting-control">
                  <span className="theme-indicator">
                    {themeState.currentTheme === 'day' ? '🌅 白天' : '🌙 夜晚'}
                  </span>
                  {themeSettings.mode === 'manual' && (
                    <button 
                      className="theme-toggle-button"
                      onClick={handleToggleTheme}
                    >
                      切换为{themeState.currentTheme === 'day' ? '夜晚' : '白天'}
                    </button>
                  )}
                </div>
                <p className="setting-description">
                  背景主题会影响首页背景图片和大厅音乐
                </p>
              </div>

              {/* 背景模糊设置暂时隐藏 */}
              {false && (
                <div className="setting-item">
                  <label>背景模糊</label>
                  <div className="setting-control">
                    <input type="range" min="0" max="10" defaultValue="3" />
                    <span>30%</span>
                  </div>
                </div>
              )}
            </div>

            <div className="settings-section">
              <h2>📱 其他设置</h2>
              <div className="setting-item">
                <label>显示动画</label>
                <div className="setting-control">
                  <label className="toggle">
                    <input 
                      type="checkbox" 
                      checked={showAnimation}
                      onChange={(e) => handleAnimationToggle(e.target.checked)}
                    />
                    <span className="slider"></span>
                  </label>
                </div>
                <p className="setting-description">
                  开启后在页面切换时会显示精美的过渡动画
                </p>
              </div>
              {/* 震动反馈暂时隐藏 */}
              {false && (
                <div className="setting-item">
                  <label>震动反馈</label>
                  <div className="setting-control">
                    <label className="toggle">
                      <input type="checkbox" defaultChecked />
                      <span className="slider"></span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* 开发中提示 */}
            <div className="settings-notice">
              <div className="notice-icon">🚧</div>
              <h3>功能开发中</h3>
              <p>部分设置功能正在开发中，敬请期待后续更新！</p>
            </div>
          </div>

          {/* 底部操作 */}
          <div className="settings-footer">
            <Button 
              onClick={onBackToHome} 
              variant="primary" 
              size="large" 
              className="back-home-button"
            >
              🏠 返回首页
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
