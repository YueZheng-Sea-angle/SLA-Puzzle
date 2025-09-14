import { useState } from 'react';
import { PuzzleConfig } from './types';
import { HomePage } from './pages/HomePage';
import { MainMenu } from './pages/MainMenu';
import { PuzzleGame } from './components/game/PuzzleGame';
import { LoadedPuzzleGame } from './components/game/LoadedPuzzleGame';
import { TetrisPuzzleGame } from './pages/TetrisPuzzleGame';
import { PuzzleEditor } from './components/editor/PuzzleEditor';
import { IrregularPuzzleGame } from './pages/IrregularPuzzleGame';
import { Achievements } from './pages/Achievements';
import { DailyChallenge } from './pages/DailyChallengeNew';
import { Multiplayer } from './pages/Multiplayer';
import { MultiplayerGame } from './pages/MultiplayerGame';
import { Shop } from './pages/Shop';
import { Profile } from './pages/Profile';
import { Leaderboard } from './pages/Leaderboard';
import { DailyChallengeHistory } from './pages/DailyChallengeHistory';
import { Settings } from './pages/Settings';
import { Button } from './components/common/Button';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Auth } from './components/auth/Auth';
import { MultiplayerRoom } from './services/apiService';
import './App.css';



type AppView = 'menu' | 'game' | 'editor' | 'irregular-game' | 'tetris-game' | 'achievements' | 'dailyChallenge' | 'multiplayer' | 'shop' | 'profile' | 'leaderboard' | 'settings' | 'home' | 'singlePlayer' | 'multiplayer-game' | 'dailyChallengeHistory';



