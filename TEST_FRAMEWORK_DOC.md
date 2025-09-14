# SLA-Puzzle 功能测试框架文档

## 1. 框架概述

SLA-Puzzle 功能测试框架是一个专为拼图项目设计的综合性测试工具，用于验证项目核心功能模块的正确性和稳定性。该框架支持同步和异步测试用例，提供统一的测试执行流程、结果统计和可视化报告生成功能，同时兼容浏览器和Node.js环境。

## 2. 测试框架结构

测试框架采用模块化设计，主要由以下几个核心部分组成：

### 2.1 测试结果统计系统

```javascript
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
```

该系统负责跟踪所有测试用例的执行状态、耗时和错误信息，并按功能模块进行分类统计。

### 2.2 模拟API系统

框架提供了完整的模拟API系统，用于替代真实后端服务进行测试：

```javascript
const mockAPI = {
  generatePuzzle: async (options = {}) => { /* ... */ },
  generateTetrisPuzzle: async (options) => { /* ... */ },
  createMultiplayerGame: async (player1Id, player2Id, options) => { /* ... */ },
  authenticateUser: async (credentials) => { /* ... */ },
  // 更多API模拟...
};
```

每个API模拟函数都返回Promise，模拟真实的异步行为，并包含适当的延迟和错误处理逻辑。框架还提供了`createMockAPI()`函数，确保每个测试用例都使用独立的API实例，避免状态污染。

### 2.3 测试执行引擎

框架的核心是`testCase`函数，负责统一执行测试用例并管理测试结果：

```javascript
async function testCase(name, module, testFunction) {
  // 创建测试用例对象
  // 执行测试函数（支持同步和异步）
  // 记录测试结果和错误信息
  // 输出控制台日志
}
```

该函数支持同步和异步测试用例，能够自动捕获异常并更新测试统计数据。

### 2.4 断言工具集

框架提供了一套完整的断言工具函数，用于验证测试条件：

- `assert(condition, message)`: 验证条件是否为真
- `assertEquals(actual, expected, message)`: 验证两个值是否严格相等
- `assertDeepEquals(actual, expected, message)`: 验证两个对象或数组是否深度相等
- `assertThrows(testFunction, expectedError, message)`: 验证函数是否抛出预期的异常（同时支持同步和异步函数）

### 2.5 测试模块组织

框架按功能模块组织测试，每个模块对应一个专用的测试函数：

- `runPuzzleGenerationTests()`: 拼图生成模块测试
- `runGameLogicTests()`: 游戏逻辑模块测试
- `runUserAuthTests()`: 用户认证模块测试
- `runAchievementSystemTests()`: 成就系统模块测试
- `runLeaderboardTests()`: 排行榜模块测试
- `runPuzzleShapesTests()`: 拼图形状模块测试
- `runMultiplayerTests()`: 多人对战模块测试

### 2.6 测试报告生成

框架提供了强大的测试报告生成功能，包括：

```javascript
function generateTestReport() {
  // 生成HTML格式的测试报告
  // 包含测试统计摘要、图表和详细测试用例结果
}
```

报告包含以下内容：
- 测试总览统计（总用例数、通过率、耗时等）
- 模块测试结果可视化图表
- 详细测试用例列表（可按模块分组查看）
- 错误信息详情

### 2.7 主测试执行流程

`runAllTests()`函数是整个测试框架的入口点，负责按顺序执行所有测试模块并生成测试报告：

```javascript
async function runAllTests() {
  // 按顺序执行各个测试模块
  // 处理错误和异常
  // 生成和保存测试报告
}
```

## 3. 环境兼容性设计

测试框架设计为兼容浏览器和Node.js环境，采用以下策略：

### 3.1 环境检测

```javascript
// Node.js环境检测
if (typeof process !== 'undefined' && process.versions && process.versions.node) {
  // Node.js特定代码
}

// 浏览器环境检测
if (typeof window !== 'undefined') {
  // 浏览器特定代码
}
```

### 3.2 模块加载兼容

框架实现了同时支持CommonJS和ES模块的加载方案：

