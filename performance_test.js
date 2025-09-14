// SLA-Puzzle 性能测试代码
// 基于 COMPREHENSIVE_TEST_DOCUMENTATION.md 中的性能测试方案

console.log('======================================');
console.log('SLA-Puzzle 性能测试套件启动');
console.log('======================================');

// 测试结果收集对象
const performanceResults = {
  pageLoad: {},
  puzzleRendering: {},
  memoryUsage: {},
  responsiveness: {},
  testDate: new Date().toISOString()
};

// 环境检测函数
function detectEnvironment() {
  const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';
  const isNode = typeof process !== 'undefined' && process.versions && process.versions.node;
  
  return {
    isBrowser,
    isNode,
    browser: isBrowser ? {
      name: navigator.userAgent.includes('Chrome') ? 'Chrome' : 
            navigator.userAgent.includes('Firefox') ? 'Firefox' :
            navigator.userAgent.includes('Safari') ? 'Safari' :
            navigator.userAgent.includes('Edge') ? 'Edge' : 'Unknown',
      version: navigator.userAgent.match(/(Chrome|Firefox|Safari|Edge)\/([0-9.]+)/)?.[2] || 'Unknown',
      device: /Mobile|Tablet/.test(navigator.userAgent) ? 'Mobile' : 'Desktop',
      screenWidth: window.screen.width,
      screenHeight: window.screen.height
    } : null,
    nodeVersion: isNode ? process.versions.node : null,
    os: isNode ? process.platform : navigator.platform
  };
}

// 环境信息
const environment = detectEnvironment();
console.log('测试环境:', environment);

// 检查是否在浏览器环境中运行
if (!environment.isBrowser) {
  console.error('❌ 此性能测试需要在浏览器环境中运行，因为它依赖浏览器特定的API');
  console.log('======================================');
  if (typeof process !== 'undefined') process.exit(1);
}

// 等待DOM加载完成
function waitForDOMContentLoaded() {
  return new Promise(resolve => {
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      resolve();
    } else {
      document.addEventListener('DOMContentLoaded', resolve);
    }
  });
}

// 工具函数：测量执行时间
function measureTime(fn, label) {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  const duration = end - start;
  console.log(`${label}: ${duration.toFixed(2)}ms`);
  return { result, duration };
}

// 工具函数：延迟函数
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 工具函数：创建测试图片
function createTestImage(width = 500, height = 500) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  
  // 创建一个简单的测试图案
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#ff0000');
  gradient.addColorStop(0.5, '#00ff00');
  gradient.addColorStop(1, '#0000ff');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  
  return canvas.toDataURL('image/png');
}

// 1. 页面加载性能测试
async function runPageLoadPerformanceTest() {
  console.log('\n\n==================== 页面加载性能测试 ====================');
  
  if (typeof performance.getEntriesByType === 'function') {
    const paintEntries = performance.getEntriesByType('paint');
    const navigationEntries = performance.getEntriesByType('navigation');
    
    // FCP 测量
    const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');
    if (fcpEntry) {
      const fcpTime = fcpEntry.startTime;
      performanceResults.pageLoad.fcp = fcpTime;
      console.log(`✅ 首次内容绘制 (FCP): ${fcpTime.toFixed(2)}ms`);
      console.log(`   目标值: < 1000ms`);
      console.log(`   状态: ${fcpTime < 1000 ? '通过' : '未通过'}`);
    }
    
    // LCP 测量
    if (' LargestContentfulPaint' in window) {
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        const lcpTime = lastEntry.renderTime || lastEntry.loadTime;
        performanceResults.pageLoad.lcp = lcpTime;
        console.log(`✅ 最大内容绘制 (LCP): ${lcpTime.toFixed(2)}ms`);
        console.log(`   目标值: < 2500ms`);
        console.log(`   状态: ${lcpTime < 2500 ? '通过' : '未通过'}`);
      }).observe({ type: 'largest-contentful-paint', buffered: true });
    }
    
    // 导航性能
    if (navigationEntries.length > 0) {
      const navEntry = navigationEntries[0];
      performanceResults.pageLoad.navigation = {
        domContentLoaded: navEntry.domContentLoadedEventEnd - navEntry.startTime,
        loadEvent: navEntry.loadEventEnd - navEntry.startTime,
        firstPaint: navEntry.responseEnd - navEntry.startTime
      };
      
      console.log(`✅ DOMContentLoaded: ${(navEntry.domContentLoadedEventEnd - navEntry.startTime).toFixed(2)}ms`);
      console.log(`✅ Load Event: ${(navEntry.loadEventEnd - navEntry.startTime).toFixed(2)}ms`);
    }
  }
  
  // 模拟游戏页面加载测试
  console.log('\n模拟游戏页面加载测试:');
  await simulatePageLoad('game');
  
  // 模拟编辑器页面加载测试
  console.log('\n模拟编辑器页面加载测试:');
  await simulatePageLoad('editor');
}

