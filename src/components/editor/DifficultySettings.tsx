import React, { useState, useEffect } from 'react';
import { Button } from '../common/Button';
import { DifficultyLevel, PieceShape } from '../../types';
import './DifficultySettings.css';

interface DifficultySettingsProps {
  onComplete: (difficulty: DifficultyLevel, pieceShape: PieceShape, customRows?: number, customCols?: number) => void;
  onBack: () => void;
  onPreviewClick?: () => void;
  hasPreviewImage?: boolean;
  selectedDifficulty: DifficultyLevel;
  selectedShape: PieceShape;
  onDifficultyChange: (difficulty: DifficultyLevel) => void;
  onShapeChange: (shape: PieceShape) => void;
  onRecrop?: () => void; // 新增：重新剪裁回调
  hasUploadedImage?: boolean; // 新增：是否有已上传图片
  onCustomGridChange?: (rows: number, cols: number) => void; // 新增：自定义网格更新回调
  aspectRatio?: '1:1' | '16:9'; // 新增：画幅比例信息
}

export const DifficultySettings: React.FC<DifficultySettingsProps> = ({
  onComplete,
  onBack,
  onPreviewClick,
  hasPreviewImage,
  selectedDifficulty,
  selectedShape,
  onDifficultyChange,
  onShapeChange,
  onRecrop,
  hasUploadedImage,
  onCustomGridChange,
  aspectRatio = '1:1' // 默认1:1
}) => {
  const [customRows, setCustomRows] = useState('3');
  const [customCols, setCustomCols] = useState('3');
  const [showCustomInputs, setShowCustomInputs] = useState(false);

  // 检查是否为16:9比例且选择了非方形拼块
  const is16x9WithNonSquareShape = aspectRatio === '16:9' && selectedShape !== 'square';

  // 当选择自定义难度时显示输入框
  useEffect(() => {
    setShowCustomInputs(selectedDifficulty === 'custom');
  }, [selectedDifficulty]);

  // 处理形状选择，如果是16:9比例且选择非方形，则提示并阻止选择
  const handleShapeChange = (shape: PieceShape) => {
    if (aspectRatio === '16:9' && shape !== 'square') {
      alert('功能尚不完善，暂时封锁：16:9画幅比例目前仅支持方形拼块');
      return;
    }
    onShapeChange(shape);
  };

  // 基础难度选项
  const baseDifficultyOptions = [
    {
      value: 'easy' as DifficultyLevel,
      label: '简单',
      grid: '3×3',
      pieces: 9,
      color: '#10b981',
      icon: '😊'
    },
    {
      value: 'medium' as DifficultyLevel,
      label: '中等',
      grid: '4×4',
      pieces: 16,
      color: 'var(--primary-pink)',
      icon: '🤔'
    },
    {
      value: 'hard' as DifficultyLevel,
      label: '困难',
      grid: '5×5',
      pieces: 25,
      color: '#f59e0b',
      icon: '😤'
    },
    {
      value: 'expert' as DifficultyLevel,
      label: '专家',
      grid: '6×6',
      pieces: 36,
      color: '#ef4444',
      icon: '🔥'
    },
    {
      value: 'custom' as DifficultyLevel,
      label: '自定义',
      grid: '自定义',
      pieces: 0,
      color: '#8b5cf6',
      icon: '⚙️'
    }
  ];

  // 根据形状调整拼块数量
  const difficultyOptions = baseDifficultyOptions.map(option => {
    let pieces = option.pieces;
    if (selectedShape === 'triangle' && option.value !== 'custom') {
      pieces = pieces * 2;
    }
    return { ...option, pieces };
  });

  const shapeOptions = [
    {
      value: 'square' as PieceShape,
      label: '方形拼块',
      icon: '⬜',
      description: '经典方形，简单直观',
      preview: '/images/shapes/square-preview.svg',
      difficulty: '简单'
    },
    {
      value: 'triangle' as PieceShape,
      label: '三角拼块',
      icon: '🔺',
      description: '三角形状，增加趣味性',
      preview: '/images/shapes/triangle-preview.svg',
      difficulty: '中等',
      disabled: aspectRatio === '16:9' // 16:9时禁用
    },
    {
      value: 'irregular' as PieceShape,
      label: '异形拼块',
      icon: '🧩',
      description: '传统拼图形状，更有挑战',
      preview: '/images/shapes/irregular-preview.svg',
      difficulty: '困难',
      comingSoon: true,
      disabled: aspectRatio === '16:9' // 16:9时禁用
    },
    {
      value: 'tetris' as PieceShape,
      label: '俄罗斯方块',
      icon: '🟦🟦🟦',
      description: '经典俄罗斯方块拼图，挑战空间感',
      preview: '/images/shapes/tetris-preview.svg',
      difficulty: '专家',
      disabled: aspectRatio === '16:9' // 16:9时禁用
    }
  ];

  const handleComplete = () => {
    if (is16x9WithNonSquareShape) {
      alert('功能尚不完善，暂时封锁：16:9画幅比例目前仅支持方形拼块');
      return;
    }
    
    if (selectedDifficulty === 'custom') {
      const rows = parseInt(customRows);
      const cols = parseInt(customCols);
      if (rows >= 2 && rows <= 10 && cols >= 2 && cols <= 10) {
        onComplete('custom', selectedShape, rows, cols);
      } else {
        alert('请输入有效的行数和列数（2-10之间）');
      }
    } else {
      onComplete(selectedDifficulty, selectedShape);
    }
  };

  const handleCustomGridChange = () => {
    const rows = parseInt(customRows);
    const cols = parseInt(customCols);
    if (rows >= 2 && rows <= 10 && cols >= 2 && cols <= 10) {
      // 更新配置并关闭自定义设置面板
      setShowCustomInputs(false);
      // 这里可以添加其他配置更新逻辑
      console.log(`自定义网格已更新: ${rows}×${cols}`);
    } else {
      alert('请输入有效的行数和列数（2-10之间）');
    }
  };

  const getCurrentGridSize = () => {
    if (selectedDifficulty === 'custom') {
      const rows = parseInt(customRows);
      const cols = parseInt(customCols);
      return `${rows}×${cols}`;
    }
    
    const option = difficultyOptions.find(d => d.value === selectedDifficulty);
    return option?.grid || '3×3';
  };

  const getCurrentPieceCount = () => {
    if (selectedDifficulty === 'custom') {
      const rows = parseInt(customRows);
      const cols = parseInt(customCols);
      let pieces = rows * cols;
      if (selectedShape === 'triangle') {
        pieces = pieces * 2;
      }
      return pieces;
    }
    
    const option = difficultyOptions.find(d => d.value === selectedDifficulty);
    return option?.pieces || 9;
  };

  return (
  <div className="difficulty-settings" style={{ transform: 'translateX(-150px)' }}>
      <div className="settings-section">
        <h3>🎯 选择难度等级</h3>
        <p className="section-description">
          选择适合您的拼图难度，不同难度将生成不同数量的拼块
        </p>
        
        <div className="difficulty-grid">
          {difficultyOptions.map((option) => {
            // 解析 grid 字符串为 m 和 n
            let gridDisplay = option.grid;
            if (option.value !== 'custom') {
              const gridMatch = option.grid.match(/(\d+)×(\d+)/);
              gridDisplay = option.grid + ' 网格';
              if (selectedShape === 'triangle' && gridMatch) {
                const m = gridMatch[1];
                const n = gridMatch[2];
                gridDisplay = `${m}×${n}×2 网格`;
              }
            }
            
            return (
              <button
                key={option.value}
                className={`difficulty-card ${selectedDifficulty === option.value ? 'selected' : ''}`}
                onClick={() => onDifficultyChange(option.value)}
                style={{ '--accent-color': option.color, minWidth: 160, maxWidth: 200, width: 'auto', padding: '8px 4px', boxSizing: 'border-box' } as React.CSSProperties}
              >
                <div className="card-header">
                  <span className="difficulty-icon">{option.icon}</span>
                  <div className="difficulty-info">
                    <h4>{option.label}</h4>
                    <span className="grid-size">{gridDisplay}</span>
                  </div>
                </div>
                <div className="card-body">
                  <div className="difficulty-stats">
                    <div className="stat-item">
                      <span className="stat-label">拼块数量</span>
                      <span className="stat-value">
                        {option.value === 'custom' 
                          ? (selectedDifficulty === 'custom' ? getCurrentPieceCount() + '块' : '自定义')
                          : option.pieces + '块'
                        }
                      </span>
                    </div>
                  </div>
                </div>
                <div className="card-footer">
                  <div className={`selection-indicator ${selectedDifficulty === option.value ? 'active' : ''}`}>
                    {selectedDifficulty === option.value ? '✓ 已选择' : '点击选择'}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* 自定义形状选项 - 当选择自定义时自动显示 */}
        {showCustomInputs && (
          <div className="custom-shape-section" style={{ 
            marginTop: '6px', 
            padding: '5px', 
            border: '2px solid #8b5cf6', 
            borderRadius: '12px',
            background: 'linear-gradient(135deg, color-mix(in srgb, #8b5cf6 5%, white), white)',
            animation: 'fadeIn 0.3s ease-in'
          }}>
            {/* 新增：重新剪裁图片按钮 */}
            {hasUploadedImage && onRecrop && (
              <div style={{ margin: '12px 0 0 0', textAlign: 'right' }}>
                <Button
                  onClick={onRecrop}
                  variant="secondary"
                  size="small"
                  className="recrop-btn"
                >
                  ✂️ 重新剪裁图片
                </Button>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h4 style={{ margin: 0, fontSize: '18px', color: '#1f2937', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#8b5cf6' }}>⚙️</span>
                自定义网格设置
              </h4>
              <button
                onClick={() => setShowCustomInputs(false)}
                style={{
                  padding: '6px 12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  background: 'white',
                  color: '#6b7280',
                  fontWeight: '500',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                收起
              </button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', alignItems: 'end' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
                  行数 (2-10)
                </label>
                <input
                  type="number"
                  min="2"
                  max="10"
                  value={customRows}
                  onChange={(e) => setCustomRows(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '16px',
                    transition: 'border-color 0.2s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#8b5cf6'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
                  列数 (2-10)
                </label>
                <input
                  type="number"
                  min="2"
                  max="10"
                  value={customCols}
                  onChange={(e) => setCustomCols(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '16px',
                    transition: 'border-color 0.2s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#8b5cf6'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>
              
              <div>
                <button
                  onClick={handleCustomGridChange}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: 'none',
                    borderRadius: '8px',
                    background: '#8b5cf6',
                    color: 'white',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontSize: '16px',
                    transition: 'background-color 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#7c3aed'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#8b5cf6'}
                >
                  更新配置
                </button>
              </div>
            </div>
            
            <div style={{ 
              marginTop: '16px', 
              padding: '16px', 
              background: '#f8fafc', 
              borderRadius: '8px',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <strong style={{ color: '#374151', fontSize: '14px' }}>网格尺寸:</strong>
                  <span style={{ color: '#8b5cf6', fontWeight: '600', fontSize: '16px', marginLeft: '8px' }}>
                    {customRows}×{customCols}
                  </span>
                </div>
                <div>
                  <strong style={{ color: '#374151', fontSize: '14px' }}>拼块总数:</strong>
                  <span style={{ color: '#8b5cf6', fontWeight: '600', fontSize: '16px', marginLeft: '8px' }}>
                    {getCurrentPieceCount()}块
                  </span>
                </div>
              </div>
              {selectedShape === 'triangle' && (
                <div style={{ marginTop: '8px', fontSize: '14px', color: '#64748b' }}>
                  <span style={{ color: '#f59e0b' }}>⚠️</span> 三角拼块模式下，实际拼块数量为网格大小的2倍
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="settings-section">
        <h3>🎨 选择拼块形状</h3>
        <p className="section-description">
          不同的拼块形状将带来不同的游戏体验和视觉效果
        </p>
        
        <div className="shape-grid shape-grid-horizontal">
          {shapeOptions.map((option) => (
            <button
              key={option.value}
              className={`shape-card ${selectedShape === option.value ? 'selected' : ''} ${option.disabled ? 'disabled' : ''}`}
              onClick={() => handleShapeChange(option.value)}
              disabled={option.disabled}
            >
              <div className="shape-header">
                <span className="shape-icon">{option.icon}</span>
                <h4>{option.label}</h4>
              </div>
              {/* 形状预览已移除 */}
              <div className="shape-details">
                <p className="shape-description">{option.description}</p>
                <div className="shape-meta">
                  <span className="difficulty-badge" data-difficulty={option.difficulty.toLowerCase()}>
                    难度: {option.difficulty}
                  </span>
                  {option.disabled && (
                    <span className="disabled-badge" style={{color: '#ef4444', fontSize: '12px', marginLeft: '8px'}}>
                      ⚠️ 16:9时不可用
                    </span>
                  )}
                </div>
              </div>
              <div className={`selection-indicator ${selectedShape === option.value ? 'active' : ''}`}>
                {selectedShape === option.value ? '✓ 已选择' : option.disabled ? '不可选择' : '点击选择'}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="settings-summary">
        <h3>📋 当前配置</h3>
        <div className="summary-content">
          <div className="summary-item">
            <span className="summary-label">难度等级:</span>
            <span className="summary-value">
              {selectedDifficulty === 'custom' 
                ? `自定义 (${customRows}×${customCols})` 
                : `${difficultyOptions.find(d => d.value === selectedDifficulty)?.label} (${getCurrentGridSize()})`
              }
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">拼块形状:</span>
            <span className="summary-value">
              {shapeOptions.find(s => s.value === selectedShape)?.label}
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">拼块总数:</span>
            <span className="summary-value">
              {getCurrentPieceCount()}块
            </span>
          </div>

        </div>
      </div>

      <div className="settings-actions">
        <div className="action-left">
          <Button
            onClick={onBack}
            variant="secondary"
            size="medium"
          >
            ← 返回裁剪
          </Button>
          
          {hasPreviewImage && onPreviewClick && (
            <Button
              onClick={onPreviewClick}
              variant="secondary"
              size="medium"
              className="preview-btn"
            >
              🔍 预览拼图效果
            </Button>
          )}
        </div>
        
        <Button
          onClick={handleComplete}
          variant="primary"
          size="large"
          className="confirm-btn"
        >
          ✅ 确认设置
        </Button>
      </div>

      <div className="settings-tips">
        <h4>💡 设置建议</h4>
        <ul>
          <li><strong>初次体验:</strong> 建议选择简单或中等难度</li>
          <li><strong>图片细节:</strong> 细节丰富的图片适合更高难度</li>
          <li><strong>游戏时间:</strong> 根据可用时间选择合适难度</li>
          <li><strong>拼块形状:</strong> 方形拼块最适合初学者</li>
          <li><strong>自定义形状:</strong> 可以创建2×2到10×10之间的任意网格</li>
        </ul>
      </div>
    </div>
  );
};
