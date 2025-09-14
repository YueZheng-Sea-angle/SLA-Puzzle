/**
 * SLA-Puzzle 功能测试套件
 * 包含拼图项目所有核心功能模块的详细测试用例
 */

console.log('🔍 启动 SLA-Puzzle 功能测试套件');
console.log('='.repeat(70));

// 测试结果统计
const testResults = {
  totalTests: 0,
  passedTests: 0,
  failedTests: 0,
  skippedTests: 0,
  startTime: new Date(),
  endTime: null,
  testCases: [],
  moduleResults: {
    puzzleGeneration: { total: 0, passed: 0, failed: 0 },
    gameLogic: { total: 0, passed: 0, failed: 0 },
    userAuth: { total: 0, passed: 0, failed: 0 },
    achievementSystem: { total: 0, passed: 0, failed: 0 },
    leaderboard: { total: 0, passed: 0, failed: 0 },
    puzzleShapes: { total: 0, passed: 0, failed: 0 },
    multiplayer: { total: 0, passed: 0, failed: 0 }
  }
};

// 模拟API和核心模块
const mockAPI = {
  // 模拟拼图生成API
  generatePuzzle: async (options = {}) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          // 验证参数并设置默认值
          const difficulty = options.difficulty || 'medium'; // 默认使用中等难度
          const pieceShape = options.pieceShape || 'square';
          
          // 根据难度设置默认网格大小
          const difficultySettings = {
            easy: { rows: 3, cols: 3 },
            medium: { rows: 4, cols: 4 },
            hard: { rows: 5, cols: 5 },
            expert: { rows: 6, cols: 6 }
          };
          
          // 确定网格大小
          const finalGridSize = options.gridSize || difficultySettings[difficulty];
          
          const totalPieces = finalGridSize.rows * finalGridSize.cols;
          const pieces = [];
          
          for (let i = 0; i < totalPieces; i++) {
            pieces.push({
              id: `piece_${i}`,
              originalIndex: i,
              correctSlot: i,
              width: 100,
              height: 100,
              rotation: 0,
              shape: pieceShape || 'square'
            });
          }
          
          resolve({
            id: `puzzle_${Date.now()}`,
            name: `Test Puzzle ${difficulty || `${finalGridSize.rows}x${finalGridSize.cols}`}`,
            gridSize: finalGridSize,
            pieces: pieces,
            difficulty: difficulty,
            pieceShape: pieceShape || 'square',
            createdAt: new Date()
          });
        } catch (error) {
          reject(error);
        }
      }, 100 + Math.random() * 200);
    });
  },
  
  // 模拟生成俄罗斯方块拼图
  generateTetrisPuzzle: async (options) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          const { difficulty } = options;
          
          // 俄罗斯方块拼图特有配置
          const tetrisConfig = {
            easy: { width: 10, height: 20, initialPieces: 3 },
            medium: { width: 10, height: 20, initialPieces: 4 },
            hard: { width: 10, height: 20, initialPieces: 5 },
            expert: { width: 10, height: 20, initialPieces: 6 }
          };
          
          const config = tetrisConfig[difficulty] || tetrisConfig.easy;
          
          // 生成俄罗斯方块拼图数据
          const pieces = [];
          const tetrominoes = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];
          
          for (let i = 0; i < config.initialPieces; i++) {
            const tetrominoType = tetrominoes[Math.floor(Math.random() * tetrominoes.length)];
            pieces.push({
              id: `tetris_${i}`,
              type: tetrominoType,
              rotation: Math.floor(Math.random() * 4), // 0-3种旋转状态
              position: {
                x: Math.floor((config.width - 4) / 2),
                y: 0
              },
              color: `hsl(${Math.random() * 360}, 70%, 50%)`,
              shape: 'tetris'
            });
          }
          
          resolve({
            id: `tetris_puzzle_${Date.now()}`,
            name: `Tetris Puzzle ${difficulty}`,
            boardSize: config,
            pieces: pieces,
            difficulty: difficulty,
            pieceShape: 'tetris',
            createdAt: new Date()
          });
        } catch (error) {
          reject(error);
        }
      }, 150 + Math.random() * 250);
    });
  },
  
  // 模拟多人对战API
  createMultiplayerGame: async (player1Id, player2Id, options) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          if (!player1Id || !player2Id) {
            throw new Error('必须提供两个玩家的ID');
          }
          
          const gameId = `multi_${Date.now()}`;
          
          resolve({
            gameId: gameId,
            player1: {
              id: player1Id,
              status: 'ready',
              score: 0
            },
            player2: {
              id: player2Id,
              status: 'ready',
              score: 0
            },
            status: 'waiting',
            puzzleConfig: {
              difficulty: options.difficulty || 'medium',
              pieceShape: options.pieceShape || 'square'
            },
            createdAt: new Date(),
            startTime: null,
            endTime: null
          });
        } catch (error) {
          reject(error);
        }
      }, 200);
    });
  },
  
  // 模拟开始多人对战游戏
  startMultiplayerGame: async (gameId) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          if (!gameId) {
            throw new Error('游戏ID不能为空');
          }
          
          resolve({
            success: true,
            gameId: gameId,
            status: 'playing',
            startTime: new Date()
          });
        } catch (error) {
          reject(error);
        }
      }, 100);
    });
  },
  
  // 模拟提交游戏动作
  submitMultiplayerMove: async (gameId, playerId, moveData) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          if (!gameId || !playerId || !moveData) {
            throw new Error('游戏ID、玩家ID和移动数据不能为空');
          }
          
          // 模拟动作处理
          const isSuccess = Math.random() > 0.1; // 90%成功率
          const newScore = Math.floor(Math.random() * 100) + 10;
          
          resolve({
            success: isSuccess,
            gameId: gameId,
            playerId: playerId,
            moveAccepted: isSuccess,
            newScore: newScore,
            timestamp: new Date()
          });
        } catch (error) {
          reject(error);
        }
      }, 50);
    });
  },
  
  // 模拟结束多人对战游戏
  endMultiplayerGame: async (gameId, winnerId) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          if (!gameId) {
            throw new Error('游戏ID不能为空');
          }
          
          resolve({
            success: true,
            gameId: gameId,
            status: 'completed',
            winner: winnerId || null,
            endTime: new Date()
          });
        } catch (error) {
          reject(error);
        }
      }, 150);
    });
  },
  
  // 模拟用户认证API
  authenticateUser: async (credentials) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (!credentials.username || !credentials.password) {
          reject(new Error('用户名和密码不能为空'));
          return;
        }
        
        // 简单模拟认证逻辑
        if (credentials.username === 'testuser' && credentials.password === 'password123') {
          resolve({
            userId: 'user_001',
            username: 'testuser',
            token: 'mock_jwt_token',
            permissions: ['play', 'save', 'leaderboard']
          });
        } else if (credentials.username === 'admin' && credentials.password === 'admin123') {
          resolve({
            userId: 'user_002',
            username: 'admin',
            token: 'mock_admin_token',
            permissions: ['play', 'save', 'leaderboard', 'admin']
          });
        } else {
          reject(new Error('认证失败：用户名或密码错误'));
        }
      }, 300);
    });
  },
  
  // 模拟保存游戏状态API
  saveGameState: async (userId, gameState) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (!userId || !gameState) {
          reject(new Error('用户ID和游戏状态不能为空'));
          return;
        }
        
        resolve({
          saved: true,
          saveId: `save_${Date.now()}`,
          timestamp: new Date()
        });
      }, 200);
    });
  },
  
  // 模拟获取排行榜API
  getLeaderboard: async (options) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockLeaderboard = [
          { userId: 'user_003', username: 'PuzzleMaster', score: 9800, time: '00:02:45', difficulty: 'expert' },
          { userId: 'user_004', username: 'SpeedSolver', score: 9200, time: '00:03:10', difficulty: 'expert' },
          { userId: 'user_005', username: 'PatternWhisperer', score: 8700, time: '00:03:35', difficulty: 'expert' },
          { userId: 'user_001', username: 'testuser', score: 7500, time: '00:04:15', difficulty: 'hard' },
          { userId: 'user_006', username: 'CasualPlayer', score: 6800, time: '00:04:50', difficulty: 'hard' }
        ];
        
        resolve({
          leaderboard: mockLeaderboard,
          totalPlayers: 125,
          lastUpdated: new Date()
        });
      }, 150);
    });
  },
  
  // 模拟成就系统API
  getAchievements: async (userId) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockAchievements = {
          completed: [
            { id: 'first_game', name: '初次尝试', description: '完成第一局游戏' },
            { id: '5_games', name: '渐入佳境', description: '完成5局游戏' },
            { id: 'easy_master', name: '简单大师', description: '完成10局简单难度游戏' }
          ],
          progress: [
            { id: 'medium_master', name: '中等大师', description: '完成10局中等难度游戏', current: 7, total: 10 },
            { id: 'fast_solver', name: '快速解决者', description: '在2分钟内完成一局游戏', current: 0, total: 1 }
          ],
          locked: [
            { id: 'hard_master', name: '困难大师', description: '完成10局困难难度游戏' },
            { id: 'expert_master', name: '专家大师', description: '完成10局专家难度游戏' },
            { id: '100_games', name: '拼图狂热者', description: '完成100局游戏' }
          ]
        };
        
        resolve(mockAchievements);
      }, 180);
    });
  }
};

