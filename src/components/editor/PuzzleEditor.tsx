import React, { useState, useRef, useCallback } from 'react';
import SavedPuzzlesPage from '../../pages/SavedPuzzles';
import { Button } from '../common/Button';
import { ImageCropper } from './ImageCropper';
import { DifficultySettings } from './DifficultySettings';
import { PreviewModal } from './PreviewModal';
import { DifficultyLevel, PieceShape } from '../../types';
import './PuzzleEditor.css';

import { PuzzleConfig } from '../../types';

interface PuzzleEditorProps {
  onBackToMenu: () => void;
  onStartGame?: (config: PuzzleConfig) => void;
  initialStep?: 'upload' | 'crop' | 'settings' | 'preview';
  /** 新增：异形拼图启动 */
  onStartIrregularGame?: (imageData: string, gridSize?: '3x3' | '4x4' | '5x5' | '6x6') => void;
}

type EditorStep = 'upload' | 'crop' | 'settings' | 'preview';
type AspectRatio = '1:1' | '16:9';

interface CustomPuzzleConfig {
  name: string;
  image: string;
  difficulty: DifficultyLevel;
  pieceShape: PieceShape;
  aspectRatio: AspectRatio;
  croppedImageData?: string;
}

export const PuzzleEditor: React.FC<PuzzleEditorProps> = ({ onBackToMenu, onStartGame, initialStep, onStartIrregularGame }) => {
  const [currentStep, setCurrentStep] = useState<EditorStep>(initialStep || 'upload');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<AspectRatio>('1:1');
  const [customPuzzleConfig, setCustomPuzzleConfig] = useState<CustomPuzzleConfig>({
    name: '',
    image: '',
    difficulty: 'medium',
    pieceShape: 'square',
    aspectRatio: '1:1'
  });
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  // 新增：用于实时记录设置页的难度和形状选择
  const [tempDifficulty, setTempDifficulty] = useState<DifficultyLevel>('medium');
  const [tempPieceShape, setTempPieceShape] = useState<PieceShape>('square');
  const fileInputRef = useRef<HTMLInputElement>(null);
  // 新增：保存后跳转到存档页面
  const [showSavedPage, setShowSavedPage] = useState(false);

  // 导入分享代码弹窗相关状态

  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importCode, setImportCode] = useState('');
  const [importError, setImportError] = useState('');
  const [importPreviewImage, setImportPreviewImage] = useState<string | null>(null);
  const [importPreviewShape, setImportPreviewShape] = useState<string>('');
  const [importPreviewGrid, setImportPreviewGrid] = useState<string>('');

  // 监听分享代码输入，实时解析图片
  const handleImportCodeChange = (val: string) => {
    setImportCode(val);
    setImportError('');
    try {
      const json = decodeURIComponent(atob(val.trim()));
      const data = JSON.parse(json);
      if (data.image) {
        setImportPreviewImage(data.image);
      } else {
        setImportPreviewImage(null);
      }
      // 形状
      let shapeText = '';
      switch (data.pieceShape) {
        case 'square': shapeText = '方形'; break;
        case 'triangle': shapeText = '三角形'; break;
        case 'irregular': shapeText = '异形'; break;
        case 'tetris': shapeText = '俄罗斯方块'; break;
        default: shapeText = data.pieceShape || '';
      }
      setImportPreviewShape(shapeText);
      // 块数
      if (data.gridSize && data.gridSize.rows && data.gridSize.cols) {
        setImportPreviewGrid(`${data.gridSize.rows} × ${data.gridSize.cols}`);
      } else {
        setImportPreviewGrid('');
      }
    } catch {
      setImportPreviewImage(null);
      setImportPreviewShape('');
      setImportPreviewGrid('');
    }
  };

  // 导入分享代码逻辑
  const handleImportShareCode = () => {
    setImportError('');
    try {
      const json = decodeURIComponent(atob(importCode.trim()));
      const data = JSON.parse(json);
      if (!data.image || !data.pieceShape || !data.difficulty || !data.gridSize) {
        setImportError('分享代码无效或缺少必要信息');
        return;
      }
      setCustomPuzzleConfig(prev => ({
        ...prev,
        name: data.name || '',
        image: data.image,
        croppedImageData: data.image,
        pieceShape: data.pieceShape,
        difficulty: data.difficulty,
        aspectRatio: data.aspectRatio || '1:1'
      }));
      setUploadedImage(data.image);
      setCurrentStep('settings'); // 跳转到设置页
      setImportDialogOpen(false);
      setImportCode('');
      setImportPreviewImage(null);
    } catch (e) {
      setImportError('分享代码解析失败，请检查内容是否完整');
    }
  };

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const imageData = e.target?.result as string;
          setUploadedImage(imageData);
          setCustomPuzzleConfig(prev => ({
            ...prev,
            image: imageData,
            name: file.name.replace(/\.[^/.]+$/, '') // 去掉文件扩展名
          }));
          setCurrentStep('crop');
        };
        reader.readAsDataURL(file);
      } else {
        alert('请选择有效的图片文件！');
      }
    }
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
  }, []);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    const file = files[0];
    
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = e.target?.result as string;
        setUploadedImage(imageData);
        setCustomPuzzleConfig(prev => ({
          ...prev,
          image: imageData,
          name: file.name.replace(/\.[^/.]+$/, '')
        }));
        setCurrentStep('crop');
      };
      reader.readAsDataURL(file);
    } else {
      alert('请拖拽有效的图片文件！');
    }
  }, []);

  const handleCropComplete = useCallback((croppedImageData: string) => {
    setCustomPuzzleConfig(prev => ({
      ...prev,
      croppedImageData,
      aspectRatio: selectedAspectRatio
    }));
    setCurrentStep('settings');
  }, [selectedAspectRatio]);

  // 传递给 DifficultySettings 的回调，确认时才写入主配置
  const handleDifficultySettingsComplete = useCallback((
    difficulty: DifficultyLevel,
    pieceShape: PieceShape
  ) => {
    setCustomPuzzleConfig(prev => ({
      ...prev,
      difficulty,
      pieceShape
    }));
    setCurrentStep('preview');
  }, []);

  // 新增：用于 DifficultySettings 实时同步选择
  const handleTempDifficultyChange = useCallback((difficulty: DifficultyLevel) => {
    setTempDifficulty(difficulty);
  }, []);
  const handleTempPieceShapeChange = useCallback((shape: PieceShape) => {
    setTempPieceShape(shape);
  }, []);

  const handleSavePuzzle = useCallback(() => {
    if (!customPuzzleConfig.croppedImageData || !customPuzzleConfig.name) {
      alert('请先完成拼图设置并裁剪图片！');
      return;
    }
    // 获取已有存档
    const saved = localStorage.getItem('savedPuzzles');
    let puzzles = [];
    try {
      puzzles = saved ? JSON.parse(saved) : [];
    } catch {
      puzzles = [];
    }
    // 生成唯一id
    const id = Date.now().toString();
    const newPuzzle = {
      id,
      name: customPuzzleConfig.name,
      data: customPuzzleConfig,
      date: new Date().toLocaleString(),
    };
    puzzles.push(newPuzzle);
    localStorage.setItem('savedPuzzles', JSON.stringify(puzzles));
    setShowSavedPage(true);
  }, [customPuzzleConfig]);

  // 分享弹窗相关状态
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareCode, setShareCode] = useState('');

  // 生成分享代码并弹窗展示
  const handleSharePuzzle = useCallback(() => {
    if (!customPuzzleConfig.croppedImageData || !customPuzzleConfig.name) {
      alert('请先完成拼图设置并裁剪图片！');
      return;
    }
    // 计算块数
    const gridSize = (() => {
      if (customPuzzleConfig.difficulty === 'easy') return { rows: 3, cols: 3 };
      if (customPuzzleConfig.difficulty === 'medium') return { rows: 4, cols: 4 };
      if (customPuzzleConfig.difficulty === 'hard') return { rows: 5, cols: 5 };
      return { rows: 6, cols: 6 };
    })();
    // 分享内容
    const shareData = {
      name: customPuzzleConfig.name,
      image: customPuzzleConfig.croppedImageData,
      pieceShape: customPuzzleConfig.pieceShape,
      difficulty: customPuzzleConfig.difficulty,
      gridSize,
      aspectRatio: customPuzzleConfig.aspectRatio
    };
    // 编码为 base64
    const json = JSON.stringify(shareData);
    const encoded = btoa(encodeURIComponent(json));
    setShareCode(encoded);
    setShareDialogOpen(true);
  }, [customPuzzleConfig]);
  // 复制分享代码到剪贴板
  const handleCopyShareCode = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareCode);
      alert('分享代码已复制到剪贴板！');
    } else {
      // 兼容旧浏览器
      const textarea = document.createElement('textarea');
      textarea.value = shareCode;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      alert('分享代码已复制到剪贴板！');
    }
  };

  const handleStartGame = useCallback(async () => {
    const pieceShape = currentStep === 'settings' ? tempPieceShape : customPuzzleConfig.pieceShape;
    const difficulty = currentStep === 'settings' ? tempDifficulty : customPuzzleConfig.difficulty;
    if (!customPuzzleConfig.croppedImageData || !customPuzzleConfig.name) {
      alert('请先完成拼图设置并裁剪图片！');
      return;
    }
    const gridSize = (() => {
      if (difficulty === 'easy') return { rows: 3, cols: 3 };
      if (difficulty === 'medium') return { rows: 4, cols: 4 };
      if (difficulty === 'hard') return { rows: 5, cols: 5 };
      return { rows: 6, cols: 6 };
    })();
    try {
      if (pieceShape === 'irregular') {
        // 直接跳转到异形拼图游戏
        if (typeof onStartIrregularGame === 'function') {
          const gridStr = `${gridSize.rows}x${gridSize.cols}` as '3x3' | '4x4' | '5x5' | '6x6';
          onStartIrregularGame(customPuzzleConfig.croppedImageData, gridStr);
          return;
        }
      }
      // 其它形状
      const { PuzzleGenerator } = await import('../../utils/puzzleGenerator');
      const puzzleConfig = await PuzzleGenerator.generatePuzzle({
        imageData: customPuzzleConfig.croppedImageData,
        gridSize,
        pieceShape,
        name: customPuzzleConfig.name || '自定义拼图',
      });
      if (typeof onStartGame === 'function') {
        onStartGame(puzzleConfig);
      }
    } catch (e) {
      alert('生成拼图失败！');
      console.error(e);
    }
  }, [customPuzzleConfig, onStartGame, tempDifficulty, tempPieceShape, currentStep, onStartIrregularGame]);

  const handleRestart = useCallback(() => {
    setCurrentStep('upload');
    setUploadedImage(null);
    setCustomPuzzleConfig({
      name: '',
      image: '',
      difficulty: 'medium',
      pieceShape: 'square',
      aspectRatio: '1:1'
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const renderUploadStep = () => (
    <div className="editor-step">
      <div className="step-header">
        <h2>📸 上传图片</h2>
        <p>选择您想要制作成拼图的图片，或导入分享代码</p>
      </div>
      <div className="upload-step">
        <div className="upload-area" onDragOver={handleDragOver} onDrop={handleDrop}>
          <div className="upload-content">
            <div className="upload-icon">🖼️</div>
            <h3>拖拽图片到此处</h3>
            <p>或者点击下方按钮选择文件</p>
            <p className="upload-hint">支持 JPG、PNG、GIF 等常见图片格式</p>
            <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="primary"
                size="large"
                className="upload-btn same-size-btn"
              >
                📁 选择图片文件
              </Button>
              <Button
                onClick={() => setImportDialogOpen(true)}
                variant="secondary"
                size="large"
                className="import-btn same-size-btn"
              >
                🔽 导入分享代码
              </Button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
          </div>
        </div>
        <div className="format-info">
          <h4>💡 推荐图片格式</h4>
          <ul>
            <li>图片分辨率建议 800x800 以上</li>
            <li>文件大小建议不超过 10MB</li>
            <li>图片内容细节丰富、色彩对比明显的图片效果更佳</li>
            <li>避免纯色背景或过于简单的图案</li>
          </ul>
        </div>
      </div>
      {/* 导入分享代码弹窗 */}
      {importDialogOpen && (
        <div style={{
          position: 'fixed', left: 0, top: 0, width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.3)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{ background: '#fff', borderRadius: 8, padding: 32, minWidth: 340, boxShadow: '0 2px 16px #0002', maxWidth: 420 }}>
            <h2>导入分享代码</h2>
            <textarea
              style={{ width: '100%', height: 80, fontSize: 14, marginBottom: 12, resize: 'none' }}
              value={importCode}
              onChange={e => handleImportCodeChange(e.target.value)}
              placeholder="请粘贴分享代码"
              autoFocus
            />
            {importCode.trim() && (importPreviewImage || importPreviewShape || importPreviewGrid) && (
              <div style={{ marginBottom: 12, textAlign: 'center', minHeight: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontSize: 13, color: '#333', marginBottom: 4, fontWeight: 500 }}>预览</div>
                {importPreviewImage && (
                  <img src={importPreviewImage} alt="预览" style={{ maxWidth: 180, maxHeight: 120, borderRadius: 4, boxShadow: '0 1px 6px #0001', marginBottom: (importPreviewShape || importPreviewGrid) ? 6 : 0 }} />
                )}
                {(importPreviewShape || importPreviewGrid) && (
                  <div style={{ fontSize: 13, color: '#333', marginBottom: 2 }}>
                    {importPreviewShape && <span>形状：{importPreviewShape}</span>}
                    {importPreviewShape && importPreviewGrid && <span style={{ margin: '0 6px' }}>|</span>}
                    {importPreviewGrid && <span>块数：{importPreviewGrid}</span>}
                  </div>
                )}
              </div>
            )}
            {importError && <div style={{ color: 'red', fontSize: 13, marginBottom: 8 }}>{importError}</div>}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button onClick={handleImportShareCode} style={{ padding: '6px 16px', fontSize: 14, cursor: 'pointer' }}>导入</button>
              <button onClick={() => { setImportDialogOpen(false); setImportError(''); setImportCode(''); setImportPreviewImage(null); }} style={{ padding: '6px 16px', fontSize: 14, cursor: 'pointer' }}>取消</button>
            </div>
            <div style={{ fontSize: 12, color: '#888', marginTop: 8 }}>
              分享代码可由好友生成，包含图片、形状、难度、块数等信息。
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderCropStep = () => (
    <div className="editor-step">
      <div className="step-header">
        <h2>✂️ 裁剪图片</h2>
        <p>调整裁剪区域，制作完美的拼图素材</p>
      </div>
      
      <div className="crop-step">
        <div className="crop-main">
          {uploadedImage && (
            <ImageCropper
              image={uploadedImage}
              aspectRatio={selectedAspectRatio}
              onCropComplete={handleCropComplete}
              onBack={() => setCurrentStep('upload')}
            />
          )}
        </div>
        
        <div className="crop-sidebar">
          <div className="aspect-ratio-selector">
            <h3>选择画幅比例</h3>
            <div className="ratio-options">
              <button
                className={`ratio-btn ${selectedAspectRatio === '1:1' ? 'active' : ''}`}
                onClick={() => setSelectedAspectRatio('1:1')}
              >
                <span className="ratio-icon">⬜</span>
                <span className="ratio-label">1:1 正方形</span>
                <span className="ratio-desc">经典拼图比例</span>
              </button>
              <button
                className={`ratio-btn ${selectedAspectRatio === '16:9' ? 'active' : ''}`}
                onClick={() => setSelectedAspectRatio('16:9')}
              >
                <span className="ratio-icon">📺</span>
                <span className="ratio-label">16:9 宽屏</span>
                <span className="ratio-desc">适合风景图片</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSettingsStep = () => (
    <div className="editor-step">
      <div className="step-header">
        <h2>⚙️ 拼图设置</h2>
        <p>设置拼图的难度和拼块形状</p>
      </div>
      <div className="settings-step-single">
        <DifficultySettings
          onComplete={handleDifficultySettingsComplete}
          onBack={() => setCurrentStep('crop')}
          onPreviewClick={() => setIsPreviewModalOpen(true)}
          hasPreviewImage={!!customPuzzleConfig.croppedImageData}
          // 新增：传递当前选择和变更回调
          selectedDifficulty={tempDifficulty}
          selectedShape={tempPieceShape}
          onDifficultyChange={handleTempDifficultyChange}
          onShapeChange={handleTempPieceShapeChange}
        />
      </div>
    </div>
  );

  const renderPreviewStep = () => (
    <div className="editor-step">
      <div className="step-header">
        <h2>🎯 拼图预览</h2>
        <p>您的自定义拼图已准备就绪！</p>
      </div>
      
      <div className="preview-step">
        <div className="preview-main">
          <div className="puzzle-summary">
            <div className="summary-image">
              {customPuzzleConfig.croppedImageData && (
                <img
                  src={customPuzzleConfig.croppedImageData}
                  alt={customPuzzleConfig.name}
                  className="final-preview"
                />
              )}
            </div>
            
            <div className="summary-details">
              <h3>📋 拼图信息</h3>
              <div className="detail-item">
                <span className="detail-label">名称:</span>
                <span className="detail-value">{customPuzzleConfig.name}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">画幅比例:</span>
                <span className="detail-value">{customPuzzleConfig.aspectRatio}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">难度等级:</span>
                <span className="detail-value">
                  {customPuzzleConfig.difficulty === 'easy' && '简单 (3×3)'}
                  {customPuzzleConfig.difficulty === 'medium' && '中等 (4×4)'}
                  {customPuzzleConfig.difficulty === 'hard' && '困难 (5×5)'}
                  {customPuzzleConfig.difficulty === 'expert' && '专家 (6×6)'}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">拼块形状:</span>
                <span className="detail-value">
                  {customPuzzleConfig.pieceShape === 'square' && '⬜ 方形'}
                  {customPuzzleConfig.pieceShape === 'triangle' && '🔺 三角形'}
                  {customPuzzleConfig.pieceShape === 'irregular' && '🧩 异形'}
                  {customPuzzleConfig.pieceShape === 'tetris' && '🟦 俄罗斯方块'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="preview-actions">
            <div className="navigation-group">
              <Button
                onClick={() => setCurrentStep('settings')}
                variant="secondary"
                size="medium"
              >
                ← 返回设置
              </Button>
              
              <Button
                onClick={handleRestart}
                variant="secondary"
                size="medium"
              >
                🔄 重新开始
              </Button>
            </div>
          </div>
        </div>
        
        <div className="preview-sidebar">
          <div className="action-group">
            <Button
              onClick={handleStartGame}
              variant="primary"
              size="large"
              className="start-game-btn"
            >
              🎮 开始游戏
            </Button>
            
            <Button
              onClick={handleSavePuzzle}
              variant="secondary"
              size="large"
              className="save-btn"
            >
              💾 保存拼图
            </Button>
            
            <Button
              onClick={handleSharePuzzle}
              variant="secondary"
              size="large"
              className="share-btn"
            >
              🔗 分享拼图
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  const getStepProgress = () => {
    const steps = ['upload', 'crop', 'settings', 'preview'];
    return steps.indexOf(currentStep) + 1;
  };

  if (showSavedPage) {
    return <SavedPuzzlesPage />;
  }
  return (
    <div className="puzzle-editor">
      <div className="editor-content">
        <div className="editor-progress-side">
          <div className="progress-indicator">
            <span className="progress-text">步骤 {getStepProgress()}/4</span>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${(getStepProgress() / 4) * 100}%` }}
              />
            </div>
          </div>
        </div>
        {currentStep === 'upload' && renderUploadStep()}
        {currentStep === 'crop' && renderCropStep()}
        {currentStep === 'settings' && renderSettingsStep()}
        {currentStep === 'preview' && renderPreviewStep()}
        {/* 预览模态框：设置页时用实时选择，否则用主配置 */}
        <PreviewModal
          isOpen={isPreviewModalOpen}
          onClose={() => setIsPreviewModalOpen(false)}
          imageSrc={customPuzzleConfig.croppedImageData || ''}
          imageTitle={`${customPuzzleConfig.name} - 拼图预览`}
          showPuzzleGrid={true}
          gridSize={
            currentStep === 'settings'
              ? (tempDifficulty === 'easy' ? '3x3' : tempDifficulty === 'medium' ? '4x4' : tempDifficulty === 'hard' ? '5x5' : '6x6')
              : (customPuzzleConfig.difficulty === 'easy' ? '3x3' : customPuzzleConfig.difficulty === 'medium' ? '4x4' : customPuzzleConfig.difficulty === 'hard' ? '5x5' : '6x6')
          }
        />
        {/* 分享代码弹窗 */}
        {shareDialogOpen && (
          <div style={{
            position: 'fixed', left: 0, top: 0, width: '100vw', height: '100vh',
            background: 'rgba(0,0,0,0.3)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <div style={{ background: '#fff', borderRadius: 8, padding: 32, minWidth: 320, boxShadow: '0 2px 16px #0002' }}>
              <h2>分享拼图代码</h2>
              <textarea
                style={{ width: '100%', height: 80, fontSize: 14, marginBottom: 16, resize: 'none' }}
                value={shareCode}
                readOnly
                onFocus={e => e.target.select()}
              />
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button onClick={handleCopyShareCode} style={{ padding: '6px 16px', fontSize: 14, cursor: 'pointer' }}>复制</button>
                <button onClick={() => setShareDialogOpen(false)} style={{ padding: '6px 16px', fontSize: 14, cursor: 'pointer' }}>关闭</button>
              </div>
              <div style={{ fontSize: 12, color: '#888', marginTop: 8 }}>
                分享代码包含图片、形状、难度、块数等信息，可粘贴给好友或在“导入拼图”中还原。
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
