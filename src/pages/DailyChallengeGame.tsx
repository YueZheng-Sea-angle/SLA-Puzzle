import React, { useState, useCallback, useEffect } from 'react';
import { IrregularPuzzleConfig, IrregularPuzzleGenerator } from '../utils/puzzleGenerator/irregular';
import { PuzzleGenerator } from '../utils/puzzleGenerator';
import { PuzzleConfig } from '../types';
import { IrregularPuzzleWorkspace } from '../components/game/IrregularPuzzleWorkspace';
import { PuzzleWorkspace } from '../components/game/PuzzleWorkspace';
import { usePuzzleGame } from '../hooks/usePuzzleGame';
import { Timer } from '../components/common/Timer';
import { Button } from '../components/common/Button';
import { useAuth } from '../contexts/AuthContext';
import { cloudStorage } from '../services/cloudStorage';
import { LeaderboardService } from '../services/leaderboardService';
import { DailyChallengeLeaderboardService } from '../services/dailyChallengeLeaderboardService';
import { Challenge } from './DailyChallenge';
import { GameFailureModal } from '../components/game/GameFailureModal';
import './DailyChallengeGame.css';
import '../components/game/GameNavbarFix.css';

interface DailyChallengeGameProps {
  onBackToMenu: () => void;
  challenge: Challenge;
  puzzleType: 'square' | 'irregular';
  onRestartChallenge?: () => boolean;
}

