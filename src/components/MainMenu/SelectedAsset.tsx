import React from 'react';
import { Asset } from '../../types';

interface SelectedAssetProps {
  asset: Asset;
}

export const SelectedAsset: React.FC<SelectedAssetProps> = ({ asset }) => {
  return (
    <>
      <h4 className="text-base font-medium text-slate-700">已选择素材</h4>
      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex gap-4">
          <div className="w-24 h-24 rounded-lg overflow-hidden bg-slate-200 flex items-center justify-center flex-shrink-0">
            <img 
              src={asset.thumbnail} 
              alt={asset.name}
              className="w-full h-full object-contain rounded-lg"
              onError={(e) => {
                // 如果图片加载失败，显示占位符
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const placeholder = target.nextElementSibling as HTMLElement;
                if (placeholder) placeholder.style.display = 'flex';
              }}
            />
            <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-xs text-slate-500 text-center p-2 leading-tight" style={{ display: 'none' }}>
              <span>{asset.name}</span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-slate-600 mb-1 truncate">
              <span className="font-medium">名称:</span> {asset.name}
            </p>
            <p className="text-sm text-slate-600 mb-1">
              <span className="font-medium">分类:</span> {asset.category}
            </p>
            <p className="text-sm text-slate-600 mb-1">
              <span className="font-medium">尺寸:</span> {asset.width} × {asset.height}
            </p>
            <p className="text-sm text-slate-600 truncate">
              <span className="font-medium">标签:</span> {asset.tags.join(', ')}
            </p>
          </div>
        </div>
      </div>
    </>
  );
};
