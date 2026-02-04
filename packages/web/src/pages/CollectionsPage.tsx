import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, FolderOpen, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { useCollections, useCreateCollection, useDeleteCollection } from '../hooks/useCollections';

export default function CollectionsPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');

  const { data, isLoading } = useCollections();
  const createCollection = useCreateCollection();
  const deleteCollection = useDeleteCollection();

  const collections = data?.data?.collections || [];

  const handleAdd = () => {
    if (!newName.trim()) return;

    createCollection.mutate(
      { name: newName.trim(), description: newDescription.trim() || undefined },
      {
        onSuccess: () => {
          setShowAddModal(false);
          setNewName('');
          setNewDescription('');
        },
      }
    );
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm('确定要删除这个收藏夹吗？收藏夹中的广告不会被删除。')) {
      deleteCollection.mutate(id);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">收藏夹</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          新建收藏夹
        </button>
      </div>

      {isLoading && (
        <div className="text-center py-12 text-gray-500">加载中...</div>
      )}

      {!isLoading && collections.length === 0 && (
        <div className="card p-12 text-center">
          <FolderOpen className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            还没有收藏夹
          </h3>
          <p className="text-gray-600 mb-4">
            创建收藏夹来整理你保存的广告
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary"
          >
            创建第一个收藏夹
          </button>
        </div>
      )}

      {collections.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {collections.map((collection: any) => (
            <Link
              key={collection.id}
              to={`/collections/${collection.id}`}
              className="card p-6 hover:shadow-md transition-shadow group"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                    <FolderOpen className="text-primary-600" size={20} />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {collection.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {collection._count?.savedAds || 0} 条广告
                    </p>
                  </div>
                </div>
                <button
                  onClick={(e) => handleDelete(collection.id, e)}
                  className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="删除收藏夹"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              {collection.description && (
                <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                  {collection.description}
                </p>
              )}

              <p className="text-xs text-gray-400 mt-3">
                创建于 {format(new Date(collection.createdAt), 'yyyy-MM-dd')}
              </p>
            </Link>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">新建收藏夹</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="input"
                  placeholder="如: 电商广告灵感"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  描述（可选）
                </label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="input"
                  rows={3}
                  placeholder="添加描述..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="btn btn-secondary flex-1"
              >
                取消
              </button>
              <button
                onClick={handleAdd}
                disabled={!newName.trim() || createCollection.isPending}
                className="btn btn-primary flex-1"
              >
                {createCollection.isPending ? '创建中...' : '创建'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
