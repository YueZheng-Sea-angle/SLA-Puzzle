import { EdgePatterns, EdgePattern, Size, Position } from './types';
import { EdgePatternGenerator } from './EdgePatternGenerator';

/**
 * CSS Clip-Path 生成器
 * 根据边缘图案生成用于显示异形拼图的CSS clip-path
 */
export class ClipPathGenerator {
  
  /**
   * 生成拼图块的clip-path
   * @param edges 四个边缘的图案
   * @param expandedSize 扩展后的尺寸
   * @param baseSize 基础尺寸
   * @returns CSS clip-path字符串
   */
  static generateClipPath(
    edges: EdgePatterns,
    expandedSize: Size,
    baseSize: Size
  ): string {
    const points: string[] = [];
    
    // 计算基础区域在扩展canvas中的位置
    const baseLeft = (expandedSize.width - baseSize.width) / 2;
    const baseTop = (expandedSize.height - baseSize.height) / 2;
    const baseRight = baseLeft + baseSize.width;
    const baseBottom = baseTop + baseSize.height;
    
    // 转换为百分比坐标
    const toPercent = (x: number, y: number): string => {
      const xPercent = ((x / expandedSize.width) * 100).toFixed(2);
      const yPercent = ((y / expandedSize.height) * 100).toFixed(2);
      return `${xPercent}% ${yPercent}%`;
    };
    
    // 生成顶边路径点
    const topPoints = this.generateEdgePoints(
      edges.top,
      { x: baseLeft, y: baseTop },
      { x: baseRight, y: baseTop },
      'horizontal',
      expandedSize,
      baseSize
    );
    topPoints.forEach(point => points.push(toPercent(point.x, point.y)));
    
    // 生成右边路径点
    const rightPoints = this.generateEdgePoints(
      edges.right,
      { x: baseRight, y: baseTop },
      { x: baseRight, y: baseBottom },
      'vertical',
      expandedSize,
      baseSize
    );
    // 跳过第一个点（与顶边的最后一个点重复）
    rightPoints.slice(1).forEach(point => points.push(toPercent(point.x, point.y)));
    
    // 生成底边路径点（从右到左）
    const bottomPoints = this.generateEdgePoints(
      edges.bottom,
      { x: baseRight, y: baseBottom },
      { x: baseLeft, y: baseBottom },
      'horizontal',
      expandedSize,
      baseSize
    );
    bottomPoints.slice(1).forEach(point => points.push(toPercent(point.x, point.y)));
    
    // 生成左边路径点（从下到上）
    const leftPoints = this.generateEdgePoints(
      edges.left,
      { x: baseLeft, y: baseBottom },
      { x: baseLeft, y: baseTop },
      'vertical',
      expandedSize,
      baseSize
    );
    // 跳过第一个和最后一个点（与底边和顶边重复）
    leftPoints.slice(1, -1).forEach(point => points.push(toPercent(point.x, point.y)));
    
    return `polygon(${points.join(', ')})`;
  }
  
  /**
   * 生成单个边缘的路径点
   * @param edge 边缘图案
   * @param startPoint 起始点
   * @param endPoint 结束点
   * @param direction 方向
   * @param expandedSize 扩展尺寸
   * @param baseSize 基础尺寸
   * @returns 路径点数组
   */
  private static generateEdgePoints(
    edge: EdgePattern,
    startPoint: Position,
    endPoint: Position,
    direction: 'horizontal' | 'vertical',
    _expandedSize: Size,
    _baseSize: Size
  ): Position[] {
    if (edge.type === 'flat') {
      return [startPoint, endPoint];
    }
    
    const edgeLength = direction === 'horizontal' 
      ? Math.abs(endPoint.x - startPoint.x)
      : Math.abs(endPoint.y - startPoint.y);
    
    // 生成标准化的形状点（0到edgeLength范围）
    const shapePoints = EdgePatternGenerator.generateShapePoints(
      edge.type,
      edge.intensity,
      edge.seedValue,
      edgeLength
    );
    
    // 将形状点转换为实际坐标
    const actualPoints: Position[] = [];
    
    shapePoints.forEach(shapePoint => {
      let actualPoint: Position;
      
      if (direction === 'horizontal') {
        // 水平边缘
        const progress = shapePoint.x / edgeLength;
        actualPoint = {
          x: startPoint.x + (endPoint.x - startPoint.x) * progress,
          y: startPoint.y + shapePoint.y
        };
      } else {
        // 垂直边缘
        const progress = shapePoint.x / edgeLength;
        actualPoint = {
          x: startPoint.x + shapePoint.y,
          y: startPoint.y + (endPoint.y - startPoint.y) * progress
        };
      }
      
      actualPoints.push(actualPoint);
    });
    
    return actualPoints;
  }
  
