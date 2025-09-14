/**
 * SLA-Puzzle 一小时性能压力测试脚本
 * 专门为一小时重点测试设计，模拟用户连续游戏一小时的场景
 * 收集关键性能指标，包括游戏完成数量、平均耗时、错误率等
 */

console.log('🚀 启动 SLA-Puzzle 一小时性能压力测试');
console.log('='.repeat(60));

// 测试配置
const TEST_CONFIG = {
  duration: 3600000, // 测试持续时间（毫秒）- 1小时
  gameTimeout: 30000, // 每个游戏的超时时间（毫秒）
  maxRetries: 3, // 失败后的最大重试次数
  logInterval: 10, // 每完成多少局游戏记录一次日志
  screenshotInterval: 50, // 每完成多少局游戏截取一次性能数据
};

// 测试统计数据
const testStats = {
  totalGames: 0,
  completedGames: 0,
  failedGames: 0,
  totalDuration: 0,
  totalRenderTime: 0,
  totalGameTime: 0,
  errors: [],
  performanceMetrics: [],
  difficultyDistribution: {
    easy: 0,
    medium: 0,
    hard: 0,
    expert: 0
  },
  startTime: new Date(),
  endTime: null
};

// 模拟拼图配置生成器
class MockPuzzleGenerator {
  constructor() {
    // 初始化模拟生成器
  }

  async generatePuzzle(options) {
    // 模拟生成拼图的异步过程
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          const { difficulty, pieceShape = 'square' } = options;
          
          // 根据难度确定网格大小
          let gridSize;
          switch (difficulty) {
            case 'easy':
              gridSize = { rows: 3, cols: 3 };
              break;
            case 'medium':
              gridSize = { rows: 4, cols: 4 };
              break;
            case 'hard':
              gridSize = { rows: 5, cols: 5 };
              break;
            case 'expert':
              gridSize = { rows: 6, cols: 6 };
              break;
            default:
              gridSize = { rows: 3, cols: 3 };
          }

          // 生成拼图块
          const totalPieces = gridSize.rows * gridSize.cols;
          const pieces = [];
          
          for (let i = 0; i < totalPieces; i++) {
            pieces.push({
              id: `piece_${i}`,
              originalIndex: i,
              currentSlot: null,
              correctSlot: i,
              rotation: 0,
              isFlipped: false,
              correctRotation: 0,
              imageData: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzIyMjIyMiIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjZmZmIj5QaWVjZTwvdGV4dD48L3N2Zz4=',
              width: 100,
              height: 100,
              shape: pieceShape
            });
          }

          // 返回拼图配置
          resolve({
            id: `puzzle_${Date.now()}`,
            name: `Test Puzzle ${difficulty}`,
            originalImage: options.imageData || 'test_image.jpg',
            gridSize: gridSize,
            pieceShape: pieceShape,
            difficulty: difficulty,
            pieces: pieces,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        } catch (error) {
          reject(error);
        }
      }, 200 + Math.random() * 300); // 模拟200-500ms的生成时间
    });
  }
}

// 模拟游戏状态管理器
class MockGameStateManager {
  constructor() {
    this.gameState = null;
  }

  initializeGame(puzzleConfig) {
    // 初始化游戏状态
    this.gameState = {
      config: puzzleConfig,
      startTime: new Date(),
      moves: 0,
      isCompleted: false,
      elapsedTime: 0,
      history: [],
      answerGrid: new Array(puzzleConfig.gridSize.rows * puzzleConfig.gridSize.cols).fill(null)
    };
  }

  async simulateGamePlay() {
    return new Promise((resolve) => {
      if (!this.gameState) {
        resolve({ success: false, error: '游戏未初始化' });
        return;
      }

      const { difficulty } = this.gameState.config;
      
      // 根据难度模拟游戏完成时间和步数
      let baseTime, baseMoves, variability;
      switch (difficulty) {
        case 'easy':
          baseTime = 120; // 2分钟
          baseMoves = 20;
          variability = 0.3;
          break;
        case 'medium':
          baseTime = 240; // 4分钟
          baseMoves = 40;
          variability = 0.35;
          break;
        case 'hard':
          baseTime = 420; // 7分钟
          baseMoves = 80;
          variability = 0.4;
          break;
        case 'expert':
          baseTime = 600; // 10分钟
          baseMoves = 150;
          variability = 0.45;
          break;
        default:
          baseTime = 120;
          baseMoves = 20;
          variability = 0.3;
      }

      // 生成随机的完成时间和步数
      const randomFactor = 1 + (Math.random() * 2 * variability - variability);
      const completionTime = Math.floor(baseTime * randomFactor);
      const moves = Math.floor(baseMoves * randomFactor);

      // 模拟游戏过程
      setTimeout(() => {
        this.gameState.isCompleted = true;
        this.gameState.elapsedTime = completionTime;
        this.gameState.moves = moves;
        this.gameState.endTime = new Date();

        resolve({
          success: true,
          completionTime: completionTime,
          moves: moves,
          difficulty: difficulty,
          gridSize: `${this.gameState.config.gridSize.rows}x${this.gameState.config.gridSize.cols}`,
          timestamp: this.gameState.endTime
        });
      }, 100 + Math.random() * 200); // 模拟游戏处理时间
    });
  }
}

