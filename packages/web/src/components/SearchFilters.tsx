import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface SearchFiltersProps {
  filters: {
    adType: string;
    adActiveStatus: string;
    publisherPlatforms: string[];
    mediaType: string;
    adDeliveryDateMin: string;
    adDeliveryDateMax: string;
  };
  onChange: (filters: any) => void;
}

const AD_TYPES = [
  { value: 'ALL', label: '全部类型' },
  { value: 'POLITICAL_AND_ISSUE_ADS', label: '政治/议题广告' },
  { value: 'HOUSING_ADS', label: '房产广告' },
  { value: 'EMPLOYMENT_ADS', label: '招聘广告' },
  { value: 'FINANCIAL_PRODUCTS_AND_SERVICES_ADS', label: '金融广告' },
];

const STATUS_OPTIONS = [
  { value: 'ALL', label: '全部状态' },
  { value: 'ACTIVE', label: '投放中' },
  { value: 'INACTIVE', label: '已停止' },
];

const PLATFORMS = [
  { value: 'FACEBOOK', label: 'Facebook' },
  { value: 'INSTAGRAM', label: 'Instagram' },
  { value: 'MESSENGER', label: 'Messenger' },
  { value: 'WHATSAPP', label: 'WhatsApp' },
  { value: 'THREADS', label: 'Threads' },
];

const MEDIA_TYPES = [
  { value: 'ALL', label: '全部媒体' },
  { value: 'IMAGE', label: '图片' },
  { value: 'VIDEO', label: '视频' },
  { value: 'MEME', label: 'Meme' },
];

export default function SearchFilters({ filters, onChange }: SearchFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handlePlatformToggle = (platform: string) => {
    const current = filters.publisherPlatforms;
    const updated = current.includes(platform)
      ? current.filter((p) => p !== platform)
      : [...current, platform];
    onChange({ ...filters, publisherPlatforms: updated });
  };

  return (
    <div className="card p-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full"
      >
        <span className="font-medium">高级筛选</span>
        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>

      {isExpanded && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Ad Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              广告类型
            </label>
            <select
              value={filters.adType}
              onChange={(e) => onChange({ ...filters, adType: e.target.value })}
              className="input"
            >
              {AD_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              投放状态
            </label>
            <select
              value={filters.adActiveStatus}
              onChange={(e) =>
                onChange({ ...filters, adActiveStatus: e.target.value })
              }
              className="input"
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>

          {/* Media Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              媒体类型
            </label>
            <select
              value={filters.mediaType}
              onChange={(e) => onChange({ ...filters, mediaType: e.target.value })}
              className="input"
            >
              {MEDIA_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              开始日期
            </label>
            <input
              type="date"
              value={filters.adDeliveryDateMin}
              onChange={(e) =>
                onChange({ ...filters, adDeliveryDateMin: e.target.value })
              }
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              结束日期
            </label>
            <input
              type="date"
              value={filters.adDeliveryDateMax}
              onChange={(e) =>
                onChange({ ...filters, adDeliveryDateMax: e.target.value })
              }
              className="input"
            />
          </div>

          {/* Platforms */}
          <div className="md:col-span-2 lg:col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              投放平台
            </label>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map((platform) => (
                <button
                  key={platform.value}
                  onClick={() => handlePlatformToggle(platform.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    filters.publisherPlatforms.includes(platform.value)
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {platform.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
