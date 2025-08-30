import React, { useState, useEffect } from 'react';
import { Asset } from '../../types';
import { AssetCard } from '../common/AssetCard';
import { Button } from '../common/Button';
import './AssetLibrary.css';

interface AssetLibraryProps {
  onAssetSelect: (asset: Asset) => void;
  onAssetUpload?: (file: File) => Promise<void>;
  showUpload?: boolean;
}

// 内置素材数据 - 使用项目中现有的素材
const builtinAssets: Asset[] = [
  // 图标类
  {
    id: 'tauri_logo',
    name: 'Tauri Logo',
    category: '图标',
    tags: ['logo', 'tauri', '框架'],
    filePath: '/tauri.svg',
    thumbnail: '/tauri.svg',
    width: 400,
    height: 400,
    fileSize: 5000,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 'vite_logo',
    name: 'Vite Logo',
    category: '图标',
    tags: ['logo', 'vite', '构建工具'],
    filePath: '/vite.svg',
    thumbnail: '/vite.svg',
    width: 400,
    height: 400,
    fileSize: 5000,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 'react_logo',
    name: 'React Logo',
    category: '图标',
    tags: ['logo', 'react', '前端框架'],
    filePath: '/react.svg',
    thumbnail: '/react.svg',
    width: 400,
    height: 400,
    fileSize: 5000,
    createdAt: new Date('2024-01-01'),
  },
  
  // 自然风光类
  {
    id: 'landscape1',
    name: '山景风光',
    category: '自然风光',
    tags: ['山景', '自然', '风光', '天空'],
    filePath: '/images/nature/landscape1.svg',
    thumbnail: '/images/nature/landscape1.svg',
    width: 400,
    height: 400,
    fileSize: 8000,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 'landscape2',
    name: '日落海景',
    category: '自然风光',
    tags: ['日落', '海景', '夕阳', '水面'],
    filePath: '/images/nature/landscape2.svg',
    thumbnail: '/images/nature/landscape2.svg',
    width: 400,
    height: 400,
    fileSize: 7500,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 'landscape3',
    name: '森林风光',
    category: '自然风光',
    tags: ['森林', '绿色', '树木', '自然'],
    filePath: '/images/nature/landscape3.svg',
    thumbnail: '/images/nature/landscape3.svg',
    width: 400,
    height: 400,
    fileSize: 6000,
    createdAt: new Date('2024-01-01'),
  },
  
  // 动物类
  {
    id: 'cat1',
    name: '可爱小猫',
    category: '动物',
    tags: ['猫', '宠物', '可爱', '动物'],
    filePath: '/images/animals/cat.svg',
    thumbnail: '/images/animals/cat.svg',
    width: 400,
    height: 400,
    fileSize: 5500,
    createdAt: new Date('2024-01-01'),
  },
  
  // 建筑类
  {
    id: 'castle1',
    name: '古典建筑',
    category: '建筑',
    tags: ['城堡', '建筑', '古典', '历史'],
    filePath: '/images/buildings/castle.svg',
    thumbnail: '/images/buildings/castle.svg',
    width: 400,
    height: 400,
    fileSize: 6500,
    createdAt: new Date('2024-01-01'),
  },
  
  // 动漫类
  {
    id: 'anime1',
    name: '动漫角色',
    category: '动漫',
    tags: ['动漫', '角色', '卡通', '二次元'],
    filePath: '/images/anime/character.svg',
    thumbnail: '/images/anime/character.svg',
    width: 400,
    height: 400,
    fileSize: 7000,
    createdAt: new Date('2024-01-01'),
  },
];

export const AssetLibrary: React.FC<AssetLibraryProps> = ({
  onAssetSelect,
  onAssetUpload,
  showUpload = true,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [customAssets, setCustomAssets] = useState<Asset[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const categories = [
    { id: 'all', name: '全部' },
    { id: '图标', name: '图标' },
    { id: '自然风光', name: '自然风光' },
    { id: '动物', name: '动物' },
    { id: '建筑', name: '建筑' },
    { id: '动漫', name: '动漫' },
    { id: '自定义', name: '自定义' },
  ];

  const allAssets = [...builtinAssets, ...customAssets];

  const filteredAssets = allAssets.filter(asset => {
    const matchesCategory = selectedCategory === 'all' || asset.category === selectedCategory;
    const matchesSearch = searchTerm === '' || 
      asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !onAssetUpload) return;

    setIsUploading(true);
    try {
      await onAssetUpload(file);
      
      // 添加到自定义素材列表
      const newAsset: Asset = {
        id: `custom_${Date.now()}`,
        name: file.name.split('.')[0],
        category: '自定义',
        tags: [],
        filePath: file.name,
        thumbnail: file.name,
        width: 0, // 实际应用中需要读取图片尺寸
        height: 0,
        fileSize: file.size,
        createdAt: new Date(),
      };
      
      setCustomAssets(prev => [...prev, newAsset]);
    } catch (error) {
      console.error('上传失败:', error);
    } finally {
      setIsUploading(false);
      // 重置文件输入
      event.target.value = '';
    }
  };

  return (
    <div className="asset-library">
      <div className="library-header">
        <h3 className="m-0 text-gray-800 text-xl font-bold">素材库</h3>
        
        {showUpload && onAssetUpload && (
          <div className="upload-section">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
              id="asset-upload"
              disabled={isUploading}
            />
            <Button
              onClick={() => document.getElementById('asset-upload')?.click()}
              variant="primary"
              size="small"
              disabled={isUploading}
            >
              {isUploading ? '上传中...' : '上传素材'}
            </Button>
          </div>
        )}
      </div>

      {/* 搜索和筛选 */}
      <div className="library-filters">
        <div className="search-box">
          <input
            type="text"
            placeholder="搜索素材..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="category-tabs">
          {categories.map(category => (
            <button
              key={category.id}
              className={`tab ${selectedCategory === category.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category.id)}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* 素材网格 */}
      <div className="asset-grid">
        {filteredAssets.map(asset => (
          <AssetCard
            key={asset.id}
            asset={asset}
            onSelect={onAssetSelect}
            onDelete={asset.category === '自定义' ? (assetId) => {
              setCustomAssets(prev => prev.filter(a => a.id !== assetId));
            } : undefined}
          />
        ))}
        
        {filteredAssets.length === 0 && (
          <div className="no-assets">
            <p>没有找到匹配的素材</p>
            <p>尝试调整搜索条件或上传新的素材</p>
          </div>
        )}
      </div>
    </div>
  );
};