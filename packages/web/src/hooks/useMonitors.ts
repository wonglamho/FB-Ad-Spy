import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { monitorsApi } from '../services/api';
import toast from 'react-hot-toast';

export function useMonitors() {
  return useQuery({
    queryKey: ['monitors'],
    queryFn: () => monitorsApi.getAll(),
  });
}

export function useMonitor(id: string) {
  return useQuery({
    queryKey: ['monitor', id],
    queryFn: () => monitorsApi.getOne(id),
    enabled: !!id,
  });
}

export function useCreateMonitor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ pageId, pageName }: { pageId: string; pageName?: string }) =>
      monitorsApi.create(pageId, pageName),
    onSuccess: () => {
      toast.success('Monitor created successfully');
      queryClient.invalidateQueries({ queryKey: ['monitors'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create monitor');
    },
  });
}

export function useUpdateMonitor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { isActive?: boolean; pageName?: string } }) =>
      monitorsApi.update(id, data),
    onSuccess: () => {
      toast.success('Monitor updated');
      queryClient.invalidateQueries({ queryKey: ['monitors'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update monitor');
    },
  });
}

export function useDeleteMonitor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => monitorsApi.delete(id),
    onSuccess: () => {
      toast.success('Monitor deleted');
      queryClient.invalidateQueries({ queryKey: ['monitors'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete monitor');
    },
  });
}