// 创建新的mockAPI实例的函数
function createMockAPI() {
  return {
    // 模拟拼图生成API
    generatePuzzle: async (options = {}) => {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          try {
            // 验证参数
            if (!options.difficulty && !options.gridSize) {
              throw new Error('难度或网格大小必须提供一个');
            }
            
            // 设置默认值
            const difficulty = options.difficulty || 'medium';
            const pieceShape = options.pieceShape || 'square';
            
            // 根据难度设置默认网格大小
            const difficultySettings = {
              easy: { rows: 3, cols: 3 },
              medium: { rows: 4, cols: 4 },
              hard: { rows: 5, cols: 5 },
              expert: { rows: 6, cols: 6 }
            };
            
            // 确定网格大小
            const finalGridSize = options.gridSize || difficultySettings[difficulty];
            
            const totalPieces = finalGridSize.rows * finalGridSize.cols;
            
            // 生成拼图数据
            const pieces = [];
            for (let i = 0; i < totalPieces; i++) {
              pieces.push({
                id: `piece_${i}`,
                shape: pieceShape,
                position: {
                  x: Math.floor(Math.random() * finalGridSize.cols),
                  y: Math.floor(Math.random() * finalGridSize.rows)
                },
                rotation: Math.floor(Math.random() * 4) * 90, // 0°, 90°, 180°, 270°
                color: `hsl(${Math.random() * 360}, 70%, 50%)`
              });
            }
            
            resolve({
              id: `puzzle_${Date.now()}`,
              name: `Puzzle ${difficulty}`,
              gridSize: finalGridSize,
              pieces: pieces,
              difficulty: difficulty,
              pieceShape: pieceShape,
              createdAt: new Date()
            });
          } catch (error) {
            reject(error);
          }
        }, 100 + Math.random() * 300);
      });
    },
    
    // 模拟生成三角形拼图
    generateTrianglePuzzle: async (options) => {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          try {
            const { difficulty } = options;
            
            // 三角形拼图特有配置
            const triangleConfig = {
              easy: { size: 4, initialPieces: 3 },
              medium: { size: 5, initialPieces: 4 },
              hard: { size: 6, initialPieces: 5 },
              expert: { size: 8, initialPieces: 6 }
            };
            
            const config = triangleConfig[difficulty] || triangleConfig.easy;
            
            // 生成三角形拼图数据
            const pieces = [];
            for (let i = 0; i < config.initialPieces; i++) {
              pieces.push({
                id: `triangle_${i}`,
                type: 'triangle',
                rotation: Math.floor(Math.random() * 3), // 0-2种旋转状态
                position: {
                  x: Math.floor(Math.random() * config.size),
                  y: Math.floor(Math.random() * config.size)
                },
                color: `hsl(${Math.random() * 360}, 70%, 50%)`,
                shape: 'triangle'
              });
            }
            
            resolve({
              id: `triangle_puzzle_${Date.now()}`,
              name: `Triangle Puzzle ${difficulty}`,
              boardSize: config,
              pieces: pieces,
              difficulty: difficulty,
              pieceShape: 'triangle',
              createdAt: new Date()
            });
          } catch (error) {
            reject(error);
          }
        }, 150 + Math.random() * 250);
      });
    },
    
    // 模拟生成异形拼图
    generateIrregularPuzzle: async (options) => {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          try {
            const { difficulty } = options;
            
            // 异形拼图特有配置
            const irregularConfig = {
              easy: { width: 4, height: 4, initialPieces: 3 },
              medium: { width: 5, height: 5, initialPieces: 4 },
              hard: { width: 6, height: 6, initialPieces: 5 },
              expert: { width: 8, height: 8, initialPieces: 6 }
            };
            
            const config = irregularConfig[difficulty] || irregularConfig.easy;
            
            // 异形拼图形状类型
            const shapes = ['L', 'T', 'Z', 'S', 'I'];
            
            // 生成异形拼图数据
            const pieces = [];
            for (let i = 0; i < config.initialPieces; i++) {
              const shapeType = shapes[Math.floor(Math.random() * shapes.length)];
              pieces.push({
                id: `irregular_${i}`,
                type: shapeType,
                rotation: Math.floor(Math.random() * 4), // 0-3种旋转状态
                position: {
                  x: Math.floor(Math.random() * config.width),
                  y: Math.floor(Math.random() * config.height)
                },
                color: `hsl(${Math.random() * 360}, 70%, 50%)`,
                shape: 'irregular'
              });
            }
            
            resolve({
              id: `irregular_puzzle_${Date.now()}`,
              name: `Irregular Puzzle ${difficulty}`,
              boardSize: config,
              pieces: pieces,
              difficulty: difficulty,
              pieceShape: 'irregular',
              createdAt: new Date()
            });
          } catch (error) {
            reject(error);
          }
        }, 150 + Math.random() * 250);
      });
    },
    
    // 模拟生成俄罗斯方块拼图
    generateTetrisPuzzle: async (options) => {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          try {
            const { difficulty } = options;
            
            // 俄罗斯方块拼图特有配置
            const tetrisConfig = {
              easy: { width: 10, height: 20, initialPieces: 3 },
              medium: { width: 10, height: 20, initialPieces: 4 },
              hard: { width: 10, height: 20, initialPieces: 5 },
              expert: { width: 10, height: 20, initialPieces: 6 }
            };
            
            const config = tetrisConfig[difficulty] || tetrisConfig.easy;
            
            // 生成俄罗斯方块拼图数据
            const pieces = [];
            const tetrominoes = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];
            
            for (let i = 0; i < config.initialPieces; i++) {
              const tetrominoType = tetrominoes[Math.floor(Math.random() * tetrominoes.length)];
              pieces.push({
                id: `tetris_${i}`,
                type: tetrominoType,
                rotation: Math.floor(Math.random() * 4), // 0-3种旋转状态
                position: {
                  x: Math.floor((config.width - 4) / 2),
                  y: 0
                },
                color: `hsl(${Math.random() * 360}, 70%, 50%)`,
                shape: 'tetris'
              });
            }
            
            resolve({
              id: `tetris_puzzle_${Date.now()}`,
              name: `Tetris Puzzle ${difficulty}`,
              boardSize: config,
              pieces: pieces,
              difficulty: difficulty,
              pieceShape: 'tetris',
              createdAt: new Date()
            });
          } catch (error) {
            reject(error);
          }
        }, 150 + Math.random() * 250);
      });
    },
    
    // 模拟多人对战API
    createMultiplayerGame: async (player1Id, player2Id, options) => {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          try {
            if (!player1Id || !player2Id) {
              throw new Error('必须提供两个玩家的ID');
            }
            
            const gameId = `multi_${Date.now()}`;
            
            resolve({
              gameId: gameId,
              player1: {
                id: player1Id,
                status: 'ready',
                score: 0
              },
              player2: {
                id: player2Id,
                status: 'ready',
                score: 0
              },
              status: 'waiting',
              puzzleConfig: {
                difficulty: options.difficulty || 'medium',
                pieceShape: options.pieceShape || 'square'
              },
              createdAt: new Date(),
              startTime: null,
              endTime: null
            });
          } catch (error) {
            reject(error);
          }
        }, 200);
      });
    },
    
    // 模拟开始多人对战游戏
    startMultiplayerGame: async (gameId) => {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          try {
            if (!gameId) {
              throw new Error('游戏ID不能为空');
            }
            
            resolve({
              success: true,
              gameId: gameId,
              status: 'playing',
              startTime: new Date()
            });
          } catch (error) {
            reject(error);
          }
        }, 100);
      });
    },
    
    // 模拟提交游戏动作
    submitMultiplayerMove: async (gameId, playerId, moveData) => {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          try {
            if (!gameId || !playerId || !moveData) {
              throw new Error('游戏ID、玩家ID和移动数据不能为空');
            }
            
            // 随机成功90%的情况
            if (Math.random() < 0.9) {
              resolve({
                success: true,
                playerId: playerId,
                newScore: Math.floor(Math.random() * 1000),
                timestamp: new Date()
              });
            } else {
              throw new Error('动作处理失败');
            }
          } catch (error) {
            reject(error);
          }
        }, 150);
      });
    },
    
    // 模拟结束多人对战游戏
    endMultiplayerGame: async (gameId, winnerId) => {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          try {
            if (!gameId) {
              throw new Error('游戏ID不能为空');
            }
            
            resolve({
              success: true,
              gameId: gameId,
              status: 'completed',
              winner: winnerId || 'none',
              endTime: new Date()
            });
          } catch (error) {
            reject(error);
          }
        }, 100);
      });
    },
    
    // 模拟用户认证API
    authenticateUser: async (credentials) => {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          try {
            if (!credentials || !credentials.username || !credentials.password) {
              throw new Error('用户名和密码不能为空');
            }
            
            // 模拟用户数据
            const users = {
              'testuser': {
                userId: 'user_001',
                password: 'password123',
                permissions: ['play', 'save', 'leaderboard']
              },
              'admin': {
                userId: 'user_002',
                password: 'admin123',
                permissions: ['admin', 'play', 'save', 'leaderboard', 'manage']
              }
            };
            
            const user = users[credentials.username];
            if (!user || user.password !== credentials.password) {
              reject(new Error('认证失败：用户名或密码错误'));
              return;
            }
            
            resolve({
              userId: user.userId,
              username: credentials.username,
              token: `token_${Date.now()}_${credentials.username}`,
              permissions: user.permissions,
              loginTime: new Date()
            });
          } catch (error) {
            reject(error);
          }
        }, 300);
      });
    },
    
    // 模拟保存游戏状态API
    saveGameState: async (userId, gameState) => {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          // 添加调试信息，追踪调用来源
          console.log('🔍 saveGameState 被调用:', { userId, gameState });
          console.trace('调用栈跟踪:');
          
          if (!userId || !gameState) {
            console.error('❌ 保存游戏状态失败: 用户ID或游戏状态为空');
            reject(new Error('用户ID和游戏状态不能为空'));
            return;
          }
          
          resolve({
            saved: true,
            saveId: `save_${Date.now()}`,
            timestamp: new Date()
          });
        }, 200);
      });
    },
    
    // 模拟获取排行榜API
    getLeaderboard: async (options) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          const mockLeaderboard = [
            { userId: 'user_003', username: 'PuzzleMaster', score: 9800, time: '00:02:45', difficulty: 'expert' },
            { userId: 'user_004', username: 'QuickSolver', score: 9500, time: '00:03:12', difficulty: 'expert' },
            { userId: 'user_005', username: 'ShapeShifter', score: 8900, time: '00:03:30', difficulty: 'hard' },
            { userId: 'user_006', username: 'PuzzlePro', score: 8500, time: '00:04:20', difficulty: 'hard' },
            { userId: 'user_007', username: 'TetrisKing', score: 8200, time: '00:04:45', difficulty: 'medium' }
          ];
          
          resolve({
            leaderboard: mockLeaderboard,
            totalPlayers: 150,
            lastUpdated: new Date().toISOString()
          });
        }, 150);
      });
    },
    
    // 模拟成就系统API
    getAchievements: async (userId) => {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          if (!userId) {
            reject(new Error('用户ID不能为空'));
            return;
          }
          
          // 模拟成就数据
          const mockAchievements = {
            completed: [
              { id: 'first_game', name: '初次尝试', description: '完成第一局游戏' },
              { id: '5_games', name: '渐入佳境', description: '完成5局游戏' },
              { id: 'easy_master', name: '简单大师', description: '完成10局简单难度游戏' }
            ],
            progress: [
              { id: 'medium_master', name: '中等大师', description: '完成10局中等难度游戏', current: 7, total: 10 },
              { id: 'fast_solver', name: '快速解决者', description: '在2分钟内完成一局游戏', current: 0, total: 1 }
            ],
            locked: [
              { id: 'hard_master', name: '困难大师', description: '完成10局困难难度游戏' },
              { id: 'expert_master', name: '专家大师', description: '完成10局专家难度游戏' },
              { id: '100_games', name: '拼图狂热者', description: '完成100局游戏' }
            ]
          };
          
          resolve(mockAchievements);
        }, 180);
      });
    }
  };
}