// 模拟页面加载
async function simulatePageLoad(pageType) {
  const start = performance.now();
  
  // 模拟页面资源加载
  const resources = [];
  for (let i = 0; i < (pageType === 'game' ? 10 : 15); i++) {
    resources.push(new Promise(resolve => {
      const img = new Image();
      img.src = createTestImage(100, 100);
      img.onload = resolve;
    }));
  }
  
  await Promise.all(resources);
  
  const loadTime = performance.now() - start;
  const targetTime = pageType === 'game' ? 1500 : 1500; // 游戏和编辑器页面目标加载时间
  
  performanceResults.pageLoad[`${pageType}PageLoad`] = loadTime;
  
  console.log(`✅ ${pageType === 'game' ? '游戏' : '编辑器'}页面模拟加载时间: ${loadTime.toFixed(2)}ms`);
  console.log(`   目标值: < ${targetTime}ms`);
  console.log(`   状态: ${loadTime < targetTime ? '通过' : '未通过'}`);
}

// 2. 拼图渲染性能测试
async function runPuzzleRenderingPerformanceTest() {
  console.log('\n\n==================== 拼图渲染性能测试 ====================');
  
  const testImage = createTestImage();
  
  // 测试不同难度的拼图渲染
  const difficulties = [
    { name: '简单(3×3)', size: 3, targetTime: 300 },
    { name: '中等(4×4)', size: 4, targetTime: 500 },
    { name: '困难(5×5)', size: 5, targetTime: 800 },
    { name: '专家(6×6)', size: 6, targetTime: 1200 }
  ];
  
  for (const difficulty of difficulties) {
    const renderTime = await testPuzzleRendering(difficulty.size, 'square', testImage);
    performanceResults.puzzleRendering[`${difficulty.name}`] = renderTime;
    
    console.log(`✅ ${difficulty.name}方形拼图渲染时间: ${renderTime.toFixed(2)}ms`);
    console.log(`   目标值: < ${difficulty.targetTime}ms`);
    console.log(`   状态: ${renderTime < difficulty.targetTime ? '通过' : '未通过'}`);
    
    await delay(500); // 短暂休息，避免浏览器过载
  }
  
  // 测试不同形状的拼图渲染（4×4尺寸）
  console.log('\n不同形状拼图渲染测试 (4×4):');
  const shapes = [
    { name: '方形', type: 'square', targetTime: 500 },
    { name: '三角形', type: 'triangle', targetTime: 600 },
    { name: '异形', type: 'irregular', targetTime: 700 },
    { name: '俄罗斯方块', type: 'tetris', targetTime: 400 }
  ];
  
  for (const shape of shapes) {
    const renderTime = await testPuzzleRendering(4, shape.type, testImage);
    performanceResults.puzzleRendering[`${shape.name}拼图(4×4)`] = renderTime;
    
    console.log(`✅ ${shape.name}拼图渲染时间: ${renderTime.toFixed(2)}ms`);
    console.log(`   目标值: < ${shape.targetTime}ms`);
    console.log(`   状态: ${renderTime < shape.targetTime ? '通过' : '未通过'}`);
    
    await delay(500); // 短暂休息
  }
  
  // 测试FPS性能
  await testFPS();
}

// 测试拼图渲染时间
function testPuzzleRendering(gridSize, shapeType, imageData) {
  return new Promise(resolve => {
    try {
      const start = performance.now();
      
      // 模拟拼图生成和渲染过程
      // 在实际应用中，这里应该调用真实的拼图生成函数
      const puzzleContainer = document.createElement('div');
      puzzleContainer.style.position = 'absolute';
      puzzleContainer.style.top = '-10000px';
      document.body.appendChild(puzzleContainer);
      
      // 模拟生成拼图块
      const totalPieces = gridSize * gridSize;
      for (let i = 0; i < totalPieces; i++) {
        const piece = document.createElement('div');
        piece.style.width = `${100/gridSize}px`;
        piece.style.height = `${100/gridSize}px`;
        piece.style.backgroundImage = `url(${imageData})`;
        piece.style.backgroundSize = `${gridSize * 100}px ${gridSize * 100}px`;
        piece.style.position = 'absolute';
        piece.style.left = `${Math.random() * 500}px`;
        piece.style.top = `${Math.random() * 500}px`;
        puzzleContainer.appendChild(piece);
      }
      
      // 使用requestAnimationFrame确保渲染完成
      requestAnimationFrame(() => {
        setTimeout(() => {
          const end = performance.now();
          const renderTime = end - start;
          
          // 清理DOM
          document.body.removeChild(puzzleContainer);
          
          resolve(renderTime);
        }, 50);
      });
    } catch (error) {
      console.error(`❌ 拼图渲染测试失败:`, error);
      resolve(9999); // 失败时返回大值
    }
  });
}