  /**
   * 生成简化的矩形clip-path（用于调试）
   * @param expandedSize 扩展尺寸
   * @param baseSize 基础尺寸
   * @returns 矩形clip-path
   */
  static generateRectangleClipPath(expandedSize: Size, baseSize: Size): string {
    const left = ((expandedSize.width - baseSize.width) / 2 / expandedSize.width) * 100;
    const top = ((expandedSize.height - baseSize.height) / 2 / expandedSize.height) * 100;
    const right = left + (baseSize.width / expandedSize.width) * 100;
    const bottom = top + (baseSize.height / expandedSize.height) * 100;
    
    return `polygon(${left}% ${top}%, ${right}% ${top}%, ${right}% ${bottom}%, ${left}% ${bottom}%)`;
  }
  
  /**
   * 生成用于测试的简单凹凸形状
   * @param type 边缘类型
   * @param expandedSize 扩展尺寸
   * @param baseSize 基础尺寸
   * @returns 测试用的clip-path
   */
  static generateTestClipPath(
    type: 'knob-right' | 'hole-right' | 'knob-bottom' | 'hole-bottom',
    expandedSize: Size,
    baseSize: Size
  ): string {
    const baseLeft = (expandedSize.width - baseSize.width) / 2;
    const baseTop = (expandedSize.height - baseSize.height) / 2;
    const baseRight = baseLeft + baseSize.width;
    const baseBottom = baseTop + baseSize.height;
    
    const toPercent = (x: number, y: number): string => {
      const xPercent = ((x / expandedSize.width) * 100).toFixed(2);
      const yPercent = ((y / expandedSize.height) * 100).toFixed(2);
      return `${xPercent}% ${yPercent}%`;
    };
    
    let points: Position[] = [];
    
    switch (type) {
      case 'knob-right':
        points = [
          { x: baseLeft, y: baseTop },
          { x: baseRight, y: baseTop },
          { x: baseRight, y: baseTop + baseSize.height * 0.3 },
          { x: baseRight + baseSize.width * 0.2, y: baseTop + baseSize.height * 0.4 },
          { x: baseRight + baseSize.width * 0.2, y: baseTop + baseSize.height * 0.6 },
          { x: baseRight, y: baseTop + baseSize.height * 0.7 },
          { x: baseRight, y: baseBottom },
          { x: baseLeft, y: baseBottom }
        ];
        break;
      
      case 'hole-right':
        points = [
          { x: baseLeft, y: baseTop },
          { x: baseRight, y: baseTop },
          { x: baseRight, y: baseTop + baseSize.height * 0.3 },
          { x: baseRight - baseSize.width * 0.2, y: baseTop + baseSize.height * 0.4 },
          { x: baseRight - baseSize.width * 0.2, y: baseTop + baseSize.height * 0.6 },
          { x: baseRight, y: baseTop + baseSize.height * 0.7 },
          { x: baseRight, y: baseBottom },
          { x: baseLeft, y: baseBottom }
        ];
        break;
        
      default:
        // 默认矩形
        points = [
          { x: baseLeft, y: baseTop },
          { x: baseRight, y: baseTop },
          { x: baseRight, y: baseBottom },
          { x: baseLeft, y: baseBottom }
        ];
    }
    
    const percentPoints = points.map(p => toPercent(p.x, p.y));
    return `polygon(${percentPoints.join(', ')})`;
  }
  
  /**
   * 验证clip-path的有效性
   * @param clipPath clip-path字符串
   * @returns 是否有效
   */
  static validateClipPath(clipPath: string): boolean {
    // 基本的clip-path格式验证
    const polygonRegex = /^polygon\((\s*\d+(?:\.\d+)?%\s+\d+(?:\.\d+)?%\s*,?\s*)+\)$/;
    return polygonRegex.test(clipPath);
  }
}
