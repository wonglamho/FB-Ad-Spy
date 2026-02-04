import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adsApi, savedAdsApi } from '../services/api';
import toast from 'react-hot-toast';
import type { AdSearchParams, FacebookAd } from '@fb-ad-spy/shared';

export function useSearchAds() {
  return useMutation({
    mutationFn: (params: AdSearchParams) => adsApi.search(params),
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Search failed');
    },
  });
}

export function usePageAds(pageId: string, countries?: string[]) {
  return useQuery({
    queryKey: ['pageAds', pageId, countries],
    queryFn: () => adsApi.getByPage(pageId, countries),
    enabled: !!pageId,
  });
}

export function useSearchHistory() {
  return useQuery({
    queryKey: ['searchHistory'],
    queryFn: () => adsApi.getHistory(),
  });
}

export function useSaveAd() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { adData: FacebookAd; collectionId?: string; notes?: string; tags?: string[] }) =>
      savedAdsApi.save(data),
    onSuccess: () => {
      toast.success('Ad saved successfully');
      queryClient.invalidateQueries({ queryKey: ['savedAds'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to save ad');
    },
  });
}

export function useCheckSaved(adArchiveId: string) {
  return useQuery({
    queryKey: ['savedCheck', adArchiveId],
    queryFn: () => savedAdsApi.check(adArchiveId),
    enabled: !!adArchiveId,
  });
}
