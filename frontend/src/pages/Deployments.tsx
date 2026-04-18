import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { DeploymentRow } from '../components/deployments/DeploymentRow';
import { Skeleton } from '../components/ui/Skeleton';
import { CoolifyDeployment } from '../types';

export function Deployments() {
  const { data, isLoading } = useQuery<CoolifyDeployment[]>({
    queryKey: ['deployments'],
    queryFn: () => api.get('/deployments?limit=50').then(r => Array.isArray(r.data) ? r.data : r.data?.data || []),
    refetchInterval: 30000,
  });

  return (
    <div className="p-6 max-w-5xl space-y-4">
      <h1 className="text-xl font-semibold tracking-tight">Deployments</h1>
      {isLoading ? (
        <div className="space-y-2">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12" />)}</div>
      ) : data?.length ? (
        <div className="border border-[rgba(255,255,255,0.08)] rounded-[8px] divide-y divide-[rgba(255,255,255,0.04)]">
          {data.map(d => <DeploymentRow key={d.uuid} dep={d} />)}
        </div>
      ) : (
        <p className="text-sm text-gray-600">No deployments yet.</p>
      )}
    </div>
  );
}
