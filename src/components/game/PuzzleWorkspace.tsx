import React from 'react';
import { GameState } from '../../types';
import { PuzzlePieceArea } from './PuzzlePieceArea';
import { AnswerGrid } from './AnswerGrid';
import './PuzzleWorkspace.css';

interface PuzzleWorkspaceProps {
  gameState: GameState;
  selectedPiece: string | null;
  showAnswers: boolean;
  onPieceSelect: (pieceId: string | null) => void;
  onPlacePiece: (pieceId: string, slotIndex: number) => void;
  onRemovePiece: (pieceId: string) => void;
  onRotatePiece?: (pieceId: string) => void;
  onFlipPiece?: (pieceId: string) => void;
  // 拖拽相关
  draggedPiece?: string | null;
  dragOverSlot?: number | null;
  onDragStart?: (pieceId: string) => void;
  onDragEnd?: () => void;
  onDragOver?: (slotIndex: number) => void;
  onDragLeave?: () => void;
  onDropToSlot?: (targetSlot: number) => void;
  onDropToProcessingArea?: () => void;
  // 管中窥豹特效相关
  availablePieces?: Set<string>;
  hasPartialEffect?: boolean;
  // 作茧自缚特效相关
  unlockedSlots?: Set<number>;
  hasCornerEffect?: boolean;
  // 颠倒世界特效相关
  hasUpsideDownEffect?: boolean;
  // 鱼目混珠特效相关
  fakePieces?: Set<string>;
  hasFakePiecesEffect?: boolean;
}

export const PuzzleWorkspace: React.FC<PuzzleWorkspaceProps> = ({
  gameState,
  selectedPiece,
  showAnswers,
  onPieceSelect,
  onPlacePiece,
  onRemovePiece,
  onRotatePiece,
  onFlipPiece,
  draggedPiece,
  dragOverSlot,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDropToSlot,
  onDropToProcessingArea,
  availablePieces,
  hasPartialEffect,
  unlockedSlots,
  hasCornerEffect,
  hasUpsideDownEffect,
  fakePieces,
  hasFakePiecesEffect,
}) => {
  // 获取处理区的拼图块（currentSlot 为 null 的拼图块）
  const processingAreaPieces = gameState.config.pieces.filter(piece => {
    const isPieceInProcessingArea = piece.currentSlot === null;
    
    // 管中窥豹特效：只显示可用的拼图块
    if (hasPartialEffect && availablePieces) {
      return isPieceInProcessingArea && availablePieces.has(piece.id);
    }
    
    return isPieceInProcessingArea;
  });

  return (
    <div className="puzzle-workspace">
      {/* 左侧：拼图处理区 */}
      <div className="processing-area">
        <div className="area-header">
          <h3>拼图处理区</h3>
          <span className="piece-count">{processingAreaPieces.length} 块</span>
        </div>
        <PuzzlePieceArea
          pieces={processingAreaPieces}
          selectedPieceId={selectedPiece}
          showAnswers={showAnswers}
          onPieceSelect={onPieceSelect}
          onRotatePiece={onRotatePiece}
          onFlipPiece={onFlipPiece}
          draggedPiece={draggedPiece}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          onDropToProcessingArea={onDropToProcessingArea}
          fakePieces={fakePieces}
          hasFakePiecesEffect={hasFakePiecesEffect}
        />
      </div>

      {/* 右侧：答题卡 */}
      <div className={`answer-area ${hasUpsideDownEffect ? 'upside-down-area' : ''}`}>
        <div className="area-header">
          <h3>拼图答题卡</h3>
          <span className="grid-info">
            {gameState.config.gridSize.rows} × {gameState.config.gridSize.cols}
          </span>
        </div>
        <AnswerGrid
          gridSize={gameState.config.gridSize}
          answerGrid={gameState.answerGrid}
          originalImage={gameState.config.originalImage}
          selectedPieceId={selectedPiece}
          showAnswers={showAnswers}
          pieceShape={gameState.config.pieceShape} // 传递拼图形状
          onPlacePiece={onPlacePiece}
          onRemovePiece={onRemovePiece}
          onPieceSelect={onPieceSelect}
          draggedPiece={draggedPiece}
          dragOverSlot={dragOverSlot}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDropToSlot={onDropToSlot}
          unlockedSlots={unlockedSlots}
          hasCornerEffect={hasCornerEffect}
        />
      </div>
    </div>
  );
};
