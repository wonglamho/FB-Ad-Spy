import { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { useSearchAds } from '../hooks/useAds';
import AdCard from '../components/AdCard';
import SearchFilters from '../components/SearchFilters';
import type { FacebookAd } from '@fb-ad-spy/shared';

const COUNTRIES = [
  { value: 'ALL', label: '全部国家' },
  { value: 'US', label: '美国' },
  { value: 'GB', label: '英国' },
  { value: 'CA', label: '加拿大' },
  { value: 'AU', label: '澳大利亚' },
  { value: 'DE', label: '德国' },
  { value: 'FR', label: '法国' },
  { value: 'JP', label: '日本' },
  { value: 'CN', label: '中国' },
  { value: 'HK', label: '香港' },
  { value: 'TW', label: '台湾' },
  { value: 'SG', label: '新加坡' },
];

export default function SearchPage() {
  const [searchTerms, setSearchTerms] = useState('');
  const [pageIds, setPageIds] = useState('');
  const [countries, setCountries] = useState<string[]>(['ALL']);
  const [filters, setFilters] = useState({
    adType: 'ALL',
    adActiveStatus: 'ALL',
    publisherPlatforms: [] as string[],
    mediaType: 'ALL',
    adDeliveryDateMin: '',
    adDeliveryDateMax: '',
  });
  const [results, setResults] = useState<FacebookAd[]>([]);

  const searchAds = useSearchAds();

  const handleSearch = () => {
    const params: any = {
      adReachedCountries: countries,
      adType: filters.adType,
      adActiveStatus: filters.adActiveStatus,
    };

    if (searchTerms.trim()) {
      params.searchTerms = searchTerms.trim();
    } else if (!pageIds.trim()) {
      // 关键词和 Page ID 都为空时，用空格触发广泛搜索
      params.searchTerms = ' ';
    }

    if (pageIds.trim()) {
      params.searchPageIds = pageIds.split(',').map((id) => id.trim());
    }

    if (filters.publisherPlatforms.length > 0) {
      params.publisherPlatforms = filters.publisherPlatforms;
    }

    if (filters.mediaType !== 'ALL') {
      params.mediaType = filters.mediaType;
    }

    if (filters.adDeliveryDateMin) {
      params.adDeliveryDateMin = filters.adDeliveryDateMin;
    }

    if (filters.adDeliveryDateMax) {
      params.adDeliveryDateMax = filters.adDeliveryDateMax;
    }

    searchAds.mutate(params, {
      onSuccess: (data) => {
        setResults(data.data.ads || []);
      },
    });
  };

  const handleCountryToggle = (country: string) => {
    if (country === 'ALL') {
      setCountries(['ALL']);
    } else {
      const newCountries = countries.filter((c) => c !== 'ALL');
      if (newCountries.includes(country)) {
        const updated = newCountries.filter((c) => c !== country);
        setCountries(updated.length > 0 ? updated : ['ALL']);
      } else {
        setCountries([...newCountries, country]);
      }
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">搜索广告</h1>

      {/* Search Form */}
      <div className="card p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              关键词搜索
            </label>
            <input
              type="text"
              value={searchTerms}
              onChange={(e) => setSearchTerms(e.target.value)}
              className="input"
              placeholder="输入关键词，如: skincare, fitness..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Page ID（多个用逗号分隔）
            </label>
            <input
              type="text"
              value={pageIds}
              onChange={(e) => setPageIds(e.target.value)}
              className="input"
              placeholder="如: 123456789, 987654321"
            />
          </div>
        </div>

        {/* Countries */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            投放国家/地区
          </label>
          <div className="flex flex-wrap gap-2">
            {COUNTRIES.map((country) => (
              <button
                key={country.value}
                onClick={() => handleCountryToggle(country.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  countries.includes(country.value)
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {country.label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleSearch}
          disabled={searchAds.isPending}
          className="btn btn-primary flex items-center gap-2"
        >
          {searchAds.isPending ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <Search size={20} />
          )}
          搜索
        </button>
      </div>

      {/* Filters */}
      <SearchFilters filters={filters} onChange={setFilters} />

      {/* Results */}
      <div className="mt-6">
        {searchAds.isPending && (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={32} className="animate-spin text-primary-600" />
          </div>
        )}

        {!searchAds.isPending && results.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            {searchAds.isSuccess
              ? '没有找到匹配的广告'
              : '输入关键词或 Page ID 开始搜索'}
          </div>
        )}

        {results.length > 0 && (
          <>
            <p className="text-sm text-gray-600 mb-4">
              找到 {results.length} 条广告
            </p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {results.map((ad) => (
                <AdCard key={ad.id} ad={ad} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
