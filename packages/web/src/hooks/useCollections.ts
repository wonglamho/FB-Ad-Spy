import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collectionsApi, savedAdsApi } from '../services/api';
import toast from 'react-hot-toast';

export function useCollections() {
  return useQuery({
    queryKey: ['collections'],
    queryFn: () => collectionsApi.getAll(),
  });
}

export function useCollection(id: string) {
  return useQuery({
    queryKey: ['collection', id],
    queryFn: () => collectionsApi.getOne(id),
    enabled: !!id,
  });
}

export function useCreateCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ name, description }: { name: string; description?: string }) =>
      collectionsApi.create(name, description),
    onSuccess: () => {
      toast.success('Collection created');
      queryClient.invalidateQueries({ queryKey: ['collections'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create collection');
    },
  });
}

export function useDeleteCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => collectionsApi.delete(id),
    onSuccess: () => {
      toast.success('Collection deleted');
      queryClient.invalidateQueries({ queryKey: ['collections'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete collection');
    },
  });
}

export function useSavedAds(params?: { collectionId?: string; tag?: string }) {
  return useQuery({
    queryKey: ['savedAds', params],
    queryFn: () => savedAdsApi.getAll(params),
  });
}

export function useDeleteSavedAd() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => savedAdsApi.delete(id),
    onSuccess: () => {
      toast.success('Ad removed from saved');
      queryClient.invalidateQueries({ queryKey: ['savedAds'] });
      queryClient.invalidateQueries({ queryKey: ['collection'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to remove ad');
    },
  });
}

export function useTags() {
  return useQuery({
    queryKey: ['tags'],
    queryFn: () => savedAdsApi.getTags(),
  });
}
