import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LoginCredentials, RegisterCredentials } from '../../types';
import { apiService } from '../../services/apiService';
import './Auth.css';

type AuthMode = 'login' | 'register';

export const Auth: React.FC = () => {
  const { authState, login, register, clearError, setAuthenticatedUser } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login');
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
  });
  
  // 本地错误状态，不依赖 AuthContext
  const [localError, setLocalError] = useState<string | null>(null);
  const [localLoading, setLocalLoading] = useState(false);

  // 添加生命周期调试
  useEffect(() => {
    console.log('🔴 Auth组件挂载/重新挂载');
    return () => {
      console.log('🔴 Auth组件卸载');
    };
  }, []);

  useEffect(() => {
    console.log('🟡 Auth组件 authState 改变:', {
      isAuthenticated: authState.isAuthenticated,
      isLoading: authState.isLoading,
      hasError: !!authState.error,
      error: authState.error
    });
  }, [authState]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // 清除错误信息
    if (authState.error) {
      clearError();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      if (mode === 'login') {
        const credentials: LoginCredentials = {
          username: formData.username,
          password: formData.password,
        };
        const result = await login(credentials);
        console.log('登录结果:', result);
      } else {
        const credentials: RegisterCredentials = {
          username: formData.username,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
        };
        const result = await register(credentials);
        console.log('注册结果:', result);
        console.log('注册完成，停止进一步处理');
      }
    } catch (error) {
      console.error('表单提交错误:', error);
      // 确保错误被正确处理，不会导致页面刷新
    }
    
    // 确保函数总是返回 false，阻止任何默认行为
    return false;
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setFormData({
      username: '',
      password: '',
      confirmPassword: '',
    });
    clearError();
  };

  const isFormValid = () => {
    if (mode === 'login') {
      return formData.username.trim() && formData.password.trim();
    } else {
      return (
        formData.username.trim() &&
        formData.password.trim() &&
        formData.confirmPassword.trim()
      );
    }
  };

  if (authState.isLoading && authState.isAuthenticated) {
    return (
      <div className="auth-container">
        <div className="auth-modal">
          <div className="auth-header">
            <div className="app-logo">🧩</div>
            <div className="loading-spinner"></div>
            <p>登录中...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-modal">
        <div className="auth-header">
          <div className="app-logo">🧩</div>
          <h1 className="auth-title">
            {mode === 'login' ? '欢迎回来' : '加入我们'}
          </h1>
          <p className="auth-subtitle">
            {mode === 'login' 
              ? '登录您的拼图游戏账户' 
              : '创建您的拼图游戏账户'
            }
          </p>
        </div>

        <form 
          className="auth-form" 
          onSubmit={handleSubmit} 
          noValidate
          onReset={(e) => e.preventDefault()}
        >
          {mode === 'register' && (
            <div className="form-group">
              <label className="form-label" htmlFor="username">
                用户名
              </label>
              <input
                type="text"
                id="username"
                name="username"
                className={`form-input ${authState.error ? 'error' : ''}`}
                value={formData.username}
                onChange={handleInputChange}
                placeholder="请输入用户名"
                required
              />
            </div>
          )}

          {mode === 'login' && (
            <div className="form-group">
              <label className="form-label" htmlFor="username">
                用户名
              </label>
              <input
                type="text"
                id="username"
                name="username"
                className={`form-input ${authState.error ? 'error' : ''}`}
                value={formData.username}
                onChange={handleInputChange}
                placeholder="请输入用户名"
                required
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="password">
              密码
            </label>
            <input
              type="password"
              id="password"
              name="password"
              className={`form-input ${authState.error ? 'error' : ''}`}
              value={formData.password}
              onChange={handleInputChange}
              placeholder="请输入密码"
              required
            />
          </div>

          {mode === 'register' && (
            <div className="form-group">
              <label className="form-label" htmlFor="confirmPassword">
                确认密码
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                className={`form-input ${authState.error ? 'error' : ''}`}
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="请再次输入密码"
                required
              />
            </div>
          )}

          {(authState.error || localError) && (
            <div className="error-message">
              {(authState.error || localError)!.split('\n').map((line, index) => (
                <div key={index}>{line}</div>
              ))}
            </div>
          )}

          <button
            type="button"
            className="auth-button"
            disabled={!isFormValid() || authState.isLoading || localLoading}
            onClick={async (e) => {
              console.log('直接按钮点击事件');
              e.preventDefault();
              e.stopPropagation();
              
              try {
                console.log('测试：使用本地状态，不触发AuthContext状态更新');
                console.log('当前时间戳:', Date.now());
                
                setLocalError(null);
                setLocalLoading(true);
                
                // 直接调用 apiService，不通过 AuthContext
                if (mode === 'login') {
                  console.log('直接调用 apiService.login');
                  const response = await apiService.login({
                    username: formData.username,
                    password: formData.password,
                  });
                  console.log('登录API响应:', response);
                  
                  setLocalLoading(false);
                  if (response.success && response.data) {
                    console.log('登录成功，更新 AuthContext');
                    setLocalError(null);
                    setLocalLoading(false);
                    // 直接设置认证状态，避免重复 API 调用
                    setAuthenticatedUser(response.data.user, response.data.token);
                  } else {
                    console.log('登录失败，设置本地错误');
                    // 使用 formatApiError 来格式化错误信息
                    const { formatApiError } = await import('../../utils/errorFormatter');
                    const errorMessage = formatApiError(
                      response.error || '登录失败',
                      response.code,
                      response.details
                    );
                    setLocalError(errorMessage);
                  }
                } else {
                  console.log('直接调用 apiService.register');
                  const response = await apiService.register({
                    username: formData.username,
                    password: formData.password,
                    confirmPassword: formData.confirmPassword,
                  });
                  console.log('注册API响应:', response);
                  
                  setLocalLoading(false);
                  if (response.success && response.data) {
                    console.log('注册成功，更新 AuthContext');
                    setLocalError(null);
                    setLocalLoading(false);
                    // 直接设置认证状态，避免重复 API 调用
                    setAuthenticatedUser(response.data.user, response.data.token);
                  } else {
                    console.log('注册失败，设置本地错误');
                    // 使用 formatApiError 来格式化错误信息
                    const { formatApiError } = await import('../../utils/errorFormatter');
                    const errorMessage = formatApiError(
                      response.error || '注册失败',
                      response.code,
                      response.details
                    );
                    setLocalError(errorMessage);
                  }
                }
                
                console.log('本地状态操作完成');
              } catch (error) {
                console.error('直接按钮错误:', error);
                setLocalLoading(false);
                setLocalError('发生错误，请稍后重试');
              }
            }}
          >
            {(authState.isLoading || localLoading) && <span className="loading-spinner"></span>}
            {mode === 'login' ? '登录' : '注册'}
          </button>
        </form>

        <div className="auth-switch">
          <p className="auth-switch-text">
            {mode === 'login' ? '还没有账户？' : '已有账户？'}
          </p>
          <button
            type="button"
            className="auth-switch-button"
            onClick={switchMode}
            disabled={authState.isLoading}
          >
            {mode === 'login' ? '立即注册' : '立即登录'}
          </button>
        </div>
      </div>
    </div>
  );
};