// 测试工具函数
function testCase(name, module, testFunction) {
  testResults.totalTests++;
  testResults.moduleResults[module].total++;
  
  const testCase = {
    name,
    module,
    status: 'pending',
    startTime: new Date(),
    endTime: null,
    duration: 0,
    error: null
  };
  
  try {
    // 为每个测试用例创建一个全新的mockAPI实例
    const freshMockAPI = createMockAPI();
    
    const result = testFunction(freshMockAPI);
    
    // 处理异步测试
    if (result && typeof result.then === 'function') {
      return result
        .then(() => {
          testCase.status = 'passed';
          testResults.passedTests++;
          testResults.moduleResults[module].passed++;
          testCase.endTime = new Date();
          testCase.duration = testCase.endTime - testCase.startTime;
          testResults.testCases.push(testCase);
          console.log(`✅ PASS: [${module}] ${name} (${testCase.duration}ms)`);
          return true;
        })
        .catch(error => {
          testCase.status = 'failed';
          testResults.failedTests++;
          testResults.moduleResults[module].failed++;
          testCase.endTime = new Date();
          testCase.duration = testCase.endTime - testCase.startTime;
          testCase.error = error.message;
          testResults.testCases.push(testCase);
          console.error(`❌ FAIL: [${module}] ${name} (${testCase.duration}ms) - ${error.message}`);
          return false;
        });
    } else {
      // 同步测试
      testCase.status = 'passed';
      testResults.passedTests++;
      testResults.moduleResults[module].passed++;
      testCase.endTime = new Date();
      testCase.duration = testCase.endTime - testCase.startTime;
      testResults.testCases.push(testCase);
      console.log(`✅ PASS: [${module}] ${name} (${testCase.duration}ms)`);
      return true;
    }
  } catch (error) {
    testCase.status = 'failed';
    testResults.failedTests++;
    testResults.moduleResults[module].failed++;
    testCase.endTime = new Date();
    testCase.duration = testCase.endTime - testCase.startTime;
    testCase.error = error.message;
    testResults.testCases.push(testCase);
    console.error(`❌ FAIL: [${module}] ${name} (${testCase.duration}ms) - ${error.message}`);
    return false;
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || '断言失败');
  }
}

