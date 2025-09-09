import {
  IrregularPuzzleConfig,
  IrregularPuzzlePiece,
  GridSize,
  Size,
  Position,
  GridLayout,
  GenerateIrregularPuzzleParams,
  calculateCenterIndex,
  GRID_CONFIGS
} from './types';
import { EdgePatternGenerator } from './EdgePatternGenerator';
import { ClipPathGenerator } from './ClipPathGenerator';
import { ImageSlicer } from './ImageSlicer';

/**
 * 异形拼图生成器
 * 整合所有模块，生成完整的异形拼图配置
 */
export class IrregularPuzzleGenerator {

  /**
   * 生成完整的异形拼图
   * @param params 生成参数
   * @returns 异形拼图配置
   */
  static async generateIrregularPuzzle(
    params: GenerateIrregularPuzzleParams
  ): Promise<IrregularPuzzleConfig> {
    const {
      imageData,
      gridSize,
      name,
      expansionRatio = 0.4
    } = params;

    // 1. 验证参数
    this.validateParams(params);

    // 2. 加载并验证图像
    const imageElement = await ImageSlicer.loadImage(imageData);
    const validation = ImageSlicer.validateImageForSlicing(
      imageElement.width,
      imageElement.height,
      gridSize
    );

    if (!validation.valid) {
      throw new Error(`图像验证失败: ${validation.message}`);
    }

    // 3. 生成边缘图案
    const edgePatternMap = EdgePatternGenerator.generatePuzzleEdges(
      gridSize,
      0.5 // 基础强度
    );

    // 4. 切割图像
    const targetSize = 800; // 目标图像尺寸
    const sliceResult = await ImageSlicer.sliceImageForIrregular(
      imageElement,
      gridSize,
      targetSize,
      expansionRatio
    );

    // 5. 计算固定块位置
    const fixedPieceIndex = calculateCenterIndex(gridSize);
    const fixedPosition = this.calculateFixedPosition(
      fixedPieceIndex,
      gridSize,
      sliceResult.baseSize
    );

    // 6. 创建网格布局信息
    const gridLayout: GridLayout = {
      gridSize,
      baseSize: sliceResult.baseSize,
      expansionRatio,
      fixedPieceIndex,
      fixedPosition
    };

    // 7. 生成所有拼图块
    const pieces: IrregularPuzzlePiece[] = [];

    for (let i = 0; i < sliceResult.pieces.length; i++) {
      const row = Math.floor(i / gridSize.cols);
      const col = i % gridSize.cols;

      // 提取该块的边缘图案
      const edges = EdgePatternGenerator.extractPieceEdges(i, edgePatternMap);

      // 生成clip-path
      const clipPath = ClipPathGenerator.generateClipPath(
        edges,
        sliceResult.expandedSizes[i],
        sliceResult.baseSize
      );

      // 先创建基础的snap targets（简化版）
      const snapTargets = [{
        position: sliceResult.basePositions[i],
        tolerance: 20
      }];

      // 创建拼图块
      const piece: IrregularPuzzlePiece = {
        id: i.toString(),
        originalIndex: i,
        rotation: 0,
        imageData: sliceResult.pieces[i],
        width: sliceResult.expandedSizes[i].width,
        height: sliceResult.expandedSizes[i].height,

        // 异形拼图特有属性
        // 所有块（包括之前的固定块）都从待拼接区域开始
        x: this.getRandomStartPosition().x,
        y: this.getRandomStartPosition().y,
        isCorrect: false, // 所有块都从未正确状态开始

        // 基础信息
        basePosition: sliceResult.basePositions[i],
        baseSize: sliceResult.baseSize,

        // 扩展信息
        expandedPosition: sliceResult.expandedPositions[i],
        expandedSize: sliceResult.expandedSizes[i],

        // 形状信息
        edges,
        clipPath,

        // 交互信息
        isDraggable: true, // 所有块都可拖拽，包括之前的固定块
        snapTargets,

        // 网格信息
        gridRow: row,
        gridCol: col
      };

      pieces.push(piece);
    }

    // 8. 创建最终配置
    const puzzleConfig: IrregularPuzzleConfig = {
      id: Date.now().toString(),
      name,
      originalImage: imageData,
      gridSize,
      pieceShape: 'irregular',
      pieces,
      fixedPiece: fixedPieceIndex,
      gridLayout,
      createdAt: new Date(),
      updatedAt: new Date(),
      difficulty: this.calculateDifficulty(gridSize)
    };

    return puzzleConfig;
  }

  /**
   * 生成简化版异形拼图（用于测试）
   * @param imageData 图像数据
   * @param gridKey 网格键（如'3x3', '4x4'）
   * @returns 异形拼图配置
   */
  static async generateSimpleIrregular(
    imageData: string,
    gridKey: keyof typeof GRID_CONFIGS = '3x3'
  ): Promise<IrregularPuzzleConfig> {
    const gridConfig = GRID_CONFIGS[gridKey];

    const params: GenerateIrregularPuzzleParams = {
      imageData,
      gridSize: { rows: gridConfig.rows, cols: gridConfig.cols },
      pieceShape: 'irregular',
      name: `异形拼图 ${gridKey}`,
      expansionRatio: 0.4
    };

    return this.generateIrregularPuzzle(params);
  }

  /**
   * 验证生成参数
   * @param params 参数
   */
  private static validateParams(params: GenerateIrregularPuzzleParams): void {
    if (!params.imageData) {
      throw new Error('图像数据不能为空');
    }

    if (!params.name || params.name.trim().length === 0) {
      throw new Error('拼图名称不能为空');
    }

    if (params.gridSize.rows < 2 || params.gridSize.cols < 2) {
      throw new Error('网格尺寸至少为 2x2');
    }

    if (params.gridSize.rows > 8 || params.gridSize.cols > 8) {
      throw new Error('网格尺寸不能超过 8x8');
    }

    if (params.expansionRatio && (params.expansionRatio < 0.2 || params.expansionRatio > 0.8)) {
      throw new Error('扩展比例应在 0.2-0.8 之间');
    }
  }