// 模拟奖励系统
class MockRewardSystem {
  calculateRewards(gameResult) {
    const { difficulty, completionTime, moves } = gameResult;
    
    // 基础奖励
    let baseCoins, baseExperience;
    switch (difficulty) {
      case 'easy':
        baseCoins = 10;
        baseExperience = 20;
        break;
      case 'medium':
        baseCoins = 20;
        baseExperience = 40;
        break;
      case 'hard':
        baseCoins = 35;
        baseExperience = 70;
        break;
      case 'expert':
        baseCoins = 50;
        baseExperience = 100;
        break;
      default:
        baseCoins = 10;
        baseExperience = 20;
    }

    // 时间奖励加成（完成越快奖励越多）
    let timeBonus = 1;
    switch (difficulty) {
      case 'easy':
        timeBonus = completionTime <= 60 ? 1.5 : (completionTime <= 120 ? 1.2 : 1);
        break;
      case 'medium':
        timeBonus = completionTime <= 120 ? 1.5 : (completionTime <= 240 ? 1.2 : 1);
        break;
      case 'hard':
        timeBonus = completionTime <= 240 ? 1.5 : (completionTime <= 420 ? 1.2 : 1);
        break;
      case 'expert':
        timeBonus = completionTime <= 360 ? 1.5 : (completionTime <= 600 ? 1.2 : 1);
        break;
    }

    // 计算最终奖励
    const coins = Math.floor(baseCoins * timeBonus);
    const experience = Math.floor(baseExperience * timeBonus);

    return { coins, experience };
  }
}

// 性能监控工具
class PerformanceMonitor {
  constructor() {
    this.metrics = [];
    this.startTime = null;
  }

  start() {
    this.startTime = performance.now();
    if (performance.memory) {
      return {
        memory: performance.memory.usedJSHeapSize,
        startTime: this.startTime
      };
    }
    return { startTime: this.startTime };
  }

  end(startMetrics) {
    const endTime = performance.now();
    const duration = endTime - startMetrics.startTime;
    
    const metrics = {
      duration: duration,
      timestamp: new Date().toISOString()
    };

    if (performance.memory) {
      metrics.memoryBefore = startMetrics.memory;
      metrics.memoryAfter = performance.memory.usedJSHeapSize;
      metrics.memoryUsed = performance.memory.usedJSHeapSize - startMetrics.memory;
    }

    this.metrics.push(metrics);
    return metrics;
  }

  getAverageDuration() {
    if (this.metrics.length === 0) return 0;
    const total = this.metrics.reduce((sum, m) => sum + m.duration, 0);
    return total / this.metrics.length;
  }

  getMemoryStats() {
    if (!performance.memory || this.metrics.length === 0) {
      return null;
    }
    
    const memoryUsed = this.metrics
      .filter(m => m.memoryUsed !== undefined)
      .map(m => m.memoryUsed);
    
    if (memoryUsed.length === 0) return null;
    
    const totalMemoryUsed = memoryUsed.reduce((sum, m) => sum + m, 0);
    const avgMemoryUsed = totalMemoryUsed / memoryUsed.length;
    const peakMemoryUsed = Math.max(...memoryUsed);
    
    return {
      average: avgMemoryUsed,
      peak: peakMemoryUsed,
      total: totalMemoryUsed,
      count: memoryUsed.length
    };
  }
}

