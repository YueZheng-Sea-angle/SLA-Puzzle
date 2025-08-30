import React, { useEffect, useRef } from 'react';
import { IrregularPuzzlePiece as IrregularPuzzlePieceType } from '../../utils/puzzleGenerator/irregular';

interface IrregularPuzzlePieceProps {
  piece: IrregularPuzzlePieceType;
  onMove?: (pieceId: string, x: number, y: number) => void;
  onSnapToTarget?: (pieceId: string) => void;
  isSelected?: boolean;
  scale?: number;
  boardOffset?: { x: number; y: number }; // 拼接板偏移量
  gridSize?: number; // 网格大小
  isInWaitingArea?: boolean; // 是否在待拼接区域
}

export const IrregularPuzzlePiece: React.FC<IrregularPuzzlePieceProps> = ({
  piece,
  onMove,
  onSnapToTarget,
  isSelected = false,
  scale = 1,
  boardOffset = { x: 0, y: 0 },
  gridSize = 20,
  isInWaitingArea = false
}) => {
  const pieceRef = useRef<HTMLDivElement>(null);
  const interactRef = useRef<any>(null);

  useEffect(() => {
    if (!pieceRef.current || !piece.isDraggable || isInWaitingArea) return;

    // 动态导入 interact.js
    import('interactjs').then((interactModule) => {
      const interact = interactModule.default;
      
      if (interactRef.current) {
        interactRef.current.unset();
      }

      // 根据是否在待拼接区域设置不同的拖拽配置
      const modifiers = [];
      
      if (!isInWaitingArea) {
        // 在拼接板上：使用网格吸附
        modifiers.push(
          interact.modifiers.snap({
            targets: [
              interact.snappers.grid({
                x: gridSize,
                y: gridSize,
                offset: { x: boardOffset.x, y: boardOffset.y }
              })
            ],
            range: Infinity,
            relativePoints: [{ x: 0, y: 0 }]
          })
        );
      }
      
      // 限制在拼接板容器内
      modifiers.push(
        interact.modifiers.restrict({
          restriction: '#puzzle-board',
          elementRect: { top: 0, left: 0, bottom: 1, right: 1 },
          endOnly: true
        })
      );

      // 设置拖拽
      interactRef.current = interact(pieceRef.current!)
        .draggable({
          modifiers,
          inertia: !isInWaitingArea, // 待拼接区域禁用惯性
          autoScroll: true
        })
        .on('dragstart', (event: any) => {
          // 拖拽开始时的视觉反馈
          event.target.style.zIndex = '1000';
          event.target.style.transform += ' scale(1.05)';
        })
        .on('dragmove', (event: any) => {
          const target = event.target;
          const x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
          const y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;

          // 更新位置
          target.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
          target.setAttribute('data-x', x);
          target.setAttribute('data-y', y);

          // 通知父组件位置变化
          if (onMove) {
            onMove(piece.id, piece.x + x, piece.y + y);
          }
        })
        .on('dragend', (event: any) => {
          // 拖拽结束时恢复样式
          event.target.style.zIndex = '';
          event.target.style.transform = event.target.style.transform.replace(' scale(1.05)', '');
          
          // 检查是否需要吸附到正确位置
          if (!isInWaitingArea && onSnapToTarget) {
            const finalX = parseFloat(event.target.getAttribute('data-x')) || 0;
            const finalY = parseFloat(event.target.getAttribute('data-y')) || 0;
            
            // 计算当前位置相对于目标位置的距离
            const targetX = piece.basePosition.x;
            const targetY = piece.basePosition.y;
            const currentX = piece.x + finalX - boardOffset.x;
            const currentY = piece.y + finalY - boardOffset.y;
            
            const deltaX = Math.abs(currentX - targetX);
            const deltaY = Math.abs(currentY - targetY);
            const tolerance = gridSize * 2; // 容差为2个网格大小
            
            if (deltaX <= tolerance && deltaY <= tolerance) {
              onSnapToTarget(piece.id);
            }
          }
        })
        // 添加点击事件：吸附到最近网格
        .on('tap', (_event: any) => {
          if (!isInWaitingArea && !isSelected) return;
          
          // 计算最近的网格点
          const currentX = piece.x - boardOffset.x;
          const currentY = piece.y - boardOffset.y;
          
          const nearestGridX = Math.round(currentX / gridSize) * gridSize;
          const nearestGridY = Math.round(currentY / gridSize) * gridSize;
          
          const snapX = nearestGridX + boardOffset.x;
          const snapY = nearestGridY + boardOffset.y;
          
          // 移动到最近网格点
          if (onMove) {
            onMove(piece.id, snapX, snapY);
          }
          
          // 检查是否需要标记为正确
          const targetX = piece.basePosition.x;
          const targetY = piece.basePosition.y;
          const deltaX = Math.abs(nearestGridX - targetX);
          const deltaY = Math.abs(nearestGridY - targetY);
          const tolerance = gridSize;
          
          if (deltaX <= tolerance && deltaY <= tolerance && onSnapToTarget) {
            onSnapToTarget(piece.id);
          }
        });
    });

    return () => {
      if (interactRef.current) {
        interactRef.current.unset();
      }
    };
  }, [piece.id, piece.isDraggable, onMove, onSnapToTarget, scale, isInWaitingArea, boardOffset.x, boardOffset.y, gridSize, isSelected]);

  // 计算实际显示样式
  const pieceStyle: React.CSSProperties = {
    position: 'absolute',
    left: piece.x,
    top: piece.y,
    width: piece.expandedSize.width * scale,
    height: piece.expandedSize.height * scale,
    transformOrigin: 'top left',
    cursor: piece.isDraggable ? (isInWaitingArea ? 'pointer' : 'grab') : 'default',
    zIndex: isSelected ? 100 : (piece.isDraggable ? 10 : 1),
    transition: piece.isDraggable ? 'none' : 'all 0.3s ease',
    filter: isSelected ? 'drop-shadow(0 0 10px rgba(59, 130, 246, 0.8))' : 
            piece.isCorrect ? 'drop-shadow(0 0 5px rgba(34, 197, 94, 0.6))' : 
            isInWaitingArea ? 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))' : 'none',
    border: isInWaitingArea && isSelected ? '2px solid #3b82f6' : 'none',
    borderRadius: isInWaitingArea ? '4px' : '0'
  };

  const imageStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    clipPath: piece.clipPath,
    userSelect: 'none',
    pointerEvents: 'none',
    objectFit: 'cover'
  };

  return (
    <div
      ref={pieceRef}
      style={pieceStyle}
      className={`irregular-puzzle-piece ${piece.isDraggable ? 'draggable' : 'fixed'} ${
        piece.isCorrect ? 'correct' : ''
      } ${isSelected ? 'selected' : ''}`}
      data-piece-id={piece.id}
      data-x="0"
      data-y="0"
    >
      <img
        src={piece.imageData}
        alt={`拼图块 ${piece.id}`}
        style={imageStyle}
        draggable={false}
      />
      
      {/* 调试信息（开发模式显示） */}
              {typeof window !== 'undefined' && window.location.hostname === 'localhost' && (
        <div 
          style={{
            position: 'absolute',
            top: 2,
            left: 2,
            fontSize: '10px',
            color: 'red',
            backgroundColor: 'rgba(255,255,255,0.8)',
            padding: '1px 3px',
            borderRadius: '2px',
            pointerEvents: 'none'
          }}
        >
          {piece.id}
        </div>
      )}
    </div>
  );
};
