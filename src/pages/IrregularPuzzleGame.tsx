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
import { musicManager } from '../services/musicService';
import { getVolcanicJourneyDescription, isVolcanicJourneyPuzzle } from '../data/volcanicJourneyDescriptions';
import '../components/game/PuzzleGame.css';
import '../components/game/PuzzleWorkspace.css';
import '../components/game/GameNavbarFix.css';

interface IrregularPuzzleGameProps {
  onBackToMenu: () => void;
  imageData?: string;
  gridSize?: { rows: number; cols: number } | '3x3' | '4x4' | '5x5' | '6x6';
}

// 定义操作记录类型
interface GameMove {
  id: string;
  pieceId: string;
  action: 'place' | 'remove' | 'rotate' | 'flip' | 'replace';
  fromSlot: number | null;
  toSlot: number | null;
  replacedPieceId?: string;
  rotationDelta?: number;
  timestamp: Date;
}

export const IrregularPuzzleGame: React.FC<IrregularPuzzleGameProps> = ({
  onBackToMenu,
  imageData,
  gridSize = { rows: 3, cols: 3 }
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
  const [history, setHistory] = useState<GameMove[]>([]);
  const [redoHistory, setRedoHistory] = useState<GameMove[]>([]);

  // 旋转/翻转直接同步到puzzleConfig.pieces属性
  const handleRotatePiece = useCallback((pieceId: string, direction: 1 | -1 = 1) => {
    if (!puzzleConfig) return;
    
    // 检查操作限制：如果上次操作是翻转且翻转次数小于2，则不允许旋转
    const targetPiece = puzzleConfig.pieces.find(p => p.id === pieceId);
    if (targetPiece?.lastOperation === 'flip' && (targetPiece?.flipCount ?? 0) < 2) {
      return; // 翻转后且翻转次数小于2时不可旋转
    }
    
    setPuzzleConfig(cfg => {
      if (!cfg) return cfg;
      const newPieces = cfg.pieces.map(piece => {
        if (piece.id !== pieceId) return piece;
        // 旋转属性变换
  // 动态补充属性，兼容老数据
  let { up, right, down, left } = piece;
  let rotation = typeof piece.rotation === 'number' ? piece.rotation : 0;
  let flipX = typeof piece.flipX === 'boolean' ? piece.flipX : false;
        let dirs = [up, right, down, left];
        // 旋转方向：1=右旋，-1=左旋
        let times = direction;
        if (flipX) times = -times;
        times = (times + 4) % 4;
        for (let i = 0; i < times; i++) {
          dirs = [dirs[3], dirs[0], dirs[1], dirs[2]];
        }
        // 修正：翻转后旋转角度也要反向
        const realDirection = flipX ? -direction : direction;
        const newRotation = rotation + 90 * realDirection;
        const rotateCount = (piece.rotateCount ?? 0) + 1;
        
        return {
          ...piece,
          up: dirs[0],
          right: dirs[1],
          down: dirs[2],
          left: dirs[3],
          rotation: newRotation, // 不取模，累加
          flipX,
          lastOperation: 'rotate', // 记录最后一次操作为旋转
          rotateCount: rotateCount, // 更新旋转次数
          flipCount: 0, // 重置翻转次数
        };
      });
      return { ...cfg, pieces: newPieces };
    });

    // 记录旋转操作历史（执行新操作时清空重做历史）
    const move: GameMove = {
      id: Date.now().toString(),
      pieceId,
      action: 'rotate',
      fromSlot: null,
      toSlot: null,
      rotationDelta: 90 * direction,
      timestamp: new Date(),
    };
    setHistory(prev => [...prev, move]);
    setRedoHistory([]);
    
    // 旋转操作算一步（根据普通方形拼图规则）
    setMoves(prev => prev + 1);
  }, [puzzleConfig]);

  const handleRotatePieceLeft = useCallback((pieceId: string) => {
    handleRotatePiece(pieceId, -1);
  }, [handleRotatePiece]);

  const handleFlipX = useCallback((pieceId: string) => {
    if (!puzzleConfig) return;
    
    // 检查操作限制：如果上次操作是旋转且旋转角度不是360度的倍数，则不允许翻转
    const targetPiece = puzzleConfig.pieces.find(p => p.id === pieceId);
    if (targetPiece?.lastOperation === 'rotate' && (targetPiece?.rotation ?? 0) % 360 !== 0) {
      return; // 旋转后且旋转角度不是360度的倍数时不可翻转
    }
    
    setPuzzleConfig(cfg => {
      if (!cfg) return cfg;
      const newPieces = cfg.pieces.map(piece => {
        if (piece.id !== pieceId) return piece;
        // 左右对称翻转：只交换 left/right
        const flipCount = (piece.flipCount ?? 0) + 1;
        
        return {
          ...piece,
          left: piece.right,
          right: piece.left,
          flipX: !(piece.flipX ?? false),
          lastOperation: 'flip', // 记录最后一次操作为翻转
          flipCount: flipCount, // 更新翻转次数
          rotateCount: 0, // 重置旋转次数
        };
      });
      return { ...cfg, pieces: newPieces };
    });

    // 记录翻转操作历史（执行新操作时清空重做历史）
    const move: GameMove = {
      id: Date.now().toString(),
      pieceId,
      action: 'flip',
      fromSlot: null,
      toSlot: null,
      timestamp: new Date(),
    };
    setHistory(prev => [...prev, move]);
    setRedoHistory([]);
    
    // 翻转操作算一步（根据普通方形拼图规则）
    setMoves(prev => prev + 1);
  }, [puzzleConfig]);

  // 撤销操作
  const handleUndo = useCallback(() => {
    if (history.length === 0) return;

    const lastMove = history[history.length - 1];
    const newHistory = history.slice(0, -1);
    setRedoHistory(prev => [...prev, lastMove]);

    switch (lastMove.action) {
      case 'place':
        // 撤销放置：将拼图块从槽位移回原位置
        if (lastMove.toSlot !== null && lastMove.toSlot !== undefined) {
          setAnswerGrid(prev => {
            const newGrid = [...prev];
            // 移除当前槽位的拼图块
            newGrid[lastMove.toSlot!] = null;
            // 如果从其他槽位移动，需要恢复原槽位
            if (lastMove.fromSlot !== null && lastMove.fromSlot !== undefined) {
              const piece = puzzleConfig?.pieces.find(p => p.id === lastMove.pieceId);
              if (piece) {
                newGrid[lastMove.fromSlot!] = { ...piece, currentSlot: lastMove.fromSlot };
              }
            }
            return newGrid;
          });
          // 更新拼图块状态
          setPuzzleConfig(cfg => {
            if (!cfg) return cfg;
            const newPieces = cfg.pieces.map(piece => {
              if (piece.id === lastMove.pieceId) {
                return { 
                  ...piece, 
                  isCorrect: lastMove.fromSlot !== null, // 如果原来在槽位，则标记为正确放置
                  currentSlot: lastMove.fromSlot
                };
              }
              return piece;
            });
            return { ...cfg, pieces: newPieces };
          });
        }
        break;
      case 'remove':
        // 撤销移除：将拼图块放回槽位
        if (lastMove.fromSlot !== null && lastMove.fromSlot !== undefined) {
          setAnswerGrid(prev => {
            const newGrid = [...prev];
            const piece = puzzleConfig?.pieces.find(p => p.id === lastMove.pieceId);
            if (piece) {
              newGrid[lastMove.fromSlot!] = { ...piece, currentSlot: lastMove.fromSlot };
            }
            return newGrid;
          });
        }
        break;
      case 'rotate':
        // 撤销旋转：应用相反的delta值并更新方向属性
        if (lastMove.rotationDelta !== undefined) {
          setPuzzleConfig(cfg => {
            if (!cfg) return cfg;
            const newPieces = cfg.pieces.map(piece => {
              if (piece.id !== lastMove.pieceId) return piece;
              
              // 计算撤销后的旋转角度
              const newRotation = piece.rotation - lastMove.rotationDelta!;
              
              // 更新方向属性：根据新的旋转角度重新计算方向
              let { up, right, down, left } = piece;
              let dirs = [up, right, down, left];
              
              // 计算需要旋转的次数（每次90度）
              const rotationSteps = -Math.sign(lastMove.rotationDelta!);
              let times = rotationSteps;
              if (piece.flipX) times = -times;
              times = (times + 4) % 4;
              
              for (let i = 0; i < times; i++) {
                dirs = [dirs[3], dirs[0], dirs[1], dirs[2]];
              }
              
              return {
                ...piece,
                up: dirs[0],
                right: dirs[1],
                down: dirs[2],
                left: dirs[3],
                rotation: newRotation,
                lastOperation: null, // 撤销操作后重置操作状态
                rotateCount: Math.max(0, (piece.rotateCount ?? 1) - 1), // 减少旋转次数
              };
            });
            return { ...cfg, pieces: newPieces };
          });
        }
        break;
      case 'flip':
        // 撤销翻转：再次翻转并更新方向属性
        setPuzzleConfig(cfg => {
          if (!cfg) return cfg;
          const newPieces = cfg.pieces.map(piece => {
            if (piece.id !== lastMove.pieceId) return piece;
            
            // 撤销翻转：交换左右方向
            return {
              ...piece,
              left: piece.right,
              right: piece.left,
              flipX: !piece.flipX,
              lastOperation: null, // 撤销操作后重置操作状态
              flipCount: Math.max(0, (piece.flipCount ?? 1) - 1), // 减少翻转次数
            };
          });
          return { ...cfg, pieces: newPieces };
        });
        break;
      case 'replace':
        // 撤销替换：恢复被替换的拼图块
        if (lastMove.toSlot !== null && lastMove.toSlot !== undefined && lastMove.replacedPieceId) {
          setAnswerGrid(prev => {
            const newGrid = [...prev];
            const replacedPiece = puzzleConfig?.pieces.find(p => p.id === lastMove.replacedPieceId);
            if (replacedPiece) {
              newGrid[lastMove.toSlot!] = { ...replacedPiece, currentSlot: lastMove.toSlot };
            }
            return newGrid;
          });
        }
        break;
    }

    setHistory(newHistory);
    setMoves(prev => Math.max(0, prev - 1));
  }, [history, puzzleConfig]);

  // 重做操作
  const handleRedo = useCallback(() => {
    if (redoHistory.length === 0) return;

    const nextMove = redoHistory[redoHistory.length - 1];
    const newRedoHistory = redoHistory.slice(0, -1);

    // 执行重做操作
    switch (nextMove.action) {
      case 'place':
        // 重做放置：将拼图块放到槽位
        if (nextMove.toSlot !== null && nextMove.toSlot !== undefined) {
          const piece = puzzleConfig?.pieces.find(p => p.id === nextMove.pieceId);
          if (piece) {
            setAnswerGrid(prev => {
              const newGrid = [...prev];
              // 如果从其他槽位移动，需要清空原槽位
              if (nextMove.fromSlot !== null && nextMove.fromSlot !== undefined) {
                newGrid[nextMove.fromSlot!] = null;
              }
              // 放置到目标槽位
              newGrid[nextMove.toSlot!] = { ...piece, currentSlot: nextMove.toSlot };
              return newGrid;
            });
            // 更新拼图块状态
            setPuzzleConfig(cfg => {
              if (!cfg) return cfg;
              const newPieces = cfg.pieces.map(p => {
                if (p.id === nextMove.pieceId) {
                  return { 
                    ...p, 
                    isCorrect: true,
                    currentSlot: nextMove.toSlot
                  };
                }
                return p;
              });
              return { ...cfg, pieces: newPieces };
            });
          }
        }
        break;
      case 'remove':
        // 重做移除：将拼图块从槽位移除
        if (nextMove.fromSlot !== null && nextMove.fromSlot !== undefined) {
          setAnswerGrid(prev => {
            const newGrid = [...prev];
            newGrid[nextMove.fromSlot!] = null;
            return newGrid;
          });
          // 更新拼图块状态
          setPuzzleConfig(cfg => {
            if (!cfg) return cfg;
            const newPieces = cfg.pieces.map(p => {
              if (p.id === nextMove.pieceId) {
                return { 
                  ...p, 
                  isCorrect: false,
                  currentSlot: null
                };
              }
              return p;
            });
            return { ...cfg, pieces: newPieces };
          });
        }
        break;
      case 'rotate':
        // 重做旋转：应用相同的delta值并更新方向属性
        if (nextMove.rotationDelta !== undefined) {
          setPuzzleConfig(cfg => {
            if (!cfg) return cfg;
            const newPieces = cfg.pieces.map(p => {
              if (p.id !== nextMove.pieceId) return p;
              
              // 计算重做后的旋转角度
              const newRotation = p.rotation + nextMove.rotationDelta!;
              
              // 更新方向属性：根据新的旋转角度重新计算方向
              let { up, right, down, left } = p;
              let dirs = [up, right, down, left];
              
              // 计算需要旋转的次数（每次90度）
              const rotationSteps = Math.sign(nextMove.rotationDelta!);
              let times = rotationSteps;
              if (p.flipX) times = -times;
              times = (times + 4) % 4;
              
              for (let i = 0; i < times; i++) {
                dirs = [dirs[3], dirs[0], dirs[1], dirs[2]];
              }
              
              return {
                ...p,
                up: dirs[0],
                right: dirs[1],
                down: dirs[2],
                left: dirs[3],
                rotation: newRotation,
                lastOperation: 'rotate', // 重做操作后记录操作状态
                rotateCount: (p.rotateCount ?? 0) + 1, // 增加旋转次数
                flipCount: 0, // 重置翻转次数
              };
            });
            return { ...cfg, pieces: newPieces };
          });
        }
        break;
      case 'flip':
        // 重做翻转：再次翻转并更新方向属性
        setPuzzleConfig(cfg => {
          if (!cfg) return cfg;
          const newPieces = cfg.pieces.map(p => {
            if (p.id !== nextMove.pieceId) return p;
            
            // 重做翻转：交换左右方向
            return {
              ...p,
              left: p.right,
              right: p.left,
              flipX: !p.flipX,
              lastOperation: 'flip', // 重做操作后记录操作状态
              flipCount: (p.flipCount ?? 0) + 1, // 增加翻转次数
              rotateCount: 0, // 重置旋转次数
            };
          });
          return { ...cfg, pieces: newPieces };
        });
        break;
      case 'replace':
        // 重做替换：替换槽位中的拼图块
        if (nextMove.toSlot !== null && nextMove.toSlot !== undefined && nextMove.replacedPieceId) {
          const piece = puzzleConfig?.pieces.find(p => p.id === nextMove.pieceId);
          if (piece) {
            setAnswerGrid(prev => {
              const newGrid = [...prev];
              // 放置新拼图块
              newGrid[nextMove.toSlot!] = { ...piece, currentSlot: nextMove.toSlot };
              return newGrid;
            });
            // 更新拼图块状态
            setPuzzleConfig(cfg => {
              if (!cfg) return cfg;
              const newPieces = cfg.pieces.map(p => {
                if (p.id === nextMove.pieceId) {
                  return { 
                    ...p, 
                    isCorrect: true,
                    currentSlot: nextMove.toSlot
                  };
                } else if (p.id === nextMove.replacedPieceId) {
                  return { 
                    ...p, 
                    isCorrect: false,
                    currentSlot: null
                  };
                }
                return p;
              });
              return { ...cfg, pieces: newPieces };
            });
          }
        }
        break;
    }

    setRedoHistory(newRedoHistory);
    setHistory(prev => [...prev, nextMove]);
    setMoves(prev => prev + 1);
  }, [redoHistory, puzzleConfig]);


  // 生成拼图配置
  const generatePuzzle = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
  // 生成新拼图时属性已重置，无需pieceTransforms

      let puzzleImageData = imageData;

      // 如果没有提供图像，使用默认图像
      if (!puzzleImageData) {
        // 这里可以使用预设的测试图像
        puzzleImageData = '/images/nature/landscape1.svg'; // 假设有这个图像
      }

      let realGridSize: { rows: number; cols: number };
      if (typeof gridSize === 'string') {
        // 兼容老用法
        const [rows, cols] = gridSize.split('x').map(Number);
        realGridSize = { rows, cols };
      } else {
        realGridSize = gridSize;
      }
      const config = await IrregularPuzzleGenerator.generateIrregularPuzzle({
        imageData: puzzleImageData,
        gridSize: realGridSize,
        pieceShape: 'irregular',
        name: '异形拼图',
        expansionRatio: 0.4
      });
      // 初始化时为每个piece补充flipX/rotation/lastOperation属性
      const patchedConfig = {
        ...config,
        pieces: config.pieces.map(p => ({
          ...p,
          flipX: false,
          rotation: 0,
          lastOperation: null, // 初始化操作状态
          rotateCount: 0, // 初始化旋转次数
          flipCount: 0, // 初始化翻转次数
        })),
      };
      setPuzzleConfig(patchedConfig);
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
  // 开始游戏时属性已重置，无需pieceTransforms

      // 初始化答题网格
      const totalSlots = puzzleConfig.gridSize.rows * puzzleConfig.gridSize.cols;
      setAnswerGrid(new Array(totalSlots).fill(null));
      
      // 不在这里播放音乐，因为这个函数可能会被重复调用
    }
  }, [puzzleConfig]);

  // 初始化生成拼图
  useEffect(() => {
    generatePuzzle();
  }, [generatePuzzle]);

  // 不在这里播放音乐，音乐播放已移至MainMenu的handleStartGame中

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

  // 处理键盘快捷键（ESC取消选择，R右旋，L左旋，F水平翻转，Ctrl+Z撤销，Ctrl+Y重做）
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedPiece(null);
      }
      // Ctrl+Z 撤销操作
      if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        handleUndo();
        return;
      }
      // Ctrl+Y 重做操作
      if (e.ctrlKey && e.key === 'y') {
        e.preventDefault();
        handleRedo();
        return;
      }
      if (!selectedPiece) return;
      if (e.key === 'r' || e.key === 'R') {
        handleRotatePiece(selectedPiece);
      }
      if (e.key === 'l' || e.key === 'L') {
        handleRotatePieceLeft(selectedPiece);
      }
      if (e.key === 'f' || e.key === 'F') {
        handleFlipX(selectedPiece);
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedPiece, handleRotatePiece, handleRotatePieceLeft, handleFlipX, handleUndo, handleRedo]);

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
    // 选择操作不算步数（根据普通方形拼图规则）
  }, []);

  // 处理拼图块放置
  const handlePiecePlacement = useCallback((pieceId: string, slotIndex: number) => {
    if (!puzzleConfig) return;

    // 找到要放置的拼图块
    const piece = puzzleConfig.pieces.find(p => p.id === pieceId);
    if (!piece) return;

    // 检查是否是自我替换（拼图块拖拽到自己当前所在的槽位）
    const existingPieceInSlot = answerGrid[slotIndex];
    if (existingPieceInSlot && existingPieceInSlot.id === pieceId) {
      // 如果是拖拽到自己当前所在的槽位，直接返回，不进行任何操作
      return;
    }

    // 只对异形拼图专用判定，直接用piece当前属性
    const rows = puzzleConfig.gridSize?.rows || puzzleConfig.gridLayout?.gridSize?.rows;
    const cols = puzzleConfig.gridSize?.cols || puzzleConfig.gridLayout?.gridSize?.cols;
    const row = Math.floor(slotIndex / cols);
    const col = slotIndex % cols;
    const directions = [
      { dr: -1, dc: 0, self: 'up', other: 'down' },
      { dr: 0, dc: 1, self: 'right', other: 'left' },
      { dr: 1, dc: 0, self: 'down', other: 'up' },
      { dr: 0, dc: -1, self: 'left', other: 'right' },
    ];
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
        neighborVal = null;
      }
      const selfVal = (piece as any)[dir.self];
      if (neighborVal === null && selfVal === 1) {
        return;
      }
      if (neighborVal !== null) {
        if (selfVal === 1 && neighborVal === 1) return;
        if (selfVal === 1 && neighborVal === 0) return;
        if (selfVal === 0 && neighborVal === 1) return;
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
        return { ...p, isCorrect: true };
      } else if (existingPieceId && p.id === existingPieceId) {
        return { ...p, isCorrect: false };
      }
      return p;
    });
    setPuzzleConfig({ ...puzzleConfig, pieces: updatedPieces });
    // 直接把 piece 放进新槽位
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

    // 检查是否全部正确（位置、旋转、翻转都对）
    const allCorrect = newAnswerGrid.every((piece, idx) => {
      if (!piece) return false;
      // 位置判定
      const posCorrect = (piece.gridRow * (puzzleConfig.gridSize?.cols || puzzleConfig.gridLayout?.gridSize?.cols) + piece.gridCol) === idx;
      // 旋转判定
      const rotCorrect = (piece.rotation ?? 0) % 360 === (piece.correctRotation ?? 0) % 360;
      // 翻转判定（只要未翻转）
      const flipCorrect = (piece.flipX ?? false) === false;
      return posCorrect && rotCorrect && flipCorrect;
    });
    if (allCorrect) {
      setIsComplete(true);
      handlePuzzleComplete();
    }

    // 记录操作历史（执行新操作时清空重做历史）
    const move: GameMove = {
      id: Date.now().toString(),
      pieceId,
      action: existingPieceId ? 'replace' : 'place',
      fromSlot: currentSlotIndex !== -1 ? currentSlotIndex : null,
      toSlot: slotIndex,
      replacedPieceId: existingPieceId || undefined,
      timestamp: new Date(),
    };
    setHistory(prev => [...prev, move]);
    setRedoHistory([]);

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

    // 记录操作历史（执行新操作时清空重做历史）
    const move: GameMove = {
      id: Date.now().toString(),
      pieceId,
      action: 'remove',
      fromSlot: slotIndex,
      toSlot: null,
      timestamp: new Date(),
    };
    setHistory(prev => [...prev, move]);
    setRedoHistory([]);

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
  }, []);

  // 提示功能：将一块待处理区的拼图块放到正确位置
  const getHint = useCallback(() => {
    if (!puzzleConfig) return;

    // 筛选出未正确放置的拼图块（在待处理区）
    const incorrectPieces = puzzleConfig.pieces.filter(piece => 
      piece.isDraggable && !piece.isCorrect
    );

    if (incorrectPieces.length === 0) {
      alert('所有拼图块都已正确放置！');
      return;
    }

    // 随机选择一个未正确放置的拼图块
    const randomPiece = incorrectPieces[Math.floor(Math.random() * incorrectPieces.length)];

    // 计算该拼图块在答题网格中的正确位置
    const slotIndex = randomPiece.gridRow * puzzleConfig.gridSize.cols + randomPiece.gridCol;

    // 调用放置函数将拼图块放到正确位置
    handlePiecePlacement(randomPiece.id, slotIndex);

    // 高亮显示被提示的拼图块（可选）
    setSelectedPiece(randomPiece.id);
    setTimeout(() => setSelectedPiece(null), 2000);
  }, [puzzleConfig, handlePiecePlacement]);

  // 获取统计信息
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
            onClick={handleUndo}
            variant="secondary"
            size="small"
            className="undo-button"
            disabled={history.length === 0}
          >
            ↩️ 撤销
          </Button>
          <Button
            onClick={handleRedo}
            variant="secondary"
            size="small"
            className="redo-button"
            disabled={redoHistory.length === 0}
          >
            ↪️ 重做
          </Button>
          <Button
            onClick={getHint}
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
                    const _piece: any = piece;
                    const scaleX = typeof _piece.flipX === 'boolean' && _piece.flipX ? -1 : 1;
                    const transform = `translate(0%, 0%) scaleX(${scaleX}) rotate(${typeof _piece.rotation === 'number' ? _piece.rotation : 0}deg)`;
                    return (
                      <div
                        key={piece.id}
                        className={`puzzle-piece-item ${selectedPiece === piece.id ? 'selected' : ''} ${draggedPiece === piece.id ? 'dragging' : ''}`}
                        draggable={true}
                        onClick={() => handlePieceSelect(selectedPiece === piece.id ? null : piece.id)}
                        onDoubleClick={() => handleRotatePiece(piece.id)}
                        onContextMenu={e => { e.preventDefault(); handleFlipX(piece.id); }}
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
                <p>5. 鼠标右键取回答题卡上方块</p>
                <p>6. 异形拼图块不可同时旋转+翻转</p>
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
                // pieceTransforms已废弃
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