// 工具函数
function formatTime(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  return `${hours.toString().padStart(2, '0')}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
}

function formatMemory(bytes) {
  if (!bytes) return 'N/A';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

// 记录性能数据
function recordPerformanceData() {
  const elapsed = Date.now() - testStats.startTime;
  const elapsedHours = elapsed / 3600000;
  const gamesPerHour = testStats.completedGames / elapsedHours;
  const avgDuration = testStats.totalGameTime / testStats.completedGames;
  
  // 收集性能数据点
  testStats.performanceMetrics.push({
    timestamp: new Date().toISOString(),
    elapsedTime: elapsed,
    completedGames: testStats.completedGames,
    failedGames: testStats.failedGames,
    gamesPerHour: gamesPerHour,
    averageGameDuration: avgDuration,
    errorRate: testStats.failedGames / testStats.totalGames * 100
  });
}

// 生成HTML格式的测试报告
function generateHtmlReport() {
  const endTime = new Date();
  const duration = (endTime - testStats.startTime) / 1000;
  const avgGameTime = testStats.totalGameTime / testStats.completedGames;
  const errorRate = (testStats.failedGames / testStats.totalGames) * 100;
  
  // 准备图表数据
  const chartData = testStats.performanceMetrics.map(m => ({
    time: new Date(m.timestamp).toLocaleTimeString(),
    games: m.completedGames,
    errorRate: m.errorRate.toFixed(2)
  }));
  
  const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SLA-Puzzle 一小时性能测试报告</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }
    .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    h1 { color: #333; text-align: center; }
    .summary { display: flex; flex-wrap: wrap; gap: 20px; margin: 20px 0; }
    .summary-card { flex: 1; min-width: 200px; background: #f8f9fa; padding: 15px; border-radius: 6px; text-align: center; }
    .summary-card h3 { margin: 0 0 10px 0; color: #555; }
    .summary-card .value { font-size: 24px; font-weight: bold; color: #007bff; }
    .chart-container { margin: 30px 0; height: 400px; }
    .error-section { margin-top: 30px; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background-color: #f2f2f2; }
    .success { color: #28a745; }
    .error { color: #dc3545; }
  </style>
</head>
<body>
  <div class="container">
    <h1>SLA-Puzzle 一小时性能测试报告</h1>
    
    <div class="summary">
      <div class="summary-card">
        <h3>总游戏局数</h3>
        <div class="value">${testStats.totalGames}</div>
      </div>
      <div class="summary-card">
        <h3>成功完成</h3>
        <div class="value success">${testStats.completedGames}</div>
      </div>
      <div class="summary-card">
        <h3>失败次数</h3>
        <div class="value error">${testStats.failedGames}</div>
      </div>
      <div class="summary-card">
        <h3>错误率</h3>
        <div class="value">${errorRate.toFixed(2)}%</div>
      </div>
      <div class="summary-card">
        <h3>测试时长</h3>
        <div class="value">${formatTime(duration * 1000)}</div>
      </div>
      <div class="summary-card">
        <h3>平均每局耗时</h3>
        <div class="value">${formatTime(avgGameTime * 1000)}</div>
      </div>
    </div>
    
    <div class="chart-container">
      <canvas id="performanceChart"></canvas>
    </div>
    
    <div class="difficulty-section">
      <h2>难度分布</h2>
      <div class="chart-container">
        <canvas id="difficultyChart"></canvas>
      </div>
    </div>
    
    ${testStats.errors.length > 0 ? `
    <div class="error-section">
      <h2>错误记录</h2>
      <table>
        <tr><th>序号</th><th>错误类型</th><th>时间戳</th><th>详细信息</th></tr>
        ${testStats.errors.map((err, index) => `
        <tr><td>${index + 1}</td><td>${err.type || '未知'}</td><td>${err.timestamp}</td><td>${err.message}</td></tr>
        `).join('')}
      </table>
    </div>
    ` : ''}
  </div>
  
  <script>
    // 性能趋势图
    const performanceCtx = document.getElementById('performanceChart').getContext('2d');
    new Chart(performanceCtx, {
      type: 'line',
      data: {
        labels: ${JSON.stringify(chartData.map(d => d.time))},
        datasets: [
          {
            label: '完成游戏数',
            data: ${JSON.stringify(chartData.map(d => d.games))},
            borderColor: 'rgba(75, 192, 192, 1)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            yAxisID: 'y'
          },
          {
            label: '错误率(%)',
            data: ${JSON.stringify(chartData.map(d => d.errorRate))},
            borderColor: 'rgba(255, 99, 132, 1)',
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            yAxisID: 'y1'
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
              text: '完成游戏数'
            }
          },
          y1: {
            beginAtZero: true,
            position: 'right',
            title: {
              display: true,
              text: '错误率(%)'
            },
            grid: {
              drawOnChartArea: false
            }
          }
        }
      }
    });
    
    // 难度分布图
    const difficultyCtx = document.getElementById('difficultyChart').getContext('2d');
    new Chart(difficultyCtx, {
      type: 'bar',
      data: {
        labels: ['简单', '中等', '困难', '专家'],
        datasets: [{
          label: '游戏数量',
          data: ${JSON.stringify([
            testStats.difficultyDistribution.easy,
            testStats.difficultyDistribution.medium,
            testStats.difficultyDistribution.hard,
            testStats.difficultyDistribution.expert
          ])},
          backgroundColor: [
            'rgba(255, 99, 132, 0.5)',
            'rgba(54, 162, 235, 0.5)',
            'rgba(255, 206, 86, 0.5)',
            'rgba(75, 192, 192, 0.5)'
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)'
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: '游戏数量'
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

// 主测试函数
async function runHourlyTest() {
  const puzzleGenerator = new MockPuzzleGenerator();
  const gameStateManager = new MockGameStateManager();
  const rewardSystem = new MockRewardSystem();
  const performanceMonitor = new PerformanceMonitor();
  
  const startTime = Date.now();
  
  console.log(`开始时间: ${new Date(startTime).toLocaleString()}`);
  console.log(`测试时长: 1小时 (${TEST_CONFIG.duration / 1000}秒)`);
  console.log('='.repeat(60));
  
  try {
    // 运行测试直到达到时间限制
    while (Date.now() - startTime < TEST_CONFIG.duration) {
      testStats.totalGames++;
      let retries = 0;
      let success = false;
      
      // 选择随机难度（简单难度权重更高，模拟真实用户行为）
      const difficultyWeights = [
        { difficulty: 'easy', weight: 40 },
        { difficulty: 'medium', weight: 30 },
        { difficulty: 'hard', weight: 20 },
        { difficulty: 'expert', weight: 10 }
      ];
      
      let random = Math.random() * 100;
      let selectedDifficulty = 'easy';
      
      for (const item of difficultyWeights) {
        if (random < item.weight) {
          selectedDifficulty = item.difficulty;
          break;
        }
        random -= item.weight;
      }
      
      // 记录难度分布
      testStats.difficultyDistribution[selectedDifficulty]++;
      
      while (!success && retries < TEST_CONFIG.maxRetries) {
        try {
          // 生成拼图
          const perfStart = performanceMonitor.start();
          const puzzleConfig = await puzzleGenerator.generatePuzzle({
            difficulty: selectedDifficulty,
            pieceShape: ['square', 'triangle', 'tetris'][Math.floor(Math.random() * 3)],
            imageData: 'test_image.jpg'
          });
          const perfEnd = performanceMonitor.end(perfStart);
          testStats.totalRenderTime += perfEnd.duration;
          
          // 初始化游戏
          gameStateManager.initializeGame(puzzleConfig);
          
          // 模拟游戏过程
          const gameStart = Date.now();
          const gameResult = await gameStateManager.simulateGamePlay();
          const gameTime = Date.now() - gameStart;
          testStats.totalGameTime += gameTime;
          
          if (gameResult.success) {
            // 计算奖励
            const rewards = rewardSystem.calculateRewards(gameResult);
            
            success = true;
            testStats.completedGames++;
            
            // 每完成一定数量的游戏记录一次日志
            if (testStats.completedGames % TEST_CONFIG.logInterval === 0) {
              const elapsed = Date.now() - startTime;
              const progress = (elapsed / TEST_CONFIG.duration) * 100;
              const avgGameTime = testStats.totalGameTime / testStats.completedGames;
              
              console.log(`\n🎮 已完成 ${testStats.completedGames} 局游戏 (${progress.toFixed(1)}%)`);
              console.log(`   平均每局耗时: ${formatTime(avgGameTime)}`);
              console.log(`   错误率: ${(testStats.failedGames / testStats.totalGames * 100).toFixed(2)}%`);
              console.log(`   预计剩余时间: ${formatTime(TEST_CONFIG.duration - elapsed)}`);
            }
            
            // 收集性能数据
            if (testStats.completedGames % TEST_CONFIG.screenshotInterval === 0) {
              recordPerformanceData();
            }
          } else {
            throw new Error('游戏模拟失败: ' + gameResult.error);
          }
        } catch (error) {
          retries++;
          if (retries >= TEST_CONFIG.maxRetries) {
            testStats.failedGames++;
            testStats.errors.push({
              timestamp: new Date().toISOString(),
              type: '游戏执行错误',
              message: error.message,
              difficulty: selectedDifficulty
            });
            console.error(`❌ 游戏 ${testStats.totalGames} 失败 (${retries}次重试后):`, error.message);
          } else {
            console.warn(`⚠️  游戏 ${testStats.totalGames} 尝试 ${retries} 失败，正在重试...`);
          }
        }
      }
      
      // 短暂休息，避免过度占用资源
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  } catch (error) {
    console.error('❌ 测试过程中发生严重错误:', error);
    testStats.errors.push({
      timestamp: new Date().toISOString(),
      type: '测试框架错误',
      message: error.message
    });
  } finally {
    // 测试结束，生成报告
    testStats.endTime = new Date();
    testStats.totalDuration = testStats.endTime - testStats.startTime;
    
    // 确保记录最后一组性能数据
    recordPerformanceData();
    
    // 生成HTML报告
    const htmlReport = generateHtmlReport();
    const reportFileName = `hourly_test_report_${new Date().toISOString().replace(/[:.]/g, '-')}.html`;
    
    // 在Node.js环境中保存文件
    if (typeof process !== 'undefined' && process.versions && process.versions.node) {
      // 更可靠的Node.js环境检测
      try {
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
            console.error('❌ 无法保存测试报告:', importError);
            return;
          }
        }
        
        fs.writeFileSync(reportFileName, htmlReport);
        console.log(`\n✅ HTML测试报告已保存至: ${reportFileName}`);
      } catch (fsError) {
        console.error('❌ 保存测试报告失败:', fsError);
      }
    } else if (typeof document !== 'undefined') {
      // 确保在浏览器环境中才使用document对象
      try {
        // 在浏览器环境中，提供下载链接
        const blob = new Blob([htmlReport], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = reportFileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        console.log(`\n✅ HTML测试报告已下载: ${reportFileName}`);
      } catch (browserError) {
        console.error('❌ 生成下载链接失败:', browserError);
      }
    } else {
      console.log('\n⚠️ 无法保存测试报告，当前环境既不是Node.js也不是浏览器');
      console.log('测试报告内容已在控制台打印完毕');
    }
    
    // 输出控制台总结报告
    console.log('\n\n=================== 一小时性能测试总结 ===================');
    console.log(`开始时间: ${testStats.startTime.toLocaleString()}`);
    console.log(`结束时间: ${testStats.endTime.toLocaleString()}`);
    console.log(`总测试时长: ${formatTime(testStats.totalDuration)}`);
    console.log('--------------------------------------------------------');
    console.log(`总游戏局数: ${testStats.totalGames}`);
    console.log(`成功完成: ${testStats.completedGames} (${(testStats.completedGames / testStats.totalGames * 100).toFixed(2)}%)`);
    console.log(`失败次数: ${testStats.failedGames} (${(testStats.failedGames / testStats.totalGames * 100).toFixed(2)}%)`);
    console.log('--------------------------------------------------------');
    console.log(`平均每局游戏时间: ${formatTime(testStats.totalGameTime / testStats.completedGames)}`);
    console.log(`平均拼图渲染时间: ${(testStats.totalRenderTime / testStats.completedGames).toFixed(2)}ms`);
    console.log('--------------------------------------------------------');
    console.log('难度分布:');
    console.log(`   简单: ${testStats.difficultyDistribution.easy} 局`);
    console.log(`   中等: ${testStats.difficultyDistribution.medium} 局`);
    console.log(`   困难: ${testStats.difficultyDistribution.hard} 局`);
    console.log(`   专家: ${testStats.difficultyDistribution.expert} 局`);
    console.log('--------------------------------------------------------');
    if (testStats.errors.length > 0) {
      console.log(`错误详情 (共 ${testStats.errors.length} 个):`);
      testStats.errors.slice(0, 5).forEach((err, index) => {
        console.log(`   ${index + 1}. [${err.type}] ${err.message}`);
      });
      if (testStats.errors.length > 5) {
        console.log(`   ... 还有 ${testStats.errors.length - 5} 个错误，详见HTML报告`);
      }
    } else {
      console.log('✅ 无错误记录');
    }
    console.log('========================================================');
    
    // 如果有性能监控数据，输出内存使用情况
    const memoryStats = performanceMonitor.getMemoryStats();
    if (memoryStats) {
      console.log('\n内存使用统计:');
      console.log(`   平均每局内存增长: ${formatMemory(memoryStats.average)}`);
      console.log(`   峰值内存增长: ${formatMemory(memoryStats.peak)}`);
      console.log('========================================================');
    }
  }
}

// 启动测试
if (typeof window !== 'undefined') {
  // 浏览器环境
  window.onload = runHourlyTest;
} else {
  // Node.js环境
  runHourlyTest();
}