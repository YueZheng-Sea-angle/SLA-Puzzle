import React, { useEffect, useState } from 'react';
import './SummerAnimation.css';

interface SummerAnimationProps {
  isVisible: boolean;
  onComplete?: () => void;
  title?: string;
  subtitle?: string;
  description?: string;
}

export const SummerAnimation: React.FC<SummerAnimationProps> = ({
  isVisible,
  onComplete,
  title = "拼图大师",
  subtitle = "欢迎来到",
  description = "享受清爽夏日时光"
}) => {
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShowAnimation(true);
      
      // 2.5秒后完成动画
      const timer = setTimeout(() => {
        setShowAnimation(false);
        onComplete?.();
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [isVisible, onComplete]);

  if (!isVisible && !showAnimation) return null;

  return (
    <div className={`summer-animation-overlay ${showAnimation ? 'active' : 'fade-out'}`}>
      {/* 汽水瓶 */}
      <div className="soda-bottle">
        <div className="bottle-body">
          <div className="bottle-label">🥤</div>
          <div className="bottle-sparkle"></div>
        </div>
        <div className="bottle-cap"></div>
      </div>

      {/* 气泡效果 */}
      <div className="bubbles-container">
        {Array.from({ length: 15 }, (_, i) => (
          <div 
            key={i} 
            className="bubble" 
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 1000}ms`,
              animationDuration: `${800 + Math.random() * 400}ms`
            }}
          >
            ✨
          </div>
        ))}
      </div>

      {/* 闪光效果 */}
      <div className="sparkles-container">
        {Array.from({ length: 20 }, (_, i) => (
          <div 
            key={i} 
            className="sparkle" 
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 1000}ms`,
              animationDuration: `${600 + Math.random() * 800}ms`
            }}
          >
            ⭐
          </div>
        ))}
      </div>

      {/* 中心文字效果 */}
      <div className="center-text">
        <div className="welcome-text">{subtitle}</div>
        <div className="game-title">{title}</div>
        <div className="subtitle">{description}</div>
      </div>
    </div>
  );
};
