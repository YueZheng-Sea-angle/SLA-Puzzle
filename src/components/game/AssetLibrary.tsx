import React, { useState, useMemo, useCallback } from 'react';
import { Asset } from '../../types';
import { AssetCard } from '../common/AssetCard';
import { Button } from '../common/Button';
import { useAuth } from '../../contexts/AuthContext';
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

  // 火山旅梦系列
  {
    id: 'misty_memory_day',
    name: 'MistyMemory_Day',
    category: '火山旅梦',
    tags: ['火山旅梦', 'CG', '回顾'],
    filePath: '/images/SolongAdele/MistyMemory_Day.png',
    thumbnail: '/images/SolongAdele/MistyMemory_Day.png',
    width: 400,
    height: 400,
    fileSize: 150000,
    createdAt: new Date('2024-01-01'),
    isNew: true,
  },
  {
    id: 'misty_memory_night',
    name: 'MistyMemory_Night',
    category: '火山旅梦',
    tags: ['火山旅梦', 'CG', '回顾'],
    filePath: '/images/SolongAdele/MistyMemory_Night.png',
    thumbnail: '/images/SolongAdele/MistyMemory_Night.png',
    width: 400,
    height: 400,
    fileSize: 150000,
    createdAt: new Date('2024-01-01'),
    isNew: true,
  },
  {
    id: 'ill_miss_you',
    name: 'I\'llMissYou',
    category: '火山旅梦',
    tags: ['火山旅梦', 'CG', '回顾'],
    filePath: '/images/SolongAdele/I\'llMissYou.png',
    thumbnail: '/images/SolongAdele/I\'llMissYou.png',
    width: 400,
    height: 400,
    fileSize: 150000,
    createdAt: new Date('2024-01-01'),
    isNew: true,
  },
  {
    id: 'in_the_night',
    name: 'InTheNight',
    category: '火山旅梦',
    tags: ['火山旅梦', 'CG', '回顾'],
    filePath: '/images/SolongAdele/InTheNight.png',
    thumbnail: '/images/SolongAdele/InTheNight.png',
    width: 400,
    height: 400,
    fileSize: 150000,
    createdAt: new Date('2024-01-01'),
    isNew: true,
  },
  {
    id: 'sing_with_me',
    name: 'SingWithMe',
    category: '火山旅梦',
    tags: ['火山旅梦', 'CG', '回顾'],
    filePath: '/images/SolongAdele/SingWithMe.png',
    thumbnail: '/images/SolongAdele/SingWithMe.png',
    width: 400,
    height: 400,
    fileSize: 150000,
    createdAt: new Date('2024-01-01'),
    isNew: true,
  },
  {
    id: 'rain_rain_go_away',
    name: 'RainRainGoAway',
    category: '火山旅梦',
    tags: ['火山旅梦', 'CG', '回顾'],
    filePath: '/images/SolongAdele/RainRainGoAway.png',
    thumbnail: '/images/SolongAdele/RainRainGoAway.png',
    width: 400,
    height: 400,
    fileSize: 150000,
    createdAt: new Date('2024-01-01'),
    isNew: true,
  },
  {
    id: 'enjoy_summer',
    name: 'EnjoySummer',
    category: '火山旅梦',
    tags: ['火山旅梦', 'CG', '回顾'],
    filePath: '/images/SolongAdele/EnjoySummer.png',
    thumbnail: '/images/SolongAdele/EnjoySummer.png',
    width: 400,
    height: 400,
    fileSize: 150000,
    createdAt: new Date('2024-01-01'),
    isNew: true,
  },
  {
    id: 'last_not_last',
    name: 'LastNotLast',
    category: '火山旅梦',
    tags: ['火山旅梦', 'CG', '回顾'],
    filePath: '/images/SolongAdele/LastNotLast.png',
    thumbnail: '/images/SolongAdele/LastNotLast.png',
    width: 400,
    height: 400,
    fileSize: 150000,
    createdAt: new Date('2024-01-01'),
    isNew: true,
  },
  {
    id: 'so_long_adele',
    name: 'SoLongAdele',
    category: '火山旅梦',
    tags: ['火山旅梦', 'CG', '回顾'],
    filePath: '/images/SolongAdele/SoLongAdele.png',
    thumbnail: '/images/SolongAdele/SoLongAdele.png',
    width: 400,
    height: 400,
    fileSize: 150000,
    createdAt: new Date('2024-01-01'),
    isNew: true,
  },
  {
    id: 'dancing_in_the_lava',
    name: 'DancingInTheLava',
    category: '火山旅梦',
    tags: ['火山旅梦', 'CG', '回顾'],
    filePath: '/images/SolongAdele/DancingInTheLava.png',
    thumbnail: '/images/SolongAdele/DancingInTheLava.png',
    width: 400,
    height: 400,
    fileSize: 150000,
    createdAt: new Date('2024-01-01'),
    isNew: true,
  },

  // 自然风光类
  // 新增的自然风光PNG图片
  {
    id: 'aurora',
    name: '极光景象',
    category: '自然风光',
    tags: ['极光', '自然', '夜景', '冰雪'],
    filePath: '/images/nature/aurora.png',
    thumbnail: '/images/nature/aurora.png',
    width: 400,
    height: 400,
    fileSize: 114000,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 'scene1',
    name: '自然景观',
    category: '自然风光',
    tags: ['自然', '风景', '山水', '户外'],
    filePath: '/images/nature/scene1.png',
    thumbnail: '/images/nature/scene1.png',
    width: 400,
    height: 400,
    fileSize: 138000,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 'bit',
    name: '北理工',
    category: '自然风光',
    tags: ['大学', '校园', '教育', '建筑'],
    filePath: '/images/nature/BIT.jpg',
    thumbnail: '/images/nature/BIT.jpg',
    width: 400,
    height: 400,
    fileSize: 120000,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 'white_lake_snow',
    name: '北湖雪',
    category: '自然风光',
    tags: ['雪景', '湖泊', '冬季', '自然'],
    filePath: '/images/nature/WhiteLake_Snow.jpg',
    thumbnail: '/images/nature/WhiteLake_Snow.jpg',
    width: 400,
    height: 400,
    fileSize: 130000,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 'liangting',
    name: '北湖凉亭',
    category: '自然风光',
    tags: ['凉亭', '湖泊', '古典', '建筑'],
    filePath: '/images/nature/liangting.jpg',
    thumbnail: '/images/nature/liangting.jpg',
    width: 400,
    height: 400,
    fileSize: 110000,
    createdAt: new Date('2024-01-01'),
  },

  // 动物类
  // 新增的动物PNG图片
  {
    id: 'fox',
    name: '机敏狐狸',
    category: '动物',
    tags: ['狐狸', '野生动物', '红色', '动物'],
    filePath: '/images/animals/fox.png',
    thumbnail: '/images/animals/fox.png',
    width: 400,
    height: 400,
    fileSize: 143000,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 'rabbit',
    name: '可爱兔子',
    category: '动物',
    tags: ['兔子', '宠物', '可爱', '动物'],
    filePath: '/images/animals/rabbit.png',
    thumbnail: '/images/animals/rabbit.png',
    width: 400,
    height: 400,
    fileSize: 593600,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 'snowbao',
    name: '诡异雪豹',
    category: '动物',
    tags: ['雪豹', '野生动物', '神秘', '雪地'],
    filePath: '/images/animals/snowbao.jpg',
    thumbnail: '/images/animals/snowbao.jpg',
    width: 400,
    height: 400,
    fileSize: 150000,
    createdAt: new Date('2024-01-01'),
  },

  // 建筑类
  // 新增的建筑PNG图片
  {
    id: 'eiffel_tower',
    name: '埃菲尔铁塔',
    category: '建筑',
    tags: ['埃菲尔铁塔', '巴黎', '法国', '地标'],
    filePath: '/images/buildings/Eiffel tower.png',
    thumbnail: '/images/buildings/Eiffel tower.png',
    width: 400,
    height: 400,
    fileSize: 79600,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 'building1',
    name: '万神殿',
    category: '建筑',
    tags: ['建筑', '罗马', '古典', '历史'],
    filePath: '/images/buildings/build1.png',
    thumbnail: '/images/buildings/build1.png',
    width: 400,
    height: 400,
    fileSize: 214000,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 'shengbide_cathedral',
    name: '圣彼得大教堂',
    category: '建筑',
    tags: ['教堂', '宗教', '建筑', '艺术', '历史'],
    filePath: '/images/buildings/shengbidecathedral.jpg',
    thumbnail: '/images/buildings/shengbidecathedral.jpg',
    width: 400,
    height: 400,
    fileSize: 180000,
    createdAt: new Date('2024-01-01'),
  },

  // 动漫类
  // 新增的动漫PNG图片
  {
    id: 'blue_eyes',
    name: '青眼白龙',
    category: '动漫',
    tags: ['动漫', '角色', '青眼', '二次元'],
    filePath: '/images/anime/blueeyes.png',
    thumbnail: '/images/anime/blueeyes.png',
    width: 400,
    height: 400,
    fileSize: 2448000,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 'dimension',
    name: '次元吸引者',
    category: '动漫',
    tags: ['动漫', '角色', '次元', '二次元'],
    filePath: '/images/anime/dimension.png',
    thumbnail: '/images/anime/dimension.png',
    width: 400,
    height: 400,
    fileSize: 2143600,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 'yugioh',
    name: '闪刀启动 - 交闪',
    category: '动漫',
    tags: ['动漫', '闪刀姬', '卡牌', '二次元'],
    filePath: '/images/anime/yugioh.png',
    thumbnail: '/images/anime/yugioh.png',
    width: 400,
    height: 400,
    fileSize: 636500,
    createdAt: new Date('2024-01-01'),
  },

  // 测试画风
  {
    id: 'landscape1',
    name: '山景风光',
    category: '测试画风',
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
    category: '测试画风',
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
    category: '测试画风',
    tags: ['森林', '绿色', '树木', '自然'],
    filePath: '/images/nature/landscape3.svg',
    thumbnail: '/images/nature/landscape3.svg',
    width: 400,
    height: 400,
    fileSize: 6000,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 'cat1',
    name: '可爱小猫',
    category: '测试画风',
    tags: ['猫', '宠物', '可爱', '动物'],
    filePath: '/images/animals/cat.svg',
    thumbnail: '/images/animals/cat.svg',
    width: 400,
    height: 400,
    fileSize: 5500,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 'castle1',
    name: '古典建筑',
    category: '测试画风',
    tags: ['城堡', '建筑', '古典', '历史'],
    filePath: '/images/buildings/castle.svg',
    thumbnail: '/images/buildings/castle.svg',
    width: 400,
    height: 400,
    fileSize: 6500,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 'anime1',
    name: '动漫角色',
    category: '测试画风',
    tags: ['动漫', '角色', '卡通', '二次元'],
    filePath: '/images/anime/character.svg',
    thumbnail: '/images/anime/character.svg',
    width: 400,
    height: 400,
    fileSize: 7000,
    createdAt: new Date('2024-01-01'),
  },
];

