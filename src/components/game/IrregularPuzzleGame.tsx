import React, { useState, useEffect, useCallback } from 'react';
import { IrregularPuzzleConfig, IrregularPuzzleGenerator, IrregularPuzzlePiece } from '../utils/puzzleGenerator/irregular';
import { IrregularAnswerGrid } from '../components/game/IrregularAnswerGrid';
import { Timer } from '../components/common/Timer';
import { Button } from '../components/common/Button';
import { GameHelpButton } from '../components/common/GameHelp';
import '../components/game/PuzzleGame.css';
import '../components/game/PuzzleWorkspace.css';

interface IrregularPuzzleGameProps {
  onBackToMenu: () => void;
  imageData?: string;
  gridSize?: '3x3' | '4x4' | '5x5' | '6x6';
}

export const IrregularPuzzleGame: React.FC<IrregularPuzzleGameProps> = ({
  onBackToMenu,
  imageData,
  gridSize = '3x3'
}) => {
  const [puzzleConfig, setPuzzleConfig] = useState<IrregularPuzzleConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [gameStartTime, setGameStartTime] = useState<Date | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [progress, setProgress] = useState({ correct: 0, total: 0, percentage: 0 });
  const [elapsedTime, setElapsedTime] = useState(0);
  const [selectedPiece, setSelectedPiece] = useState<string | null>(null);
  const [showAnswers, setShowAnswers] = useState(false);
  const [moves, setMoves] = useState(0);
  const [draggedPiece, setDraggedPiece] = useState<string | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<number | null>(null);
  const [answerGrid, setAnswerGrid] = useState<(IrregularPuzzlePiece | null)[]>([]);

  // 生成拼图配置
  const generatePuzzle = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      let puzzleImageData = imageData;

      // 如果没有提供图像，使用默认图像
      if (!puzzleImageData) {
        // 这里可以使用预设的测试图像
        puzzleImageData = '/images/nature/landscape1.svg'; // 假设有这个图像
      }

      const config = await IrregularPuzzleGenerator.generateSimpleIrregular(
        puzzleImageData,
        gridSize
      );

      setPuzzleConfig(config);
    } catch (err) {
      console.error('生成异形拼图失败:', err);
      setError(err instanceof Error ? err.message : '生成拼图时发生未知错误');
    } finally {
      setIsLoading(false);
    }
  }, [imageData, gridSize]);

  // 开始游戏
  const startGame = useCallback(() => {
    if (puzzleConfig) {
      setIsGameStarted(true);
      setGameStartTime(new Date());
      setIsComplete(false);
      setProgress({ correct: 0, total: puzzleConfig.pieces.length, percentage: 0 });
      setElapsedTime(0);
      setMoves(0);

      // 初始化答题网格
      const totalSlots = puzzleConfig.gridSize.rows * puzzleConfig.gridSize.cols;
      setAnswerGrid(new Array(totalSlots).fill(null));
    }
  }, [puzzleConfig]);

  // 初始化生成拼图
  useEffect(() => {
    generatePuzzle();
  }, [generatePuzzle]);

  // 计时器更新
  useEffect(() => {
    if (gameStartTime && !isComplete && isGameStarted) {
      const timer = setInterval(() => {
        const now = new Date();
        const elapsed = Math.floor((now.getTime() - gameStartTime.getTime()) / 1000);
        setElapsedTime(elapsed);
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [gameStartTime, isComplete, isGameStarted]);

  // 处理拼图完成
  const handlePuzzleComplete = useCallback(() => {
    setIsComplete(true);
    console.log('异形拼图完成！');
  }, []);

  // 处理键盘快捷键
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedPiece(null);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // 重新开始游戏
  const handleRestart = useCallback(() => {
    setIsGameStarted(false);
    setGameStartTime(null);
    setIsComplete(false);
    setProgress({ correct: 0, total: 0, percentage: 0 });
    setElapsedTime(0);
    setSelectedPiece(null);
    setMoves(0);
    setDraggedPiece(null);
    setDragOverSlot(null);
    setAnswerGrid([]);
    generatePuzzle();
  }, [generatePuzzle]);

  // 处理拼图块选择
  const handlePieceSelect = useCallback((pieceId: string | null) => {
    setSelectedPiece(pieceId);
    setMoves(prev => prev + 1);
  }, []);

  // 处理拼图块放置
  const handlePiecePlacement = useCallback((pieceId: string, slotIndex: number) => {
    if (!puzzleConfig) return;

    // 找到要放置的拼图块
    const piece = puzzleConfig.pieces.find(p => p.id === pieceId);
    if (!piece) return;

    // 检查槽位是否已被占用，如果被占用则移回处理区
    let newAnswerGrid = [...answerGrid];
    if (newAnswerGrid[slotIndex] !== null) {
      const existingPiece = newAnswerGrid[slotIndex];
      if (existingPiece) {
        // 将原有拼图块的状态重置为未放置
        const updatedPieces = puzzleConfig.pieces.map(p =>
          p.id === existingPiece.id ? { ...p, isCorrect: false } : p
        );
        setPuzzleConfig({ ...puzzleConfig, pieces: updatedPieces });
      }
    }

    // 检查该拼图块是否已经在其他槽位，如果是则清空那个槽位
    const currentSlotIndex = newAnswerGrid.findIndex(slot => slot?.id === pieceId);
    if (currentSlotIndex !== -1) {
      newAnswerGrid[currentSlotIndex] = null;
    }

    // 更新拼图配置，将拼图块标记为已放置
    const updatedPieces = puzzleConfig.pieces.map(p => {
      if (p.id === pieceId) {
        return { ...p, isCorrect: true };
      }
      return p;
    });

    setPuzzleConfig({ ...puzzleConfig, pieces: updatedPieces });

    // 将拼图块放置到新槽位
    newAnswerGrid[slotIndex] = { ...piece, isCorrect: true };
    setAnswerGrid(newAnswerGrid);

    // 更新进度
    const correctCount = newAnswerGrid.filter(slot => slot !== null).length;
    const totalCount = puzzleConfig.pieces.length;
    const percentage = Math.round((correctCount / totalCount) * 100);

    setProgress({
      correct: correctCount,
      total: totalCount,
      percentage
    });

    // 检查是否完成
    if (correctCount === totalCount) {
      setIsComplete(true);
      handlePuzzleComplete();
    }

    setSelectedPiece(null);
    setMoves(prev => prev + 1);
  }, [puzzleConfig, answerGrid, handlePuzzleComplete]);

  // 处理拼图块移除
  const handlePieceRemoval = useCallback((pieceId: string) => {
    if (!puzzleConfig) return;

    // 找到拼图块在答题网格中的位置
    const slotIndex = answerGrid.findIndex(piece => piece?.id === pieceId);
    if (slotIndex === -1) return;

    // 更新拼图配置，将拼图块标记为未放置
    const updatedPieces = puzzleConfig.pieces.map(p =>
      p.id === pieceId ? { ...p, isCorrect: false } : p
    );

    setPuzzleConfig({ ...puzzleConfig, pieces: updatedPieces });

    // 更新答题网格
    const newAnswerGrid = [...answerGrid];
    newAnswerGrid[slotIndex] = null;
    setAnswerGrid(newAnswerGrid);

    // 更新进度
    const correctCount = newAnswerGrid.filter(slot => slot !== null).length;
    const totalCount = puzzleConfig.pieces.length;
    const percentage = Math.round((correctCount / totalCount) * 100);

    setProgress({
      correct: correctCount,
      total: totalCount,
      percentage
    });

    setMoves(prev => prev + 1);
  }, [puzzleConfig, answerGrid]);

  // 拖拽开始处理
  const handleDragStart = useCallback((pieceId: string) => {
    setDraggedPiece(pieceId);
    setSelectedPiece(pieceId);
  }, []);

  // 拖拽结束处理
  const handleDragEnd = useCallback(() => {
    setDraggedPiece(null);
  }, []);

  // 拖拽到答题卡处理
  const handleDropToBoard = useCallback((slotIndex: number) => {
    if (draggedPiece) {
      handlePiecePlacement(draggedPiece, slotIndex);
    }
  }, [draggedPiece, handlePiecePlacement]);

  // 拖拽悬停处理
  const handleDragOver = useCallback((slotIndex: number) => {
    setDragOverSlot(slotIndex);
  }, []);

  // 拖拽离开处理
  const handleDragLeave = useCallback(() => {
    setDragOverSlot(null);
  }, []);  // 获取统计信息
  const stats = puzzleConfig ? IrregularPuzzleGenerator.getPuzzleStats(puzzleConfig) : null;

  // 加载状态
  if (isLoading) {
    return (
      <div className="puzzle-game-start">
        <div className="start-content">
          <div className="text-blue-500 text-6xl mb-4">🧩</div>
          <h2>生成拼图中</h2>
          <div className="puzzle-info">
            <p>请稍候，正在为您准备异形拼图...</p>
          </div>
        </div>
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <div className="puzzle-game-start">
        <div className="start-content">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2>生成失败</h2>
          <div className="puzzle-info">
            <p>{error}</p>
          </div>
          <div className="start-actions">
            <Button onClick={handleRestart} variant="primary">
              重试
            </Button>
            <Button onClick={onBackToMenu} variant="secondary">
              返回主菜单
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!puzzleConfig) {
    return (
      <div className="puzzle-game-start">
        <div className="start-content">
          <div className="text-lg text-gray-600">拼图配置加载中...</div>
        </div>
      </div>
    );
  }

  // 游戏开始前的界面（使用方形拼图的样式）
  if (!isGameStarted) {
    return (
      <div className="puzzle-game-start">
        <div className="start-content">
          <h2>{puzzleConfig.name}</h2>
          <div className="puzzle-info">
            <p>难度: {stats?.difficulty}</p>
            <p>拼图块: {puzzleConfig.gridSize.rows} × {puzzleConfig.gridSize.cols}</p>
            <p>形状: 异形</p>
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

  // 获取处理区的拼图块（未正确放置的拼图块）
  const processingAreaPieces = puzzleConfig.pieces.filter(piece =>
    piece.isDraggable && !piece.isCorrect
  );

  return (
    <div className="puzzle-game">
      {/* 游戏头部（使用方形拼图的样式） */}
      <div className="game-header">
        <div className="game-info">
          <h3>{puzzleConfig.name}</h3>
          <div className="game-stats">
            <Timer time={elapsedTime} isRunning={!isComplete} />
            <span className="moves-counter">步数: {moves}</span>
          </div>
        </div>

        <div className="game-controls">
          <GameHelpButton />
          <Button
            onClick={() => {
              alert('提示功能正在开发中，敬请期待！');
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
          <Button
            onClick={() => alert('保存功能开发中')}
            variant="secondary"
            size="small"
            className="save-button"
          >
            💾 保存进度
          </Button>
          <Button onClick={handleRestart} variant="secondary" size="small">
            🔄 重置游戏
          </Button>
          <Button onClick={onBackToMenu} variant="danger" size="small">
            🚪 退出游戏
          </Button>
        </div>
      </div>

      {/* 游戏主体（使用方形拼图的工作区布局） */}
      <div className="game-content">
        <div className="puzzle-workspace">
          {/* 左侧：拼图处理区 */}
          <div className="processing-area">
            <div className="area-header">
              <h3>拼图处理区</h3>
              <span className="piece-count">
                {processingAreaPieces.length} 块 | 进度: {progress.percentage}%
              </span>
            </div>
            {/* 异形拼图块，但使用方形拼图的布局样式 */}
            <div className="puzzle-piece-area">
              {processingAreaPieces.length > 0 ? (
                <div className="pieces-grid">
                  {processingAreaPieces.map(piece => (
                    <div
                      key={piece.id}
                      className={`puzzle-piece-item ${selectedPiece === piece.id ? 'selected' : ''} ${draggedPiece === piece.id ? 'dragging' : ''}`}
                      draggable={true}
                      onClick={() => handlePieceSelect(selectedPiece === piece.id ? null : piece.id)}
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', piece.id);
                        e.dataTransfer.effectAllowed = 'move';
                        handleDragStart(piece.id);
                      }}
                      onDragEnd={handleDragEnd}
                    >
                      <img
                        src={piece.imageData}
                        alt={`拼图块 ${piece.id}`}
                        style={{
                          width: '100%',
                          height: '100%',
                          clipPath: piece.clipPath, // 保持异形切割
                          objectFit: 'cover'
                        }}
                        draggable={false}
                      />
                      {showAnswers && (
                        <div className="piece-number">{piece.gridRow * puzzleConfig.gridSize.cols + piece.gridCol + 1}</div>
                      )}
                      {selectedPiece === piece.id && (
                        <div className="selected-indicator">✓</div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-area">
                  <span>🎉 所有拼图块都已放置！</span>
                </div>
              )}

              {/* 操作提示 */}
              <div className="area-tips">
                <p><strong>操作提示：</strong></p>
                <p>1. 点击选择拼图块（异形切割保持原样）</p>
                <p>2. 点击右侧答题卡放置拼图块</p>
                <p>3. 拖拽拼图块到右侧答题卡</p>
                <p>4. 按 ESC 键取消选择</p>
              </div>
            </div>
          </div>

          {/* 右侧：拼图答题卡 */}
          <div className="answer-area">
            <div className="area-header">
              <h3>拼图答题卡</h3>
              <span className="grid-info">
                {puzzleConfig.gridSize.rows} × {puzzleConfig.gridSize.cols} | {progress.correct}/{progress.total} 正确
              </span>
            </div>
            {/* 使用异形拼图答题网格，采用方形拼图的模式 */}
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <IrregularAnswerGrid
                gridSize={puzzleConfig.gridSize}
                answerGrid={answerGrid}
                originalImage={puzzleConfig.originalImage}
                selectedPieceId={selectedPiece}
                showAnswers={showAnswers}
                onPlacePiece={handlePiecePlacement}
                onRemovePiece={handlePieceRemoval}
                onPieceSelect={handlePieceSelect}
                draggedPiece={draggedPiece}
                dragOverSlot={dragOverSlot}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDropToSlot={handleDropToBoard}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 游戏完成提示（使用方形拼图的样式） */}
      {isComplete && (
        <div className="completion-modal">
          <div className="modal-content">
            <h3>🎉 恭喜完成！</h3>
            <p>完成时间: {Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, '0')}</p>
            <p>总步数: {moves}</p>
            <div className="modal-actions">
              <Button onClick={handleRestart} variant="primary">
                再玩一次
              </Button>
              <Button onClick={onBackToMenu} variant="secondary">
                返回菜单
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 操作提示 */}
      <div className="game-tips">
        <p>💡 操作提示：点击选择拼图块，点击或拖拽到右侧答题卡放置 | ESC 取消选择 | 异形拼图块保持原有的切割形状</p>
      </div>
    </div>
  );
};
