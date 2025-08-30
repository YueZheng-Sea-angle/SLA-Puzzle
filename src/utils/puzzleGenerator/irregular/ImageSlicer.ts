import { Position, Size, GridSize, ExpansionInfo } from './types';
import { PositionCalculator } from './PositionCalculator';

/**
 * 图像切片器 - 支持扩展切割的高级图像处理
 * 用于生成异形拼图的扩展图像块
 */
export class ImageSlicer {
  
  /**
   * 切割图像为异形拼图块
   * @param imageElement 源图像元素
   * @param gridSize 网格尺寸
   * @param targetSize 目标尺寸
   * @param expansionRatio 扩展比例
   * @returns 切割后的图像数据数组
   */
  static async sliceImageForIrregular(
    imageElement: HTMLImageElement,
    gridSize: GridSize,
    targetSize: number,
    expansionRatio: number = 0.4
  ): Promise<{
    pieces: string[];
    baseSize: Size;
    expandedSizes: Size[];
    basePositions: Position[];
    expandedPositions: Position[];
    expansions: ExpansionInfo[];
  }> {
    // 创建临时canvas
    const sourceCanvas = document.createElement('canvas');
    const sourceCtx = sourceCanvas.getContext('2d')!;
    
    // 计算源图像的最佳裁剪尺寸
    const { sourceSize, offsetX, offsetY } = this.calculateSourceDimensions(
      imageElement.width,
      imageElement.height,
      targetSize
    );
    
    // 设置源canvas尺寸
    sourceCanvas.width = sourceSize;
    sourceCanvas.height = sourceSize;
    
    // 绘制裁剪后的源图像
    sourceCtx.drawImage(
      imageElement,
      offsetX, offsetY, sourceSize, sourceSize, // 源区域
      0, 0, sourceSize, sourceSize              // 目标区域
    );
    
    // 计算基础块尺寸
    const baseSize: Size = {
      width: Math.floor(sourceSize / gridSize.cols),
      height: Math.floor(sourceSize / gridSize.rows)
    };
    
    const pieces: string[] = [];
    const expandedSizes: Size[] = [];
    const basePositions: Position[] = [];
    const expandedPositions: Position[] = [];
    const expansions: ExpansionInfo[] = [];
    
    // 为每个拼图块生成扩展的图像数据
    for (let row = 0; row < gridSize.rows; row++) {
      for (let col = 0; col < gridSize.cols; col++) {
        const _index = row * gridSize.cols + col;
        
        // 计算基础位置
        const basePosition: Position = {
          x: col * baseSize.width,
          y: row * baseSize.height
        };
        
        // 计算扩展信息
        const expansion = PositionCalculator.calculateExpansions(
          row, col, gridSize, expansionRatio
        );
        
        // 计算扩展后的尺寸
        const expandedSize: Size = {
          width: baseSize.width + 
                 Math.floor(baseSize.width * (expansion.left + expansion.right)),
          height: baseSize.height + 
                  Math.floor(baseSize.height * (expansion.top + expansion.bottom))
        };
        
        // 计算扩展后的位置（考虑扩展偏移）
        const expandedPosition: Position = {
          x: basePosition.x - Math.floor(baseSize.width * expansion.left),
          y: basePosition.y - Math.floor(baseSize.height * expansion.top)
        };
        
        // 切割扩展的图像块
        const pieceImageData = await this.sliceExpandedPiece(
          sourceCanvas,
          basePosition,
          baseSize,
          expandedPosition,
          expandedSize,
          sourceSize
        );
        
        pieces.push(pieceImageData);
        expandedSizes.push(expandedSize);
        basePositions.push(basePosition);
        expandedPositions.push(expandedPosition);
        expansions.push(expansion);
      }
    }
    
    return {
      pieces,
      baseSize,
      expandedSizes,
      basePositions,
      expandedPositions,
      expansions
    };
  }
  
