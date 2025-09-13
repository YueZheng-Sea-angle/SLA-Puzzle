import React, { useState, useCallback } from 'react';
import { usePuzzleGame } from '../hooks/usePuzzleGame';
import { PuzzleConfig, GameCompletionResult, GameState } from '../types';
import { PuzzleWorkspace } from '../components/game/PuzzleWorkspace';
import { GameCompletionModal } from '../components/game/GameCompletionModal';
import { SaveLoadModal } from '../components/game/SaveLoadModal';
import { LeaderboardModal } from '../components/leaderboard/LeaderboardModal';
import { Button } from '../components/common/Button';
import { Timer } from '../components/common/Timer';
import { GameHelpButton } from '../components/common/GameHelp';
import { useAuth } from '../contexts/AuthContext';
import { calculateGameCompletion } from '../utils/rewardSystem';
import { LeaderboardService } from '../services/leaderboardService';
import { getVolcanicJourneyDescription, isVolcanicJourneyPuzzle } from '../data/volcanicJourneyDescriptions';
import '../components/game/PuzzleGame.css';

interface TetrisPuzzleGameProps {
    puzzleConfig: PuzzleConfig;
    preloadedGameState?: GameState;
    onGameComplete?: (completionTime: number, moves: number) => void;
    onBackToMenu?: () => void;
    isMultiplayer?: boolean;
}

