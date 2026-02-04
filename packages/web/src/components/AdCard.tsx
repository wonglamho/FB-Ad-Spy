import { useState } from 'react';
import {
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  Calendar,
  Globe,
  Play,
} from 'lucide-react';
import { format } from 'date-fns';
import { useSaveAd, useCheckSaved } from '../hooks/useAds';
import { useCollections } from '../hooks/useCollections';
import type { FacebookAd } from '@fb-ad-spy/shared';
import clsx from 'clsx';

interface AdCardProps {
  ad: FacebookAd;
  onSave?: () => void;
}

export default function AdCard({ ad, onSave }: AdCardProps) {
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState('');

  const { data: savedCheck } = useCheckSaved(ad.adArchiveId);
  const { data: collectionsData } = useCollections();
  const saveAd = useSaveAd();

  const isSaved = savedCheck?.data?.isSaved;
  const collections = collectionsData?.data?.collections || [];

  const handleSave = () => {
    saveAd.mutate(
      {
        adData: ad,
        collectionId: selectedCollection || undefined,
        notes: notes || undefined,
        tags: tags ? tags.split(',').map((t) => t.trim()) : undefined,
      },
      {
        onSuccess: () => {
          setShowSaveModal(false);
          setNotes('');
          setTags('');
          onSave?.();
        },
      }
    );
  };

  const platformColors: Record<string, string> = {
    FACEBOOK: 'bg-blue-100 text-blue-800',
    INSTAGRAM: 'bg-pink-100 text-pink-800',
    MESSENGER: 'bg-purple-100 text-purple-800',
    WHATSAPP: 'bg-green-100 text-green-800',
    THREADS: 'bg-gray-100 text-gray-800',
  };

  return (
    <>
      <div className="card overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="font-medium text-gray-900">{ad.pageName}</h3>
            <p className="text-sm text-gray-500">Page ID: {ad.pageId}</p>
          </div>
          <button
            onClick={() => !isSaved && setShowSaveModal(true)}
            disabled={isSaved}
            className={clsx(
              'p-2 rounded-lg transition-colors',
              isSaved
                ? 'text-primary-600 bg-primary-50'
                : 'text-gray-400 hover:text-primary-600 hover:bg-gray-100'
            )}
          >
            {isSaved ? <BookmarkCheck size={20} /> : <Bookmark size={20} />}
          </button>
        </div>

        {/* Ad Creative */}
        <div className="p-4">
          {/* Bodies */}
          {ad.adCreativeBodies.length > 0 && (
            <div className="mb-4">
              {ad.adCreativeBodies.map((body, i) => (
                <p key={i} className="text-gray-700 mb-2">
                  {body}
                </p>
              ))}
            </div>
          )}

          {/* Link Titles */}
          {ad.adCreativeLinkTitles.length > 0 && (
            <div className="mb-2">
              {ad.adCreativeLinkTitles.map((title, i) => (
                <p key={i} className="font-medium text-gray-900">
                  {title}
                </p>
              ))}
            </div>
          )}

          {/* Link Descriptions */}
          {ad.adCreativeLinkDescriptions.length > 0 && (
            <div className="mb-4">
              {ad.adCreativeLinkDescriptions.map((desc, i) => (
                <p key={i} className="text-sm text-gray-600">
                  {desc}
                </p>
              ))}
            </div>
          )}

          {/* Snapshot Link */}
          {ad.adSnapshotUrl && (
            <a
              href={ad.adSnapshotUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 text-sm"
            >
              <Play size={16} />
              查看广告素材
              <ExternalLink size={14} />
            </a>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
          <div className="flex flex-wrap gap-2 mb-2">
            {ad.publisherPlatforms.map((platform) => (
              <span
                key={platform}
                className={clsx(
                  'px-2 py-1 rounded text-xs font-medium',
                  platformColors[platform] || 'bg-gray-100 text-gray-800'
                )}
              >
                {platform}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Calendar size={14} />
              {format(new Date(ad.adDeliveryStartTime), 'yyyy-MM-dd')}
              {ad.adDeliveryStopTime && (
                <> - {format(new Date(ad.adDeliveryStopTime), 'yyyy-MM-dd')}</>
              )}
            </span>
            {ad.languages.length > 0 && (
              <span className="flex items-center gap-1">
                <Globe size={14} />
                {ad.languages.join(', ')}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">保存广告</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  收藏夹（可选）
                </label>
                <select
                  value={selectedCollection}
                  onChange={(e) => setSelectedCollection(e.target.value)}
                  className="input"
                >
                  <option value="">不添加到收藏夹</option>
                  {collections.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  备注（可选）
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="input"
                  rows={3}
                  placeholder="添加备注..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  标签（可选，用逗号分隔）
                </label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="input"
                  placeholder="例如: 电商, 视频广告, 高转化"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowSaveModal(false)}
                className="btn btn-secondary flex-1"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                disabled={saveAd.isPending}
                className="btn btn-primary flex-1"
              >
                {saveAd.isPending ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