function assertEquals(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(message || `期望值为 ${expected}，但实际值为 ${actual}`);
  }
}

function assertDeepEquals(actual, expected, message) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(message || `期望值为 ${JSON.stringify(expected)}，但实际值为 ${JSON.stringify(actual)}`);
  }
}

// 处理同步和异步函数的通用assertThrows
function assertThrows(testFunction, expectedError, message) {
  // 检查是否是异步函数（返回Promise）
  if (testFunction.constructor.name === 'AsyncFunction' || 
      (typeof testFunction === 'function' && testFunction.constructor.name === 'Function' && 
       testFunction.toString().includes('async'))) {
    // 异步函数处理
    return new Promise(async (resolve, reject) => {
      try {
        await testFunction();
        reject(new Error(message || `预期会抛出错误 ${expectedError}，但没有抛出任何错误`));
      } catch (error) {
        if (expectedError && !error.message.includes(expectedError)) {
          reject(new Error(message || `预期会抛出包含 "${expectedError}" 的错误，但实际错误为 "${error.message}"`));
        } else {
          // 成功捕获到预期错误
          resolve();
        }
      }
    });
  } else {
    // 同步函数处理
    try {
      testFunction();
      throw new Error(message || `预期会抛出错误 ${expectedError}，但没有抛出任何错误`);
    } catch (error) {
      if (expectedError && !error.message.includes(expectedError)) {
        throw new Error(message || `预期会抛出包含 "${expectedError}" 的错误，但实际错误为 "${error.message}"`);
      }
    }
  }
}

// 获取模块显示名称
function getModuleDisplayName(moduleKey) {
  const moduleNames = {
    puzzleGeneration: '拼图生成模块',
    gameLogic: '游戏逻辑模块',
    userAuth: '用户认证模块',
    achievementSystem: '成就系统模块',
    leaderboard: '排行榜模块',
    puzzleShapes: '拼图形状模块',
    multiplayer: '多人对战模块'
  };
  
  return moduleNames[moduleKey] || moduleKey;
}