// 测试FPS性能
async function testFPS() {
  console.log('\n测试FPS性能:');
  
  // 创建一个动画测试区域
  const testArea = document.createElement('div');
  testArea.style.position = 'absolute';
  testArea.style.top = '-10000px';
  document.body.appendChild(testArea);
  
  // 创建移动元素
  const movingElements = [];
  for (let i = 0; i < 30; i++) { // 创建30个移动元素模拟复杂场景
    const element = document.createElement('div');
    element.style.width = '20px';
    element.style.height = '20px';
    element.style.backgroundColor = `rgb(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255})`;
    element.style.position = 'absolute';
    element.style.left = `${Math.random() * 500}px`;
    element.style.top = `${Math.random() * 500}px`;
    element.dataset.vx = (Math.random() - 0.5) * 4;
    element.dataset.vy = (Math.random() - 0.5) * 4;
    testArea.appendChild(element);
    movingElements.push(element);
  }
  
  // 运行动画并测量FPS
  let frameCount = 0;
  const startTime = performance.now();
  const duration = 3000; // 测试3秒
  
  await new Promise(resolve => {
    function animate(timestamp) {
      // 更新元素位置
      movingElements.forEach(element => {
        const x = parseFloat(element.style.left);
        const y = parseFloat(element.style.top);
        const vx = parseFloat(element.dataset.vx);
        const vy = parseFloat(element.dataset.vy);
        
        let newX = x + vx;
        let newY = y + vy;
        
        // 边界检测
        if (newX < 0 || newX > 480) element.dataset.vx = -vx;
        if (newY < 0 || newY > 480) element.dataset.vy = -vy;
        
        element.style.left = `${newX}px`;
        element.style.top = `${newY}px`;
      });
      
      frameCount++;
      
      if (performance.now() - startTime < duration) {
        requestAnimationFrame(animate);
      } else {
        resolve();
      }
    }
    
    requestAnimationFrame(animate);
  });
  
  // 计算FPS
  const elapsedTime = performance.now() - startTime;
  const fps = (frameCount / (elapsedTime / 1000)).toFixed(1);
  
  // 清理DOM
  document.body.removeChild(testArea);
  
  performanceResults.puzzleRendering.fps = fps;
  console.log(`✅ 动画FPS测试结果: ${fps}fps`);
  console.log(`   目标值 (拼图拖拽): > 50fps`);
  console.log(`   目标值 (多人对战): > 45fps`);
  console.log(`   状态: ${parseFloat(fps) > 50 ? '优秀' : parseFloat(fps) > 45 ? '良好' : '未通过'}`);
}

// 3. 内存使用情况测试
async function runMemoryUsageTest() {
  console.log('\n\n==================== 内存使用情况测试 ====================');
  
  // 检查是否支持performance.memory
  if (!performance.memory) {
    console.warn('⚠️ 当前浏览器不支持performance.memory API，无法进行内存使用测试');
    return;
  }
  
  // 初始内存快照
  const initialMemory = performance.memory.usedJSHeapSize;
  console.log(`初始内存使用: ${(initialMemory / (1024 * 1024)).toFixed(2)}MB`);
  
  // 测试游戏运行内存占用
  console.log('\n测试游戏运行内存占用:');
  await simulateGamePlay();
  
  const gameMemory = performance.memory.usedJSHeapSize;
  const gameMemoryMB = (gameMemory / (1024 * 1024)).toFixed(2);
  performanceResults.memoryUsage.gameRunning = gameMemoryMB;
  
  console.log(`✅ 游戏运行内存占用: ${gameMemoryMB}MB`);
  console.log(`   目标值: < 500MB`);
  console.log(`   状态: ${parseFloat(gameMemoryMB) < 500 ? '通过' : '未通过'}`);
  
  // 测试连续多局游戏内存增长
  console.log('\n测试连续多局游戏内存增长:');
  const memoryBefore = performance.memory.usedJSHeapSize;
  
  for (let i = 0; i < 5; i++) {
    console.log(`正在运行第${i+1}局游戏...`);
    await simulateGamePlay();
    await delay(1000);
  }
  
  const memoryAfter = performance.memory.usedJSHeapSize;
  const memoryGrowth = ((memoryAfter - memoryBefore) / (1024 * 1024)).toFixed(2);
  performanceResults.memoryUsage.memoryGrowth = memoryGrowth;
  
  console.log(`✅ 连续5局游戏内存增长: ${memoryGrowth}MB`);
  console.log(`   目标值: < 50MB`);
  console.log(`   状态: ${parseFloat(memoryGrowth) < 50 ? '通过' : '未通过'}`);
  
  // 测试大尺寸拼图内存占用
  console.log('\n测试大尺寸拼图内存占用 (6×6):');
  await simulateGamePlay(6, 'square');
  
  const largePuzzleMemory = ((performance.memory.usedJSHeapSize - initialMemory) / (1024 * 1024)).toFixed(2);
  performanceResults.memoryUsage.largePuzzle = largePuzzleMemory;
  
  console.log(`✅ 6×6拼图内存增量: ${largePuzzleMemory}MB`);
  console.log(`   目标值: < 800MB`);
  console.log(`   状态: ${parseFloat(largePuzzleMemory) < 800 ? '通过' : '未通过'}`);
  
  // 测试异形拼图内存占用
  console.log('\n测试异形拼图内存占用 (5×5):');
  await simulateGamePlay(5, 'irregular');
  
  const irregularPuzzleMemory = ((performance.memory.usedJSHeapSize - initialMemory) / (1024 * 1024)).toFixed(2);
  performanceResults.memoryUsage.irregularPuzzle = irregularPuzzleMemory;
  
  console.log(`✅ 5×5异形拼图内存增量: ${irregularPuzzleMemory}MB`);
  console.log(`   目标值: < 600MB`);
  console.log(`   状态: ${parseFloat(irregularPuzzleMemory) < 600 ? '通过' : '未通过'}`);
}

