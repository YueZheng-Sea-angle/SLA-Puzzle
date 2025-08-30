import { 
  EdgePattern, 
  EdgeType, 
  EdgePatternMap, 
  GridSize, 
  Position 
} from './types';

/**
 * 伪随机数生成器（基于种子）
 * 确保相同种子产生相同的随机序列
 */
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  nextFloat(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.nextFloat(min, max + 1));
  }
}

/**
 * 边缘图案生成器
 * 负责生成互补的拼图边缘图案
 */
export class EdgePatternGenerator {
  
  /**
   * 生成互补的边缘图案对
   * @param seedValue 种子值
   * @param intensity 强度（0.3-0.7）
   * @returns 主图案和互补图案
   */
  static generateComplementaryPair(
    seedValue: number,
    intensity: number = 0.5
  ): { primary: EdgePattern; complement: EdgePattern } {
    const random = new SeededRandom(seedValue);
    
    // 70% 概率生成凹凸配对，30% 概率生成平滑边
    if (random.next() < 0.7) {
      // 随机决定哪个是凸起，哪个是凹陷
      const isPrimaryKnob = random.next() < 0.5;
      
      return {
        primary: { 
          type: isPrimaryKnob ? 'knob' : 'hole', 
          intensity: this.normalizeIntensity(intensity), 
          seedValue 
        },
        complement: { 
          type: isPrimaryKnob ? 'hole' : 'knob', 
          intensity: this.normalizeIntensity(intensity), 
          seedValue 
        }
      };
    } else {
      // 平滑边缘
      return {
        primary: { type: 'flat', intensity: 0, seedValue },
        complement: { type: 'flat', intensity: 0, seedValue }
      };
    }
  }

  /**
   * 为整个拼图生成一致的边缘图案
   * @param gridSize 网格尺寸
   * @param baseIntensity 基础强度
   * @returns 边缘图案映射
   */
  static generatePuzzleEdges(
    gridSize: GridSize, 
    baseIntensity: number = 0.5
  ): EdgePatternMap {
    const edgeMap = new Map<string, EdgePattern>();
    
    // 为所有内部边缘生成图案
    for (let row = 0; row < gridSize.rows; row++) {
      for (let col = 0; col < gridSize.cols; col++) {
        const index = row * gridSize.cols + col;
        
        // 处理右边缘（如果不是最右列）
        if (col < gridSize.cols - 1) {
          const rightEdgeKey = `${index}-right`;
          const leftEdgeKey = `${index + 1}-left`;
          
          // 检查是否已经处理过这条边
          if (!edgeMap.has(rightEdgeKey)) {
            const seed = this.generateEdgeSeed(row, col, 'horizontal');
            const intensity = this.calculateDynamicIntensity(baseIntensity, row, col, gridSize);
            
            const { primary, complement } = this.generateComplementaryPair(seed, intensity);
            edgeMap.set(rightEdgeKey, primary);
            edgeMap.set(leftEdgeKey, complement);
          }
        }
        
        // 处理下边缘（如果不是最下行）
        if (row < gridSize.rows - 1) {
          const bottomEdgeKey = `${index}-bottom`;
          const topEdgeKey = `${index + gridSize.cols}-top`;
          
          // 检查是否已经处理过这条边
          if (!edgeMap.has(bottomEdgeKey)) {
            const seed = this.generateEdgeSeed(row, col, 'vertical');
            const intensity = this.calculateDynamicIntensity(baseIntensity, row, col, gridSize);
            
            const { primary, complement } = this.generateComplementaryPair(seed, intensity);
            edgeMap.set(bottomEdgeKey, primary);
            edgeMap.set(topEdgeKey, complement);
          }
        }
        
        // 处理外边缘（设为平滑）
        if (row === 0) edgeMap.set(`${index}-top`, { type: 'flat', intensity: 0, seedValue: 0 });
        if (col === 0) edgeMap.set(`${index}-left`, { type: 'flat', intensity: 0, seedValue: 0 });
        if (row === gridSize.rows - 1) edgeMap.set(`${index}-bottom`, { type: 'flat', intensity: 0, seedValue: 0 });
        if (col === gridSize.cols - 1) edgeMap.set(`${index}-right`, { type: 'flat', intensity: 0, seedValue: 0 });
      }
    }
    
    return edgeMap;
  }

  /**
   * 提取指定拼图块的边缘图案
   * @param index 拼图块索引
   * @param edgePatternMap 边缘图案映射
   * @returns 该拼图块的四个边缘图案
   */
  static extractPieceEdges(index: number, edgePatternMap: EdgePatternMap): {
    top: EdgePattern;
    right: EdgePattern;
    bottom: EdgePattern;
    left: EdgePattern;
  } {
    return {
      top: edgePatternMap.get(`${index}-top`) || { type: 'flat', intensity: 0, seedValue: 0 },
      right: edgePatternMap.get(`${index}-right`) || { type: 'flat', intensity: 0, seedValue: 0 },
      bottom: edgePatternMap.get(`${index}-bottom`) || { type: 'flat', intensity: 0, seedValue: 0 },
      left: edgePatternMap.get(`${index}-left`) || { type: 'flat', intensity: 0, seedValue: 0 }
    };
  }