// 拼图生成模块测试
async function runPuzzleGenerationTests() {
  console.log('\n=== 拼图生成模块测试 ===');
  
  await testCase('生成简单难度拼图', 'puzzleGeneration', async (api) => {
    const puzzle = await api.generatePuzzle({ difficulty: 'easy' });
    assert(puzzle, '拼图生成失败');
    assert(puzzle.gridSize.rows === 3 && puzzle.gridSize.cols === 3, '简单难度拼图应为3x3网格');
    assert(puzzle.pieces.length === 9, '简单难度拼图应为9个拼块');
    assert(puzzle.difficulty === 'easy', '难度标识不正确');
  });
  
  await testCase('生成中等难度拼图', 'puzzleGeneration', async (api) => {
    const puzzle = await api.generatePuzzle({ difficulty: 'medium' });
    assert(puzzle, '拼图生成失败');
    assert(puzzle.gridSize.rows === 4 && puzzle.gridSize.cols === 4, '中等难度拼图应为4x4网格');
    assert(puzzle.pieces.length === 16, '中等难度拼图应为16个拼块');
    assert(puzzle.difficulty === 'medium', '难度标识不正确');
  });
  
  await testCase('生成困难难度拼图', 'puzzleGeneration', async (api) => {
    const puzzle = await api.generatePuzzle({ difficulty: 'hard' });
    assert(puzzle, '拼图生成失败');
    assert(puzzle.gridSize.rows === 5 && puzzle.gridSize.cols === 5, '困难难度拼图应为5x5网格');
    assert(puzzle.pieces.length === 25, '困难难度拼图应为25个拼块');
    assert(puzzle.difficulty === 'hard', '难度标识不正确');
  });
  
  await testCase('生成专家难度拼图', 'puzzleGeneration', async (api) => {
    const puzzle = await api.generatePuzzle({ difficulty: 'expert' });
    assert(puzzle, '拼图生成失败');
    assert(puzzle.gridSize.rows === 6 && puzzle.gridSize.cols === 6, '专家难度拼图应为6x6网格');
    assert(puzzle.pieces.length === 36, '专家难度拼图应为36个拼块');
    assert(puzzle.difficulty === 'expert', '难度标识不正确');
  });
  
  await testCase('自定义网格大小拼图', 'puzzleGeneration', async (api) => {
    const customGrid = { rows: 2, cols: 4 };
    const puzzle = await api.generatePuzzle({ gridSize: customGrid });
    assert(puzzle, '拼图生成失败');
    assert(puzzle.gridSize.rows === customGrid.rows && puzzle.gridSize.cols === customGrid.cols, '自定义网格大小不正确');
    assert(puzzle.pieces.length === customGrid.rows * customGrid.cols, '拼块数量不正确');
  });
  
  await testCase('拼图生成失败 - 无参数', 'puzzleGeneration', async (api) => {
    await assertThrows(async () => {
      await api.generatePuzzle({});
    }, '难度或网格大小必须提供一个');
  });
}

// 拼图形状模块测试
async function runPuzzleShapesTests() {
  console.log('\n=== 拼图形状模块测试 ===');
  
  await testCase('生成方形拼图', 'puzzleShapes', async (api) => {
    const puzzle = await api.generatePuzzle({ 
      difficulty: 'easy', 
      pieceShape: 'square' 
    });
    assert(puzzle, '方形拼图生成失败');
    assert(puzzle.pieceShape === 'square', '拼图形状未正确设置为方形');
    assert(puzzle.pieces.every(piece => piece.shape === 'square'), '所有拼块应为方形');
  });
  
  await testCase('生成三角形拼图', 'puzzleShapes', async (api) => {
    const puzzle = await api.generatePuzzle({ 
      difficulty: 'easy', 
      pieceShape: 'triangle' 
    });
    assert(puzzle, '三角形拼图生成失败');
    assert(puzzle.pieceShape === 'triangle', '拼图形状未正确设置为三角形');
    assert(puzzle.pieces.every(piece => piece.shape === 'triangle'), '所有拼块应为三角形');
  });
  
  await testCase('生成异形拼图', 'puzzleShapes', async (api) => {
    const puzzle = await api.generatePuzzle({ 
      difficulty: 'easy', 
      pieceShape: 'irregular' 
    });
    assert(puzzle, '异形拼图生成失败');
    assert(puzzle.pieceShape === 'irregular', '拼图形状未正确设置为异形');
    assert(puzzle.pieces.every(piece => piece.shape === 'irregular'), '所有拼块应为异形');
  });
  
  await testCase('生成简单难度俄罗斯方块拼图', 'puzzleShapes', async (api) => {
    const tetrisPuzzle = await api.generateTetrisPuzzle({ 
      difficulty: 'easy' 
    });
    assert(tetrisPuzzle, '俄罗斯方块拼图生成失败');
    assert(tetrisPuzzle.pieceShape === 'tetris', '拼图形状未正确设置为俄罗斯方块');
    assert(tetrisPuzzle.boardSize.width === 10 && tetrisPuzzle.boardSize.height === 20, '俄罗斯方块游戏板尺寸不正确');
    assert(tetrisPuzzle.pieces.length === tetrisPuzzle.boardSize.initialPieces, '初始方块数量不正确');
  });
  
  await testCase('生成专家难度俄罗斯方块拼图', 'puzzleShapes', async (api) => {
    const tetrisPuzzle = await api.generateTetrisPuzzle({ 
      difficulty: 'expert' 
    });
    assert(tetrisPuzzle, '专家难度俄罗斯方块拼图生成失败');
    assert(tetrisPuzzle.difficulty === 'expert', '难度标识不正确');
    assert(tetrisPuzzle.boardSize.initialPieces === 6, '专家难度初始方块数量应为6');
  });
  
  await testCase('不同难度下的方形拼图比较', 'puzzleShapes', async (api) => {
    const easyPuzzle = await api.generatePuzzle({ 
      difficulty: 'easy', 
      pieceShape: 'square' 
    });
    const hardPuzzle = await api.generatePuzzle({ 
      difficulty: 'hard', 
      pieceShape: 'square' 
    });
    
    assert(easyPuzzle, '简单难度拼图生成失败');
    assert(hardPuzzle, '困难难度拼图生成失败');
    assert(easyPuzzle.pieceShape === hardPuzzle.pieceShape, '两种难度拼图形状应相同');
    assert(easyPuzzle.gridSize.rows < hardPuzzle.gridSize.rows, '困难难度拼图网格应更大');
  });
}

// 游戏逻辑模块测试
async function runGameLogicTests() {
  console.log('\n=== 游戏逻辑模块测试 ===');
  
  await testCase('初始化游戏状态', 'gameLogic', async (api) => {
    const puzzle = await api.generatePuzzle({ difficulty: 'easy' });
    
    // 模拟游戏状态初始化
    const gameState = {
      puzzleId: puzzle.id,
      startTime: new Date(),
      moves: 0,
      isCompleted: false,
      elapsedTime: 0,
      pieces: puzzle.pieces.map(piece => ({ ...piece, currentSlot: null }))
    };
    
    assert(gameState, '游戏状态初始化失败');
    assert(gameState.moves === 0, '初始移动次数应为0');
    assert(gameState.isCompleted === false, '初始完成状态应为false');
    assert(gameState.elapsedTime === 0, '初始耗时应为0');
  });
  
  await testCase('保存游戏状态', 'gameLogic', async (api) => {
    const userId = 'user_001';
    const gameState = {
      puzzleId: 'test_puzzle',
      startTime: new Date(),
      moves: 5,
      isCompleted: false,
      elapsedTime: 120,
      pieces: [{ id: 'piece_1', currentSlot: 1 }]
    };
    
    const result = await api.saveGameState(userId, gameState);
    assert(result, '保存游戏状态失败');
    assert(result.saved === true, '保存状态标识不正确');
    assert(result.saveId, '保存ID未生成');
  });
  
  await testCase('保存游戏失败 - 缺少用户ID', 'gameLogic', async (api) => {
    const gameState = {
      puzzleId: 'test_puzzle',
      moves: 5
    };
    
    await assertThrows(async () => {
      await api.saveGameState(null, gameState);
    }, '用户ID和游戏状态不能为空');
  });
  
  await testCase('保存游戏失败 - 缺少游戏状态', 'gameLogic', async (api) => {
    await assertThrows(async () => {
      await api.saveGameState('user_001', null);
    }, '用户ID和游戏状态不能为空');
  });
}

