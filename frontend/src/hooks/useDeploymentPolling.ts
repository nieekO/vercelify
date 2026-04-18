import { useState, useEffect } from 'react';
import api from '../services/api';
import { CoolifyDeployment } from '../types';

export function useDeploymentPolling(appUuid: string | undefined, active: boolean) {
  const [deployments, setDeployments] = useState<CoolifyDeployment[]>([]);

  useEffect(() => {
    if (!appUuid || !active) return;
    let running = true;

    const poll = async () => {
      while (running) {
        try {
          const res = await api.get(`/deployments?app=${appUuid}&limit=5`);
          setDeployments(Array.isArray(res.data) ? res.data : res.data?.data || []);
        } catch { /* ignore */ }
        await new Promise(r => setTimeout(r, 3000));
      }
    };

    poll();
    return () => { running = false; };
  }, [appUuid, active]);

  return deployments;
}
