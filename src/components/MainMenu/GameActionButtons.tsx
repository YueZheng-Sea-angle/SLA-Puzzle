import React from 'react';
import { Button } from '../common/Button';

interface GameActionButtonsProps {
  onStartGame: () => void;
  onOpenEditor: () => void;
  canStartGame: boolean;
  isGenerating: boolean;
}

export const GameActionButtons: React.FC<GameActionButtonsProps> = ({
  onStartGame,
  onOpenEditor,
  canStartGame,
  isGenerating,
}) => {
  return (
    <div className="px-2 pb-4 flex flex-col gap-3">
      <Button
        onClick={onStartGame}
        variant="primary"
        size="large"
        disabled={!canStartGame}
        className="w-full py-4 text-base font-semibold"
      >
        {isGenerating ? '生成中...' : '开始游戏'}
      </Button>
      
      <Button
        onClick={onOpenEditor}
        variant="secondary"
        size="large"
        className="w-full py-4 text-base font-semibold"
      >
        🎨 拼图编辑器
      </Button>
    </div>
  );
};