// 用户认证模块测试
async function runUserAuthTests() {
  console.log('\n=== 用户认证模块测试 ===');
  
  await testCase('普通用户登录认证', 'userAuth', async (api) => {
    const credentials = { username: 'testuser', password: 'password123' };
    const user = await api.authenticateUser(credentials);
    
    assert(user, '用户认证失败');
    assert(user.userId === 'user_001', '用户ID不正确');
    assert(user.username === 'testuser', '用户名不正确');
    assert(user.token, '未生成认证令牌');
    assert(user.permissions.includes('play'), '普通用户应具有游戏权限');
    assert(user.permissions.includes('save'), '普通用户应具有保存权限');
    assert(user.permissions.includes('leaderboard'), '普通用户应具有排行榜权限');
  });
  
  await testCase('管理员用户登录认证', 'userAuth', async (api) => {
    const credentials = { username: 'admin', password: 'admin123' };
    const user = await api.authenticateUser(credentials);
    
    assert(user, '管理员认证失败');
    assert(user.userId === 'user_002', '管理员ID不正确');
    assert(user.username === 'admin', '管理员用户名不正确');
    assert(user.permissions.includes('admin'), '管理员应具有管理员权限');
    assert(user.permissions.includes('play'), '管理员应具有游戏权限');
  });
  
  await testCase('认证失败 - 用户名或密码错误', 'userAuth', async (api) => {
    const credentials = { username: 'wronguser', password: 'wrongpass' };
    
    await assertThrows(async () => {
      await api.authenticateUser(credentials);
    }, '认证失败：用户名或密码错误');
  });
  
  await testCase('认证失败 - 缺少用户名', 'userAuth', async (api) => {
    const credentials = { password: 'password123' };
    
    await assertThrows(async () => {
      await api.authenticateUser(credentials);
    }, '用户名和密码不能为空');
  });
  
  await testCase('认证失败 - 缺少密码', 'userAuth', async (api) => {
    const credentials = { username: 'testuser' };
    
    await assertThrows(async () => {
      await api.authenticateUser(credentials);
    }, '用户名和密码不能为空');
  });
}

// 成就系统模块测试
async function runAchievementSystemTests() {
  console.log('\n=== 成就系统模块测试 ===');
  
  await testCase('获取用户成就列表', 'achievementSystem', async (api) => {
    const achievements = await api.getAchievements('user_001');
    
    assert(achievements, '获取成就失败');
    assert(Array.isArray(achievements.completed), '已完成成就应为数组');
    assert(Array.isArray(achievements.progress), '进行中成就应为数组');
    assert(Array.isArray(achievements.locked), '未解锁成就应为数组');
    
    // 检查已完成成就数量
    assert(achievements.completed.length >= 1, '应至少有一个已完成成就');
    
    // 检查进行中成就包含进度信息
    achievements.progress.forEach(achievement => {
      assert(achievement.hasOwnProperty('current'), '进行中成就应包含当前进度');
      assert(achievement.hasOwnProperty('total'), '进行中成就应包含总进度');
    });
  });
  
  await testCase('验证成就数据结构', 'achievementSystem', async (api) => {
    const achievements = await api.getAchievements('user_001');
    
    // 检查所有成就都包含必要字段
    const allAchievements = [
      ...achievements.completed,
      ...achievements.progress.map(a => ({ ...a })),
      ...achievements.locked
    ];
    
    allAchievements.forEach(achievement => {
      assert(achievement.id, '成就ID缺失');
      assert(achievement.name, '成就名称缺失');
      assert(achievement.description, '成就描述缺失');
    });
  });
}

// 多人对战模块测试
async function runMultiplayerTests() {
  console.log('\n=== 多人对战模块测试 ===');
  
  await testCase('创建1v1对战游戏', 'multiplayer', async (api) => {
    const game = await api.createMultiplayerGame('user_001', 'user_002', {
      difficulty: 'medium',
      pieceShape: 'square'
    });
    
    assert(game, '创建多人对战游戏失败');
    assert(game.gameId, '游戏ID未生成');
    assert(game.player1.id === 'user_001', '玩家1ID不正确');
    assert(game.player2.id === 'user_002', '玩家2ID不正确');
    assert(game.status === 'waiting', '初始游戏状态应为等待中');
    assert(game.puzzleConfig.difficulty === 'medium', '难度设置不正确');
  });
  
  await testCase('开始多人对战游戏', 'multiplayer', async (api) => {
    const game = await api.createMultiplayerGame('user_001', 'user_002', {});
    const startResult = await api.startMultiplayerGame(game.gameId);
    
    assert(startResult, '开始游戏失败');
    assert(startResult.success === true, '开始游戏未成功');
    assert(startResult.status === 'playing', '游戏状态应为进行中');
    assert(startResult.startTime, '开始时间未设置');
  });
  
  await testCase('提交游戏动作', 'multiplayer', async (api) => {
    const game = await api.createMultiplayerGame('user_001', 'user_002', {});
    await api.startMultiplayerGame(game.gameId);
    
    const moveResult = await api.submitMultiplayerMove(game.gameId, 'user_001', {
      pieceId: 'piece_1',
      action: 'place',
      position: { x: 1, y: 1 }
    });
    
    assert(moveResult, '提交动作失败');
    assert(moveResult.playerId === 'user_001', '玩家ID不匹配');
    assert(typeof moveResult.newScore === 'number', '分数应为数字类型');
  });
  
  await testCase('结束多人对战游戏并指定获胜者', 'multiplayer', async (api) => {
    const game = await api.createMultiplayerGame('user_001', 'user_002', {});
    await api.startMultiplayerGame(game.gameId);
    
    const endResult = await api.endMultiplayerGame(game.gameId, 'user_001');
    
    assert(endResult, '结束游戏失败');
    assert(endResult.success === true, '结束游戏未成功');
    assert(endResult.status === 'completed', '游戏状态应为已完成');
    assert(endResult.winner === 'user_001', '获胜者ID不正确');
    assert(endResult.endTime, '结束时间未设置');
  });
  
  await testCase('创建多人对战游戏失败 - 缺少玩家ID', 'multiplayer', async (api) => {
    await assertThrows(async () => {
      await api.createMultiplayerGame(null, 'user_002', {});
    }, '必须提供两个玩家的ID');
  });
  
  await testCase('使用不同拼图形状进行多人对战', 'multiplayer', async (api) => {
    const game = await api.createMultiplayerGame('user_001', 'user_002', {
      difficulty: 'hard',
      pieceShape: 'triangle'
    });
    
    assert(game, '创建带特殊形状的多人游戏失败');
    assert(game.puzzleConfig.pieceShape === 'triangle', '拼图形状设置不正确');
  });
}

