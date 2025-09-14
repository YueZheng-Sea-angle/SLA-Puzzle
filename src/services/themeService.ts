// 主题服务 - 管理背景和音乐的同步变化
import { musicManager, isDayTime } from './musicService';
import DayBackground from '../assets/background/Day.png';
import NightBackground from '../assets/background/Night.png';

export type Theme = 'day' | 'night';
export type ThemeMode = 'auto' | 'manual';

export interface ThemeState {
  currentTheme: Theme;
  mode: ThemeMode;
  backgroundImage: string;
}

// 主题变化回调类型
export type ThemeChangeCallback = (theme: ThemeState) => void;

export class ThemeManager {
  private callbacks: Set<ThemeChangeCallback> = new Set();
  private settings = {
    mode: 'auto' as ThemeMode,
    manualTheme: 'day' as Theme,
  };
  private intervalId: NodeJS.Timeout | null = null;

  constructor() {
    this.loadSettings();
    this.startAutoUpdate();
    
    // 初始化时设置data-theme属性
    if (typeof document !== 'undefined') {
      const currentTheme = this.getCurrentTheme();
      document.documentElement.setAttribute('data-theme', currentTheme);
    }
  }

  // 加载设置
  private loadSettings() {
    try {
      const saved = localStorage.getItem('themeSettings');
      if (saved) {
        this.settings = { ...this.settings, ...JSON.parse(saved) };
      }
    } catch (error) {
      console.warn('无法加载主题设置:', error);
    }
  }

  // 保存设置
  private saveSettings() {
    try {
      localStorage.setItem('themeSettings', JSON.stringify(this.settings));
    } catch (error) {
      console.warn('无法保存主题设置:', error);
    }
  }

  // 开始自动更新 (每分钟检查一次时间变化)
  private startAutoUpdate() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    
    this.intervalId = setInterval(() => {
      if (this.settings.mode === 'auto') {
        this.notifyCallbacks();
      }
    }, 60000); // 每分钟检查一次
  }

  // 停止自动更新
  private stopAutoUpdate() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  // 获取当前主题
  getCurrentTheme(): Theme {
    if (this.settings.mode === 'auto') {
      return isDayTime() ? 'day' : 'night';
    }
    return this.settings.manualTheme;
  }

  // 获取背景图片
  getBackgroundImage(theme?: Theme): string {
    const currentTheme = theme || this.getCurrentTheme();
    return currentTheme === 'day' ? DayBackground : NightBackground;
  }

  // 获取主题状态
  getThemeState(): ThemeState {
    const currentTheme = this.getCurrentTheme();
    return {
      currentTheme,
      mode: this.settings.mode,
      backgroundImage: this.getBackgroundImage(currentTheme),
    };
  }

  // 设置主题模式
  setThemeMode(mode: ThemeMode) {
    this.settings.mode = mode;
    this.saveSettings();
    
    // 同步音乐管理器的主题模式
    musicManager.setThemeMode(mode === 'auto' ? 'auto' : this.settings.manualTheme);
    
    this.notifyCallbacks();
  }

  // 手动切换主题
  toggleManualTheme(): Theme {
    if (this.settings.mode === 'auto') {
      // 如果是自动模式，先切换到手动模式
      this.settings.mode = 'manual';
      this.settings.manualTheme = this.getCurrentTheme();
    }
    
    // 切换主题
    this.settings.manualTheme = this.settings.manualTheme === 'day' ? 'night' : 'day';
    this.saveSettings();
    
    // 同步音乐管理器
    musicManager.setThemeMode(this.settings.manualTheme);
    
    this.notifyCallbacks();
    return this.settings.manualTheme;
  }

  // 设置手动主题
  setManualTheme(theme: Theme) {
    this.settings.manualTheme = theme;
    if (this.settings.mode === 'manual') {
      this.saveSettings();
      musicManager.setThemeMode(theme);
      this.notifyCallbacks();
    }
  }

  // 注册主题变化回调
  subscribe(callback: ThemeChangeCallback): () => void {
    this.callbacks.add(callback);
    
    // 立即调用一次回调，提供当前状态
    callback(this.getThemeState());
    
    // 返回取消订阅函数
    return () => {
      this.callbacks.delete(callback);
    };
  }

  // 通知所有回调
  private notifyCallbacks() {
    const themeState = this.getThemeState();
    this.callbacks.forEach(callback => {
      try {
        callback(themeState);
      } catch (error) {
        console.warn('主题回调执行失败:', error);
      }
    });
    
    // 设置HTML元素的data-theme属性，用于CSS变量切换
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', themeState.currentTheme);
    }
  }

  // 获取设置
  getSettings() {
    return { ...this.settings };
  }

  // 销毁管理器
  destroy() {
    this.stopAutoUpdate();
    this.callbacks.clear();
  }
}

// 全局主题管理器实例
export const themeManager = new ThemeManager();
