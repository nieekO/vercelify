import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { VercelifyProject } from '../types';

export function useProjects() {
  return useQuery<VercelifyProject[]>({
    queryKey: ['projects'],
    queryFn: () => api.get('/projects').then(r => r.data),
    refetchInterval: 30000,
  });
}

export function useProject(id: string) {
  return useQuery<VercelifyProject>({
    queryKey: ['projects', id],
    queryFn: () => api.get(`/projects/${id}`).then(r => r.data),
    enabled: !!id,
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/projects/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  });
}
