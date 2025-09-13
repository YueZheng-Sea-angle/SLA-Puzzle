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
      // 确保预加载的状态包含 redoStack
      const stateWithRedoStack = {
        ...preloadedGameState,
        redoStack: preloadedGameState.redoStack || []
      };
      setGameState(stateWithRedoStack);
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
      redoStack: [], // 初始化重做栈
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

      // 检查是否是自我替换（拼图块拖拽到自己当前所在的槽位）
      const existingPieceInSlot = prev.answerGrid[targetSlot];
      if (existingPieceInSlot && existingPieceInSlot.id === pieceId) {
        // 如果是拖拽到自己当前所在的槽位，直接返回，不进行任何操作
        return prev;
      }

      // 俄罗斯方块拼图特殊处理
      if (prev.config.pieceShape === 'tetris' && piece.tetrisShape && piece.occupiedPositions) {
        // 计算俄罗斯方块在新位置需要占据的所有槽位
        const gridCols = prev.config.gridSize.cols;
        const targetRow = Math.floor(targetSlot / gridCols);
        const targetCol = targetSlot % gridCols;

        // 计算俄罗斯方块的相对位置偏移（基于锚点）
        const minRow = Math.min(...piece.occupiedPositions.map(pos => pos[0]));
        const minCol = Math.min(...piece.occupiedPositions.map(pos => pos[1]));

        // 计算新的占据位置
        const newOccupiedSlots: number[] = [];
        let isValidPlacement = true;

        for (const [relRow, relCol] of piece.occupiedPositions) {
          const newRow = targetRow + (relRow - minRow);
          const newCol = targetCol + (relCol - minCol);
          const newSlot = newRow * gridCols + newCol;

          // 检查是否超出边界
          if (newRow < 0 || newRow >= prev.config.gridSize.rows ||
            newCol < 0 || newCol >= gridCols) {
            isValidPlacement = false;
            break;
          }

          // 检查是否与其他拼图块冲突（但允许与自己冲突，用于移动）
          if (prev.answerGrid[newSlot] && prev.answerGrid[newSlot]?.id !== pieceId) {
            isValidPlacement = false;
            break;
          }

          newOccupiedSlots.push(newSlot);
        }

        if (!isValidPlacement) {
          return prev; // 无效放置，取消操作
        }

        // 更新答题卡网格 - 先清空俄罗斯方块之前占用的所有槽位
        const newAnswerGrid = [...prev.answerGrid];
        if (piece.currentSlot !== null) {
          // 找到该俄罗斯方块当前占据的所有槽位并清空
          for (let i = 0; i < newAnswerGrid.length; i++) {
            if (newAnswerGrid[i]?.id === pieceId) {
              newAnswerGrid[i] = null;
            }
          }
        }

        // 创建更新后的拼图块，保持原始的cellImages不变
        const updatedPiece = {
          ...piece,
          currentSlot: targetSlot
        };

        // 将俄罗斯方块放置到新的所有槽位
        newOccupiedSlots.forEach(slotIndex => {
          newAnswerGrid[slotIndex] = updatedPiece;
        });

        // 更新拼图块状态
        const updatedPieces = prev.config.pieces.map(p => {
          if (p.id === pieceId) {
            return updatedPiece;
          }
          return p;
        });

        const move: GameMove = {
          id: Date.now().toString(),
          pieceId,
          action: 'place',
          fromSlot: piece.currentSlot,
          toSlot: targetSlot,
          timestamp: new Date(),
        };

        const newGameState: GameState = {
          ...prev,
          config: { ...prev.config, pieces: updatedPieces },
          moves: prev.moves + 1,
          history: [...prev.history, move],
          redoStack: [], // 执行新操作时清空重做栈
          answerGrid: newAnswerGrid,
        };

        // 检查是否完成拼图（俄罗斯方块完成条件：所有槽位都被填满）
        const isComplete = newAnswerGrid.every(slot => slot !== null);
        if (isComplete) {
          newGameState.isCompleted = true;
          newGameState.endTime = new Date();
          if (timerRef.current) {
            clearInterval(timerRef.current);
          }
        }

        return newGameState;
      }

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
        redoStack: [], // 执行新操作时清空重做栈
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

      // 俄罗斯方块特殊处理：清空所有占据的槽位
      if (prev.config.pieceShape === 'tetris') {
        // 找到该俄罗斯方块占据的所有槽位并清空
        for (let i = 0; i < newAnswerGrid.length; i++) {
          if (newAnswerGrid[i]?.id === pieceId) {
            newAnswerGrid[i] = null;
          }
        }
      } else {
        // 普通拼图块只清空单个槽位
        newAnswerGrid[piece.currentSlot] = null;
      }

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
        redoStack: [], // 执行新操作时清空重做栈
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

      // 俄罗斯方块特殊处理
      if (prev.config.pieceShape === 'tetris' && piece.correctSlots) {
        // 如果拼图块之前在其他槽位，清空所有原槽位
        if (piece.currentSlot !== null) {
          // 找到该俄罗斯方块当前占据的所有槽位并清空
          for (let i = 0; i < newAnswerGrid.length; i++) {
            if (newAnswerGrid[i]?.id === piece.id) {
              newAnswerGrid[i] = null;
            }
          }
        }

        // 检查并清空目标位置的冲突拼图块
        for (const slotIndex of piece.correctSlots) {
          if (newAnswerGrid[slotIndex] && newAnswerGrid[slotIndex]?.id !== piece.id) {
            // 清空冲突的拼图块
            const conflictPieceId = newAnswerGrid[slotIndex]!.id;
            // 清空该冲突拼图块的所有槽位
            for (let i = 0; i < newAnswerGrid.length; i++) {
              if (newAnswerGrid[i]?.id === conflictPieceId) {
                newAnswerGrid[i] = null;
              }
            }
          }
        }

        // 放置俄罗斯方块到所有正确的槽位
        const updatedPiece = {
          ...piece,
          currentSlot: piece.correctSlots[0],
          rotation: 0,
          isFlipped: false
        };

        // 确保cellImages映射正确（恢复到原始状态）
        if (piece.occupiedPositions && piece.cellImages) {
          const originalCellImages: { [key: string]: string } = {};

          // 直接复制所有已存在的cellImages，确保没有丢失
          for (const [key, imageData] of Object.entries(piece.cellImages)) {
            originalCellImages[key] = imageData;
          }

          // 如果某些原始键值不存在，尝试重建映射
          const expectedKeys = piece.occupiedPositions.map(pos => `${pos[0]}-${pos[1]}`);
          const existingKeys = Object.keys(piece.cellImages);

          // 检查是否所有期望的键都存在
          for (let i = 0; i < expectedKeys.length; i++) {
            const expectedKey = expectedKeys[i];
            if (!originalCellImages[expectedKey]) {
              // 尝试从现有的键值中找到对应的图像
              if (existingKeys[i] && piece.cellImages[existingKeys[i]]) {
                originalCellImages[expectedKey] = piece.cellImages[existingKeys[i]];
              }
            }
          }

          updatedPiece.cellImages = originalCellImages;
        }

        piece.correctSlots.forEach(slotIndex => {
          newAnswerGrid[slotIndex] = updatedPiece;
        });

        const updatedPieces = prev.config.pieces.map(p => {
          if (p.id === targetPiece.id) {
            return updatedPiece;
          }
          // 清空被移除的冲突拼图块
          if (newAnswerGrid.every(slot => slot?.id !== p.id)) {
            return { ...p, currentSlot: null };
          }
          return p;
        });

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
      } else {
        // 普通拼图块处理
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
      }
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
        piece.id === pieceId ? { ...piece, rotation: piece.rotation + delta } : piece
      );

      const move: GameMove = {
        id: Date.now().toString(),
        pieceId,
        action: 'rotate',
        timestamp: new Date(),
        delta,
      };

      return {
        ...prev,
        config: { ...prev.config, pieces: updatedPieces },
        moves: prev.moves + 1,
        history: [...prev.history, move],
        redoStack: [], // 执行新操作时清空重做栈
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
        redoStack: [], // 执行新操作时清空重做栈
      };
    });
  }, [gameState]);

  // 检查拼图是否完成
  const checkPuzzleComplete = useCallback((answerGrid: (PuzzlePiece | null)[]): boolean => {
    // 检查所有槽位是否都被填满
    if (answerGrid.some(slot => slot === null)) {
      return false;
    }

    // 对于俄罗斯方块拼图，检查每个拼图块的多个槽位是否都正确放置
    if (gameState?.config.pieceShape === 'tetris') {
      const allPieces = gameState.config.pieces;

      return allPieces.every(piece => {
        if (!piece.correctSlots || !piece.tetrisShape) {
          // 对于没有多槽位信息的拼图块，使用原来的逻辑
          const slotPiece = answerGrid[piece.correctSlot];
          return slotPiece?.id === piece.id;
        }

        // 检查俄罗斯方块的所有槽位是否都被正确填入
        return piece.correctSlots.every(slotIndex => {
          const slotPiece = answerGrid[slotIndex];
          return slotPiece?.id === piece.id;
        });
      });
    }

    // 检查每个拼图块是否在正确的位置（考虑旋转和翻转）
    return answerGrid.every((piece, slotIndex) => {
      if (!piece) return false;
      // 基础位置检查
      const isCorrectPosition = piece.correctSlot === slotIndex;
      // 旋转和翻转检查
      const isCorrectOrientation = (piece.rotation % 360 + 360) % 360 === piece.correctRotation && piece.isFlipped === piece.correctIsFlipped;
      return isCorrectPosition && isCorrectOrientation;
    });
  }, [gameState?.config.pieceShape, gameState?.config.pieces]);

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
            // 俄罗斯方块特殊处理：清空所有相关槽位
            if (prev.config.pieceShape === 'tetris') {
              // 找到该俄罗斯方块占据的所有槽位并清空
              for (let i = 0; i < newAnswerGrid.length; i++) {
                if (newAnswerGrid[i]?.id === lastMove.pieceId) {
                  newAnswerGrid[i] = null;
                }
              }
            } else {
              // 普通拼图块只清空单个槽位
              newAnswerGrid[lastMove.toSlot] = null;
            }
          }

          // 更新拼图块状态，将其移回原位置
          updatedPieces = updatedPieces.map(piece =>
            piece.id === lastMove.pieceId
              ? { ...piece, currentSlot: lastMove.fromSlot || null }
              : piece
          );

          // 如果从其他槽位移动，需要恢复原槽位的状态
          if (lastMove.fromSlot !== null && lastMove.fromSlot !== undefined) {
            const originalPiece = updatedPieces.find(p => p.id === lastMove.pieceId);
            if (originalPiece) {
              const fromSlot = lastMove.fromSlot as number;

              if (prev.config.pieceShape === 'tetris' && originalPiece.occupiedPositions) {
                // 俄罗斯方块：计算原位置占据的所有槽位
                const gridCols = prev.config.gridSize.cols;
                const fromRow = Math.floor(fromSlot / gridCols);
                const fromCol = fromSlot % gridCols;

                // 计算相对位置偏移
                const minRow = Math.min(...originalPiece.occupiedPositions.map(pos => pos[0]));
                const minCol = Math.min(...originalPiece.occupiedPositions.map(pos => pos[1]));

                // 计算并恢复所有原始槽位
                for (const [relRow, relCol] of originalPiece.occupiedPositions) {
                  const slotRow = fromRow + (relRow - minRow);
                  const slotCol = fromCol + (relCol - minCol);
                  const slotIndex = slotRow * gridCols + slotCol;

                  if (slotIndex >= 0 && slotIndex < newAnswerGrid.length) {
                    newAnswerGrid[slotIndex] = { ...originalPiece, currentSlot: fromSlot };
                  }
                }
              } else {
                // 普通拼图块恢复到单个槽位
                newAnswerGrid[fromSlot] = { ...originalPiece, currentSlot: fromSlot };
              }
            }
          }
          break;
        case 'remove':
          // 撤销移除：将拼图块放回槽位
          if (lastMove.fromSlot !== null && lastMove.fromSlot !== undefined) {
            const piece = updatedPieces.find(p => p.id === lastMove.pieceId);
            if (piece) {
              const fromSlot = lastMove.fromSlot as number;

              if (prev.config.pieceShape === 'tetris' && piece.occupiedPositions) {
                // 俄罗斯方块：计算并恢复到所有占据的槽位
                const gridCols = prev.config.gridSize.cols;
                const fromRow = Math.floor(fromSlot / gridCols);
                const fromCol = fromSlot % gridCols;

                // 计算相对位置偏移
                const minRow = Math.min(...piece.occupiedPositions.map(pos => pos[0]));
                const minCol = Math.min(...piece.occupiedPositions.map(pos => pos[1]));

                // 计算并恢复所有槽位
                for (const [relRow, relCol] of piece.occupiedPositions) {
                  const slotRow = fromRow + (relRow - minRow);
                  const slotCol = fromCol + (relCol - minCol);
                  const slotIndex = slotRow * gridCols + slotCol;

                  if (slotIndex >= 0 && slotIndex < newAnswerGrid.length) {
                    newAnswerGrid[slotIndex] = { ...piece, currentSlot: fromSlot };
                  }
                }

                updatedPieces = updatedPieces.map(p =>
                  p.id === lastMove.pieceId ? { ...p, currentSlot: fromSlot } : p
                );
              } else {
                // 普通拼图块：恢复到单个槽位
                newAnswerGrid[fromSlot] = { ...piece, currentSlot: fromSlot };
                updatedPieces = updatedPieces.map(p =>
                  p.id === lastMove.pieceId ? { ...p, currentSlot: fromSlot } : p
                );
              }
            }
          }
          break;
        case 'rotate':
          // 撤销旋转：应用相反的delta值
          if (lastMove.delta !== undefined) {
            updatedPieces = updatedPieces.map(piece =>
              piece.id === lastMove.pieceId
                ? { ...piece, rotation: piece.rotation - lastMove.delta! }
                : piece
            );
          }
          break;
        case 'replace':
          // 撤销替换：将新拼图块移回原位置，恢复被替换的拼图块
          if (lastMove.toSlot !== null && lastMove.toSlot !== undefined) {
            const toSlot = lastMove.toSlot as number;

            // 移除新放置的拼图块
            if (prev.config.pieceShape === 'tetris') {
              // 俄罗斯方块：清空所有占据的槽位
              for (let i = 0; i < newAnswerGrid.length; i++) {
                if (newAnswerGrid[i]?.id === lastMove.pieceId) {
                  newAnswerGrid[i] = null;
                }
              }
            } else {
              // 普通拼图块：清空单个槽位
              newAnswerGrid[toSlot] = null;
            }

            // 如果被替换的拼图块存在，将其恢复到原位置
            if (lastMove.replacedPieceId) {
              const replacedPiece = updatedPieces.find(p => p.id === lastMove.replacedPieceId);
              if (replacedPiece) {
                if (prev.config.pieceShape === 'tetris' && replacedPiece.occupiedPositions) {
                  // 俄罗斯方块：计算并恢复到所有槽位
                  const gridCols = prev.config.gridSize.cols;
                  const toRow = Math.floor(toSlot / gridCols);
                  const toCol = toSlot % gridCols;

                  // 计算相对位置偏移
                  const minRow = Math.min(...replacedPiece.occupiedPositions.map(pos => pos[0]));
                  const minCol = Math.min(...replacedPiece.occupiedPositions.map(pos => pos[1]));

                  // 计算并恢复所有槽位
                  for (const [relRow, relCol] of replacedPiece.occupiedPositions) {
                    const slotRow = toRow + (relRow - minRow);
                    const slotCol = toCol + (relCol - minCol);
                    const slotIndex = slotRow * gridCols + slotCol;

                    if (slotIndex >= 0 && slotIndex < newAnswerGrid.length) {
                      newAnswerGrid[slotIndex] = { ...replacedPiece, currentSlot: toSlot };
                    }
                  }
                } else {
                  // 普通拼图块：恢复到单个槽位
                  newAnswerGrid[toSlot] = { ...replacedPiece, currentSlot: toSlot };
                }

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
                const fromSlot = lastMove.fromSlot as number;

                if (prev.config.pieceShape === 'tetris' && originalPiece.occupiedPositions) {
                  // 俄罗斯方块：计算并恢复到所有原始槽位
                  const gridCols = prev.config.gridSize.cols;
                  const fromRow = Math.floor(fromSlot / gridCols);
                  const fromCol = fromSlot % gridCols;

                  // 计算相对位置偏移
                  const minRow = Math.min(...originalPiece.occupiedPositions.map(pos => pos[0]));
                  const minCol = Math.min(...originalPiece.occupiedPositions.map(pos => pos[1]));

                  // 计算并恢复所有原始槽位
                  for (const [relRow, relCol] of originalPiece.occupiedPositions) {
                    const slotRow = fromRow + (relRow - minRow);
                    const slotCol = fromCol + (relCol - minCol);
                    const slotIndex = slotRow * gridCols + slotCol;

                    if (slotIndex >= 0 && slotIndex < newAnswerGrid.length) {
                      newAnswerGrid[slotIndex] = { ...originalPiece, currentSlot: fromSlot };
                    }
                  }
                } else {
                  // 普通拼图块：恢复到单个槽位
                  newAnswerGrid[fromSlot] = { ...originalPiece, currentSlot: fromSlot };
                }
              }
            }
          }
          break;
        case 'flip':
          // 撤销翻转
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
        redoStack: [...prev.redoStack, lastMove], // 将撤销的操作加入重做栈
        answerGrid: newAnswerGrid,
      };
    });
  }, [gameState]);

  // 重做操作
  const redo = useCallback(() => {
    if (!gameState || gameState.redoStack.length === 0) return;

    const moveToRedo = gameState.redoStack[gameState.redoStack.length - 1];
    const newRedoStack = gameState.redoStack.slice(0, -1);

    setGameState(prev => {
      if (!prev) return null;

      let newAnswerGrid = [...prev.answerGrid];
      let updatedPieces = [...prev.config.pieces];

      switch (moveToRedo.action) {
        case 'place':
          // 重做放置：将拼图块放置到目标槽位
          if (moveToRedo.toSlot !== null && moveToRedo.toSlot !== undefined) {
            const piece = updatedPieces.find(p => p.id === moveToRedo.pieceId);
            if (piece) {
              const toSlot = moveToRedo.toSlot as number;

              if (prev.config.pieceShape === 'tetris' && piece.occupiedPositions) {
                // 俄罗斯方块：计算并放置到所有槽位
                const gridCols = prev.config.gridSize.cols;
                const toRow = Math.floor(toSlot / gridCols);
                const toCol = toSlot % gridCols;

                // 计算相对位置偏移
                const minRow = Math.min(...piece.occupiedPositions.map(pos => pos[0]));
                const minCol = Math.min(...piece.occupiedPositions.map(pos => pos[1]));

                // 计算并放置到所有槽位
                for (const [relRow, relCol] of piece.occupiedPositions) {
                  const slotRow = toRow + (relRow - minRow);
                  const slotCol = toCol + (relCol - minCol);
                  const slotIndex = slotRow * gridCols + slotCol;

                  if (slotIndex >= 0 && slotIndex < newAnswerGrid.length) {
                    newAnswerGrid[slotIndex] = { ...piece, currentSlot: toSlot };
                  }
                }
              } else {
                // 普通拼图块：放置到单个槽位
                newAnswerGrid[toSlot] = { ...piece, currentSlot: toSlot };
              }

              updatedPieces = updatedPieces.map(p =>
                p.id === moveToRedo.pieceId ? { ...p, currentSlot: toSlot } : p
              );
            }
          }

          // 如果从其他槽位移动，清空原槽位
          if (moveToRedo.fromSlot !== null && moveToRedo.fromSlot !== undefined) {
            const piece = updatedPieces.find(p => p.id === moveToRedo.pieceId);
            if (piece && prev.config.pieceShape === 'tetris' && piece.occupiedPositions) {
              // 俄罗斯方块：清空所有原始槽位（但保留目标槽位）
              const gridCols = prev.config.gridSize.cols;
              const fromRow = Math.floor(moveToRedo.fromSlot / gridCols);
              const fromCol = moveToRedo.fromSlot % gridCols;

              // 计算相对位置偏移
              const minRow = Math.min(...piece.occupiedPositions.map(pos => pos[0]));
              const minCol = Math.min(...piece.occupiedPositions.map(pos => pos[1]));

              // 清空原始位置的所有槽位
              for (const [relRow, relCol] of piece.occupiedPositions) {
                const slotRow = fromRow + (relRow - minRow);
                const slotCol = fromCol + (relCol - minCol);
                const slotIndex = slotRow * gridCols + slotCol;

                // 只有当槽位不是目标槽位的一部分时才清空
                if (slotIndex >= 0 && slotIndex < newAnswerGrid.length &&
                  slotIndex !== moveToRedo.toSlot &&
                  newAnswerGrid[slotIndex]?.id === moveToRedo.pieceId) {

                  // 检查该槽位是否也是目标位置的一部分
                  const toSlot = moveToRedo.toSlot as number;
                  const toRow = Math.floor(toSlot / gridCols);
                  const toCol = toSlot % gridCols;
                  let isTargetSlot = false;

                  for (const [targetRelRow, targetRelCol] of piece.occupiedPositions) {
                    const targetSlotRow = toRow + (targetRelRow - minRow);
                    const targetSlotCol = toCol + (targetRelCol - minCol);
                    const targetSlotIndex = targetSlotRow * gridCols + targetSlotCol;

                    if (slotIndex === targetSlotIndex) {
                      isTargetSlot = true;
                      break;
                    }
                  }

                  if (!isTargetSlot) {
                    newAnswerGrid[slotIndex] = null;
                  }
                }
              }
            } else {
              // 普通拼图块：清空单个原始槽位
              newAnswerGrid[moveToRedo.fromSlot] = null;
            }
          }
          break;
        case 'remove':
          // 重做移除：将拼图块从槽位移回处理区
          if (moveToRedo.fromSlot !== null && moveToRedo.fromSlot !== undefined) {
            if (prev.config.pieceShape === 'tetris') {
              // 俄罗斯方块：清空所有相关槽位
              for (let i = 0; i < newAnswerGrid.length; i++) {
                if (newAnswerGrid[i]?.id === moveToRedo.pieceId) {
                  newAnswerGrid[i] = null;
                }
              }
            } else {
              // 普通拼图块：清空单个槽位
              newAnswerGrid[moveToRedo.fromSlot] = null;
            }
            updatedPieces = updatedPieces.map(piece =>
              piece.id === moveToRedo.pieceId
                ? { ...piece, currentSlot: null }
                : piece
            );
          }
          break;
        case 'rotate':
          // 重做旋转：应用相同的delta值
          if (moveToRedo.delta !== undefined) {
            updatedPieces = updatedPieces.map(piece =>
              piece.id === moveToRedo.pieceId
                ? { ...piece, rotation: piece.rotation + moveToRedo.delta! }
                : piece
            );
          }
          break;
        case 'replace':
          // 重做替换：执行替换操作
          if (moveToRedo.toSlot !== null && moveToRedo.toSlot !== undefined) {
            const toSlot = moveToRedo.toSlot as number;
            const piece = updatedPieces.find(p => p.id === moveToRedo.pieceId);

            if (piece) {
              // 如果有被替换的拼图块，先移除它
              if (moveToRedo.replacedPieceId) {
                if (prev.config.pieceShape === 'tetris') {
                  // 俄罗斯方块：清空被替换拼图块的所有槽位
                  for (let i = 0; i < newAnswerGrid.length; i++) {
                    if (newAnswerGrid[i]?.id === moveToRedo.replacedPieceId) {
                      newAnswerGrid[i] = null;
                    }
                  }
                } else {
                  // 普通拼图块：清空单个槽位
                  newAnswerGrid[toSlot] = null;
                }
                updatedPieces = updatedPieces.map(p =>
                  p.id === moveToRedo.replacedPieceId ? { ...p, currentSlot: null } : p
                );
              }

              // 放置新拼图块
              if (prev.config.pieceShape === 'tetris' && piece.occupiedPositions) {
                // 俄罗斯方块：计算并放置到所有槽位
                const gridCols = prev.config.gridSize.cols;
                const toRow = Math.floor(toSlot / gridCols);
                const toCol = toSlot % gridCols;

                // 计算相对位置偏移
                const minRow = Math.min(...piece.occupiedPositions.map(pos => pos[0]));
                const minCol = Math.min(...piece.occupiedPositions.map(pos => pos[1]));

                // 计算并放置到所有槽位
                for (const [relRow, relCol] of piece.occupiedPositions) {
                  const slotRow = toRow + (relRow - minRow);
                  const slotCol = toCol + (relCol - minCol);
                  const slotIndex = slotRow * gridCols + slotCol;

                  if (slotIndex >= 0 && slotIndex < newAnswerGrid.length) {
                    newAnswerGrid[slotIndex] = { ...piece, currentSlot: toSlot };
                  }
                }
              } else {
                // 普通拼图块：放置到单个槽位
                newAnswerGrid[toSlot] = { ...piece, currentSlot: toSlot };
              }

              updatedPieces = updatedPieces.map(p =>
                p.id === moveToRedo.pieceId ? { ...p, currentSlot: toSlot } : p
              );

              // 如果从其他槽位移动，清空原槽位
              if (moveToRedo.fromSlot !== null && moveToRedo.fromSlot !== undefined) {
                const fromSlot = moveToRedo.fromSlot as number;

                if (prev.config.pieceShape === 'tetris' && piece.occupiedPositions) {
                  // 俄罗斯方块：清空原始位置的所有槽位（但保留目标槽位）
                  const gridCols = prev.config.gridSize.cols;
                  const fromRow = Math.floor(fromSlot / gridCols);
                  const fromCol = fromSlot % gridCols;

                  // 计算相对位置偏移
                  const minRow = Math.min(...piece.occupiedPositions.map(pos => pos[0]));
                  const minCol = Math.min(...piece.occupiedPositions.map(pos => pos[1]));

                  // 清空原始位置的所有槽位
                  for (const [relRow, relCol] of piece.occupiedPositions) {
                    const slotRow = fromRow + (relRow - minRow);
                    const slotCol = fromCol + (relCol - minCol);
                    const slotIndex = slotRow * gridCols + slotCol;

                    // 只有当槽位不是目标槽位的一部分时才清空
                    if (slotIndex >= 0 && slotIndex < newAnswerGrid.length &&
                      newAnswerGrid[slotIndex]?.id === moveToRedo.pieceId) {

                      // 检查该槽位是否也是目标位置的一部分
                      const toRow = Math.floor(toSlot / gridCols);
                      const toCol = toSlot % gridCols;
                      let isTargetSlot = false;

                      for (const [targetRelRow, targetRelCol] of piece.occupiedPositions) {
                        const targetSlotRow = toRow + (targetRelRow - minRow);
                        const targetSlotCol = toCol + (targetRelCol - minCol);
                        const targetSlotIndex = targetSlotRow * gridCols + targetSlotCol;

                        if (slotIndex === targetSlotIndex) {
                          isTargetSlot = true;
                          break;
                        }
                      }

                      if (!isTargetSlot) {
                        newAnswerGrid[slotIndex] = null;
                      }
                    }
                  }
                } else {
                  // 普通拼图块：清空原始槽位
                  newAnswerGrid[fromSlot] = null;
                }
              }
            }
          }
          break;
        case 'flip':
          // 重做翻转
          updatedPieces = updatedPieces.map(piece =>
            piece.id === moveToRedo.pieceId
              ? { ...piece, isFlipped: !piece.isFlipped }
              : piece
          );
          break;
      }

      return {
        ...prev,
        config: { ...prev.config, pieces: updatedPieces },
        moves: prev.moves + 1,
        history: [...prev.history, moveToRedo], // 将重做的操作加回历史记录
        redoStack: newRedoStack, // 从重做栈中移除
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
      // 确保加载的状态包含 redoStack
      const stateWithRedoStack = {
        ...result.gameState,
        redoStack: result.gameState.redoStack || []
      };
      setGameState(stateWithRedoStack);
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
    redo,
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