  /**
   * 切割单个扩展的拼图块
   * @param sourceCanvas 源canvas
   * @param basePosition 基础位置
   * @param baseSize 基础尺寸
   * @param expandedPosition 扩展位置
   * @param expandedSize 扩展尺寸
   * @param sourceSize 源图像尺寸
   * @returns 图像数据URL
   */
  private static async sliceExpandedPiece(
    sourceCanvas: HTMLCanvasElement,
    basePosition: Position,
    baseSize: Size,
    expandedPosition: Position,
    expandedSize: Size,
    sourceSize: number
  ): Promise<string> {
    const pieceCanvas = document.createElement('canvas');
    const pieceCtx = pieceCanvas.getContext('2d')!;
    
    // 设置拼图块canvas尺寸
    pieceCanvas.width = expandedSize.width;
    pieceCanvas.height = expandedSize.height;
    
    // 计算需要绘制的源区域
    const sourceX = Math.max(0, expandedPosition.x);
    const sourceY = Math.max(0, expandedPosition.y);
    const sourceW = Math.min(
      expandedSize.width,
      sourceSize - sourceX,
      expandedPosition.x + expandedSize.width > sourceSize 
        ? sourceSize - expandedPosition.x 
        : expandedSize.width
    );
    const sourceH = Math.min(
      expandedSize.height,
      sourceSize - sourceY,
      expandedPosition.y + expandedSize.height > sourceSize 
        ? sourceSize - expandedPosition.y 
        : expandedSize.height
    );
    
    // 计算在目标canvas上的绘制位置
    const destX = expandedPosition.x < 0 ? -expandedPosition.x : 0;
    const destY = expandedPosition.y < 0 ? -expandedPosition.y : 0;
    
    // 绘制图像块
    if (sourceW > 0 && sourceH > 0) {
      pieceCtx.drawImage(
        sourceCanvas,
        sourceX, sourceY, sourceW, sourceH, // 源区域
        destX, destY, sourceW, sourceH      // 目标区域
      );
    }
    
    // 处理边界外的区域 - 使用边缘像素填充或透明
    await this.fillBoundaryAreas(
      pieceCtx, 
      sourceCanvas, 
      expandedPosition, 
      expandedSize, 
      sourceSize,
      destX, destY, sourceW, sourceH
    );
    
    return pieceCanvas.toDataURL('image/png');
  }
  
  /**
   * 填充边界外区域
   * @param pieceCtx 拼图块上下文
   * @param sourceCanvas 源canvas
   * @param expandedPosition 扩展位置
   * @param expandedSize 扩展尺寸
   * @param sourceSize 源尺寸
   * @param validX 有效区域X
   * @param validY 有效区域Y
   * @param validW 有效区域宽度
   * @param validH 有效区域高度
   */
  private static async fillBoundaryAreas(
    pieceCtx: CanvasRenderingContext2D,
    sourceCanvas: HTMLCanvasElement,
    expandedPosition: Position,
    expandedSize: Size,
    sourceSize: number,
    validX: number,
    validY: number,
    validW: number,
    validH: number
  ): Promise<void> {
    const sourceCtx = sourceCanvas.getContext('2d')!;
    
    // 获取边缘像素用于填充
    const getEdgePixel = (x: number, y: number): ImageData => {
      const clampedX = Math.max(0, Math.min(sourceSize - 1, x));
      const clampedY = Math.max(0, Math.min(sourceSize - 1, y));
      return sourceCtx.getImageData(clampedX, clampedY, 1, 1);
    };
    
    // 填充左边界
    if (expandedPosition.x < 0) {
      const fillWidth = -expandedPosition.x;
      for (let y = 0; y < expandedSize.height; y++) {
        const sourceY = Math.max(0, Math.min(sourceSize - 1, expandedPosition.y + y));
        const edgePixel = getEdgePixel(0, sourceY);
        
        const fillData = pieceCtx.createImageData(fillWidth, 1);
        for (let x = 0; x < fillWidth; x++) {
          const idx = x * 4;
          fillData.data[idx] = edgePixel.data[0];     // R
          fillData.data[idx + 1] = edgePixel.data[1]; // G
          fillData.data[idx + 2] = edgePixel.data[2]; // B
          fillData.data[idx + 3] = edgePixel.data[3]; // A
        }
        pieceCtx.putImageData(fillData, 0, y);
      }
    }
    
    // 填充右边界
    if (expandedPosition.x + expandedSize.width > sourceSize) {
      const startX = Math.max(validX + validW, sourceSize - expandedPosition.x);
      const fillWidth = expandedSize.width - startX;
      
      if (fillWidth > 0) {
        for (let y = 0; y < expandedSize.height; y++) {
          const sourceY = Math.max(0, Math.min(sourceSize - 1, expandedPosition.y + y));
          const edgePixel = getEdgePixel(sourceSize - 1, sourceY);
          
          const fillData = pieceCtx.createImageData(fillWidth, 1);
          for (let x = 0; x < fillWidth; x++) {
            const idx = x * 4;
            fillData.data[idx] = edgePixel.data[0];
            fillData.data[idx + 1] = edgePixel.data[1];
            fillData.data[idx + 2] = edgePixel.data[2];
            fillData.data[idx + 3] = edgePixel.data[3];
          }
          pieceCtx.putImageData(fillData, startX, y);
        }
      }
    }
    
    // 填充顶部边界
    if (expandedPosition.y < 0) {
      const fillHeight = -expandedPosition.y;
      for (let x = 0; x < expandedSize.width; x++) {
        const sourceX = Math.max(0, Math.min(sourceSize - 1, expandedPosition.x + x));
        const edgePixel = getEdgePixel(sourceX, 0);
        
        const fillData = pieceCtx.createImageData(1, fillHeight);
        for (let y = 0; y < fillHeight; y++) {
          const idx = y * 4;
          fillData.data[idx] = edgePixel.data[0];
          fillData.data[idx + 1] = edgePixel.data[1];
          fillData.data[idx + 2] = edgePixel.data[2];
          fillData.data[idx + 3] = edgePixel.data[3];
        }
        pieceCtx.putImageData(fillData, x, 0);
      }
    }
    
    // 填充底部边界
    if (expandedPosition.y + expandedSize.height > sourceSize) {
      const startY = Math.max(validY + validH, sourceSize - expandedPosition.y);
      const fillHeight = expandedSize.height - startY;
      
      if (fillHeight > 0) {
        for (let x = 0; x < expandedSize.width; x++) {
          const sourceX = Math.max(0, Math.min(sourceSize - 1, expandedPosition.x + x));
          const edgePixel = getEdgePixel(sourceX, sourceSize - 1);
          
          const fillData = pieceCtx.createImageData(1, fillHeight);
          for (let y = 0; y < fillHeight; y++) {
            const idx = y * 4;
            fillData.data[idx] = edgePixel.data[0];
            fillData.data[idx + 1] = edgePixel.data[1];
            fillData.data[idx + 2] = edgePixel.data[2];
            fillData.data[idx + 3] = edgePixel.data[3];
          }
          pieceCtx.putImageData(fillData, x, startY);
        }
      }
    }
  }
  