  /**
   * 生成边缘的种子值
   * @param row 行号
   * @param col 列号
   * @param direction 方向
   * @returns 种子值
   */
  private static generateEdgeSeed(row: number, col: number, direction: 'horizontal' | 'vertical'): number {
    // 使用位置和方向生成唯一种子
    const base = (row * 1000 + col * 100);
    return direction === 'horizontal' ? base + 1 : base + 2;
  }

  /**
   * 计算动态强度（基于位置调整强度）
   * @param baseIntensity 基础强度
   * @param row 行号
   * @param col 列号
   * @param gridSize 网格尺寸
   * @returns 调整后的强度
   */
  private static calculateDynamicIntensity(
    baseIntensity: number, 
    row: number, 
    col: number, 
    gridSize: GridSize
  ): number {
    // 中心区域的图案可以更明显一些
    const centerRow = Math.floor(gridSize.rows / 2);
    const centerCol = Math.floor(gridSize.cols / 2);
    
    const distanceFromCenter = Math.abs(row - centerRow) + Math.abs(col - centerCol);
    const maxDistance = Math.floor(gridSize.rows / 2) + Math.floor(gridSize.cols / 2);
    
    // 距离中心越近，强度越高
    const distanceRatio = 1 - (distanceFromCenter / maxDistance);
    const adjustedIntensity = baseIntensity + (distanceRatio * 0.2);
    
    return this.normalizeIntensity(adjustedIntensity);
  }

  /**
   * 标准化强度值到合理范围
   * @param intensity 原始强度
   * @returns 标准化后的强度（0.3-0.7）
   */
  private static normalizeIntensity(intensity: number): number {
    return Math.max(0.3, Math.min(0.7, intensity));
  }

  /**
   * 生成边缘形状的控制点
   * @param edgeType 边缘类型
   * @param intensity 强度
   * @param seedValue 种子值
   * @param edgeLength 边缘长度
   * @returns 形状控制点
   */
  static generateShapePoints(
    edgeType: EdgeType,
    intensity: number,
    seedValue: number,
    edgeLength: number = 100
  ): Position[] {
    const random = new SeededRandom(seedValue);
    
    if (edgeType === 'flat') {
      // 平滑边缘：只有起点和终点
      return [
        { x: 0, y: 0 },
        { x: edgeLength, y: 0 }
      ];
    }
    
    // 凹凸边缘的控制点
    const knobWidth = edgeLength * 0.4; // 凹凸部分占边缘的40%
    const knobHeight = edgeLength * intensity; // 根据强度确定凹凸高度
    
    const startKnob = (edgeLength - knobWidth) / 2;
    const endKnob = startKnob + knobWidth;
    const midKnob = (startKnob + endKnob) / 2;
    
    // 添加一些随机变化，但保持形状合理
    const heightVariation = random.nextFloat(0.8, 1.2);
    const widthVariation = random.nextFloat(0.9, 1.1);
    
    const actualHeight = knobHeight * heightVariation * (edgeType === 'hole' ? -1 : 1);
    const actualStartKnob = startKnob * widthVariation;
    const actualEndKnob = endKnob * widthVariation;
    
    return [
      { x: 0, y: 0 },                                    // 起点
      { x: actualStartKnob, y: 0 },                      // 凹凸开始
      { x: actualStartKnob + knobWidth * 0.2, y: actualHeight * 0.7 }, // 凹凸侧面1
      { x: midKnob, y: actualHeight },                   // 凹凸顶点
      { x: actualEndKnob - knobWidth * 0.2, y: actualHeight * 0.7 },   // 凹凸侧面2
      { x: actualEndKnob, y: 0 },                        // 凹凸结束
      { x: edgeLength, y: 0 }                            // 终点
    ];
  }

  /**
   * 验证边缘图案的兼容性
   * @param pattern1 图案1
   * @param pattern2 图案2
   * @returns 是否兼容
   */
  static areEdgesCompatible(pattern1: EdgePattern, pattern2: EdgePattern): boolean {
    // 检查是否为互补的凹凸配对或都是平滑边
    if (pattern1.type === 'flat' && pattern2.type === 'flat') {
      return true;
    }
    
    if (pattern1.seedValue === pattern2.seedValue && 
        pattern1.type !== pattern2.type && 
        pattern1.type !== 'flat' && 
        pattern2.type !== 'flat') {
      return true;
    }
    
    return false;
  }
}
