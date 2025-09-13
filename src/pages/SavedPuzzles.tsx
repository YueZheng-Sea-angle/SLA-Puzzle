import React from 'react';
import './SavedPuzzles.css';

interface SavedPuzzle {
  id: string;
  name: string;
  data: any;
  date: string;
}

const getSavedPuzzles = (): SavedPuzzle[] => {
  const data = localStorage.getItem('savedPuzzles');
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
};

const cardShadow = '0 4px 16px 0 rgba(0,0,0,0.08), 0 1.5px 4px 0 rgba(0,0,0,0.06)';


import { useState } from 'react';

interface SavedPuzzlesPageProps {
  onBackToMenu?: () => void;
  onOpenEditor?: (step: 'upload' | 'crop' | 'settings' | 'preview') => void;
  highlightId?: string;
}

const SavedPuzzlesPage: React.FC<SavedPuzzlesPageProps> = ({ onBackToMenu, onOpenEditor, highlightId }) => {
  // 按id倒序（时间戳）排序
  const sortPuzzles = (arr: SavedPuzzle[]) => [...arr].sort((a, b) => Number(b.id) - Number(a.id));
  const [puzzles, setPuzzles] = useState(() => sortPuzzles(getSavedPuzzles()));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [highlighted, setHighlighted] = useState<string | null>(highlightId || null);
  const [showApplyButton, setShowApplyButton] = useState(false);
  const [selectedPuzzleRect, setSelectedPuzzleRect] = useState<DOMRect | null>(null);

  // 2秒后自动移除高亮
  React.useEffect(() => {
    if (highlightId) {
      setHighlighted(highlightId);
      const timer = setTimeout(() => setHighlighted(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [highlightId]);

  // 删除存档，增加弹窗确认
  const handleDelete = (id: string) => {
    const puzzle = puzzles.find(p => p.id === id);
    const name = puzzle?.name || '该存档';
    if (!window.confirm(`确定要删除"${name}"吗？此操作不可撤销。`)) return;
    const filtered = puzzles.filter(p => p.id !== id);
    const sorted = sortPuzzles(filtered);
    setPuzzles(sorted);
    localStorage.setItem('savedPuzzles', JSON.stringify(sorted));
  };

  // 返回上一页面
  const handleBack = () => {
    if (onBackToMenu) {
      onBackToMenu();
    } else {
      window.history.length > 1 ? window.history.back() : window.location.reload();
    }
  };

  // 处理存档选择
  const handlePuzzleSelect = (puzzleId: string, event: React.MouseEvent) => {
    const newSelectedId = selectedId === puzzleId ? null : puzzleId;
    setSelectedId(newSelectedId);
    
    if (newSelectedId) {
      // 获取选中存档容器的位置信息
      const element = event.currentTarget as HTMLElement;
      const rect = element.getBoundingClientRect();
      setSelectedPuzzleRect(rect);
      setShowApplyButton(true);
    } else {
      setShowApplyButton(false);
      setSelectedPuzzleRect(null);
    }
  };

  // 处理确认并应用
  const handleApply = () => {
    if (selectedId && onOpenEditor) {
      const selected = puzzles.find(p => p.id === selectedId);
      if (selected) onOpenEditor(selected);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #e0e7ff 0%, #f0fdfa 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
      paddingTop: 48,
    }}>
      <div style={{
        width: '100%',
  maxWidth: 420,
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>
        <h2 style={{
          fontSize: 28,
          fontWeight: 700,
          marginBottom: 32,
          color: '#2d3748',
          letterSpacing: 2,
        }}>🗂️ 本地拼图编辑器配置</h2>
        <button
          onClick={handleBack}
          style={{
            marginBottom: 32,
            background: 'linear-gradient(90deg,#34d399,#10b981)',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '10px 28px',
            fontWeight: 600,
            fontSize: 16,
            cursor: 'pointer',
            boxShadow: '0 2px 8px 0 rgba(0,0,0,0.08)',
            transition: 'background 0.2s',
          }}
        >
          ← 返回上一页
        </button>
        {puzzles.length === 0 ? (
          <div style={{
            background: 'rgba(255,255,255,0.9)',
            borderRadius: 16,
            boxShadow: cardShadow,
            padding: '48px 0',
            width: '100%',
            maxWidth: 420,
            textAlign: 'center',
            color: '#888',
            fontSize: 18,
          }}>
            暂无存档
          </div>
        ) : (
          <div style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: 24,
          }}>
            {puzzles.map((puzzle) => (
              <div
                key={puzzle.id}
                onClick={(e) => handlePuzzleSelect(puzzle.id, e)}
                style={{
                  background: selectedId === puzzle.id ? '#e0f7e9' : '#fff',
                  borderRadius: 16,
                  boxShadow: cardShadow,
                  padding: '20px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  minHeight: 80,
                  position: 'relative',
                  maxWidth: 400,
                  margin: '0 auto',
                  border: selectedId === puzzle.id ? '2px solid #22c55e' : '2px solid transparent',
                  cursor: 'pointer',
                  transition: 'background 0.2s, border 0.2s',
                  // 闪烁动画
                  animation: highlighted === puzzle.id ? 'flash-border 0.4s linear 0s 5 alternate' : undefined,
                  zIndex: highlighted === puzzle.id ? 2 : 1,
                }}
              >
                {puzzle.data?.croppedImageData ? (
                  <img
                    src={puzzle.data.croppedImageData}
                    alt={puzzle.name}
                    style={{
                      width: 64,
                      height: 64,
                      objectFit: 'cover',
                      borderRadius: 12,
                      boxShadow: '0 2px 8px 0 rgba(0,0,0,0.08)',
                      background: '#f3f3f3',
                    }}
                  />
                ) : (
                  <div style={{
                    width: 64,
                    height: 64,
                    borderRadius: 12,
                    background: '#e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#a0aec0',
                    fontSize: 32,
                  }}>🧩</div>
                )}
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontWeight: 600,
                    fontSize: 20,
                    color: '#374151',
                    marginBottom: 4,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>{puzzle.name}</div>
                  <div style={{
                    fontSize: 14,
                    color: '#718096',
                  }}>{puzzle.date}</div>
                  {/* 拼图信息 */}
                  <div style={{
                    fontSize: 13,
                    color: '#374151',
                    marginTop: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    fontWeight: 500,
                    letterSpacing: 0.5,
                    lineHeight: 1.1,
                  }}>
                    <span>难度：{puzzle.data?.difficulty || '未知'}</span>
                    <span>形状：{puzzle.data?.pieceShape || '未知'}</span>
                    <span>
                      拼图块数：{
                        (() => {
                          // 通过难度和形状推断块数，或直接显示配置
                          const d = puzzle.data?.difficulty;
                          if (puzzle.data?.gridSize) {
                            // gridSize: {rows, cols}
                            return `${puzzle.data.gridSize.rows * puzzle.data.gridSize.cols} (${puzzle.data.gridSize.rows}x${puzzle.data.gridSize.cols})`;
                          }
                          if (d === 'easy') return '9 (3x3)';
                          if (d === 'medium') return '16 (4x4)';
                          if (d === 'hard') return '25 (5x5)';
                          if (d === 'expert') return '36 (6x6)';
                          return '未知';
                        })()
                      }
                    </span>
                  </div>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); handleDelete(puzzle.id); }}
                  style={{
                    background: 'linear-gradient(90deg,#f87171,#fbbf24)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '8px 16px',
                    fontWeight: 600,
                    fontSize: 14,
                    cursor: 'pointer',
                    marginLeft: 8,
                    boxShadow: '0 1px 4px 0 rgba(0,0,0,0.08)',
                    transition: 'background 0.2s',
                  }}
                  title="删除此存档"
                >
                  删除存档
                </button>
                {/* 打开拼图编辑器按钮已移除 */}
              </div>
            ))}
          </div>
        )}
        {/* 确认按钮区域 - 只在选中存档时显示，且onOpenEditor存在（即从上传页面进入） */}
        {onOpenEditor && showApplyButton && selectedPuzzleRect && (
          <div
            style={{
              position: 'fixed',
              top: selectedPuzzleRect.top + window.scrollY + (selectedPuzzleRect.height / 2) - 20,
              left: selectedPuzzleRect.right + 20,
              zIndex: 1000,
              animation: 'fadeInScale 0.3s ease-out forwards',
              opacity: 0,
              transform: 'scale(0.9)',
            }}
          >
            <button
              onClick={handleApply}
              style={{
                background: 'linear-gradient(90deg,#22c55e,#16a34a)',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '10px 28px',
                fontWeight: 600,
                fontSize: 16,
                cursor: 'pointer',
                boxShadow: '0 4px 12px 0 rgba(34,197,94,0.3)',
                transition: 'all 0.2s ease',
              }}
            >
              确认并应用
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedPuzzlesPage;