// 模拟游戏玩法
async function simulateGamePlay(gridSize = 4, shapeType = 'square') {
  const testImage = createTestImage();
  
  // 创建临时容器
  const tempContainer = document.createElement('div');
  tempContainer.style.position = 'absolute';
  tempContainer.style.top = '-10000px';
  document.body.appendChild(tempContainer);
  
  try {
    // 模拟拼图生成
    const totalPieces = gridSize * gridSize;
    const puzzlePieces = [];
    
    for (let i = 0; i < totalPieces; i++) {
      const piece = document.createElement('div');
      piece.style.width = `${800/gridSize}px`;
      piece.style.height = `${800/gridSize}px`;
      piece.style.backgroundImage = `url(${testImage})`;
      piece.style.backgroundSize = `${gridSize * 800/gridSize}px ${gridSize * 800/gridSize}px`;
      piece.style.position = 'absolute';
      piece.style.left = `${Math.random() * 1000}px`;
      piece.style.top = `${Math.random() * 1000}px`;
      piece.style.cursor = 'move';
      
      // 为异形拼图添加更复杂的样式
      if (shapeType === 'irregular') {
        piece.style.borderRadius = `${Math.random() * 50}% ${Math.random() * 50}% ${Math.random() * 50}% ${Math.random() * 50}%`;
        piece.style.transform = `rotate(${Math.random() * 360}deg)`;
      }
      
      tempContainer.appendChild(piece);
      puzzlePieces.push(piece);
    }
    
    // 模拟拖拽操作
    for (let i = 0; i < 10; i++) {
      const randomPiece = puzzlePieces[Math.floor(Math.random() * puzzlePieces.length)];
      randomPiece.style.left = `${Math.random() * 1000}px`;
      randomPiece.style.top = `${Math.random() * 1000}px`;
      
      // 使用requestAnimationFrame确保动画帧被处理
      await new Promise(resolve => requestAnimationFrame(resolve));
    }
    
    // 短暂延迟以确保内存使用稳定
    await delay(500);
    
  } catch (error) {
    console.error(`❌ 游戏模拟失败:`, error);
  } finally {
    // 清理DOM
    document.body.removeChild(tempContainer);
  }
}

// 4. 响应式表现测试
async function runResponsivenessTest() {
  console.log('\n\n==================== 响应式表现测试 ====================');
  
  // 测试不同屏幕尺寸适配
  console.log('测试不同屏幕尺寸适配:');
  const viewportSizes = [
    { width: 360, height: 640 }, // 手机
    { width: 768, height: 1024 }, // 平板
    { width: 1920, height: 1080 } // 桌面
  ];
  
  for (const size of viewportSizes) {
    const adaptationTime = await testViewportAdaptation(size.width, size.height);
    performanceResults.responsiveness[`viewport${size.width}x${size.height}`] = adaptationTime;
    
    console.log(`✅ ${size.width}×${size.height} 视口适配时间: ${adaptationTime.toFixed(2)}ms`);
    console.log(`   目标值: < 200ms`);
    console.log(`   状态: ${adaptationTime < 200 ? '通过' : '未通过'}`);
    
    await delay(1000);
  }
  
  // 测试触摸操作响应（在移动设备上更准确）
  console.log('\n测试触摸操作响应:');
  const touchResponseTime = await testTouchResponse();
  performanceResults.responsiveness.touchResponse = touchResponseTime;
  
  console.log(`✅ 触摸操作响应时间: ${touchResponseTime.toFixed(2)}ms`);
  console.log(`   目标值: < 100ms`);
  console.log(`   状态: ${touchResponseTime < 100 ? '通过' : '未通过'}`);
  
  // 测试横竖屏切换适配
  console.log('\n测试横竖屏切换适配:');
  const orientationChangeTime = await testOrientationChange();
  performanceResults.responsiveness.orientationChange = orientationChangeTime;
  
  console.log(`✅ 横竖屏切换适配时间: ${orientationChangeTime.toFixed(2)}ms`);
  console.log(`   目标值: < 300ms`);
  console.log(`   状态: ${orientationChangeTime < 300 ? '通过' : '未通过'}`);
}

