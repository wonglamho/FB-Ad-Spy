import { useState } from 'react';
import { Bookmark, Filter } from 'lucide-react';
import { useSavedAds, useTags } from '../hooks/useCollections';
import AdCard from '../components/AdCard';

export default function SavedAdsPage() {
  const [selectedTag, setSelectedTag] = useState<string>('');

  const { data: savedAdsData, isLoading } = useSavedAds(
    selectedTag ? { tag: selectedTag } : undefined
  );
  const { data: tagsData } = useTags();

  const savedAds = savedAdsData?.data?.savedAds || [];
  const tags = tagsData?.data?.tags || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">已保存的广告</h1>
      </div>

      {/* Tag Filter */}
      {tags.length > 0 && (
        <div className="card p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Filter size={16} className="text-gray-500" />
            <span className="text-sm font-medium text-gray-700">按标签筛选</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedTag('')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                !selectedTag
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              全部
            </button>
            {tags.map((tag: string) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  selectedTag === tag
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {isLoading && (
        <div className="text-center py-12 text-gray-500">加载中...</div>
      )}

      {!isLoading && savedAds.length === 0 && (
        <div className="card p-12 text-center">
          <Bookmark className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {selectedTag ? '没有匹配的广告' : '还没有保存任何广告'}
          </h3>
          <p className="text-gray-600">
            {selectedTag
              ? '尝试选择其他标签或清除筛选'
              : '在搜索结果中点击书签图标保存广告'}
          </p>
        </div>
      )}

      {savedAds.length > 0 && (
        <>
          <p className="text-sm text-gray-600 mb-4">
            共 {savedAds.length} 条广告
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {savedAds.map((saved: any) => (
              <div key={saved.id} className="relative">
                <AdCard ad={saved.adData} />
                {saved.collection && (
                  <div className="mt-2 text-sm text-gray-500">
                    收藏夹: {saved.collection.name}
                  </div>
                )}
                {saved.notes && (
                  <div className="mt-2 p-3 bg-yellow-50 rounded-lg text-sm text-yellow-800">
                    <strong>备注：</strong> {saved.notes}
                  </div>
                )}
                {saved.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {saved.tags.map((tag: string) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
