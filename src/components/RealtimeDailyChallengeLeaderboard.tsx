import React, { useState, useEffect, useCallback } from 'react';
import { DailyChallengeLeaderboardEntry } from '../types';
import { RealtimeDailyChallengeService } from '../services/realtimeDailyChallengeService';
import { useAuth } from '../contexts/AuthContext';

interface RealtimeDailyChallengeLeaderboardProps {
  date?: string;
  limit?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
  onUserRankChange?: (rank: number | null) => void;
}

export const RealtimeDailyChallengeLeaderboard: React.FC<RealtimeDailyChallengeLeaderboardProps> = ({
  date,
  limit = 50,
  autoRefresh = true,
  refreshInterval = 10000,
  onUserRankChange
}) => {
  const { authState } = useAuth();
  const [leaderboard, setLeaderboard] = useState<DailyChallengeLeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [isRealtime, setIsRealtime] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // 加载排行榜数据
  const loadLeaderboard = useCallback(async (forceRefresh = false) => {
    try {
      if (forceRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      const data = await RealtimeDailyChallengeService.getRealtimeDailyChallengeLeaderboard(
        date, 
        limit, 
        forceRefresh
      );

      setLeaderboard(data.leaderboard);
      setUserRank(data.userRank || null);
      setLastUpdated(data.lastUpdated);
      setIsRealtime(data.isRealtime);

      // 通知父组件用户排名变化
      if (onUserRankChange && data.userRank !== userRank) {
        onUserRankChange(data.userRank || null);
      }

      console.log('📊 排行榜数据已更新:', {
        count: data.leaderboard.length,
        userRank: data.userRank,
        isRealtime: data.isRealtime,
        lastUpdated: data.lastUpdated
      });

    } catch (err) {
      console.error('加载排行榜失败:', err);
      setError(err instanceof Error ? err.message : '加载排行榜失败');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [date, limit, userRank, onUserRankChange]);

  // 手动刷新
  const handleRefresh = useCallback(() => {
    loadLeaderboard(true);
  }, [loadLeaderboard]);

  // 初始加载
  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

  // 自动刷新
  useEffect(() => {
    if (!autoRefresh) return;

    const stopRealtimeUpdates = RealtimeDailyChallengeService.startRealtimeUpdates(
      (data) => {
        setLeaderboard(data.leaderboard);
        setUserRank(data.userRank || null);
        setLastUpdated(data.lastUpdated);
        setIsRealtime(data.isRealtime);

        // 通知父组件用户排名变化
        if (onUserRankChange && data.userRank !== userRank) {
          onUserRankChange(data.userRank || null);
        }

        console.log('🔄 实时更新排行榜:', {
          count: data.leaderboard.length,
          userRank: data.userRank,
          isRealtime: data.isRealtime
        });
      },
      refreshInterval,
      date,
      limit
    );

    return () => {
      stopRealtimeUpdates();
    };
  }, [autoRefresh, refreshInterval, date, limit, userRank, onUserRankChange]);

  // 格式化时间
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // 格式化日期
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // 获取排名显示样式
  const getRankStyle = (rank: number) => {
    if (rank === 1) return { color: '#FFD700', fontWeight: 'bold' }; // 金色
    if (rank === 2) return { color: '#C0C0C0', fontWeight: 'bold' }; // 银色
    if (rank === 3) return { color: '#CD7F32', fontWeight: 'bold' }; // 铜色
    return { color: '#666' };
  };

  // 获取用户行样式
  const getUserRowStyle = (playerName: string) => {
    if (authState.user && playerName === authState.user.username) {
      return { 
        backgroundColor: '#e3f2fd', 
        border: '2px solid #2196f3',
        borderRadius: '8px',
        margin: '2px 0'
      };
    }
    return {};
  };

  if (isLoading) {
    return (
      <div className="realtime-leaderboard-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>加载排行榜中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="realtime-leaderboard-container">
        <div className="error-message">
          <p>❌ {error}</p>
          <button onClick={handleRefresh} className="retry-button">
            重试
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="realtime-leaderboard-container">
      {/* 头部信息 */}
      <div className="leaderboard-header">
        <div className="header-left">
          <h3>🏆 每日挑战排行榜</h3>
          <div className="status-info">
            <span className={`status-indicator ${isRealtime ? 'realtime' : 'offline'}`}>
              {isRealtime ? '🟢 实时' : '🔴 离线'}
            </span>
            <span className="last-updated">
              最后更新: {formatDate(lastUpdated)}
            </span>
          </div>
        </div>
        <div className="header-right">
          <button 
            onClick={handleRefresh} 
            className={`refresh-button ${isRefreshing ? 'refreshing' : ''}`}
            disabled={isRefreshing}
          >
            {isRefreshing ? '🔄' : '🔄'} 刷新
          </button>
        </div>
      </div>

      {/* 用户排名信息 */}
      {userRank && (
        <div className="user-rank-info">
          <div className="rank-badge">
            <span className="rank-number">#{userRank}</span>
            <span className="rank-label">你的排名</span>
          </div>
        </div>
      )}

      {/* 排行榜列表 */}
      <div className="leaderboard-list">
        {leaderboard.length === 0 ? (
          <div className="empty-leaderboard">
            <p>📭 暂无排行榜数据</p>
            <p>完成每日挑战后即可出现在排行榜上！</p>
          </div>
        ) : (
          leaderboard.map((entry, index) => (
            <div 
              key={`${entry.id}_${index}`}
              className="leaderboard-entry"
              style={getUserRowStyle(entry.playerName)}
            >
              <div className="rank-column">
                <span 
                  className="rank-number"
                  style={getRankStyle(entry.rank || index + 1)}
                >
                  {entry.rank || index + 1}
                </span>
              </div>
              
              <div className="player-column">
                <div className="player-name">
                  {entry.playerName}
                  {authState.user && entry.playerName === authState.user.username && (
                    <span className="you-badge"> (你)</span>
                  )}
                </div>
                <div className="puzzle-info">
                  {entry.puzzleName} • {entry.difficulty} • {entry.pieceShape}
                </div>
              </div>
              
              <div className="score-column">
                <div className="score-value">{entry.score}</div>
                <div className="score-label">分数</div>
              </div>
              
              <div className="time-column">
                <div className="time-value">{formatTime(entry.completionTime)}</div>
                <div className="time-label">时间</div>
              </div>
              
              <div className="moves-column">
                <div className="moves-value">{entry.moves}</div>
                <div className="moves-label">步数</div>
              </div>
              
              <div className="badges-column">
                {entry.isPerfect && <span className="perfect-badge">⭐ 完美</span>}
                {entry.totalStars > 0 && (
                  <span className="stars-badge">🌟 {entry.totalStars}</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* 底部信息 */}
      <div className="leaderboard-footer">
        <div className="footer-info">
          <span>共 {leaderboard.length} 名玩家</span>
          {isRealtime && (
            <span className="auto-refresh-info">
              • 每 {refreshInterval / 1000} 秒自动刷新
            </span>
          )}
        </div>
      </div>

      <style jsx>{`
        .realtime-leaderboard-container {
          background: #fff;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          overflow: hidden;
          max-width: 100%;
        }

        .leaderboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .header-left h3 {
          margin: 0 0 8px 0;
          font-size: 1.2em;
        }

        .status-info {
          display: flex;
          gap: 12px;
          font-size: 0.9em;
          opacity: 0.9;
        }

        .status-indicator.realtime {
          color: #4caf50;
        }

        .status-indicator.offline {
          color: #f44336;
        }

        .refresh-button {
          background: rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.3);
          color: white;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .refresh-button:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .refresh-button.refreshing {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .user-rank-info {
          padding: 12px 20px;
          background: #f8f9fa;
          border-bottom: 1px solid #e9ecef;
        }

        .rank-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #2196f3;
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          font-weight: bold;
        }

        .rank-number {
          font-size: 1.2em;
        }

        .leaderboard-list {
          max-height: 400px;
          overflow-y: auto;
        }

        .leaderboard-entry {
          display: flex;
          align-items: center;
          padding: 12px 20px;
          border-bottom: 1px solid #f0f0f0;
          transition: all 0.3s ease;
        }

        .leaderboard-entry:hover {
          background: #f8f9fa;
        }

        .rank-column {
          width: 60px;
          text-align: center;
        }

        .player-column {
          flex: 1;
          min-width: 0;
        }

        .player-name {
          font-weight: 600;
          color: #333;
          margin-bottom: 4px;
        }

        .you-badge {
          color: #2196f3;
          font-weight: bold;
        }

        .puzzle-info {
          font-size: 0.85em;
          color: #666;
        }

        .score-column,
        .time-column,
        .moves-column {
          width: 80px;
          text-align: center;
        }

        .score-value,
        .time-value,
        .moves-value {
          font-weight: bold;
          color: #333;
          font-size: 1.1em;
        }

        .score-label,
        .time-label,
        .moves-label {
          font-size: 0.8em;
          color: #666;
        }

        .badges-column {
          width: 120px;
          text-align: right;
        }

        .perfect-badge,
        .stars-badge {
          display: inline-block;
          background: #ff9800;
          color: white;
          padding: 2px 6px;
          border-radius: 10px;
          font-size: 0.75em;
          margin-left: 4px;
        }

        .stars-badge {
          background: #9c27b0;
        }

        .empty-leaderboard {
          text-align: center;
          padding: 40px 20px;
          color: #666;
        }

        .empty-leaderboard p {
          margin: 8px 0;
        }

        .leaderboard-footer {
          padding: 12px 20px;
          background: #f8f9fa;
          border-top: 1px solid #e9ecef;
          text-align: center;
          font-size: 0.9em;
          color: #666;
        }

        .footer-info {
          display: flex;
          justify-content: center;
          gap: 8px;
        }

        .loading-spinner {
          text-align: center;
          padding: 40px;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #2196f3;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 16px;
        }

        .error-message {
          text-align: center;
          padding: 40px 20px;
          color: #f44336;
        }

        .retry-button {
          background: #2196f3;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          margin-top: 12px;
        }

        .retry-button:hover {
          background: #1976d2;
        }

        @media (max-width: 768px) {
          .leaderboard-entry {
            flex-wrap: wrap;
            gap: 8px;
          }

          .rank-column,
          .score-column,
          .time-column,
          .moves-column,
          .badges-column {
            width: auto;
            min-width: 60px;
          }

          .player-column {
            flex: 1 1 100%;
            order: -1;
          }
        }
      `}</style>
    </div>
  );
};