export const TetrisPuzzleGame: React.FC<TetrisPuzzleGameProps> = ({
    puzzleConfig,
    preloadedGameState,
    onGameComplete,
    onBackToMenu,
    isMultiplayer = false,
}) => {
    const [showAnswers, setShowAnswers] = useState(false);
    const [completionResult, setCompletionResult] = useState<GameCompletionResult | null>(null);
    const [showCompletionModal, setShowCompletionModal] = useState(false);
    const [isProcessingCompletion, setIsProcessingCompletion] = useState(false); // 防重复处理
    const [hasProcessedCompletion, setHasProcessedCompletion] = useState(false); // 标记是否已处理

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
    }, [initializeGame, puzzleConfig]);

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

    // 保存游戏
    const handleSaveGame = useCallback((description?: string) => {
        if (!canSaveGame()) {
            return { success: false, error: '当前无法保存游戏' };
        }

        return saveGame(description || '俄罗斯方块拼图存档');
    }, [canSaveGame, saveGame]);

    // 加载游戏
    const handleLoadGame = useCallback((saveId: string) => {
        const result = loadGame(saveId);
        if (result.success) {
            setHasProcessedCompletion(false); // 重置完成处理标记
            setShowCompletionModal(false);
            setCompletionResult(null);
        }
        return result;
    }, [loadGame]);

    // 删除存档
    const handleDeleteSave = useCallback((saveId: string) => {
        return deleteSavedGame(saveId);
    }, [deleteSavedGame]);

    // 打开保存游戏模态框
    const handleOpenSaveModal = useCallback(() => {
        setSaveLoadMode('save');
        setShowSaveLoadModal(true);
    }, []);

    // 打开加载游戏模态框
    const handleOpenLoadModal = useCallback(() => {
        setSaveLoadMode('load');
        setShowSaveLoadModal(true);
    }, []);

    // 关闭保存/加载模态框
    const handleCloseSaveLoadModal = useCallback(() => {
        setShowSaveLoadModal(false);
    }, []);

    // 打开排行榜
    const handleOpenLeaderboard = useCallback(() => {
        setShowLeaderboard(true);
    }, []);

    // 关闭排行榜
    const handleCloseLeaderboard = useCallback(() => {
        setShowLeaderboard(false);
    }, []);

    // 处理游戏完成
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
                            const difficultyMultiplier = {
                                'easy': 0.8,
                                'medium': 1.0,
                                'hard': 1.3,
                                'expert': 1.6
                            };

                            // 基础公式：拼图块数 * 难度系数 * 1.2
                            return Math.round(baseSize * difficultyMultiplier[config.difficulty] * 1.2);
                        };

                        const perfectMoves = calculatePerfectMoves(puzzleConfig);
                        const totalPieces = puzzleConfig.pieces.length;

                        // 计算游戏完成结果
                        const result = calculateGameCompletion(
                            puzzleConfig.difficulty,
                            timer,
                            gameState.moves,
                            {
                                gamesCompleted: authState.user.gamesCompleted, // ✅ 使用当前真实值，成就系统内部会处理+1逻辑
                                level: authState.user.level,
                                experience: authState.user.experience,
                                bestTimes: authState.user.bestTimes,
                                recentGameResults: (authState.user as any).recentGameResults || [], // 添加最近游戏结果
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

                        setCompletionResult(result);
                        setShowCompletionModal(true);

                        // 更新用户数据
                        await handleGameCompletion(result);

                        // 记录到排行榜（俄罗斯方块拼图）
                        if (authState.user) {
                            try {
                                LeaderboardService.addEntry({
                                    puzzleId: puzzleConfig.id,
                                    puzzleName: puzzleConfig.name,
                                    playerName: authState.user.username,
                                    completionTime: timer,
                                    moves: gameState.moves,
                                    difficulty: puzzleConfig.difficulty,
                                    pieceShape: 'tetris', // 俄罗斯方块形状
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
                    console.error('处理俄罗斯方块拼图游戏完成失败:', error);
                } finally {
                    setIsProcessingCompletion(false);
                }
            };

            processGameCompletion();
        }
    }, [gameState?.isCompleted, hasProcessedCompletion, isProcessingCompletion]); // 移除了频繁变化的依赖项

    // 如果没有游戏状态，显示开始界面
    if (!gameState || !isGameStarted) {
        return (
            <div className="puzzle-game-start">
                <div className="start-content">
                    <h2>{puzzleConfig.name}</h2>
                    <div className="puzzle-info">
                        <p>难度: {puzzleConfig.difficulty === 'easy' ? '简单' :
                            puzzleConfig.difficulty === 'medium' ? '中等' :
                                puzzleConfig.difficulty === 'hard' ? '困难' : '专家'}</p>
                        <p>拼图块: {puzzleConfig.gridSize.rows} × {puzzleConfig.gridSize.cols}</p>
                        <p>形状: 俄罗斯方块</p>
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
                        <Button onClick={handleBackToMenu} variant="secondary">
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
                    <h3>🟦 俄罗斯方块拼图 - {gameState.config.name}</h3>
                    <div className="game-stats">
                        <Timer time={timer} isRunning={!gameState.isCompleted} />
                        <span className="moves-counter">步数: {gameState.moves}</span>
                    </div>
                </div>

                <div className="game-controls">
                    <GameHelpButton />
                    <Button
                        onClick={() => getHint()}
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
                        onClick={undo}
                        variant="secondary"
                        size="small"
                        className="undo-button"
                        disabled={gameState.history.length === 0}
                    >
                        ↩️ 撤销
                    </Button>
                    <Button
                        onClick={redo}
                        variant="secondary"
                        size="small"
                        className="redo-button"
                        disabled={gameState.redoStack.length === 0}
                    >
                        ↪️ 重做
                    </Button>
                    <Button
                        onClick={handleOpenSaveModal}
                        variant="secondary"
                        size="small"
                        className="save-button"
                        disabled={!canSaveGame()}
                    >
                        💾 保存进度
                    </Button>
                    <Button
                        onClick={handleOpenLoadModal}
                        variant="secondary"
                        size="small"
                        className="load-button"
                    >
                        📁 加载游戏
                    </Button>
                    <Button
                        onClick={handleOpenLeaderboard}
                        variant="secondary"
                        size="small"
                        className="leaderboard-button"
                    >
                        🏆 排行榜
                    </Button>
                    <Button
                        onClick={resetGame}
                        variant="secondary"
                        size="small"
                        className="reset-button"
                    >
                        🔄 重置游戏
                    </Button>
                    <Button
                        onClick={handleBackToMenu}
                        variant="danger"
                        size="small"
                        className="back-button"
                    >
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
                        onPieceSelect={setSelectedPiece}
                        onPlacePiece={placePieceToSlot}
                        onRemovePiece={removePieceFromSlot}
                        onRotatePiece={(pieceId: string) => rotatePiece(pieceId, 90)}
                        onFlipPiece={flipPiece}
                        showAnswers={showAnswers}
                        // 拖拽相关 props
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
            </div>

            {/* 游戏完成模态框 */}
            <GameCompletionModal
                isVisible={showCompletionModal}
                result={completionResult!}
                onPlayAgain={handlePlayAgain}
                onBackToMenu={handleBackToMenu}
            />

            {/* 保存/加载模态框 */}
            <SaveLoadModal
                isVisible={showSaveLoadModal}
                mode={saveLoadMode}
                onClose={handleCloseSaveLoadModal}
                savedGames={getSavedGames()}
                currentGameProgress={getGameProgress()}
                onSaveGame={handleSaveGame}
                onLoadGame={handleLoadGame}
                onDeleteSave={handleDeleteSave}
            />

            {/* 排行榜模态框 */}
            <LeaderboardModal
                isVisible={showLeaderboard}
                onClose={handleCloseLeaderboard}
                puzzleId={gameState?.config.id}
                difficulty={gameState?.config.difficulty}
                pieceShape="tetris" // 指定为俄罗斯方块形状
            />
        </div>
    );
};