  /**
   * 计算固定块的绝对位置
   * @param fixedIndex 固定块索引
   * @param gridSize 网格尺寸
   * @param baseSize 基础尺寸
   * @returns 固定位置
   */
  private static calculateFixedPosition(
    fixedIndex: number,
    gridSize: GridSize,
    baseSize: Size
  ): Position {
    // 固定块在拼接板区域的正确位置
    // 注意：这个位置是相对于拼接板容器的，不包含50px偏移
    const row = Math.floor(fixedIndex / gridSize.cols);
    const col = fixedIndex % gridSize.cols;

    return {
      x: col * baseSize.width,
      y: row * baseSize.height
    };
  }

  /**
   * 获取随机起始位置（用于可拖拽的块）
   * @returns 随机位置
   */
  private static getRandomStartPosition(): Position {
    // 在拼接板右下角区域生成随机位置
    // 这些块将在待拼接列表中显示，这里的坐标不重要
    return {
      x: 400 + Math.random() * 200, // 拼接板右侧区域
      y: 300 + Math.random() * 200  // 拼接板下方区域
    };
  }

  /**
   * 计算网格对齐的位置（支持原点偏移）
   * @param position 原始位置（相对于拼接板容器）
   * @param gridSize 网格大小
   * @param offset 原点偏移，例如 50
   */
  private static calculateGridAlignedPositionWithOffset(
    position: number,
    gridSize: number,
    offset: number
  ): number {
    return Math.round((position - offset) / gridSize) * gridSize + offset;
  }

  /**
   * 计算拼图难度
   * @param gridSize 网格尺寸
   * @returns 难度等级
   */
  private static calculateDifficulty(gridSize: GridSize): 'easy' | 'medium' | 'hard' | 'expert' {
    const totalPieces = gridSize.rows * gridSize.cols;

    if (totalPieces <= 9) return 'easy';
    if (totalPieces <= 16) return 'medium';
    if (totalPieces <= 25) return 'hard';
    return 'expert';
  }

  /**
   * 验证拼图完成状态
   * @param pieces 拼图块数组
   * @param tolerance 容差（像素）
   * @returns 完成状态信息
   */
  static validateCompletion(
    pieces: IrregularPuzzlePiece[],
    tolerance: number = 20
  ): {
    isComplete: boolean;
    correctPieces: number;
    totalPieces: number;
    completionRate: number;
  } {
    let correctPieces = 0;
    const totalPieces = pieces.length;

    pieces.forEach(piece => {
      // 检查是否在正确位置附近
      const targetX = piece.basePosition.x;
      const targetY = piece.basePosition.y;

      const deltaX = Math.abs(piece.x - targetX);
      const deltaY = Math.abs(piece.y - targetY);

      if (deltaX <= tolerance && deltaY <= tolerance) {
        correctPieces++;
        piece.isCorrect = true;
      } else {
        piece.isCorrect = false;
      }
    });

    const completionRate = (correctPieces / totalPieces) * 100;
    const isComplete = correctPieces === totalPieces;

    return {
      isComplete,
      correctPieces,
      totalPieces,
      completionRate: Math.round(completionRate)
    };
  }

  /**
   * 重置拼图到初始状态
   * @param pieces 拼图块数组
   * @param fixedPieceIndex 固定块索引（已弃用，所有块现在都可拖拽）
   */
  static resetPuzzle(pieces: IrregularPuzzlePiece[], fixedPieceIndex: number): void {
    pieces.forEach((piece) => {
      // 所有块随机分布到待拼接区域
      const randomPos = this.getRandomStartPosition();
      piece.x = randomPos.x;
      piece.y = randomPos.y;
      piece.rotation = 0;
      piece.isCorrect = false;
      piece.isDraggable = true; // 确保所有块都可拖拽
    });
  }

  /**
   * 获取拼图统计信息
   * @param config 拼图配置
   * @returns 统计信息
   */
  static getPuzzleStats(config: IrregularPuzzleConfig): {
    totalPieces: number;
    draggablePieces: number;
    fixedPieces: number;
    edgeTypes: { flat: number; knob: number; hole: number };
    difficulty: string;
    estimatedTime: string;
  } {
    const totalPieces = config.pieces.length;
    const draggablePieces = config.pieces.filter(p => p.isDraggable).length;
    const fixedPieces = 0; // 现在没有固定块了

    // 统计边缘类型
    let flatEdges = 0, knobEdges = 0, holeEdges = 0;

    config.pieces.forEach(piece => {
      [piece.edges.top, piece.edges.right, piece.edges.bottom, piece.edges.left]
        .forEach(edge => {
          switch (edge.type) {
            case 'flat': flatEdges++; break;
            case 'knob': knobEdges++; break;
            case 'hole': holeEdges++; break;
          }
        });
    });

    // 估算完成时间
    const baseTime = totalPieces * 30; // 每块30秒基础时间
    const estimatedMinutes = Math.ceil(baseTime / 60);
    const estimatedTime = estimatedMinutes < 60
      ? `${estimatedMinutes} 分钟`
      : `${Math.floor(estimatedMinutes / 60)} 小时 ${estimatedMinutes % 60} 分钟`;

    return {
      totalPieces,
      draggablePieces,
      fixedPieces,
      edgeTypes: { flat: flatEdges, knob: knobEdges, hole: holeEdges },
      difficulty: config.difficulty || 'medium',
      estimatedTime
    };
  }
}
