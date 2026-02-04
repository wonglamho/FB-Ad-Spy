import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Eye, EyeOff, Trash2, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import {
  useMonitors,
  useCreateMonitor,
  useUpdateMonitor,
  useDeleteMonitor,
} from '../hooks/useMonitors';

export default function MonitorsPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPageId, setNewPageId] = useState('');
  const [newPageName, setNewPageName] = useState('');

  const { data, isLoading } = useMonitors();
  const createMonitor = useCreateMonitor();
  const updateMonitor = useUpdateMonitor();
  const deleteMonitor = useDeleteMonitor();

  const monitors = data?.data?.monitors || [];

  const handleAdd = () => {
    if (!newPageId.trim()) return;

    createMonitor.mutate(
      { pageId: newPageId.trim(), pageName: newPageName.trim() || undefined },
      {
        onSuccess: () => {
          setShowAddModal(false);
          setNewPageId('');
          setNewPageName('');
        },
      }
    );
  };

  const handleToggle = (id: string, isActive: boolean) => {
    updateMonitor.mutate({ id, data: { isActive: !isActive } });
  };

  const handleDelete = (id: string) => {
    if (confirm('确定要删除这个监控吗？')) {
      deleteMonitor.mutate(id);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">竞品监控</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          添加监控
        </button>
      </div>

      {isLoading && (
        <div className="text-center py-12 text-gray-500">加载中...</div>
      )}

      {!isLoading && monitors.length === 0 && (
        <div className="card p-12 text-center">
          <Eye className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            还没有监控任何主页
          </h3>
          <p className="text-gray-600 mb-4">
            添加竞品主页，自动追踪他们的广告动态
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary"
          >
            添加第一个监控
          </button>
        </div>
      )}

      {monitors.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {monitors.map((monitor: any) => (
            <div key={monitor.id} className="card overflow-hidden">
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {monitor.pageName}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Page ID: {monitor.pageId}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      monitor.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {monitor.isActive ? '监控中' : '已暂停'}
                  </span>
                </div>

                {monitor.lastCheckedAt && (
                  <p className="text-xs text-gray-400">
                    上次检查: {format(new Date(monitor.lastCheckedAt), 'yyyy-MM-dd HH:mm')}
                  </p>
                )}
              </div>

              <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                <Link
                  to={`/monitors/${monitor.id}`}
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1"
                >
                  查看广告
                  <ExternalLink size={14} />
                </Link>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggle(monitor.id, monitor.isActive)}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                    title={monitor.isActive ? '暂停监控' : '恢复监控'}
                  >
                    {monitor.isActive ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(monitor.id)}
                    className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100"
                    title="删除监控"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">添加监控</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Facebook Page ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newPageId}
                  onChange={(e) => setNewPageId(e.target.value)}
                  className="input"
                  placeholder="如: 123456789"
                />
                <p className="text-xs text-gray-500 mt-1">
                  可以在 Facebook 主页的"关于"页面找到 Page ID
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  主页名称（可选）
                </label>
                <input
                  type="text"
                  value={newPageName}
                  onChange={(e) => setNewPageName(e.target.value)}
                  className="input"
                  placeholder="如: Nike"
                />
                <p className="text-xs text-gray-500 mt-1">
                  留空会自动从 Facebook 获取
                </p>
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
                disabled={!newPageId.trim() || createMonitor.isPending}
                className="btn btn-primary flex-1"
              >
                {createMonitor.isPending ? '添加中...' : '添加'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
