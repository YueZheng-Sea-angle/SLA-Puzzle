import React, { useState } from 'react';
import { Asset, PuzzleConfig, DifficultyLevel, PieceShape } from '../types';
import { AssetLibrary } from '../components/game/AssetLibrary';
import { PuzzleGenerator } from '../utils/puzzleGenerator';
import { GameConfigPanel } from '../components/MainMenu';


interface MainMenuProps {
  onStartGame: (puzzleConfig: PuzzleConfig) => void;
  onStartIrregularGame: (imageData?: string, gridSize?: '3x3' | '4x4' | '5x5' | '6x6') => void;
  onOpenEditor: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  onStartGame,
  onStartIrregularGame,
  onOpenEditor,
}) => {
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('medium');
  const [pieceShape, setPieceShape] = useState<PieceShape>('square');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleAssetSelect = (asset: Asset) => {
    setSelectedAsset(asset);
  };

  const handleStartGame = async () => {
    if (!selectedAsset) return;

    setIsGenerating(true);
    try {
      // 使用真实的图片数据
      const imageData = selectedAsset.filePath;
      
      // 如果选择的是异形拼图，使用新的异形拼图系统
      if (pieceShape === 'irregular') {
        const difficultyConfig = PuzzleGenerator.getDifficultyConfig(difficulty);
        // 将 GridSize 转换为字符串格式
        const gridSizeStr = `${difficultyConfig.gridSize.rows}x${difficultyConfig.gridSize.cols}` as '3x3' | '4x4' | '5x5' | '6x6';
        onStartIrregularGame(imageData, gridSizeStr);
        return;
      }
      
      // 传统方形拼图
      const difficultyConfig = PuzzleGenerator.getDifficultyConfig(difficulty);
      
      const puzzleConfig = await PuzzleGenerator.generatePuzzle({
        imageData: imageData,
        gridSize: difficultyConfig.gridSize,
        pieceShape: pieceShape,
        name: selectedAsset.name,
      });

      onStartGame(puzzleConfig);
    } catch (error) {
      console.error('生成拼图失败:', error);
      // 如果图片加载失败，使用备用的色块
      const fallbackImageData = `data:image/svg+xml;base64,${btoa(`
        <svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
          <rect width="400" height="400" fill="#${Math.floor(Math.random()*16777215).toString(16)}"/>
          <text x="200" y="200" text-anchor="middle" fill="white" font-size="24">${selectedAsset.name}</text>
        </svg>
      `)}`;
      
      const difficultyConfig = PuzzleGenerator.getDifficultyConfig(difficulty);
      const puzzleConfig = await PuzzleGenerator.generatePuzzle({
        imageData: fallbackImageData,
        gridSize: difficultyConfig.gridSize,
        pieceShape: pieceShape,
        name: selectedAsset.name,
      });
      
      onStartGame(puzzleConfig);
    } finally {
      setIsGenerating(false);
    }
  };



  return (
    <div className="min-h-screen bg-gray-100 text-gray-800 flex justify-center items-start pt-[25px] px-5 pb-5">
      {/* 主要内容区域 - 作为一个整体 */}
      <div className="flex flex-col lg:flex-row gap-5 w-full max-w-7xl">
        {/* 素材选择区域 */}
        <div className="flex-1 bg-white rounded-lg overflow-hidden shadow-lg flex flex-col h-[800px]">
          <AssetLibrary
            onAssetSelect={handleAssetSelect}
            showUpload={true}
          />
        </div>

        {/* 游戏配置区域 */}
        <div className="h-[800px]">
          <GameConfigPanel
            selectedAsset={selectedAsset}
            difficulty={difficulty}
            pieceShape={pieceShape}
            isGenerating={isGenerating}
            onDifficultyChange={setDifficulty}
            onShapeChange={setPieceShape}
            onStartGame={handleStartGame}
            onOpenEditor={onOpenEditor}
          />
        </div>
      </div>
    </div>
  );
};