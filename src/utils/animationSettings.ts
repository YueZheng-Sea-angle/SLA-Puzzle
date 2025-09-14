/**
 * 动画设置工具函数
 */

export const getAnimationEnabled = (): boolean => {
  const saved = localStorage.getItem('showAnimation');
  return saved !== null ? JSON.parse(saved) : true; // 默认开启
};

export const setAnimationEnabled = (enabled: boolean): void => {
  localStorage.setItem('showAnimation', JSON.stringify(enabled));
};

export const shouldShowTransitionAnimation = (): boolean => {
  return getAnimationEnabled();
};
