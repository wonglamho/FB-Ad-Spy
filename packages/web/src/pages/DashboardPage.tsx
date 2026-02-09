import { Link } from 'react-router-dom';
import { Search, Eye, Bookmark, FolderOpen } from 'lucide-react';
import { useMonitors } from '../hooks/useMonitors';
import { useCollections, useSavedAds } from '../hooks/useCollections';
import { useAuthStore } from '../stores/authStore';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { data: monitorsData } = useMonitors();
  const { data: collectionsData } = useCollections();
  const { data: savedAdsData } = useSavedAds();

  const monitors = monitorsData?.data?.monitors || [];
  const collections = collectionsData?.data?.collections || [];
  const savedAds = savedAdsData?.data?.savedAds || [];

  const stats = [
    {
      label: '监控中的主页',
      value: monitors.filter((m: any) => m.isActive).length,
      icon: Eye,
      color: 'bg-blue-500',
      link: '/monitors',
    },
    {
      label: '收藏夹',
      value: collections.length,
      icon: FolderOpen,
      color: 'bg-purple-500',
      link: '/collections',
    },
    {
      label: '已保存广告',
      value: savedAds.length,
      icon: Bookmark,
      color: 'bg-green-500',
      link: '/saved',
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          欢迎回来，{user?.name}
        </h1>
        <p className="text-gray-600 mt-1">
          这是你的广告监控仪表板
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            to={stat.link}
            className="card p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-4">
              <div
                className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}
              >
                <stat.icon className="text-white" size={24} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-600">{stat.label}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="card p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">快速操作</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            to="/search"
            className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 hover:border-primary-500 hover:bg-primary-50 transition-colors"
          >
            <Search className="text-primary-600" size={24} />
            <div>
              <p className="font-medium text-gray-900">搜索广告</p>
              <p className="text-sm text-gray-600">
                按关键词或 Page ID 搜索广告
              </p>
            </div>
          </Link>
          <Link
            to="/monitors"
            className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 hover:border-primary-500 hover:bg-primary-50 transition-colors"
          >
            <Eye className="text-primary-600" size={24} />
            <div>
              <p className="font-medium text-gray-900">添加监控</p>
              <p className="text-sm text-gray-600">
                追踪竞品主页的广告动态
              </p>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Monitors */}
      {monitors.length > 0 && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">最近监控</h2>
            <Link
              to="/monitors"
              className="text-primary-600 hover:text-primary-700 text-sm"
            >
              查看全部
            </Link>
          </div>
          <div className="space-y-3">
            {monitors.slice(0, 5).map((monitor: any) => (
              <Link
                key={monitor.id}
                to={`/monitors/${monitor.id}`}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50"
              >
                <div>
                  <p className="font-medium text-gray-900">{monitor.pageName}</p>
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
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
