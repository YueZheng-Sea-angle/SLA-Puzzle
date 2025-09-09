/**
 * 错误格式化工具
 * 用于将后端返回的验证错误转换为用户友好的提示信息
 */

export interface ValidationErrorDetail {
  field: string;
  message: string;
  value: any;
}

/**
 * 格式化验证错误信息
 */
export function formatValidationErrors(details: ValidationErrorDetail[]): string {
  if (!details || !Array.isArray(details)) {
    return '输入数据有误，请检查后重试';
  }

  const errorMessages = details.map(error => {
    const fieldName = getFieldDisplayName(error.field);
    return `${fieldName}: ${error.message}`;
  });

  return errorMessages.join('\n');
}

/**
 * 获取字段的显示名称
 */
function getFieldDisplayName(field: string): string {
  const fieldNames: Record<string, string> = {
    username: '用户名',
    email: '邮箱',
    password: '密码',
    confirmPassword: '确认密码',
    avatar: '头像',
    avatarFrame: '头像框',
    coins: '金币',
    experience: '经验值',
    puzzleName: '拼图名称',
    difficulty: '难度',
    pieceShape: '拼图形状',
    gridSize: '网格大小',
    totalPieces: '拼图块数量',
    completionTime: '完成时间',
    moves: '移动次数',
    coinsEarned: '获得金币',
    experienceEarned: '获得经验',
    achievementId: '成就ID',
    progress: '进度',
    page: '页码',
    limit: '每页数量',
    sortBy: '排序字段',
  };

  return fieldNames[field] || field;
}

/**
 * 格式化API错误信息
 */
export function formatApiError(error: string, code?: string, details?: any): string {
  // 如果是验证错误，格式化详细信息
  if (code === 'VALIDATION_ERROR' && details) {
    return formatValidationErrors(details);
  }

  // 其他常见错误的中文化
  const errorMessages: Record<string, string> = {
    'USER_ALREADY_EXISTS': '用户名或邮箱已被使用',
    'INVALID_CREDENTIALS': '用户名或密码错误',
    'UNAUTHORIZED': '未授权访问，请先登录',
    'FORBIDDEN': '禁止访问',
    'NOT_FOUND': '资源未找到',
    'DUPLICATE_ENTRY': '数据重复，该记录已存在',
    'FOREIGN_KEY_ERROR': '引用的数据不存在',
    'DATABASE_CONNECTION_ERROR': '数据库连接失败，请稍后重试',
    'RATE_LIMIT_EXCEEDED': '请求过于频繁，请稍后重试',
    'NETWORK_ERROR': '网络连接失败，请检查网络后重试',
  };

  return errorMessages[code || ''] || error || '操作失败，请稍后重试';
}
