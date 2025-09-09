import { useState, useCallback, useEffect, useRef } from 'react';
import {
  PuzzlePiece,
  GameState,
  GameMove,
  PuzzleConfig
} from '../types';
import { PuzzleSaveService } from '../services/puzzleSaveService';

interface UsePuzzleGameProps {
  userId?: string; // 用户ID，用于支持多用户保存
  preloadedGameState?: GameState; // 预加载的游戏状态
}

export function usePuzzleGame({ userId, preloadedGameState }: UsePuzzleGameProps = {}) {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [selectedPiece, setSelectedPiece] = useState<string | null>(null);

  // 处理拼图块选择
  const handlePieceSelect = useCallback((pieceId: string | null) => {
    setSelectedPiece(pieceId);
  }, []);
  const [timer, setTimer] = useState(0);
  const timerRef = useRef<number | null>(null);

  // 拖拽状态
  const [draggedPiece, setDraggedPiece] = useState<string | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<number | null>(null);

  // 如果有预加载的游戏状态，初始化游戏
  useEffect(() => {
    if (preloadedGameState) {
      setGameState(preloadedGameState);
      setIsGameStarted(true);
      setSelectedPiece(null);

      // 恢复计时器
      const elapsedSeconds = preloadedGameState.elapsedTime || 0;
      setTimer(elapsedSeconds);

      // 如果游戏没有完成，启动计时器
      if (!preloadedGameState.isCompleted) {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
        timerRef.current = setInterval(() => {
          setTimer(prev => {
            const newTime = prev + 1;
            // 同时更新游戏状态中的elapsedTime
            setGameState(prevState => {
              if (prevState && !prevState.isCompleted) {
                return { ...prevState, elapsedTime: newTime };
              }
              return prevState;
            });
            return newTime;
          });
        }, 1000);
      }
    }
  }, [preloadedGameState]);

  // 初始化游戏
  const initializeGame = useCallback((config: PuzzleConfig) => {
    const totalSlots = config.gridSize.rows * config.gridSize.cols;

    // 初始化答题卡网格（所有槽位都是空的）
    const answerGrid: (PuzzlePiece | null)[] = new Array(totalSlots).fill(null);

    // 重置所有拼图块到处理区
    const resetPieces = config.pieces.map(piece => ({
      ...piece,
      currentSlot: null, // 所有拼图块都在处理区
    }));

    const newGameState: GameState = {
      config: { ...config, pieces: resetPieces },
      startTime: new Date(),
      moves: 0,
      isCompleted: false,
      elapsedTime: 0,
      history: [],
      answerGrid,
    };

    setGameState(newGameState);
    setIsGameStarted(true);
    setTimer(0);

    // 启动计时器
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    timerRef.current = setInterval(() => {
      setTimer(prev => {
        const newTime = prev + 1;
        // 同时更新游戏状态中的elapsedTime
        setGameState(prevState => {
          if (prevState && !prevState.isCompleted) {
            return { ...prevState, elapsedTime: newTime };
          }
          return prevState;
        });
        return newTime;
      });
    }, 1000);
  }, []);

  // 将拼图块放置到槽位
  const placePieceToSlot = useCallback((pieceId: string, targetSlot: number) => {

    setGameState(prev => {
      if (!prev) return null;

      const piece = prev.config.pieces.find(p => p.id === pieceId);
      if (!piece) return prev;

      // 三角形拼图特殊验证：检查上三角是否尝试放置到下三角槽位，反之亦然
      if (prev.config.pieceShape === 'triangle') {
        // 使用triangleType属性判断，如果没有则从ID判断
        const isUpperTrianglePiece = piece.triangleType === 'upper' || piece.id.includes('_upper');
        const isLowerTrianglePiece = piece.triangleType === 'lower' || piece.id.includes('_lower');
        const isUpperSlot = targetSlot % 2 === 0; // 偶数索引为上三角槽位
        const isLowerSlot = targetSlot % 2 === 1; // 奇数索引为下三角槽位

        // 如果上三角拼图块试图放置到下三角槽位，或下三角拼图块试图放置到上三角槽位，则取消操作
        if ((isUpperTrianglePiece && isLowerSlot) || (isLowerTrianglePiece && isUpperSlot)) {
          // 不执行放置操作，拼图块保持在处理区
          return prev;
        }
      }

      // 检查目标槽位是否已有拼图块
      const existingPiece = prev.answerGrid[targetSlot];

      // 更新答题卡网格
      const newAnswerGrid = [...prev.answerGrid];

      // 如果拼图块之前在其他槽位，清空原槽位
      if (piece.currentSlot !== null) {
        newAnswerGrid[piece.currentSlot] = null;
      }

      // 更新拼图块列表：处理现有拼图块和新拼图块
      const updatedPieces = prev.config.pieces.map(p => {
        if (existingPiece && p.id === existingPiece.id) {
          // 如果目标槽位有拼图块，将其移回处理区
          return { ...p, currentSlot: null };
        } else if (p.id === pieceId) {
          // 更新当前拼图块的槽位
          return { ...p, currentSlot: targetSlot };
        }
        return p;
      });

      // 将更新后的拼图块放入目标槽位
      const updatedPiece = updatedPieces.find(p => p.id === pieceId);
      newAnswerGrid[targetSlot] = updatedPiece || null;

      // 确定操作类型
      const actionType = existingPiece ? 'replace' : 'place';

      const move: GameMove = {
        id: Date.now().toString(),
        pieceId,
        action: actionType,
        fromSlot: piece.currentSlot,
        toSlot: targetSlot,
        replacedPieceId: existingPiece?.id,
        timestamp: new Date(),
      };

      const newGameState: GameState = {
        ...prev,
        config: { ...prev.config, pieces: updatedPieces },
        moves: prev.moves + 1,
        history: [...prev.history, move],
        answerGrid: newAnswerGrid,
      };

      // 检查是否完成拼图
      if (checkPuzzleComplete(newAnswerGrid)) {
        newGameState.isCompleted = true;
        newGameState.endTime = new Date();
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      }

      return newGameState;
    });

    // 成功放置后自动取消选择，避免用户误操作
    setSelectedPiece(null);
  }, []);

  // 将拼图块从槽位移回处理区
  const removePieceFromSlot = useCallback((pieceId: string) => {
    setGameState(prev => {
      if (!prev) return null;

      const piece = prev.config.pieces.find(p => p.id === pieceId);

      if (!piece || piece.currentSlot === null) {
        return prev;
      }

      // 更新答题卡网格
      const newAnswerGrid = [...prev.answerGrid];
      newAnswerGrid[piece.currentSlot] = null;

      // 更新拼图块列表
      const updatedPieces = prev.config.pieces.map(p =>
        p.id === pieceId ? { ...p, currentSlot: null } : p
      );

      const move: GameMove = {
        id: Date.now().toString(),
        pieceId,
        action: 'remove',
        fromSlot: piece.currentSlot,
        toSlot: null,
        timestamp: new Date(),
      };

      const newState = {
        ...prev,
        config: { ...prev.config, pieces: updatedPieces },
        moves: prev.moves + 1,
        history: [...prev.history, move],
        answerGrid: newAnswerGrid,
      };

      return newState;
    });

    // 如果移除的是当前选中的拼图块，取消选择
    if (selectedPiece === pieceId) {
      setSelectedPiece(null);
    }
  }, [selectedPiece]);

  // 获取提示：自动放置一个正确的拼图块，优先选择边缘位置
  const getHint = useCallback(() => {
    if (!gameState) return;

    const { pieces, gridSize, pieceShape } = gameState.config;
    const { answerGrid } = gameState;

    // 找出所有可以放置的拼图块（未放置的拼图块 + 位置错误的拼图块）
    const availablePieces: { piece: PuzzlePiece; isWrongPosition: boolean }[] = [];

    pieces.forEach(piece => {
      if (piece.currentSlot === null) {
        // 未放置的拼图块
        availablePieces.push({ piece, isWrongPosition: false });
      } else if (piece.currentSlot !== piece.correctSlot || piece.rotation !== 0 || piece.isFlipped) {
        // 位置错误的拼图块
        availablePieces.push({ piece, isWrongPosition: true });
      }
    });

    if (availablePieces.length === 0) return; // 没有可提示的拼图块

    // 计算边缘位置的优先级（边缘位置优先）
    const getSlotPriority = (slotIndex: number): number => {
      if (pieceShape === 'triangle') {
        // 对于三角形拼图，转换为方形索引来计算边缘
        const squareIndex = Math.floor(slotIndex / 2);
        const row = Math.floor(squareIndex / gridSize.cols);
        const col = squareIndex % gridSize.cols;

        // 边缘位置：第一行、最后一行、第一列、最后一列
        if (row === 0 || row === gridSize.rows - 1 || col === 0 || col === gridSize.cols - 1) {
          return 1; // 高优先级
        }
        return 2; // 低优先级
      } else {
        // 方形拼图
        const row = Math.floor(slotIndex / gridSize.cols);
        const col = slotIndex % gridSize.cols;

        if (row === 0 || row === gridSize.rows - 1 || col === 0 || col === gridSize.cols - 1) {
          return 1; // 高优先级
        }
        return 2; // 低优先级
      }
    };

    // 按优先级排序可用拼图块
    availablePieces.sort((a, b) => {
      const priorityA = getSlotPriority(a.piece.correctSlot);
      const priorityB = getSlotPriority(b.piece.correctSlot);

      // 边缘位置优先，错误位置的拼图块优先于未放置的拼图块
      if (priorityA !== priorityB) return priorityA - priorityB;
      if (a.isWrongPosition !== b.isWrongPosition) return a.isWrongPosition ? -1 : 1;
      return 0;
    });

    // 选择第一个拼图块进行提示
    const selectedPieceInfo = availablePieces[0];
    const targetPiece = selectedPieceInfo.piece;

    // 检查目标位置是否可用
    if (answerGrid[targetPiece.correctSlot] !== null &&
      answerGrid[targetPiece.correctSlot]?.id !== targetPiece.id) {
      // 如果目标位置被其他拼图块占用，先移除它
      const occupyingPiece = answerGrid[targetPiece.correctSlot];
      if (occupyingPiece) {
        // 直接调用removePieceFromSlot来移除占用的拼图块
        setGameState(prev => {
          if (!prev) return null;

          const newAnswerGrid = [...prev.answerGrid];
          newAnswerGrid[occupyingPiece.currentSlot!] = null;

          const updatedPieces = prev.config.pieces.map(p =>
            p.id === occupyingPiece.id ? { ...p, currentSlot: null } : p
          );

          return {
            ...prev,
            config: { ...prev.config, pieces: updatedPieces },
            answerGrid: newAnswerGrid,
          };
        });
      }
    }

    // 放置拼图块到正确位置
    setGameState(prev => {
      if (!prev) return null;

      const piece = prev.config.pieces.find(p => p.id === targetPiece.id);
      if (!piece) return prev;

      const newAnswerGrid = [...prev.answerGrid];

      // 如果拼图块之前在其他槽位，清空原槽位
      if (piece.currentSlot !== null) {
        newAnswerGrid[piece.currentSlot] = null;
      }

      // 放置拼图块到正确位置，并重置旋转和翻转
      newAnswerGrid[targetPiece.correctSlot] = { ...piece, rotation: 0, isFlipped: false };

      const updatedPieces = prev.config.pieces.map(p =>
        p.id === targetPiece.id
          ? { ...p, currentSlot: targetPiece.correctSlot, rotation: 0, isFlipped: false }
          : p
      );

      const newState = {
        ...prev,
        config: { ...prev.config, pieces: updatedPieces },
        answerGrid: newAnswerGrid,
        moves: prev.moves + 1,
      };

      // 检查游戏是否完成
      const isComplete = checkPuzzleComplete(newAnswerGrid);
      if (isComplete) {
        newState.isCompleted = true;
        newState.endTime = new Date();

        // 停止计时器
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      }

      return newState;
    });

    // 高亮显示提示的拼图块
    setSelectedPiece(targetPiece.id);

    // 2秒后取消选择，避免干扰用户操作
    setTimeout(() => {
      setSelectedPiece(null);
    }, 2000);

  }, [gameState, setSelectedPiece]);

  // 旋转拼图块
  const rotatePiece = useCallback((pieceId: string, delta: number) => {
    if (!gameState) return;

    setGameState(prev => {
      if (!prev) return null;

      const updatedPieces = prev.config.pieces.map(piece =>
        piece.id === pieceId ? { ...piece, rotation: (piece.rotation + delta + 360) % 360 } : piece
      );

      const move: GameMove = {
        id: Date.now().toString(),
        pieceId,
        action: 'rotate',
        timestamp: new Date(),
      };

      return {
        ...prev,
        config: { ...prev.config, pieces: updatedPieces },
        moves: prev.moves + 1,
        history: [...prev.history, move],
      };
    });
  }, [gameState]);

  // 翻转拼图块
  const flipPiece = useCallback((pieceId: string) => {
    if (!gameState) return;

    setGameState(prev => {
      if (!prev) return null;

      const updatedPieces = prev.config.pieces.map(piece =>
        piece.id === pieceId ? { ...piece, isFlipped: !piece.isFlipped } : piece
      );

      const move: GameMove = {
        id: Date.now().toString(),
        pieceId,
        action: 'flip',
        timestamp: new Date(),
      };

      return {
        ...prev,
        config: { ...prev.config, pieces: updatedPieces },
        moves: prev.moves + 1,
        history: [...prev.history, move],
      };
    });
  }, [gameState]);

  // 检查拼图是否完成
  const checkPuzzleComplete = useCallback((answerGrid: (PuzzlePiece | null)[]): boolean => {
    // 检查所有槽位是否都被填满
    if (answerGrid.some(slot => slot === null)) {
      return false;
    }

    // 检查每个拼图块是否在正确的位置和方向
    return answerGrid.every((piece, slotIndex) => {
      if (!piece) return false;
      // 基础位置检查
      const isCorrectPosition = piece.correctSlot === slotIndex;
      // 旋转和翻转检查（正确状态应为未旋转且未翻转）
      const isCorrectOrientation = piece.rotation === 0 && piece.isFlipped === false;
      return isCorrectPosition && isCorrectOrientation;
    });
  }, []);

  // 撤销操作
  const undo = useCallback(() => {
    if (!gameState || gameState.history.length === 0) return;

    const lastMove = gameState.history[gameState.history.length - 1];
    const newHistory = gameState.history.slice(0, -1);

    setGameState(prev => {
      if (!prev) return null;

      let newAnswerGrid = [...prev.answerGrid];
      let updatedPieces = [...prev.config.pieces];

      switch (lastMove.action) {
        case 'place':
          // 撤销放置：将拼图块从槽位移回原位置
          if (lastMove.toSlot !== null && lastMove.toSlot !== undefined) {
            newAnswerGrid[lastMove.toSlot] = null;
          }
          updatedPieces = updatedPieces.map(piece =>
            piece.id === lastMove.pieceId
              ? { ...piece, currentSlot: lastMove.fromSlot || null }
              : piece
          );
          // 如果从其他槽位移动，需要恢复原槽位
          if (lastMove.fromSlot !== null && lastMove.fromSlot !== undefined) {
            const originalPiece = updatedPieces.find(p => p.id === lastMove.pieceId);
            if (originalPiece) {
              newAnswerGrid[lastMove.fromSlot] = { ...originalPiece, currentSlot: lastMove.fromSlot };
            }
          }
          break;
        case 'remove':
          // 撤销移除：将拼图块放回槽位
          if (lastMove.fromSlot !== null && lastMove.fromSlot !== undefined) {
            const piece = updatedPieces.find(p => p.id === lastMove.pieceId);
            if (piece) {
              const fromSlot = lastMove.fromSlot as number;
              newAnswerGrid[fromSlot] = { ...piece, currentSlot: fromSlot };
              updatedPieces = updatedPieces.map(p =>
                p.id === lastMove.pieceId ? { ...p, currentSlot: fromSlot } : p
              );
            }
          }
          break;
        case 'replace':
          // 撤销替换：将新拼图块移回原位置，恢复被替换的拼图块
          if (lastMove.toSlot !== null && lastMove.toSlot !== undefined) {
            const toSlot = lastMove.toSlot as number;
            // 移除新放置的拼图块
            newAnswerGrid[toSlot] = null;

            // 如果被替换的拼图块存在，将其恢复到原位置
            if (lastMove.replacedPieceId) {
              const replacedPiece = updatedPieces.find(p => p.id === lastMove.replacedPieceId);
              if (replacedPiece) {
                newAnswerGrid[toSlot] = { ...replacedPiece, currentSlot: toSlot };
                updatedPieces = updatedPieces.map(p =>
                  p.id === lastMove.replacedPieceId ? { ...p, currentSlot: toSlot } : p
                );
              }
            }

            // 将新拼图块移回原位置
            updatedPieces = updatedPieces.map(piece =>
              piece.id === lastMove.pieceId
                ? { ...piece, currentSlot: lastMove.fromSlot || null }
                : piece
            );

            // 如果新拼图块原来在其他槽位，恢复那个槽位
            if (lastMove.fromSlot !== null && lastMove.fromSlot !== undefined) {
              const originalPiece = updatedPieces.find(p => p.id === lastMove.pieceId);
              if (originalPiece) {
                newAnswerGrid[lastMove.fromSlot] = { ...originalPiece, currentSlot: lastMove.fromSlot };
              }
            }
          }
          break;
        case 'rotate':
          // 撤销旋转（预留功能）
          updatedPieces = updatedPieces.map(piece =>
            piece.id === lastMove.pieceId
              ? { ...piece, rotation: (piece.rotation - 90 + 360) % 360 }
              : piece
          );
          break;
        case 'flip':
          // 撤销翻转（预留功能）
          updatedPieces = updatedPieces.map(piece =>
            piece.id === lastMove.pieceId
              ? { ...piece, isFlipped: !piece.isFlipped }
              : piece
          );
          break;
      }

      return {
        ...prev,
        config: { ...prev.config, pieces: updatedPieces },
        moves: Math.max(0, prev.moves - 1),
        history: newHistory,
        answerGrid: newAnswerGrid,
      };
    });
  }, [gameState]);

  // 重置游戏
  const resetGame = useCallback(() => {
    if (!gameState) return;
    initializeGame(gameState.config);
  }, [gameState, initializeGame]);

  // 拖拽开始
  const handleDragStart = useCallback((pieceId: string) => {
    setDraggedPiece(pieceId);
  }, []);

  // 拖拽结束
  const handleDragEnd = useCallback(() => {
    setDraggedPiece(null);
    setDragOverSlot(null);
  }, []);

  // 拖拽悬停在槽位上
  const handleDragOver = useCallback((slotIndex: number) => {
    setDragOverSlot(slotIndex);
  }, []);

  // 拖拽离开槽位
  const handleDragLeave = useCallback(() => {
    setDragOverSlot(null);
  }, []);

  // 放置到槽位
  const handleDropToSlot = useCallback((targetSlot: number) => {
    if (!draggedPiece || !gameState) return;

    // 使用现有的放置逻辑
    placePieceToSlot(draggedPiece, targetSlot);

    // 清理拖拽状态
    setDraggedPiece(null);
    setDragOverSlot(null);
  }, [draggedPiece, gameState, placePieceToSlot]);

  // 放置到处理区（移除）
  const handleDropToProcessingArea = useCallback(() => {
    if (!draggedPiece || !gameState) return;

    // 使用现有的移除逻辑
    removePieceFromSlot(draggedPiece);

    // 清理拖拽状态
    setDraggedPiece(null);
    setDragOverSlot(null);
  }, [draggedPiece, gameState, removePieceFromSlot]);

  // 保存游戏进度
  const saveGame = useCallback((description?: string) => {
    if (!gameState) {
      return { success: false, error: '没有正在进行的游戏' };
    }

    if (gameState.isCompleted) {
      return { success: false, error: '已完成的游戏无法保存' };
    }

    return PuzzleSaveService.saveGame(gameState, description, userId);
  }, [gameState, userId]);

  // 加载游戏进度
  const loadGame = useCallback((saveId: string) => {
    const result = PuzzleSaveService.loadGame(saveId);

    if (result.success && result.gameState) {
      setGameState(result.gameState);
      setIsGameStarted(true);
      setSelectedPiece(null);

      // 恢复计时器
      const elapsedSeconds = result.gameState.elapsedTime || 0;
      setTimer(elapsedSeconds);

      // 如果游戏没有完成，启动计时器
      if (!result.gameState.isCompleted) {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
        timerRef.current = setInterval(() => {
          setTimer(prev => {
            const newTime = prev + 1;
            // 同时更新游戏状态中的elapsedTime
            setGameState(prevState => {
              if (prevState && !prevState.isCompleted) {
                return { ...prevState, elapsedTime: newTime };
              }
              return prevState;
            });
            return newTime;
          });
        }, 1000);
      }
    }

    return result;
  }, []);

  // 获取保存的游戏列表
  const getSavedGames = useCallback(() => {
    return PuzzleSaveService.getSavedGames(userId);
  }, [userId]);

  // 删除保存的游戏
  const deleteSavedGame = useCallback((saveId: string) => {
    return PuzzleSaveService.deleteSavedGame(saveId);
  }, []);

  // 检查是否可以保存游戏
  const canSaveGame = useCallback(() => {
    return gameState && !gameState.isCompleted && isGameStarted;
  }, [gameState, isGameStarted]);

  // 获取当前游戏进度百分比
  const getGameProgress = useCallback(() => {
    if (!gameState || !gameState.answerGrid) return 0;

    const totalSlots = gameState.answerGrid.length;
    const filledSlots = gameState.answerGrid.filter(slot => slot !== null).length;

    return totalSlots > 0 ? (filledSlots / totalSlots) * 100 : 0;
  }, [gameState]);

  // 清理计时器
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  return {
    gameState,
    isGameStarted,
    selectedPiece,
    setSelectedPiece,
    handlePieceSelect,
    timer,
    initializeGame,
    placePieceToSlot,
    removePieceFromSlot,
    getHint,
    rotatePiece,
    flipPiece,
    undo,
    resetGame,
    checkPuzzleComplete,
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
  };
}