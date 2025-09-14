import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PuzzlePiece, PieceShape } from '../../types';
import './AnswerGrid.css';

interface AnswerGridProps {
  gridSize: { rows: number; cols: number };
  answerGrid: (PuzzlePiece | null)[];
  originalImage: string;
  selectedPieceId: string | null;
  showAnswers: boolean;
  pieceShape?: PieceShape; // 添加拼图形状属性
  aspectRatio?: '1:1' | '16:9'; // 添加裁剪比例属性
  onPlacePiece: (pieceId: string, slotIndex: number) => void;
  onRemovePiece: (pieceId: string) => void;
  onPieceSelect: (pieceId: string | null) => void;
  // 拖拽相关
  draggedPiece?: string | null;
  dragOverSlot?: number | null;
  onDragStart?: (pieceId: string) => void;
  onDragEnd?: () => void;
  onDragOver?: (slotIndex: number) => void;
  onDragLeave?: () => void;
  onDropToSlot?: (targetSlot: number) => void;
  // 作茧自缚特效相关
  unlockedSlots?: Set<number>;
  hasCornerEffect?: boolean;
}

export const AnswerGrid: React.FC<AnswerGridProps> = ({
  gridSize,
  answerGrid,
  selectedPieceId,
  showAnswers,
  pieceShape = 'square', // 默认为方形
  aspectRatio = '16:9', // 默认为1:1
  onPlacePiece,
  onRemovePiece,
  onPieceSelect,
  draggedPiece,
  dragOverSlot,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDropToSlot,
  unlockedSlots,
  hasCornerEffect,
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

    // 对于俄罗斯方块拼图，强制使用1:1比例
    if (pieceShape === 'tetris') {
      // 俄罗斯方块使用1:1比例，增大方格大小
      const newSize = Math.min(maxCellWidth, maxCellHeight, 120); // 增大到最大120px
      const minSize = (gridSize.rows <= 3 && gridSize.cols <= 3) ? 80 : 90; // 增大最小尺寸
      const finalSize = Math.max(minSize, newSize);
      setCellSize(finalSize);
    } else if (aspectRatio === '16:9') {
      // 对于16:9比例，优先保证宽度，然后根据比例计算高度
      const targetWidth = Math.min(maxCellWidth, 160); // 限制最大宽度
      const targetHeight = Math.floor(targetWidth * 9 / 16);
      const newSize = Math.min(targetWidth, targetHeight, maxCellHeight);
      const minSize = (gridSize.rows <= 3 && gridSize.cols <= 3) ? 80 : 100;
      const finalSize = Math.max(minSize, newSize);
      setCellSize(finalSize);
    } else {
      // 对于1:1比例，取较小值确保所有单元格都能显示
      const newSize = Math.min(maxCellWidth, maxCellHeight, 140); // 最大140px (降低以避免溢出)
      const minSize = (gridSize.rows <= 3 && gridSize.cols <= 3) ? 80 : 100;
      const finalSize = Math.max(minSize, newSize);
      setCellSize(finalSize);
    }
  }, [gridSize.cols, gridSize.rows, aspectRatio, pieceShape]);

  // 处理槽位点击
  const handleSlotClick = (slotIndex: number) => {
    const existingPiece = answerGrid[slotIndex];



    if (existingPiece) {
      // 如果槽位有拼图块
      if (selectedPieceId === existingPiece.id) {
        // 如果点击的是当前选中的拼图块，取消选择并移除

        onPieceSelect(null); // 取消选择
        onRemovePiece(existingPiece.id);
      } else if (selectedPieceId && selectedPieceId !== existingPiece.id) {
        // 如果有其他选中的拼图块，执行替换

        onPlacePiece(selectedPieceId, slotIndex);
      } else {
        // 没有选中拼图块时，直接移除现有拼图块

        onRemovePiece(existingPiece.id);
      }
    } else if (selectedPieceId) {
      // 如果槽位为空且有选中的拼图块，放置拼图块

      onPlacePiece(selectedPieceId, slotIndex);
    }
  };

  const getSlotNumber = (index: number): number => {
    return index + 1;
  };

  // 拖拽事件处理函数
  const handlePieceDragStart = (e: React.DragEvent, pieceId: string) => {
    e.dataTransfer.setData('text/plain', pieceId);
    e.dataTransfer.effectAllowed = 'move';
    if (onDragStart) {
      onDragStart(pieceId);
    }
  };

  const handlePieceDragEnd = () => {
    if (onDragEnd) {
      onDragEnd();
    }
  };

  const handleSlotDragOver = (e: React.DragEvent, slotIndex: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (onDragOver) {
      onDragOver(slotIndex);
    }
  };

  const handleSlotDragLeave = () => {
    if (onDragLeave) {
      onDragLeave();
    }
  };

  const handleSlotDrop = (e: React.DragEvent, slotIndex: number) => {
    e.preventDefault();
    if (onDropToSlot) {
      onDropToSlot(slotIndex);
    }
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
    gridTemplateRows: `repeat(${gridSize.rows}, ${pieceShape === 'tetris' ? cellSize : (aspectRatio === '16:9' ? Math.floor(cellSize * 9 / 16) : cellSize)}px)`,
  };

  // 根据网格尺寸动态计算16:9裁剪的缩放因子
  const get16by9ScaleFactors = () => {
    const totalCells = gridSize.rows * gridSize.cols;
    
    // 根据网格尺寸动态调整缩放比例
    if (totalCells <= 9) { // 3x3或更小
      return {
        gridScale: 1.5,    // 较小放大倍数
        imageScale: 0.98   // 较小图片缩小
      };
    } else if (totalCells <= 16) { // 4x4
      return {
        gridScale: 1.9,    // 标准放大倍数
        imageScale: 0.95   // 标准图片缩小
      };
    } else if (totalCells <= 25) { // 5x5
      return {
        gridScale: 1.7,    // 中等放大倍数
        imageScale: 0.96   // 中等图片缩小
      };
    } else { // 6x6或更大
      return {
        gridScale: 1.4,    // 较小放大倍数
        imageScale: 0.98   // 较小图片缩小
      };
    }
  };

  const scaleFactors = aspectRatio === '16:9' ? get16by9ScaleFactors() : null;

  return (
    <div className="answer-grid-container" ref={containerRef}>
      <div 
        className={`answer-grid ${pieceShape === 'triangle' ? 'triangle-grid' : ''
          } ${pieceShape === 'tetris' ? 'tetris-grid' : ''
          }`}
        ref={gridRef} 
        style={gridStyle}
      >
        {pieceShape === 'triangle' ? (
          // 三角形拼图：以方形为单位渲染，每个方形包含两个三角形槽位
          Array.from({ length: gridSize.rows * gridSize.cols }, (_, squareIndex) => {
            const upperTriangleIndex = squareIndex * 2;
            const lowerTriangleIndex = squareIndex * 2 + 1;
            const upperPiece = answerGrid[upperTriangleIndex];
            const lowerPiece = answerGrid[lowerTriangleIndex];

            return (
              <div
                key={`square-${squareIndex}`}
                className="triangle-square-container"
                style={{
                  width: `${cellSize}px`,
                  height: `${aspectRatio === '16:9' ? Math.floor(cellSize * 9 / 16) : cellSize}px`,
                }}
              >
                {/* 上三角形槽位 */}
                <div
                  className={`triangle-slot upper-triangle ${upperPiece ? 'occupied' : 'empty'} ${selectedPieceId && !upperPiece ? 'highlight' : ''
                    } ${upperPiece && selectedPieceId === upperPiece.id ? 'selected' : ''
                    } ${dragOverSlot === upperTriangleIndex ? 'drag-over' : ''
                    } ${draggedPiece === upperPiece?.id ? 'dragging' : ''
                    }`}
                  onClick={() => handleSlotClick(upperTriangleIndex)}
                  onDragOver={(e) => handleSlotDragOver(e, upperTriangleIndex)}
                  onDragLeave={handleSlotDragLeave}
                  onDrop={(e) => handleSlotDrop(e, upperTriangleIndex)}
                >
                  <div className="slot-number">{getSlotNumber(upperTriangleIndex)}</div>
                  {upperPiece && (
                    <div
                      className="placed-piece triangle-piece upper"
                      draggable={true}
                      onDragStart={(e) => handlePieceDragStart(e, upperPiece.id)}
                      onDragEnd={handlePieceDragEnd}
                      style={{
                        transform: `rotate(${upperPiece.rotation}deg) ${upperPiece.isFlipped ? 'scaleX(-1)' : ''
                          }`,
                      }}
                    >
                      <img
                        src={upperPiece.imageData}
                        alt={`上三角形 ${upperPiece.originalIndex + 1}`}
                        className="piece-image triangle-image"
                        draggable={false}
                      />
                      {showAnswers && (
                        <div className="piece-info">
                          {upperPiece.originalIndex + 1}
                        </div>
                      )}
                      {showAnswers && (
                        <div className={`correctness-indicator ${upperPiece.correctSlot === upperTriangleIndex ? 'correct' : 'incorrect'
                          }`}>
                          {upperPiece.correctSlot === upperTriangleIndex ? '✓' : '✗'}
                        </div>
                      )}
                    </div>
                  )}
                  {!upperPiece && selectedPieceId && (
                    <div
                      className="drop-hint triangle-hint"
                      data-mismatch={!selectedPieceId.includes('_upper')}
                    >
                      {selectedPieceId.includes('_upper') ? '点击放置上三角' : '不匹配：需要上三角'}
                    </div>
                  )}
                </div>

                {/* 下三角形槽位 */}
                <div
                  className={`triangle-slot lower-triangle ${lowerPiece ? 'occupied' : 'empty'} ${selectedPieceId && !lowerPiece ? 'highlight' : ''
                    } ${lowerPiece && selectedPieceId === lowerPiece.id ? 'selected' : ''
                    } ${dragOverSlot === lowerTriangleIndex ? 'drag-over' : ''
                    } ${draggedPiece === lowerPiece?.id ? 'dragging' : ''
                    }`}
                  onClick={() => handleSlotClick(lowerTriangleIndex)}
                  onDragOver={(e) => handleSlotDragOver(e, lowerTriangleIndex)}
                  onDragLeave={handleSlotDragLeave}
                  onDrop={(e) => handleSlotDrop(e, lowerTriangleIndex)}
                >
                  <div className="slot-number">{getSlotNumber(lowerTriangleIndex)}</div>
                  {lowerPiece && (
                    <div
                      className="placed-piece triangle-piece lower"
                      draggable={true}
                      onDragStart={(e) => handlePieceDragStart(e, lowerPiece.id)}
                      onDragEnd={handlePieceDragEnd}
                      style={{
                        transform: `rotate(${lowerPiece.rotation}deg) ${lowerPiece.isFlipped ? 'scaleX(-1)' : ''
                          }`,
                      }}
                    >
                      <img
                        src={lowerPiece.imageData}
                        alt={`下三角形 ${lowerPiece.originalIndex + 1}`}
                        className="piece-image triangle-image"
                        draggable={false}
                      />
                      {showAnswers && (
                        <div className="piece-info">
                          {lowerPiece.originalIndex + 1}
                        </div>
                      )}
                      {showAnswers && (
                        <div className={`correctness-indicator ${lowerPiece.correctSlot === lowerTriangleIndex ? 'correct' : 'incorrect'
                          }`}>
                          {lowerPiece.correctSlot === lowerTriangleIndex ? '✓' : '✗'}
                        </div>
                      )}
                    </div>
                  )}
                  {!lowerPiece && selectedPieceId && (
                    <div
                      className="drop-hint triangle-hint"
                      data-mismatch={!selectedPieceId.includes('_lower')}
                    >
                      {selectedPieceId.includes('_lower') ? '点击放置下三角' : '不匹配：需要下三角'}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : pieceShape === 'tetris' ? (
          // 俄罗斯方块拼图：特殊渲染逻辑
          answerGrid.map((piece, index) => {
            const row = Math.floor(index / gridSize.cols);
            const col = index % gridSize.cols;

            // 动态计算cellKey，考虑俄罗斯方块的移动
            let cellKey = `${row}-${col}`;

            if (piece && piece.occupiedPositions && piece.currentSlot !== null) {
              // 检查当前俄罗斯方块是否在正确位置
              const isInCorrectPosition = piece.correctSlots &&
                piece.correctSlots.includes(index) &&
                piece.currentSlot === piece.correctSlot;

              if (isInCorrectPosition) {
                // 如果在正确位置，直接使用原始相对坐标
                cellKey = `${row}-${col}`;
              } else {
                // 如果不在正确位置，需要映射到原始相对坐标
                const currentSlotRow = Math.floor(piece.currentSlot / gridSize.cols);
                const currentSlotCol = piece.currentSlot % gridSize.cols;

                // 计算原始锚点位置（最小行列）
                const minRow = Math.min(...piece.occupiedPositions.map(pos => pos[0]));
                const minCol = Math.min(...piece.occupiedPositions.map(pos => pos[1]));

                // 计算当前槽位相对于当前锚点的偏移
                const offsetRow = row - currentSlotRow;
                const offsetCol = col - currentSlotCol;

                // 映射回原始相对位置
                const originalRow = minRow + offsetRow;
                const originalCol = minCol + offsetCol;

                cellKey = `${originalRow}-${originalCol}`;
              }
            }

            return (
              <div
                key={`slot-${index}-${piece?.id || 'empty'}`}
                className={`grid-slot tetris-slot ${piece ? 'occupied' : 'empty'
                  } ${selectedPieceId && !piece ? 'highlight' : ''
                  } ${piece && selectedPieceId === piece.id ? 'selected' : ''
                  } ${dragOverSlot === index ? 'drag-over' : ''
                  } ${draggedPiece === piece?.id ? 'dragging' : ''
                  }`}
                onClick={() => handleSlotClick(index)}
                onDragOver={(e) => handleSlotDragOver(e, index)}
                onDragLeave={handleSlotDragLeave}
                onDrop={(e) => handleSlotDrop(e, index)}
                style={{
                  width: `${cellSize}px`,
                  height: `${pieceShape === 'tetris' ? cellSize : (aspectRatio === '16:9' ? Math.floor(cellSize * 9 / 16) : cellSize)}px`,
                }}
              >
                {/* 槽位编号 */}
                <div className="slot-number">{getSlotNumber(index)}</div>

                {/* 俄罗斯方块单元格图像 */}
                {piece && piece.cellImages && piece.cellImages[cellKey] ? (
                  <div
                    className="tetris-cell"
                    draggable={true}
                    onDragStart={(e) => handlePieceDragStart(e, piece.id)}
                    onDragEnd={handlePieceDragEnd}
                  >
                    <img
                      src={piece.cellImages[cellKey]}
                      alt={`俄罗斯方块单元格 ${cellKey}`}
                      className="tetris-cell-image"
                      draggable={false}
                    />
                    {/* 俄罗斯方块标识 */}
                    {piece.tetrisShape && (
                      <div className="tetris-block-indicator">
                        {piece.tetrisShape}
                      </div>
                    )}
                  </div>
                ) : piece && !piece.cellImages ? (
                  // 备用显示方式
                  <div
                    className="tetris-fallback"
                    draggable={true}
                    onDragStart={(e) => handlePieceDragStart(e, piece.id)}
                    onDragEnd={handlePieceDragEnd}
                  >
                    <img
                      src={piece.imageData}
                      alt={`俄罗斯方块 ${piece.originalIndex + 1}`}
                      className="piece-image"
                      draggable={false}
                    />
                  </div>
                ) : null}

                {/* 拖拽提示 */}
                {!piece && selectedPieceId && (
                  <div className="drop-hint tetris-hint">
                    点击放置俄罗斯方块
                  </div>
                )}
              </div>
            );
          })
        ) : (
          // 方形拼图：原有的渲染逻辑
          answerGrid.map((piece, index) => {
            // 检查槽位是否锁定（作茧自缚特效）
            const isLocked = hasCornerEffect && unlockedSlots && !unlockedSlots.has(index);

            return (
              <div
                key={`slot-${index}-${piece?.id || 'empty'}`}
                className={`grid-slot ${piece ? 'occupied' : 'empty'} ${selectedPieceId && !piece ? 'highlight' : ''
                  } ${piece && selectedPieceId === piece.id ? 'selected' : ''
                  } ${dragOverSlot === index ? 'drag-over' : ''
                  } ${draggedPiece === piece?.id ? 'dragging' : ''
                  } ${isLocked ? 'locked-slot' : hasCornerEffect && unlockedSlots?.has(index) ? 'unlocked-slot' : ''
                  }`}
                onClick={() => handleSlotClick(index)}
                onDragOver={(e) => handleSlotDragOver(e, index)}
                onDragLeave={handleSlotDragLeave}
                onDrop={(e) => handleSlotDrop(e, index)}
                style={{
                  width: `${cellSize}px`,
                  height: `${aspectRatio === '16:9' ? Math.floor(cellSize * 9 / 16) : cellSize}px`,
                }}
              >
                {/* 槽位编号 */}
                <div className="slot-number">{getSlotNumber(index)}</div>

                {/* 拼图块 */}
                {piece !== null && piece !== undefined && (
                  <div
                    className="placed-piece"
                    draggable={true}
                    onDragStart={(e) => handlePieceDragStart(e, piece.id)}
                    onDragEnd={handlePieceDragEnd}
                    style={{
                      transform: `rotate(${piece.rotation}deg) ${piece.isFlipped ? 'scaleX(-1)' : ''
                        }`,
                      // 对于16:9裁剪方形拼图，确保拼图块完全填充槽位
                      width: aspectRatio === '16:9' && piece.shape === 'square' ? '100%' : 
                            (piece.shape === 'square' ? `${piece.width}px` : undefined),
                      height: aspectRatio === '16:9' && piece.shape === 'square' ? '100%' : 
                             (piece.shape === 'square' ? `${piece.height}px` : undefined),
                      aspectRatio: piece.shape === 'square' ? piece.width / piece.height : undefined,
                    }}
                  >
                    <img
                      src={piece.imageData}
                      alt={`拼图块 ${piece.originalIndex + 1}`}
                      className="piece-image"
                      draggable={false}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                    {showAnswers && (
                      <div className="piece-info">
                        {piece.originalIndex + 1}
                      </div>
                    )}

                    {/* 正确性指示器 */}
                    {showAnswers && (
                      <div className={`correctness-indicator ${piece.correctSlot === index ? 'correct' : 'incorrect'
                        }`}>
                        {piece.correctSlot === index ? '✓' : '✗'}
                      </div>
                    )}
                  </div>
                )}

                {/* 空槽位提示 */}
                {!piece && selectedPieceId && (
                  <div className="drop-hint">
                    点击放置
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* 网格信息 - 固定在答题卡内部下方 */}
      <div className="grid-info fixed-bottom">
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