// 测试视口适配时间
function testViewportAdaptation(width, height) {
  return new Promise(resolve => {
    try {
      // 创建一个测试容器，模拟响应式布局
      const testContainer = document.createElement('div');
      testContainer.style.position = 'absolute';
      testContainer.style.top = '-10000px';
      testContainer.style.width = '100%';
      testContainer.style.height = '100%';
      document.body.appendChild(testContainer);
      
      // 添加响应式元素
      const responsiveElement = document.createElement('div');
      responsiveElement.style.width = '100%';
      responsiveElement.style.height = '200px';
      responsiveElement.style.backgroundColor = 'blue';
      responsiveElement.style.transition = 'all 0.1s ease';
      
      // 添加响应式样式
      const style = document.createElement('style');
      style.textContent = `
        @media (max-width: ${width}px) {
          #test-responsive-element {
            background-color: red;
            height: 100px;
          }
        }
      `;
      document.head.appendChild(style);
      
      responsiveElement.id = 'test-responsive-element';
      testContainer.appendChild(responsiveElement);
      
      // 模拟视口尺寸变化
      const start = performance.now();
      
      // 强制重排和重绘
      testContainer.offsetHeight; // 触发重排
      
      // 观察元素样式变化
      const observer = new MutationObserver(mutations => {
        const end = performance.now();
        const adaptationTime = end - start;
        
        // 清理
        document.body.removeChild(testContainer);
        document.head.removeChild(style);
        observer.disconnect();
        
        resolve(adaptationTime);
      });
      
      observer.observe(responsiveElement, { attributes: true, attributeFilter: ['style'] });
      
      // 强制样式计算
      window.getComputedStyle(responsiveElement).backgroundColor;
      
    } catch (error) {
      console.error(`❌ 视口适配测试失败:`, error);
      resolve(9999);
    }
  });
}

// 测试触摸响应时间
function testTouchResponse() {
  return new Promise(resolve => {
    try {
      const testElement = document.createElement('div');
      testElement.style.width = '100px';
      testElement.style.height = '100px';
      testElement.style.backgroundColor = 'green';
      testElement.style.position = 'absolute';
      testElement.style.top = '-10000px';
      document.body.appendChild(testElement);
      
      let responseTime = 9999;
      
      // 创建触摸事件
      const touch = new Touch({
        identifier: Date.now(),
        target: testElement,
        clientX: 50,
        clientY: 50,
        pageX: 50,
        pageY: 50
      });
      
      const touchEvent = new TouchEvent('touchstart', {
        touches: [touch],
        targetTouches: [touch],
        changedTouches: [touch],
        bubbles: true,
        cancelable: true
      });
      
      // 设置事件监听器
      testElement.addEventListener('touchstart', () => {
        const end = performance.now();
        responseTime = end - start;
        
        // 清理
        document.body.removeChild(testElement);
        
        resolve(responseTime);
      }, { once: true });
      
      // 触发事件并计时
      const start = performance.now();
      testElement.dispatchEvent(touchEvent);
      
      // 超时处理
      setTimeout(() => {
        if (document.body.contains(testElement)) {
          document.body.removeChild(testElement);
          resolve(9999);
        }
      }, 1000);
      
    } catch (error) {
      console.error(`❌ 触摸响应测试失败:`, error);
      resolve(9999);
    }
  });
}

// 测试横竖屏切换适配
function testOrientationChange() {
  return new Promise(resolve => {
    try {
      // 创建测试容器
      const testContainer = document.createElement('div');
      testContainer.style.position = 'absolute';
      testContainer.style.top = '-10000px';
      testContainer.style.width = '100%';
      testContainer.style.height = '100%';
      document.body.appendChild(testContainer);
      
      // 添加响应式元素
      const landscapeElement = document.createElement('div');
      landscapeElement.id = 'test-landscape-element';
      landscapeElement.style.display = 'none';
      landscapeElement.style.width = '100%';
      landscapeElement.style.height = '100px';
      landscapeElement.style.backgroundColor = 'purple';
      testContainer.appendChild(landscapeElement);
      
      // 添加横竖屏样式
      const style = document.createElement('style');
      style.textContent = `
        @media screen and (orientation: landscape) {
          #test-landscape-element {
            display: block;
          }
        }
      `;
      document.head.appendChild(style);
      
      // 模拟横竖屏切换
      const start = performance.now();
      
      // 观察样式变化
      const observer = new MutationObserver(mutations => {
        const end = performance.now();
        const adaptationTime = end - start;
        
        // 清理
        document.body.removeChild(testContainer);
        document.head.removeChild(style);
        observer.disconnect();
        
        resolve(adaptationTime);
      });
      
      observer.observe(landscapeElement, { attributes: true, attributeFilter: ['style'] });
      
      // 强制样式重计算
      window.getComputedStyle(landscapeElement).display;
      
    } catch (error) {
      console.error(`❌ 横竖屏切换测试失败:`, error);
      resolve(9999);
    }
  });
}