  /**
   * 计算源图像的裁剪尺寸和偏移
   * @param originalWidth 原始宽度
   * @param originalHeight 原始高度
   * @param targetSize 目标尺寸
   * @returns 源尺寸和偏移信息
   */
  private static calculateSourceDimensions(
    originalWidth: number,
    originalHeight: number,
    targetSize: number
  ): { sourceSize: number; offsetX: number; offsetY: number } {
    const aspectRatio = originalWidth / originalHeight;
    let sourceSize: number;
    let offsetX = 0;
    let offsetY = 0;
    
    if (aspectRatio > 1) {
      // 宽图：基于高度计算
      sourceSize = Math.min(originalHeight, targetSize);
      offsetX = (originalWidth - sourceSize) / 2;
    } else {
      // 高图或正方形：基于宽度计算
      sourceSize = Math.min(originalWidth, targetSize);
      offsetY = (originalHeight - sourceSize) / 2;
    }
    
    return {
      sourceSize: Math.floor(sourceSize),
      offsetX: Math.floor(offsetX),
      offsetY: Math.floor(offsetY)
    };
  }
  
  /**
   * 预加载图像
   * @param imageUrl 图像URL
   * @returns 图像元素Promise
   */
  static loadImage(imageUrl: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous'; // 处理跨域问题
      
      img.onload = () => resolve(img);
      img.onerror = (error) => reject(new Error(`Failed to load image: ${error}`));
      
      img.src = imageUrl;
    });
  }
  
  /**
   * 验证图像尺寸是否适合切割
   * @param imageWidth 图像宽度
   * @param imageHeight 图像高度
   * @param gridSize 网格尺寸
   * @param minPieceSize 最小块尺寸
   * @returns 验证结果
   */
  static validateImageForSlicing(
    imageWidth: number,
    imageHeight: number,
    gridSize: GridSize,
    minPieceSize: number = 50
  ): { valid: boolean; message?: string } {
    const minDimension = Math.min(imageWidth, imageHeight);
    const maxGridDimension = Math.max(gridSize.rows, gridSize.cols);
    const estimatedPieceSize = minDimension / maxGridDimension;
    
    if (estimatedPieceSize < minPieceSize) {
      return {
        valid: false,
        message: `图像尺寸太小，切割后每块尺寸约为 ${Math.floor(estimatedPieceSize)}px，建议至少 ${minPieceSize}px`
      };
    }
    
    if (minDimension < 200) {
      return {
        valid: false,
        message: '图像尺寸太小，建议至少 200x200 像素'
      };
    }
    
    return { valid: true };
  }
}
