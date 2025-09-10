import React, { useState, useEffect, useCallback } from 'react';

// 让clipPath和图片都以中心缩放1.3倍
function scaleAndTranslateClipPath(clipPath: string) {
  if (!clipPath || !clipPath.startsWith('polygon(')) return clipPath;
  const percent = (v: number) => Math.round(v * 1000) / 10 + '%';
  const scale = 1.3;
  const cx = 50, cy = 50;
  return clipPath.replace(/polygon\((.*)\)/, (_match, points: string) => {
    const newPoints = points.split(',').map((pt: string) => {
      const match = pt.trim().match(/^([\d.]+)%\s+([\d.]+)%$/);
      if (!match) return pt;
      let [x, y] = [parseFloat(match[1]), parseFloat(match[2])];
      x = (x - cx) * scale + cx;
      y = (y - cy) * scale + cy;
      return `${percent(x)} ${percent(y)}`;
    });
    return `polygon(${newPoints.join(', ')})`;
  });
}
import { IrregularPuzzleConfig, IrregularPuzzleGenerator, IrregularPuzzlePiece } from '../utils/puzzleGenerator/irregular';
import { IrregularAnswerGrid } from '../components/game/IrregularAnswerGrid';
import IrregularAnswerGridIrregular from '../components/game/IrregularAnswerGridIrregular';
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
  // 旋转/翻转状态（仅处理区）
  const [pieceTransforms, setPieceTransforms] = useState<Record<string, { rotation: number; flipX: boolean; flipY: boolean }>>({});
  // 处理区拼图块旋转

  const handleRotatePiece = useCallback((pieceId: string) => {
    setPieceTransforms(prev => {
      const prevTrans = prev[pieceId] || { rotation: 0, flipX: false, flipY: false };
      return { ...prev, [pieceId]: { ...prevTrans, rotation: prevTrans.rotation + 90 } };
    });
  }, []);


  // 处理区拼图块水平翻转
  const handleFlipX = useCallback((pieceId: string) => {
    setPieceTransforms(prev => {
      const prevTrans = prev[pieceId] || { rotation: 0, flipX: false, flipY: false };
      return { ...prev, [pieceId]: { ...prevTrans, flipX: !prevTrans.flipX } };
    });
  }, []);

  // 处理区拼图块垂直翻转
  const handleFlipY = useCallback((pieceId: string) => {
    setPieceTransforms(prev => {
      const prevTrans = prev[pieceId] || { rotation: 0, flipX: false, flipY: false };
      return { ...prev, [pieceId]: { ...prevTrans, flipY: !prevTrans.flipY } };
    });
  }, []);

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

    // 只对异形拼图专用判定
    // 获取目标槽位的行列
    const rows = puzzleConfig.gridSize?.rows || puzzleConfig.gridLayout?.gridSize?.rows;
    const cols = puzzleConfig.gridSize?.cols || puzzleConfig.gridLayout?.gridSize?.cols;
    const row = Math.floor(slotIndex / cols);
    const col = slotIndex % cols;

    // 定义四个方向的偏移和属性名
    const directions = [
      { dr: -1, dc: 0, self: 'up', other: 'down', edge: 'top', otherEdge: 'bottom' },
      { dr: 0, dc: 1, self: 'right', other: 'left', edge: 'right', otherEdge: 'left' },
      { dr: 1, dc: 0, self: 'down', other: 'up', edge: 'bottom', otherEdge: 'top' },
      { dr: 0, dc: -1, self: 'left', other: 'right', edge: 'left', otherEdge: 'right' },
    ];

    // 检查四个方向是否有凸对凸、凸对平，未放拼图块的小格子视为凹(-1)，边界禁止凸出
    for (const dir of directions) {
      const nRow = row + dir.dr;
      const nCol = col + dir.dc;
      let neighborVal: number | null = null;
      if (nRow >= 0 && nRow < rows && nCol >= 0 && nCol < cols) {
        const neighborIdx = nRow * cols + nCol;
        const neighborPiece = answerGrid[neighborIdx];
        if (neighborPiece) {
          neighborVal = (neighborPiece as any)[dir.other];
        } else {
          neighborVal = -1; // 空格子视为凹
        }
      } else {
        // 边界
        neighborVal = null;
      }
      const selfVal = (piece as any)[dir.self];
      // 1=凸，-1=凹，0=平
      // 禁止凸对凸、凸对平、平对凸、以及凸对边界
      if (neighborVal === null && selfVal === 1) {
        return;
      }
      if (neighborVal !== null) {
        if (selfVal === 1 && neighborVal === 1) {
          return;
        }
        if (selfVal === 1 && neighborVal === 0) {
          return;
        }
        if (selfVal === 0 && neighborVal === 1) {
          return;
        }
      }
    }

    // 检查槽位是否已被占用，如果被占用则移回处理区
    let newAnswerGrid = [...answerGrid];
    let existingPieceId: string | null = null;
    if (newAnswerGrid[slotIndex] !== null) {
      const existingPiece = newAnswerGrid[slotIndex];
      if (existingPiece) {
        existingPieceId = existingPiece.id;
      }
    }

    // 检查该拼图块是否已经在其他槽位，如果是则清空那个槽位
    const currentSlotIndex = newAnswerGrid.findIndex(slot => slot?.id === pieceId);
    if (currentSlotIndex !== -1) {
      newAnswerGrid[currentSlotIndex] = null;
    }

    // 一次性更新所有拼图块的状态
    const updatedPieces = puzzleConfig.pieces.map(p => {
      if (p.id === pieceId) {
        // 当前拖拽的拼图块标记为已放置
        return { ...p, isCorrect: true };
      } else if (existingPieceId && p.id === existingPieceId) {
        // 被覆盖的拼图块标记为未放置，回到处理区
        return { ...p, isCorrect: false };
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
                  {processingAreaPieces.map(piece => {
                    const transformState = pieceTransforms[piece.id] || { rotation: 0, flipX: false, flipY: false };
                    // 旋转后，左右/上下翻转的视觉方向会互换，这里做修正
                    const rot = ((transformState.rotation % 360) + 360) % 360;
                    let scaleX = 1, scaleY = 1;
                    if (rot % 180 === 0) {
                      // 0/180度，正常
                      scaleX = transformState.flipX ? -1 : 1;
                      scaleY = transformState.flipY ? -1 : 1;
                    } else {
                      // 90/270度，xy互换
                      scaleX = transformState.flipY ? -1 : 1;
                      scaleY = transformState.flipX ? -1 : 1;
                    }
                    const transform = `translate(-3%, -3%) rotate(${transformState.rotation}deg) scaleX(${scaleX}) scaleY(${scaleY})`;
                    return (
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
                        style={{ position: 'relative' }}
                      >
                        <img
                          src={piece.imageData}
                          alt={`拼图块 ${piece.id}`}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            clipPath: scaleAndTranslateClipPath(piece.clipPath),
                            transform,
                            transition: 'transform 0.2s',
                          }}
                          draggable={false}
                        />
                        {showAnswers && (
                          <div className="piece-number">{piece.gridRow * puzzleConfig.gridSize.cols + piece.gridCol + 1}</div>
                        )}
                        {selectedPiece === piece.id && (
                          <div className="selected-indicator">✓</div>
                        )}
                        {/* 旋转/翻转按钮，仅在选中时显示 */}
                        {selectedPiece === piece.id && (
                          <div style={{ position: 'absolute', right: 2, bottom: 2, display: 'flex', gap: 2 }}>
                            <button
                              type="button"
                              style={{ fontSize: 16, padding: '2px 6px', borderRadius: 4, border: '1px solid #ccc', background: '#fff', cursor: 'pointer', marginRight: 2 }}
                              onClick={e => { e.stopPropagation(); handleRotatePiece(piece.id); }}
                              title="旋转90°"
                            >
                              ⟳
                            </button>
                            <button
                              type="button"
                              style={{ fontSize: 16, padding: '2px 6px', borderRadius: 4, border: '1px solid #ccc', background: '#fff', cursor: 'pointer' }}
                              onClick={e => { e.stopPropagation(); handleFlipX(piece.id); }}
                              title="左右翻转"
                            >
                              ⇋
                            </button>
                            <button
                              type="button"
                              style={{ fontSize: 16, padding: '2px 6px', borderRadius: 4, border: '1px solid #ccc', background: '#fff', cursor: 'pointer' }}
                              onClick={e => { e.stopPropagation(); handleFlipY(piece.id); }}
                              title="上下翻转"
                            >
                              ⇅
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
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
                {puzzleConfig.gridSize.rows} × {puzzleConfig.gridSize.cols}
              </span>
            </div>
            {/* 使用异形拼图答题网格，采用方形拼图的模式 */}
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <IrregularAnswerGridIrregular
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

export default IrregularPuzzleGame;
