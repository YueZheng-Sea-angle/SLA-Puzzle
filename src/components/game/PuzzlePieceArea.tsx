import React from 'react';
import { PuzzlePiece } from '../../types';
import './PuzzlePieceArea.css';

interface PuzzlePieceAreaProps {
  pieces: PuzzlePiece[];
  selectedPieceId: string | null;
  showAnswers: boolean;
  onPieceSelect: (pieceId: string | null) => void;
  onRotatePiece?: (pieceId: string) => void;
  onFlipPiece?: (pieceId: string) => void;
  // 拖拽相关
  draggedPiece?: string | null;
  onDragStart?: (pieceId: string) => void;
  onDragEnd?: () => void;
  onDropToProcessingArea?: () => void;
}

export const PuzzlePieceArea: React.FC<PuzzlePieceAreaProps> = ({
  pieces,
  selectedPieceId,
  showAnswers,
  onPieceSelect,
  onRotatePiece,
  onFlipPiece,
  draggedPiece,
  onDragStart,
  onDragEnd,
  onDropToProcessingArea,
}) => {
  const handlePieceClick = (pieceId: string) => {
    onPieceSelect(selectedPieceId === pieceId ? null : pieceId);
  };

  const handlePieceDoubleClick = (pieceId: string) => {
    // 双击旋转（预留功能）
    if (onRotatePiece) {
      onRotatePiece(pieceId);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, pieceId: string) => {
    e.preventDefault();
    // 右键翻转（预留功能）
    if (onFlipPiece) {
      onFlipPiece(pieceId);
    }
  };

  // 拖拽处理函数
  const handleDragStart = (e: React.DragEvent, pieceId: string) => {
    e.dataTransfer.setData('text/plain', pieceId);
    e.dataTransfer.effectAllowed = 'move';
    if (onDragStart) {
      onDragStart(pieceId);
    }
  };

  const handleDragEnd = () => {
    if (onDragEnd) {
      onDragEnd();
    }
  };

  // 处理区作为拖放目标（用于接收从槽位拖回来的拼图）
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (onDropToProcessingArea) {
      onDropToProcessingArea();
    }
  };

  return (
    <div
      className={`puzzle-piece-area ${draggedPiece ? 'can-drop' : ''}`}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {pieces.length === 0 ? (
        <div className="empty-area">
          <p>🎉 所有拼图块都已放置！</p>
        </div>
      ) : (
        <div className="pieces-grid">
          {pieces.map((piece) => (
            <div key={piece.id} className="puzzle-piece-container">
              <div
                className={`puzzle-piece-item ${piece.shape === 'triangle' ? 'triangle-piece' : ''} ${selectedPieceId === piece.id ? 'selected' : ''
                  } ${draggedPiece === piece.id ? 'dragging' : ''} ${piece.shape === 'triangle' && piece.id.includes('_upper') ? 'triangle-upper' : ''
                  } ${piece.shape === 'triangle' && piece.id.includes('_lower') ? 'triangle-lower' : ''
                  }`}
                draggable={true}
                onClick={() => handlePieceClick(piece.id)}
                onDoubleClick={() => handlePieceDoubleClick(piece.id)}
                onContextMenu={(e) => handleContextMenu(e, piece.id)}
                onDragStart={(e) => handleDragStart(e, piece.id)}
                onDragEnd={handleDragEnd}
                style={{
                  transform: `rotate(${piece.rotation}deg) ${piece.isFlipped ? 'scaleX(-1)' : ''
                    }`,
                }}
              >
                {showAnswers && (
                  <div className="piece-number">{piece.originalIndex + 1}</div>
                )}
                <img
                  src={piece.imageData}
                  alt={`拼图块 ${piece.originalIndex + 1}`}
                  className={`piece-image ${piece.shape === 'triangle' ? 'triangle-image' : ''}`}
                  draggable={false}
                />
              </div>
              {selectedPieceId === piece.id && (
                <div className="selected-label">已选择</div>
              )}
            </div>
          ))}
        </div>
      )}

      {pieces.length > 0 && (
        <div className="area-tips">
          <p>💡 点击选择拼图块，然后点击答题卡中的目标位置</p>
          <p>🖱️ 或直接拖拽拼图块到答题卡槽位</p>
          <p>🔄 双击可旋转（预留功能）</p>
          <p>🔁 右键可翻转（预留功能）</p>
        </div>
      )}
    </div>
  );
};