export const DailyChallengeGame: React.FC<DailyChallengeGameProps> = ({
  onBackToMenu,
  challenge,
  puzzleType,
  onRestartChallenge
}) => {
  const { authState } = useAuth();
  const [puzzleConfig, setPuzzleConfig] = useState<IrregularPuzzleConfig | PuzzleConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gameStartTime, setGameStartTime] = useState<Date>(new Date());
  const [isComplete, setIsComplete] = useState(false);
  const [isFailed, setIsFailed] = useState(false);
  const [progress, setProgress] = useState({ correct: 0, total: 0, percentage: 0 });
  const [elapsedTime, setElapsedTime] = useState(0);
  const [remainingTime, setRemainingTime] = useState(challenge.timeLimit);
  const [moves, setMoves] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showFailureModal, setShowFailureModal] = useState(false);
  const [failureReason, setFailureReason] = useState('');

  // 检查特效限制
  const isPreviewDisabled = challenge.effects?.includes('no_preview') || challenge.effects?.includes('一叶障目');
  // 最终防线特效现在允许查看答案
  const isAnswerDisabled = false; // 移除原来的限制，允许所有情况下查看答案

  // 使用usePuzzleGame钩子管理方形拼图状态
  const { 
    gameState,
    selectedPiece,
    initializeGame,
    placePieceToSlot,
    removePieceFromSlot,
    rotatePiece,
    flipPiece,
    undo,
    redo,
    handlePieceSelect,
    handleDragStart,
    handleDragEnd,
    handleDragOver
  } = usePuzzleGame();
  
  // 特效实现状态
  const [effectStates, setEffectStates] = useState({
    brightnessPhase: 0, // 亦步亦趋特效的相位（备用）
    availablePieces: new Set<string>(), // 管中窥豹特效当前可用的拼图块ID
    remainingPieces: [] as string[], // 管中窥豹特效剩余待补充的拼图块ID
    unlockedSlots: new Set<number>(), // 作茧自缚特效解锁的槽位
    cornerOnlyMode: false, // 作茧自缚特效是否只能在角落放置
    hasStepError: false, // 最终防线特效是否已有错误
    actualMoves: 0, // 鱼目混珠特效的实际步数
    lastPlacedSlot: -1, // 亦步亦趋特效：上次放置的槽位索引
    stepFollowSlots: new Set<number>(), // 亦步亦趋特效：当前可放置的槽位
    fakePieces: new Set<string>(), // 鱼目混珠特效：伪造的拼图块ID
  });

  // 检查是否只能在角落放置（作茧自缚特效）
  const isCornerSlot = useCallback((slotIndex: number) => {
    if (!gameState) return false;
    const { rows, cols } = gameState.config.gridSize;
    const corners = [0, cols - 1, (rows - 1) * cols, rows * cols - 1];
    return corners.includes(slotIndex);
  }, [gameState]);

  // 获取相邻槽位（作茧自缚特效和亦步亦趋特效）
  const getAdjacentSlots = useCallback((slotIndex: number) => {
    if (!gameState) return [];
    const { rows, cols } = gameState.config.gridSize;
    const adjacent: number[] = [];
    
    const row = Math.floor(slotIndex / cols);
    const col = slotIndex % cols;
    
    // 上
    if (row > 0) adjacent.push(slotIndex - cols);
    // 下
    if (row < rows - 1) adjacent.push(slotIndex + cols);
    // 左
    if (col > 0) adjacent.push(slotIndex - 1);
    // 右
    if (col < cols - 1) adjacent.push(slotIndex + 1);
    
    return adjacent;
  }, [gameState]);

  // 检查是否可以放置到该槽位（根据特效规则）
  const canPlaceToSlot = useCallback((slotIndex: number) => {
    let canPlace = true;
    let hasEffects = false;
    
    // 作茧自缚特效：动态解锁机制
    if (challenge.effects?.includes('corner_start') || challenge.effects?.includes('作茧自缚')) {
      hasEffects = true;
      // 如果还没有放置任何拼图块，只能放在角落
      if (gameState && gameState.answerGrid.every(slot => slot === null)) {
        canPlace = canPlace && isCornerSlot(slotIndex);
      } else {
        // 否则检查该槽位是否已解锁
        canPlace = canPlace && effectStates.unlockedSlots.has(slotIndex);
      }
    }
    
    // 亦步亦趋特效：只能在上次放置的拼图块周围放置
    if (challenge.effects?.includes('brightness') || challenge.effects?.includes('亦步亦趋')) {
      hasEffects = true;
      // 如果还没有放置任何拼图块，可以放在任意位置
      if (gameState && gameState.answerGrid.every(slot => slot === null)) {
        canPlace = canPlace && true;
      } else {
        // 否则检查是否在允许的槽位列表中
        canPlace = canPlace && effectStates.stepFollowSlots.has(slotIndex);
      }
    }
    
    // 如果没有启用任何特效，可以直接放置
    return hasEffects ? canPlace : true;
  }, [challenge.effects, gameState, isCornerSlot, effectStates.unlockedSlots, effectStates.stepFollowSlots]);

  // 获取特效CSS类名
  const getEffectClasses = useCallback(() => {
    const classes: string[] = [];
    
    // 雾里看花特效：模糊未选中的拼图块
    if (challenge.effects?.includes('blur') || challenge.effects?.includes('雾里看花')) {
      classes.push('effect-blur-unselected');
    }
    
    // 深渊漫步特效：放置后的拼图块变黑
    if (challenge.effects?.includes('invisible') || challenge.effects?.includes('深渊漫步')) {
      classes.push('effect-invisible-placed');
    }
    
    return classes.join(' ');
  }, [challenge.effects]);

  // 获取特效内联样式
  const getEffectStyles = useCallback(() => {
    const styles: React.CSSProperties = {};
    
    // 亦步亦趋特效不再使用亮度变化
    
    return styles;
  }, []);

  // 计算特效总星数
  const getTotalStars = useCallback(() => {
    if (!challenge.effects) return 0;
    return challenge.effects.reduce((total, effectId) => {
      // 基于特效ID计算星数
      if (effectId.includes('3') || ['rotate', 'blur', 'partial', 'upside_down', 'double_steps', '天旋地转', '雾里看花', '管中窥豹', '颠倒世界', '鱼目混珠'].includes(effectId)) {
        return total + 3;
      } else if (effectId.includes('4') || ['corner_start', 'invisible', 'no_preview', 'time_limit', '作茧自缚', '深渊漫步', '一叶障目', '生死时速'].includes(effectId)) {
        return total + 4;
      } else if (effectId.includes('5') || ['no_mistakes', 'step_limit', 'brightness', '最终防线', '精打细算', '璀璨星河'].includes(effectId)) {
        return total + 5;
      }
      return total;
    }, 0);
  }, [challenge.effects]);

  // 获取特效名称
  const getEffectName = useCallback((effectId: string) => {
    const effectMap: { [key: string]: string } = {
      'rotate': '天旋地转', '天旋地转': '天旋地转',
      'blur': '雾里看花', '雾里看花': '雾里看花',
      'partial': '管中窥豹', '管中窥豹': '管中窥豹',
      'upside_down': '颠倒世界', '颠倒世界': '颠倒世界',
      'double_steps': '鱼目混珠', '鱼目混珠': '鱼目混珠',
      'corner_start': '作茧自缚', '作茧自缚': '作茧自缚',
      'invisible': '深渊漫步', '深渊漫步': '深渊漫步',
      'no_preview': '一叶障目', '一叶障目': '一叶障目',
      'time_limit': '生死时速', '生死时速': '生死时速',
      'no_mistakes': '最终防线', '最终防线': '最终防线',
      'step_limit': '精打细算', '精打细算': '精打细算',
      'brightness': '亦步亦趋', '亦步亦趋': '亦步亦趋'
    };
    return effectMap[effectId] || effectId;
  }, []);

  // 获取特效描述
  const getEffectDescription = useCallback((effectId: string) => {
    const descriptionMap: { [key: string]: string } = {
      'rotate': '本关卡等同于启用翻转模式，拼图块包含旋转与翻转，玩家可通过按键旋转到正确位置', '天旋地转': '本关卡等同于启用翻转模式，拼图块包含旋转与翻转，玩家可通过按键旋转到正确位置',
      'blur': '本关卡拼图块在鼠标选中前模糊化', '雾里看花': '本关卡拼图块在鼠标选中前模糊化',
      'partial': '本关卡初始只提供一半数量的拼图块，正确放置后自动补充新的拼图块', '管中窥豹': '本关卡初始只提供一半数量的拼图块，正确放置后自动补充新的拼图块',
      'upside_down': '本关卡中正确答案旋转180°后得到原图', '颠倒世界': '本关卡中正确答案旋转180°后得到原图',
      'double_steps': '混入3块该地图分割后的拼图块的复制体，复制体在被放入拼图时会直接消失，只有当本体放入空格才会显示正确', '鱼目混珠': '混入3块该地图分割后的拼图块的复制体，复制体在被放入拼图时会直接消失，只有当本体放入空格才会显示正确',
      'corner_start': '本关卡最开始可以放置拼图块的位置只有四个角落，只有正确放置才会解锁相邻槽位', '作茧自缚': '本关卡最开始可以放置拼图块的位置只有四个角落，只有正确放置才会解锁相邻槽位',
      'invisible': '本关卡放置后的拼图块为纯黑色不可见', '深渊漫步': '本关卡放置后的拼图块为纯黑色不可见',
      'no_preview': '本关卡不允许查看原图', '一叶障目': '本关卡不允许查看原图',
      'time_limit': '本关卡限时126*(拼图块数量/9)秒', '生死时速': '本关卡限时126*(拼图块数量/9)秒',
      'no_mistakes': '本关卡不允许任何一次放置失误', '最终防线': '本关卡不允许任何一次放置失误',
      'step_limit': '本关卡必须在1.5*拼图块数量次步数内完成', '精打细算': '本关卡必须在1.5*拼图块数量次步数内完成',
      'brightness': '仅能在上次放置的拼图块周围放置拼图块', '亦步亦趋': '仅能在上次放置的拼图块周围放置拼图块'
    };
    return descriptionMap[effectId] || '未知特效';
  }, []);

  // 获取特效星级
  const getEffectStars = useCallback((effectId: string) => {
    if (['rotate', 'blur', 'partial', 'upside_down', 'double_steps', '天旋地转', '雾里看花', '管中窥豹', '颠倒世界', '鱼目混珠'].includes(effectId)) {
      return 3;
    } else if (['corner_start', 'invisible', 'no_preview', 'time_limit', '作茧自缚', '深渊漫步', '一叶障目', '生死时速'].includes(effectId)) {
      return 4;
    } else if (['no_mistakes', 'step_limit', 'brightness', '最终防线', '精打细算', '亦步亦趋'].includes(effectId)) {
      return 5;
    }
    return 0;
  }, []);

  // 生成拼图配置
  const generatePuzzle = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // 使用挑战提供的图像
      const puzzleImageData = challenge.puzzleImage;
      
      if (puzzleType === 'square') {
        // 解析gridSize，例如从'3x3'转换为{rows: 3, cols: 3}
        const [rows, cols] = challenge.gridSize.split('x').map(Number);
        
        const config = await PuzzleGenerator.generatePuzzle({
          imageData: puzzleImageData,
          gridSize: { rows, cols },
          pieceShape: 'square',
          name: challenge.title,
          upsideDown: challenge.effects?.includes('upside_down') || challenge.effects?.includes('颠倒世界')
        });
        
        // 鱼目混珠特效：生成额外的3个伪造拼图块
        let finalConfig = config;
        if (challenge.effects?.includes('double_steps') || challenge.effects?.includes('鱼目混珠')) {
          // 复制3个随机拼图块作为伪造拼图块
          const piecesToCopy = [...config.pieces].sort(() => Math.random() - 0.5).slice(0, 3);
          const fakePieces = piecesToCopy.map((piece, index) => ({
            ...piece,
            id: `fake_${piece.id}_${index}`,
            originalIndex: piece.originalIndex,
            correctSlot: piece.correctSlot,
            // 伪造拼图块的其他属性保持不变
          }));
          
          // 合并原始拼图块和伪造拼图块，并随机打乱顺序
          const allPieces = [...config.pieces, ...fakePieces];
          const shuffledPieces = allPieces.sort(() => Math.random() - 0.5);
          
          finalConfig = {
            ...config,
            pieces: shuffledPieces
          };
        }
        
        // 应用特效：天旋地转 - 等同于启用翻转模式，拼图块会随机旋转和翻转
        // 玩家需要通过按键旋转到正确位置才能正确放置
        const hasRotateEffect = challenge.effects?.includes('rotate') || challenge.effects?.includes('天旋地转');
        if (hasRotateEffect) {
          // 重新生成拼图配置，这次启用旋转模式
          const rotatedConfig = await PuzzleGenerator.generatePuzzle({
            imageData: puzzleImageData,
            gridSize: { rows, cols },
            pieceShape: 'square',
            name: challenge.title,
            allowRotation: true, // 启用翻转模式
            upsideDown: challenge.effects?.includes('upside_down') || challenge.effects?.includes('颠倒世界')
          });
          
          // 鱼目混珠特效：生成额外的3个伪造拼图块
          let finalRotatedConfig = rotatedConfig;
          if (challenge.effects?.includes('double_steps') || challenge.effects?.includes('鱼目混珠')) {
            // 复制3个随机拼图块作为伪造拼图块
            const piecesToCopy = [...rotatedConfig.pieces].sort(() => Math.random() - 0.5).slice(0, 3);
            const fakePieces = piecesToCopy.map((piece, index) => ({
              ...piece,
              id: `fake_${piece.id}_${index}`,
              originalIndex: piece.originalIndex,
              correctSlot: piece.correctSlot,
              // 伪造拼图块的其他属性保持不变
            }));
            
            // 合并原始拼图块和伪造拼图块，并随机打乱顺序
            const allPieces = [...rotatedConfig.pieces, ...fakePieces];
            const shuffledPieces = allPieces.sort(() => Math.random() - 0.5);
            
            // 合并原始拼图块和伪造拼图块
            finalRotatedConfig = {
              ...rotatedConfig,
              pieces: shuffledPieces
            };
          }
          
          // 使用启用了旋转的配置
          setPuzzleConfig(finalRotatedConfig);
          setProgress({ correct: 0, total: finalRotatedConfig.pieces.length, percentage: 0 });
          initializeGame(finalRotatedConfig);
        } else {
          // 没有天旋地转特效，使用正常配置
          setPuzzleConfig(finalConfig);
          setProgress({ correct: 0, total: finalConfig.pieces.length, percentage: 0 });
          initializeGame(finalConfig);
        }
        
      } else {
        const config = await IrregularPuzzleGenerator.generateSimpleIrregular(
          puzzleImageData,
          challenge.gridSize
        );
        
        // 鱼目混珠特效：生成额外的3个伪造拼图块（仅适用于方形拼图）
        let finalConfig = config;
        // 异形拼图暂不支持鱼目混珠特效
        
        setPuzzleConfig(finalConfig);
        setProgress({ correct: 0, total: finalConfig.pieces.length, percentage: 0 });
      }
      
      // 设置时间限制（生死时速特效）
      const timeLimit = challenge.effects?.includes('time_limit') || challenge.effects?.includes('生死时速') 
        ? (() => {
            const gridParts = challenge.gridSize.split('x');
            const totalPieces = parseInt(gridParts[0]) * parseInt(gridParts[1]);
            return Math.floor(126 * (totalPieces / 9));
          })()
        : challenge.timeLimit;
        
      setGameStartTime(new Date());
      setIsComplete(false);
      setIsFailed(false);
      setElapsedTime(0);
      setRemainingTime(timeLimit);
      setMoves(0);
      
      // 重置特效状态
      setEffectStates({
        brightnessPhase: 0,
        availablePieces: new Set(),
        remainingPieces: [],
        unlockedSlots: new Set(),
        cornerOnlyMode: false,
        hasStepError: false,
        actualMoves: 0,
        lastPlacedSlot: -1,
        stepFollowSlots: new Set(),
        fakePieces: new Set(),
      });
      
    } catch (err) {
      console.error('生成异形拼图失败:', err);
      setError(err instanceof Error ? err.message : '生成拼图时发生未知错误');
    } finally {
      setIsLoading(false);
    }
  }, [challenge.puzzleImage, challenge.gridSize, challenge.title, challenge.effects, challenge.timeLimit, puzzleType, initializeGame]);

  const handleRestart = () => {
    const canRestart = onRestartChallenge?.();
    if (canRestart) {
      generatePuzzle();
    }
  };

  // 初始化生成拼图
  useEffect(() => {
    generatePuzzle();
  }, [generatePuzzle]);

  // 独立的特效初始化
  useEffect(() => {
    if (!puzzleConfig || puzzleType !== 'square') return;
    
    const [rows, cols] = challenge.gridSize.split('x').map(Number);
    
    setEffectStates(prev => {
      const newStates = { ...prev };
      
      // 管中窥豹特效：初始化可用拼图块和剩余拼图块
      if (challenge.effects?.includes('partial') || challenge.effects?.includes('管中窥豹')) {
        const allPieceIds = puzzleConfig.pieces.map(piece => piece.id);
        const halfCount = Math.floor(allPieceIds.length / 2);
        
        // 随机选择一半作为初始可用拼图块
        const shuffled = [...allPieceIds].sort(() => Math.random() - 0.5);
        const initialAvailable = shuffled.slice(0, halfCount);
        const remaining = shuffled.slice(halfCount);
        
        newStates.availablePieces = new Set(initialAvailable);
        newStates.remainingPieces = remaining;
        
        console.log('🔍 管中窥豹特效初始化:', {
          总拼图块数: allPieceIds.length,
          初始可用: initialAvailable.length,
          剩余待补充: remaining.length,
          可用拼图块ID: initialAvailable,
          待补充拼图块ID: remaining
        });
      } else {
        newStates.availablePieces = new Set();
        newStates.remainingPieces = [];
      }
      
      // 作茧自缚特效：初始化角落槽位为解锁状态
      if (challenge.effects?.includes('corner_start') || challenge.effects?.includes('作茧自缚')) {
        const corners = [0, cols - 1, (rows - 1) * cols, rows * cols - 1];
        newStates.unlockedSlots = new Set(corners);
      } else {
        newStates.unlockedSlots = new Set();
      }
      
      // 亦步亦趋特效：初始化状态
      if (challenge.effects?.includes('brightness') || challenge.effects?.includes('亦步亦趋')) {
        newStates.lastPlacedSlot = -1;
        // 初始可以在任意位置放置第一个拼图块
        const allSlots = Array.from({ length: rows * cols }, (_, i) => i);
        newStates.stepFollowSlots = new Set(allSlots);
      } else {
        newStates.lastPlacedSlot = -1;
        newStates.stepFollowSlots = new Set();
      }
      
      // 鱼目混珠特效：初始化伪造拼图块
      if (challenge.effects?.includes('double_steps') || challenge.effects?.includes('鱼目混珠')) {
        // 识别所有伪造拼图块（ID以fake_开头的拼图块）
        const fakePieces = puzzleConfig.pieces
          .filter(piece => piece.id.startsWith('fake_'))
          .map(piece => piece.id);
        
        newStates.fakePieces = new Set(fakePieces);
        
        console.log('🐟 鱼目混珠特效初始化:', {
          伪造拼图块数量: fakePieces.length,
          伪造拼图块: fakePieces
        });
      } else {
        newStates.fakePieces = new Set();
      }
      
      return newStates;
    });
  }, [puzzleConfig, challenge.effects, challenge.gridSize, puzzleType]);

  // 计时器更新
  useEffect(() => {
    if (isComplete || isFailed) return;

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const elapsed = Math.floor((now - gameStartTime.getTime()) / 1000);
      
      // 计算时间限制（生死时速特效）
      const timeLimit = challenge.effects?.includes('time_limit') || challenge.effects?.includes('生死时速') 
        ? (() => {
            const gridParts = challenge.gridSize.split('x');
            const totalPieces = parseInt(gridParts[0]) * parseInt(gridParts[1]);
            return Math.floor(126 * (totalPieces / 9));
          })()
        : challenge.timeLimit;
        
      const remaining = timeLimit - elapsed;
      
      setElapsedTime(elapsed);
      setRemainingTime(remaining);
      
      // 亦步亦趋特效不再更新亮度相位（已改为位置限制特效）
      
      // 检查时间是否用完
      if (remaining <= 0) {
        handleTimeUp();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [gameStartTime, isComplete, isFailed, challenge.effects, challenge.gridSize, challenge.timeLimit]);

  // 键盘事件监听 - 支持天旋地转特效的按键控制
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // 防止在输入框中触发
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case 'r':
        case 'R':
          if (selectedPiece) {
            rotatePiece(selectedPiece, 90); // 顺时针旋转90度
          }
          break;
        case 'l':
        case 'L':
          if (selectedPiece) {
            rotatePiece(selectedPiece, -90); // 逆时针旋转90度
          }
          break;
        case 'f':
        case 'F':
          if (selectedPiece) {
            flipPiece(selectedPiece); // 翻转
          }
          break;
        case 'Escape':
          // 取消选择
          if (selectedPiece && handlePieceSelect) {
            handlePieceSelect(null);
          }
          break;
        case 'a':
        case 'A':
          if (!e.ctrlKey && !e.metaKey) {
            setShowAnswer(!showAnswer);
          }
          break;
        case 'p':
        case 'P':
          if (!e.ctrlKey && !e.metaKey && !isPreviewDisabled) {
            setShowPreview(!showPreview);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedPiece, rotatePiece, flipPiece, handlePieceSelect, showAnswer, setShowAnswer, showPreview, setShowPreview, isPreviewDisabled]);

  // 处理拼图完成
  const handlePuzzleComplete = useCallback(async () => {
    setIsComplete(true);

    // 检查是否在完美步数内完成
    const stepLimit = challenge.effects?.includes('step_limit') || challenge.effects?.includes('精打细算')
      ? (() => {
          const gridParts = challenge.gridSize.split('x');
          const totalPieces = parseInt(gridParts[0]) * parseInt(gridParts[1]);
          return Math.floor(1.5 * totalPieces);
        })()
      : null;
    const actualMoves = moves;
    const isPerfect = stepLimit ? actualMoves <= stepLimit : actualMoves <= challenge.perfectMoves;

    // 更新用户挑战记录
    if (authState.isAuthenticated && authState.user) {
      updateChallengeRecord(true, elapsedTime, moves);
      // 同步成绩到每日挑战排行榜
      const user = authState.user;
      const gridParts = challenge.gridSize.split('x');
      const totalPieces = parseInt(gridParts[0]) * parseInt(gridParts[1]);
      const score = Math.round((0.1 * challenge.star + 1) * (60 / elapsedTime) * (1.2 * totalPieces / moves) * 100);
      try {
        await DailyChallengeLeaderboardService.submitDailyChallengeCompletion({
          date: challenge.date,
          challengeId: challenge.id,
          puzzleName: challenge.title,
          difficulty: challenge.difficulty,
          pieceShape: challenge.puzzleType,
          gridSize: challenge.gridSize,
          totalPieces,
          completionTime: elapsedTime,
          moves,
          score,
          isPerfect,
          totalStars: challenge.star,
          consecutiveDays: 0, // 可根据 streak 传递
          playerName: user.username || user.id
        });
      } catch (e) {
        console.error('同步每日挑战成绩到排行榜失败', e);
      }
    }
  }, [moves, challenge, elapsedTime, authState]);

  // 检查亦步亦趋特效是否无可放置位置
  const checkStepFollowFailure = useCallback(() => {
    if (!challenge.effects?.includes('brightness') && !challenge.effects?.includes('亦步亦趋')) {
      return;
    }
    
    if (!gameState || gameState.isCompleted) {
      return;
    }
    
    // 检查是否还有未放置的拼图块
    const hasUnplacedPieces = gameState.answerGrid.some(slot => slot === null);
    
    if (hasUnplacedPieces && effectStates.stepFollowSlots.size === 0 && effectStates.lastPlacedSlot !== -1) {
      // 还有拼图块没放置，但没有可放置的位置，游戏失败
      setFailureReason('亦步亦趋特效：您已经无法在上次放置的拼图块周围继续放置，游戏失败！');
      setShowFailureModal(true);
    }
  }, [challenge.effects, gameState, effectStates.stepFollowSlots, effectStates.lastPlacedSlot]);

  // 特效增强的拼图块撤回函数
  const enhancedRemovePieceFromSlot = useCallback((pieceId: string) => {
    if (!gameState) return;
    
    // 先找到要撤回的拼图块信息
    const piece = gameState.config.pieces.find(p => p.id === pieceId);
    if (!piece || piece.currentSlot === null) {
      return;
    }
    
    const removedSlotIndex = piece.currentSlot;
    
    // 执行正常的撤回逻辑
    removePieceFromSlot(pieceId);
    
    // 亦步亦趋特效：回退状态逻辑
    if (challenge.effects?.includes('brightness') || challenge.effects?.includes('亦步亦趋')) {
      setEffectStates(prev => {
        const newStates = { ...prev };
        
        // 如果撤回的是最后放置的拼图块，需要回退状态
        if (removedSlotIndex === prev.lastPlacedSlot) {
          // 查找上一个放置的拼图块位置
          const remainingPieces = gameState.answerGrid.filter((slot, index) => 
            slot !== null && index !== removedSlotIndex
          );
          
          if (remainingPieces.length === 0) {
            // 如果没有其他拼图块了，回到初始状态
            newStates.lastPlacedSlot = -1;
            const { rows, cols } = gameState.config.gridSize;
            const allSlots = Array.from({ length: rows * cols }, (_, i) => i);
            newStates.stepFollowSlots = new Set(allSlots);
          } else {
            // 找到最后一个剩余拼图块的位置
            const lastRemainingPieceIndex = gameState.answerGrid
              .map((slot, index) => slot !== null && index !== removedSlotIndex ? index : -1)
              .filter(index => index !== -1)
              .pop();
              
            if (lastRemainingPieceIndex !== undefined && lastRemainingPieceIndex !== -1) {
              newStates.lastPlacedSlot = lastRemainingPieceIndex;
              // 重新计算基于新的最后位置的可放置槽位
              const adjacentSlots = getAdjacentSlots(lastRemainingPieceIndex);
              const availableAdjacent = adjacentSlots.filter(slot => 
                slot !== removedSlotIndex && !gameState.answerGrid[slot] // 排除刚撤回的位置，且槽位未被占用
              );
              newStates.stepFollowSlots = new Set(availableAdjacent);
            }
          }
          
          console.log('👨‍💼 亦步亦趋特效撤回状态更新:', {
            撤回位置: removedSlotIndex,
            新的最后位置: newStates.lastPlacedSlot,
            新的可放置位置: Array.from(newStates.stepFollowSlots)
          });
        }
        
        return newStates;
      });
    }
  }, [gameState, removePieceFromSlot, challenge.effects, getAdjacentSlots]);

  // 特效增强的拼图块放置函数
  const enhancedPlacePieceToSlot = useCallback((pieceId: string, slotIndex: number) => {
    // 检查特效限制（位置限制）
    if (!canPlaceToSlot(slotIndex)) {
      return; // 不能放置在该位置，直接返回
    }
    
    // 鱼目混珠特效：检查是否是伪造拼图块
    const isFakePiece = effectStates.fakePieces.has(pieceId);
    
    // 如果是伪造拼图块，无论放在哪里都直接游戏结束
    if (isFakePiece) {
      // 伪造拼图块放入任意位置都直接游戏结束
      console.log('🐟 鱼目混珠：放入了伪造拼图块，游戏结束', pieceId);
      
      // 设置失败原因
      setFailureReason('放入了伪造的拼图块，挑战失败！');
      
      // 显示失败弹窗
      setShowFailureModal(true);
      
      // 设置游戏为失败状态
      setIsFailed(true);
      
      // 更新挑战记录
      if (authState.isAuthenticated && authState.user) {
        updateChallengeRecord(false, elapsedTime, moves);
      }
      
      return;
    }
    
    // 不是伪造拼图块，执行正常的放置逻辑
    placePieceToSlot(pieceId, slotIndex);

    // 最终防线特效：检查拼图块是否放置正确
    // 注意：这里需要获取最新的拼图块状态，而不是gameState中可能过时的状态
    if (challenge.effects?.includes('最终防线') || challenge.effects?.includes('no_mistakes')) {
      // 为了解决天旋地转和最终防线特效冲突，我们需要在放置后检查状态
      // 而不是在放置前检查可能过时的状态
      
      // 延迟检查放置结果，确保状态已经更新
      setTimeout(() => {
        // 直接访问当前的gameState状态
        if (gameState) {
          const piece = gameState.config.pieces.find(p => p.id === pieceId);
          if (piece) {
            // 标准化旋转角度进行比较
            const normalizeRotation = (rotation: number) => ((rotation % 360) + 360) % 360;
            const currentRotation = normalizeRotation(piece.rotation);
            const correctRotation = normalizeRotation(piece.correctRotation);
            
            // 检查是否放置在正确的位置且旋转、翻转状态正确
            const isCorrectPlacement = piece.correctSlot === slotIndex && 
                                       currentRotation === correctRotation && 
                                       piece.isFlipped === (piece.correctIsFlipped || false);
            
            if (!isCorrectPlacement) {
              // 错误放置，立即显示失败弹窗
              if (challenge.effects?.includes('最终防线')) {
                setFailureReason(`您放置了一个错误的拼图块！"最终防线"特效不允许任何放置失误。\n当前状态: 旋转${currentRotation}°, 翻转${piece.isFlipped ? '是' : '否'}\n正确状态: 旋转${correctRotation}°, 翻转${piece.correctIsFlipped ? '是' : '否'}`);
                setShowFailureModal(true);
              } else if (challenge.effects?.includes('no_mistakes')) {
                // 其他no_mistakes特效直接失败
                setEffectStates(prev => ({ ...prev, hasStepError: true }));
                setIsFailed(true);
                if (authState.isAuthenticated && authState.user) {
                  updateChallengeRecord(false, elapsedTime, moves);
                }
              }
            }
          }
        }
      }, 100); // 增加延迟到100ms，确保状态完全更新
    }
    
    // 管中窥豹特效：正确放置后补充新的拼图块
    if (challenge.effects?.includes('partial') || challenge.effects?.includes('管中窥豹')) {
      // 延迟检查，确保状态已更新
      setTimeout(() => {
        // 直接访问当前的gameState状态
        if (gameState) {
          const piece = gameState.config.pieces.find(p => p.id === pieceId);
          if (piece) {
            // 标准化旋转角度进行比较
            const normalizeRotation = (rotation: number) => ((rotation % 360) + 360) % 360;
            const currentRotation = normalizeRotation(piece.rotation);
            const correctRotation = normalizeRotation(piece.correctRotation);
            
            if (piece.correctSlot === slotIndex && 
                currentRotation === correctRotation && 
                piece.isFlipped === (piece.correctIsFlipped || false)) {
              // 正确放置，从剩余拼图块中补充一个
              setEffectStates(prev => {
                if (prev.remainingPieces.length > 0) {
                  const newRemainingPieces = [...prev.remainingPieces];
                  const nextPieceId = newRemainingPieces.shift(); // 取出第一个
                  const newAvailablePieces = new Set(prev.availablePieces);
                  if (nextPieceId) {
                    newAvailablePieces.add(nextPieceId);
                    console.log('🔍 管中窥豹特效补充拼图块:', {
                      正确放置的拼图块: pieceId,
                      补充的拼图块: nextPieceId,
                      剩余待补充: newRemainingPieces.length
                    });
                  }
                  return {
                    ...prev,
                    availablePieces: newAvailablePieces,
                    remainingPieces: newRemainingPieces
                  };
                }
                return prev;
              });
            }
          }
        }
      }, 100);
    }
    
    // 作茧自缚特效：只有正确放置才会解锁相邻槽位
    if (challenge.effects?.includes('corner_start') || challenge.effects?.includes('作茧自缚')) {
      // 延迟检查，确保状态已更新
      setTimeout(() => {
        // 直接访问当前的gameState状态
        if (gameState) {
          const piece = gameState.config.pieces.find(p => p.id === pieceId);
          if (piece) {
            // 标准化旋转角度进行比较
            const normalizeRotation = (rotation: number) => ((rotation % 360) + 360) % 360;
            const currentRotation = normalizeRotation(piece.rotation);
            const correctRotation = normalizeRotation(piece.correctRotation);
            
            if (piece.correctSlot === slotIndex && 
                currentRotation === correctRotation && 
                piece.isFlipped === (piece.correctIsFlipped || false)) {
              // 只有完全正确放置时才解锁相邻槽位
              const adjacentSlots = getAdjacentSlots(slotIndex);
              setEffectStates(prev => {
                const newUnlockedSlots = new Set(prev.unlockedSlots);
                adjacentSlots.forEach(slot => newUnlockedSlots.add(slot));
                return { ...prev, unlockedSlots: newUnlockedSlots };
              });
            }
          }
        }
      }, 100);
    }
    
    // 亦步亦趋特效：更新上次放置位置和当前可放置槽位
    if (challenge.effects?.includes('brightness') || challenge.effects?.includes('亦步亦趋')) {
      setEffectStates(prev => {
        const newStates = { ...prev };
        newStates.lastPlacedSlot = slotIndex;
        
        // 获取相邻槽位作为下次可放置的位置
        const adjacentSlots = getAdjacentSlots(slotIndex);
        // 只允许在未被占用的相邻槽位放置
        const availableAdjacent = adjacentSlots.filter(slot => 
          !gameState?.answerGrid[slot] // 槽位未被占用
        );
        newStates.stepFollowSlots = new Set(availableAdjacent);
        
        console.log('👨‍💼 亦步亦趋特效更新:', {
          放置位置: slotIndex,
          下次可放置位置: availableAdjacent
        });
        
        return newStates;
      });
    }
    
    // 更新步数（鱼目混珠特效不再显示×2步数）
    setEffectStates(prev => ({ ...prev, actualMoves: prev.actualMoves + 1 }));
    setMoves(prev => prev + 1);
    
    // 检查精打细算特效的步数限制
    if (challenge.effects?.includes('step_limit') || challenge.effects?.includes('精打细算')) {
      const gridParts = challenge.gridSize.split('x');
      const totalPieces = parseInt(gridParts[0]) * parseInt(gridParts[1]);
      const stepLimit = Math.floor(1.5 * totalPieces);
      const currentActualMoves = effectStates.actualMoves + 1;
      if (currentActualMoves > stepLimit) {
        setIsFailed(true);
        if (authState.isAuthenticated && authState.user) {
          updateChallengeRecord(false, elapsedTime, moves);
        }
        return;
      }
    }
    
    // 检查亦步亦趋特效的失败条件（在放置后延迟检查）
    setTimeout(() => {
      checkStepFollowFailure();
    }, 100);
    
  }, [placePieceToSlot, canPlaceToSlot, challenge.effects, challenge.gridSize, effectStates.actualMoves, effectStates.fakePieces, moves, authState, getAdjacentSlots, gameState, checkStepFollowFailure, setFailureReason, setShowFailureModal, setIsFailed]);

  // 监听亦步亦趋特效的失败条件
  useEffect(() => {
    checkStepFollowFailure();
  }, [checkStepFollowFailure]);

  // 监听游戏完成状态（仿照普通关卡的完成检测机制）
  useEffect(() => {
    if (gameState?.isCompleted && !isComplete) {
      handlePuzzleComplete();
    }
  }, [gameState?.isCompleted, isComplete, handlePuzzleComplete]);
  
  // 处理时间用完
  const handleTimeUp = useCallback(() => {
    setIsFailed(true);
    
    // 更新用户挑战记录
    if (authState.isAuthenticated && authState.user) {
      updateChallengeRecord(false, elapsedTime, moves);
    }
  }, [authState]);

  // 处理失败弹窗的再试一次
  const handleTryAgain = useCallback(() => {
    setShowFailureModal(false);
    setFailureReason('');
    // 重新开始挑战
    const canRestart = onRestartChallenge?.();
    if (canRestart) {
      generatePuzzle();
    }
  }, [onRestartChallenge, generatePuzzle]);

  // 处理失败弹窗的返回菜单
  const handleBackToMenuFromFailure = useCallback(() => {
    setShowFailureModal(false);
    setFailureReason('');
    // 标记为失败并返回菜单
    setIsFailed(true);
    if (authState.isAuthenticated && authState.user) {
      updateChallengeRecord(false, elapsedTime, moves);
    }
    onBackToMenu();
  }, [authState, onBackToMenu]);

  // 处理进度变化
  const handleProgressChange = useCallback((newProgress: { correct: number; total: number; percentage: number }) => {
    setProgress(newProgress);
  }, []);

  // 更新挑战记录
  const updateChallengeRecord = async (isCompleted: boolean, time: number, moves: number) => {
    try {
      if (!authState.user) return;
      
      const userId = authState.user.id;
      
      // 根据用户认证状态选择数据存储方式
      if (authState.isAuthenticated) {
        // 云端用户 - 使用云存储服务
        const usersResponse = await cloudStorage.getUsers();
        if (!usersResponse.success) {
          throw new Error(usersResponse.error || '获取用户数据失败');
        }
        
        const users = usersResponse.data || [];
        const userIndex = users.findIndex((u: any) => u.id === userId);
        
        if (userIndex === -1) {
          console.error('未找到用户数据');
          return;
        }
        
        const user = users[userIndex];
        
        // 更新挑战记录
        const challengeRecordKey = `daily_challenge_${userId}_${challenge.date}_${challenge.id.split('-')[2]}`;
        const savedRecord = localStorage.getItem(challengeRecordKey);
        let record: any = savedRecord ? JSON.parse(savedRecord) : {};
        
        if (isCompleted) {
          record.isCompleted = true;
          record.time = time;
          record.moves = moves;
          record.isPerfect = moves <= challenge.perfectMoves;
          
          // 更新最佳记录
          if (!record.bestTime || time < record.bestTime) {
            record.bestTime = time;
          }
          if (!record.bestMoves || moves < record.bestMoves) {
            record.bestMoves = moves;
          }
        }
        
        // 保存到localStorage（作为缓存）
        localStorage.setItem(challengeRecordKey, JSON.stringify(record));
        
        // 更新用户数据
        if (!user.challengeHistory) {
          user.challengeHistory = [];
        }
        
        const historyIndex = user.challengeHistory.findIndex((h: any) => h.id === challenge.id);
        const historyRecord = {
          id: challenge.id,
          date: challenge.date,
          title: challenge.title,
          description: challenge.description,
          difficulty: challenge.difficulty,
          puzzleImage: challenge.puzzleImage,
          gridSize: challenge.gridSize,
          time: time,
          moves: moves,
          completed: isCompleted,
          isPerfect: moves <= challenge.perfectMoves,
          attempts: (record.attempts || 0) + 1,
          effect: challenge.effect // 添加特效字段用于匹配
        };
        
        if (historyIndex === -1) {
          user.challengeHistory.push(historyRecord);
        } else {
          user.challengeHistory[historyIndex] = historyRecord;
        }
        
        // 更新连击天数
        if (isCompleted) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          const lastCompletedDate = user.lastDailyChallengeDate ? 
            new Date(user.lastDailyChallengeDate) : null;
            
          if (lastCompletedDate) {
            lastCompletedDate.setHours(0, 0, 0, 0);
            
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            yesterday.setHours(0, 0, 0, 0);
            
            if (lastCompletedDate >= yesterday) {
              user.dailyStreak = (user.dailyStreak || 0) + 1;
            } else {
              user.dailyStreak = 1;
            }
          } else {
            user.dailyStreak = 1;
          }
          
          user.lastDailyChallengeDate = new Date().toISOString();
        }
        
        // 添加金币奖励
        const coinsReward = challenge.rewards.completion.includes('金币') ? 
          parseInt(challenge.rewards.completion.match(/\d+/)?.[0] || '0') : 0;
        user.coins = (user.coins || 0) + coinsReward;
        
        // 添加经验奖励
        const expReward = challenge.rewards.speed.includes('经验值') ? 
          parseInt(challenge.rewards.speed.match(/\d+/)?.[0] || '0') : 0;
        user.experience = (user.experience || 0) + expReward;
        
        // 如果完美完成，添加完美主义者称号
        if (isCompleted && moves <= challenge.perfectMoves && !user.achievements.includes('完美主义者')) {
          user.achievements.push('完美主义者');
        }
        
        // 保存更新后的用户数据到云存储
        users[userIndex] = user;
        await cloudStorage.saveUsers(users);
        
        // 同时更新本地存储的用户数据
        const { password, ...userWithoutPassword } = user;
        localStorage.setItem('puzzle_current_user', JSON.stringify(userWithoutPassword));
      } else {
        // 本地用户 - 使用localStorage
        const challengeRecordKey = `daily_challenge_${userId}_${challenge.date}_${challenge.id.split('-')[2]}`;
        const savedRecord = localStorage.getItem(challengeRecordKey);
        let record: any = savedRecord ? JSON.parse(savedRecord) : {};
        
        if (isCompleted) {
          record.isCompleted = true;
          record.time = time;
          record.moves = moves;
          record.isPerfect = moves <= challenge.perfectMoves;
          
          // 更新最佳记录
          if (!record.bestTime || time < record.bestTime) {
            record.bestTime = time;
          }
          if (!record.bestMoves || moves < record.bestMoves) {
            record.bestMoves = moves;
          }
        }
        
        // 保存到localStorage
        localStorage.setItem(challengeRecordKey, JSON.stringify(record));
        
        // 更新用户数据到localStorage
        const userDataKey = `user_data_${userId}`;
        const savedUserData = localStorage.getItem(userDataKey);
        const userData = savedUserData ? JSON.parse(savedUserData) : {
          dailyStreak: 0,
          coins: 0,
          experience: 0,
          achievements: [],
          challengeHistory: []
        };
        
        // 更新挑战历史
        if (!userData.challengeHistory) {
          userData.challengeHistory = [];
        }
        
        const historyIndex = userData.challengeHistory.findIndex((h: any) => h.id === challenge.id);
        const historyRecord = {
          id: challenge.id,
          date: challenge.date,
          title: challenge.title,
          description: challenge.description,
          difficulty: challenge.difficulty,
          puzzleImage: challenge.puzzleImage,
          gridSize: challenge.gridSize,
          time: time,
          moves: moves,
          completed: isCompleted,
          isPerfect: moves <= challenge.perfectMoves,
          effect: challenge.effect // 添加特效字段用于匹配
        };
        
        if (historyIndex === -1) {
          userData.challengeHistory.push(historyRecord);
        } else {
          userData.challengeHistory[historyIndex] = historyRecord;
        }
        
        // 更新连击天数和奖励
        if (isCompleted) {
          userData.dailyStreak = (userData.dailyStreak || 0) + 1;
          userData.coins = (userData.coins || 0) + 
            (challenge.rewards.completion.includes('金币') ? 
              parseInt(challenge.rewards.completion.match(/\d+/)?.[0] || '0') : 0);
          userData.experience = (userData.experience || 0) + 
            (challenge.rewards.speed.includes('经验值') ? 
              parseInt(challenge.rewards.speed.match(/\d+/)?.[0] || '0') : 0);
          
          // 如果完美完成，添加完美主义者称号
          if (moves <= challenge.perfectMoves && !userData.achievements.includes('完美主义者')) {
            userData.achievements = [...userData.achievements, '完美主义者'];
          }
        }
        
        localStorage.setItem(userDataKey, JSON.stringify(userData));
      }
    } catch (error) {
      console.error('更新挑战记录失败:', error);
    }
  };

  // 获取挑战统计数据
  const getChallengeStats = () => {
    if (!puzzleConfig) return { difficulty: 'easy', totalPieces: 0 };
    
    return {
      difficulty: challenge.difficulty,
      totalPieces: puzzleConfig.pieces.length
    };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <div className="text-lg text-gray-600">正在生成每日挑战拼图...</div>
          <div className="text-sm text-gray-500 mt-2">请稍候，这可能需要几秒钟</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">生成失败</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex gap-4 justify-center">
            <Button onClick={generatePuzzle} variant="primary">
              重试
            </Button>
            <Button onClick={onBackToMenu} variant="secondary">
              返回每日挑战
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!puzzleConfig) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg text-gray-600">拼图配置加载中...</div>
        </div>
      </div>
    );
  }

  const stats = getChallengeStats();
  const isPerfect = moves <= challenge.perfectMoves;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 游戏头部 */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          {/* 左侧：游戏信息 */}
          <div className="flex items-center space-x-6">
            <Button onClick={onBackToMenu} variant="secondary" size="small">
              ← 返回
            </Button>
            <div>
              <h1 className="text-xl font-bold text-gray-800">每日挑战：{challenge.title}</h1>
              <div className="text-sm text-gray-500">
                {challenge.gridSize} · {stats.difficulty} · {stats.totalPieces} 块
              </div>
            </div>
          </div>

          {/* 中间：进度信息 */}
          <div className="flex items-center space-x-6">
            <div className="text-center">
              <div className={`text-2xl font-bold ${remainingTime < 60 ? 'text-red-600' : 'text-blue-600'}`}>
                <Timer time={remainingTime} isRunning={!isComplete && !isFailed} />
              </div>
              <div className="text-xs text-gray-500">剩余时间</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-700">{moves}</div>
              <div className="text-xs text-gray-500">
                当前步数
              </div>
            </div>
          </div>

          {/* 右侧：游戏操作 */}
          <div className="flex items-center space-x-3">
            {/* 显示当前激活的特效 */}
            {true && ( // 总是显示特效信息，方便测试
              <div className="text-center">
                <div className="text-sm font-semibold text-purple-600">
                  {challenge.effects?.length || 0}个特效
                </div>
                <div className="text-xs text-gray-500">
                  {getTotalStars()}星加成
                </div>
              </div>
            )}
            
            {/* 步数限制提示（精打细算特效） */}
            {(challenge.effects?.includes('step_limit') || challenge.effects?.includes('精打细算')) && (
              (() => {
                const gridParts = challenge.gridSize.split('x');
                const totalPieces = parseInt(gridParts[0]) * parseInt(gridParts[1]);
                const stepLimit = Math.floor(1.5 * totalPieces);
                const currentMoves = moves;
                return (
                  <div className={`text-center ${currentMoves > stepLimit * 0.8 ? 'step-limit-warning' : ''}`}>
                    <div className="text-sm font-semibold text-orange-600">
                      {stepLimit - currentMoves}
                    </div>
                    <div className="text-xs text-gray-500">剩余步数</div>
                  </div>
                );
              })()
            )}
            
            <Button 
              onClick={() => setShowPreview(!showPreview)}
              variant="secondary" 
              size="small"
              disabled={isPreviewDisabled}
            >
              {isPreviewDisabled ? '🚫 原图' : (showPreview ? '🙈 隐藏原图' : '🖼️ 查看原图')}
            </Button>
            <Button 
              onClick={() => setShowAnswer(!showAnswer)}
              variant="secondary" 
              size="small"
              disabled={isAnswerDisabled}
            >
              {isAnswerDisabled ? '🚫 答案' : (showAnswer ? '🙈 隐藏答案' : '💡 显示答案')}
            </Button>
            <Button 
              onClick={undo}
              variant="secondary" 
              size="small"
              disabled={!gameState || gameState.history.length === 0}
            >
              ↩️ 撤销
            </Button>
            <Button 
              onClick={redo}
              variant="secondary" 
              size="small"
              disabled={!gameState || gameState.redoStack.length === 0}
            >
              ↪️ 重做
            </Button>
            <Button onClick={handleRestart} variant="secondary" size="small">
              🔄 重新开始
            </Button>
            <Button 
              onClick={onBackToMenu} 
              variant="primary" 
              size="small"
              disabled={!isComplete && !isFailed}
            >
              {isComplete ? '🎉 完成' : isFailed ? '❌ 失败' : '⏸️ 暂停'}
            </Button>
          </div>
        </div>

        {/* 进度条 */}
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* 游戏主体 */}
      <div className="p-6">
        {/* 特效提示信息 */}
        {true && ( // 总是显示特效信息，方便测试
          <div className="mb-4 bg-purple-50 rounded-lg p-4 border border-purple-200">
            <h3 className="text-lg font-semibold text-purple-800 mb-2 flex items-center">
              ✨ 当前特效
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {challenge.effects && challenge.effects.length > 0 ? (
                challenge.effects.map((effectId, index) => {
                  const effectName = getEffectName(effectId);
                  const effectDescription = getEffectDescription(effectId);
                  const effectStars = getEffectStars(effectId);
                  return (
                    <div key={index} className="bg-white rounded-lg p-3 border border-purple-100">
                      <div className="font-semibold text-purple-700 flex items-center justify-between">
                        <span>{effectName}</span>
                        <span className="text-yellow-500">{'★'.repeat(effectStars)}</span>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">{effectDescription}</div>
                    </div>
                  );
                })
              ) : (
                <div className="bg-white rounded-lg p-3 border border-purple-100">
                  <div className="font-semibold text-purple-700 flex items-center justify-between">
                    <span>无特效</span>
                    <span className="text-yellow-500">★</span>
                  </div>
                  <div className="text-sm text-gray-600 mt-1">本关卡没有任何特效</div>
                </div>
              )}
            </div>
            {/* 管中窥豹特效提示 */}
            {(challenge.effects?.includes('partial') || challenge.effects?.includes('管中窥豹')) && (
              <div className="partial-effect-hint">
                🔍 管中窥豹：初始只提供一半拼图块，正确放置后自动补充新的拼图块！当前可用: {effectStates.availablePieces.size}/{gameState?.config.pieces.length || 0}
              </div>
            )}
            {/* 深渊漫步特效提示 */}
            {(challenge.effects?.includes('invisible') || challenge.effects?.includes('深渊漫步')) && (
              <div className="invisible-effect-hint">
                🎩 深渊漫步：放置后的拼图块为纯黑色不可见，只会提示是否正确放置！
              </div>
            )}
            {/* 颠倒世界特效提示 */}
            {(challenge.effects?.includes('upside_down') || challenge.effects?.includes('颠倒世界')) && (
              <div className="upside-down-effect-hint">
                🔄 颠倒世界：原图已被旋转180°，拼图区域和答题区都是颠倒的
              </div>
            )}
            {/* 亦步亦趋特效提示 */}
            {(challenge.effects?.includes('brightness') || challenge.effects?.includes('亦步亦趋')) && (
              <div className="step-follow-effect-hint">
                👨‍💼 亦步亦趋：仅能在上次放置的拼图块周围放置！当前可放置: {effectStates.stepFollowSlots.size}个位置
              </div>
            )}
            {/* 鱼目混珠特效提示 */}
            {(challenge.effects?.includes('double_steps') || challenge.effects?.includes('鱼目混珠')) && (
              <div className="step-follow-effect-hint">
                🐟 鱼目混珠：混入了3块拼图块的复制体，复制体放入错误位置时会显示错误，放入正确位置时会直接消失！
              </div>
            )}
            {/* 天旋地转特效提示 */}
            {(challenge.effects?.includes('rotate') || challenge.effects?.includes('天旋地转')) && (
              <div className="rotate-effect-hint">
                🎮 天旋地转：拼图块已随机旋转翻转，请使用R键旋转、F键翻转调整到正确位置！
              </div>
            )}
          </div>
        )}

        {/* 预览和答案显示区域 */}
        {(showPreview || showAnswer) && (
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {showPreview && !isPreviewDisabled && (
              <div className="bg-white rounded-lg shadow-md p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                  🖼️ 原图预览
                </h3>
                <div className="flex justify-center">
                  <img 
                    src={challenge.puzzleImage} 
                    alt="原图预览" 
                    className="max-w-full max-h-60 rounded-lg shadow-sm"
                    style={{ objectFit: 'contain' }}
                  />
                </div>
              </div>
            )}
            
            {showAnswer && !isAnswerDisabled && (
              <div className="bg-white rounded-lg shadow-md p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                  💡 答案提示
                </h3>
                <div className="space-y-3">
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-800">
                      <strong>💎 完美步数目标：</strong> {challenge.perfectMoves} 步
                    </p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                    <p className="text-sm text-green-800">
                      <strong>🎯 解题建议：</strong> 
                      {challenge.gridSize === '3x3' && '先完成四个角落，然后填充边缘，最后完成中心区域。'}
                      {challenge.gridSize === '4x4' && '从外向内逐层完成，优先放置边角特征明显的拼图块。'}
                      {challenge.gridSize === '5x5' && '分区域完成，先识别特征明显的区域作为起点。'}
                      {challenge.gridSize === '6x6' && '采用分块策略，将整个拼图分为几个区域分别完成。'}
                    </p>
                  </div>
                  <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                    <p className="text-sm text-yellow-800">
                      <strong>⏱️ 时间管理：</strong> 剩余时间 {Math.floor(remainingTime / 60)}:{(remainingTime % 60).toString().padStart(2, '0')}，
                      建议每块用时不超过 {Math.floor(remainingTime / (stats.totalPieces - progress.correct))} 秒
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div 
          className={`bg-white rounded-lg shadow-lg overflow-hidden ${getEffectClasses()}`}
          style={{ 
            width: '1200px', 
            height: '650px',
            margin: '0 auto',
            ...getEffectStyles()
          }}
        >
          {puzzleType === 'square' && gameState ? (
            <PuzzleWorkspace
              gameState={gameState}
              selectedPiece={selectedPiece}
              showAnswers={showAnswer && !isAnswerDisabled}
              onPieceSelect={handlePieceSelect}
              onPlacePiece={enhancedPlacePieceToSlot}
              onRemovePiece={enhancedRemovePieceFromSlot}
              onRotatePiece={(id) => rotatePiece(id, 90)}
              onFlipPiece={flipPiece}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              availablePieces={effectStates.availablePieces}
              hasPartialEffect={challenge.effects?.includes('partial') || challenge.effects?.includes('管中窥豹')}
              unlockedSlots={effectStates.unlockedSlots}
              hasCornerEffect={challenge.effects?.includes('corner_start') || challenge.effects?.includes('作茧自缚')}
              hasUpsideDownEffect={challenge.effects?.includes('upside_down') || challenge.effects?.includes('颠倒世界')}
              fakePieces={effectStates.fakePieces}
              hasFakePiecesEffect={challenge.effects?.includes('double_steps') || challenge.effects?.includes('鱼目混珠')}
            />
          ) : (
            <IrregularPuzzleWorkspace
              config={puzzleConfig as IrregularPuzzleConfig}
              onPuzzleComplete={handlePuzzleComplete}
              onProgressChange={handleProgressChange}
              scale={1}
              showDebugInfo={typeof window !== 'undefined' && window.location.hostname === 'localhost'}
            />
          )}
        </div>
        
        {/* 操作提示 */}
        <div className="game-tips-area mt-4">
          <div className="game-tips bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
            <div className="flex items-center mb-2">
              <span className="text-blue-600 font-semibold">💡 操作提示：</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-gray-700">
              <div>• 点击选择拼图块，再点击答题卡槽位放置</div>
              <div>• A键切换答案显示 | P键切换原图预览</div>
              {(challenge.effects?.includes('rotate') || challenge.effects?.includes('天旋地转')) && (
                <>
                  <div className="text-orange-600 font-medium">• R键顺时针旋转 | L键逆时针旋转</div>
                  <div className="text-orange-600 font-medium">• F键翻转 | ESC键取消选择</div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 游戏结果模态框 */}
      {(isComplete || isFailed) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 text-center">
            {isComplete ? (
              <>
                <div className="text-6xl mb-4">🎉</div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">恭喜完成！</h2>
                <p className="text-gray-600 mb-4">
                  您成功完成了这个 {challenge.gridSize} 异形拼图！
                </p>
                {isPerfect && (
                  <div className="bg-yellow-50 rounded-lg p-3 mb-4 border border-yellow-200">
                    <div className="text-yellow-600 font-semibold">✨ 完美主义者！</div>
                    <div className="text-sm text-gray-600">在 {challenge.perfectMoves} 步内完成拼图</div>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="text-6xl mb-4">⏰</div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">时间到！</h2>
                <p className="text-gray-600 mb-4">
                  很遗憾，您未能在规定时间内完成拼图。
                </p>
              </>
            )}
            
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-semibold text-gray-700">用时</div>
                  <div className="text-gray-600">
                    <Timer 
                      time={elapsedTime} 
                      isRunning={false} 
                    />
                  </div>
                </div>
                <div>
                  <div className="font-semibold text-gray-700">拼图块数</div>
                  <div className="text-gray-600">{stats.totalPieces} 块</div>
                </div>
                <div>
                  <div className="font-semibold text-gray-700">难度等级</div>
                  <div className="text-gray-600 capitalize">{stats.difficulty}</div>
                </div>
                <div>
                  <div className="font-semibold text-gray-700">完成度</div>
                  <div className="text-gray-600">{progress.percentage}%</div>
                </div>
              </div>
            </div>

            {isComplete && (
              <div className="bg-green-50 rounded-lg p-4 mb-6 border border-green-200">
                <div className="text-green-600 font-semibold">🎁 获得奖励</div>
                <div className="text-sm text-gray-600 mt-2">{challenge.rewards.completion}</div>
                <div className="text-sm text-gray-600">{challenge.rewards.speed}</div>
                {isPerfect && (
                  <div className="text-sm text-gray-600">{challenge.rewards.perfect}</div>
                )}
              </div>
            )}

            <div className="flex gap-3">
              <Button onClick={generatePuzzle} variant="secondary" className="flex-1">
                再玩一次
              </Button>
              <Button onClick={onBackToMenu} variant="primary" className="flex-1">
                返回每日挑战
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 失败弹窗 */}
      <GameFailureModal
        isVisible={showFailureModal}
        onTryAgain={handleTryAgain}
        onBackToMenu={handleBackToMenuFromFailure}
        failureReason={failureReason}
      />
    </div>
  );
};