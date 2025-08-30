import React, { useState, useCallback } from 'react';
import { usePuzzleGame } from '../../hooks/usePuzzleGame';
import { PuzzleConfig } from '../../types';
import { PuzzleWorkspace } from './PuzzleWorkspace';
import { Button } from '../common/Button';
import { Timer } from '../common/Timer';
import { GameHelpButton } from '../common/GameHelp';
import './PuzzleGame.css';

interface PuzzleGameProps {
  puzzleConfig: PuzzleConfig;
  onGameComplete?: (completionTime: number, moves: number) => void;
  onBackToMenu?: () => void;
}

export const PuzzleGame: React.FC<PuzzleGameProps> = ({
  puzzleConfig,
  onGameComplete,
  onBackToMenu,
}) => {
  const [showAnswers, setShowAnswers] = useState(false);
  
  const {
    gameState,
    isGameStarted,
    selectedPiece,
    setSelectedPiece,
    timer,
    initializeGame,
    placePieceToSlot,
    removePieceFromSlot,
    rotatePiece,
    flipPiece,
    undo,
    resetGame,
    // 拖拽相关
    draggedPiece,
    dragOverSlot,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
    handleDropToSlot,
    handleDropToProcessingArea,
  } = usePuzzleGame({ initialConfig: puzzleConfig });

  // 开始游戏
  const startGame = useCallback(() => {
    initializeGame(puzzleConfig);
  }, [initializeGame, puzzleConfig]);

  // 处理拼图完成
  React.useEffect(() => {
    if (gameState?.isCompleted && onGameComplete) {
      onGameComplete(timer, gameState.moves);
    }
  }, [gameState?.isCompleted, timer, gameState?.moves, onGameComplete]);

  // 处理键盘快捷键
  React.useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'r':
        case 'R':
          if (selectedPiece) {
            rotatePiece(selectedPiece, 0);
          }
          break;
        case 'f':
        case 'F':
          if (selectedPiece) {
            flipPiece(selectedPiece);
          }
          break;
        case 'z':
        case 'Z':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            undo();
          }
          break;
        case 'Escape':
          setSelectedPiece(null);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedPiece, rotatePiece, flipPiece, undo, setSelectedPiece]);

  if (!isGameStarted) {
    return (
      <div className="puzzle-game-start">
        <div className="start-content">
          <h2>{puzzleConfig.name}</h2>
          <div className="puzzle-info">
            <p>难度: {puzzleConfig.difficulty}</p>
            <p>拼图块: {puzzleConfig.gridSize.rows} × {puzzleConfig.gridSize.cols}</p>
            <p>形状: {puzzleConfig.pieceShape === 'square' ? '方形' : 
                     puzzleConfig.pieceShape === 'triangle' ? '三角形' : '异形'}</p>
          </div>
          <div className="start-actions">
            <Button onClick={startGame} variant="primary" size="large">
              开始游戏
            </Button>
            <Button onClick={onBackToMenu} variant="secondary">
              返回菜单
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="puzzle-game">
      {/* 游戏头部 */}
      <div className="game-header">
        <div className="game-info">
          <h3>{puzzleConfig.name}</h3>
          <div className="game-stats">
            <Timer time={timer} isRunning={!gameState?.isCompleted} />
            <span className="moves-counter">步数: {gameState?.moves || 0}</span>
          </div>
        </div>
        
        <div className="game-controls">
          <GameHelpButton />
          <Button 
            onClick={() => {
              // TODO: 实现提示功能
              alert('提示功能正在开发中，敬请期待！\n\n未来版本将提供：\n• 高亮显示可能的正确位置\n• 自动放置一块拼图\n• 边缘拼图块优先提示');
            }} 
            variant="secondary" 
            size="small"
            className="hint-button"
          >
            💡 提示
          </Button>
          <Button 
            onClick={() => setShowAnswers(!showAnswers)} 
            variant={showAnswers ? "primary" : "secondary"} 
            size="small"
            className="answer-toggle"
          >
            {showAnswers ? '👁️ 隐藏答案' : '👁️‍🗨️ 显示答案'}
          </Button>
          <Button onClick={undo} variant="secondary" size="small" disabled={!gameState || gameState.history.length === 0}>
            ↩️ 撤销
          </Button>
          <Button 
            onClick={() => alert('保存功能开发中')} 
            variant="secondary" 
            size="small"
            className="save-button"
          >
            💾 保存进度
          </Button>
          <Button onClick={resetGame} variant="secondary" size="small">
            🔄 重置游戏
          </Button>
          <Button onClick={onBackToMenu} variant="danger" size="small">
            🚪 退出游戏
          </Button>
        </div>
      </div>
      {/* 游戏主体 */}
      <div className="game-content">
        {gameState && (
          <PuzzleWorkspace
            gameState={gameState}
            selectedPiece={selectedPiece}
            showAnswers={showAnswers}
            onPieceSelect={setSelectedPiece}
            onPlacePiece={placePieceToSlot}
            onRemovePiece={removePieceFromSlot}
            onRotatePiece={(pieceId) => rotatePiece(pieceId, 0)}
            onFlipPiece={flipPiece}
            draggedPiece={draggedPiece}
            dragOverSlot={dragOverSlot}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDropToSlot={handleDropToSlot}
            onDropToProcessingArea={handleDropToProcessingArea}
          />
        )}



        {/* 游戏完成提示 */}
        {gameState?.isCompleted && (
          <div className="completion-modal">
            <div className="modal-content">
              <h3>🎉 恭喜完成！</h3>
              <p>完成时间: {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}</p>
              <p>总步数: {gameState.moves}</p>
              <div className="modal-actions">
                <Button onClick={resetGame} variant="primary">
                  再玩一次
                </Button>
                <Button onClick={onBackToMenu} variant="secondary">
                  返回菜单
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 操作提示 */}
      <div className="game-tips">
        <p>💡 操作提示：点击选择拼图块，再点击答题卡槽位放置 | R键旋转 | F键翻转 | Ctrl+Z 撤销 | ESC 取消选择 | Ctrl+S 保存进度 | H键查看提示 | A键切换答案显示</p>
      </div>
    </div>
  );
};