// 排行榜模块测试
async function runLeaderboardTests() {
  console.log('\n=== 排行榜模块测试 ===');
  
  await testCase('获取排行榜数据', 'leaderboard', async (api) => {
    const leaderboard = await api.getLeaderboard({ limit: 10 });
    
    assert(leaderboard, '获取排行榜失败');
    assert(Array.isArray(leaderboard.leaderboard), '排行榜应为数组');
    assert(leaderboard.leaderboard.length > 0, '排行榜不应为空');
    assert(leaderboard.hasOwnProperty('totalPlayers'), '应包含总玩家数');
    assert(leaderboard.hasOwnProperty('lastUpdated'), '应包含最后更新时间');
  });
  
  await testCase('验证排行榜数据结构', 'leaderboard', async (api) => {
    const leaderboard = await api.getLeaderboard({});
    
    // 检查排行榜条目包含必要字段
    leaderboard.leaderboard.forEach(entry => {
      assert(entry.userId, '用户ID缺失');
      assert(entry.username, '用户名称缺失');
      assert(typeof entry.score === 'number', '分数应为数字类型');
      assert(entry.time, '完成时间缺失');
      assert(entry.difficulty, '难度信息缺失');
    });
  });
  
  await testCase('排行榜应按分数降序排列', 'leaderboard', async (api) => {
    const leaderboard = await api.getLeaderboard({});
    
    // 验证排序顺序
    let isSorted = true;
    for (let i = 1; i < leaderboard.leaderboard.length; i++) {
      if (leaderboard.leaderboard[i].score > leaderboard.leaderboard[i - 1].score) {
        isSorted = false;
        break;
      }
    }
    
    assert(isSorted, '排行榜未按分数降序排列');
  });
}