```javascript
// 同时支持CommonJS和ES模块的文件系统操作
let fs;
if (typeof process !== 'undefined' && process.versions && process.versions.node) {
  try {
    // 尝试CommonJS方式
    fs = require('fs');
  } catch (requireError) {
    // 如果require失败，尝试动态import
    try {
      const fsModule = await import('fs');
      fs = fsModule.default || fsModule;
    } catch (importError) {
      // 回退方案
    }
  }
}
```

## 4. 使用方法

### 4.1 执行完整测试套件

在Node.js环境中执行：

```bash
node feature_test_suite.js
```

在浏览器环境中，只需在HTML页面中引入该文件，框架会自动在`window.onload`事件中启动测试。

### 4.2 添加新的测试用例

要添加新的测试用例，请按照以下步骤操作：

1. 确定测试所属的模块
2. 在对应的测试模块函数中添加新的测试用例：

```javascript
await testCase('测试用例名称', '模块名称', async (api) => {
  // 使用api调用模拟接口
  const result = await api.someFunction();
  
  // 使用断言验证结果
  assert(result !== null, '结果不应为null');
  assertEquals(result.property, expectedValue, '属性值不匹配');
});
```

### 4.3 添加新的测试模块

要添加新的功能模块测试：

1. 在`testResults.moduleResults`中添加新的模块统计对象
2. 创建新的测试模块函数
3. 在`runAllTests()`函数中添加对新模块测试函数的调用

### 4.4 查看测试报告

测试完成后，框架会生成HTML格式的测试报告并保存到当前目录。文件名格式为：
`feature_test_report_${timestamp}.html`

报告包含详细的测试结果统计和可视化图表，可以在浏览器中打开查看。

## 5. 测试用例设计指南

### 5.1 测试用例结构

每个测试用例应遵循以下结构：

1. **准备阶段**：设置测试环境和输入参数
2. **执行阶段**：调用被测函数或API
3. **验证阶段**：使用断言验证结果是否符合预期
4. **清理阶段**：（可选）清理测试环境

### 5.2 测试用例命名规范

测试用例名称应清晰描述测试目的，遵循以下规范：

- 使用中文描述测试场景
- 明确指出测试条件和预期行为
- 对于失败测试，明确指出预期的失败条件

例如：
- `生成简单难度拼图`
- `自定义网格大小拼图`
- `拼图生成失败 - 无参数`

### 5.3 最佳实践

- **保持测试独立**：每个测试用例应独立运行，不依赖其他测试的状态
- **测试覆盖率**：确保覆盖正常情况、边界情况和错误情况
- **异步测试处理**：对于异步操作，使用async/await语法确保测试正确执行
- **错误信息明确**：断言失败时提供清晰的错误信息，便于调试

## 6. 扩展指南

### 6.1 添加新的模拟API

要添加新的模拟API：

1. 在`mockAPI`对象中添加新的方法
2. 在`createMockAPI()`函数中也添加相同的方法实现
3. 确保新方法返回Promise并包含适当的错误处理

### 6.2 自定义测试报告

要自定义测试报告格式：

1. 修改`generateTestReport()`函数中的HTML模板
2. 调整CSS样式以更改报告外观
3. 更新JavaScript代码以修改交互行为

### 6.3 集成第三方测试工具

框架设计为可扩展的，可以与第三方测试工具集成：

1. 保留核心的测试执行引擎和结果统计系统
2. 替换断言工具为第三方库（如Chai）
3. 集成报告生成工具（如Mocha reporters）

## 7. 故障排除

### 7.1 常见问题及解决方案

1. **测试报告无法保存**
   - 检查Node.js环境权限
   - 确保文件系统模块正确加载
   - 查看控制台错误信息以确定具体原因

2. **异步测试超时**
   - 检查模拟API中的延迟设置
   - 确保Promise正确解析或拒绝
   - 验证异步测试函数正确使用async/await

3. **测试结果不一致**
   - 确保每个测试用例使用独立的mockAPI实例
   - 检查测试用例之间是否存在状态共享
   - 验证测试执行顺序是否影响结果

## 8. 总结

SLA-Puzzle 功能测试框架提供了一套完整的测试解决方案，包括测试执行、结果统计、报告生成等功能。框架设计灵活，易于扩展，能够有效支持项目的持续集成和质量保障工作。通过遵循本文档中的指南，开发人员可以高效地使用和扩展该测试框架，确保项目功能的正确性和稳定性。