import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useCollection } from '../hooks/useCollections';
import AdCard from '../components/AdCard';

export default function CollectionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading } = useCollection(id!);

  const collection = data?.data?.collection;
  const savedAds = collection?.savedAds || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={32} className="animate-spin text-primary-600" />
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">收藏夹不存在</p>
        <Link to="/collections" className="text-primary-600 hover:underline mt-2 inline-block">
          返回收藏夹列表
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link
        to="/collections"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft size={20} />
        返回收藏夹列表
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{collection.name}</h1>
        {collection.description && (
          <p className="text-gray-600 mt-1">{collection.description}</p>
        )}
      </div>

      {savedAds.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-gray-500">这个收藏夹还没有广告</p>
          <Link to="/search" className="text-primary-600 hover:underline mt-2 inline-block">
            去搜索广告
          </Link>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-600 mb-4">
            共 {savedAds.length} 条广告
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {savedAds.map((saved: any) => (
              <div key={saved.id} className="relative">
                <AdCard ad={saved.adData} />
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
