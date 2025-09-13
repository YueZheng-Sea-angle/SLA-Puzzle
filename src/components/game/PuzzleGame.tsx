import React, { useState, useCallback, useEffect } from 'react';
import { usePuzzleGame } from '../../hooks/usePuzzleGame';
import { PuzzleConfig, GameCompletionResult, GameState } from '../../types';
import { PuzzleWorkspace } from './PuzzleWorkspace';
import { GameCompletionModal } from './GameCompletionModal';
import { SaveLoadModal } from './SaveLoadModal';
import { LeaderboardModal } from '../leaderboard/LeaderboardModal';
import { Button } from '../common/Button';
import { OriginalImagePreview } from '../common/OriginalImagePreview';
import { Timer } from '../common/Timer';
import { GameHelpButton } from '../common/GameHelp';
import { useAuth } from '../../contexts/AuthContext';
import { calculateGameCompletion } from '../../utils/rewardSystem';
import { validateGameReward } from '../../utils/rewardDebugger';
import { HybridLeaderboardService } from '../../services/hybridLeaderboardService';
// import { musicManager } from '../../services/musicService';  // 暂时注释掉未使用的导入
import { themeManager, ThemeState } from '../../services/themeService';
import { getVolcanicJourneyDescription, isVolcanicJourneyPuzzle } from '../../data/volcanicJourneyDescriptions';
import './PuzzleGame.css';
import './PuzzleWorkspace.css';
import './GameNavbarFix.css';

interface PuzzleGameProps {
  puzzleConfig: PuzzleConfig;
  preloadedGameState?: GameState;
  onGameComplete?: (completionTime: number, moves: number) => void;
  onBackToMenu?: () => void;
  isMultiplayer?: boolean; // 是否为多人游戏模式
}

