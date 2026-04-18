import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { StatusDot } from '../components/ui/StatusDot';
import { Skeleton } from '../components/ui/Skeleton';
import { CoolifyServer } from '../types';

export function Servers() {
  const { data: servers, isLoading } = useQuery<CoolifyServer[]>({
    queryKey: ['servers'],
    queryFn: () => api.get('/servers').then(r => r.data),
    refetchInterval: 30000,
  });

  return (
    <div className="p-6 max-w-5xl space-y-4">
      <h1 className="text-xl font-semibold tracking-tight">Servers</h1>
      {isLoading ? (
        <div className="space-y-4">{[1,2].map(i => <Skeleton key={i} className="h-40" />)}</div>
      ) : (
        <div className="space-y-4">
          {servers?.map(server => (
            <div key={server.uuid} className="border border-[rgba(255,255,255,0.08)] rounded-[8px] p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <StatusDot status={server.is_reachable ? 'running' : 'stopped'} />
                  <div>
                    <p className="text-sm font-semibold">{server.name === 'localhost' ? 'infra-01' : server.name}</p>
                    <p className="text-xs text-gray-500">{server.ip} · {server.is_usable ? 'Usable' : 'Not usable'}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
                <div>
                  <span className="text-gray-600">UUID</span>
                  <p className="font-mono text-gray-400 truncate">{server.uuid}</p>
                </div>
                <div>
                  <span className="text-gray-600">Status</span>
                  <p className="text-gray-400">{server.is_reachable ? 'Reachable' : 'Unreachable'}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
