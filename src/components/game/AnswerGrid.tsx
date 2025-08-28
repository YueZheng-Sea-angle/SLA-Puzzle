import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PuzzlePiece } from '../../types';
import './AnswerGrid.css';

interface AnswerGridProps {
  gridSize: { rows: number; cols: number };
  answerGrid: (PuzzlePiece | null)[];
  originalImage: string;
  selectedPieceId: string | null;
  onPlacePiece: (pieceId: string, slotIndex: number) => void;
  onRemovePiece: (pieceId: string) => void;
  onPieceSelect: (pieceId: string) => void;
}

export const AnswerGrid: React.FC<AnswerGridProps> = ({
  gridSize,
  answerGrid,
  originalImage,
  selectedPieceId,
  onPlacePiece,
  onRemovePiece,
  onPieceSelect,
}) => {
  const gridRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [cellSize, setCellSize] = useState(80); // 默认单元格大小

  // 计算合适的单元格大小
  const calculateCellSize = useCallback(() => {
    if (!gridRef.current || !containerRef.current) return;
    
    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;
    
    // 获取网格信息区域的高度
    const gridInfoElement = containerRef.current.querySelector('.grid-info');
    const gridInfoHeight = gridInfoElement?.clientHeight || 60; // 默认60px
    
    // 减去内边距、网格信息和间隙
    const horizontalPadding = 40; // 20px padding * 2
    const verticalPadding = 40; // 20px padding * 2
    
    const availableWidth = containerWidth - horizontalPadding;
    const availableHeight = containerHeight - verticalPadding - gridInfoHeight;
    
    // 计算水平和垂直方向的最大单元格大小
    const maxCellWidth = Math.floor(availableWidth / gridSize.cols);
    const maxCellHeight = Math.floor(availableHeight / gridSize.rows);
    
    // 取较小值确保所有单元格都能显示
    const newSize = Math.min(maxCellWidth, maxCellHeight, 160); // 最大160px
    
    // 确保单元格大小合理
    const finalSize = Math.max(120, newSize); // 最小120px
    
    setCellSize(finalSize);
  }, [gridSize.cols, gridSize.rows]);

  // 处理槽位点击
  const handleSlotClick = (slotIndex: number) => {
    const existingPiece = answerGrid[slotIndex];
    
    if (existingPiece) {
      // 如果槽位有拼图块，选择或移除它
      if (selectedPieceId === existingPiece.id) {
        // 如果点击的是已选择的拼图块，将其移回处理区
        onRemovePiece(existingPiece.id);
      } else {
        // 否则选择这个拼图块
        onPieceSelect(existingPiece.id);
      }
    } else if (selectedPieceId) {
      // 如果槽位为空且有选中的拼图块，放置拼图块
      onPlacePiece(selectedPieceId, slotIndex);
    }
  };

  const getSlotNumber = (index: number): number => {
    return index + 1;
  };

  // 计算完成度和正确率
  const completedCount = answerGrid.filter(slot => slot !== null).length;
  const correctCount = answerGrid.filter((piece, index) => 
    piece && piece.correctSlot === index && piece.rotation === 0 && !piece.isFlipped
  ).length;

  // 监听窗口大小变化
  useEffect(() => {
    calculateCellSize();
    
    const handleResize = () => {
      calculateCellSize();
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [calculateCellSize]);

  // 当网格尺寸变化时重新计算
  useEffect(() => {
    calculateCellSize();
  }, [gridSize, calculateCellSize]);

  // 创建网格样式对象
  const gridStyle: React.CSSProperties = {
    gridTemplateColumns: `repeat(${gridSize.cols}, ${cellSize}px)`,
    gridTemplateRows: `repeat(${gridSize.rows}, ${cellSize}px)`,
  };

  return (
    <div className="answer-grid-container" ref={containerRef}>
      {/* 网格槽位 */}
      <div 
        ref={gridRef}
        className="answer-grid"
        style={gridStyle}
      >
        {answerGrid.map((piece, index) => (
          <div
            key={index}
            className={`grid-slot ${piece ? 'occupied' : 'empty'} ${
              selectedPieceId && !piece ? 'highlight' : ''
            } ${
              piece && selectedPieceId === piece.id ? 'selected' : ''
            }`}
            onClick={() => handleSlotClick(index)}
            style={{
              width: `${cellSize}px`,
              height: `${cellSize}px`,
            }}
          >
            {/* 槽位编号 */}
            <div className="slot-number">{getSlotNumber(index)}</div>
            
            {/* 拼图块 */}
            {piece && (
              <div 
                className="placed-piece"
                style={{
                  transform: `rotate(${piece.rotation}deg) ${
                    piece.isFlipped ? 'scaleX(-1)' : ''
                  }`,
                }}
              >
                <img
                  src={piece.imageData}
                  alt={`拼图块 ${piece.originalIndex + 1}`}
                  className="piece-image"
                  draggable={false}
                />
                <div className="piece-info">
                  {piece.originalIndex + 1}
                </div>
                
                {/* 正确性指示器 */}
                <div className={`correctness-indicator ${
                  piece.correctSlot === index ? 'correct' : 'incorrect'
                }`}>
                  {piece.correctSlot === index ? '✓' : '✗'}
                </div>
              </div>
            )}
            
            {/* 空槽位提示 */}
            {!piece && selectedPieceId && (
              <div className="drop-hint">
                点击放置
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* 网格信息 */}
      <div className="grid-info">
        <div className="completion-status">
          已完成: {completedCount} / {answerGrid.length}
        </div>
        <div className="correctness-status">
          正确: {correctCount} / {answerGrid.length}
        </div>
      </div>
    </div>
  );
};