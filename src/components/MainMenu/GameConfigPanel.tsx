import React from 'react';
import { Asset, DifficultyLevel, PieceShape } from '../../types';
import { SelectedAsset } from './SelectedAsset';
import { DifficultySelector } from './DifficultySelector';
import { ShapeSelector } from './ShapeSelector';
import { AssetSelectionHint } from './AssetSelectionHint';
import { GameActionButtons } from './GameActionButtons';
import { GameHelpButton } from '../common/GameHelp';

interface GameConfigPanelProps {
  selectedAsset: Asset | null;
  difficulty: DifficultyLevel;
  pieceShape: PieceShape;
  isGenerating: boolean;
  onDifficultyChange: (difficulty: DifficultyLevel) => void;
  onShapeChange: (shape: PieceShape) => void;
  onStartGame: () => void;
  onOpenEditor: () => void;
}

export const GameConfigPanel: React.FC<GameConfigPanelProps> = ({
  selectedAsset,
  difficulty,
  pieceShape,
  isGenerating,
  onDifficultyChange,
  onShapeChange,
  onStartGame,
  onOpenEditor,
}) => {
  const canStartGame = selectedAsset !== null && !isGenerating;

  return (
    <div className="w-full lg:w-[350px] lg:max-w-[600px] lg:mx-auto bg-white rounded-lg p-5 shadow-lg flex-shrink-0 overflow-y-auto h-full scrollbar-thin scrollbar-track-gray-100 scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400">
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between px-2">
          <h3 className="m-0 text-gray-800 text-xl font-bold">游戏设置</h3>
          <GameHelpButton />
        </div>
        
        {/* 主要内容区域 */}
        <div className="flex-1 px-2 py-4 space-y-2">
          {/* 选中素材预览 */}
          {selectedAsset && <SelectedAsset asset={selectedAsset} />}

          {/* 难度选择 */}
          <DifficultySelector 
            selectedDifficulty={difficulty}
            onDifficultyChange={onDifficultyChange}
          />

          {/* 拼图形状选择 */}
          <ShapeSelector 
            selectedShape={pieceShape}
            onShapeChange={onShapeChange}
          />
          
          {/* 未选择素材提示 */}
          {!selectedAsset && <AssetSelectionHint />}
        </div>

        {/* 操作按钮区域 - 固定在底部 */}
        <GameActionButtons
          onStartGame={onStartGame}
          onOpenEditor={onOpenEditor}
          canStartGame={canStartGame}
          isGenerating={isGenerating}
        />
      </div>
    </div>
  );
};
