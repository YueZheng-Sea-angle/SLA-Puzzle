import React, { useState, useEffect, useRef, useCallback } from 'react';
import { IrregularPuzzlePiece } from '../../utils/puzzleGenerator/irregular';
import './AnswerGrid.css';

interface IrregularAnswerGridProps {
    gridSize: { rows: number; cols: number };
    answerGrid: (IrregularPuzzlePiece | null)[];
    originalImage: string;
    selectedPieceId: string | null;
    showAnswers: boolean;
    onPlacePiece: (pieceId: string, slotIndex: number) => void;
    onRemovePiece: (pieceId: string) => void;
    onPieceSelect: (pieceId: string | null) => void;
    // 拖拽相关
    draggedPiece?: string | null;
    dragOverSlot?: number | null;
    onDragStart?: (pieceId: string) => void;
    onDragEnd?: () => void;
    onDragOver?: (slotIndex: number) => void;
    onDragLeave?: () => void;
    onDropToSlot?: (targetSlot: number) => void;
}

export const IrregularAnswerGrid: React.FC<IrregularAnswerGridProps> = ({
    gridSize,
    answerGrid,
    originalImage,
    selectedPieceId,
    showAnswers,
    onPlacePiece,
    onRemovePiece,
    onPieceSelect,
    draggedPiece,
    dragOverSlot,
    onDragStart,
    onDragEnd,
    onDragOver,
    onDragLeave,
    onDropToSlot,
}) => {
    const gridRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [cellSize, setCellSize] = useState(80);

    // 计算合适的单元格大小
    const calculateCellSize = useCallback(() => {
        if (!gridRef.current || !containerRef.current) return;

        const containerWidth = containerRef.current.clientWidth;
        const containerHeight = containerRef.current.clientHeight;

        // 获取网格信息区域的高度
        const gridInfoElement = containerRef.current.querySelector('.grid-info');
        const gridInfoHeight = gridInfoElement?.clientHeight || 60;

        // 减去内边距、网格信息和间隙
        const horizontalPadding = 40;
        const verticalPadding = 40;

        const availableWidth = containerWidth - horizontalPadding;
        const availableHeight = containerHeight - verticalPadding - gridInfoHeight;

        // 计算水平和垂直方向的最大单元格大小
        const maxCellWidth = Math.floor(availableWidth / gridSize.cols);
        const maxCellHeight = Math.floor(availableHeight / gridSize.rows);

        // 取较小值确保所有单元格都能显示
        const newSize = Math.min(maxCellWidth, maxCellHeight, 160);

        // 确保单元格大小合理
        const finalSize = Math.max(120, newSize);

        setCellSize(finalSize);
    }, [gridSize.cols, gridSize.rows]);

    // 处理槽位点击
    const handleSlotClick = (slotIndex: number) => {
        const existingPiece = answerGrid[slotIndex];

        if (existingPiece) {
            // 如果槽位有拼图块
            if (selectedPieceId === existingPiece.id) {
                // 如果点击的是当前选中的拼图块，取消选择并移除
                onPieceSelect(null);
                onRemovePiece(existingPiece.id);
            } else if (selectedPieceId && selectedPieceId !== existingPiece.id) {
                // 如果有其他选中的拼图块，执行替换
                onPlacePiece(selectedPieceId, slotIndex);
            } else {
                // 没有选中拼图块时，直接移除现有拼图块
                onRemovePiece(existingPiece.id);
            }
        } else if (selectedPieceId) {
            // 如果槽位为空且有选中的拼图块，放置拼图块
            onPlacePiece(selectedPieceId, slotIndex);
        }
    };

    const getSlotNumber = (index: number): number => {
        return index + 1;
    };

    // 拖拽事件处理函数
    const handlePieceDragStart = (e: React.DragEvent, pieceId: string) => {
        e.dataTransfer.setData('text/plain', pieceId);
        e.dataTransfer.effectAllowed = 'move';
        if (onDragStart) {
            onDragStart(pieceId);
        }
    };

    const handlePieceDragEnd = () => {
        if (onDragEnd) {
            onDragEnd();
        }
    };

    const handleSlotDragOver = (e: React.DragEvent, slotIndex: number) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (onDragOver) {
            onDragOver(slotIndex);
        }
    };

    const handleSlotDragLeave = () => {
        if (onDragLeave) {
            onDragLeave();
        }
    };

    const handleSlotDrop = (e: React.DragEvent, slotIndex: number) => {
        e.preventDefault();
        if (onDropToSlot) {
            onDropToSlot(slotIndex);
        }
    };

    // 计算完成度和正确率
    const completedCount = answerGrid.filter(slot => slot !== null).length;
    const correctCount = answerGrid.filter((piece, index) => {
        if (!piece) return false;
        // 对于异形拼图，检查是否在正确位置（根据gridRow和gridCol）
        const expectedIndex = piece.gridRow * gridSize.cols + piece.gridCol;
        return expectedIndex === index;
    }).length;

    // 监听窗口大小变化
    useEffect(() => {
        calculateCellSize();

        const handleResize = () => {
            calculateCellSize();
        };

        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, [calculateCellSize]);

    // 当网格尺寸变化时重新计算
    useEffect(() => {
        calculateCellSize();
    }, [gridSize, calculateCellSize]);

    // 创建网格样式对象
    const gridStyle: React.CSSProperties = {
        gridTemplateColumns: `repeat(${gridSize.cols}, ${cellSize}px)`,
        gridTemplateRows: `repeat(${gridSize.rows}, ${cellSize}px)`,
    };

    return (
        <div className="answer-grid-container" ref={containerRef}>
            {/* 网格槽位 */}
            <div
                ref={gridRef}
                className="answer-grid"
                style={gridStyle}
            >
                {/* 显示答案时的原图虚影 - 严格控制在网格区域内 */}
                {showAnswers && (
                    <div
                        className="grid-shadow-overlay"
                        style={{
                            position: 'absolute',
                            top: 2, // 网格的padding
                            left: 2, // 网格的padding
                            width: `${gridSize.cols * cellSize}px`,
                            height: `${gridSize.rows * cellSize}px`,
                            zIndex: 1,
                            pointerEvents: 'none',
                            opacity: 0.3,
                            overflow: 'hidden',
                            borderRadius: '6px',
                        }}
                    >
                        <img
                            src={originalImage}
                            alt="原图虚影"
                            className="grid-shadow-image"
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                display: 'block',
                            }}
                        />
                    </div>
                )}

                {answerGrid.map((piece, index) => (
                    <div
                        key={`slot-${index}-${piece?.id || 'empty'}`}
                        className={`grid-slot ${piece ? 'occupied' : 'empty'} ${selectedPieceId && !piece ? 'highlight' : ''
                            } ${piece && selectedPieceId === piece.id ? 'selected' : ''
                            } ${dragOverSlot === index ? 'drag-over' : ''
                            } ${draggedPiece === piece?.id ? 'dragging' : ''
                            }`}
                        onClick={() => handleSlotClick(index)}
                        onDragOver={(e) => handleSlotDragOver(e, index)}
                        onDragLeave={handleSlotDragLeave}
                        onDrop={(e) => handleSlotDrop(e, index)}
                        style={{
                            width: `${cellSize}px`,
                            height: `${cellSize}px`,
                        }}
                    >
                        {/* 槽位编号 - 只在显示答案时显示 */}
                        {showAnswers && (
                            <div className="slot-number">{getSlotNumber(index)}</div>
                        )}

                        {/* 拼图块 */}
                        {piece !== null && piece !== undefined && (
                            <div
                                className="placed-piece"
                                draggable={true}
                                onDragStart={(e) => handlePieceDragStart(e, piece.id)}
                                onDragEnd={handlePieceDragEnd}
                            >
                                <img
                                    src={piece.imageData}
                                    alt={`拼图块 ${piece.id}`}
                                    className="piece-image"
                                    style={{
                                        clipPath: piece.clipPath, // 使用异形clipPath
                                    }}
                                    draggable={false}
                                />
                                {showAnswers && (
                                    <div className="piece-info">
                                        {piece.id}
                                    </div>
                                )}

                                {/* 正确性指示器 */}
                                {showAnswers && (
                                    <div className={`correctness-indicator ${(piece.gridRow * gridSize.cols + piece.gridCol) === index ? 'correct' : 'incorrect'
                                        }`}>
                                        {(piece.gridRow * gridSize.cols + piece.gridCol) === index ? '✓' : '✗'}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* 空槽位提示 */}
                        {!piece && selectedPieceId && (
                            <div className="drop-hint">
                                点击放置
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* 网格信息 */}
            <div className="grid-info">
                <div className="completion-status">
                    已完成: {completedCount} / {answerGrid.length}
                </div>
                <div className="correctness-status">
                    正确: {correctCount} / {answerGrid.length}
                </div>
            </div>
        </div>
    );
};