const AppContent: React.FC = () => {
  const { authState } = useAuth();
  const [currentView, setCurrentView] = useState<AppView>('home');
  const [currentPuzzle, setCurrentPuzzle] = useState<PuzzleConfig | null>(null);
  const [currentTetrisPuzzle, setCurrentTetrisPuzzle] = useState<PuzzleConfig | null>(null);
  const [loadGameSaveId, setLoadGameSaveId] = useState<string | null>(null);
  const [irregularGameParams, setIrregularGameParams] = useState<{
    imageData?: string;
    gridSize?: '3x3' | '4x4' | '5x5' | '6x6';
  }>({});
  const [multiplayerRoom, setMultiplayerRoom] = useState<MultiplayerRoom | null>(null);

  // 如果正在加载认证状态，显示加载画面
  if (authState.isLoading) {
    return (
      <div className="app loading-screen">
        <div className="loading-content">
          <div className="app-logo">🧩</div>
          <div className="loading-spinner"></div>
          <p>加载中...</p>
        </div>
      </div>
    );
  }

  // 如果未认证，显示登录页面
  if (!authState.isAuthenticated) {
    return <Auth key="auth-component" />;
  }

  const handleStartGame = (puzzleConfig: PuzzleConfig) => {
    setCurrentPuzzle(puzzleConfig);
    setCurrentView('game');
  };

  const handleLoadGame = (saveId: string) => {
    setLoadGameSaveId(saveId);
    setCurrentView('game');
  };

  const handleStartIrregularGame = (imageData?: string, gridSize: '3x3' | '4x4' | '5x5' | '6x6' = '3x3') => {
    setIrregularGameParams({ imageData, gridSize });
    setCurrentView('irregular-game');
  };

  const handleStartTetrisGame = (puzzleConfig: PuzzleConfig) => {
    setCurrentTetrisPuzzle(puzzleConfig);
    setCurrentView('tetris-game');
  };

  const handleBackToMenu = () => {
    setCurrentView('singlePlayer');
    setCurrentPuzzle(null);
    setCurrentTetrisPuzzle(null);
    setLoadGameSaveId(null);
    setIrregularGameParams({});
  };

  const handleBackToHome = () => {
    setCurrentView('home');
    setCurrentPuzzle(null);
    setLoadGameSaveId(null);
    setIrregularGameParams({});
  };

  const handleOpenSinglePlayer = () => {
    setCurrentView('singlePlayer');
  };

  const handleOpenEditor = () => {
    setCurrentView('editor');
  };

  const handleOpenAchievements = () => {
    setCurrentView('achievements');
  };

  const handleOpenDailyChallenge = () => {
    setCurrentView('dailyChallenge');
  };

  const handleOpenMultiplayer = () => {
    setCurrentView('multiplayer');
  };

  const handleOpenShop = () => {
    setCurrentView('shop');
  };

  const handleOpenProfile = () => {
    setCurrentView('profile');
  };

  const handleOpenLeaderboard = () => {
    setCurrentView('leaderboard');
  };

  const handleOpenDailyChallengeHistory = () => {
    setCurrentView('dailyChallengeHistory');
  };

  const handleOpenSettings = () => {
    setCurrentView('settings');
  };

  const handleGameComplete = (completionTime: number, moves: number) => {
    console.log(`游戏完成！用时: ${completionTime}秒, 步数: ${moves}`);
    // 这里可以添加完成后的处理逻辑，比如保存到排行榜
  };

  const handleStartMultiplayerGame = (roomData: { room: MultiplayerRoom }) => {
    setMultiplayerRoom(roomData.room);
    setCurrentView('multiplayer-game');
  };

  const handleBackToMultiplayerRoom = () => {
    setCurrentView('multiplayer');
  };

  const handleMultiplayerGameComplete = () => {
    setMultiplayerRoom(null);
    setCurrentView('home');
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'home':
        return (
          <HomePage
            onOpenSinglePlayer={handleOpenSinglePlayer}
            onOpenMultiplayer={handleOpenMultiplayer}
            onOpenEditor={handleOpenEditor}
            onOpenSettings={handleOpenSettings}
            onOpenProfile={handleOpenProfile}
            onOpenShop={handleOpenShop}
          />
        );
      
      case 'singlePlayer':
        return (
          <MainMenu
            onStartGame={handleStartGame}
            onLoadGame={handleLoadGame}
            onStartIrregularGame={handleStartIrregularGame}

            onStartTetrisGame={handleStartTetrisGame}
            onOpenEditor={handleOpenEditor}

            onOpenAchievements={handleOpenAchievements}
            onOpenDailyChallenge={handleOpenDailyChallenge}
            onOpenShop={handleOpenShop}
            onOpenProfile={handleOpenProfile}
            onOpenLeaderboard={handleOpenLeaderboard}
            onBackToHome={handleBackToHome}
          />
        );

      case 'game':
        if (loadGameSaveId) {
          // 加载保存的游戏
          return (
            <LoadedPuzzleGame
              saveId={loadGameSaveId}
              onGameComplete={handleGameComplete}
              onBackToMenu={handleBackToMenu}
            />
          );
        } else if (currentPuzzle) {
          // 开始新游戏
          return (
            <PuzzleGame
              puzzleConfig={currentPuzzle}
              onGameComplete={handleGameComplete}
              onBackToMenu={handleBackToMenu}
            />
          );
        } else {
          return (
            <div className="error-view">
              <h2>错误</h2>
              <p>拼图配置加载失败</p>
              <Button onClick={handleBackToMenu}>返回菜单</Button>
            </div>
          );
        }

      case 'editor':
        return (
          <PuzzleEditor onBackToMenu={handleBackToMenu} onBackToHome={handleBackToHome} onStartGame={handleStartGame} onStartIrregularGame={handleStartIrregularGame} />
        );

      case 'irregular-game':
        return (
          <IrregularPuzzleGame
            onBackToMenu={handleBackToMenu}
            imageData={irregularGameParams.imageData}
            gridSize={irregularGameParams.gridSize}
          />
        );

      case 'tetris-game':
        if (currentTetrisPuzzle) {
          return (
            <TetrisPuzzleGame
              puzzleConfig={currentTetrisPuzzle}
              onGameComplete={handleGameComplete}
              onBackToMenu={handleBackToMenu}
            />
          );
        } else {
          return (
            <div className="error-view">
              <h2>错误</h2>
              <p>俄罗斯方块拼图配置加载失败</p>
              <Button onClick={handleBackToMenu}>返回菜单</Button>
            </div>
          );
        }

      case 'achievements':
        return (
          <Achievements onBackToMenu={handleBackToMenu} />
        );

      case 'dailyChallenge':
        return (
          <DailyChallenge 
            onBackToMenu={handleBackToMenu} 
            onOpenDailyChallengeHistory={handleOpenDailyChallengeHistory}
          />
        );

      case 'multiplayer':
        return (
          <Multiplayer 
            onBackToMenu={handleBackToHome} 
            onStartGame={handleStartMultiplayerGame}
          />
        );
      
      case 'multiplayer-game':
        if (!multiplayerRoom) {
          return (
            <div className="error-view">
              <h2>房间信息丢失</h2>
              <p>无法找到房间信息，请重新加入房间</p>
              <Button onClick={handleBackToMenu}>返回菜单</Button>
            </div>
          );
        }
        return (
          <MultiplayerGame
            room={multiplayerRoom}
            onBackToRoom={handleBackToMultiplayerRoom}
            onGameComplete={handleMultiplayerGameComplete}
          />
        );

      case 'shop':
        return (
          <Shop onBackToMenu={handleBackToMenu} />
        );

      case 'profile':
        return (
          <Profile onBackToMenu={handleBackToMenu} />
        );

      case 'leaderboard':
        return (
          <Leaderboard 
            onBackToMenu={handleBackToMenu} 
            onOpenDailyChallengeHistory={handleOpenDailyChallengeHistory}
          />
        );
      
      case 'dailyChallengeHistory':
        return (
          <DailyChallengeHistory onBackToMenu={handleBackToMenu} />
        );

      case 'settings':
        return (
          <Settings onBackToHome={handleBackToHome} />
        );

      default:
        return (
          <div className="error-view">
            <h2>页面不存在</h2>
            <Button onClick={handleBackToMenu}>返回菜单</Button>
          </div>
        );
    }
  };

  return (
    <div className="app">
      {renderCurrentView()}
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
