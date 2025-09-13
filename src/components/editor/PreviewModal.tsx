import React from 'react';
import { Button } from '../common/Button';
import './PreviewModal.css';

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  imageTitle: string;
  showPuzzleGrid?: boolean;
  gridSize?: string;
  pieceShape?: string; // 新增：拼块形状
  aspectRatio?: string; // 新增：画幅比例
}

export const PreviewModal: React.FC<PreviewModalProps> = ({
  isOpen,
  onClose,
  imageSrc,
  imageTitle,
  showPuzzleGrid = false,
  gridSize = '4x4',
  pieceShape = 'square', // 默认方形
  aspectRatio = '1:1' // 默认1:1比例
}) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const renderPuzzleGrid = () => {
    if (!showPuzzleGrid) return null;

    const [rows, cols] = gridSize.split('x').map(Number);
    const gridLines = [];

    // 根据画幅比例调整网格显示
    const isWidescreen = aspectRatio === '16:9';
    const gridContainerClass = isWidescreen ? 'grid-overlay-inner widescreen' : 'grid-overlay-inner';

    // 添加垂直线
    for (let i = 1; i < cols; i++) {
      gridLines.push(
        <div
          key={`v-${i}`}
          className="grid-line vertical"
          style={{ left: `${(i / cols) * 100}%` }}
        />
      );
    }

    // 添加水平线
    for (let i = 1; i < rows; i++) {
      gridLines.push(
        <div
          key={`h-${i}`}
          className="grid-line horizontal"
          style={{ top: `${(i / rows) * 100}%` }}
        />
      );
    }

    // 添加对角线（三角形拼块）
    if (pieceShape === 'triangle') {
      // 左上到右下的对角线
      gridLines.push(
        <div
          key="diagonal-1"
          className="grid-line diagonal"
          style={{
            top: '0%',
            left: '0%',
            width: '141.42%', // 对角线长度
            height: '2px',
            transform: 'rotate(45deg)',
            transformOrigin: '0 0'
          }}
        />
      );

      // 为每个单元格添加对角线
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const cellWidth = 100 / cols;
          const cellHeight = 100 / rows;
          const left = col * cellWidth;
          const top = row * cellHeight;
          
          gridLines.push(
            <div
              key={`cell-diag-${row}-${col}`}
              className="grid-line diagonal-cell"
              style={{
                top: `${top}%`,
                left: `${left}%`,
                width: `${cellWidth}%`,
                height: `${cellHeight}%`
              }}
            >
              <div className="diagonal-line" />
            </div>
          );
        }
      }
    }

    return (
      <div className="puzzle-grid-overlay">
        <div className={gridContainerClass}>
          {gridLines}
        </div>
      </div>
    );
  };

  const getPieceCount = () => {
    const [rows, cols] = gridSize.split('x').map(Number);
    const baseCount = rows * cols;
    
    if (pieceShape === 'triangle') {
      // 三角形拼块：每个方形单元格被对角线分成2个三角形
      return baseCount * 2;
    }
    
    return baseCount;
  };

  const getShapeDisplay = () => {
    switch (pieceShape) {
      case 'triangle':
        return '三角形';
      case 'square':
      default:
        return '方形';
    }
  };

  return (
    <div className="preview-modal-backdrop" onClick={handleBackdropClick}>
      <div className="preview-modal">
        <div className="modal-header">
          <h3>{imageTitle}</h3>
          <Button
            onClick={onClose}
            variant="secondary"
            size="medium"
            className="close-btn"
          >
            ✕
          </Button>
        </div>
        
        <div className="modal-content">
          <div className="landscape-hint">
            📱 建议将设备旋转至横屏以获得更好的预览效果
          </div>
          
          <div className="preview-container">
            <div className="preview-image-wrapper">
              <img
                src={imageSrc}
                alt={imageTitle}
                className="preview-image"
              />
              {renderPuzzleGrid()}
            </div>
          </div>
        </div>
        
        {showPuzzleGrid && (
          <div className="preview-info">
            <p>🧩 拼图网格预览 ({gridSize.replace('x', '×')} {getShapeDisplay()})</p>
            <p>蓝色线条显示图片将如何被分割成 {getPieceCount()} 块{getShapeDisplay()}拼图</p>
          </div>
        )}
        
        <div className="modal-footer">
          <Button
            onClick={onClose}
            variant="primary"
            size="large"
          >
            确认
          </Button>
        </div>
      </div>
    </div>
  );
};
