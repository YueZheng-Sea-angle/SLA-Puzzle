import React, { useState, useEffect, useCallback } from 'react';
import { IrregularPuzzleConfig, IrregularPuzzleGenerator } from '../utils/puzzleGenerator/irregular';
import { IrregularPuzzleWorkspace } from '../components/game/IrregularPuzzleWorkspace';
import { Timer } from '../components/common/Timer';
import { Button } from '../components/common/Button';

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
  const [gameStartTime, setGameStartTime] = useState<Date>(new Date());
  const [isComplete, setIsComplete] = useState(false);
  const [progress, setProgress] = useState({ correct: 0, total: 0, percentage: 0 });
  const [elapsedTime, setElapsedTime] = useState(0);

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
      setGameStartTime(new Date());
      setIsComplete(false);
      setProgress({ correct: 0, total: config.pieces.length, percentage: 0 });
      setElapsedTime(0);
      
    } catch (err) {
      console.error('生成异形拼图失败:', err);
      setError(err instanceof Error ? err.message : '生成拼图时发生未知错误');
    } finally {
      setIsLoading(false);
    }
  }, [imageData, gridSize]);

  // 初始化生成拼图
  useEffect(() => {
    generatePuzzle();
  }, [generatePuzzle]);

  // 计时器更新
  useEffect(() => {
    if (isComplete) return;

    const timer = setInterval(() => {
      setElapsedTime(Math.floor((new Date().getTime() - gameStartTime.getTime()) / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, [gameStartTime, isComplete]);

  // 处理拼图完成
  const handlePuzzleComplete = useCallback(() => {
    setIsComplete(true);
    console.log('异形拼图完成！');
  }, []);

  // 处理进度变化
  const handleProgressChange = useCallback((newProgress: { correct: number; total: number; percentage: number }) => {
    setProgress(newProgress);
  }, []);

  // 重新开始游戏
  const handleRestart = useCallback(() => {
    generatePuzzle();
  }, [generatePuzzle]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <div className="text-lg text-gray-600">正在生成异形拼图...</div>
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
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg text-gray-600">拼图配置加载中...</div>
        </div>
      </div>
    );
  }

  const stats = IrregularPuzzleGenerator.getPuzzleStats(puzzleConfig);

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
              <h1 className="text-xl font-bold text-gray-800">{puzzleConfig.name}</h1>
              <div className="text-sm text-gray-500">
                {gridSize} · {stats.difficulty} · {stats.totalPieces} 块
              </div>
            </div>
          </div>

          {/* 中间：进度信息 */}
          <div className="flex items-center space-x-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{progress.percentage}%</div>
              <div className="text-xs text-gray-500">完成度</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-700">
                {progress.correct}/{progress.total}
              </div>
              <div className="text-xs text-gray-500">正确块数</div>
            </div>
            <div className="text-center">
              <Timer 
                time={elapsedTime} 
                isRunning={!isComplete} 
              />
              <div className="text-xs text-gray-500">用时</div>
            </div>
          </div>

          {/* 右侧：游戏操作 */}
          <div className="flex items-center space-x-3">
            <Button onClick={handleRestart} variant="secondary" size="small">
              🔄 重新开始
            </Button>
            <Button 
              onClick={onBackToMenu} 
              variant="primary" 
              size="small"
              disabled={!isComplete}
            >
              {isComplete ? '🎉 完成' : '⏸️ 暂停'}
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
        <div 
          className="bg-white rounded-lg shadow-lg overflow-hidden"
          style={{ 
            width: '1200px', 
            height: '650px',
            margin: '0 auto'
          }}
        >
          <IrregularPuzzleWorkspace
            config={puzzleConfig}
            onPuzzleComplete={handlePuzzleComplete}
            onProgressChange={handleProgressChange}
            scale={1}
            showDebugInfo={typeof window !== 'undefined' && window.location.hostname === 'localhost'}
          />
        </div>
      </div>

      {/* 游戏完成模态框 */}
      {isComplete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">恭喜完成！</h2>
            <p className="text-gray-600 mb-4">
              您成功完成了这个 {gridSize} 异形拼图！
            </p>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-semibold text-gray-700">完成时间</div>
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
                  <div className="text-gray-600">100%</div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={handleRestart} variant="secondary" className="flex-1">
                再玩一次
              </Button>
              <Button onClick={onBackToMenu} variant="primary" className="flex-1">
                返回主菜单
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
