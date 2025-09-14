import { PuzzleConfig, PuzzlePiece, PieceShape } from '../../../types';

// 位置接口
export interface Position {
  x: number;
  y: number;
}

// 异形拼图配置
export interface IrregularPuzzleConfig extends Omit<PuzzleConfig, 'pieces'> {
  pieces: IrregularPuzzlePiece[];
  fixedPiece: number; // 固定块的索引（中心块）
  gridLayout: GridLayout; // 网格布局信息
}

// 异形拼图块
export interface IrregularPuzzlePiece extends Omit<PuzzlePiece, 'shape' | 'currentSlot' | 'correctSlot' | 'isFlipped'> {
  /** 是否左右翻转 */
  flipX?: boolean;
  // 当前显示位置
  x: number;
  y: number;
  
  // 是否在正确位置
  isCorrect: boolean;
  
  // 正确的旋转角度
  correctRotation: number;
  
  // 基础位置和尺寸（不考虑扩展）
  basePosition: Position;
  baseSize: Size;
  
  // 扩展后的实际尺寸和位置
  expandedPosition: Position;
  expandedSize: Size;
  
  // 边缘图案
  edges: EdgePatterns;
  
  // CSS clip-path 用于显示异形形状
  clipPath: string;
  
  // 拖拽相关
  isDraggable: boolean;
  snapTargets: SnapTarget[];
  
  // 网格坐标
  gridRow: number;
  gridCol: number;

  // 新增：四个方向的异形标识（1=凸出，-1=凹陷，0=平）
  up: number;
  right: number;
  down: number;
  left: number;

  // 操作历史状态：用于限制旋转和翻转操作
  lastOperation?: 'rotate' | 'flip' | null;
  
  // 操作计数：用于实现旋转360度后可翻转，翻转两次后可旋转
  rotateCount?: number; // 旋转次数
  flipCount?: number;    // 翻转次数
}

// 尺寸接口
export interface Size {
  width: number;
  height: number;
}

// 边缘图案集合
export interface EdgePatterns {
  top: EdgePattern;
  right: EdgePattern;
  bottom: EdgePattern;
  left: EdgePattern;
}

// 单个边缘图案
export interface EdgePattern {
  type: EdgeType;
  intensity: number;     // 0.3-0.7，突出/凹陷程度
  seedValue: number;     // 用于生成一致的随机形状
  points?: Position[];   // 可选：预生成的形状点位
}

// 边缘类型
export type EdgeType = 'flat' | 'knob' | 'hole';

// 网格布局信息
export interface GridLayout {
  gridSize: GridSize;
  baseSize: Size;        // 基础块尺寸
  expansionRatio: number; // 扩展比例（如0.4表示40%）
  fixedPieceIndex: number; // 固定块索引
  fixedPosition: Position; // 固定块的绝对位置
}

// 网格尺寸
export interface GridSize {
  rows: number;
  cols: number;
}

// 扩展信息
export interface ExpansionInfo {
  top: number;    // 上方扩展比例
  right: number;  // 右方扩展比例
  bottom: number; // 下方扩展比例
  left: number;   // 左方扩展比例
}

// 吸附目标
export interface SnapTarget {
  position: Position;
  tolerance: number; // 吸附容差（像素）
}

// 边缘图案映射
export type EdgePatternMap = Map<string, EdgePattern>;

// 生成异形拼图块的参数
export interface GenerateIrregularPieceParams {
  imageData: string;
  index: number;
  gridRow: number;
  gridCol: number;
  gridSize: GridSize;
  baseSize: Size;
  edgePatternMap: EdgePatternMap;
  expansionRatio: number;
  targetSize: number;
}

// 异形拼图生成参数
export interface GenerateIrregularPuzzleParams {
  imageData: string;
  gridSize: GridSize;
  pieceShape: PieceShape;
  name: string;
  expansionRatio?: number; // 默认0.4
}

// 网格配置
export interface GridConfig {
  rows: number;
  cols: number;
  getCenterIndex(): number; // 获取中心块索引
}

// 预定义的网格配置
export const GRID_CONFIGS: Record<string, GridConfig> = {
  '3x3': {
    rows: 3,
    cols: 3,
    getCenterIndex: () => 4 // 中心位置 (1,1)
  },
  '4x4': {
    rows: 4,
    cols: 4,
    getCenterIndex: () => 5 // 中心偏左上 (1,1)，也可以是6,9,10
  },
  '5x5': {
    rows: 5,
    cols: 5,
    getCenterIndex: () => 12 // 真正的中心 (2,2)
  },
  '6x6': {
    rows: 6,
    cols: 6,
    getCenterIndex: () => 14 // 中心偏左上 (2,2)，也可以是15,20,21
  }
};

// 计算网格中心块索引的工具函数
export function calculateCenterIndex(gridSize: GridSize): number {
  const centerRow = Math.floor(gridSize.rows / 2);
  const centerCol = Math.floor(gridSize.cols / 2);
  return centerRow * gridSize.cols + centerCol;
}

// 判断是否为边缘块
export function isEdgePiece(row: number, col: number, gridSize: GridSize): boolean {
  return row === 0 || row === gridSize.rows - 1 || 
         col === 0 || col === gridSize.cols - 1;
}

// 判断是否为角落块
export function isCornerPiece(row: number, col: number, gridSize: GridSize): boolean {
  return (row === 0 || row === gridSize.rows - 1) && 
         (col === 0 || col === gridSize.cols - 1);
}

// 获取相邻块的索引
export function getAdjacentIndices(index: number, gridSize: GridSize): {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
} {
  const row = Math.floor(index / gridSize.cols);
  const col = index % gridSize.cols;
  
  const adjacent: any = {};
  
  if (row > 0) adjacent.top = (row - 1) * gridSize.cols + col;
  if (col < gridSize.cols - 1) adjacent.right = row * gridSize.cols + (col + 1);
  if (row < gridSize.rows - 1) adjacent.bottom = (row + 1) * gridSize.cols + col;
  if (col > 0) adjacent.left = row * gridSize.cols + (col - 1);
  
  return adjacent;
}
