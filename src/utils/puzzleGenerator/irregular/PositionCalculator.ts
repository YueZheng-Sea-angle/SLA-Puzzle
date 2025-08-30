import { 
  Position, 
  Size, 
  GridSize, 
  ExpansionInfo, 
  GridLayout, 
  IrregularPuzzlePiece,
  SnapTarget,
  calculateCenterIndex
} from './types';

/**
 * 位置计算器 - 处理异形拼图的位置和扩展计算
 */
export class PositionCalculator {
  
  /**
   * 计算拼图块的扩展信息
   * @param row 行号
   * @param col 列号
   * @param gridSize 网格尺寸
   * @param expansionRatio 扩展比例（默认0.4）
   * @returns 四个方向的扩展比例
   */
  static calculateExpansions(
    row: number, 
    col: number, 
    gridSize: GridSize,
    expansionRatio: number = 0.4
  ): ExpansionInfo {
    // 检查每个方向是否可以扩展（即是否有相邻块）
    const canExpandTop = row > 0;
    const canExpandRight = col < gridSize.cols - 1;
    const canExpandBottom = row < gridSize.rows - 1;
    const canExpandLeft = col > 0;
    
    return {
      top: canExpandTop ? expansionRatio : 0,
      right: canExpandRight ? expansionRatio : 0,
      bottom: canExpandBottom ? expansionRatio : 0,
      left: canExpandLeft ? expansionRatio : 0,
    };
  }
  
  /**
   * 计算扩展后的尺寸
   * @param baseSize 基础尺寸
   * @param expansions 扩展信息
   * @returns 扩展后的尺寸
   */
  static calculateExpandedSize(baseSize: Size, expansions: ExpansionInfo): Size {
    return {
      width: baseSize.width * (1 + expansions.left + expansions.right),
      height: baseSize.height * (1 + expansions.top + expansions.bottom)
    };
  }
  
  /**
   * 计算扩展后的位置（相对于基础位置的偏移）
   * @param basePosition 基础位置
   * @param baseSize 基础尺寸
   * @param expansions 扩展信息
   * @returns 扩展后的位置
   */
  static calculateExpandedPosition(
    basePosition: Position, 
    baseSize: Size, 
    expansions: ExpansionInfo
  ): Position {
    return {
      x: basePosition.x - (baseSize.width * expansions.left),
      y: basePosition.y - (baseSize.height * expansions.top)
    };
  }
  
  /**
   * 计算拼图块在Canvas中的绘制偏移
   * @param expansions 扩展信息
   * @param baseSize 基础尺寸
   * @returns Canvas绘制偏移
   */
  static calculateCanvasOffset(expansions: ExpansionInfo, baseSize: Size): Position {
    return {
      x: baseSize.width * expansions.left,
      y: baseSize.height * expansions.top
    };
  }
  
  /**
   * 计算网格的中心块索引
   * @param gridSize 网格尺寸
   * @returns 中心块索引
   */
  static calculateCenterIndex(gridSize: GridSize): number {
    return calculateCenterIndex(gridSize);
  }
  
  /**
   * 根据索引计算网格坐标
   * @param index 拼图块索引
   * @param gridSize 网格尺寸
   * @returns {row, col} 网格坐标
   */
  static indexToGridCoord(index: number, gridSize: GridSize): { row: number; col: number } {
    return {
      row: Math.floor(index / gridSize.cols),
      col: index % gridSize.cols
    };
  }
  
  /**
   * 根据网格坐标计算索引
   * @param row 行号
   * @param col 列号
   * @param gridSize 网格尺寸
   * @returns 索引
   */
  static gridCoordToIndex(row: number, col: number, gridSize: GridSize): number {
    return row * gridSize.cols + col;
  }
  
  /**
   * 计算拼图块的基础位置（在固定块的相对位置）
   * @param index 拼图块索引
   * @param gridLayout 网格布局
   * @returns 基础位置
   */
  static calculateBasePosition(index: number, gridLayout: GridLayout): Position {
    const { row, col } = this.indexToGridCoord(index, gridLayout.gridSize);
    const { row: fixedRow, col: fixedCol } = this.indexToGridCoord(
      gridLayout.fixedPieceIndex, 
      gridLayout.gridSize
    );
    
    return {
      x: gridLayout.fixedPosition.x + (col - fixedCol) * gridLayout.baseSize.width,
      y: gridLayout.fixedPosition.y + (row - fixedRow) * gridLayout.baseSize.height
    };
  }
  
  /**
   * 计算拼图块的吸附目标位置
   * @param piece 拼图块
   * @param gridLayout 网格布局
   * @returns 吸附目标数组
   */
  static calculateSnapTargets(
    piece: IrregularPuzzlePiece,
    gridLayout: GridLayout
  ): SnapTarget[] {
    const correctPosition = this.calculateBasePosition(piece.correctSlot, gridLayout);
    
    return [{
      position: correctPosition,
      tolerance: 25 // 25像素的吸附容差
    }];
  }
  
  /**
   * 检查两个位置是否在容差范围内
   * @param pos1 位置1
   * @param pos2 位置2
   * @param tolerance 容差
   * @returns 是否在范围内
   */
  static isWithinTolerance(pos1: Position, pos2: Position, tolerance: number): boolean {
    const dx = Math.abs(pos1.x - pos2.x);
    const dy = Math.abs(pos1.y - pos2.y);
    return dx <= tolerance && dy <= tolerance;
  }
  
  /**
   * 计算两点之间的距离
   * @param pos1 位置1
   * @param pos2 位置2
   * @returns 距离
   */
  static calculateDistance(pos1: Position, pos2: Position): number {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
  
  /**
   * 生成网格布局信息
   * @param gridSize 网格尺寸
   * @param targetSize 目标总尺寸
   * @param fixedPosition 固定块的绝对位置
   * @param expansionRatio 扩展比例
   * @returns 网格布局
   */
  static createGridLayout(
    gridSize: GridSize,
    targetSize: number = 400,
    fixedPosition: Position = { x: 200, y: 200 }, // 默认居中
    expansionRatio: number = 0.4
  ): GridLayout {
    const baseSize: Size = {
      width: targetSize / gridSize.cols,
      height: targetSize / gridSize.rows
    };
    
    const fixedPieceIndex = this.calculateCenterIndex(gridSize);
    
    return {
      gridSize,
      baseSize,
      expansionRatio,
      fixedPieceIndex,
      fixedPosition
    };
  }
}