// 商店拼图素材 - 默认显示但需要解锁
const shopPuzzleAssets: Asset[] = [
  {
    id: 'puzzle_image_1',
    name: '森林花园',
    category: '专属奖励',
    tags: ['拼图', '素材', '商店', '森林', '花园', '自然', '绿色'],
    filePath: '/images/test1.svg',
    thumbnail: '/images/test1.svg',
    width: 400,
    height: 400,
    fileSize: 8000,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 'puzzle_image_2',
    name: '黄昏日落',
    category: '专属奖励',
    tags: ['拼图', '素材', '商店', '日落', '黄昏', '太阳', '橙色'],
    filePath: '/images/test2.svg',
    thumbnail: '/images/test2.svg',
    width: 400,
    height: 400,
    fileSize: 9000,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 'puzzle_image_3',
    name: '玫瑰花园',
    category: '专属奖励',
    tags: ['拼图', '素材', '商店', '玫瑰', '花园', '红色', '浪漫'],
    filePath: '/images/test3.svg',
    thumbnail: '/images/test3.svg',
    width: 400,
    height: 400,
    fileSize: 10000,
    createdAt: new Date('2024-01-01'),
  },
];

export const AssetLibrary: React.FC<AssetLibraryProps> = ({
  onAssetSelect,
  onAssetUpload,
  showUpload = true,
}) => {
  const { authState } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [customAssets, setCustomAssets] = useState<Asset[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [visibleCount, setVisibleCount] = useState(20); // 初始显示20个

  const categories = [
    { id: 'all', name: '全部' },
    { id: '图标', name: '图标' },
    { id: '火山旅梦', name: '夏日旋律 ', isNew: true },
    { id: '自然风光', name: '自然风光' },
    { id: '动物', name: '动物' },
    { id: '建筑', name: '建筑' },
    { id: '动漫', name: '动漫' },
    { id: '专属奖励', name: '专属奖励' },
    { id: '测试画风', name: '测试画风' },
  ];

  // 获取用户购买的物品列表
  const userOwnedItems = authState.user?.ownedItems || [];

  // 检查拼图素材是否已解锁（完全参照头像框的检查机制）
  const isPuzzleAssetUnlocked = (assetId: string): boolean => {
    if (!authState.isAuthenticated || !authState.user) {
      return false;
    }
    
    const owned = userOwnedItems;
    
    // 完全参照Profile.tsx中的checkFrameOwnership函数
    // 检查原始ID
    if (owned.includes(assetId)) return true;
    
    // 检查带decoration_前缀的ID（因为商店将拼图素材映射为decoration类型）
    if (owned.includes(`decoration_${assetId}`)) return true;
    
    // 检查带puzzle_前缀的ID（兼容性检查）
    if (!assetId.startsWith('puzzle_') && owned.includes(`puzzle_${assetId}`)) return true;
    
    return false;
  };

  // 处理素材选择，只有解锁的素材才能被选择
  const handleAssetClick = (asset: Asset) => {
    // 检查是否是拼图素材且未解锁
    if (asset.category === '拼图素材' && !isPuzzleAssetUnlocked(asset.id)) {
      alert(`需要先在商店购买 "${asset.name}" 才能解锁使用！`);
      return;
    }

    // 调用父组件的选择回调
    onAssetSelect(asset);
  };

  // 合并所有资源
  const allAssets = [...builtinAssets, ...shopPuzzleAssets, ...customAssets]
    .filter((asset, index, self) =>
      index === self.findIndex(a => a.id === asset.id)
    );

  // 使用useMemo优化过滤逻辑
  const filteredAssets = useMemo(() => {
    return allAssets.filter(asset => {
      const matchesCategory = selectedCategory === 'all' || asset.category === selectedCategory;
      const matchesSearch = searchTerm === '' ||
        asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [allAssets, selectedCategory, searchTerm]);

  // 分批显示的资产
  const visibleAssets = useMemo(() => {
    return filteredAssets.slice(0, visibleCount);
  }, [filteredAssets, visibleCount]);

  // 加载更多函数
  const loadMore = useCallback(() => {
    setVisibleCount(prev => Math.min(prev + 20, filteredAssets.length));
  }, [filteredAssets.length]);

  // 重置可见数量当分类或搜索改变时
  React.useEffect(() => {
    setVisibleCount(20);
  }, [selectedCategory, searchTerm]);

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
        category: '测试画风',
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
        
        <div className="header-controls">
          <div className="search-container">
            <div className="search-box">
              <input
                type="text"
                placeholder="搜索素材..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              <span className="search-icon">🔍</span>
            </div>
          </div>
          
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
      </div>

      {/* 分类标签 */}
      <div className="category-tabs-container">
        <div className="category-tabs">
          {categories.map(category => (
            <button
              key={category.id}
              className={`tab ${selectedCategory === category.id ? 'active' : ''} ${category.isNew ? 'new-category' : ''}`}
              onClick={() => setSelectedCategory(category.id)}
            >
              {category.name}
              {category.isNew && <span className="new-badge">NEW</span>}
            </button>
          ))}
        </div>
      </div>

      {/* 素材网格 */}
      <div className="asset-grid">
        {visibleAssets.map(asset => {
          // 检查拼图素材是否已解锁
          const isPuzzleAsset = asset.category === '拼图素材';
          const isLocked = isPuzzleAsset && !isPuzzleAssetUnlocked(asset.id);

          return (
            <AssetCard
              key={asset.id}
              asset={asset}
              onSelect={handleAssetClick}
              onDelete={asset.category === '测试画风' ? (assetId) => {
                setCustomAssets(prev => prev.filter(a => a.id !== assetId));
              } : undefined}
              isLocked={isLocked}
              lockMessage={`需要先在商店购买 "${asset.name}" 才能解锁使用！`}
            />
          );
        })}

        {/* 加载更多按钮 */}
        {visibleCount < filteredAssets.length && (
          <div className="load-more-container">
            <button 
              className="load-more-button"
              onClick={loadMore}
            >
              加载更多 ({filteredAssets.length - visibleCount} 个剩余)
            </button>
          </div>
        )}

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