// 生成HTML格式的测试报告
function generateTestReport() {
  const endTime = new Date();
  const duration = (endTime - testResults.startTime) / 1000;
  const passRate = (testResults.passedTests / testResults.totalTests) * 100;
  
  // 准备图表数据
  const moduleChartData = Object.keys(testResults.moduleResults).map(module => ({
    module: getModuleDisplayName(module),
    total: testResults.moduleResults[module].total,
    passed: testResults.moduleResults[module].passed,
    failed: testResults.moduleResults[module].failed
  }));
  
  // 准备所有测试用例的详细信息
  const allTestCasesHtml = testResults.testCases.map((testCase, index) => {
    const statusClass = testCase.status === 'passed' ? 'success' : 'error';
    const statusText = testCase.status === 'passed' ? '通过' : '失败';
    
    return `
      <tr class="${statusClass}">
        <td>${index + 1}</td>
        <td>${getModuleDisplayName(testCase.module)}</td>
        <td>${testCase.name}</td>
        <td>${statusText}</td>
        <td>${testCase.duration}ms</td>
        <td>${testCase.error || '-'}</td>
      </tr>
    `;
  }).join('');
  
  // 按模块分组的测试用例
  const modulesWithTestCases = {};
  testResults.testCases.forEach(testCase => {
    if (!modulesWithTestCases[testCase.module]) {
      modulesWithTestCases[testCase.module] = [];
    }
    modulesWithTestCases[testCase.module].push(testCase);
  });
  
  // 生成按模块分组的HTML
  const groupedTestCasesHtml = Object.keys(modulesWithTestCases).map(module => {
    const moduleName = getModuleDisplayName(module);
    const moduleTestCases = modulesWithTestCases[module];
    
    const testCasesHtml = moduleTestCases.map((testCase, index) => {
      const statusClass = testCase.status === 'passed' ? 'success' : 'error';
      const statusText = testCase.status === 'passed' ? '通过' : '失败';
      
      return `
        <tr class="${statusClass}">
          <td>${index + 1}</td>
          <td>${testCase.name}</td>
          <td>${statusText}</td>
          <td>${testCase.duration}ms</td>
          <td>${testCase.error || '-'}</td>
        </tr>
      `;
    }).join('');
    
    return `
      <div class="module-section">
        <h3>${moduleName}</h3>
        <table>
          <thead>
            <tr>
              <th>序号</th>
              <th>测试用例</th>
              <th>状态</th>
              <th>耗时</th>
              <th>错误信息</th>
            </tr>
          </thead>
          <tbody>
            ${testCasesHtml}
          </tbody>
        </table>
      </div>
    `;
  }).join('');
  
  const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SLA-Puzzle 功能测试报告</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }
    .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    h1 { color: #333; text-align: center; }
    h2 { color: #555; margin-top: 30px; }
    h3 { color: #666; }
    .summary { display: flex; flex-wrap: wrap; gap: 20px; margin: 20px 0; }
    .summary-card { flex: 1; min-width: 180px; background: #f8f9fa; padding: 15px; border-radius: 6px; text-align: center; }
    .summary-card h3 { margin: 0 0 10px 0; color: #555; font-size: 16px; }
    .summary-card .value { font-size: 24px; font-weight: bold; }
    .value.success { color: #28a745; }
    .value.error { color: #dc3545; }
    .value.info { color: #007bff; }
    .chart-container { margin: 30px 0; height: 400px; }
    .test-details { margin-top: 30px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background-color: #f2f2f2; font-weight: bold; }
    tr.success { background-color: #d4edda; }
    tr.error { background-color: #f8d7da; }
    .module-section { margin-bottom: 40px; border: 1px solid #e9ecef; border-radius: 6px; padding: 15px; }
    .tabs { display: flex; gap: 10px; margin-bottom: 20px; border-bottom: 1px solid #ddd; padding-bottom: 10px; }
    .tab { cursor: pointer; padding: 8px 16px; border-radius: 4px 4px 0 0; }
    .tab.active { background-color: #007bff; color: white; }
    .tab-content { display: none; }
    .tab-content.active { display: block; }
  </style>
</head>
<body>
  <div class="container">
    <h1>SLA-Puzzle 功能测试报告</h1>
    
    <div class="summary">
      <div class="summary-card">
        <h3>总测试用例数</h3>
        <div class="value info">${testResults.totalTests}</div>
      </div>
      <div class="summary-card">
        <h3>通过测试</h3>
        <div class="value success">${testResults.passedTests}</div>
      </div>
      <div class="summary-card">
        <h3>失败测试</h3>
        <div class="value error">${testResults.failedTests}</div>
      </div>
      <div class="summary-card">
        <h3>通过率</h3>
        <div class="value info">${passRate.toFixed(2)}%</div>
      </div>
      <div class="summary-card">
        <h3>测试时长</h3>
        <div class="value info">${duration.toFixed(2)}秒</div>
      </div>
      <div class="summary-card">
        <h3>开始时间</h3>
        <div class="value info">${testResults.startTime.toLocaleString()}</div>
      </div>
    </div>
    
    <div class="chart-container">
      <canvas id="moduleChart"></canvas>
    </div>
    
    <div class="tabs">
      <div class="tab active" onclick="showTab('all-tests')">所有测试</div>
      <div class="tab" onclick="showTab('grouped-tests')">按模块查看</div>
    </div>
    
    <div class="tab-content active" id="all-tests">
      <h2>所有测试用例详情</h2>
      <table>
        <thead>
          <tr>
            <th>序号</th>
            <th>模块</th>
            <th>测试用例</th>
            <th>状态</th>
            <th>耗时</th>
            <th>错误信息</th>
          </tr>
        </thead>
        <tbody>
          ${allTestCasesHtml}
        </tbody>
      </table>
    </div>
    
    <div class="tab-content" id="grouped-tests">
      <h2>测试用例详情（按模块分组）</h2>
      ${groupedTestCasesHtml}
    </div>
  </div>
  
  <script>
    // 切换标签页
    function showTab(tabId) {
      // 隐藏所有内容
      const contents = document.querySelectorAll('.tab-content');
      contents.forEach(content => content.classList.remove('active'));
      
      // 重置所有标签
      const tabs = document.querySelectorAll('.tab');
      tabs.forEach(tab => tab.classList.remove('active'));
      
      // 显示选中的内容和标签
      document.getElementById(tabId).classList.add('active');
      event.currentTarget.classList.add('active');
    }
    
    // 模块测试结果图表
    const ctx = document.getElementById('moduleChart').getContext('2d');
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ${JSON.stringify(moduleChartData.map(d => d.module))},
        datasets: [
          {
            label: '通过',
            data: ${JSON.stringify(moduleChartData.map(d => d.passed))},
            backgroundColor: 'rgba(75, 192, 192, 0.8)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1
          },
          {
            label: '失败',
            data: ${JSON.stringify(moduleChartData.map(d => d.failed))},
            backgroundColor: 'rgba(255, 99, 132, 0.8)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: '测试用例数量'
            }
          },
          x: {
            title: {
              display: true,
              text: '模块'
            }
          }
        }
      }
    });
  </script>
</body>
</html>
  `;
  
  return html;
}

// 主测试执行函数
async function runAllTests() {
  try {
    console.log('🔍 启动 SLA-Puzzle 功能测试套件');
    console.log('======================================================================');
    
    // 按顺序执行每个测试模块，确保一个模块完成后再执行下一个
    console.log('\n开始执行拼图生成模块测试...');
    await runPuzzleGenerationTests();
    
    console.log('\n开始执行游戏逻辑模块测试...');
    await runGameLogicTests();
    
    // 为了确保异步操作不互相干扰，在模块间添加短暂延迟
    await new Promise(resolve => setTimeout(resolve, 100));
    
    console.log('\n开始执行用户认证模块测试...');
    await runUserAuthTests();
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    console.log('\n开始执行成就系统模块测试...');
    await runAchievementSystemTests();
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    console.log('\n开始执行排行榜模块测试...');
    await runLeaderboardTests();
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    console.log('\n开始执行拼图形状模块测试...');
    await runPuzzleShapesTests();
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    console.log('\n开始执行多人对战模块测试...');
    await runMultiplayerTests();
    
    // 生成测试报告
    const reportHtml = generateTestReport();
    const reportFileName = `feature_test_report_${new Date().toISOString().replace(/[:.]/g, '-')}.html`;
    
    // 输出控制台总结
    console.log('\n\n=================== 功能测试总结 ===================');
    console.log(`总测试用例数: ${testResults.totalTests}`);
    console.log(`通过测试: ${testResults.passedTests} (${(testResults.passedTests / testResults.totalTests * 100).toFixed(2)}%)`);
    console.log(`失败测试: ${testResults.failedTests} (${(testResults.failedTests / testResults.totalTests * 100).toFixed(2)}%)`);
    console.log('--------------------------------------------------------');
    
    // 按模块输出结果
    Object.keys(testResults.moduleResults).forEach(module => {
      const moduleResult = testResults.moduleResults[module];
      const passRate = (moduleResult.passed / moduleResult.total) * 100;
      console.log(`[${getModuleDisplayName(module)}]: 通过 ${moduleResult.passed}/${moduleResult.total} (${passRate.toFixed(2)}%)`);
    });
    console.log('========================================================');
    
    // 保存报告
    if (typeof process !== 'undefined' && process.versions && process.versions.node) {
      // Node.js环境 - 更可靠的检测方法
      try {
        // 同时支持CommonJS和ES模块
        let fs;
        try {
          // 尝试CommonJS方式
          fs = require('fs');
        } catch (requireError) {
          // 如果require失败，尝试动态import
          try {
            const fsModule = await import('fs');
            fs = fsModule.default || fsModule;
          } catch (importError) {
            // 如果两种方式都失败，回退到打印HTML内容
            console.log('⚠️ 无法保存测试报告，但可以在控制台查看HTML内容：');
            console.log(reportHtml);
            return;
          }
        }
        
        fs.writeFileSync(reportFileName, reportHtml);
        console.log(`✅ HTML测试报告已保存至: ${reportFileName}`);
      } catch (fsError) {
        console.error('❌ 保存测试报告失败:', fsError);
      }
    } else {
      // 浏览器环境 - 避免在Node.js环境中引用document
      console.log('⚠️ 浏览器环境：测试报告已生成但未保存');
    }
    
  } catch (error) {
    console.error('❌ 测试套件执行过程中发生错误:', error);
    
    // 即使发生错误，也尝试生成测试报告
    try {
      const reportHtml = generateTestReport();
      const reportFileName = `feature_test_report_error_${new Date().toISOString().replace(/[:.]/g, '-')}.html`;
      
      if (typeof require !== 'undefined') {
        const fs = require('fs');
        fs.writeFileSync(reportFileName, reportHtml);
        console.log(`✅ 错误情况下的HTML测试报告已保存至: ${reportFileName}`);
      }
    } catch (reportError) {
      console.error('❌ 生成错误报告时发生错误:', reportError);
    }
  }
}

// 启动测试套件
if (typeof window !== 'undefined') {
  // 浏览器环境
  window.onload = runAllTests;
} else {
  // Node.js环境
  runAllTests();
}