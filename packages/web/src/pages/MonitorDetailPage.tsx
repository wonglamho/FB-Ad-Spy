import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useMonitor } from '../hooks/useMonitors';
import AdCard from '../components/AdCard';

export default function MonitorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading } = useMonitor(id!);

  const monitor = data?.data?.monitor;
  const ads = data?.data?.ads || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={32} className="animate-spin text-primary-600" />
      </div>
    );
  }

  if (!monitor) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">监控不存在</p>
        <Link to="/monitors" className="text-primary-600 hover:underline mt-2 inline-block">
          返回监控列表
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link
        to="/monitors"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft size={20} />
        返回监控列表
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{monitor.pageName}</h1>
          <p className="text-gray-600">Page ID: {monitor.pageId}</p>
        </div>
        <span
          className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
            monitor.isActive
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          {monitor.isActive ? '监控中' : '已暂停'}
        </span>
      </div>

      {ads.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-gray-500">该主页暂无广告数据</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-600 mb-4">
            共 {ads.length} 条广告
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {ads.map((ad: any) => (
              <AdCard key={ad.id} ad={ad} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
