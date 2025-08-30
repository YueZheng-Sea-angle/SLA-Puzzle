import React from 'react';
import { DifficultyLevel } from '../../types';

interface DifficultyOption {
  value: DifficultyLevel;
  label: string;
  colorClass: string;
}

interface DifficultySelectorProps {
  selectedDifficulty: DifficultyLevel;
  onDifficultyChange: (difficulty: DifficultyLevel) => void;
}

const DIFFICULTY_OPTIONS: DifficultyOption[] = [
  { value: 'easy', label: '简单 (3×3)', colorClass: 'bg-emerald-500' },
  { value: 'medium', label: '中等 (4×4)', colorClass: 'bg-blue-500' },
  { value: 'hard', label: '困难 (5×5)', colorClass: 'bg-amber-500' },
  { value: 'expert', label: '专家 (6×6)', colorClass: 'bg-red-500' },
];

export const DifficultySelector: React.FC<DifficultySelectorProps> = ({
  selectedDifficulty,
  onDifficultyChange,
}) => {
  return (
    <div>
      <h4 className="text-base font-medium text-slate-700 mb-3">难度等级</h4>
      <div className="grid grid-cols-1 gap-2">
        {DIFFICULTY_OPTIONS.map(option => (
          <button
            key={option.value}
            className={`px-4 py-3 text-left text-sm font-medium rounded-lg border-2 transition-all duration-200 ${
              selectedDifficulty === option.value
                ? `${option.colorClass} text-white border-transparent shadow-sm`
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
            }`}
            onClick={() => onDifficultyChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
};