export const PuzzleGame: React.FC<PuzzleGameProps> = ({
  puzzleConfig,
  preloadedGameState,
  onGameComplete,
  onBackToMenu,
  isMultiplayer = false,
}) => {
  const [showAnswers, setShowAnswers] = useState(false);
  const [showOriginalImage, setShowOriginalImage] = useState(false);
  const [completionResult, setCompletionResult] = useState<GameCompletionResult | null>(null);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [isProcessingCompletion, setIsProcessingCompletion] = useState(false); // 防重复处理
  const [hasProcessedCompletion, setHasProcessedCompletion] = useState(false); // 标记是否已处理
  
  // 主题状态
  const [themeState, setThemeState] = useState<ThemeState>(themeManager.getThemeState());

  // 保存/加载相关状态
  const [showSaveLoadModal, setShowSaveLoadModal] = useState(false);
  const [saveLoadMode, setSaveLoadMode] = useState<'save' | 'load'>('save');

  // 排行榜相关状态
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  const { authState, handleGameCompletion } = useAuth();

  const {
    gameState,
    isGameStarted,
    selectedPiece,
    setSelectedPiece,
    timer,
    initializeGame,
    placePieceToSlot,
    removePieceFromSlot,
    getHint,
    rotatePiece,
    flipPiece,
    undo,
    redo,
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
    // 保存/加载相关
    saveGame,
    loadGame,
    getSavedGames,
    deleteSavedGame,
    canSaveGame,
    getGameProgress,
  } = usePuzzleGame({
    userId: authState.user?.id,
    preloadedGameState
  });

  // 开始游戏
  const startGame = useCallback(() => {
    initializeGame(puzzleConfig);
    setHasProcessedCompletion(false); // 重置完成处理标记
    setShowCompletionModal(false);
    setCompletionResult(null);
    
    // 不在这里播放音乐，因为这个函数会在确认界面被重复调用
  }, [initializeGame, puzzleConfig]);

  // 不在这里播放音乐，音乐播放已移至MainMenu的handleStartGame中

  // 处理再玩一次
  const handlePlayAgain = useCallback(() => {
    setShowCompletionModal(false);
    setCompletionResult(null);
    setHasProcessedCompletion(false); // 重置完成处理标记
    resetGame();
  }, [resetGame]);

  // 处理返回菜单
  const handleBackToMenu = useCallback(() => {
    setShowCompletionModal(false);
    setCompletionResult(null);
    setHasProcessedCompletion(false); // 重置完成处理标记
    if (onBackToMenu) {
      onBackToMenu();
    }
  }, [onBackToMenu]);

  // 处理保存游戏
  const handleSaveGame = useCallback(() => {
    setSaveLoadMode('save');
    setShowSaveLoadModal(true);
  }, []);


  // 关闭保存/加载模态框
  const handleCloseSaveLoadModal = useCallback(() => {
    setShowSaveLoadModal(false);
  }, []);

  // 处理查看排行榜
  const handleShowLeaderboard = useCallback(() => {
    setShowLeaderboard(true);
  }, []);

  // 关闭排行榜模态框
  const handleCloseLeaderboard = useCallback(() => {
    setShowLeaderboard(false);
  }, []);

  // 处理拼图完成
  React.useEffect(() => {
    // 只有当游戏完成且尚未处理过时才执行
    if (gameState?.isCompleted && !hasProcessedCompletion && !isProcessingCompletion) {
      setIsProcessingCompletion(true);
      setHasProcessedCompletion(true);

      const processGameCompletion = async () => {
        try {
          // 多人游戏模式下只调用完成回调，不进行奖励计算
          if (isMultiplayer) {
            if (onGameComplete) {
              onGameComplete(timer, gameState.moves);
            }
            return;
          }

          if (authState.isAuthenticated && authState.user) {
            // 根据拼图配置计算理想步数
            const calculatePerfectMoves = (config: PuzzleConfig): number => {
              const baseSize = config.pieces.length;
              const difficultyMultiplier: Record<string, number> = {
                'easy': 0.8,
                'medium': 1.0,
                'hard': 1.3,
                'expert': 1.6,
                'custom': 1.0  // 添加自定义难度支持
              };

              // 基础公式：拼图块数 * 难度系数 * 1.2
              const multiplier = difficultyMultiplier[config.difficulty] || 1.0;
              return Math.round(baseSize * multiplier * 1.2);
            };

            const perfectMoves = calculatePerfectMoves(puzzleConfig);
            const totalPieces = puzzleConfig.pieces.length;

            console.log('🎮 游戏完成数据:', {
              难度: puzzleConfig.difficulty,
              完成时间: timer,
              实际步数: gameState.moves,
              理想步数: perfectMoves,
              总拼图块: totalPieces,
              用户当前金币: authState.user.coins,
              用户当前经验: authState.user.experience,
              当前游戏完成数: authState.user.gamesCompleted,
              计算用游戏完成数: authState.user.gamesCompleted // 使用当前真实值而非+1
            });

            // 计算游戏完成结果 - 使用当前真实状态，避免状态不一致
            const result = calculateGameCompletion(
              puzzleConfig.difficulty,
              timer,
              gameState.moves,
              {
                gamesCompleted: authState.user.gamesCompleted, // ✅ 使用当前真实值，成就系统内部会处理+1逻辑
                level: authState.user.level,
                experience: authState.user.experience,
                bestTimes: authState.user.bestTimes,
                recentGameResults: (authState.user as any).recentGameResults || [],
                difficultyStats: (authState.user as any).difficultyStats || {
                  easyCompleted: 0,
                  mediumCompleted: 0,
                  hardCompleted: 0,
                  expertCompleted: 0,
                }
              },
              authState.user.achievements || [],
              perfectMoves,
              totalPieces
            );

            console.log('🎯 前端奖励计算结果:', {
              基础奖励: result.rewards,
              是否新记录: result.isNewRecord,
              新成就数量: result.rewards.achievements?.length || 0
            });

            // 使用调试工具验证计算
            const validation = validateGameReward(
              puzzleConfig.difficulty,
              timer,
              gameState.moves,
              perfectMoves,
              {
                gamesCompleted: authState.user.gamesCompleted + 1,
                level: authState.user.level,
                experience: authState.user.experience,
                bestTimes: authState.user.bestTimes
              }
            );

            console.log('🔍 奖励验证结果:', validation);

            setCompletionResult(result);
            setShowCompletionModal(true);

            // 记录用户完成前的状态，用于后续比较
            const userBeforeCompletion = {
              coins: authState.user.coins,
              experience: authState.user.experience
            };

            console.log('🔄 开始处理游戏完成:', {
              前端计算奖励: result.rewards,
              用户完成前状态: userBeforeCompletion,
              处理标志: { hasProcessedCompletion, isProcessingCompletion }
            });

            // 更新用户数据
            const updateSuccess = await handleGameCompletion(result);
            
            if (updateSuccess) {
              console.log('✅ 游戏完成处理成功');
              
              // 注意：不再使用 setTimeout，因为 handleGameCompletion 内部已经处理了奖励对比
              // AuthContext 中的 handleGameCompletion 会在状态更新后立即进行对比分析
            } else {
              console.error('❌ 游戏完成处理失败');
            }

            // 记录到排行榜（仅限方形拼图）
            if (authState.user && puzzleConfig.pieceShape === 'square') {
              try {
                await HybridLeaderboardService.addEntry({
                  puzzleId: puzzleConfig.id,
                  puzzleName: puzzleConfig.name,
                  playerName: authState.user.username,
                  completionTime: timer,
                  moves: gameState.moves,
                  difficulty: puzzleConfig.difficulty,
                  pieceShape: puzzleConfig.pieceShape,
                  gridSize: `${puzzleConfig.gridSize.rows}x${puzzleConfig.gridSize.cols}`
                });
              } catch (error) {
                console.error('保存排行榜记录失败:', error);
              }
            }

            // 调用原始的完成回调
            if (onGameComplete) {
              onGameComplete(timer, gameState.moves);
            }
          } else if (onGameComplete) {
            // 未登录用户仍然调用原始完成回调
            onGameComplete(timer, gameState.moves);
          }
        } catch (error) {
          console.error('处理游戏完成失败:', error);
        } finally {
          setIsProcessingCompletion(false);
        }
      };

      processGameCompletion();
    }
  }, [gameState?.isCompleted, hasProcessedCompletion, isProcessingCompletion]); // 移除了频繁变化的依赖项

  // 处理键盘快捷键
  React.useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'r':
        case 'R':
          if (selectedPiece) {
            rotatePiece(selectedPiece, 90);
          }
          break;
        case 'l':
        case 'L':
          if (selectedPiece) {
            rotatePiece(selectedPiece, -90);
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
        case 'y':
        case 'Y':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            redo();
          }
          break;
        case 's':
        case 'S':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            if (canSaveGame()) {
              handleSaveGame();
            }
          }
          break;
        case 'a':
        case 'A':
          if (!e.ctrlKey && !e.metaKey) {
            setShowAnswers(!showAnswers);
          }
          break;
        case 'h':
        case 'H':
          if (!e.ctrlKey && !e.metaKey) {
            // TODO: 实现帮助功能
            alert('帮助功能正在开发中！');
          }
          break;
        case 'Escape':
          if (showSaveLoadModal) {
            setShowSaveLoadModal(false);
          } else {
            setSelectedPiece(null);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedPiece, rotatePiece, flipPiece, undo, redo, setSelectedPiece, canSaveGame, handleSaveGame, showAnswers, setShowAnswers, showSaveLoadModal]);

  // 订阅主题变化
  useEffect(() => {
    const unsubscribe = themeManager.subscribe((newThemeState) => {
      setThemeState(newThemeState);
    });
    
    return unsubscribe;
  }, []);

  if (!isGameStarted) {
    return (
      <div 
        className={`puzzle-game-start ${themeState.currentTheme === 'night' ? 'night-mode' : ''}`}
        style={{
          backgroundImage: `url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1IiBoZWlnaHQ9IjUiPgo8cmVjdCB3aWR0aD0iNSIgaGVpZ2h0PSI1IiBmaWxsPSIjZmZmIj48L3JlY3Q+CjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiNmZmQ2ZTAiPjwvcmVjdD4KPC9zdmc+'), url(${themeState.backgroundImage})`
        }}
      >
        <div className="puzzle-game-overlay"></div>
        <div className="start-content">
          <h2>{puzzleConfig.name}</h2>
          <div className="puzzle-info">
            <p>难度: {puzzleConfig.difficulty}</p>
            <p>拼图块: {puzzleConfig.gridSize.rows} × {puzzleConfig.gridSize.cols}</p>
            <p>形状: {puzzleConfig.pieceShape === 'square' ? '方形' :
              puzzleConfig.pieceShape === 'triangle' ? '三角形' : '异形'}</p>
          </div>
          
          {/* 火山旅梦特殊简介 */}
          {isVolcanicJourneyPuzzle(puzzleConfig.name) && (
            <div className="volcanic-journey-description">
              <div className="description-header">
                <span className="volcano-icon">🌋</span>
                <span className="description-title">SoLong,Adele: Home away from home</span>
              </div>
              <div className="description-content">
                {getVolcanicJourneyDescription(puzzleConfig.name)?.split('\n').map((line, index) => (
                  <p key={index} className="description-line">{line}</p>
                ))}
              </div>
            </div>
          )}
          
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
    <div 
      className={`puzzle-game ${themeState.currentTheme === 'night' ? 'night-mode' : ''}`}
      style={{
        backgroundImage: `url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1IiBoZWlnaHQ9IjUiPgo8cmVjdCB3aWR0aD0iNSIgaGVpZ2h0PSI1IiBmaWxsPSIjZmZmIj48L3JlY3Q+CjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiNmZmQ2ZTAiPjwvcmVjdD4KPC9zdmc+'), url(${themeState.backgroundImage})`
      }}
    >
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
          {/* 在多人模式下隐藏提示按钮 */}
          {!isMultiplayer && (
            <Button
              onClick={getHint}
              variant="primary"
              size="small"
              className="hint-button"
            >
              💡 提示
            </Button>
          )}

          <Button 
            onClick={() => setShowOriginalImage(true)} 
            variant="primary" 
            size="small"
            className="original-image-button"
          >
            👀 查看原图
          </Button>
          {/* 在多人模式下隐藏显示答案按钮 */}
          {!isMultiplayer && (
            <Button 
              onClick={() => setShowAnswers(!showAnswers)} 
              variant="primary"
              size="small"
              className="answer-toggle"
            >
              {showAnswers ? '👁️ 隐藏答案' : '👁️‍🗨️ 显示答案'}
            </Button>
          )}
          <Button onClick={undo} variant="primary" size="small" disabled={!gameState || gameState.history.length === 0}>
            ↩️ 撤销
          </Button>
          <Button onClick={redo} variant="primary" size="small" disabled={!gameState || gameState.redoStack.length === 0}>
            ↪️ 重做
          </Button>
          <Button
            onClick={handleSaveGame}
            variant="primary"
            size="small"
            className="save-button"
            disabled={!canSaveGame()}
          >
            💾 保存进度
          </Button>
          {(puzzleConfig.pieceShape === 'square' || puzzleConfig.pieceShape === 'triangle') && (
            <Button
              onClick={handleShowLeaderboard}
              variant="primary"
              size="small"
              className="leaderboard-button"
            >
              🏆 排行榜
            </Button>
          )}
          <Button onClick={resetGame} variant="primary" size="small">
            🔄 重置游戏
          </Button>
          <Button onClick={onBackToMenu} variant="danger" size="small">
            🚪 退出游戏
          </Button>
        </div>
      </div>

  <OriginalImagePreview
    imageUrl={puzzleConfig.originalImage}
    isVisible={showOriginalImage}
    onClose={() => setShowOriginalImage(false)}
  />

  {/* 游戏主体 */}
      <div className="game-content">
        {gameState && (
          <PuzzleWorkspace
            gameState={gameState}
            selectedPiece={selectedPiece}
            showAnswers={isMultiplayer ? false : showAnswers}
            onPieceSelect={setSelectedPiece}
            onPlacePiece={placePieceToSlot}
            onRemovePiece={removePieceFromSlot}
            onRotatePiece={(pieceId) => rotatePiece(pieceId, 90)}
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

        {/* 新的游戏完成弹窗 */}
        {completionResult && (
          <GameCompletionModal
            result={completionResult}
            isVisible={showCompletionModal}
            onPlayAgain={handlePlayAgain}
            onBackToMenu={handleBackToMenu}
          />
        )}

        {/* 简单完成提示（未登录用户或奖励弹窗未显示时，且非多人游戏） */}
        {gameState?.isCompleted && !showCompletionModal && !isMultiplayer && (
          <div className="completion-modal">
            <div className="modal-content">
              <h3>🎉 恭喜完成！</h3>
              <p>完成时间: {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}</p>
              <p>总步数: {gameState.moves}</p>
              <div className="modal-actions">
                <Button onClick={handlePlayAgain} variant="primary">
                  再玩一次
                </Button>
                <Button onClick={handleBackToMenu} variant="secondary">
                  返回菜单
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* 保存/加载模态框 */}
        <SaveLoadModal
          isVisible={showSaveLoadModal}
          onClose={handleCloseSaveLoadModal}
          mode={saveLoadMode}
          savedGames={getSavedGames()}
          currentGameProgress={getGameProgress()}
          onSaveGame={saveGame}
          onLoadGame={loadGame}
          onDeleteSave={deleteSavedGame}
        />

        {/* 排行榜模态框 */}
        {(puzzleConfig.pieceShape === 'square' || puzzleConfig.pieceShape === 'triangle') && (
          <LeaderboardModal
            isVisible={showLeaderboard}
            onClose={handleCloseLeaderboard}
            puzzleId={puzzleConfig.id}
            puzzleName={puzzleConfig.name}
            difficulty={puzzleConfig.difficulty}
            pieceShape={puzzleConfig.pieceShape}
          />
        )}
      </div>

      {/* 操作提示 */}
      <div className="game-tips">
        <p>💡 操作提示：点击选择拼图块，再点击答题卡槽位放置 | R键顺时针旋转, L键逆时针旋转 | F键翻转 | Ctrl+Z 撤销 | Ctrl+S 保存进度 | A键切换答案显示 | H键查看提示 | ESC 取消选择</p>
      </div>
    </div>
  );
};