// 保存测试结果
function saveTestResults() {
  console.log('\n\n==================== 测试结果汇总 ====================');
  
  // 将结果转换为格式化的字符串
  const formattedResults = JSON.stringify(performanceResults, null, 2);
  
  // 打印到控制台
  console.log('性能测试结果:');
  console.log(formattedResults);
  
  // 保存到localStorage
  try {
    localStorage.setItem('slaPuzzlePerformanceResults', formattedResults);
    console.log('\n✅ 测试结果已保存到localStorage');
  } catch (error) {
    console.error('❌ 无法保存测试结果到localStorage:', error);
  }
  
  // 下载结果文件
  try {
    const blob = new Blob([formattedResults], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sla-puzzle-performance-results-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    console.log('✅ 测试结果已下载为JSON文件');
  } catch (error) {
    console.error('❌ 无法下载测试结果文件:', error);
  }
}

// 生成HTML报告
function generateHTMLReport() {
  const reportHTML = `
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>SLA-Puzzle 性能测试报告</title>
      <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
      <style>
        body { font-family: Arial, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
        h1, h2 { color: #333; }
        .section { margin-bottom: 30px; padding: 20px; background-color: #f9f9f9; border-radius: 8px; }
        .result-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .result-table th, .result-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .result-table th { background-color: #4CAF50; color: white; }
        .pass { background-color: #d4edda; color: #155724; }
        .fail { background-color: #f8d7da; color: #721c24; }
        .chart-container { position: relative; height: 400px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <h1>SLA-Puzzle 性能测试报告</h1>
      <p>测试日期: ${performanceResults.testDate}</p>
      <p>测试环境: ${environment.isBrowser ? `${environment.browser.name} ${environment.browser.version} on ${environment.browser.device}` : 'Node.js ' + environment.nodeVersion}</p>
      
      <div class="section">
        <h2>页面加载性能</h2>
        <table class="result-table">
          <tr><th>测试项</th><th>实际值</th><th>目标值</th><th>状态</th></tr>
          <tr><td>首次内容绘制 (FCP)</td><td>${performanceResults.pageLoad.fcp ? performanceResults.pageLoad.fcp.toFixed(2) + 'ms' : 'N/A'}</td><td>&lt; 1000ms</td><td class="${performanceResults.pageLoad.fcp && performanceResults.pageLoad.fcp < 1000 ? 'pass' : 'fail'}">${performanceResults.pageLoad.fcp && performanceResults.pageLoad.fcp < 1000 ? '通过' : '未通过'}</td></tr>
          <tr><td>最大内容绘制 (LCP)</td><td>${performanceResults.pageLoad.lcp ? performanceResults.pageLoad.lcp.toFixed(2) + 'ms' : 'N/A'}</td><td>&lt; 2500ms</td><td class="${performanceResults.pageLoad.lcp && performanceResults.pageLoad.lcp < 2500 ? 'pass' : 'fail'}">${performanceResults.pageLoad.lcp && performanceResults.pageLoad.lcp < 2500 ? '通过' : '未通过'}</td></tr>
          <tr><td>游戏页面加载时间</td><td>${performanceResults.pageLoad.gamePageLoad ? performanceResults.pageLoad.gamePageLoad.toFixed(2) + 'ms' : 'N/A'}</td><td>&lt; 1500ms</td><td class="${performanceResults.pageLoad.gamePageLoad && performanceResults.pageLoad.gamePageLoad < 1500 ? 'pass' : 'fail'}">${performanceResults.pageLoad.gamePageLoad && performanceResults.pageLoad.gamePageLoad < 1500 ? '通过' : '未通过'}</td></tr>
          <tr><td>编辑器页面加载时间</td><td>${performanceResults.pageLoad.editorPageLoad ? performanceResults.pageLoad.editorPageLoad.toFixed(2) + 'ms' : 'N/A'}</td><td>&lt; 1500ms</td><td class="${performanceResults.pageLoad.editorPageLoad && performanceResults.pageLoad.editorPageLoad < 1500 ? 'pass' : 'fail'}">${performanceResults.pageLoad.editorPageLoad && performanceResults.pageLoad.editorPageLoad < 1500 ? '通过' : '未通过'}</td></tr>
        </table>
      </div>
      
      <div class="section">
        <h2>拼图渲染性能</h2>
        <div class="chart-container">
          <canvas id="renderingChart"></canvas>
        </div>
        <table class="result-table">
          <tr><th>测试项</th><th>实际值</th><th>目标值</th><th>状态</th></tr>
          <tr><td>简单(3×3)拼图渲染时间</td><td>${performanceResults.puzzleRendering['简单(3×3)'] ? performanceResults.puzzleRendering['简单(3×3)'].toFixed(2) + 'ms' : 'N/A'}</td><td>&lt; 300ms</td><td class="${performanceResults.puzzleRendering['简单(3×3)'] && performanceResults.puzzleRendering['简单(3×3)'] < 300 ? 'pass' : 'fail'}">${performanceResults.puzzleRendering['简单(3×3)'] && performanceResults.puzzleRendering['简单(3×3)'] < 300 ? '通过' : '未通过'}</td></tr>
          <tr><td>中等(4×4)拼图渲染时间</td><td>${performanceResults.puzzleRendering['中等(4×4)'] ? performanceResults.puzzleRendering['中等(4×4)'].toFixed(2) + 'ms' : 'N/A'}</td><td>&lt; 500ms</td><td class="${performanceResults.puzzleRendering['中等(4×4)'] && performanceResults.puzzleRendering['中等(4×4)'] < 500 ? 'pass' : 'fail'}">${performanceResults.puzzleRendering['中等(4×4)'] && performanceResults.puzzleRendering['中等(4×4)'] < 500 ? '通过' : '未通过'}</td></tr>
          <tr><td>困难(5×5)拼图渲染时间</td><td>${performanceResults.puzzleRendering['困难(5×5)'] ? performanceResults.puzzleRendering['困难(5×5)'].toFixed(2) + 'ms' : 'N/A'}</td><td>&lt; 800ms</td><td class="${performanceResults.puzzleRendering['困难(5×5)'] && performanceResults.puzzleRendering['困难(5×5)'] < 800 ? 'pass' : 'fail'}">${performanceResults.puzzleRendering['困难(5×5)'] && performanceResults.puzzleRendering['困难(5×5)'] < 800 ? '通过' : '未通过'}</td></tr>
          <tr><td>专家(6×6)拼图渲染时间</td><td>${performanceResults.puzzleRendering['专家(6×6)'] ? performanceResults.puzzleRendering['专家(6×6)'].toFixed(2) + 'ms' : 'N/A'}</td><td>&lt; 1200ms</td><td class="${performanceResults.puzzleRendering['专家(6×6)'] && performanceResults.puzzleRendering['专家(6×6)'] < 1200 ? 'pass' : 'fail'}">${performanceResults.puzzleRendering['专家(6×6)'] && performanceResults.puzzleRendering['专家(6×6)'] < 1200 ? '通过' : '未通过'}</td></tr>
          <tr><td>FPS性能</td><td>${performanceResults.puzzleRendering.fps ? performanceResults.puzzleRendering.fps + 'fps' : 'N/A'}</td><td>&gt; 50fps</td><td class="${performanceResults.puzzleRendering.fps && parseFloat(performanceResults.puzzleRendering.fps) > 50 ? 'pass' : 'fail'}">${performanceResults.puzzleRendering.fps && parseFloat(performanceResults.puzzleRendering.fps) > 50 ? '通过' : '未通过'}</td></tr>
        </table>
      </div>
      
      <div class="section">
        <h2>内存使用情况</h2>
        <div class="chart-container">
          <canvas id="memoryChart"></canvas>
        </div>
        <table class="result-table">
          <tr><th>测试项</th><th>实际值</th><th>目标值</th><th>状态</th></tr>
          <tr><td>游戏运行内存占用</td><td>${performanceResults.memoryUsage.gameRunning ? performanceResults.memoryUsage.gameRunning + 'MB' : 'N/A'}</td><td>&lt; 500MB</td><td class="${performanceResults.memoryUsage.gameRunning && parseFloat(performanceResults.memoryUsage.gameRunning) < 500 ? 'pass' : 'fail'}">${performanceResults.memoryUsage.gameRunning && parseFloat(performanceResults.memoryUsage.gameRunning) < 500 ? '通过' : '未通过'}</td></tr>
          <tr><td>连续多局游戏内存增长</td><td>${performanceResults.memoryUsage.memoryGrowth ? performanceResults.memoryUsage.memoryGrowth + 'MB' : 'N/A'}</td><td>&lt; 50MB</td><td class="${performanceResults.memoryUsage.memoryGrowth && parseFloat(performanceResults.memoryUsage.memoryGrowth) < 50 ? 'pass' : 'fail'}">${performanceResults.memoryUsage.memoryGrowth && parseFloat(performanceResults.memoryUsage.memoryGrowth) < 50 ? '通过' : '未通过'}</td></tr>
          <tr><td>6×6拼图内存占用</td><td>${performanceResults.memoryUsage.largePuzzle ? performanceResults.memoryUsage.largePuzzle + 'MB' : 'N/A'}</td><td>&lt; 800MB</td><td class="${performanceResults.memoryUsage.largePuzzle && parseFloat(performanceResults.memoryUsage.largePuzzle) < 800 ? 'pass' : 'fail'}">${performanceResults.memoryUsage.largePuzzle && parseFloat(performanceResults.memoryUsage.largePuzzle) < 800 ? '通过' : '未通过'}</td></tr>
        </table>
      </div>
      
      <div class="section">
        <h2>响应式表现</h2>
        <table class="result-table">
          <tr><th>测试项</th><th>实际值</th><th>目标值</th><th>状态</th></tr>
          <tr><td>不同屏幕尺寸适配</td><td>${performanceResults.responsiveness.viewport360x640 ? performanceResults.responsiveness.viewport360x640.toFixed(2) + 'ms' : 'N/A'}</td><td>&lt; 200ms</td><td class="${performanceResults.responsiveness.viewport360x640 && performanceResults.responsiveness.viewport360x640 < 200 ? 'pass' : 'fail'}">${performanceResults.responsiveness.viewport360x640 && performanceResults.responsiveness.viewport360x640 < 200 ? '通过' : '未通过'}</td></tr>
          <tr><td>触摸操作响应</td><td>${performanceResults.responsiveness.touchResponse ? performanceResults.responsiveness.touchResponse.toFixed(2) + 'ms' : 'N/A'}</td><td>&lt; 100ms</td><td class="${performanceResults.responsiveness.touchResponse && performanceResults.responsiveness.touchResponse < 100 ? 'pass' : 'fail'}">${performanceResults.responsiveness.touchResponse && performanceResults.responsiveness.touchResponse < 100 ? '通过' : '未通过'}</td></tr>
          <tr><td>横竖屏切换适配</td><td>${performanceResults.responsiveness.orientationChange ? performanceResults.responsiveness.orientationChange.toFixed(2) + 'ms' : 'N/A'}</td><td>&lt; 300ms</td><td class="${performanceResults.responsiveness.orientationChange && performanceResults.responsiveness.orientationChange < 300 ? 'pass' : 'fail'}">${performanceResults.responsiveness.orientationChange && performanceResults.responsiveness.orientationChange < 300 ? '通过' : '未通过'}</td></tr>
        </table>
      </div>
      
      <script>
        // 渲染图表
        document.addEventListener('DOMContentLoaded', function() {
          // 渲染性能图表
          const renderingCtx = document.getElementById('renderingChart').getContext('2d');
          const renderingChart = new Chart(renderingCtx, {
            type: 'bar',
            data: {
              labels: ['简单(3×3)', '中等(4×4)', '困难(5×5)', '专家(6×6)'],
              datasets: [{
                label: '渲染时间(ms)',
                data: [
                  ${performanceResults.puzzleRendering['简单(3×3)'] || 0},
                  ${performanceResults.puzzleRendering['中等(4×4)'] || 0},
                  ${performanceResults.puzzleRendering['困难(5×5)'] || 0},
                  ${performanceResults.puzzleRendering['专家(6×6)'] || 0}
                ],
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
              scales: {
                y: {
                  beginAtZero: true,
                  title: {
                    display: true,
                    text: '渲染时间(ms)'
                  }
                }
              },
              plugins: {
                title: {
                  display: true,
                  text: '不同难度拼图渲染时间对比'
                }
              }
            }
          });
          
          // 内存使用图表
          const memoryCtx = document.getElementById('memoryChart').getContext('2d');
          const memoryChart = new Chart(memoryCtx, {
            type: 'line',
            data: {
              labels: ['游戏运行内存', '连续多局内存增长', '6×6拼图内存'],
              datasets: [{
                label: '内存占用(MB)',
                data: [
                  ${performanceResults.memoryUsage.gameRunning || 0},
                  ${performanceResults.memoryUsage.memoryGrowth || 0},
                  ${performanceResults.memoryUsage.largePuzzle || 0}
                ],
                fill: false,
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
              }]
            },
            options: {
              responsive: true,
              scales: {
                y: {
                  beginAtZero: true,
                  title: {
                    display: true,
                    text: '内存占用(MB)'
                  }
                }
              },
              plugins: {
                title: {
                  display: true,
                  text: '内存使用情况'
                }
              }
            }
          });
        });
      </script>
    </body>
    </html>
  `;
  
  // 保存并打开报告
  try {
    const blob = new Blob([reportHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sla-puzzle-performance-report-${new Date().toISOString().replace(/[:.]/g, '-')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    console.log('✅ 性能测试HTML报告已生成并下载');
  } catch (error) {
    console.error('❌ 无法生成HTML报告:', error);
  }
}

// 主测试函数
async function runAllPerformanceTests() {
  await waitForDOMContentLoaded();
  
  try {
    // 1. 页面加载性能测试
    await runPageLoadPerformanceTest();
    
    // 2. 拼图渲染性能测试
    await runPuzzleRenderingPerformanceTest();
    
    // 3. 内存使用情况测试
    await runMemoryUsageTest();
    
    // 4. 响应式表现测试
    await runResponsivenessTest();
    
    // 保存测试结果
    saveTestResults();
    
    // 生成HTML报告
    generateHTMLReport();
    
  } catch (error) {
    console.error('❌ 性能测试套件执行失败:', error);
  }
  
  console.log('\n\n======================================');
  console.log('SLA-Puzzle 性能测试套件执行完成');
  console.log('======================================');
}

// 启动测试
runAllPerformanceTests();