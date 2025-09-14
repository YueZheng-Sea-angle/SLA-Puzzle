import { PuzzlePiece, PuzzleConfig, PieceShape, DifficultyLevel, TetrisShape } from '../types';

interface GeneratePuzzleParams {
  imageData: string;
  gridSize: { rows: number; cols: number };
  pieceShape: PieceShape;
  name: string;

  targetSize?: number;

  allowRotation?: boolean;

  upsideDown?: boolean; // 颠倒世界特效

}

export class PuzzleGenerator {
  static async generatePuzzle(params: GeneratePuzzleParams): Promise<PuzzleConfig> {
    const { imageData, gridSize, pieceShape, name, allowRotation = false, upsideDown = false } = params;

    // 确保图片是正方形，统一处理尺寸
    const targetSize = 400; // 统一的目标尺寸

    // 如果imageData是URL路径，则使用该路径作为图片源
    let imageUrl = imageData;

    // 如果是颠倒世界特效，需要先将图像旋转180°
    if (upsideDown) {
      imageUrl = await this.rotateImage(imageData, 180);
    }

    // 生成拼图块
    const pieces: PuzzlePiece[] = [];
    let totalPieces, pieceSize;

    if (pieceShape === 'triangle') {
      // 三角形拼图：每个方格生成两个三角形
      totalPieces = gridSize.rows * gridSize.cols * 2;
      pieceSize = targetSize / gridSize.rows;

      for (let i = 0; i < gridSize.rows * gridSize.cols; i++) {
        const row = Math.floor(i / gridSize.cols);
        const col = i % gridSize.cols;

        // 为每个方格生成上三角形和下三角形
        const upperTriangle = await this.generateTrianglePiece({
          imageData: imageUrl,
          squareIndex: i,
          triangleType: 'upper',
          row,
          col,
          gridSize,
          pieceSize,
          targetSize,
        });

        const lowerTriangle = await this.generateTrianglePiece({
          imageData: imageUrl,
          squareIndex: i,
          triangleType: 'lower',
          row,
          col,
          gridSize,
          pieceSize,
          targetSize,
        });

        pieces.push(upperTriangle, lowerTriangle);
      }
    } else if (pieceShape === 'tetris') {
      // 俄罗斯方块拼图
      return this.generateTetrisPuzzle(params);
    } else {
      // 方形拼图
      totalPieces = gridSize.rows * gridSize.cols;
      pieceSize = targetSize / gridSize.rows;

      for (let i = 0; i < totalPieces; i++) {
        const row = Math.floor(i / gridSize.cols);
        const col = i % gridSize.cols;

        const piece = await this.generateSquarePiece({
          imageData: imageUrl,
          index: i,
          row,
          col,
          gridSize,
          pieceSize,
          targetSize,
        });
        pieces.push(piece);
      }
    }

    // 打乱拼图块顺序，根据allowRotation参数决定是否随机旋转和翻转
    const shuffledPieces = this.shufflePieces(pieces, allowRotation);

    const difficulty = this.calculateDifficulty(gridSize, pieceShape);

    return {
      id: `puzzle_${Date.now()}`,
      name,
      originalImage: imageUrl,
      gridSize,
      pieceShape,
      difficulty,
      pieces: shuffledPieces,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  // 旋转图像的静态方法
  private static async rotateImage(imageData: string, degrees: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('无法获取canvas上下文'));
          return;
        }

        // 设置canvas尺寸
        canvas.width = img.width;
        canvas.height = img.height;

        // 将旋转中心移动到图像中心
        ctx.translate(canvas.width / 2, canvas.height / 2);

        // 旋转指定角度
        ctx.rotate((degrees * Math.PI) / 180);

        // 绘制图像（以中心为原点）
        ctx.drawImage(img, -img.width / 2, -img.height / 2);

        // 返回旋转后的图像数据
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = reject;
      img.src = imageData.startsWith('/') ? imageData : imageData;
      img.crossOrigin = 'anonymous';
    });
  }

  private static async generateSquarePiece(params: {
    imageData: string;
    index: number;
    row: number;
    col: number;
    gridSize: { rows: number; cols: number };
    pieceSize: number;
    targetSize: number;
  }): Promise<PuzzlePiece> {
    const { imageData, index, row, col, gridSize, pieceSize } = params;

    // 创建canvas来裁剪图片
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('无法获取canvas上下文');
    }

    canvas.width = pieceSize;
    canvas.height = pieceSize;

    // 创建原始图片
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      // 如果是相对路径，确保能正确加载
      img.src = imageData.startsWith('/') ? imageData : imageData;
      // 允许跨域加载（如果需要）
      img.crossOrigin = 'anonymous';
    });

    // 计算源图片的实际尺寸
    const sourceSize = Math.min(img.width, img.height);
    const offsetX = (img.width - sourceSize) / 2;
    const offsetY = (img.height - sourceSize) / 2;

    // 裁剪对应区域（从正方形区域中裁剪）
    ctx.drawImage(
      img,
      offsetX + col * (sourceSize / gridSize.cols), // 源x
      offsetY + row * (sourceSize / gridSize.rows), // 源y
      sourceSize / gridSize.cols, // 源宽度
      sourceSize / gridSize.rows, // 源高度
      0, // 目标x
      0, // 目标y
      pieceSize, // 目标宽度
      pieceSize  // 目标高度
    );

    const pieceImageData = canvas.toDataURL('image/png');

    return {
      id: `piece_${index}`,
      originalIndex: index,
      currentSlot: null, // 初始在处理区
      correctSlot: index, // 正确的槽位就是其原始索引
      rotation: 0,
      isFlipped: false,
      correctRotation: 0, // 正确的旋转角度
      correctIsFlipped: false, // 正确的翻转状态
      imageData: pieceImageData,
      width: pieceSize,
      height: pieceSize,
      shape: 'square',
    };
  }

  // 生成三角形拼图块
  private static async generateTrianglePiece(params: {
    imageData: string;
    squareIndex: number;
    triangleType: 'upper' | 'lower';
    row: number;
    col: number;
    gridSize: { rows: number; cols: number };
    pieceSize: number;
    targetSize: number;
  }): Promise<PuzzlePiece> {
    const { imageData, squareIndex, triangleType, row, col, gridSize, pieceSize } = params;

    // 创建canvas来裁剪图片
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('无法获取canvas上下文');
    }

    canvas.width = pieceSize;
    canvas.height = pieceSize;

    // 创建原始图片
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = imageData.startsWith('/') ? imageData : imageData;
      img.crossOrigin = 'anonymous';
    });

    // 计算源图片的实际尺寸和缩放比例
    const sourceSize = Math.min(img.width, img.height);
    const offsetX = (img.width - sourceSize) / 2;
    const offsetY = (img.height - sourceSize) / 2;

    // 先绘制完整的方形区域
    ctx.drawImage(
      img,
      offsetX + col * (sourceSize / gridSize.cols), // 源x
      offsetY + row * (sourceSize / gridSize.rows), // 源y
      sourceSize / gridSize.cols, // 源宽度
      sourceSize / gridSize.rows, // 源高度
      0, // 目标x
      0, // 目标y
      pieceSize, // 目标宽度
      pieceSize  // 目标高度
    );

    // 应用三角形裁剪路径
    ctx.globalCompositeOperation = 'destination-in';
    ctx.beginPath();

    if (triangleType === 'upper') {
      // 上三角形：左上角 -> 右上角 -> 右下角
      ctx.moveTo(0, 0);
      ctx.lineTo(pieceSize, 0);
      ctx.lineTo(pieceSize, pieceSize);
      ctx.closePath();
    } else {
      // 下三角形：左上角 -> 左下角 -> 右下角
      ctx.moveTo(0, 0);
      ctx.lineTo(0, pieceSize);
      ctx.lineTo(pieceSize, pieceSize);
      ctx.closePath();
    }

    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';

    const pieceImageData = canvas.toDataURL('image/png');

    // 计算三角形的正确槽位索引
    const triangleIndex = triangleType === 'upper' ? 0 : 1;
    const correctSlot = squareIndex * 2 + triangleIndex;

    return {
      id: `triangle_${squareIndex}_${triangleType}`,
      originalIndex: correctSlot,
      currentSlot: null,
      correctSlot: correctSlot,
      rotation: 0,
      isFlipped: false,
      correctRotation: 0, // 正确的旋转角度
      correctIsFlipped: false, // 正确的翻转状态
      imageData: pieceImageData,
      width: pieceSize,
      height: pieceSize,
      shape: 'triangle',
      triangleType: triangleType, // 添加三角形类型
    };
  }

  // 打乱拼图块顺序，并根据需要随机旋转和翻转
  private static shufflePieces(pieces: PuzzlePiece[], allowRotation: boolean): PuzzlePiece[] {
    const shuffled = [...pieces];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // 如果允许旋转和翻转，则为每个拼图块随机应用初始状态
    if (allowRotation) {
      return shuffled.map(piece => {
        // 随机旋转：0°, 90°, 180°, 270°
        const rotations = [0, 90, 180, 270];
        const randomRotation = rotations[Math.floor(Math.random() * rotations.length)];

        // 50% 概率翻转
        const shouldFlip = Math.random() > 0.5;

        return {
          ...piece,
          rotation: randomRotation,
          isFlipped: shouldFlip,
          // 正确状态始终是原始状态：0度旋转，不翻转
          // 这样玩家需要通过按键将随机状态调整回正确状态
          correctRotation: 0,
          correctIsFlipped: false
        };
      });
    } else {
      // 不允许旋转和翻转，保持原始状态
      return shuffled;
    }
  }

  private static calculateDifficulty(
    gridSize: { rows: number; cols: number },
    pieceShape: PieceShape
  ): DifficultyLevel {
    const totalPieces = gridSize.rows * gridSize.cols;
    // 三角形拼图难度更高，因为有更多拼图块
    const multiplier = pieceShape === 'triangle' ? 2 : 1;
    const effectivePieces = totalPieces * multiplier;

    if (effectivePieces <= 9) {
      return 'easy';
    } else if (effectivePieces <= 16) {
      return 'medium';
    } else if (effectivePieces <= 25) {
      return 'hard';
    } else {
      return 'expert';
    }
  }

  static getDifficultyConfig(level: DifficultyLevel) {
    switch (level) {
      case 'easy':
        return { gridSize: { rows: 3, cols: 3 }, pieceShape: 'square' as PieceShape };
      case 'medium':
        return { gridSize: { rows: 4, cols: 4 }, pieceShape: 'square' as PieceShape };
      case 'hard':
        return { gridSize: { rows: 5, cols: 5 }, pieceShape: 'square' as PieceShape };
      case 'expert':
        return { gridSize: { rows: 6, cols: 6 }, pieceShape: 'square' as PieceShape };
      case 'custom':
        return { gridSize: { rows: 4, cols: 4 }, pieceShape: 'square' as PieceShape };
      default:
        return { gridSize: { rows: 3, cols: 3 }, pieceShape: 'square' as PieceShape };
    }
  }

  // 生成俄罗斯方块拼图
  private static async generateTetrisPuzzle(params: GeneratePuzzleParams): Promise<PuzzleConfig> {
    const { imageData, gridSize, name, aspectRatio = '1:1' } = params;
    const targetSize = params.targetSize || 400;

    const pieces: PuzzlePiece[] = [];
    const totalCells = gridSize.rows * gridSize.cols;
    const cellSize = Math.max(targetSize / gridSize.rows, 120); // 增加最小单元格尺寸到120px

    // 根据网格大小决定俄罗斯方块组合
    let tetrisBlocks: { shape: TetrisShape; positions: Array<{ row: number; col: number }> }[] = [];

    if (totalCells === 9) { // 3x3
      tetrisBlocks = this.getTetrisBlocks3x3();
    } else if (totalCells === 16) { // 4x4
      tetrisBlocks = this.getTetrisBlocks4x4();
    } else if (totalCells === 25) { // 5x5
      tetrisBlocks = this.getTetrisBlocks5x5();
    } else if (totalCells === 36) { // 6x6
      tetrisBlocks = this.getTetrisBlocks6x6();
    } else {
      // 默认使用方形拼图
      throw new Error(`不支持${gridSize.rows}x${gridSize.cols}的俄罗斯方块拼图`);
    }

    // 检测并拆分不连续的俄罗斯方块
    tetrisBlocks = this.splitDisconnectedBlocks(tetrisBlocks);

    // 为每个俄罗斯方块生成拼图块
    for (let blockIndex = 0; blockIndex < tetrisBlocks.length; blockIndex++) {
      const block = tetrisBlocks[blockIndex];
      const tetrisPiece = await this.generateTetrisPiece({
        imageData,
        blockIndex,
        tetrisShape: block.shape,
        positions: block.positions,
        cellSize,
        gridSize
      });

      pieces.push(tetrisPiece);
    }

    return {
      id: `tetris_${Date.now()}`,
      name,
      originalImage: imageData,
      pieces: pieces,
      gridSize,
      pieceShape: 'tetris',
      difficulty: this.calculateDifficulty(gridSize, 'tetris' as PieceShape),
      aspectRatio, // 添加裁剪比例
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  // 检测并拆分不连续的俄罗斯方块
  private static splitDisconnectedBlocks(blocks: { shape: TetrisShape; positions: Array<{ row: number; col: number }> }[]) {
    const result: { shape: TetrisShape; positions: Array<{ row: number; col: number }> }[] = [];

    for (const block of blocks) {
      const connectedGroups = this.findConnectedGroups(block.positions);

      if (connectedGroups.length === 1) {
        // 如果所有位置都连在一起，保持原样
        result.push(block);
      } else {
        // 如果有多个不连续的组，拆分成独立的单格碎片
        for (const group of connectedGroups) {
          for (const position of group) {
            result.push({
              shape: 'O1' as TetrisShape, // 使用单格碎片类型
              positions: [position]
            });
          }
        }
      }
    }

    return result;
  }

  // 查找连通的方格组
  private static findConnectedGroups(positions: Array<{ row: number; col: number }>) {
    const visited = new Set<string>();
    const groups: Array<{ row: number; col: number }[]> = [];

    for (const pos of positions) {
      const key = `${pos.row},${pos.col}`;
      if (visited.has(key)) continue;

      // 使用DFS查找连通的方格
      const group: Array<{ row: number; col: number }> = [];
      const stack = [pos];

      while (stack.length > 0) {
        const current = stack.pop()!;
        const currentKey = `${current.row},${current.col}`;

        if (visited.has(currentKey)) continue;
        visited.add(currentKey);
        group.push(current);

        // 检查四个方向的相邻方格
        const neighbors = [
          { row: current.row - 1, col: current.col }, // 上
          { row: current.row + 1, col: current.col }, // 下
          { row: current.row, col: current.col - 1 }, // 左
          { row: current.row, col: current.col + 1 }  // 右
        ];

        for (const neighbor of neighbors) {
          const neighborKey = `${neighbor.row},${neighbor.col}`;
          if (!visited.has(neighborKey) &&
            positions.some(p => p.row === neighbor.row && p.col === neighbor.col)) {
            stack.push(neighbor);
          }
        }
      }

      groups.push(group);
    }

    return groups;
  }

  // 获取3x3俄罗斯方块布局
  private static getTetrisBlocks3x3() {
    return [
      {
        shape: 'L' as TetrisShape,
        positions: [
          { row: 0, col: 0 },
          { row: 1, col: 0 },
          { row: 2, col: 0 },
          { row: 2, col: 1 }
        ]
      },
      {
        shape: 'O' as TetrisShape,
        positions: [
          { row: 0, col: 1 },
          { row: 0, col: 2 },
          { row: 1, col: 1 },
          { row: 1, col: 2 }
        ]
      },
      {
        shape: 'O1' as TetrisShape,
        positions: [
          { row: 2, col: 2 }
        ]
      }
    ];
  }

  // 获取4x4俄罗斯方块布局
  private static getTetrisBlocks4x4() {
    return [
      {
        shape: 'T' as TetrisShape,
        positions: [
          { row: 0, col: 1 },
          { row: 1, col: 0 },
          { row: 1, col: 1 },
          { row: 1, col: 2 }
        ]
      },
      {
        shape: 'L' as TetrisShape,
        positions: [
          { row: 0, col: 2 },
          { row: 0, col: 3 },
          { row: 1, col: 3 },
          { row: 2, col: 3 }
        ]
      },
      {
        shape: 'Z' as TetrisShape,
        positions: [
          { row: 2, col: 0 },
          { row: 2, col: 1 },
          { row: 3, col: 1 },
          { row: 3, col: 2 }
        ]
      },
      {
        shape: 'O' as TetrisShape,
        positions: [
          { row: 0, col: 0 },
          { row: 2, col: 2 },
          { row: 3, col: 0 },
          { row: 3, col: 3 }
        ]
      }
    ];
  }

  // 获取5x5俄罗斯方块布局
  private static getTetrisBlocks5x5() {
    return [
      {
        shape: 'I' as TetrisShape,
        positions: [
          { row: 0, col: 0 },
          { row: 1, col: 0 },
          { row: 2, col: 0 },
          { row: 3, col: 0 }
        ]
      },
      {
        shape: 'T' as TetrisShape,
        positions: [
          { row: 0, col: 2 },
          { row: 1, col: 1 },
          { row: 1, col: 2 },
          { row: 1, col: 3 }
        ]
      },
      {
        shape: 'O' as TetrisShape,
        positions: [
          { row: 0, col: 3 },
          { row: 0, col: 4 },
          { row: 1, col: 4 },
          { row: 2, col: 4 }
        ]
      },
      {
        shape: 'L3' as TetrisShape,
        positions: [
          { row: 2, col: 1 },
          { row: 2, col: 2 },
          { row: 2, col: 3 }
        ]
      },
      {
        shape: 'I3' as TetrisShape,
        positions: [
          { row: 3, col: 1 },
          { row: 3, col: 2 },
          { row: 3, col: 3 }
        ]
      },
      {
        shape: 'I2' as TetrisShape,
        positions: [
          { row: 4, col: 0 },
          { row: 4, col: 1 }
        ]
      },
      {
        shape: 'I2' as TetrisShape,
        positions: [
          { row: 3, col: 4 },
          { row: 4, col: 4 }
        ]
      },
      {
        shape: 'O1' as TetrisShape,
        positions: [
          { row: 0, col: 1 }
        ]
      },
      {
        shape: 'O1' as TetrisShape,
        positions: [
          { row: 4, col: 2 }
        ]
      },
      {
        shape: 'O1' as TetrisShape,
        positions: [
          { row: 4, col: 3 }
        ]
      }
    ];
  }

  // 生成6x6网格的俄罗斯方块布局
  private static getTetrisBlocks6x6() {
    return [
      // 第一行：I型长条和几个单格
      {
        shape: 'I' as TetrisShape,
        positions: [
          { row: 0, col: 0 },
          { row: 0, col: 1 },
          { row: 0, col: 2 },
          { row: 0, col: 3 }
        ]
      },
      {
        shape: 'O1' as TetrisShape,
        positions: [
          { row: 0, col: 4 }
        ]
      },
      {
        shape: 'O1' as TetrisShape,
        positions: [
          { row: 0, col: 5 }
        ]
      },

      // 第二行：L型和T型，以及缺失的单格
      {
        shape: 'L' as TetrisShape,
        positions: [
          { row: 1, col: 0 },
          { row: 2, col: 0 },
          { row: 3, col: 0 },
          { row: 3, col: 1 }
        ]
      },
      {
        shape: 'O1' as TetrisShape,
        positions: [
          { row: 1, col: 1 }
        ]
      },
      {
        shape: 'T' as TetrisShape,
        positions: [
          { row: 1, col: 2 },
          { row: 2, col: 1 },
          { row: 2, col: 2 },
          { row: 2, col: 3 }
        ]
      },
      {
        shape: 'O1' as TetrisShape,
        positions: [
          { row: 1, col: 3 }
        ]
      },

      // 第三行：O型方块
      {
        shape: 'O' as TetrisShape,
        positions: [
          { row: 1, col: 4 },
          { row: 1, col: 5 },
          { row: 2, col: 4 },
          { row: 2, col: 5 }
        ]
      },

      // 第四行：S型和Z型
      {
        shape: 'S' as TetrisShape,
        positions: [
          { row: 3, col: 2 },
          { row: 3, col: 3 },
          { row: 4, col: 1 },
          { row: 4, col: 2 }
        ]
      },
      {
        shape: 'Z' as TetrisShape,
        positions: [
          { row: 3, col: 4 },
          { row: 3, col: 5 },
          { row: 4, col: 3 },
          { row: 4, col: 4 }
        ]
      },

      // 第五行：剩余的单格和双格
      {
        shape: 'O1' as TetrisShape,
        positions: [
          { row: 4, col: 0 }
        ]
      },
      {
        shape: 'O1' as TetrisShape,
        positions: [
          { row: 4, col: 5 }
        ]
      },

      // 第六行：I3型和单格
      {
        shape: 'I3' as TetrisShape,
        positions: [
          { row: 5, col: 0 },
          { row: 5, col: 1 },
          { row: 5, col: 2 }
        ]
      },
      {
        shape: 'I3' as TetrisShape,
        positions: [
          { row: 5, col: 3 },
          { row: 5, col: 4 },
          { row: 5, col: 5 }
        ]
      }
    ];
  }

  // 生成单个俄罗斯方块拼图块
  private static async generateTetrisPiece(params: {
    imageData: string;
    blockIndex: number;
    tetrisShape: TetrisShape;
    positions: Array<{ row: number; col: number }>;
    cellSize: number;
    gridSize: { rows: number; cols: number };
  }): Promise<PuzzlePiece> {
    const { imageData, blockIndex, tetrisShape, positions, cellSize, gridSize } = params;

    // 创建原始图片
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = imageData.startsWith('/') ? imageData : imageData;
      img.crossOrigin = 'anonymous';
    });

    const sourceSize = Math.min(img.width, img.height);
    const offsetX = (img.width - sourceSize) / 2;
    const offsetY = (img.height - sourceSize) / 2;

    // 计算俄罗斯方块的边界
    const minRow = Math.min(...positions.map(p => p.row));
    const maxRow = Math.max(...positions.map(p => p.row));
    const minCol = Math.min(...positions.map(p => p.col));
    const maxCol = Math.max(...positions.map(p => p.col));

    // 增加边距以确保完整显示
    const padding = Math.max(cellSize * 0.2, 12); // 增加边距比例和最小值
    const blockWidth = (maxCol - minCol + 1) * cellSize + padding * 2;
    const blockHeight = (maxRow - minRow + 1) * cellSize + padding * 2;

    // 创建canvas来绘制俄罗斯方块
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('无法获取canvas上下文');
    }

    canvas.width = blockWidth;
    canvas.height = blockHeight;

    // 添加背景以便调试
    ctx.fillStyle = 'rgba(255, 255, 255, 0.01)';
    ctx.fillRect(0, 0, blockWidth, blockHeight);

    // 为每个格子存储图像数据
    const cellImages: Record<string, string> = {};

    // 绘制俄罗斯方块的每个格子
    for (let i = 0; i < positions.length; i++) {
      const pos = positions[i];
      const localRow = pos.row - minRow;
      const localCol = pos.col - minCol;

      // 从原图裁剪对应位置的图像
      const cellCanvas = document.createElement('canvas');
      const cellCtx = cellCanvas.getContext('2d');
      if (!cellCtx) continue;

      cellCanvas.width = cellSize;
      cellCanvas.height = cellSize;

      // 裁剪原图对应位置
      cellCtx.drawImage(
        img,
        offsetX + pos.col * (sourceSize / gridSize.cols),
        offsetY + pos.row * (sourceSize / gridSize.rows),
        sourceSize / gridSize.cols,
        sourceSize / gridSize.rows,
        0,
        0,
        cellSize,
        cellSize
      );

      // 将单格图像绘制到主canvas上，加上边距偏移
      const drawX = localCol * cellSize + padding;
      const drawY = localRow * cellSize + padding;

      ctx.drawImage(
        cellCanvas,
        drawX,
        drawY,
        cellSize,
        cellSize
      );

      // 添加格子边框以便更好地显示俄罗斯方块结构
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.lineWidth = 1;
      ctx.strokeRect(drawX, drawY, cellSize, cellSize);

      // 存储单格图像数据
      cellImages[`${pos.row}-${pos.col}`] = cellCanvas.toDataURL('image/png');
    }

    const pieceImageData = canvas.toDataURL('image/png');

    // 计算正确的槽位（对应positions中的位置索引）
    const correctSlots = positions.map(pos => pos.row * gridSize.cols + pos.col);

    // 转换positions格式
    const occupiedPositions: [number, number][] = positions.map(pos => [pos.row, pos.col]);

    return {
      id: `tetris_${blockIndex}`,
      originalIndex: blockIndex,
      currentSlot: null,
      correctSlot: correctSlots[0], // 主要槽位（用于单槽位兼容）
      correctSlots, // 所有正确槽位
      rotation: 0,
      isFlipped: false,
      correctRotation: 0,
      correctIsFlipped: false,
      imageData: pieceImageData,
      width: blockWidth,
      height: blockHeight,
      shape: 'square', // 保持兼容性
      tetrisShape, // 俄罗斯方块形状
      occupiedPositions, // 占用的位置
      cellImages // 每个格子的图像数据
    };
  }
}